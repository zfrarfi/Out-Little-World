"use client";

import { useState } from "react";
import type { StorageBucketName } from "@/types/database";

export interface UploadResult {
  path: string;
  signedUrl: string | null;
  mediaType: "photo" | "video";
}

export function useStorageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function uploadFile(
    bucket: StorageBucketName,
    _ownerScopeId: string,
    file: File
  ): Promise<UploadResult | null> {
    setUploadError(null);
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("bucket", bucket);
      formData.append("file", file);

      const response = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as {
        error?: string;
        path?: string;
        signedUrl?: string | null;
        mediaType?: "photo" | "video";
      };

      if (!response.ok || !data.path) {
        setUploadError(data.error ?? "Upload gagal.");
        return null;
      }

      return {
        path: data.path,
        signedUrl: data.signedUrl ?? null,
        mediaType: data.mediaType ?? (file.type.startsWith("video/") ? "video" : "photo"),
      };
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Terjadi kesalahan saat upload.");
      return null;
    } finally {
      setIsUploading(false);
    }
  }

  return { uploadFile, isUploading, uploadError, setUploadError };
}
