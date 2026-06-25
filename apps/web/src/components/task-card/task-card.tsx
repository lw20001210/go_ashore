'use client';

import type { Task } from '@shangan/shared';
import { observer } from 'mobx-react-lite';
import { cn } from '@/lib/utils';

const subjectTone: Record<Task['subject'], string> = {
  言语: 'bg-[#f5ecd8] text-[#8a5c24]',
  数量: 'bg-[#e8eef5] text-[#3d5875]',
  判断: 'bg-[#eee8f4] text-[#5c4670]',
  资料: 'bg-[#e3f0e8] text-[#2d5a40]',
  常识: 'bg-[#f5e8e2] text-[#7a4030]',
  申论: 'bg-[#eaecd8] text-[#4a5628]',
};

interface TaskCardInnerProps {
  task: Task;
  disabled?: boolean;
  onToggle: (completed: boolean) => void;
}

function TaskCardInner(props: TaskCardInnerProps) {
  const { task, disabled, onToggle } = props;
  function toggle() {
    if (disabled) return;
    onToggle(!task.completed);
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-pressed={task.completed}
      aria-disabled={disabled}
      onClick={toggle}
      onKeyDown={(event) => {
        if (disabled) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggle();
        }
      }}
      className={cn(
        'flex cursor-pointer select-none items-start gap-3 rounded-2xl border px-4 py-3.5 transition',
        disabled && 'cursor-wait opacity-70',
        task.completed
          ? 'border-[#d4e8dc] bg-[#f5faf7] opacity-75'
          : 'border-[#ebe3d4] bg-white active:scale-[0.99]',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition',
          task.completed
            ? 'border-[#2f6b49] bg-[#2f6b49] text-[#fffaf0]'
            : 'border-[#c9baa6] bg-white',
        )}
      >
        {task.completed && (
          <svg
            viewBox="0 0 16 16"
            className="h-3 w-3 fill-none stroke-current stroke-[2.5]"
          >
            <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
          </svg>
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${subjectTone[task.subject]}`}
        >
          {task.subject}
        </span>
        <span
          className={cn(
            'mt-1.5 block text-[15px] font-semibold leading-snug text-[#1a2b22]',
            task.completed &&
              'text-[#7a8a80] line-through decoration-[#a8b8ae]',
          )}
        >
          {task.title}
        </span>
        <span className="mt-1 block text-xs text-[#9a9288]">
          {task.estimatedMinutes} 分钟
        </span>
      </span>
    </div>
  );
}

export const TaskCard = observer(TaskCardInner);
