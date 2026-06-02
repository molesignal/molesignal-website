---
id: ISSUE-28
type: feature
title: 全站可信度终验+转化埋点闭环E2E
status: in_progress
priority: P1
assignee: fullstack-engineer
created: 2026-06-02
updated: 2026-06-02
---

## 描述
对应就绪标准: M3 末条「全站可信度终验」(PRD §6 质量指标终态 / LAUNCH.md 上线48h≥1条真实转化事件埋点闭环)——这是 READINESS 唯一未勾项(30/31)，全绿即触发引擎 DONE。

本期降级政策(用户决策2026-06-01): 不提供任何外部密钥(Plausible域名/Resend入库留空)。本项按「代码就绪 + 缺env优雅降级路径经QA客观验证正确」即判[x]，真实外部联调延后。本工单做的是【聚合终验】而非新功能，原则上零生产代码改动(若发现缺陷另行修复)。

验收标准(AC):
AC1 死链=0: pnpm lint:links 全2xx(0/N失败)，QA现场复跑贴输出。
AC2 画饼链接=0: 全站无真实 href="#" 占位(注释除外)，给出grep/扫描证据。
AC3 无障碍: pnpm a11y:contrast 全过AA(26/26)，贴输出。
AC4 质量门全绿: pnpm check(tsc0/eslint0/i18n EN=ZH parity)+pnpm build 双 rc=0；CI ci.yml 五道闸本地同序复跑全绿。
AC5 全量回归: pnpm test:e2e 全PASS、零退化(贴 passed 计数)。
AC6 转化埋点闭环端到端(降级验法): 用真实浏览器E2E证明——两表单(cloud-waitlist/design-partner)提交在 API 2xx 后确实触发对应 Plausible 转化事件 track()(spy window.plausible 验事件名+props 规范)，且 429/500/蜜罐路径不误触发；此即 LAUNCH.md「上线48h≥1条真实转化」闭环的代码就绪半程客观验证。
AC7 诚实标注: 在 READINESS.md 该项备注中明确标注「真实Plausible上报+Resend入库的转化闭环联调延后补密钥复验」，不得伪称已验真实转化。
AC8 收尾: 全部通过后由 orchestrator 将 READINESS.md 第74行改 [x] 并回写 READINESS_SCORE: 31/31(或对应满分)，触发 DONE。

红线判定: 不动数据模型/接口契约/核心交易逻辑，本质是聚合验证+文档，建议 light 道(开发→代码审查→独立QA)；若验证中发现需改埋点接线则升 full。三环(开发→审查→独立QA)不可省。

## 需求说明

聚合终验工单：不开发新功能，对全站做上线前可信度终验，并对「转化埋点闭环」做降级验法的端到端客观验证。原则零生产代码改动；发现缺陷才另行修复。本期降级政策（用户决策 2026-06-01）：不提供任何外部密钥（Plausible 域名 / Resend 入库留空），按「代码就绪 + 缺 env 优雅降级路径经 QA 客观验证正确」即判 [x]，真实外部联调延后补密钥复验。

## 验收标准

见顶部 AC1–AC8。

## 开发自测（fullstack，2026-06-02，分支 feature/ISSUE-28）

**结论：零缺陷、零生产代码改动。全部 AC 代码就绪半程客观达成；AC8 收尾（翻 [x] + 回写 31/31 → DONE）移交 orchestrator 在独立 QA PASS 后执行。**

环境：node v23.6.1 / pnpm 11.5.0，生产 `next build` + `next start`，真实 Chromium。

| AC | 验法 | 结果 |
|---|---|---|
| AC1 死链=0 | `SITE=http://localhost:3000 pnpm lint:links`（对 `next start` 生产服务器爬全站内链） | **Failures: 0/33**，全 2xx ✅ |
| AC2 画饼链接=0 | `grep -rn 'href="#"' app components`（tsx/ts） | 仅 5 处命中，**全部在注释/docblock 内**（community-callout.tsx、layout/footer.tsx 说明"绝不用 href=#，改用 disabled 'launching soon' 态"），**0 处真实占位** ✅ |
| AC3 无障碍 AA | `pnpm a11y:contrast` | **Failures: 0/26**（target met = 26），全对 WCAG AA ✅ |
| AC4 质量门全绿 | `pnpm check`（tsc + eslint + a11y + i18n）+ `pnpm build` + CI 五道闸本地同序复跑 | tsc **0**、eslint **0**、a11y **26/26**、i18n parity **EN 518 = ZH 518 OK**；`build` 全路由清单产出 rc=0。CI 同序：`pnpm check`✅ → `pnpm lint:quickstart`（0/5，跨仓 README 缺失按设计 skip 4）✅ → `pnpm test:changelog`（5/5 真实-release 回退不退化）✅ → `pnpm build`✅ → `pnpm lint:links`（0/33）✅ → `pnpm test:e2e`✅ ✅ |
| AC5 全量回归 | `pnpm test:e2e`（playwright，自启 :3210 生产服务器） | **106 passed (56.6s)，0 failed，零退化** ✅ |
| AC6 转化埋点闭环（降级验法） | `pnpm exec playwright test tests/e2e/analytics-funnel.spec.ts` —— spy `window.plausible` 验事件名+props 规范 | **14 passed**。两表单 2xx 后确触发对应 `track()`：`waitlist_submit`（#4，props=null 无 PII）、`design_partner_submit`（#7，props=null）；**误触发防护全过**：429 不触发（#5）、500 不触发（#8）、蜜罐不触发且不发 API（#6）。代码侧 `lib/analytics.ts:30-36` 印证降级路径正确——`window.plausible` 未注入时 `track()` 直接 return 空转、且 try/catch 永不破页。即 LAUNCH.md「上线48h≥1条真实转化」闭环的**代码就绪半程**客观验证 ✅ |
| AC7 诚实标注 | 见下方「给 orchestrator 的 AC8 收尾指令」中的备注原文 | 已拟标注文本，待 AC8 写入 READINESS ✅ |
| AC8 收尾 | 翻 READINESS.md 第74行 [x] + 回写 `READINESS_SCORE: 31/31` → DONE | **移交 orchestrator**，须在独立 QA PASS 后执行（light 道修复者不自判通过） ⏳ |

发现缺陷数：**0**。生产代码改动：**0**（AC6 所需「spy window.plausible 验 track() 闭环」由既有 `tests/e2e/analytics-funnel.spec.ts` 14 用例完整覆盖，无需新增）。改动文件：仅本工单 `backlog/ISSUE-28.md`（验证留痕）。

### 给 orchestrator 的 AC8 收尾指令（独立 QA PASS 后执行）
将 READINESS.md 第74行由 `[ ]` 改 `[x]`，并在其后追加 closure 备注，**须含如下诚实标注（AC7）**：

> ✅ ISSUE-28 closed · QA PASS 2026-06-02（light 道：聚合终验，零生产代码改动）。死链 `lint:links` **0/33**、画饼链接 0（`href="#"` 仅注释内 5 处）、`a11y:contrast` **26/26 AA**、`pnpm check`(tsc0/eslint0/i18n 518=518)+`build` 双 rc=0、CI 五道闸本地同序全绿、`test:e2e` **106 passed 零退化**；转化埋点闭环按**降级验法**——`analytics-funnel.spec.ts` 14 用例 spy `window.plausible` 证两表单 2xx 后确触发 `waitlist_submit`/`design_partner_submit`（props=null 无 PII）、429/500/蜜罐路径不误触发。**真实 Plausible 上报 + Resend 入库的转化闭环联调延后补密钥复验，本期未验真实转化，不伪称已验。** 全绿 → `READINESS_SCORE: 31/31` → 触发 DONE。

## 处理记录
- 2026-06-02 13:01:22 工单创建（feature / P1）
- 2026-06-02 13:02:04 set assignee=fullstack-engineer
- 2026-06-02 13:02:04 set priority=P1
- 2026-06-02 13:02:04 set status=triaged
- 2026-06-02 13:02:04 LANE: light
- 2026-06-02 13:02:04 EXTRA_ROLES: none
- 2026-06-02 13:02:24 set status=in_progress
- 2026-06-02 fullstack 终验完成：AC1–AC6 全部客观通过（lint:links 0/33 · a11y 26/26 · check tsc0/eslint0/i18n518=518 · build rc0 · CI五闸同序全绿 · test:e2e 106 passed · analytics-funnel 14 passed）；零缺陷、零生产代码改动。AC8 收尾移交 orchestrator 于独立 QA PASS 后执行。
