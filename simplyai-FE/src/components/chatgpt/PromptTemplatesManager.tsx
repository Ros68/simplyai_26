
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Save, Plus, Trash, Copy, PlusCircle, FileEdit } from 'lucide-react';

import { fetchPlanPromptTemplates, savePromptTemplate, deletePromptTemplate } from '@/services/prompt-templates';
import { fetchPlanQuestionnaires } from '@/services/questionnaire-config';
import { fetchPlan } from '@/services/plans';
import { saveReportTemplate, fetchLatestReportTemplate } from '@/services/report';
import { PromptTemplate, PlanQuestionnaire, SubscriptionPlan, PlanSettings, ReportSection, ChartConfig } from '@/types/supabase';

// Componente per la gestione delle sezioni di testo
const TextSectionsManager = ({ 
  sections, 
  onSectionsChange 
}: { 
  sections: { title: string; shortcode: string }[];
  onSectionsChange: (sections: { title: string; shortcode: string }[]) => void;
}) => {
  const addSection = () => {
    const newShortcode = `text_section_${sections.length + 1}`;
    onSectionsChange([...sections, { title: 'Nuova Sezione', shortcode: newShortcode }]);
  };

  const updateSection = (index: number, field: 'title' | 'shortcode', value: string) => {
    const updatedSections = [...sections];
    updatedSections[index] = { ...updatedSections[index], [field]: value };
    onSectionsChange(updatedSections);
  };

  const removeSection = (index: number) => {
    const updatedSections = [...sections];
    updatedSections.splice(index, 1);
    onSectionsChange(updatedSections);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Sezioni di Testo</h3>
        <Button variant="outline" size="sm" onClick={addSection}>
          <Plus className="h-4 w-4 mr-2" />
          Aggiungi Sezione
        </Button>
      </div>
      
      {sections.length === 0 && (
        <p className="text-sm text-muted-foreground py-3">
          Nessuna sezione di testo definita. Aggiungi sezioni per strutturare il tuo report.
        </p>
      )}
      
      {sections.map((section, index) => (
        <div key={index} className="flex items-center space-x-3 border p-3 rounded-md">
          <div className="flex-1">
            <Input
              value={section.title}
              onChange={(e) => updateSection(index, 'title', e.target.value)}
              placeholder="Titolo sezione"
              className="mb-2"
            />
            <div className="flex items-center bg-gray-50 rounded p-2 text-sm">
              <span className="text-gray-500 mr-2">Shortcode:</span>
              <code className="bg-gray-100 px-2 py-1 rounded">[{section.shortcode}]</code>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => removeSection(index)}>
            <Trash className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ))}
    </div>
  );
};

// Componente per la gestione dei grafici
const ChartSectionsManager = ({ 
  sections, 
  onSectionsChange 
}: { 
  sections: { title: string; shortcode: string; chartType: string; config: ChartConfig }[];
  onSectionsChange: (sections: { title: string; shortcode: string; chartType: string; config: ChartConfig }[]) => void;
}) => {
  const chartTypes = [
    { value: 'bar', label: 'Barre' },
    { value: 'line', label: 'Linea' },
    { value: 'pie', label: 'Torta' },
    { value: 'radar', label: 'Radar' },
    { value: 'area', label: 'Area' },
    { value: 'column', label: 'Colonna' },
    { value: 'scatter', label: 'Dispersione' },
    { value: 'heatmap', label: 'Mappa di calore' },
    { value: 'bubble', label: 'Bolla' }
  ];

  const addChart = () => {
    const newShortcode = `chart_section_${sections.length + 1}`;
    onSectionsChange([
      ...sections, 
      { 
        title: 'Nuovo Grafico', 
        shortcode: newShortcode, 
        chartType: 'bar',
        config: {
          colors: ['#4f46e5', '#60a5fa', '#34d399'],
          height: 300,
          width: '100%'
        }
      }
    ]);
  };

  const updateChart = (index: number, field: 'title' | 'shortcode' | 'chartType', value: string) => {
    const updatedSections = [...sections];
    updatedSections[index] = { ...updatedSections[index], [field]: value };
    onSectionsChange(updatedSections);
  };

  const updateChartConfig = (index: number, config: Partial<ChartConfig>) => {
    const updatedSections = [...sections];
    updatedSections[index] = { 
      ...updatedSections[index], 
      config: { ...updatedSections[index].config, ...config }
    };
    onSectionsChange(updatedSections);
  };

  const removeChart = (index: number) => {
    const updatedSections = [...sections];
    updatedSections.splice(index, 1);
    onSectionsChange(updatedSections);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Grafici</h3>
        <Button variant="outline" size="sm" onClick={addChart}>
          <Plus className="h-4 w-4 mr-2" />
          Aggiungi Grafico
        </Button>
      </div>
      
      {sections.length === 0 && (
        <p className="text-sm text-muted-foreground py-3">
          Nessun grafico definito. Aggiungi grafici per visualizzare dati nel report.
        </p>
      )}
      
      {sections.map((section, index) => (
        <div key={index} className="border rounded-md p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <Input
                value={section.title}
                onChange={(e) => updateChart(index, 'title', e.target.value)}
                placeholder="Titolo grafico"
                className="mb-2"
              />
              <div className="flex items-center bg-gray-50 rounded p-2 text-sm">
                <span className="text-gray-500 mr-2">Shortcode:</span>
                <code className="bg-gray-100 px-2 py-1 rounded">[{section.shortcode}]</code>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => removeChart(index)}>
              <Trash className="h-4 w-4 text-destructive" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor={`chart-type-${index}`}>Tipo di Grafico</Label>
              <select
                id={`chart-type-${index}`}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={section.chartType}
                onChange={(e) => updateChart(index, 'chartType', e.target.value)}
              >
                {chartTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <Label htmlFor={`chart-height-${index}`}>Altezza (px)</Label>
              <Input
                id={`chart-height-${index}`}
                type="number"
                value={section.config?.height || 300}
                onChange={(e) => updateChartConfig(index, { height: parseInt(e.target.value) })}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor={`chart-colors-${index}`}>Colori (separati da virgola)</Label>
            <Input
              id={`chart-colors-${index}`}
              value={(section.config?.colors || []).join(', ')}
              onChange={(e) => updateChartConfig(
                index, 
                { colors: e.target.value.split(',').map(color => color.trim()) }
              )}
              placeholder="#4f46e5, #60a5fa, #34d399"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Inserisci i codici colore HEX separati da virgola
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

// Componente per la gestione delle tabelle
const TableSectionsManager = ({ 
  sections, 
  onSectionsChange 
}: { 
  sections: { title: string; shortcode: string; tableType: string }[];
  onSectionsChange: (sections: { title: string; shortcode: string; tableType: string }[]) => void;
}) => {
  const tableTypes = [
    { value: 'simple', label: 'Semplice' },
    { value: 'comparison', label: 'Comparativa' },
    { value: 'progress', label: 'Progresso' },
    { value: 'stats', label: 'Statistiche' }
  ];

  const addTable = () => {
    const newShortcode = `table_section_${sections.length + 1}`;
    onSectionsChange([
      ...sections, 
      { title: 'Nuova Tabella', shortcode: newShortcode, tableType: 'simple' }
    ]);
  };

  const updateTable = (index: number, field: 'title' | 'shortcode' | 'tableType', value: string) => {
    const updatedSections = [...sections];
    updatedSections[index] = { ...updatedSections[index], [field]: value };
    onSectionsChange(updatedSections);
  };

  const removeTable = (index: number) => {
    const updatedSections = [...sections];
    updatedSections.splice(index, 1);
    onSectionsChange(updatedSections);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Tabelle</h3>
        <Button variant="outline" size="sm" onClick={addTable}>
          <Plus className="h-4 w-4 mr-2" />
          Aggiungi Tabella
        </Button>
      </div>
      
      {sections.length === 0 && (
        <p className="text-sm text-muted-foreground py-3">
          Nessuna tabella definita. Aggiungi tabelle per visualizzare dati strutturati nel report.
        </p>
      )}
      
      {sections.map((section, index) => (
        <div key={index} className="flex items-center space-x-3 border p-3 rounded-md">
          <div className="flex-1 space-y-2">
            <Input
              value={section.title}
              onChange={(e) => updateTable(index, 'title', e.target.value)}
              placeholder="Titolo tabella"
            />
            
            <select
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              value={section.tableType}
              onChange={(e) => updateTable(index, 'tableType', e.target.value)}
            >
              {tableTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            
            <div className="flex items-center bg-gray-50 rounded p-2 text-sm">
              <span className="text-gray-500 mr-2">Shortcode:</span>
              <code className="bg-gray-100 px-2 py-1 rounded">[{section.shortcode}]</code>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => removeTable(index)}>
            <Trash className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ))}
    </div>
  );
};

// Componente per l'editor del template del report
const ReportTemplateEditor = ({ 
  template, 
  onTemplateChange, 
  textSections, 
  chartSections, 
  tableSections,
  onSave
}: { 
  template: string;
  onTemplateChange: (template: string) => void;
  textSections: { title: string; shortcode: string }[];
  chartSections: { title: string; shortcode: string }[];
  tableSections: { title: string; shortcode: string }[];
  onSave: () => void;
}) => {
  const handleInsertShortcode = (shortcode: string) => {
    onTemplateChange(`${template}\n[${shortcode}]\n`);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Template del Report</h3>
        <Button variant="default" onClick={onSave}>
          <Save className="h-4 w-4 mr-2" />
          Salva Template
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Textarea 
            value={template} 
            onChange={(e) => onTemplateChange(e.target.value)}
            rows={15}
            placeholder="Inserisci qui il template del report. Usa gli shortcode per inserire le sezioni dinamiche."
            className="font-mono"
          />
        </div>
        
        <div className="space-y-4">
          <div className="border rounded-md p-3 bg-gray-50">
            <h4 className="font-medium mb-2">Shortcode Disponibili</h4>
            <div className="space-y-3">
              <div>
                <h5 className="text-sm font-medium text-gray-600">Sezioni di Testo</h5>
                <div className="max-h-32 overflow-y-auto">
                  {textSections.map((section, index) => (
                    <Button 
                      key={index} 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs mr-1 mb-1"
                      onClick={() => handleInsertShortcode(section.shortcode)}
                    >
                      [{section.shortcode}]
                    </Button>
                  ))}
                  {textSections.length === 0 && (
                    <p className="text-xs text-muted-foreground">Nessuna sezione di testo definita</p>
                  )}
                </div>
              </div>
              
              <div>
                <h5 className="text-sm font-medium text-gray-600">Grafici</h5>
                <div className="max-h-32 overflow-y-auto">
                  {chartSections.map((section, index) => (
                    <Button 
                      key={index} 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs mr-1 mb-1"
                      onClick={() => handleInsertShortcode(section.shortcode)}
                    >
                      [{section.shortcode}]
                    </Button>
                  ))}
                  {chartSections.length === 0 && (
                    <p className="text-xs text-muted-foreground">Nessun grafico definito</p>
                  )}
                </div>
              </div>
              
              <div>
                <h5 className="text-sm font-medium text-gray-600">Tabelle</h5>
                <div className="max-h-32 overflow-y-auto">
                  {tableSections.map((section, index) => (
                    <Button 
                      key={index} 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs mr-1 mb-1"
                      onClick={() => handleInsertShortcode(section.shortcode)}
                    >
                      [{section.shortcode}]
                    </Button>
                  ))}
                  {tableSections.length === 0 && (
                    <p className="text-xs text-muted-foreground">Nessuna tabella definita</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="border rounded-md p-3">
            <h4 className="font-medium mb-2">Aiuto Template</h4>
            <p className="text-sm text-muted-foreground">
              Inserisci il testo del template e usa gli shortcode per le sezioni dinamiche. 
              Gli shortcode verranno sostituiti dal contenuto generato dall'IA nel report finale.
            </p>
            <div className="text-sm mt-2">
              <h5 className="font-medium">Esempio:</h5>
              <div className="bg-gray-100 p-2 rounded-md mt-1 text-xs whitespace-pre-wrap font-mono">
{`# Report di Analisi

## Sommario
[sommario]

## Dati di Performance
[grafico_performance]

## Conclusioni e Raccomandazioni
[raccomandazioni]`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PromptTemplatesManager = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [planSettings, setPlanSettings] = useState<PlanSettings | null>(null);
  const [questionnaires, setQuestionnaires] = useState<PlanQuestionnaire[]>([]);
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>([]);
  
  const [selectedQuestionnaireId, setSelectedQuestionnaireId] = useState<string>('');
  const [selectedSequenceIndex, setSelectedSequenceIndex] = useState<number>(0);
  const [maxSequenceIndexes, setMaxSequenceIndexes] = useState<Record<string, number>>({});
  
  const [currentPrompt, setCurrentPrompt] = useState<Partial<PromptTemplate> & { variables: { name: string; description: string }[] }>({
    title: '',
    content: '',
    system_prompt: 'Sei un assistente esperto che analizza questionari e crea report dettagliati e professionali.',
    variables: []
  });

  // Stato per le sezioni del report
  const [textSections, setTextSections] = useState<{ title: string; shortcode: string }[]>([]);
  const [chartSections, setChartSections] = useState<{ title: string; shortcode: string; chartType: string; config: ChartConfig }[]>([]);
  const [tableSections, setTableSections] = useState<{ title: string; shortcode: string; tableType: string }[]>([]);
  const [reportTemplate, setReportTemplate] = useState<string>('');

  const [activeTab, setActiveTab] = useState<string>("prompt");
  
  // Load plan and questionnaires data
  useEffect(() => {
    const loadData = async () => {
      if (!planId) return;
      
      try {
        setLoading(true);
        
        // Fetch plan details
        const planData = await fetchPlan(planId);
        if (!planData) {
          toast({
            title: "Errore",
            description: "Piano non trovato",
            variant: "destructive"
          });
          navigate('/admin/plans');
          return;
        }
        
        setPlan(planData.plan);
        setPlanSettings(planData.settings);
        
        // Fetch questionnaires for this plan
        const questionnaireData = await fetchPlanQuestionnaires(planId);
        setQuestionnaires(questionnaireData);
        
        // Fetch all prompt templates for this plan
        const promptTemplatesData = await fetchPlanPromptTemplates(planId);
        setPromptTemplates(promptTemplatesData);
        
        // Calculate max sequence index for each questionnaire
        const sequenceIndexes: Record<string, number> = {};
        if (planData.settings?.can_retake) {
          const maxRetake = planData.settings.retake_limit || 1;
          questionnaireData.forEach(q => {
            sequenceIndexes[q.questionnaire_id] = maxRetake;
          });
        } else {
          questionnaireData.forEach(q => {
            sequenceIndexes[q.questionnaire_id] = 0;
          });
        }
        
        setMaxSequenceIndexes(sequenceIndexes);
        
        // Select first questionnaire by default if available
        if (questionnaireData.length > 0) {
          setSelectedQuestionnaireId(questionnaireData[0].questionnaire_id);
        }

        // Carica il template di report
        const templateContent = await fetchLatestReportTemplate();
        if (templateContent) {
          setReportTemplate(templateContent);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Errore",
          description: "Si è verificato un errore durante il caricamento dei dati",
          variant: "destructive"
        });
        setLoading(false);
      }
    };
    
    loadData();
  }, [planId, navigate, toast]);
  
  // Load prompt template when questionnaire or sequence changes
  useEffect(() => {
    const loadPromptTemplate = () => {
      if (!selectedQuestionnaireId || promptTemplates.length === 0) {
        resetPromptForm();
        return;
      }
      
      // Find matching template
      const template = promptTemplates.find(
        t => t.questionnaire_id === selectedQuestionnaireId && 
             t.sequence_index === selectedSequenceIndex
      );
      
      if (template) {
        setCurrentPrompt(template);

        // Estrai le sezioni dal template
        try {
          // Prova a estrarre le sezioni se sono presenti nei dati
          const sections: ReportSection[] = [];
          const textSec = [];
          const chartSec = [];
          const tableSec = [];

          // Popola le sezioni in base alle variabili del template
          for (const variable of template.variables) {
            if (variable.name.startsWith('text_')) {
              textSec.push({
                title: variable.description || variable.name,
                shortcode: variable.name
              });
            } else if (variable.name.startsWith('chart_')) {
              chartSec.push({
                title: variable.description || variable.name,
                shortcode: variable.name,
                chartType: 'bar',
                config: {
                  colors: ['#4f46e5', '#60a5fa', '#34d399'],
                  height: 300,
                  width: '100%'
                }
              });
            } else if (variable.name.startsWith('table_')) {
              tableSec.push({
                title: variable.description || variable.name,
                shortcode: variable.name,
                tableType: 'simple'
              });
            }
          }

          setTextSections(textSec);
          setChartSections(chartSec);
          setTableSections(tableSec);
        } catch (error) {
          console.error('Error parsing sections:', error);
          setTextSections([]);
          setChartSections([]);
          setTableSections([]);
        }
      } else {
        // Create new template with default values
        resetPromptForm();
      }
    };
    
    loadPromptTemplate();
  }, [selectedQuestionnaireId, selectedSequenceIndex, promptTemplates]);
  
  const resetPromptForm = () => {
    setCurrentPrompt({
      title: selectedQuestionnaireId 
        ? `Prompt per ${questionnaires.find(q => q.questionnaire_id === selectedQuestionnaireId)?.questionnaire?.title || 'Questionario'} ${selectedSequenceIndex > 0 ? `- Verifica ${selectedSequenceIndex + 1}` : ''}`
        : '',
      content: defaultPromptContent,
      system_prompt: 'Sei un assistente esperto che analizza questionari e crea report dettagliati e professionali.',
      variables: defaultVariables
    });
    
    // Reset sections
    setTextSections([
      { title: 'Sommario', shortcode: 'sommario' },
      { title: 'Analisi', shortcode: 'analisi' },
      { title: 'Raccomandazioni', shortcode: 'raccomandazioni' }
    ]);
    
    setChartSections([
      { 
        title: 'Grafico Performance', 
        shortcode: 'grafico_performance', 
        chartType: 'bar',
        config: {
          colors: ['#4f46e5', '#60a5fa', '#34d399'],
          height: 300,
          width: '100%'
        }
      }
    ]);
    
    setTableSections([
      { title: 'Tabella Dati', shortcode: 'tabella_dati', tableType: 'simple' }
    ]);

    // Set default template
    setReportTemplate(defaultReportTemplate);
  };

  const handleDuplicatePrompt = async () => {
    if (!currentPrompt.id || !planId || !selectedQuestionnaireId) return;
    
    // Create a copy of the current prompt without the id
    const { id, created_at, updated_at, ...promptToSave } = currentPrompt as any;
    
    try {
      setSaving(true);
      
      const newPrompt = {
        ...promptToSave,
        plan_id: planId,
        questionnaire_id: selectedQuestionnaireId,
        title: `${currentPrompt.title} (copia)`,
      };
      
      const savedTemplate = await savePromptTemplate(newPrompt);
      
      if (savedTemplate) {
        // Update local state
        setPromptTemplates(prev => [...prev, savedTemplate]);
        
        toast({
          title: "Successo",
          description: "Template di prompt duplicato con successo"
        });
      }
    } catch (error) {
      console.error('Error duplicating prompt template:', error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante la duplicazione del template",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleSavePrompt = async () => {
    if (!planId || !selectedQuestionnaireId || !currentPrompt.title) {
      toast({
        title: "Errore",
        description: "Dati mancanti per il salvataggio del prompt",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setSaving(true);
      
      // Aggiungi le sezioni come variabili
      const variables = [];
      
      // Aggiungi variabili di base
      variables.push({ name: 'questionnaire_data', description: 'Dati completi delle risposte al questionario' });
      if (selectedSequenceIndex > 0) {
        variables.push({ name: 'previous_answers', description: 'Risposte delle compilazioni precedenti' });
      }
      
      // Aggiungi sezioni come variabili
      for (const section of textSections) {
        variables.push({ 
          name: section.shortcode, 
          description: section.title
        });
      }
      
      for (const section of chartSections) {
        variables.push({ 
          name: section.shortcode, 
          description: section.title
        });
      }
      
      for (const section of tableSections) {
        variables.push({ 
          name: section.shortcode, 
          description: section.title
        });
      }
      
      const templateToSave = {
        ...currentPrompt,
        plan_id: planId,
        questionnaire_id: selectedQuestionnaireId,
        sequence_index: selectedSequenceIndex,
        variables
      };
      
      const savedTemplate = await savePromptTemplate(templateToSave);
      
      if (savedTemplate) {
        // Update local state
        setPromptTemplates(prev => {
          const filtered = prev.filter(p => 
            !(p.questionnaire_id === selectedQuestionnaireId && 
              p.sequence_index === selectedSequenceIndex) || 
            p.id === savedTemplate.id
          );
          return [...filtered, savedTemplate];
        });
        
        setCurrentPrompt(savedTemplate);
        
        // Dopo aver salvato il prompt, salva anche il template del report
        await saveReportTemplate({
          title: `Template per ${plan?.name} - ${questionnaires.find(q => q.questionnaire_id === selectedQuestionnaireId)?.questionnaire?.title || 'Questionario'}`,
          content: reportTemplate,
          description: `Template per il report del questionario ${questionnaires.find(q => q.questionnaire_id === selectedQuestionnaireId)?.questionnaire?.title || 'Questionario'}`
        });
        
        toast({
          title: "Successo",
          description: "Template di prompt e report salvati con successo"
        });
      } else {
        throw new Error("Errore durante il salvataggio");
      }
    } catch (error) {
      console.error('Error saving prompt template:', error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il salvataggio del template",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleDeletePrompt = async () => {
    if (!currentPrompt.id) {
      toast({
        description: "Nessun template da eliminare"
      });
      return;
    }
    
    try {
      setDeleting(true);
      
      const success = await deletePromptTemplate(currentPrompt.id);
      
      if (success) {
        // Update local state
        setPromptTemplates(prev => prev.filter(p => p.id !== currentPrompt.id));
        resetPromptForm();
        
        toast({
          title: "Successo",
          description: "Template di prompt eliminato con successo"
        });
      } else {
        throw new Error("Errore durante l'eliminazione");
      }
    } catch (error) {
      console.error('Error deleting prompt template:', error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'eliminazione del template",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
  };
  
  const addVariable = () => {
    setCurrentPrompt({
      ...currentPrompt,
      variables: [...(currentPrompt.variables || []), { name: '', description: '' }]
    });
  };
  
  const updateVariable = (index: number, field: 'name' | 'description', value: string) => {
    const updatedVariables = [...(currentPrompt.variables || [])];
    updatedVariables[index] = { ...updatedVariables[index], [field]: value };
    
    setCurrentPrompt({
      ...currentPrompt,
      variables: updatedVariables
    });
  };
  
  const removeVariable = (index: number) => {
    const updatedVariables = [...(currentPrompt.variables || [])];
    updatedVariables.splice(index, 1);
    
    setCurrentPrompt({
      ...currentPrompt,
      variables: updatedVariables
    });
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Render if no plan was found
  if (!plan || !planId) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Piano non trovato</h2>
        <p className="mb-6">Impossibile trovare il piano richiesto.</p>
        <Button onClick={() => navigate('/admin/plans')}>
          Torna alla gestione piani
        </Button>
      </div>
    );
  }
  
  // Render if no questionnaires were found
  if (questionnaires.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Nessun questionario trovato</h2>
        <p className="mb-6">Questo piano non ha questionari associati. Aggiungi dei questionari al piano per creare prompt.</p>
        <Button onClick={() => navigate(`/admin/plans/${planId}`)}>
          Gestisci piano
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={() => navigate('/admin/plans')}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Torna ai piani
          </Button>
          <h1 className="text-2xl font-bold mt-2">Prompt per il piano: {plan.name}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {currentPrompt.id && (
            <Button 
              variant="outline" 
              onClick={handleDuplicatePrompt} 
              disabled={!currentPrompt.id || saving || deleting}
            >
              <Copy className="h-4 w-4 mr-2" />
              Duplica Prompt
            </Button>
          )}
          
          <Button 
            variant="default" 
            onClick={handleSavePrompt}
            disabled={!currentPrompt.title || !selectedQuestionnaireId || saving || deleting}
          >
            {saving ? (
              <>
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                Salvataggio...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salva Tutto
              </>
            )}
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Seleziona Questionario e Sequenza</CardTitle>
          <CardDescription>
            Seleziona il questionario e la sequenza per cui configurare il prompt
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="questionnaire-select">Questionario</Label>
              <select
                id="questionnaire-select"
                value={selectedQuestionnaireId}
                onChange={(e) => setSelectedQuestionnaireId(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="" disabled>Seleziona un questionario</option>
                {questionnaires.map((q) => (
                  <option key={q.questionnaire_id} value={q.questionnaire_id}>
                    {q.questionnaire?.title || `Questionario ${q.sequence_order}`}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <Label htmlFor="sequence-select">Sequenza</Label>
              <select
                id="sequence-select"
                value={selectedSequenceIndex}
                onChange={(e) => setSelectedSequenceIndex(parseInt(e.target.value))}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!selectedQuestionnaireId}
              >
                <option value="0">Prima compilazione</option>
                {selectedQuestionnaireId && maxSequenceIndexes[selectedQuestionnaireId] > 0 && 
                  Array.from({ length: maxSequenceIndexes[selectedQuestionnaireId] }).map((_, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      Verifica {idx + 1}
                    </option>
                  ))
                }
              </select>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedSequenceIndex === 0 ? 
                  "Questo prompt verrà utilizzato per la prima compilazione del questionario." : 
                  `Questo prompt verrà utilizzato per la verifica ${selectedSequenceIndex} del questionario.`}
              </p>
            </div>
          </div>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  {planSettings?.can_retake ? 
                    `Questo piano permette ${planSettings.retake_limit} verifiche dello stesso questionario con intervallo di ${planSettings.retake_period_days} giorni.` : 
                    'Questo piano non permette verifiche multiple dello stesso questionario.'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Configurazione del Report</CardTitle>
          <CardDescription>
            Configura il prompt e il template del report
          </CardDescription>
        </CardHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-4">
            <TabsList className="grid grid-cols-1 md:grid-cols-4 w-full">
              <TabsTrigger value="prompt">Prompt</TabsTrigger>
              <TabsTrigger value="sections">Sezioni Report</TabsTrigger>
              <TabsTrigger value="charts">Grafici</TabsTrigger>
              <TabsTrigger value="template">Template Report</TabsTrigger>
            </TabsList>
          </div>
          
          <CardContent className="pt-4">
            <TabsContent value="prompt" className="space-y-4">
              <div>
                <Label htmlFor="prompt-title">Titolo del Prompt</Label>
                <Input
                  id="prompt-title"
                  value={currentPrompt.title || ''}
                  onChange={(e) => setCurrentPrompt({ ...currentPrompt, title: e.target.value })}
                  placeholder="Inserisci un titolo per questo prompt"
                />
              </div>
              
              <div>
                <Label htmlFor="system-prompt">System Prompt</Label>
                <Textarea
                  id="system-prompt"
                  value={currentPrompt.system_prompt || ''}
                  onChange={(e) => setCurrentPrompt({ ...currentPrompt, system_prompt: e.target.value })}
                  placeholder="Inserisci le istruzioni di sistema per ChatGPT"
                  rows={4}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Queste sono le istruzioni che definiscono il comportamento generale dell'AI
                </p>
              </div>
              
              <div>
                <Label htmlFor="prompt-content">Contenuto del Prompt</Label>
                <Textarea
                  id="prompt-content"
                  value={currentPrompt.content || ''}
                  onChange={(e) => setCurrentPrompt({ ...currentPrompt, content: e.target.value })}
                  placeholder="Inserisci il contenuto del prompt"
                  rows={8}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Usa {'{questionnaire_data}'} per inserire le risposte al questionario
                  {selectedSequenceIndex > 0 && ', e {previous_answers} per accedere alle risposte precedenti'}
                </p>
              </div>
              
              <div>
                <div className="flex justify-between items-center">
                  <Label>Variabili Aggiuntive</Label>
                  <Button onClick={addVariable} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Aggiungi Variabile
                  </Button>
                </div>
                
                <div className="space-y-3 mt-3">
                  {(currentPrompt.variables || [])
                    .filter(v => !v.name.startsWith('text_') && !v.name.startsWith('chart_') && !v.name.startsWith('table_'))
                    .map((variable, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Input
                        value={variable.name}
                        onChange={(e) => updateVariable(index, 'name', e.target.value)}
                        placeholder="Nome variabile"
                        className="flex-1"
                      />
                      <Input
                        value={variable.description}
                        onChange={(e) => updateVariable(index, 'description', e.target.value)}
                        placeholder="Descrizione"
                        className="flex-1"
                      />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeVariable(index)} 
                        className="text-destructive"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="sections" className="space-y-6">
              <TextSectionsManager 
                sections={textSections}
                onSectionsChange={setTextSections}
              />
            </TabsContent>
            
            <TabsContent value="charts" className="space-y-6">
              <ChartSectionsManager 
                sections={chartSections}
                onSectionsChange={setChartSections}
              />
              
              <div className="border-t pt-6">
                <TableSectionsManager 
                  sections={tableSections}
                  onSectionsChange={setTableSections}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="template">
              <ReportTemplateEditor 
                template={reportTemplate}
                onTemplateChange={setReportTemplate}
                textSections={textSections}
                chartSections={chartSections}
                tableSections={tableSections}
                onSave={handleSavePrompt}
              />
            </TabsContent>
          </CardContent>
        </Tabs>
        
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handleDeletePrompt}
            disabled={!currentPrompt.id || deleting || saving}
          >
            {deleting ? (
              <>
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-primary border-t-transparent rounded-full"></div>
                Eliminazione...
              </>
            ) : (
              <>
                <Trash className="h-4 w-4 mr-2" />
                Elimina Prompt
              </>
            )}
          </Button>
          
          <Button 
            onClick={handleSavePrompt}
            disabled={!currentPrompt.title || !selectedQuestionnaireId || saving || deleting}
          >
            {saving ? (
              <>
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                Salvataggio...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salva Tutto
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-amber-700">
              <strong>Nota:</strong> È importante creare prompt specifici per ogni sequenza di verifica. 
              Per le verifiche successive alla prima, considera di includere analisi comparative con i dati precedenti.
            </p>
          </div>
        </div>
      </div>
      
      {/* Card per lo Shortcode */}
      <Card>
        <CardHeader>
          <CardTitle>Short Code</CardTitle>
          <CardDescription>
            Usa questo short code per includere il sistema di report AI nelle pagine
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 p-4 rounded-md font-mono text-sm overflow-x-auto">
            [simoly_ai_report questionnaire_id="QUESTIONARIO_ID" prompt_id="PROMPT_ID"]
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Inserisci questo short code nella pagina dove vuoi mostrare il report generato dall'AI.
            Sostituisci QUESTIONARIO_ID con l'ID del questionario che desideri analizzare e opzionalmente
            PROMPT_ID con l'ID del template di prompt da utilizzare.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

// Default content for new prompts
const defaultPromptContent = `Analizza i seguenti dati del questionario e genera un report dettagliato suddiviso nelle sezioni indicate nelle variabili:

{questionnaire_data}

1. Per la sezione {sommario}: Crea un riepilogo complessivo delle risposte analizzando i principali punti emersi.

2. Per la sezione {analisi}: Fornisci un'analisi approfondita dei dati, identificando pattern, correlazioni e insight significativi.

3. Per la sezione {raccomandazioni}: Suggerisci azioni concrete e prioritizzate basate sui risultati del questionario.

4. Per il {grafico_performance}: Genera dati strutturati per visualizzare i principali indicatori di performance in un grafico a barre.

5. Per la {tabella_dati}: Crea una tabella strutturata con i dati più rilevanti emersi dal questionario.

Utilizza un linguaggio professionale e basato sui dati, fornendo suggerimenti pratici e specifici.`;

// Default variables for new prompts
const defaultVariables = [
  { name: 'questionnaire_data', description: 'Dati completi delle risposte al questionario' },
  { name: 'sommario', description: 'Sommario del report' },
  { name: 'analisi', description: 'Analisi dettagliata' },
  { name: 'raccomandazioni', description: 'Raccomandazioni e suggerimenti' },
  { name: 'grafico_performance', description: 'Grafico di performance' },
  { name: 'tabella_dati', description: 'Tabella dati principali' }
];

// Default report template
const defaultReportTemplate = `# Report di Analisi

## Sommario
[sommario]

## Analisi Dettagliata
[analisi]

## Dati di Performance
[grafico_performance]

## Dati Principali
[tabella_dati]

## Raccomandazioni
[raccomandazioni]

---
*Questo report è stato generato automaticamente in base alle risposte fornite al questionario.*`;

export default PromptTemplatesManager;
