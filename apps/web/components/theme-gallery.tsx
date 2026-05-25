"use client";

import { Skeleton } from "~/components/ui/skeleton";
import { ThemeCard } from "~/components/theme-card";
import type { RouterOutputs } from "@formforge/trpc/client";

type ThemeRow = RouterOutputs["themes"]["list"][number];

interface ThemeGalleryProps {
  currentTheme: Record<string, unknown> | null;
  presets: ThemeRow[];
  onSelect: (config: Record<string, unknown>) => void;
  isLoading: boolean;
}

function isThemeSelected(current: Record<string, unknown> | null, preset: ThemeRow): boolean {
  if (!current) return false;
  const config = preset.config as Record<string, unknown>;
  const keys: Array<keyof typeof config> = [
    "primaryColor", "bgColor", "textColor", "accentColor",
    "fontFamily", "borderRadius", "buttonStyle",
  ];
  return keys.every((k) => current[k] === config[k]);
}

export function ThemeGallery({ currentTheme, presets, onSelect, isLoading }: ThemeGalleryProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-2">
      {presets.map((preset) => (
        <ThemeCard
          key={preset.id}
          theme={preset}
          isSelected={isThemeSelected(currentTheme, preset)}
          onClick={() => onSelect(preset.config as Record<string, unknown>)}
        />
      ))}
    </div>
  );
}
