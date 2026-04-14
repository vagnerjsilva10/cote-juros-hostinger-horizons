const ADMITAD_API_BASE_URL = 'https://api.admitad.com';
const ADMITAD_OAUTH_BASE_URL = 'https://api.admitad.com';

export const getAdmitadConfig = () => ({
  apiBaseUrl: process.env.ADMITAD_API_BASE_URL || ADMITAD_API_BASE_URL,
  oauthBaseUrl: process.env.ADMITAD_OAUTH_BASE_URL || ADMITAD_OAUTH_BASE_URL,
  accessToken: process.env.ADMITAD_ACCESS_TOKEN || '',
  clientId: process.env.ADMITAD_CLIENT_ID || '',
  clientSecret: process.env.ADMITAD_CLIENT_SECRET || '',
  scope: process.env.ADMITAD_SCOPE || 'advcampaigns',
  clickRefParam: process.env.ADMITAD_CLICKREF_PARAM || 'subid',
  defaultWebsite: process.env.ADMITAD_DEFAULT_WEBSITE || ''
});

export const isAdmitadConfigured = () => {
  const config = getAdmitadConfig();
  return Boolean(config.accessToken || (config.clientId && config.clientSecret));
};
