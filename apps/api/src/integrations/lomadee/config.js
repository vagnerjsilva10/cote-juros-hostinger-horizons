const LOMADEE_API_BASE_URL = 'https://api-beta.lomadee.com.br';

export const getLomadeeConfig = () => ({
  apiBaseUrl: process.env.LOMADEE_API_BASE_URL || LOMADEE_API_BASE_URL,
  apiKey: process.env.LOMADEE_API_KEY || '',
  defaultPageSlugs: (process.env.LOMADEE_DEFAULT_PAGE_SLUGS || '/ofertas')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean),
  defaultPlacements: (process.env.LOMADEE_DEFAULT_PLACEMENTS || 'below_hero,mid_content,before_faq,sidebar')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
});

export const isLomadeeConfigured = () => Boolean(getLomadeeConfig().apiKey);
