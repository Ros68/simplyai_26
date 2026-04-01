
export type SubscriptionPlan = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  features: string[];
  is_popular: boolean | null;
  is_free?: boolean | null;
  active: boolean | null;
  button_text?: string | null;
  button_variant?: 'outline' | 'default' | null;
  interval: string;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
};

export type QuestionnaireResponse = {
  id: string;
  user_id: string;
  answers: Record<string, any>;
  questionnaire_id?: string | null;
  completed_at?: string | null;
  status: 'draft' | 'completed';
  created_at: string;
  updated_at: string;
  version?: number | null;
};

export type Profile = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  address?: string | null;
  phone?: string | null;
  fiscal_code?: string | null;
  role?: string | null;
  subscription_plan?: string | null;
  subscription_expiry?: string | null;
  created_at: string;
  updated_at: string;
};

export type QuestionnaireConfig = {
  id: string;
  title: string;
  description?: string | null;
  instructions?: string | null;
  questions: any[];
  version: number;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
};

export type PlanSettings = {
  id: string;
  plan_id: string;
  is_free: boolean | null;
  can_retake: boolean | null;
  retake_period_days: number | null;
  retake_limit: number | null;
  is_sequential: boolean | null;
  is_progress_tracking: boolean | null;
  is_periodic: boolean | null;
  created_at: string;
  updated_at: string;
};

export type PlanQuestionnaire = {
  id: string;
  plan_id: string;
  questionnaire_id: string;
  sequence_order: number | null;
  created_at: string;
  updated_at: string;
  questionnaire?: QuestionnaireConfig;
};

export type UserSubscription = {
  id: string;
  user_id: string;
  plan_id: string;
  started_at: string;
  expires_at: string;
  status: 'active' | 'expired' | 'canceled';
  created_at: string;
  updated_at: string;
  plan?: SubscriptionPlan;
};

export type Reminder = {
  id: string;
  daysBefore: number;
  frequency: 'once' | 'daily' | 'weekly';
  message: string;
};

export type PlanNotifications = {
  emailNotifications: boolean;
  smsNotifications: boolean;
  whatsappNotifications: boolean;
  reminders: Reminder[];
};

// Prompt template types
export type PromptTemplate = {
  id: string;
  plan_id: string;
  questionnaire_id: string;
  sequence_index: number;
  title: string;
  content: string;
  system_prompt: string;
  variables: PromptVariable[];
  created_at: string;
  updated_at: string;
};

export type PromptVariable = {
  name: string;
  description: string;
};

export type PromptAnalysisType = 
  | 'single' 
  | 'comparison' 
  | 'progression' 
  | 'summary';
