/**
 * @typedef {'loan'|'credit_card'|'financing'} ProductType
 * @typedef {'offer_click'|'partner_redirect'|'cta_click'} ClickEventType
 *
 * @typedef {{
 *   id: string,
 *   name: string,
 *   slug: string,
 *   logoUrl?: string,
 *   color?: string,
 *   website?: string,
 *   phone?: string,
 *   established?: number,
 *   metadata?: Record<string, unknown>
 * }} Bank
 *
 * @typedef {{
 *   id: string,
 *   code: string,
 *   label: string,
 *   kind: 'product'|'content'|'seo'
 * }} Category
 *
 * @typedef {{
 *   id: string,
 *   name: string,
 *   type: ProductType,
 *   categoryId: string,
 *   description?: string,
 *   metadata?: Record<string, unknown>
 * }} FinancialProduct
 *
 * @typedef {{
 *   id: string,
 *   bankId: string,
 *   bankName: string,
 *   productId: string,
 *   productType: ProductType,
 *   category: string,
 *   title: string,
 *   monthlyRate?: number,
 *   annualRate?: number,
 *   annualFee?: number,
 *   minValue?: number,
 *   maxValue?: number,
 *   minTerm?: number,
 *   maxTerm?: number,
 *   minLimit?: number,
 *   maxLimit?: number,
 *   minDownPayment?: number,
 *   maxDownPayment?: number,
 *   minIncome?: number,
 *   minScore?: string,
 *   benefits?: string[],
 *   requirements?: string[],
 *   image?: string,
 *   metadata?: Record<string, unknown>
 * }} Offer
 *
 * @typedef {{
 *   id: string,
 *   title: string,
 *   summary: string,
 *   content: string,
 *   category: string,
 *   publishDate: string,
 *   readTime: number,
 *   image?: string,
 *   slug: string,
 *   status?: 'draft'|'published'
 * }} Article
 *
 * @typedef {{
 *   id: string,
 *   path: string,
 *   title: string,
 *   description: string,
 *   heading: string,
 *   content: string[],
 *   type: string
 * }} SeoPage
 *
 * @typedef {{
 *   id: string,
 *   name: string,
 *   location: string,
 *   product: string,
 *   quote: string,
 *   result?: string,
 *   badge?: string,
 *   avatar?: string
 * }} Testimonial
 *
 * @typedef {{
 *   id: string,
 *   createdAt: string,
 *   sourcePage: string,
 *   productType?: ProductType,
 *   amount?: number,
 *   income?: number,
 *   score?: string,
 *   hasDebt?: boolean,
 *   employmentType?: string,
 *   cpfHash?: string,
 *   funnelStep?: string,
 *   utm?: Record<string, string>,
 *   metadata?: Record<string, unknown>
 * }} SimulationLead
 *
 * @typedef {{
 *   id: string,
 *   createdAt: string,
 *   type: ClickEventType,
 *   sourcePage: string,
 *   target: string,
 *   offerId?: string,
 *   partnerId?: string,
 *   productType?: ProductType,
 *   utm?: Record<string, string>,
 *   metadata?: Record<string, unknown>
 * }} ClickEvent
 *
 * @typedef {{
 *   id: string,
 *   partnerId: string,
 *   offerId?: string,
 *   destinationUrl: string,
 *   sourcePage: string,
 *   productType?: ProductType,
 *   utm?: Record<string, string>,
 *   metadata?: Record<string, unknown>
 * }} PartnerRedirect
 *
 * @typedef {{
 *   id: string,
 *   sourcePage: string,
 *   ctaId: string,
 *   ctaLabel: string,
 *   productType?: ProductType,
 *   campaign?: string,
 *   utm?: Record<string, string>,
 *   metadata?: Record<string, unknown>
 * }} CtaEvent
 *
 * @typedef {{
 *   id: string,
 *   sourcePage: string,
 *   target: 'cote_finance_ai',
 *   productType?: ProductType,
 *   campaign?: string,
 *   simulationContext?: Record<string, unknown>,
 *   utm?: Record<string, string>,
 *   metadata?: Record<string, unknown>
 * }} AppIntegrationEvent
 */

export {};

