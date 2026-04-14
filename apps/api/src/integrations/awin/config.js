const AWIN_API_BASE_URL = 'https://api.awin.com';

export const getAwinConfig = () => ({
  apiBaseUrl: process.env.AWIN_API_BASE_URL || AWIN_API_BASE_URL,
  token: process.env.AWIN_API_TOKEN || '',
  publisherId: process.env.AWIN_PUBLISHER_ID || '',
  clickRefParam: process.env.AWIN_CLICKREF_PARAM || 'clickref'
});

export const isAwinConfigured = () => Boolean(getAwinConfig().token);
