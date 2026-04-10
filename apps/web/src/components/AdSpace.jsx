
import React from 'react';
import { motion } from 'framer-motion';

export function AdSpace({ width = '100%', height = '250px', className = '' }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className={`flex items-center justify-center bg-muted/20 border border-border border-dashed rounded-lg my-8 overflow-hidden ${className}`}
      style={{ width, minHeight: height }}
    >
      {/* Google Adsense Script Placeholder */}
      {/* <ins className="adsbygoogle" style={{ display: 'block' }} data-ad-client="ca-pub-XXXXXX" data-ad-slot="XXXXXX" data-ad-format="auto" data-full-width-responsive="true"></ins> */}
      {/* <script>(adsbygoogle = window.adsbygoogle || []).push({});</script> */}
      <span className="text-sm text-muted-foreground font-medium">Espaço para anúncio</span>
    </motion.div>
  );
}
