import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Trash2, Edit } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { fetchPlans } from "@/services/plans-mysql";
import { fetchPlanPromptTemplates } from "@/services/prompt-templates-mysql";
import type { Plan } from "@/services/plans-mysql";

interface AIProvider {
  id: string;
  name: string;
  isEnabled: boolean;
  apiKey?: string;
  defaultModel: string;
  models: AIModel[];
  maxTokens: number;
  temperature: number;
}

interface AIModel {
  id: string;
  name: string;
  description?: string;
  maxTokens?: number;
}

const ChatGPTIntegration = () => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [promptCounts, setPromptCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [activeProvider, setActiveProvider] = useState<string>("openai");
  const [showProviderDialog, setShowProviderDialog] = useState(false);
  const [editModelIndex, setEditModelIndex] = useState<number | null>(null);
  const [newProvider, setNewProvider] = useState<Partial<AIProvider>>(() => ({
    name: "",
    isEnabled: true,
    defaultModel: "",
    models: [],
    maxTokens: 2000,
    temperature: 0.7,
  }));
  const [modelDetails, setModelDetails] = useState(() => ({
    id: "",
    name: "",
    description: "",
    maxTokens: 2000,
  }));

  // Elenco dei provider AI disponibili
  const [aiProviders, setAiProviders] = useState<AIProvider[]>([
    {
      id: "openai",
      name: "OpenAI",
      isEnabled: true,
      apiKey: "",
      defaultModel: "gpt-4o",
      models: [
        {
          id: "gpt-4o",
          name: "GPT-4o",
          description: "Modello più potente di OpenAI",
          maxTokens: 128000,
        },
        {
          id: "gpt-4o-mini",
          name: "GPT-4o Mini",
          description: "Versione più leggera di GPT-4o",
          maxTokens: 128000,
        },
        {
          id: "gpt-4.5-preview",
          name: "GPT-4.5 Preview",
          description: "Versione preview di GPT-4.5",
          maxTokens: 128000,
        },
      ],
      maxTokens: 2000,
      temperature: 0.7,
    },
    {
      id: "anthropic",
      name: "Anthropic Claude",
      isEnabled: false,
      apiKey: "",
      defaultModel: "claude-3-opus",
      models: [
        {
          id: "claude-3-opus",
          name: "Claude 3 Opus",
          description: "Il modello più potente di Anthropic",
          maxTokens: 200000,
        },
        {
          id: "claude-3-sonnet",
          name: "Claude 3 Sonnet",
          description: "Modello bilanciato di Anthropic",
          maxTokens: 200000,
        },
        {
          id: "claude-3-haiku",
          name: "Claude 3 Haiku",
          description: "Modello più veloce di Anthropic",
          maxTokens: 200000,
        },
      ],
      maxTokens: 4000,
      temperature: 0.7,
    },
    {
      id: "deepseek",
      name: "Deepseek",
      isEnabled: false,
      apiKey: "",
      defaultModel: "deepseek-chat",
      models: [
        {
          id: "deepseek-chat",
          name: "Deepseek Chat",
          description: "Modello conversazionale di Deepseek",
          maxTokens: 32000,
        },
        {
          id: "deepseek-coder",
          name: "Deepseek Coder",
          description: "Modello per la programmazione",
          maxTokens: 32000,
        },
      ],
      maxTokens: 4000,
      temperature: 0.7,
    },
    {
      id: "perplexity",
      name: "Perplexity AI",
      isEnabled: false,
      apiKey: "",
      defaultModel: "perplexity-online",
      models: [
        {
          id: "perplexity-online",
          name: "Perplexity Online",
          description: "Modello con accesso a internet",
          maxTokens: 4000,
        },
        {
          id: "perplexity-sonar",
          name: "Sonar",
          description: "Modello avanzato di ricerca di Perplexity",
          maxTokens: 4000,
        },
      ],
      maxTokens: 2000,
      temperature: 0.5,
    },
  ]);

  // Stato per le impostazioni di integrazione
  const [integrationSettings, setIntegrationSettings] = useState({
    autoGenerateReport: true,
    allowUserRegeneration: true,
    storeReportHistory: true,
    maxReportsPerUser: 10,
    customizablePrompt: false,
    generatePDF: true,
    defaultProvider: "openai",
  });

  // Carica i piani e il conteggio dei prompt
  const loadPlansAndPrompts = useCallback(async () => {
    try {
      setLoading(true);
      const plansData = await fetchPlans();
      setPlans(plansData);

      // Carica il conteggio dei prompt per ogni piano
      const promptCountsData: Record<string, number> = {};
      for (const plan of plansData) {
        try {
          const templates = await fetchPlanPromptTemplates(plan.id);
          promptCountsData[plan.id] = templates.length;
        } catch (error) {
          console.warn(`Error loading prompts for plan ${plan.id}:`, error);
          promptCountsData[plan.id] = 0;
        }
      }

      setPromptCounts(promptCountsData);
    } catch (error) {
      console.error("Errore nel caricamento dei dati:", error);
      toast({
        title: "Errore",
        description: "Errore nel caricamento dei dati. Riprova più tardi.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPlansAndPrompts();
  }, [loadPlansAndPrompts]);

  const handleSaveProvider = () => {
    setSaving(true);

    // Trova il provider attivo e salva la configurazione
    const updatedProviders = aiProviders.map((provider) =>
      provider.id === activeProvider
        ? {
            ...provider,
            ...aiProviders.find((p) => p.id === activeProvider),
          }
        : provider
    );

    setAiProviders(updatedProviders);

    // Simula salvataggio
    setTimeout(() => {
      setSaving(false);
      toast({
        title: "Configurazione salvata",
        description: `Le impostazioni di ${
          aiProviders.find((p) => p.id === activeProvider)?.name
        } sono state aggiornate con successo.`,
      });
    }, 1000);
  };

  const handleUpdateApiKey = (value: string) => {
    const updatedProviders = aiProviders.map((provider) =>
      provider.id === activeProvider
        ? {
            ...provider,
            apiKey: value,
          }
        : provider
    );
    setAiProviders(updatedProviders);
  };

  const handleUpdateModel = (value: string) => {
    const updatedProviders = aiProviders.map((provider) =>
      provider.id === activeProvider
        ? {
            ...provider,
            defaultModel: value,
          }
        : provider
    );
    setAiProviders(updatedProviders);
  };

  const handleUpdateMaxTokens = (value: number) => {
    const updatedProviders = aiProviders.map((provider) =>
      provider.id === activeProvider
        ? {
            ...provider,
            maxTokens: value,
          }
        : provider
    );
    setAiProviders(updatedProviders);
  };

  const handleUpdateTemperature = (value: number) => {
    const updatedProviders = aiProviders.map((provider) =>
      provider.id === activeProvider
        ? {
            ...provider,
            temperature: value,
          }
        : provider
    );
    setAiProviders(updatedProviders);
  };

  const handleToggleProvider = (providerId: string, enabled: boolean) => {
    const updatedProviders = aiProviders.map((provider) =>
      provider.id === providerId
        ? {
            ...provider,
            isEnabled: enabled,
          }
        : provider
    );
    setAiProviders(updatedProviders);

    if (activeProvider === providerId && !enabled) {
      // Se il provider attivo è stato disabilitato, passa al primo provider abilitato
      const enabledProvider = updatedProviders.find((p) => p.isEnabled);
      if (enabledProvider) {
        setActiveProvider(enabledProvider.id);
      }
    }
  };

  const handleSaveIntegrationSettings = () => {
    setSaving(true);

    // Simula salvataggio
    setTimeout(() => {
      setSaving(false);
      toast({
        title: "Impostazioni salvate",
        description:
          "Le impostazioni di integrazione sono state aggiornate con successo.",
      });
    }, 1000);
  };

  const handleTestConnection = () => {
    const currentProvider = aiProviders.find((p) => p.id === activeProvider);

    if (!currentProvider?.apiKey) {
      toast({
        title: "Errore",
        description: `Inserisci una API key valida per ${currentProvider?.name} per testare la connessione.`,
        variant: "destructive",
      });
      return;
    }

    // Simula test connessione
    toast({
      title: "Test in corso...",
      description: `Stiamo verificando la connessione con ${currentProvider?.name}...`,
    });

    setTimeout(() => {
      toast({
        title: "Connessione riuscita",
        description: `La connessione con ${currentProvider?.name} è stata stabilita con successo.`,
      });
    }, 2000);
  };

  const handleAddProvider = () => {
    if (!newProvider.name || !newProvider.id) {
      toast({
        title: "Errore",
        description: "Il nome e l'ID del provider sono obbligatori.",
        variant: "destructive",
      });
      return;
    }

    if (aiProviders.some((p) => p.id === newProvider.id)) {
      toast({
        title: "Errore",
        description: "Esiste già un provider con questo ID.",
        variant: "destructive",
      });
      return;
    }

    setAiProviders([
      ...aiProviders,
      {
        id: newProvider.id as string,
        name: newProvider.name as string,
        isEnabled: newProvider.isEnabled ?? true,
        apiKey: "",
        defaultModel: newProvider.defaultModel || "",
        models: newProvider.models || [],
        maxTokens: newProvider.maxTokens || 2000,
        temperature: newProvider.temperature || 0.7,
      },
    ]);

    setShowProviderDialog(false);
    setNewProvider({
      name: "",
      isEnabled: true,
      defaultModel: "",
      models: [],
      maxTokens: 2000,
      temperature: 0.7,
    });

    toast({
      title: "Provider aggiunto",
      description: `Il provider ${newProvider.name} è stato aggiunto con successo.`,
    });
  };

  const handleAddModelToNewProvider = () => {
    if (!modelDetails.id || !modelDetails.name) {
      toast({
        title: "Errore",
        description: "ID e nome del modello sono obbligatori.",
        variant: "destructive",
      });
      return;
    }

    const newModel = {
      id: modelDetails.id,
      name: modelDetails.name,
      description: modelDetails.description,
      maxTokens: modelDetails.maxTokens,
    };

    if (editModelIndex !== null) {
      // Modifica di un modello esistente
      const updatedModels = [...(newProvider.models || [])];
      updatedModels[editModelIndex] = newModel;
      setNewProvider({
        ...newProvider,
        models: updatedModels,
      });
    } else {
      // Aggiunta di un nuovo modello
      setNewProvider({
        ...newProvider,
        models: [...(newProvider.models || []), newModel],
      });
    }

    // Reset del form
    setModelDetails({
      id: "",
      name: "",
      description: "",
      maxTokens: 2000,
    });

    setEditModelIndex(null);
  };

  const handleEditModel = (index: number) => {
    if (newProvider.models && newProvider.models[index]) {
      const model = newProvider.models[index];
      setModelDetails({
        id: model.id,
        name: model.name,
        description: model.description || "",
        maxTokens: model.maxTokens || 2000,
      });
      setEditModelIndex(index);
    }
  };

  const handleRemoveModel = (index: number) => {
    if (newProvider.models) {
      const updatedModels = [...newProvider.models];
      updatedModels.splice(index, 1);
      setNewProvider({
        ...newProvider,
        models: updatedModels,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Integrazione AI</h1>
        <p className="text-muted-foreground mt-2">
          Configura l'integrazione con vari provider di AI per generare report
          automatici
        </p>
      </div>

      <Tabs defaultValue="providers" className="space-y-4">
        <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-1 md:grid-cols-3">
          <TabsTrigger value="providers">Provider AI</TabsTrigger>
          <TabsTrigger value="settings">Impostazioni</TabsTrigger>
          <TabsTrigger value="plan-prompts">Prompt per Piani</TabsTrigger>
        </TabsList>

        <TabsContent value="providers">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Provider AI</CardTitle>
                  <CardDescription>
                    Gestisci i provider per l'integrazione AI
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex flex-col gap-2">
                    {aiProviders.map((provider) => (
                      <div
                        key={provider.id}
                        className={`flex items-center justify-between rounded-lg border p-3 hover:bg-accent cursor-pointer ${
                          activeProvider === provider.id ? "bg-accent" : ""
                        }`}
                        onClick={() => setActiveProvider(provider.id)}
                      >
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={provider.isEnabled}
                            onCheckedChange={(checked) =>
                              handleToggleProvider(provider.id, checked)
                            }
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Abilita ${provider.name}`}
                          />
                          <span
                            className={
                              provider.isEnabled
                                ? "font-medium"
                                : "text-muted-foreground"
                            }
                          >
                            {provider.name}
                          </span>
                        </div>

                        {provider.isEnabled && (
                          <div
                            className="h-2 w-2 rounded-full bg-green-500"
                            aria-label="Provider attivo"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowProviderDialog(true)}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Aggiungi Provider
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <div className="col-span-1 lg:col-span-3">
              {(() => {
                const currentProvider = aiProviders.find(
                  (provider) => provider.id === activeProvider
                );
                if (!currentProvider) return null;

                return (
                  <Card key={`config-${currentProvider.id}`}>
                    <CardHeader>
                      <CardTitle>
                        Configurazione {currentProvider.name}
                      </CardTitle>
                      <CardDescription>
                        Configura i parametri per l'integrazione con{" "}
                        {currentProvider.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor={`enable-${currentProvider.id}`}>
                            Abilita {currentProvider.name}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Attiva l'integrazione con l'API di{" "}
                            {currentProvider.name}
                          </p>
                        </div>
                        <Switch
                          id={`enable-${currentProvider.id}`}
                          checked={currentProvider.isEnabled}
                          onCheckedChange={(checked) =>
                            handleToggleProvider(currentProvider.id, checked)
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`api-key-${currentProvider.id}`}>
                          API Key
                        </Label>
                        <Input
                          id={`api-key-${currentProvider.id}`}
                          type="password"
                          value={currentProvider.apiKey || ""}
                          onChange={(e) => handleUpdateApiKey(e.target.value)}
                          placeholder={`Inserisci la tua ${currentProvider.name} API Key`}
                          className="font-mono"
                        />
                        <p className="text-sm text-muted-foreground">
                          La tua chiave API di {currentProvider.name}. Sarà
                          salvata in modo sicuro.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`model-${currentProvider.id}`}>
                          Modello
                        </Label>
                        <Select
                          value={currentProvider.defaultModel}
                          onValueChange={(value) => handleUpdateModel(value)}
                        >
                          <SelectTrigger id={`model-${currentProvider.id}`}>
                            <SelectValue placeholder="Seleziona un modello" />
                          </SelectTrigger>
                          <SelectContent>
                            {currentProvider.models.map((model) => (
                              <SelectItem
                                key={`${currentProvider.id}-${model.id}`}
                                value={model.id}
                              >
                                {model.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                          Il modello di {currentProvider.name} da utilizzare per
                          generare i report.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor={`max-tokens-${currentProvider.id}`}>
                            Lunghezza Massima (token)
                          </Label>
                          <Input
                            id={`max-tokens-${currentProvider.id}`}
                            type="number"
                            value={currentProvider.maxTokens}
                            onChange={(e) =>
                              handleUpdateMaxTokens(
                                parseInt(e.target.value) || 0
                              )
                            }
                          />
                          <p className="text-sm text-muted-foreground">
                            Limita la lunghezza massima del output generato
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`temperature-${currentProvider.id}`}>
                            Temperatura
                          </Label>
                          <Input
                            id={`temperature-${currentProvider.id}`}
                            type="number"
                            min="0"
                            max="1"
                            step="0.1"
                            value={currentProvider.temperature}
                            onChange={(e) =>
                              handleUpdateTemperature(
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                          <p className="text-sm text-muted-foreground">
                            Controlla la casualità dell'output (0 =
                            deterministico, 1 = creativo)
                          </p>
                        </div>
                      </div>

                      <Button
                        className="mt-4"
                        variant="outline"
                        onClick={handleTestConnection}
                      >
                        Testa connessione
                      </Button>
                    </CardContent>
                    <CardFooter>
                      <Button onClick={handleSaveProvider} disabled={saving}>
                        {saving ? "Salvando..." : "Salva Configurazione"}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })()}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Impostazioni Integrazione</CardTitle>
              <CardDescription>
                Configura le impostazioni per l'integrazione di AI nel sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="default-provider">
                  Provider AI Predefinito
                </Label>
                <Select
                  value={integrationSettings.defaultProvider}
                  onValueChange={(value) =>
                    setIntegrationSettings({
                      ...integrationSettings,
                      defaultProvider: value,
                    })
                  }
                >
                  <SelectTrigger id="default-provider">
                    <SelectValue placeholder="Seleziona un provider predefinito" />
                  </SelectTrigger>
                  <SelectContent>
                    {aiProviders
                      .filter((provider) => provider.isEnabled)
                      .map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Il provider AI da utilizzare come predefinito quando non
                  specificato altrimenti
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-generate">
                    Generazione Automatica Report
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Genera automaticamente un report quando un questionario
                    viene completato
                  </p>
                </div>
                <Switch
                  id="auto-generate"
                  checked={integrationSettings.autoGenerateReport}
                  onCheckedChange={(checked) =>
                    setIntegrationSettings({
                      ...integrationSettings,
                      autoGenerateReport: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allow-regeneration">
                    Rigenerazione Report
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Permetti agli utenti di rigenerare i loro report
                  </p>
                </div>
                <Switch
                  id="allow-regeneration"
                  checked={integrationSettings.allowUserRegeneration}
                  onCheckedChange={(checked) =>
                    setIntegrationSettings({
                      ...integrationSettings,
                      allowUserRegeneration: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="store-history">
                    Memorizza Storico Report
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Mantieni lo storico dei report generati per ogni utente
                  </p>
                </div>
                <Switch
                  id="store-history"
                  checked={integrationSettings.storeReportHistory}
                  onCheckedChange={(checked) =>
                    setIntegrationSettings({
                      ...integrationSettings,
                      storeReportHistory: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="generate-pdf">Genera PDF</Label>
                  <p className="text-sm text-muted-foreground">
                    Genera automaticamente un PDF del report
                  </p>
                </div>
                <Switch
                  id="generate-pdf"
                  checked={integrationSettings.generatePDF}
                  onCheckedChange={(checked) =>
                    setIntegrationSettings({
                      ...integrationSettings,
                      generatePDF: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="customizable-prompt">
                    Prompt Personalizzabile
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Permetti agli utenti di personalizzare il prompt per il loro
                    report
                  </p>
                </div>
                <Switch
                  id="customizable-prompt"
                  checked={integrationSettings.customizablePrompt}
                  onCheckedChange={(checked) =>
                    setIntegrationSettings({
                      ...integrationSettings,
                      customizablePrompt: checked,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-reports">
                  Numero Massimo di Report per Utente
                </Label>
                <Input
                  id="max-reports"
                  type="number"
                  value={integrationSettings.maxReportsPerUser}
                  onChange={(e) =>
                    setIntegrationSettings({
                      ...integrationSettings,
                      maxReportsPerUser: parseInt(e.target.value),
                    })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Limita il numero di report che un utente può generare
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveIntegrationSettings} disabled={saving}>
                {saving ? "Salvando..." : "Salva Impostazioni"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="plan-prompts">
          <Card>
            <CardHeader>
              <CardTitle>Prompt per Piani</CardTitle>
              <CardDescription>
                Gestisci i prompt personalizzati per ogni piano di abbonamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {Array.isArray(plans) &&
                    plans.map((plan) => (
                      <div
                        key={`plan-${plan.id}`}
                        className="border rounded-lg p-4 hover:border-primary transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-medium">{plan.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {promptCounts[plan.id] || 0} prompt configurati
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            className="bg-[var(--color-primary)] text-white"
                            asChild
                          >
                            <Link to={`/admin/plans/${plan.id}/prompts`}>
                              Gestisci Prompt
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}

                  {(!Array.isArray(plans) || plans.length === 0) && (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">
                        Nessun piano di abbonamento disponibile
                      </p>
                      <Button variant="outline" className="mt-4" asChild>
                        <Link to="/admin/plans">Crea un nuovo piano</Link>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Short Code</CardTitle>
          <CardDescription>
            Usa questo short code per includere il sistema di report AI nelle
            pagine
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 p-4 rounded-md font-mono text-sm overflow-x-auto">
            [simoly_ai_report questionnaire_id="QUESTIONARIO_ID"
            prompt_id="PROMPT_ID" provider="PROVIDER_ID"]
          </div>
          <p className="text-sm text-muted-foreground mt-2 max-w-3xl">
            Inserisci questo short code nella pagina dove vuoi mostrare il
            report generato dall'AI. Sostituisci QUESTIONARIO_ID con l'ID del
            questionario che desideri analizzare, opzionalmente PROMPT_ID con
            l'ID del template di prompt da utilizzare e PROVIDER_ID con l'ID del
            provider AI da usare.
          </p>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-6">
            <p className="text-sm text-yellow-700">
              <strong>Nota:</strong> Per configurare in dettaglio i template di
              prompt e i report, utilizza la sezione "Gestisci Prompt" per
              ciascun piano. Lì potrai creare prompt specifici per ogni
              questionario e sequenza, oltre che definire i template dei report
              con gli shortcode personalizzati.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Dialog per aggiungere un nuovo provider */}
      <Dialog open={showProviderDialog} onOpenChange={setShowProviderDialog}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Aggiungi nuovo provider AI</DialogTitle>
            <DialogDescription>
              Inserisci i dettagli per configurare un nuovo provider AI.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="provider-name">Nome Provider</Label>
                <Input
                  id="provider-name"
                  value={newProvider.name || ""}
                  onChange={(e) =>
                    setNewProvider({ ...newProvider, name: e.target.value })
                  }
                  placeholder="es. Mistral AI"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="provider-id">ID Provider</Label>
                <Input
                  id="provider-id"
                  value={newProvider.id || ""}
                  onChange={(e) =>
                    setNewProvider({ ...newProvider, id: e.target.value })
                  }
                  placeholder="es. mistral"
                />
                <p className="text-xs text-muted-foreground">
                  ID univoco senza spazi
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <Label>Modelli Disponibili</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setModelDetails({
                      id: "",
                      name: "",
                      description: "",
                      maxTokens: 2000,
                    });
                    setEditModelIndex(null);
                  }}
                >
                  <PlusCircle className="h-4 w-4 mr-1" /> Aggiungi Modello
                </Button>
              </div>

              <div className="border rounded-md p-3">
                {newProvider.models && newProvider.models.length > 0 ? (
                  <div className="space-y-2">
                    {newProvider.models &&
                      newProvider.models.map((model, index) => (
                        <div
                          key={`new-model-${index}-${model.id}`}
                          className="flex items-center justify-between p-2 rounded-md bg-accent/30"
                        >
                          <div>
                            <p className="font-medium">{model.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {model.id} · {model.maxTokens || 2000} token
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditModel(index)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveModel(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    Nessun modello configurato
                  </div>
                )}

                {/* Form per aggiungere/modificare un modello */}
                <div className="mt-4 border-t pt-4">
                  <p className="text-sm font-medium mb-3">
                    {editModelIndex !== null
                      ? "Modifica Modello"
                      : "Aggiungi Nuovo Modello"}
                  </p>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="space-y-1">
                      <Label htmlFor="model-id" className="text-xs">
                        ID Modello
                      </Label>
                      <Input
                        id="model-id"
                        value={modelDetails.id}
                        onChange={(e) =>
                          setModelDetails({
                            ...modelDetails,
                            id: e.target.value,
                          })
                        }
                        placeholder="es. mistral-large"
                        size={1}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="model-name" className="text-xs">
                        Nome Modello
                      </Label>
                      <Input
                        id="model-name"
                        value={modelDetails.name}
                        onChange={(e) =>
                          setModelDetails({
                            ...modelDetails,
                            name: e.target.value,
                          })
                        }
                        placeholder="es. Mistral Large"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="space-y-1">
                      <Label htmlFor="model-max-tokens" className="text-xs">
                        Max Token
                      </Label>
                      <Input
                        id="model-max-tokens"
                        type="number"
                        value={modelDetails.maxTokens}
                        onChange={(e) =>
                          setModelDetails({
                            ...modelDetails,
                            maxTokens: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="model-description" className="text-xs">
                        Descrizione
                      </Label>
                      <Input
                        id="model-description"
                        value={modelDetails.description}
                        onChange={(e) =>
                          setModelDetails({
                            ...modelDetails,
                            description: e.target.value,
                          })
                        }
                        placeholder="es. Modello linguistico avanzato di Mistral"
                      />
                    </div>
                  </div>

                  <Button
                    size="sm"
                    className="w-full mt-2"
                    onClick={handleAddModelToNewProvider}
                  >
                    {editModelIndex !== null
                      ? "Aggiorna Modello"
                      : "Aggiungi Modello"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowProviderDialog(false)}
            >
              Annulla
            </Button>
            <Button onClick={handleAddProvider}>Aggiungi Provider</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatGPTIntegration;
