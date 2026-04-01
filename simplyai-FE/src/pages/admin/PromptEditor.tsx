/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  ChevronLeft,
  PlusCircle,
  Save,
  Trash2,
  Info,
  Eye,
} from "lucide-react";
import { fetchPlan } from "@/services/plans-mysql";
import { fetchPlanQuestionnaires } from "@/services/questionnaire-config-mysql";
import {
  fetchPromptTemplate,
  savePromptTemplate,
  fetchPromptForQuestionnaire,
  PromptTemplateWithSections,
  PromptVariable,
} from "@/services/prompt-templates-mysql";
import type {
  SubscriptionPlan,
  PlanQuestionnaire,
  PlanSettings,
} from "@/types/supabase";
import { chartTypeOptions, tableTypeOptions } from "@/services/chart-config";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

// 🌟 FIX TASK 7: Import ReactQuill and Image Resize Module
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import ImageResize from 'quill-image-resize-module-react';

if (typeof window !== 'undefined') {
  (window as any).Quill = Quill;
  Quill.register('modules/imageResize', ImageResize);
}

const PromptEditor = () => {
  const { planId, promptId } = useParams<{
    planId: string;
    promptId: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // 🌟 FIX: Ref for Quill Editor
  const quillRef = useRef<ReactQuill>(null);

  const state = location.state as {
    duplicate?: boolean;
    template?: PromptTemplateWithSections;
    questionnaireId?: string;
  } | null;

  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [planSettings, setPlanSettings] = useState<PlanSettings | null>(null);
  const [questionnaires, setQuestionnaires] = useState<PlanQuestionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("prompt");
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionType, setEditingSectionType] = useState<
    "text" | "charts" | "tables" | null
  >(null);
  const [showAiResponseDialog, setShowAiResponseDialog] = useState(false);
  const [aiResponseData, setAiResponseData] = useState<any>(null);
  const [promptPreviewData, setPromptPreviewData] = useState<string>("");
  
  const [referenceSelectedQuestionnaires, setReferenceSelectedQuestionnaires] =
    useState<{
      [sectionId: string]: {
        questionnaireId: string;
        shortcode: string;
        sectionType: "text" | "charts" | "tables";
      }[];
    }>({});

  const [selectedQuestionnaireId, setSelectedQuestionnaireId] = useState<
    string | null
  >(null);
  const [selectedSequenceIndex, setSelectedSequenceIndex] = useState<number>(0);

  const [promptTemplate, setPromptTemplate] =
    useState<PromptTemplateWithSections>({
      id: "",
      plan_id: planId || "",
      questionnaire_id: "",
      title: "",
      content: "",
      system_prompt:
        "Sei un assistente esperto che analizza i dati dei questionari.",
      variables: [],
      sequence_index: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      reportTemplate: "",
      sections: {
        text: [],
        charts: [],
        tables: [],
      },
    });

  const [currentSectionPrompt, setCurrentSectionPrompt] = useState({
    id: "",
    type: "",
    title: "",
    prompt: "",
  });

  useEffect(() => {
    const loadData = async () => {
      if (!planId) return;

      try {
        setLoading(true);

        const planData = await fetchPlan(planId);
        if (planData) {
          setPlan(planData.plan as SubscriptionPlan);
          setPlanSettings(planData.settings as PlanSettings);

          const questionnairesData = await fetchPlanQuestionnaires(planId);
          setQuestionnaires(questionnairesData as PlanQuestionnaire[]);

          if (state?.questionnaireId) {
            setSelectedQuestionnaireId(state.questionnaireId);
          } else if (questionnairesData.length > 0) {
            setSelectedQuestionnaireId(questionnairesData[0].questionnaire_id);
          }

          if (promptId && promptId !== "new") {
            const template = await fetchPromptTemplate(promptId);

            if (template) {
              const sections = {
                text:
                  template.sections?.text &&
                  Array.isArray(template.sections.text) &&
                  template.sections.text.length > 0
                    ? template.sections.text
                    : [
                        {
                          id: "1",
                          title: "Introduzione",
                          shortcode: "intro",
                          prompt: "",
                        }
                      ],
                charts:
                  template.sections?.charts &&
                  Array.isArray(template.sections.charts) &&
                  template.sections.charts.length > 0
                    ? template.sections.charts
                    : [],
                tables:
                  template.sections?.tables &&
                  Array.isArray(template.sections.tables) &&
                  template.sections.tables.length > 0
                    ? template.sections.tables
                    : [],
              };

              if (
                template.reference_questionnaires &&
                Object.keys(template.reference_questionnaires).length > 0
              ) {
                const loadedReferences: { [sectionId: string]: any[] } = {};
                Object.entries(template.reference_questionnaires).forEach(
                  ([sectionId, data]) => {
                    if (Array.isArray(data)) {
                      loadedReferences[sectionId] = data;
                    } else if (data && typeof data === "object") {
                      loadedReferences[sectionId] = [data];
                    }
                  }
                );
                setReferenceSelectedQuestionnaires(loadedReferences);
              }

              setPromptTemplate({
                id: template.id || "",
                plan_id: template.plan_id || planId || "",
                questionnaire_id: template.questionnaire_id || "",
                title: template.title || "",
                content: template.content || "",
                system_prompt:
                  template.system_prompt ||
                  "Sei un assistente esperto che analizza i dati dei questionari.",
                variables: Array.isArray(template.variables)
                  ? template.variables
                  : [],
                sequence_index: template.sequence_index || 0,
                created_at: template.created_at || new Date().toISOString(),
                updated_at: template.updated_at || new Date().toISOString(),
                reportTemplate:
                  template.reportTemplate || template.report_template || "",
                sections,
              });

              setSelectedQuestionnaireId(template.questionnaire_id);
              setSelectedSequenceIndex(template.sequence_index || 0);
            } else {
              toast({
                title: "Errore",
                description: "Template non trovato",
                variant: "destructive",
              });
              navigate(`/admin/plans/${planId}/prompts`);
            }
          } else if (state?.duplicate && state.template) {
            const { id, ...rest } = state.template;
            setPromptTemplate({
              ...rest,
              id: "",
              title: `Copia di ${rest.title}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              variables: Array.isArray(rest.variables) ? rest.variables : [],
            });
            setSelectedQuestionnaireId(rest.questionnaire_id);
            setSelectedSequenceIndex(rest.sequence_index);
          } else {
            setPromptTemplate({
              id: "",
              plan_id: planId || "",
              questionnaire_id: state?.questionnaireId || "",
              title: "Nuovo Prompt",
              content: "",
              system_prompt:
                "Sei un assistente esperto che analizza i dati dei questionari.",
              variables: [],
              sequence_index: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              reportTemplate: "",
              sections: {
                text: [
                  {
                    id: "1",
                    title: "Introduzione",
                    shortcode: "intro",
                    prompt: "",
                  }
                ],
                charts: [],
                tables: [],
              },
            });
          }
        }
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
  }, [planId, promptId, toast, state, navigate]);

  const getMaxSequences = () => {
    if (!planSettings) return 1;
    if (planSettings.is_periodic && planSettings.retake_limit) {
      return planSettings.retake_limit;
    } else if (planSettings.can_retake && planSettings.retake_limit) {
      return planSettings.retake_limit + 1;
    }
    return 1;
  };

  const sequenceIndexes = Array.from(
    { length: getMaxSequences() },
    (_, i) => i
  );

  const getQuestionnaireTitle = (questionnaireId: string | null) => {
    if (!questionnaireId) return "Seleziona questionario";
    const questionnaire = questionnaires.find(
      (q) => q.questionnaire_id === questionnaireId
    );
    return questionnaire?.questionnaire?.title || "Questionario non trovato";
  };

  const handleQuestionnaireSelection = (
    questionnaireId: string,
    sectionType: "text" | "charts" | "tables",
    sectionId: string,
    shortcode: string
  ) => {
    setReferenceSelectedQuestionnaires((prev) => {
      const currentSelections = prev[sectionId] || [];
      const isAlreadySelected = currentSelections.some(
        (sel) => sel.questionnaireId === questionnaireId
      );

      if (isAlreadySelected) {
        toast({
          title: "Questionario già selezionato",
          description: `Questo questionario è già associato alla sezione [${shortcode}]`,
          variant: "destructive",
        });
        return prev;
      }

      const newSelection = {
        questionnaireId,
        shortcode,
        sectionType,
      };

      return {
        ...prev,
        [sectionId]: [...currentSelections, newSelection],
      };
    });

    toast({
      title: "Questionario aggiunto",
      description: `Questionario associato alla sezione [${shortcode}]`,
    });
  };

  const getSelectedQuestionnairesForSection = (sectionId: string) => {
    return referenceSelectedQuestionnaires[sectionId] || [];
  };

  const removeQuestionnaireFromSection = (
    sectionId: string,
    questionnaireId: string
  ) => {
    setReferenceSelectedQuestionnaires((prev) => {
      const currentSelections = prev[sectionId] || [];
      const filteredSelections = currentSelections.filter(
        (sel) => sel.questionnaireId !== questionnaireId
      );

      if (filteredSelections.length === 0) {
        const newState = { ...prev };
        delete newState[sectionId];
        return newState;
      }

      return {
        ...prev,
        [sectionId]: filteredSelections,
      };
    });
  };

  const getQuestionnaireById = (questionnaireId: string) => {
    return questionnaires.find((q) => q.questionnaire_id === questionnaireId);
  };

  const SelectedQuestionnairesList = ({
    sectionId,
    sectionType,
  }: {
    sectionId: string;
    sectionType: "text" | "charts" | "tables";
  }) => {
    const selectedQuestionnaires =
      getSelectedQuestionnairesForSection(sectionId);

    if (selectedQuestionnaires.length === 0) {
      return (
        <div className="mt-2 p-2 bg-muted/50 rounded-md border-dashed border">
          <p className="text-xs text-muted-foreground italic">
            Nessun questionario di riferimento selezionato
          </p>
        </div>
      );
    }

    return (
      <div className="mt-2 space-y-2">
        <p className="text-xs font-medium text-muted-foreground">
          Questionari di riferimento ({selectedQuestionnaires.length}):
        </p>
        {selectedQuestionnaires.map((selectedQuestionnaire, index) => {
          const questionnaire = getQuestionnaireById(
            selectedQuestionnaire.questionnaireId
          );

          return (
            <div
              key={`${selectedQuestionnaire.questionnaireId}-${index}`}
              className="p-3 bg-primary/5 border border-primary/20 rounded-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">
                      {questionnaire?.questionnaire?.title ||
                        "Questionario selezionato"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Shortcode associato: [{selectedQuestionnaire.shortcode}]
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    removeQuestionnaireFromSection(
                      sectionId,
                      selectedQuestionnaire.questionnaireId
                    );
                    toast({
                      title: "Rimosso",
                      description: `Riferimento rimosso`,
                    });
                  }}
                  className="h-8 w-8 p-0 hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const handleAddVariable = () => {
    setPromptTemplate((prev) => ({
      ...prev,
      variables: [...(prev.variables || []), { name: "", description: "", type: "string" }],
    }));
  };

  const handleVariableChange = (
    index: number,
    field: keyof PromptVariable,
    value: string
  ) => {
    setPromptTemplate((prev) => {
      const variables = [...(prev.variables || [])];
      variables[index] = {
        ...variables[index],
        [field]: value,
      };
      return { ...prev, variables };
    });
  };

  const handleRemoveVariable = (index: number) => {
    setPromptTemplate((prev) => {
      const variables = [...(prev.variables || [])];
      variables.splice(index, 1);
      return { ...prev, variables };
    });
  };

  const handleAddTextSection = () => {
    const sections = promptTemplate.sections || { text: [], charts: [], tables: [] };
    const newId = (sections.text.length + 1).toString();
    setPromptTemplate((prev) => ({
      ...prev,
      sections: {
        ...prev.sections!,
        text: [...(prev.sections?.text || []), { id: newId, title: `Nuova Sezione ${newId}`, shortcode: `sezione_testo_${newId}`, prompt: "" }],
      },
    }));
  };

  const handleAddChartSection = () => {
    const sections = promptTemplate.sections || { text: [], charts: [], tables: [] };
    const newId = (sections.charts.length + 1).toString();
    setPromptTemplate((prev) => ({
      ...prev,
      sections: {
        ...prev.sections!,
        charts: [
          ...(prev.sections?.charts || []),
          {
            id: newId,
            title: `Grafico ${newId}`,
            type: "bar",
            shortcode: `grafico_${newId}`,
            prompt: "",
            config: {
              colors: ["#4f46e5", "#2dd4bf", "#fbbf24"],
              height: 350,
              animations: { enabled: true },
            },
          },
        ],
      },
    }));
  };

  const handleAddTableSection = () => {
    const sections = promptTemplate.sections || { text: [], charts: [], tables: [] };
    const newId = (sections.tables.length + 1).toString();
    setPromptTemplate((prev) => ({
      ...prev,
      sections: {
        ...prev.sections!,
        tables: [
          ...(prev.sections?.tables || []),
          {
            id: newId,
            title: `Tabella ${newId}`,
            type: "simple",
            shortcode: `tabella_${newId}`,
            prompt: "",
            config: {
              striped: true,
              bordered: false,
            },
          },
        ],
      },
    }));
  };

  const handleRemoveSection = (type: "text" | "charts" | "tables", id: string) => {
    setPromptTemplate((prev) => ({
      ...prev,
      sections: {
        ...prev.sections!,
        [type]: prev.sections![type].filter((item) => item.id !== id),
      },
    }));
  };

  const handleSectionChange = (type: "text" | "charts" | "tables", id: string, field: string, value: any) => {
    setPromptTemplate((prev) => ({
      ...prev,
      sections: {
        ...prev.sections!,
        [type]: prev.sections![type].map((item) =>
          item.id === id ? { ...item, [field]: value } : item
        ),
      },
    }));
  };

  const handleChartConfigChange = (id: string, field: string, value: any) => {
    setPromptTemplate((prev) => ({
      ...prev,
      sections: {
        ...prev.sections!,
        charts: prev.sections!.charts.map((item) =>
          item.id === id ? { ...item, config: { ...item.config, [field]: value } } : item
        ),
      },
    }));
  };

  const handleTableConfigChange = (id: string, field: string, value: any) => {
    setPromptTemplate((prev) => ({
      ...prev,
      sections: {
        ...prev.sections!,
        tables: prev.sections!.tables.map((item) =>
          item.id === id ? { ...item, config: { ...item.config, [field]: value } } : item
        ),
      },
    }));
  };

  const openSectionPromptDialog = (type: "text" | "charts" | "tables", id: string) => {
    const section = promptTemplate.sections![type].find((item) => item.id === id);
    if (section) {
      setEditingSectionType(type);
      setEditingSectionId(id);
      setCurrentSectionPrompt({
        id,
        type,
        title: section.title,
        prompt: section.prompt || "",
      });
    }
  };

  const saveSectionPrompt = () => {
    if (!editingSectionType || !editingSectionId) return;
    setPromptTemplate((prev) => ({
      ...prev,
      sections: {
        ...prev.sections!,
        [editingSectionType]: prev.sections![editingSectionType].map((item) =>
          item.id === editingSectionId ? { ...item, prompt: currentSectionPrompt.prompt } : item
        ),
      },
    }));
    setEditingSectionId(null);
    setEditingSectionType(null);
  };

  const handlePreviewPrompt = () => {
    const referenceQuestionnaires = Object.entries(
      referenceSelectedQuestionnaires
    ).reduce((acc, [sectionId, questionnairesArray]) => {
      acc[sectionId] = questionnairesArray.map((data) => ({
        questionnaireId: data.questionnaireId,
        shortcode: data.shortcode,
        sectionType: data.sectionType,
      }));
      return acc;
    }, {} as Record<string, any>);

    const preview = generatePromptPreview(
      promptTemplate,
      referenceQuestionnaires,
      null // Pass null as we don't have an AI response yet
    );
    setPromptPreviewData(preview);
    setAiResponseData(null);
    setShowAiResponseDialog(true);
  };

  const handleSaveTemplate = async () => {
    if (!planId || !selectedQuestionnaireId) {
      toast({ title: "Errore", description: "Manca il questionario selezionato", variant: "destructive" });
      return;
    }

    try {
      setSaving(true);
      const cleanedSections = promptTemplate.sections
        ? {
            text: promptTemplate.sections.text.map((section: any) => {
              const { reference_questionnaires, ...cleanSection } = section;
              return cleanSection;
            }),
            charts: promptTemplate.sections.charts.map((chart: any) => {
              const { reference_questionnaires, ...cleanChart } = chart;
              return cleanChart;
            }),
            tables: promptTemplate.sections.tables.map((table: any) => {
              const { reference_questionnaires, ...cleanTable } = table;
              return cleanTable;
            }),
          }
        : undefined;

      const referenceQuestionnaires = Object.entries(
        referenceSelectedQuestionnaires
      ).reduce((acc, [sectionId, questionnairesArray]) => {
        acc[sectionId] = questionnairesArray.map((data) => ({
          questionnaireId: data.questionnaireId,
          shortcode: data.shortcode,
          sectionType: data.sectionType,
        }));
        return acc;
      }, {} as Record<string, any>);

      const templateToSave: PromptTemplateWithSections = {
        ...promptTemplate,
        plan_id: planId,
        questionnaire_id: selectedQuestionnaireId,
        sequence_index: selectedSequenceIndex,
        sections: cleanedSections,
        reference_questionnaires: referenceQuestionnaires,
      };

      const savedTemplate = await savePromptTemplate(templateToSave as any);

      if (savedTemplate) {
        toast({ title: "Template salvato", description: "Il template del prompt è stato salvato con successo" });
        const aiResponse = typeof (savedTemplate as any).ai_response === "string" ? JSON.parse((savedTemplate as any).ai_response) : (savedTemplate as any).ai_response;
        const promptPreview = generatePromptPreview(savedTemplate, referenceQuestionnaires, aiResponse);
        setPromptPreviewData(promptPreview);
        setAiResponseData(aiResponse);
        setShowAiResponseDialog(true);
      }
    } catch (error) {
      toast({ title: "Errore", description: "Si è verificato un errore nel salvataggio", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const generatePromptPreview = (template: any, referenceQuestionnaires: Record<string, any>, aiResponseData: any) => {
    let preview = `=== IL PROMPT DEFINITIVO CHE VERRÀ INVIATO A CHATGPT ===\n\n`;

    preview += `📋 SYSTEM PROMPT:\n`;
    preview += `${aiResponseData?.prompt_structure?.system_prompt || template.system_prompt || "Nessun system prompt"}\n\n`;
    preview += `---\n\n`;

    preview += `💬 PROMPT PRINCIPALE:\n`;
    preview += `${aiResponseData?.prompt_structure?.main_prompt || template.content || template.prompt_principale || "Nessun prompt principale"}\n\n`;
    preview += `---\n\n`;

    preview += `📊 CONFIGURAZIONE SEZIONI (Dettagli, Grafici, Tabelle):\n\n`;

    let sectionsData = aiResponseData?.prompt_structure?.sections_data || template.sections_data || template.sections;
    if (typeof sectionsData === "string") {
      try { sectionsData = JSON.parse(sectionsData); } catch (e) { sectionsData = {}; }
    }

    if (sectionsData?.text && sectionsData.text.length > 0) {
      preview += `📝 SEZIONI TESTO:\n`;
      sectionsData.text.forEach((section: any, index: number) => {
        preview += `  ${index + 1}. Titolo: "${section.title}"\n`;
        preview += `     Shortcode: ${section.shortcode}\n`;
        if (section.prompt) preview += `     Istruzioni: "${section.prompt}"\n`;
        preview += `\n`;
      });
    }

    if (sectionsData?.charts && sectionsData.charts.length > 0) {
      preview += `📊 SEZIONI GRAFICI:\n`;
      sectionsData.charts.forEach((section: any, index: number) => {
        preview += `  ${index + 1}. Titolo: "${section.title}"\n`;
        preview += `     Shortcode: ${section.shortcode}\n`;
        preview += `     Tipo Grafico: ${section.type}\n`;
        if (section.config) {
          preview += `     Colori: ${section.config.colors?.join(', ')}\n`;
          preview += `     Altezza: ${section.config.height}px\n`;
        }
        if (section.prompt) preview += `     Istruzioni: "${section.prompt}"\n`;
        preview += `\n`;
      });
    }

    if (sectionsData?.tables && sectionsData.tables.length > 0) {
      preview += `📋 SEZIONI TABELLE:\n`;
      sectionsData.tables.forEach((section: any, index: number) => {
        preview += `  ${index + 1}. Titolo: "${section.title}"\n`;
        preview += `     Shortcode: ${section.shortcode}\n`;
        preview += `     Tipo Tabella: ${section.type}\n`;
        if (section.prompt) preview += `     Istruzioni: "${section.prompt}"\n`;
        preview += `\n`;
      });
    }

    preview += `---\n\n`;
    preview += `ℹ️ NOTA: Quando l'utente compila il form, ChatGPT riceverà anche le RISPOSTE REALI per generare il report finale.`;

    return preview;
  };

  const getShortcodesForTemplate = () => {
    if (!promptTemplate.sections) return "";
    let allShortcodes = "";
    promptTemplate.sections.text.forEach((s) => allShortcodes += `[${s.shortcode}]\n\n`);
    promptTemplate.sections.charts.forEach((c) => allShortcodes += `[${c.shortcode}]\n\n`);
    promptTemplate.sections.tables.forEach((t) => allShortcodes += `[${t.shortcode}]\n\n`);
    return allShortcodes;
  };

  const getSelectedQuestionnaireTitle = () => {
    const questionnaire = questionnaires.find((q) => q.questionnaire_id === selectedQuestionnaireId);
    return questionnaire?.questionnaire?.title || "Questionario selezionato";
  };

  // 🌟 FIX: Memoized Modules with Image Handler to STOP TEXT DISAPPEARING
  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();
    
    input.onchange = async () => {
      const file = input.files ? input.files[0] : null;
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          if (quillRef.current) {
            const quill = quillRef.current.getEditor();
            const range = quill.getSelection(true) || { index: quill.getLength(), length: 0 };
            quill.insertEmbed(range.index, 'image', reader.result as string, 'user');
            quill.setSelection(range.index + 1, 0, 'user');
          }
        };
        reader.readAsDataURL(file);
      }
    };
  }, []);

  const quillModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: { image: imageHandler }
    },
    imageResize: {
      parallax: true,
      modules: ['Resize', 'DisplaySize', 'Toolbar']
    },
    clipboard: { matchVisual: false }
  }), [imageHandler]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="outline" size="sm" onClick={() => navigate(`/admin/plans/${planId}/prompts`)}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Torna alla lista
          </Button>
          <h1 className="text-2xl font-bold ml-4">
            {promptId && promptId !== "new" ? "Modifica Prompt" : "Nuovo Prompt"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handlePreviewPrompt}>
            <Eye className="h-4 w-4 mr-2" />
            Anteprima Prompt
          </Button>
          <Button onClick={handleSaveTemplate} disabled={saving || !selectedQuestionnaireId || !promptTemplate.title}>
            <Save className="h-4 w-4 mr-2" />
            Salva Template
          </Button>
        </div>
      </div>

      <div className="mb-6 flex space-x-4">
        <div className="w-full">
          <h2 className="text-lg font-medium mb-2">
            {selectedQuestionnaireId ? `Configurazione per "${getSelectedQuestionnaireTitle()}"` : "Seleziona questionario"}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Questionario</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between mt-1">
                    {selectedQuestionnaireId ? getSelectedQuestionnaireTitle() : "Seleziona questionario"}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  {questionnaires.length > 0 ? (
                    questionnaires.map((item) => (
                      <DropdownMenuItem key={item.questionnaire_id} onClick={() => setSelectedQuestionnaireId(item.questionnaire_id)}>
                        {item.questionnaire?.title || "Senza nome"}
                      </DropdownMenuItem>
                    ))
                  ) : <DropdownMenuItem disabled>Nessun questionario</DropdownMenuItem>}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div>
              <Label>Sequenza</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between mt-1">
                    {selectedSequenceIndex === 0 ? "Prima compilazione" : `Verifica ${selectedSequenceIndex}`}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  {sequenceIndexes.map((index) => (
                    <DropdownMenuItem key={index} onClick={() => setSelectedSequenceIndex(index)}>
                      {index === 0 ? "Prima compilazione" : `Verifica ${index}`}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full mb-6">
          <TabsTrigger value="prompt" className="flex-1">Configurazione Prompt Generale</TabsTrigger>
          <TabsTrigger value="sections" className="flex-1">Sezioni Report e Prompt</TabsTrigger>
          <TabsTrigger value="template" className="flex-1">Struttura Report (Editor)</TabsTrigger>
        </TabsList>

        <TabsContent value="prompt">
          <Card>
            <CardHeader>
              <CardTitle>Prompt Generale</CardTitle>
              <CardDescription>Imposta il prompt base utilizzato da ChatGPT</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Titolo del Template</Label>
                <Input value={promptTemplate.title || ""} onChange={(e) => setPromptTemplate({ ...promptTemplate, title: e.target.value })} />
              </div>
              <div>
                <Label>System Prompt</Label>
                <Textarea rows={3} value={promptTemplate.system_prompt || ""} onChange={(e) => setPromptTemplate({ ...promptTemplate, system_prompt: e.target.value })} />
              </div>
              <div>
                <Label>Prompt Principale</Label>
                <Textarea rows={8} value={promptTemplate.content || ""} onChange={(e) => setPromptTemplate({ ...promptTemplate, content: e.target.value })} className="font-mono" />
              </div>
              <Separator />
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Variabili</Label>
                  <Button variant="outline" size="sm" onClick={handleAddVariable}><PlusCircle className="h-4 w-4 mr-1" /> Aggiungi</Button>
                </div>
                {(promptTemplate.variables || []).length > 0 ? (
                  <div className="space-y-2">
                    {(promptTemplate.variables || []).map((variable, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input value={variable.name} onChange={(e) => handleVariableChange(index, "name", e.target.value)} placeholder="Nome" className="w-1/3" />
                        <Input value={variable.description} onChange={(e) => handleVariableChange(index, "description", e.target.value)} placeholder="Descrizione" className="flex-1" />
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveVariable(index)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-muted-foreground italic">Nessuna variabile definita.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sections">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Sezioni di Testo</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {promptTemplate.sections?.text.map((section) => (
                  <div key={section.id} className="border rounded-md p-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Titolo Sezione</Label>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveSection("text", section.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                    <Input value={section.title} onChange={(e) => handleSectionChange("text", section.id, "title", e.target.value)} />
                    <div>
                      <Label>Shortcode</Label>
                      <Input value={section.shortcode} onChange={(e) => handleSectionChange("text", section.id, "shortcode", e.target.value)} className="font-mono mt-1" />
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-xs text-muted-foreground">{section.prompt ? "Prompt configurato" : "Nessun prompt specifico"}</span>
                      <Button variant="outline" size="sm" onClick={() => openSectionPromptDialog("text", section.id)}>Modifica Prompt</Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full" onClick={handleAddTextSection}><PlusCircle className="h-4 w-4 mr-2" /> Aggiungi Sezione Testo</Button>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Grafici (ApexCharts)</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {promptTemplate.sections?.charts.map((chart) => (
                    <div key={chart.id} className="border rounded-md p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Titolo Grafico</Label>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveSection("charts", chart.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                      <Input value={chart.title} onChange={(e) => handleSectionChange("charts", chart.id, "title", e.target.value)} />
                      <div>
                        <Label>Tipo di Grafico</Label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full justify-between mt-1">{chart.type || "bar"} <ChevronDown className="h-4 w-4 ml-2" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56">
                            {chartTypeOptions.map((option) => (
                              <DropdownMenuItem key={option.value} onClick={() => handleSectionChange("charts", chart.id, "type", option.value)}>{option.label}</DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div>
                        <Label>Shortcode</Label>
                        <Input value={chart.shortcode} onChange={(e) => handleSectionChange("charts", chart.id, "shortcode", e.target.value)} className="font-mono mt-1" />
                      </div>

                      <div className="mt-4 p-4 border rounded bg-slate-50">
                        <h4 className="text-sm font-semibold mb-3">⚙️ Impostazioni Avanzate Grafico</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div>
                             <Label className="text-xs">Altezza (px)</Label>
                             <Input type="number" value={chart.config?.height || 350} onChange={(e) => handleChartConfigChange(chart.id, 'height', parseInt(e.target.value))} className="mt-1 h-8" />
                           </div>
                           <div>
                             <Label className="text-xs">Colori (es. #ff0000, #00ff00)</Label>
                             <Input value={chart.config?.colors?.join(', ') || ''} onChange={(e) => handleChartConfigChange(chart.id, 'colors', e.target.value.split(',').map(c => c.trim()))} placeholder="#4f46e5, #2dd4bf" className="mt-1 h-8" />
                           </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <span className="text-xs text-muted-foreground">{chart.prompt ? "Prompt configurato" : "Nessun prompt specifico"}</span>
                        <Button variant="outline" size="sm" onClick={() => openSectionPromptDialog("charts", chart.id)}>Modifica Prompt</Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" onClick={handleAddChartSection}><PlusCircle className="h-4 w-4 mr-2" /> Aggiungi Grafico</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Tabelle</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {promptTemplate.sections?.tables.map((table) => (
                    <div key={table.id} className="border rounded-md p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Titolo Tabella</Label>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveSection("tables", table.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                      <Input value={table.title} onChange={(e) => handleSectionChange("tables", table.id, "title", e.target.value)} />
                      <div>
                        <Label>Tipo di Tabella</Label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full justify-between mt-1">{table.type || "simple"} <ChevronDown className="h-4 w-4 ml-2" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56">
                            {tableTypeOptions.map((option) => (
                              <DropdownMenuItem key={option.value} onClick={() => handleSectionChange("tables", table.id, "type", option.value)}>{option.label}</DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div>
                        <Label>Shortcode</Label>
                        <Input value={table.shortcode} onChange={(e) => handleSectionChange("tables", table.id, "shortcode", e.target.value)} className="font-mono mt-1" />
                      </div>

                      <div className="mt-4 p-4 border rounded bg-slate-50">
                        <h4 className="text-sm font-semibold mb-3">⚙️ Impostazioni Tabella</h4>
                        <div className="grid grid-cols-1 gap-3">
                           <div className="flex items-center justify-between">
                             <Label className="text-sm cursor-pointer" htmlFor={`stripe-${table.id}`}>Righe alternate (Striped)</Label>
                             <Switch id={`stripe-${table.id}`} checked={table.config?.striped !== false} onCheckedChange={(c) => handleTableConfigChange(table.id, 'striped', c)} />
                           </div>
                           <div className="flex items-center justify-between">
                             <Label className="text-sm cursor-pointer" htmlFor={`border-${table.id}`}>Bordi visibili (Bordered)</Label>
                             <Switch id={`border-${table.id}`} checked={table.config?.bordered === true} onCheckedChange={(c) => handleTableConfigChange(table.id, 'bordered', c)} />
                           </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <span className="text-xs text-muted-foreground">{table.prompt ? "Prompt configurato" : "Nessun prompt specifico"}</span>
                        <Button variant="outline" size="sm" onClick={() => openSectionPromptDialog("tables", table.id)}>Modifica Prompt</Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" onClick={handleAddTableSection}><PlusCircle className="h-4 w-4 mr-2" /> Aggiungi Tabella</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="template">
          <Card>
            <CardHeader>
              <CardTitle>Struttura del Report (Editor Rich Text)</CardTitle>
              <CardDescription>
                Usa l'editor per formattare il report. Puoi aggiungere colori, font, e inserire gli <strong>[shortcode]</strong> esattamente dove vuoi che appaiano i grafici o i testi.
              </CardDescription>
            </CardHeader>
            <CardContent>
              
              {/* 🌟 FIX TASK 7: ReactQuill with useMemo and image resize */}
              <div className="bg-white rounded-md mb-6">
                <ReactQuill 
                  ref={quillRef}
                  theme="snow"
                  modules={quillModules}
                  value={promptTemplate.reportTemplate || getShortcodesForTemplate()}
                  onChange={(content) => setPromptTemplate({...promptTemplate, reportTemplate: content})}
                  className="h-[400px] mb-12"
                  placeholder="Inizia a scrivere la struttura del report... Usa gli shortcode [nome_sezione] per richiamare i contenuti AI."
                />
              </div>

              <div className="mt-8 p-4 bg-muted rounded-md border">
                <h3 className="text-sm font-semibold mb-2">Shortcode Disponibili da Copiare:</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <h4 className="text-xs font-medium mb-1">Sezioni di Testo:</h4>
                    <div className="space-y-1">
                      {promptTemplate.sections?.text.map((section) => (
                        <div key={section.id} className="text-xs bg-background p-1.5 rounded flex justify-between items-center border">
                          <code>[{section.shortcode}]</code>
                          <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(`[${section.shortcode}]`)} className="h-6 px-2">📋</Button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium mb-1">Grafici:</h4>
                    <div className="space-y-1">
                      {promptTemplate.sections?.charts.map((chart) => (
                        <div key={chart.id} className="text-xs bg-background p-1.5 rounded flex justify-between items-center border">
                          <code>[{chart.shortcode}]</code>
                          <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(`[${chart.shortcode}]`)} className="h-6 px-2">📋</Button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium mb-1">Tabelle:</h4>
                    <div className="space-y-1">
                      {promptTemplate.sections?.tables.map((table) => (
                        <div key={table.id} className="text-xs bg-background p-1.5 rounded flex justify-between items-center border">
                          <code>[{table.shortcode}]</code>
                          <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(`[${table.shortcode}]`)} className="h-6 px-2">📋</Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button onClick={handleSaveTemplate} disabled={saving || !selectedQuestionnaireId || !promptTemplate.title}>
                <Save className="h-4 w-4 mr-2" /> Salva Template
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={editingSectionId !== null} onOpenChange={(open) => { if (!open) setEditingSectionId(null); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Prompt specifico per: {currentSectionPrompt.title}</DialogTitle>
            <DialogDescription>Configura il prompt che ChatGPT utilizzerà per generare specificamente questa sezione del report</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Info className="h-4 w-4 text-primary" />
              <p className="text-sm text-muted-foreground">Usa {"{questionnaire_data}"} per fare riferimento ai dati del questionario.</p>
            </div>
            <Textarea value={currentSectionPrompt.prompt} onChange={(e) => setCurrentSectionPrompt({ ...currentSectionPrompt, prompt: e.target.value })} rows={12} className="font-mono" />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Annulla</Button></DialogClose>
            <Button onClick={saveSectionPrompt}>Salva Prompt</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAiResponseDialog} onOpenChange={setShowAiResponseDialog}>
        <DialogContent className="max-w-6xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Verifica Template Prompt (Anteprima)</DialogTitle>
            <DialogDescription>Verifica il prompt completo che verrà inviato a ChatGPT.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-6 p-4">
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">📝 Prompt Completo Definitivo</h3>
              <div className="bg-slate-50 border rounded-lg p-4"><pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">{promptPreviewData}</pre></div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { navigator.clipboard.writeText(promptPreviewData); toast({ title: "Copiato!" }); }}>📋 Copia Prompt</Button>
            <Button onClick={() => setShowAiResponseDialog(false)}>Chiudi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PromptEditor;