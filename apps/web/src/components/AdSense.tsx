import React, { CSSProperties, useEffect, useMemo, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

export type AdSenseProps = {
  adSlot: string;
  className?: string;
  style?: CSSProperties;
  format?: 'auto' | 'fluid' | string;
  responsive?: boolean;
};

export function AdSense({
  adSlot,
  className = '',
  style,
  format = 'auto',
  responsive = true
}: AdSenseProps) {
  const adRef = useRef<HTMLElement | null>(null);
  const hasPushedRef = useRef(false);

  const mergedStyle = useMemo<CSSProperties>(
    () => ({
      display: 'block',
      width: '100%',
      ...style
    }),
    [style]
  );

  useEffect(() => {
    if (!adRef.current || hasPushedRef.current) return;

    const adElement = adRef.current;
    const currentStatus = adElement.getAttribute('data-adsbygoogle-status');
    if (currentStatus) {
      hasPushedRef.current = true;
      return;
    }

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
      hasPushedRef.current = true;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('AdSense push falhou para o slot', adSlot, error);
      }
    }
  }, [adSlot, format, responsive]);

  return (
    <ins
      ref={adRef}
      className={`adsbygoogle ${className}`.trim()}
      style={mergedStyle}
      data-ad-client="ca-pub-2873725911890738"
      data-ad-slot={adSlot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? 'true' : 'false'}
    />
  );
}

export default AdSense;
