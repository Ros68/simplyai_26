import { API_BASE_URL } from '@/config/api';

export const fetchUserPlanOptions = async (userId: string): Promise<UserPlanOptions | null> => {
    try {
        const res = await fetch(`${API_BASE_URL}/user-plan-options?userId=${encodeURIComponent(userId)}`);
        if (!res.ok) throw new Error('Failed to fetch user plan options');
        const data = await res.json();
        if (data && data.option) {
            return data.option as UserPlanOptions;
        }
        return null;
    } catch (error) {
        console.error('Error in fetchUserPlanOptions:', error);
        return null;
    }
};
export const fetchQuestionnaireCompletions = async (userId: string): Promise<any[]> => {
    try {
        const res = await fetch(`${API_BASE_URL}/questionnaire-completions?userId=${encodeURIComponent(userId)}`);
        if (!res.ok) throw new Error('Failed to fetch questionnaire completions');
        const data = await res.json();
        return data || [];
    } catch (error) {
        console.error('Error in fetchQuestionnaireCompletions:', error);
        return [];
    }
};

/**
 * Transform database completion records into completion history format expected by access logic
 */
export const transformCompletionHistory = (completions: any[], questionnaires: any[]): any[] => {
    // Group completions by questionnaire_id
    const completionsByQuestionnaire = completions.reduce((acc: any, completion: any) => {
        if (!acc[completion.questionnaire_id]) {
            acc[completion.questionnaire_id] = [];
        }
        acc[completion.questionnaire_id].push(completion);
        return acc;
    }, {});

    // Transform into expected format for each questionnaire
    return questionnaires.map(q => {
        const questionnaireCompletions = completionsByQuestionnaire[q.id] || [];
        // Sort by created_at descending to get the most recent first
        questionnaireCompletions.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        return {
            questionnaireId: q.id,
            completionCount: questionnaireCompletions.length,
            lastCompletedDate: questionnaireCompletions.length > 0 ? questionnaireCompletions[0].created_at : null,
            completedAt: questionnaireCompletions.map((c: any) => c.created_at)
        };
    });
};
export const saveQuestionnaireCompletion = async (completion: QuestionnaireCompletion): Promise<boolean> => {
    try {
        // Fetch previous attempts for this user and questionnaire
        const prevRes = await fetch(`${API_BASE_URL}/questionnaire-completions?userId=${encodeURIComponent(completion.user_id)}&questionnaireId=${encodeURIComponent(completion.questionnaire_id)}`);
        const previousAttempts = prevRes.ok ? await prevRes.json() : [];
        let attempt_number = 1;
        if (previousAttempts && Array.isArray(previousAttempts)) {
            attempt_number = previousAttempts.length + 1;
        }

        const res = await fetch(`${API_BASE_URL}/save-questionnaire-completion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...completion,
                attempt_number,
                created_at: new Date().toISOString()
            })
        });
        if (!res.ok) {
            const err = await res.text();
            console.error('Error saving questionnaire completion:', err);
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error in saveQuestionnaireCompletion:', error);
        return false;
    }
};


export interface QuestionnaireCompletion {
  id?: string;
  user_id: string;
  questionnaire_id: string;
  questionnaire_title: string;
  completed_at?: string;
  responses: any;
  report_id?: string;
}

export interface UserPlanOptions {
  reminderCount: number;
  maxRepetitions: number;
  reminderMessage: string;
  minWaitingPeriod: number;
  reminderFrequency: string;
  verificationAfter: boolean;
  emailNotifications: boolean;
  reminderDaysBefore: number;
  verificationPeriod: number;
  singleQuestionnaire: boolean;
  multipleQuestionnaires: boolean;
  periodicQuestionnaires: boolean;
  progressQuestionnaires: boolean;
}




/**
 * Check if user can access a specific questionnaire based on their plan and completion history
 */
export const canAccessQuestionnaire = (
  questionnaireId: string,
  userPlan: UserPlanOptions,
  completionHistory: any[]
): { canAccess: boolean; reason: string; nextAvailableDate?: string } => {
  
  const questionnaire = completionHistory.find(h => h.questionnaireId === questionnaireId);
  const completionCount = questionnaire?.completionCount || 0;
  const lastCompletedDate = questionnaire?.lastCompletedDate ? new Date(questionnaire.lastCompletedDate) : null;
  const now = new Date();

  if (userPlan.multipleQuestionnaires) {
    return { canAccess: true, reason: 'Accesso illimitato con il tuo piano' };
  }

  if (userPlan.verificationAfter) {
    if (completionCount === 0) {
      return { canAccess: true, reason: 'Prima compilazione disponibile' };
    } else if (completionCount === 1) {
      if (lastCompletedDate) {
        const nextAvailable = new Date(lastCompletedDate);
        nextAvailable.setDate(nextAvailable.getDate() + userPlan.verificationPeriod);
        
        if (now >= nextAvailable) {
          return { canAccess: true, reason: 'Seconda compilazione disponibile' };
        } else {
          const daysRemaining = Math.ceil((nextAvailable.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return { 
            canAccess: false, 
            reason: `Disponibile dopo il periodo di verifica (${daysRemaining} giorni rimanenti)`,
            nextAvailableDate: nextAvailable.toLocaleDateString('it-IT')
          };
        }
      } else {
        // Edge case: completion count is 1 but no lastCompletedDate - treat as if just completed
        return { canAccess: false, reason: 'Periodo di verifica in corso' };
      }
    } else {
      return { canAccess: false, reason: 'Limite di 2 compilazioni raggiunto' };
    }
  }

  if (userPlan.periodicQuestionnaires) {
    if (completionCount < userPlan.maxRepetitions) {
      if (completionCount === 0) {
        return { canAccess: true, reason: 'Prima compilazione disponibile' };
      } else if (lastCompletedDate) {
        const nextAvailable = new Date(lastCompletedDate);
        nextAvailable.setDate(nextAvailable.getDate() + userPlan.verificationPeriod);
        
        if (now >= nextAvailable) {
          return { canAccess: true, reason: `Compilazione ${completionCount + 1} di ${userPlan.maxRepetitions} disponibile` };
        } else {
          return { 
            canAccess: false, 
            reason: `Prossima compilazione disponibile tra ${Math.ceil((nextAvailable.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} giorni`,
            nextAvailableDate: nextAvailable.toLocaleDateString('it-IT')
          };
        }
      }
    } else {
      return { canAccess: false, reason: `Limite di ${userPlan.maxRepetitions} compilazioni raggiunto` };
    }
  }

  if (userPlan.progressQuestionnaires) {
    const questionnaireIndex = parseInt(questionnaireId.split('-')[1]) - 1;
    
    if (questionnaireIndex === 0) {
      if (completionCount === 0) {
        return { canAccess: true, reason: 'Primo questionario del percorso' };
      } else {
        return { canAccess: false, reason: 'Questionario già completato' };
      }
    } else {
      const previousQuestionnaireId = `questionnaire-${questionnaireIndex}`;
      const previousHistory = completionHistory.find(h => h.questionnaireId === previousQuestionnaireId);
      
      if (previousHistory && previousHistory.completionCount > 0) {
        const previousCompletedDate = new Date(previousHistory.lastCompletedDate);
        const nextAvailable = new Date(previousCompletedDate);
        nextAvailable.setDate(nextAvailable.getDate() + userPlan.minWaitingPeriod);
        
        if (completionCount === 0) {
          if (now >= nextAvailable) {
            return { canAccess: true, reason: 'Disponibile dopo il completamento del questionario precedente' };
          } else {
            return { 
              canAccess: false, 
              reason: `Disponibile tra ${Math.ceil((nextAvailable.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} giorni`,
              nextAvailableDate: nextAvailable.toLocaleDateString('it-IT')
            };
          }
        } else {
          return { canAccess: false, reason: 'Questionario già completato' };
        }
      } else {
        return { canAccess: false, reason: 'Completa prima il questionario precedente' };
      }
    }
  }

  // Default: single questionnaire
  if (completionCount === 0) {
    return { canAccess: true, reason: 'Disponibile per la compilazione' };
  } else {
    return { canAccess: false, reason: 'Questionario già completato' };
  }
};

/**
 * Get available questionnaires (fallback to demo data if database tables don't exist)
 */
export const getAvailableQuestionnaires = async () => {
  // For now, return demo questionnaires
  // In the future, this would query the questionnaires table
  return [
    { id: 'questionnaire-1', title: 'Valutazione Maturità Digitale', description: 'Analisi del livello di digitalizzazione aziendale' },
    { id: 'questionnaire-2', title: 'Analisi Processi Aziendali', description: 'Ottimizzazione dei processi interni' },
    { id: 'questionnaire-3', title: 'Strategia Marketing Digitale', description: 'Sviluppo strategia di marketing online' },
    { id: 'questionnaire-4', title: 'Sicurezza Informatica', description: 'Valutazione della sicurezza IT' }
  ];
};
