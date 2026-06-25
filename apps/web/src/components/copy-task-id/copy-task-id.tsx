'use client';

import { Button } from 'antd';
import { useState } from 'react';
import { copyText } from '@/lib/copy-text';
import { cn } from '@/lib/utils';

export interface CopyTaskIdProps {
  id: string;
  className?: string;
  compact?: boolean;
}

/** 展示任务 ID 并提供一键复制按钮 */
export function CopyTaskId(props: CopyTaskIdProps) {
  const { id, className, compact = false } = props;
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await copyText(id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={cn('flex items-start gap-2', className)}>
      <p
        className={cn(
          'min-w-0 flex-1 break-all font-mono text-[#17231d]',
          compact ? 'text-xs' : 'text-sm',
        )}
      >
        {id}
      </p>
      <Button
        size="small"
        onClick={() => void handleCopy()}
        className="shrink-0"
      >
        {copied ? '已复制' : '复制'}
      </Button>
    </div>
  );
}
