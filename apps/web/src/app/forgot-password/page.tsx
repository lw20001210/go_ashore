"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { message } from "antd";
import { AppShell, Card } from "@/components/shell";
import { PasswordInput } from "@/components/password-input";
import { authApi, isApiError } from "@/network";
import { cn } from "@/lib/utils";

const inputClass =
  "mt-2 w-full rounded-[20px] border border-[#e0d3bd] bg-[#fffdf8] px-4 py-3 text-[#17231d] outline-none focus:border-[#2f6b49] focus:ring-2 focus:ring-[#cdebd7]";

type Step = "email" | "reset" | "done";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [sending, setSending] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function requestCode() {
    const trimmed = email.trim();
    if (!trimmed) {
      message.error("请输入注册邮箱");
      return;
    }

    setSending(true);
    try {
      const result = await authApi.forgotPassword(trimmed);
      message.success(result.message);
      setStep("reset");
    } catch (error) {
      if (isApiError(error)) {
        message.error(error.message);
      } else {
        message.error("发送失败，请稍后再试");
      }
    } finally {
      setSending(false);
    }
  }

  async function sendCode(event: FormEvent) {
    event.preventDefault();
    await requestCode();
  }

  async function resetPassword(event: FormEvent) {
    event.preventDefault();
    if (code.length !== 6) {
      message.error("请输入 6 位验证码");
      return;
    }
    if (password.length < 8) {
      message.error("新密码至少 8 位");
      return;
    }
    if (password !== confirm) {
      message.error("两次输入的密码不一致");
      return;
    }

    setResetting(true);
    try {
      const result = await authApi.resetPassword(email.trim(), code, password);
      message.success(result.message);
      setStep("done");
    } catch (error) {
      if (isApiError(error)) {
        message.error(error.message);
      } else {
        message.error("重置失败，请稍后再试");
      }
    } finally {
      setResetting(false);
    }
  }

  return (
    <AppShell>
      <header className="mb-5">
        <h1 className="text-3xl font-black text-[#14251d]">忘记密码</h1>
        <p className="mt-2 text-sm leading-6 text-[#6f6a5c]">
          不用登录，也不用记得旧密码。输入<strong>注册邮箱</strong>收验证码，再设新密码即可。
        </p>
      </header>

      <Card className="p-5">
        {step === "done" ? (
          <div className="space-y-4 text-sm leading-6 text-[#4f4a3f]">
            <p>密码已更新，请用新密码登录。</p>
            <Link
              href="/login"
              className="inline-block rounded-[22px] bg-[#2f6b49] px-5 py-3 text-sm font-bold text-[#fffaf0] no-underline"
            >
              去登录
            </Link>
          </div>
        ) : step === "email" ? (
          <form noValidate onSubmit={sendCode} className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-[#4f4a3f]">注册邮箱</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClass}
                placeholder="注册时填写的邮箱"
              />
            </label>
            <button
              type="submit"
              disabled={sending}
              className={cn(
                "w-full rounded-[22px] bg-[#2f6b49] px-4 py-3.5 text-sm font-bold text-[#fffaf0] disabled:opacity-60",
              )}
            >
              {sending ? "发送中…" : "发送验证码"}
            </button>
            <p className="text-center text-sm">
              <Link href="/login" className="text-[#2f6b49] no-underline">
                返回登录
              </Link>
            </p>
          </form>
        ) : (
          <form noValidate onSubmit={resetPassword} className="space-y-4">
            <p className="rounded-xl bg-[#f5faf7] px-3 py-2 text-sm text-[#2f6b49]">
              验证码已发往 <strong>{email}</strong>，15 分钟内有效
            </p>
            <label className="block">
              <span className="text-sm font-semibold text-[#4f4a3f]">邮箱验证码</span>
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                className={cn(inputClass, "tracking-[0.3em]")}
                placeholder="6 位数字"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-[#4f4a3f]">新密码</span>
              <PasswordInput
                value={password}
                autoComplete="new-password"
                placeholder="至少 8 位"
                onChange={setPassword}
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-[#4f4a3f]">确认新密码</span>
              <PasswordInput
                value={confirm}
                autoComplete="new-password"
                placeholder="再次输入"
                onChange={setConfirm}
              />
            </label>
            <button
              type="submit"
              disabled={resetting}
              className={cn(
                "w-full rounded-[22px] bg-[#2f6b49] px-4 py-3.5 text-sm font-bold text-[#fffaf0] disabled:opacity-60",
              )}
            >
              {resetting ? "保存中…" : "确认新密码"}
            </button>
            <button
              type="button"
              disabled={sending}
              onClick={() => void requestCode()}
              className="w-full text-sm text-[#2f6b49]"
            >
              {sending ? "重发中…" : "没收到？重新发送验证码"}
            </button>
          </form>
        )}
      </Card>
    </AppShell>
  );
}
