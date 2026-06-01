# 03 · 产品 PRD — molesignal-website

> 产研流水线第三棒（PM）。基线：**完全实现站点现有设计已露出的所有功能**，本文做的是分级排序 + 排期规划（P0/P1/P2 + 里程碑 M1/M2/M3），不删功能。
> 事实依据：`06-架构现状速读.md`（★完整功能清单 28 项）+ 关键点位代码核实（见 §7 备注）。
> 编写时间：2026-06-01。

---

## 1. 一句话定位 + 目标用户画像

**一句话定位**：molesignal 是「**自托管、开源的 Datadog 平替**」——把可观测性（trace / logs / metrics 跨信号关联）的成本从"每月数千美元"降到"$0–$5/月自托管"。本仓库是它的**官方营销官网**：讲清"为什么/省多少钱/怎么 5 分钟跑起来"，并把访客转化为 GitHub star、Cloud 候补、Design Partner。

**目标用户画像**（基于站点现有内容反推，仅用于锚定，不做长篇市调）：

| 画像 | 是谁 | 来官网想要什么 | 站点对应承接 |
|---|---|---|---|
| **P0 主画像：被 Datadog 账单刺痛的工程/平台负责人**（SRE、Platform Eng、技术合伙人） | 中小团队/初创，自建意愿强，对成本敏感 | 「真能省多少？」「自托管难不难？」「成熟度够不够？」 | `/why` 成本计算器+对比表、`/start` 5 分钟安装、`/architecture` 数据路径、GitHub stats/贡献者证明活跃度 |
| **P1：开源关注者 / 早期贡献者** | 关注 building-in-the-open 的开发者 | 看路线图、changelog、blog，决定是否 star / 参与 | `/roadmap` `/changelog` `/blog` `/`首页 Live stats、社区入口 |
| **P1：潜在 Cloud 早期用户 / Design Partner** | 不想自己运维、愿意付费托管或愿深度共创的团队 | 留邮箱进候补 / 申请成为设计伙伴 | `/cloud` 候补表单、`/design-partner` 申请表单、`/pricing` |
| **次要：中文区开发者** | 中文工程师 | 同上，中文阅读 | 全站 ZH 镜像（blog 除外，EN-only） |

---

## 2. 核心价值主张

molesignal 凭什么、用户为什么用/留下：

1. **省钱可量化**：不是口号——`/why` 的 CostCalculator 是真实客户端公式（`lib/cost-formula.ts`），用户拖两个滑块当场算出 "Datadog vs molesignal" 月省金额。这是官网的转化核心钩子。
2. **跨信号关联的差异化体验**：首页 CrossSignalDemo 让访客**在浏览器里就摸到** trace↔logs↔metrics 一键跳转的产品手感（竞品官网多是截图/视频）。
3. **5 分钟可自托管**：`/start` 提供 docker/helm/binary 三种安装路径 + 可一键复制的命令 + OTLP/SQL 示例，把"自建很难"的心理门槛打掉。
4. **开放与可信**："building in the open"——GitHub stars/最近提交/贡献者墙/真实 changelog 实时证明项目活跃；DESIGN_BRIEF 的 "Proof over promise" 原则要求站点不画饼。
5. **零成本运维的产品哲学一致性**：官网自身就是 SSG + $0–$5/月，向目标用户示范"低成本也能高质量"。

> **留下来的理由**：候补/Design Partner 让早期用户进入产品演进闭环；roadmap/changelog/blog/RSS 给关注者持续回访的理由。

---

## 3. 产品范围总览（功能域）

把架构师 28 项清单整理为 **9 个完整功能域**。每个域注明"完全实现"的含义。

| # | 功能域 | 含哪些功能点（架构师清单 #） | "完全实现"意味着什么 |
|---|---|---|---|
| **D1 官网内容与交互** | 首页 Hero(#1)、CrossSignalDemo(#2)、CompareTable(#5)、CostCalculator(#6)、ArchitectureDiagram(#7)、sticky TOC(#8)、Pricing(#27) | 所有营销页内容/交互端到端可用、文案准确、对比与成本数字与现实定价同步、无死链 |
| **D2 候补与转化** | Design Partner 表单(#11)、Cloud 候补表单(#12)、API 限流(#13)、各 CTA | 表单提交**真正落地可触达**（候补入可营销名单、申请有持久化存档）、限流在 serverless 下可靠、防刷有效 |
| **D3 内容系统** | Roadmap(#14)、Changelog(#15)、RSS(#16)、Blog 列表/详情/相关(#17) | 内容可由运营**改内容不改代码**（MDX/CMS）、changelog 反映真实 release、blog 富文本渲染、ZH 策略明确 |
| **D4 快速上手 / 安装** | QuickStart 三 tab(#9)、CodeBlock+复制(#10) | 复制即可跑通——docker/helm/binary 指向**真实存在的产物**，或文案诚实标注现状 |
| **D5 社区与集成证明** | GitHub stats chip(#3)、贡献者墙(#4)、CommunityCallout(#24) | GitHub 数据真实拉取（仓库公开+token）、Discord 等社区链接真实可点 |
| **D6 国际化 i18n** | 语言切换(#21)、全站 EN/ZH | EN/ZH 键结构对齐无缺口、切换保留滚动位置、blog EN-only 策略有友好提示 |
| **D7 SEO & 分析** | sitemap/robots/hreflang(#19)、OG 图(#18)、Plausible 埋点(#26) | SEO 基建物化、OG 图生成、**转化漏斗事件真实打点可观测** |
| **D8 质量与可信度** | 主题切换(#20)、TopNav/Footer/抽屉(#22)、PreReleaseBanner(#23)、a11y(#25)、隐私/条款(#28) | 无障碍达标、无死链、法务页有真实文本、CI/测试守护回归 |
| **D9 基础设施（隐性，承接 D2/D3）** | 持久层、可靠限流、CI/CD、E2E（架构师 §8 建议） | 有数据存储、可靠限流、自动化门禁——D2/D3 "做实"的底座 |

---

## 4. P0 / P1 / P2 功能清单 + 排期规划

**优先级定义**：
- **P0** = 官网可信可用 + 核心转化闭环（候补真入库可触达、死链/画饼修复、限流可靠、法务合规、转化可观测）。不做则"上线即损信任 / 转化数据丢失 / 候补白收"。
- **P1** = 提升运营效率与内容可信（内容不改代码、changelog 真实、社区真实、表单存档）。
- **P2** = 增强与体验优化（MDX 富文本、blog ZH、CMS、动态对比等）。

**里程碑**：
- **M1（上线可信闭环）**= 全部 P0。目标：官网可对外发布且转化数据不丢、候补可触达、无死链画饼、合规。
- **M2（运营可持续）**= 主要 P1。目标：运营能自助更新内容、社区/changelog 真实、CI 守护。
- **M3（体验增强）**= P2。目标：内容系统升级、双语扩展、动态化。

> 说明：标注「✅已实现」的功能点本身**无需开发**，仅纳入对应里程碑的**验收/回归范围**（QA 须验证其在真实环境下不退化），不额外占工时。带「⚠️」的是有真实缺口需开发的项。

### 4.1 P0 清单（→ M1）

| ID | 功能点(架构#) | 用户故事 | 可测验收标准 | 里程碑 |
|---|---|---|---|---|
| **P0-1** | Cloud 候补名单**真入库可触达**(#12) ⚠️红线 | 作为潜在 Cloud 用户，我想留下邮箱进候补，以便产品就绪时**真的能收到通知** | ① 提交后邮箱写入可营销名单（Resend Audience 或等价 list），可导出/批量触达；② founders 仍收到通知；③ 重复邮箱幂等不报错；④ 缺 env 时优雅降级且日志可见；⑤ 成功/失败前端态正确 | M1 |
| **P0-2** | Design Partner 申请**持久化存档**(#11) ⚠️红线 | 作为申请设计伙伴的团队，我想提交申请，以便创始团队**不丢失我的信息**并能跟进 | ① 5 字段 zod 校验通过后落地到持久存储（DB 或 CRM/list），不仅靠邮件；② 蜜罐拦截 bot；③ 成功态切换正确；④ 缺 env 优雅降级+日志 | M1 |
| **P0-3** | API 限流可靠化(#13) ⚠️红线 | 作为站点运营者，我想表单接口防刷，以便 serverless 多实例下限流仍生效 | ① 限流改为跨实例可靠后端（如 Upstash Redis）；② 超阈值返回 429；③ design-partner 5/h、cloud 10/h 阈值保持；④ 单测或脚本验证多次请求触发限流 | M1 |
| **P0-4** | 修复"画饼"死链/占位链接(#22 docs、#24 Discord、#9 helm/binary) ⚠️信任红线 | 作为访客，我点官网任何链接都不该 404/失败，以便信任这个项目（Proof over promise） | ① Footer `docs.molesignal.io`、Discord(`href="#"`)、helm repo/binary URL：要么指向**真实产物**，要么改为诚实文案/禁用态/"coming soon" 不可点；② `lint:links` 全 2xx；③ QuickStart 命令若产物未就绪则明确标注，不让用户"复制即失败" | M1 |
| **P0-5** | 转化漏斗埋点真实打点(#26) ⚠️ | 作为增长负责人，我想 CTA/表单/切换都被埋点，以便上线后能观测转化（LAUNCH.md 要求 48h 内可见转化） | ① `track()` 在关键点位真实调用：候补提交、Design Partner 提交、主要 CTA 点击、语言/主题切换、复制命令；② prod+配域名时 Plausible 收到事件；③ 事件命名规范文档化 | M1 |
| **P0-6** | 隐私 / 条款真实法务文本(#28) ⚠️合规红线 | 作为留下邮箱的用户，我想看到真实隐私政策，以便知道我的数据怎么被处理 | ① `/privacy` `/terms` 替换占位为真实文本（覆盖邮箱收集、Plausible 无 cookie 分析、第三方 Resend）；② EN/ZH 双语；③ 更新日期准确 | M1 |
| **P0-7** | 关键路径 E2E + CI 门禁(架构§7.7) ⚠️ | 作为团队，我想核心路径有自动化测试和 CI，以便迭代不回归（当前零测试零 CI） | ① GitHub Actions 跑 `pnpm check`+`build`+`lint:links`+`lint:quickstart`；② Playwright E2E 覆盖：两表单端到端、locale 切换、复制按钮、内链 2xx；③ CI 红则阻断合并 | M1 |
| **P0-8** | 成本计算器/对比表数字校准(#5#6) | 作为评估成本的工程负责人，我想看到**当前准确**的 Datadog 定价对比，以便信任省钱结论 | ① 核对 `lib/cost-formula.ts` 与 `lib/compare-data.ts` 引用的 Datadog 定价为最新公开值；② 标注定价快照日期/来源；③ 计算结果合理无溢出 | M1 |
| **P0-9** | GitHub stats/changelog 真实性兜底(#3#15) | 作为关注者，我想看到真实的 star/提交/release，以便判断项目活跃度（building in the open 卖点） | ① 确认 `molesignal/molesignal` 仓库公开状态与 token 配置；② 公开则展示真实数据，未公开则回退态文案不误导（不假装有数据）；③ changelog 回退静态时不冒充 release | M1 |

✅ **纳入 M1 验收（已实现、仅回归不开发）**：#1 Hero、#2 CrossSignalDemo、#7 架构图、#8 TOC、#10 CodeBlock复制、#18 OG图、#19 sitemap/robots/hreflang、#20 主题切换、#21 语言切换、#23 PreReleaseBanner、#25 a11y、#27 Pricing 静态、#16 RSS。

### 4.2 P1 清单（→ M2）

| ID | 功能点(架构#) | 用户故事 | 可测验收标准 | 里程碑 |
|---|---|---|---|---|
| **P1-1** | 内容可不改代码更新——MDX/CMS 接线(#17#14#15) | 作为运营，我想改 blog/changelog/roadmap 不用改 TS 代码发版，以便快速更新内容 | ① blog/changelog/roadmap 至少一类迁到 MDX（依赖已装）或轻 CMS（Velite/Keystatic）；② 新增/编辑内容无需改组件代码；③ 现有内容迁移无丢失；④ 构建通过 | M2 |
| **P1-2** | Blog 富文本渲染(#17) | 作为读者，我想 blog 正文有标题/代码块/列表渲染，以便正常阅读（当前是纯文本 body） | ① body 经 MDX/Markdown 渲染为富文本；② 代码块复用 Shiki 高亮；③ 相关文章按 tag 仍工作 | M2 |
| **P1-3** | 贡献者墙真实数据(#4) | 作为开源关注者，我想看到真实贡献者头像，以便感知社区规模 | ① 仓库公开+token 下真实拉取 `/contributors`；② 私有/失败回退空态不报错；③ 头像/链接正确 | M2 |
| **P1-4** | 社区入口真实化(#24) | 作为想加入社区的开发者，我想点社区入口进入真实 Discord/讨论区 | ① CommunityCallout 指向真实邀请链接（若 P0-4 未一并解决）；② 文案与现状一致 | M2 |
| **P1-5** | 表单提交结构化看板/导出(#11#12 增强) | 作为创始团队，我想在一个地方查看/导出所有候补与申请，以便做增长运营 | ① 提交数据可在 DB/CRM 后台查看或一键导出 CSV；② 字段完整含来源/时间戳 | M2 |
| **P1-6** | QuickStart 产物就绪后切换为可跑通(#9) | 作为自托管用户，我想复制的安装命令真的能跑通，以便 5 分钟上手 | ① 当 helm repo/binary release 真实就绪时移除"coming soon"标注；② `lint:quickstart` 与父仓库 README 同步通过；③ 命令冒烟可执行 | M2 |
| **P1-7** | Changelog 接入真实 Release 流程(#15) | 作为关注者，我想 changelog 自动反映真实发版，以便了解最新进展 | ① 仓库有 Release 时 ISR 拉取展示；② RSS 同源同步；③ 版本锚跳转正确 | M2 |

### 4.3 P2 清单（→ M3）

| ID | 功能点(架构#) | 用户故事 | 可测验收标准 | 里程碑 |
|---|---|---|---|---|
| **P2-1** | Blog 中文支持(#17 i18n#6) | 作为中文读者，我想读中文 blog，以便母语阅读（当前 EN-only 友好提示） | ① `/zh/blog*` 渲染中文内容或明确保留 EN-only 决策（需用户拍板，见 §7）；② 若做：sitemap 补 hreflang | M3 |
| **P2-2** | CompareTable 动态化(#5) | 作为评估者，我想对比数据可由运营更新，以便始终准确 | ① 对比数据迁入内容系统/数据源；② 改数据不改组件 | M3 |
| **P2-3** | CrossSignalDemo 接真实查询(#2) | 作为评估者，我想 demo 展示真实查询而非写死样本，以便更可信 | ① demo 可对接真实/沙箱查询后端（依赖产品后端就绪，跨项目，需用户决策）；② reduce-motion 守卫保留 | M3 |
| **P2-4** | 内容运营工作流文档/模板(#D3) | 作为新运营，我想有内容更新指南，以便快速上手 | ① 提供 blog/changelog/roadmap 更新文档与模板 | M3 |

---

## 5. 关键用户流程（供 UX 承接）

**主路径 A — 访客浏览→理解→上手→转化（核心漏斗）**
1. 落地 `/` Hero，看到定位 + Live stats(GitHub) + CrossSignalDemo 摸到产品手感。
2. 点 "Why" → `/why`：拖动 CostCalculator 双滑块，看到月省金额（**转化钩子**）；看 CompareTable / 5 场景。
3. 点 "Architecture" → `/architecture`：交互数据路径图 + sticky TOC 理解技术可行性。
4. 点 "Start" → `/start`：选 docker/helm/binary tab，一键复制命令（CodeBlock+toast）→ 自托管上手。
5. 转化分叉：
   - 不想自运维 → `/cloud` 留邮箱进候补（**P0-1 真入库**）→ 成功态。
   - 想深度共创 → `/design-partner` 填 5 字段申请（**P0-2 存档**）→ 成功态。
   - 认可项目 → GitHub star（chip 链接）。
   - 每一步关键动作触发埋点（**P0-5**）。

**主路径 B — 内容消费（关注者回访）**
1. `/roadmap`：Now/Next/Later/Done，tab 与 URL hash 同步（✅已实现）。
2. `/changelog`：版本变更 + 侧栏锚 + RSS 订阅入口（M2 接真实 release）。
3. `/blog` → `/blog/[slug]`：读文章 + 相关文章（M2 富文本）。

**主路径 C — 多语言**
1. 任意页点 LocaleSwitcher EN↔ZH，保留滚动位置。
2. blog 例外：`/zh/blog*` 显示友好不可用提示并引导回 EN（P2-1 待定）。

**辅助流程**：主题明暗切换（防闪烁）、PreReleaseBanner 关闭（7 天重现）、移动端抽屉导航、SkipToContent/ScrollToTop。

---

## 6. 成功指标

**北极星指标（NSM）**：**合格转化数 = Cloud 候补提交数 + Design Partner 申请提交数**（且**真正入库可触达**——只发邮件不入库不计入，呼应 P0-1/P0-2）。这是官网存在的核心商业目的。

**关键漏斗指标**（依赖 P0-5 埋点闭环）：
- 落地 → `/why` 点击率；CostCalculator 交互率（拖动滑块）。
- `/why`/`/start` → 转化页(`/cloud`/`/design-partner`)点击率。
- 转化页访问 → 表单提交转化率（候补 / 申请各算）。
- `/start` 命令复制率（自托管意向代理指标）。
- GitHub star 增量、changelog/RSS 订阅、blog 阅读。

**质量 / 可信度指标（就绪维度）**：
- **已设计功能实现完成度**：架构师 28 项中"端到端真实可用"占比从当前 ≈43% 提升——M1 后 P0 全绿（核心转化+合规+可信闭环可用），M2 后内容系统/社区真实，M3 趋近 100%。
- 死链数 = 0（`lint:links` 全 2xx）；画饼链接 = 0。
- a11y 对比度门禁通过（`a11y:contrast`）；i18n parity 通过；CI 全绿。
- LAUNCH.md 目标：上线 48h 内观测到 ≥1 条真实转化事件（验证 P0-5 闭环）。

---

## 7. 开放问题 / 假设（需架构师与用户决策）

> 这些直接影响架构选型与就绪标准，建议主管转用户拍板。

1. **是否引入真实后端 / DB？**（影响 P0-2、P1-5）当前零 DB。轻量优先建议：候补/申请先进 **Resend Audience + 轻存储（Neon/Supabase/Vercel Postgres）**。**需用户定**：是否接受引入 DB？还是仅用邮件营销 list（候补可触达即可，申请暂不结构化）？—— 决定 P0-2 的实现深度。
2. **候补名单存哪？**（P0-1 核心）建议 Resend Audiences（最轻，候补=可触达 list）。需用户确认是否已有 Resend 账号/付费档支持 Audiences，或选 Buttondown/Plunk。
3. ~~**限流后端**（P0-3）：Upstash Redis 需开账号~~ → **已决策（2026-06-01）**：采用 Upstash 直连（非 Vercel KV / 非 Turnstile）；本期不提供密钥，代码就绪 + 缺 env 内存兜底降级即达本期就绪，真实跨实例限流延后复验。见 ISSUE-1。
4. **docs 站本期是否建？**（P0-4）`docs.molesignal.io` 当前不存在。**需用户定**：本期产出 docs 站，还是先把 Footer 链接改为诚实态（禁用/coming soon/指向 GitHub README）？后者更快达成"无死链"。
5. **Discord / helm chart / binary release 等外部产物本期是否补齐？**（P0-4、P1-6）这些是跨仓库/跨团队产物。**需用户定**每一项：本期产出真实产物，还是先诚实标注？建议 M1 先诚实标注（不画饼），M2 产物就绪后切换。
6. **GitHub 仓库 `molesignal/molesignal` 是否已公开 + 有 Release？**（P0-9、P1-3、P1-7）决定 stats/贡献者墙/changelog 是真实数据还是回退态。需用户提供仓库状态与是否配置 `GITHUB_TOKEN`。
7. **Blog 是否支持中文？**（P2-1）DESIGN_BRIEF 原标记 EN-only "Out of Scope"。需用户确认是否本期改变该决策。
8. **CrossSignalDemo 是否接真实查询？**（P2-3）依赖产品后端，属跨项目重活，默认假设**保持写死演示样本**（标注为 demo 即可），除非用户要求。
9. **MDX vs 轻 CMS 选型**（P1-1）：MDX 依赖已装、接线最快；CMS（Keystatic/Velite）更利于非技术运营。需架构师在 06 给出建议，用户确认运营是否需要无代码编辑。
10. **法务文本来源**（P0-6）：privacy/terms 真实文本需法务/用户提供或基于模板生成后用户审核。需用户确认来源。

**关键已核实事实（修正架构师存疑项）**：
- ✅ **Roadmap tab 与 URL hash 同步已实现**（`components/roadmap-list.tsx` 监听 `hashchange`+读 `window.location.hash`）——架构师 #14 的存疑点确认为"已实现"，无需开发，仅纳入回归。
- ⚠️ **埋点点位完全未铺设**（比架构师 #26 "需核实"更严重）：`lib/analytics.ts` 导出了 `track()`，但全仓库 `app/`+`components/` **零调用**、零 `data-analytics`/`plausible-event` 属性。即 Plausible 即便上线也只有 PV、**拿不到任何转化事件**。故 P0-5 是必须的真实开发项，而非"核实"。

---

## 8. 迭代细化记录

> PM 在迭代中对 P0/P1 工单做的需求细化要点回写于此，保持 PRD 与 backlog 工单一致。

### ISSUE-1 · 可靠限流后端（Upstash）— T11 / P0-3（2026-06-01）
- **承接 PRD**：§4.1 P0-3「API 限流可靠化」，红线 full 道，是 T01/T02 表单真入库的前置安全闸门。
- **细化结论**：`lib/rate-limit.ts` 改 async + `@upstash/ratelimit`（滑动窗口），两 route handler 改 `await`；阈值不变（cloud 10/h、dp 5/h）；429 + 非负整数 `Retry-After`。
- **降级与容错**：缺 `UPSTASH_*` env → 内存 Map 兜底（warn 仅一次）；Upstash 运行时故障 → **fail-open 放行 + warn**，表单可用性优先，不返 5xx。
- **明确不做**：不引 Vercel KV / 不引人机校验 / 不改阈值与 429 结构 / 不做限流指标上报。
- **密钥政策**：本期不提供密钥，按"代码就绪 + 降级路径客观验证"判过；真实跨实例限流（AC8）延后复验。
- 完整用户故事与 AC1–AC8 见 `backlog/ISSUE-1.md`。

---

**产出路径**：`/Users/ukulele/claude-project/self-code/workspace/molesignal-website/03-产品PRD.md`
