# Branch protection — making CI block merges (T13 / ISSUE-14)

The `CI` workflow (`.github/workflows/ci.yml`) runs the quality gate on every PR
and push to `main`. The workflow **reports** pass/fail; turning a red run into a
**merge block** is a one-time repository setting (GitHub can't grant that from
inside a workflow file).

## Enable required status checks

Repo **Settings → Branches → Branch protection rules → Add rule** for `main`:

1. **Require a pull request before merging** ✔
2. **Require status checks to pass before merging** ✔
   - Search and select: **`quality-gate`** (the job name from `ci.yml`).
   - Also tick **Require branches to be up to date before merging** so a PR is
     re-tested against the latest `main`.
3. (Recommended) **Do not allow bypassing the above settings** ✔

Once saved, a PR with a failing `quality-gate` run shows a red ✗ and the
**Merge** button is disabled until the gate goes green.

### CLI equivalent (requires admin token)

```bash
gh api -X PUT repos/{owner}/{repo}/branches/main/protection \
  -H "Accept: application/vnd.github+json" \
  -f 'required_status_checks[strict]=true' \
  -f 'required_status_checks[contexts][]=quality-gate' \
  -F 'enforce_admins=true' \
  -F 'required_pull_request_reviews=null' \
  -F 'restrictions=null'
```

## What the gate runs

`quality-gate` (ubuntu-latest) — fails the PR if any step fails:

| Step              | Command                | Guards |
|-------------------|------------------------|--------|
| Lint & static     | `pnpm check`           | tsc + eslint + a11y:contrast + i18n parity |
| QuickStart sync   | `pnpm lint:quickstart` | website ↔ README command parity¹ |
| Build             | `pnpm build`           | production Next.js build |
| Link check        | `pnpm lint:links`      | every internal link 2xx (vs `next start`) |
| E2E               | `pnpm test:e2e`        | Playwright critical paths (own server :3210) |

¹ The cross-repo checks self-skip when the parent product README (`../README.md`)
is absent — as it is in this standalone checkout / CI. The within-repo website
checks always run. Run the script inside the monorepo to enforce the full sync.

The pnpm store is cached via `actions/setup-node` (`cache: pnpm`, keyed on
`pnpm-lock.yaml`) to keep installs fast. No external secrets are needed — the
app builds and runs with graceful degradation when keys are absent.
