"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Download, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BADGES, stickerPath, type Badge } from "@/lib/badges/registry";
import { BadgeVisual } from "./badge-visual";
import { triggerDownload } from "@/lib/badges/download";
import { cn } from "@/lib/utils";

export function BadgesSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Hidden HD render target for icon-badge → PNG export. Lives at 1024px so the
  // downloaded image is sharp regardless of how big the on-screen tile is.
  const hdRef = useRef<HTMLDivElement | null>(null);
  const [hdBadge, setHdBadge] = useState<Badge | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoaded(false);
    (async () => {
      try {
        const res = await fetch("/api/me/badges", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { unlockedStickers: string[] };
        if (!cancelled) {
          setUnlocked(new Set(data.unlockedStickers ?? []));
          setLoaded(true);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const download = async (badge: Badge) => {
    setDownloadingId(badge.id);
    try {
      if (badge.visual.type === "sticker") {
        triggerDownload(stickerPath(badge.visual.file), `${badge.id}.png`);
      } else {
        setHdBadge(badge);
        // Wait one tick so the hidden HD target re-renders the new badge,
        // then snapshot it.
        await new Promise((r) => requestAnimationFrame(() => r(null)));
        await new Promise((r) => requestAnimationFrame(() => r(null)));
        if (!hdRef.current) throw new Error("HD render target missing");
        const dataUrl = await toPng(hdRef.current, {
          pixelRatio: 1,
          cacheBust: true,
          backgroundColor: "rgba(0,0,0,0)",
        });
        triggerDownload(dataUrl, `${badge.id}.png`);
        setHdBadge(null);
      }
    } catch (err) {
      console.error("download failed", err);
      toast.error("Download fehlgeschlagen.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xs uppercase tracking-[0.22em] font-medium text-muted-foreground text-center">
            Badges
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4">
          {BADGES.map((badge, i) => {
            const isUnlocked = unlocked.has(badge.id);
            const isDownloading = downloadingId === badge.id;
            return (
              <motion.div
                key={badge.id}
                className="relative flex flex-col items-center justify-between gap-3 p-5 rounded-2xl bg-muted/40 aspect-[4/5]"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{
                  opacity: loaded ? 1 : 0,
                  scale: loaded ? 1 : 0.94,
                }}
                transition={{
                  delay: i * 0.04,
                  duration: 0.3,
                  ease: "easeOut",
                }}
              >
                <div className="flex-1 grid place-items-center w-full">
                  <BadgeVisual badge={badge} size={112} locked={!isUnlocked} />
                </div>
                <span
                  className={cn(
                    "text-xs font-medium text-center leading-tight",
                    !isUnlocked && "text-muted-foreground/50 font-normal",
                  )}
                >
                  {badge.title}
                </span>

                {isUnlocked && (
                  <button
                    type="button"
                    onClick={() => download(badge)}
                    disabled={isDownloading}
                    aria-label={`${badge.title} herunterladen`}
                    title="Herunterladen"
                    className={cn(
                      "absolute top-2 right-2 size-6 rounded-full grid place-items-center",
                      "bg-background/70 backdrop-blur-sm border border-border/60",
                      "text-muted-foreground hover:text-foreground hover:bg-background transition-colors",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                    )}
                  >
                    {isDownloading ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Download className="size-3.5" />
                    )}
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Hidden HD render target for icon badges. Fixed at 1024×1024 so the
            downloaded PNG is sharp on any platform/share target. Off-screen via
            -left-[10000px] (display:none breaks rendering for html-to-image). */}
        <div
          aria-hidden
          style={{
            position: "fixed",
            left: -10000,
            top: 0,
            width: 1024,
            height: 1024,
            pointerEvents: "none",
          }}
        >
          <div
            ref={hdRef}
            style={{
              width: 1024,
              height: 1024,
              display: "grid",
              placeItems: "center",
            }}
          >
            {hdBadge && <BadgeVisual badge={hdBadge} size={896} />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
