"use client";

import { observer } from "mobx-react-lite";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { message } from "antd";
import { AppShell, Card } from "@/components/shell";
import { aiApi, authApi, isApiError } from "@/network";
import { btnGhost, btnPrimary, btnSecondary, cardTitle, muted, pageTitle } from "@/lib/ui-classes";
import { useAppStore } from "@/stores/app-store";

type AiStatus = {
  provider: string;
  model: string;
  configured: boolean;
  mode: "deepseek" | "fallback";
  baseUrl: string;
  endpoint: string;
  apiFormat: string;
  hint: string;
  note: string;
};

type AiCheckState = "loading" | "ok" | "error";

export default observer(function SettingsPage() {
  const { user, profile, setUser, clearAuth } = useAppStore();
  const [aiStatus, setAiStatus] = useState<AiStatus | null>(null);
  const [aiCheckState, setAiCheckState] = useState<AiCheckState>("loading");
  const [aiCheckError, setAiCheckError] = useState("");
  const cancelledRef = useRef(false);
  const retryTimerRef = useRef<number | null>(null);

  const stopAiStatusCheck = useCallback(() => {
    cancelledRef.current = true;
    if (retryTimerRef.current !== null) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  const loadAiStatus = useCallback(async (retry = 0) => {
    if (cancelledRef.current) return;

    if (retry === 0) {
      setAiCheckState("loading");
      setAiCheckError("");
    }

    try {
      const status = await aiApi.getAiStatus();
      if (cancelledRef.current) return;
      setAiStatus(status);
      setAiCheckState("ok");
    } catch (error) {
      if (cancelledRef.current) return;
      if (retry < 6) {
        retryTimerRef.current = window.setTimeout(() => void loadAiStatus(retry + 1), 1000);
        return;
      }
      setAiCheckState("error");
      const detail = isApiError(error)
        ? error.message
        : error instanceof Error
          ? error.message
          : "未知错误";
      setAiCheckError(detail);
      message.error("无法连接后端 API");
    }
  }, []);

  const retryAiStatus = useCallback(() => {
    stopAiStatusCheck();
    cancelledRef.current = false;
    void loadAiStatus();
  }, [loadAiStatus, stopAiStatusCheck]);

  useEffect(() => {
    cancelledRef.current = false;
    void loadAiStatus();
    return stopAiStatusCheck;
  }, [loadAiStatus, stopAiStatusCheck]);

  async function logout() {
    try {
      await authApi.logout();
      message.success("已退出登录");
    } catch {
      message.error("退出登录失败");
    } finally {
      clearAuth();
      setUser(null);
    }
  }

  return (
    <AppShell>
      <h1 className={pageTitle}>设置</h1>

      <div className="space-y-3">
        <Card>
          <h2 className={cardTitle}>账号</h2>
          <p className={`mt-2 ${muted}`}>
            {user ? `已登录：${user.email}` : "当前为游客模式，数据仅保存在本机。"}
          </p>
          {user ? (
            <button
              type="button"
              onClick={logout}
              className="mt-4 w-full rounded-xl border border-[#e8dcc8] bg-white px-4 py-3 text-sm font-semibold text-[#17231d]"
            >
              退出登录
            </button>
          ) : (
            <Link href="/login" className={`mt-4 ${btnPrimary}`}>
              登录保存进度
            </Link>
          )}
        </Card>

        <Card>
          <h2 className={cardTitle}>备考配置</h2>
          {profile ? (
            <div className={`mt-3 space-y-1.5 ${muted}`}>
              <p>考试日期：{profile.examDate}</p>
              <p>工作日：{profile.weekdayMinutes} 分钟</p>
              <p>周末：{profile.weekendMinutes} 分钟</p>
              <p>薄弱科目：{profile.focusSubjects.join("、") || "未设置"}</p>
            </div>
          ) : (
            <p className={`mt-2 ${muted}`}>还未配置备考信息。</p>
          )}
          <Link href="/onboarding" className={`mt-4 ${btnGhost}`}>
            修改配置
          </Link>
        </Card>

        <Card>
          <h2 className={cardTitle}>AI 接入（DeepSeek）</h2>
          {aiCheckState === "loading" && <p className={`mt-2 ${muted}`}>正在检查 AI 配置…</p>}
          {aiCheckState === "error" && (
            <div className="mt-2 space-y-3">
              <p className="text-sm text-[#b54a3a]">后端未连接，无法读取 AI 配置。</p>
              {aiCheckError && <p className="text-xs text-[#b54a3a]/80">{aiCheckError}</p>}
              <p className="text-xs text-[#9a9288]">请确认终端里 API（3001 端口）已启动，然后点下方重试。</p>
              <button type="button" onClick={retryAiStatus} className={btnSecondary}>
                重新检查
              </button>
            </div>
          )}
          {aiCheckState === "ok" && aiStatus && (
            <div className="mt-3 space-y-2 text-sm">
              <p className={aiStatus.configured ? "font-semibold text-[#2f6b49]" : "font-semibold text-[#a67c2a]"}>
                {aiStatus.configured ? "✓ 已接入 DeepSeek" : "○ 当前使用本地模板（未接 DeepSeek）"}
              </p>
              <p className={muted}>模型：{aiStatus.model}</p>
              <p className={muted}>接口格式：{aiStatus.apiFormat}</p>
              <p className={`break-all ${muted}`}>请求地址：{aiStatus.endpoint}</p>
              <p className={muted}>{aiStatus.hint}</p>
              <p className="rounded-xl bg-[#faf5e8] px-3 py-2 text-xs leading-5 text-[#7a5c24]">{aiStatus.note}</p>
            </div>
          )}
        </Card>

        <Card>
          <h2 className={cardTitle}>开发排查</h2>
          <p className={`mt-2 ${muted}`}>仅用于 500 等服务端异常排查。</p>
          <Link href="/debug/errors" className={`mt-4 ${btnSecondary}`}>
            打开错误日志页
          </Link>
        </Card>
      </div>
    </AppShell>
  );
});
