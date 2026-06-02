---
id: ISSUE-27
type: feature
title: Roadmap tab 与 URL hash 同步改版后回归守卫
status: closed
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
- 2026-06-02 12:52:16 set status=in_review
- 2026-06-02 code-reviewer 代码审查（light 道，开发→**审查**→独立 QA）：
  - **审查范围**：`git diff main...feature/ISSUE-27` = 仅新增 `tests/e2e/issue27-t-roadmap-hash-sync.spec.ts`（170 行，5 用例）+ 工单记录；生产代码零改动。逐条核对测试断言 vs 被测组件 `components/roadmap-list.tsx` 与数据 `content/roadmap.json`。
  - **结论：无必改问题，建议放行到独立 QA。**
  - **正确性（核验通过）**：
    - 相数与计数：`COUNTS={now:2,next:2,later:2,done:1}` 与 `content/roadmap.json` 实际分布完全一致；`PHASES` 顺序与组件 `PHASE_KEYS`（now/next/later/done）一致。
    - hash 契约：组件 `setTab` 用 `history.replaceState(\`#${phase}\`)`（不入栈），`hashchange` 监听器驱动深链(mount 读取)与前进/后退——测试 AC3/AC4 用 `window.location.hash=...` 制造真实 history 条目再 goBack/goForward，精准避开「点 tab 不入栈」的有意设计，不会误判。设计说明准确。
    - 路由契约：`en` 默认无前缀（`/en/roadmap` 307→`/roadmap`，fragment 浏览器侧保留），`zh` 保留 `/zh`；正则 `//[^/]+/roadmap#<phase>$` 与 `/zh/roadmap#<phase>$` 区分正确，不会互相误配。
    - AC2b 非法 hash 回退：组件 mount 读取时 `PHASE_KEYS.includes("bogus")===false` → 保持默认 `now`，测试断言成立、不崩。
    - 内容断言 locale 无关性：`<Pill>` 渲染 `{m.phase}` 小写字面量，`articles.getByText(phase,{exact:true})` 大小写敏感且按元素整文匹配，EN 标签「Now」≠「now」不冲突，且已 scope 到 `article` 内，tab 文案不参与。
    - **`page.locator("article")` 全局选择器安全性**：已核验 roadmap 页（`app/[locale]/roadmap/page.tsx`）除 RoadmapList 外无其它 `<article>`；共享 layout/header/footer 亦无 `<article>`（其它含 article 的页面是独立路由，不会同时加载）。当前计数断言可靠。
  - **契约符合**：本工单为纯测试守卫，无接口契约变更；测试如实锁定组件既有行为，未发现 hash 同步退化（AC6 N/A 成立）。
  - **可维护性（建议改 / 可选，非阻塞）**：`page.locator("article")` 依赖「roadmap 页无其它 article」这一当前事实；若日后页面模板新增包裹性 `<article>` 会误伤。对回归守卫而言此敏感性可接受（甚至有助于及早发现结构变更），暂不强制。如后续想更稳，可给 RoadmapList 容器加 `data-testid` 后 scope 计数。
  - **提交规范**：单提交 `test(ISSUE-27): roadmap tab↔URL hash 双向同步改版后回归守卫`，符合 Conventional Commits（type=test + 工单号）。
  - **放行建议**：PASS，交独立 QA（qa-automation）真实 chromium 跑 `next build`+`next start` 全量 `pnpm test:e2e` 复核（开发自测 106 passed，以独立 QA 为准，开发者不自判通过）。
- 2026-06-02 12:54:26 set status=verifying
- 2026-06-02 qa-automation 独立验证（light 道，开发→审查→**独立 QA**）：
  - **环境**：真实 chromium，生产构建路径（`pnpm build` → playwright webServer `next start -p 3210`，`reuseExistingServer`）。node v23.6.1 / pnpm（corepack）。验证前清空 3210 端口确保非复用旧实例。
  - **AC5 闸门（全部 rc=0）**：① `pnpm build` rc=0（路由树含 `/[locale]/roadmap` → `/en/roadmap` + `/zh/roadmap`）。② `pnpm check` rc=0：tsc 0 / eslint 0 / a11y:contrast 26/26 AA / i18n parity EN 518=ZH 518。③ `pnpm test:e2e` **106 passed (56.9s)**，零退化（既有 101 全绿 + 新增 ISSUE-27 5 例全绿，编号 90–94）。
  - **逐 AC 复核（均 PASS）**：AC1 点 tab→URL hash 更新+内容切换（test:70 ✓）；AC2 深链 `/roadmap#done`/`#later` 挂载即定位（test:90 ✓）；AC2b 非法 hash `#bogus` 回退默认 tab 不崩（test:92 ✓）；AC3 浏览器前进/后退 hashchange 联动（test:93 ✓）；AC4 ZH locale 深链/点击/前进后退一致（test:94 ✓）；AC5 见上；AC6 N/A（无退化，生产代码零改动，无需修复）。
  - **独立核对**：测试断言计数 `{now:2,next:2,later:2,done:1}` 与 `content/roadmap.json` 实际分布一致；`PHASES` 与组件 `PHASE_KEYS` 一致；组件 `setTab` 用 `history.replaceState`（不入栈）、`hashchange` 监听器驱动深链与前进/后退——测试用 `location.hash` 赋值制造真实 history 条目精准验证，未误判设计。
  - **收尾**：测毕已清理 3210 端口，无僵尸进程。
  - **结论**：VERDICT: PASS。READINESS.md 第72行可勾 [x]，就绪分 29→30 待引擎回写。
  - VERDICT: PASS
- 2026-06-02 12:57:49 set status=closed
- 2026-06-02 12:57:49 引擎周期#28: QA PASS, 关闭
