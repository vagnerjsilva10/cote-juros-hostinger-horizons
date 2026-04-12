import React from 'react';
import { motion } from 'framer-motion';
import AdSense from '@/components/AdSense.tsx';

export const ADSENSE_SLOT_IDS = {
  // Substitua cada valor abaixo pelo ID real do slot criado no Google AdSense.
  // Exemplo: header: '1234567890'
  header: '2308179938',
  inContent: '2308179938',
  sidebar: '2308179938',
  articleTop: '7825185943',
  articleInline: '7825185943',
  articleFooter: '7825185943',
  feed: '9247942893'
};

const ADSENSE_SLOT_CONFIG = {
  [ADSENSE_SLOT_IDS.header]: {
    format: 'fluid',
    layoutKey: '-cy-22+a-8q+m6',
    responsive: true
  },
  [ADSENSE_SLOT_IDS.inContent]: {
    format: 'fluid',
    layoutKey: '-cy-22+a-8q+m6',
    responsive: true
  },
  [ADSENSE_SLOT_IDS.sidebar]: {
    format: 'fluid',
    layoutKey: '-cy-22+a-8q+m6',
    responsive: true
  },
  [ADSENSE_SLOT_IDS.articleTop]: {
    format: 'fluid',
    layout: 'in-article',
    responsive: true
  },
  [ADSENSE_SLOT_IDS.articleInline]: {
    format: 'fluid',
    layout: 'in-article',
    responsive: true
  },
  [ADSENSE_SLOT_IDS.articleFooter]: {
    format: 'fluid',
    layout: 'in-article',
    responsive: true
  },
  [ADSENSE_SLOT_IDS.feed]: {
    format: 'auto',
    responsive: true
  }
};

export function AdSpace({
  width = '100%',
  height = '250px',
  className = '',
  adSlot = ADSENSE_SLOT_IDS.inContent,
  format = 'auto',
  responsive = true
}) {
  const slotConfig = ADSENSE_SLOT_CONFIG[adSlot] || {};
  const showPlaceholder = import.meta.env.DEV || String(adSlot).startsWith('CJ_');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className={`relative my-8 overflow-hidden rounded-lg border border-border border-dashed bg-muted/20 ${className}`}
      style={{ width, minHeight: height }}
    >
      <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-full border border-border bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Publicidade
      </div>

      <div className="flex w-full items-center justify-center px-3 py-10">
        <AdSense
          adSlot={adSlot}
          format={slotConfig.format || format}
          layout={slotConfig.layout}
          layoutKey={slotConfig.layoutKey}
          responsive={slotConfig.responsive ?? responsive}
          style={{ width: '100%', minHeight: height }}
        />

        {showPlaceholder ? (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
            <span className="text-sm font-medium text-muted-foreground">Espaço para anúncio</span>
            <span className="text-xs text-muted-foreground/80">Substitua o slot `{adSlot}` pelo ID real do AdSense.</span>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
