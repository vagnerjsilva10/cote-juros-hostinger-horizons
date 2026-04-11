import React from 'react';
import { cn } from '@/lib/utils.js';

export function CoteJurosLogo({ variant = 'horizontal', className = '' }) {
  const isSymbol = ['square', 'symbol', 'symbolLight', 'icon'].includes(variant);
  const isMonochrome = variant === 'monochrome';
  const titleColor = isMonochrome ? 'text-slate-900' : 'text-[#0F172A]';
  const subtitleColor = isMonochrome ? 'text-slate-500' : 'text-slate-500';

  const icon = (
    <span
      className={cn('inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50')}
      aria-hidden="true"
    >
      <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M3 13.5L7.1 9.7L10.3 11.8L15.2 6.9M15.2 6.9V9.6M15.2 6.9H12.5"
          stroke={isMonochrome ? '#334155' : '#5B8EF7'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );

  if (isSymbol) {
    return (
      <span className={cn('inline-flex items-center', className)} aria-label="Cote Juros">
        {icon}
      </span>
    );
  }

  return (
    <span className={cn('inline-flex items-center gap-3', className)} aria-label="Cote Juros">
      {icon}
      <span className="flex flex-col leading-none">
        <span className={cn('text-[20px] font-semibold tracking-[-0.03em]', titleColor)}>Cote Juros</span>
        <span className={cn('mt-1 text-[11px] font-medium tracking-[-0.01em]', subtitleColor)}>By Cote</span>
      </span>
    </span>
  );
}
