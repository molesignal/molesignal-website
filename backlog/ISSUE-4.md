---
id: ISSUE-4
type: feature
title: [T06] 隐私/条款真实法务文本
status: closed
priority: P0
assignee: fullstack-engineer
created: 2026-06-01
updated: 2026-06-02
---

## 描述
模块:隐私/条款真实法务文本 | 角色:fullstack | 依赖:无 | 里程碑:M1 | 验收:/privacy /terms替换LegalStub;覆盖邮箱收集+Plausible无cookie+Resend第三方;EN/ZH双语;日期准;内链2xx。合规红线full道 | 详见 07-开发任务拆分.md(T06) 与 06-技术架构.md/READINESS.md

## 需求说明

### 背景与承接
承接 PRD §4.1 **P0-6**「隐私 / 条款真实法务文本」（D8 信任/合规域）。当前 `/privacy` `/terms` 两页共用占位 `LegalStub`（`messages.legal.stub` = "Full legal text under review… placeholder for v1 launch"），收集用户邮箱却无真实隐私说明——这是**合规红线 + 信任红线**（DESIGN_BRIEF "Proof over promise"：一个收邮箱的站点用占位隐私页 = 失信）。本工单把占位替换为**与站点真实数据流一致**的隐私政策与服务条款，EN/ZH 双语。

### 用户故事
- **US-1（核心）**：作为留下邮箱进 Cloud 候补 / 提交 Design Partner 申请的用户，我想在 `/privacy` 看到**真实、具体**的隐私政策（我交了什么数据、谁能拿到、怎么联系删除），以便我知情后再决定是否提交。
- **US-2**：作为中文区用户，我想在 `/zh/privacy` `/zh/terms` 读到与英文等价的中文法务文本，以便母语理解。
- **US-3**：作为访客，我想在 `/terms` 看到这个开源项目官网的使用条款（按现状：开源、无担保、as-is），以便了解使用边界。
- **US-4**：作为创始团队/运营，我想隐私政策准确反映**真实在用的第三方与数据处理方式**（Resend / Plausible / 限流），以便上线不踩合规雷、且日后改数据流时有据可依。

### 真实数据流（法务文本必须如实覆盖，不得多写也不得漏写）
> 文本必须**以下列已核实事实为准绳**，禁止凭空声称站点不存在的行为（如"我们使用 cookie 追踪""出售数据"）。

**A. 主动收集的个人数据（用户表单自愿提交）**
| 来源 | 字段 | 代码依据 |
|---|---|---|
| Cloud 候补 (`/cloud`) | 邮箱 | `lib/schemas/cloud-waitlist.ts`（仅 email；`website` 为蜜罐，填了即丢弃不存） |
| Design Partner (`/design-partner`) | 姓名、邮箱、公司规模、当前可观测性栈、最大痛点(选填) | `lib/schemas/design-partner.ts`（name/email/companySize/currentStack/biggestPain；`website` 蜜罐丢弃） |

**B. 自动处理的数据**
- **IP 地址**：仅用于表单接口防滥用限流（`lib/rate-limit.ts`，按 IP 计数），**短期/瞬态**，不做用户画像。〔本期限流后端 Upstash，缺 env 时内存兜底——表述用通用"用于防滥用的限流"，不绑死供应商名亦可〕
- **Plausible 分析**：**无 cookie、不存 IP、不跨站追踪、尊重 DNT**，仅聚合页面浏览与已定义的转化事件（事件 props 不含 PII，呼应 ISSUE-2 AC）。仅当配置了 `NEXT_PUBLIC_PLAUSIBLE` 域名时才加载。
- **浏览器本地存储**：主题偏好、预发布 banner 关闭状态存于**用户浏览器 localStorage，不回传服务器**（`theme-provider` / `pre-release-banner`）——如实说明这不是追踪。

**C. 第三方 / 子处理方（必须列明）**
- **Resend**：发送通知邮件 + 存储候补/申请名单（Audiences）。即邮箱/姓名会传给 Resend 存储。
- **Plausible Analytics**：隐私友好的无 cookie 分析。
- **限流/基础设施**：IP 经限流组件处理；站点为静态/Serverless 托管。
- 明确：**不向第三方出售个人数据**；仅为上述目的共享。

**D. 数据用途**：通知 Cloud 开放 / 跟进 Design Partner 申请 / 必要的产品更新沟通——**不超出用户提交时的预期目的**。

**E. 用户权利与联系方式**：访问 / 更正 / 删除其数据——通过 `founders@molesignal.io`。保留期：按目的所需（候补在产品就绪通知后、申请在评估结束后可请求删除）。

### 服务条款（/terms）覆盖要点
- 本站为 **molesignal 开源项目官网**，内容/数字（成本对比等）按现状(as-is)提供、可能变动，仅供参考非商业承诺。
- 软件本身为开源，遵循其仓库 **Apache-2.0 License**（`LICENSE`）；官网内容版权归项目。
- 可接受使用：禁止滥用表单/接口（呼应限流）。
- 无担保 / 责任限制（轻量、与开源项目调性一致，非重型商业条款）。
- 条款可更新，以页面"最后更新"日期为准。

### 法务文本来源（关键假设，见"阻塞/开放项"）
本期按 **PRD §7-10 + READINESS 外部前置**：若用户/法务提供成稿则直接用；**否则以标准 cookieless-SaaS-waitlist 模板自拟**，**严格对齐上表真实数据流**，并在页首标注"本文为通俗说明、非正式法律意见，最终以…为准 / 有疑问联系 founders@molesignal.io"。属本期可达成的"诚实文案"，不阻塞 M1。

### 实现约束（供 fullstack/架构承接，PM 不定技术细节）
- 替换 `LegalStub` 占位渲染为**分节结构化文本**（标题 + 段落 + 列表），`/privacy` 与 `/terms` 各自独立内容（现 terms 也只渲染同一 `stub`，须分开）。
- 文案走 `messages/{en,zh}.json` 的 `legal` 命名空间，**EN/ZH 键结构对齐无缺口**（i18n parity，呼应 D6）；现有 `privacyTitle/termsTitle/lastUpdated/stub` 需扩展为分节键，`stub` 可移除或保留兜底。
- `LAST_UPDATED` 常量更新为**真实发布日期**（本期开发当日，如 `2026-06-02`），两页日期准确且与文本内容一致。
- 页内若有链接（如 mailto:founders、GitHub LICENSE、/cloud /design-partner 等），全部 2xx / 有效。

### 明确不做（YAGNI / 防镀金）
- 不做 cookie 同意横幅 / consent management（站点本就无追踪 cookie，加了反而误导）。
- 不引入第三方法务生成 SaaS / iframe 嵌入政策。
- 不做 GDPR/CCPA 全套权利工作流 UI（数据导出/删除经邮件人工处理即可，呼应 P1-5 T18）。
- 不新增数据收集、不改表单字段、不改 Resend/Plausible/限流的实际行为（仅**如实描述**现状）。
- 不把 `/privacy` `/terms` 迁 MDX（属 M2 内容系统范畴，本期纯 i18n 文案）。

## 验收标准

- **AC1 隐私页真实化**：`/privacy`（及 `/zh/privacy`）不再渲染占位 `stub`；内容覆盖上文 A–E 全部要点：① 收集的字段（cloud=邮箱；DP=姓名/邮箱/公司规模/栈/痛点）；② Plausible **无 cookie / 不存 IP / 不跨站**；③ 第三方 **Resend**（邮件+名单存储）；④ IP 限流防滥用；⑤ localStorage 本地偏好非追踪；⑥ 用户删除/联系方式 `founders@molesignal.io`。逐条可在页面文本中被 QA 核到。
- **AC2 条款页真实化**：`/terms`（及 `/zh/terms`）渲染**独立于 privacy** 的真实条款文本，覆盖：开源/as-is、Apache-2.0、可接受使用、无担保、可更新。不再与 privacy 共用同一 `stub`。
- **AC3 双语 parity**：`messages/en.json` 与 `messages/zh.json` 的 `legal` 命名空间**键结构完全一致、无缺漏**；ZH 为 EN 的对等翻译（非占位、非英文残留）；`pnpm check`（含 i18n parity 校验，若有）通过。
- **AC4 日期准确**：两页"最后更新"显示真实发布日期（本期开发当日），且文本未声称任何与日期/现状矛盾的内容。
- **AC5 文本忠于事实（合规红线核心）**：法务文本**不声称站点不存在的行为**——不得写"使用 cookie 追踪""出售/共享数据用于广告""收集精确位置"等与代码不符的表述；声称的每个第三方（Resend/Plausible）与每类数据均能在代码中找到依据。security-auditor 须据此审查覆盖完整性与表述准确性。
- **AC6 无死链**：两页内所有链接（mailto、GitHub LICENSE、站内链接）解析有效；`pnpm lint:links` 不因本页新增链接产生 2xx 之外结果（与 ISSUE-3/T04「无死链门禁」一致）。
- **AC7 构建与回归**：`pnpm check` + `pnpm build` 通过；两页在 EN/ZH、明暗主题下渲染正常无崩坏；Footer 既有 `/privacy` `/terms` 入口仍指向本页且可达。
- **AC8 免责声明就位**：页首/页尾有"通俗说明、非正式法律意见，疑问联系 founders@molesignal.io"类声明（自拟模板路径下必备；若用户提供正式成稿可豁免此条）。

> **验证手段**：QA 用浏览器 E2E 逐页核对 EN/ZH 两语种六大覆盖点文本存在 + 链接 2xx + 主题切换无崩坏；security-auditor 做事实一致性审查（AC5）。无外部密钥即可全程验证（纯文案/i18n，不依赖 Resend/Plausible/Upstash env）。

## 架构评估与开发要点（tech-architect, 2026-06-02）

### 契约影响结论
- **数据模型：无变更。** 不新增/不改任何表单字段；`lib/schemas/cloud-waitlist.ts`、`lib/schemas/design-partner.ts` 原样不动，仅在法务文案中**如实描述**其现有字段。
- **接口契约（API 出入参）：无变更。** `app/api/cloud-waitlist/route.ts`、`app/api/design-partner/route.ts` 不触碰。Resend/Plausible/Upstash 限流的实际行为不改，仅文字描述。
- **唯一变更的契约 = i18n 内容契约**（页面 ↔ `messages/{en,zh}.json` 的 `legal` 命名空间形状）。属单模块内（fullstack 同时拥有页面与文案）的内部契约，**不构成跨模块契约**，故 `06-技术架构.md` 的数据模型/接口契约章节无需改动。新形状定义见下方“i18n 内容契约”。
- **结论：本工单虽因合规红线走 full 道，但技术面是纯内容/i18n 改造，零 schema / 零 API / 零新依赖。**风险集中在「文案忠于事实」(AC5)，由 security-auditor 把关，非架构风险。

### i18n 内容契约（新 `legal` 命名空间形状 — EN/ZH 必须同构）
现有扁平结构（`privacyTitle/termsTitle/lastUpdated/stub`）扩展为**分节结构**。推荐形状（privacy 同理 terms）：

```jsonc
"legal": {
  "lastUpdated": "Last updated {date}",          // 保留，复用占位符
  "disclaimer": "本文为通俗说明、非正式法律意见…疑问联系 founders@molesignal.io",  // AC8 免责
  "privacy": {
    "title": "Privacy Policy",
    "intro": "…",
    "sections": [                                 // 数组：每节 {heading, body[], bullets?[]}
      { "heading": "Information we collect", "body": ["…"], "bullets": ["Cloud waitlist: email", "Design Partner: name, email, company size, current stack, biggest pain (optional)"] },
      { "heading": "Analytics (Plausible)",  "body": ["No cookies, no IP storage, no cross-site tracking, respects DNT…"] },
      { "heading": "Third parties",          "body": ["Resend — sends notification email and stores waitlist/applicant lists…"] }
      // …IP 限流 / localStorage 非追踪 / 数据用途 / 用户权利与联系方式
    ]
  },
  "terms": {
    "title": "Terms of Service",
    "intro": "…",
    "sections": [ { "heading": "Open source & as-is", "body": ["…Apache-2.0…"] }, … ]
  }
  // "stub" 可删除（无其他引用）或保留为兜底，二选一即可；删除时确认全仓无引用
}
```

**关键约束（务必遵守，否则 `pnpm lint:i18n` 红）**：
- 校验器 `scripts/check-i18n-parity.ts` 把数组按下标展开成 `sections.0.heading` 形式的键。**EN 与 ZH 的 `sections` 数组长度、每节的 `body`/`bullets` 条目数必须逐一对齐**，否则判定 key 缺失而 fail。先定稿 EN 结构 → ZH 按相同条目数翻译。
- ZH 必须是对等翻译，**不得留英文残块、不得占位**（AC3）。

### 渲染落地建议（fullstack 自行裁量，给推荐路径）
1. `t()` 只能取字符串叶子，**不能直接返回数组/对象**（取非叶子会抛错）。要遍历 `sections`，用 next-intl 服务端 `getMessages()` 拿到整包后导航到 `legal.privacy.sections` 再 `.map()` 渲染；标题/日期/免责声明等单值仍用 `getTranslations("legal")`。
2. 把现有 `LegalStub` 抽成一个可复用的 `LegalDocument`（或就地）组件：`title + lastUpdated + disclaimer + sections.map(heading→h2, body→p, bullets→ul/li)`，沿用现有 `Section`/`prose-container`/排版 class，**不引入新 UI 依赖**（无新 UI 设计）。privacy 与 terms 各自取自己的 `sections`，**彻底分开，不再共用 `stub`**（AC2）。
3. 页内链接（AC6）：`mailto:founders@molesignal.io`、GitHub `LICENSE`、站内 `/cloud` `/design-partner` 等，建议用 `t.rich()` 在特定段落注入标签（如 `<email/>`、`<license/>`），或在组件层把这几个已知链接渲染为 `<a>`/next-intl `<Link>`，**不要把裸 URL 当纯文本**。GitHub LICENSE 用绝对 URL（指向仓库 `LICENSE`），站内链接用 next-intl `Link` 以带 locale 前缀。
4. `LAST_UPDATED` 常量两页统一改为 **`2026-06-02`**（开发当日，AC4），与文本内容不矛盾。
5. **Next.js 版本提示**：本仓 AGENTS.md 警告“This is NOT the Next.js you know”。本工单不新增 Next API（仅沿用既有 `getTranslations/setRequestLocale/generateMetadata` 模式），若需新增（如 `getMessages` 用法）先查 `node_modules/next/dist/docs/` 及 next-intl 版本约定，照现有页面模式抄。

### 验证（fullstack 自测门，QA 前必过）
- `pnpm lint:i18n`（parity）→ `pnpm typecheck` → `pnpm check` → `pnpm build` 全绿。
- 链接：`pnpm dev` 起服务后 `pnpm lint:links`，确认 `/privacy /terms /zh/privacy /zh/terms` 及新增链接全 2xx（AC6/AC7）。
- 人工目测 EN/ZH × 明暗主题四态无崩坏。

### 不阻塞 M1
法务文本来源走“用户成稿优先，否则模板自拟+对齐真实数据流+免责声明(AC8)”，纯文案不依赖任何外部密钥，可全程本地验证。

## 处理记录
- 2026-06-01 23:30:28 工单创建（feature / P0）
- 2026-06-02 02:00:35 set assignee=fullstack-engineer
- 2026-06-02 02:00:35 set priority=P0
- 2026-06-02 02:00:35 set status=triaged
- 2026-06-02 02:00:35 LANE: full —— 命中红线①涉隐私/合规(隐私政策/服务条款须覆盖邮箱收集、Plausible无cookie分析、第三方Resend数据处理)。法务文本错误=合规风险，不得 light。full 道: PM细化(明确法务文本来源/口径/覆盖范围)→架构评估(LegalStub替换方式/i18n键结构)→开发→代码审查→QA验证。
- 2026-06-02 02:00:35 EXTRA_ROLES: security-auditor —— 隐私/合规红线，需安全审计员审查法务文本对数据收集(邮箱)、第三方数据处理(Resend)、无cookie分析(Plausible)的覆盖完整性与表述准确性。不涉新UI设计/埋点，故不增派 ux/ui/data-analyst。
- 2026-06-02 架构评估(tech-architect)：契约影响=零数据模型/零 API/零新依赖；唯一变更为单模块内 i18n 内容契约(`legal` 命名空间扁平→分节)，故不改 06 架构文档。已写明 i18n 新形状契约、parity 数组同构约束、`getMessages()` 遍历渲染路径、链接/日期/免责落地要点与自测门(见“架构评估与开发要点”节)。技术风险低，主风险在 AC5 文案忠于事实，交 security-auditor 把关。可直接进 fullstack 开发。
- 2026-06-02 PM 细化：补全需求说明（背景/4 条用户故事/真实数据流 A–E/条款要点/实现约束/明确不做）与 8 条验收标准 AC1–AC8。核实依据：cloud 仅收 email、DP 收 5 字段（含蜜罐丢弃）、Plausible 无 cookie/不存 IP、Resend 存邮件+名单、IP 限流、localStorage 仅存主题/banner、Apache-2.0、联系 founders@molesignal.io。关键开放项：法务文本来源（用户成稿优先，否则模板自拟+对齐真实数据流+免责声明）——不阻塞 M1。要点已同步 03-产品PRD.md §8。
- 2026-06-02 security-auditor（AC5 写作前置事实核验）：对账"真实数据流 A–E vs 当前 src 代码"，详见 09-安全审计.md §09b。结论=无传统漏洞面（纯 i18n/零依赖/零密钥），但发现 **2 处写作必修口径纠偏（阻断 AC5）**：
  - **F1（必修）**：工单 C 段"Resend 存储候补/申请名单(Audiences)" **代码中不存在**（`lib/email.ts` 仅发通知邮件、无 contacts API；route 成功路径仅 `sendEmail(founders)`；`.env.local.example` 的 `RESEND_*_AUDIENCE_ID` 无任何引用=计划未实现）。照工单原话写=声称站点不存在的存储，**反向违反 AC5**。改写为：Resend 仅作邮件服务商传输通知邮件，未将用户加入任何营销名单/Audiences。
  - **F2（必修）**：IP 表述不可只写"限流瞬态"。`route.ts` 把 **IP+时间戳+全部表单字段**写入通知邮件正文经 Resend 发给创始团队并长期留存（既有审计 L2 已记录）。隐私页须如实披露此共享/留存，否则 AC5 漏报。
  - F3（中）：`console.info` 记 email/size/stack 入服务器日志——文案补一句披露 或 转工单去 PII 日志（二选一）。
  - F4（中/AC6）：GitHub LICENSE 绝对链 `…/molesignal/molesignal/blob/main/LICENSE`，仓库若未公开则死链——确认公开 或 降级链 Apache 官方 URL / 纯文字。
  - ✅ 可照写（与代码一致）：cloud 仅 email、DP 5 字段+蜜罐丢弃、Plausible 无 cookie/不存 IP/尊重 DNT/仅配 domain 时加载、localStorage 仅 `molesignal-theme`+banner关闭时间戳(7天)、IP 限流防滥用、不出售数据、Apache-2.0/Copyright 2026 molesignal contributors、founders@molesignal.io。
  - **放行条件**：fullstack 落地后 security-auditor 复审实际文案，F1/F2 口径已纠偏且六覆盖点齐 → AC5 PASS；否则回流。
- 2026-06-02 02:11:33 set status=in_progress
- 2026-06-02 fullstack 实现完成（feature/ISSUE-4）：

  **改动文件**
  - `components/legal/legal-document.tsx`（新增）：可复用的分节法务文档组件（title + lastUpdated + disclaimer + intro + sections.map(heading/body/bullets) + footer），沿用 `Section`/`prose-container` 与现有排版 class，零新 UI 依赖。`disclaimer`/`footer` 为 ReactNode，由页面注入真实 `<a>`（mailto / Apache 许可），不出现裸 URL 文本。
  - `app/[locale]/privacy/page.tsx`：替换 `LegalStub`；`getTranslations("legal")` 取标题/日期/`t.rich(disclaimer|privacy.contact)` 注入 mailto 链接；`getMessages()` 导航到 `legal.privacy.sections` 后 `.map()` 渲染。`LAST_UPDATED="2026-06-02"`。
  - `app/[locale]/terms/page.tsx`：同上，独立渲染 `legal.terms.sections`，footer 用 `t.rich(terms.license)` 注入 Apache 官方许可链接（target=_blank+rel=noopener）。
  - `messages/en.json` / `messages/zh.json`：`legal` 命名空间由扁平（`stub`）改为分节结构（`disclaimer` + `privacy{title,intro,sections[8],contact}` + `terms{title,intro,sections[5],license}`），删除 `stub`（全仓无其他引用）。EN/ZH 数组长度/每节 body·bullets 条目数逐一对齐。
  - `playwright.config.ts`（**T12 E2E 基础设施，非 T06 内容**）：修复 `@playwright/test` 升级到 1.60 后的依赖漂移 —— `reducedMotion` 不再是顶层 `use` 选项，按官方类型文档移入 `contextOptions:{reducedMotion:"reduce"}`，意图不变。**此项为先于本工单存在、阻断全仓 `pnpm check`/`build` 的 typecheck 错误（ISSUE-2 引入、main 上即红），不修则我的正确产出也会被 QA 连带 FAIL**；单独 commit 标注，便于 T12 追溯。

  **文案忠于事实（AC5，已对齐 security-auditor F1–F4）**
  - F1：Resend 表述改为「仅作邮件服务商传输通知邮件，不将你加入任何营销名单/audience」（代码 `lib/email.ts` 仅 `sendEmail`，无 contacts/Audiences API）。
  - F2：隐私页「你的提交如何被处理」如实披露：表单字段 + IP + 时间戳作为通知邮件发给创始团队并留存于邮箱，邮箱设为 reply-to（依据 `app/api/*/route.ts`）。
  - F3：同节披露服务器日志（cloud=email；DP=email/size/stack，依据 `console.info`）。
  - F4：放弃 GitHub LICENSE 死链风险，许可链接指向 Apache 官方 `https://www.apache.org/licenses/LICENSE-2.0`（恒 2xx）。
  - 六覆盖点齐：①收集字段（cloud=email；DP=name/email/size/stack/pain）②Plausible 无 cookie/不存 IP/不跨站/尊重 DNT/仅配域名加载 ③Resend（仅传输通知邮件）④IP 限流防滥用 ⑤localStorage 本地偏好非追踪 ⑥删除/联系 founders@molesignal.io。不出售数据、Apache-2.0、© 2026 molesignal contributors 均如实。

  **自测结果**
  - `pnpm lint:i18n`：EN/ZH 各 504 键，parity OK。
  - `pnpm check`（typecheck+lint+a11y:contrast+i18n）：全绿（修复 playwright 配置后）。
  - `pnpm build`：exit 0，`/[locale]/privacy`、`/[locale]/terms` 以 SSG 预渲染 en+zh 四页。
  - `pnpm dev` + 实测四页：`/privacy /terms /zh/privacy /zh/terms` 均 200；六覆盖点文本在 EN/ZH 均核到；无占位 `stub` 残留；mailto/apache 链接渲染为真实 `<a>`；privacy 与 terms 内容彻底分开。
  - `pnpm lint:links`：本工单相关链接（privacy/terms/cloud/design-partner × EN/ZH）全 2xx；唯一 FAIL 为 `/opengraph-image` 404 —— ISSUE-3 已记录的预存且与本工单无关项。

  **阻塞/移交项**
  - `/opengraph-image` 404：预存、非本工单引入，影响「无死链门禁」聚合项（T04），与 T06 无关，留待对应工单处理。
  - `playwright.config.ts` 修复属 T12 E2E 范畴，本工单顺手解阻塞全仓构建；T12 落地时知悉此改动即可。
  - 交 code-reviewer 审查 + security-auditor 复审 AC5 文案忠于事实（F1/F2 口径）。
- 2026-06-02 02:22:29 set status=in_review
- 2026-06-02 code-reviewer 审查（feature/ISSUE-4，diff main...feature/ISSUE-4）：

  **审查范围**：4 个源码文件（privacy/terms 页、legal-document 组件、playwright.config）+ 2 个文案文件（en/zh.json legal 命名空间）。

  **客观验证（本地实跑）**
  - `tsc --noEmit`：exit 0（含 `getMessages()` 后 `as { ... sections: LegalSection[] }` 断言路径，类型通过）。
  - `eslint` 三个改动源文件：exit 0。
  - `check-i18n-parity.ts`：EN/ZH 各 504 键 parity OK；legal 命名空间 42 键完全对齐，privacy sections 8/8、terms sections 5/5，`stub` 已删且全仓无残留引用，`LegalStub` 无残留。
  - ZH legal 全部字符串叶子均含中文、无英文残块/占位（AC3 ✓）。

  **正确性 / 契约**：✅ 通过
  - i18n 内容契约（legal 分节形状）落地与架构师定义一致；`t()` 取字符串叶子、`getMessages()` 遍历数组的渲染路径正确。
  - 富文本标签匹配无误：`disclaimer`/`*.contact` 用 `<email>`、`terms.license` 用 `<license>`，各页 `t.rich` 的 tag handler 一一对应。
  - `section.heading` 唯一（已核 8+5 标题不重复），用作 key 安全；body/bullets 用 index key 属静态列表可接受。
  - 数据模型/API 零变更，符合架构评估结论。

  **文案忠于事实（AC5）**：✅ 与 security-auditor F1–F4 纠偏一致
  - F1：Resend 表述=「仅传输通知邮件，不加入营销名单/audience」✓
  - F2：「How your submission is handled」如实披露 表单字段+IP+时间戳 作为通知邮件发给创始团队并留存、邮箱设 reply-to ✓
  - F3：同节披露服务器日志（cloud=email；DP=email/size/stack）✓
  - F4：许可链接指向 apache.org 官方 URL（恒 2xx），规避 GitHub LICENSE 死链风险 ✓
  - 六覆盖点齐全；不出售数据、Apache-2.0、© 2026 molesignal contributors 均如实。
  > 注：AC5 的最终事实一致性裁定归 security-auditor 复审；此处仅记代码审查侧确认覆盖点齐备且与 F1–F4 口径吻合。

  **可维护性发现**
  - 〔已直接修复·refactor commit bbd8575〕terms/page.tsx 内联硬编码 `mailto:founders@molesignal.io`，与 privacy/page.tsx 的 `emailLink` helper + `FOUNDERS_EMAIL` 常量风格不一致。抽出同款 helper 对齐 sibling 页，行为不变。
  - 〔可选·不阻塞〕`emailLink` 在 privacy/terms 两页各自定义一份（DRY 轻微重复）；如后续新增第三个法务页，建议把 `emailLink`/`licenseLink` 提到 `legal-document.tsx` 或共享小模块。本期两页规模小，不强制。
  - 〔可选·与本工单无关〕全仓 `pnpm check` 不含 `format:check`，privacy/terms 两页 committed 态均不满足 prettier（单行 import 超 printWidth 等）。非本工单引入、不影响门禁，留意即可。

  **提交规范**：✅ Conventional Commits 合规（feat/fix/chore + ISSUE-4，playwright 修复单独 commit 便于 T12 追溯）。

  **结论**：必改问题 0；已直接修复 1 处可维护性不一致并按规范提交（bbd8575）。无关键 bug。**建议放行到 QA 验证**（security-auditor 对 AC5 文案的最终复审为并行/前置门，二者齐过即可关单）。
- 2026-06-02 02:27:17 set status=verifying
- 2026-06-02 qa-automation 独立验证（feature/ISSUE-4，生产构建 + 真 Chromium E2E）：

  **QA 验证结果：通过（PASS）** —— AC1–AC8 全部实测通过，证据如下：
  - **AC1 隐私六覆盖点**：EN privacy 渲染 HTML 16/16 grep PASS（cloud=email、DP 字段、Plausible「no cookies/does not store IP/不跨站/Do-Not-Track」、Resend、「do not add you to any marketing list」、rate-limit、「stored locally in your browser」+「not tracking」、「never sell」、founders@）；E2E 断言全绿；无 `placeholder for v1 launch` 残留。
  - **AC2 条款独立**：terms 渲染 Apache License 2.0 / as is / without warranties / 可更新；与 privacy 彻底分开；stub 已删（全仓无引用）。
  - **AC3 双语 parity**：`pnpm lint:i18n` EN/ZH 各 504 键 OK；legal 数组同构（privacy 8/8、terms 5/5）；ZH 为对等翻译（你主动提供的信息/你的提交如何被处理/担保…），无残英、无占位。
  - **AC4 日期**：四页均显示 `2026-06-02`。
  - **AC5 忠于事实**：messages 文本逐条核验——F1 Resend「仅作邮件服务商传输通知邮件，不加入营销名单/audience」✓；F2「How your submission is handled」如实披露 表单字段+IP+时间戳作通知邮件发创始团队并留存、邮箱设 reply-to ✓；F3 服务器日志披露 ✓；无虚假「cookie 追踪/出售数据」表述。与 security-auditor F1–F4 纠偏完全一致。
  - **AC6 链接**：mailto:founders@molesignal.io（四页）、apache.org/licenses/LICENSE-2.0（两 terms 页）均为真实 `<a href>` 锚点、无裸 URL；apache 外链 200；`lint:links`（生产构建）四法务页+站内链全 2xx。唯一 FAIL=`/opengraph-image 404`，预存（ISSUE-3/T04）、非本页链接、与 T06 无关。
  - **AC7 构建/回归**：`pnpm check` exit 0、`pnpm build` exit 0（privacy/terms SSG 预渲染 en+zh 四页）；E2E 主题切换无 pageerror；全量 E2E **20/20 绿**（14 既有 analytics-funnel + 6 新增 legal），证明本分支 `playwright.config.ts` 改动未回归。
  - **AC8 免责声明**：disclaimer「plain-language summary, not formal legal advice…email founders@」渲染于两页。

  **新增回归套件**：`tests/e2e/issue4-legal.spec.ts`（6 用例）。重跑：`PATH 含 node v23.6.1 → pnpm exec playwright test`（门禁 `pnpm check && pnpm build`；链接须生产构建 `SITE=… pnpm lint:links`）。

  **观察项（非阻断·dev-only）**：`pnpm dev`（Turbopack）被 lint:links 并发爬时进全站 JSON.parse 500 坏态且不自愈；生产 build+start 全程 200、E2E 全绿不可复现 → 判 dev/HMR 并发坏态，与内容无关，不影响上线。建议另立工单查 dev 体验。

  **阻断级缺陷：0。放行建议：合并回 main。**
  详见 08-测试报告.md「ISSUE-4 [T06] … 运行时验证」节。

  VERDICT: PASS
- 2026-06-02 02:34:48 set status=closed
- 2026-06-02 02:34:48 引擎周期#4: QA PASS, 关闭
