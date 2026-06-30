#!/usr/bin/env bash
# 用途：在服务器项目目录执行 build + up + 健康检查（migrate 由 api 容器启动时自动 deploy）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.prod.yml)

if [[ ! -f .env ]]; then
  echo "错误: $ROOT/.env 不存在。首次部署请: cp .env.example .env 并编辑密码/密钥/SMTP" >&2
  exit 1
fi

echo "==> docker compose build api web"
"${COMPOSE[@]}" build api web

echo "==> docker compose up -d"
"${COMPOSE[@]}" up -d

echo "==> 等待 API 就绪（含 prisma migrate deploy）…"
for _ in $(seq 1 90); do
  if curl -sf http://localhost/api/health >/dev/null 2>&1; then
    echo "==> 健康检查通过: $(curl -sf http://localhost/api/health)"
    exit 0
  fi
  sleep 2
done

echo "错误: /api/health 超时，查看日志: ${COMPOSE[*]} logs api" >&2
exit 1
