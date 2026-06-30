# 忘记密码邮件配置

## 核心概念

| 概念 | 说明 |
|------|------|
| **发件邮箱（SMTP）** | 只需配置 **1 个**，由系统代发重置邮件，**免费**（QQ/163 个人邮箱即可） |
| **用户注册邮箱** | 可以是 **任意邮箱**（QQ、Gmail、163、Outlook…） |
| **收件** | 重置邮件发到用户 **注册时填写的那个邮箱**，与发件邮箱无关 |

举例：你用 `2972063787@qq.com` 做发件账号，用户用 `someone@gmail.com` 注册，重置邮件会发到 Gmail 收件箱。

---

## 一键配置（推荐）

**用途：** 交互式写入本地 `apps/api/.env`（并提示服务器要填什么）

```bash
chmod +x scripts/configure-smtp.sh
./scripts/configure-smtp.sh
```

---

## 常见发件邮箱参数

| 邮箱 | SMTP_HOST | 端口 | SMTP_PASS |
|------|-----------|------|-----------|
| QQ | `smtp.qq.com` | 465 | QQ 邮箱 → 设置 → 账号 → 开启 SMTP → 生成授权码 |
| 163 | `smtp.163.com` | 465 | 163 邮箱 → 设置 → POP3/SMTP → 授权码 |
| Gmail | `smtp.gmail.com` | 587 | Google 账号 → 应用专用密码 |

`.env` 示例（QQ）：

```env
APP_PUBLIC_URL=https://www.lwywywl.icu
SMTP_HOST=smtp.qq.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=你的QQ邮箱@qq.com
SMTP_PASS=16位授权码
SMTP_FROM=你的QQ邮箱@qq.com
```

Gmail 示例：

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
```

---

## 服务器 Docker 部署

把上述 SMTP 变量写入 **项目根目录** `.env`（`docker-compose.yml` 会传给 api 容器），然后：

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build api
```

验证是否生效：

```bash
curl https://www.lwywywl.icu/api/auth/password-reset-available
# 期望: {"available":true}
```

---

## 未配置 SMTP 时

- 登录页「忘记密码」会提示邮件服务未配置
- 已登录用户仍可在 **设置 → 修改密码** 改密（不依赖邮件）

---

## 费用

个人 QQ/163 邮箱 SMTP **免费**，有每日发送上限；忘记密码场景用量极低，一般够用。
