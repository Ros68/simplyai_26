import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  MoreVertical,
  Trash2,
  Copy,
  Edit,
  FileText,
  Layout,
  Eye,
  Upload,
} from "lucide-react";
import FormImportDialog from "@/components/admin/FormImportDialog";
import { API_BASE_URL } from "@/config/api";

interface Form {
  id: string;
  title: string;
  description?: string;
  status: "published" | "draft";
  questions?: object;
  created_at: string;
  updated_at: string;
  createdAt?: string;
  logo?: string | null;
}

const FormBuilder = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showInactiveOnly, setShowInactiveOnly] = useState(false);
  const [deleteFormId, setDeleteFormId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shortcodeFormId, setShortcodeFormId] = useState<string | null>(null);
  const [shortcodeDialogOpen, setShortcodeDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const fetchForms = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/forms`);
      if (!res.ok) throw new Error("Errore nel recupero dei forms");
      const result = await res.json();

      if (result.success) {
        setForms(result.data || []);
      } else {
        throw new Error(result.message || "Errore nel recupero dei forms");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
    // Refetch forms when page regains focus
    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchForms();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const filteredForms = (Array.isArray(forms) ? forms : []).filter((form) => {
    const matchesSearch =
      form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (form.description || "").toLowerCase().includes(searchTerm.toLowerCase());
    const isActive = form.status === "published";
    const matchesActiveState = showInactiveOnly ? !isActive : true;
    return matchesSearch && matchesActiveState;
  });

  const handleCreateNew = () => {
    navigate("/admin/form-builder/edit/new");
  };

  const handleEdit = (formId: string) => {
    navigate(`/admin/form-builder/edit/${formId}`);
  };

  const handleDuplicate = (formId: string) => {
    const formsArray = Array.isArray(forms) ? forms : [];
    const formToDuplicate = formsArray.find((f) => f.id === formId);
    if (formToDuplicate) {
      const newForm = {
        ...formToDuplicate,
        id: (formsArray.length + 1).toString(),
        title: `${formToDuplicate.title} (Copia)`,
        createdAt: new Date().toISOString().split("T")[0],
      };

      setForms([...formsArray, newForm]);
      toast({
        title: "Form duplicato",
        description: `"${formToDuplicate.title}" è stato duplicato con successo.`,
      });
    }
  };

  const handleDelete = (formId: string) => {
    setDeleteFormId(formId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteFormId) return;

    try {
      console.log("Deleting form with ID:", deleteFormId);

      const response = await fetch(`${API_BASE_URL}/forms/${deleteFormId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();
      console.log("Delete response:", result);

      if (!response.ok) {
        throw new Error(
          result.message || `Failed to delete form: ${response.status}`
        );
      }

      if (result.success) {
        // Only remove from local state if backend deletion was successful
        const formsArray = Array.isArray(forms) ? forms : [];
        setForms(formsArray.filter((f) => f.id !== deleteFormId));
        setDeleteDialogOpen(false);
        setDeleteFormId(null);

        toast({
          title: "Form eliminato",
          description: `Il form "${
            result.data?.title || "senza nome"
          }" è stato eliminato con successo.`,
        });

        console.log(
          "✅ Form deleted successfully from both backend and frontend"
        );
      } else {
        throw new Error(result.message || "Delete operation failed");
      }
    } catch (error) {
      console.error("❌ Error deleting form:", error);

      toast({
        title: "Errore durante l'eliminazione",
        description:
          error instanceof Error
            ? error.message
            : "Si è verificato un errore durante l'eliminazione del form.",
        variant: "destructive",
      });

      // Keep the dialog open so user can retry
    }
  };

  const handleToggleActive = async (formId: string) => {
    const formsArray = Array.isArray(forms) ? forms : [];
    const form = formsArray.find((f) => f.id === formId);
    if (!form) return;

    const newStatus = form.status === "published" ? "draft" : "published";

    try {
      // Update the status in the backend
      const response = await fetch(`${API_BASE_URL}/forms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: parseInt(formId, 10),
          title: form.title,
          description: form.description || "",
          surveyJSON: form.questions || {},
          logo: form.logo || null,
          status: newStatus,
          createdBy: "admin",
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Update the local state
        setForms(
          formsArray.map((f) => {
            if (f.id === formId) {
              return { ...f, status: newStatus };
            }
            return f;
          })
        );

        toast({
          title: "Stato aggiornato",
          description: `Il form "${form.title}" è ora ${
            newStatus === "published" ? "attivo" : "inattivo"
          }.`,
        });
      } else {
        throw new Error(
          result.message || "Errore durante l'aggiornamento dello stato"
        );
      }
    } catch (error) {
      console.error("Error toggling form status:", error);
      toast({
        title: "Errore",
        description: "Errore durante l'aggiornamento dello stato del form",
        variant: "destructive",
      });
    }
  };

  const handleShowShortcode = (formId: string) => {
    setShortcodeFormId(formId);
    setShortcodeDialogOpen(true);
  };

  const handleEditPageLayout = (formId: string) => {
    navigate(`/admin/form-builder/page-layout/${formId}`);
    toast({
      title: "Editor layout pagina",
      description:
        "Modifica la descrizione e il layout della pagina che visualizza il form",
    });
  };

  const handleImportSuccess = () => {
    // Refetch forms after successful import
    fetchForms();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Form Builder</h1>
          <p className="text-muted-foreground mt-2">
            Gestisci i tuoi form e questionari
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setImportDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import Form
          </Button>
          <Button onClick={handleCreateNew}>
            <Plus className="mr-2 h-4 w-4" />
            Crea Nuovo Form
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
        <div className="relative w-full md:w-1/3">
          <Input
            type="search"
            placeholder="Cerca form..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Label htmlFor="show-inactive" className="text-sm font-medium">
            Mostra solo inattivi
          </Label>
          <Switch
            id="show-inactive"
            checked={showInactiveOnly}
            onCheckedChange={setShowInactiveOnly}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full text-center p-10">Caricamento...</div>
        ) : error ? (
          <div className="col-span-full text-center text-red-500 p-10">
            {error}
          </div>
        ) : (
          filteredForms.map((form) => (
            <Card
              key={form.id}
              className={`${form.status === "draft" ? "border-dashed" : ""}`}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1 min-w-0">
                    <CardTitle className="flex items-center min-w-0">
                      <span className="max-w-full break-words whitespace-normal">
                        {form.title}
                      </span>
                      {form.status === "draft" && (
                        <span className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded-full text-gray-600 whitespace-nowrap">
                          Inattivo
                        </span>
                      )}
                      {form.status === "published" && (
                        <span className="ml-2 text-xs bg-green-200 px-2 py-0.5 rounded-full text-green-700 whitespace-nowrap">
                          Attivo
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription className="overflow-hidden text-ellipsis whitespace-nowrap max-w-[220px] md:max-w-[260px] lg:max-w-[320px]">
                      {form.description}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 min-w-0"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[200px]">
                      <DropdownMenuItem onClick={() => handleEdit(form.id)}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span className="truncate">Modifica Form</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          window.open(
                            `/questionnaire-surveyjs/${form.id}`,
                            "_blank"
                          )
                        }
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        <span className="truncate">Test Form</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleEditPageLayout(form.id)}
                      >
                        <Layout className="mr-2 h-4 w-4" />
                        <span className="truncate">Editor Pagina Form</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDuplicate(form.id)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        <span className="truncate">Duplica</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleShowShortcode(form.id)}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        <span className="truncate">Shortcode</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleToggleActive(form.id)}
                      >
                        <Switch
                          checked={form.status === "published"}
                          className="mr-2"
                        />
                        <span className="truncate">
                          {form.status === "published" ? "Disattiva" : "Attiva"}
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => handleDelete(form.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span className="truncate">Elimina</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground truncate">
                    Domande:{" "}
                    {Array.isArray(form.questions)
                      ? form.questions.reduce(
                          (acc, page) => acc + (page.fields?.length || 0),
                          0
                        )
                      : 0}
                  </span>
                  <span className="text-muted-foreground truncate">
                    Creato: {form.createdAt}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="pt-2 flex flex-col gap-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center justify-center gap-2 py-2"
                  onClick={() => handleEdit(form.id)}
                >
                  <Edit className="h-4 w-4" />
                  <span className="font-medium">Modifica Form</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center justify-center gap-2 py-2"
                  onClick={() => handleEditPageLayout(form.id)}
                >
                  <Layout className="h-4 w-4" />
                  <span className="font-medium">Editor Pagina</span>
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      {filteredForms.length === 0 && !loading && (
        <div className="text-center p-10 border rounded-md">
          <p className="text-muted-foreground">Nessun form trovato</p>
          {searchTerm && (
            <p className="text-sm mt-2">
              Prova a modificare i criteri di ricerca
            </p>
          )}
        </div>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma eliminazione</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare questo form? Questa azione non può
              essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Annulla
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Elimina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={shortcodeDialogOpen} onOpenChange={setShortcodeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Shortcode del Form</DialogTitle>
            <DialogDescription>
              Copia questo shortcode per inserire il form in una pagina
            </DialogDescription>
          </DialogHeader>
          <div className="bg-gray-100 p-4 rounded-md font-mono text-sm overflow-x-auto my-4">
            [simoly_form id="{shortcodeFormId}"]
          </div>
          <p className="text-sm text-muted-foreground">
            Aggiungi questo shortcode in qualsiasi pagina per mostrare il form
            ai visitatori. Solo gli utenti autenticati potranno compilarlo.
          </p>
          <DialogFooter>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(
                  `[simoly_form id="${shortcodeFormId}"]`
                );
                toast({
                  title: "Shortcode copiato",
                  description: "Lo shortcode è stato copiato negli appunti.",
                });
                setShortcodeDialogOpen(false);
              }}
            >
              Copia Shortcode
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FormImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
};

export default FormBuilder;
