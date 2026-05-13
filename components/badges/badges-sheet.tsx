"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/components/ui/use-media-query";
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
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { regulars, final } = useMemo(() => {
    const regulars = BADGES.filter((b) => !b.final);
    const final = BADGES.find((b) => b.final) ?? null;
    return { regulars, final };
  }, []);

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

  const body = (
    <>
      <p className="text-center text-xs sm:text-sm text-muted-foreground px-2 sm:px-6 max-w-xl mx-auto -mt-1">
        Für jede kleine Challenge schenk ich dir eine Mausi. Sammel alle elf —
        am Ende wartet die Doktor-Mausi auf dich 🐭
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-5 pt-4">
        {regulars.map((badge, i) => (
          <BadgeCard
            key={badge.id}
            badge={badge}
            unlocked={unlocked.has(badge.id)}
            loaded={loaded}
            delay={i * 0.04}
            downloading={downloadingId === badge.id}
            onDownload={() => download(badge)}
          />
        ))}
      </div>

      {final && (
        <div className="pt-2 pb-4 flex justify-center">
          <FinalBadgeCard
            badge={final}
            unlocked={unlocked.has(final.id)}
            loaded={loaded}
            downloading={downloadingId === final.id}
            onDownload={() => download(final)}
          />
        </div>
      )}

      {/* Hidden HD render target for icon badges (unused right now since all
          badges are stickers, but kept for future icon-based badges). */}
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
    </>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-7xl">
          <DialogHeader>
            <DialogTitle className="text-xs uppercase tracking-[0.22em] font-medium text-muted-foreground text-center">
              Badges
            </DialogTitle>
          </DialogHeader>
          {body}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="text-xs uppercase tracking-[0.22em] font-medium text-muted-foreground">
            Badges
          </DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {body}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function BadgeCard({
  badge,
  unlocked,
  loaded,
  delay,
  downloading,
  onDownload,
}: {
  badge: Badge;
  unlocked: boolean;
  loaded: boolean;
  delay: number;
  downloading: boolean;
  onDownload: () => void;
}) {
  return (
    <motion.div
      className="relative flex flex-col items-center justify-center gap-3 p-3 sm:p-4 rounded-2xl bg-muted/40 h-40 sm:h-44 overflow-hidden"
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{
        opacity: loaded ? 1 : 0,
        scale: loaded ? 1 : 0.94,
      }}
      transition={{ delay, duration: 0.3, ease: "easeOut" }}
    >
      <BadgeVisual badge={badge} size={88} locked={!unlocked} />
      <span
        className={cn(
          "text-xs sm:text-sm font-medium text-center leading-tight whitespace-nowrap",
          !unlocked && "text-muted-foreground/50 font-normal",
        )}
      >
        {badge.title}
      </span>
      {unlocked && (
        <DownloadButton downloading={downloading} onClick={onDownload} />
      )}
    </motion.div>
  );
}

function FinalBadgeCard({
  badge,
  unlocked,
  loaded,
  downloading,
  onDownload,
}: {
  badge: Badge;
  unlocked: boolean;
  loaded: boolean;
  downloading: boolean;
  onDownload: () => void;
}) {
  return (
    <motion.div
      className={cn(
        "relative flex flex-col items-center justify-center gap-4 px-6 sm:px-10 py-5 sm:py-6 rounded-3xl overflow-hidden",
        "w-full sm:w-auto sm:min-w-[280px] max-w-sm",
        unlocked
          ? "bg-gradient-to-br from-amber-100 via-amber-50 to-amber-100 dark:from-amber-950/40 dark:via-amber-900/20 dark:to-amber-950/40 ring-1 ring-amber-400/40 shadow-lg shadow-amber-500/10"
          : "bg-muted/40 ring-1 ring-border/40",
      )}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{
        opacity: loaded ? 1 : 0,
        scale: loaded ? 1 : 0.94,
      }}
      transition={{ delay: 0.5, duration: 0.4, ease: "easeOut" }}
    >
      {unlocked && (
        <motion.div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 30%, color-mix(in oklab, var(--color-foreground) 4%, transparent), transparent 60%)",
          }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <div className="relative">
        <BadgeVisual badge={badge} size={128} locked={!unlocked} />
      </div>
      <span
        className={cn(
          "text-base font-semibold text-center leading-tight whitespace-nowrap relative",
          !unlocked && "text-muted-foreground/50 font-normal",
        )}
      >
        {badge.title}
      </span>
      {unlocked && (
        <DownloadButton
          downloading={downloading}
          onClick={onDownload}
          className="top-3 right-3"
        />
      )}
    </motion.div>
  );
}

function DownloadButton({
  downloading,
  onClick,
  className,
}: {
  downloading: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={downloading}
      aria-label="Herunterladen"
      title="Herunterladen"
      className={cn(
        "absolute top-2 right-2 size-6 rounded-full grid place-items-center z-10",
        "bg-background/70 backdrop-blur-sm border border-border/60",
        "text-muted-foreground hover:text-foreground hover:bg-background transition-colors",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
    >
      {downloading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Download className="size-3.5" />
      )}
    </button>
  );
}
