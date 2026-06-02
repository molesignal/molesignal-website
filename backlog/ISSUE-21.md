---
id: ISSUE-21
type: feature
title: [T20] Changelog接真实Release
status: closed
priority: P1
assignee: backend-engineer
created: 2026-06-01
updated: 2026-06-02
---

## 描述
模块:Changelog接真实Release | 角色:backend | 依赖:T07 | 里程碑:M2 | 验收:有Release时ISR拉取;RSS同源;版本锚跳转;依赖真实Release。动数据源full道 | 详见 07-开发任务拆分.md(T20) 与 06-技术架构.md/READINESS.md

## 需求说明

### 背景与定位
承接 PRD §4.2 **P1-7「Changelog 接真实 Release(#16)」**（D3 文档与内容可信）、`07-开发任务拆分.md` **T20**、`06-技术架构.md §3.3` GitHub provider。命中红线②（动数据源）→ **LANE: full**，EXTRA_ROLES: none。

**与已闭环 T07（ISSUE-7）的边界**：T07 已验证 changelog 的**兜底/previewing 态**（无 Release → 灰 pill、不伪造数字、回退静态 `content/changelog.ts`）。本工单（T20）聚焦**真实 Release 数据路径**——当 `getReleases()` 返回真实 release 时，ISR 拉取展示、RSS 同源、版本锚跳转三者端到端正确，且回退态不退化。

### 现状（已核实，2026-06-02）
代码已基本落地，本工单以**客观验证 + 补缺口**为主，非从零开发：
- `lib/github.ts:getReleases(limit=30)` ✅ 已具备：`fetch` + `next.revalidate=3600`（ISR 1h）、过滤 draft、map 出 `{tag, version(去前导v), name, publishedAt, bodyMarkdown, htmlUrl, prerelease}`、失败/限流返 `[]`。
- `app/[locale]/changelog/page.tsx` ✅ 有 Release 时用 `releaseToChangelogMeta` 渲染（source="github"，brand pill `sourceLive`）；`[]` 时回退 `CHANGELOG` 静态（source="fallback"，`sourceFallback` pill）。
- `app/changelog/rss.xml/route.ts` ✅ **同源**：同样调 `getReleases(30)`，同样回退 `CHANGELOG`，`revalidate=3600` 与页面一致。
- **版本锚一致性** ✅：`components/changelog-entry.tsx` 渲染 `id="v" + version.replace(/\./g,'-')`；page 侧栏 nav `href="#v…"`、RSS `<guid>`/`<link>#v…` 三处同一推导规则。
- `lib/parse-release.ts` ✅ 把 release body 解析为 `feat/fix/...` 结构化 items + prose 余项，页面与 RSS 复用同一解析。

### 本工单要做（缺口）
1. **真实数据路径独立验证**：注入 fixture/mock 的 release 数组，验证页面进入 `source="github"` 分支、`sourceLive` brand pill、每条 entry 渲染正确（version/date/items/prose/htmlUrl 外链）。
2. **RSS 同源一致性**：同一 release fixture 下，RSS 输出的版本集合、顺序（newest-first）、每条 `<link>`/`<guid>` 锚点与页面 entry `id` 逐一对应一致；RSS `<item>` 数 == 页面 entry 数。
3. **版本锚跳转**：nav 点击 / RSS 链接 `#vX-Y-Z` 能滚动定位到对应 entry（`id` 命中），含带 `-rc.1` 等预发布 tag 的锚（`v0.7.0-rc.1`→`v0-7-0-rc-1`）一致推导。
4. **预发布(prerelease)呈现决策**：现状 `getReleases` 仅滤 draft、**保留 prerelease**，entry 收到 `prerelease=true`。本工单须**明确并验证** prerelease 的呈现（展示且带预发布标记，不隐藏、不伪装为正式版）——确认 `ChangelogEntry` 对 `prerelease` 的视觉标注存在且正确。
5. **回退态回归不退化**：`getReleases()` 返 `[]` 时，页面/RSS 仍回退静态 `CHANGELOG`、pill 转 `sourceFallback`/previewing、无死链、无伪造——与 T07 结论保持一致。
6. **自动化留痕**：补 `test:changelog`（或等价脚本/E2E）覆盖上述 1–5，纳入回归；`pnpm check`/`build` 通过。

### 明确不做（YAGNI）
- ❌ 不改 `getReleases` 签名 / `REPO` 常量 / `revalidate` 窗口。
- ❌ 不新增分页/「加载更多」（30 条上限够用，超出留后续工单）。
- ❌ 不做真实 `GITHUB_TOKEN` + 真实 Release 联调（本期无密钥/无 Release，按降级政策 fixture/mock 验证即判 `[x]`，真实联调延后复验）。
- ❌ 不把 changelog 接入 i18n 正文翻译（Release body 为上游英文原文，超范围）。
- ❌ 不改静态 `content/changelog.ts` 兜底内容、不改 RSS feed 结构（title/channel 等）。
- ❌ 不引 `next/image` 远端域名、不改 sitemap 既有逻辑。

### 密钥/降级政策
本期不提供 `GITHUB_TOKEN`，且目标仓库 `molesignal/molesignal` 实测无真实 Release（T07 已现场确认走真实数据路径但返回空）。真实数据态以**注入 fixture/mock 客观验证**（脚本或 E2E mock `getReleases`），符合 READINESS「代码就绪 + 真实数据路径经 mock/脚本验证正确」即判 `[x]`；补密钥 + 仓库有真实 Release 后须翻开关复验（对应 READINESS T20 外部前置、与 ISSUE-7 AC⑤ 同构）。

## 用户故事

- **US-1（订阅者/开发者）**：作为关注 molesignal 的开发者，我想在 `/changelog` 看到与 GitHub Release **同步**的版本与变更，以便不进 GitHub 也能跟进进展。
- **US-2（RSS 订阅者）**：作为用 RSS 阅读器订阅的用户，我想 RSS 输出与网页 changelog **同源同序**且链接锚点能直达对应版本，以便在阅读器里点条目就跳到正确位置。
- **US-3（运营/团队）**：作为团队，我想在仓库**发布真实 Release 后无需改代码**，changelog 与 RSS 在 ISR 窗口内自动切到真实数据，以便发版即同步、且无 Release 时优雅回退不空场。

## 验收标准

- **AC1 — ISR 真实拉取**：注入 ≥2 条 release fixture（含正式版 + 1 条 prerelease）时，`/changelog` 进入 `source="github"` 分支，渲染 brand `sourceLive` pill；每条 entry 的 version/日期/结构化 items（feat/fix…）/prose/`htmlUrl` 外链均正确，无 NaN/空渲染。`getReleases` 保留 `next.revalidate=3600`（ISR 1h）。
- **AC2 — RSS 同源同序**：同一 release fixture 下，`/changelog/rss.xml` 的 `<item>` 数量 == 页面 entry 数量，顺序均为 publishedAt **newest-first**，且二者来自同一 `getReleases()` 调用（同源回退逻辑一致）。
- **AC3 — 锚点一致且可跳转**：页面 entry `id`、侧栏 nav `href`、RSS `<link>`/`<guid>` 对同一版本推导出**完全一致**的 `#vMAJOR-MINOR-PATCH`（点号转连字符）；含 `-rc.x` 预发布 tag 时（如 `v0.7.0-rc.1`→`v0-7-0-rc-1`）三处仍一致；点击锚点能定位到对应 entry（E2E 验滚动/`id` 命中）。
- **AC4 — 预发布标记**：`prerelease=true` 的 release 在页面**展示且带可识别的预发布标记**（不隐藏、不冒充正式版）；正式版无该标记。RSS 对应条目正常输出。
- **AC5 — 回退不退化**：`getReleases()` 返 `[]`（限流/网络失败/无 Release）时，页面与 RSS 均回退静态 `CHANGELOG`，pill 转 `sourceFallback`（previewing），无死链、无伪造数字——与 ISSUE-7（T07）结论一致，回归通过。
- **AC6 — 边界鲁棒**：release `body` 为空 / 仅 prose 无结构化行 / `name` 等于 tag 等边界，页面与 RSS 均不报错、不渲染空 pill 噪声（沿用 `parse-release` 既有容错）。
- **AC7 — 门禁绿**：新增 `test:changelog`（或等价 E2E/脚本）覆盖 AC1–AC6 并全过；`pnpm check`（tsc/eslint/a11y/i18n parity）+ `pnpm build` + `pnpm test:e2e` 回归零退化。
- **AC8 — 真实联调延后**：真实 `GITHUB_TOKEN` + 仓库有真实 Release 的端到端联调延后到补密钥/发版后复验，不阻塞本期 `[x]`（降级政策）。

## 架构评估（tech-architect, 2026-06-02）

### 结论：零契约 / 零数据模型变更 —— 06/07 文档无需更新
- 工单 YAGNI 明确冻结 `getReleases` 签名、`REPO`、`revalidate` 窗口、RSS feed 结构、静态 `content/changelog.ts`。`06-技术架构.md §3.3 GitHub provider` 与 `07-开发任务拆分.md T20` 现状与代码一致，**本工单不动接口契约、不动数据源 schema**，故**不更新 06/07，不产生迁移**。本质是「代码已落地 → 客观验证 + 补回归测试」。
- 已逆向核对四处实现，均与工单「现状」描述吻合（`lib/github.ts:126 getReleases`、`lib/parse-release.ts`、`app/[locale]/changelog/page.tsx`、`app/changelog/rss.xml/route.ts`、`components/changelog-entry.tsx`）。真实数据路径与回退路径都已存在，缺的是**独立可重放的验证脚本**。

### 关键契约（验证基准，三处必须同推导）
**锚点推导规则**：`anchor = "v" + version.replace(/\./g, "-")`，其中 `version = tag.replace(/^v/, "")`。
当前在 **3 处各自硬编码**了这条规则：
| 处 | 位置 | 代码 |
|---|---|---|
| entry `id` | `components/changelog-entry.tsx:62` | `` `v${entry.version.replace(/\./g, "-")}` `` |
| 侧栏 nav `href` | `app/[locale]/changelog/page.tsx:126` | `` `#v${meta.version.replace(/\./g, "-")}` `` |
| RSS `<link>`/`<guid>` | `app/changelog/rss.xml/route.ts:72` | `` `v${item.version.replace(/\./g, "-")}` `` |

⚠️ **这是漂移风险点**（AC3 的根因）：三处独立硬编码，未来任一处改了正则就会 RSS↔页面锚点错位、跳转死链。

### 实现方案（按风险从低到高，backend 主导）
**P0 必做 —— 补 `scripts/check-changelog.ts` + `test:changelog`（覆盖 AC1/AC2/AC3/AC5/AC6 的纯逻辑层）**
- 完全复用 `scripts/check-github-fallback.ts` 的 stub-fetch 范式（替换 `globalThis.fetch`，离线、无需密钥）。
- 注入 ≥2 条 release fixture：1 条正式版（`prerelease:false`，body 含 `feat/fix/perf` 结构化行 + prose 余项）+ 1 条预发布（`tag_name:"v0.7.0-rc.1"`, `prerelease:true`）+ 建议再加 1 条 draft（验证被滤除）。
- 断言：
  - **AC1**：`getReleases()` 返回非空 → 逐条 `releaseToChangelogMeta()` 输出 `version`（去前导 v）/`date`/`items`（按 TAG_ORDER 排序、tag 归一化正确）/`prose`/`htmlUrl`/`prerelease` 标志正确；无 NaN / 空串。
  - **AC2 同源同序**：`getReleases()` 与 RSS `collectItems()`（同一 fixture）→ 条数相等；二者各自 `sort(newest-first)` 后 version 序列逐一相等。
  - **AC3 锚点一致**：对每个 version，分别按 3 处规则推导 anchor，断言 `entryAnchor === navAnchor === rssAnchor`；含 `0.7.0-rc.1` → `v0-7-0-rc-1` 的预发布锚一致。**（见下 P1 重构后改为断言三处都调同一 helper）**
  - **AC4 预发布**：fixture 中 `prerelease:true` 的条目，`releaseToChangelogMeta().prerelease === true`；正式版 `=== false`（组件层 Pill 渲染由 E2E 兜，见下）。
  - **AC5 回退不退化**：stub 返 `!ok`/throw → `getReleases()===[]`、RSS `collectItems()` 回退到 `CHANGELOG`（条数==静态条数、version 与 `content/changelog.ts` 一致）；不重复 T07 已覆盖部分，只断言「回退后 RSS/页面数据源切静态」。
  - **AC6 边界**：fixture 含 `body:""`、仅 prose 无结构化行、`name===tag` 三种边界 → `parseReleaseBody` 不抛、`items` 可为空、`title` 为 `undefined`（`name===tag` 时不显多余标题）。
- `package.json` 加 `"test:changelog": "tsx scripts/check-changelog.ts"`；并入 `check` 或 CI（与现有 `test:github` 同级）。

**P1 建议（低风险、直接降 AC3 漂移风险，强烈推荐但非阻塞）—— 抽公共锚点 helper**
- 在 `lib/parse-release.ts`（或新 `lib/changelog-anchor.ts`）导出 `export const versionAnchor = (version: string) => "v" + version.replace(/\./g, "-")`。
- 三处（entry id / nav href / rss link+guid）全部改调该 helper，消灭硬编码重复。**这是本工单唯一值得做的"代码结构"改动**：不改契约、不改输出（输出逐字符等价），但把"三处同推导"从"测试期望"变成"编译期保证"。`check-changelog.ts` 改为断言三处 import 同一 helper。
- ⚠️ 注意：RSS 里推导后再拼 `#${anchor}`，entry 用作 `id={anchor}`，nav 用作 `href={#${anchor}}`——helper 只产出 `v0-7-0` 这段，`#` 前缀各处自拼，保持不变。

**P2 必做 —— E2E DOM 层（AC3 跳转 / AC4 Pill / AC1 sourceLive pill）**
- 难点：页面 `getReleases()` 是 **Next 服务端 fetch（node 层）**，Playwright 的 `page.route('**/api.github.com/**')` **拦不到**（那是浏览器层）。两条可行路径，backend 选其一：
  - **(推荐) 测试构建注入 fixture**：加一个仅测试态生效的环境开关（如 `CHANGELOG_FIXTURE=1` 时 `getReleases` 从本地 fixture 读），E2E 用该构建跑，断言 `sourceLive` brand pill 存在、预发布条目有 `preReleasePill`、点击 nav `#v…` 后对应 `article[id="v…"]` 进入视口（`toBeInViewport`）。**此开关须严格限测试态、不污染生产**（参考已有 QuickStart 产物开关 T19/ISSUE-20 的做法）。
  - **(降级) 仅静态回退态 E2E**：无密钥/无 Release 时页面本就走 fallback，E2E 只能验 `sourceFallback`(previewing) pill + 静态锚点跳转；真实数据态的 DOM 断言随 AC8 延后。按工单降级政策，**P0 脚本通过即可判 `[x]`**，DOM 真实态 E2E 延后复验不阻塞本期。

### 不做（架构层确认 YAGNI）
保留工单「明确不做」全部项。**不引入** GitHub release 的本地缓存层 / 分页 / Octokit SDK（裸 `fetch`+ISR 足够，引 SDK 是过度设计）。

### 验收要点对照
AC1/AC2/AC3/AC5/AC6 → `scripts/check-changelog.ts`（P0，硬门禁）；AC3 漂移根治 → P1 helper（建议）；AC4 视觉标记 + AC3 滚动 → P2 E2E（真实态 fixture 开关，否则降级延后）；AC7 → `pnpm test:changelog && pnpm check && pnpm build && pnpm test:e2e` 零退化；AC8 真实密钥联调延后，不阻塞。

## 处理记录
- 2026-06-01 23:30:29 工单创建（feature / P1）
- 2026-06-02 09:35:24 set assignee=backend-engineer
- 2026-06-02 09:35:24 set priority=P1
- 2026-06-02 09:35:24 set status=triaged
- 2026-06-02 09:35:24 LANE: full
- 2026-06-02 09:35:24 EXTRA_ROLES: none
- 2026-06-02 09:38:54 PM细化完成：补全US-1~3与AC1~AC8(真实数据路径fixture验证/RSS同源同序/版本锚一致/prerelease标记/回退不退化/门禁绿)，要点同步03-产品PRD §8 ISSUE-21章节
- 2026-06-02 架构评估完成(tech-architect)：零契约/零数据模型变更→06/07不更新、无迁移。核对4处实现与工单现状一致。开发要点：P0补 scripts/check-changelog.ts+test:changelog(覆盖AC1/2/3/5/6纯逻辑,复用check-github-fallback的stub-fetch范式)；P1建议抽 versionAnchor() 公共helper根治AC3三处锚点硬编码漂移；P2 E2E需测试态fixture开关(Next服务端fetch,Playwright route拦不到)否则按降级政策延后真实态DOM断言。详见本工单「架构评估」节。
- 2026-06-02 09:41:19 set status=in_progress
- 2026-06-02 backend 开发完成（零契约/零数据模型变更，按架构评估 P0+P1+P2 落地）：
  - **P1 锚点 helper（根治 AC3 漂移）**：新增 `lib/changelog-anchor.ts` 导出 `versionAnchor(version)=`v`+version.replace(/\\./g,"-")`；三处硬编码（`components/changelog-entry.tsx` entry id+href、`app/[locale]/changelog/page.tsx` 侧栏 nav href、`app/changelog/rss.xml/route.ts` `<link>`/`<guid>`）全部改调该 helper，输出逐字符等价、`#` 前缀各处自拼不变。从"三处同推导=测试期望"升级为"编译期保证"。
  - **AC2 同源根治**：抽 `lib/changelog-feed.ts`（`collectChangelogFeedItems()`+`sortFeedNewestFirst()`），从 RSS route 原样搬出（feed 输出字节级不变），让页面数据路径与 RSS 可对同一 `getReleases()` 源做对比测试。RSS route 改为薄消费层（仅 sort+序列化）。
  - **P0 硬门禁**：新增 `scripts/check-changelog.ts` + `package.json` `test:changelog`（复用 check-github-fallback 的 stub-fetch 范式，离线无密钥）。注入 5 条 raw release fixture（正式版含 feat/fix/perf/breaking 结构化行+prose、prerelease rc.1、draft 被滤、name===tag 空 body 边界、prose-only 边界），**38 断言全过**覆盖 AC1（version/date/items 按 TAG_ORDER/prose/htmlUrl/prerelease 正确、无 NaN）、AC2（RSS 条数==页面条数、newest-first 序列逐一相等）、AC3（versionAnchor 含 rc 锚一致 + 静态断言三处 import 该 helper 且不再硬编码正则）、AC4（prerelease 标志 true/false 精确）、AC5（!ok/throw → getReleases()===[]、RSS 回退静态 CHANGELOG 条数+version 与 content/changelog.ts 一致）、AC6（空 body/prose-only/name===tag 不抛、items 可空、title undefined）。`.github/workflows/ci.yml` 增 `test:changelog` step（QuickStart sync 后）。
  - **P2 DOM 层 E2E**：新增 `tests/e2e/issue21-t20-changelog.spec.ts`（4 用例）。标准流水线无 token/无 Release → `next start` 跑回退态（真实运行态），实测：AC5 "previewing"(sourceFallback) pill 渲染且无 "live from GitHub" 误称、有静态 entry 不空场；AC3 每条侧栏 nav `#v…` 命中唯一 `article[id="v…"]`（无死链）、点击最旧版本链接后 URL 带 hash 且对应 entry `toBeInViewport`；AC2 `/changelog/rss.xml` 200+`application/rss+xml`、`<guid>` 锚集合与页面 entry id 逐一相等同序。
  - **真实数据态 DOM（sourceLive pill + 预发布 Pill）按 AC8/降级政策延后**：本期无 `GITHUB_TOKEN`、仓库无真实 Release，该两项 DOM 断言已在数据层（test:changelog AC1/AC4）证实，待补密钥+发版后翻真实态复验，不阻塞本期。
  - **自测结果**：`pnpm test:changelog` 38/38 PASS；`pnpm check`（tsc 0 / eslint 0 错(5 warning 在未改动的 toc.tsx) / a11y 26/26 AA / i18n 516=516 parity）exit 0；`pnpm build` rc=0（`/changelog/rss.xml` 仍 `○ Static`、`[locale]/changelog` SSG）；`pnpm test:e2e` **73 passed**（既有 69 回归零退化 + 本工单 4）；`pnpm test:github` 22/22 + `pnpm lint:quickstart` 0/5 失败 回归通过。
  - **改动文件**：新增 `lib/changelog-anchor.ts`、`lib/changelog-feed.ts`、`scripts/check-changelog.ts`、`tests/e2e/issue21-t20-changelog.spec.ts`；改 `components/changelog-entry.tsx`、`app/[locale]/changelog/page.tsx`、`app/changelog/rss.xml/route.ts`、`package.json`、`.github/workflows/ci.yml`。无 schema/接口契约变更（06/07 无需更新，与架构评估一致）。无新增环境变量。
- 2026-06-02 09:51:42 set status=in_review
- 2026-06-02 代码审查完成(code-reviewer)：**通过，建议放行 QA。必改 0 / 已直接修 0 / 建议改 1 / 可选 2**。本机实证复跑(非采信自述)：`tsc --noEmit` 0 错；`pnpm test:changelog` **38/38 全绿**(AC1–AC6)；i18n key(preReleasePill/sourceLive/sourceFallback/githubLink)双语齐备。正确性核实：AC2 同源同序为运行时真一致(页面 versionsSorted 与 RSS sortFeedNewestFirst 同比较器、同 getReleases 源)；P1 锚点 helper 抽取字节等价、rc 锚一致；changelog-feed.ts 为 RSS 逻辑 verbatim 搬迁无行为变更；AC4 预发布 Pill 真实存在；AC5 回退不退化。**建议改①(非阻断)**：`app/sitemap.ts:87` 存在**第 4 处硬编码锚点规则** `#v${version.replace(/\./g,"-")}`，架构评估与 check-changelog.ts 的 AC3 静态扫描只盘点/守 3 处、漏了 sitemap——当前字节等价无运行时 bug，但未来改 helper 会令 sitemap 锚点静默漂移成死锚，恰是 P1「编译期保证」要根治的同类问题留的缺口。未直接修(工单「明确不做」显式冻结 sitemap)，建议紧邻 follow-up：sitemap 改调 versionAnchor() 并加入 check-changelog.ts 的 SITES 数组以闭合 P1。可选②RSS `<title>` 名含版本前缀时重复(既有行为/YAGNI 冻结)；可选③AC2 测试自重排而非断言页面排序(测试盲点)。详见 08-测试报告.md「代码审查 — ISSUE-21」节。放行 QA，不阻塞合并。
- 2026-06-02 09:56:08 set status=verifying
- 2026-06-02 QA 验证结果（qa-automation，本机真实执行，非采信自述）：**VERDICT: PASS**。证据——`pnpm test:changelog` **38/38 PASS**（AC1 version/date/items 排序/prose/htmlUrl/prerelease 正确无 NaN；AC2 RSS 条数==页面条数+newest-first 序列逐一相等+同 getReleases 源；AC3 versionAnchor 单一推导含 rc 锚一致 + 静态扫描三处 import helper 不再硬编码；AC4 prerelease 标志精确；AC5 !ok/throw→getReleases()===[]、RSS 回退静态 CHANGELOG 条数+version 一致；AC6 空 body/prose-only/name===tag 不抛）；`pnpm check` **exit 0**（tsc/eslint 0、a11y 26/26 AA、i18n 516=516）；`pnpm build` 成功（`/changelog/rss.xml` ○ Static、`[locale]/changelog` ● SSG）；`pnpm test:e2e` **73 passed**（含本工单 4 用例 #58–61：AC5 previewing pill 无 live 误称 / AC3 nav→article id 无死链+点击滚动 toBeInViewport / AC2 RSS 200+guid 与页面 entry id 逐一相等；既有 69 零退化）；接口 curl 实测 `/changelog/rss.xml` 200+`application/rss+xml`+`s-maxage=3600`+3 item+guid `v0-7-0/v0-6-0/v0-5-0` newest-first。阻断缺陷 **0**。AC8 真实密钥+发版联调按降级政策延后，不阻塞本期 `[x]`。详见 08-测试报告.md「自动化测试 → ISSUE-21」节。**非阻断 follow-up**（复核代码审查建议①确认成立）：`app/sitemap.ts:87` 第 4 处硬编码锚点 `#v${version.replace(/\\./g,"-")}` 未调 versionAnchor()、未入 check-changelog SITES——当前对静态 CHANGELOG 字节等价无死链（curl 实证），但属 P1 同类漂移缺口；本工单冻结 sitemap 故另开 follow-up 收口，不阻塞合并。测试完成已关闭所有临时服务，无僵尸进程占端口。
- 2026-06-02 VERDICT: PASS
- 2026-06-02 10:00:07 set status=closed
- 2026-06-02 10:00:07 引擎周期#22: QA PASS, 关闭
