import React from 'react';
import { cn } from '@/lib/utils.js';

export function CoteJurosLogo({ variant = 'horizontal', className = '' }) {
  const isSymbol = ['square', 'symbol', 'symbolLight', 'icon'].includes(variant);

  if (isSymbol) {
    return (
      <img
        src="/assets/logo/logo-icon.svg"
        alt="Cote Juros"
        className={cn('h-10 w-10 object-contain', className)}
        loading="eager"
      />
    );
  }

  const variantSrc = {
    dark: '/assets/logo/logo-dark.svg',
    monochrome: '/assets/logo/logo-monochrome.svg',
    horizontal: '/assets/logo/logo-primary.svg'
  };

  const src = variantSrc[variant] || variantSrc.horizontal;

  return <img src={src} alt="Cote Juros" className={cn('h-9 w-auto object-contain', className)} loading="eager" />;
}
