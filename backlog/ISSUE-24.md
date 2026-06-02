---
id: ISSUE-24
type: feature
title: [T23] CrossSignalDemo接真实查询
status: in_progress
priority: P2
assignee: frontend-engineer
created: 2026-06-01
updated: 2026-06-02
---

## 描述
模块:CrossSignalDemo接真实查询 | 角色:fullstack | 依赖:产品后端 | 里程碑:M3 | 验收:接真实/沙箱查询后端(跨项目需用户决策,默认保持写死样本);reduce-motion守卫保留 | 详见 07-开发任务拆分.md(T23) 与 06-技术架构.md/READINESS.md

## 需求说明


## 验收标准


## 处理记录
- 2026-06-01 23:30:29 工单创建（feature / P2）
- 2026-06-02 10:55:24 set assignee=frontend-engineer
- 2026-06-02 10:55:24 set priority=P2
- 2026-06-02 10:55:24 set status=triaged
- 2026-06-02 10:55:24 LANE: light
- 2026-06-02 10:55:24 EXTRA_ROLES: none
- 2026-06-02 10:55:42 set status=in_progress
- 2026-06-02 frontend-engineer 开发完成（light 道，待代码审查 + 独立 QA）：
  **决策**：①「接真实/沙箱查询后端」需跨项目+用户拍板——本期无真实/沙箱查询后端可接（molesignal 查询引擎是独立产品，本组件是营销站"五秒 demo"插图，文案 pill="five-second demo" 已诚实标注），按工单**默认保持写死样本**（沿用 T21/ISSUE-22 取稳妥默认的先例）；② reduce-motion 守卫**保留**并上锁。
  **改动文件**：
  - `components/cross-signal-demo.tsx`：docblock 增 T23 决策记录（为何保持写死 + 日后接 sandbox 端点的改造边界：仅替换三个 View fixture，不动 tab/auto-tour 外壳，reduce-motion 守卫必须保留）；root 加 `data-testid="cross-signal-demo"` 便于测试定位。无功能性逻辑改动。
  - `tests/e2e/issue24-t23-cross-signal-demo.spec.ts`（新增，4 用例）：
    ① 单一 trace_id(abc123) 贯穿 Trace/Logs/Metric 三视图——产品核心契约 "one trace_id, three views"；
    ② `prefers-reduced-motion: reduce` → auto-tour 跳过，等待 >1 个 interval 后仍停在 Trace（**守卫保留客观验证**）；
    ③ `no-preference` → auto-tour 自动推进 Trace→Logs（证明守卫是活闸而非死代码）；
    ④ 用户交互取消 auto-tour（点 Metric 后跨 2 个 interval 仍停 Metric）。
  **自测**：`pnpm typecheck` 0 错 / `pnpm lint` 0 错 / `a11y:contrast` 26/26 AA / `lint:i18n` 518=518 / `pnpm build` rc=0 / `pnpm test:e2e` **82 passed**（既有 78 零退化 + 本工单 4）。
  **阻塞/遗留**：无代码阻塞。〔需外部〕真实/沙箱查询后端 + 用户对"是否接真实后端"的拍板——日后若提供 sandbox 查询端点，按 docblock 写明的边界替换三个 View fixture 即可启动复验；`demo_tab_switch` 埋点已由 analytics-funnel.spec 既有覆盖，未重复。
  提交：`a7aee80 feat(ISSUE-24): T23 ...`
