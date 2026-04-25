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
  const iconClass = isSymbol ? 'h-9 w-9' : 'h-9 w-9';

  return (
    <span className={cn('inline-flex items-center gap-2', className)} aria-label="Cote Juros">
      <img src={src} alt="" className={cn(iconClass, 'site-logo-mark shrink-0 object-contain')} loading="eager" aria-hidden="true" />
      {!isSymbol && (
        <span className="site-logo-copy">
          <span
            className={cn(
              'site-logo-wordmark whitespace-nowrap text-[21px] font-semibold leading-none tracking-[-0.01em]',
              isLight ? 'text-white' : 'text-slate-950'
            )}
          >
            Cote Juros
          </span>
          <span className={cn('site-logo-tagline', isLight ? 'text-slate-300' : 'text-slate-500')}>
            juros claros
          </span>
        </span>
      )}
    </span>
  );
}
