---
id: ISSUE-18
type: feature
title: [T17] 社区入口真实化
status: in_progress
priority: P1
assignee: frontend-engineer
created: 2026-06-01
updated: 2026-06-02
---

## 描述
模块:社区入口真实化 | 角色:frontend | 依赖:T04 | 里程碑:M2 | 验收:Discord指向真实邀请(若就绪);文案一致;无死链 | 详见 07-开发任务拆分.md(T17) 与 06-技术架构.md/READINESS.md

## 需求说明
T17 社区入口真实化。Discord 邀请链接是**外部前置**（READINESS「真实 Discord 邀请链接」/ 开放问题 S6），当前未就绪。
按 READINESS 契约：若就绪则 community-callout/Footer 指向真实链接、文案一致、无死链；未就绪则保持 T04 诚实禁用态。
实现采用 **config-driven**：由 `NEXT_PUBLIC_DISCORD_INVITE_URL` 驱动——配置后自动切真实外链，未配置保持禁用态，无需改代码。

## 验收标准
- [x] ① community-callout/Footer Discord 指向真实邀请链接（**若已就绪**）：env 配置后两处自动切真实外链（`target=_blank rel=noreferrer`）
- [x] ② 文案与现状一致：未就绪保持「即将上线」禁用态文案；就绪态用新增 `discord.titleLive/bodyLive`（EN「Join our Discord」/ ZH「加入 Discord」）
- [x] ③ 无死链：禁用态无 href（cursor-default + title 提示），就绪态为运营提供的真实 URL，**绝不用 `href="#"`**

## 处理记录
- 2026-06-01 23:30:28 工单创建（feature / P1）
- 2026-06-02 08:44:00 set assignee=frontend-engineer
- 2026-06-02 08:44:00 set priority=P1
- 2026-06-02 08:44:00 set status=triaged
- 2026-06-02 08:44:00 LANE: light
- 2026-06-02 08:44:00 EXTRA_ROLES: none
- 2026-06-02 08:44:19 set status=in_progress
- 2026-06-02 开发完成（frontend-engineer，LANE light）。改动文件：
  - `lib/community.ts`（新增）：`getDiscordInviteUrl()` 读 `NEXT_PUBLIC_DISCORD_INVITE_URL`（trim，空白视为未配置，返回 `string|null`）+ `GITHUB_REPO_URL` 常量
  - `components/community-callout.tsx`：Discord 卡片按 `getDiscordInviteUrl()` 三元切换 live（真实外链）/ disabled（禁用态）；GitHub 卡复用 `GITHUB_REPO_URL`
  - `components/layout/footer.tsx`：`COLUMNS` 改为 `buildColumns(discordInvite)`，community 列 Discord 项按配置切换；GitHub 复用 `GITHUB_REPO_URL`
  - `messages/{en,zh}.json`：新增 `components.community.discord.titleLive/bodyLive`（双语 parity 514/514）
  - `.env.local.example`：文档化 `NEXT_PUBLIC_DISCORD_INVITE_URL`
  - 自测：`pnpm typecheck` 0 报错；`pnpm lint:i18n` parity OK 514/514；eslint（改动文件）0 报错；`pnpm build` exit 0「Compiled successfully」。
  - 当前未配置 Discord 邀请 env → 默认渲染诚实禁用态（与 T04 一致，符合 AC②③）；运营拿到真实邀请后填 env 即自动切真实外链，无需再改代码（符合 AC①）。
  - 遗留：真实 Discord 邀请 URL 仍待运营提供（外部前置，非本工单代码问题）。
