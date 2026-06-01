---
id: ISSUE-12
type: feature
title: [T08b] TopNav/Footer/Pill/Button视觉改造
status: in_review
priority: P0
assignee: frontend-engineer
created: 2026-06-01
updated: 2026-06-02
---

## 描述
模块:TopNav/Footer/Pill/Button视觉改造 | 角色:frontend | 依赖:T08,T04 | 里程碑:M1 | 验收:TopNav56px+brand mono+active下划线+滚动blur;Footer四列+禁用态;Button/Pill/Badge variants按规格;不与T04冲突;check过 | 详见 07-开发任务拆分.md(T08b) 与 06-技术架构.md/READINESS.md

## 需求说明
TopNav/Footer/Pill/Button 视觉改造，按 05-UI §3.1/§3.4/§3.6 把组件迁到已迁移的 teal/amber 设计 token，与 T04 死链改动不冲突。

## 验收标准
- ① TopNav 高度 56px + brand 等宽字体 + active 下划线（2px brand 底边，非背景填充） + 滚动 blur
- ② Footer 四列 + 禁用态链接样式（T04 已建立的 aria-disabled 不动）
- ③ Button/Pill/Badge variants 按规格（teal/amber token + 正确 glow + 按压反馈）
- ④ 与 T04 死链改动不冲突
- ⑤ `pnpm check` + `pnpm build` 过

## 开发记录（frontend-engineer, 2026-06-02）
**实现 T08b 全部范围，改动文件：**
- `app/globals.css`：`--nav-h` 与 `--spacing-nav` 4rem→3.5rem（56px，§3.4）。下游 `var(--nav-h)` 的 sticky 偏移（toc/changelog）随之收紧，方向正确。
- `components/layout/top-nav.tsx`：① brand wordmark 改 `font-mono font-mono-strong text-mono-lg`（15px 等宽，像 CLI 工具名）；② 主导航 active 态由 `bg-bg-hover` 填充改为 `border-b-2 border-brand text-fg` 下划线式（base 预留透明 2px 底边防跳动），hover 仅变文字色；③ Resources 下拉 open 态去掉 bg 填充；④ 滚动背景 `bg-surface/85 backdrop-blur`→`bg-surface/90 backdrop-blur-md`(12px)；⑤ 桌面/移动 CTA glow 改用 canonical `hover:shadow-glow-brand`。
- `components/layout/footer.tsx`：内/外链颜色由 `text-fg hover:text-primary` 改为 `text-fg-muted hover:text-fg`（§3.4：默认 tx-2、悬停 tx-0）。禁用态/四列结构（T04）未动。
- `components/ui/button.tsx`：`brand` 变体 glow→`shadow-glow-brand`、`marketing`→`shadow-glow-amber`，二者加 `active:scale-[0.98]` 按压反馈（§3.1），`transition-shadow`→`transition-all`。
- `components/ui/pill.tsx`：`brand` 加 `border border-brand/20` 并改用 canonical `bg-brand-dim text-brand`（§3.6）；新增 `amber`/`danger`/`muted` 语义变体；`marketing`(amber)/`warning`(red) 保留为向后兼容别名（现有 18 处调用站点不破）。

**Badge**：组件全仓零调用站点；其 `default` 变体已是 `bg-primary`(=迁移后 teal)/white，符合 §3.6 brand 计数徽章语义，未重构以免引入无消费者的破坏面。

**自测（全绿）：**
- `pnpm typecheck`：tsc 0 报错
- `pnpm check`：typecheck + eslint 0 + a11y:contrast 26/26 AA + i18n parity 511=511
- `pnpm build`：✓ Compiled successfully，0 报错
- 核对未破坏既有测试契约：issue3-t04-deadlinks（footer Discord/Twitter 仍 aria-disabled、Download→/start#install 结构未动）、issue5-ui-tokens（不涉 nav 高度）。

**遗留/交接 QA：**
- 浏览器 E2E（active 下划线 computed border、56px 高度、滚动 blur、CTA scale 按压、Pill 新变体明暗双主题）需 qa-automation 独立跑真实 Chromium 验证（本地静态链路已全过）。
- `font-mono-strong` 依赖 ISSUE-11 DEF-1 已修的 cn()/tailwind-merge 注册项，build 已确认编译生成。

## 处理记录
- 2026-06-01 23:30:28 工单创建（feature / P0）
- 2026-06-02 06:38:18 set assignee=frontend-engineer
- 2026-06-02 06:38:18 set priority=P0
- 2026-06-02 06:38:18 set status=triaged
- 2026-06-02 06:38:18 LANE: light
- 2026-06-02 06:38:18 EXTRA_ROLES: none
- 2026-06-02 06:38:37 set status=in_progress
- 2026-06-02 06:46:19 set status=in_review
- 2026-06-02 06:49:28 代码审查(code-reviewer): 必改0/建议改0/可选2。独立复跑 typecheck 0错 + lint 0错(5warning在未改动TOC,非本工单) + a11y:contrast 26/26 AA。token引用全部解析成功,active下划线无抖动,Pill向后兼容零破坏,与T04不冲突,提交规范合规。建议放行PASS到QA(E2E计算样式待qa-automation独立验)。详见08-测试报告.md代码审查小节。
