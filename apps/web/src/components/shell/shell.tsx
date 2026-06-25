'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { AuthBootstrap } from '@/components/auth-bootstrap';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: '今日' },
  { href: '/review', label: '复盘' },
  { href: '/progress', label: '进度' },
  { href: '/settings', label: '设置' },
];

function isNavActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export interface AppShellProps {
  children: ReactNode;
}

export function AppShell(props: AppShellProps) {
  const { children } = props;
  const pathname = usePathname();

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col bg-[#f3efe6] text-[#17231d]">
      <AuthBootstrap />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_15%_0%,rgba(234,201,126,0.35),transparent_42%),radial-gradient(circle_at_90%_0%,rgba(83,150,110,0.22),transparent_40%)]" />
      <div className="relative z-10 flex-1 px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-5">
        {children}
      </div>

      <nav className="app-bottom-nav fixed inset-x-0 bottom-0 z-20 border-t border-[#e8dcc8]/80 bg-[#fffaf0]/95 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-md">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1.5">
          {navItems.map((item) => {
            const active = isNavActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                data-active={active ? 'true' : 'false'}
                className="app-nav-link"
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </main>
  );
}

export interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card(props: CardProps) {
  const { children, className = '' } = props;
  return (
    <section
      className={cn(
        'rounded-2xl border border-[#e8dcc8] bg-[#fffdf8] p-4 shadow-[0_8px_24px_rgba(54,43,26,0.06)]',
        className,
      )}
    >
      {children}
    </section>
  );
}
