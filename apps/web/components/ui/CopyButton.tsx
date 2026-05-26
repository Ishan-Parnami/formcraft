"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Copy, Check } from "lucide-react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button size="sm" variant="outline" className="shrink-0" onClick={handleCopy}>
      {copied ? (
        <><Check className="h-3 w-3 mr-1 text-green-600" /> Copied</>
      ) : (
        <><Copy className="h-3 w-3 mr-1" /> Copy</>
      )}
    </Button>
  );
}
