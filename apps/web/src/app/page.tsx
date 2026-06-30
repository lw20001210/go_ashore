'use client';

import Link from 'next/link';
import { observer } from 'mobx-react-lite';
import { useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import type { Task } from '@shangan/shared';
import { AppShell, Card } from '@/components/shell';
import { TaskCard } from '@/components/task-card';
import { btnGhost, btnPrimary } from '@/lib/ui-classes';
import { planApi, aiApi, isApiError } from '@/network';
import { daysUntil, todayKey } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';

function HomePage() {
  const store = useAppStore();
  const { user, setTodayPlan } = store;
  const [loading, setLoading] = useState(false);
  const [planSyncing, setPlanSyncing] = useState(Boolean(user));

  const todayPlan = store.plans[todayKey()];
  const completed =
    todayPlan?.tasks.filter((task) => task.completed).length ?? 0;

  const totalText = useMemo(() => {
    if (!todayPlan) return '0 分钟';
    const minutes = todayPlan.totalMinutes;
    return minutes >= 60
      ? `${Math.floor(minutes / 60)}h ${minutes % 60}m`
      : `${minutes} 分钟`;
  }, [todayPlan]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    Promise.resolve().then(() => {
      if (!cancelled) setPlanSyncing(true);
    });

    void planApi
      .getTodayPlan()
      .then((plan) => {
        if (!cancelled) setTodayPlan(plan);
      })
      .catch((error) => {
        if (!cancelled) {
          const detail =
            isApiError(error) && error.status === 0
              ? '无法连接后端，勾选状态可能无法保存'
              : '未能同步云端计划，勾选状态可能无法保存';
          message.warning(detail);
        }
      })
      .finally(() => {
        if (!cancelled) setPlanSyncing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, setTodayPlan]);

  async function generatePlan() {
    if (!store.profile) return;
    setLoading(true);
    try {
      const plan = await aiApi.generatePlan(store.profile);
      store.setTodayPlan(plan);

      message.info(
        plan.aiGenerated
          ? '今日计划已生成（DeepSeek）'
          : '今日计划已生成（本地模板）',
      );
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        message.error('登录已过期，请重新登录后再重排');
      } else {
        message.error('生成计划失败，请稍后再试');
      }
    } finally {
      setLoading(false);
    }
  }

  async function toggleTask(task: Task, completed: boolean) {
    const key = todayKey();
    const plan = store.plans[key];
    if (!plan) return;

    const prevCompleted = task.completed;
    const nextTasks = plan.tasks.map((item) =>
      item.id === task.id ? { ...item, completed } : item,
    );
    const nextPlan = {
      ...plan,
      date: key,
      tasks: nextTasks,
      totalMinutes: nextTasks.reduce(
        (sum, item) => sum + item.estimatedMinutes,
        0,
      ),
    };

    store.setTodayPlan(nextPlan);
    if (!store.user) return;

    try {
      const saved = await planApi.saveTodayPlan(nextTasks);
      store.setTodayPlan(saved);
    } catch (error) {
      store.updateLocalTask(task.id, { completed: prevCompleted });
      if (isApiError(error) && error.status === 401) {
        message.error('登录已过期，请重新登录');
      } else {
        message.error('同步失败，请稍后重试');
      }
    }
  }

  return (
    <AppShell>
      <header className="mb-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-black tracking-tight text-[#14251d]">
              上岸日程
            </h1>
            <p className="mt-0.5 truncate text-xs text-[#8a8378]">
              {store.authChecked && store.user
                ? store.user.email
                : '把零散时间压成今天能完成的事'}
            </p>
          </div>
          {store.showLoginButton && (
            <Link
              href="/login"
              className="app-btn-primary shrink-0 rounded-full px-4 py-2 text-xs font-bold no-underline"
            >
              登录
            </Link>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-[#163828] p-3 text-[#fffaf0]">
          <Metric
            value={
              store.hydrated && store.profile
                ? String(daysUntil(store.profile.examDate))
                : '--'
            }
            label="距笔试"
          />
          <Metric value={String(completed)} label="已完成" />
          <Metric value={totalText} label="预计用时" />
        </div>
      </header>

      {!store.profile ? (
        <Card className="relative overflow-hidden !p-5">
          <span className="absolute right-5 top-5 rounded-full bg-[#f0e4ca] px-3 py-1 text-xs font-bold text-[#7a5b2e]">
            首次配置
          </span>
          <h2 className="max-w-[220px] text-2xl font-black tracking-[-0.04em] text-[#17231d]">
            先定下你的备考节奏
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#716a5b]">
            填写考试日期、工作日可用时间和薄弱科目，AI
            会生成今天能完成的任务单。
          </p>
          <Link className={`mt-5 ${btnPrimary}`} href="/onboarding">
            创建我的今日任务单
          </Link>
        </Card>
      ) : (
        <Card className="overflow-hidden !p-0">
          <div className="flex items-center justify-between border-b border-[#ebe3d4] px-4 py-3">
            <div>
              <h2 className="text-base font-bold text-[#17231d]">今日任务</h2>
              <p className="text-xs text-[#9a9288]">{todayKey()}</p>
            </div>
            <button
              onClick={generatePlan}
              disabled={loading || planSyncing}
              className="rounded-lg bg-[#2f6b49] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
            >
              {loading ? '生成中' : todayPlan ? '重排' : '生成'}
            </button>
          </div>

          <div className="space-y-2 p-3">
            {planSyncing && !todayPlan?.tasks.length ? (
              <div className="rounded-2xl border border-dashed border-[#d8c9b4] bg-[#fffdf7] p-5 text-sm text-[#756b5b]">
                正在同步今日任务…
              </div>
            ) : todayPlan?.tasks.length ? (
              todayPlan.tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  disabled={planSyncing}
                  onToggle={(checked) => toggleTask(task, checked)}
                />
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-[#d8c9b4] bg-[#fffdf7] p-5 text-sm leading-6 text-[#756b5b]">
                还没有今日任务。点击生成，让 AI 按你今天的可用时间排一张任务单。
              </div>
            )}

            <Link href="/review" className={btnGhost}>
              今日复盘
            </Link>
          </div>
        </Card>
      )}
    </AppShell>
  );
}

export default observer(HomePage);

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-lg font-bold leading-none">{value}</p>
      <p className="mt-1 text-[10px] opacity-80">{label}</p>
    </div>
  );
}
