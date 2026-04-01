// MySQL-based questionnaire services that call the backend API instead of Supabase
import { API_BASE_URL } from '@/config/api';

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

// Get all questionnaires for a specific plan
export const fetchPlanQuestionnaires = async (planId: string): Promise<PlanQuestionnaire[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/plans/${planId}/questionnaires`);
    if (!response.ok) {
      throw new Error('Failed to fetch plan questionnaires');
    }
    
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch plan questionnaires');
    }
    
    // Transform the data to match the expected format
    const planQuestionnaires = result.data.map((item: any) => ({
      id: item.plan_questionnaire_id,
      plan_id: planId,
      questionnaire_id: item.questionnaire_id,
      sequence_order: item.sequence_order,
      questionnaire: {
        id: item.questionnaire_id,
        title: item.title,
        description: item.description,
        status: item.status
      }
    }));
    
    return planQuestionnaires;
  } catch (error) {
    console.error('Error fetching plan questionnaires:', error);
    return [];
  }
};

// Get all available questionnaires
export const fetchAllQuestionnaires = async (): Promise<Questionnaire[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/questionnaires`);
    if (!response.ok) {
      throw new Error('Failed to fetch questionnaires');
    }
    
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch questionnaires');
    }
    
    return result.data as Questionnaire[];
  } catch (error) {
    console.error('Error fetching questionnaires:', error);
    return [];
  }
};

// Get specific questionnaire by ID
export const fetchQuestionnaire = async (questionnaireId: string): Promise<Questionnaire | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/questionnaires/${questionnaireId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch questionnaire');
    }
    
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch questionnaire');
    }
    
    return result.data as Questionnaire;
  } catch (error) {
    console.error('Error fetching questionnaire:', error);
    return null;
  }
};

// Add questionnaire to plan
export const addQuestionnaireToPlan = async (
  planId: string, 
  questionnaireId: string, 
  sequenceOrder: number
): Promise<boolean> => {
  try {
    // Get current questionnaires for the plan
    const currentQuestionnaires = await fetchPlanQuestionnaires(planId);
    
    // Create new questionnaires array with the new one added
    const updatedQuestionnaires = [
      ...currentQuestionnaires.map(q => ({
        id: q.questionnaire_id,
        sequence: q.sequence_order
      })),
      {
        id: questionnaireId,
        sequence: sequenceOrder || currentQuestionnaires.length
      }
    ];
    
    const response = await fetch(`${API_BASE_URL}/plans/${planId}/questionnaires`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ questionnaires: updatedQuestionnaires })
    });
    
    if (!response.ok) {
      throw new Error('Failed to add questionnaire to plan');
    }
    
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error adding questionnaire to plan:', error);
    return false;
  }
};

// Remove questionnaire from plan
export const removeQuestionnaireFromPlan = async (
  planId: string, 
  questionnaireId: string
): Promise<boolean> => {
  try {
    // Get current questionnaires for the plan
    const currentQuestionnaires = await fetchPlanQuestionnaires(planId);
    
    // Create new questionnaires array without the removed one
    const updatedQuestionnaires = currentQuestionnaires
      .filter(q => q.questionnaire_id !== questionnaireId)
      .map((q, index) => ({
        id: q.questionnaire_id,
        sequence: index
      }));
    
    const response = await fetch(`${API_BASE_URL}/plans/${planId}/questionnaires`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ questionnaires: updatedQuestionnaires })
    });
    
    if (!response.ok) {
      throw new Error('Failed to remove questionnaire from plan');
    }
    
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error removing questionnaire from plan:', error);
    return false;
  }
};

// Update questionnaires order in plan
export const updatePlanQuestionnaires = async (
  planId: string,
  questionnaires: { id: string; sequence: number }[]
): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/plans/${planId}/questionnaires`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ questionnaires })
    });
    
    if (!response.ok) {
      throw new Error('Failed to update plan questionnaires');
    }
    
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error updating plan questionnaires:', error);
    return false;
  }
};
