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
