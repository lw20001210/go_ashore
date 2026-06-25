/** 避免 localhost 多项目共用 accessToken / refreshToken 时互相覆盖 */
export const ACCESS_TOKEN_COOKIE = 'sg_accessToken';
export const REFRESH_TOKEN_COOKIE = 'sg_refreshToken';

const LEGACY_ACCESS_TOKEN_COOKIE = 'accessToken';
const LEGACY_REFRESH_TOKEN_COOKIE = 'refreshToken';

export function readAccessToken(cookies: Record<string, string | undefined>): string | undefined {
  return cookies[ACCESS_TOKEN_COOKIE] ?? cookies[LEGACY_ACCESS_TOKEN_COOKIE];
}

export function readRefreshToken(cookies: Record<string, string | undefined>): string | undefined {
  return cookies[REFRESH_TOKEN_COOKIE] ?? cookies[LEGACY_REFRESH_TOKEN_COOKIE];
}

export function clearAuthCookies(response: {
  clearCookie: (name: string, options: { path: string }) => void;
}) {
  for (const name of [
    ACCESS_TOKEN_COOKIE,
    REFRESH_TOKEN_COOKIE,
    LEGACY_ACCESS_TOKEN_COOKIE,
    LEGACY_REFRESH_TOKEN_COOKIE,
  ]) {
    response.clearCookie(name, { path: '/' });
  }
}
