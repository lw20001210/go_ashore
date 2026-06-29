import type { DailyPlan, DailyReview, HistoryDay } from '@shangan/shared';
import { dateKeyOffset, todayKey } from '@/lib/utils';

function hasContent(item: HistoryDay) {
  const hasPlan = (item.plan?.tasks.length ?? 0) > 0;
  const hasReview = Boolean(
    item.review?.aiSummary?.trim() || item.review?.userNote?.trim(),
  );
  return hasPlan || hasReview;
}

function mergeDay(
  local: HistoryDay | undefined,
  remote: HistoryDay | undefined,
): HistoryDay | null {
  const date = local?.date ?? remote?.date;
  if (!date) return null;

  const plan = pickPlan(local?.plan ?? null, remote?.plan ?? null);
  const review = pickReview(local?.review ?? null, remote?.review ?? null);
  const item: HistoryDay = { date, plan, review };
  return hasContent(item) ? item : null;
}

function pickPlan(local: DailyPlan | null, remote: DailyPlan | null) {
  if (local?.tasks.length && !remote?.tasks.length) return local;
  if (remote?.tasks.length && !local?.tasks.length) return remote;
  if ((remote?.tasks.length ?? 0) >= (local?.tasks.length ?? 0)) {
    return remote ?? local;
  }
  return local ?? remote;
}

function pickReview(local: DailyReview | null, remote: DailyReview | null) {
  const localScore =
    (local?.aiSummary?.length ?? 0) + (local?.userNote?.length ?? 0);
  const remoteScore =
    (remote?.aiSummary?.length ?? 0) + (remote?.userNote?.length ?? 0);
  if (remoteScore >= localScore) return remote ?? local;
  return local ?? remote;
}

/** 合并本地 store 与云端历史，按日期倒序 */
export function mergeHistoryDays(
  localPlans: Record<string, DailyPlan>,
  localReviews: Record<string, DailyReview>,
  remoteItems: HistoryDay[] = [],
): HistoryDay[] {
  const dates = new Set<string>([
    ...Object.keys(localPlans),
    ...Object.keys(localReviews),
    ...remoteItems.map((item) => item.date),
  ]);

  const remoteByDate = new Map(remoteItems.map((item) => [item.date, item]));

  return [...dates]
    .map((date) => {
      const localDay: HistoryDay = {
        date,
        plan: localPlans[date] ?? null,
        review: localReviews[date] ?? null,
      };
      return mergeDay(localDay, remoteByDate.get(date));
    })
    .filter((item): item is HistoryDay => item !== null)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export type HistoryPreset = '7d' | '30d' | 'month' | 'all';

export type HistoryFilter = {
  preset: HistoryPreset;
  /** preset 为 month 时使用，格式 YYYY-MM */
  month: string;
  /** 自定义区间，含起止日 */
  range?: { from: string; to: string };
};

/** 按快捷选项或自定义区间筛选历史记录 */
export function filterHistoryItems(
  items: HistoryDay[],
  filter: HistoryFilter,
): HistoryDay[] {
  const { preset, month, range } = filter;

  if (range?.from && range?.to) {
    const from = range.from <= range.to ? range.from : range.to;
    const to = range.from <= range.to ? range.to : range.from;
    return items.filter((item) => item.date >= from && item.date <= to);
  }

  if (preset === 'all') return items;

  if (preset === 'month') {
    return items.filter((item) => item.date.startsWith(month));
  }

  const today = todayKey();
  const start =
    preset === '7d' ? dateKeyOffset(-6) : dateKeyOffset(-29);
  return items.filter((item) => item.date >= start && item.date <= today);
}
