import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import {
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  canonicalUrl,
  createBreadcrumbSchema,
  createWebPageSchema
} from '@/seo/brandSeo.js';
import { portalApi } from '@/platform/services/portalApi.js';

function SeoHead({
  title,
  description,
  path = '/',
  type = 'website',
  image = DEFAULT_OG_IMAGE,
  robots = 'index,follow,max-image-preview:large',
  breadcrumbs = [],
  structuredData = [],
  children
}) {
  const [remoteSeo, setRemoteSeo] = useState(null);

  useEffect(() => {
    let active = true;
    portalApi.getSeoMeta(path)
      .then((data) => {
        if (active) setRemoteSeo(data || null);
      })
      .catch(() => {
        if (active) setRemoteSeo(null);
      });
    return () => {
      active = false;
    };
  }, [path]);

  const effectiveTitle = remoteSeo?.title || title;
  const effectiveDescription = remoteSeo?.description || description;
  const effectiveRobots = remoteSeo?.robots || robots;
  const effectiveImage = remoteSeo?.ogImage || image;
  const effectiveOgTitle = remoteSeo?.ogTitle || effectiveTitle;
  const effectiveOgDescription = remoteSeo?.ogDescription || effectiveDescription;
  const url = remoteSeo?.canonical || canonicalUrl(path);
  const breadcrumbSchema = createBreadcrumbSchema(breadcrumbs);
  const schemas = [
    createWebPageSchema({ title: effectiveTitle, description: effectiveDescription, path, breadcrumbs }),
    breadcrumbSchema,
    ...structuredData
  ].filter(Boolean);

  return (
    <Helmet>
      <title>{effectiveTitle}</title>
      <meta name="description" content={effectiveDescription} />
      <meta name="robots" content={effectiveRobots} />
      <link rel="canonical" href={url} />

      <meta property="og:type" content={type} />
      <meta property="og:title" content={effectiveOgTitle} />
      <meta property="og:description" content={effectiveOgDescription} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:image" content={effectiveImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={effectiveOgTitle} />
      <meta name="twitter:description" content={effectiveOgDescription} />
      <meta name="twitter:image" content={effectiveImage} />

      {schemas.map((schema, index) => (
        <script key={`${path}-schema-${index}`} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}

      {children}
    </Helmet>
  );
}

export default SeoHead;
