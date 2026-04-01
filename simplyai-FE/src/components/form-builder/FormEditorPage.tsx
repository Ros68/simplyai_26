
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FormData, FormField } from '@/types/form-builder';
import FormEditor from './FormEditor';
import FormSidebar from './FormSidebar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Eye, Plus, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FormPreview from './components/FormPreview';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const FormEditorPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("edit");
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importText, setImportText] = useState('');

  useEffect(() => {
    if (id) {
      const fetchForm = async () => {
        try {
          console.log('Caricamento form con ID:', id);
          setFormData({
            id: id,
            title: 'Form di test',
            description: 'Descrizione del form di test',
            pages: [
              {
                id: 'page-1',
                title: 'Prima pagina',
                fields: [],
                order: 0
              }
            ],
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        } catch (error) {
          console.error('Errore nel caricamento del form:', error);
          toast({
            title: "Errore",
            description: "Impossibile caricare il form richiesto",
            variant: "destructive"
          });
        }
      };

      fetchForm();
    } else {
      setFormData({
        id: `form-${Date.now()}`,
        title: 'Nuovo Form',
        description: 'Descrizione del form',
        pages: [
          {
            id: `page-${Date.now()}`,
            title: 'Pagina 1',
            fields: [],
            order: 0
          }
        ],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  }, [id, toast]);

  const handleBack = () => {
    navigate('/admin/form-builder');
  };

  const handleFormDataChange = (data: FormData) => {
    setFormData(data);
  };

  const handleAddField = (type: string) => {
    if (!formData) return;
    
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type,
      label: `Nuova domanda (${type})`,
      required: false,
      pageIndex: 0,
      options: ['radio', 'checkbox', 'select', 'multi-select', 'image-picker'].includes(type) ? [
        { label: 'Opzione 1', value: 'option1', score: 0 },
        { label: 'Opzione 2', value: 'option2', score: 0 }
      ] : undefined,
      placeholder: 'Inserisci la tua risposta',
      order: formData.pages[0].fields.length,
      conditionalLogic: {
        enabled: false,
        rules: [],
        operator: 'and'
      }
    };
    
    const updatedPages = [...formData.pages];
    updatedPages[0] = {
      ...updatedPages[0],
      fields: [...updatedPages[0].fields, newField]
    };
    
    setFormData({
      ...formData,
      pages: updatedPages,
    });
    
    toast({
      title: "Domanda aggiunta",
      description: `È stata aggiunta una nuova domanda di tipo "${type}"`
    });
  };

  const handleSave = async () => {
    if (!formData) return;
    
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Form salvato",
        description: "Il questionario è stato salvato con successo"
      });
      
      navigate('/admin/form-builder');
    } catch (error) {
      console.error("Errore durante il salvataggio:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il salvataggio del questionario",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    
    const fieldType = e.dataTransfer.getData('fieldType');
    if (fieldType) {
      handleAddField(fieldType);
      
      toast({
        title: "Domanda aggiunta",
        description: `È stata aggiunta una nuova domanda di tipo "${fieldType}" tramite drag and drop`
      });
    }
  };

  const handleAddNewQuestion = () => {
    handleAddField('text'); // Default to text field type
    
    toast({
      title: "Domanda aggiunta",
      description: "È stata aggiunta una nuova domanda di testo"
    });
  };

  const handleImportSubmit = () => {
    if (!formData) return;
    
    try {
      // Parse il formato specificato nel requisito
      const lines = importText.trim().split('---').map(l => l.trim());
      const importedFields: FormField[] = [];
      
      lines.forEach((line, lineIndex) => {
        if (!line) return;
        
        const parts = line.split('|');
        const questionId = parts[0].trim();
        
        const typeMatch = parts.find(p => p.startsWith('type='))?.split('=')[1];
        const questionMatch = parts.find(p => p.startsWith('question='))?.split('=')[1];
        const optionsMatch = parts.find(p => p.startsWith('options='))?.split('=')[1];
        const conditionMatch = parts.find(p => p.startsWith('condition='))?.split('=')[1];
        const scoreMatch = parts.find(p => p.startsWith('score='))?.split('=')[1];
        
        if (!typeMatch || !questionMatch) return;
        
        let options: FormField['options'] = [];
        
        if (optionsMatch && optionsMatch !== '[]') {
          // Estrae le opzioni dal formato [Opzione1:1|Opzione2:2]
          const optionsText = optionsMatch.replace(/^\[|\]$/g, '');
          options = optionsText.split('|').map(opt => {
            const [label, scoreStr] = opt.split(':');
            return {
              label,
              value: label.toLowerCase().replace(/\s+/g, '_'),
              score: parseInt(scoreStr) || 0
            };
          });
        }
        
        const newField: FormField = {
          id: `imported-${questionId}-${Date.now()}`,
          type: typeMatch,
          label: questionMatch,
          required: true,
          pageIndex: 0,
          order: lineIndex,
          options: ['radio', 'checkbox', 'select', 'multi-select', 'image-picker'].includes(typeMatch) ? options : undefined,
          conditionalLogic: {
            enabled: conditionMatch && conditionMatch !== 'null',
            rules: [],
            operator: 'and'
          }
        };
        
        importedFields.push(newField);
      });
      
      if (importedFields.length > 0) {
        // Crea una nuova pagina con i campi importati
        const newPage = {
          id: `page-${Date.now()}`,
          title: 'Pagina Importata',
          fields: importedFields,
          order: formData.pages.length
        };
        
        setFormData({
          ...formData,
          pages: [...formData.pages, newPage]
        });
        
        setImportDialogOpen(false);
        toast({
          title: "Form importato",
          description: `Importati ${importedFields.length} domande con successo`
        });
      } else {
        toast({
          title: "Errore",
          description: "Nessuna domanda importata. Verifica il formato del file",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Errore durante l\'importazione:', error);
      toast({
        title: "Errore",
        description: "Impossibile importare il form. Verifica il formato del file",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Indietro
          </Button>
          <h1 className="text-3xl font-bold">
            {id ? 'Modifica Form' : 'Crea Nuovo Form'}
          </h1>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setImportDialogOpen(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Importa
          </Button>
          <Button 
            variant="outline"
            onClick={() => setActiveTab(activeTab === "edit" ? "preview" : "edit")}
          >
            <Eye className="h-4 w-4 mr-2" />
            {activeTab === "edit" ? 'Anteprima' : 'Torna all\'editor'}
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Salvataggio...' : 'Salva'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="edit">Editor</TabsTrigger>
          <TabsTrigger value="preview">Anteprima</TabsTrigger>
        </TabsList>
        
        <TabsContent value="edit" className="m-0">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-3">
              <FormSidebar onAddField={handleAddField} />
            </div>
            
            <div className="col-span-9">
              <div 
                className={`min-h-[500px] border-2 border-dashed rounded-md p-6 transition-colors ${isDraggingOver ? 'bg-gray-100 border-primary' : 'border-gray-300'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {formData && (
                  <FormEditor 
                    initialData={formData}
                    onChange={handleFormDataChange}
                  />
                )}
                
                <div className="mt-6 flex justify-center">
                  <Button 
                    variant="outline" 
                    onClick={handleAddNewQuestion}
                    className="border-dashed"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Aggiungi Domanda
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="preview" className="m-0">
          {formData && (
            <div className="max-w-3xl mx-auto border rounded-md p-6 bg-white">
              <h2 className="text-2xl font-bold mb-4">{formData.title}</h2>
              {formData.description && (
                <p className="mb-6 text-gray-600">{formData.description}</p>
              )}
              
              {formData.pages.map((page, pageIndex) => (
                <div key={page.id} className="mb-8">
                  <h3 className="text-xl font-bold mb-2">
                    {page.title || `Pagina ${pageIndex + 1}`}
                  </h3>
                  {page.description && (
                    <p className="mb-4 text-gray-600">{page.description}</p>
                  )}
                  
                  {page.imageUrl && (
                    <div className={`mb-6 ${
                      page.imagePosition === 'left' ? 'float-left mr-6' :
                      page.imagePosition === 'right' ? 'float-right ml-6' : ''
                    }`}>
                      <img 
                        src={page.imageUrl} 
                        alt={page.title} 
                        className="max-w-full h-auto rounded-md"
                        style={{ maxHeight: '300px' }} 
                      />
                    </div>
                  )}
                  
                  <div className="clear-both">
                    <FormPreview fields={page.fields} />
                  </div>
                </div>
              ))}
              
              <div className="mt-8 flex justify-end">
                <Button>Invia Form</Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Importa Questionario</DialogTitle>
            <DialogDescription>
              Incolla il testo del questionario nel formato specificato:
              <pre className="mt-2 p-2 bg-gray-100 rounded-md text-xs">
                Q1|type=text|question=Domanda|options=[]|condition=null|score=null<br />
                ---<br />
                Q2|type=radio|question=Domanda con opzioni|options=[Opzione1:5|Opzione2:3]|condition=null|score=Punteggio selezionato
              </pre>
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Label htmlFor="import-text">Testo da importare</Label>
            <Textarea 
              id="import-text"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={10}
              placeholder="Q1|type=text|question=Descrivi in poche parole come ti vedi come persona.|options=[]|condition=null|score=null
---
Q2|type=radio|question=Quanto ti senti sicuro delle tue capacità in generale?|options=[Molto sicuro, credo in me stesso:5|Abbastanza sicuro, ma con dubbi occasionali:4|Poco sicuro, spesso mi sento insicuro:3|Per niente sicuro, dubito sempre di me:2|Dipende dalla situazione:1]|condition=null|score=Punteggio selezionato"
              className="font-mono"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleImportSubmit}>
              Importa Questionario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FormEditorPage;
