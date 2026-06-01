"use client";

import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

/**
 * Copy-to-clipboard button used inside the server-rendered CodeBlock chrome.
 * Brief sonner toast confirms the action; button also flips to a check icon
 * for ~1.4s so the user gets a non-toast confirmation too.
 */
export function CodeBlockCopy({
  code,
  className,
}: {
  code: string;
  className?: string;
}) {
  const tc = useTranslations("common");
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success(tc("copied"));
      window.setTimeout(() => setCopied(false), 1400);
    } catch (err) {
      console.error("Clipboard write failed", err);
    }
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={tc("copy")}
      className={cn(
        "border-border bg-surface hover:bg-bg-hover text-fg-muted hover:text-fg duration-fast inline-flex h-6 items-center gap-1 rounded-md border px-2 text-[11px] font-strong transition-colors",
        className,
      )}
    >
      {copied ? (
        <Check size={11} aria-hidden className="text-green" />
      ) : (
        <Copy size={11} aria-hidden />
      )}
      {copied ? tc("copied") : tc("copy")}
    </button>
  );
}
