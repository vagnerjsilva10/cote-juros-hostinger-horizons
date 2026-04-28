import { useEffect, useMemo, useState } from 'react';
import { portalApi } from '@/platform/services/portalApi.js';

const getPath = (object, path) =>
  String(path || '')
    .split('.')
    .filter(Boolean)
    .reduce((value, key) => (value && typeof value === 'object' ? value[key] : undefined), object);

const deepMerge = (base, override) => {
  if (!override || typeof override !== 'object' || Array.isArray(override)) return base;

  return Object.entries(override).reduce((next, [key, value]) => {
    if (value === undefined || value === null) return next;
    if (
      value
      && typeof value === 'object'
      && !Array.isArray(value)
      && next[key]
      && typeof next[key] === 'object'
      && !Array.isArray(next[key])
    ) {
      return { ...next, [key]: deepMerge(next[key], value) };
    }
    return { ...next, [key]: value };
  }, { ...base });
};

const setPath = (object, path, value) => {
  if (value === undefined || value === null || value === '') return object;
  const keys = String(path || '').split('.').filter(Boolean);
  if (!keys.length) return object;

  const next = { ...object };
  let cursor = next;
  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      cursor[key] = value;
      return;
    }
    cursor[key] = cursor[key] && typeof cursor[key] === 'object' && !Array.isArray(cursor[key])
      ? { ...cursor[key] }
      : {};
    cursor = cursor[key];
  });
  return next;
};

export function useSiteSettings() {
  const [settings, setSettings] = useState({ items: [], byKey: {} });

  useEffect(() => {
    let active = true;
    portalApi.getSiteSettings()
      .then((data) => {
        if (active) setSettings(data || { items: [], byKey: {} });
      })
      .catch(() => {
        if (active) setSettings({ items: [], byKey: {} });
      });
    return () => {
      active = false;
    };
  }, []);

  return settings;
}

export function usePageContent(pageKey, fallbackContent = {}) {
  const settings = useSiteSettings();

  return useMemo(() => {
    const byKey = settings?.byKey || {};
    const pageContent = byKey[`${pageKey}.content`];
    let content = deepMerge(fallbackContent, pageContent && typeof pageContent === 'object' ? pageContent : {});

    Object.entries(byKey).forEach(([key, value]) => {
      const prefix = `${pageKey}.`;
      if (!key.startsWith(prefix) || key === `${pageKey}.content`) return;
      content = setPath(content, key.slice(prefix.length), value);
    });

    return content;
  }, [fallbackContent, pageKey, settings?.byKey]);
}

export const settingValue = (settings, key, fallback = '') => {
  const value = settings?.byKey?.[key] ?? getPath(settings?.byKey || {}, key);
  return value === undefined || value === null || value === '' ? fallback : value;
};
