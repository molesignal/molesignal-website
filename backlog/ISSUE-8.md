---
id: ISSUE-8
type: feature
title: [T01] Cloud候补真入库(Resend Audience)
status: in_progress
priority: P0
assignee: backend-engineer
created: 2026-06-01
updated: 2026-06-02
---

## 描述
模块:Cloud候补真入库(Resend Audience) | 角色:backend | 依赖:T11 | 里程碑:M1 | 验收:新增resend-audiences.ts addContact(幂等409视成功);/api/cloud-waitlist入CLOUD_AUDIENCE+发通知;重复不报错;缺env降级仍200+warn;2xx后触发waitlist_submit。红线full道 | 详见 07-开发任务拆分.md(T01) 与 06-技术架构.md/READINESS.md

## 需求说明

**承接 PRD**：§4.1 **P0-1「Cloud 候补名单真入库可触达」**（D2 候补与转化）+ §6 北极星指标（NSM = 合格转化数，"真正入库可触达"才计入，只发邮件不入库不算）。`07-开发任务拆分.md` **T01**，全局前置 **T11（限流，已 ISSUE-1 closed）** 已就绪——route handler 已 async 化、`rateLimit` 已 `await`。命中红线①（动外部入库 = 第三方数据写入）+ ②（表单契约外延）→ **full 道**，增派 **security-auditor**（审 PII 处理、env 误用、SSRF/注入面）。

**用户故事**：作为一名被 Datadog 账单刺痛、正在评估 molesignal Cloud 的潜在用户，我想在 `/cloud` 留下邮箱进候补，**以便产品就绪时创始团队真的能批量触达到我**（而不是邮箱只飘进一封通知信就石沉大海）。

**现状（已核实代码事实，作为细化绳准）**：
- `app/api/cloud-waitlist/route.ts`：已有 限流(10/h)→JSON 解析→`cloudWaitlistSchema` zod 校验→蜜罐 `website` 命中即 silent 200→`sendEmail(founders 通知)`→返 200。**缺口：完全没有写入任何可营销名单**（注释里写着 "for now it's just the founders notification"）。
- `lib/email.ts`：`sendEmail()` 用 `RESEND_API_KEY`，缺 key 时 `console.warn` + 返 `{skipped:true}`（fire-and-forget，不抛错）。**无 audience 相关函数**。
- `components/cloud-waitlist-form.tsx`：**已在 API 2xx 后调用 `track("waitlist_submit")`**（ISSUE-2/T05 已接线，无 props 防 PII，蜜罐/429/5xx 均不触发）→ 故 AC⑥ 属"确认不回归"而非新开发；成功态已是持久绿卡（`role="status"` + `bg-green-dim`）。
- `lib/schemas/cloud-waitlist.ts`：仅 `email`（必填+格式）+ 蜜罐 `website`（`max(0)`）。**本工单不改 schema、不加字段。**

**细化结论（要做什么）**：
1. **新增 `lib/resend-audiences.ts`**，导出 `addContact({ audienceId, email, firstName?, lastName?, unsubscribed? })` provider：调用 Resend `POST /audiences/{audience_id}/contacts`，复用 `lib/email.ts` 同款 `RESEND_API_KEY`。
   - **幂等**：重复邮箱（Resend 返 409 / "already exists" 语义）**视为成功**，不抛错、不报错给上层。
   - **缺 `RESEND_API_KEY`**：跳过 + `console.warn` + 返 `{skipped:true}`（与 `sendEmail` 一致的降级语义）。
   - **缺 `audienceId`**（env 未配）：由调用方判定跳过；provider 不对空 id 发请求。
   - **运行时故障**（网络/5xx）：**fail-soft**——log error 但不抛、不阻塞，绝不让表单返 5xx。
2. **`/api/cloud-waitlist` 成功路径接线**：zod 通过且非蜜罐后，**并行**触发 (a) `addContact` 入 `RESEND_CLOUD_AUDIENCE_ID`、(b) 既有 founders 通知邮件；二者皆 fire-and-forget，**无论入库/通知成败都返 200**（可用性优先，呼应 `lib/email.ts` 既定哲学）。
3. **降级可观测**：缺 `RESEND_CLOUD_AUDIENCE_ID` 时跳过入库、仍发通知、仍 200，且打 `warn` 日志（"cloud audience id missing — skipping list insert"）。

**密钥政策（本期，用户决策 2026-06-01）**：本期**不提供** `RESEND_API_KEY` / `RESEND_CLOUD_AUDIENCE_ID`。按 READINESS「代码就绪 + 缺 env 优雅降级路径经 QA 客观验证正确（mock/本地/单测/脚本）」即判 `[x]`：即 缺 env 时 200 + warn + 不报错 + 前端成功态正确 + `addContact` 代码路径有单测/脚本覆盖 → 达本期就绪。**真实入库联调（向真实 Resend audience 写入并在 Dashboard 可见、可导出）= AC8，延后补密钥时复验**，不阻塞本期 DONE。

**明确不做（YAGNI / 防越界）**：
- ❌ 不引入自建 DB / CRM（候补"可触达"用 Resend Audiences 即达成，PRD §7-1 已定轻量托管）。
- ❌ 不改 `cloudWaitlistSchema`、不加表单字段、不动前端表单 JSX（成功态/track 已就绪）。
- ❌ 不改限流阈值（10/h）与 429 结构（T11 范畴）。
- ❌ 不做退订/双重确认（double opt-in）/邮件模板富化（超 MVP）。
- ❌ 不动 design-partner 路由（那是 T02/ISSUE 另开）；但 `addContact` provider 应设计为 T02 可复用（name 拆 first/last 的能力先内建，cloud 侧不传）。
- ❌ 不引第二个邮件/名单 SDK，不改 `sendEmail` 签名。

## 验收标准

> 验证手段：单测/脚本（provider 幂等 + 降级分支）+ 真实 `next dev` 起服务 curl/HTTP 断言（route 200 + warn 日志）+ 浏览器 E2E（前端成功态 + 2xx 后 track）。security-auditor 审 AC5。

- **AC1（provider 存在且幂等）**：`lib/resend-audiences.ts` 导出 `addContact(...)`；对同一 email 连续调用两次，第二次（Resend 409 / already-exists）**返回成功语义、不抛错**（单测 mock fetch 409 验证）。
- **AC2（真入库接线）**：配齐 `RESEND_API_KEY` + `RESEND_CLOUD_AUDIENCE_ID` 时，`POST /api/cloud-waitlist` 提交合法 email → 向 `RESEND_CLOUD_AUDIENCE_ID` 发出 `POST /audiences/{id}/contacts`（请求体含该 email），且仍发 founders 通知邮件（mock/拦截验证请求已发出；真实写入见 AC8）。
- **AC3（缺 audience env 优雅降级）**：缺 `RESEND_CLOUD_AUDIENCE_ID`（其余正常）→ 跳过入库、仍发通知、**仍返 200**，并打 warn 日志；前端成功态正确。
- **AC4（缺 API key 优雅降级）**：缺 `RESEND_API_KEY` → 入库与通知均 skip（各打 warn）、**仍返 200**、不抛错、不返 5xx。
- **AC5（PII / 安全 — security-auditor 核）**：① 入库与日志只传必要字段（email/可选姓名），不外泄 IP 之外的额外 PII；② audience id / api key 仅来自 env，不可被请求体覆盖（无 SSRF/注入面）；③ 蜜罐 `website` 命中时 **silent 200、不入库、不发通知、不触发 track**（维持现状）；④ 错误日志不打印完整密钥。
- **AC6（埋点时序不回归）**：前端在 API **2xx 后**才调用 `track("waitlist_submit")`（无 props）；zod 失败/429/5xx/网络错误/蜜罐均**不**触发（E2E spy 验证，复用 ISSUE-2 断言不退化）。
- **AC7（构建/类型/回归）**：`pnpm check`（lint+typecheck）+ `pnpm build` exit 0；新增单测纳入 `pnpm test`（或等价脚本）并全过；EN/ZH 文案若涉及成功态无 parity 缺口（本工单预期零文案改动）。
- **AC8（真实入库联调 · 延后复验，不阻塞本期 DONE）**：补 `RESEND_API_KEY` + `RESEND_CLOUD_AUDIENCE_ID` 后，提交 email 在对应 Resend audience 可见、重复提交不产生重复/不报错、可导出 CSV（呼应 P1-5/T18）。

## 处理记录
- 2026-06-01 23:30:28 工单创建（feature / P0）
- 2026-06-02 04:26:29 set assignee=backend-engineer
- 2026-06-02 04:26:29 set priority=P0
- 2026-06-02 04:26:29 set status=triaged
- 2026-06-02 04:26:29 LANE: full
- 2026-06-02 04:26:29 EXTRA_ROLES: security-auditor
- 2026-06-02 04:28:50 PM细化(T01/P0-1): 补全用户故事+AC1-AC8+明确不做; 同步PRD §8.ISSUE-8
- 2026-06-02 架构评估(tech-architect): 无 schema/响应契约变更(cloudWaitlistSchema 不动, 仍 200{ok:true}); 前置 T11(限流 async+Upstash) 已实现且 closed. 新增 lib/resend-audiences.ts 为内部 provider 契约, 已写入 06 §4.6(T01新建/T02复用/并行对齐基准): addContact 签名+幂等(409视成功)+缺key/缺id/运行时故障三降级+并行 fire-and-forget+PII/密钥安全(env-only 不可被请求体覆盖, 日志不打印完整 key). 06 §4.1 顺序⑤⑥澄清为并行触发. 开发依据=06 §3.1/§4.1/§4.6 + 本工单 AC1-AC8. 无需 schema 迁移. 详见下方"架构评估与开发要点".

## 架构评估与开发要点（tech-architect, 2026-06-02）

**契约影响判定**：本工单**不动数据模型、不动 API 响应契约**——
- zod `cloudWaitlistSchema` 不变（仅 email + 蜜罐 website）；
- `POST /api/cloud-waitlist` 出参仍 `200 {ok:true}`、错误码不变；
- 唯一前置 T11（`rateLimit` sync→async + Upstash）**已落地并 closed**，route 已 `await rateLimit`、已 async 化 → T01 无前置阻塞，可直接开工。
- 新增的是**内部 provider 接口**（`lib/resend-audiences.ts#addContact`），非对外契约；但因 **T02 将复用**，已在 `06-技术架构.md` 新增 **§4.6 Resend Audiences provider 接口**作为 T01↔T02 并行对齐基准（签名/幂等/三降级/安全全部成文）。

**实现要点（落地清单，配合 AC1–AC8）**：
1. **新建 `lib/resend-audiences.ts`**，签名照 06 §4.6：`addContact({ audienceId, email, firstName?, lastName?, unsubscribed? }): Promise<AddContactResult>`。直 `fetch` Resend REST，复用 `lib/email.ts` 同款 `RESEND_API_KEY`，**不引 SDK**。
   - 幂等：Resend 409 / already-exists → 返 `{ok:true}` 不抛（AC1，单测 mock fetch 409）；
   - 缺 `RESEND_API_KEY` → warn + `{ok:false,skipped:true}`，不发请求（AC4）；
   - 缺/空 `audienceId` → **不对空 id 发请求**，warn("audience id missing — skipping list insert") + skip（AC3）；
   - 运行时故障 → log error 不抛（AC2/可用性优先）。
2. **`app/api/cloud-waitlist/route.ts` 成功路径接线**：zod 通过且非蜜罐后，**并行** fire-and-forget 触发 (a) `addContact({ audienceId: process.env.RESEND_CLOUD_AUDIENCE_ID, email })`、(b) 既有 `sendEmail(founders 通知)`；**无论成败均返 200**。cloud 侧 **不传 firstName/lastName**（仅邮箱进可触达列表，呼应 06 §3.1）。
   - 蜜罐命中维持现状：silent 200、**不入库/不通知/不触发 track**（AC5③）。
3. **安全（AC5，security-auditor 复核）**：`audienceId`/`apiKey` **仅来自 env，禁止从请求体读取/覆盖**（无 SSRF/注入面）；错误日志只 log status/截断信息，**不打印完整密钥**；入库与日志只含 email（+ 可选姓名，cloud 侧不传）。
4. **测试**：参照现有 `scripts/check-*.ts` + `pnpm test:*` 模式新增 provider 单测/脚本（幂等 409 + 三降级分支），并补 route 层断言（200 + warn）；E2E 复用 `tests/e2e/analytics-funnel.spec.ts` 验 AC6（2xx 后才 track、蜜罐/429/5xx 不 track）不回归。`pnpm check` + `pnpm build` exit 0（AC7）。
5. **可复用设计**：`addContact` 已内建 first/last 能力但 cloud 不传，**T02 直接复用** `RESEND_PARTNER_AUDIENCE_ID` + name 拆词（06 §3.1/§4.2/§4.6），两单可并行不撞 provider。
6. **本期 env 缺省**：按密钥政策不配 `RESEND_API_KEY`/`RESEND_CLOUD_AUDIENCE_ID`，QA 以 mock/单测/脚本验降级正确即判就绪；真实入库联调=AC8 延后复验，不阻塞 DONE。

**阻塞项**：无。T11 已就绪，schema/契约无需迁移，可立即派 backend-engineer 开发（full 道，security-auditor 审 AC5）。
- 2026-06-02 04:36:03 set status=in_progress
- 2026-06-02 backend-engineer 开发完成（feature/ISSUE-8）：

### 改动文件
- **新增 `lib/resend-audiences.ts`**：导出 `addContact({ audienceId, email, firstName?, lastName?, unsubscribed? }): Promise<AddContactResult>`，按 06 §4.6 契约。直 fetch `POST https://api.resend.com/audiences/{id}/contacts`，复用 `lib/email.ts` 同款 `RESEND_API_KEY`，不引 SDK。幂等（409 / "already exists" 体 → `{ok:true}` 不抛）；缺 key → warn+`{ok:false,skipped:true}` 不发请求；缺 audienceId → warn("audience id missing — skipping list insert")+skip 不对空 id 发请求；运行时故障 → log error 不抛 → `{ok:false,error}`。`audienceId`/`apiKey` 仅来自参数（route 从 env 取），错误日志截断 body(200 字符) 且永不打印 key。
- **`app/api/cloud-waitlist/route.ts`**：zod 通过且非蜜罐后用 `Promise.allSettled` 并行 fire-and-forget 触发 (a) `addContact({ audienceId: process.env.RESEND_CLOUD_AUDIENCE_ID, email })`（cloud 侧不传姓名）、(b) 既有 founders 通知；无论成败均返 200。未改 schema、未动前端表单。
- **新增 `scripts/check-resend-audiences.ts`** + package.json `test:audiences`：mock fetch 覆盖 AC1/AC2/AC3/AC4/AC5 + 运行时 fail-soft + T02 姓名映射，26 断言。

### 自测结果
- `pnpm test:audiences`：✅ 26/26 全过（成功/409幂等/already-exists/缺id/缺key/网络异常fail-soft/密钥不入日志+body截断/姓名映射 first_name·last_name）。
- `pnpm check`（typecheck+lint+a11y:contrast 26/26+i18n parity 506↔506）：exit 0。
- `pnpm build`：exit 0。
- 运行时 smoke（`pnpm start`，无 RESEND env）：合法 email POST → **200**；日志见 `[audiences] RESEND_API_KEY missing — skipping list insert` + `[email] ... skipping send`（AC3/AC4 降级仍 200 + warn）；非法 email → 400。
- AC6（前端 2xx 后才 track）：未触碰前端表单/track 接线，预期不回归，留 qa-automation E2E 复核。
- AC8（真实入库联调）：按本期密钥政策延后，补 `RESEND_API_KEY`+`RESEND_CLOUD_AUDIENCE_ID` 后复验。

### 阻塞项
- 无。

### 给运维/QA 的环境变量
- `RESEND_API_KEY`（复用既有，email + audiences 共用）
- `RESEND_CLOUD_AUDIENCE_ID`（cloud 候补 audience；缺失时优雅降级跳过入库仍 200）

### 非阻断观察（供 security-auditor / QA 知悉，非本工单引入）
- 蜜罐 `website` 字段 schema 为 `z.string().max(0).optional()`：填值时 zod 直接判 400（早于 route 内 silent-200 分支，该分支因此为死代码）。结果上仍满足安全要求——蜜罐命中 → 不入库/不通知/不触发 track（400 在我接线之前返回）。此为既有行为，本工单按"维持现状/不改 schema"未改动；若需统一为 silent-200 应另开工单。
