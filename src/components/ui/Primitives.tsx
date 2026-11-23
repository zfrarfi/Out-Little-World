"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-gradient-to-r from-brand-rose to-brand-roseDark text-white shadow-romantic hover:brightness-105 active:scale-[0.98]",
    secondary:
      "bg-brand-pink/45 text-brand-dark hover:bg-brand-pink/70 active:scale-[0.98]",
    outline:
      "border border-brand-rose/50 bg-white/80 text-brand-dark hover:bg-brand-pink/25",
    ghost: "bg-transparent text-brand-brown hover:bg-brand-pink/25 hover:text-brand-dark",
    danger:
      "bg-rose-500 text-white hover:bg-rose-600 shadow-sm active:scale-[0.98]",
  };

  const sizes = {
    sm: "px-3.5 py-2 text-xs rounded-xl gap-1.5",
    md: "px-5 py-2.5 text-sm rounded-2xl gap-2",
    lg: "px-6 py-3 text-base rounded-2xl gap-2.5",
  };

  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-55 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("glass-card rounded-3xl p-5 sm:p-6", className)}>
      {children}
    </div>
  );
}

export function Input({
  label,
  error,
  hint,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wide text-brand-brown">
          {label}
        </label>
      )}
      <input
        className={cn(
          "w-full rounded-2xl border border-brand-rose/35 bg-white/90 px-4 py-2.5 text-sm text-brand-dark placeholder:text-brand-brown/50 outline-none transition focus:border-brand-roseDark focus:ring-2 focus:ring-brand-pink/60",
          error && "border-rose-400 focus:border-rose-500",
          className
        )}
        {...props}
      />
      {hint && !error && <p className="text-xs text-brand-brown/75">{hint}</p>}
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}

export function Textarea({
  label,
  error,
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wide text-brand-brown">
          {label}
        </label>
      )}
      <textarea
        className={cn(
          "w-full rounded-2xl border border-brand-rose/35 bg-white/90 px-4 py-3 text-sm text-brand-dark placeholder:text-brand-brown/50 outline-none transition focus:border-brand-roseDark focus:ring-2 focus:ring-brand-pink/60",
          error && "border-rose-400",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}

export function Select({
  label,
  children,
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wide text-brand-brown">
          {label}
        </label>
      )}
      <select
        className={cn(
          "w-full rounded-2xl border border-brand-rose/35 bg-white/90 px-4 py-2.5 text-sm text-brand-dark outline-none transition focus:border-brand-roseDark focus:ring-2 focus:ring-brand-pink/60",
          className
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

export function Badge({
  children,
  variant = "pink",
  className,
}: {
  children: React.ReactNode;
  variant?: "pink" | "rose" | "cream" | "emerald" | "amber";
  className?: string;
}) {
  const styles = {
    pink: "bg-brand-pink/45 text-brand-dark",
    rose: "bg-brand-rose/25 text-brand-roseDark",
    cream: "bg-brand-cream border border-brand-rose/30 text-brand-brown",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-800",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium",
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Avatar({
  src,
  name,
  size = "md",
  className,
}: {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const dims = {
    sm: "h-9 w-9 text-xs",
    md: "h-11 w-11 text-sm",
    lg: "h-16 w-16 text-lg",
    xl: "h-24 w-24 text-2xl",
  };
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?";

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full border-2 border-white bg-gradient-to-br from-brand-pink to-brand-rose shadow-soft flex items-center justify-center font-semibold text-white",
        dims[size],
        className
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-brand-dark/35 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl border border-brand-pink/40",
              maxWidth
            )}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-brand-dark">{title}</h3>
                {subtitle && <p className="mt-0.5 text-xs text-brand-brown">{subtitle}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-1.5 text-brand-brown hover:bg-brand-pink/30 transition"
                aria-label="Tutup modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Ya, Lanjutkan",
  loading = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-md">
      <p className="text-sm text-brand-brown leading-relaxed">{message}</p>
      <div className="mt-6 flex items-center justify-end gap-3">
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          Batal
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="glass-card flex flex-col items-center justify-center rounded-3xl px-6 py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-pink/40 text-brand-roseDark">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-brand-dark">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm text-brand-brown leading-relaxed">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-2xl bg-brand-pink/35", className)}
    />
  );
}

export function FileUploadField({
  label,
  accept,
  previewUrl,
  isUploading,
  onFileSelected,
  helperText,
}: {
  label: string;
  accept: string;
  previewUrl?: string | null;
  isUploading?: boolean;
  onFileSelected: (file: File) => void;
  helperText?: string;
}) {
  return (
    <div className="space-y-2">
      <span className="block text-xs font-semibold uppercase tracking-wide text-brand-brown">
        {label}
      </span>
      <label className="group flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed border-brand-rose/45 bg-white/75 p-3.5 transition hover:border-brand-roseDark hover:bg-brand-pink/15">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt={label}
            className="h-14 w-14 rounded-xl object-cover shadow-sm"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand-pink/35 text-brand-roseDark">
            {isUploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Upload className="h-5 w-5" />
            )}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-brand-dark">
            {isUploading ? "Mengunggah file..." : previewUrl ? "Ganti file" : "Pilih file untuk diunggah"}
          </p>
          {helperText && <p className="text-xs text-brand-brown/75">{helperText}</p>}
        </div>
        <input
          type="file"
          accept={accept}
          disabled={isUploading}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileSelected(file);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}
