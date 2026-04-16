import React from 'react';
import { cn } from '@/lib/utils.js';
import AdSense from '@/components/AdSense.tsx';
import AdSenseScript from '@/components/AdSenseScript.tsx';

function AdSlotShell({
  label = 'Publicidade',
  minHeight = '120px',
  className,
  children
}) {
  return (
    <aside
      aria-label={label}
      className={cn(
        'blog-ad-slot min-w-0 overflow-hidden rounded-[20px] border border-border bg-white/90',
        className
      )}
      style={{ minHeight }}
    >
      <div className="border-b border-border/70 px-5 py-3 sm:px-6">
        <span className="blog-kicker inline-flex rounded-full border border-border bg-background px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </span>
      </div>

      <div className="relative">
        {children}
      </div>
    </aside>
  );
}

export const AdSlotHorizontal = ({ className }) => (
  <AdSlotShell
    className={cn('bg-background-secondary/70', className)}
    minHeight="156px"
  >
    <AdSenseScript />
    <div className="px-4 py-5 sm:px-6 sm:py-6">
      <AdSense
        adSlot="9247942893"
        format="auto"
        responsive
        style={{ minHeight: 96 }}
      />
    </div>
  </AdSlotShell>
);

export const AdSlotInline = ({ className }) => (
  <AdSlotShell
    className={className}
    minHeight="120px"
  >
    <AdSenseScript />
    <div className="px-4 py-5 sm:px-6">
      <AdSense
        adSlot="1892315338"
        format="fluid"
        responsive={false}
        layoutKey="-fb+5w+4e-db+86"
        style={{ minHeight: 90 }}
      />
    </div>
  </AdSlotShell>
);

export const AdSlotResponsive = ({ className }) => (
  <AdSlotShell
    className={cn('sm:min-h-[156px] md:min-h-[180px]', className)}
    minHeight="180px"
  >
    <AdSenseScript />
    <div className="px-4 py-5 sm:px-6 sm:py-6">
      <AdSense
        adSlot="7825185943"
        format="fluid"
        layout="in-article"
        responsive={false}
        style={{ minHeight: 120, textAlign: 'center' }}
      />
    </div>
  </AdSlotShell>
);

export default AdSlotShell;
