---
id: ISSUE-20
type: feature
title: [T19] QuickStart产物就绪切换
status: in_progress
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

## 处理记录
- 2026-06-01 23:30:28 工单创建（feature / P1）
- 2026-06-02 09:21:34 set assignee=frontend-engineer
- 2026-06-02 09:21:34 set priority=P1
- 2026-06-02 09:21:34 set status=triaged
- 2026-06-02 09:21:34 LANE: light
- 2026-06-02 09:21:34 EXTRA_ROLES: none
- 2026-06-02 09:21:50 set status=in_progress
