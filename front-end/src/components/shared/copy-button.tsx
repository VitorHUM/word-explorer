"use client";

import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const [hasError, setHasError] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setHasError(false);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setHasError(true);
    }
  }

  return (
    <Button
      aria-label={
        hasError ? `Nao foi possivel copiar ${label}` : `Copiar ${label}`
      }
      onClick={handleCopy}
      size="sm"
      type="button"
      variant="outline"
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}
