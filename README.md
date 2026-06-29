# 上岸日程

面向在职考公人群的 AI 每日笔试备考计划器。用户填写考试日期、每日可用时间和薄弱科目后，系统会通过 DeepSeek 生成今日学习计划，并在晚间提供 AI 复盘。

## 技术栈

- Web：Next.js + React + TypeScript + Tailwind + MobX + PWA
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
cp apps/api/.env.example apps/api/.env
docker compose up db -d
npm run prisma:migrate --workspace=api
npm run dev
```

按需编辑 `apps/api/.env`（数据库、JWT、DeepSeek Key）。包管理统一使用 **npm**（根目录 `package-lock.json`）。

访问：

- Web: http://localhost:3000
- API: http://localhost:3001/api/health
- Nginx 模拟单域名: http://localhost:8080（推荐；Docker 环境下勿直连 3000 端口访问 API）

## Docker 启动

```bash
cp .env.example .env
docker compose up --build
```

生产部署见 `docs/deploy.md`（已适配阿里云 `8.140.58.52` + 域名 `www.lwywywl.icu`）。

## 环境变量

| 场景 | 配置文件 |
|------|----------|
| 本地 `npm run dev` | `apps/api/.env`（见 `apps/api/.env.example`） |
| Docker Compose | 项目根目录 `.env`（见 `.env.example`） |

至少需要：

- `DATABASE_URL`
- `JWT_SECRET`
- `DEEPSEEK_API_KEY`（可选，未配置时使用本地 fallback）

未配置 DeepSeek Key 时，后端会使用本地 fallback 计划和复盘，方便开发调试。
