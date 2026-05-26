"use client";

import { Check } from "lucide-react";
import { cn } from "~/lib/utils";
import type { RouterOutputs } from "@formforge/trpc/client";

type ThemeRow = RouterOutputs["themes"]["list"][number];

interface ThemeCardProps {
  theme: ThemeRow;
  isSelected: boolean;
  onClick: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  anime: "bg-pink-100 text-pink-700",
  tech: "bg-blue-100 text-blue-700",
  movies: "bg-purple-100 text-purple-700",
  games: "bg-red-100 text-red-700",
  minimal: "bg-gray-100 text-gray-600",
};

export function ThemeCard({ theme, isSelected, onClick }: ThemeCardProps) {
  const config = theme.config as Record<string, unknown>;
  const bgColor = (config.bgColor as string) ?? "#ffffff";
  const primaryColor = (config.primaryColor as string) ?? "#7c3aed";
  const category = theme.category ?? "minimal";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative rounded-lg border-2 text-left transition-all hover:shadow-md focus:outline-none",
        isSelected ? "border-violet-500 ring-2 ring-violet-300" : "border-gray-200 hover:border-gray-300",
      )}
    >
      <div className="flex h-14 overflow-hidden rounded-t-[8px]">
        <div className="flex-1" style={{ backgroundColor: bgColor }} />
        <div className="w-5" style={{ backgroundColor: primaryColor }} />
      </div>

      {/* Info */}
      <div className="px-2 py-1.5 bg-white rounded-b-[8px]">
        <p className="text-xs font-medium text-gray-800 truncate">{theme.name}</p>
        <span
          className={cn(
            "inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5",
            CATEGORY_COLORS[category] ?? CATEGORY_COLORS.minimal,
          )}
        >
          {category}
        </span>
      </div>

      {/* Selected checkmark */}
      {isSelected && (
        <div className="absolute top-1.5 right-1.5 bg-violet-500 text-white rounded-full p-0.5">
          <Check className="h-3 w-3" />
        </div>
      )}
    </button>
  );
}
