import { ArrowRight, ArrowUpRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ArchitectureDiagram } from "@/components/architecture-diagram";
import { Toc } from "@/components/toc";
import { Pill } from "@/components/ui/pill";
import { Section } from "@/components/ui/section";
import { Link } from "@/i18n/navigation";

const TOC_IDS = [
  "data-path",
  "storage",
  "query",
  "ingest",
  "realtime",
  "multi-tenancy",
  "perf",
  "open",
] as const;

const TOC_TITLE_KEYS: Record<(typeof TOC_IDS)[number], string> = {
  "data-path": "dataPathTitle",
  storage: "storageTitle",
  query: "queryTitle",
  ingest: "ingestTitle",
  realtime: "realtimeTitle",
  "multi-tenancy": "multiTenantTitle",
  perf: "perfTitle",
  open: "openTitle",
};

const INGEST_ROW_IDS = [
  ["OTLP HTTP", "otlpHttp"],
  ["OTLP gRPC", "otlpGrpc"],
  ["Vector", "vector"],
  ["Fluent Bit", "fluentBit"],
  ["Prometheus", "prometheus"],
  ["Loki push", "loki"],
  ["Splunk HEC", "splunk"],
  ["Jaeger", "jaeger"],
  ["Zipkin", "zipkin"],
  ["Syslog", "syslog"],
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "architecture" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function ArchitecturePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("architecture");
  const tCommon = await getTranslations("common");

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
        <div className="grid gap-12 lg:grid-cols-[1fr_220px]">
          <article className="space-y-section-md min-w-0">
            <Block id="data-path" title={t("dataPathTitle")} body={t("dataPathBody")}>
              <ArchitectureDiagram variant="full" />
            </Block>

            <Block id="storage" title={t("storageTitle")} body={t("storageBody")} />

            <Block id="query" title={t("queryTitle")} body={t("queryBody")} />

            <Block id="ingest" title={t("ingestTitle")} body={t("ingestBody")}>
              <ul className="grid gap-2 md:grid-cols-2">
                {INGEST_ROW_IDS.map(([name, key]) => (
                  <li
                    key={name}
                    className="border-border bg-surface flex items-baseline justify-between rounded-md border px-3 py-2"
                  >
                    <span className="text-fg font-mono text-sm font-strong">
                      {name}
                    </span>
                    <span className="text-fg-muted text-xs">
                      {t(`ingestRows.${key}`)}
                    </span>
                  </li>
                ))}
              </ul>
            </Block>

            <Block id="realtime" title={t("realtimeTitle")} body={t("realtimeBody")} />
            <Block id="multi-tenancy" title={t("multiTenantTitle")} body={t("multiTenantBody")} />

            <Block id="perf" title={t("perfTitle")} body={t("perfBody")}>
              <div className="border-marketing-accent/40 bg-marketing-accent-dim rounded-md border p-3 text-xs">
                <span className="text-marketing-accent font-strong">
                  {t("perfBannerLabel")} ·
                </span>{" "}
                <span className="text-fg">{t("perfBannerText")}</span>
              </div>
            </Block>

            <Block id="open" title={t("openTitle")} body={t("openBody")} />

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/start"
                className="bg-primary text-primary-foreground hover:shadow-glow-indigo duration-fast inline-flex h-11 items-center gap-2 rounded-md px-5 text-base font-strong transition-shadow"
              >
                {tCommon("tryIt")} <ArrowRight size={16} aria-hidden />
              </Link>
              <a
                href="https://github.com/molesignal/molesignal"
                target="_blank"
                rel="noreferrer"
                className="border-border text-fg hover:bg-bg-hover duration-fast inline-flex h-11 items-center gap-2 rounded-md border px-5 text-base font-strong transition-colors"
              >
                {tCommon("readCode")} <ArrowUpRight size={12} aria-hidden />
              </a>
            </div>
          </article>

          <Toc
            items={TOC_IDS.map((id) => ({
              id,
              label: t(TOC_TITLE_KEYS[id]),
            }))}
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
