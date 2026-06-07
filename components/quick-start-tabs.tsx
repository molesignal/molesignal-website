import { Construction } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { InstallTabs } from "@/components/install-tabs.client";
import { CodeBlock } from "@/components/ui/code-block";
import { quickStartArtifactsReady } from "@/lib/artifact-readiness";
import { DOCKER_STANDALONE_CMD } from "@/lib/commands";

// Marketing page: say what it does, not which components it bundles. The
// standalone profile happens to run a metadata store + object store, but those
// are deployment details for the docs / troubleshooting, not the first
// impression. No default credentials on a marketing page. The command itself
// comes from the shared constant so it can never drift from the hero copy.
const DOCKER_CMD = `# molesignal standalone — everything in one command
${DOCKER_STANDALONE_CMD}

# UI: http://localhost:5080`;

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

# Quick standalone start
molesignal --listen 0.0.0.0:5080 --workdir /var/molesignal`;

/**
 * Honest "not yet shippable" banner for the Helm / binary tabs (P0-4). The
 * Helm repo and prebuilt binaries are a v1.0 target; the Docker path works
 * today. Shown above the command so nobody pastes a command that 404s. Hidden
 * once `NEXT_PUBLIC_QUICKSTART_ARTIFACTS_READY=true` flips the artifacts ready.
 */
function V1TargetNotice({ message }: { message: string }) {
  return (
    <div
      role="note"
      className="border-border bg-surface-muted text-fg-muted mb-3 flex items-start gap-2 rounded-md border border-dashed p-3 text-sm"
    >
      <Construction size={15} aria-hidden className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

/**
 * The three install paths as horizontal tabs (docker / helm / binary) above a
 * full-width code block. Tab labels + CodeBlock filenames resolve via
 * `start.tabs.*` / `start.tabFilenames.*`; command bodies stay English (they're
 * shell commands). Each tab's CodeBlock is pre-rendered on the server and
 * toggled by the client `InstallTabs` shell.
 */
export async function QuickStartTabs({ className }: { className?: string }) {
  const t = await getTranslations("start");
  const ready = quickStartArtifactsReady();
  const helmFilename = ready
    ? t("tabFilenamesReady.helm")
    : t("tabFilenames.helm");
  const binaryFilename = ready
    ? t("tabFilenamesReady.binary")
    : t("tabFilenames.binary");

  const panels = [
    {
      value: "docker",
      label: t("tabs.docker"),
      node: (
        <CodeBlock
          code={DOCKER_CMD}
          language="bash"
          filename={t("tabFilenames.docker")}
          analytics={{ tab: "docker", snippet_type: "install" }}
        />
      ),
    },
    {
      value: "helm",
      label: t("tabs.helm"),
      node: (
        <>
          {!ready && <V1TargetNotice message={t("v1Notice")} />}
          <CodeBlock
            code={HELM_CMD}
            language="bash"
            filename={helmFilename}
            analytics={{ tab: "helm", snippet_type: "install" }}
          />
        </>
      ),
    },
    {
      value: "binary",
      label: t("tabs.binary"),
      node: (
        <>
          {!ready && <V1TargetNotice message={t("v1Notice")} />}
          <CodeBlock
            code={BINARY_CMD}
            language="bash"
            filename={binaryFilename}
            analytics={{ tab: "binary", snippet_type: "install" }}
          />
        </>
      ),
    },
  ];

  return (
    <InstallTabs
      panels={panels}
      defaultValue="docker"
      ariaLabel={t("installTitle")}
      className={className}
    />
  );
}
