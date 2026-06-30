'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

export interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  invalid?: boolean;
}

const stroke = {
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/** 带眼睛图标的密码输入框，可切换明文/密文 */
export function PasswordInput(props: PasswordInputProps) {
  const { value, onChange, placeholder, autoComplete, invalid = false } = props;
  const [visible, setVisible] = useState(false);

  return (
    <div
      className={cn(
        'mt-2 flex items-center overflow-visible rounded-[20px] border bg-[#fffdf8] focus-within:ring-2',
        invalid
          ? 'border-[#e07a7a] focus-within:border-[#e07a7a] focus-within:ring-[#f5c4c4]'
          : 'border-[#e0d3bd] focus-within:border-[#2f6b49] focus-within:ring-[#cdebd7]',
      )}
    >
      <input
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 border-0 bg-transparent py-3 pl-4 pr-2 text-[#17231d] outline-none placeholder:text-[#b0a896]"
      />
      <button
        type="button"
        aria-label={visible ? '隐藏密码' : '显示密码'}
        onClick={() => setVisible((current) => !current)}
        className="flex shrink-0 items-center justify-center self-stretch pl-2 pr-4 text-[#8a7f6f] transition hover:text-[#4f4a3f]"
      >
        <span className="inline-flex size-[18px] items-center justify-center">
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </span>
      </button>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="block"
    >
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
        {...stroke}
      />
      <circle cx="12" cy="12" r="3" {...stroke} />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="block"
    >
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
        {...stroke}
      />
      <path d="M4 4l16 16" {...stroke} />
    </svg>
  );
}
