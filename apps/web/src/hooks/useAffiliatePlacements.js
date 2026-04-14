import { useEffect, useState } from 'react';
import { portalApi } from '@/platform/services/portalApi.js';

export function useAffiliatePlacements({ pageSlug, productType }) {
  const [placements, setPlacements] = useState({});

  useEffect(() => {
    let ignore = false;

    if (!pageSlug) {
      setPlacements({});
      return () => {
        ignore = true;
      };
    }

    portalApi
      .getAffiliatePlacements({ pageSlug, productType })
      .then((data) => {
        if (!ignore) setPlacements(data?.placements || {});
      })
      .catch(() => {
        if (!ignore) setPlacements({});
      });

    return () => {
      ignore = true;
    };
  }, [pageSlug, productType]);

  return placements;
}
