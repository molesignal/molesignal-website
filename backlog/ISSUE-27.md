---
id: ISSUE-27
type: feature
title: Roadmap tab 与 URL hash 同步改版后回归守卫
status: in_progress
priority: P2
assignee: frontend-engineer
created: 2026-06-02
updated: 2026-06-02
---

## 描述
对应就绪标准【M3 已实现项回归：roadmap tab 与 URL hash 同步】(READINESS.md 第72行, PRD §7)。这是当前唯一无外部依赖且可在一个迭代周期完成的未勾选就绪项。组件: components/roadmap-list.tsx(已实现 hash 同步)。需新增 Playwright E2E 用例对 UI 改版后的 roadmap tab↔URL hash 双向同步写客观断言守护不退化，并入 test:e2e 全量回归。

验收标准(AC):
AC1 点击某 roadmap phase tab 后, 浏览器 URL hash 更新为该 phase 对应锚(如 #phase-shipped / #now / 实际实现的 hash 命名), 内容区切到对应 phase。
AC2 直接以带 hash 的 URL(如 /en#<phase-hash>)加载页面, roadmap 初始即定位/高亮到对应 phase tab(深链可用)。
AC3 浏览器前进/后退(history)在多个 phase 间切换时 tab 与内容随 hash 正确联动。
AC4 EN 与 ZH 两 locale 下行为一致(切 locale 不破坏 hash 同步)。
AC5 真实 chromium 跑生产 next build+next start; 全量 pnpm test:e2e 零退化(既有用例全绿 + 新增 roadmap 用例全绿); pnpm check(tsc 0/eslint 0/a11y AA/i18n parity)+build rc=0。
AC6 若发现改版后 hash 同步已退化, 用 systematic-debugging 找根因修复后再以 E2E 守卫。

注: 本工单走 light 道(开发→代码审查→独立 QA), 不命中红线(不涉安全/数据模型/接口契约/核心交易, 单组件局部改动)。完成后 READINESS.md 第72行可勾 [x], 就绪分 29→30/31。

## 需求说明


## 验收标准


## 处理记录
- 2026-06-02 12:43:29 工单创建（feature / P2）
- 2026-06-02 12:44:05 set assignee=frontend-engineer
- 2026-06-02 12:44:05 set priority=P2
- 2026-06-02 12:44:05 set status=triaged
- 2026-06-02 12:44:05 LANE: light
- 2026-06-02 12:44:05 EXTRA_ROLES: none
- 2026-06-02 12:44:21 set status=in_progress
- 2026-06-02 frontend-engineer 开发完成（light 道，待代码审查→独立 QA）：
  - **改动文件**：新增 `tests/e2e/issue27-t-roadmap-hash-sync.spec.ts`（5 用例，纯测试守卫；生产代码零改动 —— 经核查 `components/roadmap-list.tsx` hash 双向同步功能完好，无退化，无需 systematic-debugging 修复）。
  - **契约纠偏（AC 文案 vs 实际实现）**：① roadmap 在 `/[locale]/roadmap`，非首页；hash 即 phase 键本身 `#now/#next/#later/#done`（AC 推测的 `#phase-shipped`/`/en#...` 不成立）。② 默认 locale `en` 无 URL 前缀 → 路由为 `/roadmap`（`/en/...` 请求 307 重定向至此、hash 保留）；`zh` 保留 `/zh`。③ tab 点击用 `history.replaceState`（**有意不入 history 栈**，避免污染前进/后退），`hashchange` 监听器驱动深链(挂载读取)与浏览器前进/后退。
  - **AC 覆盖**：AC1 点 tab→URL hash 更新+内容切换（逐 phase 点击，断言 `//host/roadmap#<phase>` + aria-selected + 内容区 article 数与 phase pill 字面量，locale 无关）；AC2 深链 `/roadmap#done`(1 项)/`#later` 挂载即定位（用计数差异证明 mount 读取生效）+ AC2b 非法 hash 回退默认 tab 不崩；AC3 浏览器前进/后退经 hash 赋值制造真实 history 条目后 goBack/goForward 与 tab+内容联动；AC4 ZH locale 深链/点击/前进后退全一致（先验 ZH 标签确证 locale 渲染）。
  - **自测**：真实 chromium 跑生产 `next build`+`next start`。本工单 5/5 PASS；全量 `pnpm test:e2e` **106 passed**（既有 101 零退化 + 新增 5）；`pnpm check`（tsc 0 / eslint 0 / a11y:contrast 26/26 AA / i18n parity EN 518=ZH 518）+ `pnpm build` 双 rc=0。AC5 达成。AC6 N/A（未发现退化）。
  - **阻塞项**：无。READINESS.md 第72行 [x] 与就绪分 29→30 留待独立 QA PASS 后由引擎回写（开发者不自判通过）。
  - **设计说明（供审查/QA 知悉）**：AC3 不用「点 tab 后 goBack 回上一 phase」断言，因 tab 点击走 replaceState 不入栈（这是组件有意设计，非 bug）；改用 `location.hash` 赋值产生真实 history 条目来客观验证前进/后退联动，既守护 `hashchange` 监听器为活闸又不误判 replaceState 设计为缺陷。
