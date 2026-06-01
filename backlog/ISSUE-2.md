---
id: ISSUE-2
type: feature
title: [T05] 转化漏斗埋点接线(11点位)
status: closed
priority: P0
assignee: frontend-engineer
created: 2026-06-01
updated: 2026-06-02
---

## 描述
模块:转化漏斗埋点接线(11点位) | 角色:frontend | 依赖:无 | 里程碑:M1 | 验收:11事件真实调track();表单submit在API2xx后触发;prod配域名Plausible收到;命名见06§4.4无遗漏 | 详见 07-开发任务拆分.md(T05) 与 06-技术架构.md/READINESS.md

## 需求说明

### 背景与价值
官网已上线但 `lib/analytics.ts` 的 `track()` **全站零调用**（PRD §7 已核实：`app/`+`components/` 无任何调用、无 `data-analytics` 属性）。即 Plausible 即便配好域名也只有 PV，**拿不到任何转化事件**。本工单把 06§4.4 定义的 11 个漏斗事件接线到对应组件，让"上线 48h 内可观测转化"（LAUNCH.md / NSM）成立。承接 PRD §4.1 **P0-5**、07 **T05**、06 **§4.4/§5**。

**用户故事**：作为增长负责人，我想让 CTA / 表单 / 切换 / 复制等关键动作都被埋点，以便上线后能观测完整转化漏斗（落地→why→start→转化页→提交），用数据驱动迭代。

### 实现要点（接线，非新建埋点系统）
- `track(event, props?)` 已存在（`lib/analytics.ts`），签名 `track(event: string, props?: Record<string,string|number|boolean>)`，`window.plausible` 不存在时**安全 no-op**（本地/缺域名不报错）。本工单只负责**在 11 个点位调用它**。
- **事件命名以 06§4.4 为准：`snake_case` 动宾、全小写**。⚠️ `lib/analytics.ts` docstring 里的示例 `"cta-click"` 是 kebab-case，**不要照抄**，否则命名不一致导致 Plausible 漏统计/对不上漏斗。
- 纯客户端改动，不动 API 契约、不动数据模型（接线本身局部；命中红线④跨多模块走 full）。

### 11 个点位规格（事件名 / 触发点 / props / 组件文件）
| # | 事件名 | 触发时机（精确） | props | 组件文件 |
|---|---|---|---|---|
| 1 | `cta_click` | 任意主/副 CTA 按钮/链接**点击时** | `{ label, source_page, destination }` | 各 CTA 按钮（hero / why / start / 各页 CTA） |
| 2 | `demo_tab_switch` | CrossSignalDemo **tab 实际切换时**（同 tab 重复点不重复发） | `{ tab: "trace"\|"logs"\|"metric" }` | `components/cross-signal-demo.tsx` |
| 3 | `cost_calculator_interact` | 滑块**首次拖动**（每次挂载只发一次，避免每 tick 刷事件） | `{ ingest_gb, retention_days }` | `components/cost-calculator.tsx` |
| 4 | `compare_table_expand` | "See full comparison" 展开点击 | `{ source_page }` | `components/compare-table.tsx` |
| 5 | `quickstart_copy` | CodeBlock 复制按钮点击 | `{ tab: "docker"\|"helm"\|"binary", snippet_type }` | `components/ui/code-block.client.tsx`（tab 由调用方透传） |
| 6 | `waitlist_submit` | ⚠️ **仅在 `/api/cloud-waitlist` 返回 2xx 后**（非点击、非校验失败、非 429/5xx） | — | `components/cloud-waitlist-form.tsx` |
| 7 | `design_partner_submit` | ⚠️ **仅在 `/api/design-partner` 返回 2xx 后**（蜜罐 silent-200 也算成功路径，与表单行为一致） | — | `components/design-partner-form.tsx` |
| 8 | `github_star_click` | GitHub stats chip / star 链接点击 | `{ source_page }` | `components/github-stats-chip.tsx`（及其他 star 链接） |
| 9 | `locale_switch` | LocaleSwitcher EN↔ZH 切换 | `{ from, to, page }` | `components/locale-switcher.tsx` |
| 10 | `theme_switch` | 主题切换 | `{ theme: "light"\|"dark"\|"system" }` | `components/theme-toggle.tsx` |
| 11 | `rss_subscribe` | changelog RSS 订阅按钮点击 | — | changelog RSS 按钮（`app/[locale]/changelog/page.tsx` 内） |

### 边界与约束
- **表单事件时序（最高风险点）**：`waitlist_submit` / `design_partner_submit` 必须在 fetch resp `ok`（2xx）**之后**才 `track()`；submit 被点但 zod 校验失败、429 限流、网络/5xx 失败时**不得触发**。这是与 T01/T02 的契约衔接点。
- **去重**：`cost_calculator_interact` 每次组件挂载只发一次（用 ref/flag 守卫）；`demo_tab_switch` 仅在 tab 值真正变化时发。
- **隐私**：props **不得包含任何 PII**（邮箱、姓名、IP 等）；`waitlist_submit`/`design_partner_submit` 无 props 即满足。呼应 P0-6 隐私政策"Plausible 无 cookie / 不采集个人数据"。
- **无障碍/性能**：埋点不得改变现有交互行为、不得阻塞 UI、不得抛错冒泡（`track()` 内已 try/catch 兜底）。
- **不做（YAGNI）**：不引入第二个分析 SDK；不做自建事件上报后端；不加埋点配置中心/同意管理 UI；不改 `track()` 签名；不追加 §4.4 之外的事件（11 个为本期全集，多一个少一个都算偏差）。

### 本期判过政策（READINESS 政策 2026-06-01，覆盖默认）
本期**不提供 `NEXT_PUBLIC_PLAUSIBLE` 域名**。判 `[x]` 口径：**11 个 `track()` 在对应交互下被正确调用、事件名/props 符合 §4.4、两表单事件确在 2xx 后触发**——用 E2E/单测 spy 或 mock `window.plausible` 客观验证即可，**无需真实 Plausible 收到事件**。真实 prod+域名的 network 上报验证（AC8）延后到补域名时复验，不卡本期 DONE。

## 验收标准

- **AC1（11 点位全覆盖）**：§4.4 表中 11 个事件均在对应组件以正确事件名调用 `track()`，无遗漏点位、无多余事件；事件名为 `snake_case`（非 kebab）。
- **AC2（props 规范）**：每个带 props 的事件按上表传对应字段且类型正确（如 `demo_tab_switch.tab ∈ {trace,logs,metric}`、`cost_calculator_interact` 含 `ingest_gb`/`retention_days` 数值）。
- **AC3（表单时序——核心）**：`waitlist_submit` / `design_partner_submit` **仅在 API 2xx 后**触发；可复现"submit 点击但校验失败/429/5xx 时不触发"。
- **AC4（去重）**：`cost_calculator_interact` 每次挂载仅 1 次；`demo_tab_switch` 仅在 tab 变化时发，重复点同 tab 不重复发。
- **AC5（无 PII）**：所有事件 props 不含邮箱/姓名等个人数据。
- **AC6（无回归/不破坏交互）**：接线后各组件原有交互（tab 切换、滑块、复制 toast、表单成功态、主题/语言切换）行为不变；`pnpm check` + `pnpm build` 通过。
- **AC7（命名文档化）**：11 事件命名与 props 规范已在 06§4.4 表登记（本工单确认无偏差即可，不新建文档）。
- **AC8（真实上报，延后）**〔需外部:`NEXT_PUBLIC_PLAUSIBLE` 域名〕：prod + 配域名时，QA 用浏览器 network 面板验证上述交互真实向 Plausible 发出对应事件请求。**本期不阻断**，补域名后复验。

> 本期 DONE 判据 = AC1–AC7 全绿（AC8 延后）。QA 验证手段：E2E（Playwright，T12 同源）spy `window.plausible` 或 mock `track`，断言事件名+props+触发时序；表单事件用 mock API 2xx/4xx 两路径验证 AC3。

## 处理记录
- 2026-06-01 23:30:28 工单创建（feature / P0）
- 2026-06-02 00:31:03 set assignee=frontend-engineer
- 2026-06-02 00:31:03 set priority=P0
- 2026-06-02 00:31:03 set status=triaged
- 2026-06-02 00:31:03 LANE: full
- 2026-06-02 00:31:03 EXTRA_ROLES: data-analyst
- 2026-06-02 00:31:03 分诊: T05埋点接线11点位/frontend/P0/M1. 红线④跨多模块(近全站11组件)命中→full. 本质为指标埋点→增派data-analyst把关事件命名(snake_case动宾)/props规范/漏斗一致性. 关键风险: 两表单submit须在API 2xx后才触发track; 命名见06§4.4无遗漏点位.
- 2026-06-02 PM细化: 补全需求说明(11点位逐条规格表:事件名/精确触发时机/props/组件文件)+8条验收标准(AC1-AC8). 核实代码: track()签名no-op安全/9组件均在/全仓库零track调用(印证须真实开发). 关键澄清: ①命名以06§4.4 snake_case为准, 勿照抄analytics.ts docstring的kebab示例; ②两表单事件仅API 2xx后触发(AC3核心,与T01/T02衔接); ③cost_calculator_interact每次挂载只发1次去重; ④props禁含PII; ⑤本期缺Plausible域名→spy/mock验track被调用即判[x](AC8真实上报延后). 同步要点入03-PRD§8.

## 架构评估（tech-architect, 2026-06-02）

**契约/数据模型影响：无。** 纯客户端接线，不动 API 出入参、不动数据模型、不引入新依赖（`track()`/`window.plausible` 已存在）。LANE=full 仅因红线④跨多模块（~11 组件近全站），非因 schema/契约变更。**06/07 无需改版**——06§4.4 已是 11 事件命名与 props 的**唯一权威表**，与本工单规格逐条一致（snake_case 全小写，已校对无偏差，满足 AC7）。架构文档不更新。

### 核心衔接点：表单事件时序（已核实代码，AC3 落点）
两表单当前结构一致（`cloud-waitlist-form.tsx:46-63` / `design-partner-form.tsx:48-64`）：
```
if (data.website?.length) { setSubmitted(true); return; }   // 蜜罐：silent success，不打 API
try {
  const res = await fetch(...);
  if (!res.ok) throw ...;     // 429/5xx/网络失败 → catch → toast，绝不 track
  setSubmitted(true);         // ← waitlist_submit / design_partner_submit 唯一落点：紧接此行
} catch { toast.error(...); }
```
- **唯一正确落点**：`if (!res.ok) throw` 通过后、`setSubmitted(true)` 同一分支内 `track()`。zod 校验失败由 react-hook-form 拦在 onSubmit 之外（天然不触发），429/5xx 落 catch（不触发）——符合 AC3 三条反例。

### ⚠️ 需开发决策：蜜罐 silent-success 是否 track（spec 内部张力）
- 需求 #7 props 列注"蜜罐 silent-200 也算成功路径"，但 AC3 明文"**仅在 API 2xx 后**"；蜜罐分支 `return` 在 fetch **之前**，根本无 API 调用。两者冲突。
- **架构裁决：蜜罐分支不 track**（两表单一致）。理由：①AC3 是核心判据且措辞为"API 2xx 后"，蜜罐无 2xx；②蜜罐=机器人，打点会用 bot 噪声污染转化漏斗，与本工单"可观测真实转化"的目的相悖；③与 P0-6 隐私/数据质量一致。需求 #7 那句指的是 **UI 行为**（照常显示成功态以骗过 bot），非指打点。→ `track()` 只放真实 API-2xx 分支。QA E2E 断言：蜜罐填值提交时 `window.plausible` spy **零调用**。

### 其余 10 点位落点提示（无歧义，给开发省查代码）
- `quickstart_copy`：`code-block.client.tsx` 复制按钮 `onCopy`（:27 `clipboard.writeText` 成功后）；`tab`/`snippet_type` 由调用方（quick-start-tabs）透传 prop，CodeBlock 本身不知 tab → 需给 client 组件**加 props 透传**，这是唯一需轻改组件签名处（仍属客户端内部，非对外契约）。
- `demo_tab_switch`：仅在 tab 值**真变化**时发（`onValueChange` 内比对旧值，同 tab 重复点不发）。
- `cost_calculator_interact`：`useRef(false)` 守卫，每次挂载首次拖动发一次。
- `cta_click`/`github_star_click`/`locale_switch`/`theme_switch`/`compare_table_expand`/`rss_subscribe`：点击/切换处直调，props 按 §4.4。
- **顺带修文档级隐患**：`lib/analytics.ts` docstring 示例为 kebab `"cta-click"`，开发应顺手改为 §4.4 的 snake_case 示例（避免后人照抄），属注释修正、不改签名。

**结论：批准 full 道开发，无需补迁移/无需改 06/07。** 开发要点见上；QA 重点压 AC3（2xx/4xx/蜜罐三路径）+ AC4 去重。

## 数据把关（data-analyst, 2026-06-02）

**事件命名合规审查（AC1/AC7）**：11 个事件名与 06§4.4 逐条比对，**全部 snake_case 动宾、全小写，无偏差**——本期命名无需修正，满足 AC7。

**props 字段审查（AC2）**：
- `demo_tab_switch.tab ∈ {trace,logs,metric}` 枚举完整覆盖 CrossSignalDemo 现有 3 个 tab ✅
- `quickstart_copy.tab ∈ {docker,helm,binary}` 枚举完整覆盖 QuickStart 现有 3 个 tab ✅
- `cost_calculator_interact` 含 `ingest_gb`/`retention_days` 数值字段，滑块值类型为 `number` ✅
- `locale_switch.from/to ∈ {en,zh}` 完整覆盖当前双语 ✅
- `theme_switch.theme ∈ {light,dark,system}` 完整覆盖 ✅
- `waitlist_submit`/`design_partner_submit` 无 props：**满足 PII 禁止要求**（AC5），邮箱/姓名绝不传入 ✅

**蜜罐裁决对齐**：架构师裁决"蜜罐分支不 track"——数据分析角度完全支持：蜜罐提交=bot 流量，打入 `design_partner_submit` 会用噪声污染 NSM（合格转化数），数据意义为负。`waitlist_submit`/`design_partner_submit` 的"合格"定义要求真实 API 2xx，蜜罐无 2xx，结论一致。

**关键风险提示（给开发 + QA）**：
1. `lib/analytics.ts` docstring 示例为 `"cta-click"`（kebab），**必须顺手改为 `"cta_click"`（snake_case）**，否则下一个开发者照抄会引入命名不一致，污染 Plausible 漏斗图。这是 AC7 合规的最后一个待做项。
2. `cost_calculator_interact` 的 `useRef(false)` 守卫：每次组件**重新挂载**（路由切换离开再回来）重置，这是预期行为——用户离开再回来重新互动计算器，视为新的意图信号，发一次是合理的。
3. `quickstart_copy` 需给 `code-block.client.tsx` 加 `analyticsProps` prop 透传 tab/snippet_type，这是本工单唯一需轻改组件签名处（客户端内部 prop，非对外 API 契约）。

**漏斗一致性校验**：11 个事件覆盖了 11-数据埋点.md §3.1 主漏斗的全部 5 个层级，无关键路径遗漏，无冗余事件——与 NSM 数据采集需求完全对齐。

**详细指标体系、转化漏斗定义、留存框架、A/B 实验框架**见：`11-数据埋点.md`
- 2026-06-02 00:39:04 set status=in_progress

## 开发记录（frontend-engineer, 2026-06-02）

**实现摘要**：11 个漏斗事件全部接线完成，`pnpm typecheck` / `pnpm lint`（0 error，5 个为既有无关 warning）/ `pnpm build`（✓ Compiled successfully）三关均过。

### 实现架构（两类落点）
1. **客户端组件内直调 `track()`**（7 个事件，事件在组件自身交互回调里发）：
   - `demo_tab_switch` — `components/cross-signal-demo.tsx`：在 `pick()` 内 `key !== active` 时发；自动巡演用 `setActive` 不走 `pick`，故不误发。
   - `cost_calculator_interact` — `components/cost-calculator.tsx`：`useRef(false)` 守卫，首次任一滑块拖动发一次，props 取交互瞬间的 `ingest_gb`/`retention_days`（避免闭包旧值）。
   - `quickstart_copy` — `components/ui/code-block.client.tsx`：新增可选 `analytics` 透传（`code-block.tsx` → `code-block.client.tsx`），仅 `quick-start-tabs.tsx` 三个 tab 传 `{tab, snippet_type:"install"}`，clipboard 写入成功后才发；其它 CodeBlock 不传 → 不发（避免多余事件）。
   - `waitlist_submit` / `design_partner_submit` — 两表单：**仅在 `if(!res.ok) throw` 通过后、`setSubmitted(true)` 同分支**调用，无 props（PII 安全）。蜜罐分支 `return` 在 fetch 前、无 `track()`（遵架构裁决，bot 不污染漏斗）。
   - `locale_switch` — `components/locale-switcher.tsx`：`onChange` 内 `next!==locale` 后发 `{from,to,page}`。
   - `theme_switch` — `components/theme-toggle.tsx`：菜单项 onClick 发 `{theme}`（toggle 只暴露 light/dark）。
2. **委托式点击监听**（4 个事件，落在服务端组件的链接上，无需改成 client）：新增 `components/analytics/analytics-clicks.tsx`（`<AnalyticsClicks/>` 挂在 `app/[locale]/layout.tsx`），capture 阶段监听 `[data-analytics-event]`，读 `data-analytics-props`(JSON) 并在有 `data-analytics-source-page` 时注入 `source_page=location.pathname`。capture 早于 Next Link 导航，事件不丢。
   - `cta_click` — TopNav "Try it"(桌面/移动)、首页 hero/设计伙伴/候补、why 收尾两 CTA、pricing 三张 tier 卡 + 收尾两 CTA、architecture 收尾两 CTA、changelog "Get the digest"、pre-release-banner。props `{label, source_page, destination}`。
   - `compare_table_expand` — `compare-table.tsx` slim "See full comparison"，`{source_page}`。
   - `github_star_click` — github-stats-chip(chip+large) / community Star 卡 / 候补成功页 star 链接 / design-partner "star the repo"，`{source_page}`。
   - `rss_subscribe` — changelog 两处 RSS 按钮，无 props。

### 命名合规（AC1/AC7）
11 事件名与 06§4.4 表逐条核对一致（snake_case 动宾全小写，无遗漏无多余）。顺手修正 `lib/analytics.ts` docstring 的 kebab 示例 `"cta-click"` → snake `"cta_click"`，并补注命名规范来源（防后人照抄）。

### 关键判断（CTA 边界——供 QA 核对，避免"多/漏"分歧）
`cta_click` 采用一致可判定的口径：**仅标注按钮样式的转化型 CTA + 站顶 promo banner**；以下刻意**不计**为 CTA（按一致规则）：
- 章节内的 "learn more →" 内联文字链（首页 demoCta/readArchitecture/fullGuide、cloud selfHost/shape、roadmap openIssue/applyDesignPartner、design-partner notReadyCloud）—— 视为页内导航。
- start 页 "next steps" 卡片 —— 卡片式导航而非按钮 CTA。
- 404/500（not-found.tsx / error.tsx）的恢复按钮 —— 非漏斗页，刻意不打点（error.tsx 既有注释另规划 M5.4 错误上报事件，不在本期 11 个内）。
- 区分 star vs view-code：architecture "Read the code"(查看源码)→`cta_click`；design-partner/community 的 "star the repo"(星标意图)→`github_star_click`。footer/contributor-wall/issues/releases 等仓库链接非星标意图，未打点。
> 若 QA 认为某内联文字链也应计入，可快速补 `data-analytics-event`，零结构改动。

### 自测
- `pnpm typecheck`：0 error。
- `pnpm lint`：0 error（5 warning 均在既有 `theme-toggle.tsx`/`toc.tsx`，与本次改动无关）。
- `pnpm build`：✓ Compiled successfully。
- 静态核对：8 处 `track("…")` 直调 + 27 处 `data-analytics-event` 标注，覆盖全部 11 事件，事件名全部 snake_case。
- **遗留/待复验**：AC8（真实 Plausible network 上报）本期无域名延后；运行时交互级断言（spy `window.plausible`、表单 2xx/4xx/蜜罐三路径、去重）由 qa-automation E2E 覆盖。`track()` 缺域名时安全 no-op，本地交互不受影响。
- 2026-06-02 00:54:54 set status=in_review
- 2026-06-02 00:58:33 set status=verifying

## QA 验证结果（qa-automation, 2026-06-02）

**VERDICT: PASS**

真实浏览器 E2E（Playwright + Chromium，对生产构建 `next start` 实跑），spy `window.plausible` 录制 `track()` 调用，14 用例全过，覆盖全部 11 事件 + AC3 表单时序三路径 + AC4 去重 + AC5 无 PII：

- **AC1/AC7**：11 事件均以 §4.4 的 `snake_case` 名真实触发，无遗漏/无多余（静态 8 直调+27 委托标注核对一致；docstring kebab 已改 snake）。✅
- **AC2 props**：`cta_click{label,source_page,destination}`、`demo_tab_switch.tab∈{trace,logs,metric}`、`cost_calculator_interact{ingest_gb,retention_days}`(number)、`quickstart_copy{tab:"docker",snippet_type:"install"}`、`theme_switch{theme:"dark"}`、`locale_switch{from:"en",to:"zh",page:"/"}`、`compare_table_expand/github_star_click{source_page}` 实测正确。✅
- **AC3（核心）**：两表单仅在 API 2xx 后触发；429/500 不触发；蜜罐(zod `website:max(0)` 拦截 submit)无 API 调用且不触发。✅
- **AC4 去重**：demo 同 tab 重复点不发、仅真变化发；计算器每挂载仅 1 次（连按 2 次仍 1）。✅
- **AC5 无 PII**：两表单事件 props 实测 `null`。✅
- **AC6**：`pnpm check` exit 0（typecheck/lint/a11y 26-26/i18n 461=461）+ `pnpm build` ✓，原交互无回归。✅
- **AC8**：真实 Plausible 上报本期无域名，按判过政策延后复验，不阻断 DONE。

**证据**：`08-测试报告.md` ＞「ISSUE-2 运行时 E2E 验证」小节（14/14 用例表）。
**回归套件**：`playwright.config.ts` + `tests/e2e/analytics-funnel.spec.ts`；重跑 `pnpm build && pnpm exec playwright test`。
**非阻断观察**：委托器 `source_page` 用未去 locale 的 `location.pathname`，与 `locale_switch.page` 去 locale 口径不一致（ZH 下漏斗或按语言分裂）——数据质量项，建议 data-analyst 补域名前统一，不卡本期 DONE。
- 2026-06-02 01:09:03 set status=closed
- 2026-06-02 01:09:03 引擎周期#2: QA PASS, 关闭
