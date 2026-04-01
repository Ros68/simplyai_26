export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      app_settings: {
        Row: {
          accent_color: string;
          button_style: string;
          created_at: string;
          dark_mode: boolean;
          font_family: string;
          font_size: string;
          id: string;
          logo: string | null;
          primary_color: string;
          secondary_color: string;
          site_name: string;
          site_url: string | null;
          updated_at: string;
        };
        Insert: {
          accent_color?: string;
          button_style?: string;
          created_at?: string;
          dark_mode?: boolean;
          font_family?: string;
          font_size?: string;
          id?: string;
          logo?: string | null;
          primary_color?: string;
          secondary_color?: string;
          site_name?: string;
          site_url?: string | null;
          updated_at?: string;
        };
        Update: {
          accent_color?: string;
          button_style?: string;
          created_at?: string;
          dark_mode?: boolean;
          font_family?: string;
          font_size?: string;
          id?: string;
          logo?: string | null;
          primary_color?: string;
          secondary_color?: string;
          site_name?: string;
          site_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      form_field_types: {
        Row: {
          created_at: string;
          description: string | null;
          icon: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          type: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          type: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          type?: string;
        };
        Relationships: [];
      };
      plan_questionnaires: {
        Row: {
          created_at: string;
          id: string;
          plan_id: string | null;
          questionnaire_id: string | null;
          sequence_order: number | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          plan_id?: string | null;
          questionnaire_id?: string | null;
          sequence_order?: number | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          plan_id?: string | null;
          questionnaire_id?: string | null;
          sequence_order?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "plan_questionnaires_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "subscription_plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "plan_questionnaires_questionnaire_id_fkey";
            columns: ["questionnaire_id"];
            isOneToOne: false;
            referencedRelation: "questionnaire_config";
            referencedColumns: ["id"];
          }
        ];
      };
      plan_settings: {
        Row: {
          can_retake: boolean | null;
          created_at: string;
          id: string;
          is_free: boolean | null;
          is_periodic: boolean | null;
          is_progress_tracking: boolean | null;
          is_sequential: boolean | null;
          plan_id: string | null;
          retake_limit: number | null;
          retake_period_days: number | null;
          updated_at: string;
        };
        Insert: {
          can_retake?: boolean | null;
          created_at?: string;
          id?: string;
          is_free?: boolean | null;
          is_periodic?: boolean | null;
          is_progress_tracking?: boolean | null;
          is_sequential?: boolean | null;
          plan_id?: string | null;
          retake_limit?: number | null;
          retake_period_days?: number | null;
          updated_at?: string;
        };
        Update: {
          can_retake?: boolean | null;
          created_at?: string;
          id?: string;
          is_free?: boolean | null;
          is_periodic?: boolean | null;
          is_progress_tracking?: boolean | null;
          is_sequential?: boolean | null;
          plan_id?: string | null;
          retake_limit?: number | null;
          retake_period_days?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "plan_settings_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "subscription_plans";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          address: string | null;
          created_at: string;
          first_name: string | null;
          fiscal_code: string | null;
          id: string;
          last_name: string | null;
          phone: string | null;
          role: string | null;
          subscription_expiry: string | null;
          subscription_plan: string | null;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          created_at?: string;
          first_name?: string | null;
          fiscal_code?: string | null;
          id: string;
          last_name?: string | null;
          phone?: string | null;
          role?: string | null;
          subscription_expiry?: string | null;
          subscription_plan?: string | null;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          created_at?: string;
          first_name?: string | null;
          fiscal_code?: string | null;
          id?: string;
          last_name?: string | null;
          phone?: string | null;
          role?: string | null;
          subscription_expiry?: string | null;
          subscription_plan?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      prompt_templates: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          plan_id: string;
          questionnaire_id: string;
          report_template: string | null;
          sections_data: Json | null;
          sequence_index: number;
          system_prompt: string;
          title: string;
          updated_at: string;
          variables: Json;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          plan_id: string;
          questionnaire_id: string;
          report_template?: string | null;
          sections_data?: Json | null;
          sequence_index?: number;
          system_prompt: string;
          title: string;
          updated_at?: string;
          variables?: Json;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          plan_id?: string;
          questionnaire_id?: string;
          report_template?: string | null;
          sections_data?: Json | null;
          sequence_index?: number;
          system_prompt?: string;
          title?: string;
          updated_at?: string;
          variables?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "prompt_templates_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "subscription_plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "prompt_templates_questionnaire_id_fkey";
            columns: ["questionnaire_id"];
            isOneToOne: false;
            referencedRelation: "questionnaire_config";
            referencedColumns: ["id"];
          }
        ];
      };
      questionnaire_config: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          instructions: string | null;
          questions: Json;
          status: string;
          title: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          instructions?: string | null;
          questions?: Json;
          status?: string;
          title: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          instructions?: string | null;
          questions?: Json;
          status?: string;
          title?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [];
      };
      questionnaire_responses: {
        Row: {
          answers: Json;
          completed_at: string | null;
          created_at: string;
          id: string;
          previous_version_id: string | null;
          questionnaire_id: string | null;
          status: string;
          updated_at: string;
          user_id: string;
          version: number | null;
        };
        Insert: {
          answers?: Json;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          previous_version_id?: string | null;
          questionnaire_id?: string | null;
          status?: string;
          updated_at?: string;
          user_id: string;
          version?: number | null;
        };
        Update: {
          answers?: Json;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          previous_version_id?: string | null;
          questionnaire_id?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
          version?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "questionnaire_responses_previous_version_id_fkey";
            columns: ["previous_version_id"];
            isOneToOne: false;
            referencedRelation: "questionnaire_responses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "questionnaire_responses_questionnaire_id_fkey";
            columns: ["questionnaire_id"];
            isOneToOne: false;
            referencedRelation: "questionnaire_config";
            referencedColumns: ["id"];
          }
        ];
      };
      report_templates: {
        Row: {
          content: string;
          created_at: string;
          description: string | null;
          id: string;
          is_default: boolean | null;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_default?: boolean | null;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_default?: boolean | null;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          content: Json;
          created_at: string;
          id: string;
          pdf_url: string | null;
          questionnaire_id: string | null;
          template_id: string | null;
          title: string;
          user_id: string;
        };
        Insert: {
          content: Json;
          created_at?: string;
          id?: string;
          pdf_url?: string | null;
          questionnaire_id?: string | null;
          template_id?: string | null;
          title: string;
          user_id: string;
        };
        Update: {
          content?: Json;
          created_at?: string;
          id?: string;
          pdf_url?: string | null;
          questionnaire_id?: string | null;
          template_id?: string | null;
          title?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reports_questionnaire_id_fkey";
            columns: ["questionnaire_id"];
            isOneToOne: false;
            referencedRelation: "questionnaire_responses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "report_templates";
            referencedColumns: ["id"];
          }
        ];
      };
      subscription_plans: {
        Row: {
          active: boolean | null;
          button_text: string | null;
          button_variant: string | null;
          created_at: string;
          description: string | null;
          features: Json;
          id: string;
          interval: string;
          is_free: boolean | null;
          is_popular: boolean | null;
          name: string;
          price: number;
          sort_order: number | null;
          updated_at: string;
        };
        Insert: {
          active?: boolean | null;
          button_text?: string | null;
          button_variant?: string | null;
          created_at?: string;
          description?: string | null;
          features?: Json;
          id?: string;
          interval?: string;
          is_free?: boolean | null;
          is_popular?: boolean | null;
          name: string;
          price: number;
          sort_order?: number | null;
          updated_at?: string;
        };
        Update: {
          active?: boolean | null;
          button_text?: string | null;
          button_variant?: string | null;
          created_at?: string;
          description?: string | null;
          features?: Json;
          id?: string;
          interval?: string;
          is_free?: boolean | null;
          is_popular?: boolean | null;
          name?: string;
          price?: number;
          sort_order?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_subscriptions: {
        Row: {
          created_at: string;
          expires_at: string | null;
          id: string;
          plan_id: string;
          started_at: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          plan_id: string;
          started_at?: string;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          plan_id?: string;
          started_at?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "subscription_plans";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
