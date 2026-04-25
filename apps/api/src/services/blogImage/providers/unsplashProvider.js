const UNSPLASH_ENDPOINT = 'https://api.unsplash.com/search/photos';

export const searchUnsplashImages = async ({ keywords = [], perKeyword = 2 }) => {
  if (!process.env.UNSPLASH_ACCESS_KEY) return [];

  const results = [];
  for (const keyword of (Array.isArray(keywords) ? keywords : []).slice(0, 10)) {
    const response = await fetch(`${UNSPLASH_ENDPOINT}?query=${encodeURIComponent(keyword)}&orientation=landscape&per_page=${perKeyword}`, {
      headers: {
        Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
      }
    });

    if (!response.ok) continue;
    const payload = await response.json();
    for (const photo of payload.results || []) {
      results.push({
        provider: 'unsplash',
        sourceImageId: photo.id || '',
        kind: 'photo',
        isFree: true,
        attributionRequired: false,
        query: keyword,
        title: photo.alt_description || keyword,
        description: photo.description || photo.alt_description || '',
        pageUrl: photo.links?.html || '',
        downloadUrl: photo.urls?.regular || photo.urls?.full,
        previewUrl: photo.urls?.small || photo.urls?.regular,
        width: photo.width,
        height: photo.height,
        authorName: photo.user?.name || ''
      });
    }
  }

  return results;
};
