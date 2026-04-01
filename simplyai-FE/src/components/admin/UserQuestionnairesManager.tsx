
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Loader2, 
  CheckSquare, 
  Clock, 
  AlertTriangle,
  RotateCcw, 
  Lock,
  Unlock
} from 'lucide-react';
import { unlockQuestionnaireForUser } from '@/services/userSubscriptions';

interface UserQuestionnairesManagerProps {
  userId: string;
}

const UserQuestionnairesManager = ({ userId }: UserQuestionnairesManagerProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [questionnaireResponses, setQuestionnaireResponses] = useState([]);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        
        // Otteniamo il profilo dell'utente
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
          
        if (profileError) {
          console.error("Error fetching user profile:", profileError);
          throw profileError;
        }
        
        setUserProfile(profile);
        
        // Otteniamo le risposte ai questionari dell'utente
        const { data: responses, error: responsesError } = await supabase
          .from('questionnaire_responses')
          .select(`
            *,
            questionnaire:questionnaire_id (
              id,
              title
            )
          `)
          .eq('user_id', userId);
          
        if (responsesError) {
          console.error("Error fetching questionnaire responses:", responsesError);
          throw responsesError;
        }
        
        setQuestionnaireResponses(responses || []);
      } catch (error) {
        console.error("Error loading user data:", error);
        toast({
          title: "Errore",
          description: "Impossibile caricare i dati dell'utente",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (userId) {
      fetchUserData();
    }
  }, [userId, toast]);

  const handleUnlockQuestionnaire = async (questionnaireId: string, responseId: string) => {
    try {
      // Aggiorniamo lo stato del questionario a "draft"
      const { error } = await supabase
        .from('questionnaire_responses')
        .update({
          status: 'draft',
          completed_at: null
        })
        .eq('id', responseId);
        
      if (error) {
        throw error;
      }
      
      toast({
        title: "Questionario sbloccato",
        description: "L'utente potrà ora compilare nuovamente il questionario",
      });
      
      // Aggiorniamo lo stato locale
      setQuestionnaireResponses(prevResponses => 
        prevResponses.map(response => 
          response.id === responseId 
            ? { ...response, status: 'draft', completed_at: null } 
            : response
        )
      );
    } catch (error) {
      console.error("Error unlocking questionnaire:", error);
      toast({
        title: "Errore",
        description: "Impossibile sbloccare il questionario",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Completato</Badge>;
      case 'draft':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">In bozza</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Stato sconosciuto</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestione Questionari Utente</CardTitle>
        <CardDescription>
          Gestisci i questionari compilati dall'utente
          {userProfile && (
            <span className="font-medium block mt-1">
              {userProfile.first_name} {userProfile.last_name}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : questionnaireResponses.length > 0 ? (
          <div className="space-y-4">
            {questionnaireResponses.map((response) => (
              <Card key={response.id} className="border bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h3 className="font-medium">
                        {response.questionnaire?.title || 'Questionario'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(response.status)}
                        {response.completed_at && (
                          <span className="text-xs text-gray-500">
                            Completato il: {new Date(response.completed_at).toLocaleDateString('it-IT')}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {response.status === 'completed' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleUnlockQuestionnaire(response.questionnaire_id, response.id)}
                        className="flex items-center gap-2"
                      >
                        <Unlock className="h-3.5 w-3.5" />
                        Sblocca
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed rounded-md">
            <CheckSquare className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p className="mb-2">L'utente non ha ancora compilato nessun questionario</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserQuestionnairesManager;
