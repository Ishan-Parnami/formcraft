import { ReactNode } from "react";

export function ComingSoonBadge() {
  return (
    <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full border border-amber-200 inline-flex items-center gap-1">
      🚧 Coming Soon
    </span>
  );
}

export function ComingSoonOverlay({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      <div className="opacity-40 pointer-events-none select-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center">
        <ComingSoonBadge />
      </div>
    </div>
  );
}
