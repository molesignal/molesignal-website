---
id: ISSUE-22
type: feature
title: [T21] Blog中文支持
status: in_progress
priority: P2
assignee: fullstack-engineer
created: 2026-06-01
updated: 2026-06-02
---

## 描述
模块:Blog中文支持 | 角色:fullstack | 依赖:T14 | 里程碑:M3 | 验收:/zh/blog渲染中文或明确EN-only(需用户拍板);若做sitemap补hreflang | 详见 07-开发任务拆分.md(T21) 与 06-技术架构.md/READINESS.md

## 需求说明

### 背景与现状（已核实）
- **PRD 原设计**：§1 目标用户表明确「全站 ZH 镜像，**blog 除外，EN-only**」；§7 开放问题 #7 标注「需用户确认是否本期改变该 EN-only 决策」。
- **代码现状**：`/zh/blog`（`app/[locale]/blog/page.tsx`）与 `/zh/blog/[slug]`（`.../[slug]/page.tsx`）**已实现** `locale === "zh"` 友好不可用提示，渲染 `t("blog.zhUnavailable")` + 一个跳英文版的链接；`messages/{en,zh}.json` 均有 `blog.zhUnavailable` 键。
- **sitemap 现状**：`app/sitemap.ts` 中 blog 列表与文章**已是 EN-only**（不带 `alternates`/hreflang，不向 SEO 宣告 ZH blog）。
- **内容现状**：`content/blog/*.mdx` 仅 2 篇英文（`why-parquet-for-three-signals`、`what-we-learned-from-100-incident-reviews`），**无任何中文译稿**；T14（MDX 接线）/T15（富文本）已 closed，但 provider 契约（`BLOG_POSTS`/`getPostBySlug`/`getRelatedPosts`）**无 locale 维度**。

### 本期决策（PM 推荐 · 待用户可随时翻案）
> 用户拍板询问已发起但被跳过，按 PRD §1 原设计 + 本期「精简·诚实内容」政策 + P2 最低优先级，PM 采用与本期其余「需用户拍板」项一致的稳妥默认：

**本期明确保留 Blog EN-only，不做中文正文**；范围聚焦于**把现有 ZH 不可用提示打磨到位并补客观验收**，确保「策略明确 + 友好提示 + 零死链 + SEO 一致」。完整 ZH blog 管线作为**已就绪的延后 scope**（见末节），用户日后翻案即可低成本启动。

**理由**：① PRD §1 原设计即 EN-only；② 仅 2 篇英文、无译稿，做 ZH 等于引入「翻译 2 篇 + 持续翻译运营 + 扩内容契约 + per-locale 相关文章 + hreflang」一整条链，与 P2/精简政策不符；③ 现状已基本实现，本期只需补齐验收闭环，性价比最高；④ 决策可逆，翻案路径已写明。

### 用户故事
- **US-1（本期做 · 核心）**：作为**中文读者**访问 `/zh/blog` 或 `/zh/blog/[slug]`，我想看到清晰友好的「暂仅英文」提示并能一键到英文版，以便不困惑、不撞死链。
- **US-2（本期做 · SEO 一致性）**：作为**搜索引擎**，我不应在 sitemap / hreflang 中发现被声明却不存在的 `/zh/blog*` 页面，以便不产生软 404 / 重复内容信号。
- **US-3（本期做 · 决策落档）**：作为**团队成员**，我想在 PRD/工单看到「本期 EN-only」的明确决策、理由与未来开启 ZH blog 的就绪路径，以便后续可低成本翻案。
- **US-4（本期不做 · 归延后 scope）**：作为**中文读者**，我想读到中文 blog 正文 —— 见「延后 scope（翻案路径）」，本期不交付。

## 验收标准

> 本期范围 = EN-only 提示打磨 + SEO 一致 + 决策落档。以下 AC1–AC7 为本期验收；AC8 为翻案后复验占位。

- **AC1**：`/zh/blog` 渲染友好提示（`blog.zhUnavailable` 文案），含明确「阅读英文版 →」链接指向 `/blog`（EN locale）；点击 HTTP 200 落到英文 blog 列表页，非死链。
- **AC2**：`/zh/blog/[slug]` 对**任意** slug（含**不存在**的 slug）都渲染友好提示且**不产生死链**——提示内链接须安全：当 slug 在 `BLOG_POSTS` 存在时可深链到该文英文版 `/blog/[slug]`（200），**当 slug 不存在时回退指向 `/blog` 列表**（避免现状「`/zh/blog/不存在` → 提示里链到 `/blog/不存在`(404)」的潜在死链）。
- **AC3**：`messages/{en,zh}.json` 均有 `blog.zhUnavailable` 且语义一致（ZH 文案给中文读者读、EN 文案兜底），`lint:i18n` parity 不破（键结构对齐无缺口）。
- **AC4**：提示页视觉与全站 UI token 一致（复用 `Section`/标题/`Pill` 等既有样式），明暗双主题无崩坏；a11y 达标（链接有可达文本、对比度 AA，`a11y:contrast` 通过）。
- **AC5**：`app/sitemap.ts` **不含**任何 `/zh/blog` 或 `/zh/blog/[slug]` 条目，且 blog 相关条目**不带声明 `zh` 的 hreflang `alternates`**（不向 SEO 宣告不存在的 ZH 页）；`pnpm lint:links` 全 2xx、全站 blog 链路无死链。
- **AC6**：在 `/blog` 或 `/blog/[slug]` 上用 LocaleSwitcher 切到 ZH，落到对应 `/zh/blog*` 友好提示页（而非 404 / 空白），切换不报错、保留滚动行为（呼应已实现的 `scroll:false` 守卫）。
- **AC7**：**不回归**——`/blog`、`/blog/[slug]` 的英文富文本渲染（T15 Shiki/MDX）、相关文章（`getRelatedPosts`）、CodeBlock 复制照常工作；`pnpm check`（tsc/eslint/a11y/i18n）+ `build` + `test:e2e` 全绿，新增/修改的 ZH 提示路径有 E2E 守卫。
- **AC8（延后复验占位）**：若用户日后拍板做 ZH blog，则按下节「延后 scope」执行并对**有 ZH 译稿**的文章补 hreflang alternates；本期不阻塞。

## 延后 scope（翻案路径 · 本期明确不做，留作未来工单依据）

> 用户若改判「做中文 blog」，按此最小化清单展开（命中红线②动内容契约 → **必须 full 道**）：
1. **per-locale 内容管线**：`content/blog/<slug>.{en,zh}.mdx` 或 `content/blog/{en,zh}/<slug>.mdx`；provider 增 locale 维度（`getPostBySlug(slug, locale)`、按 locale 取 `BLOG_POSTS`），需评估 4 处消费方（index/[slug]/sitemap/opengraph-image）的契约扩展。
2. **翻译现有 2 篇** + 运营持续翻译工作流（与 T24 内容运营文档合并）。
3. **相关文章按 locale 过滤**（`getRelatedPosts` 加 locale）。
4. **`/zh/blog` 列表**渲染 ZH 文章；**缺译稿**的文章在 ZH 列表降级提示或回退英文，逐篇而非全局 EN-only。
5. **sitemap 补 hreflang**：仅对**有 ZH 译稿**的文章补 `en/zh/x-default` alternates；无译稿文章保持 EN-only（避免宣告不存在页）。
6. **明确不做（即使做 ZH blog）**：不引入机器翻译自动生成正文（质量不可控，与「诚实内容」原则冲突）。

## 优先级 / 道次说明（供 orchestrator）
- 优先级 **P2**（M3 体验增强），非红线、非上线底线。
- **本期 EN-only 路径不动内容契约 / 不动 schema / 不动 API**，按红线判定**可降 LANE: light**（开发→代码审查→独立 QA 三环仍全做不可省）。当前工单标记 `LANE: full` + `EXTRA_ROLES: ux-designer,ui-designer` 系翻案场景下的保守预设；EN-only 提示打磨界面改动极小，**ux/ui 可最小介入或省略**，最终道次/增派由 orchestrator 依本决策复核。
- 若用户翻案做 ZH blog → 命中红线②，**必须 full 道**并按上节展开。

## UX 评估（ux-designer · 2026-06-02）

> 本期仅涉及「EN-only 提示打磨」，界面改动极小，无需新流程/新页面设计。以下为针对两处提示页的具体交互规范，供开发直接参考。

### 现状问题（两处，均影响 AC4 a11y）

1. **标题含不可点的 CTA 箭头**：`zhUnavailable` 文案（"Blog 在 v1 仅英文。阅读英文版 →"）结尾的 `→` 和"阅读英文版"暗示可点击，但实际是纯文字标题；真正的链接在下方另一行，形成混淆。
2. **链接文本为 URL 路径**：两处提示页的链接文字均直接展示 URL 路径（`/blog →`、`/blog/slug →`），非描述性文本，屏幕阅读器朗读效果差，违反 AC4 可达文本要求。

### 交互规范（最小改动）

**文案润色（可选，润色保持 parity）**

| 键 | 当前 ZH | 建议 ZH | 当前 EN | 建议 EN |
|---|---|---|---|---|
| `blog.zhUnavailable` | Blog 在 v1 仅英文。阅读英文版 → | Blog 目前仅支持英文版 | Blog is English-only in v1. Read the English version → | Blog is currently English-only |
| `blog.zhReadEnglish`（新增） | — | 阅读英文版 Blog → | — | Read the English Blog → |
| `blog.zhReadEnglishPost`（新增） | — | 阅读该文章英文版 → | — | Read this post in English → |

> 新增键须同步写入 `messages/{en,zh}.json`，保持 `lint:i18n` parity。若开发认为新增键成本偏高，可退化为 JSX 硬编码描述性文本（见下方备注）。

**列表页 `/zh/blog`（`app/[locale]/blog/page.tsx` 第 34–49 行）**

```
Section padding="lg"
  div mx-auto max-w-xl text-center space-y-4
    h1 [text-display-md font-display-strong tracking-tighter]
       {t("blog.zhUnavailable")}                    ← 纯通知，无箭头
    p
      Link href="/blog" locale="en"
           className="text-primary hover:text-marketing-accent text-sm font-strong"
        {t("blog.zhReadEnglish")}                   ← 描述性链接文本，非 URL 路径
```

**详情页 `/zh/blog/[slug]`（`app/[locale]/blog/[slug]/page.tsx` 第 53–71 行，含 AC2 死链守卫）**

```
Section padding="lg"
  div mx-auto max-w-xl text-center space-y-4
    h1 [text-display-md font-display-strong tracking-tighter]
       {t("blog.zhUnavailable")}
    p
      const exists = getPostBySlug(slug)            ← 已 import，零新依赖（架构师已明确此改法）
      const href   = exists ? `/blog/${slug}` : "/blog"
      const label  = exists ? t("blog.zhReadEnglishPost") : t("blog.zhReadEnglish")
      Link href={href} locale="en"
           className="text-primary hover:text-marketing-accent text-sm font-strong"
        {label}
```

> 若不加新 i18n 键，退化方案：`label = exists ? "阅读该文章英文版 →" : "阅读英文版 Blog →"` 硬编码（中英双语保一致即可；此文案无需用户按语言区分，提示页已是 ZH 分支）。

### 视觉/样式

- 复用既有 `Section` / `text-display-md` / `font-display-strong` / `text-primary` / `hover:text-marketing-accent` token，**无任何新视觉需求**，不需 UI 设计师介入。
- 明暗双主题由现有 token 保证，无需额外处理。
- 链接对比度 AA 验证由 QA 在 `a11y:contrast` 中覆盖（既有门禁）。

### a11y 要点

- 链接文本改为描述性后，`aria-label` 无需额外添加，自然满足 AC4 可达文本。
- 标题不含可操作语义，屏幕阅读器阅读流顺畅（通知→操作，而非操作嵌入通知）。

### 给开发的总结

唯一功能改动：`[slug]/page.tsx` ZH 分支加 `getPostBySlug(slug)` 存在性守卫（架构师已明确代码示例）。文案润色与新 i18n 键为可选项。其余结构保持不变，不引入任何新组件或新路由。

## UI 评估（ui-designer · 2026-06-02）

### 结论：无新视觉需求，token 对齐已验证，UI 设计师不需介入

在读取现有代码（`app/[locale]/blog/page.tsx:33-51`、`app/[locale]/blog/[slug]/page.tsx:53-72`）与 `05-UI设计.md` 设计系统后，逐条核验如下：

#### Token 合规性核查

| Token | 代码现状 | 05-UI设计.md 规格 | 合规 |
|---|---|---|---|
| `Section padding="lg"` | 两处提示页均已用 | 标准容器组件，适用于独立内容区 | ✓ |
| `max-w-xl text-center space-y-4` | 已用 | 居中通知布局，与「精简/诚实」调性一致 | ✓ |
| `text-display-md font-display-strong tracking-tighter` | h1 已用 | Display 阶梯 h1 用法，正确 | ✓ |
| `text-primary` | Link 默认态 | 对应品牌色（Teal），链接用主品牌色符合规范 | ✓ |
| `hover:text-marketing-accent` | Link 悬停态 | 对应营销强调色，用于 CTA hover 符合规范；悬停不作主文字，大字号语境满足对比度豁免 | ✓ |
| `text-sm font-strong` | Link 字重/字号 | 次级操作采用 `text-sm`，与现有锚文本规格一致 | ✓ |

#### 唯一视觉问题：链接文本可访问性（已被 UX 捕捉）

现状链接文本 `/blog →`、`/blog/slug →` 是路径字符串，不是描述性文本——这是 **a11y 问题，非视觉设计问题**，UX 已提出修复方案（改为「阅读英文版 Blog →」等描述性文本），无需新样式或新组件。

#### 明暗双主题

`text-primary` / `hover:text-marketing-accent` / `text-display-*` 均挂在 CSS 变量上，`globals.css` 暗色模式 token 已覆盖，**不需额外处理**。

#### 给开发的确认

- 完全复用既有 token，**不引入任何新类名、新组件、新颜色**。
- 若采用 UX 推荐的新 i18n 键（`blog.zhReadEnglish` / `blog.zhReadEnglishPost`），文案本身是纯文本，不影响任何样式。
- AC4「视觉与全站 UI token 一致、明暗双主题无崩坏」**已由现状代码满足**；开发在改 AC2 死链守卫时保持相同 token 结构即可自动达标。

## 处理记录
- 2026-06-01 23:30:29 工单创建（feature / P2）
- 2026-06-02 10:02:47 set assignee=fullstack-engineer
- 2026-06-02 10:02:47 set priority=P2
- 2026-06-02 10:02:47 set status=triaged
- 2026-06-02 10:02:47 LANE: full
- 2026-06-02 10:02:47 EXTRA_ROLES: ux-designer,ui-designer
- 2026-06-02 PM 细化：补 US-1~4 + AC1~8 + 延后 scope。本期决策＝**保留 Blog EN-only**（用户拍板询问被跳过，按 PRD §1 原设计 + 本期精简政策稳妥默认；可随时翻案）。范围＝ZH 不可用提示打磨 + SEO 一致 + 决策落档；ZH 全管线列为延后 scope。要点同步入 03-产品PRD.md §8。PM 观察：EN-only 路径不动内容契约，**红线判定可降 LANE: light**（三环不省），ux/ui 可最小介入；最终道次由 orchestrator 复核。

## 架构评估（tech-architect · 2026-06-02）

### 结论：本期零契约/零 schema/零 API 变更 → 架构上确认可降 LANE: light
本期 EN-only scope **不触碰**任何架构契约，无需更新 06-技术架构.md / 06-架构现状速读.md，无迁移。逐条核对红线：
- **不动内容契约**：`content/blog.ts` 的导出契约 `BLOG_POSTS` / `getPostBySlug(slug)` / `getRelatedPosts(slug, limit)`（全同步、无 locale 维度）**保持冻结**。四处消费方（index / [slug] / sitemap / opengraph-image）签名不变。
- **不动 schema / 数据模型**：`BlogPost = BlogPostMeta & { body }`、`content/blog/*.mdx` frontmatter 结构不变。
- **不动 API / 路由结构**：`i18n/routing.ts`（`locales:[en,zh]`、`defaultLocale:en`、`localePrefix:as-needed`）不变；`/zh/blog*` 路由已存在。
- **未命中安全/鉴权/支付/隐私、未跨多端**。
> 故架构层面支持 orchestrator 把本工单从预设 `LANE: full` 复核为 **`LANE: light`**，`EXTRA_ROLES` 中 ux/ui **可省**（提示页纯复用既有 token，无新视觉）。三环（开发→代码审查→独立 QA）不可省。

### 唯一实质逻辑改动：AC2 死链守卫（[slug] 提示页）
现状 `app/[locale]/blog/[slug]/page.tsx` 第 53–72 行 ZH 分支**无条件**深链到 `/blog/${slug}`，导致 `/zh/blog/<不存在slug>` → 提示里链到 `/blog/<不存在slug>`（404 死链）。
**改法（契约零影响，复用已导入的 `getPostBySlug`）**：在 ZH 分支内先查存在性，决定链接目标与文案——
```tsx
if (locale === "zh") {
  const exists = getPostBySlug(slug);           // 已 import，无新依赖
  const href = exists ? `/blog/${slug}` : "/blog";
  const label = exists ? `/blog/${slug} →` : "/blog →";
  // 渲染 <Link href={href} locale="en">{label}</Link>，其余 Section/标题样式不变
}
```
- 列表页 `app/[locale]/blog/page.tsx`（链到 `/blog`）本就安全，**无需改**。
- 注意 `[slug]/page.tsx` 顶部 `generateStaticParams` 仅产出 EN slug；ZH 提示页对任意 slug 走动态渲染，本改动不影响 SSG。

### 其余 AC 均为「打磨/验证」非架构改动
- **AC3（i18n parity）**：`messages/{en,zh}.json` 第 537 行 `blog.zhUnavailable` 键已存在且对齐，仅可选润色文案；`lint:i18n` 须保持通过。
- **AC4（UI/a11y）**：复用 `Section`/`Pill`/`text-display-*` token，明暗双主题既有保证；确保链接有可达文本 + 对比度 AA（`a11y:contrast`）。
- **AC5（sitemap SEO 一致）**：`app/sitemap.ts` 第 64–82 行 blog 条目**已是 EN-only 且不带 `alternates`**，符合 AC5，**仅需验证**。可顺手清理第 74–75 行无用 `const fallback = routing.locales; void fallback;` 死代码（非强制；若清理则 `routing` import 可能变未用，注意 eslint）。
- **AC6（LocaleSwitcher）**：`as-needed` 前缀下 EN→ZH 落 `/zh/blog*` 提示页已天然 2xx；呼应既有 `scroll:false` 守卫。
- **AC7（不回归）**：T15 富文本（`MdxBody`/Shiki）、`getRelatedPosts`、CodeBlock 均不受影响。

### 测试要点（交 QA / 自测）
- E2E 守卫加在 `tests/e2e/`（参考既有 `issue13-t12-critical-paths.spec.ts` 第 167–176 行 ZH 镜像 2xx 用例、`issue16-t15-blog-richtext.spec.ts` EN 富文本用例）。新增断言：① `/zh/blog` 提示页含「阅读英文版」链接且点击落 `/blog`(200)；② `/zh/blog/why-parquet-for-three-signals`（存在）深链到该文 EN 版(200)；③ **`/zh/blog/does-not-exist`（不存在）链接回退指向 `/blog` 而非 `/blog/does-not-exist`**——这是 AC2 核心回归点。
- 全量门禁：`pnpm check`（tsc/eslint/a11y/i18n）+ `pnpm build` + `pnpm test:e2e` + `pnpm lint:links` 全绿。

### 开发要点（落到 fullstack-engineer）
1. 改 `app/[locale]/blog/[slug]/page.tsx` ZH 分支：加 `getPostBySlug` 存在性守卫，链接目标二选一（见上）。**这是唯一功能改动。**
2. （可选）清理 `app/sitemap.ts` 死代码 + 验证 blog 条目无 ZH alternates。
3. （可选）润色 `blog.zhUnavailable` 双语文案，保持 parity。
4. 加 ZH blog 提示路径的 E2E 守卫（重点覆盖不存在 slug 的回退）。
5. 全程不得改 `content/blog.ts` 契约 / frontmatter schema / 路由配置——若发现需要改，说明已越出本期 EN-only scope，应停下走翻案路径（命中红线② → full 道）。
- 2026-06-02 10:12:53 set status=in_progress

## 开发实现记录（fullstack-engineer · 2026-06-02）

### 改动文件
- `app/[locale]/blog/[slug]/page.tsx` —— **唯一功能改动（AC2 死链守卫）**：ZH 分支先 `getPostBySlug(slug)` 查存在性，`href = exists ? /blog/${slug} : /blog`、`label = exists ? zhReadEnglishPost : zhReadEnglish`，杜绝不存在 slug 链到 404。复用已 import 的 `getPostBySlug`，零新依赖、契约零改、Section/标题样式不变。
- `app/[locale]/blog/page.tsx` —— ZH 列表提示链接文本从裸路径 `/blog →` 改为描述性 `{t("zhReadEnglish")}`（AC4 a11y 可达文本）。
- `messages/en.json` / `messages/zh.json` —— `zhUnavailable` 改为纯通知文案（去掉标题里误导性可点箭头）；新增 `zhReadEnglish` / `zhReadEnglishPost` 描述性链接键。EN/ZH parity 518=518。
- `app/sitemap.ts` —— 清理 blog 循环里无用死代码 `const fallback = routing.locales; void fallback;` 及随之未用的 `routing` import（AC5 顺手清理，eslint 0 warn）。
- `tests/e2e/issue22-t21-blog-zh-notice.spec.ts` —— **新增** 3 条 E2E 守卫（AC1/AC2）。

### 自测结果（全绿）
- `pnpm check`：tsc 0 / eslint 0 / a11y:contrast 26/26 AA / i18n parity 518=518 ✅
- `pnpm build`：rc=0，blog 两篇 SSG、`/zh/blog*` 动态渲染正常 ✅
- `pnpm test:blog`：provider 契约/快照全过（契约未动）✅
- `pnpm lint:links`（起 next start :3000）：**0/33 失败**，全站 blog 链路无死链 ✅
- `pnpm test:e2e`：**76 passed**（既有 73 零退化 + 本工单 3）✅
- curl 实证：
  - `/zh/blog` → 通知 + `阅读英文版 Blog →` 链 `/en/blog`(307→/blog 200)
  - `/zh/blog/why-parquet-for-three-signals`（存在）→ `阅读该文章英文版 →` 深链 `/en/blog/...`(307→200)
  - `/zh/blog/does-not-exist-xyz`（不存在）→ **回退 `阅读英文版 Blog →` 指向 `/en/blog`**，**不再**链到 `/blog/does-not-exist-xyz`（裸 EN 路径实测 404）→ AC2 死链根治
  - `/sitemap.xml`：0 处 `zh/blog`，blog 三条 EN-only `<loc>` 无 `hreflang=zh` alternates（AC5）✅

### AC 覆盖
AC1✅ AC2✅(核心死链守卫，含不存在 slug 回退) AC3✅(parity+新键语义一致) AC4✅(描述性链接文本+token 复用+AA) AC5✅(sitemap 无 zh/blog 无 blog alternates) AC6✅(LocaleSwitcher 既有 2xx，回归全绿) AC7✅(check/build/test:e2e 全绿，富文本/相关文章不回归)。AC8 为翻案后占位，本期不做。

### scope 纪律
全程未碰 `content/blog.ts` 契约 / frontmatter schema / `i18n/routing.ts` 路由配置——本期严格 EN-only，未越界。

### 实现说明（供 QA）
next-intl `as-needed` 下跨 locale Link（ZH 页 → `locale="en"`）渲染显式 `/en` 前缀（如 `/en/blog`），经 middleware 307 → 规范 EN 路径 200，非死链。E2E 中 `page.request` 共享浏览器 `NEXT_LOCALE=zh` cookie 会把裸 `/blog/<missing>` 重定向回 ZH 通知页(200)，故"裸 EN 路径 404"断言用 cookie-clean 的 `request.newContext()` 验证。
