import type { DailyPlan, DailyReview, UserProfile } from '@shangan/shared';
import client from '@/network/client';

export interface MergePayload {
  profile?: UserProfile;
  plans: DailyPlan[];
  reviews: DailyReview[];
}

/** 合并本地数据到云端 */
export function merge(payload: MergePayload) {
  return client.post<{ ok: true }>('/api/sync/merge', payload).then((r) => r.data);
}
