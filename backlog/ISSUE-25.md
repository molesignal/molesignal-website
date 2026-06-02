---
id: ISSUE-25
type: feature
title: [T24] 内容运营工作流文档
status: verifying
priority: P2
assignee: fullstack-engineer
created: 2026-06-01
updated: 2026-06-02
---

## 描述
模块:内容运营工作流文档 | 角色:fullstack | 依赖:T14 | 里程碑:M3 | 验收:blog/changelog/roadmap更新文档与模板 | 详见 07-开发任务拆分.md(T24) 与 06-技术架构.md/READINESS.md

## 需求说明
模块:内容运营工作流文档（T24，M3/P2）。为 blog/changelog/roadmap 三套内容系统提供**运营更新文档 + 可复制模板**，使运营"改内容不改组件"。纯文档任务，零代码/schema/API 改动。

## 验收标准
- ① blog/changelog/roadmap 更新文档：每套含数据源、字段约定、更新步骤、发布前自检、边界。✅
- ② 三套各配一份可复制模板。✅

## 改动与自测（fullstack，2026-06-02）
**LANE: light（纯文档，零代码改动）**

产出文件（全部新增，均在 `docs/ops/`，不进站点导航/不计 i18n parity）：
- `docs/ops/content-workflow.md` —— 主运营手册：§0 一页速览表 + §1 Blog（`content/blog/*.mdx`，frontmatter 字段表，发布步骤，常见坑）+ §2 Changelog（双源模型：GitHub Release 首选 / `content/changelog.ts` 兜底预览，RSS 同源）+ §3 Roadmap（`content/roadmap.json`，phase 分桶，字段表）+ §4 发布前检查清单 + §5 边界与维护约定。
- `docs/ops/templates/blog-post.mdx.template` —— blog 文章模板（frontmatter + MDX 正文示例）。
- `docs/ops/templates/changelog-entry.ts.template` —— 静态 CHANGELOG 条目对象模板。
- `docs/ops/templates/roadmap-item.json.template` —— roadmap 单项 JSON 模板。

关键设计决策：
- 模板**不放 `content/blog/`**——blog loader（`content/blog.ts`）扫描该目录所有 `.mdx` 当真文章，故模板用 `.mdx.template` 扩展名放 `docs/ops/templates/`，不会被加载（已验证 blog 目录仍只有 2 篇真文章）。
- 文档断言均对照源码核实：blog 契约（`BLOG_POSTS`/`getPostBySlug`/`getRelatedPosts` 同步）、changelog 双源（`lib/changelog-feed.ts` getReleases→静态兜底、`lib/changelog-anchor.ts` 锚点）、roadmap（`components/roadmap-list.tsx` 按 phase 分桶 + URL hash 用 phase 非 id、`id` 实为 React list key）——纠正了 id 用途的初稿误述。

自测（PATH 经 nvm node v23.6.1）：
- `pnpm typecheck` rc=0
- `pnpm build` rc=0（changelog/rss.xml/sitemap/blog SSG 全正常产出）
- `pnpm test:blog` PASS（全绿，blog 目录未被模板污染）
- `pnpm test:changelog` PASS（RSS 同源 + 兜底断言全过）

阻塞项：无。

## 处理记录
- 2026-06-01 23:30:29 工单创建（feature / P2）
- 2026-06-02 11:10:28 set assignee=fullstack-engineer
- 2026-06-02 11:10:28 set priority=P2
- 2026-06-02 11:10:28 set status=triaged
- 2026-06-02 11:10:28 LANE: light
- 2026-06-02 11:10:28 EXTRA_ROLES: none
- 2026-06-02 11:10:43 set status=in_progress
- 2026-06-02 11:14:57 set status=in_review

## 代码审查（code-reviewer，2026-06-02）

**结论：建议放行到 QA**（纯文档工单，零代码/契约改动；文档断言逐条对照源码核实，准确度高）。

审查范围：`git diff main...feature/ISSUE-25`（1 个文档 + 3 个模板，266 行新增）。

### 契约/正确性核实（逐条对照源码，全部相符）
| 文档断言 | 核对源 | 结论 |
|---|---|---|
| blog loader 同步扫描 `content/blog/*.mdx`、gray-matter、按 date 降序、`BLOG_POSTS`/`getPostBySlug`/`getRelatedPosts` 契约 | `content/blog.ts` | ✅ 完全相符 |
| frontmatter 字段表（8 字段，仅 `coverUrl` 可选） | `components/blog-post-card.ts` `BlogPostMeta` | ✅ 相符（`coverUrl?` 可选，余必填） |
| changelog 双源：`getReleases()`→静态 `CHANGELOG` 兜底；RSS 与页同源同序 | `lib/changelog-feed.ts` `collectChangelogFeedItems` | ✅ 相符 |
| draft 被过滤、prerelease 保留并标记 | `lib/github.ts` `getReleases`（`.filter(r=>!r.draft)`、保 `prerelease`） | ✅ 相符 |
| 解析器识别 `feat/fix/perf/chore/breaking` 前缀 | `lib/parse-release.ts` `LINE_RE`/`normalizeTag` | ✅ 相符 |
| 锚点 `"0.8.0"`→`#v0-8-0`（version 不带 v，锚点自动加） | `lib/changelog-anchor.ts` `versionAnchor` | ✅ 相符 |
| changelog item 形状 `{version,date,title,items:[{tag,text}]}`，tag 枚举 | `components/changelog-entry.tsx` `ChangelogMeta`/`ChangelogTag` | ✅ 相符 |
| roadmap 按 `phase` 分桶、URL hash 用 phase（非 id）、`id` 为 React list key | `components/roadmap-list.tsx`（`#${phase}`、`key={m.id}`） | ✅ 相符（已纠正初稿 id 用途误述） |
| roadmap 字段表（`issueUrl` 为 JSON `null`） | `content/roadmap.json` + 组件 `Milestone` 类型 | ✅ 相符 |
| 自检脚本 `test:blog`/`test:changelog`/`typecheck`/`build`/`lint:links`/`lint:quickstart`/`check` | `package.json` scripts | ✅ 全部存在 |
| CI 步骤（check+build+lint:links+lint:quickstart+e2e） | `.github/workflows/ci.yml` | ✅ 相符（CI 另含 `test:changelog`，文档未列，无害） |
| 引用文档 `docs/ops/data-export.md` | 文件存在 | ✅ |
| 模板放 `docs/ops/templates/` 用 `.mdx.template` 不污染 blog loader | blog 目录仍 2 篇真文章 | ✅ 已验证 |

### 发现与处置
- **[已修·建议改] 交叉引用章节号错误**：`docs/ops/templates/changelog-entry.ts.template` 注释 "see content-workflow.md §3" 应为 **§2**（双源模型在 §2，§3 是 Roadmap）。审查员已 Edit 修正并提交。
- **[可选·风格] 非标准 commit type**：手册 §2.3/§3.5 示例用 `content(changelog):`/`content(roadmap):` 作 commit type，项目 Git 规范（CLAUDE.md）的类型集为 `feat/fix/refactor/test/chore`（+docs）。若 repo 配了 commitlint 可能被拒。建议改用 `docs(...)`/`chore(...)` 或在规范中正式登记 `content` 类型。非阻塞，留作后续。

### 提交规范
- 分支提交 `docs(ISSUE-25): T24 ...` —— Conventional Commits 合规、含工单号。✅

**必改问题数：0**（唯一明确错误的章节号已由审查员直接修复）。建议放行 QA。
- 2026-06-02 11:17:24 set status=verifying

## QA 验证结果（qa-automation，2026-06-02，light 道 · 纯文档工单）

**环境**：PATH 经 nvm node v23.6.1 / pnpm 11.5.0；feature/ISSUE-25 分支。纯文档/模板工单，零代码·零 schema·零 API 改动 → 无服务可起、无 UI 可走 E2E；验证 = 产物完整性 + 文档断言对照源码核实 + 回归套件真实执行。

### 1. 产物完整性（验收逐条核对）
- **验收①「blog/changelog/roadmap 更新文档，每套含数据源/字段约定/更新步骤/发布前自检/边界」— ✅ PASS**
  `docs/ops/content-workflow.md`（9.8KB）实测含：§0 一页速览表；§1 Blog（数据源+8 字段表+发布步骤+常见坑）；§2 Changelog（双源模型+方式A/B+字段+自检）；§3 Roadmap（数据源+6 字段表+步骤）；§4 发布前总检查清单；§5 边界与维护约定。五要素三套齐备。
- **验收②「三套各配一份可复制模板」— ✅ PASS**
  实测三份模板均存在且非空：`docs/ops/templates/blog-post.mdx.template`(1198B) / `changelog-entry.ts.template`(978B) / `roadmap-item.json.template`(773B)。

### 2. 文档断言对照源码（抽样复核，全部相符）
| 文档断言 | 核对源 | 结论 |
|---|---|---|
| blog loader 同步扫描 `content/blog/*.mdx`、gray-matter、date 降序、`BLOG_POSTS`/`getPostBySlug`/`getRelatedPosts` 同步契约 | `content/blog.ts:29-76` | ✅ 逐行相符 |
| 模板不污染 blog loader（目录仅 2 篇真文章） | `content/blog/` 实测 2 个 `.mdx`；`test:blog` 断言 length 匹配快照 | ✅ |
| changelog item 形状 `{version,date,title,items:[{tag,text}]}` | `content/changelog.ts` | ✅ 相符 |
| version 不带 `v` 前缀，锚点 `"0.8.0"`→`#v0-8-0`；保留前导 v、点→横杠 | `lib/changelog-anchor.ts:20-22` `versionAnchor` | ✅ 相符 |
| roadmap 按 `phase` 分桶、`id` 为列表项标识键 | `content/roadmap.json` + 组件契约 | ✅ 相符 |
| 模板交叉引用 §2（changelog 双源模型）非 §3 | `changelog-entry.ts.template:6` 实测为 §2 | ✅ 审查员修正已落实 |

### 3. 回归套件真实执行（退出码客观佐证）
- `pnpm typecheck` — **rc=0**
- `pnpm test:blog` — **rc=0**（全绿：AC1~AC5 含 BLOG_POSTS 数组/快照长度/newest-first 排序/字段类型；blog 目录未被模板污染）
- `pnpm test:changelog` — **rc=0**（全绿：版本锚点正/反例、versionAnchor 三处调用、`getReleases()` 失败→静态 CHANGELOG 兜底且不捏造）
- `pnpm build` — **rc=0**（生产构建成功，blog SSG / `/changelog/rss.xml` / sitemap 全正常产出）

### 4. 缺陷
阻断级 0 / 一般 0。（审查员遗留的「非标准 commit type 示例」为可选风格项，非阻塞，不影响验收。）

### 5. 回归套件重跑命令
```bash
export PATH="$HOME/.nvm/versions/node/v23.6.1/bin:$PATH"
pnpm typecheck && pnpm test:blog && pnpm test:changelog && pnpm build
```

### 6. 放行建议
两项验收标准客观满足，文档断言与源码一致，回归四件套 rc 全 0，无阻断缺陷。**建议放行合并。** 测后无遗留进程（本工单未起任何服务）。

**QA 验证结果：通过**
VERDICT: PASS
