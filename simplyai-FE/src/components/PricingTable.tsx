import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { fetchAllPlans, SubscriptionPlan } from "@/services/plansService";
import { completeRegistrationWithPlan, createFreeSubscription } from "@/services/ApiService";
import { useToast } from "@/components/ui/use-toast";

interface PricingTableProps {
  googleData?: any;
  isGoogleSignup?: boolean;
  facebookData?: any;
  isFacebookSignup?: boolean;
  userSelectedPlanId?: string | null;
  isEmailPasswordUser?: boolean;
  tempUserData?: any;
}

const PricingTable = ({
  googleData,
  isGoogleSignup,
  facebookData,
  isFacebookSignup,
  userSelectedPlanId,
  isEmailPasswordUser,
  tempUserData,
}: PricingTableProps) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [navigatingPlan, setNavigatingPlan] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const data = await fetchAllPlans();

        const transformedPlans = data.map((plan) => ({
          ...plan,
          features: Array.isArray(plan.features) ? plan.features : [],
          button_variant:
            plan.button_variant === "outline" ||
            plan.button_variant === "default"
              ? (plan.button_variant as "outline" | "default")
              : ("outline" as const),
          is_free: Boolean(plan.is_free),
          is_popular: Boolean(plan.is_popular),
          active: Boolean(plan.active),
        }));

        setPlans(transformedPlans);
      } catch (error) {
        console.error("Error fetching plans:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handlePlanSelection = (plan: SubscriptionPlan) => {
    if (isGoogleSignup && googleData) {
      const googleDataParam = encodeURIComponent(JSON.stringify(googleData));
      return `/payment?plan=${plan.id}&price=${plan.is_free ? 0 : plan.price}&google_signup=true&google_data=${googleDataParam}`;
    }

    if (isFacebookSignup && facebookData) {
      const facebookDataParam = encodeURIComponent(JSON.stringify(facebookData));
      return `/payment?plan=${plan.id}&price=${plan.is_free ? 0 : plan.price}&facebook_signup=true&facebook_data=${facebookDataParam}`;
    }

    if (user) {
      return plan.is_free ? `/dashboard?plan=${plan.id}` : `/payment?plan=${plan.id}&price=${plan.price}`;
    }

    return plan.is_free ? `/register?plan=${plan.id}&price=0` : `/payment?plan=${plan.id}&price=${plan.price}`;
  };

  const handlePlanNavigation = async (plan: SubscriptionPlan) => {
    if (navigatingPlan || isRegistering || processingPlan) return;

    if (user && plan.is_free) {
      try {
        setNavigatingPlan(plan.id);
        localStorage.setItem('selectedPlanId', plan.id);
        localStorage.setItem('selectedPlanIsFree', 'true');
        
        const result = await createFreeSubscription(user.id, plan.id);
        
        if (result.success) {
          localStorage.removeItem('selectedPlanId');
          localStorage.removeItem('selectedPlanIsFree');
          toast({ title: 'Piano attivato!', description: 'Il tuo piano gratuito è stato attivato con successo.' });
          navigate('/dashboard');
        } else {
          throw new Error(result.message || 'Failed to create subscription');
        }
      } catch (error) {
        console.error('❌ Error creating free subscription:', error);
        toast({ variant: 'default', title: 'Attenzione', description: 'Navigazione al dashboard in corso...' });
        navigate('/dashboard');
      } finally {
        setNavigatingPlan(null);
      }
      return;
    }

    setNavigatingPlan(plan.id);
    setTimeout(() => {
      navigate(handlePlanSelection(plan));
    }, 100);
  };

  const handlePlanClick = async (plan: SubscriptionPlan) => {
    if (isRegistering || processingPlan) return;

    if (tempUserData) {
      try {
        setProcessingPlan(plan.id);
        setIsRegistering(true);

        if (plan.is_free) {
          const response = await completeRegistrationWithPlan(tempUserData, plan.id);
          if (response.success) {
            localStorage.removeItem("temp_user_data");
            toast({
              title: "Registrazione completata!",
              description: `Benvenuto ${tempUserData.firstName}! Controlla la tua email per confermare il tuo account e poi accedi.`,
            });
            navigate("/login");
          }
        } else {
          navigate(`/payment?plan=${plan.id}&price=${plan.price}&temp_user=true`);
        }
      } catch (error: any) {
        console.error("Error completing registration:", error);
        toast({
          variant: "destructive",
          title: "Errore di registrazione",
          description: error.message || "Si è verificato un errore durante la registrazione.",
        });
      } finally {
        setProcessingPlan(null);
        setIsRegistering(false);
      }
      return;
    }

    if (user && plan.is_free) {
      await handlePlanNavigation(plan);
      return;
    }

    navigate(handlePlanSelection(plan));
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-2 rounded-3xl animate-pulse">
            <CardHeader className="pt-6">
              <div className="h-6 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-32"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      {navigatingPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center shadow-2xl animate-in zoom-in-95 duration-200">
            <Loader2 className="h-12 w-12 animate-spin text-[var(--color-primary)] mb-4" />
            <p className="text-lg font-medium text-gray-900">Caricamento...</p>
            <p className="text-sm text-gray-600 mt-2">Preparazione della pagina in corso</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {plans.map((plan) => {
          const isPreSelected = isEmailPasswordUser && userSelectedPlanId === plan.id;

          // Client ki demand ke mutabiq colors distribute kiye hain:
          let borderClass = "border-[var(--color-primary)]";
          let badgeBgClass = "bg-[var(--color-primary)]";
          
          if (plan.is_free) {
            borderClass = "border-[var(--color-button-secondary)]";
            badgeBgClass = "bg-[var(--color-button-secondary)]";
          } else if (plan.is_popular) {
            borderClass = "border-[var(--color-secondary)]";
            badgeBgClass = "bg-[var(--color-secondary)]";
          }

          return (
            <Card
              key={plan.id}
              className={`border-2 rounded-3xl card-hover transition-opacity ${
                isPreSelected ? `${borderClass} bg-[var(--color-primary-50)] shadow-lg` : borderClass
              } ${
                (isRegistering && processingPlan !== plan.id) || (navigatingPlan && navigatingPlan !== plan.id)
                  ? "opacity-50 pointer-events-none"
                  : ""
              } ${plan.is_popular || plan.is_free ? "shadow-md" : ""}`}
            >
              {isPreSelected && (
                <div className={`${badgeBgClass} text-white text-center py-2 rounded-t-[1.4rem] text-sm font-medium`}>
                  Piano selezionato
                </div>
              )}
              {plan.is_popular && !isPreSelected && (
                <div className={`${badgeBgClass} text-white text-center py-2 rounded-t-[1.4rem] text-sm font-medium`}>
                  Più popolare
                </div>
              )}
              {plan.is_free && !plan.is_popular && !isPreSelected && (
                <div className={`${badgeBgClass} text-white text-center py-2 rounded-t-[1.4rem] text-sm font-medium`}>
                  Gratuito
                </div>
              )}
              
              <CardHeader className={plan.is_popular || plan.is_free || isPreSelected ? "pt-4" : "pt-6"}>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="flex items-baseline mt-3">
                  {plan.is_free ? (
                    <span className="text-3xl font-bold">Gratuito</span>
                  ) : (
                    <>
                      <span className="text-3xl font-bold">
                        €{plan.price.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="ml-1 text-sm text-muted-foreground">/{plan.interval}</span>
                    </>
                  )}
                </div>
                <CardDescription className="mt-2">{plan.description}</CardDescription>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <div className="mr-2 mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary-100)]">
                        <Check className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter>
                {tempUserData ? (
                  <Button
                    variant={plan.is_free ? "secondary" : "default"} // Free plan secondary color uthayega
                    className="w-full"
                    onClick={() => handlePlanClick(plan)}
                    disabled={isRegistering || processingPlan !== null || navigatingPlan !== null}
                  >
                    {processingPlan === plan.id ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{plan.is_free ? "Registrazione..." : "Elaborazione..."}</>
                    ) : (
                      plan.button_text || (plan.is_free ? "Inizia Gratis" : "Seleziona Piano")
                    )}
                  </Button>
                ) : (
                  <Button
                    variant={plan.is_free ? "secondary" : "default"} // Free plan secondary color uthayega
                    className="w-full"
                    onClick={() => handlePlanNavigation(plan)}
                    disabled={navigatingPlan !== null || isRegistering || processingPlan !== null}
                  >
                    {navigatingPlan === plan.id ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Caricamento...</>
                    ) : (
                      plan.button_text || (plan.is_free ? "Inizia Gratis" : "Seleziona Piano")
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default PricingTable;