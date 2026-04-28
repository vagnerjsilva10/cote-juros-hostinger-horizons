import { useEffect, useState } from 'react';
import { portalApi } from '@/platform/services/portalApi.js';

export function useSiteDisclaimers(placement, fallback = []) {
  const [items, setItems] = useState(fallback);

  useEffect(() => {
    let active = true;
    portalApi.getSiteDisclaimers({ placement })
      .then((data) => {
        if (!active) return;
        setItems(Array.isArray(data) && data.length ? data : fallback);
      })
      .catch(() => {
        if (active) setItems(fallback);
      });
    return () => {
      active = false;
    };
  }, [placement]);

  return items;
}

export const disclaimerText = (items = [], key, fallback = '') =>
  items.find((item) => item.key === key)?.content || items[0]?.content || fallback;
