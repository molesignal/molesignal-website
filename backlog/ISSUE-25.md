---
id: ISSUE-25
type: feature
title: [T24] 内容运营工作流文档
status: in_progress
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
