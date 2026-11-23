"use server";

import { revalidatePath } from "next/cache";
import { getAuthorizedActionContext } from "./action-context";
import { execSql, normalizeBool, queryOne, queryRows, withTransaction } from "@/lib/db/mysql";
import { generateUuid } from "@/lib/auth/crypto";
import { quizQuestionSchema } from "@/lib/utils/validators";
import { scoreQuizAttempt } from "@/lib/utils/relationship";
import type { ActionResult } from "@/types/domain";
import type { QuizMode, QuizQuestionRow, QuizSessionRow } from "@/types/database";

export async function createQuizQuestionAction(
  rawInput: unknown
): Promise<ActionResult<QuizQuestionRow>> {
  try {
    const parsed = quizQuestionSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Pertanyaan tidak valid." };
    }
    const ctx = await getAuthorizedActionContext();
    const id = generateUuid();
    await execSql(
      `INSERT INTO quiz_questions (id, couple_id, created_by, question_text, question_type, option_a, option_b, option_c, option_d, correct_answer, category)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        ctx.coupleId,
        ctx.userId,
        parsed.data.questionText,
        parsed.data.questionType,
        parsed.data.optionA,
        parsed.data.optionB,
        parsed.data.optionC,
        parsed.data.optionD,
        parsed.data.correctAnswer,
        parsed.data.category,
      ]
    );
    const created = await queryOne<QuizQuestionRow>("SELECT * FROM quiz_questions WHERE id = ?", [
      id,
    ]);
    revalidatePath("/quiz");
    return { success: true, data: { ...created!, is_active: normalizeBool(created!.is_active) } };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menambah pertanyaan." };
  }
}

export async function deleteQuizQuestionAction(questionId: string): Promise<ActionResult> {
  try {
    const ctx = await getAuthorizedActionContext();
    await execSql("DELETE FROM quiz_questions WHERE id = ? AND couple_id = ?", [
      questionId,
      ctx.coupleId,
    ]);
    revalidatePath("/quiz");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menghapus pertanyaan." };
  }
}

export async function submitQuizSessionAction(input: {
  mode: QuizMode;
  questionIds: string[];
  answers: Record<string, string>;
}): Promise<
  ActionResult<{
    session: QuizSessionRow;
    graded: Array<{ questionId: string; selectedAnswer: string; isCorrect: boolean }>;
  }>
> {
  try {
    if (!input.questionIds.length) {
      return { success: false, error: "Minimal 1 pertanyaan diperlukan untuk menyelesaikan kuis." };
    }
    const ctx = await getAuthorizedActionContext();
    const placeholders = input.questionIds.map(() => "?").join(",");
    const questions = await queryRows<{ id: string; correct_answer: string }>(
      `SELECT id, correct_answer FROM quiz_questions WHERE couple_id = ? AND id IN (${placeholders})`,
      [ctx.coupleId, ...input.questionIds]
    );

    if (questions.length === 0) {
      return { success: false, error: "Pertanyaan kuis tidak ditemukan." };
    }

    const result = scoreQuizAttempt(questions, input.answers);
    const sessionId = generateUuid();

    await withTransaction(async (conn) => {
      await conn.execute(
        `INSERT INTO quiz_sessions (id, couple_id, player_id, mode, total_questions, correct_answers, score, compatibility_percent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sessionId,
          ctx.coupleId,
          ctx.userId,
          input.mode,
          result.totalQuestions,
          result.correctCount,
          result.score,
          result.compatibilityPercent,
        ]
      );

      for (const g of result.graded) {
        await conn.execute(
          `INSERT INTO quiz_answers (id, session_id, couple_id, question_id, player_id, selected_answer, is_correct)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            generateUuid(),
            sessionId,
            ctx.coupleId,
            g.questionId,
            ctx.userId,
            g.selectedAnswer || "-",
            g.isCorrect ? 1 : 0,
          ]
        );
      }
    });

    const session = await queryOne<QuizSessionRow>("SELECT * FROM quiz_sessions WHERE id = ?", [
      sessionId,
    ]);
    revalidatePath("/quiz");
    return {
      success: true,
      data: {
        session: {
          ...session!,
          compatibility_percent: Number(session!.compatibility_percent),
        },
        graded: result.graded,
      },
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal mengirim jawaban kuis." };
  }
}
