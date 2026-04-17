import React from 'react';
import { Helmet } from 'react-helmet';
import {
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  canonicalUrl,
  createBreadcrumbSchema,
  createWebPageSchema
} from '@/seo/brandSeo.js';

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
  const url = canonicalUrl(path);
  const breadcrumbSchema = createBreadcrumbSchema(breadcrumbs);
  const schemas = [
    createWebPageSchema({ title, description, path, breadcrumbs }),
    breadcrumbSchema,
    ...structuredData
  ].filter(Boolean);

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={url} />

      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:image" content={image} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

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
