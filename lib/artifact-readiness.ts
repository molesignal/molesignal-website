/**
 * QuickStart install-artifact readiness switch (T19 / QuickStart 产物就绪切换).
 *
 * The Docker Compose path works today. The Helm repo (charts.molesignal.io)
 * and the prebuilt binary release are a v1.0 target and an EXTERNAL
 * prerequisite (READINESS「真实 helm repo / binary release 产物」): until those
 * artifacts are actually published, the Helm / binary tabs keep the honest
 * "v1.0 target" notice (T04) so nobody pastes a command that 404s.
 *
 * Once the Helm repo + binary release are live and their commands smoke-test
 * clean (needs user confirmation), set
 * `NEXT_PUBLIC_QUICKSTART_ARTIFACTS_READY=true`. That single env var removes the
 * V1TargetNotice AND drops the "(v1.0 target)" suffix from the Helm / binary tab
 * filename labels — no code change needed, mirroring the Discord switch in
 * `lib/community.ts`.
 */
export function quickStartArtifactsReady(): boolean {
  return process.env.NEXT_PUBLIC_QUICKSTART_ARTIFACTS_READY?.trim() === "true";
}
