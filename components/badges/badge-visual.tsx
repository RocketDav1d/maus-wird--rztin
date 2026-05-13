"use client";

import Image from "next/image";
import { Sparkles, Flame, Star, Trophy, type LucideIcon } from "lucide-react";
import { stickerPath, type Badge } from "@/lib/badges/registry";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles,
  Flame,
  Star,
  Trophy,
};

/**
 * A badge rendered inside a square slot of exactly `size` × `size` pixels.
 * The slot is `overflow-hidden` so the rendered visual can NEVER bleed past
 * its boundaries, regardless of source-image aspect ratio.
 *
 *  - sticker: Next.js Image with `fill` + `object-fit: contain` so the PNG
 *    keeps its native aspect ratio inside the slot
 *  - icon:    gradient disc at 78% of the slot for visual balance with the
 *    sticker character (which has transparent margin around it)
 */
export function BadgeVisual({
  badge,
  size = 100,
  locked = false,
}: {
  badge: Badge;
  size?: number;
  locked?: boolean;
}) {
  const slotStyle: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    flexShrink: 0,
  };

  if (badge.visual.type === "sticker") {
    return (
      <div
        style={slotStyle}
        className="relative overflow-hidden"
      >
        <Image
          src={stickerPath(badge.visual.file)}
          alt=""
          fill
          sizes={`${size}px`}
          priority={!locked}
          draggable={false}
          style={{ objectFit: "contain" }}
          className={cn(
            "select-none",
            locked ? "opacity-25 grayscale" : "drop-shadow-sm",
          )}
        />
      </div>
    );
  }

  const Icon = ICON_MAP[badge.visual.iconName];
  const discSize = Math.round(size * 0.78);
  const iconSize = Math.round(size * 0.36);
  return (
    <div
      style={slotStyle}
      className="grid place-items-center overflow-hidden"
    >
      <div
        className={cn(
          "rounded-full grid place-items-center bg-gradient-to-br",
          badge.visual.gradient,
          locked ? "opacity-25 grayscale" : "shadow-md shadow-black/10",
        )}
        style={{ width: `${discSize}px`, height: `${discSize}px` }}
      >
        {Icon && (
          <Icon
            className="text-white drop-shadow"
            style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
            strokeWidth={2.2}
          />
        )}
      </div>
    </div>
  );
}
