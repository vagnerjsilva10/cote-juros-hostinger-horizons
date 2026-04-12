import React from 'react';
import { motion } from 'framer-motion';
import AdSense from '@/components/AdSense.tsx';

export const ADSENSE_SLOT_IDS = {
  // Substitua cada valor abaixo pelo ID real do slot criado no Google AdSense.
  // Exemplo: header: '1234567890'
  header: 'CJ_HEADER_SLOT',
  inContent: 'CJ_INCONTENT_SLOT',
  sidebar: 'CJ_SIDEBAR_SLOT',
  articleTop: 'CJ_ARTICLE_TOP_SLOT',
  articleInline: 'CJ_ARTICLE_INLINE_SLOT',
  articleFooter: 'CJ_ARTICLE_FOOTER_SLOT',
  feed: 'CJ_FEED_SLOT'
};

export function AdSpace({
  width = '100%',
  height = '250px',
  className = '',
  adSlot = ADSENSE_SLOT_IDS.inContent,
  format = 'auto',
  responsive = true
}) {
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
          format={format}
          responsive={responsive}
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
