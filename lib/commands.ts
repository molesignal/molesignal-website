/**
 * Canonical install command — the single source of truth for every place the
 * website shows the standalone docker compose line (hero, install tabs, and the
 * string the Copy button copies). Import this everywhere instead of repeating
 * the literal, so the copies can never drift (and a stray render can never drop
 * the space before `--profile`).
 *
 * NOTE: the parent repo's README ships `… standalone up` (no `-d`); the website
 * adds `-d` (detached) for a cleaner first-run. `scripts/check-quickstart-sync.ts`
 * still passes because it substring-matches the README-canonical prefix. If you
 * want them byte-identical, add `-d` to the parent README too.
 */
export const DOCKER_STANDALONE_CMD =
  "docker compose -f deploy/docker/docker-compose.yaml --profile standalone up -d";
