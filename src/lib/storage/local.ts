import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { getStorageDriver, isVercelRuntime } from "@/lib/db/env";
import { execSql, queryOne } from "@/lib/db/mysql";
import type { StorageBucketName } from "@/types/database";

export const VALID_BUCKETS: StorageBucketName[] = [
  "profile-photos",
  "memories",
  "chat-images",
  "timeline-images",
  "bucket-list-images",
];

export const BUCKET_LIMITS: Record<
  StorageBucketName,
  { maxBytes: number; allowedMimeTypes: string[]; label: string }
> = {
  "profile-photos": {
    maxBytes: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    label: "Foto profil (maks 5 MB)",
  },
  memories: {
    maxBytes: 50 * 1024 * 1024,
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ],
    label: "Foto/Video kenangan (maks 50 MB)",
  },
  "chat-images": {
    maxBytes: 10 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    label: "Gambar chat (maks 10 MB)",
  },
  "timeline-images": {
    maxBytes: 10 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    label: "Foto timeline (maks 10 MB)",
  },
  "bucket-list-images": {
    maxBytes: 10 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    label: "Foto pencapaian bucket list (maks 10 MB)",
  },
};

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

export function isValidBucket(bucket: string): bucket is StorageBucketName {
  return VALID_BUCKETS.includes(bucket as StorageBucketName);
}

export function validateStorageFile(
  bucket: StorageBucketName,
  file: { type: string; size: number; name: string }
): string | null {
  const rule = BUCKET_LIMITS[bucket];
  if (!rule.allowedMimeTypes.includes(file.type)) {
    return `Format file tidak didukung untuk ${rule.label}.`;
  }
  const effectiveLimit = isVercelRuntime()
    ? Math.min(rule.maxBytes, 4 * 1024 * 1024)
    : rule.maxBytes;
  if (file.size > effectiveLimit) {
    const maxMb = Number((effectiveLimit / (1024 * 1024)).toFixed(1));
    return `Ukuran file terlalu besar. Maksimal ${maxMb} MB${
      isVercelRuntime() ? " pada mode Vercel serverless" : ""
    }.`;
  }
  return null;
}

export function getStorageRootDir(): string {
  return path.resolve(process.cwd(), "storage", "uploads");
}

export function resolveSafeStoragePath(
  bucket: StorageBucketName,
  objectPath: string
): string | null {
  const normalized = objectPath.replace(/\\/g, "/").replace(/^\/+/, "");
  if (normalized.includes("..") || normalized.includes("\0")) {
    return null;
  }
  const root = path.resolve(getStorageRootDir(), bucket);
  const full = path.resolve(root, normalized);
  if (!full.startsWith(root + path.sep)) {
    return null;
  }
  return full;
}

/**
 * Hybrid Private Media Saver:
 * - On Vercel / STORAGE_DRIVER=database -> stores directly into MySQL `media_files` (LONGBLOB)
 *   so media persists permanently across serverless cold starts and is accessible globally!
 * - On local XAMPP -> writes to private `storage/uploads/` directory.
 */
export async function saveLocalStorageFile(
  bucket: StorageBucketName,
  ownerScopeId: string,
  originalFileName: string,
  buffer: Buffer,
  options?: { uploadedBy?: string; mimeType?: string }
): Promise<string> {
  const extMatch = originalFileName.toLowerCase().match(/\.([a-z0-9]{2,5})$/);
  const ext = extMatch ? extMatch[1] : "bin";
  const safeScope = ownerScopeId.replace(/[^a-zA-Z0-9-]/g, "");
  const relativePath = `${safeScope}/${crypto.randomUUID()}.${ext}`;

  const driver = getStorageDriver();
  if (driver === "database" && options?.uploadedBy) {
    const mime = options.mimeType || getMimeFromPath(relativePath);
    await execSql(
      `INSERT INTO media_files (id, bucket, object_path, owner_scope_id, uploaded_by, mime_type, size_bytes, content)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        crypto.randomUUID(),
        bucket,
        relativePath,
        safeScope,
        options.uploadedBy,
        mime,
        buffer.length,
        buffer,
      ]
    );
    return relativePath;
  }

  const fullPath = resolveSafeStoragePath(bucket, relativePath);
  if (!fullPath) {
    throw new Error("Path penyimpanan tidak valid.");
  }
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, buffer);
  return relativePath;
}

/**
 * Hybrid Private Media Reader: checks MySQL `media_files` first (for Vercel/cloud),
 * then transparently falls back to local disk `storage/uploads/` (for XAMPP).
 */
export async function readPrivateStorageFile(
  bucket: StorageBucketName,
  objectPath: string
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  const normalized = objectPath.replace(/\\/g, "/").replace(/^\/+/, "");

  // 1. Check MySQL `media_files` table (Vercel / cloud mode)
  try {
    const dbRow = await queryOne<{ content: Buffer; mime_type: string }>(
      "SELECT content, mime_type FROM media_files WHERE bucket = ? AND object_path = ? LIMIT 1",
      [bucket, normalized]
    );
    if (dbRow?.content) {
      return {
        buffer: Buffer.isBuffer(dbRow.content) ? dbRow.content : Buffer.from(dbRow.content),
        mimeType: dbRow.mime_type || getMimeFromPath(normalized),
      };
    }
  } catch {
    // Fallback to disk if media_files lookup fails
  }

  // 2. Fallback to local disk (XAMPP local mode)
  const fullPath = resolveSafeStoragePath(bucket, normalized);
  if (!fullPath) return null;
  try {
    const buffer = await fs.readFile(fullPath);
    return { buffer, mimeType: getMimeFromPath(normalized) };
  } catch {
    return null;
  }
}

export async function deleteLocalStorageFile(
  bucket: StorageBucketName,
  objectPath: string | null | undefined
): Promise<void> {
  if (!objectPath) return;
  const normalized = objectPath.replace(/\\/g, "/").replace(/^\/+/, "");

  await execSql("DELETE FROM media_files WHERE bucket = ? AND object_path = ?", [
    bucket,
    normalized,
  ]).catch(() => null);

  const fullPath = resolveSafeStoragePath(bucket, normalized);
  if (!fullPath) return;
  try {
    await fs.unlink(fullPath);
  } catch {
    // ignore missing disk file
  }
}

export function getPrivateMediaUrl(
  bucket: StorageBucketName,
  objectPath: string | null | undefined
): string | null {
  if (!objectPath) return null;
  if (objectPath.startsWith("http://") || objectPath.startsWith("https://")) {
    return objectPath;
  }
  return `/api/storage/file?bucket=${encodeURIComponent(bucket)}&path=${encodeURIComponent(objectPath)}`;
}

export function getMimeFromPath(objectPath: string): string {
  const ext = path.extname(objectPath).toLowerCase().replace(".", "");
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}
