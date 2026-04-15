import React from 'react';
import { Badge } from '@/components/ui/badge';

function PageHero({
  title,
  subtitle,
  badge,
  centered = false,
  className = '',
  eyebrow,
  children
}) {
  return (
    <section className={`hero-section border-b border-white/6 ${className}`}>
      <div className={`page-shell relative z-10 min-w-0 ${centered ? 'text-center' : ''}`}>
        <div className={centered ? 'mx-auto min-w-0 max-w-4xl' : 'min-w-0 max-w-4xl'}>
          {eyebrow ? (
            <p className={`mb-3 text-[13px] font-medium ${centered ? 'text-white/76' : 'text-white/76'}`}>{eyebrow}</p>
          ) : null}
          {badge ? (
            <Badge
              variant="outline"
              className="mb-4 max-w-full rounded-full border-white/10 bg-white/4 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-white/78 sm:mb-5"
            >
              {badge}
            </Badge>
          ) : null}
          <h1 className={`hero-title ${centered ? 'mx-auto' : ''}`}>{title}</h1>
          {subtitle ? (
            <p className={`hero-subtitle ${centered ? 'mx-auto' : ''}`}>{subtitle}</p>
          ) : null}
          {children ? <div className="mt-8 sm:mt-9">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}

export default PageHero;
