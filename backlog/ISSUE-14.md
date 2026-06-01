---
id: ISSUE-14
type: feature
title: [T13] CI门禁(GitHub Actions)
status: in_review
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

## 代码审查（code-reviewer, 2026-06-02）

**结论：通过，建议放行到 QA 验证。0 处必改，2 处建议改，1 处可选。**

逐项核对验收标准均满足：AC① 五道闸（`check`/`lint:quickstart`/`build`/`lint:links`/`test:e2e`）在 `ci.yml` 按序独立成 step，任一失败即红；AC② 红阻断由 `branch-protection.md` 文档化（workflow 无法自施加，属预期手动项）；AC③ `actions/setup-node` `cache: pnpm` 按 `pnpm-lock.yaml` keyed。提交规范符合 Conventional Commits。

正确性已实证：
- `proxy.ts` matcher 修复正确——根级 `app/opengraph-image.tsx`（无点）确被原 `.*\..*` 规则漏掉而吞进 locale 路由致 404；新增 `opengraph-image` 排除项位于负向先行断言起始锚点，仅命中以该串开头的根路径；locale 级 `app/[locale]/blog/[slug]/opengraph-image.tsx`（路径以 `blog`/`zh` 开头）不受影响。两路由文件均已确认存在。无残留 unicode。
- `check-quickstart-sync.ts` SKIP 逻辑正确：`existsSync(README_PATH)` 缺失时跳过 `filePath===README_PATH` 的跨仓项，仓内项照跑；计数 `ran=CHECKS.length-skipped`、`failed/ran` 口径自洽；尾部信息分支文案准确，仍 `process.exit(1)` on drift。无静默放水。
- `ci.yml` link-check step bash 健壮：`set +e/-e` 包裹捕获 RC、`kill -0` 探活早退、`exit $RC` 透传；GitHub 默认 `bash -eo pipefail` 下逻辑成立。`LINK_PORT=3000` 与 `check-links.ts` 默认 `SITE` 一致；E2E 自带 `:3210` server 与之无端口冲突。`lockfileVersion '9.0'` 与 pnpm 9 `--frozen-lockfile` 兼容，无 packageManager/engines 约束冲突。`concurrency` 取消、`permissions: contents:read` 最小权限、无不可信 `github.event.*` 入参——均良好。

发现项：
1. **[建议改]** `.github/workflows/ci.yml:99-112` 上传 `playwright-report/` artifact，但 `playwright.config.ts:17` reporter 仅 `[["list"]]` 且 `trace:"off"`——不会生成 `playwright-report/` 目录，`test-results/` 失败时也无 trace。该 artifact 实际恒为空（靠 `if-no-files-found: ignore` 不报错）。工单"E2E 报告作为 artifact 上传"的描述名不副实。建议：CI 下追加 `["html",{open:"never"}]` reporter（或 `--reporter=html`），否则失败时无可下载诊断物。未自动改：动 E2E 配置应经 QA 复跑确认零回归。
2. **[建议改/可选]** `.github/branch-protection.md:36-43` 的 `gh api` 示例用 `-f 'required_status_checks[strict]=true'` 传布尔值（`-f` 发字符串 "true"），GitHub API 对 `strict` 期望 boolean，该命令实际可能被拒。建议改用 `--input` 传 JSON 或 `-F` 传布尔。属手动运维文档、非代码路径，影响有限。
3. **[可选]** link-check 等待循环 60s 超时后若 server 仍存活则不报错直接续跑 `lint:links`，靠后者对未就绪 server 失败兜底；可在超时分支显式 `::error::` 提示以利排障。

未自动修复任何项：1 触及已验证的 E2E 配置（交 QA 复跑把关），2/3 为文档/可观测性优化，均非必改，不阻断放行。

## 处理记录
- 2026-06-01 23:30:28 工单创建（feature / P0）
- 2026-06-02 07:14:31 set assignee=fullstack-engineer
- 2026-06-02 07:14:31 set priority=P0
- 2026-06-02 07:14:31 set status=triaged
- 2026-06-02 07:14:31 LANE: light
- 2026-06-02 07:14:31 EXTRA_ROLES: none
- 2026-06-02 07:14:46 set status=in_progress
- 2026-06-02 07:23:17 set status=in_review
