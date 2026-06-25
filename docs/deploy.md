# 部署说明

本文档说明如何在自有服务器上用 Docker Compose 部署上岸日程。

## 前置条件

- 一台 Linux 服务器
- 域名 `lwywywl.icu`，解析到服务器公网 IP `8.140.58.52`
- Docker 与 Docker Compose
- DeepSeek API Key

## 首次部署

```bash
git clone <your-repo-url> shangan-schedule
cd shangan-schedule
cp .env.example .env
```

在域名服务商控制台添加 A 记录，将 `lwywywl.icu` 指向 `8.140.58.52`。

编辑 `.env`：

```env
DB_USER=exam
DB_PASSWORD=change-to-a-strong-password
DB_NAME=shangan
DATABASE_URL=postgresql://exam:change-to-a-strong-password@db:5432/shangan
JWT_SECRET=change-to-a-random-32-char-secret
DEEPSEEK_API_KEY=sk-your-key
NODE_ENV=production
```

启动：

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

验证：

```bash
curl http://localhost/api/health
curl http://8.140.58.52/api/health
curl http://lwywywl.icu/api/health
```

期望返回：

```json
{"status":"ok"}
```

## 单域名路由

- `https://lwywywl.icu/` 访问 Next.js 前端。
- `https://lwywywl.icu/api/*` 访问 Nest.js 后端。

Nginx 配置位于 `docker/nginx/nginx.conf`，其中 `/api/` 已关闭 buffering，用于支持 AI 复盘流式输出。

## HTTPS

可以在服务器上用 Certbot 签证书，并把证书目录挂载到 `./certbot/conf`。如果不想维护 Nginx 证书配置，也可以把当前 Nginx 替换为 Caddy，由 Caddy 自动申请证书。

## 数据备份

PostgreSQL 数据存在 Docker volume `pgdata`。建议定期备份：

```bash
docker compose exec db pg_dump -U exam shangan > backup.sql
```

## 更新部署

```bash
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```
