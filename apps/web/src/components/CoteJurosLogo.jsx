import React from 'react';
import { cn } from '@/lib/utils.js';

const LOGO_MAP = {
  original: '/assets/logo/logo-current-site.svg',
  'original-light': '/assets/logo/logo-current-site-dark-native.svg',
  horizontal: '/assets/logo/logo-current-site.svg',
  symbol: '/assets/cote-juros-logo-symbol.svg',
  symbolLight: '/assets/cote-juros-logo-symbol-light.svg',
  icon: '/assets/logo/logo-icon.svg',
  square: '/assets/logo/logo-icon-square.png',
  monochrome: '/assets/logo/logo-monochrome.svg'
};

export function CoteJurosLogo({ variant = 'horizontal', className = '' }) {
  const src = LOGO_MAP[variant] || LOGO_MAP.horizontal;
  const isSymbol = ['symbol', 'symbolLight', 'icon', 'square'].includes(variant);
  const heightClass = isSymbol ? 'h-11 w-11' : 'h-7 w-auto';

  return (
    <span className={cn('inline-flex items-center', className)} aria-label="Cote Juros">
      <img src={src} alt="Cote Juros" className={cn(heightClass, 'object-contain')} loading="eager" />
    </span>
  );
}
