---
id: ISSUE-13
type: feature
title: [T12] 关键路径E2E(Playwright)
status: verifying
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
- 2026-06-02 07:06:52 set status=in_review

## 代码审查（code-reviewer）

审查范围：`git diff main...feature/ISSUE-13`（4 文件 / +205）。LANE: light，未命中红线（仅新增测试 + 一行无契约影响的导航选项修复）。

**结论：必改 0 / 建议 0 / 可选 3 —— 建议放行到 QA。**

### 契约 & 正确性（逐项核对真实组件，非仅信自测）
- 表单 2xx/429 选择器全部命中真实组件：`#cw-email` / `#dp-name,#dp-email,#dp-size,#dp-stack,#dp-pain` 与 `cloud-waitlist-form.tsx` / `design-partner-form.tsx` 一致；成功卡 `role=status`、429 amber `border-amber` class 均与组件渲染吻合。
- 断言文案全部对齐 `messages/en.json`：`successPrefix="You're on the list."`、`successTitle="Thank you. We'll reply within 48 hours."`、cloud/dp `rateLimit` 文案、`locale.label="Language"`、`locale.zh="中文"`、`common.copy/copied="Copy/Copied"`。无漂移。
- **保滚动修复属真根因修正**（非测试将就）：`locale-switcher.tsx` 用 next-intl `createNavigation` 的 `useRouter`，`router.replace(pathname,{locale,scroll:false})` 的 `scroll` 选项受支持；修复符合 PRD D6 / UX C-1，且由新 E2E 用例首跑捕获（switch 后 scrollY=0）→ 修后 PASS。
- 路由 2xx 用例依赖 Playwright `request.get` 默认跟随重定向把 `/zh/blog`（EN-only 重定向）收敛为 2xx，注释已说明，OK。

### 我已独立验证（未跑全量 e2e，因需生产构建+起服务；以静态校验+自测证据交叉佐证）
- `tsc --noEmit` exit 0；`eslint`（spec + locale-switcher）exit 0。
- 自测记录 66/66 PASS、`pnpm check` 全绿、`build` exit 0，与上述静态核对一致，可信。

### 可选改进（不阻塞，留待后续顺手优化）
1. `issue13-...spec.ts:143` `toContainText("Copy")` 作初始断言偏弱（"Copied" 亦含 "Copy" 子串）；初始态确为 "Copy" 故不影响正确性，若想更严可用 `toHaveText(/^Copy$/)`。
2. `:120` `waitForTimeout(400)` 为软导航固定等待，轻微 flaky 倾向；可换 `expect.poll` 盯 scrollY 更稳。
3. 提交规范 ✓（`feat(ISSUE-13): ...` Conventional Commits、含工单号）。

— code-reviewer 2026-06-02
- 2026-06-02 07:09:37 set status=verifying

## QA 验证结果（qa-automation，2026-06-02）

**独立验证方式（真实运行，非信自测）**：`pnpm build` exit 0 → `pnpm test:e2e`（playwright 自起生产 `next start -p 3210`，真实 chromium 驱动）。

**证据**：
- 全量 `pnpm test:e2e` → **66 passed (37.3s)，0 失败 / 0 跳过**（本工单新增 7 + 既有 59 回归，零退化）。
- ISSUE-13 七用例全绿（#48–54）：cloud/design-partner 表单 2xx 成功卡 + 429 amber 保留态、locale EN→ZH 保滚动（#52 滚到 1200px→切换后仍 >600px，637ms）、CodeBlock 复制翻转 Copied、12 条内链 EN+ZH 均 2xx。
- 验收①Playwright+chromium 就绪 ✓；②关键路径全覆盖且真实浏览器跑通 ✓；③`pnpm test:e2e` 全绿 ✓。
- 源码核对：`locale-switcher.tsx` 仅 `scroll: false` 根因修复，用例 #52 为其行为回归守卫，验证生效。
- 测后 3210 端口无僵尸进程，环境清理干净。
- 详见 `08-测试报告.md` 「自动化测试 — ISSUE-13」小节。

**VERDICT: PASS**

— qa-automation 2026-06-02
