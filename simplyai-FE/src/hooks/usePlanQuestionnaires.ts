import { useState, useEffect } from 'react';
import { fetchUserQuestionnairesWithAccess } from '@/services/ApiService';

interface Questionnaire {
  id: string;
  title: string;
  description?: string;
  status: string;
  questions?: any;
  sequence?: number;
  periodicity?: number;
  repetitions?: number;
  completed?: boolean;
  lastCompletedAt?: string;
  nextAvailableAt?: string;
}

interface UsePlanQuestionnairesResult {
  questionnaires: Questionnaire[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  canAccessQuestionnaire: (questionnaireId: string) => boolean;
  getNextQuestionnaire: () => Questionnaire | null;
}

export const usePlanQuestionnaires = (userId: string): UsePlanQuestionnairesResult => {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestionnaires = async () => {
    if (!userId) {
      setQuestionnaires([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 [usePlanQuestionnaires] Fetching questionnaires for user:', userId);
      const data = await fetchUserQuestionnairesWithAccess(userId);
      
      console.log('📦 [usePlanQuestionnaires] Data received:', data);
      
      // Handle different response structures
      if (data && data.questionnaires) {
        setQuestionnaires(data.questionnaires);
      } else if (data && data.data) {
        setQuestionnaires(data.data);
      } else if (Array.isArray(data)) {
        setQuestionnaires(data);
      } else {
        console.warn('⚠️ [usePlanQuestionnaires] Unexpected data format:', data);
        setQuestionnaires([]);
      }
      
    } catch (err) {
      console.error('❌ [usePlanQuestionnaires] Error fetching user questionnaires:', err);
      setError('Impossibile caricare i questionari');
      setQuestionnaires([]);
    } finally {
      setIsLoading(false);
    }
  };

  const canAccessQuestionnaire = (questionnaireId: string): boolean => {
    const questionnaire = questionnaires.find(q => q.id === questionnaireId);
    
    if (!questionnaire) return false;
    
    if (!questionnaire.nextAvailableAt) return true;
    
    const nextAvailable = new Date(questionnaire.nextAvailableAt);
    const now = new Date();
    
    return now >= nextAvailable;
  };

  const getNextQuestionnaire = (): Questionnaire | null => {
    const sorted = [...questionnaires].sort((a, b) => 
      (a.sequence || 0) - (b.sequence || 0)
    );
    
    const next = sorted.find(q => !q.completed);
    
    return next || null;
  };

  useEffect(() => {
    fetchQuestionnaires();
  }, [userId]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('plan_') && e.key?.includes('questionnaires_updated')) {
        console.log('🔄 [usePlanQuestionnaires] Storage update detected, refreshing...');
        fetchQuestionnaires();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    const handleCustomUpdate = () => {
      console.log('🔄 [usePlanQuestionnaires] Custom event detected, refreshing...');
      fetchQuestionnaires();
    };
    
    window.addEventListener('planQuestionnairesUpdated', handleCustomUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('planQuestionnairesUpdated', handleCustomUpdate);
    };
  }, [userId]);

  return {
    questionnaires,
    isLoading,
    error,
    refresh: fetchQuestionnaires,
    canAccessQuestionnaire,
    getNextQuestionnaire
  };
};