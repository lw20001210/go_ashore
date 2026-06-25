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

/** 距考试天数，与 todayKey 统一使用东八区日历日 */
export function daysUntil(date: string) {
  const startKey = shanghaiDateKey();
  const start = new Date(`${startKey}T00:00:00+08:00`).getTime();
  const end = new Date(`${date}T00:00:00+08:00`).getTime();
  return Math.max(0, Math.ceil((end - start) / 86400000));
}
