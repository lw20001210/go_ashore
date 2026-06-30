const APP_TIMEZONE = 'Asia/Shanghai';

/** 业务「今天」的日期键，统一东八区 */
export function todayDateKey(timeZone = APP_TIMEZONE) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function todayDateOnly() {
  return new Date(`${todayDateKey()}T00:00:00.000Z`);
}

export function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function shanghaiDateKey(date: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** 相对基准日偏移 N 天的日期键（东八区） */
export function dateKeyOffset(offsetDays: number, base = todayDateKey()) {
  const date = new Date(`${base}T12:00:00+08:00`);
  date.setDate(date.getDate() + offsetDays);
  return shanghaiDateKey(date);
}

/** 距考试天数，与前端 todayKey 统一使用东八区日历日 */
export function daysUntilExam(examDateKey: string, base = todayDateKey()) {
  const start = new Date(`${base}T00:00:00+08:00`).getTime();
  const end = new Date(`${examDateKey}T00:00:00+08:00`).getTime();
  return Math.max(0, Math.ceil((end - start) / 86400000));
}

/** 从今天起连续有复盘记录的天数 */
export function streakDaysFromDateKeys(dateKeys: string[]) {
  const keys = new Set(dateKeys);
  let streak = 0;
  let cursor = todayDateKey();
  while (keys.has(cursor)) {
    streak += 1;
    cursor = dateKeyOffset(-1, cursor);
  }
  return streak;
}
