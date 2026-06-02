---
id: ISSUE-16
type: feature
title: [T15] Blog富文本渲染
status: closed
priority: P1
assignee: frontend-engineer
created: 2026-06-01
updated: 2026-06-02
---

## 描述
模块:Blog富文本渲染 | 角色:frontend | 依赖:T14 | 里程碑:M2 | 验收:body经MDX渲染富文本;代码块复用Shiki;相关文章按tag工作 | 详见 07-开发任务拆分.md(T15) 与 06-技术架构.md/READINESS.md

## 需求说明


## 验收标准


## 处理记录
- 2026-06-01 23:30:28 工单创建（feature / P1）
- 2026-06-02 07:59:42 set assignee=frontend-engineer
- 2026-06-02 07:59:42 set priority=P1
- 2026-06-02 07:59:42 set status=triaged
- 2026-06-02 07:59:42 LANE: light
- 2026-06-02 07:59:42 EXTRA_ROLES: none
- 2026-06-02 07:59:57 set status=in_progress
- 2026-06-02 实现完成（frontend-engineer / light 道开发环）

### 改动说明（T15 Blog 富文本渲染）

**契约遵守**：`@/content/blog` 的 `BLOG_POSTS`/`getPostBySlug`/`getRelatedPosts` 与 `body: string` 契约保持不变；富文本渲染在「页面消费层」完成，body 仍是字符串（T14 的 provider 形态零改），4 处消费方接口未动。

**实现方式**：blog body（Markdown/MDX 字符串）经 `@mdx-js/mdx` 的 `evaluate` 在构建/SSG 期编译为 React 树渲染。元素映射到 marketing 设计系统组件，代码块复用既有 Shiki（`lib/shiki.ts` / `CodeBlock`）做双主题高亮。`new Function`（MDX evaluate 内部）仅作用于一方内容（仓库内 `content/blog/*.mdx`），仅在 Node SSG 期执行，无用户输入流入——MDX 既定可信模型，已在组件注释说明。

**改动文件**：
- `package.json` —— 新增 dep `@mdx-js/mdx@^3.1.1`（运行时 MDX 编译）。
- `components/blog/mdx-prose.tsx`（新）—— 富文本元素样式映射：h1–h4 / p / ul·ol·li / blockquote / strong·em / hr / 行内 `code` 芯片 / 链接（内链走 next-intl `Link` 保 locale，外链 `target=_blank rel=noopener`）/ `pre`→Shiki `CodeBlock`（拦截围栏代码块，提取 lang+源码）。
- `components/blog/mdx-body.tsx`（新）—— async server component，`evaluate(body, {remark-gfm})` + 共享映射渲染。
- `mdx-components.tsx` —— `useMDXComponents` 接入共享映射（文件式 MDX 与运行时 MDX 渲染一致）。
- `app/[locale]/blog/[slug]/page.tsx` —— 正文从 `body.split("\\n\\n")→<p>` 改为 `<MdxBody source={post.body} />`。
- `lib/shiki.ts` —— 新增 `resolveLanguage()`（未知/拼错的语言标签回退 bash，永不抛）+ `highlight` try/catch 兜底回退 text。
- `content/blog/*.mdx`（2 篇）—— 补 Markdown 结构（小标题 / 列表 / 行内 code / 一段 SQL 代码块）以真实演练富文本（incident 篇原本就含一个被旧渲染器破坏的列表，现正确渲染）。
- `scripts/blog-migration-snapshot.json` —— 按 T15 富化后内容重生成（仍逐字节守护正文稳定）；`scripts/check-blog-mdx.ts` 头注释同步更新用途。
- `tests/e2e/issue16-t15-blog-richtext.spec.ts`（新）—— 3 条 T15 守卫。

**验收对照**：
- AC① body 经 MDX 渲染富文本（标题/列表/代码块）：✅ 预渲染 HTML 实测含真实 `<h2>`、`list-disc <ul><li>`、行内 `<code>` 芯片、围栏代码块。
- AC② 代码块复用 Shiki：✅ 输出 `<pre class="shiki shiki-themes vitesse-light vitesse-dark">`、`data-language="sql"`、SQL token 着色，复用既有 `CodeBlock`+copy 按钮。
- AC③ 相关文章按 tag 仍工作：✅ `getRelatedPosts` 未改、E2E 验证 Related posts 区渲染兄弟文章；`test:blog` 守 provider 契约。

**自测结果（本机，pnpm via nvm v23.6.1）**：
- `pnpm check`：exit 0（tsc 0 / eslint 0 error，5 warning 均为未改动 TOC 既有项 / a11y 26/26 AA / i18n parity 511=511）。
- `pnpm build`：exit 0，2 slug × 2 locale 静态页正常生成。
- `pnpm test:blog`：全绿（meta 逐字段 + body 逐字节 + provider 行为）。
- `pnpm lint:links`：0/33 失败（对 next start 实跑）。
- `pnpm test:e2e`：**69 passed**（既有 66 回归零退化 + 新增 T15 3 条）。

**遗留 / 观察（非阻塞）**：
- 运营若在 .mdx 写入 MDX 敌意语法（裸 `<`、`{`）会在 build 期硬失败（MDX 严格性，内容为一方可信）；可日后加 frontmatter/正文 lint。
- blog 仍 EN-only（ZH 友好提示，属 M3/T21 决策范畴，未触碰）。
- 2026-06-02 08:12:32 set status=in_review

### 代码审查结论（code-reviewer, 2026-06-02）
**通过，建议放行 QA。必改 0（1 项已直接修复）/ 建议改 1 / 可选 2。** 详见 08-测试报告.md「代码审查 — ISSUE-16」。
- **已直接修（原属必改）**：`lib/shiki.ts` `resolveLanguage` 的 `lang in bundledLanguages` 会命中 `Object.prototype` 继承键（`toString`/`constructor`/`valueOf`），以这些词作代码围栏语言标签会被误判合法、传入 `codeToHtml` 抛错（仅靠 try/catch 兜底）并错标 `data-language`。改用 `Object.hasOwn`，别名（js/ts）行为不变、原型键正确回退 bash。提交 `fix(ISSUE-16)`，typecheck 0 错 + node 实测验证。
- **契约**：provider（`content/blog.ts`/`body:string`/`getRelatedPosts`）零改，富文本在消费层完成，4 消费方未触碰——AC3 相关文章按 tag 仍工作。
- **实证复跑**：`pnpm typecheck` 0 错、`pnpm test:blog` 全绿（快照逐字节守护）。E2E 留 QA 环执行（自述 69 passed）。
- **建议改/可选（非阻断）**：`extractCode` 对 `pre` children 形态的隐含约定可加数组兜底；`ProseLink` 双分支 className 可抽常量；修复后 `highlight` catch 近乎不可达（保留无害）。
- 放行建议：**可进入 QA 验证。**
- 2026-06-02 08:17:11 set status=verifying

### QA 验证结果（qa-automation, 2026-06-02）
**VERDICT: PASS** —— 真实生产构建 + 真实浏览器(Chromium/Playwright)驱动，三条验收标准全部满足。

**环境**：`pnpm build` (Next.js 16.2.6, RC=0, blog 2 slug×SSG 正常生成) → `pnpm start` PORT=3399 → curl 接口断言 + Chromium headless 实驱 + 截图。node v23.6.1/pnpm 11.5.0 (nvm)。注：`/en/...` 经 next-intl middleware 307→`/blog/...`（en 为默认 locale 无前缀），属预期路由行为。

**AC① body 经 MDX 渲染富文本 —— ✅**
- parquet 篇（浏览器实测）：正文 `<article>` 内 3×`<h2>`、1×`<ul class="list-disc">`(3 li)、行内 code 芯片、段落均真实渲染；全页截图 `/tmp/issue16-parquet-full.png` 可见标题/标签/小标题/列表/代码块/Related 完整版式。
- incident 篇（曾被旧渲染器破坏的列表）：2×`<h2>` + 1 项目符号列表正确渲染。

**AC② 代码块复用 Shiki —— ✅**
- SQL 块输出 `<pre class="shiki shiki-themes vitesse-light vitesse-dark">`，原始 HTML 含 `data-language="sql"`、双主题 token 变量 `--shiki-light/--shiki-dark`；浏览器内测得 27 个着色 token span；截图 `/tmp/issue16-shiki-block.png` 可见 SELECT/FROM/WHERE 关键字着色；Copy 按钮存在。

**AC③ 相关文章按 tag —— ✅**
- parquet 篇底部 "Related posts" 区渲染，含兄弟文章卡片链接 `/blog/what-we-learned-from-100-incident-reviews`（getRelatedPosts 按 tag 命中）。

**探针（happy-path 之外）**：
- 🔍 未知 slug `/blog/this-slug-does-not-exist` → HTTP 404（notFound 生效）。
- 🔍 `/zh/blog/...` → 200，渲染 EN-only 友好提示「Blog 在 v1 仅英文。阅读英文版 →」+ 指向 EN 版链接（属既定 M3/T21 决策，非缺陷）。
- 🔍 代码审查已直接修复的 `resolveLanguage` 原型键回退（Object.hasOwn）：当前 content 无原型键语言标签，未能在真实页面触发该路径；逻辑由 commit 71b20ac 的 node 实测 + 单元守卫覆盖，本环以 SQL 块实跑确认正常语言走通。

**观察（非阻塞）**：
- DOM 上 `data-language` 属性挂在 CodeBlock 外层包裹元素而非 `<pre.shiki>` 本身（locator 直查 pre 的该属性为 null，但原始 HTML grep 确认 `data-language="sql"` 存在）——不影响渲染，仅记录。

**缺陷**：0 阻断 / 0 一般。
**放行建议**：PASS，可合并回 main。
- 2026-06-02 QA 验证 PASS（qa-automation）

VERDICT: PASS
- 2026-06-02 08:21:09 set status=closed
- 2026-06-02 08:21:09 引擎周期#17: QA PASS, 关闭
