import client from '@/network/client';

interface AuthUser {
  user: { id: string; email: string };
}

/** 注册账号 */
export function register(email: string, password: string) {
  return client.post<AuthUser>('/api/auth/register', { email, password }).then((r) => r.data);
}

/** 登录 */
export function login(email: string, password: string) {
  return client.post<AuthUser>('/api/auth/login', { email, password }).then((r) => r.data);
}

/** 退出登录 */
export function logout() {
  return client.post<{ ok: true }>('/api/auth/logout').then((r) => r.data);
}

/** 获取当前登录用户 */
export function me() {
  return client.get<AuthUser>('/api/auth/me').then((r) => r.data);
}

/** 用 refresh token 恢复会话（无有效 refresh token 时返回 401） */
export function refresh() {
  return client.post<AuthUser>('/api/auth/refresh').then((r) => r.data);
}

/** 忘记密码：发送重置邮件 */
export function forgotPassword(email: string) {
  return client
    .post<{ ok: true; message: string }>('/api/auth/forgot-password', { email })
    .then((r) => r.data);
}

/** 用邮件验证码重置密码（无需登录、无需旧密码） */
export function resetPassword(email: string, code: string, password: string) {
  return client
    .post<{ ok: true; message: string }>('/api/auth/reset-password', {
      email,
      code,
      password,
    })
    .then((r) => r.data);
}

/** 已登录用户修改密码 */
export function changePassword(currentPassword: string, newPassword: string) {
  return client
    .post<{ ok: true; message: string }>('/api/auth/change-password', {
      currentPassword,
      newPassword,
    })
    .then((r) => r.data);
}

/** 是否已配置邮件重置（发件 SMTP） */
export function passwordResetAvailable() {
  return client
    .get<{ available: boolean }>('/api/auth/password-reset-available')
    .then((r) => r.data);
}
