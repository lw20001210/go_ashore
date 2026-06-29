import type { HistoryDay } from '@shangan/shared';
import client from '@/network/client';

/** 获取云端历史记录（计划 + 复盘） */
export function getHistory() {
  return client.get<{ items: HistoryDay[] }>('/api/history').then((r) => r.data);
}
