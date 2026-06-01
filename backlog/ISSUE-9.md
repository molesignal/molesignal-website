---
id: ISSUE-9
type: feature
title: [T02] Design Partner申请持久化
status: verifying
priority: P0
assignee: backend-engineer
created: 2026-06-01
updated: 2026-06-02
---

## 描述
模块:Design Partner申请持久化 | 角色:backend | 依赖:T11 | 里程碑:M1 | 验收:5字段zod入PARTNER_AUDIENCE(email+name拆first/last幂等);通知邮件含全5字段replyTo申请人;蜜罐拦bot;缺env降级;成功原位持久卡;触发design_partner_submit。红线full道 | 详见 07-开发任务拆分.md(T02) 与 06-技术架构.md/READINESS.md

## 需求说明

**承接 PRD**：§4.1 **P0-2「Design Partner 申请真入库可触达」**（D2 候补与转化）+ §6 北极星指标（NSM = 合格转化数，"真正入库可触达"才计入，只发通知邮件不入库不算）。`07-开发任务拆分.md` **T02**，全局前置 **T11（限流，已 ISSUE-1 closed）** 已就绪——route handler 已 async、`rateLimit` 已 `await`。**provider 前置 T01（`lib/resend-audiences.ts`，已 ISSUE-8 closed）已落地**，`addContact` 已内建 `firstName/lastName` 能力供本单复用。命中红线①（动外部入库 = 第三方数据写入）+ ②（表单契约外延）→ **full 道**，增派 **security-auditor**（审 PII 处理、env 误用、SSRF/注入面、姓名拆分不外泄额外 PII）。

**用户故事**：作为一名正被现有可观测栈（Datadog/Splunk…）的成本与割裂折磨、愿意深度共创的早期团队负责人，我想在 `/design-partner` 提交我的姓名、邮箱、公司规模、当前栈与最大痛点，**以便创始团队真的能把我加入 Design Partner 名单并就具体痛点直接回信联系我**（而不是我的申请只飘进一封通知邮件、姓名/痛点等结构化信息无处归档、产品就绪时无法被批量触达）。

**现状（已核实代码事实，作为细化绳准）**：
- `app/api/design-partner/route.ts`：已有 限流(5/h)→JSON 解析→`designPartnerSchema` zod 校验（5 字段）→蜜罐 `website` 命中即 silent 200→`sendEmail(founders 通知，正文含全 5 字段 + `replyTo`=申请人)`→返 200。**核心缺口：完全没有写入任何可营销名单**，且**没有把 `name` 拆 first/last**。
- `lib/resend-audiences.ts`（T01 已建，closed）：`addContact({ audienceId, email, firstName?, lastName?, unsubscribed? })` 已就绪——幂等（409/already-exists 视成功）、缺 key/缺 id/运行时故障三降级 fail-soft 不抛错、`audienceId`/`apiKey` 仅来自参数（env，不可被请求体覆盖）、错误日志截断 body 不打印 key。**本单直接复用，不改 provider。**
- `lib/schemas/design-partner.ts`：`name`(必填 1–120)、`email`(必填+格式)、`companySize`(enum)、`currentStack`(enum)、`biggestPain`(可选 ≤400) + 蜜罐 `website`(`max(0)`)。**本工单不改 schema、不加字段。**
- `components/design-partner-form.tsx`：**已在 API 2xx 后调用 `track("design_partner_submit")`**（无 props 防 PII；蜜罐/429/5xx/网络错误均不触发，ISSUE-2/T05 已接线）；成功态**已是原位持久卡片**（`role="status"`，replaces form）。→ 故 AC⑤（成功态原位持久卡）/AC⑥（埋点时序）属"确认不回归"而非新做。
- 通知邮件正文（route.ts）**已含全 5 字段**（Name/Email/Company size/Current stack/Biggest pain）+ `replyTo: data.email`。→ AC④通知部分属"确认不回归 + 补 IP/时间戳归档"。

**细化结论（要做什么）**：
1. **`/api/design-partner` 成功路径接线入库**：zod 通过且非蜜罐后，**并行** fire-and-forget 触发 (a) `addContact({ audienceId: process.env.RESEND_PARTNER_AUDIENCE_ID, email, firstName, lastName })`、(b) 既有 founders 通知邮件；二者皆 fire-and-forget，**无论入库/通知成败都返 200**（可用性优先，与 cloud 路由/`lib/email.ts` 既定哲学一致；用 `Promise.allSettled` 等待 settle 但忽略失败——serverless 下不能"返回后再跑后台"）。
2. **`name` 拆 first/last（确定性规则）**：对 `name.trim()` 按**首个空白**切分——首段为 `firstName`，其余（保留中间空格）为 `lastName`；单词姓名 → 仅 `firstName`、`lastName` 省略（不传空串，依赖 `addContact` 的 `firstName ? {...}` 条件拼接）。空白塌缩用 `\s+`。映射只在 route 内做，不改 provider 签名。
3. **降级可观测**：缺 `RESEND_PARTNER_AUDIENCE_ID` 时跳过入库、仍发通知、仍 200，且打 warn 日志（"audience id missing — skipping list insert"，由 provider 现有逻辑产出）；缺 `RESEND_API_KEY` 时入库 + 通知均 skip+warn、仍 200。
4. **通知邮件归档增强（不回归）**：维持正文含全 5 字段 + `replyTo`=申请人，并保留 IP/时间戳尾注（供 T18 运营从邮件归档补全 DP 结构化字段）。

**密钥政策（本期，用户决策 2026-06-01）**：本期**不提供** `RESEND_API_KEY` / `RESEND_PARTNER_AUDIENCE_ID`。按 READINESS「代码就绪 + 缺 env 优雅降级路径经 QA 客观验证正确（mock/本地/单测/脚本）」即判 `[x]`：即 缺 env 时 200 + warn + 不报错 + 前端成功态正确 + 姓名拆分与入库接线代码路径有单测/脚本覆盖 → 达本期就绪。**真实入库联调（向真实 Resend partner audience 写入并在 Dashboard 可见、姓名 first/last 正确、可导出）= AC8，延后补密钥时复验**，不阻塞本期 DONE。

**明确不做（YAGNI / 防越界）**：
- ❌ 不引入自建 DB / CRM（DP "可触达 + 可归档"用 Resend Audiences + 通知邮件即达成，PRD §7-1 已定轻量托管）。
- ❌ 不改 `designPartnerSchema`、不加/删表单字段、不动前端表单 JSX（成功态/track 已就绪）。
- ❌ 不改 `lib/resend-audiences.ts` provider（直接复用 T01 产物；如发现 provider 缺陷另开工单）。
- ❌ 不改限流阈值（5/h）与 429 结构（T11 范畴）。
- ❌ 不做退订/双重确认（double opt-in）/邮件模板富化/把 biggestPain/companySize/currentStack 也塞进 audience 自定义字段（超 MVP；结构化字段经通知邮件归档，呼应 T18）。
- ❌ 不引第二个邮件/名单 SDK，不改 `sendEmail` / `addContact` 签名，不动 cloud-waitlist 路由。

## 验收标准

> 验证手段：单测/脚本（姓名拆分映射 + 入库接线 + 降级分支，参照 `scripts/check-resend-audiences.ts` / `test:audiences` 模式）+ 真实 `next dev`/`start` 起服务 curl/HTTP 断言（route 200 + warn 日志 + 注入伪 env 证明确实发出 POST）+ 浏览器 E2E（前端成功态 + 2xx 后 track）。security-auditor 审 AC5。

- **AC1（5 字段 zod 校验）**：`POST /api/design-partner` 对缺必填/非法 email/越界（name>120、biggestPain>400）/非枚举 companySize·currentStack 的请求返 **400**（zod issues）；合法 5 字段（biggestPain 可空）通过。schema 不变。
- **AC2（真入库接线 + 姓名拆分）**：配齐 `RESEND_API_KEY` + `RESEND_PARTNER_AUDIENCE_ID` 时，提交合法申请 → 向 `RESEND_PARTNER_AUDIENCE_ID` 发出 `POST /audiences/{id}/contacts`，请求体含 `email` 且 `first_name`/`last_name` 按拆分规则正确（"Ada Lovelace"→first=Ada,last=Lovelace；"Ada"→仅 first=Ada 无 last；"Ada B. Lovelace"→first=Ada,last="B. Lovelace"；前后多空格塌缩）；同时仍发 founders 通知邮件（mock/拦截/伪 env 起服务验证请求已发出；真实写入见 AC8）。
- **AC3（缺 audience env 优雅降级）**：缺 `RESEND_PARTNER_AUDIENCE_ID`（其余正常）→ 跳过入库、仍发通知、**仍返 200**，并打 warn 日志（"audience id missing — skipping list insert"）；前端成功态正确。
- **AC4（缺 API key 优雅降级 + 通知含全 5 字段）**：缺 `RESEND_API_KEY` → 入库与通知均 skip（各打 warn）、**仍返 200**、不抛错、不返 5xx；且通知邮件正文（配 key 时）含全 5 字段（Name/Email/Company size/Current stack/Biggest pain）+ `replyTo`=申请人邮箱 + IP/时间戳归档尾注。
- **AC5（PII / 安全 — security-auditor 核）**：① 入库只传必要字段（email + first/last name），**不把 companySize/currentStack/biggestPain/IP 作为 audience 字段外泄**；② `audienceId`/`apiKey` 仅来自 env，不可被请求体覆盖（无 SSRF/注入面，`addContact` 已 `encodeURIComponent`）；③ 蜜罐 `website` 命中时 **silent 200、不入库、不发通知、不触发 track**（维持现状）；④ 错误日志不打印完整密钥、截断上游 body；⑤ track 仍无 PII props。
- **AC6（埋点时序不回归）**：前端在 API **2xx 后**才调用 `track("design_partner_submit")`（无 props）；zod 失败/429/5xx/网络错误/蜜罐均**不**触发（E2E spy 验证，复用 ISSUE-2 断言不退化）。
- **AC7（成功态原位持久卡 + 构建/类型/回归）**：成功后**原位**用 `role="status"` 持久确认卡替换表单（不弹窗、不跳转、刷新前持续显示）；`pnpm check`（lint+typecheck+a11y+i18n parity）+ `pnpm build` exit 0；新增单测纳入 `test:*` 脚本并全过；EN/ZH 成功态文案无 parity 缺口（本工单预期零文案改动）。
- **AC8（真实入库联调 · 延后复验，不阻塞本期 DONE）**：补 `RESEND_API_KEY` + `RESEND_PARTNER_AUDIENCE_ID` 后，提交申请在对应 Resend partner audience 可见、`first_name`/`last_name` 正确、重复提交不产生重复/不报错、可导出 CSV（呼应 P1-5/T18）。

## 架构评估 / 开发要点（tech-architect · 2026-06-02）

**契约影响结论：零数据模型变更、零接口契约变更。** 本单是纯"接线"——`designPartnerSchema`（5 字段）不动、`POST /api/design-partner` 出入参（in 5字段+蜜罐 / out 200`{ok:true}`·400·429）不动、`addContact` 签名不动、Resend Contact 映射形态（§3.1 已定）不动。06 §3.1/§4.2/§4.6 早已预置 T02 形态；本次仅在 §3.1 补了 name 拆 first/last 的**确定性规则**作为 QA/security 的对齐基准（非契约变更，无需迁移）。**红线命中仍属实**（动外部入库=第三方数据写入 + PII 处理），full 道 + security-auditor 不变。

**直接照搬的现成模板**：`app/api/cloud-waitlist/route.ts`（T01/ISSUE-8）已落地完全相同的 `Promise.allSettled([addContact(...), sendEmail(...)])` 并行 fire-and-forget 模式 + 缺 env 降级仍 200。T02 = 把同模式搬到 design-partner route，唯一增量是 **name 拆分**。

**实现步骤（backend）**：
1. **新增 `lib/split-name.ts`**（纯函数，便于单测）：
   ```ts
   export function splitName(raw: string): { firstName: string; lastName?: string } {
     const t = raw.trim().replace(/\s+/g, " ");
     const i = t.indexOf(" ");
     if (i === -1) return { firstName: t };
     return { firstName: t.slice(0, i), lastName: t.slice(i + 1) };
   }
   ```
   （`firstName` 为空串时由 `addContact` 的 `firstName ? {...}` 自动跳过，防御 zod `min(1)` 放过纯空格的边角。）
2. **改 `app/api/design-partner/route.ts`**：在蜜罐判定后、返 200 前，把现有 `await sendEmail(...)` 替换为并行块（保留既有 `console.info` 取证日志、subject/text 正文全 5 字段 + IP/时间戳尾注、`replyTo: data.email` 全部不变）：
   ```ts
   const { firstName, lastName } = splitName(data.name);
   await Promise.allSettled([
     addContact({
       audienceId: process.env.RESEND_PARTNER_AUDIENCE_ID,
       email: data.email,
       firstName,
       lastName,
     }),
     sendEmail({ to: foundersEmail(), subject, text, replyTo: data.email }),
   ]);
   ```
   import 增 `addContact from "@/lib/resend-audiences"` 与 `splitName from "@/lib/split-name"`。
3. **不碰**：schema、provider、前端表单 JSX/成功态/track（ISSUE-2 已就绪，AC5③/AC6/AC7 属"确认不回归"）、限流、cloud-waitlist route。

**测试方案（缺密钥期，对齐 AC8 延后真实联调）**：
- 新增 `scripts/check-design-partner-route.ts`，注册 `test:design-partner`（仿 `test:audiences` 的 stubFetch/captureConsole 模式）：
  - **splitName 单测**：覆盖 AC2 全部样例（双词/单词/三词带中点/前后多空格塌缩/纯空格→firstName空串被跳过）。
  - **路由集成**（stub 全局 fetch + 注入伪 `RESEND_API_KEY`+`RESEND_PARTNER_AUDIENCE_ID`）：合法提交 → 断言对 `…/audiences/{id}/contacts` 发出 POST 且 body `first_name`/`last_name` 正确（AC2）；同时仍发通知邮件（拦 `/emails` 请求，AC4 正文 5 字段+replyTo）。
  - **降级分支**：缺 `RESEND_PARTNER_AUDIENCE_ID`（其余正常）→ 不发 contacts 请求、仍发通知、route 仍返 200 + warn（AC3）；缺 `RESEND_API_KEY` → 两者均 skip+warn、仍 200（AC4）。
  - **安全/不回归**：蜜罐 `website` 非空 → silent 200、零 contacts、零通知（AC5③）；入库 body 只含 email+first/last，无 companySize/currentStack/biggestPain/IP（AC5①）。
- 起真服务断言：`pnpm dev`/`start` + curl 合法/非法/缺字段（AC1 400 / 合法 200），注入伪 env 证明确实发出上游 POST（AC2）。
- E2E（qa-automation，复用 ISSUE-2 断言）：前端成功态原位持久卡（AC7）+ 2xx 后 `track("design_partner_submit")`、4xx/429/蜜罐不触发（AC6）。
- 闸门：`pnpm check`（typecheck+lint+a11y+i18n parity）+ `pnpm build` exit 0；新脚本纳入 `test:design-partner` 并全过（AC7）。预期零文案改动 → i18n parity 无缺口。

**阻塞项**：无。密钥缺失属预期（用户 2026-06-01 决策），AC1–AC7 全可在缺密钥下经 mock/脚本/起服务客观验证；AC8 真实 Resend 写入联调延后补密钥复验，不阻塞本期 DONE。

## 处理记录
- 2026-06-01 23:30:28 工单创建（feature / P0）
- 2026-06-02 04:51:29 set assignee=backend-engineer
- 2026-06-02 04:51:29 set priority=P0
- 2026-06-02 04:51:29 set status=triaged
- 2026-06-02 04:51:33 LANE: full
- 2026-06-02 04:51:33 EXTRA_ROLES: security-auditor
- 2026-06-02 PM细化(T02/P0-2): 补全用户故事+AC1-AC8+明确不做; 核实代码现状(核心缺口=route 未调 addContact、未拆 name first/last; provider/通知/track/成功态均 T01·ISSUE-8 或 T05·ISSUE-2 已就绪属不回归); 定姓名拆分确定性规则(首空白切分,单词仅 first); 同步 PRD §8.ISSUE-9
- 2026-06-02 架构评估(tech-architect): 结论=零数据模型/零接口契约变更(纯接线,schema/provider/API I-O 全不动); 06 §3.1 补 name 拆 first/last 确定性规则作 QA/security 对齐基准(非契约变更); 给出实现步骤(新增 lib/split-name.ts 纯函数 + route 仿 cloud-waitlist 的 Promise.allSettled 并行块)+测试方案(新 test:design-partner 脚本覆盖 AC1-AC7, AC8 延后); 无阻塞
- 2026-06-02 安全审计(security-auditor·AC5): 设计/契约安全评审完成→09-安全审计.md(ISSUE-9 节,置顶)。结论 本期(缺密钥)有条件PASS,不阻断DONE。传统漏洞 高0/中0(M1隐私披露+M2日志为决策项)/低3; 开发期红线2: G1(addContact+sendEmail并行块须置于蜜罐return之后,蜜罐命中→零入库/零通知/零track)、G2(入库仅email+first/last,严禁companySize/currentStack/biggestPain/IP进audience=AC5①)。复用provider已ISSUE-8清零(encodeURIComponent/env-only/日志截断)。M1=新增"DP申请进可营销Resend名单"须隐私页披露(配密钥AC8上线前必清,需PM/法务);M2=接线勿新增PII日志字段。放行绑定代码落地后security复审+QA验AC5(蜜罐前置/字段最小化/splitName不外泄额外PII)。无阻塞。
- 2026-06-02 05:01:10 set status=in_progress
- 2026-06-02 开发完成(backend-engineer): 按架构方案纯接线实现 T02。
  **改动文件**：① 新增 `lib/split-name.ts`(确定性首空白切分纯函数)；② `app/api/design-partner/route.ts`(蜜罐 return 后并行 `Promise.allSettled([addContact(email+first/last only), sendEmail(既有通知)])`，缺 env 降级仍 200+warn；imports 增 addContact/splitName)；③ 新增 `scripts/check-design-partner-route.ts` + `package.json` 注册 `test:design-partner`。**未动**：schema/provider/前端表单/限流/cloud-waitlist route(AC5③/AC6/AC7 属不回归)。
  **自测结果**：`test:design-partner` 全过(splitName AC2 5例 + route AC1 zod 400/200 + AC2 入库&姓名拆分&通知 + AC5① PII最小化 + AC3/AC4 降级 + AC4 通知全5字段&replyTo&IP/时间戳 + AC5③ 蜜罐零副作用 + AC5④ 密钥不泄露)；`test:audiences` 回归全过；`pnpm check` 0报错(typecheck+lint+a11y 26/26 AA+i18n 506↔506 parity)；`pnpm build` exit 0(/api/design-partner 为 dynamic fn)；真实 `next start` curl 实测 valid→200 / bad·missing·honeypot→400 / 日志证缺 RESEND_API_KEY 时 audiences+email 双降级仍 200。
  **关键发现(供 QA/security 知悉, 非阻塞)**：① 蜜罐 `website` 的 `z.string().max(0)` 使填充值在 **zod 层即被拒为 400**(silent-200 分支为死代码)——与 cloud-waitlist(ISSUE-8 QA PASS)同构；AC5③ 安全保证(零入库/零通知/零track)仍成立(经 400 而非 silent 200，前端不触发 track 因非 2xx)。② `lib/email.ts` 错误日志打印完整上游 body 未截断(pre-existing，本单不动 sendEmail)——现实中 Resend 错误响应不含调用方密钥，风险低；addContact 路径已截断(已验)。
  **AC 状态**：AC1–AC7 缺密钥下经脚本/起服务客观验证通过；AC8(真实 Resend 写入联调)按本期政策延后补密钥复验，不阻塞 DONE。**阻塞项：无。** commit ea8d4dc。
- 2026-06-02 05:08:39 set status=in_review
- 2026-06-02 代码审查(code-reviewer): **结论 PASS，建议放行 QA/发布。必改问题 0。** 审 `main...feature/ISSUE-9` 全部改动(route.ts/split-name.ts/package.json/check-design-partner-route.ts)。
  **复核通过项**：① 正确性——`splitName` 确定性首空白切分(trim+`\s+`塌缩+`indexOf(" ")`)与 §3.1 规则一致，双词/单词/三词带中点/前后空格/纯空格(firstName="" 由 addContact `firstName?{...}` 跳过)五例均经单测覆盖；route 在蜜罐判定后、返200前以 `Promise.allSettled([addContact, sendEmail])` 并行 fire-and-forget，缺 env 降级仍 200，无异常逃逸。② 契约——schema/`addContact` 签名/API 出入参全未动，audienceId 仅来自 `process.env.RESEND_PARTNER_AUDIENCE_ID`(不可被请求体覆盖)，与 06 §3.1/§4.6 契约一致；零数据模型/零接口变更属实。③ 安全(对齐 security G1/G2)——入库 body 仅 `email,first_name,last_name,unsubscribed`(经 AC5① 测试断言 keys 最小化 + 不含 companySize/currentStack/biggestPain/IP)；蜜罐填充→zod 400→零入库/零通知/零track；密钥不入日志(AC5④ 截断验证通过)。④ 可维护性——与 `cloud-waitlist/route.ts` 同构(同一并行降级模式)，注释充分，`splitName` 抽成纯函数便于单测，命名/风格与现有一致；无重复无过度复杂。⑤ 提交规范——`feat(ISSUE-9):`/`chore(ISSUE-9):` 符合 Conventional Commits。
  **独立验证(本机实跑)**：`tsx check-design-partner-route.ts` 全过(splitName 5 + AC1/AC2/AC5①/AC3/AC4/AC4通知/AC5③/AC5④)；`tsc --noEmit` rc=0；`test:audiences` 回归全过。
  **可选项(非阻塞，不在本单范畴)**：① 蜜罐 silent-200 分支为死代码——`website: z.string().max(0)` 使填充值在 zod 层即被拒为 400(与 ISSUE-8 cloud-waitlist 同构、已 QA PASS)；安全保证(零副作用)仍成立，AC5③ 实测亦确认，**建议维持现状**(若要真"silent 200"需改 schema，超本单范围)。② `lib/email.ts` 错误日志打印完整上游 body 未截断(pre-existing，本单不动 sendEmail)——现实中 Resend 错误响应不含调用方密钥风险低，建议另开工单统一截断。
  **放行建议**：交 qa-automation 做 E2E(AC6 埋点时序 + AC7 成功态原位持久卡)即可关单;AC8 真实 Resend 联调按本期政策延后,不阻塞 DONE。**阻塞项:无。**
- 2026-06-02 05:10:55 set status=verifying
- 2026-06-02 QA 验证结果（qa-automation）：**VERDICT: PASS**。阻断级缺陷 0。
  **执行证据（全部真实运行）**：
  - `pnpm test:design-partner`（scripts/check-design-partner-route.ts）全部断言通过 exit 0：splitName AC2 5 例（双词/单词/三词带中点/前后空格塌缩/纯空格→firstName 空被跳过）+ route AC1 zod 400×6/200×2 + AC2 入库 POST `/audiences/{id}/contacts` 精确 body（first_name=Ada/last_name=Lovelace，单词名仅 first）+ 通知 + AC5① body keys 最小化(email,first_name,last_name,unsubscribed) + AC3 缺 audience 降级 + AC4 缺 key 双 skip+warn + AC4 通知全 5 字段+replyTo+IP/时间戳 + AC5③ 蜜罐 400 零副作用 + AC5④ 密钥不入日志（截断）。
  - `pnpm test:audiences` 回归全过 exit 0。
  - 真服务 `next start` + curl 实测：valid→200 / 缺字段·非法email·非枚举·name>120·pain>400·坏JSON·honeypot填充→400 / 缺 RESEND env→200+warn(audiences+email 双 skip) / 伪 env 探针→200(fail-soft) 且日志证实确实对外发出 contacts POST(真实 Resend 返 400 "API key is invalid")+email POST(401)，错误日志已截断不含密钥。
  - T11 限流回归：同 IP req#1–5→200、req#6→429。
  - E2E 真实 Chromium `tests/e2e/analytics-funnel.spec.ts` 14/14 passed：#7 design_partner_submit 2xx 后 fire(props=null，AC6) + #8 500 不 fire(AC6) + 成功态 `getByRole("status")` 原位持久卡可见(AC7)。
  - 闸门：`pnpm check` 0 报错（typecheck+lint+a11y 26/26 AA+i18n 506↔506 parity）；`pnpm build` exit 0。
  **AC 结论**：AC1–AC7 全部经真实执行客观验证通过；AC8 真实 Resend 写入联调按本期缺密钥政策延后补密钥复验，不阻塞 DONE。
  **非阻塞观察项**（复核确认不影响放行）：① 蜜罐 silent-200 分支为死代码（zod max(0) 使填充值在校验层即 400，与 cloud-waitlist 同构，安全保证仍成立）；② lib/email.ts 错误日志未截断 body（pre-existing，本单不动 sendEmail，风险低，建议另开工单）。详见 08-测试报告.md「ISSUE-9」节。
- VERDICT: PASS
