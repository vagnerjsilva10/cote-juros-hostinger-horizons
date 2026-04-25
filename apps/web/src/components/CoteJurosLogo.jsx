import React from 'react';
import { cn } from '@/lib/utils.js';

const LOGO_MAP = {
  original: '/brand/cote-juros-logo.svg',
  'original-light': '/brand/cote-juros-logo.svg',
  horizontal: '/brand/cote-juros-logo.svg',
  symbol: '/brand/cote-favicon.svg',
  symbolLight: '/brand/cote-favicon.svg',
  icon: '/brand/cote-favicon.svg',
  square: '/brand/cote-favicon.svg',
  monochrome: '/assets/logo/logo-monochrome.svg'
};

export function CoteJurosLogo({ variant = 'horizontal', className = '' }) {
  const src = LOGO_MAP[variant] || LOGO_MAP.horizontal;
  const isSymbol = ['symbol', 'symbolLight', 'icon', 'square'].includes(variant);
  const heightClass = isSymbol ? 'h-11 w-11' : 'h-12 w-auto';

  return (
    <span className={cn('inline-flex items-center', className)} aria-label="Cote Juros">
      <img src={src} alt="Cote Juros" className={cn(heightClass, 'object-contain')} loading="eager" />
    </span>
  );
}
