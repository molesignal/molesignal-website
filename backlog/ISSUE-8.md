---
id: ISSUE-8
type: feature
title: [T01] Cloud候补真入库(Resend Audience)
status: open
priority: P0
assignee: 
created: 2026-06-01
updated: 2026-06-01
---

## 描述
模块:Cloud候补真入库(Resend Audience) | 角色:backend | 依赖:T11 | 里程碑:M1 | 验收:新增resend-audiences.ts addContact(幂等409视成功);/api/cloud-waitlist入CLOUD_AUDIENCE+发通知;重复不报错;缺env降级仍200+warn;2xx后触发waitlist_submit。红线full道 | 详见 07-开发任务拆分.md(T01) 与 06-技术架构.md/READINESS.md

## 需求说明


## 验收标准


## 处理记录
- 2026-06-01 23:30:28 工单创建（feature / P0）
