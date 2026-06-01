"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { track } from "@/lib/analytics";
import {
  COMPANY_SIZES,
  CURRENT_STACKS,
  designPartnerSchema,
  type DesignPartnerInput,
} from "@/lib/schemas/design-partner";
import { cn } from "@/lib/utils";

/**
 * Five-field design-partner application form (see /design-partner page).
 *
 * Submits to `/api/design-partner` (route handler in M5.2). Honeypot
 * `website` field is hidden off-screen — humans don't see it, bots fill it.
 *
 * On success: replaces the form with a calm confirmation. Errors fall back
 * to a sonner toast (no inline form-level error region per Brief A11y rule
 * that errors must announce what to do next, not just "something broke").
 */
export function DesignPartnerForm({ className }: { className?: string }) {
  const tc = useTranslations("common");
  const tf = useTranslations("designPartner.form");
  const [submitted, setSubmitted] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DesignPartnerInput>({
    resolver: zodResolver(designPartnerSchema),
    defaultValues: {
      name: "",
      email: "",
      companySize: undefined,
      currentStack: undefined,
      biggestPain: "",
      website: "",
    },
  });

  const onSubmit = async (data: DesignPartnerInput) => {
    setRateLimited(false);
    if (data.website && data.website.length > 0) {
      // Honeypot tripped — silent success (UI only). No API call, no 2xx,
      // and deliberately no track(): bot traffic must not pollute the funnel.
      setSubmitted(true);
      return;
    }
    try {
      const res = await fetch("/api/design-partner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      // 429 is a gentle, expected state — show an amber notice (not a red toast)
      // and keep the filled form so nothing the user typed is lost.
      if (res.status === 429) {
        setRateLimited(true);
        return;
      }
      if (!res.ok) throw new Error("Request failed");
      // Only a real 2xx counts as a conversion. zod failures never reach here
      // (react-hook-form blocks onSubmit); 429/5xx/network errors fall to catch.
      // No props — name/email are PII and must never be sent to analytics.
      track("design_partner_submit");
      setSubmitted(true);
    } catch {
      toast.error(tf("errorToast"));
    }
  };

  if (submitted) {
    return (
      <div
        role="status"
        className={cn(
          "border-green/20 bg-green-dim rounded-lg border p-6",
          className,
        )}
      >
        <div className="flex items-start gap-3">
          <CheckCircle
            className="text-green mt-0.5 shrink-0"
            size={24}
            aria-hidden
          />
          <div className="space-y-2">
            <p className="text-fg font-display-strong text-display-sm">
              {tf("successTitle")}
            </p>
            <p className="text-fg-muted text-sm">{tf("successBody")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn(
        "border-border bg-surface space-y-5 rounded-lg border p-6",
        className,
      )}
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

      <Field label={tf("nameLabel")} htmlFor="dp-name" error={errors.name?.message}>
        <input
          id="dp-name"
          {...register("name")}
          type="text"
          autoComplete="name"
          aria-invalid={!!errors.name || undefined}
          className="border-border bg-bg-0 text-fg placeholder:text-tx-3 focus-visible:border-primary block w-full rounded-md border px-3 py-2 text-base outline-none"
        />
      </Field>

      <Field label={tf("emailLabel")} htmlFor="dp-email" error={errors.email?.message}>
        <input
          id="dp-email"
          {...register("email")}
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email || undefined}
          className="border-border bg-bg-0 text-fg placeholder:text-tx-3 focus-visible:border-primary block w-full rounded-md border px-3 py-2 text-base outline-none"
        />
      </Field>

      <div className="grid gap-5 md:grid-cols-2">
        <Field
          label={tf("companySizeLabel")}
          htmlFor="dp-size"
          error={errors.companySize?.message}
        >
          <select
            id="dp-size"
            {...register("companySize")}
            aria-invalid={!!errors.companySize || undefined}
            className="border-border bg-bg-0 text-fg focus-visible:border-primary block w-full rounded-md border px-3 py-2 text-base outline-none"
            defaultValue=""
          >
            <option value="" disabled>
              {tf("pickOne")}
            </option>
            {COMPANY_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label={tf("currentStackLabel")}
          htmlFor="dp-stack"
          error={errors.currentStack?.message}
        >
          <select
            id="dp-stack"
            {...register("currentStack")}
            aria-invalid={!!errors.currentStack || undefined}
            className="border-border bg-bg-0 text-fg focus-visible:border-primary block w-full rounded-md border px-3 py-2 text-base outline-none"
            defaultValue=""
          >
            <option value="" disabled>
              {tf("pickOne")}
            </option>
            {CURRENT_STACKS.map((stack) => (
              <option key={stack} value={stack}>
                {stack}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field
        label={tf("biggestPainLabel")}
        htmlFor="dp-pain"
        hint={tf("biggestPainHint")}
        error={errors.biggestPain?.message}
      >
        <textarea
          id="dp-pain"
          {...register("biggestPain")}
          rows={4}
          maxLength={400}
          aria-invalid={!!errors.biggestPain || undefined}
          className="border-border bg-bg-0 text-fg placeholder:text-tx-3 focus-visible:border-primary block w-full resize-y rounded-md border px-3 py-2 text-base outline-none"
        />
      </Field>

      {rateLimited && (
        <p
          role="status"
          className="bg-amber-dim text-fg border-l-[3px] border-amber rounded-r-md px-3 py-2.5 text-sm"
        >
          {tf("rateLimit")}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-primary text-primary-foreground hover:shadow-glow-indigo duration-fast inline-flex h-11 w-full items-center justify-center gap-1 rounded-md text-base font-strong transition-shadow disabled:opacity-60"
      >
        {isSubmitting ? tc("submitting") : tf("submit")}
      </button>

      <p className="text-fg-muted text-xs">{tf("footerNote")}</p>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="text-fg text-sm font-strong">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-red text-xs">
          {error}
        </p>
      ) : hint ? (
        <p className="text-fg-muted text-xs">{hint}</p>
      ) : null}
    </div>
  );
}
