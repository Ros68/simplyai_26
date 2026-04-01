import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  fetchAllPlansForAdmin,
  deletePlan,
  updatePlanStatus,
  checkPlanHasUsers,
} from "@/services/ApiService";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string | null;
  features: string[] | any;
  is_popular: boolean | null;
  is_free: boolean | null;
  active: boolean | null;
}

const PlansManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setIsLoading(true);
      console.log("🔄 Fetching plans...");

      const plansData = await fetchAllPlansForAdmin();
      console.log("📦 Plans data received:", plansData);

      if (plansData) {
        const transformedPlans = plansData.map((plan: any) => ({
          ...plan,
          features: Array.isArray(plan.features)
            ? plan.features
            : typeof plan.features === "string"
            ? JSON.parse(plan.features || "[]")
            : plan.features || [],
          is_free: Boolean(plan.is_free),
        }));

        console.log("✅ Setting plans:", transformedPlans.length);
        setPlans(transformedPlans);
      }
    } catch (error) {
      console.error("❌ Error fetching plans:", error);
      toast({
        title: "Errore",
        description:
          "Impossibile caricare i piani: " + (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePlan = async () => {
    if (!planToDelete) return;

    try {
      setIsDeleting(true);
      
      // VERIFY IF PLAN HAS USERS
      console.log("🔍 Checking if plan has users:", planToDelete.id);
      const hasUsers = await checkPlanHasUsers(planToDelete.id);
      
      if (hasUsers) {
        toast({
          title: "Impossibile eliminare",
          description: "Questo piano è stato acquistato da utenti. Non può essere eliminato, ma puoi disattivarlo.",
          variant: "destructive",
        });
        setPlanToDelete(null);
        setIsDeleting(false);
        return;
      }

      // If no users, proceed with deletion
      console.log("✅ Plan has no users, proceeding with deletion");
      await deletePlan(planToDelete.id);

      toast({
        title: "Piano eliminato",
        description: "Il piano è stato eliminato con successo",
      });

      fetchPlans();
    } catch (error) {
      console.error("❌ Error deleting plan:", error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare il piano",
        variant: "destructive",
      });
    } finally {
      setPlanToDelete(null);
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean | null) => {
    try {
      await updatePlanStatus(id, !isActive);

      toast({
        title: isActive ? "Piano disattivato" : "Piano attivato",
        description: `Il piano è stato ${
          isActive ? "disattivato" : "attivato"
        } con successo`,
      });

      fetchPlans();
    } catch (error) {
      console.error("Error toggling plan active state:", error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare lo stato del piano",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (price: number) => {
    return `€${price.toFixed(2)}`;
  };

  const renderPlanType = (plan: Plan) => {
    if (plan.is_free === true) {
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-300"
        >
          Gratuito
        </Badge>
      );
    }

    if (plan.is_popular === true) {
      return (
        <Badge
          variant="default"
          className="bg-[var(--color-primary-100)] text-[var(--color-primary-700)] border-[var(--color-primary-300)]"
        >
          Premium
        </Badge>
      );
    }

    return <Badge variant="outline">Standard</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestione Piani</h1>
          <p className="text-muted-foreground mt-2">
            Gestisci i piani di abbonamento della piattaforma
          </p>
        </div>
        <Button onClick={() => navigate("/admin/plans/create")}>
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Piano
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Piani</CardTitle>
          <CardDescription>
            Gestisci i piani di abbonamento disponibili per i tuoi utenti. Piani
            caricati: {plans.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-10">Caricamento in corso...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Prezzo</TableHead>
                  <TableHead>Attivo</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6">
                      Nessun piano trovato. Crea un nuovo piano per iniziare.
                    </TableCell>
                  </TableRow>
                ) : (
                  plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell>{renderPlanType(plan)}</TableCell>
                      <TableCell>
                        {plan.is_free ? "Gratuito" : formatPrice(plan.price)}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={plan.active === true}
                          onCheckedChange={() =>
                            handleToggleActive(plan.id, plan.active)
                          }
                          aria-label={`${
                            plan.active ? "Disattiva" : "Attiva"
                          } piano ${plan.name}`}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate(`/admin/plans/edit/${plan.id}`)
                            }
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Modifica
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setPlanToDelete(plan)}
                            disabled={isDeleting}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Elimina
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!planToDelete}
        onOpenChange={() => setPlanToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Sei sicuro di voler eliminare questo piano?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione non può essere annullata. Ciò eliminerà
              permanentemente il piano "{planToDelete?.name}" e rimuoverà i dati
              associati.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePlan}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? "Eliminazione..." : "Elimina"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PlansManagement;