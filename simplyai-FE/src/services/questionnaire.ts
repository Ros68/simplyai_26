
import { supabase } from "@/integrations/supabase/client";
import { QuestionnaireResponse } from "@/types/supabase";

// Fetch user's draft questionnaire
export const fetchDraftQuestionnaire = async (userId: string) => {
  const { data, error } = await supabase
    .from('questionnaire_responses')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'draft')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error("Error fetching draft questionnaire:", error);
    throw error;
  }

  return data as QuestionnaireResponse | null;
};

// Save questionnaire answers (draft or completed)
export const saveQuestionnaireAnswers = async (
  userId: string,
  answers: Record<string, any>,
  status: 'draft' | 'completed',
  responseId?: string,
  questionnaireId?: string
) => {
  const timestamp = new Date().toISOString();
  const updateData: Partial<QuestionnaireResponse> = {
    answers,
    status,
    updated_at: timestamp
  };
  
  if (status === 'completed') {
    updateData.completed_at = timestamp;
  }
  
  if (questionnaireId) {
    updateData.questionnaire_id = questionnaireId;
  }
  
  if (responseId) {
    // Update existing questionnaire
    const { data, error } = await supabase
      .from('questionnaire_responses')
      .update(updateData)
      .eq('id', responseId)
      .select();
      
    if (error) {
      console.error("Error updating questionnaire:", error);
      throw error;
    }
    
    return data[0] as QuestionnaireResponse;
  } else {
    // Create new questionnaire response
    const { data, error } = await supabase
      .from('questionnaire_responses')
      .insert({
        user_id: userId,
        ...updateData,
        created_at: timestamp
      })
      .select();
      
    if (error) {
      console.error("Error saving questionnaire:", error);
      throw error;
    }
    
    return data[0] as QuestionnaireResponse;
  }
};

// Fetch all completed questionnaires for a user
export const fetchCompletedQuestionnaires = async (userId: string) => {
  const { data, error } = await supabase
    .from('questionnaire_responses')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error("Error fetching completed questionnaires:", error);
    throw error;
  }
  
  return data as QuestionnaireResponse[];
};

// Fetch a specific questionnaire by ID
export const fetchQuestionnaireById = async (responseId: string) => {
  const { data, error } = await supabase
    .from('questionnaire_responses')
    .select('*')
    .eq('id', responseId)
    .single();
    
  if (error) {
    console.error("Error fetching questionnaire:", error);
    throw error;
  }
  
  return data as QuestionnaireResponse;
};

// Delete a questionnaire by ID
export const deleteQuestionnaire = async (responseId: string) => {
  const { error } = await supabase
    .from('questionnaire_responses')
    .delete()
    .eq('id', responseId);
    
  if (error) {
    console.error("Error deleting questionnaire:", error);
    throw error;
  }
  
  return true;
};

// Aggiunta una funzione per permettere all'amministratore di sbloccare un questionario per un utente specifico
export const resetQuestionnaireForUser = async (responseId: string, userId: string) => {
  const { error } = await supabase
    .from('questionnaire_responses')
    .update({
      status: 'draft',
      completed_at: null,
      answers: {}
    })
    .match({ id: responseId, user_id: userId });
    
  if (error) {
    console.error("Error resetting questionnaire:", error);
    throw error;
  }
  
  return true;
};

// Funzione per ottenere i questionari disponibili dal database
export const fetchAvailableQuestionnaires = async () => {
  const { data, error } = await supabase
    .from('questionnaire_config')
    .select('id, title, status')
    .eq('status', 'published');
    
  if (error) {
    console.error("Error fetching questionnaires:", error);
    throw error;
  }
  
  return data;
};
