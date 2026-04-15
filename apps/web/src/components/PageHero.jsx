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
    <section
      className={`relative overflow-hidden border-b border-border bg-background pb-14 pt-14 sm:pb-16 sm:pt-16 md:pb-[4.5rem] md:pt-[4.5rem] ${className}`}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="hero-premium-credit absolute inset-0" />
        <div className="hero-tech-grid absolute inset-0 opacity-[0.08]" />
        <div className="hero-top-glow absolute left-1/2 top-0 h-40 w-[34rem] -translate-x-1/2" />
        <div className="absolute left-[8%] top-[8%] h-36 w-36 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-[10%] top-[4%] h-44 w-44 rounded-full bg-violet-200/45 blur-3xl" />
      </div>

      <div className={`page-shell relative z-10 min-w-0 ${centered ? 'text-center' : ''}`}>
        <div className={centered ? 'mx-auto min-w-0 max-w-4xl' : 'min-w-0 max-w-4xl'}>
          {eyebrow ? <p className="mb-3 text-sm font-medium text-primary">{eyebrow}</p> : null}
          {badge ? (
            <Badge
              variant="outline"
              className="mb-4 max-w-full rounded-full border-white/80 bg-white/92 px-4 py-1.5 text-center shadow-[0_8px_18px_rgba(15,23,42,0.05)] backdrop-blur sm:mb-5"
            >
              {badge}
            </Badge>
          ) : null}
          <h1 className="mb-4 max-w-4xl break-words text-foreground sm:mb-[1.125rem]">{title}</h1>
          {subtitle ? (
            <p
              className={`text-base leading-[1.62] text-muted-foreground sm:text-[1.05rem] sm:leading-[1.68] ${
                centered ? 'mx-auto max-w-3xl' : 'max-w-3xl'
              }`}
            >
              {subtitle}
            </p>
          ) : null}
          {children ? <div className="mt-8 sm:mt-9">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}

export default PageHero;
