import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config for the conversion-funnel analytics wiring (ISSUE-2 / T05).
 * Runs against a production build (`next start`) so the verified behaviour
 * matches what ships. A stubbed `window.plausible` (injected per-test) records
 * every `track()` call into sessionStorage; tests assert event name + props +
 * timing without needing a real Plausible domain (AC8 deferred).
 */
const PORT = 3210;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  timeout: 30_000,
  use: {
    baseURL: `http://localhost:${PORT}`,
    // disables CrossSignalDemo auto-tour → deterministic tab tests.
    // `reducedMotion` lives under `contextOptions` as of @playwright/test 1.60.
    contextOptions: { reducedMotion: "reduce" },
    colorScheme: "light",
    trace: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm exec next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
