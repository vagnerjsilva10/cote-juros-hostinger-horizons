import React from 'react';

export function CoteJurosLogo({ variant = 'horizontal', className = '' }) {
  const sources = {
    horizontal: '/assets/logo/logo-primary.png',
    horizontalDark: '/assets/logo/logo-primary.png',
    square: '/assets/logo/logo-icon-square.png',
    symbol: '/assets/logo/logo-icon-square.png',
    symbolLight: '/assets/logo/logo-icon-square.png',
    grayscale: '/assets/logo/logo-primary.png'
  };

  const src = sources[variant] || sources.horizontal;
  const isSymbol = variant === 'square' || variant === 'symbol' || variant === 'symbolLight';
  const alt = isSymbol ? 'Simbolo Cote Juros' : 'Logo Cote Juros';

  return <img src={src} alt={alt} className={className} loading="eager" decoding="async" />;
}
