import { z } from 'zod';

const digitsOnly = (value) => String(value || '').replace(/\D/g, '');

export const creditasStateSchema = z.enum([
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS',
  'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC',
  'SE', 'SP', 'TO'
]);

export const creditasDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const creditasCpfSchema = z.union([z.string(), z.number()])
  .transform(digitsOnly)
  .refine((value) => value.length === 11, 'CPF deve conter 11 digitos.');
export const creditasPostalCodeSchema = z.union([z.string(), z.number()])
  .transform(digitsOnly)
  .refine((value) => value.length === 8, 'CEP deve conter 8 digitos.');
export const creditasPhoneCodeSchema = z.union([z.string(), z.number()])
  .transform(digitsOnly)
  .refine((value) => value.length === 2, 'DDD deve conter 2 digitos.');
export const creditasCellphoneSchema = z.union([z.string(), z.number()])
  .transform(digitsOnly)
  .refine((value) => value.length >= 8 && value.length <= 9, 'Celular deve conter 8 ou 9 digitos.');

export const creditasMoneySchema = z.number().positive();

export const creditasIntendedCreditSchema = z.object({
  currency: z.literal('BRL').default('BRL'),
  amount: creditasMoneySchema
}).passthrough();

export const creditasBacenAuthorizationSchema = z.object({
  authorizationTerms: z.string().min(10),
  bacenAuthorizedAt: creditasDateSchema,
  userAgent: z.string().min(1),
  userIp: z.string().min(3)
}).passthrough();

export const creditasOptInsSchema = z.object({
  whatsApp: z.boolean().optional(),
  sms: z.boolean().optional(),
  email: z.boolean().optional()
}).passthrough();

const professionalStatusSchema = z.enum([
  'CLT',
  'SELF_EMPLOYED',
  'BUSINESS_OWNER',
  'RETIRED',
  'PUBLIC_EMPLOYEE',
  'MILITARY',
  'UNEMPLOYED',
  'OTHER'
]);

const timeOfEmploymentSchema = z.enum([
  'LESS_THAN_SIX_MONTHS',
  'SIX_MONTHS_TO_ONE_YEAR',
  'ONE_TO_TWO_YEARS',
  'TWO_TO_THREE_YEARS',
  'MORE_THAN_THREE_YEARS'
]);

const autoBorrowerOfferSchema = z.object({
  email: z.string().email(),
  birthDate: creditasDateSchema,
  cellphone: creditasCellphoneSchema.optional(),
  cellphoneCode: creditasPhoneCodeSchema.optional(),
  monthlyIncome: creditasMoneySchema,
  professionalStatus: professionalStatusSchema,
  postalCode: creditasPostalCodeSchema,
  cpf: creditasCpfSchema,
  timeOfEmployment: timeOfEmploymentSchema.optional(),
  bacenAuthorization: creditasBacenAuthorizationSchema.optional()
}).passthrough();

const autoCollateralSchema = z.object({
  value: creditasMoneySchema,
  brand: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  modelYear: z.union([z.string(), z.number()]).optional(),
  modelVersion: z.string().min(1).optional(),
  manufacturingYear: z.union([z.string(), z.number()]).optional(),
  borrowerVehicleOwner: z.boolean(),
  licensePlate: z.string().min(7).max(8).optional(),
  ownerKinshipDegree: z.string().min(1).optional(),
  debt: z.number().min(0).optional(),
  numberOfDoors: z.number().int().positive().optional(),
  fuelType: z.string().min(1).optional(),
  accessoryPackage: z.string().min(1).optional(),
  pricingDetail: z.object({}).passthrough().optional()
}).passthrough();

const conditionsSchema = z.object({
  installment: z.union([
    z.number().int().positive(),
    z.object({ term: z.number().int().positive() }).passthrough()
  ])
}).passthrough();

export const creditasAutoOfferPayloadSchema = z.object({
  purpose: z.string().min(1).default('DEBTS_PAYMENT'),
  metadata: z.object({}).passthrough().optional(),
  intendedCredit: creditasIntendedCreditSchema,
  borrower: autoBorrowerOfferSchema,
  collateral: autoCollateralSchema
}).passthrough();

const autoBorrowerProposalSchema = autoBorrowerOfferSchema.extend({
  fullName: z.string().min(3),
  optIns: creditasOptInsSchema.optional(),
  authorizationTerms: z.string().min(10).optional()
}).passthrough();

export const creditasAutoProposalPayloadSchema = z.object({
  productType: z.literal('AUTO_REFI').default('AUTO_REFI'),
  offerId: z.string().min(1).optional(),
  purpose: z.string().min(1).optional(),
  metadata: z.object({}).passthrough().optional(),
  intendedCredit: creditasIntendedCreditSchema.optional(),
  conditions: conditionsSchema,
  borrower: autoBorrowerProposalSchema.partial().passthrough(),
  collateral: autoCollateralSchema.partial().passthrough().optional()
}).passthrough().superRefine((payload, ctx) => {
  if (!payload.offerId) {
    if (!payload.purpose) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['purpose'], message: 'purpose e obrigatorio quando offerId nao foi informado.' });
    }
    if (!payload.intendedCredit) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['intendedCredit'], message: 'intendedCredit e obrigatorio quando offerId nao foi informado.' });
    }
    if (!payload.collateral) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['collateral'], message: 'collateral e obrigatorio quando offerId nao foi informado.' });
    }
  }
});

const homeBorrowerSchema = z.object({
  fullName: z.string().min(3),
  email: z.string().email(),
  cpf: creditasCpfSchema,
  birthDate: creditasDateSchema,
  cellphone: creditasCellphoneSchema,
  cellphoneCode: creditasPhoneCodeSchema,
  postalCode: creditasPostalCodeSchema.optional(),
  monthlyIncome: creditasMoneySchema.optional(),
  authorizationTerms: z.string().min(10).optional(),
  optIns: creditasOptInsSchema.optional()
}).passthrough();

export const creditasHomeProposalPayloadSchema = z.object({
  productType: z.literal('HOME_REFI').default('HOME_REFI'),
  purpose: z.string().min(1).optional(),
  urgency: z.string().min(1).optional(),
  metadata: z.object({}).passthrough().optional(),
  intendedCredit: creditasIntendedCreditSchema.optional(),
  conditions: z.object({}).passthrough().optional(),
  borrower: homeBorrowerSchema,
  collateral: z.object({}).passthrough().optional()
}).passthrough();

export const creditasProposalRequestSchema = z.object({
  product: z.enum(['auto_equity', 'home_equity']).default('auto_equity'),
  payload: z.object({}).passthrough()
});

export const creditasProposalStatusQuerySchema = z.object({
  includes: z.enum(['metadata']).optional()
});

export const creditasDocumentPayloadSchema = z.object({}).passthrough();
