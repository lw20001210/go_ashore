import type { ProgressSummary } from '@shangan/shared';
import client from '@/network/client';

/** 获取备考进度概览 */
export function getProgress() {
  return client.get<ProgressSummary>('/api/progress').then((r) => r.data);
}
