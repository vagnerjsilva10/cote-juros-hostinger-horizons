import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

function PageHero({
  title,
  subtitle,
  badge,
  breadcrumbs = [],
  centered = false,
  className = '',
  eyebrow,
  children
}) {
  return (
    <section className={`hero-section border-b border-white/[0.06] ${className}`}>
      <div className="hero-ambient-grid" aria-hidden="true" />
      <div className="hero-ambient-orb hero-ambient-orb-one" aria-hidden="true" />
      <div className="hero-ambient-orb hero-ambient-orb-two" aria-hidden="true" />
      <div className={`page-shell relative z-10 min-w-0 ${centered ? 'text-center' : ''}`}>
        <div className={centered ? 'mx-auto min-w-0 max-w-4xl' : 'min-w-0 max-w-4xl'}>
          {breadcrumbs.length > 1 ? (
            <nav
              className={`page-hero-breadcrumbs ${centered ? 'justify-center' : ''}`}
              aria-label="Breadcrumb"
            >
              {breadcrumbs.map((item, index) => {
                const isLast = index === breadcrumbs.length - 1;

                return (
                  <React.Fragment key={`${item.path || item.name}-${index}`}>
                    {isLast || !item.path ? (
                      <span aria-current={isLast ? 'page' : undefined}>{item.name}</span>
                    ) : (
                      <Link to={item.path}>{item.name}</Link>
                    )}
                    {!isLast ? <span aria-hidden="true">/</span> : null}
                  </React.Fragment>
                );
              })}
            </nav>
          ) : null}
          {eyebrow ? (
            <p className="page-hero-eyebrow mb-3 text-[13px] font-medium">{eyebrow}</p>
          ) : null}
          {badge ? (
            <Badge
              variant="outline"
              className="page-hero-badge mb-4 max-w-full rounded-full border-white/[0.10] bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-white/[0.78] sm:mb-5"
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
