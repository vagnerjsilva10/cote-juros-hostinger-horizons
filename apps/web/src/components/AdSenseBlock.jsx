import React, { useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export const ADSENSE_CLIENT_ID = 'ca-pub-2873725911890738';

export const ADSENSE_PLATFORM_SLOTS = {
  homeInline: '2308179938',
  blogTop: '9247942893',
  blogBottom: '9247942893',
  articleTop: '7825185943',
  articleInline: '1892315338',
  articleSidebar: '7825185943',
  compareResults: '2308179938'
};

export function AdSenseBlock({
  adSlot,
  className = '',
  format = 'auto',
  responsive = true,
  layout,
  layoutKey,
  minHeight = 120,
  theme = 'light',
  style
}) {
  const location = useLocation();
  const adRef = useRef(null);
  const pushedKeyRef = useRef('');

  const adKey = `${location.pathname}:${adSlot}:${format}:${layout || ''}:${layoutKey || ''}`;
  const wrapperClassName = `adsense-block adsense-block-${theme} ${className}`.trim();
  const adStyle = useMemo(() => ({
    display: 'block',
    minHeight,
    width: '100%',
    ...style
  }), [minHeight, style]);

  useEffect(() => {
    if (typeof window === 'undefined' || !adRef.current) return;
    if (pushedKeyRef.current === adKey) return;

    const adElement = adRef.current;
    if (adElement.getAttribute('data-adsbygoogle-status')) {
      pushedKeyRef.current = adKey;
      return;
    }

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
      pushedKeyRef.current = adKey;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('AdSense push falhou', { adSlot, error });
      }
    }
  }, [adKey, adSlot]);

  return (
    <aside className={wrapperClassName} aria-label="Publicidade">
      <span className="adsense-block-label">Publicidade</span>
      <ins
        key={adKey}
        ref={adRef}
        className="adsbygoogle"
        style={adStyle}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={adSlot}
        data-ad-format={format}
        data-ad-layout={layout}
        data-ad-layout-key={layoutKey}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </aside>
  );
}

export default AdSenseBlock;
