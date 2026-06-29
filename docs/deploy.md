# 阿里云部署说明

本文档针对：

- **公网 IP**：`8.140.58.52`
- **域名**：`www.lwywywl.icu`
- **部署方式**：Docker Compose + Nginx 反向代理

上线后访问：

- 前端：`https://www.lwywywl.icu/`
- API：`https://www.lwywywl.icu/api/health`

---

## 一、阿里云控制台准备

### 1. 安全组（必做）

在 ECS 实例的安全组 **入方向** 放行：

| 端口 | 用途 |
|------|------|
| 22 | SSH 登录 |
| 80 | HTTP（申请证书 + 跳转 HTTPS） |
| 443 | HTTPS |

来源可填 `0.0.0.0/0`（生产环境可按需收紧）。

### 2. 域名解析

在域名服务商（`lwywywl.icu`）添加 **A 记录**：

| 主机记录 | 记录类型 | 记录值 |
|----------|----------|--------|
| `www` | A | `8.140.58.52` |

当前部署只使用 `www.lwywywl.icu`，无需配置根域名 `@`。

解析生效后，在本地验证：

```bash
ping www.lwywywl.icu
# 或
dig +short www.lwywywl.icu
```

应返回 `8.140.58.52`。

---

## 二、服务器安装 Docker

SSH 登录服务器（示例）：

```bash
ssh root@8.140.58.52
```

安装 Docker 与 Compose 插件（Ubuntu / Debian 示例）：

```bash
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker
docker compose version
```

---

## 三、拉代码并配置环境变量

```bash
cd /opt
git clone <你的仓库地址> shangan-schedule
cd shangan-schedule
cp .env.example .env
```

编辑 `.env`（**务必修改密码和密钥**）：

```env
DB_USER=exam
DB_PASSWORD=你的强密码
DB_NAME=shangan
DATABASE_URL=postgresql://exam:你的强密码@db:5432/shangan

JWT_SECRET=用下面命令生成
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

DEEPSEEK_API_KEY=sk-你的DeepSeek密钥
DEEPSEEK_BASE_URL=https://api.deepseek.com

NODE_ENV=production

# 首次部署保持 http，证书就绪后再改 https
NGINX_CONF=./docker/nginx/nginx.http.conf
```

生成 JWT 密钥：

```bash
openssl rand -base64 32
```

---

## 四、首次启动（HTTP）

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

查看状态：

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f api
```

验证（在服务器上）：

```bash
curl http://localhost/api/health
curl http://www.lwywywl.icu/api/health
```

期望返回：`{"status":"ok"}`

浏览器访问：`http://www.lwywywl.icu`（此时为 HTTP，登录 Cookie 在 `NODE_ENV=production` 下需要 HTTPS 才稳定，建议尽快完成下一步）。

---

## 五、申请 HTTPS 证书（Let's Encrypt）

确保上一步 HTTP 已能访问，且域名已解析到本机。

```bash
chmod +x scripts/init-ssl.sh
./scripts/init-ssl.sh www.lwywywl.icu 你的邮箱@example.com
```

成功后，修改 `.env`：

```env
NGINX_CONF=./docker/nginx/nginx.https.conf
```

重启 Nginx：

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate nginx
```

验证 HTTPS：

```bash
curl https://www.lwywywl.icu/api/health
```

浏览器访问：`https://www.lwywywl.icu`

### 证书续期（建议加 crontab）

```bash
0 3 1 * * cd /opt/shangan-schedule && docker run --rm \
  -v $(pwd)/certbot/conf:/etc/letsencrypt \
  -v $(pwd)/certbot/www:/var/www/certbot \
  certbot/certbot renew --webroot -w /var/www/certbot && \
  docker compose -f docker-compose.yml -f docker-compose.prod.yml exec nginx nginx -s reload
```

---

## 六、架构说明

```
用户浏览器
    │
    ▼
Nginx (:80 / :443)  www.lwywywl.icu
    ├── /api/*  ──►  api:3001  (NestJS)
    └── /*      ──►  web:3000  (Next.js standalone)
                           │
                      db:5432 (PostgreSQL，仅内网)
```

- 生产环境 **不要** 直接暴露 3000 / 3001 / 5432 到公网（`docker-compose.prod.yml` 已关闭这些端口映射）。
- 统一从 Nginx 80/443 入口访问。

---

## 七、更新部署

```bash
cd /opt/shangan-schedule
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

---

## 八、数据备份

PostgreSQL 数据在 Docker volume `pgdata`：

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T db \
  pg_dump -U exam shangan > backup-$(date +%F).sql
```

---

## 九、常见问题

### 1. `curl www.lwywywl.icu` 超时

- 检查阿里云安全组是否放行 80/443
- 检查域名 A 记录是否指向 `8.140.58.52`
- 服务器上 `curl localhost/api/health` 若正常，则是网络/解析问题

### 2. 登录后立刻掉线

- 确认已启用 HTTPS（`NGINX_CONF=nginx.https.conf`）
- 生产环境 Cookie 带 `Secure`，必须走 `https://`

### 3. AI 复盘无输出

- 检查 `.env` 中 `DEEPSEEK_API_KEY` 是否有效
- `docker compose ... logs api` 查看报错

### 4. 构建很慢或 OOM

- 建议 ECS 至少 **2 核 4G**
- 首次 `--build` 会编译 Next.js，需等待数分钟

---

## 十、本地模拟生产（可选）

在本机用 8080 端口模拟单域名（无需证书）：

```bash
docker compose up --build
# 访问 http://localhost:8080
```
