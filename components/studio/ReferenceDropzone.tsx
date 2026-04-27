"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Image as ImageIcon, Plus, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { upload } from "@vercel/blob/client";
import { cn } from "@/lib/utils";

export interface UploadedRef {
  publicPath: string;
  fileName: string;
}

const MAX_BYTES = 100 * 1024 * 1024;

interface Props {
  values: UploadedRef[];
  onChange: (refs: UploadedRef[]) => void;
  onContinue?: () => void;
  max?: number;
}

const DEFAULT_MAX = 3;

export function ReferenceDropzone({
  values,
  onChange,
  onContinue,
  max = DEFAULT_MAX,
}: Props) {
  const [dragActive, setDragActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadOne = useCallback(async (file: File): Promise<UploadedRef | null> => {
    if (!file.type.startsWith("image/")) {
      toast.error(`${file.name}: not an image`);
      return null;
    }
    if (file.size > MAX_BYTES) {
      toast.error(`${file.name}: too large (max 100MB)`);
      return null;
    }
    try {
      const blob = await upload(`uploads/${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
        contentType: file.type,
      });
      return { publicPath: blob.url, fileName: file.name };
    } catch (err) {
      const directMsg = err instanceof Error ? err.message : "Direct upload failed";

      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? `Upload failed (${res.status})`);
        }
        const data = (await res.json()) as { publicPath: string; fileName: string };
        return { publicPath: data.publicPath, fileName: data.fileName };
      } catch (fallbackErr) {
        toast.error(
          `${file.name}: ${
            fallbackErr instanceof Error ? fallbackErr.message : directMsg
          }`
        );
        return null;
      }
    }
  }, []);

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const remaining = max - values.length;
      if (remaining <= 0) {
        toast.error(`Maximum ${max} reference photos.`);
        return;
      }
      const list = Array.from(files).slice(0, remaining);
      setBusy(true);
      try {
        const uploaded: UploadedRef[] = [];
        for (const f of list) {
          const ref = await uploadOne(f);
          if (ref) uploaded.push(ref);
        }
        if (uploaded.length > 0) onChange([...values, ...uploaded]);
      } finally {
        setBusy(false);
      }
    },
    [max, values, onChange, uploadOne]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const files = e.dataTransfer.files;
      if (files?.length) void addFiles(files);
    },
    [addFiles]
  );

  function removeAt(idx: number) {
    onChange(values.filter((_, i) => i !== idx));
  }

  if (values.length === 0) {
    return (
      <motion.label
        htmlFor="ref-upload"
        onDragEnter={() => setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onPaste={(e) => {
          if (e.clipboardData.files?.length) void addFiles(e.clipboardData.files);
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
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files?.length) void addFiles(e.target.files);
          }}
        />
        <motion.span
          animate={{ y: dragActive ? -4 : 0, scale: dragActive ? 1.05 : 1 }}
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
            {busy ? "Uploading…" : "Drop up to 3 photos of your face"}
          </p>
          <p className="text-sm text-paper-mute">
            Front-facing works best. Add 2–3 different angles for a stronger
            likeness lock.
          </p>
        </div>
      </motion.label>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <AnimatePresence>
          {values.map((ref, i) => (
            <motion.div
              key={ref.publicPath}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="group relative aspect-square overflow-hidden rounded-2xl border border-[var(--line-strong)] bg-ink-800"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ref.publicPath}
                alt={ref.fileName}
                className="h-full w-full object-cover"
              />
              <button
                onClick={() => removeAt(i)}
                className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-ink-900/80 text-paper opacity-0 transition group-hover:opacity-100"
                aria-label="Remove"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 px-2 py-1 text-[10px] text-paper-mute backdrop-blur-md bg-ink-900/40 truncate">
                {ref.fileName}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {values.length < max && (
          <motion.label
            htmlFor="ref-upload-add"
            layout
            onDragEnter={() => setDragActive(true)}
            onDragLeave={() => setDragActive(false)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            animate={{
              borderColor: dragActive
                ? "rgba(217,119,87,0.6)"
                : "rgba(245,241,232,0.16)",
            }}
            className={cn(
              "group relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed bg-ink-800/30 transition",
              busy && "pointer-events-none opacity-60"
            )}
          >
            <input
              id="ref-upload-add"
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) => {
                if (e.target.files?.length) void addFiles(e.target.files);
              }}
            />
            <span className="grid h-9 w-9 place-items-center rounded-full bg-ember/10 ring-1 ring-ember/30">
              <Plus className="h-4 w-4 text-ember" />
            </span>
            <span className="text-[11px] text-paper-mute">
              {busy ? "Uploading…" : "Add another"}
            </span>
          </motion.label>
        )}
      </div>

      <div className="flex flex-col items-center gap-3 pt-2">
        <p className="text-[12px] text-paper-mute">
          {values.length} of {max} · stronger likeness with more angles
        </p>
        {onContinue && (
          <button
            onClick={onContinue}
            className="inline-flex items-center gap-2 rounded-full bg-ember px-7 py-3.5 text-sm font-medium text-ink-900 transition hover:bg-ember-light"
          >
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
