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

const sanitizeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

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

const buildAttributionHtml = ({ provider = '', sourceUrl = '' }) => {
  const attribution = getAttributionConfig(provider);

  return [
  '<!-- COTEJUROS-FREEPIK-IMAGE-START -->',
  `<figure class="wp-block-image size-large"><img src="{{IMAGE_URL}}" alt="{{ALT_TEXT}}" />`,
  `<figcaption>${sanitizeHtml(attribution.label)} <a href="${sanitizeHtml(attribution.sourceLink)}" target="_blank" rel="noopener noreferrer nofollow">${sanitizeHtml(attribution.sourceName)}</a></figcaption></figure>`,
  sourceUrl ? `<p><a href="${sanitizeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer nofollow">Fonte original da imagem</a></p>` : '',
  '<!-- COTEJUROS-FREEPIK-IMAGE-END -->'
].filter(Boolean).join('');
};

const replaceManagedTopBlock = ({ content = '', topHtml = '' }) => {
  const blockRegex = /<!-- COTEJUROS-FREEPIK-IMAGE-START -->[\s\S]*?<!-- COTEJUROS-FREEPIK-IMAGE-END -->/i;
  if (blockRegex.test(content)) {
    return content.replace(blockRegex, topHtml);
  }
  return `${topHtml}\n\n${content}`;
};

const findPostBySlug = async (slug) => {
  ensureWordpressConfigured();
  const response = await fetch(`${WP_BASE_URL}/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&_fields=id,slug,content,featured_media`, {
    headers: {
      Authorization: buildAuthHeader()
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`WordPress post lookup failed (${response.status}): ${text}`);
  }

  const posts = await response.json();
  return Array.isArray(posts) && posts.length ? posts[0] : null;
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

const updatePost = async ({ postId, payload }) => {
  const response = await fetch(`${WP_BASE_URL}/wp-json/wp/v2/posts/${postId}`, {
    method: 'POST',
    headers: {
      Authorization: buildAuthHeader(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`WordPress post update failed (${response.status}): ${text}`);
  }

  return response.json();
};

export const syncArticleImageToWordpress = async ({ slug, articleTitle, imageCandidate, buffer, contentType = 'image/jpeg' }) => {
  const post = await findPostBySlug(slug);

  const extension = extractMimeExtension(contentType);
  const filename = `${slug}.${extension}`;
  const altText = articleTitle || slug;
  const media = await uploadMedia({ buffer, filename, altText });

  if (!post) {
    await logger.warn('wordpress_post_not_found_media_uploaded_only', {
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
        label: getAttributionConfig(imageCandidate.provider).label,
        sourceName: getAttributionConfig(imageCandidate.provider).sourceName,
        url: getAttributionConfig(imageCandidate.provider).sourceLink,
        sourceUrl: imageCandidate.pageUrl || imageCandidate.downloadUrl,
        originalUrl: imageCandidate.pageUrl || imageCandidate.downloadUrl,
        syncedAt: new Date().toISOString(),
        wordpressPostFound: false
      },
      updatedPost: null
    };
  }

  const topHtml = buildAttributionHtml({
    provider: imageCandidate.provider,
    sourceUrl: imageCandidate.pageUrl || imageCandidate.downloadUrl
  })
    .replace('{{IMAGE_URL}}', sanitizeHtml(media.source_url))
    .replace('{{ALT_TEXT}}', sanitizeHtml(altText));

  const currentContent = post.content?.rendered || '';
  const nextContent = replaceManagedTopBlock({
    content: currentContent,
    topHtml
  });

  const postPayload = {
    featured_media: media.id,
    content: nextContent,
    meta: {
      cote_juros_image_original_url: imageCandidate.pageUrl || imageCandidate.downloadUrl,
      cote_juros_image_source: imageCandidate.provider,
      cote_juros_image_license_validated: '1'
    }
  };

  let updatedPost;
  try {
    updatedPost = await updatePost({
      postId: post.id,
      payload: postPayload
    });
  } catch (error) {
    await logger.warn('wordpress_image_meta_update_failed_retrying_without_meta', {
      slug,
      postId: post.id,
      error: error?.message || String(error)
    });
    updatedPost = await updatePost({
      postId: post.id,
      payload: {
        featured_media: media.id,
        content: nextContent
      }
    });
  }

  await logger.info('wordpress_image_synced', {
    slug,
    postId: post.id,
    mediaId: media.id,
    imageUrl: media.source_url
  });

  return {
    postId: post.id,
    mediaId: media.id,
    imageUrl: media.source_url,
    imageAttribution: {
      provider: imageCandidate.provider,
      label: getAttributionConfig(imageCandidate.provider).label,
      sourceName: getAttributionConfig(imageCandidate.provider).sourceName,
      url: getAttributionConfig(imageCandidate.provider).sourceLink,
      sourceUrl: imageCandidate.pageUrl || imageCandidate.downloadUrl,
      originalUrl: imageCandidate.pageUrl || imageCandidate.downloadUrl,
      syncedAt: new Date().toISOString()
    },
    updatedPost
  };
};
