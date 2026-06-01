---
id: ISSUE-13
type: feature
title: [T12] 关键路径E2E(Playwright)
status: in_progress
priority: P0
assignee: fullstack-engineer
created: 2026-06-01
updated: 2026-06-02
---

## 描述
模块:关键路径E2E(Playwright) | 角色:fullstack | 依赖:T01,T02,T04,T05 | 里程碑:M1 | 验收:装Playwright;覆盖两表单端到端(mock2xx→成功卡)+locale切换保滚动+CodeBlock复制+内链2xx+限流429;本地test:e2e绿 | 详见 07-开发任务拆分.md(T12) 与 06-技术架构.md/READINESS.md

## 需求说明


## 验收标准
- ① Playwright 已装（@playwright/test 1.60，chromium 浏览器就绪）。
- ② E2E 覆盖关键路径：两表单端到端（mock API 2xx → 持久成功卡）、两表单限流 429 态（amber 温和提示 + 表单/已填内容保留）、locale 切换保滚动、CodeBlock 复制翻转 Copied、关键内链 EN+ZH 2xx。
- ③ 本地 `pnpm test:e2e` 全绿。

## 自测记录（fullstack）
- 新增 `tests/e2e/issue13-t12-critical-paths.spec.ts`（7 用例）；新增 `package.json` 脚本 `test:e2e: playwright test`。
- 单文件跑：`pnpm exec playwright test issue13-t12-critical-paths` → 7/7 PASS。
- 全量 `pnpm test:e2e` → **66/66 PASS**（含既有 analytics-funnel 14 + issue4/6/10/11/12 等回归，无退化）。
- `pnpm check`：typecheck 0 / eslint 0 / a11y:contrast 26/26 AA / i18n parity 511=511；`pnpm build` exit 0。
- **根因修复（systematic-debugging）**：locale 切换「保滚动」(PRD D6/§128、UX C-1) 实际未生效——`locale-switcher.tsx` 的 `router.replace(pathname,{locale})` 缺 `scroll:false`，Next 默认在 en↔zh 路径变更时滚到顶部。新 E2E 用例首跑捕获此回归（switch 后 scrollY=0）。已加 `scroll: false` 修复，复跑该用例 PASS，且不影响 analytics 的 locale_switch 埋点用例。
- 说明：两表单/CodeBlock API 全程 mock，无需 Resend/Upstash 外部密钥；内链 2xx 用 Playwright request 直查 EN 根 + /zh 镜像。

## 改动文件
- `tests/e2e/issue13-t12-critical-paths.spec.ts`（新增，7 用例）
- `package.json`（新增 `test:e2e` 脚本）
- `components/locale-switcher.tsx`（`scroll: false` 修复保滚动）

## 处理记录
- 2026-06-01 23:30:28 工单创建（feature / P0）
- 2026-06-02 06:59:06 set assignee=fullstack-engineer
- 2026-06-02 06:59:06 set priority=P0
- 2026-06-02 06:59:06 set status=triaged
- 2026-06-02 06:59:06 LANE: light
- 2026-06-02 06:59:06 EXTRA_ROLES: none
- 2026-06-02 06:59:23 set status=in_progress
