import { z } from 'zod';

// Opportunity validation schema
export const OpportunitySchema = z.object({
  id: z.string().min(1, 'ID is required'),
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title too long'),

  // Customer relationship (v1.1.0)
  customerId: z.string().uuid().optional(),

  // Deprecated fields (backward compatibility)
  clientName: z.string().min(2, 'Client name is required').max(200, 'Client name too long').optional(),
  industry: z.string().min(1, 'Industry is required').optional(),

  tcv: z.number().min(0, 'TCV must be positive').max(1000000000, 'TCV exceeds maximum'),
  raiseTcv: z.number().min(0, 'RAISE TCV must be positive').max(1000000000, 'RAISE TCV exceeds maximum'),
  currentPhase: z.enum(['Planning', 'ATP', 'ATS', 'ATC', 'Won', 'Lost', 'Handover']),

  // Flags
  hasKcpDeviations: z.boolean(),
  isFastTrack: z.boolean(),
  isRti: z.boolean(),
  isMandataria: z.boolean().optional(),
  isPublicSector: z.boolean(),
  hasSocialClauses: z.boolean().optional(),
  isNonCoreBusiness: z.boolean().optional(),
  hasLowRiskServices: z.boolean().optional(),
  isSmallTicket: z.boolean().optional(),
  isNewCustomer: z.boolean().optional(),
  isChild: z.boolean().optional(),
  hasSuppliers: z.boolean().optional(),
  supplierAlignment: z.enum(['BackToBack', 'ClientConditions', 'SupplierConditions', 'Misaligned']).optional(),

  // Calculated
  raiseLevel: z.enum(['L1', 'L2', 'L3', 'L4', 'L5', 'L6']),

  // Data
  deviations: z.array(z.object({
    id: z.string(),
    type: z.enum(['Financial', 'Legal', 'Compliance', 'Operations', 'Other']),
    description: z.string(),
    expertOpinion: z.enum(['Green', 'Red', 'Yellow']).optional(),
    expertName: z.string().optional(),
  })),

  checkpoints: z.record(z.string(), z.array(z.any())), // Simplified for now

  // Financials
  marginPercent: z.number().min(0).max(100).optional(),
  firstMarginPercent: z.number().min(0).max(100).optional(),
  cashFlowNeutral: z.boolean().optional(),
  servicesValue: z.number().min(0).optional(),
  privacyRiskLevel: z.enum(['Low', 'Medium', 'High', 'VeryHigh']).optional(),

  // Dates
  offerDate: z.union([z.date(), z.string()]).optional(),
  contractDate: z.union([z.date(), z.string()]).optional(),
  orderDate: z.union([z.date(), z.string()]).optional(),
  atsDate: z.union([z.date(), z.string()]).optional(),
  atcDate: z.union([z.date(), z.string()]).optional(),
  rcpDate: z.union([z.date(), z.string()]).optional(),
}).refine((data) => data.raiseTcv >= data.tcv, {
  message: 'RAISE TCV must be greater than or equal to TCV',
  path: ['raiseTcv'],
});

export type ValidatedOpportunity = z.infer<typeof OpportunitySchema>;

// Partial schema for updates (all fields optional)
export const OpportunityUpdateSchema = OpportunitySchema.partial();

// Helper functions
export function validateOpportunity(data: unknown) {
  return OpportunitySchema.safeParse(data);
}

export function validateOpportunityUpdate(data: unknown) {
  return OpportunityUpdateSchema.safeParse(data);
}

// Storage validation (for localStorage data)
export const StorageOpportunitiesSchema = z.array(OpportunitySchema);

export function validateStorageData(data: unknown) {
  return StorageOpportunitiesSchema.safeParse(data);
}

// Customer validation schema
export const CustomerSchema = z.object({
  id: z.string().uuid('ID must be valid UUID'),
  name: z.string()
    .min(2, 'Customer name must be at least 2 characters')
    .max(200, 'Customer name must be less than 200 characters')
    .trim(),
  industry: z.enum([
    'Technology',
    'Manufacturing',
    'Finance',
    'Healthcare',
    'Retail',
    'Energy',
    'Transportation',
    'Public Administration',
    'Telecommunications',
    'Consulting'
  ], {
    message: 'Invalid industry'
  }),
  isPublicSector: z.boolean(),
});

export const validateCustomer = (data: unknown) => {
  return CustomerSchema.safeParse(data);
};

export const validateCustomerArray = (data: unknown) => {
  return z.array(CustomerSchema).safeParse(data);
};
