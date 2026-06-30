'use client';

import { observer } from 'mobx-react-lite';
import { useEffect, useMemo, useState } from 'react';
import { subjects, type ProgressSummary, type Subject } from '@shangan/shared';
import { AppShell, Card } from '@/components/shell';
import { progressApi } from '@/network';
import { cardTitle, muted, pageTitle } from '@/lib/ui-classes';
import { daysUntil, streakDaysFromReviews } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';

export default observer(function ProgressPage() {
  const { profile, plans, reviews, user } = useAppStore();
  const [remote, setRemote] = useState<ProgressSummary | null>(null);

  useEffect(() => {
    if (!user) return;
    void progressApi
      .getProgress()
      .then(setRemote)
      .catch(() => undefined);
  }, [user]);

  const local = useMemo<ProgressSummary>(() => {
    const subjectCounts = Object.fromEntries(
      subjects.map((subject) => [subject, 0]),
    ) as Record<Subject, number>;
    Object.values(plans).forEach((plan) => {
      plan.tasks.forEach((task) => {
        if (task.completed) subjectCounts[task.subject] += 1;
      });
    });
    return {
      daysUntilExam: profile ? daysUntil(profile.examDate) : 0,
      streakDays: streakDaysFromReviews(reviews),
      subjectCounts,
    };
  }, [plans, profile, reviews]);

  const progress = remote ?? local;
  const max = Math.max(1, ...Object.values(progress.subjectCounts));

  return (
    <AppShell>
      <h1 className={pageTitle}>备考进度</h1>

      <Card className="mb-3">
        <div className="grid grid-cols-2 gap-2">
          <StatBox value={progress.daysUntilExam} label="距考试天数" />
          <StatBox value={progress.streakDays} label="复盘天数" />
        </div>
      </Card>

      <Card>
        <h2 className={`mb-4 ${cardTitle}`}>科目完成次数</h2>
        <div className="space-y-4">
          {subjects.map((subject) => {
            const count = progress.subjectCounts[subject];
            const pct = Math.round((count / max) * 100);

            return (
              <div key={subject}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-semibold text-[#17231d]">
                    {subject}
                  </span>
                  <span className={muted}>{count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#ebe3d4]">
                  <div
                    className="h-full rounded-full bg-[#2f6b49] transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </AppShell>
  );
});

function StatBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl bg-[#163828] px-3 py-4 text-center text-[#fffaf0]">
      <p className="text-2xl font-black leading-none">{value}</p>
      <p className="mt-1.5 text-[11px] opacity-80">{label}</p>
    </div>
  );
}
