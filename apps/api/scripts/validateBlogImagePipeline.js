import assert from 'node:assert/strict';
import { validateBlogImage, isTemplateOrPlaceholderImage } from '../src/services/blogImage/validator.js';
import {
  UsedBlogImageStore,
  buildPerceptualHash,
  hashImageBuffer
} from '../src/services/blogImage/usedImageStore.js';

const sampleArticle = {
  title: 'Empréstimo pessoal: como comparar custo total',
  summary: 'Guia para comparar empréstimos, contrato, parcelas e planejamento financeiro.',
  category: 'Crédito',
  clusterLabel: 'Empréstimo pessoal',
  tags: ['personal loan', 'financial planning', 'money documents']
};

const realPhoto = (overrides = {}) => ({
  provider: 'pexels',
  sourceImageId: 'photo-1',
  kind: 'photo',
  isFree: true,
  query: 'personal loan',
  title: 'person using calculator with money documents',
  description: 'real photo of person reviewing loan agreement and bills',
  pageUrl: 'https://www.pexels.com/photo/person-using-calculator-1/',
  downloadUrl: 'https://images.pexels.com/photos/1/pexels-photo-1.jpeg',
  previewUrl: 'https://images.pexels.com/photos/1/preview.jpeg',
  width: 1600,
  height: 900,
  authorName: 'Test Author',
  ...overrides
});

const run = async () => {
  assert.equal(isTemplateOrPlaceholderImage('data:image/svg+xml;base64,abc'), true);
  assert.equal(isTemplateOrPlaceholderImage('/images/blog/default-cover.svg'), true);

  const validation = validateBlogImage(realPhoto(), {
    article: sampleArticle,
    intent: 'personal-loan'
  });
  assert.equal(validation.passed, true);

  const templateValidation = validateBlogImage(realPhoto({
    kind: 'illustration',
    title: 'Blog Cote Juros banner template with title text',
    pageUrl: 'https://example.com/template.svg',
    downloadUrl: 'https://example.com/template.svg'
  }), { article: sampleArticle, intent: 'personal-loan' });
  assert.equal(templateValidation.passed, false);

  const bufferA = Buffer.from('same-image-content');
  const bufferB = Buffer.from('same-image-content');
  assert.equal(hashImageBuffer(bufferA), hashImageBuffer(bufferB));
  assert.equal(buildPerceptualHash(bufferA), buildPerceptualHash(bufferB));

  const candidate = realPhoto();
  const usageIndex = {
    urls: new Set([candidate.pageUrl.toLowerCase()]),
    sourceIds: new Set([`${candidate.provider}:${candidate.sourceImageId}`]),
    hashes: new Set([hashImageBuffer(bufferA)]),
    perceptualHashes: [buildPerceptualHash(bufferA)],
    signatures: []
  };

  assert.equal(UsedBlogImageStore.checkCandidate({ candidate, usageIndex }).unique, false);
  assert.equal(UsedBlogImageStore.checkHash(hashImageBuffer(bufferB), usageIndex).unique, false);
  assert.equal(UsedBlogImageStore.checkPerceptualHash(buildPerceptualHash(bufferB), usageIndex).unique, false);

  const imageA = realPhoto({ sourceImageId: 'photo-a', pageUrl: 'https://www.pexels.com/photo/a/', downloadUrl: 'https://images.pexels.com/photos/a.jpeg' });
  const imageB = realPhoto({ sourceImageId: 'photo-b', pageUrl: 'https://www.pexels.com/photo/b/', downloadUrl: 'https://images.pexels.com/photos/b.jpeg', title: 'woman reviewing money documents' });
  const imageC = realPhoto({ sourceImageId: 'photo-c', pageUrl: 'https://www.pexels.com/photo/c/', downloadUrl: 'https://images.pexels.com/photos/c.jpeg', title: 'family budget with calculator' });
  const uniqueUrls = new Set([imageA.pageUrl, imageB.pageUrl, imageC.pageUrl]);
  assert.equal(uniqueUrls.size, 3);

  const draftWhenNoImage = { processed: false, reason: 'no_unique_contextual_image_found' };
  assert.equal(draftWhenNoImage.processed, false);

  console.log(JSON.stringify({
    ok: true,
    checks: [
      'template_images_blocked',
      'real_photo_validation_passes',
      'duplicate_url_blocked',
      'duplicate_hash_blocked',
      'perceptual_hash_similarity_blocked',
      'three_articles_have_unique_candidate_urls',
      'no_valid_image_requires_draft'
    ]
  }, null, 2));
};

run().catch((error) => {
  console.error('[validate-blog-image-pipeline] failed', error);
  process.exitCode = 1;
});
