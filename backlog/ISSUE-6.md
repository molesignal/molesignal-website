---
id: ISSUE-6
type: bug
title: [T03] 成本计算器/对比表数字校准
status: in_progress
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
