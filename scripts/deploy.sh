#!/usr/bin/env bash
# 用途：本地一条命令 — pack → scp → 远程 deploy-server.sh
# 可选：复制 scripts/deploy.env.example 为 scripts/deploy.env 并改 DEPLOY_* 
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/scripts/deploy.env"
[[ -f "$ENV_FILE" ]] && set -a && source "$ENV_FILE" && set +a

HOST="${DEPLOY_HOST:-8.140.58.52}"
USER="${DEPLOY_USER:-root}"
DIR="${DEPLOY_DIR:-/opt/shangan-schedule}"
TAR="$ROOT/web.tar.gz"

SSH_OPTS=(-o BatchMode=yes)
SCP_OPTS=()
if [[ -n "${DEPLOY_KEY:-}" ]]; then
  SSH_OPTS+=(-i "$DEPLOY_KEY")
  SCP_OPTS+=(-i "$DEPLOY_KEY")
fi

echo "==> 打包"
bash "$ROOT/scripts/pack-deploy.sh" "$TAR"

echo "==> 上传到 $USER@$HOST:/tmp/web.tar.gz"
scp "${SCP_OPTS[@]}" "$TAR" "$USER@$HOST:/tmp/web.tar.gz"

echo "==> 远程解压并部署到 $DIR"
ssh "${SSH_OPTS[@]}" "$USER@$HOST" "bash -s" <<EOF
set -euo pipefail
mkdir -p "$DIR"
tar -xzf /tmp/web.tar.gz -C "$DIR"
rm -f /tmp/web.tar.gz
chmod +x "$DIR/scripts/deploy-server.sh"
bash "$DIR/scripts/deploy-server.sh"
EOF

echo "==> 部署完成: http://www.lwywywl.icu"
