"use client";

import { useMemo, useState } from "react";
import { Award, HelpCircle, Play, Plus, Shuffle, Trash2, Trophy } from "lucide-react";
import {
  createQuizQuestionAction,
  deleteQuizQuestionAction,
  submitQuizSessionAction,
} from "@/services/quiz.actions";
import { useToast } from "@/components/ui/ToastProvider";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  Select,
  Textarea,
} from "@/components/ui/Primitives";
import { formatDateTimeIndo } from "@/lib/utils/relationship";
import type {
  QuizCategory,
  QuizMode,
  QuizQuestionRow,
  QuizQuestionType,
  QuizSessionRow,
} from "@/types/database";

export function QuizClient({
  currentUserId,
  userNickname,
  partnerNickname,
  initialQuestions,
  initialSessions,
}: {
  currentUserId: string;
  userNickname: string;
  partnerNickname: string;
  initialQuestions: QuizQuestionRow[];
  initialSessions: QuizSessionRow[];
}) {
  const { showToast } = useToast();
  const [questions, setQuestions] = useState<QuizQuestionRow[]>(initialQuestions);
  const [sessions, setSessions] = useState<QuizSessionRow[]>(initialSessions);

  // Quiz Gameplay state
  const [activeMode, setActiveMode] = useState<QuizMode | null>(null);
  const [playDeck, setPlayDeck] = useState<QuizQuestionRow[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [lastResult, setLastResult] = useState<QuizSessionRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Create question modal
  const [addOpen, setAddOpen] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState<QuizQuestionType>("multiple_choice");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [category, setCategory] = useState<QuizCategory>("about_us");

  const leaderboard = useMemo(() => {
    const map = new Map<string, { name: string; totalScore: number; games: number; avgCompat: number }>();
    for (const s of sessions) {
      const name = s.player_id === currentUserId ? userNickname : partnerNickname;
      const prev = map.get(s.player_id) ?? { name, totalScore: 0, games: 0, avgCompat: 0 };
      const games = prev.games + 1;
      const totalScore = prev.totalScore + s.score;
      const avgCompat = Number(
        ((prev.avgCompat * prev.games + Number(s.compatibility_percent)) / games).toFixed(1)
      );
      map.set(s.player_id, { name, totalScore, games, avgCompat });
    }
    return Array.from(map.values()).sort((a, b) => b.totalScore - a.totalScore);
  }, [sessions, currentUserId, userNickname, partnerNickname]);

  const overallCompatibility = useMemo(() => {
    if (sessions.length === 0) return null;
    const sum = sessions.reduce((acc, s) => acc + Number(s.compatibility_percent), 0);
    return Number((sum / sessions.length).toFixed(1));
  }, [sessions]);

  function startQuiz(mode: QuizMode) {
    let pool = [...questions];
    if (mode === "multiple_choice") {
      pool = pool.filter((q) => q.question_type === "multiple_choice");
    } else if (mode === "guess_answer") {
      pool = pool.filter((q) => q.question_type === "guess_answer");
    }
    if (pool.length === 0) {
      showToast({
        type: "info",
        title: "Belum ada soal untuk mode ini",
        description: "Tambahkan pertanyaan tentang dirimu atau pasangan terlebih dahulu!",
      });
      return;
    }
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    setPlayDeck(pool.slice(0, 10));
    setActiveMode(mode);
    setCurrentIdx(0);
    setAnswers({});
    setLastResult(null);
  }

  async function handleFinishQuiz() {
    if (!activeMode || playDeck.length === 0) return;
    setSubmitting(true);
    try {
      const res = await submitQuizSessionAction({
        mode: activeMode,
        questionIds: playDeck.map((q) => q.id),
        answers,
      });
      if (!res.success || !res.data) {
        showToast({ type: "error", title: "Gagal menyimpan skor", description: res.error });
        return;
      }
      setLastResult(res.data.session);
      setSessions((prev) => [res.data!.session, ...prev]);
      setActiveMode(null);
      showToast({
        type: "success",
        title: `Skor: ${res.data.session.score} (${res.data.session.compatibility_percent}% cocok!)`,
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateQuestion(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await createQuizQuestionAction({
        questionText,
        questionType,
        optionA: questionType === "multiple_choice" ? optionA : null,
        optionB: questionType === "multiple_choice" ? optionB : null,
        optionC: questionType === "multiple_choice" ? optionC : null,
        optionD: questionType === "multiple_choice" ? optionD : null,
        correctAnswer,
        category,
      });
      if (!res.success || !res.data) {
        showToast({ type: "error", title: "Gagal menambah soal", description: res.error });
        return;
      }
      setQuestions((prev) => [res.data!, ...prev]);
      setQuestionText("");
      setOptionA("");
      setOptionB("");
      setOptionC("");
      setOptionD("");
      setCorrectAnswer("");
      setAddOpen(false);
      showToast({ type: "success", title: "Pertanyaan kuis ditambahkan!" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteQuestion(id: string) {
    const res = await deleteQuizQuestionAction(id);
    if (res.success) {
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      showToast({ type: "info", title: "Pertanyaan dihapus" });
    }
  }

  const currentQuestion = playDeck[currentIdx];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Couple Quiz</h1>
          <p className="text-sm text-brand-brown">
            Buat pertanyaan tentang kalian, mainkan kuis acak, dan lihat statistik kecocokan!
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Buat Pertanyaan
        </Button>
      </div>

      {activeMode && currentQuestion && (
        <Card className="border-brand-roseDark/50 bg-white">
          <div className="flex items-center justify-between">
            <Badge variant="rose">
              Pertanyaan {currentIdx + 1} dari {playDeck.length}
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => setActiveMode(null)}>
              Keluar
            </Button>
          </div>
          <h2 className="mt-4 text-xl font-bold text-brand-dark">
            {currentQuestion.question_text}
          </h2>

          {currentQuestion.question_type === "multiple_choice" ? (
            <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {[
                currentQuestion.option_a,
                currentQuestion.option_b,
                currentQuestion.option_c,
                currentQuestion.option_d,
              ]
                .filter((opt): opt is string => Boolean(opt?.trim()))
                .map((opt) => {
                  const selected = answers[currentQuestion.id] === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() =>
                        setAnswers((prev) => ({ ...prev, [currentQuestion.id]: opt }))
                      }
                      className={`rounded-2xl border p-4 text-left text-sm font-medium transition ${
                        selected
                          ? "border-brand-roseDark bg-brand-pink/35 text-brand-dark shadow-soft"
                          : "border-brand-pink/40 bg-brand-cream/50 hover:bg-brand-pink/15"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
            </div>
          ) : (
            <div className="mt-5">
              <Input
                label="Tebakan Jawabanmu"
                placeholder="Ketik jawaban yang menurutmu benar..."
                value={answers[currentQuestion.id] ?? ""}
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, [currentQuestion.id]: e.target.value }))
                }
              />
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="ghost"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((i) => i - 1)}
            >
              Sebelumnya
            </Button>
            {currentIdx < playDeck.length - 1 ? (
              <Button onClick={() => setCurrentIdx((i) => i + 1)}>Lanjut</Button>
            ) : (
              <Button loading={submitting} onClick={handleFinishQuiz}>
                Selesaikan &amp; Hitung Skor
              </Button>
            )}
          </div>
        </Card>
      )}

      {lastResult && !activeMode && (
        <Card className="bg-gradient-to-r from-brand-pink/35 to-brand-cream text-center">
          <Award className="mx-auto h-10 w-10 text-brand-roseDark" />
          <h2 className="mt-2 text-2xl font-bold text-brand-dark">
            Skor Kamu: {lastResult.score} Poin!
          </h2>
          <p className="mt-1 text-sm text-brand-brown">
            Benar {lastResult.correct_answers} dari {lastResult.total_questions} soal &bull;
            Kecocokan {lastResult.compatibility_percent}%
          </p>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-5">
          <Card>
            <h2 className="text-base font-bold text-brand-dark">Mulai Permainan</h2>
            <p className="mt-1 text-xs text-brand-brown">
              Total bank soal pasangan kalian saat ini: <strong>{questions.length} pertanyaan</strong>
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Button onClick={() => startQuiz("random")} className="w-full">
                <Shuffle className="h-4 w-4" /> Kuis Acak
              </Button>
              <Button
                variant="secondary"
                onClick={() => startQuiz("multiple_choice")}
                className="w-full"
              >
                <Play className="h-4 w-4" /> Pilihan Ganda
              </Button>
              <Button
                variant="outline"
                onClick={() => startQuiz("guess_answer")}
                className="w-full"
              >
                <HelpCircle className="h-4 w-4" /> Tebak Jawaban
              </Button>
            </div>
          </Card>

          <Card>
            <h3 className="text-base font-bold text-brand-dark mb-3">Daftar Pertanyaan Kalian</h3>
            {questions.length === 0 ? (
              <EmptyState
                icon={<HelpCircle className="h-6 w-6" />}
                title="Bank soal masih kosong"
                description="Buat pertanyaan tentang makanan favorit, kebiasaan unik, atau kenangan kalian agar pasanganmu bisa menebaknya!"
                action={
                  <Button size="sm" onClick={() => setAddOpen(true)}>
                    <Plus className="h-4 w-4" /> Tambah Soal Pertama
                  </Button>
                }
              />
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {questions.map((q) => (
                  <div
                    key={q.id}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-brand-pink/30 bg-white/85 p-3.5"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-1.5 mb-1">
                        <Badge variant="pink">
                          {q.question_type === "multiple_choice" ? "Pilihan Ganda" : "Tebak Jawaban"}
                        </Badge>
                        <Badge variant="cream">{q.category}</Badge>
                      </div>
                      <p className="text-sm font-semibold text-brand-dark">{q.question_text}</p>
                      {q.created_by === currentUserId && (
                        <p className="mt-1 text-[11px] text-brand-brown">
                          Kunci jawabanmu: <strong>{q.correct_answer}</strong>
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="rounded-lg p-1.5 text-brand-brown hover:bg-rose-100 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-5 space-y-5">
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                <h3 className="text-base font-bold text-brand-dark">Leaderboard &amp; Kecocokan</h3>
              </div>
              {overallCompatibility !== null && (
                <Badge variant="emerald">{overallCompatibility}% Cocok</Badge>
              )}
            </div>

            <div className="mt-4 space-y-2.5">
              {leaderboard.length === 0 ? (
                <p className="text-xs text-brand-brown">Belum ada skor permainan.</p>
              ) : (
                leaderboard.map((row, idx) => (
                  <div
                    key={row.name}
                    className="flex items-center justify-between rounded-2xl bg-brand-cream px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-roseDark text-xs font-bold text-white">
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-brand-dark">{row.name}</p>
                        <p className="text-[11px] text-brand-brown">
                          {row.games} game &bull; Rata-rata {row.avgCompat}%
                        </p>
                      </div>
                    </div>
                    <span className="text-base font-bold text-brand-roseDark">
                      {row.totalScore} pts
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-bold text-brand-dark mb-3">Riwayat Permainan</h3>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {sessions.length === 0 ? (
                <p className="text-xs text-brand-brown">Belum ada riwayat sesi kuis.</p>
              ) : (
                sessions.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-2xl border border-brand-pink/25 bg-white/85 px-3.5 py-2.5 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-brand-dark">
                        {s.player_id === currentUserId ? userNickname : partnerNickname} &bull;{" "}
                        {s.correct_answers}/{s.total_questions} benar
                      </p>
                      <p className="text-[10px] text-brand-brown">
                        {formatDateTimeIndo(s.completed_at)}
                      </p>
                    </div>
                    <Badge variant="pink">{s.compatibility_percent}%</Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Buat Pertanyaan Couple Quiz">
        <form onSubmit={handleCreateQuestion} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Tipe Pertanyaan"
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value as QuizQuestionType)}
            >
              <option value="multiple_choice">Pilihan Ganda</option>
              <option value="guess_answer">Tebak Jawaban Singkat</option>
            </Select>
            <Select
              label="Kategori"
              value={category}
              onChange={(e) => setCategory(e.target.value as QuizCategory)}
            >
              <option value="about_us">Tentang Kita</option>
              <option value="favorites">Favorit</option>
              <option value="memories">Kenangan</option>
              <option value="habits">Kebiasaan</option>
              <option value="future">Masa Depan</option>
            </Select>
          </div>

          <Textarea
            label="Pertanyaan *"
            required
            rows={2}
            placeholder="Misal: Apa minuman yang selalu aku pesan saat kita nongkrong?"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
          />

          {questionType === "multiple_choice" && (
            <div className="grid gap-2.5 sm:grid-cols-2">
              <Input
                label="Pilihan A *"
                required
                value={optionA}
                onChange={(e) => setOptionA(e.target.value)}
              />
              <Input
                label="Pilihan B *"
                required
                value={optionB}
                onChange={(e) => setOptionB(e.target.value)}
              />
              <Input
                label="Pilihan C"
                value={optionC}
                onChange={(e) => setOptionC(e.target.value)}
              />
              <Input
                label="Pilihan D"
                value={optionD}
                onChange={(e) => setOptionD(e.target.value)}
              />
            </div>
          )}

          <Input
            label="Jawaban yang Benar *"
            required
            placeholder={
              questionType === "multiple_choice"
                ? "Tulis persis sama dengan salah satu pilihan di atas"
                : "Ketik kunci jawaban singkat"
            }
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
          />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={submitting}>
              Simpan Soal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
