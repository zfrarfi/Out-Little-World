import fs from "fs/promises";
import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/cookie";
import { queryOne, queryRows } from "@/lib/db/mysql";
import {
  getMimeFromPath,
  isValidBucket,
  resolveSafeStoragePath,
} from "@/lib/storage/local";

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const bucketRaw = searchParams.get("bucket") ?? "";
  const objectPath = searchParams.get("path") ?? "";

  if (!isValidBucket(bucketRaw) || !objectPath) {
    return NextResponse.json({ error: "Parameter media tidak valid." }, { status: 400 });
  }

  const firstFolder = objectPath.replace(/\\/g, "/").replace(/^\/+/, "").split("/")[0] ?? "";
  if (!firstFolder) {
    return NextResponse.json({ error: "Path tidak valid." }, { status: 400 });
  }

  // Strict authorization check (equivalent to Supabase Storage RLS)
  const member = await queryOne<{ couple_id: string }>(
    "SELECT couple_id FROM couple_members WHERE user_id = ? LIMIT 1",
    [user.id]
  );

  let authorized = false;
  if (bucketRaw === "profile-photos") {
    if (firstFolder === user.id || (member && firstFolder === member.couple_id)) {
      authorized = true;
    } else if (member) {
      const coupleMembers = await queryRows<{ user_id: string }>(
        "SELECT user_id FROM couple_members WHERE couple_id = ?",
        [member.couple_id]
      );
      authorized = coupleMembers.some((m) => m.user_id === firstFolder);
    }
  } else if (member && firstFolder === member.couple_id) {
    authorized = true;
  }

  if (!authorized) {
    return NextResponse.json({ error: "Akses media ditolak." }, { status: 403 });
  }

  const fullPath = resolveSafeStoragePath(bucketRaw, objectPath);
  if (!fullPath) {
    return NextResponse.json({ error: "Path file tidak diizinkan." }, { status: 400 });
  }

  try {
    const fileBuf = await fs.readFile(fullPath);
    const mime = getMimeFromPath(objectPath);
    const rangeHeader = request.headers.get("range");

    if (rangeHeader) {
      const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
      if (match) {
        const start = parseInt(match[1], 10);
        const end = match[2] ? Math.min(parseInt(match[2], 10), fileBuf.length - 1) : fileBuf.length - 1;
        const chunk = fileBuf.subarray(start, end + 1);
        return new NextResponse(new Uint8Array(chunk), {
          status: 206,
          headers: {
            "Content-Type": mime,
            "Content-Range": `bytes ${start}-${end}/${fileBuf.length}`,
            "Accept-Ranges": "bytes",
            "Content-Length": String(chunk.length),
            "Cache-Control": "private, max-age=300",
          },
        });
      }
    }

    return new NextResponse(new Uint8Array(fileBuf), {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Content-Length": String(fileBuf.length),
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch {
    return NextResponse.json({ error: "File media tidak ditemukan." }, { status: 404 });
  }
}
