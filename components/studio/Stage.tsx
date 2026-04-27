"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { Header } from "./Header";
import { ReferenceDropzone, type UploadedRef } from "./ReferenceDropzone";
import { ModePicker } from "./ModePicker";
import { AspectControl } from "./AspectControl";
import { PackGrid } from "./PackGrid";
import { SurprisePanel } from "./SurprisePanel";
import { CustomPanel } from "./CustomPanel";
import { ShootGrid } from "./ShootGrid";
import { GenerationStatus } from "./GenerationStatus";
import { EditModal } from "./EditModal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type {
  AspectRatio,
  Pack,
  ShootImage,
  ShootManifest,
  ShootMode,
} from "@/lib/types";

type Step =
  | "upload"
  | "mode"
  | "configure-pack"
  | "configure-surprise"
  | "configure-custom"
  | "generating"
  | "gallery";

const containerAnim = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
};

interface Props {
  initialManifest?: ShootManifest;
}

export function Stage({ initialManifest }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(initialManifest ? "gallery" : "upload");
  const [reference, setReference] = useState<UploadedRef | null>(
    initialManifest
      ? {
          publicPath: initialManifest.referenceUrl,
          fileName: initialManifest.referenceFileName,
        }
      : null
  );
  const [mode, setMode] = useState<ShootMode | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(
    initialManifest?.aspectRatio ?? "9:16"
  );
  const [manifest, setManifest] = useState<ShootManifest | null>(
    initialManifest ?? null
  );
  const [editing, setEditing] = useState<ShootImage | null>(null);

  const reset = useCallback(() => {
    setStep("upload");
    setReference(null);
    setMode(null);
    setManifest(null);
    setEditing(null);
    router.push("/");
  }, [router]);

  const handleUpload = useCallback((ref: UploadedRef | null) => {
    setReference(ref);
    if (ref) setStep("mode");
  }, []);

  const handleMode = useCallback((m: ShootMode) => {
    setMode(m);
    setStep(
      m === "pack"
        ? "configure-pack"
        : m === "surprise"
        ? "configure-surprise"
        : "configure-custom"
    );
  }, []);

  async function startShoot(opts: {
    scenes: string[];
    packId?: string;
    surpriseTheme?: string;
    aspect?: AspectRatio;
  }) {
    if (!reference) {
      toast.error("Upload a reference photo first.");
      return;
    }
    const aspect = opts.aspect ?? aspectRatio;
    let res: Response;
    try {
      res = await fetch("/api/shoots", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode,
          packId: opts.packId,
          surpriseTheme: opts.surpriseTheme,
          scenes: opts.scenes,
          aspectRatio: aspect,
          referenceUrl: reference.publicPath,
          referenceFileName: reference.fileName,
        }),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Network error");
      return;
    }
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      toast.error(data.error ?? "Failed to start shoot");
      return;
    }
    const data = (await res.json()) as { id: string; count: number };
    setStep("generating");
    await hydrateManifest(data.id);
    router.push(`/shoots/${data.id}`, { scroll: false });
    void fanOutGenerations(data.id, data.count);
  }

  async function fanOutGenerations(shootId: string, count: number) {
    await Promise.allSettled(
      Array.from({ length: count }, (_, i) =>
        fetch(`/api/shoots/${shootId}/generate/${i}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
        }).then(async (r) => {
          if (!r.ok) {
            const data = (await r.json().catch(() => ({}))) as { error?: string };
            console.warn(`Scene ${i + 1} failed:`, data.error);
          }
        }).catch((err) => {
          console.warn(`Scene ${i + 1} threw:`, err);
        })
      )
    );
  }

  async function hydrateManifest(id: string) {
    const res = await fetch(`/api/shoots/${id}`, { cache: "no-store" });
    if (res.ok) {
      const m = (await res.json()) as ShootManifest;
      setManifest(m);
    }
  }

  useEffect(() => {
    if (step !== "generating" || !manifest) return;
    let cancelled = false;
    async function tick() {
      while (!cancelled) {
        await new Promise((r) => setTimeout(r, 2200));
        if (cancelled) break;
        try {
          const res = await fetch(`/api/shoots/${manifest!.id}`, {
            cache: "no-store",
          });
          if (!res.ok) continue;
          const next = (await res.json()) as ShootManifest;
          setManifest(next);
          const settled = next.images.every(
            (i) => i.state === "completed" || i.state === "failed"
          );
          if (settled) {
            setStep("gallery");
            const failed = next.images.filter((i) => i.state === "failed");
            if (failed.length === next.images.length) {
              toast.error("All scenes failed. Check failure reasons on each card.");
            } else if (failed.length > 0) {
              toast.warning(`${failed.length} of ${next.images.length} scenes failed.`);
            }
            break;
          }
        } catch {
          // ignore polling errors
        }
      }
    }
    void tick();
    return () => {
      cancelled = true;
    };
  }, [step, manifest]);

  const stepIndex = useMemo(() => {
    return {
      upload: 0,
      mode: 1,
      "configure-pack": 2,
      "configure-surprise": 2,
      "configure-custom": 2,
      generating: 3,
      gallery: 4,
    }[step];
  }, [step]);

  const showAspect = step.startsWith("configure-");

  return (
    <div className="relative min-h-screen pb-24">
      <Header onReset={reset} />

      <div className="mx-auto w-full max-w-7xl px-5 md:px-10">
        <StepIndicator current={stepIndex} />

        <AnimatePresence mode="wait">
          {step === "upload" && (
            <motion.section key="upload" {...containerAnim} className="py-16 md:py-24">
              <div className="mx-auto max-w-2xl space-y-10 text-center">
                <div className="space-y-4">
                  <span className="cap text-ember">Step 01 · Reference</span>
                  <h1 className="font-display text-5xl md:text-7xl tracking-tightest text-paper">
                    Drop one photo of your face.
                  </h1>
                  <p className="mx-auto max-w-md text-base text-paper-dim">
                    From this single reference, the studio will produce a 12-image
                    shoot — your face locked in across every scene.
                  </p>
                </div>
                <ReferenceDropzone value={reference} onChange={handleUpload} />
              </div>
            </motion.section>
          )}

          {step === "mode" && (
            <motion.section key="mode" {...containerAnim} className="py-12">
              <div className="mb-10 flex items-end justify-between gap-6">
                <div className="space-y-2">
                  <span className="cap text-ember">Step 02 · Direction</span>
                  <h2 className="font-display text-4xl md:text-5xl tracking-tightest text-paper">
                    Choose how to shoot.
                  </h2>
                </div>
                {reference && (
                  <button
                    onClick={() => setStep("upload")}
                    className="hidden md:flex items-center gap-2 text-[12px] text-paper-mute transition hover:text-paper"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> change reference
                  </button>
                )}
              </div>
              <ModePicker onSelect={handleMode} />
            </motion.section>
          )}

          {step === "configure-pack" && (
            <motion.section key="config-pack" {...containerAnim} className="py-12 space-y-8">
              <ConfigHeader
                eyebrow="Step 03 · Pack"
                title="Pick a pack."
                onBack={() => setStep("mode")}
              />
              <div className="flex flex-wrap items-center gap-4">
                <span className="cap">Aspect</span>
                <AspectControl value={aspectRatio} onChange={setAspectRatio} />
              </div>
              <PackGrid
                onChoose={(pack: Pack) =>
                  startShoot({
                    scenes: pack.scenes,
                    packId: pack.id,
                    aspect: pack.defaultAspectRatio ?? aspectRatio,
                  })
                }
              />
            </motion.section>
          )}

          {step === "configure-surprise" && (
            <motion.section key="config-surprise" {...containerAnim} className="py-12 md:py-20">
              <BackBar onBack={() => setStep("mode")} />
              <SurprisePanel
                onScenes={(theme, scenes) =>
                  startShoot({ scenes, surpriseTheme: theme })
                }
              />
              <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
                <span className="cap">Aspect</span>
                <AspectControl value={aspectRatio} onChange={setAspectRatio} />
              </div>
            </motion.section>
          )}

          {step === "configure-custom" && (
            <motion.section key="config-custom" {...containerAnim} className="py-12">
              <BackBar onBack={() => setStep("mode")} />
              <CustomPanel onSubmit={(scenes) => startShoot({ scenes })} />
              <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
                <span className="cap">Aspect</span>
                <AspectControl value={aspectRatio} onChange={setAspectRatio} />
              </div>
            </motion.section>
          )}

          {(step === "generating" || step === "gallery") && manifest && (
            <motion.section key="shoot" {...containerAnim} className="py-10 md:py-14">
              <ShootView
                manifest={manifest}
                onSelect={(img) => setEditing(img)}
                onNew={reset}
              />
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      {showAspect && null}

      {manifest && (
        <EditModal
          open={!!editing}
          onClose={() => setEditing(null)}
          shootId={manifest.id}
          image={editing}
          aspectRatio={manifest.aspectRatio}
          onUpdate={(img) => {
            setManifest((m) => {
              if (!m) return m;
              const next = { ...m, images: [...m.images] };
              next.images[img.index] = img;
              return next;
            });
            setEditing(img);
          }}
        />
      )}
    </div>
  );
}

function ShootView({
  manifest,
  onSelect,
  onNew,
}: {
  manifest: ShootManifest;
  onSelect: (img: ShootImage) => void;
  onNew: () => void;
}) {
  const subtitle =
    manifest.mode === "pack"
      ? `${manifest.packId} pack`
      : manifest.mode === "surprise"
      ? `surprise · "${manifest.surpriseTheme}"`
      : "custom shoot";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <span className="cap text-ember">{subtitle}</span>
          <h2 className="font-display text-4xl md:text-5xl tracking-tightest text-paper">
            Your shoot
          </h2>
          <p className="text-[12px] text-paper-mute">
            Click any image to edit it in plain English.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <GenerationStatus images={manifest.images} />
          <Button variant="outline" size="md" onClick={onNew}>
            New shoot <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <ShootGrid
        images={manifest.images}
        aspectRatio={manifest.aspectRatio}
        onSelect={onSelect}
      />
    </div>
  );
}

function ConfigHeader({
  eyebrow,
  title,
  onBack,
}: {
  eyebrow: string;
  title: string;
  onBack: () => void;
}) {
  return (
    <div className="flex items-end justify-between gap-6">
      <div className="space-y-2">
        <span className="cap text-ember">{eyebrow}</span>
        <h2 className="font-display text-4xl md:text-5xl tracking-tightest text-paper">
          {title}
        </h2>
      </div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[12px] text-paper-mute transition hover:text-paper"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> back
      </button>
    </div>
  );
}

function BackBar({ onBack }: { onBack: () => void }) {
  return (
    <div className="mb-10">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[12px] text-paper-mute transition hover:text-paper"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> back
      </button>
    </div>
  );
}

function StepIndicator({ current }: { current: number }) {
  const steps = ["Reference", "Direction", "Scenes", "Generating", "Gallery"];
  return (
    <div className="flex items-center gap-3 py-6">
      {steps.map((label, i) => {
        const active = i <= current;
        return (
          <div key={label} className="flex items-center gap-3">
            <span
              className={cn(
                "font-mono text-[10px] transition-colors",
                active ? "text-paper" : "text-paper-mute/40"
              )}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span
              className={cn(
                "text-[11px] tracking-cap uppercase transition-colors",
                active ? "text-paper-dim" : "text-paper-mute/40"
              )}
            >
              {label}
            </span>
            {i < steps.length - 1 && (
              <span
                className={cn(
                  "h-[1px] w-6 transition-colors",
                  i < current ? "bg-paper" : "bg-paper-mute/20"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
