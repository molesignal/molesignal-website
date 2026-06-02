---
id: ISSUE-20
type: feature
title: [T19] QuickStart产物就绪切换
status: closed
priority: P1
assignee: frontend-engineer
created: 2026-06-01
updated: 2026-06-02
---

## 描述
模块:QuickStart产物就绪切换 | 角色:frontend | 依赖:T04 | 里程碑:M2 | 验收:helm/binary就绪时移除v1.0target notice;lint:quickstart与父仓README同步;命令冒烟(需用户确认就绪) | 详见 07-开发任务拆分.md(T19) 与 06-技术架构.md/READINESS.md

## 需求说明
QuickStart 的 Helm / binary 安装页签当前带 T04 的 "v1.0 target" 诚实 notice（Docker 路径今日可用，Helm repo 与预编译二进制随 v1.0 发布）。本工单交付**产物就绪切换机制**：当真实 Helm repo（charts.molesignal.io）与 binary release 发布、命令冒烟可执行（需用户确认就绪）后，一处开关即可干净地移除 notice 与文件名 "(v1.0 target)" 后缀。

依据 READINESS.md（行 60/81/97 + 用户 2026-06-01 决策）：本期**不提供**真实 Helm/binary 外部产物，政策为"无则保持 T04 'v1.0 target' 诚实标注"。故默认提交态保持诚实 notice，开关默认 OFF。

## 验收标准
- AC1 Helm/binary 真实就绪时移除 "v1.0 target" notice：✅ 以 env 开关 `NEXT_PUBLIC_QUICKSTART_ARTIFACTS_READY=true` 控制（镜像 T17 `lib/community.ts` 模式）；置 true 同时移除 notice 与文件名 "(v1.0 target)" 后缀，无需改码。默认未就绪→保持诚实标注。
- AC2 `lint:quickstart` 与父仓 README 同步过：✅ `pnpm lint:quickstart` 0 失败（独立 checkout 下父 README 缺失，跨仓检查按设计 skip，仓内 5 项全过）。
- AC3 命令冒烟可执行（依赖产物，需用户确认就绪）：⏳ 阻塞于外部——真实 Helm repo/binary release 未发布，本期政策不提供。切换机制已就位，待用户确认产物就绪后翻 env 开关即可。

## 实现记录（frontend-engineer, 2026-06-02）
**改动文件：**
- `lib/artifact-readiness.ts`（新增）：`quickStartArtifactsReady()` env 门控开关。
- `components/quick-start-tabs.tsx`：notice 与文件名后缀按 `ready` 条件渲染；ready 时取 `tabFilenamesReady.*`。
- `messages/{en,zh}.json`：新增 `start.tabFilenamesReady.{helm,binary}`（就绪态干净文件名），双语 parity。
- `.env.local.example`：登记 `NEXT_PUBLIC_QUICKSTART_ARTIFACTS_READY` 用法。

**自测：**
- `pnpm typecheck` 0 报错；`pnpm lint`（eslint）0 error（5 个既有 warning 在 toc.tsx，与本改动无关）。
- `pnpm lint:i18n` EN↔ZH 516/516 parity OK；`pnpm lint:quickstart` 0/5 失败。
- `pnpm build` 两态均成功。HTML 渲染验证：默认（未就绪）`/en/start` 渲染 2 处 v1Notice 横幅 + "(v1.0 target)" 文件名；`NEXT_PUBLIC_QUICKSTART_ARTIFACTS_READY=true` 构建后 0 处横幅、文件名为干净 "terminal · Helm install / binary install"。开关翻转生效经构建产物核对。

**遗留 / 阻塞：** AC3 命令冒烟依赖外部真实 Helm repo/binary release（本期政策不提供），切换机制已就绪，待用户确认产物就绪后翻 env 开关。提交默认态为诚实 notice（开关 OFF）。

## 代码审查（code-reviewer, 2026-06-02）

**结论：通过，建议放行到 QA。必改问题 0。**

审查范围：`main...feature/ISSUE-20` 全量改动（6 文件 +78/-7）。

**正确性 ✅**
- `lib/artifact-readiness.ts:18` `quickStartArtifactsReady()` 用 `process.env.NEXT_PUBLIC_QUICKSTART_ARTIFACTS_READY?.trim() === "true"` 严格布尔门控；空/空白/任意非 "true" 值均落入诚实标注态，opt-in 语义正确，无误判风险。
- `components/quick-start-tabs.tsx:69-75,94,104` notice 用 `{!ready && ...}` 条件渲染、文件名按 `ready` 三元切换，helm/binary 两 tab 行为对称，docker tab 不受影响（符合预期，Docker 路径今日可用）。
- 切换为单点开关：`ready` 一处求值、驱动 notice + 双文件名，无散落判断，翻转干净。

**契约一致性 ✅**
- 完全镜像 T17 `lib/community.ts` 的 env 门控模式（同为 `NEXT_PUBLIC_` 前缀 + trim + 诚实兜底），团队既有约定一致。
- 新增 i18n key `start.tabFilenamesReady.{helm,binary}` EN/ZH 双语 parity（`lint:i18n` 516/516 OK）；命令体（HELM_CMD/BINARY_CMD）未改，`lint:quickstart` 0/5 失败（跨仓 README 缺失按设计 skip）。
- `.env.local.example` 已登记开关用法，与 Discord/GitHub 开关同区块风格统一。

**可维护性 / 风格 ✅**
- 注释清晰交代了 T04→T19 的来龙去脉与"为何默认 OFF"，并交叉引用 `community.ts` 模式，后人可快速理解。
- 命名、缩进、文件组织与既有代码一致，无重复/过度复杂。

**复核结论**
- typecheck 0 报错；lint:i18n 516/516；lint:quickstart 0/5 失败 —— 均与工单自测一致，复核通过。
- 设计上的"开关翻 true 后命令仍指向 charts.molesignal.io / GitHub release"非 bug：AC3 已明确该开关只应在外部产物真实就绪并冒烟通过后由用户翻转，诚实标注的护栏逻辑成立。
- 提交规范符合 Conventional Commits：`feat(ISSUE-20): QuickStart 产物就绪切换开关 (T19)`。

**建议放行到 QA 自动化验证**（验证默认态 `/en/start`、`/zh/start` 渲染 2 处 v1Notice + "(v1.0 target)" 文件名；如需可另以 `NEXT_PUBLIC_QUICKSTART_ARTIFACTS_READY=true` 构建态核对 0 横幅 + 干净文件名）。

## QA 验证结果（qa-automation, 2026-06-02）

**VERDICT: PASS**

环境：Node v23.6.1 / pnpm 11.5.0；`next dev` (Next 16.2.6, Turbopack) 两态真实启停。路由实测：EN 默认 locale 无前缀走 `/start`（`/en/start` 307→`/start`），ZH 走 `/zh/start`。

**AC1 — env 开关移除 notice 与文件名后缀（真实 HTTP 渲染核对）✅**
- 决定性证据用 V1TargetNotice 的 `lucide-construction` 图标计数（visible 渲染标记，排除内嵌 i18n message bundle 的干扰）：
  - **OFF 态（默认，未设 env）**：`/start` 与 `/zh/start` 各渲染 **2 处** Construction 通知图标（helm + binary 两 tab），文件名带 “(v1.0 target)” / “（v1.0 目标）”。docker tab 无通知（符合预期）。
  - **ON 态（`NEXT_PUBLIC_QUICKSTART_ARTIFACTS_READY=true`）**：两 locale 均 **0 处** Construction 图标、`role=note` 横幅 0；文件名变干净 “terminal · Helm install / binary install” 与 “终端 · Helm 安装 / 二进制安装”。
  - ON 态 HTML 中残留的 “(v1.0 target)” 字样经定位在转义的 next-intl messages JSON blob 内（`\"helm\":\"terminal · Helm install (v1.0 target)`），非可见 DOM，属正常（消息包始终含全部 key），不影响结论。
  - 翻转无需改码，单一 env 开关同时驱动 notice 与双文件名，EN/ZH 行为对称，docker tab 不受影响。ON 态 dev 日志无 error/exception。
- 复跑命令：
  - OFF：`PORT=5099 pnpm dev` → `curl -L localhost:5099/start`、`curl localhost:5099/zh/start`
  - ON：`NEXT_PUBLIC_QUICKSTART_ARTIFACTS_READY=true PORT=5098 pnpm dev` → 同上

**AC2 — `lint:quickstart` 与父仓 README 同步 ✅**
- `pnpm lint:quickstart` rc=0，仓内 5/5 通过、Failures 0/5；独立 checkout 下父 README 缺失，跨仓检查按设计 skip（4 项）。
- 旁证回归：`pnpm lint:i18n` EN↔ZH 516/516 parity OK；`pnpm typecheck` rc=0。

**AC3 — 命令冒烟（依赖外部真实产物）⏳ 不在本期交付范围**
- 阻塞于外部：真实 Helm repo（charts.molesignal.io）与 binary release 未发布，本期 READINESS 政策不提供。切换机制已就位且经 AC1 实测可用，待用户确认产物就绪后翻 env 开关即可。**此项为外部依赖、非本工单缺陷**，不阻断放行。

**缺陷清单：** 0（无阻断/无一般缺陷）。
**放行建议：** PASS，可合并回 main。AC3 留作上线前用户确认产物就绪后的运维动作（翻 `NEXT_PUBLIC_QUICKSTART_ARTIFACTS_READY=true`），非代码问题。
**回归套件重跑：** `pnpm lint:quickstart && pnpm lint:i18n && pnpm typecheck`，外加上面 OFF/ON 两态 dev + curl 渲染核对。
**清理：** 测试用 dev server（5098/5099）已 kill，无僵尸进程；未写入 `.env.local`（保持默认 OFF 提交态）。

## 处理记录
- 2026-06-01 23:30:28 工单创建（feature / P1）
- 2026-06-02 09:21:34 set assignee=frontend-engineer
- 2026-06-02 09:21:34 set priority=P1
- 2026-06-02 09:21:34 set status=triaged
- 2026-06-02 09:21:34 LANE: light
- 2026-06-02 09:21:34 EXTRA_ROLES: none
- 2026-06-02 09:21:50 set status=in_progress
- 2026-06-02 09:27:54 set status=in_review
- 2026-06-02 09:29:34 set status=verifying
- 2026-06-02 09:33:34 set status=closed
- 2026-06-02 09:33:34 引擎周期#21: QA PASS, 关闭
