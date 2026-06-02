---
id: ISSUE-24
type: feature
title: [T23] CrossSignalDemo接真实查询
status: verifying
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
- 2026-06-02 11:01:59 set status=in_review
- 2026-06-02 code-reviewer 审查完成（light 道，审查范围 `git diff main...feature/ISSUE-24`）：
  **结论：通过，建议放行至独立 QA。必改问题 0 条。**
  - 生产代码为纯增量：`components/cross-signal-demo.tsx` 仅加 T23 决策 docblock + root `data-testid="cross-signal-demo"`，**零功能性逻辑改动**（tab/auto-tour/reduce-motion 守卫逐行核实未动）；新增 `tests/e2e/issue24-t23-cross-signal-demo.spec.ts`（4 用例）。
  - 三方契约闭合：testid、tablist 名 `Signal view`、tab 名 Trace/Logs/Metric、footer `trace_id=abc123` 均与 `messages/{en,zh}.json` 及 `playwright.config.ts:23`（默认 `reducedMotion:"reduce"`）对齐；reduce 守卫用例②/③ 正反双向锁定（证明为活闸非死代码）。
  - 决策合规：工单明确「跨项目需用户决策,默认保持写死样本」，无真实/沙箱后端可接，默认路径满足验收，docblock 标注日后改造边界（仅换三处 fixture、守卫必保留）。
  - 提交规范：`a7aee80` feat / `602971a` chore 均 Conventional Commits + 含工单号。✅
  - 唯一发现（**可选，不阻塞**）：spec 用例① 计数用一次性 `.count()` 非 web-first 重试；当前因 reduce 瞬时切换 + 下界 `>=2` 恒满足而无 flake，日后若视图改异步加载建议改 `toHaveCount`。
  - 详见 `08-测试报告.md`「代码审查 — ISSUE-24 / T23」小节。
- 2026-06-02 11:05:48 set status=verifying
- 2026-06-02 qa-automation 独立验证（light 道，真实构建 + 浏览器 E2E 执行）：
  **环境**：`pnpm build` rc=0（生产构建成功）；Playwright 对 `next start -p 3210` 跑真实 Chromium。
  **目标用例 `tests/e2e/issue24-t23-cross-signal-demo.spec.ts` —— 4/4 PASS**：
  ① one trace_id 贯穿 Trace/Logs/Metric 三视图（产品核心契约「one trace_id, three views」客观成立，footer 恒钉 `trace_id=abc123`）— PASS；
  ② `prefers-reduced-motion: reduce` → auto-tour 跳过、等待 >1 interval 后仍停 Trace（**reduce-motion 守卫保留**，验收点）— PASS；
  ③ `no-preference` → auto-tour 自动 Trace→Logs（证明守卫是活闸非死代码）— PASS；
  ④ 用户点 Metric 后跨 2 interval 仍停 Metric（交互取消 auto-tour）— PASS。
  **全量回归 `pnpm test:e2e` —— 82/82 PASS**（既有 78 零退化 + 本工单 4），52.6s，0 失败。
  **验收核对**：「接真实/沙箱查询后端（跨项目需用户决策，默认保持写死样本）」— 本期无真实/沙箱查询后端可接，按工单默认保持写死样本，组件 docblock 已诚实标注（pill="five-second demo"）并写明日后接 sandbox 端点仅替换三处 View fixture、守卫必保留的改造边界 ✓；「reduce-motion 守卫保留」— 用例②/③ 正反双向锁定，客观验证守卫为活闸 ✓。
  **缺陷**：阻断级 0 / 一般 0。
  **回归套件重跑**：`export PATH="$HOME/.nvm/versions/node/v23.6.1/bin:$PATH" && pnpm build && pnpm exec playwright test tests/e2e/issue24-t23-cross-signal-demo.spec.ts`（全量 `pnpm test:e2e`）。
  测后已确认 3210 端口释放、无 next start 僵尸进程。
  **QA 验证结果：通过**
  VERDICT: PASS
