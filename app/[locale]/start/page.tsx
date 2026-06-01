import { ArrowRight, ArrowUpRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { QuickStartTabs } from "@/components/quick-start-tabs";
import { CodeBlock } from "@/components/ui/code-block";
import { Pill } from "@/components/ui/pill";
import { Section } from "@/components/ui/section";
import { Link } from "@/i18n/navigation";

const OTLP_CURL = `curl -X POST http://localhost:5080/api/v1/ingest/logs/app \\
  -H 'content-type: application/json' \\
  -H 'authorization: Bearer <jwt>' \\
  -d '[{"_timestamp":1700000000000000,"level":"error","msg":"db pool exhausted","trace_id":"abc123"}]'`;

const SQL_QUERY = `curl -X POST http://localhost:5080/api/v1/query \\
  -H 'authorization: Bearer <jwt>' \\
  -H 'content-type: application/json' \\
  -d '{"org_id":"<from-login>","language":"sql",
       "statement":"SELECT * FROM app WHERE trace_id = '\\''abc123'\\''",
       "time_range":{"start":0,"end":2000000000000000},
       "stream":{"name":"app","stream_type":"logs"}}'`;

const TROUBLESHOOT_KEYS = ["port", "org", "minio", "cargo", "alerts"] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "start" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function StartPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("start");

  return (
    <>
      <Section padding="lg" tint="hero">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <Pill variant="brand">{t("pill")}</Pill>
          <h1 className="text-display-xl md:text-display-2xl font-display-strong tracking-tighter">
            {t("title")}
          </h1>
          <p className="text-fg-muted text-lg">{t("lede")}</p>
        </div>
      </Section>

      <Section padding="md">
        <div className="space-y-4">
          <h2 className="text-display-md font-display-strong tracking-tighter">
            {t("prereqTitle")}
          </h2>
          <ul className="grid gap-2 md:grid-cols-3">
            {([
              ["docker", t("prereqDocker")],
              ["helm", t("prereqHelm")],
              ["binary", t("prereqBinary")],
            ] as const).map(([key, body]) => (
              <li
                key={key}
                className="border-border bg-surface rounded-lg border p-4"
              >
                <div className="text-fg-muted mb-1 text-xs font-strong uppercase tracking-wide">
                  {key}
                </div>
                <p className="text-fg text-sm">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section padding="md" tint="surface" id="install">
        <h2 className="text-display-md font-display-strong mb-4 tracking-tighter">
          {t("installTitle")}
        </h2>
        <QuickStartTabs />
      </Section>

      <Section padding="md">
        <div className="grid gap-section-md">
          <Block id="ingest" title={t("ingestTitle")} body={t("ingestBody")}>
            <CodeBlock code={OTLP_CURL} language="bash" filename={t("ingestFilename")} />
          </Block>
          <Block id="query" title={t("queryTitle")} body={t("queryBody")}>
            <CodeBlock code={SQL_QUERY} language="bash" filename={t("queryFilename")} />
          </Block>
        </div>
      </Section>

      <Section padding="md" tint="surface" id="troubleshoot">
        <h2 className="text-display-md font-display-strong mb-4 tracking-tighter">
          {t("troubleshootTitle")}
        </h2>
        <ul className="space-y-2">
          {TROUBLESHOOT_KEYS.map((key) => (
            <li key={key}>
              <details className="border-border bg-surface group rounded-md border">
                <summary className="text-fg cursor-pointer select-none px-4 py-3 text-sm font-strong">
                  {t(`troubleshoot.${key}.q`)}
                </summary>
                <div className="text-fg-muted border-border border-t px-4 py-3 text-sm">
                  {t(`troubleshoot.${key}.a`)}
                </div>
              </details>
            </li>
          ))}
        </ul>
      </Section>

      <Section padding="md">
        <h2 className="text-display-md font-display-strong mb-4 tracking-tighter">
          {t("nextTitle")}
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          <NextCard
            href="/architecture"
            label={t("nextArch")}
            iconElement={<ArrowRight size={14} aria-hidden />}
          />
          <NextCard
            href="/design-partner"
            label={t("nextDp")}
            iconElement={<ArrowRight size={14} aria-hidden />}
          />
          <NextCard
            href="https://docs.molesignal.io"
            external
            label={t("nextDocs")}
            iconElement={<ArrowUpRight size={12} aria-hidden />}
          />
        </div>
      </Section>
    </>
  );
}

function Block({
  id,
  title,
  body,
  children,
}: {
  id: string;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <section id={id} className="space-y-3">
      <h2 className="text-display-md font-display-strong tracking-tighter">
        {title}
      </h2>
      <p className="text-fg-muted text-lg">{body}</p>
      {children}
    </section>
  );
}

function NextCard({
  href,
  label,
  iconElement,
  external = false,
}: {
  href: string;
  label: string;
  iconElement: React.ReactNode;
  external?: boolean;
}) {
  const cls =
    "border-border bg-surface hover:border-primary hover:shadow-glow-indigo group flex items-center justify-between gap-2 rounded-lg border p-4 transition-all duration-fast";
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls}>
        <span className="text-fg font-strong">{label}</span>
        {iconElement}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      <span className="text-fg font-strong">{label}</span>
      {iconElement}
    </Link>
  );
}
