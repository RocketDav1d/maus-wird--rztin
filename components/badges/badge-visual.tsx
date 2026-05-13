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
 * Renders a single badge inside a square slot of `size` pixels.
 *
 *  - sticker: `object-contain` preserves the PNG's native aspect ratio (the
 *    Maus sticker pack is portrait-oriented, so without contain it would
 *    stretch into the square slot)
 *  - icon: gradient disc at 78% of the slot so its visual mass matches the
 *    sticker character (which has transparent margins around it)
 */
export function BadgeVisual({
  badge,
  size = 120,
  locked = false,
}: {
  badge: Badge;
  size?: number;
  locked?: boolean;
}) {
  if (badge.visual.type === "sticker") {
    return (
      <div
        className="relative grid place-items-center"
        style={{ width: size, height: size }}
      >
        <Image
          src={stickerPath(badge.visual.file)}
          alt=""
          width={size}
          height={size}
          draggable={false}
          priority={!locked}
          className={cn(
            "select-none object-contain w-full h-full",
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
      className="grid place-items-center"
      style={{ width: size, height: size }}
    >
      <div
        className={cn(
          "rounded-full grid place-items-center bg-gradient-to-br",
          badge.visual.gradient,
          locked ? "opacity-25 grayscale" : "shadow-md shadow-black/10",
        )}
        style={{ width: discSize, height: discSize }}
      >
        {Icon && (
          <Icon
            className="text-white drop-shadow"
            style={{ width: iconSize, height: iconSize }}
            strokeWidth={2.2}
          />
        )}
      </div>
    </div>
  );
}
