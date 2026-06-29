import type { DailyPlan, UserProfile } from '@shangan/shared';
import client from '@/network/client';

export interface AiStatus {
  provider: string;
  model: string;
  configured: boolean;
  mode: 'deepseek' | 'fallback';
  baseUrl: string;
  endpoint: string;
  apiFormat: string;
  hint: string;
  note: string;
}

/** 生成每日计划 */
export function generatePlan(profile: UserProfile) {
  return client.post<DailyPlan>('/api/ai/daily-plan', { profile }).then((r) => r.data);
}

/** 获取 AI 接入状态 */
export function getAiStatus() {
  return client.get<AiStatus>('/api/ai/status').then((r) => r.data);
}
