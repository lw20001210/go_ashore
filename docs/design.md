# 上岸日程设计摘要

上岸日程是面向在职考公人群的 AI 每日笔试备考计划器。V1 聚焦行测五模块和申论，通过考试日期、每日可用时间和薄弱科目生成可执行的今日计划，并支持晚间 AI 复盘。

## 核心流程

1. 用户完成 onboarding：考试日期、国考/省考、工作日与周末可用分钟数、薄弱科目。
2. DeepSeek 生成 2-4 个今日任务，总时长不超过当天可用时间。
3. 用户按任务学习并勾选完成。
4. 晚上提交卡点，AI 输出简短复盘和明日建议。
5. 游客数据保存在 localStorage；登录后合并到 PostgreSQL。

## 技术架构

- 前端：Next.js + React + TypeScript + Tailwind，移动端优先，支持 PWA。
- 后端：Nest.js + Prisma + PostgreSQL，`/api/*` 全局前缀。
- 认证：JWT access/refresh token，httpOnly Cookie。
- AI：DeepSeek OpenAI 兼容接口，仅后端持有 API Key。
- 部署：Docker Compose 单域名，Nginx 将 `/api/*` 转发到 Nest，其余流量转发到 Next。

## V2 方向

- 面试模块
- 申论 AI 深度批改
- 行测错题本
- 微信登录
- 推送提醒
