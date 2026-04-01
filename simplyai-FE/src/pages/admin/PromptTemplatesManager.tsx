import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { ChevronDown, PlusCircle, Delete, Save, ChevronLeft } from 'lucide-react';

import { fetchPlan, fetchPlans } from '@/services/plans';
import { fetchPlanQuestionnaires } from '@/services/questionnaire-config';
import { fetchPlanPromptTemplates, savePromptTemplate, deletePromptTemplate } from '@/services/prompt-templates';
import type { 
  SubscriptionPlan, 
  PlanQuestionnaire,
  PlanSettings,
  PromptTemplate, 
  PromptVariable 
} from '@/types/supabase';

const PromptTemplatesManager = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [planSettings, setPlanSettings] = useState<PlanSettings | null>(null);
  const [questionnaires, setQuestionnaires] = useState<PlanQuestionnaire[]>([]);
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedQuestionnaireId, setSelectedQuestionnaireId] = useState<string | null>(null);
  const [selectedSequenceIndex, setSelectedSequenceIndex] = useState<number>(0);
  const [currentTemplate, setCurrentTemplate] = useState<Partial<PromptTemplate>>({
    title: '',
    content: '',
    system_prompt: '',
    variables: []
  });
  
  useEffect(() => {
    const loadPlanData = async () => {
      if (!planId) return;
      
      try {
        setLoading(true);
        
        const planData = await fetchPlan(planId);
        if (planData) {
          setPlan(planData.plan);
          setPlanSettings(planData.settings);
          
          const questionnairesData = await fetchPlanQuestionnaires(planId);
          setQuestionnaires(questionnairesData);
          
          const templates = await fetchPlanPromptTemplates(planId);
          setPromptTemplates(templates);
          
          if (questionnairesData.length > 0) {
            setSelectedQuestionnaireId(questionnairesData[0].questionnaire_id);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: 'Errore',
          description: 'Si è verificato un errore nel caricamento dei dati',
          variant: 'destructive'
        });
        setLoading(false);
      }
    };
    
    loadPlanData();
  }, [planId, toast]);
  
  useEffect(() => {
    if (!selectedQuestionnaireId || promptTemplates.length === 0) return;
    
    const template = promptTemplates.find(t => 
      t.questionnaire_id === selectedQuestionnaireId && 
      t.sequence_index === selectedSequenceIndex
    );
    
    if (template) {
      setCurrentTemplate(template);
    } else {
      setCurrentTemplate({
        title: `Prompt per ${questionnaires.find(q => q.questionnaire_id === selectedQuestionnaireId)?.questionnaire?.title || 'Questionario'} - Sequenza ${selectedSequenceIndex + 1}`,
        content: '',
        system_prompt: 'Sei un assistente di analisi dati esperto che analizza le risposte ai questionari.',
        variables: []
      });
    }
  }, [selectedQuestionnaireId, selectedSequenceIndex, promptTemplates, questionnaires]);
  
  const handleSaveTemplate = async () => {
    if (!planId || !selectedQuestionnaireId) return;
    
    try {
      const templateToSave = {
        ...currentTemplate,
        plan_id: planId,
        questionnaire_id: selectedQuestionnaireId,
        sequence_index: selectedSequenceIndex
      };
      
      const savedTemplate = await savePromptTemplate(templateToSave);
      
      if (savedTemplate) {
        setPromptTemplates(prev => {
          const existing = prev.findIndex(t => t.id === savedTemplate.id);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = savedTemplate;
            return updated;
          } else {
            return [...prev, savedTemplate];
          }
        });
        
        setCurrentTemplate(savedTemplate);
        
        toast({
          title: 'Salvato',
          description: 'Template del prompt salvato con successo'
        });
      }
    } catch (error) {
      console.error('Errore nel salvataggio del template:', error);
      toast({
        title: 'Errore',
        description: 'Si è verificato un errore nel salvataggio del template',
        variant: 'destructive'
      });
    }
  };
  
  const handleDeleteTemplate = async () => {
    if (!currentTemplate.id) return;
    
    try {
      const success = await deletePromptTemplate(currentTemplate.id);
      
      if (success) {
        setPromptTemplates(prev => prev.filter(t => t.id !== currentTemplate.id));
        
        setCurrentTemplate({
          title: `Prompt per ${questionnaires.find(q => q.questionnaire_id === selectedQuestionnaireId)?.questionnaire?.title || 'Questionario'} - Sequenza ${selectedSequenceIndex + 1}`,
          content: '',
          system_prompt: 'Sei un assistente di analisi dati esperto che analizza le risposte ai questionari.',
          variables: []
        });
        
        toast({
          title: 'Eliminato',
          description: 'Template del prompt eliminato con successo'
        });
      }
    } catch (error) {
      console.error('Errore nell\'eliminazione del template:', error);
      toast({
        title: 'Errore',
        description: 'Si è verificato un errore nell\'eliminazione del template',
        variant: 'destructive'
      });
    }
  };
  
  const handleAddVariable = () => {
    setCurrentTemplate(prev => ({
      ...prev,
      variables: [
        ...(prev.variables || []),
        { name: '', description: '' }
      ]
    }));
  };
  
  const handleVariableChange = (index: number, field: keyof PromptVariable, value: string) => {
    setCurrentTemplate(prev => {
      const variables = [...(prev.variables || [])];
      variables[index] = { 
        ...variables[index], 
        [field]: value 
      };
      return { ...prev, variables };
    });
  };
  
  const handleRemoveVariable = (index: number) => {
    setCurrentTemplate(prev => {
      const variables = [...(prev.variables || [])];
      variables.splice(index, 1);
      return { ...prev, variables };
    });
  };
  
  const getMaxSequences = () => {
    if (!planSettings) return 1;
    
    if (planSettings.is_periodic && planSettings.retake_limit) {
      return planSettings.retake_limit;
    } else if (planSettings.can_retake && planSettings.retake_limit) {
      return planSettings.retake_limit + 1;
    }
    
    return 1;
  };
  
  const sequenceIndexes = Array.from({ length: getMaxSequences() }, (_, i) => i);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  if (!plan) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Piano non trovato</h2>
            <p className="mb-4">Il piano richiesto non è stato trovato.</p>
            <Button onClick={() => navigate('/admin/plans')}>
              Torna alla lista dei piani
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/admin/plans')}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Torna ai piani
          </Button>
          <h1 className="text-2xl font-bold">Gestione Prompt per {plan.name}</h1>
        </div>
      </div>
      
      <Tabs defaultValue="prompt-editor" className="w-full">
        <TabsList>
          <TabsTrigger value="prompt-editor">Editor Prompt</TabsTrigger>
          <TabsTrigger value="prompt-list">Lista Prompt ({promptTemplates.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="prompt-editor">
          <Card>
            <CardHeader>
              <CardTitle>Editor Template Prompt</CardTitle>
              <CardDescription>
                Configura i prompt utilizzati per generare report personalizzati con ChatGPT
              </CardDescription>
              <div className="flex space-x-2 mt-4">
                <div className="flex-1">
                  <Label>Questionario</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {questionnaires.find(q => q.questionnaire_id === selectedQuestionnaireId)?.questionnaire?.title || 'Seleziona un questionario'}
                        <ChevronDown className="h-4 w-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      {questionnaires.map((q) => (
                        <DropdownMenuItem
                          key={q.questionnaire_id}
                          onClick={() => setSelectedQuestionnaireId(q.questionnaire_id)}
                        >
                          {q.questionnaire?.title}
                        </DropdownMenuItem>
                      ))}
                      {questionnaires.length === 0 && (
                        <DropdownMenuItem disabled>
                          Nessun questionario disponibile
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div>
                  <Label>Sequenza</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        {selectedSequenceIndex === 0 ? 'Prima compilazione' : `Verifica ${selectedSequenceIndex}`}
                        <ChevronDown className="h-4 w-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {sequenceIndexes.map((index) => (
                        <DropdownMenuItem
                          key={index}
                          onClick={() => setSelectedSequenceIndex(index)}
                        >
                          {index === 0 ? 'Prima compilazione' : `Verifica ${index}`}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="template-title">Titolo del Template</Label>
                <Input
                  id="template-title"
                  value={currentTemplate.title || ''}
                  onChange={(e) => setCurrentTemplate({ ...currentTemplate, title: e.target.value })}
                  placeholder="Es. Analisi iniziale del questionario"
                />
              </div>
              
              <div>
                <Label htmlFor="system-prompt">System Prompt</Label>
                <Textarea
                  id="system-prompt"
                  rows={3}
                  value={currentTemplate.system_prompt || ''}
                  onChange={(e) => setCurrentTemplate({ ...currentTemplate, system_prompt: e.target.value })}
                  placeholder="Es. Sei un assistente esperto in analisi di questionari aziendali..."
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Il system prompt definisce il comportamento generale dell'assistente AI
                </p>
              </div>
              
              <div>
                <Label htmlFor="prompt-content">Contenuto del Prompt</Label>
                <Textarea
                  id="prompt-content"
                  rows={6}
                  value={currentTemplate.content || ''}
                  onChange={(e) => setCurrentTemplate({ ...currentTemplate, content: e.target.value })}
                  placeholder="Inserisci qui il contenuto del prompt con le variabili tra parentesi graffe, es: {nome_variabile}..."
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Usa {'{questionnaire_data}'} per includere i dati del questionario nel prompt
                </p>
              </div>
              
              <Separator />
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Variabili</Label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleAddVariable}
                  >
                    <PlusCircle className="h-4 w-4 mr-1" /> Aggiungi Variabile
                  </Button>
                </div>
                
                {(currentTemplate.variables || []).length > 0 ? (
                  <div className="space-y-2">
                    {(currentTemplate.variables || []).map((variable, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          value={variable.name}
                          onChange={(e) => handleVariableChange(index, 'name', e.target.value)}
                          placeholder="Nome variabile"
                          className="w-1/3"
                        />
                        <Input
                          value={variable.description}
                          onChange={(e) => handleVariableChange(index, 'description', e.target.value)}
                          placeholder="Descrizione"
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveVariable(index)}
                        >
                          <Delete className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Nessuna variabile definita. Le variabili ti permettono di personalizzare il prompt con dati specifici.
                  </p>
                )}
              </div>
              
              <div className="bg-muted rounded-md p-4">
                <h3 className="font-medium mb-2">Suggerimenti per l'uso:</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Per i prompt della prima compilazione, concentrati sull'analisi delle risposte attuali.</li>
                  <li>Per i prompt delle verifiche successive, utilizza confronti con le compilazioni precedenti.</li>
                  <li>Usa {'{questionnaire_data}'} per inserire automaticamente le risposte al questionario.</li>
                  <li>Definisci variabili per personalizzare il prompt (es. {'{nome_utente}'}).</li>
                  <li>Per questionari periodici, adatta il prompt in base al numero della verifica.</li>
                </ul>
              </div>
            </CardContent>
            
            <CardFooter className="justify-between">
              <Button
                variant="outline"
                onClick={handleDeleteTemplate}
                disabled={!currentTemplate.id}
              >
                <Delete className="h-4 w-4 mr-2" />
                Elimina
              </Button>
              
              <Button onClick={handleSaveTemplate} disabled={!selectedQuestionnaireId || !currentTemplate.title}>
                <Save className="h-4 w-4 mr-2" />
                Salva Template
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="prompt-list">
          <Card>
            <CardHeader>
              <CardTitle>Template Prompt Configurati</CardTitle>
              <CardDescription>
                Elenco di tutti i template di prompt configurati per questo piano
              </CardDescription>
            </CardHeader>
            <CardContent>
              {promptTemplates.length > 0 ? (
                <div className="space-y-4">
                  {promptTemplates.map(template => {
                    const questionnaire = questionnaires.find(q => q.questionnaire_id === template.questionnaire_id);
                    return (
                      <div 
                        key={template.id} 
                        className="border rounded-md p-4 hover:bg-accent transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedQuestionnaireId(template.questionnaire_id);
                          setSelectedSequenceIndex(template.sequence_index);
                          setCurrentTemplate(template);
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">{template.title}</h3>
                          <span className="text-xs bg-muted px-2 py-1 rounded-full">
                            {template.sequence_index === 0 ? 'Prima compilazione' : `Verifica ${template.sequence_index}`}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Questionario: {questionnaire?.questionnaire?.title || 'Sconosciuto'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1 truncate">
                          {template.content?.substring(0, 100)}...
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">Nessun template di prompt configurato per questo piano.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      document.querySelector('[data-value="prompt-editor"]')?.dispatchEvent(
                        new MouseEvent('click', { bubbles: true })
                      );
                    }}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Crea il primo template
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PromptTemplatesManager;
