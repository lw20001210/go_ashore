import type { UserProfile } from '@shangan/shared';
import client from '@/network/client';

/** 获取用户备考配置 */
export function getProfile() {
  return client.get<UserProfile>('/api/users/profile').then((r) => r.data);
}

/** 更新用户备考配置 */
export function saveProfile(profile: UserProfile) {
  return client.put<UserProfile>('/api/users/profile', profile).then((r) => r.data);
}
