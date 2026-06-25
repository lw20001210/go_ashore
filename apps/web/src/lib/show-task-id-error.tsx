"use client";

import { Button, message } from "antd";
import Link from "next/link";
import { copyText } from "@/lib/copy-text";

/** 500 报错 toast：展示完整任务 ID + 复制按钮 */
export function showTaskIdError(requestId: string) {
  const key = `task-id-${requestId}`;

  message.open({
    key,
    type: "error",
    duration: 8,
    content: (
      <div className="pr-2">
        <p className="font-semibold">服务器出错了</p>
        <p className="mt-2 text-xs leading-5 opacity-90">复制任务 ID 后到错误日志页查询详情</p>
        <div className="mt-2 flex items-start gap-2">
          <code className="min-w-0 flex-1 break-all text-xs">{requestId}</code>
          <Button
            size="small"
            type="primary"
            ghost
            onClick={() => {
              void copyText(requestId).then(() => message.success("已复制任务 ID", 2));
            }}
          >
            复制
          </Button>
        </div>
        <Link href={`/debug/error/${requestId}`} className="mt-2 inline-block text-xs underline">
          查看错误详情
        </Link>
      </div>
    ),
  });
}
