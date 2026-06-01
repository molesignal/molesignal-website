READINESS_SCORE: 1/34

# READINESS · molesignal-website 上线就绪清单

> 持续迭代引擎的**目标评分卡**。orchestrator 每轮对照**真实代码 / 测试 / QA 结果**更新 `[ ]/[x]` 并回写顶部 `READINESS_SCORE`。全 `[x]` → 触发 DONE 自停。
> 上游依据：`03-产品PRD.md`（P0/P1/P2 + D1–D9 + M1/M2/M3）、`07-开发任务拆分.md`（24 工单 T01–T24）。
>
> ⚠️ **本期评分政策（用户决策 2026-06-01）：不提供任何外部密钥（Resend / Upstash / Plausible / GitHub 全部留空）。含 `〔需外部:…〕` 的项一律按「代码就绪 + 缺 env 优雅降级路径经 QA 客观验证正确（mock / 本地 / 单测 / 脚本）」即判 `[x]`，无需真实外部联调即可达成本期就绪（34/34 可达）。真实外部联调延后到日后补密钥时再跑对应项复验。** 详见下方「评分口径说明」。
> 已锁定决策：轻量托管（候补/DP 入 Resend Audiences、限流 Upstash、埋点 Plausible、无自建 DB）；外部产物缺口走"诚实文案 + 无死链"（本期不建 docs 站）；GitHub 数据静态兜底 + 诚实标注；UI 按 05 改版迁移 token。
> 编写时间：2026-06-01（PM，流水线第三棒之就绪卡）。

- **M1（上线可信闭环 = 全部 P0）**：15 项（覆盖 T01–T13）。**这是上线底线，全 `[x]` 方可对外发布。**
- **M2（运营可持续 = 主要 P1）**：12 项（覆盖 T14–T20）。
- **M3（体验增强 = P2）**：7 项（覆盖 T21–T24）。
- **合计 34 项**。

> **外部前置标注约定**：项末带 `〔需外部:XXX〕` 表示该项最终判 `[x]` 依赖用户提供的密钥/账号/外部产物就绪；缺失时引擎只能验证"代码就绪 + 缺 env 优雅降级"那一半，不能据此判完整 `[x]`。这些前置汇总见末尾"外部前置一览"。

---

## M1 上线就绪（P0 · 必须全绿才可发布）

### 候补与转化真入库（D2/D9 红线 · T11/T01/T02）
- [x] **限流可靠化**：`lib/rate-limit.ts` 改 async 用 `@upstash/ratelimit`+Upstash REST；脚本/单测可复现"连续请求超 cloud 10/h 或 dp 5/h 阈值后返回 429 且带 `Retry-After` 头"；缺 `UPSTASH_*` env 时回退内存 Map 不崩溃并打 warn 日志（T11）〔需外部:UPSTASH_REDIS_REST_URL/TOKEN 才能验真实跨实例限流〕 ✅ ISSUE-1 closed · QA PASS 2026-06-02（HTTP 层真实复现 429+Retry-After:3600；内存兜底 warn-once；bogus env 验 fail-open 全 200；H1 取信源修复经探针验证。AC8 真实跨实例延后补密钥复验）
- [ ] **Cloud 候补真入库**：`POST /api/cloud-waitlist` 提交合法 email 后，该 email 出现在 `RESEND_CLOUD_AUDIENCE_ID` 对应 Resend audience（幂等：重复邮箱不报错仍 200），且 founders 收到通知邮件；缺 audience env 时跳过入库仍发通知仍返 200 + warn；前端成功/失败态正确（T01）〔需外部:RESEND_API_KEY + RESEND_CLOUD_AUDIENCE_ID〕
- [ ] **Design Partner 申请持久化**：5 字段 zod 校验通过后 email 入 `RESEND_PARTNER_AUDIENCE_ID`（name 拆 first/last，幂等）；通知邮件正文含全 5 字段且 `replyTo`=申请人；蜜罐字段被填时 silent 200 不入库；缺 env 优雅降级 + 日志；成功态原位切换持久卡片（T02）〔需外部:RESEND_API_KEY + RESEND_PARTNER_AUDIENCE_ID〕

### 转化可观测（D7 · T05）
- [ ] **埋点 11 点位接线**：§4.4 所列 11 个事件在对应组件真实调用 `track()`（含规范 props），两表单 submit 事件在 API 2xx 后才触发；QA 用 network 面板验证 prod+配域名时 Plausible 收到对应请求，无遗漏点位（T05）〔需外部:NEXT_PUBLIC_PLAUSIBLE 域名配置 才能验真实上报；本地可验 track() 被调用〕

### 信任 / 合规（D1/D5/D8 红线 · T04/T06）
- [ ] **死链 / 画饼治理**：Footer 移除 docs 链接、Discord 改禁用态（cursor-default+title，非 `href="#"`）、Download 改 coming-soon/锚到 /start binary；TopNav 移除 Docs 入口；community-callout Discord 同改禁用态；QuickStart helm/binary tab 加 "v1.0 target" notice；`messages/{en,zh}.json` 文案同步（T04）
- [ ] **无死链门禁**：`pnpm lint:links` 全 2xx，全站无 `href="#"` 占位（T04 验收聚合）
- [ ] **隐私 / 条款真实法务文本**：`/privacy` `/terms` 已用真实文本替换 LegalStub（覆盖邮箱收集、Plausible 无 cookie 分析、第三方 Resend），EN/ZH 双语在 `messages/*` 齐全，更新日期准确，页内链 2xx（T06）〔需外部:法务文本来源由用户/模板审核确认〕

### UI 按 05 改版（D1/D8 · T08/T09/T10/T08b）
- [ ] **UI token 迁移**：装 `@fontsource/geist-mono` 并在 layout import 400/600；`globals.css` 按 05-UI §5 完成迁移（Teal 主色/Amber 强调/暖中性/圆角降档/阴影简化/去 indigo+pink glow）、`--font-mono` 指向 Geist Mono；`pnpm a11y:contrast` 全过 AA；`pnpm build`/`check` 过；明暗双主题无视觉崩坏（T08）
- [ ] **核心页面视觉改造**：Hero 左对齐+mono `$` 命令预览、CrossSignalDemo terminal card+amber trace_id、Why/Stats 两栏+mono 数字、QuickStart 简介左对齐、DP CTA 左 border accent 卡（去 glow）；明暗双主题 OK，`check` 过（T09）
- [ ] **表单页 + 成本/对比视觉改造**：CostCalculator amber mono 大数+三结果卡语义色+滑块 44px 触摸区、CompareTable molesignal 列 brand 顶边+✓✗ mono、两表单成功态持久绿卡 + 限流温和 amber 提示、DP 三步 "What happens after"；`check` 过（T10）
- [ ] **导航/页脚/Pill/Button 视觉改造**：TopNav 56px+brand mono+active 下划线+滚动 blur、Footer 四列+禁用态链接样式、Button/Pill/Badge variants 按规格，与 T04 死链改动不冲突；`check` 过（T08b）

### 数字 / 兜底可信（D1/D5 · T03/T07）
- [ ] **成本/对比数字校准**：`lib/cost-formula.ts`+`lib/compare-data.ts` 的 Datadog 定价核对为最新公开值并在 UI 显示定价快照日期/来源 disclaimer；计算结果无溢出/无 NaN；EN/ZH 文案同步（T03）
- [ ] **GitHub stats/changelog 兜底标注**：`getRepoStats().fallback`/空 contributors/空 releases 三兜底态被 UI 正确消费不伪造数字；changelog 加 "live from GitHub"/"previewing" pill、stats chip 兜底显示 "★ on GitHub" 无数字、贡献者墙空态 "Be the first contributor"；仓库公开+token 时无需改代码即切真实（T07）〔需外部:GITHUB_TOKEN + 仓库公开状态 才能验真实数据切换；缺失时验兜底态〕

### 自动化守护（D8/D9 · T12/T13）
- [ ] **关键路径 E2E**：Playwright 已装，`pnpm test:e2e` 本地全绿，覆盖两表单端到端（mock API 2xx→成功卡片）、locale 切换保滚动、CodeBlock 复制、内链 2xx、限流 429 态（T12）
- [ ] **CI 门禁**：`.github/workflows/ci.yml` 跑 `pnpm check`+`build`+`lint:links`+`lint:quickstart`+E2E，PR 失败阻断合并，缓存 pnpm store（T13）
- [ ] **M1 已实现项回归不退化**：#1 Hero、#2 CrossSignalDemo、#7 架构图、#8 sticky TOC、#10 CodeBlock 复制、#16 RSS、#18 OG 图、#19 sitemap/robots/hreflang、#20 主题切换防闪烁、#21 语言切换保滚动、#23 PreReleaseBanner、#25 a11y、#27 Pricing 在 UI 改版后经 QA 验证均端到端可用无回归（PRD §4.1 回归范围）

---

## M2 运营可持续（P1 · T14–T20）

- [ ] **内容迁 MDX 接线**：`next.config.ts` 接 `@next/mdx`+`remark-gfm`，新增 `content/blog/*.mdx`，抽 `lib/content/blog.ts` provider（`getAllPosts`/`getPost` 签名不变），现有 2 篇迁移无丢失，改内容不改组件，`build` 过（T14）
- [ ] **Blog 富文本渲染**：blog body 经 MDX 渲染富文本（标题/列表/代码块），代码块复用 Shiki 高亮，相关文章按 tag 仍工作（T15）
- [ ] **贡献者墙真实数据**：仓库公开+token 下真实拉 `/contributors` 渲染头像/链接正确，私有/失败回退空态不报错（T16）〔需外部:GITHUB_TOKEN + 仓库公开〕
- [ ] **社区入口真实化**：若 Discord 邀请链接已就绪，community-callout/Footer 指向真实链接、文案与现状一致、无死链；未就绪则保持 T04 诚实禁用态（T17）〔需外部:真实 Discord 邀请链接〕
- [ ] **表单数据导出工作流**：文档化运营在 Resend Dashboard 导出 cloud/partner audience CSV（字段含来源/时间戳，DP 结构化字段从通知邮件归档补全），并实际验证导出可用（T18）〔需外部:Resend 账号可访问 Audiences〕
- [ ] **QuickStart 产物就绪切换**：helm repo/binary release 真实就绪后移除 "v1.0 target" notice，`lint:quickstart` 与父仓库 README 同步过，命令冒烟可执行（T19）〔需外部:真实 helm repo/binary release 产物〕
- [ ] **Changelog 接真实 Release**：仓库有 Release 时 ISR 拉取展示，RSS 同源同步，版本锚跳转正确（T20）〔需外部:GITHUB_TOKEN + 仓库有真实 Release〕
- [ ] **M2 后端代码就绪（不依赖外部产物的部分）**：T16/T20 的真实数据拉取与回退分支代码已落地并通过 `check`/`build`，仅等外部就绪即生效（与上面外部依赖项区分，便于引擎在缺外部前置时仍能推进代码就绪）

---

## M3 体验增强（P2 · T21–T24）

- [ ] **Blog 中文支持决策落地**：`/zh/blog*` 渲染中文内容，或明确保留 EN-only 并有友好提示（需用户拍板，PRD §7-7）；若做则 sitemap 补 hreflang（T21）〔需外部:用户对中文 blog 的拍板决策〕
- [ ] **CompareTable 动态化**：对比数据迁内容系统/数据源，改数据不改组件（T22）
- [ ] **CrossSignalDemo 接真实查询**：接真实/沙箱查询后端，或明确保持写死样本（默认保持，需用户决策），reduce-motion 守卫保留（T23）〔需外部:产品查询后端就绪 + 用户决策〕
- [ ] **内容运营工作流文档**：提供 blog/changelog/roadmap 更新文档与模板（T24）
- [ ] **M3 已实现项回归**：roadmap tab 与 URL hash 同步（PRD §7 已核实实现）经 QA 在改版后验证不退化
- [ ] **i18n parity 终态**：EN/ZH 键结构对齐无缺口（含 M1/M2 新增文案），切换保留滚动位置，blog EN-only 提示友好（D6 终态聚合）
- [ ] **全站可信度终验**：死链数=0、画饼链接=0、`a11y:contrast` 通过、CI 全绿、LAUNCH.md 目标"上线 48h 内观测到 ≥1 条真实转化事件"的埋点闭环经端到端验证（PRD §6 质量指标终态）〔需外部:Plausible 域名 + Resend 入库 才能闭环验证真实转化〕

---

## 评分口径说明（什么算 `[x]`）

- 只有**真实代码 + QA/测试/脚本客观验证通过**才勾 `[x]`；"代码写了但没验"、"主观看起来 OK" 不算。
- 含外部前置 `〔需外部:XXX〕` 的项（**本期政策，用户决策 2026-06-01，覆盖原规则**）：本期**不提供任何外部密钥**，这些项按 **「代码就绪 + 缺 env 优雅降级路径经 QA 客观验证正确」即判 `[x]`**——验证手段为 mock / 本地 / 单测 / 脚本（例：`/api/cloud-waitlist` 缺 RESEND env 时仍 200 + warn 日志 + 不报错且前端成功态正确，且 addContact provider 代码路径有单测覆盖 → 即 `[x]`；T05 验 `track()` 在 2xx 后被调用即 `[x]`，无需真 Plausible 收到；T11 验内存回退 + 有 Upstash 分支代码 + 429 行为即 `[x]`）。诚实标注类（T04/T07/T17/T19）仍按"诚实态正确呈现且无死链"即 `[x]`。
- **延后复验**：上述按降级判 `[x]` 的项，日后补密钥后须重新跑对应项做真实外部联调复验（不影响本期 DONE）。
- **诚实回退**：任一工单 QA 判 FAIL 回流时，对应 `[x]` 必须改回 `[ ]`，依赖它的项（如 T12 依赖 T01/T02/T04/T05）也相应回退——这是诚实，不是 bug。
- 命中红线的工单（T01/T02/T11/T06/T03/T14/T22/T16/T20）必须经 full 道（开发→代码审查→独立 QA）才允许 `[x]`。

## 外部前置一览（供引擎/主管知悉，缺失则相关项卡在"代码就绪"半程）

| 前置 | 影响项 |
|---|---|
| `RESEND_API_KEY` | T01 / T02（无则只能验降级+通知，不能验真入库） |
| `RESEND_CLOUD_AUDIENCE_ID` | T01 |
| `RESEND_PARTNER_AUDIENCE_ID` | T02 |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | T11（无则只能验内存回退） |
| `NEXT_PUBLIC_PLAUSIBLE` 域名 | T05 / 转化闭环终验（无则只能验 track() 被调用） |
| `GITHUB_TOKEN` + 仓库公开/有 Release | T07 / T16 / T20（无则验兜底态） |
| 真实 Discord 邀请链接 | T17（无则保持 T04 诚实禁用态） |
| 真实 helm repo / binary release 产物 | T19（无则保持 T04 "v1.0 target" 诚实标注） |
| 法务文本来源（用户/模板审核） | T06 |
| 用户拍板：中文 blog 是否做、CrossSignalDemo 是否接真实后端 | T21 / T23 |
