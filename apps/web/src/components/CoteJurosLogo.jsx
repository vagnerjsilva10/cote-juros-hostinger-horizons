
import React from 'react';

export function CoteJurosLogo({ variant = 'horizontal', className = '' }) {
  if (variant === 'square') {
    return (
      <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="64" height="64" rx="16" fill="#0F62FE" />
        <path d="M24 40V24h12a8 8 0 0 1 0 16H24zm6-10v4h4a2 2 0 0 0 0-4h-4z" fill="#ffffff" />
        <circle cx="44" cy="24" r="4" fill="#14B8A6" />
      </svg>
    );
  }

  if (variant === 'grayscale') {
    return (
      <svg viewBox="0 0 160 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="4" width="32" height="32" rx="8" fill="#94A3B8" />
        <path d="M10 26V14h6a4 4 0 0 1 0 8h-6zm3-5v2h2a1 1 0 0 0 0-2h-2z" fill="#ffffff" />
        <text x="44" y="26" fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="800" fontSize="20" fill="#475569">
          Cote Juros
        </text>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 160 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="4" width="32" height="32" rx="8" fill="#0F62FE" />
      <path d="M10 26V14h6a4 4 0 0 1 0 8h-6zm3-5v2h2a1 1 0 0 0 0-2h-2z" fill="#ffffff" />
      <circle cx="26" cy="14" r="3" fill="#14B8A6" />
      <text x="44" y="26" fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="800" fontSize="20" fill="#0F172A">
        Cote Juros
      </text>
    </svg>
  );
}
