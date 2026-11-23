import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/cookie";
import { queryOne } from "@/lib/db/mysql";
import {
  getPrivateMediaUrl,
  isValidBucket,
  saveLocalStorageFile,
  validateStorageFile,
} from "@/lib/storage/local";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Format upload tidak valid." }, { status: 400 });
  }

  const bucketRaw = String(formData.get("bucket") ?? "");
  const file = formData.get("file");

  if (!isValidBucket(bucketRaw)) {
    return NextResponse.json({ error: "Bucket penyimpanan tidak valid." }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
  }

  const validationError = validateStorageFile(bucketRaw, {
    type: file.type,
    size: file.size,
    name: file.name,
  });
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  // Determine authorized scope directory on server (never trust client-supplied scope)
  const member = await queryOne<{ couple_id: string }>(
    "SELECT couple_id FROM couple_members WHERE user_id = ? LIMIT 1",
    [user.id]
  );

  let scopeId: string;
  if (bucketRaw === "profile-photos") {
    scopeId = member?.couple_id ?? user.id;
  } else {
    if (!member?.couple_id) {
      return NextResponse.json(
        { error: "Selesaikan setup Couple Space terlebih dahulu sebelum mengunggah media." },
        { status: 403 }
      );
    }
    scopeId = member.couple_id;
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const savedPath = await saveLocalStorageFile(
      bucketRaw,
      scopeId,
      file.name,
      Buffer.from(arrayBuffer)
    );
    const mediaType: "photo" | "video" = file.type.startsWith("video/") ? "video" : "photo";
    const signedUrl = getPrivateMediaUrl(bucketRaw, savedPath);

    return NextResponse.json({
      path: savedPath,
      signedUrl,
      mediaType,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal menyimpan file." },
      { status: 500 }
    );
  }
}
