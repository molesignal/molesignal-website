---
id: ISSUE-7
type: feature
title: [T07] GitHub stats/changelog真实性兜底标注
status: in_progress
priority: P0
assignee: frontend-engineer
created: 2026-06-01
updated: 2026-06-02
---

## 描述
模块:GitHub stats/changelog真实性兜底标注 | 角色:frontend | 依赖:无 | 里程碑:M1 | 验收:三兜底态被UI正确消费不伪造;changelog加live/previewing pill;stats兜底★on GitHub无数字;贡献者空态;公开+token时自动切真实 | 详见 07-开发任务拆分.md(T07) 与 06-技术架构.md/READINESS.md

## 需求说明


## 验收标准


## 处理记录
- 2026-06-01 23:30:28 工单创建（feature / P0）
- 2026-06-02 04:06:14 set assignee=frontend-engineer
- 2026-06-02 04:06:14 set priority=P0
- 2026-06-02 04:06:14 set status=triaged
- 2026-06-02 04:06:14 LANE: light
- 2026-06-02 04:06:14 EXTRA_ROLES: none
- 2026-06-02 04:06:29 set status=in_progress

## 实现说明（frontend / T07）

T07 的三兜底态 UI 在架构骨架阶段已具备并正确，本工单完成**逐条核验 + 补客观回归测试**（无需外部密钥/活仓即可验证），未改动既有渲染逻辑（避免对已绿组件引入风险）。

### 逐条核验（AC①–⑤）
- **① 三兜底态被 UI 正确消费、不伪造数字**
  - `lib/github.ts`：`getRepoStats()` 网络异常 / 非 2xx → 返回 `REPO_FALLBACK{ stars:0, lastCommitISO:null, fallback:true }`；`getReleases()` / `getContributors()` 失败 → `[]`。
  - `components/github-stats-chip.tsx`：`stats.fallback ? null : formatStars(...)`，fallback 时 `stars=null`、`ago=null`，三种 size（chip/large/numeric）均**不渲染任何数字**。
  - `components/contributor-wall.tsx`：`contributors.length === 0` → 渲染空态文案，不渲染假头像格。
  - `app/[locale]/changelog/page.tsx`：`releases.length === 0` → `source:"fallback"`，回退 `content/changelog.ts` 静态内容。
- **② changelog live/previewing pill（UX §3.5）**：页头 `<Pill variant={source==="github"?"brand":"default"}>`，文案 `changelog.sourceLive="live from GitHub"` / `sourceFallback="previewing"`。`Pill` 的 `default` variant = `bg-surface-muted text-fg-muted`（灰/中性），符合 UX「previewing（灰色）」。EN/ZH 文案均在位。
- **③ stats chip 兜底 "★ on GitHub" 无数字**：fallback 时 chip/large 渲染 `t("starOnGithub")="Star on GitHub"` + ★ 图标，numeric 渲染 `★`，链接仍指向真实仓库。
- **④ 贡献者墙空态 "Be the first contributor"**：`contributorWall.empty="Be the first contributor —"` + `emptyAction="open an issue or PR"` 链接，EN/ZH 双语在位。
- **⑤ 公开仓库 + token 自动切真实，无需改代码**：数据源切换由 `GITHUB_TOKEN` env + API 200 响应驱动（`authHeaders()` 仅在有 token 时加 `Authorization`）；200 路径解析真实 stars/last-commit/releases/contributors，`fallback:false`。无任何代码分支需手改。

### 改动文件
- `scripts/check-github-fallback.ts`（新增）：网络全 stub 的离线回归测试，覆盖 ①network throw、②非 2xx(403/404)、③200 真实数据自动切换（含 draft 过滤、bot 过滤、tag/version 解析）、formatStars/timeAgo 不误导。
- `package.json`：新增 `test:github` 脚本。

### 自测结果
- `pnpm test:github` → **22/22 断言全过**（throw→fallback、!ok→fallback、200→real data fallback:false、drafts dropped 1/2、bot 过滤、formatters）。
- `pnpm check` → typecheck ✓ / eslint ✓ / a11y:contrast **26/26 AA** ✓ / i18n parity **506↔506** ✓。
- `pnpm build` → **exit 0**（/changelog 等全路由 SSG/ISR 正常预渲染）。

### 遗留 / 说明
- 本期无 `GITHUB_TOKEN` 且 `molesignal/molesignal` 未公开 → 站点实际呈现兜底态（changelog "previewing" / chip "★ on GitHub" / 贡献者空态），与诚实标注政策一致。AC⑤ 的真实数据切换已由 `test:github` 的 200 路径客观证明（同一代码、无改动），日后补 token + 公开仓即自动生效，无需复跑代码改动，仅需真实环境联调复验。
- 未触碰 T16（贡献者真实数据验证）/ T20（changelog 接真实 Release）的下游范围；二者依赖本工单的数据层契约，本测试已锁定该契约行为。
