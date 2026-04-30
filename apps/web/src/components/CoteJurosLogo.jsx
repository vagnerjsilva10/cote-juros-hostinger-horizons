import React from 'react';
import { cn } from '@/lib/utils.js';

const LOGO_MAP = {
  original: '/brand/cote-favicon-v3.svg',
  'original-light': '/brand/cote-favicon-v3.svg',
  horizontal: '/brand/cote-favicon-v3.svg',
  symbol: '/brand/cote-favicon-v3.svg',
  symbolLight: '/brand/cote-favicon-v3.svg',
  icon: '/brand/cote-favicon-v3.svg',
  square: '/brand/cote-favicon-v3.svg',
  monochrome: '/assets/logo/logo-monochrome.svg'
};

export function CoteJurosLogo({ variant = 'horizontal', className = '' }) {
  const src = LOGO_MAP[variant] || LOGO_MAP.horizontal;
  const isSymbol = ['symbol', 'symbolLight', 'icon', 'square'].includes(variant);
  const isLight = variant === 'original-light' || variant === 'symbolLight';
  const iconClass = isSymbol ? 'h-8 w-8' : 'h-8 w-8';

  return (
    <span className={cn('inline-flex items-center gap-2', className)} aria-label="Cote Juros">
      <img src={src} alt="" className={cn(iconClass, 'site-logo-mark shrink-0 object-contain')} loading="eager" aria-hidden="true" />
      {!isSymbol && (
        <span className="site-logo-copy">
          <span
            className={cn(
              'site-logo-wordmark whitespace-nowrap text-[19px] font-semibold leading-none tracking-[-0.01em]',
              isLight ? 'text-white' : 'text-slate-950'
            )}
          >
            Cote Juros
          </span>
          <span className={cn('site-logo-tagline', isLight ? 'text-slate-300' : 'text-slate-500')}>
            compare melhor
          </span>
        </span>
      )}
    </span>
  );
}
