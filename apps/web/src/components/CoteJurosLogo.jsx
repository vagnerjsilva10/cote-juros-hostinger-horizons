import React from 'react';
import { LogoFull, LogoIcon } from './Logo.tsx';

export function CoteJurosLogo({ variant = 'horizontal', className = '' }) {
  const isSymbol = variant === 'square' || variant === 'symbol' || variant === 'symbolLight';
  const title = isSymbol ? 'Simbolo Cote Juros' : 'Logo Cote Juros';

  if (isSymbol) {
    return <LogoIcon className={className} title={title} />;
  }

  return <LogoFull className={className} title={title} />;
}
