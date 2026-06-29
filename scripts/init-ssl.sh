#!/usr/bin/env bash
# 用途：在服务器上为 www.lwywywl.icu 申请 Let's Encrypt 证书（需先 HTTP 部署成功）
set -euo pipefail

DOMAIN="${1:-www.lwywywl.icu}"
EMAIL="${2:-}"

if [[ -z "$EMAIL" ]]; then
  echo "用法: ./scripts/init-ssl.sh www.lwywywl.icu your@email.com"
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

mkdir -p certbot/www certbot/conf

echo ">> 确认 Nginx 已用 HTTP 配置启动（NGINX_CONF=./docker/nginx/nginx.http.conf）"
echo ">> 正在申请证书: $DOMAIN"

docker run --rm \
  -v "$ROOT/certbot/conf:/etc/letsencrypt" \
  -v "$ROOT/certbot/www:/var/www/certbot" \
  certbot/certbot certonly \
  --webroot -w /var/www/certbot \
  -d "$DOMAIN" \
  --email "$EMAIL" \
  --agree-tos \
  --non-interactive

if [[ ! -f "certbot/conf/live/$DOMAIN/fullchain.pem" ]]; then
  echo "证书申请失败，请检查域名解析与安全组 80 端口"
  exit 1
fi

echo ">> 证书已就绪。请在 .env 中设置:"
echo "   NGINX_CONF=./docker/nginx/nginx.https.conf"
echo ">> 然后执行:"
echo "   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate nginx"
