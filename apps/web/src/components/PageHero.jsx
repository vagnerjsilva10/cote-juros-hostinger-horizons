import React from 'react';
import { Badge } from '@/components/ui/badge';

function PageHero({
  title,
  subtitle,
  badge,
  centered = false,
  className = '',
  children
}) {
  return (
    <section className={`relative overflow-hidden border-b border-border bg-background pb-10 pt-12 sm:pb-14 sm:pt-16 md:pb-20 md:pt-24 ${className}`}>
      <div className="pointer-events-none absolute inset-0">
        <div className="hero-grid absolute inset-0 opacity-70" />
        <div className="absolute left-[8%] top-[18%] h-40 w-40 rounded-full bg-slate-900/5 blur-3xl" />
        <div className="absolute right-[10%] top-[10%] h-52 w-52 rounded-full bg-slate-900/5 blur-3xl" />
      </div>

      <div className={`page-shell relative z-10 min-w-0 ${centered ? 'text-center' : ''}`}>
        <div className={centered ? 'mx-auto min-w-0 max-w-4xl' : 'min-w-0 max-w-4xl'}>
          {badge ? (
            <Badge variant="outline" className="mb-5 max-w-full text-center sm:mb-6">
              {badge}
            </Badge>
          ) : null}
          <h1 className="mb-3 max-w-4xl break-words text-foreground sm:mb-5">{title}</h1>
          {subtitle ? (
            <p className={`text-sm leading-7 text-muted-foreground sm:text-lg sm:leading-8 md:text-xl ${centered ? 'mx-auto max-w-3xl' : 'max-w-3xl'}`}>
              {subtitle}
            </p>
          ) : null}
          {children ? <div className="mt-6 sm:mt-8">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}

export default PageHero;
