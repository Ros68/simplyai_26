// MySQL-based plans service that calls the backend API instead of Supabase
import { API_BASE_URL } from "@/config/api";

export interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  is_free: boolean;
  features: string[];
  active: boolean;
  button_text?: string;
  button_variant?: string;
  sort_order?: number;
  interval?: string;
  is_popular?: boolean;
  plan_type?: string;
  options?: any;
  created_at?: string;
  updated_at?: string;
}

export interface PlanSettings {
  id?: string;
  plan_id: string;
  is_free: boolean;
  can_retake: boolean;
  retake_period_days: number;
  retake_limit: number;
  is_sequential: boolean;
  is_progress_tracking: boolean;
  is_periodic: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Questionnaire {
  id: string;
  title: string;
  description?: string;
  status: string;
  questions?: any;
  created_at?: string;
  updated_at?: string;
}

export interface PlanQuestionnaire {
  id: string;
  plan_id: string;
  questionnaire_id: string;
  sequence_order: number;
  questionnaire?: Questionnaire;
  created_at?: string;
  updated_at?: string;
}

export interface PromptTemplate {
  id: string;
  plan_id: string;
  questionnaire_id: string;
  title: string;
  content: string;
  system_prompt: string;
  variables: any[];
  sequence_index: number;
  sections_data?: any;
  report_template?: string;
  created_at: string;
  updated_at: string;
}

export const fetchPlan = async (
  planId: string
): Promise<{ plan: Plan; settings: PlanSettings } | null> => {
  try {
    // Fetch plan details
    const planResponse = await fetch(`${API_BASE_URL}/plans/admin/${planId}`);
    if (!planResponse.ok) {
      throw new Error("Failed to fetch plan");
    }
    const planResult = await planResponse.json();
    console.log("Fetched plan result:", planResult);
    if (!planResult.success) {
      throw new Error(planResult.message || "Failed to fetch plan");
    }

    // Fetch plan settings - handle 404 gracefully without console errors
    let settingsResult = null;

    try {
      const settingsResponse = await fetch(
        `${API_BASE_URL}/plans/${planId}/settings`
      );
      if (settingsResponse.ok) {
        settingsResult = await settingsResponse.json();
      } else if (settingsResponse.status !== 404) {
        // Only log non-404 errors
        console.warn(
          `Plan settings request failed with status ${settingsResponse.status}`
        );
      }
      // 404 is expected for plans without settings - silently ignore
    } catch (error) {
      console.warn("Error fetching plan settings:", error);
    }

    return {
      plan: planResult.data as Plan,
      settings: (settingsResult?.data as PlanSettings) || {
        // Default settings for plans without specific configuration
        plan_id: planId,
        is_free: false,
        can_retake: true,
        retake_period_days: 90,
        retake_limit: 4,
        is_sequential: false,
        is_progress_tracking: true,
        is_periodic: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("Error fetching plan details:", error);
    return null;
  }
};

export const fetchPlans = async (): Promise<Plan[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/plans/admin/all`);
    if (!response.ok) {
      throw new Error("Failed to fetch plans");
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || "Failed to fetch plans");
    }

    return result.data as Plan[];
  } catch (error) {
    console.error("Error fetching plans:", error);
    return [];
  }
};

export const updatePlanQuestionnaires = async (
  planId: string,
  questionnaireIds: string[]
): Promise<boolean> => {
  try {
    console.log("Updating plan questionnaires:", planId, questionnaireIds);

    const questionnaires = questionnaireIds.map((id, index) => ({
      id,
      sequence: index + 1,
    }));

    const response = await fetch(
      `${API_BASE_URL}/plans/${planId}/questionnaires`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ questionnaires }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update plan questionnaires");
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error("Error updating plan questionnaires:", error);
    return false;
  }
};

export const savePlanSettings = async (
  planId: string,
  settings: Partial<PlanSettings>
): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/plans/${planId}/settings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      throw new Error("Failed to save plan settings");
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error("Error saving plan settings:", error);
    return false;
  }
};
