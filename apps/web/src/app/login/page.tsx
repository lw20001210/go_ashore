"use client";

import Link from "next/link";
import { observer } from "mobx-react-lite";
import { FormEvent, useState } from "react";
import { message } from "antd";
import { PasswordInput } from "@/components/password-input";
import { AppShell, Card } from "@/components/shell";
import { showAuthError } from "@/lib/auth-errors";
import { syncAfterAuth } from "@/lib/cloud-sync";
import { authApi, syncApi } from "@/network";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";

type Mode = "login" | "register";

type FieldErrors = {
  email?: string;
  password?: string;
};

function validateForm(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    errors.email = "请输入邮箱";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    errors.email = "邮箱格式不正确";
  }

  if (!password) {
    errors.password = "请输入密码";
  } else if (password.length < 8) {
    errors.password = "密码至少 8 位";
  }

  return errors;
}

const inputClass =
  "mt-2 w-full rounded-[20px] border bg-[#fffdf8] px-4 py-3 text-[#17231d] outline-none transition placeholder:text-[#b0a896] focus:ring-2";

export default observer(function LoginPage() {
  const { setUser, profile, plans, reviews } = useAppStore();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setFieldErrors({});
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const errors = validateForm(email, password);
    setFieldErrors(errors);

    if (errors.email) {
      message.error(errors.email);
      return;
    }
    if (errors.password) {
      message.error(errors.password);
      return;
    }

    setLoading(true);
    const trimmedEmail = email.trim();

    let result: { user: { id: string; email: string } };
    try {
      result =
        mode === "login"
          ? await authApi.login(trimmedEmail, password)
          : await authApi.register(trimmedEmail, password);
    } catch (error) {
      showAuthError(error, mode);
      setLoading(false);
      return;
    }

    setUser(result.user);

    try {
      await syncApi.merge({
        profile: profile ?? undefined,
        plans: Object.values(plans),
        reviews: Object.values(reviews),
      });
      await syncAfterAuth();
    } catch {
      message.warning("登录成功，但数据同步失败，可稍后在设置页重试。");
    }

    message.success(mode === "login" ? "登录成功" : "注册成功");
    setLoading(false);
    window.location.href = "/";
  }

  return (
    <AppShell>
      <header className="mb-5">
        <p className="mb-1 text-xs font-bold tracking-[0.28em] text-[#8a6c45]">ACCOUNT</p>
        <h1 className="text-[34px] font-black leading-none tracking-[-0.06em] text-[#14251d]">保存备考进度</h1>
        <p className="mt-2 text-sm leading-5 text-[#6f6a5c]">登录后把本地计划同步到云端，换设备也不丢。</p>
      </header>

      <Card className="p-5">
        <div className="mb-5 grid grid-cols-2 rounded-[22px] border border-[#e8dcc8] bg-[#f4ecdc] p-1">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={cn(
              "rounded-[18px] py-2.5 text-sm font-bold transition",
              mode === "login"
                ? "bg-[#163828] text-[#fffaf0] shadow-[0_8px_18px_rgba(22,56,40,0.18)]"
                : "text-[#7d7668]",
            )}
          >
            登录
          </button>
          <button
            type="button"
            onClick={() => switchMode("register")}
            className={cn(
              "rounded-[18px] py-2.5 text-sm font-bold transition",
              mode === "register"
                ? "bg-[#163828] text-[#fffaf0] shadow-[0_8px_18px_rgba(22,56,40,0.18)]"
                : "text-[#7d7668]",
            )}
          >
            注册
          </button>
        </div>

        <form noValidate onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-[#4f4a3f]">邮箱</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (fieldErrors.email) setFieldErrors((current) => ({ ...current, email: undefined }));
              }}
              placeholder="you@example.com"
              className={cn(
                inputClass,
                fieldErrors.email
                  ? "border-[#e07a7a] focus:border-[#e07a7a] focus:ring-[#f5c4c4]"
                  : "border-[#e0d3bd] focus:border-[#2f6b49] focus:ring-[#cdebd7]",
              )}
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-[#4f4a3f]">密码</span>
            <PasswordInput
              value={password}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder="至少 8 位"
              invalid={Boolean(fieldErrors.password)}
              onChange={(value) => {
                setPassword(value);
                if (fieldErrors.password) setFieldErrors((current) => ({ ...current, password: undefined }));
              }}
            />
          </label>

          {mode === "login" && (
            <p className="text-right text-sm">
              <Link href="/forgot-password" className="text-[#2f6b49] no-underline">
                忘记密码？
              </Link>
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-[22px] bg-[#2f6b49] px-4 py-3.5 text-sm font-bold text-[#fffaf0] shadow-[0_12px_26px_rgba(47,107,73,0.24)] transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "处理中…" : mode === "login" ? "登录并同步" : "注册并同步"}
          </button>
        </form>
      </Card>
    </AppShell>
  );
});
