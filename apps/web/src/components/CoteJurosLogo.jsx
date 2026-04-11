import React from 'react';
import { cn } from '@/lib/utils.js';

export function CoteJurosLogo({ variant = 'horizontal', className = '' }) {
  const isSymbol = ['square', 'symbol', 'symbolLight', 'icon'].includes(variant);

  if (isSymbol) {
    return (
      <img
        src="/assets/logo/logo-icon.png"
        alt="Cote Juros"
        className={cn('h-14 w-14 object-contain', className)}
        loading="eager"
      />
    );
  }

  const variantSrc = {
    dark: '/assets/logo/logo-primary.png',
    monochrome: '/assets/logo/logo-primary.png',
    horizontal: '/assets/logo/logo-primary.png'
  };

  const src = variantSrc[variant] || variantSrc.horizontal;

  return <img src={src} alt="Cote Juros" className={cn('h-14 w-auto object-contain', className)} loading="eager" />;
}
