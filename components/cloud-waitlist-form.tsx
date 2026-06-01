"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { track } from "@/lib/analytics";
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
  const [rateLimited, setRateLimited] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CloudWaitlistInput>({
    resolver: zodResolver(cloudWaitlistSchema),
    defaultValues: { email: "", website: "" },
  });

  const onSubmit = async (data: CloudWaitlistInput) => {
    setRateLimited(false);
    if (data.website && data.website.length > 0) {
      // Honeypot tripped — silent success (UI only). No API call, no 2xx,
      // and deliberately no track(): bot traffic must not pollute the funnel.
      setSubmitted(true);
      return;
    }
    try {
      const res = await fetch("/api/cloud-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });
      // 429 is a gentle, expected state — show an amber notice (not a red error)
      // and keep the form so the user can simply retry in a moment.
      if (res.status === 429) {
        setRateLimited(true);
        return;
      }
      if (!res.ok) throw new Error("Request failed");
      // Only a real 2xx counts as a conversion. zod failures never reach here
      // (react-hook-form blocks onSubmit); 5xx/network errors fall to catch.
      // No props — email is PII and must never be sent to analytics.
      track("waitlist_submit");
      setSubmitted(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  if (submitted) {
    // Footer keeps the compact inline confirmation; the standalone /cloud form
    // gets the persistent green success card (05-UI §4.4).
    if (tone === "footer") {
      return (
        <p role="status" className={cn("text-green text-xs", className)}>
          {tf("successPrefix")} ★{" "}
          <a
            href="https://github.com/molesignal/molesignal"
            target="_blank"
            rel="noreferrer"
            data-analytics-event="github_star_click"
            data-analytics-source-page
            className="text-marketing-accent underline-offset-2 hover:underline"
          >
            {tf("successAction")}
          </a>{" "}
          {tf("successSuffix")}
        </p>
      );
    }
    return (
      <div
        role="status"
        className={cn(
          "border-green/20 bg-green-dim w-full max-w-md rounded-lg border p-5",
          className,
        )}
      >
        <div className="flex items-start gap-3">
          <CheckCircle
            className="text-green mt-0.5 shrink-0"
            size={24}
            aria-hidden
          />
          <div className="space-y-1.5">
            <p className="text-fg text-display-sm font-display-strong">
              {tf("successPrefix")}
            </p>
            <p className="text-fg-muted text-sm">{tf("successBody")}</p>
            <p className="text-fg-muted text-sm">
              ★{" "}
              <a
                href="https://github.com/molesignal/molesignal"
                target="_blank"
                rel="noreferrer"
                data-analytics-event="github_star_click"
                data-analytics-source-page
                className="text-marketing-accent underline-offset-2 hover:underline"
              >
                {tf("successAction")}
              </a>{" "}
              {tf("successSuffix")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (tone === "footer") {
    return (
      <div className={cn("w-full max-w-md", className)}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex w-full gap-2"
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
            aria-describedby={
              errors.email ? "footer-waitlist-error" : undefined
            }
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
        {rateLimited && <RateLimitNotice message={tf("rateLimit")} compact />}
      </div>
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
      {rateLimited && <RateLimitNotice message={tf("rateLimit")} />}
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

/**
 * Gentle amber rate-limit notice (05-UI §4.4) — warm tone, not a red error.
 * `compact` trims padding for the inline footer variant.
 */
function RateLimitNotice({
  message,
  compact = false,
}: {
  message: string;
  compact?: boolean;
}) {
  return (
    <p
      role="status"
      className={cn(
        "bg-amber-dim text-fg border-l-[3px] border-amber text-sm",
        compact ? "mt-2 rounded-r-md px-3 py-2 text-xs" : "rounded-r-md px-3 py-2.5",
      )}
    >
      {message}
    </p>
  );
}
