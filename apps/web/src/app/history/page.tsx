'use client';

import { observer } from 'mobx-react-lite';
import { useEffect, useMemo, useState } from 'react';
import type { HistoryDay, Subject, Task } from '@shangan/shared';
import { AppShell, Card } from '@/components/shell';
import {
  filterHistoryItems,
  mergeHistoryDays,
  type HistoryPreset,
} from '@/lib/history';
import { muted, pageTitle } from '@/lib/ui-classes';
import {
  cn,
  currentMonthKey,
  formatHistoryDate,
  formatMonthKey,
  shiftMonthKey,
  todayKey,
} from '@/lib/utils';
import { historyApi } from '@/network';
import { useAppStore } from '@/stores/app-store';

const PRESET_OPTIONS: { value: HistoryPreset; label: string }[] = [
  { value: '7d', label: '近7天' },
  { value: '30d', label: '近30天' },
  { value: 'month', label: '按月' },
  { value: 'all', label: '全部' },
];

const SUBJECT_TONE: Record<Subject, string> = {
  言语: 'bg-[#f5ecd8] text-[#8a5c24]',
  数量: 'bg-[#e8eef5] text-[#3d5875]',
  判断: 'bg-[#eee8f4] text-[#5c4670]',
  资料: 'bg-[#e3f0e8] text-[#2d5a40]',
  常识: 'bg-[#f5e8e2] text-[#7a4030]',
  申论: 'bg-[#eaecd8] text-[#4a5628]',
};

export default observer(function HistoryPage() {
  const { plans, reviews, user } = useAppStore();
  const [remoteItems, setRemoteItems] = useState<HistoryDay[] | null>(null);
  const [preset, setPreset] = useState<HistoryPreset>('30d');
  const [month, setMonth] = useState(currentMonthKey);
  const [rangeFrom, setRangeFrom] = useState('');
  const [rangeTo, setRangeTo] = useState('');
  const [appliedRange, setAppliedRange] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setRemoteItems(null);
      return;
    }

    let cancelled = false;
    void historyApi
      .getHistory()
      .then((data) => {
        if (!cancelled) setRemoteItems(data.items);
      })
      .catch(() => {
        if (!cancelled) setRemoteItems([]);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const allItems = useMemo(
    () => mergeHistoryDays(plans, reviews, remoteItems ?? []),
    [plans, reviews, remoteItems],
  );

  const filteredItems = useMemo(
    () =>
      filterHistoryItems(allItems, {
        preset,
        month,
        range: appliedRange ?? undefined,
      }),
    [allItems, preset, month, appliedRange],
  );

  useEffect(() => {
    setExpandedDate(null);
  }, [preset, month, appliedRange, filteredItems.length]);

  function selectPreset(next: HistoryPreset) {
    setPreset(next);
    setAppliedRange(null);
    if (next === 'month') {
      setMonth(currentMonthKey());
    }
  }

  function applyCustomRange() {
    if (!rangeFrom || !rangeTo) return;
    setAppliedRange({ from: rangeFrom, to: rangeTo });
    setShowAdvanced(true);
  }

  function clearCustomRange() {
    setAppliedRange(null);
    setRangeFrom('');
    setRangeTo('');
  }

  const filterHint = appliedRange
    ? `${appliedRange.from} 至 ${appliedRange.to}`
    : preset === 'month'
      ? formatMonthKey(month)
      : preset === '7d'
        ? '近 7 天'
        : preset === '30d'
          ? '近 30 天'
          : '全部记录';

  return (
    <AppShell>
      <header className="mb-4">
        <p className="mb-1 text-xs font-bold tracking-[0.28em] text-[#8a6c45]">
          ARCHIVE
        </p>
        <h1 className={pageTitle}>历史记录</h1>
        <p className={`-mt-2 ${muted}`}>
          点击日期展开详情 · {user ? '已同步云端' : '仅本机'}
        </p>
      </header>

      {allItems.length > 0 && (
        <Card className="mb-4 !p-0 overflow-hidden">
          <div className="border-b border-[#ebe3d4] p-3">
            <div className="rounded-[18px] border border-[#e8dcc8] bg-[#f4ecdc] p-1">
              <div className="grid grid-cols-4 gap-1">
                {PRESET_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => selectPreset(option.value)}
                    className={cn(
                      'rounded-[14px] py-2 text-xs font-bold transition',
                      !appliedRange && preset === option.value
                        ? 'bg-[#163828] text-[#fffaf0] shadow-[0_6px_14px_rgba(22,56,40,0.18)]'
                        : 'text-[#7d7668]',
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {preset === 'month' && !appliedRange && (
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  aria-label="上一个月"
                  onClick={() =>
                    setMonth((current) => shiftMonthKey(current, -1))
                  }
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#e8dcc8] bg-[#fffdf8] text-[#4f4a3f] active:scale-95"
                >
                  ‹
                </button>
                <div className="min-w-0 flex-1 rounded-xl border border-[#e8dcc8] bg-[#fffdf8] px-3 py-2 text-center text-sm font-semibold text-[#17231d]">
                  {formatMonthKey(month)}
                </div>
                <input
                  type="month"
                  value={month}
                  onChange={(event) => setMonth(event.target.value)}
                  className="sr-only"
                  id="history-month-picker"
                />
                <label
                  htmlFor="history-month-picker"
                  className="grid h-10 shrink-0 place-items-center rounded-xl border border-[#e8dcc8] bg-[#fffdf8] px-3 text-xs font-bold text-[#2f6b49]"
                >
                  选月
                </label>
                <button
                  type="button"
                  aria-label="下一个月"
                  onClick={() =>
                    setMonth((current) => shiftMonthKey(current, 1))
                  }
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#e8dcc8] bg-[#fffdf8] text-[#4f4a3f] active:scale-95"
                >
                  ›
                </button>
              </div>
            )}
          </div>

          <div className="px-3 py-2">
            <button
              type="button"
              onClick={() => setShowAdvanced((open) => !open)}
              className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left text-sm font-semibold text-[#4f4a3f] active:bg-[#faf5e8]"
            >
              <span>自定义日期区间</span>
              <ChevronIcon
                className={cn(
                  'text-[#9a9288] transition-transform duration-200',
                  showAdvanced && 'rotate-180',
                )}
              />
            </button>

            <div
              className={cn(
                'grid transition-[grid-template-rows,opacity] duration-300 ease-out',
                showAdvanced
                  ? 'grid-rows-[1fr] opacity-100'
                  : 'grid-rows-[0fr] opacity-0',
              )}
            >
              <div className="overflow-hidden">
                <div className="space-y-2 px-2 pb-2 pt-1">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block">
                      <span className={`mb-1 block text-[10px] ${muted}`}>
                        开始
                      </span>
                      <input
                        type="date"
                        value={rangeFrom}
                        onChange={(event) => setRangeFrom(event.target.value)}
                        className="w-full rounded-xl border border-[#e8dcc8] bg-[#fffdf8] px-3 py-2.5 text-sm outline-none focus:border-[#2f6b49]"
                      />
                    </label>
                    <label className="block">
                      <span className={`mb-1 block text-[10px] ${muted}`}>
                        结束
                      </span>
                      <input
                        type="date"
                        value={rangeTo}
                        onChange={(event) => setRangeTo(event.target.value)}
                        className="w-full rounded-xl border border-[#e8dcc8] bg-[#fffdf8] px-3 py-2.5 text-sm outline-none focus:border-[#2f6b49]"
                      />
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={!rangeFrom || !rangeTo}
                      onClick={applyCustomRange}
                      className="app-btn-primary flex-1 rounded-xl py-2.5 text-xs font-bold disabled:opacity-50"
                    >
                      查询
                    </button>
                    {appliedRange && (
                      <button
                        type="button"
                        onClick={clearCustomRange}
                        className="app-btn-secondary rounded-xl px-4 py-2.5 text-xs font-semibold"
                      >
                        清除
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[#ebe3d4] bg-[#faf8f4] px-4 py-2.5">
            <span className={`text-xs ${muted}`}>{filterHint}</span>
            <span className="text-xs font-bold text-[#2f6b49]">
              {filteredItems.length} 条
            </span>
          </div>
        </Card>
      )}

      {allItems.length === 0 ? (
        <Card>
          <p className={`${muted} leading-6`}>
            还没有历史记录。完成今日任务并生成复盘后，第二天会在这里看到。
          </p>
        </Card>
      ) : filteredItems.length === 0 ? (
        <Card>
          <p className={`${muted} leading-6`}>
            该时间段内没有记录，试试切换月份或扩大查询范围。
          </p>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {filteredItems.map((item) => (
            <HistoryDayCard
              key={item.date}
              item={item}
              expanded={expandedDate === item.date}
              onToggle={() =>
                setExpandedDate((current) =>
                  current === item.date ? null : item.date,
                )
              }
            />
          ))}
        </div>
      )}
    </AppShell>
  );
});

function HistoryDayCard({
  item,
  expanded,
  onToggle,
}: {
  item: HistoryDay;
  expanded: boolean;
  onToggle: () => void;
}) {
  const isToday = item.date === todayKey();
  const tasks = item.plan?.tasks ?? [];
  const completedCount = tasks.filter((task) => task.completed).length;
  const review = item.review;
  const hasReview = Boolean(
    review?.aiSummary.trim() || review?.userNote.trim(),
  );
  const progress =
    tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const previewText = hasReview
    ? review!.aiSummary.trim() || review!.userNote.trim()
    : tasks.length > 0
      ? tasks
          .slice(0, 2)
          .map((task) => task.title)
          .join(' · ')
      : '';

  return (
    <Card
      className={cn(
        '!p-0 overflow-hidden transition-shadow duration-200',
        expanded && 'shadow-[0_12px_28px_rgba(54,43,26,0.1)]',
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className={cn(
          'flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors',
          expanded ? 'bg-[#f5faf7]' : 'bg-[#fffdf8] active:bg-[#faf5e8]',
        )}
      >
        <span
          className={cn(
            'mt-1 h-10 w-1 shrink-0 rounded-full transition-colors',
            expanded ? 'bg-[#2f6b49]' : 'bg-[#d8c9b4]',
          )}
        />

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-base font-bold text-[#17231d]">
              {formatHistoryDate(item.date)}
            </span>
            {isToday && (
              <span className="rounded-full bg-[#e8f5ee] px-2 py-0.5 text-[10px] font-bold text-[#2f6b49]">
                今天
              </span>
            )}
          </span>

          <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#8a8378]">
            {tasks.length > 0 && (
              <span className="rounded-full bg-[#f0f4f1] px-2 py-0.5 font-semibold text-[#2f6b49]">
                {completedCount}/{tasks.length} 任务
              </span>
            )}
            {hasReview && (
              <span className="rounded-full bg-[#f5f0e8] px-2 py-0.5 font-semibold text-[#8a6c45]">
                已复盘
              </span>
            )}
          </span>

          {!expanded && previewText && (
            <p className="mt-2 line-clamp-1 text-sm text-[#756b5b]">
              {previewText}
            </p>
          )}

          {tasks.length > 0 && (
            <span className="mt-2 block">
              <span className="mb-1 flex justify-between text-[10px] text-[#b0a896]">
                <span>完成度</span>
                <span>{progress}%</span>
              </span>
              <span className="block h-1.5 overflow-hidden rounded-full bg-[#ebe3d4]">
                <span
                  className="block h-full rounded-full bg-[#2f6b49] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </span>
            </span>
          )}
        </span>

        <ChevronIcon
          className={cn(
            'mt-1 shrink-0 text-[#9a9288] transition-transform duration-300',
            expanded && 'rotate-180 text-[#2f6b49]',
          )}
        />
      </button>

      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-out',
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-4 border-t border-[#ebe3d4] px-4 py-4">
            {tasks.length > 0 && (
              <section>
                <h3 className="mb-2 text-xs font-bold tracking-[0.12em] text-[#8a6c45]">
                  任务清单
                </h3>
                <ul className="space-y-2">
                  {tasks.map((task) => (
                    <HistoryTaskRow key={task.id} task={task} />
                  ))}
                </ul>
              </section>
            )}

            {hasReview && review && (
              <section>
                <h3 className="mb-2 text-xs font-bold tracking-[0.12em] text-[#8a6c45]">
                  晚间复盘
                </h3>
                {review.userNote.trim() && (
                  <div className="mb-2 rounded-xl border border-[#ebe3d4] bg-[#faf8f4] px-3 py-2.5">
                    <p className="text-[10px] font-bold text-[#8a8378]">卡点</p>
                    <p className="mt-1 text-sm leading-6 text-[#4f4a3f]">
                      {review.userNote}
                    </p>
                  </div>
                )}
                {review.aiSummary.trim() && (
                  <article className="whitespace-pre-wrap rounded-xl border border-[#d4e8dc] bg-[#f5faf7] p-3.5 text-sm leading-6 text-[#245038]">
                    {review.aiSummary}
                  </article>
                )}
              </section>
            )}

            {!tasks.length && !hasReview && (
              <p className={`text-sm ${muted}`}>该日暂无详细记录。</p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function HistoryTaskRow({ task }: { task: Task }) {
  return (
    <li
      className={cn(
        'flex items-start gap-2.5 rounded-xl border px-3 py-2.5',
        task.completed
          ? 'border-[#d4e8dc] bg-[#f5faf7]'
          : 'border-[#ebe3d4] bg-white',
      )}
    >
      <span
        className={cn(
          'mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border',
          task.completed
            ? 'border-[#2f6b49] bg-[#2f6b49] text-[10px] text-white'
            : 'border-[#c9baa6] bg-white',
        )}
      >
        {task.completed ? '✓' : ''}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold ${SUBJECT_TONE[task.subject]}`}
        >
          {task.subject}
        </span>
        <span
          className={cn(
            'mt-1 block text-sm font-semibold text-[#17231d]',
            task.completed && 'text-[#7a8a80] line-through',
          )}
        >
          {task.title}
        </span>
      </span>
    </li>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={cn('h-5 w-5', className)}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
