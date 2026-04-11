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
    <section
      className={`relative overflow-hidden border-b border-border hero-fintech-bg pt-20 pb-16 md:pt-24 md:pb-20 ${className}`}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[12%] top-[26%] h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.08)_0%,rgba(37,99,235,0)_72%)]" />
        <div className="absolute right-[10%] top-[16%] h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.06)_0%,rgba(37,99,235,0)_74%)]" />
      </div>

      <div className={`container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 ${centered ? 'text-center' : ''}`}>
        <div className={centered ? 'mx-auto max-w-4xl' : 'max-w-4xl'}>
          {badge ? (
            <Badge variant="outline" className="mb-5 border-primary/25 bg-white/70 text-primary">
              {badge}
            </Badge>
          ) : null}
          <h1 className="mb-4 text-foreground">
            {title}
          </h1>
          {subtitle ? (
            <p className="max-w-3xl text-lg font-normal leading-relaxed text-muted-foreground md:text-xl">
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
