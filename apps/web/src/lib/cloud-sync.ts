import type { DailyPlan, HistoryDay, UserProfile } from '@shangan/shared';
import { historyApi, planApi, userApi } from '@/network';
import { isApiError } from '@/network/client';
import { mergeHistoryDays } from '@/lib/history';
import { todayKey } from '@/lib/utils';
import { appStore } from '@/stores/app-store';

export type CloudPullResult = {
  profile: UserProfile | null | undefined;
  todayPlan: DailyPlan | undefined;
  historyItems: HistoryDay[];
};

/** 从云端拉取 profile、今日计划与历史记录 */
export async function pullCloudData(): Promise<CloudPullResult> {
  const [profileSettled, planSettled, historySettled] = await Promise.allSettled([
    userApi.getProfile(),
    planApi.getTodayPlan(),
    historyApi.getHistory(),
  ]);

  let profile: UserProfile | null | undefined;
  if (profileSettled.status === 'fulfilled') {
    profile = profileSettled.value;
  } else if (
    isApiError(profileSettled.reason) &&
    profileSettled.reason.status === 404
  ) {
    profile = null;
  }

  const todayPlan =
    planSettled.status === 'fulfilled' ? planSettled.value : undefined;
  const historyItems =
    historySettled.status === 'fulfilled' ? historySettled.value.items : [];

  return { profile, todayPlan, historyItems };
}

/** 将云端数据合并进 MobX store（登录后 / 会话恢复时调用） */
export function applyCloudPull(data: CloudPullResult) {
  if (data.profile) {
    appStore.setProfile(data.profile);
  }

  if (data.todayPlan !== undefined) {
    appStore.setTodayPlan(data.todayPlan);
  }

  if (!data.historyItems.length) return;

  const merged = mergeHistoryDays(appStore.plans, appStore.reviews, data.historyItems);
  const today = todayKey();
  const plans = { ...appStore.plans };
  const reviews = { ...appStore.reviews };

  for (const item of merged) {
    if (item.date === today && data.todayPlan !== undefined) {
      if (item.review) reviews[item.date] = item.review;
      continue;
    }
    if (item.plan) plans[item.date] = item.plan;
    if (item.review) reviews[item.date] = item.review;
  }

  appStore.replacePlansAndReviews(plans, reviews);
}

/** 上传本地数据后拉取云端最新状态 */
export async function syncAfterAuth() {
  applyCloudPull(await pullCloudData());
}
