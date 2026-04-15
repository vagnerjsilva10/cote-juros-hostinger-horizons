import React from 'react';
import { cn } from '@/lib/utils.js';

const LOGO_MAP = {
  original: '/assets/cote-juros-logo-horizontal-dark.svg',
  'original-light': '/assets/cote-juros-logo-horizontal-light.svg',
  horizontal: '/assets/cote-juros-logo-horizontal-dark.svg',
  symbol: '/assets/cote-juros-logo-symbol.svg',
  symbolLight: '/assets/cote-juros-logo-symbol-light.svg',
  icon: '/assets/logo/logo-icon.svg',
  square: '/assets/logo/logo-icon-square.png',
  monochrome: '/assets/logo/logo-monochrome.svg'
};

export function CoteJurosLogo({ variant = 'horizontal', className = '' }) {
  const src = LOGO_MAP[variant] || LOGO_MAP.horizontal;
  const isSymbol = ['symbol', 'symbolLight', 'icon', 'square'].includes(variant);
  const heightClass = isSymbol ? 'h-11 w-11' : 'h-9 w-auto sm:h-10';

  return (
    <span className={cn('inline-flex items-center', className)} aria-label="Cote Juros">
      <img src={src} alt="Cote Juros" className={cn(heightClass, 'object-contain')} loading="eager" />
    </span>
  );
}
