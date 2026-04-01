
import { supabase } from "@/integrations/supabase/client";
import type { SubscriptionPlan, PlanSettings } from "@/types/supabase";

export const fetchPlan = async (planId: string): Promise<{ plan: SubscriptionPlan; settings: PlanSettings } | null> => {
  try {
    const planQuery = supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .maybeSingle();

    const settingsQuery = supabase
      .from('plan_settings')
      .select('*')
      .eq('plan_id', planId)
      .maybeSingle();

    const [planResult, settingsResult] = await Promise.all([planQuery, settingsQuery]);

    if (planResult.error) {
      console.error('Error fetching plan:', planResult.error);
      throw planResult.error;
    }

    if (settingsResult.error) {
      console.error('Error fetching plan settings:', settingsResult.error);
      throw settingsResult.error;
    }

    return {
      plan: planResult.data as SubscriptionPlan,
      settings: settingsResult.data as PlanSettings
    };
  } catch (error) {
    console.error('Error fetching plan details:', error);
    return null;
  }
};

export const fetchPlans = async (): Promise<SubscriptionPlan[]> => {
  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data as SubscriptionPlan[];
  } catch (error) {
    console.error('Error fetching plans:', error);
    return [];
  }
};

export const updatePlanQuestionnaires = async (
  planId: string,
  questionnaireIds: string[]
): Promise<boolean> => {
  try {
    console.log('Updating plan questionnaires:', planId, questionnaireIds);
    
    // Prima eliminiamo tutti i questionari esistenti
    const { error: deleteError } = await supabase
      .from('plan_questionnaires')
      .delete()
      .eq('plan_id', planId);
      
    if (deleteError) {
      console.error('Error removing existing questionnaires:', deleteError);
      throw deleteError;
    }
    
    // Se non ci sono nuovi questionari da aggiungere, terminiamo qui
    if (questionnaireIds.length === 0) {
      console.log('No questionnaires to add, operation successful');
      return true;
    }
    
    // Prepariamo i dati per l'inserimento
    const questionnairesData = questionnaireIds.map((questionnaireId, index) => ({
      plan_id: planId,
      questionnaire_id: questionnaireId,
      sequence_order: index,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    console.log('Adding questionnaires:', questionnairesData);
    
    // Inseriamo tutti i questionari in un'unica operazione
    const { error: insertError } = await supabase
      .from('plan_questionnaires')
      .insert(questionnairesData);
      
    if (insertError) {
      console.error('Error adding questionnaires:', insertError);
      throw insertError;
    }
    
    console.log('Plan questionnaires updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating plan questionnaires:', error);
    return false;
  }
};

export const savePlanSettings = async (
  planId: string,
  settings: Partial<PlanSettings>
): Promise<boolean> => {
  try {
    // Controlla se esistono già impostazioni per questo piano
    const { data: existingSettings, error: checkError } = await supabase
      .from('plan_settings')
      .select('id')
      .eq('plan_id', planId)
      .maybeSingle();
      
    if (checkError) throw checkError;
    
    if (existingSettings) {
      // Aggiorna le impostazioni esistenti
      const { error: updateError } = await supabase
        .from('plan_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('plan_id', planId);
        
      if (updateError) throw updateError;
    } else {
      // Inserisci nuove impostazioni
      const { error: insertError } = await supabase
        .from('plan_settings')
        .insert({
          plan_id: planId,
          ...settings,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (insertError) throw insertError;
    }
    
    return true;
  } catch (error) {
    console.error('Error saving plan settings:', error);
    return false;
  }
};
