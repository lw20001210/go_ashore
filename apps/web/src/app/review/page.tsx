"use client";

import { observer } from "mobx-react-lite";
import { useState } from "react";
import { message } from "antd";
import { AppShell, Card } from "@/components/shell";
import { reviewApi, isApiError, streamReview } from "@/network";
import { extractTomorrowSuggestion } from "@/lib/review-text";
import { btnPrimary, cardTitle, muted, pageTitle } from "@/lib/ui-classes";
import { todayKey } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";

export default observer(function ReviewPage() {
  const { plans, reviews, user, saveLocalReview } = useAppStore();
  const plan = plans[todayKey()];
  const completedTasks = plan?.tasks.filter((task) => task.completed) ?? [];
  const existing = reviews[todayKey()];
  const [note, setNote] = useState(existing?.userNote ?? "");
  const [summary, setSummary] = useState(existing?.aiSummary ?? "");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setSummary("");
    let output = "";
    try {
      await streamReview(completedTasks, note, (chunk) => {
        output += chunk;
        setSummary(output);
      });
      const review = {
        date: todayKey(),
        completedTaskIds: completedTasks.map((task) => task.id),
        userNote: note,
        aiSummary: output,
        tomorrowSuggestion: extractTomorrowSuggestion(output),
      };
      saveLocalReview(review);
      if (user) {
        await reviewApi.saveReview(review);
      }
      message.success(user ? "复盘已生成" : "复盘已生成（本地模板，登录后可使用 DeepSeek）");
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        message.error("登录已过期，请重新登录");
      } else {
        message.error("复盘生成失败，请稍后再试");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <h1 className={pageTitle}>晚间复盘</h1>

      <div className="space-y-3">
        <Card>
          <h2 className={cardTitle}>今日完成</h2>
          {completedTasks.length ? (
            <ul className="mt-3 space-y-2">
              {completedTasks.map((task) => (
                <li
                  key={task.id}
                  className="rounded-xl border border-[#d4e8dc] bg-[#f5faf7] px-3 py-2.5 text-sm text-[#245038]"
                >
                  {task.subject} · {task.title}
                </li>
              ))}
            </ul>
          ) : (
            <p className={`mt-2 ${muted}`}>还没有勾选完成的任务，也可以先记录卡点。</p>
          )}
        </Card>

        <Card>
          <label className="block">
            <span className="text-sm font-semibold text-[#17231d]">今天哪里卡住了？</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={5}
              className="mt-2 w-full rounded-xl border border-[#e8dcc8] bg-white px-4 py-3 text-sm text-[#17231d] outline-none focus:border-[#2f6b49]"
              placeholder="例如：数量关系太慢，资料分析计算容易错..."
            />
          </label>
          <button type="button" onClick={submit} disabled={loading} className={`mt-4 w-full ${btnPrimary} disabled:opacity-60`}>
            {loading ? "复盘生成中" : "生成 AI 复盘"}
          </button>
          {summary && (
            <article className="mt-4 whitespace-pre-wrap rounded-xl border border-[#ebe3d4] bg-[#faf8f4] p-4 text-sm leading-6 text-[#3d4a42]">
              {summary}
            </article>
          )}
        </Card>
      </div>
    </AppShell>
  );
});
