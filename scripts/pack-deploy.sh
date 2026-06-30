#!/usr/bin/env bash
# 用途：打包生产部署所需文件（不含 node_modules、.env、certbot）
# 默认输出 web.tar.gz（与历史部署习惯一致，内含全栈源码而非仅前端）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$ROOT/web.tar.gz}"

cd "$ROOT"

# macOS 打包时跳过 Apple 扩展属性，避免 Linux 解压刷屏警告
export COPYFILE_DISABLE=1

tar -czf "$OUT" \
  --exclude='./node_modules' \
  --exclude='./apps/*/node_modules' \
  --exclude='./packages/*/node_modules' \
  --exclude='./.next' \
  --exclude='./apps/web/.next' \
  --exclude='./dist' \
  --exclude='./apps/api/dist' \
  --exclude='./.git' \
  --exclude='./.env' \
  --exclude='./apps/api/.env' \
  --exclude='./certbot' \
  --exclude='./*.tar.gz' \
  --exclude='./web.tar.gz' \
  --exclude='./.DS_Store' \
  \
  package.json \
  package-lock.json \
  docker-compose.yml \
  docker-compose.prod.yml \
  .env.example \
  apps \
  packages \
  docker \
  scripts \
  docs

echo "已生成: $OUT ($(du -h "$OUT" | cut -f1))"
