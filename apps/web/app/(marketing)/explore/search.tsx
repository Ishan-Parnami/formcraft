"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTransition, useState } from "react";
import { Input } from "~/components/ui/input";
import { Search } from "lucide-react";

export default function ExploreSearch({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [value, setValue] = useState(defaultValue ?? "");

  function handleChange(v: string) {
    setValue(v);
    startTransition(() => {
      const params = new URLSearchParams();
      if (v) params.set("q", v);
      router.push(`${pathname}${v ? `?${params.toString()}` : ""}`);
    });
  }

  return (
    <div className="relative w-full sm:w-64">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
      <Input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search forms…"
        className="pl-8 h-9 text-sm"
      />
    </div>
  );
}
