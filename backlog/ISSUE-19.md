---
id: ISSUE-19
type: feature
title: [T18] 表单数据导出工作流
status: closed
priority: P1
assignee: fullstack-engineer
created: 2026-06-01
updated: 2026-06-02
---

## 描述
模块:表单数据导出工作流 | 角色:fullstack | 依赖:T01,T02 | 里程碑:M2 | 验收:文档化Resend Dashboard导出cloud/partner CSV;字段含来源/时间戳;验证可用 | 详见 07-开发任务拆分.md(T18) 与 06-技术架构.md/READINESS.md

## 需求说明

### 背景与定位
T18（P1-5 / D2）。承接 PRD §4.2「P1-5 表单提交结构化看板/导出」与架构 `06 §3.1`。
本期**已锁定决策：轻量托管、不自建 DB**（READINESS 顶部政策）。因此本工单**不写代码、不建 DB、不做后台看板 UI**，而是产出一份**运营数据导出运行手册（runbook）**，把"候补/申请数据怎么导出、字段怎么补全、怎么验证可用"文档化，让创始团队能在 Resend Dashboard 自助拉数做增长运营。

### 数据现状（已核实 T01/T02 代码，是本手册的事实基础）
提交数据落在**两个数据汇**，手册必须讲清二者如何拼合：

1. **Resend Audience（可触达名单，可导出 CSV）**
   - Cloud 候补（`RESEND_CLOUD_AUDIENCE_ID`）：每条仅 `email`（+ Resend 原生 `created_at`/`unsubscribed`）。
   - Design Partner（`RESEND_PARTNER_AUDIENCE_ID`）：`email` + `firstName` + `lastName`（name 按首空白拆分，见 `lib/split-name.ts`）。
   - **审计/隐私决策（已落地）**：size / stack / pain **不入** audience（PII 最小化）。来源、IP、精确提交时间也**不在** audience。
2. **founders@ 通知邮件归档（结构化全字段兜底）**
   - Cloud 通知：subject `[cloud-waitlist] <email>`；正文 = `email` + `IP` + `Sent: <ISO8601>`。
   - DP 通知：subject `[design-partner] <name> (<size>) — <stack>`；正文 = Name / Email / Company size / Current stack / Biggest pain / IP / `Sent: <ISO8601>`，`replyTo` = 申请人。
   - **来源**由 subject 前缀标签（`[cloud-waitlist]` / `[design-partner]`）标识；**时间戳**取正文 `Sent:` 行（或邮件投递时间）；**结构化字段**（size/stack/pain）仅此处可得。

### 范围内（本期做）
- 一份内部运营 runbook（建议 `docs/ops/data-export.md`，最终路径由 fullstack 与主管确认；属内部文档，不进站点导航、不计入 i18n parity）。
- 覆盖两个 audience 的 Resend Dashboard 导出步骤、两源拼合方法、统一导出字段字典（含**来源**与**时间戳**）、样例 CSV、验证清单、隐私与访问控制约定。

### 明确不做（本期）
- 不自建 DB / CRM、不接 Supabase/Neon、不做后台看板或导出 UI、不新增 API/route、不改表单字段或 schema。
- 不把 size/stack/pain 塞进 audience 自定义字段（维持 T02 的 PII 最小化决策）。
- 不做自动化 ETL/定时同步脚本（本期人工 Dashboard 导出 + 邮件归档拼合即可）。
- 不在仓库/文档中提交任何真实用户邮箱或 PII（样例一律用 `jane@example.com` 等虚构数据）。

### 用户故事
- **US-1（增长运营·主）**：作为创始团队成员，我想按一份明确步骤从 Resend 导出 cloud/partner 名单 CSV，以便做触达和增长分析，不必看代码或问工程师。
- **US-2（字段完整）**：作为做转化分析的人，我想导出的数据带**来源**和**时间戳**，并能把 DP 的 size/stack/pain 从通知邮件补全到一行，以便按来源/时间/画像分群。
- **US-3（合规·承接 §6）**：作为对隐私负责的人，我想手册写清谁能访问这些数据、保存多久、收到删除请求怎么从两个数据汇都删掉，以便走"邮件人工处理 GDPR 请求"（呼应 ISSUE-4 §6 不做 GDPR UI 的决策）。

### 边界 / 异常
- **缺密钥（本期默认）**：本期不提供 `RESEND_API_KEY` 及两个 audience id，无法做真实 Dashboard 导出联调。手册须同时给出"无账号时如何核对手册正确性"与"补密钥后如何复验"两条路径。
- **两源数据不一致**：audience 有而邮件归档缺（或反之）时，手册须说明以哪一源为准（可触达性以 audience 为准、结构化字段以邮件归档为准）及如何对账。
- **重复/退订**：audience 去重以 email 为键（幂等已由 T01/T02 保证）；导出后应剔除 `unsubscribed=true`；手册须提示。
- **DP name 拆分**：审计时注意 audience 的 first/last 是 `splitName` 机器拆分结果，原始全名以通知邮件 `Name:` 行为准。

## 验收标准

> LANE: full，EXTRA_ROLES: security-auditor。本工单产物为**文档**，"开发→代码审查→独立 QA"三环不省：代码审查＝核手册与真实代码行为一致；QA＝按手册可复现/字段字典自洽。

- **AC1 导出步骤完整可跟**：手册分别写出 cloud 与 partner 两个 audience 在 Resend Dashboard 的导出 CSV 操作步骤（入口路径、选择 audience、导出动作、产物格式），步骤具体到无需工程介入即可执行。
- **AC2 字段字典含来源与时间戳**：手册给出统一导出数据的**字段字典**，每个字段标注【数据来源汇】（audience / 通知邮件）、含义、示例值；**必须含 `source`（来源：cloud-waitlist | design-partner）与 `timestamp`（提交时间，ISO8601）两列**，并标明其取自何处（source=subject 前缀标签；timestamp=邮件 `Sent:` 行 / audience created_at）。
- **AC3 DP 结构化字段补全方法**：手册说明如何把 DP 的 `companySize` / `currentStack` / `biggestPain`（仅存在于通知邮件正文）按 email 关联补全到导出行，给出可操作的拼合方法（人工对照 / 邮件搜索 `[design-partner]` 标签等）。
- **AC4 样例 CSV**：给出 cloud 与 partner 各一份脱敏样例 CSV（含表头与 ≥1 行虚构数据），字段与字段字典一致，可直接套用为模板。
- **AC5 与真实代码行为一致（防画饼）**：手册描述的字段、subject 标签格式、`Sent:` 时间戳、name 拆分规则，与 `app/api/cloud-waitlist/route.ts`、`app/api/design-partner/route.ts`、`lib/split-name.ts` 现状**逐项核对一致**，不臆造 audience 不存在的字段。
- **AC6 缺密钥降级与复验路径**：手册写明本期无 Resend 账号时如何核对正确性（对照代码 / 用通知邮件归档样例），以及日后补 `RESEND_API_KEY`+audience id 后的真实导出复验清单（呼应 READINESS：本项按"文档就绪 + 字段映射经核对正确"判 `[x]`，真实 Dashboard 导出联调延后复验）。
- **AC7 隐私与访问控制（security-auditor 把关）**：手册含一节，写明：① 谁可访问 Resend Dashboard 与 founders@ 收件箱（最小授权）；② 数据保存/清理约定；③ 收到删除请求时从 **audience + 邮件归档两处**删除的步骤（承接 §6「GDPR 走邮件人工」）；④ 导出文件的安全保存/传输与销毁提示。
- **AC8 仓库零真实 PII**：手册及样例中不含任何真实用户邮箱或个人数据，全部为虚构示例；不引入新依赖、不改任何 API/schema/前端。

## 架构评估与开发要点（tech-architect）

### 架构/契约影响判定：无（纯文档，不动 schema/接口）
- 本工单**不新增/修改任何 API、route、schema、数据模型、前端、依赖**，仅产出内部 runbook。**06-技术架构.md 无需改动、无迁移说明**。
- 与红线对照：①安全/隐私 → 命中（导出含 PII，已挂 security-auditor 把关 AC7）；②动 schema/契约 → **不命中**（只读现状、不改）。LANE: full 由①触发，合理；但开发本身是写文档，不碰代码契约。
- READINESS：本项按"文档就绪 + 字段映射经核对正确"判 `[x]`，真实 Dashboard 导出联调延后（无密钥），符合 AC6。

### 已核对的代码事实基础（截至 feature/ISSUE-19，逐项核验通过，runbook 必须与此一字不差 → 满足 AC5）

**1. Cloud 通知邮件**（`app/api/cloud-waitlist/route.ts:64-69`）
- subject：`[cloud-waitlist] <email>`
- body（注意 email 与 IP 之间有空行 + `---` 分隔线）：
  ```
  <email>

  ---
  IP: <ip>
  Sent: <ISO8601>
  ```
- replyTo：`<email>`（申请人邮箱，cloud 侧也有 replyTo）

**2. Cloud audience**（`RESEND_CLOUD_AUDIENCE_ID`，经 `addContact` 写入，route.ts:60-63）
- 仅 `email`（+ Resend 原生 `created_at` / `unsubscribed`）。**不写** first/last。`unsubscribed` 默认 `false`（`lib/resend-audiences.ts:67`）。

**3. DP 通知邮件**（`app/api/design-partner/route.ts:63-76`）
- subject：`[design-partner] <name> (<companySize>) — <currentStack>`（分隔为 em-dash `—`，非连字符）
- body（字段名后为固定空格对齐，逐字如下）：
  ```
  Name:          <name>
  Email:         <email>
  Company size:  <companySize>
  Current stack: <currentStack>

  Biggest pain:
  <biggestPain 去空白后原文；为空时固定写 "(not provided)">

  ---
  IP: <ip>
  Sent: <ISO8601>
  ```
- replyTo：`<email>`（申请人）

**4. DP audience**（`RESEND_PARTNER_AUDIENCE_ID`，route.ts:91-97）
- `email` + `first_name` + `last_name`（来自 `splitName(name)`）+ `unsubscribed:false`。
- **companySize / currentStack / biggestPain 不入 audience**（PII 最小化，维持 T02 决策）——这三字段**仅能从 DP 通知邮件正文补全**。

**5. splitName**（`lib/split-name.ts:19-24`）
- trim → 内部连续空白折叠为单空格 → 按**第一个空格**拆分；首段=firstName，其余（含中间名/复姓，原样保留）=lastName。
- 单词名 → 只有 firstName（无 lastName）。审计 audience 的 first/last 时须知这是机器拆分结果，**原始全名以通知邮件 `Name:` 行为准**（呼应工单"边界·DP name 拆分"）。

**6. 枚举取值**（`lib/schemas/design-partner.ts`，样例 CSV 与字段字典须用这些字面量）
- companySize：`1-10` / `11-50` / `51-200` / `201-1000` / `1000+`
- currentStack：`Datadog` / `New Relic` / `Splunk` / `Loki + Grafana` / `ELK / OpenSearch` / `Self-built` / `None / starting from scratch` / `Other`
- biggestPain：可选，≤400 字符；缺省在邮件中呈现为 `(not provided)`。

### 派生字段映射（满足 AC2）
- `source`：取 subject 前缀标签 → `[cloud-waitlist]` ⇒ `cloud-waitlist`；`[design-partner]` ⇒ `design-partner`。
- `timestamp`：以邮件正文 `Sent:` 行（ISO8601）为**结构化字段的权威时间**；audience 导出无该列，只有 Resend 原生 `created_at`（与 `Sent:` 为并行写入、近似同刻，可作 audience-only 行的回退时间）。runbook 须写明二者取舍：**结构化字段时间以 `Sent:` 为准，纯 audience 行以 `created_at` 兜底**。

### 两源拼合与对账要点（满足 AC3 / 边界"两源不一致"）
- 键：`email`（幂等去重已由 T01/T02 + addContact 409/"already exists" 容错保证，`resend-audiences.ts:80`）。
- 可触达性以 **audience** 为准；结构化字段（size/stack/pain/原始全名/IP/精确时间）以 **founders@ 邮件归档** 为准。
- 导出后剔除 `unsubscribed=true`（仅 audience 导出含此列）。
- DP 补全方法：在 founders@ 收件箱按 `[design-partner]` 标签搜索，按 email 关联把 size/stack/pain 回填到导出行。

### 开发交付建议
- 文档落 `docs/ops/data-export.md`（内部，不进站点导航、不计 i18n parity，最终路径与主管确认即可）。
- 样例 CSV 全用虚构数据（`jane@example.com` 等），仓库零真实 PII（AC8）。
- 不新增依赖、不碰任何 `app/` `lib/` `components/` 代码与 env 之外的配置。
- security-auditor 重点核 AC7：Resend Dashboard / founders@ 最小授权、保存清理约定、删除请求需**audience + 邮件归档两处都删**、导出文件安全保存/传输/销毁。

## 处理记录
- 2026-06-01 23:30:28 工单创建（feature / P1）
- 2026-06-02 09:01:12 set assignee=fullstack-engineer
- 2026-06-02 09:01:12 set priority=P1
- 2026-06-02 09:01:12 set status=triaged
- 2026-06-02 09:01:12 LANE: full
- 2026-06-02 09:01:12 EXTRA_ROLES: security-auditor
- 2026-06-02 09:04:02 PM细化：补全US1-3/边界/AC1-8；定位运营导出runbook(不自建DB/不写代码)，两数据汇拼合(Resend Audience email+first/last + founders通知邮件归档结构化全字段)，source/timestamp字段明确，security-auditor把关隐私与删除路径；要点同步PRD §8
- 2026-06-02 09:10:40 security-auditor(AC7把关)：09-安全审计.md追加09c节。核对4源代码确认PII落点=4处(非工单原2处)：Resend Audience+founders收件箱+Resend已发送邮件+服务器运行时日志(cloud route.ts:54/DP route.ts:79 console.info含email/size/stack)。必修2:P1删除请求须覆盖4处PII汇及兜底口径、P2导出CSV生命周期约束(不进git/加密传输/用完即删);中3:P3最小授权人×系统(API key不用于Dashboard导出)/P4默认保留期+退订≠删除/P5隐私口径不超ISSUE-4已上线/privacy。附可直接嵌入runbook的隐私节蓝本。无传统漏洞(纯文档)。放行:fullstack产出docs/ops/data-export.md后复审P1/P2存在+零真实PII(AC8)→AC7 PASS,否则回流。
- 2026-06-02 09:11:01 set status=in_progress
- 2026-06-02 fullstack-engineer 开发完成：产出 `docs/ops/data-export.md`（内部运营导出 runbook，纯文档，零代码/schema/API/依赖改动）。`.gitignore` 增 `*.csv` 兜底防真实数据误提交。改动文件：`docs/ops/data-export.md`(新增)、`.gitignore`。提交：`feat(ISSUE-19): 表单数据导出运营 runbook (T18)`。

  **AC 逐条自检**：
  - **AC1 导出步骤完整可跟** ✓：§2 分别给出 cloud(§2.1)/partner(§2.2) 两个 audience 在 Resend Dashboard 的登录→Audiences→选 audience(按 env id 核对)→Contacts→Export CSV 全步骤，无需工程介入；§2.3 导出后剔退订/进拼合。
  - **AC2 字段字典含来源与时间戳** ✓：§3 给统一字段字典，每列标【来源汇】(audience/邮件/派生)+含义+示例；含 `source`(cloud-waitlist|design-partner，取 subject 前缀标签) 与 `timestamp`(ISO8601，结构化以邮件 `Sent:` 为准、纯 audience 行 `created_at` 兜底) 两列，§3.1 专述其来源与取舍。
  - **AC3 DP 结构化字段补全** ✓：§4 给人工补全步骤——founders@ 搜 `[design-partner]`、按 email 关联把 size/stack/pain/全名/Sent 回填到导出行；多封取最新。
  - **AC4 样例 CSV** ✓：§8 cloud(§8.1)/partner(§8.2) 各一份脱敏样例(表头+≥1 行虚构数据)，字段与字典一致；DP 样例演示单词名(splitName 无 last)、`(not provided)`、含逗号字段双引号转义。
  - **AC5 与真实代码一致** ✓：§1 subject 标签格式(`[cloud-waitlist]`/`[design-partner] <name> (<size>) — <stack>` em-dash)、body 模板(空行+`---`+`IP:`/`Sent:`)、splitName 规则(首空格拆分/单词名)、枚举字面量(companySize/currentStack)均逐项核对 route.ts/split-name.ts/schemas，未臆造 audience 不存在字段(size/stack/pain 标注仅邮件可得)。
  - **AC6 缺密钥降级与复验** ✓：§6.1 无账号时对照代码+邮件归档核对(判 READINESS `[x]`)；§6.2 补 `RESEND_API_KEY`+两 audience id 后的真实导出复验 7 项清单。
  - **AC7 隐私与访问控制** ✓：§7 完整落地 security-auditor 必修——P1 删除请求覆盖 **4 处** PII 汇(Resend Audience/founders 收件箱/Resend 已发送邮件/服务器运行时日志，含 console.info 行号引用，后两处给"保留期到期即清"兜底口径)；P2 导出 CSV 生命周期约束(禁 git/禁第三方在线表格/加密传输/用完即删)；P3 最小授权人×系统+API key 不用于导出；P4 默认保留期+退订≠删除；P5 口径对齐已上线 `/privacy`，不超 ISSUE-4。
  - **AC8 仓库零真实 PII** ✓：全文/样例仅用 `jane@example.com`/`sam@example.org`/`cher@example.net` 等虚构数据；密钥用 `re_xxx`/`<RESEND_..._AUDIENCE_ID>` 占位无真实值；不引入依赖、不改任何 API/schema/前端；`.gitignore` 增 `*.csv` 防误提兜底。

  **自测**：`pnpm typecheck`(tsc --noEmit) 0 报错(纯文档+gitignore，无代码影响，确认未破坏构建)；全文人工核对 §1 与 5 个源码文件逐字一致。**阻塞项**：无。真实 Dashboard 导出联调因本期无 `RESEND_API_KEY`+audience id 延后(符合 AC6，按"文档就绪+字段映射经核对正确"判 READINESS `[x]`)。
- 2026-06-02 09:15:06 set status=in_review
- 2026-06-02 code-reviewer 代码审查完成：**结论 PASS，必改 0，建议放行 QA**。

  **审查范围**：`git diff main...feature/ISSUE-19` 全量——仅 3 文件改动（`docs/ops/data-export.md` 新增 / `.gitignore` 增 `*.csv` / 本工单记录）。**零代码/schema/API/依赖改动**，与 AC8 及架构「无契约影响」判定一致。提交规范合规（Conventional Commits：`feat(ISSUE-19): ...` + `chore(ISSUE-19): ...`，标题含工单号）。

  **AC5 防画饼逐项核验（核心：手册 vs 真实代码）**——逐字核对 5 个源码文件，全部一致：
  - cloud subject `[cloud-waitlist] <email>`、body `<email>\n\n---\nIP:\nSent:`、replyTo=email → 与 `app/api/cloud-waitlist/route.ts:54/60-69` 一致 ✓
  - DP subject `[design-partner] <name> (<size>) — <stack>`（em-dash）、body 字段对齐空格（Name:/Email:/Company size:/Current stack: 均对齐至第 15 列，逐字符核对一致）、`Biggest pain:` 空缺写 `(not provided)`、replyTo=email → 与 `app/api/design-partner/route.ts:63-76` 一致 ✓
  - audience 写入字段：cloud 仅 email；DP email+first_name+last_name+unsubscribed:false；size/stack/pain 不入 audience → 与 `lib/resend-audiences.ts:54-91`（默认 `unsubscribed ?? false` 在 :67、409/"already exists" 幂等在 :80）一致 ✓
  - splitName 首空格拆分/单词名无 lastName → 与 `lib/split-name.ts:19-24` 一致 ✓
  - 枚举字面量（companySize/currentStack）→ 与 `lib/schemas/design-partner.ts:3-20` 逐项一致 ✓
  - console.info 运行时日志 PII 落点行号引用（cloud :54 含 email；DP :79-83 含 email/size/stack）、Resend 发件 `noreply@updates.molesignal.io`（`lib/email.ts:16`）→ §7 删除路径 4 处 PII 汇均核对属实 ✓
  - 文中所有内联行号引用（:60-63 / :64-69 / :91-97 / :67 / :80 等）均与现状代码对齐，无失效引用。

  **AC1-AC8 复核**：AC1 导出步骤可跟、AC2 字段字典含 source/timestamp 及取舍、AC3 DP 补全法、AC4 双样例 CSV（演示单词名/`(not provided)`/逗号双引号转义）、AC6 缺密钥双路径、AC7 隐私节（P1 四处删除+P2 CSV 生命周期+最小授权+保留期+口径对齐 `/privacy`）、AC8 零真实 PII（全 `example.*` 虚构 + `re_xxx` 占位）——均满足。

  **发现**：
  - 无 bug、无契约不符、无风格问题需改。
  - 【可选/不阻塞】`.gitignore` 用 `*.csv` 为全局通配，意图（防真实导出数据误入库）正确且本仓库当前无合法 CSV 资产，风险极低；若日后引入测试 CSV fixtures 需注意它会被静默忽略。本期无需改。

  **放行建议**：通过代码审查，移交 qa-automation 独立验证（按手册可复现性 + 字段字典自洽 + 零真实 PII）。真实 Dashboard 导出联调因本期无密钥延后复验，符合 AC6。
- 2026-06-02 09:17:09 set status=verifying
- 2026-06-02 qa-automation 独立验证完成：**VERDICT: PASS**。

  **验证性质说明**：本工单产物为纯文档 runbook（`docs/ops/data-export.md`），零代码/schema/API/依赖改动（`git diff main...HEAD` 仅 3 文件：runbook 新增、`.gitignore` 增 `*.csv`、本工单记录）。故无服务可起、无接口可打、无 E2E 可走；QA 按工单定义执行＝①手册与真实代码逐项核对(AC5 防画饼) ②字段字典/样例自洽 ③仓库零真实 PII(AC8)。已**独立重读 5 个源码文件**核对，未依赖开发/审查的结论。

  **AC5 逐字核对（独立复核，全部一致）**：
  - cloud：subject `[cloud-waitlist] <email>`、body `<email>\n\n---\nIP:\nSent:`、replyTo=email → 对齐 `app/api/cloud-waitlist/route.ts:54/60-69` ✓
  - DP：subject `[design-partner] <name> (<size>) — <stack>`（em-dash）、body 字段对齐空格块（Name:/Email:/Company size:/Current stack: 对齐至第 16 列，逐字符核对一致）、`Biggest pain:` 空写 `(not provided)`、replyTo=email → 对齐 `app/api/design-partner/route.ts:63-76` ✓
  - audience：cloud 仅 email；DP email+first_name+last_name，`unsubscribed ?? false`（`lib/resend-audiences.ts:65-67`），size/stack/pain 不入 audience ✓
  - splitName 首空格拆分/单词名无 lastName → `lib/split-name.ts:19-24` ✓
  - 枚举 companySize/currentStack 字面量 → `lib/schemas/design-partner.ts:3-20` 逐项一致 ✓
  - §7 PII 落点行号引用全部属实：`console.info` cloud:54 / DP:79-83；发件 `noreply@updates.molesignal.io`(`lib/email.ts:16`)、`founders@molesignal.io`(`lib/email.ts:65`) ✓

  **AC1-4/6-8 复核**：AC1 §2 双 audience 导出步骤可跟；AC2 §3 字段字典含 `source`/`timestamp` 两列及取舍(§3.1)；AC3 §4 DP 按 email 从邮件补 size/stack/pain；AC4 §8 双样例 CSV（演示单词名 `Cher` splitName 无 last、`(not provided)`、逗号字段双引号转义），字段与字典一致；AC6 §6 缺密钥双路径+复验清单；AC7 §7 删除请求覆盖 4 处 PII 汇+CSV 生命周期+最小授权+口径对齐 `/privacy`；AC8 全文仅 `jane@example.com`/`sam@example.org`/`cher@example.net` 虚构 + 公司自有地址，无真实 `re_` 密钥(grep 0)、无 audience UUID(grep 0)，`.gitignore` 增 `*.csv` 兜底 ✓

  **缺陷**：0（阻断 0 / 主要 0 / 次要 0）。**回归**：纯文档无运行时回归面，未引入构建影响。**延后**：真实 Resend Dashboard 导出联调因本期无 `RESEND_API_KEY`+audience id 延后，符合 AC6（按"文档就绪+字段映射经核对正确"判 READINESS `[x]`）。

  **VERDICT: PASS** —— 建议放行合并。
- 2026-06-02 09:19:06 set status=closed
- 2026-06-02 09:19:06 引擎周期#20: QA PASS, 关闭
