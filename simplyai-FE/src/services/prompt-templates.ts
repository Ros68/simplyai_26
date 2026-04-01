import { API_BASE_URL } from "@/config/api";

// ── Types (same as before, Supabase imports removed) ─────────────────────────

export interface ChartConfig {
  width?: string | number;
  height?: number;
  colors?: string[];
  title?: { text?: string; align?: "left" | "center" | "right"; style?: { fontSize?: string; fontWeight?: string | number; color?: string } };
  subtitle?: { text?: string; align?: "left" | "center" | "right"; style?: { fontSize?: string; fontWeight?: string | number; color?: string } };
  xaxis?: { title?: { text?: string; style?: { fontSize?: string; fontWeight?: number } }; categories?: string[]; labels?: { rotate?: number; style?: { fontSize?: string; colors?: string | string[] } } };
  yaxis?: { title?: { text?: string; style?: { fontSize?: string; fontWeight?: number } }; labels?: { style?: { fontSize?: string; colors?: string | string[] } } };
  legend?: { show?: boolean; position?: "top" | "right" | "bottom" | "left"; horizontalAlign?: "left" | "center" | "right"; floating?: boolean; fontSize?: string };
  tooltip?: { enabled?: boolean; style?: { fontSize?: string } };
  dataLabels?: { enabled?: boolean; style?: { fontSize?: string; colors?: string[] } };
  stroke?: { width?: number; curve?: "smooth" | "straight" | "stepline" };
  grid?: { show?: boolean; borderColor?: string; row?: { colors?: string[] } };
  animations?: { enabled?: boolean; speed?: number };
  theme?: { mode?: "light" | "dark"; palette?: string };
  series?: any[];
  plotOptions?: any;
}

export interface ReportSectionWithPrompt {
  id: string;
  title: string;
  shortcode: string;
  prompt?: string;
  type?: string;
  chartType?: string;
  tableType?: string;
  config?: ChartConfig;
}

export interface SectionsData {
  text: ReportSectionWithPrompt[];
  charts: ReportSectionWithPrompt[];
  tables: ReportSectionWithPrompt[];
}

export interface PromptVariable {
  name: string;
  description?: string;
  defaultValue?: string;
}

export interface PromptTemplate {
  id?: string;
  plan_id: string;
  questionnaire_id: string;
  title: string;
  content: string;
  system_prompt?: string;
  variables?: PromptVariable[];
  sequence_index?: number;
  sections_data?: SectionsData;
  report_template?: string;
  selected_questionnaire_ids?: string[];
  primary_questionnaire_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PromptTemplateWithSections extends PromptTemplate {
  reportTemplate?: string;
  sections?: SectionsData;
  selectedQuestionnaireIds?: string[];
  primaryQuestionnaireId?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function apiGet<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url);
    if (!res.ok) return fallback;
    const data = await res.json();
    return data.success ? (data.data ?? data.template ?? data.templates ?? fallback) : fallback;
  } catch {
    return fallback;
  }
}

// ── Fetch all prompt templates for a specific plan ────────────────────────────
export const fetchPlanPromptTemplates = async (planId: string): Promise<PromptTemplate[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/prompt-templates/plan/${planId}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || data.templates || [];
  } catch (error) {
    console.error("Error fetching prompt templates:", error);
    return [];
  }
};

// ── Fetch specific prompt template by ID ─────────────────────────────────────
export const fetchPromptTemplate = async (promptId: string): Promise<PromptTemplate | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/prompt-templates/${promptId}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? (data.data || data.template || null) : null;
  } catch (error) {
    console.error("Error fetching prompt template:", error);
    return null;
  }
};

// ── Fetch prompt template for a specific plan + questionnaire ─────────────────
export const fetchPromptForQuestionnaire = async (
  planId: string,
  questionnaireId: string,
  sequenceIndex: number = 0
): Promise<PromptTemplate | null> => {
  try {
    const res = await fetch(
      `${API_BASE_URL}/prompt-templates/plan/${planId}/questionnaire/${questionnaireId}?sequence_index=${sequenceIndex}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.success || !data.data || data.data.length === 0) return null;
    return data.data[0] || null;
  } catch (error) {
    console.error("Error fetching prompt template:", error);
    return null;
  }
};

// ── Fetch all prompts for a specific questionnaire ────────────────────────────
export const fetchPromptsForQuestionnaire = async (
  questionnaireId: string
): Promise<PromptTemplate[]> => {
  try {
    const res = await fetch(
      `${API_BASE_URL}/prompt-templates/questionnaire/${questionnaireId}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || data.templates || [];
  } catch (error) {
    console.error("Error fetching questionnaire prompts:", error);
    return [];
  }
};

// ── Fetch prompts for all questionnaires in a plan ────────────────────────────
export const fetchPromptsForPlanQuestionnaires = async (
  planId: string,
  questionnaireIds: string[]
): Promise<Record<string, PromptTemplate[]>> => {
  try {
    if (!questionnaireIds.length) return {};
    const res = await fetch(
      `${API_BASE_URL}/prompt-templates/plan/${planId}?questionnaireIds=${questionnaireIds.join(",")}`
    );
    if (!res.ok) return {};
    const data = await res.json();
    const templates: PromptTemplate[] = data.data || data.templates || [];

    // Group by questionnaire_id
    const grouped: Record<string, PromptTemplate[]> = {};
    templates.forEach((t) => {
      if (!grouped[t.questionnaire_id]) grouped[t.questionnaire_id] = [];
      grouped[t.questionnaire_id].push(t);
    });
    return grouped;
  } catch (error) {
    console.error("Error fetching plan questionnaire prompts:", error);
    return {};
  }
};

// ── Save prompt template (create or update) ───────────────────────────────────
export const savePromptTemplate = async (
  template: PromptTemplateWithSections
): Promise<PromptTemplate | null> => {
  try {
    if (!template.questionnaire_id) throw new Error("Questionnaire ID is required");

    const { sections, reportTemplate, selectedQuestionnaireIds, primaryQuestionnaireId, ...base } = template;

    const body = {
      ...base,
      sections_data: sections
        ? { text: sections.text || [], charts: sections.charts || [], tables: sections.tables || [] }
        : undefined,
      report_template: reportTemplate,
      selected_questionnaire_ids: selectedQuestionnaireIds,
      primary_questionnaire_id: primaryQuestionnaireId,
    };

    const isUpdate = !!template.id;
    const res = await fetch(
      isUpdate
        ? `${API_BASE_URL}/prompt-templates/${template.id}`
        : `${API_BASE_URL}/prompt-templates`,
      {
        method: isUpdate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.success ? (data.data || data.template || null) : null;
  } catch (error) {
    console.error("Error saving prompt template:", error);
    return null;
  }
};

// ── Delete prompt template ────────────────────────────────────────────────────
export const deletePromptTemplate = async (id: string): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE_URL}/prompt-templates/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.success === true;
  } catch (error) {
    console.error("Error deleting prompt template:", error);
    return false;
  }
};

// ── Report templates management (used by ReportTemplateEditor) ────────────────

export const saveReportTemplate = async (template: {
  id?: string;
  plan_id: string;
  title: string;
  content: string;
  description?: string;
  is_default?: boolean;
  font_family?: string;
  font_size?: string;
  column_layout?: string;
}): Promise<boolean> => {
  try {
    const isUpdate = !!template.id;
    const res = await fetch(
      isUpdate
        ? `${API_BASE_URL}/prompt-templates/report-template/${template.id}`
        : `${API_BASE_URL}/prompt-templates/report-template`,
      {
        method: isUpdate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(template),
      }
    );
    if (!res.ok) return false;
    const data = await res.json();
    return data.success === true;
  } catch (error) {
    console.error("Error saving report template:", error);
    return false;
  }
};

export const fetchReportTemplate = async (templateId: string): Promise<any | null> => {
  try {
    const res = await fetch(
      `${API_BASE_URL}/prompt-templates/report-template/${templateId}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? (data.template || data.data || null) : null;
  } catch (error) {
    console.error("Error fetching report template:", error);
    return null;
  }
};

export const fetchPlanReportTemplates = async (planId: string): Promise<any[]> => {
  try {
    const res = await fetch(
      `${API_BASE_URL}/prompt-templates/report-templates/plan/${planId}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.templates || data.data || [];
  } catch (error) {
    console.error("Error fetching report templates:", error);
    return [];
  }
};