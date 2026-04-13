import React, { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils.js';
import { resolveArticleImageAlt, resolveArticleImageSources } from '@/lib/content/blogImages.js';

function ArticleCoverImage({
  article,
  alt,
  className,
  imageClassName,
  aspectRatio = '16 / 9',
  loading = 'lazy',
  decoding = 'async'
}) {
  const imageSet = useMemo(() => resolveArticleImageSources(article), [article]);
  const resolvedAlt = alt || resolveArticleImageAlt(article);
  const [srcIndex, setSrcIndex] = useState(0);

  useEffect(() => {
    setSrcIndex(0);
  }, [imageSet.primary]);

  const sources = useMemo(() => [imageSet.primary, ...imageSet.fallbacks], [imageSet]);
  const currentSrc = sources[srcIndex] || imageSet.primary;

  const handleError = () => {
    setSrcIndex((current) => {
      if (current >= sources.length - 1) return current;
      return current + 1;
    });
  };

  return (
    <div className={cn('relative w-full overflow-hidden bg-slate-100', className)} style={aspectRatio ? { aspectRatio } : undefined}>
      <img
        src={currentSrc}
        alt={resolvedAlt}
        loading={loading}
        decoding={decoding}
        onError={handleError}
        className={cn('h-full w-full object-cover object-center', imageClassName)}
      />
    </div>
  );
}

export default ArticleCoverImage;
