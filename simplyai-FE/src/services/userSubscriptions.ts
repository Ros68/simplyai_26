
import { supabase } from "@/integrations/supabase/client";
import type { UserSubscription } from "@/types/supabase";

export const fetchUserSubscription = async (userId: string): Promise<UserSubscription | null> => {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*, subscription_plans(*)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();
    
    if (error) throw error;
    return data as UserSubscription;
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    return null;
  }
};

export const assignPlanToUser = async (
  userId: string, 
  planId: string, 
  expiresAt?: string
): Promise<UserSubscription | null> => {
  try {
    // Verifica se esiste già una sottoscrizione attiva
    const { data: existingSub } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();
    
    if (existingSub) {
      // Aggiorna la sottoscrizione esistente a scaduta
      await supabase
        .from('user_subscriptions')
        .update({
          status: 'expired',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSub.id);
    }
    
    // Crea nuova sottoscrizione
    const { data, error } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        plan_id: planId,
        started_at: new Date().toISOString(),
        expires_at: expiresAt || null,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('*, subscription_plans(*)')
      .maybeSingle();
    
    if (error) throw error;
    return data as UserSubscription;
  } catch (error) {
    console.error('Error assigning plan to user:', error);
    return null;
  }
};

export const cancelUserSubscription = async (subscriptionId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error canceling user subscription:', error);
    return false;
  }
};
