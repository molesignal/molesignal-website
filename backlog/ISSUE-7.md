---
id: ISSUE-7
type: feature
title: [T07] GitHub stats/changelog真实性兜底标注
status: closed
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
- 2026-06-02 04:11:50 set status=in_review

## 代码审查（code-reviewer / 2026-06-02）

审查范围：`git diff main...feature/ISSUE-7`（3 文件 / +238-3）。本工单为**核验 + 加离线回归测试**型，唯一生产代码改动是新增测试脚本与 `package.json` 一行 script，未改既有渲染/数据逻辑（风险面极小）。

### 独立复核结论
- **测试真绿（已亲跑）**：`tsx scripts/check-github-fallback.ts` → **22/22 断言全过**（throw→fallback、!ok(403/404)→fallback、200→真实数据 fallback:false、drafts 过滤 1/2、bot(type!=User) 过滤、tag/version 解析、formatStars/timeAgo 无误导）。非轻信工单自述，已用本地 node 复现。
- **契约比对一致**：测试断言与 `lib/github.ts` 真实实现逐条吻合——`getRepoStats` 网络异常/非2xx→`REPO_FALLBACK{stars:0,lastCommitISO:null,fallback:true}`（github.ts:68-69,86-87）；`getReleases`/`getContributors` 失败→`[]`（:137,150,166,182）；200 路径解析真实值且 `fallback:false`。
- **消费端抽查无伪造**：`components/github-stats-chip.tsx:32-33` 在 `stats.fallback` 时把 `stars/ago` 置 null，chip/large/numeric 三态均退化为 `★ on GitHub` / `★`，链接仍指向真仓——与「不伪造数字」政策一致。
- **提交规范**：`test(ISSUE-7): ...` 符合 Conventional Commits。

### 发现
- 无 **必改**。
- 无 **建议改**。
- **可选（不阻塞，且在本 diff 范围外）**：`lib/github.ts:188` 文档注释写 `1_000_000 → "1M"`，实际 `formatStars` 输出 `"1.0M"`（`.toFixed(1)`）。仅注释与行为有出入，非 bug；测试用 1.5M 规避了该边界。日后顺手修注释或对整千做去尾零即可，本工单不必动。
- **测试覆盖范围说明（非缺陷）**：本测试锁定的是数据层契约，未做组件级渲染测试（light 道合理取舍）；UI 三兜底态的视觉呈现交由 qa-automation 在真实页面验证。

### 放行建议
**通过，建议放行 QA。** 改动为纯测试增量、可独立复现、契约与消费端一致，无正确性/安全/契约风险。
- 2026-06-02 04:13:26 set status=verifying

## QA 验证结果（qa-automation / 2026-06-02）

**VERDICT: PASS**

独立验证方式：起 `next dev`（node v23.6.1）真实渲染 + curl 抓 SSR HTML 断言 + Playwright(Chromium) 截图 + 离线回归脚本实跑 + 直接探活 GitHub API。被测分支 `feature/ISSUE-7`。

### 逐条 AC 实测证据
- **① 三兜底态被 UI 正确消费、不伪造数字** — PASS。
  - 离线回归 `pnpm test:github` 亲跑 **22/22 全过**：network throw → `fallback:true,stars:0,lastCommitISO:null`；非 2xx(403/404) → 同；`getReleases/getContributors` → `[]`；200 → 真实数据 `fallback:false`（draft 过滤 1/2、bot(type!=User) 过滤、tag/version 解析）；`formatStars/timeAgo` 不误导。
  - 运行时全程**未发现任何被伪造的非零数字**（多次抓取 HTML 断言 `<span>[1-9]…[kM]?</span>` 命中数恒为 0）。
- **② changelog live/previewing pill** — PASS。EN `/changelog` 与 ZH `/zh/changelog` 实测 pill 渲染 `<span class="…bg-surface-muted text-fg-muted…">previewing</span>`（中性灰，default variant），ZH 为「预览」。截图 `/tmp/issue7-changelog.png` 可见灰色 PREVIEWING pill + 回退的静态 changelog（v0.7.0/0.6.0/0.5.0，锚点 `id="v0-5-0"` 等）正常渲染——非空态、非伪造。
- **③ stats 兜底 ★on GitHub 无数字** — PASS。组件代码 + 离线测试证明 `stats.fallback` 时 chip/large/numeric 三态退化为 `Star on GitHub`/`★`、`stars=null`、`ago=null`，链接仍指向真仓；纯兜底文案路径由 22/22 测试覆盖。
- **④ 贡献者墙空态** — PASS。运行时 `getContributors()` 实遇 GitHub 403 → `[]`，EN 首页实测渲染「Be the first contributor — open an issue or PR.」、ZH 渲染「成为第一个贡献者 —— 开 issue 或 PR」，且**无任何伪造头像 `<img>`**（avatars.githubusercontent 命中 0）。
- **⑤ 公开仓库+token 自动切真实，无需改代码** — PASS，且**本机已现场命中真实数据路径**：探活 `api.github.com/repos/molesignal/molesignal` 取得 200 缓存体，证实该仓 `private:false / visibility:public / stargazers_count:0`（建于 2026-05-29）。同一份代码无改动即自动消费真实值——stats chip 实测渲染真实 `★ 0 · —`（0=真实星数，—=last-commit 端点限流不可得，诚实标注），changelog 因**确无已发布 Release**（releases 端点 200 但 `[]`）正确落到 "previewing" 静态回退。截图 `/tmp/issue7-home.png` 佐证。

### 发现（不阻断）
- ⚠️ **工单"遗留/说明"中的前提已过时**：原文称「molesignal/molesignal 未公开 → 站点实际呈现兜底态」。实测该仓**现已公开**（0 star / 0 release），故 stats chip 实呈**真实数据态**（`★ 0 · —`，非 "★ on GitHub" 兜底），changelog 的 "previewing" 是因「0 条已发布 Release」而非「仓库私有」。行为本身正确且诚实，仅工单文字描述需校正。
- GitHub 未鉴权限流（60/h）下，repo-metadata 命中 200 而 commits 端点 403 时，chip 会呈现「真实星数 + last-commit 为 —」的部分数据态（诚实，"—"=未知）。属数据层既有行为、不在本 diff 范围（本工单仅新增测试脚本，未动渲染逻辑）。**建议**构建/生产环境配置 `GITHUB_TOKEN` 以消除限流抖动，使 star + last-commit 稳定齐全。
- 文档注释 `formatStars` 1_000_000→"1M"（实为 "1.0M"）——code-reviewer 已记录，范围外，不阻断。

### 结论
3 兜底态在真实浏览器/SSR 中均被正确消费、零伪造；真实数据自动切换已现场验证；新增离线回归 22/22 全绿可一键重跑。**无阻断/严重缺陷，放行合并。**

回归重跑（PATH 需含 node v23.6.1）：
```bash
export PATH="$HOME/.nvm/versions/node/v23.6.1/bin:$PATH"
pnpm test:github   # 22/22 GitHub 兜底/真实切换契约
```
- 2026-06-02 04:24:42 set status=closed
- 2026-06-02 04:24:42 引擎周期#7: QA PASS, 关闭
