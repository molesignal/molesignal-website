---
id: ISSUE-15
type: feature
title: [T14] 内容迁MDX(blog接线)
status: verifying
priority: P1
assignee: fullstack-engineer
created: 2026-06-01
updated: 2026-06-02
---

## 描述
模块:内容迁MDX(blog接线) | 角色:fullstack | 依赖:无 | 里程碑:M2 | 验收:next.config接@next/mdx+remark-gfm;content/blog/*.mdx+lib/content/blog.ts provider(签名不变);现有2篇迁移无丢;改内容不改组件;build过。动内容契约full道 | 详见 07-开发任务拆分.md(T14) 与 06-技术架构.md/READINESS.md

## 需求说明

> PM 细化（2026-06-02，full 道第一棒）。承接 PRD §4.2 **P1-1**「内容可不改代码更新——MDX 接线」+ 07 任务拆分 **T14**。命中红线②（动内容契约）→ full 道。MDX 选型已定（依赖 `@next/mdx`/`@mdx-js/*`/`gray-matter`/`remark-gfm`/`shiki` **均已装**，见 `package.json`），本工单只做"接线 + 迁移"。

### 用户故事
作为 **molesignal 运营**，我想**通过新增/编辑 `content/blog/*.mdx` 文件来更新博客**（而不是改 TS 代码再发版），以便快速发布内容；同时**现有 2 篇文章一字不丢、页面观感零变化**，以便迁移对读者无感。

### 现状（已核实，作为"签名不变"的绳准）
- 内容源：`content/blog.ts` 硬编码 `BLOG_POSTS: BlogPost[]`（2 篇，`body` 为 Markdown-lite 纯文本字符串）。
- **真实导出契约**（被 4 处消费，迁移后必须保持，零改 import）：
  - `BLOG_POSTS: BlogPost[]`
  - `getPostBySlug(slug): BlogPost | undefined`
  - `getRelatedPosts(currentSlug, limit=3): BlogPost[]`
  - `type BlogPost = BlogPostMeta & { body: string }`（`BlogPostMeta` 定义在 `components/blog-post-card.tsx`：slug/title/excerpt/date/author/readTimeMinutes/tags/coverUrl?）
  - 导入路径 **`@/content/blog`**
- **4 处消费方**（迁移后 import 与用法须零改动）：
  1. `app/[locale]/blog/page.tsx` → `BLOG_POSTS`
  2. `app/[locale]/blog/[slug]/page.tsx` → `BLOG_POSTS` / `getPostBySlug` / `getRelatedPosts`，正文渲染 `post.body.split("\n\n").map(p => <p>)`
  3. `app/sitemap.ts` → `BLOG_POSTS`
  4. `app/[locale]/blog/[slug]/opengraph-image.tsx` → `getPostBySlug`

### ⚠️ 工单/上游文档口径纠偏（务必照此实现，勿照抄旧描述）
07-T14 与 06 §3.2 写的是「`lib/content/blog.ts` provider，`getAllPosts()`/`getPost(slug)` 签名不变」——**这是架构师当初的提案，M1 实际落地时并未采用**。真实代码用的是 `@/content/blog` 的 `BLOG_POSTS`/`getPostBySlug`/`getRelatedPosts`。
- 「**签名不变**」的真实含义 = **保持上述真实导出契约与 `@/content/blog` 导入路径不变**，让 4 处消费方零改动。
- **禁止**为了"对齐旧文档"而引入 `getAllPosts`/`getPost` 或迁到 `lib/content/blog.ts` 新路径——那会反而逼改 4 处消费方（= 改组件代码，违反 AC④）。
- 推荐：**原地改造 `content/blog.ts` 的内部实现**（把硬编码数组换成读 `content/blog/*.mdx` + gray-matter 解 frontmatter），导出与路径保持不变。

### 范围边界（T14 只做接线+迁移，富文本渲染是 T15）
- ✅ **本工单 T14 做**：`next.config.ts` 接 `@next/mdx`+`remark-gfm`（基础设施就位，供 T15 用）；新增 `content/blog/*.mdx`（frontmatter = 现 meta 字段，正文 = 现 body）；provider 内部改读 MDX；`build` 过。
- ✅ **`body` 在 T14 仍是 string**：provider 用 `gray-matter` 把 `.mdx` 拆为 `{ data: frontmatter, content: bodyString }`，`BlogPost.body` 取 `content`（仍为字符串）。如此 `blog/[slug]/page.tsx` 现有的 `.split("\n\n")` 段落渲染**零改动**即可工作，页面观感与迁移前一致 → 满足"改内容不改组件"。
- ❌ **本工单不做（属 T15 / P1-2）**：把 body 渲染成富文本（标题/列表/代码块）、代码块接 Shiki 高亮、把 body 从 string 改为 MDX 组件。T15 才会改 `page.tsx` 的渲染层。
- ❌ **本工单不做**：changelog/roadmap 迁 MDX（仅 blog，避免一次动太多，06 §3.2 边界）；ZH blog 内容（`/zh/blog*` 保持现有 `zhUnavailable` 友好提示，属 T21）；新增/删除文章；改任何 meta 字段语义或表单/API/schema。

## 验收标准

> 验证手段：本地 `pnpm build` / `pnpm check` / `pnpm test:e2e` + 浏览器人工核对，**不依赖任何外部 env**。full 道：开发→代码审查→独立 QA。

- **AC1 next.config 接线**：`next.config.ts` 经 `@next/mdx`（`createMDX`/`withMDX`）配置并挂 `remark-gfm`，`pageExtensions` 含 `mdx`（如该机制需要）；`pnpm build` 成功，无 MDX 相关编译告警/报错。
- **AC2 内容迁 MDX**：`content/blog/` 下新增 2 个 `.mdx` 文件（建议文件名 = slug：`why-parquet-for-three-signals.mdx`、`what-we-learned-from-100-incident-reviews.mdx`），每篇 frontmatter 完整含 7 个 meta 字段（slug、title、excerpt、date、author、readTimeMinutes、tags）；正文 = 原 body 全文。
- **AC3 迁移零丢失（逐字核对）**：两篇的 title/excerpt/date/author/readTimeMinutes/tags 与原 `content/blog.ts` **逐字段相等**；body 正文文本与原文**逐段一致**（段落数、顺序、文字不增不减）。提供前后 diff 或脚本佐证。
- **AC4 契约与消费方零改动**：`@/content/blog` 仍导出 `BLOG_POSTS`/`getPostBySlug`/`getRelatedPosts` 且类型签名不变；上述 4 处消费方文件的 import 与调用**一行不改**（git diff 证明 4 文件未改或仅无关格式化）。
- **AC5 provider 行为不变**：`getPostBySlug("why-parquet-for-three-signals")` 返回完整 `BlogPost`（body 非空 string）；`getPostBySlug("不存在")` 返回 `undefined`；`getRelatedPosts(slug,3)` 仍按 tag 交集打分排序返回（两篇互为相关，因 tag 交集为 0 时仍按现逻辑返回降序——与现状一致即可）；`BLOG_POSTS` 仍按数组形态可被 `[...].sort` 与 `.map` 消费。
- **AC6 页面观感不变**：`/en/blog` 列表（featured + 卡片）、`/en/blog/why-parquet-for-three-signals` 详情（meta 行 + 段落正文 + 相关文章）、`/en/blog/what-we-learned-from-100-incident-reviews` 渲染与迁移前**视觉一致**；`/zh/blog` 仍显示 `zhUnavailable` 提示；`generateStaticParams` 仍产出 2 个 slug 的静态页。
- **AC7 SEO/OG 不回归**：`app/sitemap.ts` 仍正确列出 2 篇 blog URL；`blog/[slug]/opengraph-image.tsx` 仍能按 slug 取到 post 生成 OG 图（缺失 slug 走原兜底）。
- **AC8 门禁全绿**：`pnpm check`（typecheck/eslint/a11y:contrast/lint:i18n）+ `pnpm build` + `pnpm lint:links`（blog 内链 2xx）+ `pnpm test:e2e`（既有 blog 相关 E2E 不回归）全通过。
- **AC9 运营可改性自证**：在 `content/blog/` 临时新增 1 篇最小 `.mdx`（仅改内容、不碰任何组件/TS），`pnpm build` 后该文出现在 `/en/blog` 列表且详情页可访问；验证后删除该临时文件（证明"改内容不改代码"成立）。

## 架构复核与开发要点（tech-architect，2026-06-02）

> **结论：契约影响=零，无需迁移脚本。** 这是「内容源机制」变更（硬编码数组→读 MDX 文件），但**对外 TS 导出契约与数据模型 `BlogPost` 完全不变**，4 处消费方零改。已同步纠偏 06-技术架构.md §3.2 + 实施清单（原文档写的 `lib/content/blog.ts`/`getAllPosts` 提案未落地，以本工单真实契约为准）。

### 数据模型 / 接口契约影响
- **`BlogPost` 类型不变**：`BlogPostMeta & { body: string }`，`BlogPostMeta` 仍定义在 `components/blog-post-card.tsx`（slug/title/excerpt/date/author/readTimeMinutes/tags/coverUrl?）。**不动 schema、不动表单/API**。
- **导出契约不变**：`@/content/blog` 仍导出 `BLOG_POSTS`/`getPostBySlug`/`getRelatedPosts`，签名一字不改。`getPostBySlug`/`getRelatedPosts` 内部逻辑**原样保留**（它们只依赖 `BLOG_POSTS` 数组），只换 `BLOG_POSTS` 的「数据来源」。

### 推荐实现路径（关键约束：保持同步、保持数组形态）
1. **`content/blog.ts` 原地改造**：用 `node:fs` + `node:path` **同步**读取 `content/blog/*.mdx`，对每篇 `matter(raw)` 拆出 `{ data, content }`，组装为 `BlogPost`（`...data, body: content.trim()`），在**模块顶层**求值为 `export const BLOG_POSTS: BlogPost[] = [...]`。
   - ⚠️ **必须同步、模块级求值**：`BLOG_POSTS` 被 `generateStaticParams()`（同步）和 `sitemap()`（同步）直接消费，且 `getPostBySlug/getRelatedPosts` 是同步函数——**不可改成 async/不可改成 Promise**，否则破坏 AC4/AC5。用 `readdirSync`/`readFileSync`，不用异步 API。
   - 仅服务端引用（4 消费方均为 RSC/server：page/sitemap/opengraph-image，无 `"use client"`），`fs` 安全，不触客户端边界。
   - **排序**：现状是「文件出现顺序」（数组字面量顺序 = parquet 篇在前、incident 篇在后）。`readdirSync` 返回顺序不保证 = 日期降序，**显式按 `date` 降序排一次**以稳定 `/blog` 列表与 featured 选取，避免观感漂移（AC6）。
2. **frontmatter 字段**：7 个 meta 字段逐字搬入 frontmatter。`tags` 用 YAML 数组；`readTimeMinutes` 是数字（不要加引号，gray-matter 会按 YAML 解析为 number，类型才匹配 `BlogPostMeta.readTimeMinutes: number`）；`date` 用 `YYYY-MM-DD` **加引号**当字符串（避免 YAML 解析成 Date 对象，`BlogPost.date` 必须是 string，否则 `new Date(post.date)` 与 `<time dateTime>` 行为变化）。
3. **`next.config.ts` 接线（AC1，为 T15 铺路）**：用 `@next/mdx` 的 `createMDX({ options: { remarkPlugins: [remarkGfm] } })` 包裹，`pageExtensions` 追加 `'mdx'`，与既有 `withNextIntl` **组合**（两层包裹：`withNextIntl(withMDX(nextConfig))` 或反向，注意 next-intl plugin 需在外层；以 build 通过为准）。
   - ⚠️ AGENTS.md 警告本仓 Next 非训练数据版本（16.2.6）：**动手前先读 `node_modules/next/dist/docs/` 内 MDX/`pageExtensions` 相关文档**，确认 `createMDX` 签名与 `remarkPlugins` 传法（ESM 插件在 `next.config.ts` 里可能需注意 async/序列化约束）。
   - `pageExtensions` 含 `mdx` 只影响 `app/` 下文件是否成为路由；`content/blog/*.mdx` 在 `app/` 外，不会被误当页面，安全。
   - T14 **不需要** MDX 编译来渲染正文——body 仍是 gray-matter 的 `content` 字符串，渲染层 `post.body.split("\n\n")` 零改动。`@next/mdx` 接线纯属基础设施就位，供 T15 用。

### 风险与验证抓手
- **逐字零丢失（AC3）**：迁移后跑一次性脚本/diff 对比新 `BLOG_POSTS` 与旧数组（可临时 `git stash` 旧文件或读 git HEAD 版本）确认 7 字段 + body 逐段相等。body 现含双换行分段，frontmatter 下正文保持原样双换行即可。
- **类型陷阱**：gray-matter `data` 是 `Record<string, any>`，组装时建议显式 `as BlogPostMeta` 或逐字段映射，确保 `tsc --noEmit` 过（AC8）。
- **不做**：不引 `getAllPosts`/`getPost`、不迁 `lib/content/`、不改 4 消费方、不改渲染层、不碰 changelog/roadmap/ZH blog。

## 处理记录
- 2026-06-01 23:30:28 工单创建（feature / P1）
- 2026-06-02 07:32:55 set assignee=fullstack-engineer
- 2026-06-02 07:32:55 set priority=P1
- 2026-06-02 07:32:55 set status=triaged
- 2026-06-02 07:32:55 LANE: full
- 2026-06-02 07:32:55 EXTRA_ROLES: none
- 2026-06-02 PM 细化完成：补全用户故事 + 9 条 AC + 范围边界（T14 接线/迁移 vs T15 富文本）。**关键纠偏**：工单/06/07 写的 `lib/content/blog.ts`+`getAllPosts`/`getPost` 与实际代码不符——真实契约为 `@/content/blog` 的 `BLOG_POSTS`/`getPostBySlug`/`getRelatedPosts`（4 处消费），"签名不变"=保此契约不变、4 消费方零改。`body` 在 T14 仍为 string（gray-matter `content`），渲染层留给 T15。要点同步 03-产品PRD.md §8。
- 2026-06-02 06:38:35 架构复核完成：契约零影响,纠偏 06 文档(lib/content 提案未落地),写入开发要点(原地改造 content/blog.ts+同步读MDX+next.config接线注意点)
- 2026-06-02 07:38:52 set status=in_progress
- 2026-06-02 开发完成（fullstack，full 道开发棒）。**改动**：
  - `next.config.ts`：接 `@next/mdx` `createMDX`+`remark-gfm`（Turbopack 约束 → 插件用字符串名 `"remark-gfm"` 而非导入函数，否则 build 报 "does not have serializable options"），`pageExtensions` 追加 `md/mdx`，与 `withNextIntl` 组合（next-intl 在外层 `withNextIntl(withMDX(nextConfig))`）。
  - `mdx-components.tsx`（新增，根级）：`@next/mdx` App Router 必需，当前空映射（富文本映射留 T15）。
  - `content/blog/*.mdx`（新增 2 篇，文件名=slug）：frontmatter 含 7 个 meta 字段（date 加引号为 string、readTimeMinutes 数字、tags YAML 数组），正文=原 body。**用 gray-matter(js-yaml) stringify 从旧 `BLOG_POSTS` 程序化生成，保证逐字节无损 + 读回保真**。
  - `content/blog.ts`：原地改造——`node:fs` 同步 `readdirSync`/`readFileSync` 读 `content/blog/*.mdx`，`matter()` 拆 frontmatter+body，模块顶层求值 `BLOG_POSTS`，按 date 降序稳定排序；`body=content.trim()`（仍为 string）。**导出契约/路径 `@/content/blog` 与 `getPostBySlug`/`getRelatedPosts` 签名零改，全同步**。
  - `scripts/check-blog-mdx.ts`+`scripts/blog-migration-snapshot.json`（新增）+ `package.json` 加 `test:blog`：AC3 逐字段+body 逐字节对比快照 + AC5 provider 行为守卫。
  - **4 处消费方零改动**（git diff 证明：page.tsx×2 / sitemap.ts / opengraph-image.tsx 无 diff）。
- 2026-06-02 自测全绿（本地，无外部 env）：
  - **AC3+AC5** `pnpm test:blog`：30 项全 ✓（2 篇 ×（7 字段 equal + body byte-exact + 段落数保持）+ provider 行为：数组/排序/已知 slug 非空 body/未知 slug undefined/getRelatedPosts limit/类型 number·string·string[]）。
  - **AC4** `git diff --stat` 4 消费方 = 空。
  - **AC8** `pnpm check`（tsc 0 / eslint 0 / a11y:contrast 26/26 AA / i18n 511=511）+ `pnpm build`（rc=0，`generateStaticParams` 产 2 slug 静态页 `● /en|zh/blog/[slug]`）+ `pnpm lint:links`（0/33 失败，含 2 篇 blog 内链 2xx）+ `pnpm test:e2e`（**66/66 PASS** 零回归）全通过。
  - **AC6** curl 实测：详情页正文首段「When we sketched the data plane」末段「five problems shallower」均渲染、相关文章区显示另一篇；列表页 featured+卡片含两篇标题；`/zh/blog` 仍 EN-only 友好提示。
  - **AC7** `/sitemap.xml` 列出 2 篇 blog URL；`.../opengraph-image` 返回 `200 image/png`。
  - **AC9** 运营可改性自证：临时新增 `content/blog/ac9-temp-operator-check.mdx`（仅内容、零碰组件/TS）→ `pnpm build` 后该篇成 `● /en/blog/ac9-temp-operator-check` 静态页、列表页作 featured 卡显示、详情页 200+正文渲染；验证后删除该临时文件，`build` 恢复 2 篇。
  - **阻塞项**：无。注意点：Turbopack 下 remark 插件必须用字符串名（已处理）；blog 仍 EN-only（ZH 友好提示，属 T21）；body 富文本渲染（标题/列表/代码块/Shiki）属 T15，本工单 body 保持 string。
- 2026-06-02 07:49:31 set status=in_review
- 2026-06-02 代码审查完成（code-reviewer，full 道质量关）。**结论：通过，建议放行 QA。必改 0 / 建议改 1 / 可选 2**。本机实证复跑全绿：`typecheck` 0 错、`lint` 0 error（5 warning 在无关 toc.tsx）、`test:blog` 30/30、`build` Compiled successfully 且 blog/[slug] 产 2 slug 静态页无 MDX 告警。契约零改经 `git diff` 证 4 消费方无 diff；同步+模块级求值、ISO 日期降序排序、frontmatter 类型陷阱均核验正确；next.config `withNextIntl(withMDX())` 组合 + remark 字符串名规避 Turbopack 约束正确。**建议改 1**：`content/blog.ts:37` frontmatter 零校验（运营漏填字段会静默产坏 post），建议加最小校验 throw 定位文件——非当前 bug、属边界外健壮性增强含设计取舍，未自动改。**可选 2**：coverUrl 显式 undefined 键（无害）、提交顺带 ISSUE-14 bookkeeping（无害略不整洁）。亮点：快照逐字节迁移守卫 `check-blog-mdx.ts` 值得长期保留。详见 08-测试报告.md「代码审查 — ISSUE-15」。无必改、不阻断，放行独立 QA 验证。
- 2026-06-02 07:52:57 set status=verifying

## QA 验证结果：通过（qa-automation 独立验证，2026-06-02）

**手段**：本地真实构建 + `next start` 生产服务器（端口 3137）驱动真实页面（HTTP 抓渲染产物），非单元/类型检查。Node v23.6.1 / pnpm 11.5（经 nvm）。

### 运行证据（逐 AC）
- **AC1 next.config 接线** ✅：`pnpm build` → `✓ Compiled successfully`，无任何 MDX 相关告警/报错。`@next/mdx`+`remark-gfm`(字符串名规避 Turbopack)+`pageExtensions` 含 md/mdx 生效。
- **AC2/AC3 迁移内容** ✅：`content/blog/*.mdx` 2 篇被构建采集；渲染产物逐字核对原文——详情页首段「When we sketched the data plane」末段「five problems shallower」、第二篇「Over the holidays we read 100」「tab fatigue」均完整；列表卡 meta 与原数组一致（May 20 2026·9 min / Apr 8 2026·7 min、作者 molesignal team、excerpt 原文）。
- **AC4 契约/消费方零改** ✅：`git diff main...HEAD` 对 4 消费方（blog/page.tsx、blog/[slug]/page.tsx、sitemap.ts、opengraph-image.tsx）= 空 diff。
- **AC5 provider 行为** ✅：已知 slug → 200 且 body 非空渲染；`/en/blog/does-not-exist` → 404（getPostBySlug 返回 undefined 路径）；详情页「Related」区显示另一篇（getRelatedPosts 工作）。
- **AC6 页面观感** ✅：`/en/blog` 列表 featured+卡片含两篇标题与 meta；详情页 meta 行+段落正文+相关文章；`/zh/blog` → 200 显示 EN-only 友好提示（"English"/"英文"）；`generateStaticParams` 产 2 slug × en/zh 静态页。
- **AC7 SEO/OG** ✅：`/sitemap.xml` 含 2 篇 blog URL（why-parquet… / what-we-learned…）；`/en/blog/<slug>/opengraph-image` → `200 image/png`。
- **AC8 门禁** ✅（构建门）：`pnpm build` rc=0 干净（其余 check/e2e 由开发棒已跑 66/66，本次以运行时为准复核构建关）。
- **AC9 运营可改性自证** ✅：临时新增 `content/blog/qa-verify-temp-ac9.mdx`（**仅内容、零碰组件/TS**，`git status` 证仅新增 1 个 untracked mdx）→ `pnpm build` 后该篇成 `● /en/blog/qa-verify-temp-ac9` 静态页 → 服务器实测：列表页出现该卡、详情页 200 且正文「If you can read this paragraph」渲染、原 2 篇无回归；验证后删除临时文件，工作树恢复基线。

### 探针（push-on-it）
- 🔍 操作员误填 frontmatter（漏 slug/title）→ `pnpm build` **硬失败**（`A required parameter (slug) was not provided ... in generateStaticParams`，rc=1），坏内容**进不了发布**，部署门可拦。良性：失败优于静默产坏 post。
- ⚠️ 该构建错误信息**不指明是哪个 .mdx 文件**（仅报 generateStaticParams 收到 undefined）——与代码审查「建议改 1（frontmatter 零校验）」同源。非本工单 bug、不阻断（T14 范围外的健壮性增强，留作后续），但运营定位坏文件会有摩擦。

### 收尾
进程/端口已清理（3137 free、无残留 next start）；临时探针文件已删；工作树仅 ISSUE-15.md（本记录）变更。无僵尸进程。

**VERDICT: PASS**
