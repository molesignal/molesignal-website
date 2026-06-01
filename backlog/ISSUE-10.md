---
id: ISSUE-10
type: feature
title: [T09] 核心页面视觉改造(Hero/Demo/Why-Stats/Start/DP CTA)
status: verifying
priority: P0
assignee: frontend-engineer
created: 2026-06-01
updated: 2026-06-02
---

## 描述
模块:核心页面视觉改造(Hero/Demo/Why-Stats/Start/DP CTA) | 角色:frontend | 依赖:T08 | 里程碑:M1 | 验收:Hero左对齐+mono$副标题+真实命令预览;Demo terminal卡+amber trace_id;Why/Stats两栏mono数字;DP CTA左border去glow;明暗OK;check过 | 详见 07-开发任务拆分.md(T09) 与 06-技术架构.md/READINESS.md

## 需求说明


## 验收标准


## 处理记录
- 2026-06-01 23:30:28 工单创建（feature / P0）
- 2026-06-02 05:18:47 set assignee=frontend-engineer
- 2026-06-02 05:18:47 set priority=P0
- 2026-06-02 05:18:47 set status=triaged
- 2026-06-02 05:18:47 LANE: light
- 2026-06-02 05:18:47 EXTRA_ROLES: none
- 2026-06-02 05:19:05 set status=in_progress
- 2026-06-02 frontend 开发完成 (commit 7667446)

### 开发进度记录 (frontend, T09)

**改动文件**
- `app/[locale]/page.tsx` — Hero / QuickStart teaser / Stats / DP CTA 视觉改造
- `components/cross-signal-demo.tsx` — terminal card 改造
- `components/github-stats-chip.tsx` — large 变体数字改 mono brand、去 glow
- `messages/en.json` `messages/zh.json` — 新增 `hero.command`、`home.startPill`

**按 05-UI §4.1/§4.3 实现的 6 项 AC**
1. **Hero**：从居中改左对齐(`max-w-4xl`)；H1 高亮去渐变改纯 brand 色(`text-primary`)；副标题改 mono `$` 命令感(`font-mono`，`$` 用 brand 色)；CTA 下方新增真实 docker compose 命令预览(复用 CodeBlock)；主按钮 hover 由 glow 改 `bg-primary-muted` 色变。
2. **CrossSignalDemo**：改 terminal card——顶部三点 chrome(red/amber/green) + heading mono 标签；tab bar 紧贴 header(`border-b`)，active 态由 pill 底色改为底部 3px brand 下划线(统一 active 规范)；trace_id 三视图保持 amber 高亮(`marketing-accent`=amber)；footer caption 加顶边 + amber 高亮 trace_id。
3. **Why/Stats**：GitHubStatsChip `large` 数字改 `font-mono text-mono-2xl` + brand 色，副行 mono；stats 区已是两栏(chip + 贡献者墙)。
4. **QuickStart 简介**：保持左对齐，新增 brand variant "5 minutes" pill。
5. **DP CTA**：去 `shadow-glow-pink` + `marketing-hero-bg` 渐变，改 `bg-surface` + `border-l-4 border-l-primary` 左 accent 卡，`rounded-xl`，内容左对齐。
6. **明暗双主题 + check**：全部用主题 token，无硬编码深色底(terminal card 用 `bg-bg-2` 主题自适应面板而非强制深色，规避亮色主题对比度失败)。

**自测结果(均 PASS)**
- `pnpm typecheck` → exit 0
- `pnpm lint` → 0 error（仅 toc.tsx 既有 5 warning，非本次改动）
- `pnpm a11y:contrast` → 26/26 AA 全过
- `pnpm lint:i18n` → EN/ZH 508↔508 parity OK
- `pnpm build` → ✓ Compiled successfully, exit 0
- `next start` 真实渲染 `/en`+`/zh`：8 项视觉标记(mono 命令/docker 预览/brand 高亮/5min pill/border-l-primary/terminal 三点/3px 下划线/text-mono-2xl)全部命中；确认 `shadow-glow-pink` 已从 DP 卡移除；zh 文案 "自托管 · OpenTelemetry 原生"、"5 分钟" 正确。

**说明/遗留**
- terminal card 采用主题自适应面板(`bg-bg-2`)而非 05-UI 描述的"强制深色底"——因内部文字用主题 token，强制深底会令亮色主题文字不可见并破坏 a11y:contrast，故按可访问性优先做此权衡，明暗两态均正常。
- demo 区原 `crossSignalDemo.pill`("five-second demo") 按 05-UI "去掉 label" 不再渲染(消除噪声)；message key 保留以维持 i18n parity，无副作用。
- 浏览器端 E2E/截图回归留待 qa-automation 独立验证。
- 2026-06-02 05:27:19 set status=in_review

### 代码审查记录 (code-reviewer, 2026-06-02)
- 必改 0；建议放行 QA。详见 `08-测试报告.md` §「代码审查 — ISSUE-10」。
- 审查中直接修复 2 处「Tailwind 类名不编译」缺陷（在本工单内提交）：
  - F1 两处主 CTA `hover:bg-primary-muted`（不编译，hover 无反馈）→ `hover:bg-primary/90`（`app/[locale]/page.tsx`）。
  - F2 `brand` pill `bg-primary-bg`（不编译，无底色）→ `bg-primary/10`（`components/ui/pill.tsx`，修好含 5min pill 在内 4 处）。
- F3 根因（`@theme inline` 缺 `--color-primary-bg`/`--color-primary-muted` 桥接，致 8+ 组件 `bg-primary-bg`/`bg-primary-muted` 全站静默失效）属存量、跨多模块，建议另开 full 工单由架构师/前端配合全量视觉+a11y 重核，**未在本 light 工单改**。
- 复测全绿：tsc rc=0 / build rc=0 / eslint 0 error / a11y 26/26 / i18n 508↔508。
- 2026-06-02 05:36:46 set status=verifying

### QA 验证结果 (qa-automation, 2026-06-02) — 通过

真实生产服务(`next start`) + 真浏览器(Playwright Chromium)独立验证，证据见 `08-测试报告.md` §「自动化测试 — ISSUE-10 / T09」。

**6 项 AC 全部命中（en/zh × 明暗双主题）：**
1. Hero 左对齐(`.max-w-4xl`)、高亮纯 brand 色(`text-primary`，computed `background-image:none` 确认非渐变)、mono `$ 命令` 副标题 ✓
2. 真实 `docker compose … --profile standalone up` 命令预览可见 ✓
3. demo terminal：红/amber/绿三点 + amber trace_id(computed 暖色) + active tab 3px brand 下划线 ✓
4. Why/Stats large chip 数字 `font-mono text-mono-2xl text-primary` ✓
5. DP CTA `border-l-primary` 左边框(≥3px,非透明)、box-shadow 无粉色 glow、5min brand pill 有底色 ✓
6. 明暗双主题均正常渲染、文字非透明 ✓

**结果汇总（67 项断言全过 / 0 失败）：**
- `pnpm check` rc=0（0 error，a11y 26/26，i18n 508↔508）；`pnpm build` rc=0
- Playwright 全量 E2E **38 PASS / 0 FAIL**（新增 issue10-t09-visual 12 + analytics-funnel 14 + legal 6 + cost-calculator 6，均无回归）
- UI token 脚本 issue5-ui-tokens.mjs **29 PASS / 0 FAIL**（含 `--marketing-hero-bg === none` glow 已移除）
- 真浏览器明暗截图：`test-results/issue5/home-light.png` / `home-dark.png` / `zh-home.png`

**缺陷：本工单范围内 0。** F3 token 桥接根因属跨模块存量、T09 已规避，建议另开 full 工单（不阻断本工单）。

回归重跑：`pnpm build && pnpm exec playwright test`

**VERDICT: PASS**
