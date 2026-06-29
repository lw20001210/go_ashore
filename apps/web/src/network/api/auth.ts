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
