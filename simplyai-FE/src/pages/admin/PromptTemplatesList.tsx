/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  Plus,
  Pencil,
  Copy,
  Trash2,
  FileText,
} from "lucide-react";
import { fetchPlan } from "@/services/plans-mysql";
import {
  fetchPlanQuestionnaires,
  fetchAllQuestionnaires,
  addQuestionnaireToPlan,
} from "@/services/questionnaire-config-mysql";
import {
  fetchPlanPromptTemplates,
  deletePromptTemplate,
  fetchPromptsForPlanQuestionnaires,
} from "@/services/prompt-templates-mysql";
import type {
  Plan,
  PlanQuestionnaire,
  PromptTemplate,
} from "@/services/plans-mysql";
import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import type { Questionnaire } from "@/services/questionnaire-config-mysql";

const PromptTemplatesList = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [questionnaires, setQuestionnaires] = useState<PlanQuestionnaire[]>([]);
  const [availableQuestionnaires, setAvailableQuestionnaires] = useState<
    Questionnaire[]
  >([]);
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>([]);
  const [promptsByQuestionnaire, setPromptsByQuestionnaire] = useState<
    Record<string, PromptTemplate[]>
  >({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [addQuestionnaireDialogOpen, setAddQuestionnaireDialogOpen] =
    useState(false);
  const [selectedQuestionnaireId, setSelectedQuestionnaireId] = useState<
    string | undefined
  >(undefined);
  const [isAddingQuestionnaire, setIsAddingQuestionnaire] = useState(false);
  const [showAiPreviewDialog, setShowAiPreviewDialog] = useState(false);
  const [selectedTemplateForPreview, setSelectedTemplateForPreview] =
    useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!planId) return;

      try {
        setLoading(true);

        // Carica i dettagli del piano
        const planData = await fetchPlan(planId);
        if (planData) {
          setPlan(planData.plan);

          // Carica tutti i questionari collegati al piano
          const questionnairesData = await fetchPlanQuestionnaires(planId);
          console.log("Questionari caricati:", questionnairesData);
          setQuestionnaires(questionnairesData);

          // Carica tutti i template prompt per il piano
          const templates = await fetchPlanPromptTemplates(planId);
          console.log("Template prompt caricati:", templates);
          setPromptTemplates(templates);

          // Se abbiamo questionari, carica i prompt per questionario
          if (questionnairesData.length > 0) {
            const questionnaireIds = questionnairesData.map(
              (q) => q.questionnaire_id
            );
            const prompts = await fetchPromptsForPlanQuestionnaires(
              planId,
              questionnaireIds
            );
            setPromptsByQuestionnaire(prompts);
          }
        }

        // Carica tutti i questionari disponibili
        const allQuestionnaires = await fetchAllQuestionnaires();
        console.log("Tutti i questionari disponibili:", allQuestionnaires);
        setAvailableQuestionnaires(allQuestionnaires || []);
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Errore",
          description: "Si è verificato un errore nel caricamento dei dati",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [planId, toast]);

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;

    try {
      const success = await deletePromptTemplate(templateToDelete);

      if (success) {
        // Aggiorna entrambe le liste
        setPromptTemplates((prev) =>
          prev.filter((t) => t.id !== templateToDelete)
        );

        // Aggiorna promptsByQuestionnaire
        const updatedPrompts = { ...promptsByQuestionnaire };
        Object.keys(updatedPrompts).forEach((questionnaireId) => {
          updatedPrompts[questionnaireId] = updatedPrompts[
            questionnaireId
          ].filter((t) => t.id !== templateToDelete);
        });
        setPromptsByQuestionnaire(updatedPrompts);

        toast({
          title: "Eliminato",
          description: "Template del prompt eliminato con successo",
        });
      }
    } catch (error) {
      console.error("Errore nell'eliminazione del template:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore nell'eliminazione del template",
        variant: "destructive",
      });
    } finally {
      setTemplateToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const confirmDelete = (id: string) => {
    setTemplateToDelete(id);
    setDeleteDialogOpen(true);
  };

  const duplicateTemplate = (template: PromptTemplate) => {
    navigate(`/admin/plans/${planId}/prompts/new`, {
      state: {
        duplicate: true,
        template: {
          ...template,
          id: undefined,
          title: `Copia di ${template.title}`,
        },
      },
    });
  };

  const getQuestionnaireTitle = (id: string) => {
    const questionnaire = questionnaires.find((q) => q.questionnaire_id === id);
    return questionnaire?.questionnaire?.title || "Questionario sconosciuto";
  };

  const handleQuestionnaireButtonClick = (questionnaireId: string) => {
    navigate(`/admin/plans/${planId}/prompts/new`, {
      state: { questionnaireId },
    });
  };

  const handleAddQuestionnaires = () => {
    setAddQuestionnaireDialogOpen(true);
  };

  const getAvailableQuestionnaires = () => {
    // Filtra i questionari che sono già associati a questo piano
    const existingIds = questionnaires.map((q) => q.questionnaire_id);
    return availableQuestionnaires.filter((q) => !existingIds.includes(q.id));
  };

  const handleAddQuestionnaire = async () => {
    if (!selectedQuestionnaireId || !planId) return;

    try {
      setIsAddingQuestionnaire(true);

      const result = await addQuestionnaireToPlan(
        planId,
        selectedQuestionnaireId,
        questionnaires.length
      );

      if (result) {
        // Aggiorna la lista dei questionari
        const updatedQuestionnaires = await fetchPlanQuestionnaires(planId);
        console.log(
          "Questionari aggiornati dopo aggiunta:",
          updatedQuestionnaires
        );
        setQuestionnaires(updatedQuestionnaires);

        toast({
          title: "Questionario aggiunto",
          description: "Il questionario è stato aggiunto al piano con successo",
        });

        setAddQuestionnaireDialogOpen(false);
        setSelectedQuestionnaireId(undefined);
      } else {
        throw new Error("Impossibile aggiungere il questionario");
      }
    } catch (error) {
      console.error("Errore nell'aggiunta del questionario:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore nell'aggiunta del questionario",
        variant: "destructive",
      });
    } finally {
      setIsAddingQuestionnaire(false);
    }
  };

  // Funzione per creare un nuovo prompt senza selezionare un questionario
  const handleCreateNewPrompt = () => {
    navigate(`/admin/plans/${planId}/prompts/new`);
  };

  // Add function to handle view AI response
  const handleViewAiResponse = (template: any) => {
    setSelectedTemplateForPreview(template);
    setShowAiPreviewDialog(true);
  };

  // Parse AI response helper
  const safeArray = (value: any): any[] => {
    return Array.isArray(value) ? value : [];
  };

  // Safe object check helper
  const safeObject = (value: any): any => {
    return value && typeof value === "object" && !Array.isArray(value)
      ? value
      : {};
  };
  const parseAiResponse = (aiResponse: any) => {
    if (!aiResponse) return null;

    try {
      const parsed =
        typeof aiResponse === "string" ? JSON.parse(aiResponse) : aiResponse;

      // Validate the structure
      if (!parsed || typeof parsed !== "object") {
        console.warn("Invalid AI response structure");
        return null;
      }

      return parsed;
    } catch (error) {
      console.error("Error parsing AI response:", error);
      return null;
    }
  };

  // Generate prompt preview from template
  const generatePromptPreviewFromTemplate = (
    template: any,
    aiResponseData: any
  ) => {
    let preview = `=== COMPLETE PROMPT STRUCTURE ===\n\n`;

    try {
      // System Prompt
      preview += `📋 SYSTEM PROMPT:\n`;
      preview += `${
        aiResponseData?.prompt_structure?.system_prompt ||
        template?.system_prompt ||
        "No system prompt"
      }\n\n`;
      preview += `---\n\n`;

      // Main Prompt
      preview += `💬 MAIN PROMPT:\n`;
      preview += `${
        aiResponseData?.prompt_structure?.main_prompt ||
        template?.content ||
        "No main prompt"
      }\n\n`;
      preview += `---\n\n`;

      // Main Questionnaire
      if (aiResponseData?.main_questionnaire) {
        preview += `❓ QUESTIONNAIRE: ${
          aiResponseData.main_questionnaire.title || "Untitled"
        }\n\n`;

        const pages = safeArray(
          aiResponseData.main_questionnaire.questions?.pages
        );
        if (pages.length > 0) {
          let qNum = 1;
          pages.forEach((page: any) => {
            if (page?.title) preview += `  📄 ${page.title}\n`;

            const elements = safeArray(page?.elements);
            elements.forEach((element: any) => {
              if (!element) return;

              preview += `\n  ${qNum}. ${
                element.title || element.name || "Untitled Question"
              }\n`;
              preview += `     Type: ${element.type || "unknown"}\n`;
              if (element.description)
                preview += `     Description: ${element.description}\n`;
              preview += `     Required: ${
                element.isRequired ? "Yes" : "No"
              }\n`;

              const choices = safeArray(element.choices);
              if (choices.length > 0) {
                preview += `     Options:\n`;
                choices.forEach((choice: any) => {
                  const text =
                    typeof choice === "string"
                      ? choice
                      : choice?.text || "Unknown option";
                  preview += `        - ${text}\n`;
                });
              }
              qNum++;
            });
            preview += `\n`;
          });
        }
        preview += `---\n\n`;
      }

      // Reference Questionnaires
      const refQuestionnaires = safeObject(
        aiResponseData?.reference_questionnaires_data
      );
      if (Object.keys(refQuestionnaires).length > 0) {
        preview += `📎 REFERENCE QUESTIONNAIRES:\n\n`;

        Object.entries(refQuestionnaires).forEach(
          ([qId, qData]: [string, any]) => {
            if (!qData) return;

            preview += `  📋 ${qData.title || "Untitled Questionnaire"}\n`;
            const pages = safeArray(qData.questions?.pages);
            if (pages.length > 0) {
              let qNum = 1;
              pages.forEach((page: any) => {
                const elements = safeArray(page?.elements);
                elements.forEach((element: any) => {
                  if (!element) return;
                  preview += `    ${qNum}. ${
                    element.title || element.name || "Untitled"
                  } (${element.type || "unknown"})\n`;
                  qNum++;
                });
              });
            }
            preview += `\n`;
          }
        );
        preview += `---\n\n`;
      }

      // Sections
      const sectionsData = safeObject(
        aiResponseData?.prompt_structure?.sections_data
      );
      if (Object.keys(sectionsData).length > 0) {
        preview += `📊 SECTIONS:\n\n`;

        const textSections = safeArray(sectionsData.text);
        if (textSections.length > 0) {
          preview += `TEXT SECTIONS:\n`;
          textSections.forEach((s: any, i: number) => {
            if (!s) return;
            preview += `  ${i + 1}. ${s.title || "Untitled"} (${
              s.shortcode || "N/A"
            })\n`;
            if (s.prompt) preview += `     Instructions: ${s.prompt}\n`;
          });
          preview += `\n`;
        }

        const chartSections = safeArray(sectionsData.charts);
        if (chartSections.length > 0) {
          preview += `CHART SECTIONS:\n`;
          chartSections.forEach((s: any, i: number) => {
            if (!s) return;
            preview += `  ${i + 1}. ${s.title || "Untitled"} (${
              s.shortcode || "N/A"
            }) - Type: ${s.type || "unknown"}\n`;
            if (s.prompt) preview += `     Instructions: ${s.prompt}\n`;
          });
          preview += `\n`;
        }

        const tableSections = safeArray(sectionsData.tables);
        if (tableSections.length > 0) {
          preview += `TABLE SECTIONS:\n`;
          tableSections.forEach((s: any, i: number) => {
            if (!s) return;
            preview += `  ${i + 1}. ${s.title || "Untitled"} (${
              s.shortcode || "N/A"
            })\n`;
            if (s.prompt) preview += `     Instructions: ${s.prompt}\n`;
          });
        }
      }

      return preview;
    } catch (error) {
      console.error("Error generating prompt preview:", error);
      return "Error generating preview. Please check the console for details.";
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/admin/chatgpt")}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Torna a Integrazione ChatGPT
          </Button>
          <h1 className="text-2xl font-bold ml-4">
            Prompt per {plan?.name || "Piano"}
          </h1>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => navigate(`/admin/plans/${planId}/reports`)}
            variant="outline"
          >
            <FileText className="h-4 w-4 mr-2" />
            Template Report
          </Button>
          <Button onClick={handleCreateNewPrompt}>
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Prompt
          </Button>
        </div>
      </div>

      {/* Questionari come bottoni */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Questionari</CardTitle>
          <CardDescription>
            Seleziona un questionario per creare o modificare i suoi prompt
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          {!loading && questionnaires.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
              {questionnaires.map((questionnaire) => {
                const questionnaireId = questionnaire.questionnaire_id;
                const questionnaireTitle =
                  questionnaire.questionnaire?.title ||
                  "Questionario sconosciuto";
                const questionnairePrompts =
                  promptsByQuestionnaire[questionnaireId] || [];

                return (
                  <Button
                    key={questionnaireId}
                    onClick={() =>
                      handleQuestionnaireButtonClick(questionnaireId)
                    }
                    className="w-full h-[80px] flex flex-col items-center justify-center p-3"
                    variant="outline"
                  >
                    <span className="font-medium text-sm line-clamp-2 text-center mb-1 w-full break-words">
                      {questionnaireTitle}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {questionnairePrompts.length} prompt
                    </span>
                  </Button>
                );
              })}
            </div>
          ) : (
            <div className="text-center p-4 md:p-6">
              <p className="text-muted-foreground mb-4 text-sm md:text-base">
                {loading
                  ? "Caricamento questionari..."
                  : "Nessun questionario associato a questo piano."}
              </p>
              {!loading && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
                  <Button
                    onClick={handleAddQuestionnaires}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="text-sm md:text-base">
                      Aggiungi Questionari
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCreateNewPrompt}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="text-sm md:text-base">Crea Prompt</span>
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tutti i Template Prompt</CardTitle>
          <CardDescription>
            Elenco completo di tutti i prompt per questo piano
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : promptTemplates.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titolo</TableHead>
                  <TableHead>Questionario</TableHead>
                  <TableHead>Sequenza</TableHead>
                  <TableHead>AI Response</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promptTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">
                      {template.title}
                    </TableCell>
                    <TableCell>
                      {getQuestionnaireTitle(template.questionnaire_id)}
                    </TableCell>
                    <TableCell>
                      {template.sequence_index === 0
                        ? "Prima compilazione"
                        : `Verifica ${template.sequence_index}`}
                    </TableCell>
                    <TableCell>
                      {template.ai_response ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewAiResponse(template)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Visualizza
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Non disponibile
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            navigate(
                              `/admin/plans/${planId}/prompts/edit/${template.id}`
                            )
                          }
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Modifica</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => duplicateTemplate(template)}
                        >
                          <Copy className="h-4 w-4" />
                          <span className="sr-only">Duplica</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => confirmDelete(template.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Elimina</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center p-8">
              <p className="text-muted-foreground mb-4">
                Nessun prompt configurato per questo piano. Crea il tuo primo
                prompt!
              </p>
              <Button onClick={handleCreateNewPrompt}>
                <Plus className="h-4 w-4 mr-2" />
                Crea Prompt
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={showAiPreviewDialog} onOpenChange={setShowAiPreviewDialog}>
        <DialogContent className="max-w-6xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Preview Prompt e Risposta AI - {selectedTemplateForPreview?.title}
            </DialogTitle>
            <DialogDescription>
              Visualizza il prompt completo e l'anteprima della risposta AI
              generata
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6 p-4">
            {(() => {
              try {
                const aiResponseData = parseAiResponse(
                  selectedTemplateForPreview?.ai_response
                );
                const promptPreview = selectedTemplateForPreview
                  ? generatePromptPreviewFromTemplate(
                      selectedTemplateForPreview,
                      aiResponseData
                    )
                  : "";

                return (
                  <>
                    {/* PROMPT PREVIEW */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        📝 Prompt Completo
                      </h3>
                      <div className="bg-slate-50 border rounded-lg p-4">
                        <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                          {promptPreview}
                        </pre>
                      </div>
                    </div>

                    {/* AI RESPONSE */}
                    {(() => {
                      const sections = safeArray(
                        aiResponseData?.ai_generated_response?.sections
                      );

                      if (sections.length === 0) {
                        return (
                          <div className="text-center p-8 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-amber-800">
                              ⚠️ Nessuna risposta AI disponibile per questo
                              template
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div>
                          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            🤖 Risposta AI Generata
                          </h3>
                          <div className="space-y-4">
                            {sections.map((section: any, index: number) => {
                              if (!section) return null;

                              return (
                                <div
                                  key={index}
                                  className="border rounded-lg p-4 bg-white"
                                >
                                  <div className="flex items-center gap-2 mb-3">
                                    <Badge variant="outline">
                                      {section.section_type || "unknown"}
                                    </Badge>
                                    <h4 className="font-semibold">
                                      {section.title || "Untitled Section"}
                                    </h4>
                                    <span className="text-sm text-muted-foreground">
                                      ({section.shortcode || "N/A"})
                                    </span>
                                  </div>

                                  {section.section_type === "text" && (
                                    <p className="text-sm whitespace-pre-wrap leading-relaxed text-slate-700">
                                      {section.content || "No content"}
                                    </p>
                                  )}

                                  {section.section_type === "chart" && (
                                    <div className="bg-slate-50 p-4 rounded border">
                                      <p className="text-sm font-medium mb-2">
                                        📊 Tipo:{" "}
                                        <Badge>
                                          {section.type || "unknown"}
                                        </Badge>
                                      </p>
                                      <div className="space-y-2 text-sm">
                                        <div>
                                          <span className="font-medium">
                                            Labels:
                                          </span>
                                          <span className="text-slate-600 ml-2">
                                            {(() => {
                                              const data = section.data;
                                              if (Array.isArray(data)) {
                                                return data
                                                  .map(
                                                    (item) =>
                                                      item?.label || "N/A"
                                                  )
                                                  .join(", ");
                                              } else if (
                                                Array.isArray(data?.labels)
                                              ) {
                                                return data.labels.join(", ");
                                              }
                                              return "N/A";
                                            })()}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="font-medium">
                                            Values:
                                          </span>
                                          <span className="text-slate-600 ml-2">
                                            {(() => {
                                              const data = section.data;
                                              if (Array.isArray(data)) {
                                                return data
                                                  .map(
                                                    (item) =>
                                                      item?.value ?? "N/A"
                                                  )
                                                  .join(", ");
                                              } else if (
                                                Array.isArray(data?.values)
                                              ) {
                                                return data.values.join(", ");
                                              }
                                              return "N/A";
                                            })()}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {section.section_type === "table" && (
                                    <div className="overflow-x-auto border rounded">
                                      <table className="w-full text-sm">
                                        <thead>
                                          <tr className="bg-slate-50">
                                            {(() => {
                                              const headers = safeArray(
                                                section.headers
                                              );
                                              const data = safeArray(
                                                section.data
                                              );

                                              if (headers.length > 0) {
                                                return headers.map(
                                                  (
                                                    header: string,
                                                    i: number
                                                  ) => (
                                                    <th
                                                      key={i}
                                                      className="border-b p-2 text-left font-medium"
                                                    >
                                                      {header}
                                                    </th>
                                                  )
                                                );
                                              } else if (
                                                data.length > 0 &&
                                                data[0]
                                              ) {
                                                return Object.keys(data[0]).map(
                                                  (
                                                    header: string,
                                                    i: number
                                                  ) => (
                                                    <th
                                                      key={i}
                                                      className="border-b p-2 text-left font-medium"
                                                    >
                                                      {header}
                                                    </th>
                                                  )
                                                );
                                              }
                                              return (
                                                <th className="border-b p-2 text-left font-medium">
                                                  No headers
                                                </th>
                                              );
                                            })()}
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {(() => {
                                            const rows = safeArray(
                                              section.rows
                                            );
                                            const data = safeArray(
                                              section.data
                                            );

                                            if (rows.length > 0) {
                                              return rows.map(
                                                (row: any, i: number) => {
                                                  const rowArray =
                                                    safeArray(row);
                                                  return (
                                                    <tr
                                                      key={i}
                                                      className="border-b last:border-b-0"
                                                    >
                                                      {rowArray.map(
                                                        (
                                                          cell: any,
                                                          j: number
                                                        ) => (
                                                          <td
                                                            key={j}
                                                            className="p-2 text-slate-700"
                                                          >
                                                            {cell ?? "N/A"}
                                                          </td>
                                                        )
                                                      )}
                                                    </tr>
                                                  );
                                                }
                                              );
                                            } else if (data.length > 0) {
                                              return data.map(
                                                (row: any, i: number) => {
                                                  if (!row) return null;
                                                  return (
                                                    <tr
                                                      key={i}
                                                      className="border-b last:border-b-0"
                                                    >
                                                      {Object.values(row).map(
                                                        (
                                                          cell: any,
                                                          j: number
                                                        ) => (
                                                          <td
                                                            key={j}
                                                            className="p-2 text-slate-700"
                                                          >
                                                            {cell ?? "N/A"}
                                                          </td>
                                                        )
                                                      )}
                                                    </tr>
                                                  );
                                                }
                                              );
                                            }
                                            return (
                                              <tr>
                                                <td className="p-2 text-slate-500 italic">
                                                  No data
                                                </td>
                                              </tr>
                                            );
                                          })()}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </>
                );
              } catch (error) {
                console.error("Error rendering AI preview:", error);
                return (
                  <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800">
                      ❌ Errore nella visualizzazione del preview. Controlla la
                      console per i dettagli.
                    </p>
                  </div>
                );
              }
            })()}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAiPreviewDialog(false)}
            >
              Chiudi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Finestra di dialogo per eliminare il prompt */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma eliminazione</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare questo template di prompt? Questa
              azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Annulla
            </Button>
            <Button variant="destructive" onClick={handleDeleteTemplate}>
              Elimina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Finestra di dialogo per aggiungere un questionario */}
      <Dialog
        open={addQuestionnaireDialogOpen}
        onOpenChange={setAddQuestionnaireDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aggiungi Questionario al Piano</DialogTitle>
            <DialogDescription>
              Seleziona un questionario da aggiungere a questo piano
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Select
              onValueChange={(value) => setSelectedQuestionnaireId(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleziona questionario" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableQuestionnaires().length > 0 ? (
                  getAvailableQuestionnaires().map((q) => (
                    <SelectItem key={q.id} value={q.id}>
                      {q.title}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    Nessun questionario disponibile
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddQuestionnaireDialogOpen(false);
                setSelectedQuestionnaireId(undefined);
              }}
            >
              Annulla
            </Button>
            <Button
              onClick={handleAddQuestionnaire}
              disabled={!selectedQuestionnaireId || isAddingQuestionnaire}
            >
              {isAddingQuestionnaire ? "Aggiungendo..." : "Aggiungi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PromptTemplatesList;
