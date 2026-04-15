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
    <section className={`relative overflow-hidden border-b border-border bg-background pb-20 pt-20 sm:pb-24 sm:pt-24 md:pb-28 md:pt-28 ${className}`}>
      <div className="pointer-events-none absolute inset-0">
        <div className="hero-premium-clean absolute inset-0" />
        <div className="hero-tech-grid absolute inset-0 opacity-22" />
        <div className="absolute left-[8%] top-[12%] h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute right-[10%] top-[8%] h-52 w-52 rounded-full bg-sky-100/50 blur-3xl" />
      </div>

      <div className={`page-shell relative z-10 min-w-0 ${centered ? 'text-center' : ''}`}>
        <div className={centered ? 'mx-auto min-w-0 max-w-4xl' : 'min-w-0 max-w-4xl'}>
          {eyebrow ? <p className="mb-3 text-sm font-medium text-primary">{eyebrow}</p> : null}
          {badge ? (
            <Badge variant="outline" className="mb-5 max-w-full rounded-full border-white/80 bg-white/92 px-4 py-1.5 text-center shadow-[0_8px_18px_rgba(15,23,42,0.05)] backdrop-blur sm:mb-6">
              {badge}
            </Badge>
          ) : null}
          <h1 className="mb-4 max-w-4xl break-words text-foreground sm:mb-5">{title}</h1>
          {subtitle ? (
            <p className={`text-base leading-[1.7] text-muted-foreground sm:text-lg sm:leading-[1.7] ${centered ? 'mx-auto max-w-3xl' : 'max-w-3xl'}`}>
              {subtitle}
            </p>
          ) : null}
          {children ? <div className="mt-10 sm:mt-12">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}

export default PageHero;
