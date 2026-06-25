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

/** 带眼睛图标的密码输入框，可切换明文/密文 */
export function PasswordInput(props: PasswordInputProps) {
  const { value, onChange, placeholder, autoComplete, invalid = false } = props;
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative mt-2">
      <input
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full rounded-[20px] border bg-[#fffdf8] py-3 pl-4 pr-12 text-[#17231d] outline-none transition placeholder:text-[#b0a896] focus:ring-2',
          invalid
            ? 'border-[#e07a7a] focus:border-[#e07a7a] focus:ring-[#f5c4c4]'
            : 'border-[#e0d3bd] focus:border-[#2f6b49] focus:ring-[#cdebd7]',
        )}
      />
      <button
        type="button"
        aria-label={visible ? '隐藏密码' : '显示密码'}
        onClick={() => setVisible((current) => !current)}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-[#8a7f6f] transition hover:bg-[#f0e4ca] hover:text-[#4f4a3f]"
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 3l18 18M10.5 10.7A3 3 0 0 0 12 15a3 3 0 0 0 2.3-1M6.7 6.8C4.6 8.1 3 10 3 10s3.5 7 10 7c1.8 0 3.4-.5 4.8-1.2M14 5.2C13.4 5.1 12.7 5 12 5 5.5 5 2 12 2 12a18.8 18.8 0 0 0 4 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
