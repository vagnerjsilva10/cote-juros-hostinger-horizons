import React from 'react';
import { cn } from '@/lib/utils.js';

const LOGO_MAP = {
  original: '/brand/cote-favicon.svg',
  'original-light': '/brand/cote-favicon.svg',
  horizontal: '/brand/cote-favicon.svg',
  symbol: '/brand/cote-favicon.svg',
  symbolLight: '/brand/cote-favicon.svg',
  icon: '/brand/cote-favicon.svg',
  square: '/brand/cote-favicon.svg',
  monochrome: '/assets/logo/logo-monochrome.svg'
};

export function CoteJurosLogo({ variant = 'horizontal', className = '' }) {
  const src = LOGO_MAP[variant] || LOGO_MAP.horizontal;
  const isSymbol = ['symbol', 'symbolLight', 'icon', 'square'].includes(variant);
  const isLight = variant === 'original-light' || variant === 'symbolLight';
  const iconClass = isSymbol ? 'h-11 w-11' : 'h-12 w-12';

  return (
    <span className={cn('inline-flex items-center gap-3', className)} aria-label="Cote Juros">
      <img src={src} alt="" className={cn(iconClass, 'shrink-0 object-contain')} loading="eager" aria-hidden="true" />
      {!isSymbol && (
        <span
          className={cn(
            'site-logo-wordmark whitespace-nowrap text-[28px] font-semibold leading-none tracking-[-0.02em]',
            isLight ? 'text-white' : 'text-slate-950'
          )}
        >
          Cote Juros
        </span>
      )}
    </span>
  );
}
