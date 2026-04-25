import React from 'react';
import { cn } from '@/lib/utils.js';

const LOGO_MAP = {
  original: '/brand/cote-finance-ai-logo.svg',
  'original-light': '/brand/cote-finance-ai-logo.svg',
  horizontal: '/brand/cote-finance-ai-logo.svg',
  symbol: '/brand/cote-favicon.svg',
  symbolLight: '/brand/cote-favicon.svg',
  icon: '/brand/cote-favicon.svg',
  square: '/brand/cote-favicon.svg',
  monochrome: '/assets/logo/logo-monochrome.svg'
};

export function CoteJurosLogo({ variant = 'horizontal', className = '' }) {
  const src = LOGO_MAP[variant] || LOGO_MAP.horizontal;
  const isSymbol = ['symbol', 'symbolLight', 'icon', 'square'].includes(variant);
  const heightClass = isSymbol ? 'h-11 w-11' : 'h-10 w-auto';

  return (
    <span className={cn('inline-flex items-center', className)} aria-label="Cote Finance AI by Cote Juros">
      <img src={src} alt="Cote Finance AI by Cote Juros" className={cn(heightClass, 'object-contain')} loading="eager" />
    </span>
  );
}
