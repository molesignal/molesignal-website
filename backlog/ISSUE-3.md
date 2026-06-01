---
id: ISSUE-3
type: bug
title: [T04] 死链/画饼治理
status: closed
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
- 2026-06-02 01:40:47 set status=in_review
- 2026-06-02 code-reviewer 代码审查完成（commit a8d9560）。

  ### 代码审查结论：建议放行到 QA（必改 0，已直接修 1，建议改 0）

  **核验通过项（证据）**
  - AC① Footer/TopNav 移除 docs：`top-nav.tsx` RESOURCE_CHILDREN、`footer.tsx` resources 列均无 docs；全仓 `grep docs.molesignal.io` 仅余注释 ✓
  - AC② Discord 禁用态非 href#：`footer.tsx:57` discord/twitter `disabled:true` 渲染 `<span aria-disabled>`；`community-callout.tsx` Discord 卡片 `<div aria-disabled>`；全仓无活 `href="#"`（仅注释）✓
  - AC④ helm/binary v1.0 notice：`quick-start-tabs.tsx` 两 tab 均挂 `V1TargetNotice` ✓
  - AC⑤ 双语同步：脚本校验 EN/ZH 各 466 键、零差异（only-EN=[] only-ZH=[]）✓
  - 新增内链路由真实存在：`app/[locale]/roadmap`、`app/[locale]/changelog`、`/blog`、`/start` 全部存在 ✓
  - 设计 token `text-tx-3` 在 globals.css 有定义（`--color-tx-3`），禁用态灰字生效 ✓
  - 被删 key（nav.docs/docsSub、footer.links.docs）无任何残留代码引用，不会触发 i18n 缺键 ✓
  - 契约/类型：`footer.tsx` LinkItem.href 改可选后，disabled 分支优先渲染、内链分支用 `href!` 安全；无类型回归 ✓

  **已直接修复（必改→已修，commit a8d9560）**
  - 〔bug/正确性·必改〕`footer.tsx`/`top-nav.tsx` 的 Download 锚点 `/start#binary` **不可解析**：Quick Start 用 Radix Tabs，面板 id 由 Radix 自动生成（形如 `radix-xxx-content-binary`），页面**无 `id="binary"` 元素**；且默认选中 docker，binary 面板默认不挂载到 DOM，即便有 id 也不可达。点击 Download 会落到 /start 顶部而非安装区——属本工单要治理的"软死链"。已改为指向 Section 真实 id **`/start#install`**（`start/page.tsx:86` Section 透传 id，始终存在），点击现可正确滚动到 Quick Start 区。
  - 〔坏味道·顺手修〕`quick-start-tabs.tsx` 顶部注释声称"`#docker/#helm/#binary` 客户端 hash sync"，但该组件是服务端组件、无任何读 `window.location.hash` 的逻辑——失实注释（预存于本工单前，且是 AC 误用 #binary 的根源），已改正。

  **提交规范**：80668ae/a8d9560 均符合 Conventional Commits（fix(ISSUE-3): …），标题含工单号 ✓

  **遗留（非本工单、不阻塞放行）**：`playwright.config.ts` 预存 typecheck 错误（main 既有，T12 范围）；QA 需起 dev server 跑 lint:links 实测全 2xx 并人工点验 Download→#install 滚动、Discord/Twitter 禁用态不可点。

  **放行建议：PASS 到 QA**——AC 全覆盖，唯一正确性 bug（死锚点）已修，无未决必改项。
- 2026-06-02 01:47:05 set status=verifying
- 2026-06-02 01:55:06 QA 验证结果：通过。qa-automation 运行时验证(分支 feature/ISSUE-3)。lint:i18n PASS(EN466/ZH466 parity OK·AC5)；T04 新增/改动内链 /roadmap /changelog /blog /start#install 全2xx(EN+ZH·AC1/AC6)；HTML 断言全绿(docs.molesignal.io=0·活 href#=0·#install 锚点目标存在·v1Notice 双语渲染)；Playwright+Chromium 真实浏览器交互 E2E 13/13 PASS(footer Discord/Twitter 及 community-callout Discord 卡均 aria-disabled 非锚点·Resources 下拉无 Docs·点击 Download 真实跳转 http://localhost:3000/start#install 并滚动至 #install(y=777)·helm/binary tab 点击后 v1.0 notice 可见而 docker tab 不显)。lint:links 唯一失败 /opengraph-image=404 经核为预存且与 T04 无关(app/opengraph-image.tsx 与 main 完全一致·seed 早在 main 即存在)，不阻断本工单；lint:quickstart 失败系脚本 ROOT 路径 bug，非 T04 范围。建议二者另立工单。环境注记：首跑全站 500 系残留 .next 产物与 Turbopack dev 冲突，rm -rf .next 后全 200。证据：08-测试报告.md(ISSUE-3 自动化小节)+test-results/issue3-t04-binary-notice.png+tests/e2e/issue3-t04-deadlinks.mjs。VERDICT: PASS
- 2026-06-02 01:55:49 set status=closed
- 2026-06-02 01:55:49 引擎周期#3: QA PASS, 关闭
