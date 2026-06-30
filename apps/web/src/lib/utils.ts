const SHANGHAI_TZ = 'Asia/Shanghai';

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function shanghaiDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: SHANGHAI_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function todayKey() {
  return shanghaiDateKey();
}

/** 当前月份键，如 2026-06 */
export function currentMonthKey() {
  return todayKey().slice(0, 7);
}

/** 相对今天偏移 N 天的日期键（东八区） */
export function dateKeyOffset(offsetDays: number, base = todayKey()) {
  const date = new Date(`${base}T12:00:00+08:00`);
  date.setDate(date.getDate() + offsetDays);
  return shanghaiDateKey(date);
}

/** 月份键转展示文案，如 2026-06 → 2026年6月 */
export function formatMonthKey(monthKey: string) {
  const [year, month] = monthKey.split('-');
  return `${year}年${Number(month)}月`;
}

/** 月份加减，如 shiftMonthKey('2026-06', -1) → 2026-05 */
export function shiftMonthKey(monthKey: string, delta: number) {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** 距考试天数，与 todayKey 统一使用东八区日历日 */
export function daysUntil(date: string) {
  const startKey = shanghaiDateKey();
  const start = new Date(`${startKey}T00:00:00+08:00`).getTime();
  const end = new Date(`${date}T00:00:00+08:00`).getTime();
  return Math.max(0, Math.ceil((end - start) / 86400000));
}

/** 历史记录页日期标题，如「6月28日 周六」 */
export function formatHistoryDate(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00+08:00`);
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: SHANGHAI_TZ,
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(date);
}

/** 从今天起连续有复盘记录的天数 */
export function streakDaysFromReviews(reviews: Record<string, { date: string }>) {
  const keys = new Set(Object.keys(reviews));
  let streak = 0;
  let cursor = todayKey();
  while (keys.has(cursor)) {
    streak += 1;
    cursor = dateKeyOffset(-1, cursor);
  }
  return streak;
}
