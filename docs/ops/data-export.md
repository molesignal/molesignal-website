# 表单数据导出运营手册（runbook）

> **ISSUE-19 / T18** · 内部运营文档（不进站点导航、不计入 i18n parity）
> 适用对象：molesignal 创始团队成员（增长 / 运营 / 隐私负责人）
> 目的：在**不自建 DB、不写代码**的前提下，从 Resend 自助导出 cloud 候补名单与 Design Partner 申请名单，补全结构化字段，并合规处理这些高敏 PII。

---

## 0. 一页速览（TL;DR）

提交数据落在**两个数据汇**，导出时需把二者按 `email` 拼合：

| 数据汇 | 拿到什么 | 用途 |
|---|---|---|
| **Resend Audience**（可触达名单，可导出 CSV） | `email`（+ DP 的 `first_name`/`last_name`）、`created_at`、`unsubscribed` | 谁在名单上、能否触达 |
| **founders@ 通知邮件归档**（结构化全字段兜底） | 来源标签、`Sent:` 时间戳、IP、DP 的 `companySize`/`currentStack`/`biggestPain`、原始全名 | 来源/时间/画像分群 |

**最短路径**：
1. Resend Dashboard → Audiences → 导出 cloud / partner 两个 audience 的 CSV（§2）。
2. 剔除 `unsubscribed=true` 的行（§5.3）。
3. 对 DP 名单，去 founders@ 收件箱按 `[design-partner]` 标签把 size/stack/pain 补到行里（§4）。
4. 给每行补 `source` 与 `timestamp` 两个派生列（§3 字段字典）。
5. 按 §7「隐私与访问控制」处理该 CSV（高敏 PII，禁进 git / 禁第三方在线表格 / 用完即删）。

> ⚠️ **本期无 Resend 账号**（未配置 `RESEND_API_KEY` 及两个 audience id）。无法做真实 Dashboard 导出联调 —— 见 §6「缺密钥降级与复验路径」：本期靠"对照代码 + 通知邮件归档"核对手册正确性，补密钥后再按 §6 复验清单做真实导出。

---

## 1. 数据从哪来（事实基础，与代码逐项核对一致）

> 本节描述与下列源码**逐字一致**（截至 `feature/ISSUE-19`）。改表单/路由时须同步本手册（见 §8 维护约定）。
> 源码：`app/api/cloud-waitlist/route.ts`、`app/api/design-partner/route.ts`、`lib/resend-audiences.ts`、`lib/split-name.ts`、`lib/schemas/design-partner.ts`。

一次表单提交在后端做两件事（都是 fire-and-forget，互不阻塞，详见各 `route.ts`）：
1. **写 Resend Audience**（`addContact`）—— 让联系人真正进可触达名单。
2. **发 founders@ 通知邮件**（`sendEmail`）—— 把全部字段结构化归档到收件箱。

### 1.1 Cloud 候补（`POST /api/cloud-waitlist`）

- **Audience**（`RESEND_CLOUD_AUDIENCE_ID`，`route.ts:60-63`）：只写 **`email`**。
  额外由 Resend 原生维护 `created_at` / `unsubscribed`（默认 `false`，`resend-audiences.ts:67`）。**不写** first/last name。
- **通知邮件**（`route.ts:64-69`）：
  - subject：`[cloud-waitlist] <email>`
  - body（注意 email 与 IP 间有空行 + `---` 分隔线）：
    ```
    <email>

    ---
    IP: <ip>
    Sent: <ISO8601>
    ```
  - replyTo：`<email>`

### 1.2 Design Partner 申请（`POST /api/design-partner`）

- **Audience**（`RESEND_PARTNER_AUDIENCE_ID`，`route.ts:91-97`）：写 **`email` + `first_name` + `last_name`**（由 `splitName(name)` 拆分）+ `unsubscribed:false`。
  ⚠️ **`companySize` / `currentStack` / `biggestPain` 不入 audience**（PII 最小化决策 T02）—— 这三字段**只能**从下面的通知邮件正文补全。
- **通知邮件**（`route.ts:63-76`）：
  - subject：`[design-partner] <name> (<companySize>) — <currentStack>`（分隔为 em-dash `—`，不是连字符 `-`）
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
  - replyTo：`<email>`

### 1.3 `splitName` 拆分规则（`lib/split-name.ts:19-24`）

`trim` → 内部连续空白折叠为单空格 → 按**第一个空格**拆分：
- 首段 = `firstName`，其余（含中间名/复姓，原样保留）= `lastName`。
- 单词名 → 只有 `firstName`，无 `lastName`。

> 审计 audience 的 first/last 时须知这是**机器拆分结果**；**原始全名以通知邮件 `Name:` 行为准**。
> 例：`"Jane van der Berg"` → firstName=`Jane`，lastName=`van der Berg`；`"Cher"` → firstName=`Cher`，无 lastName。

### 1.4 枚举字面量（`lib/schemas/design-partner.ts`，样例/字典须用这些原文）

- `companySize`：`1-10` / `11-50` / `51-200` / `201-1000` / `1000+`
- `currentStack`：`Datadog` / `New Relic` / `Splunk` / `Loki + Grafana` / `ELK / OpenSearch` / `Self-built` / `None / starting from scratch` / `Other`
- `biggestPain`：可选，≤400 字符；缺省在邮件中呈现为 `(not provided)`。

---

## 2. 从 Resend Dashboard 导出 CSV（AC1）

> 前提：导出走 **Resend 控制台登录**（账号密码 + 2FA），**不需要也不应使用** `RESEND_API_KEY`（后端密钥，见 §7）。
> 以下为 Resend 控制台导出 Audience 的通用步骤；若 Resend 改版导致入口名称变化，按"Audiences → 选中目标 audience → 导出/下载联系人为 CSV"的同义入口操作即可。

### 2.1 导出 Cloud 候补名单

1. 浏览器登录 **https://resend.com** → 进入对应 team/workspace。
2. 左侧导航点 **Audiences**。
3. 在 audience 列表选中 **Cloud 候补** 对应的 audience（其 id = 部署环境里的 `RESEND_CLOUD_AUDIENCE_ID`；若并列多个，以该 id 核对，勿凭名字猜）。
4. 打开该 audience 的 **Contacts** 视图。
5. 点右上的 **Export / Download**（导出联系人为 CSV）。
6. 等待生成，下载 CSV。**产物列**：至少含 `email`、`created_at`、`unsubscribed`（Resend 原生列；cloud 无 first/last）。

### 2.2 导出 Design Partner 名单

同 2.1，第 3 步改选 **Design Partner** 对应 audience（id = `RESEND_PARTNER_AUDIENCE_ID`）。
**产物列**：`email`、`first_name`、`last_name`、`created_at`、`unsubscribed`。

> 📌 列名以 Resend 实际导出为准（可能是 `first_name` 或 `firstName` 等大小写/风格差异）；本手册的字段字典（§3）按"语义"对齐，导出后按语义对应即可。

### 2.3 导出后立即做的两件事

1. **剔除退订**：删掉 `unsubscribed = true`（或 `truthy`）的所有行 —— 这些人已退出触达名单（§5.3）。
2. **进入拼合**：cloud 名单到此已基本可用（仅 email + 时间）；DP 名单需按 §4 补结构化字段。

---

## 3. 统一导出字段字典（AC2）

把两源拼合后，每条记录建议落成下列统一字段。**【来源汇】** 标明该列取自哪里：`audience` = Resend 导出 CSV；`邮件` = founders@ 通知邮件归档；`派生` = 由前两者推导。

| 字段 | 【来源汇】 | 含义 | 示例值 |
|---|---|---|---|
| `source` | **派生**（来自邮件 subject 前缀标签） | 提交来源：`cloud-waitlist` 或 `design-partner` | `design-partner` |
| `email` | audience（与邮件一致） | 联系人邮箱（两源拼合主键） | `jane@example.com` |
| `timestamp` | **派生**（结构化以邮件 `Sent:` 为准；纯 audience 行用 `created_at` 兜底） | 提交时间，ISO8601 | `2026-05-30T14:22:07.001Z` |
| `first_name` | audience（DP 才有） | `splitName` 拆出的名 | `Jane` |
| `last_name` | audience（DP 才有，可空） | `splitName` 拆出的姓（含复姓/中间名） | `van der Berg` |
| `full_name` | 邮件（DP `Name:` 行，权威全名） | 申请人填写的原始全名 | `Jane van der Berg` |
| `company_size` | 邮件（DP，仅邮件有） | 公司规模枚举 | `51-200` |
| `current_stack` | 邮件（DP，仅邮件有） | 当前可观测性栈枚举 | `Datadog` |
| `biggest_pain` | 邮件（DP，仅邮件有，可空） | 最大痛点自述（≤400 字符；空时 `(not provided)`） | `Alert fatigue, too much noise` |
| `ip` | 邮件（`IP:` 行） | 提交时客户端 IP（取证用，**敏感**，分析时建议剔除） | `203.0.113.7` |
| `unsubscribed` | audience | 是否已退订（导出后应已剔除 `true` 行） | `false` |
| `created_at` | audience（Resend 原生） | audience 入库时间（`timestamp` 的兜底来源） | `2026-05-30T14:22:08Z` |

### 3.1 两个必含派生列怎么来（AC2 重点）

- **`source`**：取通知邮件 subject 前缀标签 —— `[cloud-waitlist]` ⇒ `cloud-waitlist`；`[design-partner]` ⇒ `design-partner`。
  （若只有 audience 没有对应邮件，则按它属于哪个 audience 直接判定来源。）
- **`timestamp`**：
  - **结构化字段的权威时间** = 通知邮件正文 `Sent:` 行（ISO8601）。
  - audience 导出**没有** `Sent:` 列，只有 Resend 原生 `created_at`（与 `Sent:` 为并行写入、近似同刻）。
  - 取舍：**有邮件 `Sent:` 用 `Sent:`；纯 audience 行（找不到对应邮件）用 `created_at` 兜底。**

---

## 4. 把 DP 结构化字段补全到导出行（AC3）

`company_size` / `current_stack` / `biggest_pain` / 原始全名 / IP / 精确时间**只存在于 DP 通知邮件**，需按 `email` 关联补到从 audience 导出的 DP 行上。

**人工补全步骤（无需任何工具/脚本）：**
1. 打开 **founders@ 收件箱**（`FOUNDERS_EMAIL`）。
2. 搜索框输入 `[design-partner]`，列出全部 DP 申请通知邮件（subject 形如 `[design-partner] Jane van der Berg (51-200) — Datadog`）。
3. 对 DP 导出 CSV 的每一行（按 `email`）：
   - 在收件箱按该 `email` 或申请人姓名定位对应邮件。
   - 从邮件正文逐字抄出 `Company size:` / `Current stack:` / `Biggest pain:` 三行的值，填入该行的 `company_size` / `current_stack` / `biggest_pain`。
   - 用 `Name:` 行的值填 `full_name`（权威全名，区别于 audience 机器拆分的 first/last）。
   - 用 `Sent:` 行的值填 `timestamp`。
4. 同一 `email` 有多封邮件（重复提交）时，取最新一封（`Sent:` 最大）为准 —— audience 已按 email 幂等去重（`resend-audiences.ts:80`，409/"already exists" 容错）。

> 💡 subject 已含 `(<companySize>) — <currentStack>`，快速分群时可直接从 subject 读这两项，无需展开正文；但 `biggest_pain` 与权威全名仍需进正文取。

---

## 5. 两源对账与边界处理（AC 边界）

### 5.1 谁为准
- **可触达性**（在不在名单、能不能发信）以 **audience** 为准。
- **结构化字段**（size/stack/pain、原始全名、IP、精确时间）以 **founders@ 邮件归档** 为准。
- 拼合**主键 = `email`**。

### 5.2 两源不一致怎么办
- **audience 有、邮件缺**：可触达，但拿不到结构化字段 —— 该行 `source`/`email`/`created_at` 照填，DP 结构化列留空并标注"邮件归档缺失"。`timestamp` 用 `created_at` 兜底。
- **邮件有、audience 缺**：通常是当时 audience 写入被跳过（缺 env）或失败（`addContact` fire-and-forget 不阻塞 200）。可从邮件补一条记录，但需知道此人**可能不在可触达名单**，触达前应在 Resend 手动确认/补录。

### 5.3 重复与退订
- **去重**：audience 以 `email` 为键幂等（T01/T02 + `addContact` 409/"already exists" 容错保证），正常无重复行。
- **退订**：导出后**必须剔除 `unsubscribed = true`** 的行再做触达。注意：**退订 ≠ 删除**（删除请求见 §7）。

### 5.4 DP 姓名拆分
audience 的 `first_name`/`last_name` 是 `splitName` 机器拆分结果（§1.3）；做画像/称呼时**原始全名以邮件 `Name:` 行（`full_name` 列）为准**。

---

## 6. 缺密钥降级与复验路径（AC6）

本期**未提供** `RESEND_API_KEY` 及两个 audience id，无法做真实 Dashboard 导出联调。分两条路径：

### 6.1 无账号时如何核对本手册正确性（本期）
1. **对照代码**：§1 的 subject 格式、body 模板、`Sent:` 时间戳、`splitName` 规则、枚举字面量，逐项与下列源码核对一致即可判手册"字段映射正确"：
   - `app/api/cloud-waitlist/route.ts:64-69`、`app/api/design-partner/route.ts:63-76`
   - `lib/resend-audiences.ts:55-68`、`lib/split-name.ts:19-24`、`lib/schemas/design-partner.ts:3-39`
2. **用通知邮件归档样例**：若已有任意真实/测试提交的 founders@ 通知邮件，按 §3 字段字典逐字段映射一遍，确认字典自洽（每个字段都能在邮件或 audience 找到来源）。
3. 本项 READINESS 判定：**"文档就绪 + 字段映射经核对正确" → 判 `[x]`**；真实 Dashboard 导出联调延后到补密钥后复验。

### 6.2 补 `RESEND_API_KEY` + audience id 后的真实导出复验清单
配齐 env（`RESEND_API_KEY` + `RESEND_CLOUD_AUDIENCE_ID` + `RESEND_PARTNER_AUDIENCE_ID`）并有若干真实提交后，逐项打勾：
- [ ] 按 §2 能登录 Resend Dashboard 并在 Audiences 看到 cloud / partner 两个 audience。
- [ ] 两个 audience 都能导出 CSV，cloud 含 `email`/`created_at`/`unsubscribed`，partner 另含 `first_name`/`last_name`。
- [ ] 导出 CSV 的 `email` 能在 founders@ 收件箱按 `[cloud-waitlist]`/`[design-partner]` 搜到对应通知邮件。
- [ ] DP 行能按 §4 从邮件补全 `company_size`/`current_stack`/`biggest_pain`，且值落在 §1.4 枚举内。
- [ ] `source`/`timestamp` 两派生列按 §3.1 能正确生成。
- [ ] 剔除 `unsubscribed=true` 后名单可用于触达。
- [ ] 全流程未使用 `RESEND_API_KEY` 做导出（仅控制台登录）。

---

## 7. 隐私与访问控制（合规）

> 导出的 CSV 含可营销邮箱与 Design Partner 真实姓名/公司画像，属高敏 PII。处理时遵守以下约定，与站点隐私政策（`/privacy`）口径一致。

### 谁能访问（最小授权）
- **Resend Dashboard**：仅创始团队成员，各自独立账号、启用 Resend 团队最小权限，禁共享登录。
- **founders@ 收件箱（`FOUNDERS_EMAIL`）**：仅创始团队。
- 后端密钥 `RESEND_API_KEY` 仅用于服务端写名单/发信，**不用于、也不分发给**做 Dashboard 导出的人 —— 导出走控制台登录即可。
- 离职/换人时，及时回收 Resend 账号与收件箱访问权。

### 数据保存与清理
- 候补/申请数据保留至产品 GA 或收到用户退订/删除请求为止。
- 退订（audience `unsubscribed=true`）= 从触达名单剔除，**不等于删除**；删除请求须按下节真删全部数据汇。

### 收到删除请求时（GDPR 擦除权，走邮件人工 —— 呼应隐私政策与 ISSUE-4 §6）
一封提交的个人数据落在 **4 处**，须逐一处理：
1. **Resend Audience**（cloud / partner 两个列表）：在 Dashboard 按 `email` 找到 contact 并**删除**（非仅退订）。
2. **founders@ 收件箱**：按 `[cloud-waitlist] <email>` / `[design-partner] ... <email>` 搜索，删除对应通知邮件，并清空"已删除/垃圾箱"。
3. **Resend 已发送邮件记录**：通知邮件经 Resend 发出（`lib/email.ts`，`noreply@updates.molesignal.io` → `FOUNDERS_EMAIL`），Resend 控制台 Emails 列表保留含全字段 PII 的已发送邮件 —— 一并删除或确认其保留期。
4. **服务器运行时日志**：API 会将 `email`（DP 另含 `companySize`/`currentStack`）写入托管平台运行时日志（`cloud-waitlist/route.ts:54`、`design-partner/route.ts:79-83` 的 `console.info`），按平台保留策略自动滚动过期；无法逐条手删时，以"保留期到期即自动清除"答复申请人，**不声称"已即时彻底删除"**。
- 处理后回复申请人，并记录处理时间。

### 导出文件的安全处理
- 仅在受控设备本地处理；**禁止**上传到任何第三方在线表格/云盘共享/公开仓库，**禁止 commit 进 git**（仓库已加 `*.csv` 忽略兜底，见 §8）。
- 需传输时用端到端加密渠道，禁用明文邮件群发该 CSV。
- 用完即删，不长期堆在下载目录；如需暂存，加密压缩。
- 文件内及文件名不含多余敏感标识。

> 口径对齐（不得超出已上线 `/privacy`）：不出售数据；Plausible 无 cookie/不存 IP；第三方仅 Resend + Plausible；GDPR 请求走 `founders@molesignal.io` 邮件人工。手册不得新造"同步到 CRM/其它分析平台"等站点不存在的说法。

---

## 8. 样例 CSV（AC4，全脱敏·虚构数据）

> 以下为可直接套用的模板，表头与 §3 字段字典一致。所有数据均为虚构（`example.com`），**仓库零真实 PII**。
> 真实导出文件**不得提交进仓库**。

### 8.1 Cloud 候补样例（`cloud-waitlist-sample.csv`）

```csv
source,email,timestamp,unsubscribed,created_at
cloud-waitlist,jane@example.com,2026-05-30T14:22:07.001Z,false,2026-05-30T14:22:08Z
cloud-waitlist,sam@example.org,2026-05-31T09:05:44.512Z,false,2026-05-31T09:05:45Z
```

> cloud 无 name/结构化字段；`ip` 列若需取证可从对应通知邮件 `IP:` 行补，分析分发时建议剔除。

### 8.2 Design Partner 样例（`design-partner-sample.csv`）

```csv
source,email,timestamp,first_name,last_name,full_name,company_size,current_stack,biggest_pain,unsubscribed,created_at
design-partner,jane@example.com,2026-05-30T16:40:11.230Z,Jane,van der Berg,Jane van der Berg,51-200,Datadog,"Alert fatigue, too much noise",false,2026-05-30T16:40:12Z
design-partner,cher@example.net,2026-05-31T11:12:03.880Z,Cher,,Cher,11-50,Loki + Grafana,(not provided),false,2026-05-31T11:12:04Z
```

> 第二行演示**单词名**（`splitName("Cher")` → 只有 first_name，last_name 空）与 `biggest_pain` 缺省的 `(not provided)`。
> `current_stack` / `company_size` 取值均落在 §1.4 枚举内；含逗号的 `biggest_pain` 用双引号包裹（标准 CSV 转义）。

---

## 9. 维护约定

本手册描述与代码强绑定（AC5）。**改动下列任一处时，必须同步更新本手册对应小节**：
- `app/api/cloud-waitlist/route.ts` / `app/api/design-partner/route.ts` 的 subject 格式、body 模板、`Sent:`/`IP:` 行 → §1、§3、§8。
- `lib/resend-audiences.ts` 写入 audience 的字段 → §1、§3。
- `lib/split-name.ts` 拆分规则 → §1.3。
- `lib/schemas/design-partner.ts` 枚举字面量 → §1.4、§8.2。
- 站点 `/privacy` 文本（ISSUE-4）→ §7 口径。

> 本文件为内部 ops 文档：不进站点导航、不计入 i18n parity、不引入任何依赖或代码改动。
