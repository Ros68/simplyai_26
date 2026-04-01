
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      account_plan_questionnaire_answers: {
        Row: {
          account_plan_questionnaire_id: string
          answer_data: Json | null
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          account_plan_questionnaire_id: string
          answer_data?: Json | null
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          account_plan_questionnaire_id?: string
          answer_data?: Json | null
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_plan_questionnaire_answers_account_plan_questionnaire_id_fkey"
            columns: ["account_plan_questionnaire_id"]
            referencedRelation: "account_plan_questionnaires"
            referencedColumns: ["id"]
          }
        ]
      }
      account_plan_questionnaires: {
        Row: {
          account_id: string
          created_at: string
          id: string
          plan_questionnaire_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          account_id: string
          created_at?: string
          id?: string
          plan_questionnaire_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          id?: string
          plan_questionnaire_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_plan_questionnaires_plan_questionnaire_id_fkey"
            columns: ["plan_questionnaire_id"]
            referencedRelation: "plan_questionnaires"
            referencedColumns: ["id"]
          }
        ]
      }
      plan_questionnaires: {
        Row: {
          created_at: string
          id: string
          plan_id: string
          questionnaire_id: string
          sequence_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          plan_id: string
          questionnaire_id: string
          sequence_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          plan_id?: string
          questionnaire_id?: string
          sequence_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_questionnaires_plan_id_fkey"
            columns: ["plan_id"]
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_questionnaires_questionnaire_id_fkey"
            columns: ["questionnaire_id"]
            referencedRelation: "questionnaire_config"
            referencedColumns: ["id"]
          }
        ]
      }
      plan_settings: {
        Row: {
          can_retake: boolean | null
          created_at: string
          id: string
          plan_id: string
          retake_limit: number | null
          retake_period_days: number | null
          updated_at: string
        }
        Insert: {
          can_retake?: boolean | null
          created_at?: string
          id?: string
          plan_id: string
          retake_limit?: number | null
          retake_period_days?: number | null
          updated_at?: string
        }
        Update: {
          can_retake?: boolean | null
          created_at?: string
          id?: string
          plan_id?: string
          retake_limit?: number | null
          retake_period_days?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_settings_plan_id_fkey"
            columns: ["plan_id"]
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          }
        ]
      }
      prompt_templates: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          plan_id: string | null
          questionnaire_id: string | null
          sequence_index: number | null
          system_prompt: string | null
          title: string | null
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          plan_id?: string | null
          questionnaire_id?: string | null
          sequence_index?: number | null
          system_prompt?: string | null
          title?: string | null
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          plan_id?: string | null
          questionnaire_id?: string | null
          sequence_index?: number | null
          system_prompt?: string | null
          title?: string | null
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "prompt_templates_plan_id_fkey"
            columns: ["plan_id"]
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_templates_questionnaire_id_fkey"
            columns: ["questionnaire_id"]
            referencedRelation: "questionnaire_config"
            referencedColumns: ["id"]
          }
        ]
      }
      questionnaire_config: {
        Row: {
          config_data: Json | null
          created_at: string | null
          description: string | null
          id: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          config_data?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          config_data?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      report_templates: {
        Row: {
          content: string | null
          created_at: string | null
          description: string | null
          id: string
          is_default: boolean | null
          plan_id: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          plan_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          plan_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_templates_plan_id_fkey"
            columns: ["plan_id"]
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          }
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string | null
          price: number | null
          sort_order: number | null
          stripe_price_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string | null
          price?: number | null
          sort_order?: number | null
          stripe_price_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string | null
          price?: number | null
          sort_order?: number | null
          stripe_price_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & { row: any })
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] & { row: any })
    : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] & { row: any })
      ? PublicTableNameOrOptions
      : never = never
> = (Database[PublicTableNameOrOptions extends { schema: keyof Database }
  ? PublicTableNameOrOptions["schema"]
  : "public"]["Tables"][TableName] & { row: any })["Row"]

export type SubscriptionPlan = Tables<'subscription_plans'>
export type PlanSettings = Tables<'plan_settings'>
export type PlanQuestionnaire = Tables<'plan_questionnaires'>
export type QuestionnaireConfig = Tables<'questionnaire_config'>
export type PromptTemplate = Tables<'prompt_templates'>

export interface PromptVariable {
  name: string;
  description: string;
}

export interface ReportSection {
  title: string;
  shortcode: string;
  content?: string;
}

export interface ChartConfig {
  colors: string[];
  height: number;
  width?: string | number;
  type?: string;
  options?: Record<string, any>;
}
