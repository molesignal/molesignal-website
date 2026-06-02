# 内容运营工作流手册（blog / changelog / roadmap）

> **ISSUE-25 / T24** · 内部运营文档（不进站点导航、不计入 i18n parity）
> 适用对象：molesignal 团队负责内容更新的成员（运营 / 增长 / 工程）
> 目的：让**改内容不改组件**——blog、changelog、roadmap 三套内容都由独立数据源驱动，编辑数据文件即可发布，无需改 React 组件。本手册给出每套的更新步骤、字段约定、模板与发布前自检。

---

## 0. 一页速览（TL;DR）

| 内容 | 数据源（你只动这里） | 加内容方式 | 模板 | 发布前必跑 |
|---|---|---|---|---|
| **Blog** | `content/blog/<slug>.mdx` | 新增 / 编辑一个 `.mdx` 文件 | `docs/ops/templates/blog-post.mdx.template` | `pnpm test:blog` + `pnpm build` |
| **Changelog** | ① GitHub Release（首选，自动）<br>② `content/changelog.ts`（兜底 / 预览） | 发 Release，或编辑静态数组 | `docs/ops/templates/changelog-entry.ts.template` | `pnpm test:changelog` |
| **Roadmap** | `content/roadmap.json` | 编辑 JSON 数组 | `docs/ops/templates/roadmap-item.json.template` | `pnpm typecheck` + `pnpm build` |

共同纪律（三套都适用）：
1. **只动数据源文件**，不要碰对应的 `components/*`、`app/*` 渲染逻辑（动了说明做错了，见各节）。
2. 提交前在本地跑该内容对应的自检脚本（上表最后一列），全绿再提交。
3. 文案双语规则：**Blog 当前为 EN-only**（ISSUE-22/T21 决策）；changelog / roadmap 文案内嵌在数据里，按现状语言书写即可，不进 `messages/*` 故**不影响 i18n parity**。
4. 走正常 git 流程：改完 → `pnpm check` → commit（Conventional Commits）→ PR，CI 门禁会再跑一遍。

---

## 1. Blog 更新

### 1.1 数据源与契约

- 每篇文章是一个文件：`content/blog/<slug>.mdx`。
- `content/blog.ts` 在**模块加载时同步**扫描该目录所有 `.mdx`，用 `gray-matter` 解析 frontmatter（元数据）+ body（正文），按 `date` 降序排出 `BLOG_POSTS`。
- 消费方（index / 详情页 / sitemap / OG 图）只读 `BLOG_POSTS` / `getPostBySlug` / `getRelatedPosts`，**契约固定**——加文章不需要改任何 `.ts`/`.tsx`。

> ⚠️ **该目录下每个 `.mdx` 都会被当成一篇真文章**。不要把草稿 / 模板 / 备份留在 `content/blog/`（模板因此放在 `docs/ops/templates/`，扩展名是 `.mdx.template` 而非 `.mdx`，不会被加载）。

### 1.2 frontmatter 字段（全部必填，除 `coverUrl`）

| 字段 | 类型 | 说明 |
|---|---|---|
| `slug` | string | URL 片段，须与文件名一致（`content/blog/<slug>.mdx`）、全站唯一、kebab-case |
| `title` | string | 文章标题；含撇号时用单引号包裹整串（见模板） |
| `excerpt` | string | index 卡片 + OG 预览摘要，~160 字符；YAML 多行用 `>-` |
| `date` | string | ISO `'yyyy-mm-dd'`，带引号；决定排序与"最新文章" |
| `author` | string | 署名，通常 `molesignal team` |
| `readTimeMinutes` | number | 预估阅读分钟，整数 |
| `tags` | string[] | 标签数组；`getRelatedPosts` 按共享 tag 数推荐相关文章 |
| `coverUrl` | string? | 可选封面图路径；无封面就**删掉这一行**，别留空值 |

### 1.3 发布步骤

1. 复制模板：`cp docs/ops/templates/blog-post.mdx.template content/blog/<slug>.mdx`。
2. 改文件名里的 `<slug>`，并让 frontmatter 的 `slug` 与之**完全一致**。
3. 填 frontmatter + 正文（MDX：标题/列表/链接/`code`/围栏代码块，代码块自动 Shiki 双主题高亮）。
4. 本地自检：
   ```bash
   pnpm test:blog      # frontmatter 字段 + body 完整性快照
   pnpm build          # 确认新页面 SSG 出页、无 MDX 编译错误
   ```
5. 可选：`pnpm dev` 打开 `/en/blog/<slug>` 肉眼核对富文本与相关文章区。
6. commit：`docs(blog): add post <slug>` 或 `feat(blog): ...`。

### 1.4 常见坑

- **frontmatter 漏字段** → `build` 会失败但不一定指明坏文件；对照 §1.2 逐项补齐。
- **slug 与文件名不一致** → 详情页 404 或链接错乱。
- **想改正文样式**（标题字号、代码块外观）：那是组件层（`components/blog/mdx-prose.tsx`），属工程改动，**不在内容运营范围**，请开工单。

---

## 2. Changelog 更新

### 2.1 双源模型（先搞清楚发到哪）

Changelog 页面与 RSS 有**两个来源**，运行时自动二选一（`lib/changelog-feed.ts` / `app/[locale]/changelog/page.tsx`）：

| 来源 | 何时生效 | 你怎么更新 | 页面标识 |
|---|---|---|---|
| **GitHub Releases**（首选） | 仓库存在 Release 时（ISR 1 小时刷新） | 在 GitHub 上**发布一个 Release** | brand "live from GitHub" pill |
| **静态 `content/changelog.ts`**（兜底/预览） | API 无 Release 或拉取失败时 | 编辑 `CHANGELOG` 数组 | 灰色 "previewing" pill |

> 本期通常无 `GITHUB_TOKEN` / 仓库暂无 Release，页面走**静态兜底**并诚实标注 "previewing"。补 token + 发 Release 后**无需改代码**自动切到 live 源。RSS（`/changelog/rss.xml`）与页面**同源同序**，更新任一源 RSS 自动跟随。

### 2.2 方式 A：发 GitHub Release（推荐，长期正解）

1. 在 `molesignal/molesignal` 仓库发 Release，tag 形如 `v0.8.0`（带 `v` 前缀）。
2. Release body 用 markdown 列条目；解析器（`lib/parse-release.ts`）识别 `feat/fix/perf/chore/breaking` 前缀生成条目摘要。
3. 标 prerelease 的 Release 会被保留并打 prerelease 标记；draft 会被过滤掉。
4. 最多 1 小时（ISR）后页面与 RSS 自动出现该版本；版本锚点 `#v0-8-0` 由 `lib/changelog-anchor.ts` 统一生成。

### 2.3 方式 B：编辑静态 CHANGELOG（无 Release 时的预览/兜底）

1. 打开 `content/changelog.ts`，把模板对象**插到 `CHANGELOG` 数组最前面（最新在上）**。
   - 模板：`docs/ops/templates/changelog-entry.ts.template`
2. 字段：
   - `version`：semver，**不带** `v` 前缀（锚点自动加，`"0.8.0"` → `#v0-8-0`）。
   - `date`：ISO `yyyy-mm-dd`，决定排序。
   - `title`：版本标题。
   - `items[]`：`{ tag, text }`，`tag ∈ feat|fix|perf|chore|breaking`，`text` 面向读者的一句话。
3. 自检：
   ```bash
   pnpm test:changelog   # 版本/日期/排序/锚点/RSS 同源 等断言
   pnpm build            # 确认 changelog 页 + rss.xml 正常产出
   ```
4. commit：`content(changelog): add v0.8.0`（或 `feat`）。

> ⚠️ 即使将来主要靠 GitHub Releases，也请保持 `CHANGELOG` 数组非空且大致最新——它是 token 缺失 / API 抖动时的兜底，空了页面 "previewing" 态会很尴尬。

---

## 3. Roadmap 更新

### 3.1 数据源与契约

- 唯一数据源：`content/roadmap.json`（一个对象数组）。
- 消费方 `components/roadmap-list.tsx` / `app/[locale]/roadmap/page.tsx` 按 `phase` 分桶渲染，并与 URL hash 同步。**改数据不改组件**。

### 3.2 字段

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string | 稳定唯一 id，kebab-case；用作列表项标识键，须全表唯一 |
| `phase` | string | `now` \| `next` \| `later` \| `done`，决定归到哪个分组 tab；URL 锚点用的是 phase（`/roadmap#next`），不是 `id` |
| `title` | string | 功能名，用用户会搜索的措辞 |
| `summary` | string | 一句话：是什么 + 诚实的当前状态，不夸大 |
| `estimate` | string | 自由文本：`Q3 2026` / `v1.0` / `Post-1.0` / `Shipped` |
| `issueUrl` | string \| null | 跟踪链接；没有就填 `null`（注意是 JSON `null`，不是 `"null"`） |

### 3.3 更新步骤

1. 编辑 `content/roadmap.json`，按模板（`docs/ops/templates/roadmap-item.json.template`）加 / 改对象。
   - **JSON 没有注释**：从模板复制时只拷 `{...}` 对象本体，删掉所有 `//` 注释行。
2. 推进状态就是改 `phase`（如 `now` → `done`）并把 `estimate` 改成 `Shipped`。
3. 自检：
   ```bash
   pnpm typecheck        # JSON 形状错误会被 TS 类型捕获
   pnpm build            # 确认 roadmap 页正常
   ```
4. 校验 JSON 合法（逗号 / 引号 / 括号匹配）；非法 JSON 会让 `build` 直接失败。
5. commit：`content(roadmap): move alerts-engine to done`。

---

## 4. 发布前总检查清单

任何内容改动，提交前至少跑：

```bash
pnpm test:blog        # 仅当动了 blog
pnpm test:changelog   # 仅当动了 changelog（含 RSS 同源校验）
pnpm typecheck        # 动 roadmap.json / changelog.ts 时必跑
pnpm build            # 三套都建议跑：确认 SSG 出页、无编译错误
pnpm lint:links       # 若新增了站内/站外链接，确认无死链
```

CI 门禁（`.github/workflows/ci.yml`）会再独立跑一遍（check + build + lint:links + lint:quickstart + e2e），但本地先过能省一次往返。

---

## 5. 边界与维护约定

- **内容运营 vs 工程**：本手册覆盖的是**数据文件**的增改。任何涉及渲染样式、组件结构、解析逻辑（`mdx-prose.tsx`、`parse-release.ts`、`changelog-anchor.ts`、`roadmap-list.tsx` 等）的改动属工程范畴，请走开发工单，不在运营自助范围内。
- **契约变更联动**：若工程侧改了内容契约（如给 blog frontmatter 加必填字段、调整 changelog item 形状），**必须同步更新本手册与 `docs/ops/templates/` 下对应模板**，并更新此处的字段表。
- **相关文档**：表单名单导出见 `docs/ops/data-export.md`。
- **来源约定**：本手册描述与下列源码一致（截至 `feature/ISSUE-25`）——`content/blog.ts`、`content/changelog.ts`、`content/roadmap.json`、`lib/changelog-feed.ts`、`lib/changelog-anchor.ts`、`components/roadmap-list.tsx`。
