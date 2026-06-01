"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  cloudWaitlistSchema,
  type CloudWaitlistInput,
} from "@/lib/schemas/cloud-waitlist";
import { cn } from "@/lib/utils";

type Tone = "default" | "footer";

/**
 * Single-field email waitlist form for /cloud + footer inline use.
 *
 * - `tone="default"`: hero-style, full-width input + standalone button
 * - `tone="footer"`: inline pill-style with input + button on one line
 *
 * The actual backend (Resend / Buttondown / Plunk) is decided in Phase 5
 * M5.2. The POST target `/api/cloud-waitlist` returns a noop 200 today;
 * the route handler ships in M5.3.
 */
export function CloudWaitlistForm({
  tone = "default",
  className,
}: {
  tone?: Tone;
  className?: string;
}) {
  const tc = useTranslations("common");
  const tf = useTranslations("cloud.form");
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CloudWaitlistInput>({
    resolver: zodResolver(cloudWaitlistSchema),
    defaultValues: { email: "", website: "" },
  });

  const onSubmit = async (data: CloudWaitlistInput) => {
    if (data.website && data.website.length > 0) {
      // Honeypot tripped — silent success.
      setSubmitted(true);
      return;
    }
    try {
      const res = await fetch("/api/cloud-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });
      if (!res.ok) throw new Error("Request failed");
      setSubmitted(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  if (submitted) {
    return (
      <p
        role="status"
        className={cn(
          "text-fg-muted text-sm",
          tone === "default" && "rounded-lg bg-green-dim text-green px-4 py-3",
          className,
        )}
      >
        {tf("successPrefix")} ★{" "}
        <a
          href="https://github.com/molesignal/molesignal"
          target="_blank"
          rel="noreferrer"
          className="text-marketing-accent underline-offset-2 hover:underline"
        >
          {tf("successAction")}
        </a>{" "}
        {tf("successSuffix")}
      </p>
    );
  }

  if (tone === "footer") {
    return (
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={cn("flex w-full max-w-md gap-2", className)}
        noValidate
      >
        <input
          {...register("website")}
          type="text"
          tabIndex={-1}
          aria-hidden
          className="absolute -left-[9999px] h-0 w-0"
          autoComplete="off"
        />
        <input
          {...register("email")}
          type="email"
          placeholder={tf("placeholder")}
          aria-invalid={!!errors.email || undefined}
          aria-describedby={errors.email ? "footer-waitlist-error" : undefined}
          className="border-border bg-surface text-fg placeholder:text-tx-3 focus-visible:border-primary min-w-0 flex-1 rounded-md border px-3 text-xs h-8 outline-none"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary text-primary-foreground hover:shadow-glow-indigo duration-fast inline-flex h-8 shrink-0 items-center rounded-md px-3 text-xs font-strong transition-shadow disabled:opacity-60"
        >
          {isSubmitting ? tc("submitting") : tf("submitInline")}
        </button>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("w-full max-w-md space-y-3", className)}
      noValidate
    >
      <input
        {...register("website")}
        type="text"
        tabIndex={-1}
        aria-hidden
        className="absolute -left-[9999px] h-0 w-0"
        autoComplete="off"
      />
      <div className="space-y-1">
        <label htmlFor="cw-email" className="text-fg text-sm font-strong">
          {tf("emailLabel")}
        </label>
        <input
          id="cw-email"
          {...register("email")}
          type="email"
          placeholder={tf("placeholder")}
          aria-invalid={!!errors.email || undefined}
          aria-describedby={errors.email ? "cw-email-error" : undefined}
          className="border-border bg-surface text-fg placeholder:text-tx-3 focus-visible:border-primary block w-full rounded-md border px-3 py-2 text-base outline-none"
        />
        {errors.email && (
          <p id="cw-email-error" className="text-red text-xs">
            {errors.email.message}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-primary text-primary-foreground hover:shadow-glow-indigo duration-fast inline-flex h-10 w-full items-center justify-center gap-1 rounded-md text-base font-strong transition-shadow disabled:opacity-60"
      >
        {isSubmitting ? tc("submitting") : tf("submit")}
      </button>
    </form>
  );
}
