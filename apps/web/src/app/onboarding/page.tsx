"use client";

import { observer } from "mobx-react-lite";
import { FormEvent, useEffect, useState } from "react";
import { message } from "antd";
import { subjects, type ExamType, type Subject, type UserProfile } from "@shangan/shared";
import { AppShell, Card } from "@/components/shell";
import { userApi, aiApi, isApiError } from "@/network";
import { useAppStore } from "@/stores/app-store";

export default observer(function OnboardingPage() {
  const { profile, setProfile, setTodayPlan, user } = useAppStore();
  const [examDate, setExamDate] = useState(profile?.examDate ?? "");
  const [examType, setExamType] = useState<ExamType>(profile?.examType ?? "guokao");
  const [weekdayMinutes, setWeekdayMinutes] = useState(profile?.weekdayMinutes ?? 90);
  const [weekendMinutes, setWeekendMinutes] = useState(profile?.weekendMinutes ?? 180);
  const [focusSubjects, setFocusSubjects] = useState<Subject[]>(
    profile?.focusSubjects ?? ["资料", "申论"],
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setExamDate(profile.examDate);
    setExamType(profile.examType);
    setWeekdayMinutes(profile.weekdayMinutes);
    setWeekendMinutes(profile.weekendMinutes);
    setFocusSubjects(profile.focusSubjects);
  }, [profile]);

  function toggleSubject(subject: Subject) {
    setFocusSubjects((current) =>
      current.includes(subject) ? current.filter((item) => item !== subject) : [...current, subject],
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const profile: UserProfile = {
      examDate,
      examType,
      weekdayMinutes,
      weekendMinutes,
      focusSubjects,
      phase: "written",
    };
    setLoading(true);
    try {
      setProfile(profile);
      if (user) {
        await userApi.saveProfile(profile);
      }
      const plan = await aiApi.generatePlan(profile);
      setTodayPlan(plan);
      window.location.href = "/";
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        message.error("登录已过期，请重新登录后再保存");
      } else if (isApiError(error) && error.status === 429) {
        message.error(error.message);
      } else {
        message.error("生成计划失败，请稍后再试");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <h1 className="mb-4 text-3xl font-bold">配置备考节奏</h1>
      <Card>
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium">考试日期</span>
            <input
              required
              type="date"
              value={examDate}
              onChange={(event) => setExamDate(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">考试类型</span>
            <select
              value={examType}
              onChange={(event) => setExamType(event.target.value as ExamType)}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3"
            >
              <option value="guokao">国考</option>
              <option value="shengkao">省考</option>
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium">工作日分钟</span>
              <input
                type="number"
                min={15}
                value={weekdayMinutes}
                onChange={(event) => setWeekdayMinutes(Number(event.target.value))}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">周末分钟</span>
              <input
                type="number"
                min={30}
                value={weekendMinutes}
                onChange={(event) => setWeekendMinutes(Number(event.target.value))}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
            </label>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">薄弱科目</p>
            <div className="flex flex-wrap gap-2">
              {subjects.map((subject) => (
                <button
                  key={subject}
                  type="button"
                  onClick={() => toggleSubject(subject)}
                  className={`rounded-full border px-3 py-2 text-sm ${
                    focusSubjects.includes(subject)
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  {subject}
                </button>
              ))}
            </div>
          </div>

          <button disabled={loading} className="w-full rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white disabled:opacity-60">
            {loading ? "生成计划中" : "保存并生成今日计划"}
          </button>
        </form>
      </Card>
    </AppShell>
  );
});
