
export interface FormFieldOption {
  label: string;
  value: string;
  imageUrl?: string;
  score?: number;
}

export interface FormFieldValidation {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  customMessage?: string;
}

export interface ConditionalRule {
  sourceFieldId: string;
  condition: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater' | 'less';
  value: string | number;
}

export interface FormField {
  id: string;
  type: string;
  label: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  options?: FormFieldOption[];
  validation?: FormFieldValidation;
  conditionalLogic?: {
    enabled: boolean;
    rules: ConditionalRule[];
    operator: 'and' | 'or';
  };
  score?: number;
  pageIndex: number;
  order: number;
}

export interface FormPage {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  imagePosition?: 'top' | 'bottom' | 'left' | 'right';
  fields: FormField[];
  order: number;
}

export interface FormData {
  id: string;
  title: string;
  description?: string;
  pages: FormPage[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FormFieldType {
  id: string;
  type: string;
  name: string;
  description?: string;
  icon: string;
  isActive: boolean;
}

export interface PlanOption {
  key: string;
  label: string;
  value: any;
}

export interface PlanQuestionnaire {
  id: string;
  sequence?: number;
  periodicity?: number; // in days
  repetitions?: number;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  isFree: boolean;
  features: string[];
  options: {
    singleQuestionnaire?: boolean;
    verificationAfter?: boolean;
    periodicQuestionnaires?: boolean;
    multipleQuestionnaires?: boolean;
    progressQuestionnaires?: boolean;
    verificationPeriod?: number; // in days
    maxRepetitions?: number;
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    whatsappNotifications?: boolean;
  };
  questionnaires: PlanQuestionnaire[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
