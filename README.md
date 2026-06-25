# 上岸日程

面向在职考公人群的 AI 每日笔试备考计划器。用户填写考试日期、每日可用时间和薄弱科目后，系统会通过 DeepSeek 生成今日学习计划，并在晚间提供 AI 复盘。

## 技术栈

- Web：Next.js + React + TypeScript + Tailwind + Zustand + PWA
- API：Nest.js + Prisma + PostgreSQL + JWT Cookie
- AI：DeepSeek OpenAI 兼容接口
- 部署：Docker Compose + Nginx 单域名分流

## 项目结构

```text
apps/web        Next.js 前端
apps/api        Nest.js 后端
packages/shared 共享 TypeScript 类型
docker          Dockerfile 与 Nginx 配置
docs            设计与部署文档
```

## 本地开发

```bash
npm install
cp .env.example .env
docker compose up db -d
npm run prisma:migrate --workspace=api
npm run dev
```

访问：

- Web: http://localhost:3000
- API: http://localhost:3001/api/health
- Nginx 模拟单域名: http://localhost:8080

## Docker 启动

```bash
docker compose up --build
```

生产部署见 `docs/deploy.md`。

## 环境变量

参考 `.env.example`，至少需要：

- `DATABASE_URL`
- `JWT_SECRET`
- `DEEPSEEK_API_KEY`

未配置 DeepSeek Key 时，后端会使用本地 fallback 计划和复盘，方便开发调试。
