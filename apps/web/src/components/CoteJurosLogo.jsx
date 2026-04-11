import React from 'react';
import { cn } from '@/lib/utils.js';

export function CoteJurosLogo({ variant = 'horizontal', className = '' }) {
  const isSymbol = ['square', 'symbol', 'symbolLight'].includes(variant);

  if (isSymbol) {
    return (
      <span
        className={cn(
          'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-sm font-semibold tracking-[-0.08em] text-foreground shadow-[var(--shadow-sm)]',
          className
        )}
      >
        CJ
      </span>
    );
  }

  return (
    <span className={cn('inline-flex items-center gap-3 text-[17px] font-semibold tracking-[-0.04em] text-foreground', className)}>
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-sm tracking-[-0.08em] shadow-[var(--shadow-sm)]">
        CJ
      </span>
      <span>Cote Juros</span>
    </span>
  );
}
