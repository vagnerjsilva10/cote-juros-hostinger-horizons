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
    <section className={`relative overflow-hidden border-b border-border bg-background pt-20 pb-16 md:pt-24 md:pb-20 ${className}`}>
      <div className="pointer-events-none absolute inset-0">
        <div className="hero-grid absolute inset-0 opacity-70" />
        <div className="absolute left-[8%] top-[18%] h-40 w-40 rounded-full bg-slate-900/5 blur-3xl" />
        <div className="absolute right-[10%] top-[10%] h-52 w-52 rounded-full bg-slate-900/5 blur-3xl" />
      </div>

      <div className={`page-shell relative z-10 ${centered ? 'text-center' : ''}`}>
        <div className={centered ? 'mx-auto max-w-4xl' : 'max-w-4xl'}>
          {badge ? (
            <Badge variant="outline" className="mb-6">
              {badge}
            </Badge>
          ) : null}
          <h1 className="mb-5 max-w-4xl text-foreground">{title}</h1>
          {subtitle ? (
            <p className={`text-lg leading-8 text-muted-foreground md:text-xl ${centered ? 'mx-auto max-w-3xl' : 'max-w-3xl'}`}>
              {subtitle}
            </p>
          ) : null}
          {children ? <div className="mt-8">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}

export default PageHero;
