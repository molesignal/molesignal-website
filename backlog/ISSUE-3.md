---
id: ISSUE-3
type: bug
title: [T04] 死链/画饼治理
status: in_progress
priority: P0
assignee: frontend-engineer
created: 2026-06-01
updated: 2026-06-02
---

## 描述
模块:死链/画饼治理 | 角色:frontend | 依赖:无 | 里程碑:M1 | 验收:Footer/TopNav移除docs;Discord禁用态非href#;Download coming-soon;helm/binary tab加v1.0target notice;messages双语同步;lint:links全2xx | 详见 07-开发任务拆分.md(T04) 与 06-技术架构.md/READINESS.md

## 复现步骤


## 验收标准


## 处理记录
- 2026-06-01 23:30:28 工单创建（bug / P0）
- 2026-06-02 01:30:34 set assignee=frontend-engineer
- 2026-06-02 01:30:34 set priority=P0
- 2026-06-02 01:30:34 set status=triaged
- 2026-06-02 01:30:34 分诊: bug/治理类·责任模块=frontend(Footer/TopNav/community-callout/QuickStart/messages)·优先级P0(D1/D5/D8信任红线·M1上线底线)
- 2026-06-02 01:30:34 LANE: light
- 2026-06-02 01:30:34 LANE理由: 未命中任一红线(不涉安全/鉴权/支付/隐私·不动数据模型或接口契约·不涉核心交易逻辑·改动局限前端单端组件文案与链接);改动小、影响面局部、可快速完成;07-开发任务拆分.md明确标注T04可light。底线不放水:开发→代码审查→独立QA三环不省。
- 2026-06-02 01:30:34 EXTRA_ROLES: none
- 2026-06-02 01:30:48 set status=in_progress
- 2026-06-02 frontend-engineer 实现完成（commit 80668ae）。改动文件：
  - `components/layout/top-nav.tsx`：Resources 下拉移除 `docs.molesignal.io` 死链，按 UX §2.2 调整为 Roadmap/Changelog/Blog/Download；Download 改站内锚点 `/start#binary` + "coming soon · v1.0 target" 副标，不再指向未发布 GitHub release。
  - `components/layout/footer.tsx`：Resources 列移除 docs；Download 改站内锚点 `/start#binary`；Discord/Twitter 由 `href="#"` 改为禁用态（`<span>` muted 文字 + `cursor-default` + `title="launching soon"` + soon 角标，非锚点）。
  - `components/community-callout.tsx`：Discord 卡片由 `<a href="#">` 改为不可点禁用态 `<div aria-disabled title=soonTitle>`，去掉外链箭头。
  - `components/quick-start-tabs.tsx`：helm/binary tab 新增 `V1TargetNotice` 虚线 notice block（Construction 图标 + `start.v1Notice` 文案），诚实说明 Docker 路径当下可用。
  - `app/[locale]/start/page.tsx`：nextDocs 卡片由 `docs.molesignal.io` 死链改为 GitHub 源码仓库（站内 docs 站本期不建，源码为事实源头）。
  - `messages/{en,zh}.json`：新增 `nav.roadmap/roadmapSub/changelog/changelogSub`、`footer.launchingSoon/soon`、`components.community.discord.soonTitle`、`start.v1Notice`；`nav.downloadSub` 改 coming-soon 文案；移除废弃 `nav.docs/docsSub`、`footer.links.docs`；EN/ZH 键结构完全对齐。
  自测：① `tsc --noEmit` 我方文件 0 报错（仅遗留 `playwright.config.ts` 的 `reducedMotion` 预存错误，来自 main、属 T12 E2E 基建、不在 T04 范围）；② `next build` 应用代码 "Compiled successfully"（build 仅卡在上述 playwright 预存 typecheck）；③ `eslint` 我方 5 文件 0 报错；④ 脚本校验 EN/ZH 键 parity 完全一致、JSON 合法；⑤ 全站 `grep href="#"` 仅余注释、无活 `docs.molesignal.io` 链接。
  AC 对照：① Footer/TopNav 移除 docs ✓；② Discord 禁用态非 href# ✓（footer+community 双处）；③ Download coming-soon/锚 /start#binary ✓；④ helm/binary v1.0 notice ✓；⑤ messages 双语同步 ✓；⑥ 无 href="#" 占位 ✓（lint:links 全 2xx 需 QA 起 dev server 跑脚本验证，新增内链均为已存在页面 /roadmap /changelog /blog /start，无新 404 风险）。
  阻塞/遗留：`pnpm build` 因 `playwright.config.ts` 预存 typecheck 错误整体 rc=1——非本工单引入（main 既有），建议 T12/qa-automation 修复（`reducedMotion` 需移至 `use.contextOptions` 或升级 @playwright/test 类型）；不影响 T04 应用代码正确性。
