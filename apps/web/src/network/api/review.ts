import type { DailyReview } from '@shangan/shared';
import client from '@/network/client';

/** 保存今日复盘 */
export function saveReview(review: DailyReview) {
  return client
    .post<DailyReview>('/api/reviews/today', {
      completedTaskIds: review.completedTaskIds,
      userNote: review.userNote,
      aiSummary: review.aiSummary,
      tomorrowSuggestion: review.tomorrowSuggestion,
    })
    .then((r) => r.data);
}
