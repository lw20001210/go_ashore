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
scripts         打包、部署、SMTP 配置脚本
```

## 本地开发

```bash
npm install
cp apps/api/.env.example apps/api/.env
docker compose up db -d
npm run prisma:migrate --workspace=api
npm run dev
```

访问：

- Web: http://localhost:3000
- API: http://localhost:3001/api/health
- Nginx 模拟单域名: http://localhost:8080

包管理统一使用 **npm**（根目录 `package-lock.json`）。

## 环境变量：本地 vs 服务器（重要）

项目有 **两份** `.env`，用途不同，**不要混用**：

| | **本地开发** `npm run dev` | **服务器 Docker 生产** |
|---|---|---|
| **文件路径** | `apps/api/.env` | 项目根目录 `.env`（与 `docker-compose.yml` 同级） |
| **模板** | `apps/api/.env.example` | `.env.example` |
| **谁读取** | Nest 直接读 `apps/api/.env` | `docker compose` 注入 api 容器 |
| **数据库地址** | `localhost:5432` | `db:5432`（容器内网） |
| **COOKIE_SECURE** | `false`（HTTP 本地） | `false`（当前 HTTP 部署） |
| **APP_PUBLIC_URL** | `http://localhost:3000` | `http://www.lwywywl.icu` |
| **SMTP（忘记密码）** | 配在 `apps/api/.env` | 配在 **根目录** `.env` |

### 常见困惑

1. **本地改了 SMTP，线上忘记密码仍不可用**  
   你只改了 `apps/api/.env`；服务器要改 **根目录** `/opt/shangan-schedule/.env`，然后重启 api 容器。

2. **本地能登录，线上 401**  
   本地与线上是 **两套数据库**，账号密码不互通。

3. **`tar` 包里有没有 `.env`？**  
   没有。`pack:deploy` 刻意排除 `.env`；服务器上的 `.env` 需单独维护，解压不会覆盖。

4. **SMTP 配置命令写哪？**  
   - 本地：`npm run configure:smtp`（默认写 `apps/api/.env`）  
   - 服务器：`./scripts/configure-smtp.sh /opt/shangan-schedule/.env`

### 最少要配的变量

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | PostgreSQL 连接串 |
| `JWT_SECRET` | 至少 32 字符随机串（`openssl rand -base64 32`） |
| `DEEPSEEK_API_KEY` | 可选；未配置时用本地 fallback 计划 |
| `SMTP_*` | 忘记密码发验证码；不配则无法用邮件重置 |

## API 测试

需本地 PostgreSQL 已启动（`docker compose up db -d`）且已 migrate：

```bash
npm run test:api
```

覆盖：登录 Cookie、忘记密码、AI 每日配额、云端 sync merge。

## Docker 本地（模拟生产）

```bash
cp .env.example .env
docker compose up --build
# http://localhost:8080
```

## 生产部署

### 一条命令（本地执行）

首次在服务器准备好 Docker、根目录 `.env` 后：

```bash
cp scripts/deploy.env.example scripts/deploy.env   # 按需改 DEPLOY_HOST 等
npm run deploy
```

流程：`pack` → `scp web.tar.gz` → 远程 `scripts/deploy-server.sh`（`build api web` + `up -d` + 健康检查）。  
数据库迁移由 api 容器启动时自动执行 `prisma migrate deploy`。

### 分步（等价）

```bash
npm run pack:deploy
scp web.tar.gz root@8.140.58.52:/tmp/
ssh root@8.140.58.52 'mkdir -p /opt/shangan-schedule && tar -xzf /tmp/web.tar.gz -C /opt/shangan-schedule && bash /opt/shangan-schedule/scripts/deploy-server.sh'
```

详细首次装机见 [`docs/deploy.md`](docs/deploy.md)（阿里云 `8.140.58.52` + `www.lwywywl.icu`）。  
SMTP 说明见 [`docs/smtp-setup.md`](docs/smtp-setup.md).
