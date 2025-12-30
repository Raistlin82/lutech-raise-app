/**
 * Database types for Supabase
 * These types mirror the PostgreSQL schema created in Supabase
 */

export interface Database {
    public: {
        Tables: {
            customers: {
                Row: {
                    id: string;
                    name: string;
                    industry: string;
                    is_public_sector: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    industry: string;
                    is_public_sector?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    name?: string;
                    industry?: string;
                    is_public_sector?: boolean;
                    updated_at?: string;
                };
            };
            opportunities: {
                Row: {
                    id: string;
                    title: string;
                    customer_id: string | null;
                    client_name: string | null;
                    industry: string | null;
                    tcv: number;
                    raise_tcv: number;
                    margin_percent: number | null;
                    first_margin_percent: number | null;
                    cash_flow_neutral: boolean | null;
                    services_value: number | null;
                    current_phase: string;
                    has_kcp_deviations: boolean;
                    is_fast_track: boolean;
                    is_rti: boolean;
                    is_mandataria: boolean | null;
                    is_public_sector: boolean;
                    has_social_clauses: boolean | null;
                    is_non_core_business: boolean | null;
                    has_low_risk_services: boolean | null;
                    is_small_ticket: boolean | null;
                    is_new_customer: boolean | null;
                    is_child: boolean | null;
                    has_suppliers: boolean | null;
                    supplier_alignment: string | null;
                    raise_level: string;
                    privacy_risk_level: string | null;
                    offer_date: string | null;
                    contract_date: string | null;
                    order_date: string | null;
                    ats_date: string | null;
                    atc_date: string | null;
                    rcp_date: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    title: string;
                    customer_id?: string | null;
                    client_name?: string | null;
                    industry?: string | null;
                    tcv?: number;
                    raise_tcv?: number;
                    margin_percent?: number | null;
                    first_margin_percent?: number | null;
                    cash_flow_neutral?: boolean | null;
                    services_value?: number | null;
                    current_phase?: string;
                    has_kcp_deviations?: boolean;
                    is_fast_track?: boolean;
                    is_rti?: boolean;
                    is_mandataria?: boolean | null;
                    is_public_sector?: boolean;
                    has_social_clauses?: boolean | null;
                    is_non_core_business?: boolean | null;
                    has_low_risk_services?: boolean | null;
                    is_small_ticket?: boolean | null;
                    is_new_customer?: boolean | null;
                    is_child?: boolean | null;
                    has_suppliers?: boolean | null;
                    supplier_alignment?: string | null;
                    raise_level?: string;
                    privacy_risk_level?: string | null;
                    offer_date?: string | null;
                    contract_date?: string | null;
                    order_date?: string | null;
                    ats_date?: string | null;
                    atc_date?: string | null;
                    rcp_date?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: Partial<Database['public']['Tables']['opportunities']['Insert']>;
            };
            controls: {
                Row: {
                    id: string;
                    label: string;
                    description: string | null;
                    phase: string;
                    sort_order: number | null;
                    is_mandatory: boolean;
                    action_type: string | null;
                    condition: string | null;
                    detailed_description: string | null;
                    folder_path: string | null;
                    mandatory_notes: string | null;
                    template_ref: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    label: string;
                    description?: string | null;
                    phase: string;
                    sort_order?: number | null;
                    is_mandatory?: boolean;
                    action_type?: string | null;
                    condition?: string | null;
                    detailed_description?: string | null;
                    folder_path?: string | null;
                    mandatory_notes?: string | null;
                    template_ref?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: Partial<Database['public']['Tables']['controls']['Insert']>;
            };
            kcp_deviations: {
                Row: {
                    id: string;
                    opportunity_id: string;
                    type: string;
                    description: string;
                    expert_opinion: string | null;
                    expert_name: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    opportunity_id: string;
                    type: string;
                    description: string;
                    expert_opinion?: string | null;
                    expert_name?: string | null;
                    created_at?: string;
                };
                Update: Partial<Database['public']['Tables']['kcp_deviations']['Insert']>;
            };
            opportunity_checkpoints: {
                Row: {
                    id: string;
                    opportunity_id: string;
                    control_id: string;
                    phase: string;
                    is_completed: boolean;
                    completed_at: string | null;
                    completed_by: string | null;
                    notes: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    opportunity_id: string;
                    control_id: string;
                    phase: string;
                    is_completed?: boolean;
                    completed_at?: string | null;
                    completed_by?: string | null;
                    notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: Partial<Database['public']['Tables']['opportunity_checkpoints']['Insert']>;
            };
            control_template_links: {
                Row: {
                    id: string;
                    control_id: string;
                    name: string;
                    url: string;
                    sort_order: number | null;
                };
                Insert: {
                    id?: string;
                    control_id: string;
                    name: string;
                    url: string;
                    sort_order?: number | null;
                };
                Update: Partial<Database['public']['Tables']['control_template_links']['Insert']>;
            };
        };
    };
}
