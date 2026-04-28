import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_PARTNERS = [
  {
    slug: 'supersim',
    name: 'SuperSim',
    affiliateUrl: process.env.SUPERSIM_AFFILIATE_URL || 'https://susim.co/XQLX5t8rSqYxaWnPd7CQaw==',
    shortDescription: 'Parceiro de credito pessoal online para comparacao de condicoes conforme o perfil informado.',
    highlights: [
      'Processo digital com analise do parceiro',
      'Condicoes sujeitas a criterios internos e disponibilidade'
    ],
    priority: 100,
    productTypes: ['loan'],
    ctaText: 'Ver condicoes'
  }
];

const isBlank = (value) => value == null || (typeof value === 'string' && value.trim() === '');
const isEmptyArray = (value) => !Array.isArray(value) || value.length === 0;
const hasEnoughHighlights = (value) => Array.isArray(value) && value.filter(Boolean).length >= 2;

const mergeMetadata = (currentMetadata, partner) => {
  const metadata = currentMetadata && typeof currentMetadata === 'object' && !Array.isArray(currentMetadata)
    ? { ...currentMetadata }
    : {};

  if (isBlank(metadata.affiliateUrl)) metadata.affiliateUrl = partner.affiliateUrl;
  if (isBlank(metadata.shortDescription)) metadata.shortDescription = partner.shortDescription;
  if (isBlank(metadata.description)) metadata.description = partner.shortDescription;
  if (!hasEnoughHighlights(metadata.highlights)) metadata.highlights = partner.highlights;
  if (isBlank(metadata.ctaText)) metadata.ctaText = partner.ctaText;
  if (isBlank(metadata.eventType)) metadata.eventType = `click_partner_${partner.slug}`;

  return metadata;
};

const buildCreateData = (partner) => ({
  name: partner.name,
  slug: partner.slug,
  integrationType: 'tracking_link',
  trackingLink: partner.affiliateUrl,
  productTypes: partner.productTypes,
  status: 'active',
  healthStatus: 'unknown',
  priority: partner.priority,
  weight: 1,
  metadata: mergeMetadata(null, partner),
  internalNotes: 'Seed minimo idempotente de parceiro para manter o comparador operacional.'
});

const buildUpdateData = (current, partner) => {
  const data = {};

  if (isBlank(current.name)) data.name = partner.name;
  if (isBlank(current.trackingLink)) data.trackingLink = partner.affiliateUrl;
  if (isEmptyArray(current.productTypes)) data.productTypes = partner.productTypes;
  if (current.priority == null) data.priority = partner.priority;
  if (isBlank(current.internalNotes)) {
    data.internalNotes = 'Seed minimo idempotente de parceiro para manter o comparador operacional.';
  }

  const nextMetadata = mergeMetadata(current.metadata, partner);
  if (JSON.stringify(nextMetadata) !== JSON.stringify(current.metadata || {})) {
    data.metadata = nextMetadata;
  }

  return data;
};

const seedPartner = async (partner) => {
  const current = await prisma.partnerConfig.findUnique({
    where: { slug: partner.slug }
  });

  const item = await prisma.partnerConfig.upsert({
    where: { slug: partner.slug },
    create: buildCreateData(partner),
    update: current ? buildUpdateData(current, partner) : {}
  });

  console.log(`[seed:partners] ${current ? 'verificado' : 'criado'} ${item.slug}`);
};

const main = async () => {
  for (const partner of DEFAULT_PARTNERS) {
    await seedPartner(partner);
  }
};

main()
  .catch((error) => {
    console.error('[seed:partners] erro', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
