const PEXELS_ENDPOINT = 'https://api.pexels.com/v1/search';

export const searchPexelsImages = async ({ keywords = [], perKeyword = 2 }) => {
  if (!process.env.PEXELS_API_KEY) return [];

  const results = [];
  for (const keyword of (Array.isArray(keywords) ? keywords : []).slice(0, 10)) {
    const response = await fetch(`${PEXELS_ENDPOINT}?query=${encodeURIComponent(keyword)}&orientation=landscape&size=large&per_page=${perKeyword}`, {
      headers: {
        Authorization: process.env.PEXELS_API_KEY
      }
    });

    if (!response.ok) continue;
    const payload = await response.json();
    for (const photo of payload.photos || []) {
      results.push({
        provider: 'pexels',
        sourceImageId: String(photo.id || ''),
        kind: 'photo',
        isFree: true,
        attributionRequired: false,
        query: keyword,
        title: photo.alt || keyword,
        description: photo.alt || '',
        pageUrl: photo.url,
        downloadUrl: photo.src?.large2x || photo.src?.large || photo.src?.original,
        previewUrl: photo.src?.medium || photo.src?.large,
        width: photo.width,
        height: photo.height,
        authorName: photo.photographer || ''
      });
    }
  }

  return results;
};
