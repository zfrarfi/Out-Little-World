"use client";

import { useState } from "react";
import type { StorageBucketName } from "@/types/database";

export interface UploadResult {
  path: string;
  signedUrl: string | null;
  mediaType: "photo" | "video";
}

/**
 * Compresses large static photos (> 1.8 MB) on the client via Canvas so high-res
 * smartphone photos upload rapidly and stay well within Vercel's serverless limit.
 */
async function compressImageIfNeeded(file: File): Promise<File> {
  if (
    !file.type.startsWith("image/") ||
    file.type === "image/gif" ||
    file.size <= 1.8 * 1024 * 1024
  ) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const maxDim = 1920;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file);
            return;
          }
          const baseName = file.name.replace(/\.[^.]+$/, "");
          resolve(new File([blob], `${baseName}.jpg`, { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.84
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };
    img.src = objectUrl;
  });
}

export function useStorageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function uploadFile(
    bucket: StorageBucketName,
    _ownerScopeId: string,
    rawFile: File
  ): Promise<UploadResult | null> {
    setUploadError(null);
    setIsUploading(true);
    try {
      const file = await compressImageIfNeeded(rawFile);
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
