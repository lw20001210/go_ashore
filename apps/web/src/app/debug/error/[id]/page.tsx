"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CopyTaskId } from "@/components/copy-task-id";
import { AppShell, Card } from "@/components/shell";

interface ErrorRecord {
  requestId: string;
  statusCode: number;
  message: string;
  detail: string;
  stack?: string;
  path: string;
  method: string;
  createdAt: string;
}

export default function DebugErrorPage({ params }: { params: Promise<{ id: string }> }) {
  const [requestId, setRequestId] = useState("");
  const [record, setRecord] = useState<ErrorRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void params.then(({ id }) => {
      setRequestId(id);
      return fetch(`/api/debug/errors/${id}`)
        .then(async (response) => {
          if (!response.ok) {
            const body = (await response.json().catch(() => null)) as { message?: string } | null;
            throw new Error(body?.message ?? "未找到该任务 ID 对应的错误记录");
          }
          return response.json() as Promise<ErrorRecord>;
        })
        .then(setRecord)
        .catch((fetchError: Error) => setError(fetchError.message))
        .finally(() => setLoading(false));
    });
  }, [params]);

  return (
    <AppShell>
      <header className="mb-5">
        <p className="mb-1 text-xs font-bold tracking-[0.28em] text-[#8a6c45]">DEBUG</p>
        <h1 className="text-[30px] font-black leading-none tracking-[-0.04em] text-[#14251d]">错误详情</h1>
        <p className="mt-2 text-sm leading-5 text-[#6f6a5c]">用任务 ID 查看服务端记录的报错原因。</p>
      </header>

      <Card className="space-y-4 p-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8a6c45]">任务 ID</p>
          {requestId ? <CopyTaskId id={requestId} className="mt-1" /> : <p className="mt-1 text-sm">—</p>}
        </div>

        {loading && <p className="text-sm text-[#6f6a5c]">正在查询错误日志…</p>}

        {error && (
          <div className="rounded-[18px] border border-[#f0c4c4] bg-[#fff1f1] px-4 py-3 text-sm leading-6 text-[#b42318]">
            <p>{error}</p>
            <p className="mt-2 text-xs text-[#7a2e2e]">
              若查不到记录，通常是后端未启动或未重启到最新版本。请确认 API（3001）已运行后再试。
            </p>
          </div>
        )}

        {record && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Info label="状态码" value={String(record.statusCode)} />
              <Info label="时间" value={new Date(record.createdAt).toLocaleString("zh-CN")} />
              <Info label="方法" value={record.method} />
              <Info label="路径" value={record.path} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8a6c45]">对外提示</p>
              <p className="mt-1 text-sm leading-6 text-[#17231d]">{record.message}</p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8a6c45]">真实原因</p>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-[#b42318]">{record.detail}</p>
            </div>

            {record.stack && (
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8a6c45]">堆栈</p>
                <pre className="mt-2 overflow-x-auto rounded-[18px] border border-[#e0d3bd] bg-[#fffdf8] p-4 text-xs leading-5 text-[#4f4a3f]">
                  {record.stack}
                </pre>
              </div>
            )}
          </>
        )}

        <Link
          href="/debug/errors"
          className="inline-block rounded-[18px] border border-[#e0d3bd] px-4 py-2 text-sm font-semibold text-[#183d2b]"
        >
          返回错误日志
        </Link>
      </Card>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-[#e8dcc8] bg-[#fffdf8] px-3 py-2">
      <p className="text-[11px] font-semibold text-[#8a6c45]">{label}</p>
      <p className="mt-1 break-all text-sm font-medium text-[#17231d]">{value}</p>
    </div>
  );
}
