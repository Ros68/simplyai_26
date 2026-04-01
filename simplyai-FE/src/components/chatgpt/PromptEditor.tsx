import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PromptTemplate, PromptVariable } from "@/types/supabase";
import { fetchPromptTemplate, savePromptTemplate, PromptTemplateWithSections, ReportSectionWithPrompt } from "@/services/prompt-templates";
import { v4 as uuidv4 } from 'uuid';
import { Separator } from '@/components/ui/separator';
import { BarChart3, Table, Text, Trash2, Plus, Copy, FileEdit } from 'lucide-react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';

const PromptEditor = () => {
  const { planId, promptId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // Stato per il prompt template
  const [template, setTemplate] = useState<PromptTemplateWithSections>({
    id: '',
    plan_id: planId || '',
    questionnaire_id: '',
    sequence_index: 0,
    title: 'Nuovo Prompt',
    content: '',
    system_prompt: 'Sei un assistente esperto che analizza i dati dei questionari.',
    variables: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    sections: {
      text: [],
      charts: [],
      tables: []
    },
    reportTemplate: ''
  });

  // Stati per nuove variabili e sezioni
  const [newVariable, setNewVariable] = useState({ name: '', description: '' });
  const [newTextSection, setNewTextSection] = useState({ title: '', prompt: '', shortcode: '' });
  const [newChartSection, setNewChartSection] = useState({ title: '', chartType: 'bar', prompt: '', shortcode: '' });
  const [newTableSection, setNewTableSection] = useState({ title: '', tableType: 'simple', prompt: '', shortcode: '' });

  useEffect(() => {
    const loadTemplate = async () => {
      if (promptId && promptId !== 'new') {
        try {
          const data = await fetchPromptTemplate(promptId);
          if (data) {
            // Converti le sezioni in base al nuovo formato
            const sections = {
              text: data.sections_data?.text || [],
              charts: data.sections_data?.charts || [],
              tables: data.sections_data?.tables || []
            };

            setTemplate({
              ...data,
              sections,
              reportTemplate: data.report_template || ''
            });
          }
        } catch (error) {
          console.error('Errore caricamento prompt:', error);
          toast({
            title: 'Errore',
            description: 'Impossibile caricare il template di prompt',
            variant: 'destructive'
          });
        }
      }
      setLoading(false);
    };

    loadTemplate();
  }, [promptId, toast]);

  const handleSave = async () => {
    if (!template.questionnaire_id) {
      toast({
        title: 'Errore',
        description: 'Seleziona un questionario',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const savedTemplate = await savePromptTemplate({
        ...template,
        plan_id: planId as string,
        questionnaire_id: template.questionnaire_id
      });

      if (savedTemplate) {
        toast({
          title: 'Salvato!',
          description: 'Il template del prompt è stato salvato con successo'
        });

        if (promptId === 'new') {
          navigate(`/admin/plans/${planId}/prompts/${savedTemplate.id}`);
        }
      }
    } catch (error) {
      console.error('Errore salvataggio prompt:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile salvare il template di prompt',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  // Funzioni per gestire le variabili
  const addVariable = () => {
    if (!newVariable.name) return;
    
    setTemplate({
      ...template,
      variables: [
        ...template.variables || [],
        { name: newVariable.name, description: newVariable.description }
      ]
    });
    setNewVariable({ name: '', description: '' });
  };

  const removeVariable = (index: number) => {
    const updatedVariables = [...(template.variables || [])];
    updatedVariables.splice(index, 1);
    
    setTemplate({
      ...template,
      variables: updatedVariables
    });
  };

  // Funzione per generare uno shortcode univoco
  const generateShortcode = (type: string, title: string) => {
    const base = title
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '_')
      .substring(0, 15);
    
    const prefix = type === 'text' ? 'text' : type === 'chart' ? 'chart' : 'table';
    return `${prefix}_${base}_${Math.floor(Math.random() * 1000)}`;
  };

  // Funzioni per gestire le sezioni di testo
  const addTextSection = () => {
    if (!newTextSection.title) return;
    
    const shortcode = newTextSection.shortcode || generateShortcode('text', newTextSection.title);
    
    const newSection: ReportSectionWithPrompt = {
      id: uuidv4(),
      title: newTextSection.title,
      shortcode,
      prompt: newTextSection.prompt || undefined,
      type: 'text'
    };
    
    setTemplate({
      ...template,
      sections: {
        ...template.sections,
        text: [...(template.sections?.text || []), newSection]
      }
    });
    
    setNewTextSection({ title: '', prompt: '', shortcode: '' });
  };

  const removeTextSection = (index: number) => {
    const updatedSections = [...(template.sections?.text || [])];
    updatedSections.splice(index, 1);
    
    setTemplate({
      ...template,
      sections: {
        ...template.sections,
        text: updatedSections
      }
    });
  };

  // Funzioni per gestire le sezioni di grafici
  const addChartSection = () => {
    if (!newChartSection.title) return;
    
    const shortcode = newChartSection.shortcode || generateShortcode('chart', newChartSection.title);
    
    const newSection: ReportSectionWithPrompt = {
      id: uuidv4(),
      title: newChartSection.title,
      shortcode,
      chartType: newChartSection.chartType,
      prompt: newChartSection.prompt || undefined,
      type: 'chart'
    };
    
    setTemplate({
      ...template,
      sections: {
        ...template.sections,
        charts: [...(template.sections?.charts || []), newSection]
      }
    });
    
    setNewChartSection({ title: '', chartType: 'bar', prompt: '', shortcode: '' });
  };

  const removeChartSection = (index: number) => {
    const updatedSections = [...(template.sections?.charts || [])];
    updatedSections.splice(index, 1);
    
    setTemplate({
      ...template,
      sections: {
        ...template.sections,
        charts: updatedSections
      }
    });
  };

  // Funzioni per gestire le sezioni di tabelle
  const addTableSection = () => {
    if (!newTableSection.title) return;
    
    const shortcode = newTableSection.shortcode || generateShortcode('table', newTableSection.title);
    
    const newSection: ReportSectionWithPrompt = {
      id: uuidv4(),
      title: newTableSection.title,
      shortcode,
      tableType: newTableSection.tableType,
      prompt: newTableSection.prompt || undefined,
      type: 'table'
    };
    
    setTemplate({
      ...template,
      sections: {
        ...template.sections,
        tables: [...(template.sections?.tables || []), newSection]
      }
    });
    
    setNewTableSection({ title: '', tableType: 'simple', prompt: '', shortcode: '' });
  };

  const removeTableSection = (index: number) => {
    const updatedSections = [...(template.sections?.tables || [])];
    updatedSections.splice(index, 1);
    
    setTemplate({
      ...template,
      sections: {
        ...template.sections,
        tables: updatedSections
      }
    });
  };

  // Funzione per gestire il riordinamento delle sezioni con drag and drop
  const handleDragEnd = (result: any, sectionType: 'text' | 'charts' | 'tables') => {
    if (!result.destination || !template.sections) return;
    
    const items = Array.from(template.sections[sectionType] || []);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setTemplate({
      ...template,
      sections: {
        ...template.sections,
        [sectionType]: items
      }
    });
  };

  // Funzione per copiare uno shortcode negli appunti
  const copyShortcode = (shortcode: string) => {
    navigator.clipboard.writeText(`[${shortcode}]`);
    toast({
      title: 'Shortcode copiato!',
      description: `Lo shortcode [${shortcode}] è stato copiato negli appunti`
    });
  };

  // Funzione per generare tutti gli shortcode per il template del report
  const generateReportTemplate = () => {
    let template = '';
    
    // Aggiungi le sezioni di testo
    if (template.sections?.text?.length) {
      template += '# Sezioni di Testo\n\n';
      template.sections.text.forEach(section => {
        template += `## ${section.title}\n[${section.shortcode}]\n\n`;
      });
    }
    
    // Aggiungi i grafici
    if (template.sections?.charts?.length) {
      template += '# Grafici\n\n';
      template.sections.charts.forEach(chart => {
        template += `## ${chart.title}\n[${chart.shortcode}]\n\n`;
      });
    }
    
    // Aggiungi le tabelle
    if (template.sections?.tables?.length) {
      template += '# Tabelle\n\n';
      template.sections.tables.forEach(table => {
        template += `## ${table.title}\n[${table.shortcode}]\n\n`;
      });
    }
    
    return template;
  };

  if (loading) {
    return <div className="flex items-center justify-center p-12">Caricamento...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {promptId === 'new' ? 'Nuovo Template Prompt' : 'Modifica Template Prompt'}
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/admin/plans/${planId}/prompts`)}>
            Annulla
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Salvataggio...' : 'Salva Template'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="general">Configurazione Prompt Generale</TabsTrigger>
          <TabsTrigger value="sections">Sezioni Report e Prompt</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Configura il Prompt Generale per il questionario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="title">Titolo del Template</Label>
                <Input 
                  id="title" 
                  value={template.title || ''} 
                  onChange={(e) => setTemplate({ ...template, title: e.target.value })} 
                  placeholder="Nuovo Prompt" 
                />
              </div>

              <div>
                <Label htmlFor="system-prompt">System Prompt</Label>
                <Textarea 
                  id="system-prompt" 
                  value={template.system_prompt || ''} 
                  onChange={(e) => setTemplate({ ...template, system_prompt: e.target.value })}
                  placeholder="Sei un assistente esperto che analizza i dati dei questionari." 
                  rows={4}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Il system prompt definisce il comportamento generale dell'assistente AI
                </p>
              </div>

              <div>
                <Label htmlFor="content">Prompt Principale</Label>
                <Textarea 
                  id="content" 
                  value={template.content || ''} 
                  onChange={(e) => setTemplate({ ...template, content: e.target.value })}
                  placeholder="Inserisci qui il contenuto del prompt generale con le variabili tra parentesi graffe, es: {nome_variabile}..." 
                  rows={8}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Questo è il prompt generale per tutto il report. I prompt specifici per ogni sezione possono essere definiti nella scheda "Sezioni Report e Prompt". Usa {'{questionnaire_data}'} per includere automaticamente i dati del questionario.
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Variabili</Label>
                </div>
                <div className="grid grid-cols-12 gap-4 mb-2">
                  <div className="col-span-5">
                    <Input
                      value={newVariable.name}
                      onChange={(e) => setNewVariable({ ...newVariable, name: e.target.value })}
                      placeholder="Nome variabile"
                    />
                  </div>
                  <div className="col-span-5">
                    <Input
                      value={newVariable.description}
                      onChange={(e) => setNewVariable({ ...newVariable, description: e.target.value })}
                      placeholder="Descrizione (opzionale)"
                    />
                  </div>
                  <div className="col-span-2">
                    <Button onClick={addVariable} type="button" className="w-full" variant="secondary">
                      Aggiungi
                    </Button>
                  </div>
                </div>

                <div className="border rounded-md divide-y">
                  {!template.variables?.length ? (
                    <p className="p-4 text-center text-muted-foreground">Nessuna variabile definita</p>
                  ) : (
                    template.variables.map((variable, index) => (
                      <div key={index} className="grid grid-cols-12 gap-4 p-3 items-center">
                        <div className="col-span-5 font-medium">{variable.name}</div>
                        <div className="col-span-5 text-muted-foreground">{variable.description || "-"}</div>
                        <div className="col-span-2 flex justify-end">
                          <Button 
                            onClick={() => removeVariable(index)} 
                            size="icon"
                            variant="ghost"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sections">
          <div className="space-y-8">
            {/* Sezioni di Testo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Text className="h-5 w-5 mr-2" />
                  Sezioni di Testo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-12 gap-4 mb-4">
                  <div className="col-span-4">
                    <Label htmlFor="text-title">Titolo Sezione</Label>
                    <Input
                      id="text-title"
                      value={newTextSection.title}
                      onChange={(e) => setNewTextSection({ ...newTextSection, title: e.target.value })}
                      placeholder="Analisi Generale"
                    />
                  </div>
                  <div className="col-span-3">
                    <Label htmlFor="text-shortcode">Shortcode</Label>
                    <Input
                      id="text-shortcode"
                      value={newTextSection.shortcode}
                      onChange={(e) => setNewTextSection({ ...newTextSection, shortcode: e.target.value })}
                      placeholder="Generato automaticamente"
                    />
                  </div>
                  <div className="col-span-5">
                    <Label htmlFor="text-prompt">Prompt Specifico (opzionale)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="text-prompt"
                        value={newTextSection.prompt}
                        onChange={(e) => setNewTextSection({ ...newTextSection, prompt: e.target.value })}
                        placeholder="Prompt specifico per questa sezione"
                      />
                      <Button type="button" onClick={addTextSection}>
                        Aggiungi
                      </Button>
                    </div>
                  </div>
                </div>

                {template.sections && (
                  <DragDropContext onDragEnd={(result) => handleDragEnd(result, 'text')}>
                    <Droppable droppableId="text-sections">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="border rounded-md divide-y"
                        >
                          {!template.sections?.text?.length ? (
                            <p className="p-4 text-center text-muted-foreground">Nessuna sezione di testo definita</p>
                          ) : (
                            template.sections.text.map((section, index) => (
                              <Draggable key={section.id} draggableId={section.id} index={index}>
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className="grid grid-cols-12 gap-4 p-3 items-center"
                                  >
                                    <div className="col-span-4 font-medium">{section.title}</div>
                                    <div className="col-span-3">
                                      <code className="px-2 py-1 rounded bg-muted text-xs">[{section.shortcode}]</code>
                                    </div>
                                    <div className="col-span-3 truncate text-muted-foreground">
                                      {section.prompt ? section.prompt.substring(0, 30) + '...' : 'Nessun prompt specifico'}
                                    </div>
                                    <div className="col-span-2 flex justify-end gap-1">
                                      <Button
                                        onClick={() => copyShortcode(section.shortcode)}
                                        size="icon"
                                        variant="ghost"
                                      >
                                        <Copy className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        onClick={() => removeTextSection(index)} 
                                        size="icon"
                                        variant="ghost"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))
                          )}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                )}
              </CardContent>
            </Card>

            {/* Grafici */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Grafici
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-12 gap-4 mb-4">
                  <div className="col-span-3">
                    <Label htmlFor="chart-title">Titolo Grafico</Label>
                    <Input
                      id="chart-title"
                      value={newChartSection.title}
                      onChange={(e) => setNewChartSection({ ...newChartSection, title: e.target.value })}
                      placeholder="Panoramica Risultati"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="chart-type">Tipo di Grafico</Label>
                    <select
                      id="chart-type"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={newChartSection.chartType}
                      onChange={(e) => setNewChartSection({ ...newChartSection, chartType: e.target.value })}
                    >
                      <option value="bar">Barre</option>
                      <option value="line">Linea</option>
                      <option value="pie">Torta</option>
                      <option value="radar">Radar</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="chart-shortcode">Shortcode</Label>
                    <Input
                      id="chart-shortcode"
                      value={newChartSection.shortcode}
                      onChange={(e) => setNewChartSection({ ...newChartSection, shortcode: e.target.value })}
                      placeholder="Generato automaticamente"
                    />
                  </div>
                  <div className="col-span-5">
                    <Label htmlFor="chart-prompt">Prompt Specifico (opzionale)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="chart-prompt"
                        value={newChartSection.prompt}
                        onChange={(e) => setNewChartSection({ ...newChartSection, prompt: e.target.value })}
                        placeholder="Prompt specifico per questo grafico"
                      />
                      <Button type="button" onClick={addChartSection}>
                        Aggiungi
                      </Button>
                    </div>
                  </div>
                </div>

                {template.sections && (
                  <DragDropContext onDragEnd={(result) => handleDragEnd(result, 'charts')}>
                    <Droppable droppableId="chart-sections">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="border rounded-md divide-y"
                        >
                          {!template.sections?.charts?.length ? (
                            <p className="p-4 text-center text-muted-foreground">Nessun grafico definito</p>
                          ) : (
                            template.sections.charts.map((section, index) => (
                              <Draggable key={section.id} draggableId={section.id} index={index}>
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className="grid grid-cols-12 gap-4 p-3 items-center"
                                  >
                                    <div className="col-span-3 font-medium">{section.title}</div>
                                    <div className="col-span-2">
                                      <span className="px-2 py-1 rounded bg-muted text-xs">
                                        {section.chartType || 'bar'}
                                      </span>
                                    </div>
                                    <div className="col-span-2">
                                      <code className="px-2 py-1 rounded bg-muted text-xs">[{section.shortcode}]</code>
                                    </div>
                                    <div className="col-span-3 truncate text-muted-foreground">
                                      {section.prompt ? section.prompt.substring(0, 30) + '...' : 'Nessun prompt specifico'}
                                    </div>
                                    <div className="col-span-2 flex justify-end gap-1">
                                      <Button
                                        onClick={() => copyShortcode(section.shortcode)}
                                        size="icon"
                                        variant="ghost"
                                      >
                                        <Copy className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        onClick={() => removeChartSection(index)} 
                                        size="icon"
                                        variant="ghost"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))
                          )}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                )}
              </CardContent>
            </Card>

            {/* Tabelle */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Table className="h-5 w-5 mr-2" />
                  Tabelle
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-12 gap-4 mb-4">
                  <div className="col-span-3">
                    <Label htmlFor="table-title">Titolo Tabella</Label>
                    <Input
                      id="table-title"
                      value={newTableSection.title}
                      onChange={(e) => setNewTableSection({ ...newTableSection, title: e.target.value })}
                      placeholder="Riepilogo Dati"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="table-type">Tipo di Tabella</Label>
                    <select
                      id="table-type"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={newTableSection.tableType}
                      onChange={(e) => setNewTableSection({ ...newTableSection, tableType: e.target.value })}
                    >
                      <option value="simple">Semplice</option>
                      <option value="comparison">Confronto</option>
                      <option value="details">Dettaglio</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="table-shortcode">Shortcode</Label>
                    <Input
                      id="table-shortcode"
                      value={newTableSection.shortcode}
                      onChange={(e) => setNewTableSection({ ...newTableSection, shortcode: e.target.value })}
                      placeholder="Generato automaticamente"
                    />
                  </div>
                  <div className="col-span-5">
                    <Label htmlFor="table-prompt">Prompt Specifico (opzionale)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="table-prompt"
                        value={newTableSection.prompt}
                        onChange={(e) => setNewTableSection({ ...newTableSection, prompt: e.target.value })}
                        placeholder="Prompt specifico per questa tabella"
                      />
                      <Button type="button" onClick={addTableSection}>
                        Aggiungi
                      </Button>
                    </div>
                  </div>
                </div>

                {template.sections && (
                  <DragDropContext onDragEnd={(result) => handleDragEnd(result, 'tables')}>
                    <Droppable droppableId="table-sections">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="border rounded-md divide-y"
                        >
                          {!template.sections?.tables?.length ? (
                            <p className="p-4 text-center text-muted-foreground">Nessuna tabella definita</p>
                          ) : (
                            template.sections.tables.map((section, index) => (
                              <Draggable key={section.id} draggableId={section.id} index={index}>
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className="grid grid-cols-12 gap-4 p-3 items-center"
                                  >
                                    <div className="col-span-3 font-medium">{section.title}</div>
                                    <div className="col-span-2">
                                      <span className="px-2 py-1 rounded bg-muted text-xs">
                                        {section.tableType || 'simple'}
                                      </span>
                                    </div>
                                    <div className="col-span-2">
                                      <code className="px-2 py-1 rounded bg-muted text-xs">[{section.shortcode}]</code>
                                    </div>
                                    <div className="col-span-3 truncate text-muted-foreground">
                                      {section.prompt ? section.prompt.substring(0, 30) + '...' : 'Nessun prompt specifico'}
                                    </div>
                                    <div className="col-span-2 flex justify-end gap-1">
                                      <Button
                                        onClick={() => copyShortcode(section.shortcode)}
                                        size="icon"
                                        variant="ghost"
                                      >
                                        <Copy className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        onClick={() => removeTableSection(index)} 
                                        size="icon"
                                        variant="ghost"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))
                          )}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                )}
              </CardContent>
            </Card>

            {/* Template del Report */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileEdit className="h-5 w-5 mr-2" />
                  Template del Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">
                  Puoi creare un template personalizzato per il report utilizzando gli shortcode definiti sopra.
                  Gli shortcode devono essere racchiusi tra parentesi quadre, ad esempio: [text_intro_123]
                </p>
                <Textarea
                  id="report-template"
                  value={template.reportTemplate || ''}
                  onChange={(e) => setTemplate({ ...template, reportTemplate: e.target.value })}
                  placeholder="# Titolo Report\n\n## Introduzione\n[text_intro]\n\n## Analisi Dati\n[chart_overview]\n\n### Dettagli\n[table_summary]"
                  rows={10}
                  className="font-mono"
                />
                <div className="flex justify-end mt-4">
                  <Button
                    onClick={() => {
                      const newReportTemplate = generateReportTemplate();
                      setTemplate({ ...template, reportTemplate: newReportTemplate });
                      toast({
                        title: 'Template generato',
                        description: 'Un template base è stato generato utilizzando tutte le sezioni definite'
                      });
                    }}
                    variant="outline"
                  >
                    Genera Template Base
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PromptEditor;
