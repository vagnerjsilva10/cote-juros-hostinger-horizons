import React from 'react';

export function CoteJurosLogo({ variant = 'horizontal', className = '' }) {
  const sources = {
    horizontal: '/assets/logo/logo-primary.svg',
    horizontalDark: '/assets/logo/logo-primary.svg',
    square: '/assets/logo/logo-icon.svg',
    symbol: '/assets/logo/logo-icon.svg',
    symbolLight: '/assets/logo/logo-icon.svg',
    grayscale: '/assets/logo/logo-primary.svg'
  };

  const isSymbol = variant === 'square' || variant === 'symbol' || variant === 'symbolLight';
  const src = sources[variant] || sources.horizontal;
  const title = isSymbol ? 'Simbolo Cote Juros' : 'Logo Cote Juros';

  return <img src={src} alt={title} className={className} loading="eager" decoding="async" />;
}
