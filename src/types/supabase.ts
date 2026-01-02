export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

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
          description: string | null;
          customer_id: string | null;
          tcv: number;
          first_margin_percentage: number;
          raise_tcv: number | null;
          industry: string | null;
          is_public_sector: boolean | null;
          expected_decision_date: string;
          expected_signature_date: string | null;
          expected_delivery_start: string | null;
          has_kcp_deviations: boolean;
          kcp_deviations_detail: string | null;
          raise_level: string;
          is_fast_track: boolean;
          current_phase: string;
          status: string;
          checkpoints: Json;
          created_by_email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          customer_id?: string | null;
          tcv: number;
          first_margin_percentage: number;
          raise_tcv?: number | null;
          industry?: string | null;
          is_public_sector?: boolean | null;
          expected_decision_date: string;
          expected_signature_date?: string | null;
          expected_delivery_start?: string | null;
          has_kcp_deviations?: boolean;
          kcp_deviations_detail?: string | null;
          raise_level: string;
          is_fast_track?: boolean;
          current_phase?: string;
          status?: string;
          checkpoints?: Json;
          created_by_email: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          customer_id?: string | null;
          tcv?: number;
          first_margin_percentage?: number;
          raise_tcv?: number | null;
          industry?: string | null;
          is_public_sector?: boolean | null;
          expected_decision_date?: string;
          expected_signature_date?: string | null;
          expected_delivery_start?: string | null;
          has_kcp_deviations?: boolean;
          kcp_deviations_detail?: string | null;
          raise_level?: string;
          is_fast_track?: boolean;
          current_phase?: string;
          status?: string;
          checkpoints?: Json;
          updated_at?: string;
        };
      };
      settings: {
        Row: {
          id: string;
          checkpoint_id: string;
          name: string;
          phase: string;
          raise_levels: string[];
          description: string | null;
          is_mandatory: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          checkpoint_id: string;
          name: string;
          phase: string;
          raise_levels: string[];
          description?: string | null;
          is_mandatory?: boolean;
          display_order: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          checkpoint_id?: string;
          name?: string;
          phase?: string;
          raise_levels?: string[];
          description?: string | null;
          is_mandatory?: boolean;
          display_order?: number;
          updated_at?: string;
        };
      };
    };
  };
}
