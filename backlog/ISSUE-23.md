---
id: ISSUE-23
type: feature
title: [T22] CompareTable动态化
status: verifying
priority: P2
assignee: fullstack-engineer
created: 2026-06-01
updated: 2026-06-02
---

## 描述
模块:CompareTable动态化 | 角色:fullstack | 依赖:T14 | 里程碑:M3 | 验收:对比数据迁内容系统/数据源;改数据不改组件。动内容契约full道 | 详见 07-开发任务拆分.md(T22) 与 06-技术架构.md/READINESS.md

## 需求说明

**承接**：PRD §4.3 **P2-2「CompareTable 动态化(#5)」** + 06-技术架构 §3.2 内容源表（compare 数据源治理）。依赖 T14（内容系统已落地）。命中红线②（动内容契约：`CompareRow`/`CompareCell` 类型 + i18n 键契约）→ **LANE: full**。

**现状（已核实，2026-06-02）——核心机制已大半就绪，本工单是"证明 + 上锁"，非从零开发**：
- 对比数据**已抽离**到 `lib/compare-data.ts` 的 `COMPARE_ROWS: CompareRow[]`（8 行：cost/sameStorage/correlation/ownership/setup/otelNative/realtime/multiTenant），与组件物理分离。
- `components/compare-table.tsx` **已是纯展示组件**：`map(COMPARE_ROWS)`、`slice(0,4)` 出 slim、按 `rows.<id>` / `<id>Detail` 查 i18n 文案、verdict→图标色映射（✓green/✗red-soft/~warn/neutral 无图标）。组件内**无硬编码行数据**。
- 维度/详情文案走 i18n（en/zh `components.compareTable.rows.*`，键齐全）；单元格 value 故意保留英文（价格/命令/技术能力等事实串，跨语言一致且与 README 字节对齐）。
- cost 行金额溯源 `lib/cost-formula.ts PRICING_SNAPSHOT`（T03 已校准的 Datadog 公开定价下限）。

**真实缺口（本工单要补的）**：
1. **契约无守卫**：新增/编辑一行需同时改 `compare-data.ts` + 两份 messages 各 2–3 个键（label + 可选 Detail）。当前**无任何检查**捕获"漏配 i18n 键 / 孤儿键 / `hasDetail:true` 却无 Detail 键 / verdict 拼错"——这类错误只在运行期暴露（next-intl 抛错或显示原始 key）。这正是"动态化"最薄弱处：数据源不是自洽可验证的。
2. **无专属测试**：兄弟数据源都有守卫脚本（`test:cost`/`test:changelog`/`test:blog`/`test:github`…），CompareTable 仅有 issue11-t10-visual 的间接 E2E。T22 命中红线、走 full 道，须有客观可复跑的验收。

**本工单做什么（凶狠收口，不过度工程）**：把"改数据不改组件"从"看起来成立"升级为**编译期/脚本期保证**——新增 `scripts/check-compare-data.ts`（`pnpm test:compare`）守卫 数据↔i18n↔类型 三方契约 + 补 E2E 行数/CTA 断言 + 把"如何更新对比数据"写成运营可照做的步骤（扩 `compare-data.ts` 头注释，并归入 T24 内容运营文档）。

**明确不做（YAGNI / 延后 scope）**：
- **不**把数据物理迁到 `content/compare.json`/`.mdx`。理由：`lib/compare-data.ts` 已是与组件分离的单一数据源；迁 JSON/MDX 仅为"和 blog 形态一致"而增加解析/校验复杂度，对一个开发者向的营销站收益边际（见**开放问题 OQ-1**，列为可翻案延后 scope）。
- **不**做单元格 value 的 i18n 化（设计上英文事实串，T03/现有注释已固化此决策）。
- **不**改组件视觉（T10/T08b 已完成 CompareTable 视觉改造，本期零视觉变更）。
- **不**新增 UI 面（无 ux/ui）、不动安全/支付/隐私、不新增埋点（`compare_table_expand` 已接线）→ **EXTRA_ROLES: none**。

### 用户故事
- **US-1（运营/PM 视角）**：作为内容维护者，我想在**单一数据源**里改对比数据（改 value、改 verdict、增/删/调序行），以便 Home（slim·前 4 行）与 /why（full·全行）两处同步更新，**全程不碰组件代码**。
- **US-2（开发视角）**：作为开发者，我想在增改一行时得到**快速确定性检查**，确认 EN+ZH i18n 键齐全（含 `hasDetail` 时的 Detail 键）、无孤儿键、verdict 合法，以便不在运行期才发现文案缺失。
- **US-3（评估者/终端用户视角）**：作为评估 molesignal 的工程师，我想对比表在两语言、明暗双主题、桌面表格 + 移动卡片下都**正确渲染 verdict 图标/语义色**且 slim/full 行为正确，以便快速看清差异。

## 验收标准

> 命中红线 → **full 道**：PM细化 → 架构评估 → 开发 → 代码审查 → 独立 QA（qa-automation），修复者不得自判通过。

- **AC1（单一数据源·组件零硬编码）**：所有行内容（`id`、三列 `value`+`verdict`、`hasDetail`）**唯一来源**为 `lib/compare-data.ts` 的 `COMPARE_ROWS`；`components/compare-table.tsx` 内**无任何硬编码行数据/value 字面串**（静态核查：组件文件不含行 value 文本）。
- **AC2（改数据不改组件·可证）**：在 `COMPARE_ROWS` 增/删/调序一行（并补对应 i18n 键）后，slim 与 full 两处表格随之变化，且 `components/compare-table.tsx` **零改动**。QA 以"临时加一行 → 两处渲染出现 → 还原"自证（参照 ISSUE-15 AC9 手法）。
- **AC3（契约守卫脚本 · 本工单核心交付）**：新增 `scripts/check-compare-data.ts` + `package.json` 脚本 `test:compare`，对 `COMPARE_ROWS` 逐行断言且违例即 **exit≠0**：
  - ① 每行 `rows.<id>` 在 `messages/en.json` **且** `messages/zh.json` 都存在且非空；
  - ② 当且仅当 `hasDetail===true` 时 `rows.<id>Detail` 在两份 messages 都存在；`hasDetail` 缺失/false 时**不应**有 Detail 键；
  - ③ 无孤儿键：`components.compareTable.rows.*` 下不存在与任何行 `id`/`<id>Detail` 不匹配的多余键（两语言对称）；
  - ④ 每个 `cell.verdict ∈ {good,mixed,bad,neutral}`、每个 `cell.value` 非空字符串；
  - ⑤ `id` 唯一、非空、可作 React key；
  - ⑥ cost 行金额与 `lib/cost-formula.ts` 的 `PRICING_SNAPSHOT` 不矛盾（至少不出现与快照相悖的绝对值；测法以脚本内注释说明口径）。
- **AC4（slim/full 行为）**：E2E 断言——`variant="slim"`（Home）渲染**恰前 4 行** + `compare_table_expand` CTA 链接指向 `/why#compare`；`variant="full"`（/why）渲染**全部行**。行数随 `COMPARE_ROWS.length` 动态，无写死。
- **AC5（i18n parity）**：`pnpm lint:i18n` 绿（EN=ZH 键对齐）；ZH 维度/详情文案齐全；单元格 value 双语一致为英文（设计如此，注释固化）。
- **AC6（视觉/可达性不回归）**：verdict 渲染 mono 字形 ✓(green)/✗(red-soft)/~(warn)/neutral(无图标) 符 05-UI §3.7；molesignal 列 brand 顶边保留；明暗双主题无崩坏；`pnpm a11y:contrast` 全过 AA。**本期不引入视觉改动**，仅保证回归不退化（issue11-t10-visual 既有断言仍过）。
- **AC7（全门禁绿）**：`pnpm check`（tsc 0 / eslint 0 / a11y / i18n）、`build`、`lint:links`、`test:e2e`、新 `test:compare` 全部通过；既有 E2E 套件零退化。
- **AC8（运营文档）**：在 `lib/compare-data.ts` 头注释补"如何安全更新一行（同步两份 messages + 跑 `test:compare`）"的明确步骤；并在 T24 内容运营文档（若先行）留一节指针。属轻量文档，不阻塞代码门禁。

### 边界 / 边缘情形
- **slim 不足 4 行**：`slice(0,4)` 安全；若 `COMPARE_ROWS.length < 4`，slim 显示全部可用行，CTA 仍展示（行为定义清楚，避免 QA 误判）。
- **neutral verdict**：不渲染图标但 value 正常显示（VerdictIcon 返回 null 分支已存在）。
- **`hasDetail:true` 漏配 Detail 键**：必须被 AC3② 捕获为失败，**不得**渲染原始 i18n key 到页面。
- **调序影响 slim**：slim = 数组前 4 行，运营调序会改变 Home 展示——AC8 文档须点明此约定。
- **守卫脚本读 messages 方式**：以 JSON 解析读 `messages/{en,zh}.json`，与 `lint:i18n` 口径一致；不引入新依赖（沿用 tsx 运行，参照 `scripts/check-*.ts` 既有模式）。

## 开放问题 / 假设
- **OQ-1（数据源物理形态）**：是否将 `COMPARE_ROWS` 迁到 `content/compare.json`/`.ts` 以与 blog/changelog/roadmap 内容源形态一致？**PM 推荐：本期不迁**（保 `lib/compare-data.ts`，YAGNI；运营更新走"改 TS + 跑 test:compare"足够）。若日后非技术运营需直接编辑，再开工单迁 JSON（命中红线②→full）。架构评估环可复核此判断。
- **假设**：cost 行金额仍由 T03 校准口径背书；本工单不重新核价，只确保守卫不与 `PRICING_SNAPSHOT` 矛盾。

## 架构评估（2026-06-02，tech-architect）

**契约结论：本工单不改数据模型 / 不改接口契约——只把既有隐式契约显式化为门禁。**
- `CompareRow`/`CompareCell` 类型签名 **零改动**；`CompareTable` 组件 props **零改动**；i18n 键结构 **不增删字段**（仅守卫现有键齐全）。full 道是 orchestrator 对红线②的保守判定，复核后：契约是被"上锁"，非被"修改"。无 schema 迁移、无 API 出入参变更。
- 06-技术架构 §3.2 已补登 `compare` 数据源行 + **CompareTable 三方契约（数据↔i18n↔类型）**小节，作为本工单与未来维护的对齐基准。
- OQ-1（迁 `content/compare.json`）：**架构复核同意 PM 判断——本期不迁**。`lib/compare-data.ts` 已是与组件分离的自洽单一数据源，迁 JSON/MDX 仅为形态对齐 blog 而增解析/校验复杂度，对开发者向营销站收益边际。若日后非技术运营要直接编辑数据，再开工单迁（届时命中红线②→full）。

### 开发要点（fullstack-engineer 照此落地）
1. **守卫脚本** `scripts/check-compare-data.ts` + `package.json` 加 `"test:compare": "tsx scripts/check-compare-data.ts"`。**严格照搬兄弟脚本范式**（参 `scripts/check-changelog.ts`）：顶部 `let failures=0` + `assert(cond,msg)`，违例 `console.error` 计数，结尾 `failures>0 → process.exit(1)`。读 messages 用 `readFileSync`+`JSON.parse(messages/{en,zh}.json)`（与 `check-i18n-parity.ts` 同口径，**不引新依赖**，沿用 tsx）；导入 `COMPARE_ROWS` 走 `../lib/compare-data`。逐条实现 AC3 ①–⑥。
   - ⑥ cost 行口径：脚本内只断言"不与 `PRICING_SNAPSHOT` 相悖"（如金额方向/下限一致），**不重新核价**（T03 背书）；测法用注释写清口径。
2. **E2E**（AC4）：扩既有 `issue11-t10-visual` 或同级 e2e——`variant="slim"`(Home) 断言**恰 4 行** + `compare_table_expand` CTA `href` 指向 `/why#compare`；`variant="full"`(/why) 断言**全部行**；行数对 `COMPARE_ROWS.length` 动态、**不写死数字**（用源数组长度推断期望值，避免日后调行数即误报）。
3. **AC2 自证**：QA 以"临时加一行+补 i18n 键→两处渲染出现→还原"验"改数据不改组件"（参 ISSUE-15 AC9 手法），`compare-table.tsx` diff 须为空。
4. **运营文档**（AC8）：扩 `lib/compare-data.ts` 头注释——"安全更新一行"步骤（改 TS + 同步两份 messages 各 label[+Detail] + 跑 `pnpm test:compare`），并点明 **slim=前 4 行、调序会改 Home** 的约定。
5. **门禁**（AC7）：`pnpm check`（tsc/eslint/a11y/i18n）+ `build` + `lint:links` + `test:e2e` + 新 `test:compare` 全绿，既有 E2E 零退化。注意 `check` 聚合不含 `test:*`，新 `test:compare` 须在工单验收/CI 单独跑（与兄弟 `test:cost`/`test:changelog` 一致）。
6. **零视觉变更**（AC6）：本期不动 `compare-table.tsx` 渲染逻辑/样式，仅保证 issue11-t10-visual 既有断言仍过。

> **AGENTS.md 提醒**：本仓库 Next.js 为改版版本，写任何 Next 相关代码前先读 `node_modules/next/dist/docs/` 对应指南；本工单基本不碰 Next API（纯脚本+数据+E2E），风险低。

## 处理记录
- 2026-06-01 23:30:29 工单创建（feature / P2）
- 2026-06-02 10:30:05 set assignee=fullstack-engineer
- 2026-06-02 10:30:05 set priority=P2
- 2026-06-02 10:30:05 set status=triaged
- 2026-06-02 10:30:05 LANE: full
- 2026-06-02 10:30:05 EXTRA_ROLES: none
- 2026-06-02 PM 细化：补 US-1~3 + AC1–AC8 + 边界 + OQ-1；核实现状（数据已抽 `lib/compare-data.ts`、组件已纯展示，"改数据不改组件"大半就绪），焦点收口为新增 `test:compare` 契约守卫脚本 + E2E 行数/CTA 断言 + 运营文档；要点同步进 03-产品PRD §8。LANE: full / EXTRA_ROLES: none 维持。
- 2026-06-02 架构评估（tech-architect）：**契约不变结论**——`CompareRow`/`CompareCell` 类型 + 组件 props 零改动，本工单仅把隐式契约显式化为 `test:compare` 门禁，**无 schema 迁移、无 API 出入参变更**（full 道系红线②保守判定，复核为"上锁"非"修改"）。06-技术架构 §3.2 补登 `compare` 数据源行 + CompareTable 三方契约小节。OQ-1 同意 PM 判断本期不迁 JSON。开发要点（守卫脚本范式/E2E 动态行数/运营文档/门禁）已写入「架构评估」节。
- 2026-06-02 10:36:21 set status=in_progress
- 2026-06-02 开发完成（fullstack-engineer）。**契约上锁，零组件/零视觉改动**：
  - **新增 `scripts/check-compare-data.ts` + `package.json` `test:compare`（AC3 核心交付）**：以 `readFileSync`+`JSON.parse` 读 `messages/{en,zh}.json`、`import COMPARE_ROWS`/`calculateCost`/`PRICING_SNAPSHOT`，逐行断言 AC3①–⑥（label 键 en+zh 齐全非空 / Detail 键当且仅当 `hasDetail` / 无孤儿键且 en≡zh / verdict∈{good,mixed,bad,neutral}+value 非空 / id 唯一非空可作 key / cost 行 `$2k+` 下限不与快照模型相悖——`calculateCost(100GB/day,15d).datadogMonthly=$5900 ≥ $2000`）。严格照搬兄弟脚本范式（`failures`计数+违例 exit 1），**未引新依赖**。
  - **新增 E2E `tests/e2e/issue23-t22-compare-dynamic.spec.ts`（AC4）**：从源数组 `COMPARE_ROWS` 推导期望行数（**不写死数字**）——slim(Home `/`) 断言恰 `min(4,len)=4` 行 + `compare_table_expand` CTA `href` 匹配 `/why#compare$`；full(`/why`) 断言全部 `len` 行且无 slim CTA。
  - **运营文档（AC8）**：扩 `lib/compare-data.ts` 头注释——"安全更新一行"4 步（改 TS+verdict/id 约束 → 同步两份 messages 各 `<id>`[+`<id>Detail`] → 跑 `pnpm test:compare` → `lint:i18n`）+ 删行清孤儿键 + **slim=前4行/调序改 Home** 约定。
  - **AC1/AC2/AC6 零改动达成**：`components/compare-table.tsx` **本次 diff 为空**（git 核实），组件仍纯 `map(COMPARE_ROWS)`、无硬编码行数据。
- 2026-06-02 自测（全绿，已贴命令输出）：
  - `pnpm test:compare` ✓（含 mutate-and-revert 负向验证：把 `rows.cost`→`rows.costX` 触发 3 条断言失败、exit=1，还原后 exit=0，证脚本有牙；`git status messages/` 干净）。
  - `pnpm check` ✓（tsc 0 / eslint 0 / a11y **26/26 AA** / i18n parity **518=518 OK**）。
  - `pnpm build` ✓。
  - `pnpm lint:links` ✓（**0/33**，对 `next start` 跑；空跑无服务器会假阳性 18/18，须起服务器）。
  - `pnpm test:e2e` ✓（**78 passed**，含新 2 例 + issue11-t10-visual CompareTable 既有断言，零退化）。
- 2026-06-02 10:44:00 set status=in_review
- 2026-06-02 代码审查（code-reviewer）：**REVIEW: PASS，必改 0 条**。复核 `main...feature/ISSUE-23` 全部改动（守卫脚本/E2E/数据头注释/package.json；组件 diff 为空已核实）。**实跑** `pnpm test:compare` 全断言✓ + `pnpm typecheck` rc=0；静态核查 AC1（组件无硬编码行 value）；核 E2E `table tbody tr` 选择器可靠性（grep 确认 Home/why 各仅一个 `<table>`，移动端 MobileCard 用 div+md:hidden，slim=4/full=8 计数无歧义）；CTA `href` 正则与组件 `/why#compare`+`data-analytics-event` 对齐。AC1–AC8 复核通过。**可选项 1 条（不阻塞）**：脚本 AC3⑥ 注释"smallest dollar figure"实为"首个"匹配，当前单金额行为等价、断言正确，仅多金额时才偏差，建议后续顺手改注释。结论写入 08-测试报告.md「代码审查 — ISSUE-23」节。**建议放行至独立 QA（qa-automation）**做 AC2 加行自证 + AC4 E2E + 全门禁实跑。
- 2026-06-02 10:47:11 set status=verifying
- 2026-06-02 QA 验证结果（qa-automation，独立验证，分支 `feature/ISSUE-23`，生产构建 `next start -p 3210`）：**通过**。证据——
  - **AC3** `pnpm test:compare` exit 0，①–⑥ 全断言✓（cost 行 modeled $5900 ≥ floor $2000）；**负向自测**注入非法 verdict+空 value → 捕获 3 条失败、exit 1，还原后 git 干净 exit 0（守卫确有牙）。
  - **AC4** `pnpm test:e2e` #65/#66✓：slim(Home)=4 行 + CTA `href` 匹配 `/why#compare`；full(/why)=8 行（=`COMPARE_ROWS.length`，无写死）。
  - **AC2 活体自证**：临时注入第 9 行 `qaProbe`+两份 i18n 键 → `test:compare` 仍✓(9行) → 重建 → e2e 自适应：slim 仍=4、full=9（页面真随数据增长）；DOM 抽查 /why 现 qaProbe、Home 不渲染该行（Home 命中仅出现在 next-intl 消息载荷 JSON，非渲染单元格）；**`compare-table.tsx` sha 注入前后不变（58c5346…）→ 改数据不改组件**；还原后 git 干净。
  - **AC1/AC6** 组件零改动达成（sha 不变 + 静态确认纯 `map(COMPARE_ROWS)`）；全量回归 **78 passed**（含 issue11-t10 CompareTable 视觉断言，零退化）。
  - **AC5/AC7** `pnpm check` 绿（tsc/eslint/a11y **26/26 AA**/i18n **518=518**）、`pnpm build` OK、`lint:links` **0/33**（对真实服务器）、`test:e2e` 78、`test:compare` exit 0。
  - **AC8** `lib/compare-data.ts` 头注释含"安全更新一行"4 步 + slim=前4行/调序改 Home 约定。
  - 阻断缺陷 0；唯一可选项为 AC3⑥ 注释 "smallest"↔"首个" 措辞（等价、非 bug、不阻塞）。测毕服务已关、端口 3210 释放、无僵尸。报告详见 08-测试报告.md「自动化测试 — ISSUE-23」节。
- 2026-06-02 **VERDICT: PASS**
