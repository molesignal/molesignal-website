---
id: ISSUE-11
type: feature
title: [T10] 表单页+成本/对比视觉改造
status: in_progress
priority: P0
assignee: frontend-engineer
created: 2026-06-01
updated: 2026-06-02
---

## 描述
模块:表单页+成本/对比视觉改造 | 角色:frontend | 依赖:T08 | 里程碑:M1 | 验收:CostCalc Savings amber mono大数+三结果卡语义色+滑块44px;CompareTable brand顶边✓✗mono;表单成功持久卡(绿)+限流温和提示(amber);DP三步;check过 | 详见 07-开发任务拆分.md(T10) 与 06-技术架构.md/READINESS.md

## 需求说明


## 验收标准


## 处理记录
- 2026-06-01 23:30:28 工单创建（feature / P0）
- 2026-06-02 05:44:50 set assignee=frontend-engineer
- 2026-06-02 05:44:50 set priority=P0
- 2026-06-02 05:44:50 set status=triaged
- 2026-06-02 05:44:50 LANE: light
- 2026-06-02 05:44:50 EXTRA_ROLES: none
- 2026-06-02 05:45:07 set status=in_progress

## 开发进度（frontend / T10）

**改动文件**
- `components/cost-calculator.tsx` — 三结果卡语义色重映射：Datadog=red(贵) / molesignal=brand teal(便宜) / Savings=amber(省钱)；Savings 数字 amber + Geist Mono + tabular-nums；新增 `amber` tone，移除冗余 `good` tone；滑块加 `h-11`（44px 触摸区，WCAG 2.5.5）+ `cursor-pointer`，原生细 track 居中不变形。
- `components/compare-table.tsx` — ✓/✗/~ 改为字面 mono 字符（`font-mono font-strong`，弃用 lucide Check/X/Minus）：✓ green / ✗ red-soft / ~ warn；molesignal 列头加 `border-t-[3px] border-t-brand`，Datadog 列头加 `border-t-[3px] border-t-red-soft`。
- `components/cloud-waitlist-form.tsx` — 成功态拆分：footer 保留紧凑内联确认，`/cloud` 独立表单改为持久绿色成功卡片（CheckCircle 24px green + display-sm 标题 + body + GitHub star chip）；新增 429 限流处理 → 温和 amber 提示（`RateLimitNotice` 组件，amber-dim 背景 + 左 3px amber 边，非红色 error）。
- `components/design-partner-form.tsx` — 成功卡片由 teal 改为绿色语义（border-green/20 bg-green-dim，CheckCircle 24px green，标题 display-sm）；新增 429 限流 → amber 内联提示（保留已填表单不丢内容），非红 toast。
- `app/[locale]/design-partner/page.tsx` — "What happens after" 三步：步骤数字改 font-mono text-lg brand + brand-dim 圆形（h-8 w-8），步骤间加竖向 dashed 连接线（border-bd-1，仅桌面 md:block，移动隐藏）。
- `messages/en.json` / `messages/zh.json` — 新增 `cloud.form.rateLimit`、`cloud.form.successBody`、`designPartner.form.rateLimit`（EN↔ZH 同步，parity 511=511）。

**自测**：`pnpm check`（typecheck + eslint + a11y:contrast + i18n:parity）全过 —— 类型 0 错、lint 0 错、对比度 26/26 达 WCAG AA、i18n parity OK。

**遗留/备注**：限流 amber 提示依赖后端在限流时返回 HTTP 429（契约一致）；当前 `/api/*` 路由的 429 由 T11/Upstash 提供，本工单仅做前端展示态，未触达后端逻辑。warn 色小字形为 aria-hidden 装饰，语义由相邻 value 文案承载。
- 2026-06-02 05:54:22 set status=in_review

## 代码审查（code-reviewer / 2026-06-02）
- **必改 1（已直接修复并构建验证）｜建议放行 QA。**
- **F1 必改（已修）** `cost-calculator.tsx:222`：molesignal 卡 `tone="brand"` 用了不编译的 `border-primary-muted bg-primary-bg`（`--color-primary-bg/-muted` 未注册进 `@theme`，同 ISSUE-10 F1/F2 根因）→ 中心「更便宜」卡无底色无边框，AC 未达成。改为 `border-primary/30 bg-primary/10`。
- **F2 必改（已修）** `design-partner/page.tsx:98`：三步圆形 `bg-primary-bg` 不编译无填充 → 改 `bg-primary/10`。
- **F3 建议改（已修）** `compare-table.tsx:73`：molesignal 列头 `bg-primary-bg`/`ring-primary-muted/30` 不编译 → 改 `bg-primary/10`/`ring-primary/30`（新增的 `border-t-brand` 顶边正常）。
- 其余 OK：两表单 429 逻辑/契约正确、i18n parity 511=511、注释同步。可选项：DP 表单 429 提示可与 cloud 的 `RateLimitNotice` 去重；footer tone 分支为存量未用 API。
- 验证（修复后）：`tsc` rc=0、`eslint` 0 error、`a11y:contrast` 26/26、`i18n:parity` OK、`next build` rc=0；编译 CSS 产物确认 `bg-primary/10`+`/30` color-mix 规则已生成、`bg-primary-bg` 字面类 0 次（佐证原写法不渲染）。
- **强烈建议另开 full 工单**：在 globals.css `@theme` 注册 `--color-primary-bg`/`--color-primary-muted`，根治全仓 8+ 站点（why/pricing/banner/github-chip/architecture 等）的 `bg-primary-bg` 失效存量。
- 2026-06-02 06:02:14 set status=verifying

## QA 验证结果（qa-automation / 2026-06-02）

**VERDICT: FAIL**（回流修复 1 处 Minor 缺陷 DEF-1）

- 执行：真 Chromium E2E（生产 `next start` 渲染）+ 全量回归 + 质量门 + 生产构建。新增套件 `tests/e2e/issue11-t10-visual.spec.ts`（12 例）。
- **质量门**：`pnpm check` 全绿（typecheck 0 / eslint 0 / a11y 26/26 / i18n 511=511）；`pnpm build` rc=0。
- **本工单 E2E**：10 通过 / 2 失败（2 失败均=DEF-1）。**全量回归**：48 通过 / 2 失败（仅 DEF-1，其余既有回归 0 回退）。
- **核心回归点已验证修复**：CostCalc brand teal 卡底色/边框、Savings amber mono 大数、滑块 44px、CompareTable brand 3px 顶边+真实 tint、两表单成功绿卡、429 amber 温和提示、DP 三步 brand 圆形——经浏览器内 canvas 解析 computed 颜色逐项确认**真实上色**（ISSUE-10/11 同源「类名不上色」风险不再复现）。
- **DEF-1（Minor / 外观，无功能影响）** `components/compare-table.tsx:195-207` `VerdictIcon`：对比表 ✓/✗/~ 标记 computed `font-family` = `"Inter Variable"…`（**非等宽**），与 AC「✓✗mono」/05-UI §3.7 不符。全站 64 ✓+28 ✗ 均受影响（桌面+移动、/why 与 / 两页）。根因：`cls` 中 `font-mono font-strong` 经 `cn()`=`twMerge`，`font-strong`（自定义 weight）被并入 `font-*` 冲突组、twMerge 保留末位 `font-strong` → **静默剔除 `font-mono`**（渲染 HTML 实测仅剩 `font-strong`）。
- **修复建议（一行级）**：`font-mono` 调到 `font-strong` 之后，或用 `[font-family:var(--font-mono)]`，或为 `cn` 配 `extendTailwindMerge` 声明 `font-strong` 为 weight 组根治。修复后 AC2 glyphs 两例应转绿。
- 证据：`08-测试报告.md` ＞「自动化测试 — ISSUE-11 / T10」小节；截图 `/tmp/compare-table.png`。
- 备注：缺陷视觉差异细微，若产品侧愿以「记 Minor 跟进、本轮放行」处理可由主管覆盖 PASS；纯 QA 闸门视角依 AC 字面判 FAIL。
- 2026-06-02 06:18:00 set status=reopened
- 2026-06-02 06:18:00 引擎周期#11: QA 未通过(verdict=FAIL), 回流
- 2026-06-02 06:19:09 set status=in_progress

## 回流修复（frontend / 第2轮 — DEF-1 根因修复）

**根因（非补症状）**：DEF-1（✓✗~ 非等宽）与一个同源潜伏缺陷的真正根因都在 `lib/utils.ts` 的 `cn()`：它用 tailwind-merge 默认主题，而该主题**完全不认识本仓 `globals.css` 里的自定义设计令牌**，于是把它们误并入错误的冲突组、静默丢弃本应共存的类：
- 自定义**字重** `--font-weight-*`（font-strong/body/ui/mono-strong/display/display-strong）落入 tailwind-merge 的 `font-family` 兜底组 → `cn("font-mono font-strong")` 被合并成只剩 `font-strong`，**丢掉等宽 family**（= DEF-1，compare-table ✓✗~ 渲染为 Inter 非等宽）。
- 自定义**字号** `--text-display-*`/`--text-mono-*` 落入 `text-color` 组 → `cn("...text-display-lg...","text-amber")` **丢掉 `text-display-lg`**（cost-calculator Savings「大数」实际没放大、也没加粗 `font-display-strong`）—— 这是 QA 未测到的同源潜伏缺陷，AC「Savings…大数」其实未达成。

**修复（1 文件，根治全仓 cn 路径）** `lib/utils.ts`：改用 `extendTailwindMerge`，在 `theme['font-weight']` 注册 6 个自定义字重名、在 `theme.text` 注册 12 个自定义字号名。tailwind-merge 据此正确归类——family/weight/size/color 四类各归其位、可共存，而同组真冲突（两个 family、两个 weight、两个 size、两个 color）仍按「末位胜出」正常去重。

**为何不用 QA 建议的「重排 font-mono 到末位」**：那只会让 twMerge 保留 `font-mono` 却**丢掉 `font-strong`**（字重 600→400），改变设计；根因修复让 family+weight 同时生效，且顺带修好 Savings 大数。

**改动文件**
- `lib/utils.ts` — `cn()` 由裸 `twMerge` 改为 `extendTailwindMerge({extend:{theme:{'font-weight':[...6],text:[...12]}}})`，附根因注释。
- 未改 `compare-table.tsx`/`cost-calculator.tsx`：它们的 className 本就正确，缺陷在合并层，故只动合并层（不补症状）。

**自测（均带 PATH=node v23.6.1）**
- 单元级断言（实际 import `@/lib/utils` 的 cn）：`cn("…font-mono font-strong…","text-green")` → 输出含 `font-mono` 且含 `font-strong` ✓；Savings → 同时保留 `font-display-strong`+`text-display-lg`+`font-mono`+`text-amber` ✓。
- 回归断言：两 family→末位胜出、两 weight→末位胜出、两 size→末位胜出、两 color→末位胜出、family+weight 共存、size+color 共存 —— 全部符合预期，0 回退。
- `pnpm check` rc=0（tsc 0 错 / eslint 0 错〔5 个既有 setState-in-effect warning 与本改无关〕/ a11y 26/26 / i18n 511=511）；`pnpm build` rc=0。

**遗留**：本修复让 `cn()` 全仓受益，凡此前被静默丢类的站点（如 cost-calculator Savings 大数）现一并恢复正确渲染——属修正非回归（family/size 与 weight/color 是不同 CSS 属性，丢弃本就是 bug）。建议 QA 复跑 issue11 套件，DEF-1 两例 glyphs 应转绿。
