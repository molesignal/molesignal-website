import { getTranslations } from "next-intl/server";

import { CodeBlock } from "@/components/ui/code-block";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const DOCKER_CMD = `# Postgres + MinIO + molesignal standalone, 1 command
docker compose -f deploy/docker/docker-compose.yaml --profile standalone up

# UI:        http://localhost:5080
# S3 admin:  http://localhost:9001  (minioadmin / minioadmin)`;

const HELM_CMD = `# Add the molesignal Helm repo
helm repo add molesignal https://charts.molesignal.io
helm repo update

# Install into a fresh namespace
kubectl create namespace observability
helm install molesignal molesignal/molesignal \\
  --namespace observability \\
  --set storage.s3.endpoint=s3.amazonaws.com \\
  --set storage.s3.bucket=mole-prod`;

const BINARY_CMD = `# Linux x86_64 binary
curl -L https://github.com/molesignal/molesignal/releases/latest/download/molesignal-linux-amd64 \\
  -o /usr/local/bin/molesignal
chmod +x /usr/local/bin/molesignal

# Quick standalone start (uses sqlite + local FS)
molesignal --listen 0.0.0.0:5080 --workdir /var/molesignal`;

/**
 * The three install paths in tabs. Hash-anchored: `#docker`, `#helm`,
 * `#binary`. The hash sync runs client-side; the initial tab is `docker`.
 *
 * Tab labels + CodeBlock filename strings resolve via `start.tabs.*` /
 * `start.tabFilenames.*` so they swap with the locale. The command bodies
 * themselves stay English — they're shell commands.
 */
export async function QuickStartTabs({ className }: { className?: string }) {
  const t = await getTranslations("start");
  return (
    <Tabs defaultValue="docker" className={cn("w-full", className)}>
      <TabsList className="bg-surface border-border inline-flex h-auto rounded-md border p-1">
        <TabsTrigger value="docker">{t("tabs.docker")}</TabsTrigger>
        <TabsTrigger value="helm">{t("tabs.helm")}</TabsTrigger>
        <TabsTrigger value="binary">{t("tabs.binary")}</TabsTrigger>
      </TabsList>

      <TabsContent value="docker" className="mt-4">
        <CodeBlock
          code={DOCKER_CMD}
          language="bash"
          filename={t("tabFilenames.docker")}
        />
      </TabsContent>

      <TabsContent value="helm" className="mt-4">
        <CodeBlock
          code={HELM_CMD}
          language="bash"
          filename={t("tabFilenames.helm")}
        />
      </TabsContent>

      <TabsContent value="binary" className="mt-4">
        <CodeBlock
          code={BINARY_CMD}
          language="bash"
          filename={t("tabFilenames.binary")}
        />
      </TabsContent>
    </Tabs>
  );
}
