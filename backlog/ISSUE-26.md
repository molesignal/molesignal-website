---
id: ISSUE-26
type: feature
title: M1 已实现项 UI 改版后回归守卫(13 项端到端无退化)
status: closed
priority: P0
assignee: fullstack-engineer
created: 2026-06-02
updated: 2026-06-02
---

## 描述
承接 READINESS M1「M1 已实现项回归不退化」(对应 PRD §4.1 回归范围) + 这是 M1 最后一条未勾选闸门、上线底线。背景：UI token 迁移与组件视觉改造(T08/T09/T10/T08b, ISSUE-5/10/11/12)已落地，需客观验证 13 个 M1 既有功能在改版后端到端仍可用、无视觉/功能退化。范围(13 项)：#1 Hero、#2 CrossSignalDemo、#7 架构图(ArchitectureDiagram)、#8 sticky TOC、#10 CodeBlock 复制、#16 RSS、#18 OG 图、#19 sitemap/robots/hreflang、#20 主题切换(防闪烁)、#21 语言切换(保滚动)、#23 PreReleaseBanner、#25 a11y、#27 Pricing。LANE=light(纯验证+补 E2E 守卫，不动数据契约/API/schema，不命中红线；如发现退化需修复且触及红线则升 full)。本期不依赖任何外部密钥，全程本地 Chromium E2E + 脚本可验证。验收标准(全部需 QA 独立验证、真实生产 next start 跑)：AC1 新增 E2E 套件覆盖上述 13 项中尚无专属回归守卫的项(Hero 渲染+命令预览/架构图交互+sticky TOC 滚动高亮/CodeBlock 复制 toast/RSS 200+application/rss+xml/OG 图 200 image/png/sitemap.xml·robots.txt·hreflang 正确/主题明暗切换无闪烁且持久/语言切换保滚动/PreReleaseBanner 关闭后 7 天重现且不破版/Pricing 三档渲染)，已有专属守卫的(CrossSignalDemo=issue24、CostCalculator=issue6、legal=issue4)纳入回归引用即可；AC2 明暗双主题下 13 项均无视觉崩坏(关键元素 computed style 抽样断言用新 Teal/Amber token)；AC3 a11y:contrast 26/26 AA 全过；AC4 全量 pnpm test:e2e 零退化(现 82 passed 为基线，新增用例后全绿)；AC5 pnpm check(typecheck/eslint/a11y/i18n parity) + pnpm build 双 rc=0；AC6 lint:links 0 失败(全 2xx)守住无死链；AC7 验证结论回写 READINESS 该条为 [x] 并附 QA 证据。明确不做：不改组件视觉(改版已完成)、不动 API/schema/数据契约、不引新依赖、不做需外部密钥的真实上报联调(属 Line 74 另条)。

## 需求说明


## 验收标准


## 改动与自测（fullstack-engineer，2026-06-02）

**LANE: light（纯验证 + 补 E2E 守卫，零产品代码改动；未触红线，无退化发现故无需升 full）**

### 产出文件（新增，1 个）
- `tests/e2e/issue26-m1-regression-guard.spec.ts` —— 19 个用例，端到端守卫 13 项 M1 既有功能在 UI 改版后不退化。逐项对照源码实现写断言（非快照），真实 `next start` 生产构建上跑。

### AC1 覆盖映射（新建守卫 vs 引用既有）
| M1 项 | 守卫 | 关键断言 |
|---|---|---|
| #1 Hero | 新建 `describe hero` | pre-release pill + h1 teal 高亮 span + `font-mono` 行内 `$`(text-primary) + 真实 docker compose 命令预览 CodeBlock |
| #2 CrossSignalDemo | **引用** `issue24-t23-cross-signal-demo.spec.ts` | trace_id 贯穿三视图 + reduce-motion 守卫 |
| #7 架构图 | 新建 `describe architecture diagram` | 默认 tooltip=Ingest(role=status)；点 `[data-node-id=storage]`→tooltip 切 Parquet 且旧 label 消失 |
| #8 sticky TOC | 新建 `describe sticky TOC` | 滚动定位 #query 至 IO active band(rootMargin -96px)→该 TOC 链接获 `text-primary` 高亮，滚过的 #data-path 不再高亮 |
| #10 CodeBlock 复制 | 新建 `describe CodeBlock copy` | 按钮翻转 Copy→Copied + sonner toast「Copied」可见 |
| #16 RSS | 新建 `feeds & SEO routes` | `/changelog/rss.xml` 200 + `application/rss+xml` + `<rss`/频道标题 |
| #18 OG 图 | 同上 | `/opengraph-image` 200 + `image/png` |
| #19 sitemap/robots/hreflang | 同上 | sitemap 200 含 `hreflang=en/zh/x-default` + `/why`&`/zh/why`；robots 200 含 `Disallow:/api/`+`Sitemap:` |
| #20 主题切换 | 新建 `describe theme switch` | 切 Dark→`<html data-theme=dark>`+localStorage 持久；anti-flash：预置 localStorage dark→goto 后 data-theme 已 dark（脚本先于水合，无闪） |
| #21 语言切换保滚动 | **引用** `issue13-t12` + 本套补 1 例 | EN→ZH 切换后 scrollY 仍 >600 |
| #23 PreReleaseBanner | 新建 `describe PreReleaseBanner` | 关闭→隐藏+localStorage 写时间戳+reload 仍隐藏；置 8 天前时间戳→重现（TTL 过期）；置 1 天前→仍隐藏；横幅含 /design-partner 链接不破版 |
| #25 a11y | 新建 `describe a11y landmarks` | `main#main`/nav/banner region 存在；架构图 SVG `role=img aria-label` |
| #27 Pricing | 新建 `describe pricing tiers` | `#tiers article` 恰 3 张 + OSS/Enterprise/Cloud badge + 每卡 CTA 链接 |
| CostCalculator | **引用** `issue6-cost-calculator.spec.ts` | — |
| legal | **引用** `issue4-legal.spec.ts` | — |

### AC2 双主题视觉无崩坏
`AC2 · {light,dark} theme palette` 两 describe：抽样真实 legacy-class 消费元素的 computed color——hero `$`(text-primary)===Teal token、架构 perfBannerLabel(text-marketing-accent)===Amber token，逐主题精确比对（light teal `rgb(15,118,110)`/amber `rgb(180,83,9)`；dark teal `rgb(45,212,191)`/amber `rgb(251,191,36)`），并断言 body 背景非透明（无塌陷）。

### 自测（PATH 经 nvm node v23.6.1，退出码客观佐证）
- **AC4** `pnpm test:e2e` —— **101 passed**（82 基线零退化 + 本套 19）；rc=0。
- **AC3** `pnpm a11y:contrast` —— **0/26 failures，26/26 AA 全过**。
- **AC5** `pnpm check` —— rc=0（tsc 0 / eslint 0 / a11y 26/26 / i18n parity EN 518 = ZH 518）；`pnpm build` —— rc=0（rss.xml/sitemap/robots/opengraph-image/blog SSG 全产出）。
- **AC6** `pnpm lint:links` —— 对 `next start :3000` 跑 **0/33 失败**（全 2xx，含 EN+ZH 全量内链）。
- 单跑本套：sticky TOC 初版 IO band 数学偏差（上一 section 残留遮挡）→ 修正为「目标 section top 定位至 80px（略高于 -96px band 起点）使上方 section 完全离带」后通过。

### AC7 READINESS 回写
按评分政策（只有独立 QA PASS 后方勾 `[x]`），本工单 READINESS 第 49 行 `[ ]` 暂不由开发自行翻 `[x]`，留独立 QA 验证通过后由引擎/QA 回写并附证据。

阻塞项：无。

## 代码审查（code-reviewer，2026-06-02）

**结论：通过，建议放行到独立 QA 验证。必改问题 0 个。**

审查范围：`main...feature/ISSUE-26` 全部改动 = 仅新增 `tests/e2e/issue26-m1-regression-guard.spec.ts`（392 行 / 19 用例）+ 工单 md。零产品代码改动，与 LANE=light「纯验证」自述一致，未触任何红线（无 schema/API/契约改动）。

### 逐项对源码交叉验证（守卫真实性，非空跑）
逐条把测试断言与真实实现对照，全部 **MATCH**：
- **#1 Hero** `app/[locale]/page.tsx:47-53` —— pill 文案 `hero.preReleasePill="pre-1.0 · building in the open"`(en.json:103)✓；`h1>span.text-primary`✓；`p.font-mono>span.text-primary` 文本恰 `$`✓；`DOCKER_LINE` 含断言子串✓。
- **#7 架构图** `architecture-diagram.client.tsx:46-49` `role="status"` 单活动 tooltip✓；`architecture-diagram.tsx:24` 节点序 `ingest,wal,storage,engine,api`→默认 `ingest.label="Ingest"`✓、`storage.label="Parquet"`✓（en.json）；`data-node-id`✓；SVG `role="img" aria-label="molesignal data path"`✓。切换后旧 label 离开 role=status，count 0 成立。
- **#8 sticky TOC** `toc.tsx:70` rootMargin `-96px 0px -65% 0px`（与测试注释一致）✓；active→`text-primary font-strong`✓；`architecture/page.tsx` section id `data-path`(序前)/`query`(序后)✓，断言"滚到 query→data-path 不再高亮"方向正确。
- **#10 CodeBlock 复制** `code-block.client.tsx:48,70` `common.copy/copied=Copy/Copied`✓、`toast.success` 触发✓、`aria-label="Copy"`✓。
- **#16/#18/#19** `changelog/rss.xml/route.ts:51,63` title「molesignal changelog」+`application/rss+xml`✓；`opengraph-image` image/png✓；`sitemap.ts:40-57` hreflang en/zh/x-default + `/why`&`/zh/why`✓；`robots.ts:11,14` `Disallow:/api/`+`Sitemap:`✓。
- **#20 主题** `theme-provider.tsx:28`+`layout.tsx:34` key `molesignal-theme`、anti-flash 内联脚本读 localStorage 先于水合置 `data-theme`✓；`theme.label=Theme`/`theme.dark=Dark`✓。
- **#21 语言** `locale-switcher.tsx:44` `router.replace(...,{scroll:false})` 保滚动✓；`locale.label=Language`/`locale.zh=中文`✓。
- **#23 PreReleaseBanner** `pre-release-banner.tsx:10-21` key/7天TTL/时间戳逻辑与测试 8天重现·1天仍隐藏完全吻合✓；region `aria-label="Pre-release announcement"`、dismiss `aria-label="Dismiss banner"`、`/design-partner` 链接✓。
- **#25 a11y** landmark/SVG role 同上✓。
- **#27 Pricing** `pricing/page.tsx:73,246` `#tiers` 内 3×`<article>`✓；badge `Open Source/Enterprise/Cloud (SaaS)`(en.json)✓；每卡 CTA `<a>`✓。
- **AC2 token** `globals.css:48/58/179/187` light teal `#0f766e`=rgb(15,118,110)·amber `#b45309`=rgb(180,83,9)、dark teal `#2dd4bf`=rgb(45,212,191)·amber `#fbbf24`=rgb(251,191,36) 与 `TOKEN` 常量逐位一致✓；`text-primary→--primary→--brand`、`text-marketing-accent→--amber` 别名链正确✓。

### 提交规范
`7435e3c test(ISSUE-26): …` —— Conventional Commits 类型/scope 正确✓。

### 非阻塞观察（可选，不影响放行）
1. **clipboard stub 弱化负载校验**（`spec.ts:133-138`）：stub `writeText` 恒 resolve，只验 UI 确认流（按钮翻转+toast），不验真实复制内容。文件已注释为有意取舍，headless 下合理；提示该守卫不覆盖"复制内容正确性"。
2. **anti-flash 用例的"先于水合"是弱证明**（`spec.ts:218-230`）：`toHaveAttribute` 会轮询等待，React 水合后再置 dark 也能过；它能挡住"data-theme 永不为 dark"，但不能严格证明"无闪"。可选增强：断言一帧内 computed bg 即为暗色。
3. **固定等待/时序依赖**（`spec.ts:344` `waitForTimeout(400)`、sticky TOC 的手算 scroll + 5s 超时）：滚动/IO 类断言固有时序性，当前全绿；若后续 CI 偶发 flake，优先改为等确定性条件。
以上 3 项均为 E2E 哲学取舍，**不建议本期修改**（强行"修"反易引入 flake），留作记录。

**放行建议：PASS → 交 qa-automation 独立验证（真实 next start 跑全量 + AC3/AC5/AC6），QA PASS 后由引擎回写 READINESS 第 49 行为 [x]。**

## QA 验证结果（qa-automation，2026-06-02）

**独立验证：真实生产 `next build` + `next start` 上跑全量 E2E + AC3/AC5/AC6，逐项客观佐证（退出码 + 真实输出 + 独立 curl 探针）。环境：nvm node v23.6.1 / pnpm 11.5.0。**

| AC | 命令/方法 | 结果 | rc |
|---|---|---|---|
| AC5a build | `pnpm build` | 成功，全路由产出（rss.xml/sitemap.xml/robots.txt/opengraph-image/[locale] SSG 全在） | 0 |
| AC4 E2E | `pnpm test:e2e`（auto `next start :3210`） | **101 passed (55.9s)** —— 82 基线零退化 + 本套 19 全绿 | 0 |
| AC1 覆盖 | 本套 19 用例（test #71–#89）全过 | hero/架构图/sticky TOC/CodeBlock 复制/RSS/OG/sitemap·robots·hreflang/主题切换+anti-flash/PreReleaseBanner TTL/a11y landmarks/Pricing 三档/语言保滚动 逐项通过 | — |
| AC2 双主题 | test #88(light)/#89(dark) palette | teal/amber token computed style 双主题精确比对通过 | — |
| AC3 contrast | `pnpm a11y:contrast` | **0/26 failures，26/26 AA 全过** | 0 |
| AC5b check | `pnpm check` | typecheck 0 / eslint 0 / contrast 26/26 / i18n parity EN 518 = ZH 518 | 0 |
| AC6 links | `SITE=:3000 pnpm lint:links`（真实 next start） | **0/33 失败，全 2xx**（EN+ZH 全量内链 + rss/sitemap/robots） | 0 |

**独立探针（绕过测试自身断言，直打路由佐证）**：
- `/changelog/rss.xml` → 200 `application/rss+xml; charset=utf-8` ✓
- `/opengraph-image` → 200 `image/png` ✓
- `/robots.txt` → 含 `Disallow: /api/` + `Sitemap: https://molesignal.io/sitemap.xml` ✓
- `/sitemap.xml` → hreflang `en` / `zh` / `x-default` 三者俱全 ✓

**观察（不阻塞）**：
- `/en` 及未知 locale 前缀路径返回 307（next-intl middleware locale 重定向，预期行为，非本工单回归项）。
- 服务已全部关闭，端口 3000/3210 清空，无僵尸进程。

**AC7**：本验证通过，可由引擎/QA 回写 READINESS 第 49 行为 `[x]` 并引用本节作为证据。

**VERDICT: PASS** — 13 项 M1 既有功能在 UI 改版后端到端无退化；AC1–AC6 全部独立验证通过（全量 101 passed / 26 AA / 33 链接全 2xx / build+check 双 rc=0），无阻断缺陷。

## 处理记录
- 2026-06-02 12:19:25 工单创建（feature / P0）
- 2026-06-02 12:20:09 set assignee=fullstack-engineer
- 2026-06-02 12:20:09 set priority=P0
- 2026-06-02 12:20:09 set status=triaged
- 2026-06-02 12:20:14 LANE: light
- 2026-06-02 12:20:14 EXTRA_ROLES: none
- 2026-06-02 12:20:32 set status=in_progress
- 2026-06-02 12:29:17 set status=in_review
- 2026-06-02 code-reviewer 审查完成：必改 0；19 用例逐条对源码 MATCH（守卫真实有效）；3 项可选 E2E 观察不阻塞；建议放行至 qa-automation 独立验证
- 2026-06-02 12:34:18 set status=verifying
- 2026-06-02 12:37:47 set status=closed
- 2026-06-02 12:37:47 引擎周期#27: QA PASS, 关闭
