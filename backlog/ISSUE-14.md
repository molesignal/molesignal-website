---
id: ISSUE-14
type: feature
title: [T13] CI门禁(GitHub Actions)
status: in_progress
priority: P0
assignee: fullstack-engineer
created: 2026-06-01
updated: 2026-06-02
---

## 描述
模块:CI门禁(GitHub Actions) | 角色:devops | 依赖:T12 | 里程碑:M1 | 验收:.github/workflows/ci.yml跑check+build+lint:links+lint:quickstart+E2E;PR红阻断;缓存pnpm store | 详见 07-开发任务拆分.md(T13) 与 06-技术架构.md/READINESS.md

## 需求说明


## 验收标准
- ① `.github/workflows/ci.yml` 在 PR/push 跑 `pnpm check`+`lint:quickstart`+`build`+`lint:links`+`test:e2e`
- ② PR 红阻断合并（required status check `quality-gate`，配置见 `.github/branch-protection.md`）
- ③ 缓存 pnpm store（`actions/setup-node` `cache: pnpm`，按 `pnpm-lock.yaml` keyed）

## 实现与自测（fullstack-engineer, 2026-06-02）

### 改动文件
- `.github/workflows/ci.yml`（新增）：单 job `quality-gate`（ubuntu-latest, Node 20, pnpm 9, 20min 超时）。
  顺序跑 5 道闸：`pnpm check` → `lint:quickstart` → `build` → 起 `next start -p 3000` 等就绪后 `lint:links` →
  装 chromium 后 `test:e2e`；`concurrency` 取消同 ref 旧跑；`cache: pnpm` 缓存 store；E2E 报告作为 artifact 上传。
  未使用任何不可信 `github.event.*` 入参，无注入面。
- `.github/branch-protection.md`（新增）：文档化"PR 红阻断合并"的仓库分支保护配置（required check = `quality-gate`）+ CLI 等价命令。
- `scripts/check-quickstart-sync.ts`（改）：**根因修复**。该脚本读父仓 `../README.md`，独立仓/CI 下该文件不存在 → 原会硬 FAIL 退 1，导致 CI 永久红。
  改为父 README 缺失时**诚实 SKIP** 跨仓检查（打印跳过明细），仓内 website 检查照常强制；监控器 5/5 仓内项过。
- `proxy.ts`（改）：**根因修复** 预存 `/opengraph-image` 404（READINESS「无死链门禁」卡点）。
  next-intl 中间件 matcher `/((?!api|_next|_vercel|.*\.​.*).*)` 漏掉**无点**的根级元数据路由 `/opengraph-image`（sitemap.xml/robots.txt 因带点被排除），
  被吞进 locale 路由 → 404。matcher 加 `opengraph-image` 排除项；locale 级 `/[locale]/blog/[slug]/opengraph-image` 不受影响（不以该串开头）。

### 自测结果（本地真实跑通，node v23/pnpm 11，CI 用 Node20/pnpm9 同 lockfile 9.0 兼容）
- `pnpm check`：exit 0（tsc 0 / eslint 0 / a11y 26-26 / i18n 511=511）
- `pnpm lint:quickstart`：exit 0（仓内 5/5 过，跨仓 4 项诚实跳过）
- `pnpm build`：exit 0；构建产出含 `ƒ /opengraph-image`
- `pnpm lint:links`：**0/33 失败**（修复后 `/opengraph-image` → 200 image/png；此前 1/33）
- `pnpm test:e2e`：**66 passed**（中间件改动零回归）

### 阻塞/备注
- ② 分支保护需仓库 admin 在 GitHub 设置里勾选 required check（workflow 文件本身无法自施加），步骤见 branch-protection.md。
- `/opengraph-image` 修复连带让 READINESS「无死链门禁」可转绿（待 QA 复验后由 orchestrator 勾选）。
- CI 不需任何外部密钥；缺 env 时 app 优雅降级，build/E2E 均不依赖真实外部服务。

## 处理记录
- 2026-06-01 23:30:28 工单创建（feature / P0）
- 2026-06-02 07:14:31 set assignee=fullstack-engineer
- 2026-06-02 07:14:31 set priority=P0
- 2026-06-02 07:14:31 set status=triaged
- 2026-06-02 07:14:31 LANE: light
- 2026-06-02 07:14:31 EXTRA_ROLES: none
- 2026-06-02 07:14:46 set status=in_progress
