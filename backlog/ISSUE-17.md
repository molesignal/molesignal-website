---
id: ISSUE-17
type: feature
title: [T16] 贡献者墙真实数据验证
status: closed
priority: P1
assignee: backend-engineer
created: 2026-06-01
updated: 2026-06-02
---

## 描述
模块:贡献者墙真实数据验证 | 角色:backend | 依赖:T07 | 里程碑:M2 | 验收:公开+token真拉contributors;私有/失败回退空态不报错;头像/链接正确。动数据源full道 | 详见 07-开发任务拆分.md(T16) 与 06-技术架构.md/READINESS.md

## 需求说明

### 承接与背景
- **承接 PRD**：§4.2 P1-3「贡献者墙真实数据(#4)」（D5 社区与集成证明）+ §3「开放与可信 / Proof over promise」——站点用真实贡献者头像证明社区活跃，不画饼、不伪造。
- **承接架构**：`06 §3.3` GitHub 数据 provider 接口——`lib/github.ts` 的 `getContributors()` 已是良好兜底接口，**本期封装稳定、不改签名**（`getContributors(limit?): Promise<Contributor[]>`，`[] = 兜底空态`）。
- **前置 T07（ISSUE-7 closed）**：`getRepoStats`/`getContributors`/`getReleases` 三兜底态已由 `scripts/check-github-fallback.ts`（`pnpm test:github` 22/22）客观验证不伪造数字。本工单**聚焦贡献者墙这一条**，重点补 T07 未单独验证的「真实数据渲染路径」与「头像/链接正确性 + 可访问性」。

### 现状（已核实）
- `lib/github.ts` `getContributors(limit=30)`：拉 `/repos/molesignal/molesignal/contributors?per_page=limit`，可选 `GITHUB_TOKEN` 抬限额；`!res.ok` 或异常 → 返回 `[]`；已 `filter(type === "User")` 滤掉 bot，映射出 `{login, avatar_url, html_url, contributions}`。
- `components/contributor-wall.tsx`（server component）：`limit` compact=12 / default=30；`length === 0` → 渲染双语空态 "Be the first contributor —" + "open an issue or PR" 链接；否则渲染头像网格，每个头像是 `<a href={html_url}>` 包 `<img src={avatar_url} alt="" title="{login} · N contributions">`。
- 使用点：首页 `app/[locale]/page.tsx:163`（`size="compact"`），文案在 `messages/{en,zh}.json` `components.contributorWall`。

### 本期缺口（待开发/修复）
1. **真实数据渲染路径未被独立验证**：T07 主要验兜底态；本工单需用 **mock/fixture**（注入一组贡献者样本，含 bot 混入）客观验证：头像 `src=avatar_url` 正确渲染、链接 `href=html_url` 正确指向、bot（`type !== "User"`）被滤除、`title` 含 login 与贡献数。
2. **a11y 缺口（本期应修）**：当前头像链接 `<img alt="">` + 链接无文本 → 该链接**无可访问名**（`title` 非可靠可访问名）。需补可访问名（如 `aria-label="{login} 的 GitHub 主页"` 或 visually-hidden 文本），令屏幕阅读器可朗读每个贡献者。
3. **兜底/失败稳健性回归**：私有仓 404 / 限流 403 / 网络异常 / 空数组 → 均渲染空态、不抛错、不出现破图占位、不伪造数字（沿用 T07 标准，本工单回归确认贡献者墙这一条不退化）。

### 不做（明确排除，YAGNI）
- 不引入 `next/image` 远端域名配置（注释已说明 pre-1.0 用原生 `<img>` 可接受，留 M5）。
- 不改 `getContributors` 签名 / 不动 revalidate 策略 / 不新增 API route（架构 §3.3 锁定）。
- 不做真实 GitHub token 联调（本期不提供密钥，按就绪政策以 mock/脚本验证即判 `[x]`，真实联调延后补密钥复验）。
- 不改 `shadow-glow-indigo` 类名——经核 `globals.css:461-465` 已将其桥接到 brand-teal 值且全站一致使用，非死 token（非阻塞观察项，不在本工单范围）。

## 验收标准

> 红线判定：命中红线②（动数据源）→ **full 道**（开发→代码审查→独立 QA），已置 `LANE: full`。本期无 `GITHUB_TOKEN`，真实数据态以注入 fixture/mock 客观验证（脚本或 E2E），缺 env 真实联调延后复验。

- **AC1 真实数据渲染**：给定一组贡献者 fixture（≥2 个真实 User），贡献者墙渲染出对应数量头像，每个 `<img>` 的 `src` 等于该贡献者 `avatar_url`、外层 `<a>` 的 `href` 等于该贡献者 `html_url`（`target="_blank" rel="noreferrer"`）。
- **AC2 头像/链接顺序与上限**：渲染顺序与 `getContributors` 返回顺序一致（GitHub 默认按贡献数降序）；compact 上限 12、default 上限 30 生效，不超额渲染。
- **AC3 bot 过滤**：fixture 中混入 `type !== "User"`（如 `github[bot]`、`Organization`）的条目时，这些条目**不出现**在墙上（`getContributors` 已滤，验证渲染层不绕过）。
- **AC4 标识可读**：每个头像链接的 `title` 含 `{login}` 与贡献数；**且具备可访问名**（`aria-label` 或 visually-hidden 文本含 login），屏幕阅读器逐个可朗读——补齐 a11y 缺口。
- **AC5 空态兜底**：`getContributors()` 返回 `[]` 时渲染双语空态文案（EN "Be the first contributor — open an issue or PR" / ZH "成为第一个贡献者 —— 开 issue 或 PR"），含指向仓库的真实链接，**无破图、无假头像、无伪造数字**。
- **AC6 失败优雅降级**：模拟 API `!ok`（403 限流 / 404 私有仓）与网络异常（throw）时，`getContributors()` 返回 `[]`、页面不抛错不 500、降级为 AC5 空态；现有 `pnpm test:github` 相关断言保持全绿。
- **AC7 真实切换零改码**：仓库公开 + 配 `GITHUB_TOKEN` 后，**无需改任何代码**即从空态/兜底切到真实头像（验证手段：注入 fixture 等价真实响应即生效；真实 token 联调延后复验并在 READINESS 标注）。
- **AC8 不回归 + 质量门**：`pnpm check`（tsc/eslint/a11y:contrast/i18n parity）+ `build` + `lint:links` + `test:e2e` 全绿；首页贡献者墙在明暗双主题、EN/ZH 双语下视觉与既有一致无退化。

## 架构评估（tech-architect, 2026-06-02）

> 结论：**契约/数据模型零变更**，无需改 `06-技术架构.md`、无迁移。本工单是「真实数据渲染路径的客观验证 + 一处 a11y 补缺」，非动态数据源改造（虽红线②触发 full 道流程，但实际不动 `getContributors` 签名 / 不动 revalidate / 不新增 route——与 06 §3.3「封装稳定、不改签名」一致）。

### 影响面判定
- **数据模型**：不变。`Contributor` 类型、`getContributors(limit?)` 签名、bot 过滤（`type === "User"`）全部沿用，06 §3.3 锁定不动。
- **接口契约**：不变。无新 API route、无入出参变更、无 env 新增。`GITHUB_TOKEN` 仍为可选。
- **唯一生产代码改动**：`components/contributor-wall.tsx` 头像链接补可访问名（AC4 的 a11y 缺口），局部、单组件、无下游波及。
- 故 06/07 **不更新**；本节即开发依据。

### 实现方案（开发要点）

**1) 可测性重构（为 AC1–AC4 的 fixture 验证铺路）——核心决策**
`ContributorWall` 是直接 `await getContributors()` 的 server component，浏览器端 `page.route()` **拦不到服务端 fetch**，E2E 无法注入 fixture 验证真实渲染路径。本仓也无 jsdom/RTL/vitest。因此按本仓既有「纯逻辑进 `scripts/check-*.ts`」约定（参考 `check-cost-formula`/`check-rate-limit`/`check-github-fallback`）落地：
- 抽一个**纯函数** `buildContributorWallItems(contributors, size)`（建议放 `lib/contributor-wall.ts` 或组件同文件 export），返回可序列化 view-model 数组：`{ login, href, src, title, ariaLabel }`，内部承载 **limit 截断（compact=12/default=30）** 与字段映射（`href=html_url`、`src=avatar_url`、`title` 含 login+贡献数、`ariaLabel` 含 login）。
- `ContributorWall` 改为：`getContributors` → `buildContributorWallItems` → `.map` 渲染。**props `{size, className}` 不变，4 处消费方零改动**（首页 `page.tsx:163`、design-partner 等），无契约外溢。
- 这样 AC1/AC2/AC4 的"映射/顺序/上限/可访问名"在纯函数层即可被脚本客观断言，不依赖 DOM 渲染器。

**2) a11y 补缺（AC4）**
头像链接当前 `<a title=...><img alt=""></a>` 无可靠可访问名（`title` 仅为 accname 兜底，AT 朗读不稳定）。在 `<a>` 上补 `aria-label`（如 EN `"{login}'s GitHub profile"` / ZH `"{login} 的 GitHub 主页"`，**走 i18n 文案**，在 `messages/{en,zh}.json` `components.contributorWall` 新增一条带 `{login}` 插值的 key，保持 i18n parity 过 `lint:i18n`）。`alt=""` 保持（链接已具名，图标装饰性，避免双重朗读）。

**3) 新增验证脚本**
`scripts/check-contributor-wall.ts` + `package.json` 加 `"test:contributor-wall": "tsx scripts/check-contributor-wall.ts"`，断言：
- AC1：给 ≥2 User fixture，`items[i].src===avatar_url`、`href===html_url`；
- AC2：顺序与输入一致；compact 截到 12、default 截到 30、不超额；
- AC3：可复用 `check-github-fallback` 的 bot 过滤断言（已绿，回归确认渲染层不绕过 `getContributors` 的过滤）；
- AC4：每个 item 的 `title` 含 login 与贡献数、`ariaLabel` 含 login；
- AC5：空数组 → 走空态分支（脚本断言 `buildContributorWallItems([], ...) === []`，UI 空态文案已存在）。
> AC5/AC6 兜底/失败稳健性主要由既有 `pnpm test:github`（getContributors `[]` 路径）继续守门，本工单回归确认不退化。AC7 零改码切换 = fixture 等价真实响应即生效（已由 test:github 第 3 段证明），真实 token 联调延后复验并在 READINESS 标注。

**4) 质量门（AC8）**：`pnpm check`（tsc/eslint/a11y/i18n parity）+ `build` + `lint:links` + `test:e2e` + 新增 `test:contributor-wall` 全绿；首页贡献者墙明暗双主题、EN/ZH 视觉无退化（沿用既有 `shadow-glow-indigo`，已桥接 brand-teal，不动）。

**不做**：不引 next/image 远端域名配置；不引 jsdom/RTL（用纯函数脚本即可）；不改 `getContributors` 签名 / revalidate / 不新增 route。

## 处理记录
- 2026-06-01 23:30:28 工单创建（feature / P1）
- 2026-06-02 08:22:57 set assignee=backend-engineer
- 2026-06-02 08:22:57 set priority=P1
- 2026-06-02 08:22:57 set status=triaged
- 2026-06-02 08:22:57 LANE: full
- 2026-06-02 08:22:57 EXTRA_ROLES: none
- 2026-06-02 PM 细化：补全需求说明（承接/现状/3 项缺口/不做清单）与 AC1–AC8（真实数据渲染·bot 过滤·a11y 可访问名·空态/失败兜底·零改码切换·质量门）。要点同步至 03-产品PRD.md §8。关键判定：a11y 头像链接无可访问名为本期应修缺口；`shadow-glow-indigo` 经核已桥接 brand-teal 非死 token，排除出范围。
- 2026-06-02 架构评估（tech-architect）：契约/数据模型**零变更**，06/07 不更新、无迁移。给出实现方案——抽纯函数 `buildContributorWallItems` 使渲染路径可被脚本客观验证（server component fetch 无法被 E2E 拦截）+ 头像链接补 i18n `aria-label` + 新增 `scripts/check-contributor-wall.ts`(`pnpm test:contributor-wall`)。详见上「架构评估」节，作为 backend 开发依据。
- 2026-06-02 08:27:48 set status=in_progress
- 2026-06-02 backend 开发完成（commit 49f7318，按架构方案实现，契约零变更）：

  **改动文件（6）**
  - `lib/contributor-wall.ts`（新增）：纯函数 `buildContributorWallItems(contributors, size, formatAriaLabel?)` → 返回可序列化 view-model `{login, href, src, title, ariaLabel}`，承载字段映射（`href=html_url`/`src=avatar_url`/`title` 含 login+贡献数/`ariaLabel` 含 login）与 per-size 上限（`CONTRIBUTOR_WALL_LIMIT` compact=12/default=30，`.slice` 双重防超额）。`formatAriaLabel` 注入式，组件传 i18n、脚本用默认/自定义。
  - `components/contributor-wall.tsx`（改）：`getContributors → buildContributorWallItems → .map` 渲染；头像链接补 `aria-label={item.ariaLabel}`（走 i18n `t("avatarLabel",{login})`），`alt=""` 保持（链接已具名，避免双重朗读）。**props `{size,className}` 不变，4 处消费方零改动**。
  - `messages/en.json` / `messages/zh.json`（改）：`components.contributorWall` 新增 `avatarLabel`（EN `"{login}'s GitHub profile"` / ZH `"{login} 的 GitHub 主页"`，带 `{login}` 插值，i18n parity 保持）。
  - `scripts/check-contributor-wall.ts`（新增）+ `package.json` 加 `test:contributor-wall`：断言 AC1（src/href 映射）·AC2（顺序+compact12/default30 上限不超额）·AC3（fixture 混入 Bot+Organization，经 `getContributors`→view 端到端被滤除）·AC4（title 含 login+贡献数、ariaLabel 含 login、注入式 i18n 生效）·AC5（空数组→`[]` 空态分支）。
  - 不动 `getContributors` 签名 / `revalidate` / 不新增 route；06/07 不更新。

  **AC 逐条验收**
  - AC1 ✅ `src===avatar_url`、`href===html_url`（脚本断言通过；`target=_blank rel=noreferrer` 组件保持）
  - AC2 ✅ 顺序与输入一致；compact 截 12、default 截 30、40 输入不超额
  - AC3 ✅ Bot/Organization 不出现在墙上（渲染层不绕过 `getContributors` 的 `type==="User"` 过滤）
  - AC4 ✅ title 含 login+贡献数；**补齐 a11y 可访问名** `aria-label`（i18n 双语），屏幕阅读器逐个可朗读
  - AC5 ✅ `[]`→空态分支，UI 双语空态文案+真实仓库链接已存在，无破图/假头像/伪造数字
  - AC6 ✅ `pnpm test:github` 回归全绿（403/404/throw→`[]`→空态，不退化）
  - AC7 ✅ 零改码切换：fixture 等价真实 200 响应即生效（脚本 AC1/AC3 + test:github 第 3 段证明）；**真实 `GITHUB_TOKEN` 联调本期无密钥，延后复验**（READINESS 应标注）
  - AC8 ✅ 质量门全绿（见下）

  **自测结果（全绿）**
  - `test:contributor-wall`：13/13 assertion 通过
  - `test:github`（回归）：全绿
  - `typecheck`：0 错；`lint`：0 error（仅 toc.tsx 既有 5 warning，与本工单无关）
  - `a11y:contrast`：26/26 通过；`lint:i18n`：EN/ZH 512=512 parity OK
  - `build`：成功；`lint:links`：0/33 失败（起 prod server 后复验）；`test:e2e`：69 passed
  - 注：`lint:links`/`test:e2e` 需先起 server，已起 `pnpm start` 后复验通过。

  **阻塞项**：无。唯一遗留为 AC7 真实 token 联调（按工单「不做」与就绪政策延后，需运维补 `GITHUB_TOKEN` 后复验并在 READINESS 标注），非本工单阻塞。
- 2026-06-02 08:34:26 set status=in_review
- 2026-06-02 代码审查（code-reviewer）：**通过，建议放行 QA。必改 0 / 已直接修 0 / 建议改 0 / 可选 2**。详见 08-测试报告.md「代码审查 — ISSUE-17」。
  - **实证复跑（非采信自述）**：`tsc --noEmit` 0 错；`test:contributor-wall` 13/13 全绿；`test:github` 回归全绿；`lint:i18n` EN 512=ZH 512 parity OK。E2E/build 属 QA 环未本环节重跑。
  - **契约/正确性**：`getContributors` 签名/`Contributor` 类型/bot 过滤/revalidate 全未动，零契约变更（合 06 §3.3）；props `{size,className}` 不变，唯一运行时消费方 `app/[locale]/page.tsx:163` 零改动。纯函数字段映射正确，`.slice` 二次封顶构成纵深防御。AC3 经真实 `getContributors`+mock fetch 端到端验证 Bot/Organization 不达墙面。AC4 a11y `aria-label`（i18n）+`alt=""` 为 WAI-ARIA 标准做法，处置得当。
  - **发现项（均可选，非阻断）**：① `title` 中 "contributions" 硬编码英文（既有行为、非回归，可访问名已由 i18n aria-label 承载）；② 组件 `Size` 与 lib `ContributorWallSize` 同义重复，可 import 消重。另核 EN avatarLabel 的 ICU 撇号 `'s` 按字面量正常渲染，非缺陷。
  - **未产生修复提交**（0 必改/0 建议改）。提交规范合 Conventional Commits。
  - **遗留**：AC7 真实 `GITHUB_TOKEN` 联调延后复验（按工单「不做」与就绪政策，需运维补密钥后在 READINESS 标注），非本工单阻塞。
- 2026-06-02 08:37:32 set status=verifying
- 2026-06-02 QA 独立验证（qa-automation，真实执行非采信自述）：**VERDICT: PASS**

  **执行环境**：node v23.6.1 / pnpm（nvm）；prod build + `next start -p 3100`（health /en→200，已起后台、测完 kill，端口 3100/3210 复查无僵尸）。

  **AC 逐条独立复跑证据**
  - AC1/AC2/AC3/AC4/AC5（渲染路径）✅ `pnpm test:contributor-wall` **12/12 全绿**（src===avatar_url、href===html_url；顺序保序；compact 截 12 / default 截 30、40 输入不超额；Bot+Organization 经真实 `getContributors`→view 端到端被滤、仅 alice 上墙；title 含 login+128、ariaLabel 注入式 i18n「alice 的 GitHub 主页」含 login；`[]`→空态分支）。server component fetch 无法被 E2E 拦截，纯函数脚本是客观验证渲染路径的正解。
  - AC4 a11y 组件落地 ✅ 复核 `components/contributor-wall.tsx:66` 头像链接 `aria-label={item.ariaLabel}`（走 `t("avatarLabel",{login})`）+ `alt=""`，WAI-ARIA 标准做法。
  - AC5 空态 ✅ **实时验证**：prod 首页（无 `GITHUB_TOKEN`，构建期未授权拉取→`[]`）EN 渲染 "Be the first contributor — open an issue or PR"、ZH 渲染 "成为第一个贡献者 —— 开 issue 或 PR"，均含真实 `github.com/molesignal/molesignal` 链接；**无 populated ul、无 avatars 域名、无破图、无伪造数字**（curl 抓 146KB 真实 HTML 核验）。
  - AC6 失败降级 ✅ `pnpm test:github` 回归 **22/22 全绿**（throw / 403 / 404 → `[]`→空态，不退化）。
  - AC7 零改码切换 ✅ 脚本 fixture 等价真实 200 响应即生效（AC1/AC3）+ test:github 第 3 段「200 OK→真实数据」证明；真实 `GITHUB_TOKEN` 联调按工单「不做」延后（需运维补密钥后在 READINESS 标注），非阻塞。
  - AC8 质量门 ✅ `pnpm check` 全绿（typecheck 0 err；lint 0 error，仅 toc.tsx 5 个既有 warning 与本工单无关；a11y:contrast 26/26；lint:i18n EN 512=ZH 512 parity OK）+ `build` 成功 + `lint:links` **0/33 失败** + `test:e2e` **69 passed**。

  **缺陷**：0（无阻断/无回归）。**回归套件重跑**：`pnpm test:contributor-wall && pnpm test:github && pnpm check && pnpm build && SITE=http://localhost:3100 pnpm lint:links && pnpm test:e2e`（lint:links 需先起 `pnpm start`，e2e 自带 3210 webServer）。
  - **遗留（非阻塞）**：AC7 真实 token 联调延后复验，需运维补 `GITHUB_TOKEN` 后在 READINESS 标注。

QA 验证结果：**通过** — AC1–AC8 全部满足，证据见上（脚本 12/12 + github 22/22 + e2e 69 + 质量门全绿 + 实时空态双语核验）。

VERDICT: PASS
- 2026-06-02 08:42:15 set status=closed
- 2026-06-02 08:42:15 引擎周期#18: QA PASS, 关闭
