import { NextResponse, type NextRequest } from "next/server";
import { destroyCurrentSession, getSessionUser } from "@/lib/auth/cookie";
import { execSql } from "@/lib/db/mysql";

export async function DELETE(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { confirmationText?: string } | null;
  if (body?.confirmationText?.trim().toUpperCase() !== "HAPUS AKUN SAYA") {
    return NextResponse.json(
      { error: 'Ketik persis "HAPUS AKUN SAYA" untuk mengonfirmasi penghapusan permanen.' },
      { status: 400 }
    );
  }

  // Deleting from `users` cascades cleanly to `user_sessions`, `profiles`, `couple_members`, etc.
  await execSql("DELETE FROM users WHERE id = ?", [user.id]);
  await destroyCurrentSession();

  return NextResponse.json({
    deleted: true,
    note: "Akun, sesi login, dan data profil Anda telah dihapus permanen dari database MySQL.",
  });
}
