---
id: ISSUE-6
type: bug
title: [T03] 成本计算器/对比表数字校准
status: verifying
priority: P0
assignee: fullstack-engineer
created: 2026-06-01
updated: 2026-06-02
---

## 描述
模块:成本计算器/对比表数字校准 | 角色:fullstack | 依赖:无 | 里程碑:M1 | 验收:核对cost-formula/compare-data的Datadog定价为最新公开值;标注快照日期/来源disclaimer;无NaN溢出;EN/ZH同步。核心数字红线full道 | 详见 07-开发任务拆分.md(T03) 与 06-技术架构.md/READINESS.md

## 复现步骤


## 验收标准


## 处理记录
- 2026-06-01 23:30:28 工单创建（bug / P0）
- 2026-06-02 03:48:06 set assignee=fullstack-engineer
- 2026-06-02 03:48:06 set priority=P0
- 2026-06-02 03:48:06 set status=triaged
- 2026-06-02 03:48:06 LANE: full
- 2026-06-02 03:48:06 EXTRA_ROLES: none
- 2026-06-02 03:48:23 set status=in_progress
- 2026-06-02 fullstack 实现完成（T03 成本/对比数字校准）

### 实现说明（fullstack）

**① Datadog 定价核对为最新公开值（快照 2026-06-02，源 https://www.datadoghq.com/pricing/）**
经 WebSearch + 抓取官方定价页核对：
| 项 | 官方公开值（年付 list） | 旧代码 | 新代码 |
|---|---|---|---|
| 日志 ingest | $0.10 / GB | 0.10 ✓ | 0.10（不变） |
| 日志索引(Standard,15天) | $1.70 / M events | 1.27（旧 7 天口径） | **1.70** |
| APM 索引 span(Standard,15天) | $1.70 / M spans | 1.00（过时） | **1.70** |
| Infra Pro | $15 / host/mo | 注释引用 | 注释保留 |
保留乘数基线由 7→15 天，与索引费率所含保留口径一致（`DD_INDEXED_RETENTION_DAYS=15`，≤15 天 `Math.max(1,…)` 兜底不缩水）。

**② 定价快照日期 / 来源 disclaimer（UI）**
- 新增导出 `PRICING_SNAPSHOT="2026-06-02"` 与 `PRICING_SOURCE_URL`。
- `cost-calculator.tsx` 原用 `new Date()` 渲染"截至{当前日}"——会误导成"每次访问都已重新核对"。改为渲染**固定快照月份**（按 locale 格式化）。
- disclaimer 末尾新增「来源：Datadog 公开定价」外链（target=_blank rel=noopener）。EN/ZH 文案同步（新增 `disclaimerSourcePrefix`/`disclaimerSource` 两键；索引口径 7天→15天并注明"假设全部 ingest 日志被索引=上限"）。

**③ 无 NaN / 无溢出**
- `clamp()` 对非有限输入（NaN/±Infinity，移动端 number input 清空可触发）回落下界。
- `formatUsd()` 守卫非有限值返回 `"$0"`，杜绝 `$NaN`。
- 全输入域（gb 1–5000 × ret 1–365）扫描峰值 $2.01M 有界、percent∈0..100。

**④ EN/ZH 同步**：`pnpm lint:i18n` 506↔506 parity OK。

**对比表（compare-data.ts）**：cost 行 `~$2k+/mo` 为 100GB/天典型**部分索引**下限（计算器建模的是全索引上限 ~$7.4k），两者同源同快照——加注释说明，保留为可辩护的保守下限，不改值。

### 自测结果
- `pnpm test:cost`（新增 scripts/check-cost-formula.ts）：全部断言通过（快照/来源、全域无 NaN/溢出、敌意输入净化、formatUsd 守卫、代表点 100GB/30d datadog=$7.4k vs molesignal=$150 savings=98%）。
- `pnpm typecheck` 0 error；`pnpm lint` 0 error（5 warning 均为他文件 setState-in-effect 既存项，非本工单）。
- `pnpm a11y:contrast` 26/26 AA 通过；`pnpm lint:i18n` parity OK。
- `pnpm build` ✓ Compiled successfully，35/35 静态页生成成功。
- prettier 已 format 改动文件。

### 改动文件
- `lib/cost-formula.ts`（定价校准 + 快照常量 + NaN/溢出守卫）
- `components/cost-calculator.tsx`（固定快照日期 + 来源外链）
- `lib/compare-data.ts`（cost 行基准注释）
- `messages/en.json` / `messages/zh.json`（disclaimer 文案 + 来源键，EN/ZH 同步）
- `scripts/check-cost-formula.ts`（新增 QA 验证脚本）+ `package.json`（`test:cost`）

### 阻塞项
无。（提交：feat(ISSUE-6) 9c64238）
- 2026-06-02 03:56:07 set status=in_review

### 代码审查（code-reviewer）

**结论：通过，建议放行到 QA 验证。** 必改问题 0；审查中直接修复 1 处低风险项。

审查范围：`git diff main...feature/ISSUE-6`（cost-formula.ts / cost-calculator.tsx / compare-data.ts / en.json / zh.json / scripts/check-cost-formula.ts / package.json）。

#### 正确性
- 保留乘数基线 7→15 天改动正确：`ddRetentionMult = 1 + ((ret-15)/30)*0.5`，`ret≤15` 时 <1 被 `Math.max(1,…)` 兜底为 1，不缩水；`ret=365` 时上限 6.83，全域峰值 ≈$2.0M 有界（脚本扫描 gb 1–5000 × ret 1–365 验证）。
- NaN/溢出守卫到位：`clamp()` 对非有限输入回落、`formatUsd()` 守卫 `$NaN`、`savingsPercent` `Math.max(0,…)` 且数学上恒 <100（molesignal 恒正）。代表点 100GB/30d：datadog $7.4k / molesignal $150 / savings 98%，复算一致。
- 定价校准（1.27→1.70 索引、1.0→1.70 span）与注释/disclaimer 文案口径一致；`compare-data.ts` 的 `~$2k+/mo` 加注释说明为部分索引下限、与计算器上限同源同快照——保留为可辩护保守值，合理。

#### 契约 / 可维护性
- 新增导出 `PRICING_SNAPSHOT` / `PRICING_SOURCE_URL` 被组件正确消费；无悬挂引用、无遗留 `now` 变量。
- 外链 `target="_blank" rel="noopener noreferrer"` 安全规范正确。
- EN/ZH 同步：两侧均新增 `disclaimerSourcePrefix`/`disclaimerSource` 两键且 disclaimerBody 同步更新（7天→15天 + 上限假设说明）。
- 测试脚本 `check-cost-formula.ts` 覆盖快照/来源、全域扫描、敌意输入、formatUsd 守卫、代表点，质量好。
- `.tsx` 内大量 className 顺序变动为 prettier/tailwind class 排序产生的噪音，无功能影响。

#### 直接修复（已提交 fix(ISSUE-6) 63dc615）
- **建议改 / 已修**：`cost-calculator.tsx` 快照日期渲染。`PRICING_SNAPSHOT` 注释标为 UTC，但 `Intl.DateTimeFormat` 未指定 `timeZone` 会按运行时本地时区格式化，理论上服务端/客户端跨月不一致（本值 day=02 实际安全，但语义不一致且脆弱）。已显式加 `timeZone:"UTC"`，对齐意图、消除水合漂移隐患。typecheck 0 error、test:cost 全过。

#### 可选（不阻塞，留作后续）
- `clamp()` 对 `+Infinity` 输入回落到下界 `lo`（而非上界 `hi`）——语义上略反直觉，但仅为防御性兜底（UI 输入域已受 1–5000 约束），不影响结果有界性，可不改。

放行建议：✅ 移交 qa-automation 做 UI/接口验证（重点核对 disclaimer 文案 EN/ZH 渲染、外链可点、计算器边界输入无 NaN）。
- 2026-06-02 03:59:04 set status=verifying

### QA 验证结果（qa-automation）

**VERDICT: PASS** — 验收标准全部实测通过，无阻断缺陷，无回归。

证据（被测分支 `feature/ISSUE-6`，Node v23.6.1 / Next 16.2.6 / Chromium）：
- `pnpm test:cost`：16 断言全过 —— 快照 `2026-06-02`/来源 https URL、全输入域(gb 1–5000 × ret 1–365)无 NaN/溢出（峰值 $2.01M 有界）、敌意输入(NaN/Infinity/0/负/超界)净化、`formatUsd(NaN)="$0"`、代表点 100GB/30d **datadog $7.4k / molesignal $150 / savings 98%**。
- `pnpm lint:i18n`：EN/ZH 506↔506 parity OK（含新增 `disclaimerSourcePrefix`/`disclaimerSource`）。
- `pnpm typecheck` exit 0；`pnpm build` exit 0。
- **E2E（真实 Chromium，production build，新增 `tests/e2e/issue6-cost-calculator.spec.ts`，6 用例全 PASS）**：
  - EN `/why` + ZH `/zh/why` 默认负载渲染校准代表点 $7.4k / $150 / 98%；
  - disclaimer 显示**固定快照月份**（EN "June 2026" / ZH "2026年6月"，非访问当天，UTC 格式化无水合漂移）、"15天索引"口径；来源外链可见，断言 `href=https://www.datadoghq.com/pricing/` + `target=_blank` + `rel` 含 `noopener`；
  - 滑块极值 + 数字输入清空/敌意输入(`""`/`abc`/`1e`/`-50`)后页面无 `NaN`/`$NaN`/`Infinity`。
- **全量 E2E 回归 26 passed**（含 `cost_calculator_interact` 漏斗用例），无回归。
- 自动化报告见 `08-测试报告.md` → "自动化测试 — ISSUE-6"。测试结束已清理 3000/3210 端口进程，无僵尸。
