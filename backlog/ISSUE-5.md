---
id: ISSUE-5
type: feature
title: [T08] UI token迁移(globals.css+Geist Mono)
status: in_review
priority: P0
assignee: frontend-engineer
created: 2026-06-01
updated: 2026-06-02
---

## 描述
模块:UI token迁移(globals.css+Geist Mono) | 角色:frontend | 依赖:无(其他UI前置) | 里程碑:M1 | 验收:加@fontsource/geist-mono;globals.css按05§5迁Teal/Amber/暖中性/圆角降档/去glow;--font-mono指向GeistMono;a11y:contrast AA全过;build/check过;明暗不崩 | 详见 07-开发任务拆分.md(T08) 与 06-技术架构.md/READINESS.md

## 需求说明

### 背景与承接
承接 PRD §4.1 **P0**（UI 改版基座，D1 信任 / D8 可信视觉）与 `07-开发任务拆分.md` **T08**。这是 **UI 改版的地基工单**：`07` 全局前置明确「UI token 迁移（T08）是所有 UI 组件视觉改造（T09/T10/T08b）的前置」。当前站点用 **Indigo 主色 + 品红(pink-magenta) marketing accent + 较重 glow 阴影 + 较大圆角 + Inter Variable 充当 mono**，与 05-UI 改版方向（Teal 主色 / Amber 强调 / 暖中性 / 圆角降档 / 阴影简化去 glow / Geist Mono 真等宽）不一致。本工单只改 **设计 token 层（`app/globals.css` + 字体加载）**，不动任何组件 JSX 与文案。

### 用户故事
- **US-1（核心）**：作为团队，我想把全站设计 token 一次性切到 05-UI 的 Teal/Amber/暖中性体系，以便后续 T09/T10/T08b 组件改造有稳定、单一来源的 token 地基，不必各自重定义颜色。
- **US-2**：作为访客，我打开站点（明 / 暗任一主题）时，配色立刻是新的 Teal/Amber 暖色调、圆角更利落、无浮夸 glow，且**没有任何区块掉样式 / 配色错乱**，以便第一眼就获得"克制、可信、工程感"的观感（DESIGN_BRIEF 调性）。
- **US-3**：作为关注命令行体验的开发者，我看到站内等宽文本（命令、代码、数字）以真正的 **Geist Mono** 呈现而非 Inter 伪等宽，以便感知产品的 terminal-native 气质。
- **US-4**：作为 a11y 用户，我想新配色在明暗双主题下文本对比度仍满足 **WCAG AA**，以便正常阅读。

### 关键现状（已核实，决定迁移策略 — 务必读）
> 当前 `app/globals.css` 的 **canonical token 名是 `--indigo*` / `--marketing-accent*`**（**不存在 `--brand` / `--amber` / `--warn`**），并通过 `@theme inline` 暴露为 Tailwind 工具类桥接：`--color-indigo*`、`--color-marketing-accent*`、`--shadow-glow-indigo-token`、`--shadow-glow-pink-token`、`--marketing-gradient-cta`、`--marketing-hero-bg` 等。
> **全仓 83 处组件/页面仍在直接消费这些旧名工具类**（实测：`indigo` 31、`marketing-accent` 39、`shadow-glow` 29、`glow-pink` 6、`font-mono` 16；例：`text-marketing-accent` / `bg-marketing-accent-dim` / `hover:shadow-glow-indigo` / `text-primary`(→indigo)）。
> ⚠️ **若本工单直接把旧 token "重命名"为 `--brand`/`--amber`（删掉旧名桥接），这 83 处工具类会解析为空** —— Tailwind v4 静默丢弃未知工具类，`build`/`check` 仍可能 green，但**站点大面积掉色 = 直接违反 AC「全站无视觉崩坏」**。组件类名的逐一迁移属 **T09/T10/T08b 范围，不是本工单**。

### 迁移策略（PM 定口径 · 本工单成立的关键 — 加法式 + 值重指向，不做破坏性重命名）
1. **值重指向（让旧消费者立即变色，零崩坏）**：把 `app/globals.css` 中**旧 canonical 名的"值"改为 05-UI §5 的新值**——`--indigo*`→Teal、`--marketing-accent*`→Amber、`--marketing-hero-bg`→`none`、`--marketing-gradient-cta`→teal→teal、`--shadow-glow-indigo-token`/`--shadow-glow-pink-token`→ 05-UI §5 的简化 glow 值、圆角 token 降档、阴影简化。明 / 暗两个块都改（含若存在的 `prefers-color-scheme` 镜像块，实测 line 213+ 有一份，须同步）。这样 83 处旧工具类**不改一行组件代码即整体切到 Teal/Amber**。
2. **新增新 canonical 名（给 T09/T10/T08b 用）**：按 05-UI §5 **新增** `--brand* / --amber* / --warn*` 及 `@theme inline` 桥接 `--color-brand* / --color-amber* / --color-warn*`、新增的 radius/mono-text-scale/display-sm token。语义别名（`--primary/--accent/--marketing-accent` 等）按 05-UI §5 指向新 brand/amber。
3. **保留旧桥接为别名（防崩坏）**：`@theme inline` 中的 `--color-indigo* / --color-marketing-accent* / --shadow-glow-indigo / --shadow-glow-pink` 等旧 `--color-*` 桥接**本工单一律保留**（其值经第①步已指向新色），作为过渡别名。**删除旧别名/旧工具类是 T09/T10/T08b 收尾时的事，不在本工单**（删除前须确认全仓 0 引用）。
4. **字体**：`pnpm add @fontsource/geist-mono`；`app/layout.tsx` 顶部 `import "@fontsource/geist-mono/400.css"` 与 `/600.css`（与现有 `@fontsource-variable/inter` 同款 import 方式，**非 CSS @import**）；`@theme inline` 的 `--font-mono` 由 `"Inter Variable"…` 改为 `"Geist Mono", ui-monospace, …`（16 处 `font-mono` 工具类即刻生效）。

### 明确不做（YAGNI / 防镀金 / 防与 T09/T10 撞车）
- **不改任何组件 / 页面 JSX**（Hero/Demo/表单/导航/页脚等视觉改造是 T09/T10/T08b）。
- **不批量重命名组件里的工具类**（`text-marketing-accent`→`text-amber` 等迁移属下游工单）。
- **不删除旧 token / 旧 `--color-*` 桥接 / 旧工具类**（保留为别名过渡，删除留待下游确认零引用后）。
- 不引入第二款字体、不改 Inter（sans 不动）、不加新依赖（除 `@fontsource/geist-mono`）。
- 不改任何 i18n 文案 / 不动 messages、不改任何 API/schema。
- 不为对比度问题去改组件结构（若新色 AA 不达标，见"阻塞/开放项"上报 ui-designer 调值，不在本工单擅改设计）。

### 实现约束（供 frontend / ui-designer 承接，PM 不定实现细节）
- token 值以 **05-UI §5 的 CSS 片段为准**（含 light `:root`、`[data-theme="dark"]`、`@theme inline` 三段；oklch 值照抄）。`app/globals.css` 现有结构有 `:root` + `[data-theme="dark"]` + 一份 `@media (prefers-color-scheme: dark)` 镜像 + `@theme inline`——**四处都需对应更新，保持明暗一致**。
- Geist Mono 仅装 400/600 两个字重（与 05-UI §5 一致），避免无谓体积。
- 本仓 AGENTS.md 警告"This is NOT the Next.js you know"——字体 import / layout 改动若涉新 API，先查 `node_modules/next/dist/docs/`，否则照现有 `@fontsource-variable/inter` 既有写法抄。

## 验收标准

- **AC1 字体落地**：`@fontsource/geist-mono` 出现在 `package.json` deps 且已安装；`app/layout.tsx` import 了 Geist Mono 400 与 600；`@theme inline` 的 `--font-mono` 指向 `"Geist Mono"` 在首位。实跑站点，任一 `font-mono` 元素（如命令预览 / 代码块 / 数字）计算字体为 **Geist Mono**（非 Inter / 非默认 ui-monospace 回退），DevTools computed `font-family` 可核。
- **AC2 新 token 就位**：`app/globals.css` 按 05-UI §5 新增 `--brand* / --amber* / --warn*`（light + dark 双块）及 `@theme inline` 桥接 `--color-brand* / --color-amber* / --color-warn*`、新增 radius token（`--radius-sm/-/-lg` 降档为 3/5/8px、新增 `--radius-xl`=12px）、mono-text-scale（`--text-mono-sm…-3xl`）、`--text-display-sm`。值与 05-UI §5 oklch 一致。
- **AC3 旧消费者整体变色（零崩坏核心）**：旧 canonical token 值已重指向新色 —— `--indigo*`=Teal、`--marketing-accent*`=Amber、`--marketing-hero-bg`=`none`（移除旧 radial glow）、`--marketing-gradient-cta`=teal→teal、glow 阴影=05-UI §5 简化值。实跑全站**明暗双主题**：原使用 `text-marketing-accent`/`bg-marketing-accent-dim`/`shadow-glow-indigo`/`text-primary` 等旧工具类的区块**全部显示为新 Teal/Amber 配色、无掉样式 / 无配色错乱 / 无空背景**。明暗两套 + `prefers-color-scheme` 镜像块均已同步。
- **AC4 别名保留（过渡不破坏）**：`@theme inline` 中旧 `--color-indigo* / --color-marketing-accent* / --shadow-glow-indigo / --shadow-glow-pink` 桥接**仍存在**（作为指向新值的别名）；全仓 83 处旧工具类引用**无一解析失败 / 无一掉样式**。本工单**未删除**任何旧 token / 旧工具类（删除是下游工单事项）。
- **AC5 对比度 AA**：`pnpm a11y:contrast` 在新配色下**全过（WCAG AA）**，明暗双主题。若任一 token 对未达标 → 不擅改组件，按"阻塞项"回报 ui-designer 调 token 值后复跑（这是设计决策，归 EXTRA_ROLE ui-designer）。
- **AC6 构建 / 类型 / lint 全绿**：`pnpm check`（typecheck + lint + a11y:contrast + i18n parity）exit 0；`pnpm build` exit 0。
- **AC7 无视觉崩坏（双主题人工目测）**：首页 + 至少 Hero / CrossSignalDemo / Why-Stats / QuickStart(start) / DP CTA / 导航 / 页脚 等关键区块，在 **明 + 暗** 两主题下渲染正常——无错色、无不可读文本、无丢边框 / 丢背景、圆角与阴影呈 05-UI §5 的"利落 + 克制"观感（圆角更小、无浮夸 glow）。主题切换无闪烁回归（呼应 READINESS #20）。
- **AC8 隔离性（不越界）**：本工单 diff 仅限 `app/globals.css`、`app/layout.tsx`、`package.json`/lockfile（+ 新增字体依赖）；**无任何组件 / 页面 JSX 改动、无 messages 改动、无 API/schema 改动**。git diff 可核组件目录零变更。

> **验证手段**：ui-designer 先核 token 值忠于 05-UI §5；frontend 自测门 `pnpm check && pnpm build` 全绿 + `pnpm a11y:contrast` 全过；QA 用真浏览器在 **明暗双主题** 目测关键区块无崩坏 + DevTools 核 `font-mono` 计算字体为 Geist Mono + 抽查若干旧工具类元素 computed 颜色已是 Teal/Amber。**纯前端 token/字体，不依赖任何外部密钥**，可全程本地验证。

## 架构评估（tech-architect · 2026-06-02）

### 契约影响裁定
- **数据模型 / API 契约影响：无。** 本工单纯粹改 **设计 token 表现层**（`app/globals.css` 颜色/圆角/阴影/字体 token + `app/layout.tsx` 字体 import + `package.json` 加 `@fontsource/geist-mono`）。**不动任何 schema / 接口出入参 / messages / 路由**。`06-技术架构.md`（L219-220）已把"token 迁移"登记为 UI 改版的独立前置步骤，**本工单无需更新任何架构文档**。
- 走 **full 道**合理（命中红线④"跨多模块改动"——值重指向会让全仓 94 处旧工具类同时变色），EXTRA_ROLE `ui-designer` 必需（见下方 AA 阻塞）。
- 已核实现状与 PM 口径一致：canonical token 名为 `--indigo*`/`--marketing-accent*`（无 `--brand/--amber/--warn`）；`--font-mono` 现指 `"Inter Variable"`；字体 import 在 `app/layout.tsx` 顶部 `import "@fontsource-variable/inter"`；`prefers-color-scheme` 镜像块在 `globals.css` L197-239。**实测全仓旧工具类消费 = 94 处 / 32 文件**（与工单"83 处"同量级，口径略宽即可，迁移策略不变）。

### ⚠️ 两个关键实现要点（不照做必失败，QA 必查）

**要点 A — 05-UI §5 是"REPLACE/重命名"写法，本工单必须"加法式"落地，禁止照抄。**
05-UI §5 的 CSS 片段把 `--indigo`→`--brand`、`--marketing-accent`→`--amber` 直接重命名，并新增 `--color-brand*/--color-amber*/--shadow-glow-brand/-amber` 这些**新名**桥接。**若逐字粘贴 §5（删掉旧名）→ 94 处旧工具类（`text-marketing-accent`/`bg-indigo-dim`/`shadow-glow-indigo`/`shadow-glow-pink` …）全部解析为空 → 大面积掉色，违反 AC3/AC4。** 正确做法（PM 口径）：
1. **保留旧 canonical 名** `--indigo*`/`--marketing-accent*`，把其**值**改为新色（可写成 `--indigo: var(--brand)` 或直接填新 hex）。
2. **保留旧 `@theme inline` 桥接** `--color-indigo*`/`--color-marketing-accent*`/`--shadow-glow-indigo`/`--shadow-glow-pink`（值经第①步已指向新色）。
3. §5 的 `--brand/--amber/--warn` + `--color-brand*/--color-amber*/--color-warn*` + `--shadow-glow-brand/-amber` 作为**新增别名**并存（给 T09/T10/T08b 用），不取代旧桥接。
4. §5 `@theme inline` 里 `--text-mono-sm: var(--text-mono-sm)` 等是**自引用拷贝瑕疵**——落地时按现有 `--text-*` 风格直接写**字面 px**（`--text-mono-sm: 12px` …），勿写自引用 var（会解析失败）。

**要点 B — `pnpm a11y:contrast` 只认 hex，不认 oklch；且 §5 的 light 值会让 3 个 AA 对失败 → 阻塞 AC5/AC6，须 ui-designer 调值。**
- `scripts/check-contrast.ts` 的 `normHex()`（L76-92）**只解析 `#rrggbb`/`#rgb`，对 `oklch()` 返回 null → 该对判 FAIL**。AC8 又禁止改这个脚本。**故 canonical 颜色 token 的值必须落成 hex**（用 §5 注释里的 `≈ #xxxxxx`，或精确 oklch→hex 换算），**不可填裸 oklch**。带 alpha 的 `-dim` token 本就被脚本跳过（现状 rgba 亦然），无碍。
- 即便用 hex，**§5 的 light-mode 品牌/强调色作为正文文本达不到 AA 4.5**（实测）：

  | 审计对（light, STRICT 4.5） | §5 值 | 实测 | 判定 |
  |---|---|---|---|
  | `--marketing-accent`(amber `#d97706`) on `--bg-0` | amber-600 | **3.02:1** | ✗ |
  | `--marketing-accent` on `--bg-1` | amber-600 | **2.87:1** | ✗ |
  | `--indigo`→teal(`#0d9488`) on `--bg-0`（DISPLAY，light 仍要 4.5） | teal-600 | **3.55:1** | ✗ |

  dark 主题各对均通过（teal `#2dd4bf` 10.1、amber `#fbbf24` 11.3、tx-0 16+）。**只有 light 的 teal/amber 文本不达标**（因 §5 选的是中明度 600 级色，旧 pink/indigo 更深所以原本过）。
- **解法（归 ui-designer，设计决策，不擅改组件/脚本）**：把 **light-mode 的 `--indigo`(brand) 与 `--marketing-accent`(amber) 调深**至文本达 4.5。可选起点（已验算）：
  - teal：`#0f766e`(teal-700, bg0 5.20/bg1 4.94) 或更稳 `#0d6e64`(5.81/5.52)；
  - amber：`#b45309`(amber-700, 4.77/4.53，bg-1 偏紧) 或更稳 `#92400e`(amber-800, 6.73/6.39)。
  - 注意：这两个 canonical token 同时驱动**填充**（按钮/dim 底/CTA 渐变），调深=填充也变深，是可接受且更"克制"的取舍；soft/dim 变体可保持较亮。dark 值无需动。
- **执行顺序建议**：ui-designer 先定 light 的 teal/amber 终值（含 hex），frontend 再落 globals.css，避免改两遍。

### 隔离性 & 其余 gotcha（开发要点）
- `prefers-color-scheme` 镜像块（L197-239）**05-UI §5 没给对应源**——dark 的 `--brand/--amber/--warn` + 暖中性 + 简化阴影须**手工镜像同步**进该块（AC3 明列）。这是最易漏项。
- `--font-weight-body` §5 由 500→400 是**全站正文字重变化**（在 globals.css 内，属本工单范围）；不影响对比度（对比看颜色非字重），但 QA 目测正文可读性。
- `--marketing-grid-line` 是 §5 新引用 token，记得新增。
- 严守 AC8：diff 仅 `app/globals.css` + `app/layout.tsx` + `package.json`/lockfile。**勿碰 `scripts/check-contrast.ts`、组件 JSX、messages**。
- 字体 import 照现有 `import "@fontsource-variable/inter"` 同款写法加 `import "@fontsource/geist-mono/400.css"` 与 `/600.css`（非 CSS `@import`）；Next16 无新 API 牵涉，无需查 docs。

## ui-designer 设计决策（2026-06-02）

### 核心产出：AA 合规的 canonical token 终值

基于 `check-contrast.ts` 代码审计（仅识别 `#rrggbb` / `#rgb`，拒绝 oklch）+ 数学验算，给出前端落地时必须使用的精确 hex 值：

#### Light mode（`:root` 与 `prefers-color-scheme` 镜像块）

| token（canonical 名） | 最终 hex | 对比数据（WCAG AA） |
|---|---|---|
| `--indigo` (→ Teal) | **`#0f766e`** | bg0: 5.20:1 ✓ · bg1: 4.94:1 ✓ |
| `--marketing-accent` (→ Amber) | **`#b45309`** | bg0: 4.77:1 ✓ · bg1: 4.53:1 ✓ |
| `--primary-fg` | `#ffffff` | on `#0f766e` = 5.52:1 ✓ STRICT |
| `--marketing-accent-fg` | `#ffffff` | on `#b45309` = 5.03:1 ✓ DISPLAY(light=4.5) |
| `--bg-0` | `#f9f9f8` | oklch 注释 → hex |
| `--bg-1` | `#f4f3f1` | — |
| `--tx-2` | `#666e88` | on bg0: ~4.8:1 ✓ |

设计考量：
- 原 §5 的 `#0d9488`（teal-600）3.55:1 不达标，调深一级到 teal-700 `#0f766e`，仍是清晰的 Teal，不失品牌感
- 原 `#d97706`（amber-600）3.02:1 不达标，调深到 amber-700 `#b45309`，仍是暖金调，bg-1 边界 4.53 严格达标（≥4.5）
- 两色调深均契合"克制"设计调性，填充（按钮/背景）变深是可接受取舍

#### Dark mode（`[data-theme="dark"]` 块）— **新发现：前景色需覆盖**

| token | 最终值 | 说明 |
|---|---|---|
| `--brand` | **`#2dd4bf`** | 亮 teal on dark bg = 11.6:1 ✓ |
| `--marketing-accent` | **`#fbbf24`** | 亮 amber on dark bg = 12.2:1 ✓ |
| **`--primary-fg`** (覆盖) | **`#0e1117`** | ⚠️ 必须！亮 teal 背景下 #fff = 1.7:1 FAIL |
| **`--marketing-accent-fg`** (覆盖) | **`#0e1117`** | ⚠️ 必须！亮 amber 背景下 #fff = 1.6:1 FAIL |

> **架构评估未识别此问题**：dark mode 的 `#2dd4bf`/`#fbbf24` 极亮（L≈0.56/0.60），白色前景只有 1.7/1.6:1，远低于 STRICT 4.5 和 DISPLAY 3.0。`check-contrast.ts` 会检查 pair-12（`--primary-fg on --indigo`）和 pair-13（`--marketing-accent-fg on --marketing-accent`），**不加 dark override 必 FAIL**。解法：在 `[data-theme="dark"]` 块加 `--primary-fg: #0e1117` 和 `--marketing-accent-fg: #0e1117`（深底色作按钮文字，比值分别达 11.6:1 和 12.3:1）。

#### 附加修正（不影响外观，影响脚本/构建）

1. **所有 canonical color token 必须是 hex literal**（bg/bd/tx/brand/amber/warn）—— oklch 被 normHex() 跳过 → ratio=0 → FAIL
2. **`@theme inline` 中 mono 字体/display-sm 的 var 不能自引用**（`var(--text-mono-sm)` 自引用 → 解析失败）—— 必须写字面 px 值
3. 05-UI §5 CSS 已按上述全部更新（文件路径不变）

### 开放项（已闭合）

架构评估列的"ui-designer 调值"阻塞项全部解决，无残留阻塞。

## 处理记录
- 2026-06-01 23:30:28 工单创建（feature / P0）
- 2026-06-02 03:00:55 set assignee=frontend-engineer
- 2026-06-02 03:00:55 set priority=P0
- 2026-06-02 03:00:55 set status=triaged
- 2026-06-02 03:00:55 LANE: full
- 2026-06-02 03:00:55 EXTRA_ROLES: ui-designer
- 2026-06-02 PM 细化：补全需求说明（背景/4 用户故事/关键现状/迁移策略/明确不做/实现约束）与 8 条验收标准 AC1–AC8。**核实关键事实**：当前 globals.css canonical token 名为 `--indigo*`/`--marketing-accent*`（无 `--brand`/`--amber`/`--warn`），全仓 **83 处组件工具类直接消费旧名**（indigo 31 / marketing-accent 39 / shadow-glow 29 / glow-pink 6 / font-mono 16），`--font-mono` 现指 Inter Variable。**定迁移口径=加法式 + 值重指向**：旧 token 值改为新 Teal/Amber（让 83 处旧工具类零改代码即整体变色，满足"全站无视觉崩坏"）+ 新增 `--brand/--amber/--warn` 给 T09/T10/T08b 用 + 保留旧 `--color-*` 桥接为过渡别名（删除留下游确认零引用后）。**严守边界**：仅改 globals.css + layout(字体) + package.json，零组件 JSX / 零文案 / 零 API。要点已同步 03-产品PRD.md §8。**开放项**：a11y AA 若新色不达标 → 回报 ui-designer 调 token 值（设计决策），不擅改组件。
- 2026-06-02 tech-architect 架构评估：**契约影响=无**（纯表现层 token，零 schema/API/messages，无需改架构文档）。新增"架构评估"章。**两个硬约束**：① 05-UI §5 是 REPLACE 写法，必须加法式落地（保留旧 `--indigo*/--marketing-accent*` 名与旧 `--color-*` 桥接，仅重指值），照抄即掉色；② `check-contrast.ts` 只认 hex 不认 oklch（AC8 禁改脚本）→ canonical 颜色须填 hex；且**实测 §5 的 light teal/amber 作正文文本 AA 不达标**（amber 3.02/2.87、teal 3.55 < 4.5）→ **阻塞 AC5/AC6，须 ui-designer 先把 light brand/amber 调深**（已给验算候选：teal `#0f766e`、amber `#92400e` 等），frontend 再落地。执行序：ui-designer 定值 → frontend 改 globals.css。
- 2026-06-02 ui-designer 设计决策（解除阻塞）：**终值确定**：light `--indigo=#0f766e`(teal-700, bg0:5.20 bg1:4.94 ✓)、light `--marketing-accent=#b45309`(amber-700, bg0:4.77 bg1:4.53 ✓)。**新增关键发现**：dark mode 亮 teal/amber（#2dd4bf/#fbbf24）极亮（L≈0.56/0.60），白色前景仅 1.7/1.6:1 远低于 AC5 门禁 → **dark `[data-theme="dark"]` 须加 `--primary-fg: #0e1117` 和 `--marketing-accent-fg: #0e1117` 覆盖**（深底色作按钮前景，分别达 11.6/12.3:1）；架构评估未识别此项。**附加修正**：@theme inline 中 mono/display-sm 自引用 var 须改字面 px。05-UI §5 已全部更新为含上述修正的 hex token 规格（参见"ui-designer 设计决策"章）。**frontend 可依据 §5 最新 CSS 落地**，无残留阻塞。
- 2026-06-02 03:18:58 set status=in_progress
- 2026-06-02 frontend 实现完成（加法式 + 值重指向落地，严守 AC8 隔离）：
  **改动文件（仅 4 个）**：`app/layout.tsx`、`app/globals.css`、`package.json`、`pnpm-lock.yaml`。零组件 JSX / 零 messages / 零 API（git status 已核 components/ 与 messages/ 无变更）。
  **AC1 字体**：`pnpm add @fontsource/geist-mono`（→ deps 5.2.8，400.css/600.css 已落 node_modules）；layout.tsx 顶部按现有 `@fontsource-variable/inter` 同款写法加 `import "@fontsource/geist-mono/400.css"` 与 `/600.css`；`@theme inline` 的 `--font-mono` 改为 `"Geist Mono", ui-monospace, "Cascadia Code", monospace`（16+ 处 font-mono 工具类即刻生效）。
  **AC2 新 token**：globals.css 新增 `--brand*/--amber*/--warn*`（light+dark 双块）+ `@theme inline` 桥接 `--color-brand*/--color-amber*/--color-warn*`、`--shadow-glow-brand/-amber`、`--radius-xs/-xl`(2/12px)、`--text-mono-sm…-3xl`(字面 px，无自引用)、`--text-display-sm`(18px)。radius 降档 sm/-/-lg=3/5/8px。
  **AC3 旧消费者整体变色**：旧 canonical `--indigo*`→`var(--brand)`(teal)、`--marketing-accent*`→`var(--amber)`、`--marketing-hero-bg`=none、`--marketing-gradient-cta`=teal→teal、glow 阴影=简化 teal/amber 值。明/暗/`prefers-color-scheme` 镜像块三处全同步。
  **AC4 别名保留**：`--color-indigo*`/`--color-marketing-accent*`/`--shadow-glow-indigo`/`--shadow-glow-pink` 桥接全部保留（值已指向新色），未删任何旧 token/工具类。
  **AC5 对比度 AA**：`pnpm a11y:contrast` **26/26 全过**（light teal #0f766e 5.20/4.94、amber #b45309 4.77/4.53；dark 加 `--primary-fg/--accent-fg/--marketing-accent-fg=#0e1117` 覆盖 → 按钮文字 10.15/11.32:1）。所有 canonical 色填 hex literal（脚本不认 oklch）。
  **AC6 构建/类型/lint**：`pnpm check` exit 0（typecheck+lint+a11y+i18n parity 504/504）；`pnpm build` exit 0。
  **额外修正（超 §5，遵同源逻辑）**：dark 与镜像块另加 `--accent-fg:#0e1117`（`--accent`=brand=亮 teal，否则 bg-accent/text-accent-foreground 组合在暗色为白字浮于亮 teal 不可读）—— 不在 check-contrast 检查对内，但保 AC7 视觉正确。
  **遗留/移交**：AC7（真浏览器明暗双主题目测关键区块）+ AC1 DevTools 核 font-mono 计算字体 → 交 QA 验证（本地已构建通过，纯前端无外部密钥）。组件工具类逐一改名（text-marketing-accent→text-amber 等）仍属 T09/T10/T08b，本工单未动。无阻塞项。
- 2026-06-02 03:25:37 set status=in_review
- 2026-06-02 code-reviewer 代码审查（diff `main...feature/ISSUE-5`）：
  **结论：通过（建议放行 QA）。** 必改 0 · 已直接修复 1 · 建议/可选 2。提交规范 ✓（Conventional Commits，标题含工单号）。隔离性 AC8 ✓（diff 仅 `app/globals.css`/`app/layout.tsx`/`package.json`/`pnpm-lock.yaml`，components/ 与 messages/ 零改动，git 可核）。
  **逐项核对**：AC1 layout import + `--font-mono` 首位 Geist Mono ✓；AC2 新 `--brand*/--amber*/--warn*` + 桥接 + radius/mono-scale/display-sm（字面 px 无自引用）✓；AC3 旧 canonical 重指向 `var(--brand)/var(--amber)`、hero-bg=none、cta=teal、glow 简化，明/暗/镜像三块同步 ✓；AC4 旧 `--color-indigo*/--color-marketing-accent*/--shadow-glow-*` 桥接全保留、零删除 ✓；AC5 `a11y:contrast` 26/26 复跑通过 ✓；语义别名 `--primary/--accent` 及其 `-fg` 明暗两套齐全且达标 ✓。
  **已直接修复（commit 487bbba，fix/ISSUE-5）— bug/契约一致性，建议改级**：新 canonical token `--amber-fg` 仅在 light `:root` 定为 `#ffffff`，**dark 两块（`[data-theme="dark"]` + `prefers-color-scheme` 镜像）漏覆盖** → 与其 legacy twin `--marketing-accent-fg`（dark 已覆盖 `#0e1117`）不一致。下游 T09 一旦用 `bg-amber text-amber-fg`，暗色为白字浮于亮 amber `#fbbf24`（~1.6:1，违反 AA）；`check-contrast.ts` 只审计 `--marketing-accent-fg` 故构建不拦截（静默坑）。已补 dark 两块 `--amber-fg:#0e1117`，contrast 仍 26/26。
  **建议改（不阻塞，留 T09 注意）**：
  ① `app/globals.css:322` 桥接了 `--color-amber-fg` 但无 `--color-brand-fg`/`--color-warn-fg`，canonical fg 命名不对称——brand 走 `--color-primary-foreground`（明暗已处理）可用，warn 暂无 fg；T09 若需 warn 作填充底色，记得补 `--warn-fg` 明暗两套。
  ② `--marketing-grid-line`（L123/223/283，明暗镜像三处已同步 ✓）未桥接到 `--color-*`，仅供 `var()` 直引；当前 components/ 零消费，属 T09 前瞻 token，非问题，提示下游按 `var(--marketing-grid-line)` 直引而非工具类。
  **风格/可维护性**：值重指向用 `var(--brand)` 链 + 注释标注 legacy 别名意图，可读性好；`--font-weight-body` 500→400 属 §5 范围内全站正文字重变化，交 QA 目测正文可读性。**无其他坏味道。**
  **移交 QA**：AC7（真浏览器明暗双主题关键区块目测：Hero/CrossSignalDemo/Why-Stats/QuickStart/DP CTA/导航/页脚，无掉色/丢边框/主题切换闪烁）+ AC1 DevTools 核 font-mono 计算字体 = Geist Mono + 抽查旧工具类元素 computed 色已 Teal/Amber。建议放行 QA。
