import React from 'react';
import { cn } from '@/lib/utils.js';

function AdSlot({
  slot,
  label = 'Publicidade',
  title = 'Espaço editorial para anúncio',
  description = 'Estrutura pronta para AdSense, desativável sem quebrar o layout.',
  minHeight = '120px',
  className
}) {
  const adsEnabled = import.meta.env.VITE_ADSENSE_ENABLED === 'true';

  return (
    <aside
      aria-label={label}
      data-slot={slot}
      className={cn(
        'overflow-hidden rounded-[20px] border border-dashed border-border bg-white/80',
        className
      )}
      style={{ minHeight }}
    >
      <div className="flex h-full flex-col justify-center gap-2 px-5 py-5 text-center sm:px-6">
        <span className="mx-auto w-fit rounded-full border border-border bg-background px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </span>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mx-auto max-w-2xl text-sm leading-6 text-muted-foreground">
          {adsEnabled ? 'Slot habilitado para integração real.' : description}
        </p>
      </div>
    </aside>
  );
}

export const AdSlotInline = (props) => <AdSlot {...props} minHeight={props.minHeight || '120px'} />;

export const AdSlotHorizontal = (props) => (
  <AdSlot
    {...props}
    minHeight={props.minHeight || '156px'}
    className={cn('bg-background-secondary/70', props.className)}
  />
);

export const AdSlotResponsive = (props) => (
  <AdSlot
    {...props}
    minHeight={props.minHeight || '180px'}
    className={cn('sm:min-h-[156px] md:min-h-[180px]', props.className)}
  />
);

export default AdSlot;
