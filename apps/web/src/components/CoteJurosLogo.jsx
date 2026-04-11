import React from 'react';
import { cn } from '@/lib/utils.js';

export function CoteJurosLogo({ variant = 'horizontal', className = '' }) {
  const isSymbol = ['square', 'symbol', 'symbolLight', 'icon'].includes(variant);
  const isMonochrome = variant === 'monochrome';
  const titleColor = isMonochrome ? 'text-slate-900' : 'text-[#0F172A]';
  const subtitleColor = isMonochrome ? 'text-slate-500' : 'text-slate-500';

  const icon = (
    <span
      className={cn(
        'relative inline-flex h-12 w-12 items-center justify-center rounded-[14px] border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]'
      )}
      aria-hidden="true"
    >
      <span className="absolute inset-[1px] rounded-[12px] bg-slate-50" />
      <svg viewBox="0 0 20 20" className="relative h-[22px] w-[22px]" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M3.5 13.2L7.4 9.1L10.2 11.1L15.2 6.1M15.2 6.1V8.9M15.2 6.1H12.4"
          stroke={isMonochrome ? '#334155' : '#2563EB'}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="15.2" cy="6.1" r="0.8" fill={isMonochrome ? '#334155' : '#2563EB'} />
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
        <span className={cn('text-[21px] font-[750] tracking-[-0.035em]', titleColor)}>Cote Juros</span>
        <span className={cn('mt-1 text-[10px] font-semibold uppercase tracking-[0.16em]', subtitleColor)}>Finance Platform</span>
      </span>
    </span>
  );
}
