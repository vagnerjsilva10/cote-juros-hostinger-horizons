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
      className={`relative overflow-hidden border-b border-slate-200/80 bg-[linear-gradient(180deg,#F8FAFF_0%,#EEF2FF_100%)] pt-20 pb-16 md:pt-24 md:pb-20 ${className}`}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[12%] top-[26%] h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.09)_0%,rgba(124,58,237,0)_72%)]" />
        <div className="absolute right-[10%] top-[16%] h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(15,98,254,0.08)_0%,rgba(15,98,254,0)_74%)]" />
      </div>

      <div className={`container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 ${centered ? 'text-center' : ''}`}>
        <div className={centered ? 'mx-auto max-w-4xl' : 'max-w-4xl'}>
          {badge ? (
            <Badge variant="outline" className="mb-5 border-primary/25 bg-white/70 text-primary">
              {badge}
            </Badge>
          ) : null}
          <h1 className="mb-4 text-4xl font-extrabold leading-tight tracking-[-0.02em] text-slate-900 md:text-5xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="max-w-3xl text-lg font-medium leading-relaxed text-slate-600 md:text-xl">
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

