"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { CopyTaskId } from "@/components/copy-task-id";
import { AppShell, Card } from "@/components/shell";

interface ErrorRecord {
  requestId: string;
  statusCode: number;
  message: string;
  detail: string;
  path: string;
  method: string;
  createdAt: string;
}

export default function DebugErrorsPage() {
  const router = useRouter();
  const [lookupId, setLookupId] = useState("");
  const [items, setItems] = useState<ErrorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function goLookup(event: FormEvent) {
    event.preventDefault();
    const id = lookupId.trim();
    if (!id) return;
    router.push(`/debug/error/${id}`);
  }

  useEffect(() => {
    void fetch("/api/health")
      .then(async (healthResponse) => {
        if (!healthResponse.ok) {
          throw new Error("API 未就绪");
        }
        const logsResponse = await fetch("/api/debug/errors");
        if (!logsResponse.ok) {
          throw new Error("错误日志接口不可用");
        }
        const body = (await logsResponse.json()) as { items: ErrorRecord[] };
        setItems(body.items);
      })
      .catch(() => {
        setError("后端 API（3001 端口）未启动，错误日志暂时无法加载。");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <header className="mb-5">
        <p className="mb-1 text-xs font-bold tracking-[0.28em] text-[#8a6c45]">DEBUG</p>
        <h1 className="text-[30px] font-black leading-none tracking-[-0.04em] text-[#14251d]">错误日志</h1>
        <p className="mt-2 text-sm leading-5 text-[#6f6a5c]">输入任务 ID 查报错原因，或浏览最近的服务端错误。</p>
      </header>

      <Card className="mb-4 p-5">
        <form onSubmit={goLookup} className="space-y-3">
          <label className="block">
            <span className="text-sm font-semibold text-[#4f4a3f]">按任务 ID 查询</span>
            <input
              value={lookupId}
              onChange={(event) => setLookupId(event.target.value)}
              placeholder="粘贴登录页复制的任务 ID"
              className="mt-2 w-full rounded-[20px] border border-[#e0d3bd] bg-[#fffdf8] px-4 py-3 font-mono text-sm text-[#17231d] outline-none focus:border-[#2f6b49] focus:ring-2 focus:ring-[#cdebd7]"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-[20px] bg-[#2f6b49] px-4 py-3 text-sm font-bold text-[#fffaf0]"
          >
            查看报错原因
          </button>
        </form>
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 text-sm font-bold text-[#4f4a3f]">最近错误</h2>
        {loading && <p className="text-sm text-[#6f6a5c]">加载中…</p>}
        {error && (
          <div className="rounded-[18px] border border-[#f0c4c4] bg-[#fff1f1] px-4 py-3 text-sm leading-6 text-[#b42318]">
            <p className="font-semibold">{error}</p>
            <p className="mt-2 text-xs text-[#7a2e2e]">
              在电脑终端依次执行（项目目录 ~/Desktop/shangan-schedule）：
            </p>
            <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-[#7a2e2e]">
              <li>
                <code className="font-mono">docker compose up db -d</code> 启动数据库
              </li>
              <li>
                <code className="font-mono">cd apps/api && npm run prisma:migrate</code> 初始化表
              </li>
              <li>
                <code className="font-mono">npm run dev</code> 启动前端 + 后端
              </li>
            </ol>
            <p className="mt-2 text-xs text-[#7a2e2e]">
              上方「按任务 ID 查询」仍可用，API 启动后再查即可。
            </p>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <p className="text-sm text-[#6f6a5c]">暂无错误记录。</p>
        )}

        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.requestId} className="rounded-[18px] border border-[#e8dcc8] bg-[#fffdf8] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <CopyTaskId id={item.requestId} compact />
                  <p className="mt-2 text-sm font-semibold text-[#17231d]">{item.detail}</p>
                  <p className="mt-1 text-xs text-[#8a6c45]">
                    {item.method} {item.path} · {new Date(item.createdAt).toLocaleString("zh-CN")}
                  </p>
                </div>
                <Link
                  href={`/debug/error/${item.requestId}`}
                  className="shrink-0 rounded-full bg-[#163828] px-3 py-1.5 text-xs font-bold text-[#fffaf0]"
                >
                  查看
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </AppShell>
  );
}
