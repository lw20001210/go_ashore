'use client';

import Link from 'next/link';
import { useState } from 'react';

export interface ErrorAlertProps {
  message: string;
  requestId?: string;
  status?: number;
}

/** 登录/接口报错：401 等直接说明原因；500/连不上才引导查错误日志 */
export function ErrorAlert(props: ErrorAlertProps) {
  const { message, requestId, status } = props;
  const [copied, setCopied] = useState(false);
  const showDebug = status === 0 || (status !== undefined && status >= 500);

  async function copyRequestId() {
    if (!requestId) return;
    try {
      await navigator.clipboard.writeText(requestId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-[18px] border border-[#f0c4c4] bg-[#fff1f1] px-4 py-3 text-sm leading-5 text-[#b42318]">
      <p className="font-semibold">{message}</p>

      {status === 401 && (
        <p className="mt-2 text-xs leading-5 text-[#7a2e2e]">
          常见原因：邮箱或密码填错，或该邮箱尚未注册。请先切换到「注册」创建账号后再登录。
        </p>
      )}

      {status === 409 && (
        <p className="mt-2 text-xs leading-5 text-[#7a2e2e]">
          该邮箱已注册，请切回「登录」标签直接登录。
        </p>
      )}

      {status === 0 && (
        <p className="mt-2 text-xs leading-5 text-[#7a2e2e]">
          常见原因：后端 API（3001 端口）未启动。请在项目目录执行{' '}
          <code className="font-mono">npm run dev</code>。
        </p>
      )}

      {showDebug && requestId && (
        <div className="mt-3 space-y-3 border-t border-[#f0c4c4] pt-3">
          <div>
            <p className="text-xs font-bold text-[#7a2e2e]">
              任务 ID（复制后去查详情）
            </p>
            <p className="mt-1 break-all rounded-[12px] bg-[#fffdf8] px-3 py-2 font-mono text-xs text-[#17231d]">
              {requestId}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void copyRequestId()}
              className="rounded-full border border-[#e0d3bd] bg-[#fffdf8] px-3 py-1.5 text-xs font-bold text-[#183d2b]"
            >
              {copied ? '已复制' : '复制任务 ID'}
            </button>
            <Link
              href={`/debug/error/${requestId}`}
              className="rounded-full bg-[#163828] px-3 py-1.5 text-xs font-bold text-[#fffaf0]"
            >
              查看错误详情
            </Link>
            <Link
              href="/debug/errors"
              className="rounded-full border border-[#2f6b49] px-3 py-1.5 text-xs font-bold text-[#2f6b49]"
            >
              错误日志列表
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
