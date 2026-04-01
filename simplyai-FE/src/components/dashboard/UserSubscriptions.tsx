
import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  Calendar, 
  CreditCard, 
  Clock, 
  RotateCcw, 
  CheckSquare,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { fetchUserSubscription } from '@/services/ApiService';

interface Subscription {
  id: string;
  plan_name: string;
  plan_type: string;
  started_at: string;
  expires_at: string;
  status: 'active' | 'expired' | 'canceled';
  is_free: boolean;
  features: string[];
  next_questionnaire_date?: string;
  questionnaires: {
    id: string;
    name: string;
    status: 'completed' | 'pending' | 'available';
    available_at?: string;
    sequence?: number;
  }[];
}

export const UserSubscriptions = () => {
  const { toast } = useToast();
  const { user, token } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  
  useEffect(() => {
    console.log('UserSubscriptions useEffect triggered', { user, token });
    const loadSubscriptions = async () => {
      console.log('loadSubscriptions called');
      if (!user || !token) {
        console.log('User or token missing:', { user, token });
        return;
      }

      try {
        setIsLoading(true);
        console.log('Fetching user subscription data...');

        const result = await fetchUserSubscription(token);
        console.log('Subscription API result:', result);

        if (result.success && result.data) {
          // Map API response to Subscription interface expected by UI
          const { plan, subscription_id, started_at, expires_at, is_active, questionnaires } = result.data;
          // Only allow 'active', 'expired', or 'canceled' for status
          let status: 'active' | 'expired' | 'canceled' = 'expired';
          if (is_active) status = 'active';
          // If you have a canceled state, add logic here
          const safeData = {
            id: subscription_id,
            plan_name: plan?.name || '',
            plan_type: plan?.plan_type || '',
            started_at: started_at,
            expires_at: expires_at,
            status,
            is_free: !!plan?.is_free,
            features: Array.isArray(plan?.features) ? plan.features : [],
            questionnaires: Array.isArray(questionnaires)
              ? questionnaires.map(q => ({
                  id: q.id,
                  name: q.name,
                  status: q.status === 'completed' || q.status === 'pending' || q.status === 'available' ? q.status : 'available',
                  available_at: q.available_at,
                  sequence: q.sequence,
                }))
              : [],
          };
          setSubscriptions([safeData]);
          console.log('Set subscriptions:', [safeData]);
        } else {
          console.log('No subscription data found, API result:', result);
          setSubscriptions([]);
        }
      } catch (error) {
        console.error('Error loading subscription:', error);
        if (error.response) {
          error.response.text().then((text) => {
            console.error('API error response text:', text);
          });
        }
        // Check if it's a 404 (no subscription found) vs other errors
        if (error.message && error.message.includes('Failed to fetch user subscription')) {
          setSubscriptions([]);
          toast({
            variant: 'default',
            title: 'Info',
            description: 'Non hai ancora un abbonamento attivo',
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Errore',
            description: 'Non è stato possibile caricare i dati dell\'abbonamento',
          });
        }
      } finally {
        setIsLoading(false);
        console.log('Loading state set to false');
      }
    };

    loadSubscriptions();
  }, [user, token, toast]);
  
  const handleManageSubscription = () => {
    // In un'implementazione reale, qui reindirizzeremmo a una pagina di gestione abbonamenti
    // o a un portale cliente di servizi come Stripe
    toast({
      title: 'Funzionalità in arrivo',
      description: 'La gestione degli abbonamenti sarà disponibile a breve.',
    });
  };
  
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Attivo</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Scaduto</Badge>;
      case 'canceled':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Cancellato</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Completato</Badge>;
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">In attesa</Badge>;
      case 'available':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Disponibile</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Sconosciuto</Badge>;
    }
  };
  
  const getPlanTypeIcon = (planType: string) => {
    switch(planType) {
      case 'single':
        return <CheckSquare className="h-5 w-5 mr-2 text-gray-500" />;
      case 'verification':
        return <Clock className="h-5 w-5 mr-2 text-amber-500" />;
      case 'periodic':
        return <RotateCcw className="h-5 w-5 mr-2 text-blue-500" />;
      case 'multiple':
        return <FileText className="h-5 w-5 mr-2 text-green-500" />;
      case 'progress':
        return <CheckSquare className="h-5 w-5 mr-2 text-[var(--color-primary-500)]" />;
      default:
        return <CheckSquare className="h-5 w-5 mr-2 text-gray-500" />;
    }
  };
  
  const getPlanTypeName = (planType: string) => {
    switch(planType) {
      case 'single':
        return "Questionario singolo";
      case 'verification':
        return "Verifica dopo periodo";
      case 'periodic':
        return "Questionari periodici";
      case 'multiple':
        return "Questionari multipli";
      case 'progress':
        return "Progressione di apprendimento";
      default:
        return "Piano standard";
    }
  };

  const renderQuestionnaires = (subscription: Subscription) => {
    if (!subscription.questionnaires || subscription.questionnaires.length === 0) {
      return (
        <div className="text-center p-4 border border-dashed rounded-md">
          <p className="text-gray-500">Nessun questionario disponibile</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium mb-3">Questionari del tuo piano:</h3>
        {subscription.questionnaires.map((q) => (
          <div key={q.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center space-x-3 flex-1">
              {q.status === 'completed' ? (
                <CheckSquare className="h-5 w-5 text-green-500 flex-shrink-0" />
              ) : q.status === 'available' ? (
                <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />
              ) : (
                <Clock className="h-5 w-5 text-amber-500 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm mb-1 truncate">{q.name}</div>
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  {getStatusBadge(q.status)}
                  {q.status === 'pending' && q.available_at && (
                    <span className="text-gray-500">
                      Disponibile dal: {new Date(q.available_at).toLocaleDateString('it-IT')}
                    </span>
                  )}
                  {q.sequence && (
                    <span className="text-gray-500">
                      Sequenza: {q.sequence}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              disabled={q.status === 'pending'}
              onClick={() => window.location.href = `/questionnaire/${q.id}`}
              className="ml-4 flex-shrink-0"
            >
              {q.status === 'completed' ? 'Visualizza' : q.status === 'available' ? 'Compila' : 'In attesa'}
            </Button>
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>I miei abbonamenti</CardTitle>
        <CardDescription>
          Gestisci i tuoi abbonamenti e piani attivi
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
          </div>
        ) : subscriptions.length > 0 ? (
          <div className="space-y-4">
            {subscriptions.map(subscription => (
              <Card key={subscription.id} className={`border-2 ${subscription.status === 'active' ? 'border-green-200' : 'border-gray-200'}`}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6">
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        {getPlanTypeIcon(subscription.plan_type)}
                        <h3 className="font-semibold text-lg">
                          Piano {subscription.plan_name}
                        </h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-sm py-1 px-3 rounded-full bg-[var(--color-primary-100)] text-[var(--color-primary-700)]">
                          {getPlanTypeName(subscription.plan_type)}
                        </span>
                        {subscription.is_free && (
                          <span className="bg-green-100 px-3 py-1 rounded-full text-sm text-green-800">
                            Gratuito
                          </span>
                        )}
                      </div>
                      <div className="mt-2">
                        {getStatusBadge(subscription.status)}
                      </div>
                    </div>
                  </div>
                  
                  {subscription.next_questionnaire_date && (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-center">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                      <div>
                        <p className="text-sm font-medium">Prossimo questionario previsto</p>
                        <p className="text-sm text-gray-600">
                          {new Date(subscription.next_questionnaire_date).toLocaleDateString('it-IT')}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <div>
                        <span className="text-sm font-medium">Data inizio:</span>
                        <br />
                        <span className="text-sm text-gray-600">
                          {new Date(subscription.started_at).toLocaleDateString('it-IT')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <div>
                        <span className="text-sm font-medium">Data scadenza:</span>
                        <br />
                        <span className="text-sm text-gray-600">
                          {new Date(subscription.expires_at).toLocaleDateString('it-IT')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-sm font-medium mb-3">Caratteristiche del piano:</h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(subscription.features || []).map((feature, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <CheckSquare className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {renderQuestionnaires(subscription)}
                  
                  <div className="mt-6 pt-4 border-t">
                    <Button 
                      onClick={handleManageSubscription}
                      variant="outline" 
                      className="w-full flex items-center justify-center space-x-2"
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>Gestisci abbonamento</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p className="mb-4">Non hai abbonamenti attivi</p>
            <Button 
              onClick={() => window.location.href = '/pricing'}
              className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-700)]"
            >
              Visualizza i piani disponibili
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
