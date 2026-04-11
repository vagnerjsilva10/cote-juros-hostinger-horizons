
import React from 'react';

export function CoteJurosLogo({ variant = 'horizontal', className = '' }) {
  const sources = {
    horizontal: '/assets/cote-juros-logo-horizontal-light.svg',
    horizontalDark: '/assets/cote-juros-logo-horizontal-dark.svg',
    square: '/assets/cote-juros-logo-symbol.svg',
    symbol: '/assets/cote-juros-logo-symbol.svg',
    symbolLight: '/assets/cote-juros-logo-symbol-light.svg',
    grayscale: '/assets/cote-juros-logo-horizontal-light.svg'
  };

  const src = sources[variant] || sources.horizontal;
  const isSymbol = variant === 'square' || variant === 'symbol' || variant === 'symbolLight';
  const alt = isSymbol ? 'Símbolo Cote Juros' : 'Logo Cote Juros';

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="eager"
      decoding="async"
    />
  );
}
