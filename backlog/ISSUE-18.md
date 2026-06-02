---
id: ISSUE-18
type: feature
title: [T17] 社区入口真实化
status: closed
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
- 2026-06-02 08:50:31 set status=in_review
- 2026-06-02 代码审查（code-reviewer，LANE light）：**PASS，建议放行 QA**。必改 0 / 已改 0 / 建议改 0 / 可选 1。
  - AC① 外链契约满足：callout（`Card` external 默认 true）与 footer（显式 `external:true`）就绪态均渲染 `target=_blank rel=noreferrer`（noreferrer 隐含 noopener，无 tabnabbing）。
  - AC②③ 满足：未就绪沿用禁用态文案、无 href、绝无 `href="#"`；就绪态用新增 `titleLive/bodyLive`，en/zh 双语 parity 已 grep 核实齐备。
  - `getDiscordInviteUrl()` trim+空白→null 健壮；`GITHUB_REPO_URL` 提取消除两处重复。提交规范合 Conventional Commits。
  - 可选项1（lib/community.ts:20）：env URL 未校验 scheme，运营误填异常值会原样注入 href；风险极低（构建期可信 env 非用户输入），本工单不必处理，详见 08-测试报告.md。
  - 工具受限：本环节 shell 无 node/pnpm，未本机复跑 build/typecheck；纯静态局部改动，build/E2E 实证以 QA 环为准。
- 2026-06-02 08:52:50 set status=verifying

## QA 验证结果：通过

**验证人**：qa-automation ｜ **方式**：真实启动 `next dev` + curl 渲染断言（两态×双语）+ 死链回归套件 ｜ **环境**：Node v23.6.1 / Next.js 16.2.6 (Turbopack)

逐条 AC（均以真实 HTTP 渲染输出为证）：

- **AC① 真实外链（就绪态）**：PASS。设 `NEXT_PUBLIC_DISCORD_INVITE_URL=https://discord.gg/molesignal-test` 起服务，首页渲染出 **2 个**指向该 URL 的 `<a>`（community-callout 卡片 + footer community 列），**两者均带 `target="_blank" rel="noreferrer"`**；EN(`/`) 与 ZH(`/zh`) 各 2 个，断言计数一致。
- **AC② 文案一致**：PASS。
  - 未配置 env（禁用态）：callout 可见标题为 `<div class="…text-tx-3">Discord — launching soon</div>`（ZH「Discord — 即将上线」），footer 为禁用 `<span>` 带「soon」徽标；`titleLive` 文案此时**仅存在于 next-intl 消息 JSON bundle**，无任何渲染 `<a>` 使用它（已 grep 反证）。
  - 配置 env（就绪态）：callout 可见标题切为渲染文本 `>Join our Discord<`（ZH `>加入 Discord<`），禁用态标题退回 bundle。
- **AC③ 无死链**：PASS。两态双语首页 `href="#"` 计数均为 **0**；禁用态无任何 discord.gg/discord.com 链接（诚实禁用，非占位）。

回归：

- `pnpm typecheck` 0 报错；`pnpm lint:i18n` parity **514/514 OK**。
- `pnpm lint:links`（SITE 指向被测服务，顺序抓取）：**Failures 0/33**，全站内链 200。
- 说明：中途因同一 `.next` 缓存被两个并发 dev server（3000/3100）写花，曾出现一批 500（`JSON.parse` 固定偏移报错）——经 `rm -rf .next` + 单实例干净重启后全部 200，确认为**测试环境产物（双 dev 实例共享缓存），非 ISSUE-18 缺陷**；本工单改动仅作用于首页 callout/footer，与该缓存问题无关。

**VERDICT: PASS** — 三条 AC 全部以真实渲染证据通过，死链回归全绿，建议合并放行。证据详见 08-测试报告.md「自动化测试」小节。
- 2026-06-02 08:58:55 set status=closed
- 2026-06-02 08:58:55 引擎周期#19: QA PASS, 关闭
