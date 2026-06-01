---
id: ISSUE-1
type: feature
title: [T11] 可靠限流后端(Upstash)
status: in_progress
priority: P0
assignee: backend-engineer
created: 2026-06-01
updated: 2026-06-01
---

## 描述
模块:可靠限流后端(Upstash) | 角色:backend | 依赖:无 | 里程碑:M1 | 验收:rate-limit.ts改async用@upstash/ratelimit;缺env回退内存Map+warn;两route改await;阈值cloud10/h dp5/h;429带Retry-After;build/check过。红线full道 | 详见 07-开发任务拆分.md(T11) 与 06-技术架构.md/READINESS.md

## 需求说明

### 背景与问题
现有 `lib/rate-limit.ts` 用进程内 `Map` 做令牌桶限流。Vercel serverless 多实例 + 实例短生命周期下，限流状态不跨实例共享、冷启动即清空，**防刷实际失效**——这是 T01/T02 表单"真入库可触达"上线的前置安全闸门（P0-3，命中红线①反滥用 + 改接口契约 + 跨多文件，full 道）。

本工单将 `rate-limit.ts` 改造为基于 `@upstash/ratelimit` + Upstash Redis REST 的可靠跨实例限流，并保留内存 Map 作为缺 env 时的优雅降级兜底。

### 范围
- `lib/rate-limit.ts`：`rateLimit()` 由**同步改为异步**，签名 `rateLimit({ key, max, windowMs }): Promise<{ ok, remaining, resetAt }>`（`RateLimitResult` 字段不变）。
- 有 `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` → 走 `@upstash/ratelimit` 滑动窗口；否则回退现有内存 Map（同步逻辑包成 async）。
- `app/api/cloud-waitlist/route.ts`、`app/api/design-partner/route.ts`：调用处改 `await rateLimit(...)`，其余逻辑（429 响应体 + `Retry-After` 头）不动。
- 新增依赖 `@upstash/ratelimit` 与 `@upstash/redis`（REST 客户端，Edge 友好）。

### 用户故事
1. 作为**站点运营者**，我想表单接口在 serverless 多实例下仍能可靠限流，以便候补/DP 表单不被脚本刷量灌水污染名单。
2. 作为**开发者**，我想未配置 Upstash 时限流仍以内存 Map 兜底工作并打一次 warn，以便本地开发 / 无密钥环境不报错、构建不挂。
3. 作为**提交表单的真实用户**，我想限流后端偶发故障时表单不被误拦，以便基础设施抖动不影响我正常提交。

### 设计约束 / 实现要点（供后端落地，非强制实现细节）
- 阈值**保持现值**：cloud-waitlist `10/h`、design-partner `5/h`；key 格式 `{form}:{ip}`，IP 取 `getClientIp()`（已实现，`x-forwarded-for` 首段）。
- `@upstash/ratelimit` 的 `Ratelimit` 实例按 `(max, windowMs)` 组合**缓存复用**，避免每请求重建客户端；`windowMs` 映射为滑动窗口时长。
- Upstash `limit()` 返回 `{ success, remaining, reset }`，`reset` 为 epoch ms → 映射到 `resetAt`。
- `Retry-After` = `Math.max(0, Math.ceil((resetAt - now) / 1000))`，须为非负整数秒。
- **fail-open 容错**：Upstash REST 运行时异常（网络/超时）时**放行请求 + warn 日志**，绝不向用户返回 5xx（表单可用性优先于限流严格性）。
- **降级判定**：仅当两个 `UPSTASH_*` env 同时存在才启用 Upstash，否则走内存兜底；fallback warn 日志**只打一次**（模块级 / 首次触发），不逐请求刷屏。

### 明确不做（YAGNI / 边界）
- ❌ 不引入 Vercel KV（架构已锁定以 Upstash 直连为准）。
- ❌ 不引入人机校验（Turnstile / 验证码）——超本期范围。
- ❌ 不改阈值数值、不改 key 命名、不改 429 响应体结构（仅确保 `await` + `Retry-After` 正确）。
- ❌ 不做限流指标上报 / dashboard / 告警。
- ❌ 不改表单前端文案与限流提示视觉（属 T10）。

### 本期密钥政策（用户决策 2026-06-01）
本期**不提供** `UPSTASH_*` 密钥。验收以"代码就绪 + 缺 env 优雅降级路径经客观验证（mock / 本地 / 单测 / 脚本）正确"即判通过；真实跨实例限流（需 Upstash 账号）**延后**到补密钥时复验，不阻塞本期 DONE。详见 `READINESS.md` 评分口径。

## 验收标准

> AC1–AC7 为本期必过（无需真实密钥即可验证）；AC8 为延后外部复验项。

- **AC1 异步改造与接线**：`lib/rate-limit.ts` 的 `rateLimit()` 返回 `Promise<RateLimitResult>`，内部在有 `UPSTASH_*` env 时用 `@upstash/ratelimit` 滑动窗口；`cloud-waitlist` 与 `design-partner` 两个 route handler 均改为 `await rateLimit(...)`，无遗漏。
- **AC2 缺 env 优雅降级**：未设 `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` 时，限流回退内存 Map，功能与现状一致、**不抛错、不崩溃**，并输出**一次** warn 日志（非逐请求）。
- **AC3 阈值不变**：cloud-waitlist `10/h`、design-partner `5/h` 保持；key 仍为 `{form}:{ip}`。
- **AC4 限流响应正确**：超阈值返回 `429`，响应头含 `Retry-After`，其值为**非负整数秒**；429 响应体结构与现状一致。
- **AC5 可复现测试**：提供脚本或单测，在内存兜底路径下连续请求 → 第 (max+1) 次返回 `429` 且带 `Retry-After` 头；阈值内请求返回 200 且 `remaining` 递减。QA 可本地无密钥复现。
- **AC6 fail-open 容错**：模拟 Upstash 客户端调用抛错时，请求被**放行**（不返回 5xx）并打 warn；表单提交不受限流后端故障影响。
- **AC7 构建门禁**：`pnpm check`（tsc --noEmit + lint）与 `pnpm build` 均通过；新增依赖已写入 `package.json`/lockfile。
- **AC8（延后/外部）真实跨实例限流**：提供 `UPSTASH_*` 真实密钥后，多实例/重复请求经 Upstash 共享计数正确触发 429——本期不验，补密钥后复验。

## 处理记录
- 2026-06-01 23:30:28 工单创建（feature / P0）
- 2026-06-01 23:42:39 set assignee=backend-engineer
- 2026-06-01 23:42:39 set priority=P0
- 2026-06-01 23:42:39 set status=triaged
- 2026-06-01 23:42:39 LANE: full
- 2026-06-01 23:42:39 EXTRA_ROLES: security-auditor
- 2026-06-01 23:42:39 分诊: 责任模块=后端限流(lib/rate-limit.ts + app/api/cloud-waitlist + app/api/design-partner)。命中红线①反滥用/安全 + 改接口契约(route handler 改 async,429+Retry-After)+ 跨多文件 → 判 full。优先级 P0(M1 前置,阻断 T01/T02 表单入库)。
- 2026-06-01 23:45:24 PM细化(full道): 补需求说明+用户故事3条+边界(不做清单)+AC1-AC8(本期AC1-7无密钥可验/AC8延后真实跨实例); 要点同步03-产品PRD.md §8迭代记录, 开放问题#3标记已决策
- 2026-06-02 架构评估(full道·tech-architect):

  **契约影响**: 命中红线②(改接口契约)。`rateLimit()` 由 **sync→async**(`Promise<RateLimitResult>`)，`RateLimitResult`(`ok/remaining/resetAt`)**形状不变** → 429 响应体/前端消费逻辑零影响，影响面收敛在 `lib/rate-limit.ts` + 两个 route handler(加 `await`)三文件。**无数据模型变更、无迁移**。06-技术架构 §4.3 已补契约级行为约定(签名/降级判定/fail-open/实例缓存/运行时)，作为落地基准；07 T11 验收不变。

  **依赖现状**: `package.json` 当前**未含** `@upstash/ratelimit`/`@upstash/redis` → 需 `pnpm add`。仓库无测试框架(`check`=typecheck+lint+a11y+i18n)，AC5 验证用 **tsx 脚本**承接(与现有 `scripts/*.ts` + tsx 约定一致)，HTTP 层 429 由 T12 Playwright 兜。

  **实现要点(供 backend 落地)**:
  1. `pnpm add @upstash/ratelimit @upstash/redis`(REST 客户端，Node/Edge 通用，两 route 保持 Node 默认运行时，**不加** `export const runtime`)。
  2. 重构 `lib/rate-limit.ts`：
     - `export async function rateLimit(...): Promise<RateLimitResult>`；`RateLimitResult`/`getClientIp` **不动**。
     - 模块级 `Redis` 单例：仅当 `UPSTASH_REDIS_REST_URL` && `UPSTASH_REDIS_REST_TOKEN` **同时存在**才 `Redis.fromEnv()`/手动构造；**env 缺失绝不在 import 期实例化**(防抛错)。
     - `Ratelimit` 实例按 `(max,windowMs)` 缓存：`Map<string,Ratelimit>` 键 `` `${max}:${windowMs}` ``，`limiter: Ratelimit.slidingWindow(max, `${windowMs} ms`)`，避免每请求重建。
     - Upstash 路径：`const { success, remaining, reset } = await rl.limit(key)` → `{ ok:success, remaining, resetAt:reset }`(reset 为 epoch ms 直映 resetAt)。
     - **fail-open**：`rl.limit()` try/catch，异常→ `return { ok:true, remaining:max-1, resetAt:now+windowMs }` + `console.warn`(AC6)。
     - **内存兜底**：现有同步逻辑抽成 `memoryRateLimit(...)` 原样返回同 shape，async 包裹；**模块级 boolean flag 保证 fallback warn 只打一次**(AC2，非逐请求)。
  3. 两 route handler：`const rl = await rateLimit({...})`(cloud 10/h key `cloud-waitlist:{ip}`、dp 5/h key `design-partner:{ip}`，阈值/key 不变)。
  4. **修正 Retry-After**(当前两 route 缺非负保护)：`String(Math.max(0, Math.ceil((rl.resetAt - Date.now())/1000)))`(AC4)。
  5. 新增 `scripts/check-rate-limit.ts`(tsx) + `package.json` 加 `"test:rate-limit"`：无 env 内存路径下断言 max 次内 200 且 remaining 递减、第 (max+1) 次 `ok:false`；可附 mock 抛错验证 fail-open 放行(AC5/AC6)。
  6. `.env.local.example` 已含 `UPSTASH_*` 占位符(无需新增)。

  **并行性**: T11 是 T01/T02 前置(route 改 async)，本工单内部不可再拆(单文件核心逻辑)，与组B(T05)/组C(T04/T06/T03/T07)/组D(T08)完全独立，可同时开工。
  **阻塞项**: 无。本期不提供 `UPSTASH_*` 密钥(用户决策)，AC1-7 走内存兜底路径客观验证即可判过，AC8(真实跨实例)延后补密钥复验，不阻塞 DONE。

- 2026-06-02 安全审计(full道·security-auditor): 产出 `09-安全审计.md`(高1/中1/低5)。
  **必修(强烈建议纳入本工单)**:
  ① **H1(高)** `getClientIp` 取 `x-forwarded-for` 最左段→**客户端可伪造绕过限流**(CWE-290/307)，架空本工单"可靠防刷"目标。改为优先 `x-real-ip`/XFF 末段(Vercel 边缘注入、不可伪造)。改动极小，否则须主管/PM 显式接受残留风险。
  ② **M1(中)** 内存兜底 `STORE` Map 无上限/清扫，配合 H1 构成内存耗尽 DoS；本期内存兜底=默认生产路径，建议加容量上限+惰性清扫。
  ③ **L1(低,AC4已含)** 两 route 的 `Retry-After` 均缺非负保护，落地两处都要 `Math.max(0,…)`。
  ④ **流程** `@upstash/*` 安装后重跑 `pnpm audit --prod`，无 high/critical 方 DONE(并入 AC7)。
  **转后续**: L2 IP/email 进日志邮件(隐私政策P0-6覆盖)、L3 Upstash token 卫生(禁 `NEXT_PUBLIC_`/不日志/import期不实例化)、L4 postcss<8.5.10 中危(override)、L5 缺 CSP/HSTS。
  **配置检查**: `.env*` 已 gitignore ✅、example 仅占位符 ✅、无硬编码密钥 ✅。
  **放行**: 有条件放行(站点无鉴权/支付/敏感数据,无 critical);强烈建议本工单顺手修 H1+M1。**落地后须复审**(fail-open/降级判定/取信源)。
- 2026-06-01 23:52:31 set status=in_progress
- 2026-06-02 后端实现完成(backend-engineer):

  **改动文件**:
  1. `lib/rate-limit.ts` — 核心重构。`rateLimit()` sync→async(`Promise<RateLimitResult>`，形状不变)；模块级读 `UPSTASH_*` env，仅当两者同时存在才构造 `Redis`(import 期不实例化，防抛错)；`Ratelimit` 按 `(max,windowMs)` 缓存(`limiterCache`)，`slidingWindow(max, "${windowMs} ms")`；Upstash 路径 `reset`(epoch ms)直映 `resetAt`；`limit()` try/catch **fail-open**(返回 ok:true + warn)；缺 env 走 `memoryRateLimit()` 内存兜底 + **模块级 flag 保证 fallback warn 只打一次**。
     - 顺手修 **H1**(安全审计高危)：`getClientIp` 改为优先 `x-real-ip`、其次 XFF **末段**(Vercel 边缘注入、不可伪造)，杜绝客户端伪造 XFF 首段绕过限流(CWE-290/307)。
     - 顺手修 **M1**(中危)：内存兜底 `STORE` 加 `STORE_MAX_KEYS=10000` 上限 + 惰性清扫(`evictIfNeeded`，先删过期再按 resetAt 淘汰)，防伪造 IP 洪泛致内存耗尽 DoS。
     - 加 `retry: { retries: 1 }`：Upstash 故障时快速失败(不让默认 5 次指数退避把表单提交挂住数秒)再 fail-open。
  2. `app/api/cloud-waitlist/route.ts` — `await rateLimit(...)`；`Retry-After` 加 `Math.max(0, …)` 非负保护(L1/AC4)。阈值 10/h、key `cloud-waitlist:{ip}` 不变。
  3. `app/api/design-partner/route.ts` — 同上，阈值 5/h、key `design-partner:{ip}` 不变。
  4. `scripts/check-rate-limit.ts`(新增) + `package.json` `test:rate-limit` — tsx 脚本：内存兜底路径断言 max 次内全 ok 且 remaining 严格递减至 0、第 (max+1) 次 429、Retry-After 非负整数；子进程注入 bogus `UPSTASH_*` 验证 fail-open 放行(AC5/AC6)。
  5. `package.json`/`pnpm-lock.yaml` — 新增 `@upstash/ratelimit@2.0.8` + `@upstash/redis@1.38.0`。

  **自测结果(本期 AC1-AC7 全过)**:
  - `pnpm test:rate-limit` ✅ 全部断言通过(两表单内存兜底限流正确 + fail-open 放行)。
  - `pnpm typecheck` ✅ 0 报错；`pnpm lint` ✅ 0 error(5 warning 均在既有文件 toc.tsx 等，非本次改动)；`pnpm check` ✅ exit 0；`pnpm build` ✅ 两 route 正确 `ƒ`(Node serverless 默认运行时)。
  - `pnpm audit --prod`：仅 1 moderate(postcss<8.5.10，既有 L4，经 next/next-intl 传递，**非本次新增**)，无 high/critical；新增 `@upstash/*` 引入 0 漏洞 → AC7 满足。
  - **AC8(真实跨实例)** 本期未验(用户决策不提供 `UPSTASH_*` 密钥)，待补密钥后复验，不阻塞 DONE。

  **阻塞项**: 无。
  **环境变量(列给运维)**: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`(两者同时配齐才启用 Upstash，否则内存兜底；`.env.local.example` 已含占位符)。
  **需安全复审**(security-auditor 落地后复审项)：fail-open 分支、降级判定、`getClientIp` 取信源(H1 已按建议改 x-real-ip/XFF 末段)。
