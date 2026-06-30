#!/usr/bin/env bash
# 用途：服务器上直接重置用户密码（忘记密码且邮件不可用时的备用）
# 示例：./scripts/reset-user-password.sh 2972063787@qq.com 新密码123
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "用法: $0 <邮箱> <新密码>" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T api \
  node scripts/reset-user-password.mjs "$1" "$2"
