import * as React from 'react';

const PRIMARY = '#111827';
const SECONDARY = '#6B7280';

type LogoProps = React.SVGProps<SVGSVGElement> & {
  title?: string;
};

function SymbolMark() {
  return (
    <>
      <rect x="4" y="4" width="32" height="32" rx="10" fill="none" stroke={SECONDARY} strokeWidth="2" />
      <rect x="10" y="12" width="20" height="6" rx="3" fill={PRIMARY} />
      <rect x="10" y="22" width="14" height="6" rx="3" fill={PRIMARY} />
      <circle cx="28" cy="25" r="4" fill={SECONDARY} />
    </>
  );
}

export function LogoIcon({ title = 'Cote Juros Icon', ...props }: LogoProps) {
  const titleId = React.useId();

  return (
    <svg
      viewBox="0 0 40 40"
      role="img"
      aria-labelledby={titleId}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title id={titleId}>{title}</title>
      <SymbolMark />
    </svg>
  );
}

export function LogoFull({ title = 'Cote Juros', ...props }: LogoProps) {
  const titleId = React.useId();

  return (
    <svg
      viewBox="0 0 220 40"
      role="img"
      aria-labelledby={titleId}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title id={titleId}>{title}</title>
      <SymbolMark />
      <text
        x="52"
        y="26"
        fill={PRIMARY}
        fontFamily="Inter, Geist, Manrope, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fontSize="19"
        fontWeight="600"
        letterSpacing="-0.2"
      >
        CoteJuros
      </text>
    </svg>
  );
}

