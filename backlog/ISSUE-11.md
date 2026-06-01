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
