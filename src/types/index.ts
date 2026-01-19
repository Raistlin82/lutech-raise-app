export type RaiseLevel = 'L6' | 'L5' | 'L4' | 'L3' | 'L2' | 'L1';
export type Phase = 'Planning' | 'ATP' | 'ATS' | 'Awaiting' | 'ATC' | 'Won' | 'Lost' | 'Handover';
export type PhaseError = {
  message: string;
  code: string;
};

export interface TemplateLink {
  name: string; // Nome del template (es. "MOD-092", "Slide Deck ATP")
  url: string; // URL diretto al template
}

export interface Checkpoint {
  id: string;
  label: string;
  checked: boolean;
  required: boolean;
  order?: number; // Order number within phase (1, 2, 3...)
  description?: string;
  documentRef?: string; // ID of the required document
  attachments?: File[]; // Serializable file representation (optional/unused in checklist mode)
  templateRef?: string; // Link to template if applicable (legacy, kept for compatibility)
  actionType?: 'document' | 'email' | 'notification' | 'task';
  detailedDescription?: string; // Descrizione estesa/istruzioni dall'Excel
  folderPath?: string; // Percorso cartella SharePoint dove salvare
  templateLinks?: TemplateLink[]; // Array di link ai template (per documenti multipli)
  mandatoryNotes?: string; // Note sulla mandatorietà dall'Excel (per pop-up)
}

export interface KcpDeviation {
  id: string;
  type: 'Financial' | 'Legal' | 'Compliance' | 'Operations' | 'Other';
  description: string;
  expertOpinion?: 'Green' | 'Red' | 'Yellow';
  expertName?: string;
}

export interface Lot {
  id: string;
  name: string;
  tcv: number;
  raiseTcv: number;
  marginPercent: number;
  description?: string;
}

export interface Opportunity {
  id: string;
  title: string;

  // Multi-Lot Support
  isMultiLot?: boolean;
  areLotsMutuallyExclusive?: boolean;
  lots?: Lot[];

  // Customer relationship (NEW - v1.1.0)
  customerId?: string;     // Foreign key to Customer (will be required after migration)

  // Deprecated fields (kept for backward compatibility)
  clientName?: string;     // DEPRECATED: Use customerId instead
  industry?: string;       // DEPRECATED: Derived from customer

  tcv: number; // Total Contract Value (committed value)
  raiseTcv: number; // RAISE TCV (includes optional parts, must be >= tcv)

  // Phase Status
  currentPhase: Phase;

  // Flags
  hasKcpDeviations: boolean;
  isFastTrack: boolean;
  isRti: boolean; // Raggruppamento Temporaneo di Imprese
  isMandataria?: boolean; // If true, Lutech is the leading mandatory
  isPublicSector: boolean;

  // Critical Risk Flags (PSQ-003 §5.4)
  hasSocialClauses?: boolean; // Clausole sociali (impegno ad assumere personale) -> L1
  isNonCoreBusiness?: boolean; // Attività NON nel core business Lutech -> L1
  hasLowRiskServices?: boolean; // Servizi >= 200k con rischi < 3% -> L2
  isSmallTicket?: boolean; // TCV < 5k€ -> Pre-approvazione Industry Head required
  isNewCustomer?: boolean; // Nuovo cliente (aumenta livello di 1 fino a L4)
  isChild?: boolean; // Opportunità child (eccezione per alcuni controlli)

  // Reselling Management (PSQ-003 v17)
  hasSuppliers?: boolean; // Presenza fornitori
  supplierAlignment?: 'BackToBack' | 'ClientConditions' | 'SupplierConditions' | 'Misaligned';

  // Calculations
  raiseLevel: RaiseLevel;

  // Data
  deviations: KcpDeviation[];
  checkpoints: Record<string, Checkpoint[]>; // Keyed by Phase

  // Financials
  marginPercent?: number;
  firstMarginPercent?: number; // First Margin % (per under-margin controls)
  cashFlowNeutral?: boolean;

  // Services specific (for low risk check)
  servicesValue?: number; // Valore dei servizi (ToW=Services)

  // Privacy Risk (for Expert DPM)
  privacyRiskLevel?: 'Low' | 'Medium' | 'High' | 'VeryHigh';

  // Date tracking (for congruence checks)
  offerDate?: Date | string; // Data offerta
  contractDate?: Date | string; // Data contratto
  orderDate?: Date | string; // Data ordine
  atsDate?: Date | string; // Data ATS da Salesforce
  atcDate?: Date | string; // Data ATC da Salesforce
  rcpDate?: Date | string; // Data RCP

  // Multi-user segregation
  createdByEmail?: string; // User email (from SAP IAS JWT)
  createdAt?: string; // ISO 8601 timestamp
  updatedAt?: string; // ISO 8601 timestamp
}

export const RAISE_LEVELS: Record<RaiseLevel, { min: number; max: number; label: string }> = {
  L6: { min: 0, max: 250000, label: 'L6 (<250k)' },
  L5: { min: 250000, max: 500000, label: 'L5 (250k-500k)' },
  L4: { min: 500000, max: 1000000, label: 'L4 (500k-1M)' },
  L3: { min: 1000000, max: 10000000, label: 'L3 (1M-10M)' },
  L2: { min: 10000000, max: 20000000, label: 'L2 (10M-20M)' },
  L1: { min: 20000000, max: Infinity, label: 'L1 (>20M)' },
};

export interface ControlConfig {
  id: string;
  label: string;
  description: string;
  phase: 'Planning' | 'ATP' | 'ATS' | 'ATC' | 'Handover' | 'ALL'; // ALL = applies to all phases
  order?: number; // Position within phase (1, 2, 3...) - will be required after migration
  isMandatory: boolean;
  templateRef?: string; // Name or URL of the template (legacy)
  actionType?: 'document' | 'email' | 'notification' | 'task';
  condition?: string; // Logic string e.g. "tcv > 1000000" or "hasKcpDeviations"
  detailedDescription?: string; // Descrizione estesa/istruzioni dall'Excel
  folderPath?: string; // Percorso cartella dove salvare il documento (es. "/SharePoint/Documents/ATP/")
  templateLinks?: TemplateLink[]; // Array di link ai template (supporta documenti multipli)
  mandatoryNotes?: string; // Note sulla mandatorietà dall'Excel (per pop-up)
}

// Industry enum (10 predefined sectors)
export type Industry =
  | 'Technology'
  | 'Manufacturing'
  | 'Finance'
  | 'Healthcare'
  | 'Retail'
  | 'Energy'
  | 'Transportation'
  | 'Public Administration'
  | 'Telecommunications'
  | 'Consulting';

// Customer entity
export interface Customer {
  id: string;              // UUID
  name: string;            // Min 2, max 200 chars
  industry: Industry;      // Enum
  isPublicSector: boolean; // Public Administration flag
}

// Authorization Matrix Configuration (PSQ-003 §5.4)
export type WorkflowType = 'Classic' | 'Simplified' | 'FastTrack';

export interface AuthorizationLevel {
  level: RaiseLevel;
  tcvMin: number;           // Minimum TCV in euros (inclusive)
  tcvMax: number;           // Maximum TCV in euros (exclusive, use Infinity for unbounded)
  tcvLabel: string;         // Display label (e.g., "> 20 M€", "10-20 M€")
  authorizersAtp: string;   // Authorizers for ATP phase
  authorizersAtsAtcHnd: string; // Authorizers for ATS, ATC, Handover
  workflowType: WorkflowType;
  notes?: string;           // Additional notes
}

export interface AuthorizationMatrixConfig {
  id: string;
  name: string;             // Configuration name (e.g., "Default", "2024 Rules")
  isActive: boolean;        // Only one config can be active
  levels: AuthorizationLevel[];
  createdAt?: string;
  updatedAt?: string;
}

// Expert Involvement Configuration (PSQ-003 §5.5)
export type ExpertFunction =
  | 'Finance'
  | 'Procurement'
  | 'CMCIO'
  | 'Legal'
  | 'Compliance231'
  | 'ComplianceAnticorruzione'
  | 'ComplianceESG'
  | 'ComplianceSistemiGestione'
  | 'ComplianceAltro'
  | 'DataPrivacy'
  | 'Risk'
  | 'Security'
  | 'HSE'
  | 'HR';

export interface ExpertConfig {
  id: string;
  function: ExpertFunction;
  displayName: string;           // Human-readable name
  applicableLevels: RaiseLevel[]; // Which RAISE levels require this expert
  involvementCondition: string;  // When to involve (from Excel)
  email?: string;                // Contact email
  notes?: string;
}

export interface ExpertInvolvementConfig {
  id: string;
  name: string;
  isActive: boolean;
  experts: ExpertConfig[];
  createdAt?: string;
  updatedAt?: string;
}

// Key Financial Targets Configuration (PSQ-003)
export type FinancialTargetCategory = 'CashFlow' | 'Margins' | 'Deviations' | 'IFRS15';

export interface FinancialTarget {
  id: string;
  category: FinancialTargetCategory;
  scope: string;           // Ambito (es. "termini di pagamento", "RIVENDITA DI PRODOTTI")
  rule: string;            // Controlli / TO DO
  threshold?: number;      // Soglia numerica (es. 16% per margine)
  thresholdUnit?: 'percent' | 'days' | 'months';
  notes?: string;
}

export interface FinancialTargetsConfig {
  id: string;
  name: string;
  isActive: boolean;
  targets: FinancialTarget[];
  createdAt?: string;
  updatedAt?: string;
}

// Under-margin Configuration (PSQ-003)
export type MarginType = 'Products' | 'Services' | 'Practice';

export interface MarginThreshold {
  id: string;
  type: MarginType;
  name: string;                  // Name (es. "Rivendita Prodotti", "Practice DevOps")
  targetMargin: number;          // Target margin percentage
  minimumMargin: number;         // Minimum acceptable margin
  approvalRequired: boolean;     // Requires under-margin approval
  approverLevel?: RaiseLevel;    // Minimum level for approval
  notes?: string;
}

export interface UnderMarginConfig {
  id: string;
  name: string;
  isActive: boolean;
  thresholds: MarginThreshold[];
  createdAt?: string;
  updatedAt?: string;
}
