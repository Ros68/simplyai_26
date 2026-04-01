import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Question, QuestionnaireConfig, fetchQuestionnaireConfig, saveQuestionnaireConfig, updateQuestionnaireConfig } from '@/services/questionnaire-config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';
import { Save, Edit, Plus, Download, Users, Settings } from 'lucide-react';

const defaultConfig: Omit<QuestionnaireConfig, 'id' | 'created_at' | 'updated_at'> = {
  title: 'Questionario SimolyAI',
  description: 'Un questionario per analizzare la tua situazione attuale',
  instructions: 'Rispondi onestamente a tutte le domande per un risultato accurato',
  questions: [],
  version: 1,
  status: 'draft',
};

const QuestionnaireManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('editor');
  const [config, setConfig] = useState<QuestionnaireConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQuestionnaireConfig = async () => {
      try {
        const existingConfig = await fetchQuestionnaireConfig();
        
        if (existingConfig) {
          setConfig(existingConfig);
        }
      } catch (error) {
        console.error('Error loading questionnaire config:', error);
        toast({
          title: 'Errore',
          description: 'Impossibile caricare la configurazione del questionario',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadQuestionnaireConfig();
  }, [toast]);

  const handleSave = async () => {
    try {
      let result;
      
      if (config && config.id) {
        // Update existing config
        const { id, created_at, updated_at, ...configData } = config;
        result = await updateQuestionnaireConfig(id, configData);
      } else {
        // Create new config
        result = await saveQuestionnaireConfig(config ? {
          title: config.title,
          description: config.description,
          instructions: config.instructions,
          questions: config.questions,
          version: config.version,
          status: config.status,
        } : defaultConfig);
      }
      
      if (result) {
        setConfig(result);
        toast({
          title: 'Salvato',
          description: 'Configurazione del questionario salvata con successo',
        });
      }
    } catch (error) {
      console.error('Error saving questionnaire config:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile salvare la configurazione del questionario',
        variant: 'destructive',
      });
    }
  };

  const handlePublish = async () => {
    if (!config) return;
    
    try {
      const { id, ...configData } = config;
      const result = await updateQuestionnaireConfig(id, {
        ...configData,
        status: 'published',
      });
      
      if (result) {
        setConfig(result);
        toast({
          title: 'Pubblicato',
          description: 'Il questionario è stato pubblicato con successo',
        });
      }
    } catch (error) {
      console.error('Error publishing questionnaire:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile pubblicare il questionario',
        variant: 'destructive',
      });
    }
  };

  const handleAddQuestion = () => {
    if (!config) return;
    
    const newQuestion: Question = {
      id: `q${Date.now()}`,
      text: 'Nuova domanda',
      type: 'text',
      required: false,
    };
    
    setConfig({
      ...config,
      questions: [...config.questions, newQuestion],
    });
  };

  if (loading) {
    return <div className="flex justify-center p-10">Caricamento...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold mb-6">Gestione Questionario</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-3 md:grid-cols-4">
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="preview">Anteprima</TabsTrigger>
          <TabsTrigger value="settings">Impostazioni</TabsTrigger>
          <TabsTrigger value="ai">AI & Report</TabsTrigger>
        </TabsList>
        
        <TabsContent value="editor" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Editor Questionario</CardTitle>
                <CardDescription>
                  Crea e modifica le domande del questionario
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={handleSave}
                >
                  <Save className="mr-2 h-4 w-4" /> Salva
                </Button>
                <Button
                  className="bg-simoly-purple hover:bg-simoly-purple-dark"
                  onClick={handlePublish}
                  disabled={!config || config.questions.length === 0}
                >
                  Pubblica
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Informazioni Generali</h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Titolo</label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded-md"
                        value={config?.title || defaultConfig.title}
                        onChange={(e) => setConfig(prev => prev ? { ...prev, title: e.target.value } : null)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Descrizione</label>
                      <textarea
                        className="w-full p-2 border rounded-md h-20"
                        value={config?.description || defaultConfig.description}
                        onChange={(e) => setConfig(prev => prev ? { ...prev, description: e.target.value } : null)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Istruzioni</label>
                      <textarea
                        className="w-full p-2 border rounded-md h-20"
                        value={config?.instructions || defaultConfig.instructions}
                        onChange={(e) => setConfig(prev => prev ? { ...prev, instructions: e.target.value } : null)}
                      />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Domande ({config?.questions.length || 0})</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddQuestion}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Aggiungi Domanda
                    </Button>
                  </div>
                  
                  {config && config.questions.length > 0 ? (
                    <div className="space-y-4">
                      {config.questions.map((question, index) => (
                        <Card key={question.id} className="border-2 border-simoly-gray-light">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-base">Domanda {index + 1}</CardTitle>
                              <div className="flex space-x-1">
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="font-medium">{question.text}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              Tipo: {question.type} | {question.required ? 'Obbligatoria' : 'Opzionale'}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg">
                      <h3 className="text-lg font-medium mb-2">Nessuna domanda</h3>
                      <p className="text-muted-foreground mb-4">
                        Aggiungi la prima domanda al tuo questionario
                      </p>
                      <Button onClick={handleAddQuestion}>
                        <Plus className="mr-2 h-4 w-4" /> Aggiungi Domanda
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-end space-x-2 pt-6">
              <Button
                variant="outline"
                onClick={handleSave}
              >
                <Save className="mr-2 h-4 w-4" /> Salva Bozza
              </Button>
              
              <Button
                className="bg-simoly-purple hover:bg-simoly-purple-dark"
                onClick={handlePublish}
                disabled={!config || config.questions.length === 0}
              >
                Pubblica Questionario
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="preview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Anteprima Questionario</CardTitle>
              <CardDescription>
                Visualizza l'anteprima del questionario come lo vedranno gli utenti
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-6 border rounded-lg">
                <h2 className="text-2xl font-bold mb-4 text-center">{config?.title || defaultConfig.title}</h2>
                <p className="text-center mb-6">{config?.description || defaultConfig.description}</p>
                
                <div className="bg-simoly-accent-purple p-4 rounded-lg mb-8">
                  <p className="italic">{config?.instructions || defaultConfig.instructions}</p>
                </div>
                
                {config && config.questions.length > 0 ? (
                  <div className="space-y-8">
                    {config.questions.map((question, index) => (
                      <div key={question.id} className="border p-4 rounded-lg">
                        <h3 className="font-medium mb-2">
                          {index + 1}. {question.text}
                          {question.required && <span className="text-red-500 ml-1">*</span>}
                        </h3>
                        
                        <div className="mt-4">
                          {question.type === 'text' && (
                            <textarea
                              className="w-full p-2 border rounded-md"
                              disabled
                              placeholder="Gli utenti inseriranno la loro risposta qui"
                            />
                          )}
                          
                          {question.type === 'single' && question.options && (
                            <div className="space-y-2">
                              {question.options.map(opt => (
                                <div key={opt.id} className="p-2 border rounded-md">
                                  {opt.text}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {question.type === 'multiple' && question.options && (
                            <div className="space-y-2">
                              {question.options.map(opt => (
                                <div key={opt.id} className="p-2 border rounded-md">
                                  {opt.text}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {question.type === 'scale' && (
                            <div className="flex justify-between space-x-2">
                              {Array.from({ length: 5 }).map((_, idx) => (
                                <div key={idx} className="p-2 border rounded-md text-center flex-1">
                                  {idx + 1}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p>Nessuna domanda da visualizzare in anteprima</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Impostazioni</CardTitle>
              <CardDescription>
                Configura le impostazioni del questionario
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Implementa impostazioni del questionario qui */}
              <p>Funzionalità in sviluppo</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="ai" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>AI & Report</CardTitle>
              <CardDescription>
                Configura l'integrazione con l'AI e il formato del report
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Implementa configurazione AI qui */}
              <p>Funzionalità in sviluppo</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QuestionnaireManager;
