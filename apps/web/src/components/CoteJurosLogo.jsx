import React from 'react';

export function CoteJurosLogo({ variant = 'horizontal', className = '' }) {
  const sources = {
    horizontal: '/assets/logo/logo-primary.svg',
    horizontalDark: '/assets/logo/logo-dark.svg',
    square: '/assets/logo/logo-icon.svg',
    symbol: '/assets/logo/logo-icon.svg',
    symbolLight: '/assets/logo/logo-icon.svg',
    grayscale: '/assets/logo/logo-primary.svg'
  };

  const src = sources[variant] || sources.horizontal;
  const isSymbol = variant === 'square' || variant === 'symbol' || variant === 'symbolLight';
  const alt = isSymbol ? 'Simbolo Cote Juros' : 'Logo Cote Juros';

  return <img src={src} alt={alt} className={className} loading="eager" decoding="async" />;
}
