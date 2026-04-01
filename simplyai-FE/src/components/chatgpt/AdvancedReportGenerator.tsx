
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { generateReport, getReportById } from '@/services/ai-report';
import { findBestPromptTemplate } from '@/services/ai-report';
import ShortcodeProcessor, { ShortcodeMap } from '@/components/report-components/ShortcodeProcessor';
import { fetchQuestionnaireById } from '@/services/questionnaire';
import { useAuth } from '@/hooks/useAuth';
import { PromptTemplate } from '@/types/supabase';
import { AlertTriangle, FileText, BarChart, RefreshCcw } from 'lucide-react';

const AdvancedReportGenerator = () => {
  const { responseId } = useParams<{ responseId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [questionnaireResponse, setQuestionnaireResponse] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [promptTemplate, setPromptTemplate] = useState<PromptTemplate | null>(null);
  
  useEffect(() => {
    const loadData = async () => {
      if (!responseId || !user) return;
      
      try {
        setLoading(true);
        
        // Carica il questionario compilato
        const response = await fetchQuestionnaireById(responseId);
        if (response) {
          setQuestionnaireResponse(response);
        }
        
        // Cerca il miglior template di prompt
        const template = await findBestPromptTemplate(user.id, responseId);
        if (template) {
          setPromptTemplate(template);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };
    
    loadData();
  }, [responseId, user]);
  
  // Funzione per generare il report
  const handleGenerateReport = async () => {
    if (!responseId || !user) return;
    
    try {
      setGenerating(true);
      
      const result = await generateReport({
        questionnaireResponseId: responseId,
        userId: user.id,
        promptTemplateId: promptTemplate?.id
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Si è verificato un errore durante la generazione del report.');
      }
      
      setReport(result.report);
      
      toast({
        title: 'Report generato',
        description: 'Il report è stato generato con successo.',
      });
      
      setGenerating(false);
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Errore',
        description: error.message || 'Si è verificato un errore durante la generazione del report.',
        variant: 'destructive'
      });
      
      setGenerating(false);
    }
  };
  
  // Preparazione della mappa degli shortcode
  const prepareShortcodeMap = (): ShortcodeMap => {
    if (!report || !report.content) return { text: {}, charts: {}, tables: {} };
    
    return {
      text: report.content.textSections || {},
      charts: report.content.chartSections || {},
      tables: report.content.tableSections || {}
    };
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!questionnaireResponse) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Questionario non trovato</h2>
          <p className="mb-4">Il questionario richiesto non è stato trovato o non è accessibile.</p>
          <Button onClick={() => navigate('/dashboard')}>
            Torna alla Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {!report ? (
        <Card>
          <CardHeader>
            <CardTitle>Genera Report AI</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Questionario</h3>
              <p>{questionnaireResponse.questionnaire_id ? questionnaireResponse.questionnaire_config?.title : 'Questionario senza titolo'}</p>
              <p className="text-sm text-muted-foreground">
                Completato il: {new Date(questionnaireResponse.completed_at || questionnaireResponse.updated_at).toLocaleString('it-IT')}
              </p>
            </div>
            
            {promptTemplate && (
              <div>
                <h3 className="font-semibold mb-2">Template Selezionato</h3>
                <p>{promptTemplate.title}</p>
                <p className="text-sm text-muted-foreground">
                  Questo template è stato selezionato automaticamente in base al tuo piano di abbonamento.
                </p>
              </div>
            )}
            
            <Button 
              onClick={handleGenerateReport} 
              className="w-full"
              disabled={generating}
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generazione in corso...
                </>
              ) : (
                <>Genera Report con AI</>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{report.title || "Report di Analisi"}</CardTitle>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/dashboard')}
                >
                  Torna alla Dashboard
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setReport(null)}
                >
                  <RefreshCcw className="h-4 w-4 mr-1" />
                  Rigenera
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="report">
                <TabsList className="mb-4">
                  <TabsTrigger value="report">
                    <FileText className="h-4 w-4 mr-2" />
                    Report
                  </TabsTrigger>
                  <TabsTrigger value="charts">
                    <BarChart className="h-4 w-4 mr-2" />
                    Grafici e Tabelle
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="report" className="space-y-6">
                  {report.content && report.content.textSections ? (
                    Object.entries(report.content.textSections).map(([key, content]) => (
                      <div key={key}>
                        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content.toString().replace(/\n/g, '<br />') }} />
                        <Separator className="my-6" />
                      </div>
                    ))
                  ) : report.content && report.content.sections ? (
                    report.content.sections.map((section, index) => (
                      section.type === 'text' && (
                        <div key={index}>
                          <h2 className="text-xl font-bold mb-3">{section.title}</h2>
                          <div dangerouslySetInnerHTML={{ __html: section.content }} />
                          <Separator className="my-6" />
                        </div>
                      )
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">Nessun contenuto testuale disponibile nel report.</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="charts" className="space-y-6">
                  {report.content && (report.content.chartSections || report.content.tableSections) ? (
                    <ShortcodeProcessor 
                      content="[CHARTS][TABLES]" 
                      shortcodeMap={prepareShortcodeMap()} 
                    />
                  ) : report.content && report.content.sections ? (
                    report.content.sections.map((section, index) => (
                      (section.type === 'bar-chart' || section.type === 'pie-chart') && (
                        <div key={index} className="card bg-white p-6 rounded-lg shadow-sm">
                          <h3 className="text-xl font-bold mb-3">{section.title}</h3>
                          <p>{section.content}</p>
                          <div className="mt-4 h-80 bg-gray-100 flex items-center justify-center">
                            <p>[{section.type.toUpperCase()}]</p>
                          </div>
                        </div>
                      )
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">Nessun grafico o tabella disponibile nel report.</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              className="mr-2"
              onClick={() => window.print()}
            >
              Stampa Report
            </Button>
            <Button 
              onClick={() => navigate(`/report/${report.id}`)}
            >
              Visualizza Report Completo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedReportGenerator;
