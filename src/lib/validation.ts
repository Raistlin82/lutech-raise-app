import { z } from 'zod';

// Opportunity validation schema
export const OpportunitySchema = z.object({
  id: z.string().min(1, 'ID is required'),
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title too long'),
  clientName: z.string().min(2, 'Client name is required').max(200, 'Client name too long'),
  tcv: z.number().min(0, 'TCV must be positive').max(1000000000, 'TCV exceeds maximum'),
  raiseTcv: z.number().min(0, 'RAISE TCV must be positive').max(1000000000, 'RAISE TCV exceeds maximum'),
  industry: z.string().min(1, 'Industry is required'),
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
