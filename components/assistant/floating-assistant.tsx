"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowUpRight,
  BookOpen,
  Bug,
  CheckCircle,
  Mail,
  MessageCircle,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { usePathname } from "@/i18n/navigation";
import { track } from "@/lib/analytics";
import {
  commercialIntentSchema,
  TEAM_SIZES,
} from "@/lib/schemas/commercial-intent";
import { cn } from "@/lib/utils";

/** Client-side form slice of the API schema (context fields are added on submit). */
const formSchema = commercialIntentSchema.pick({
  name: true,
  email: true,
  company: true,
  teamSize: true,
  message: true,
  website: true,
});
type FormInput = z.infer<typeof formSchema>;

type Tab = "commercial" | "support";

const INPUT_CLS =
  "border-border bg-bg-0 text-fg placeholder:text-tx-3 focus-visible:border-primary block w-full rounded-md border px-3 py-2 text-sm outline-none";

/**
 * Floating assistant — the bottom-right "客服 / commercial interest" widget.
 *
 * One launcher button above ScrollToTop opens a panel with two tabs:
 * - commercial: a short purchase-intent form → POST /api/commercial-intent
 *   (stored as a CMS lead + emailed to founders)
 * - support: direct channels (email / GitHub / docs) — no form, no queue
 *
 * Contact targets come from the CMS SiteSettings global (resolved server-side
 * in the locale layout and passed down as props, with static fallbacks).
 */
export function FloatingAssistant({
  supportEmail,
  githubUrl,
  docsUrl,
}: {
  supportEmail: string;
  githubUrl: string;
  docsUrl: string;
}) {
  const t = useTranslations("assistant");
  const locale = useLocale();
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("commercial");
  const [submitted, setSubmitted] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      message: "",
      website: "",
    },
  });

  // Esc closes the panel and returns the page to its pre-open state.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const onSubmit = async (data: FormInput) => {
    setRateLimited(false);
    if (data.website && data.website.length > 0) {
      // Honeypot tripped — silent success (UI only), no API call, no track().
      setSubmitted(true);
      return;
    }
    try {
      const res = await fetch("/api/commercial-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "commercial",
          name: data.name,
          email: data.email,
          company: data.company || undefined,
          teamSize: data.teamSize || undefined,
          message: data.message,
          locale,
          page: pathname,
        }),
      });
      if (res.status === 429) {
        setRateLimited(true);
        return;
      }
      if (!res.ok) throw new Error("Request failed");
      // No props — email/company are PII and must never reach analytics.
      track("commercial_intent_submit");
      setSubmitted(true);
      reset();
    } catch {
      toast.error(t("commercial.error"));
    }
  };

  const supportLinks = [
    {
      href: `mailto:${supportEmail}`,
      label: t("support.emailLabel"),
      detail: supportEmail,
      icon: Mail,
    },
    {
      href: `${githubUrl}/issues`,
      label: t("support.githubLabel"),
      detail: "GitHub",
      icon: Bug,
      external: true,
    },
    {
      href: docsUrl,
      label: t("support.docsLabel"),
      detail: docsUrl.replace(/^https?:\/\//, ""),
      icon: BookOpen,
      external: true,
    },
  ];

  return (
    <>
      {/* Panel */}
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label={t("title")}
          className="border-border bg-bg-0 fixed right-4 bottom-36 z-40 flex max-h-[min(70vh,560px)] w-[min(92vw,380px)] flex-col overflow-hidden rounded-xl border shadow-xl md:right-6"
        >
          <div className="border-border bg-surface border-b px-4 py-3">
            <p className="text-fg font-display-strong text-base">
              {t("title")}
            </p>
            <p className="text-fg-muted text-xs">{t("subtitle")}</p>
          </div>

          {/* Tabs */}
          <div
            role="tablist"
            aria-label={t("title")}
            className="border-border grid grid-cols-2 border-b"
          >
            {(["commercial", "support"] as const).map((key) => (
              <button
                key={key}
                role="tab"
                type="button"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={cn(
                  "font-strong duration-fast px-3 py-2.5 text-sm transition-colors",
                  tab === key
                    ? "text-primary border-primary -mb-px border-b-2"
                    : "text-fg-muted hover:text-fg",
                )}
              >
                {t(`tabs.${key}`)}
              </button>
            ))}
          </div>

          <div className="overflow-y-auto p-4">
            {tab === "commercial" ? (
              submitted ? (
                <div role="status" className="space-y-2 py-4 text-center">
                  <CheckCircle
                    className="text-green mx-auto"
                    size={28}
                    aria-hidden
                  />
                  <p className="text-fg font-strong text-sm">
                    {t("commercial.successTitle")}
                  </p>
                  <p className="text-fg-muted text-xs">
                    {t("commercial.successBody")}
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-3"
                  noValidate
                >
                  <p className="text-fg-muted text-xs">
                    {t("commercial.lede")}
                  </p>

                  {/* Honeypot */}
                  <input
                    {...register("website")}
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    className="absolute -left-[9999px] h-0 w-0"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label
                        htmlFor="fa-name"
                        className="text-fg font-strong text-xs"
                      >
                        {t("commercial.name")}
                      </label>
                      <input
                        id="fa-name"
                        {...register("name")}
                        placeholder={t("commercial.namePlaceholder")}
                        aria-invalid={Boolean(errors.name)}
                        className={INPUT_CLS}
                      />
                      {errors.name && (
                        <p className="text-red text-xs">
                          {errors.name.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label
                        htmlFor="fa-email"
                        className="text-fg font-strong text-xs"
                      >
                        {t("commercial.email")}
                      </label>
                      <input
                        id="fa-email"
                        type="email"
                        {...register("email")}
                        placeholder={t("commercial.emailPlaceholder")}
                        aria-invalid={Boolean(errors.email)}
                        className={INPUT_CLS}
                      />
                      {errors.email && (
                        <p className="text-red text-xs">
                          {errors.email.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label
                        htmlFor="fa-company"
                        className="text-fg font-strong text-xs"
                      >
                        {t("commercial.company")}
                      </label>
                      <input
                        id="fa-company"
                        {...register("company")}
                        placeholder={t("commercial.companyPlaceholder")}
                        className={INPUT_CLS}
                      />
                    </div>
                    <div className="space-y-1">
                      <label
                        htmlFor="fa-teamSize"
                        className="text-fg font-strong text-xs"
                      >
                        {t("commercial.teamSize")}
                      </label>
                      <select
                        id="fa-teamSize"
                        {...register("teamSize")}
                        defaultValue=""
                        className={INPUT_CLS}
                      >
                        <option value="" disabled>
                          {t("commercial.teamSizePlaceholder")}
                        </option>
                        {TEAM_SIZES.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="fa-message"
                      className="text-fg font-strong text-xs"
                    >
                      {t("commercial.message")}
                    </label>
                    <textarea
                      id="fa-message"
                      rows={3}
                      {...register("message")}
                      placeholder={t("commercial.messagePlaceholder")}
                      aria-invalid={Boolean(errors.message)}
                      className={cn(INPUT_CLS, "resize-y")}
                    />
                    {errors.message && (
                      <p className="text-red text-xs">
                        {errors.message.message}
                      </p>
                    )}
                  </div>

                  {rateLimited && (
                    <p className="bg-amber-dim text-fg border-amber rounded-r-md border-l-[3px] px-3 py-2 text-xs">
                      {t("commercial.rateLimited")}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-primary text-primary-foreground hover:shadow-glow-indigo duration-fast font-strong inline-flex h-10 w-full items-center justify-center rounded-md text-sm transition-shadow disabled:opacity-60"
                  >
                    {isSubmitting
                      ? t("commercial.submitting")
                      : t("commercial.submit")}
                  </button>
                </form>
              )
            ) : (
              <div className="space-y-3">
                <p className="text-fg-muted text-xs">{t("support.lede")}</p>
                <ul className="space-y-2">
                  {supportLinks.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        {...(link.external
                          ? { target: "_blank", rel: "noreferrer" }
                          : {})}
                        className="border-border hover:border-primary duration-fast group flex items-center gap-3 rounded-md border p-3 transition-colors"
                      >
                        <link.icon
                          size={16}
                          className="text-primary shrink-0"
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1">
                          <span className="text-fg font-strong block text-sm">
                            {link.label}
                          </span>
                          <span className="text-fg-muted block truncate text-xs">
                            {link.detail}
                          </span>
                        </span>
                        <ArrowUpRight
                          size={12}
                          className="text-fg-muted group-hover:text-primary shrink-0"
                          aria-hidden
                        />
                      </a>
                    </li>
                  ))}
                </ul>
                <p className="text-fg-muted text-xs">
                  {t("support.communityNote")}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Launcher — sits above ScrollToTop (right-6 bottom-6). */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? t("close") : t("buttonLabel")}
        className={cn(
          "duration-fast fixed right-6 bottom-20 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all",
          open
            ? "border-border bg-surface text-fg border"
            : "bg-primary text-primary-foreground hover:shadow-glow-indigo",
        )}
      >
        {open ? (
          <X size={18} aria-hidden />
        ) : (
          <MessageCircle size={20} aria-hidden />
        )}
      </button>
    </>
  );
}
