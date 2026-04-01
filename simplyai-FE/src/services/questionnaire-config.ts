
import { supabase } from "@/integrations/supabase/client";
import type { PlanQuestionnaire } from "@/types/supabase";

export const fetchPlanQuestionnaires = async (planId: string): Promise<PlanQuestionnaire[]> => {
  try {
    const { data, error } = await supabase
      .from('plan_questionnaires')
      .select('*, questionnaire:questionnaire_id(*)')
      .eq('plan_id', planId)
      .order('sequence_order', { ascending: true });

    if (error) {
      console.error('Error fetching plan questionnaires:', error);
      throw error;
    }

    return data as PlanQuestionnaire[];
  } catch (error) {
    console.error('Error in fetchPlanQuestionnaires:', error);
    return [];
  }
};

export const addQuestionnaireToPlan = async (
  planId: string, 
  questionnaireId: string,
  sequenceOrder: number = 0
): Promise<boolean> => {
  try {
    // Verifichiamo prima se esiste già questa combinazione piano-questionario
    const { data: existingData, error: checkError } = await supabase
      .from('plan_questionnaires')
      .select('id')
      .eq('plan_id', planId)
      .eq('questionnaire_id', questionnaireId)
      .maybeSingle();
      
    if (checkError) {
      console.error('Errore nel verificare piano-questionario esistente:', checkError);
      throw checkError;
    }
    
    // Se esiste già, ne usciamo subito con successo
    if (existingData) {
      console.log('Combinazione piano-questionario già esistente', existingData);
      return true;
    }
    
    // Altrimenti inseriamo il nuovo record
    const { error } = await supabase
      .from('plan_questionnaires')
      .insert({
        plan_id: planId,
        questionnaire_id: questionnaireId,
        sequence_order: sequenceOrder,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
    if (error) {
      console.error('Errore nell\'aggiunta del questionario al piano:', error);
      throw error;
    }
    
    console.log('Questionario aggiunto con successo al piano');
    return true;
  } catch (error) {
    console.error('Errore nell\'aggiunta del questionario al piano:', error);
    return false;
  }
};

export const removeQuestionnaireFromPlan = async (
  planId: string, 
  questionnaireId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('plan_questionnaires')
      .delete()
      .match({
        plan_id: planId,
        questionnaire_id: questionnaireId
      });
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error removing questionnaire from plan:', error);
    return false;
  }
};

export const fetchAllQuestionnaires = async () => {
  try {
    console.log('Fetching all questionnaires');
    const { data, error } = await supabase
      .from('questionnaire_config')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching questionnaires:', error);
      throw error;
    }

    console.log('Fetched questionnaires:', data);
    return data;
  } catch (error) {
    console.error('Error fetching all questionnaires:', error);
    return [];
  }
};
