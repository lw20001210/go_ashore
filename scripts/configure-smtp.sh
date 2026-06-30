#!/usr/bin/env bash
# 用途：交互式写入 SMTP 配置（发件账号任选一个；收件可以是 QQ/Gmail/163 等任意邮箱）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="${1:-$ROOT/apps/api/.env}"

echo "=== 上岸日程 SMTP 配置 ==="
echo ""
echo "说明："
echo "  · 只需配置 1 个「发件邮箱」（系统代发），免费，个人邮箱即可"
echo "  · 用户注册用什么邮箱都行（QQ/Gmail/163…），重置邮件会发到其注册邮箱"
echo "  · SMTP_PASS 填「授权码」，不是登录密码"
echo ""
echo "常用发件邮箱："
echo "  QQ:   smtp.qq.com      端口 465"
echo "  163:  smtp.163.com     端口 465"
echo "  Gmail: smtp.gmail.com  端口 587（需应用专用密码）"
echo ""

read -r -p "写入目标文件 [$TARGET]: " custom
TARGET="${custom:-$TARGET}"

read -r -p "SMTP 服务器 [smtp.qq.com]: " SMTP_HOST
SMTP_HOST="${SMTP_HOST:-smtp.qq.com}"

read -r -p "SMTP 端口 [465]: " SMTP_PORT
SMTP_PORT="${SMTP_PORT:-465}"

read -r -p "发件邮箱 SMTP_USER: " SMTP_USER
if [[ -z "$SMTP_USER" ]]; then
  echo "发件邮箱不能为空" >&2
  exit 1
fi

read -r -s -p "SMTP 授权码 SMTP_PASS: " SMTP_PASS
echo ""
if [[ -z "$SMTP_PASS" ]]; then
  echo "授权码不能为空" >&2
  exit 1
fi

read -r -p "发件人显示地址 SMTP_FROM [$SMTP_USER]: " SMTP_FROM
SMTP_FROM="${SMTP_FROM:-$SMTP_USER}"

read -r -p "网站地址 APP_PUBLIC_URL [https://www.lwywywl.icu]: " APP_PUBLIC_URL
APP_PUBLIC_URL="${APP_PUBLIC_URL:-https://www.lwywywl.icu}"

SMTP_SECURE="true"
if [[ "$SMTP_PORT" == "587" ]]; then
  SMTP_SECURE="false"
fi

upsert_env() {
  local file="$1"
  local key="$2"
  local value="$3"
  if [[ -f "$file" ]] && grep -q "^${key}=" "$file"; then
    if [[ "$(uname)" == Darwin ]]; then
      sed -i '' "s|^${key}=.*|${key}=${value}|" "$file"
    else
      sed -i "s|^${key}=.*|${key}=${value}|" "$file"
    fi
  else
    echo "${key}=${value}" >>"$file"
  fi
}

if [[ ! -f "$TARGET" ]]; then
  cp "$ROOT/apps/api/.env.example" "$TARGET"
  echo "已从 .env.example 创建 $TARGET"
fi

upsert_env "$TARGET" "APP_PUBLIC_URL" "$APP_PUBLIC_URL"
upsert_env "$TARGET" "SMTP_HOST" "$SMTP_HOST"
upsert_env "$TARGET" "SMTP_PORT" "$SMTP_PORT"
upsert_env "$TARGET" "SMTP_SECURE" "$SMTP_SECURE"
upsert_env "$TARGET" "SMTP_USER" "$SMTP_USER"
upsert_env "$TARGET" "SMTP_PASS" "$SMTP_PASS"
upsert_env "$TARGET" "SMTP_FROM" "$SMTP_FROM"

echo ""
echo "已写入: $TARGET"
echo ""
echo "若部署在服务器，请把以下几行同步到服务器项目根目录 .env（docker compose 用）："
echo ""
echo "APP_PUBLIC_URL=$APP_PUBLIC_URL"
echo "SMTP_HOST=$SMTP_HOST"
echo "SMTP_PORT=$SMTP_PORT"
echo "SMTP_SECURE=$SMTP_SECURE"
echo "SMTP_USER=$SMTP_USER"
echo "SMTP_PASS=$SMTP_PASS"
echo "SMTP_FROM=$SMTP_FROM"
echo ""
echo "然后重建 api: docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build api"
