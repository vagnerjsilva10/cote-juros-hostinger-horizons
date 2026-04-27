import { createEditorialLogger } from '../editorialLogger.js';

const logger = createEditorialLogger('wordpress-image-publisher');
const WP_BASE_URL = (process.env.WORDPRESS_BASE_URL || '').replace(/\/$/, '');

const ensureWordpressConfigured = () => {
  if (!WP_BASE_URL || !process.env.WORDPRESS_USERNAME || !process.env.WORDPRESS_APPLICATION_PASSWORD) {
    throw new Error('Missing WORDPRESS_BASE_URL, WORDPRESS_USERNAME or WORDPRESS_APPLICATION_PASSWORD');
  }
};

const buildAuthHeader = () => `Basic ${Buffer.from(
  `${process.env.WORDPRESS_USERNAME}:${process.env.WORDPRESS_APPLICATION_PASSWORD}`
).toString('base64')}`;

const extractMimeExtension = (contentType = '') => {
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('webp')) return 'webp';
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg';
  return 'jpg';
};

const getAttributionConfig = (provider = '') => {
  if (provider === 'freepik') {
    return {
      label: 'Imagem: Freepik',
      sourceName: 'Freepik',
      sourceLink: 'https://www.freepik.com'
    };
  }

  if (provider === 'pexels') {
    return {
      label: 'Photo via Pexels',
      sourceName: 'Pexels',
      sourceLink: 'https://www.pexels.com'
    };
  }

  return {
    label: 'Photo via Unsplash',
    sourceName: 'Unsplash',
    sourceLink: 'https://unsplash.com'
  };
};

export const checkWordpressHealth = async () => {
  try {
    ensureWordpressConfigured();
    const started = Date.now();
    const response = await fetch(`${WP_BASE_URL}/wp-json/wp/v2/users/me?context=edit`, {
      headers: {
        Authorization: buildAuthHeader()
      }
    });
    const text = await response.text();
    let payload = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = { raw: text.slice(0, 500) };
    }

    return {
      ok: response.ok,
      status: response.status,
      responseTimeMs: Date.now() - started,
      baseUrl: WP_BASE_URL,
      user: payload?.name || payload?.slug || null,
      error: response.ok ? null : payload
    };
  } catch (error) {
    return {
      ok: false,
      baseUrl: WP_BASE_URL || null,
      error: error?.message || String(error)
    };
  }
};

const uploadMedia = async ({ buffer, filename, altText = '' }) => {
  ensureWordpressConfigured();

  const mediaResponse = await fetch(`${WP_BASE_URL}/wp-json/wp/v2/media`, {
    method: 'POST',
    headers: {
      Authorization: buildAuthHeader(),
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Type': 'image/jpeg'
    },
    body: buffer
  });

  if (!mediaResponse.ok) {
    const text = await mediaResponse.text();
    throw new Error(`WordPress media upload failed (${mediaResponse.status}): ${text}`);
  }

  const media = await mediaResponse.json();

  await fetch(`${WP_BASE_URL}/wp-json/wp/v2/media/${media.id}`, {
    method: 'POST',
    headers: {
      Authorization: buildAuthHeader(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      alt_text: altText
    })
  });

  return media;
};

export const syncArticleImageToWordpress = async ({ slug, articleTitle, imageCandidate, buffer, contentType = 'image/jpeg' }) => {
  const extension = extractMimeExtension(contentType);
  const filename = `${slug}.${extension}`;
  const altText = articleTitle || slug;
  const media = await uploadMedia({ buffer, filename, altText });

  await logger.info('wordpress_media_uploaded_for_cotejuros_article', {
    slug,
    mediaId: media.id,
    imageUrl: media.source_url
  });

  return {
    postId: null,
    mediaId: media.id,
    imageUrl: media.source_url,
    imageAttribution: {
      provider: imageCandidate.provider,
      mediaId: media.id,
      label: getAttributionConfig(imageCandidate.provider).label,
      sourceName: getAttributionConfig(imageCandidate.provider).sourceName,
      url: getAttributionConfig(imageCandidate.provider).sourceLink,
      sourceUrl: imageCandidate.pageUrl || imageCandidate.downloadUrl,
      originalUrl: imageCandidate.pageUrl || imageCandidate.downloadUrl,
      syncedAt: new Date().toISOString(),
      wordpressPostFound: false,
      mediaOnly: true
    },
    updatedPost: null
  };
};
