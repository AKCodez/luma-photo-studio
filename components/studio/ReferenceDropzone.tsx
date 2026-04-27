"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface UploadedRef {
  publicPath: string;
  fileName: string;
}

interface Props {
  value: UploadedRef | null;
  onChange: (ref: UploadedRef | null) => void;
}

export function ReferenceDropzone({ value, onChange }: Props) {
  const [dragActive, setDragActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please drop an image file.");
        return;
      }
      setBusy(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? "Upload failed");
        }
        const data = (await res.json()) as { publicPath: string; fileName: string };
        onChange({ publicPath: data.publicPath, fileName: data.fileName });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setBusy(false);
      }
    },
    [onChange]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void upload(file);
    },
    [upload]
  );

  if (value) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="group relative mx-auto aspect-square w-44 overflow-hidden rounded-3xl border border-[var(--line-strong)] bg-ink-800"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={value.publicPath}
          alt={value.fileName}
          className="h-full w-full object-cover"
        />
        <button
          onClick={() => onChange(null)}
          className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-ink-900/80 text-paper opacity-0 transition group-hover:opacity-100"
          aria-label="Remove reference"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 px-3 py-2 text-[11px] text-paper-mute backdrop-blur-md bg-ink-900/40 truncate">
          {value.fileName}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.label
      htmlFor="ref-upload"
      onDragEnter={() => setDragActive(true)}
      onDragLeave={() => setDragActive(false)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      onPaste={(e) => {
        const file = e.clipboardData.files?.[0];
        if (file) void upload(file);
      }}
      animate={{
        scale: dragActive ? 1.02 : 1,
        borderColor: dragActive
          ? "rgba(217,119,87,0.6)"
          : "rgba(245,241,232,0.16)",
      }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "group relative mx-auto flex aspect-square w-full max-w-[420px] cursor-pointer flex-col items-center justify-center gap-5 rounded-3xl border border-dashed bg-ink-800/40 px-6 text-center transition",
        busy && "pointer-events-none opacity-60"
      )}
      tabIndex={0}
    >
      <input
        ref={inputRef}
        id="ref-upload"
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
        }}
      />

      <motion.span
        animate={{
          y: dragActive ? -4 : 0,
          scale: dragActive ? 1.05 : 1,
        }}
        className="grid h-14 w-14 place-items-center rounded-full bg-ember/10 ring-1 ring-ember/30"
      >
        {busy ? (
          <ImageIcon className="h-5 w-5 text-ember animate-pulse" />
        ) : (
          <Upload className="h-5 w-5 text-ember" />
        )}
      </motion.span>

      <div className="space-y-2">
        <p className="font-display text-2xl text-paper">
          {busy ? "Uploading…" : "Drop a photo of your face"}
        </p>
        <p className="text-sm text-paper-mute">
          Or click to choose, paste from clipboard.<br />
          One clear, well-lit shot works best.
        </p>
      </div>
    </motion.label>
  );
}
