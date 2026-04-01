import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, Save, Image as ImageIcon, Type, Layout, Columns, Code, Plus } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { saveReportTemplate, fetchReportTemplate } from '@/services/prompt-templates';

// React Quill imports
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import ImageResize from 'quill-image-resize-module-react';

// Register Image Resize Module
if (typeof window !== 'undefined') {
  (window as any).Quill = Quill;
  Quill.register('modules/imageResize', ImageResize);
}

const ReportTemplateEditor = () => {
  const { planId, templateId } = useParams<{ planId: string; templateId?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const quillRef = useRef<ReactQuill>(null);
  
  const [template, setTemplate] = useState({
    id: '',
    plan_id: planId || '',
    title: 'Nuovo Template Report',
    content: '<h1>Report Personalizzato</h1><p>Benvenuto nel tuo report.</p><p>[section_intro]</p><h2>Informazioni Generali</h2><p>Questi dati sono stati elaborati in base alle risposte fornite.</p><p>[chart_overview]</p><h2>Analisi Dettagliata</h2><p>[section_details]</p><p>[table_summary]</p>',
    description: 'Template per la visualizzazione dei report',
    is_default: true,
    font_family: 'Inter',
    font_size: '16px',
    column_layout: 'single'
  });
  
  const [isEditing, setIsEditing] = useState(true);
  
  // Available shortcodes for insertion
  const availableShortcodes = {
    text: [
      { code: 'section_intro', label: 'Introduzione', description: 'Sezione introduttiva del report' },
      { code: 'section_details', label: 'Dettagli', description: 'Sezione dettagliata con analisi' },
      { code: 'section_conclusion', label: 'Conclusione', description: 'Conclusione e riepilogo' },
      { code: 'user_name', label: 'Nome Utente', description: 'Nome dell\'utente' },
      { code: 'report_date', label: 'Data Report', description: 'Data di generazione del report' },
      { code: 'questionnaire_title', label: 'Titolo Questionario', description: 'Titolo del questionario' }
    ],
    charts: [
      { code: 'chart_overview', label: 'Panoramica', description: 'Grafico panoramica risultati' },
      { code: 'chart_performance', label: 'Performance', description: 'Grafico performance' },
      { code: 'chart_comparison', label: 'Confronto', description: 'Grafico confronto dati' },
      { code: 'chart_trends', label: 'Trend', description: 'Grafico andamento temporale' },
      { code: 'chart_distribution', label: 'Distribuzione', description: 'Grafico distribuzione' }
    ],
    tables: [
      { code: 'table_summary', label: 'Riepilogo', description: 'Tabella riepilogativa' },
      { code: 'table_details', label: 'Dettagli', description: 'Tabella dettagliata' },
      { code: 'table_comparison', label: 'Confronto', description: 'Tabella confronto' },
      { code: 'table_metrics', label: 'Metriche', description: 'Tabella metriche principali' }
    ]
  };
  
  // Font options
  const fontOptions = [
    { value: 'Inter', label: 'Inter (Moderno)' },
    { value: 'Arial', label: 'Arial (Classico)' },
    { value: 'Georgia', label: 'Georgia (Elegante)' },
    { value: 'Times New Roman', label: 'Times New Roman (Tradizionale)' },
    { value: 'Helvetica', label: 'Helvetica (Pulito)' },
    { value: 'Roboto', label: 'Roboto (Google)' },
    { value: 'Open Sans', label: 'Open Sans (Leggibile)' }
  ];
  
  // Font size options
  const fontSizeOptions = [
    { value: '12px', label: 'Piccolo (12px)' },
    { value: '14px', label: 'Normale (14px)' },
    { value: '16px', label: 'Medio (16px)' },
    { value: '18px', label: 'Grande (18px)' },
    { value: '20px', label: 'Extra (20px)' }
  ];
  
  // Column layout options
  const columnLayoutOptions = [
    { value: 'single', label: 'Colonna Singola' },
    { value: 'two', label: 'Due Colonne' },
    { value: 'three', label: 'Tre Colonne' }
  ];
  
  useEffect(() => {
    const loadTemplate = async () => {
      if (templateId && templateId !== 'new') {
        setLoading(true);
        try {
          const data = await fetchReportTemplate(templateId);
          if (data) {
            setTemplate({
              ...template,
              ...data,
              // 🌟 FIX FOR WHITE SCREEN: Ensure content is NEVER null
              content: data.content || '',
              title: data.title || '',
              description: data.description || '',
              font_family: data.font_family || 'Inter',
              font_size: data.font_size || '16px',
              column_layout: data.column_layout || 'single'
            });
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadTemplate();
  }, [templateId]);
  
  const handleSave = async () => {
    if (!template.plan_id || !template.title || !template.content) {
      toast({
        title: 'Dati mancanti',
        description: 'Compila tutti i campi obbligatori per salvare il template',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setSaving(true);
      const success = await saveReportTemplate(template);
      
      if (success) {
        toast({
          title: 'Template salvato',
          description: 'Il template del report è stato salvato con successo'
        });
        
        // Torna alla lista dei template
        navigate(`/admin/plans/${planId}/reports`);
      } else {
        toast({
          title: 'Errore',
          description: 'Si è verificato un errore nel salvataggio del template',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Errore nel salvataggio del template:', error);
      toast({
        title: 'Errore',
        description: 'Si è verificato un errore nel salvataggio del template',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };
  
  // 🌟 FIX: Safe callback for editor changes to prevent text from disappearing
  const handleEditorChange = useCallback((content: string) => {
    setTemplate(prev => ({ ...prev, content }));
  }, []);

  // 🌟 FIX: Safe image handler for base64
  const handleImageUpload = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();
    
    input.onchange = async () => {
      const file = input.files ? input.files[0] : null;
      if (file) {
        if (file.size > 50 * 1024 * 1024) {
          toast({
            title: 'File troppo grande',
            description: 'L\'immagine deve essere inferiore a 50MB',
            variant: 'destructive'
          });
          return;
        }
        
        const reader = new FileReader();
        reader.onload = () => {
          const base64Image = reader.result as string;
          if (quillRef.current) {
            const quill = quillRef.current.getEditor();
            const range = quill.getSelection(true) || { index: quill.getLength(), length: 0 };
            quill.insertEmbed(range.index, 'image', base64Image, 'user');
            quill.setSelection(range.index + 1, 0, 'user');
          }
          toast({
            title: 'Immagine inserita',
            description: 'L\'immagine è stata inserita nel template. Cliccaci sopra per ridimensionarla.'
          });
        };
        reader.readAsDataURL(file);
      }
    };
  }, [toast]);

  // 🌟 FIX: Memoized Quill modules to prevent re-renders breaking the editor state
  const quillModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'font': [] }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'script': 'sub'}, { 'script': 'super' }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'align': [] }],
        ['blockquote', 'code-block'],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: handleImageUpload
      }
    },
    imageResize: {
      parallax: true,
      modules: ['Resize', 'DisplaySize', 'Toolbar']
    },
    clipboard: {
      matchVisual: false
    }
  }), [handleImageUpload]);
  
  const quillFormats = [
    'header', 'font', 'size', 'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'script', 'list', 'bullet', 'indent',
    'align', 'blockquote', 'code-block', 'link', 'image'
  ];
  
  // Insert shortcode at cursor position
  const insertShortcode = (shortcode: string) => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      const range = quill.getSelection(true) || { index: quill.getLength(), length: 0 };
      
      // Insert shortcode as a special format (colored text)
      quill.insertText(range.index, `[${shortcode}]`, {
        'color': '#4f46e5',
        'background': '#e0e7ff',
        'bold': true
      }, 'user');
      quill.setSelection(range.index + shortcode.length + 2, 0, 'user');
      
      toast({
        title: 'Shortcode inserito',
        description: `[${shortcode}] inserito nel template`
      });
    }
  };
  
  // Get column class based on layout
  const getColumnClass = () => {
    switch (template.column_layout) {
      case 'two':
        return 'columns-2 gap-8';
      case 'three':
        return 'columns-3 gap-6';
      default:
        return 'columns-1';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate(`/admin/plans/${planId}/prompts`)}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Torna ai template report
        </Button>
        <h1 className="text-2xl font-bold ml-4">
          {templateId && templateId !== 'new' ? 'Modifica Template Report' : 'Nuovo Template Report'}
        </h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar con impostazioni e shortcode */}
        <div className="space-y-6">
          {/* Impostazioni Template */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Type className="h-5 w-5 mr-2" />
                Impostazioni Template
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="template-title">Titolo Template</Label>
                <Input
                  id="template-title"
                  value={template.title}
                  onChange={(e) => setTemplate({...template, title: e.target.value})}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="template-description">Descrizione</Label>
                <Textarea
                  id="template-description"
                  value={template.description}
                  onChange={(e) => setTemplate({...template, description: e.target.value})}
                  rows={3}
                  className="mt-1"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is-default"
                  checked={template.is_default}
                  onCheckedChange={(checked) => setTemplate({...template, is_default: checked})}
                />
                <Label htmlFor="is-default">Template Predefinito</Label>
              </div>
            </CardContent>
          </Card>
          
          {/* Impostazioni Stile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Layout className="h-5 w-5 mr-2" />
                Stile e Layout
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="font-family">Font</Label>
                <Select
                  value={template.font_family}
                  onValueChange={(value) => setTemplate({...template, font_family: value})}
                >
                  <SelectTrigger id="font-family" className="mt-1">
                    <SelectValue placeholder="Seleziona font" />
                  </SelectTrigger>
                  <SelectContent>
                    {fontOptions.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        <span style={{ fontFamily: font.value }}>{font.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="font-size">Dimensione Font Base</Label>
                <Select
                  value={template.font_size}
                  onValueChange={(value) => setTemplate({...template, font_size: value})}
                >
                  <SelectTrigger id="font-size" className="mt-1">
                    <SelectValue placeholder="Seleziona dimensione" />
                  </SelectTrigger>
                  <SelectContent>
                    {fontSizeOptions.map((size) => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="column-layout">Layout Colonne</Label>
                <Select
                  value={template.column_layout}
                  onValueChange={(value) => setTemplate({...template, column_layout: value})}
                >
                  <SelectTrigger id="column-layout" className="mt-1">
                    <SelectValue placeholder="Seleziona layout" />
                  </SelectTrigger>
                  <SelectContent>
                    {columnLayoutOptions.map((layout) => (
                      <SelectItem key={layout.value} value={layout.value}>
                        {layout.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          {/* Inserimento Shortcode */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Code className="h-5 w-5 mr-2" />
                Inserisci Shortcode
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="text" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="text">Testo</TabsTrigger>
                  <TabsTrigger value="charts">Grafici</TabsTrigger>
                  <TabsTrigger value="tables">Tabelle</TabsTrigger>
                </TabsList>
                
                <TabsContent value="text" className="space-y-2 mt-2">
                  {availableShortcodes.text.map((item) => (
                    <Button
                      key={item.code}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-left"
                      onClick={() => insertShortcode(item.code)}
                    >
                      <Plus className="h-3 w-3 mr-2" />
                      <div>
                        <div className="font-medium">[{item.code}]</div>
                        <div className="text-xs text-muted-foreground">{item.description}</div>
                      </div>
                    </Button>
                  ))}
                </TabsContent>
                
                <TabsContent value="charts" className="space-y-2 mt-2">
                  {availableShortcodes.charts.map((item) => (
                    <Button
                      key={item.code}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-left"
                      onClick={() => insertShortcode(item.code)}
                    >
                      <Plus className="h-3 w-3 mr-2" />
                      <div>
                        <div className="font-medium">[{item.code}]</div>
                        <div className="text-xs text-muted-foreground">{item.description}</div>
                      </div>
                    </Button>
                  ))}
                </TabsContent>
                
                <TabsContent value="tables" className="space-y-2 mt-2">
                  {availableShortcodes.tables.map((item) => (
                    <Button
                      key={item.code}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-left"
                      onClick={() => insertShortcode(item.code)}
                    >
                      <Plus className="h-3 w-3 mr-2" />
                      <div>
                        <div className="font-medium">[{item.code}]</div>
                        <div className="text-xs text-muted-foreground">{item.description}</div>
                      </div>
                    </Button>
                  ))}
                </TabsContent>
              </Tabs>
              <Separator className="my-2" />
              <div className="text-xs text-muted-foreground">
                <p>Clicca su uno shortcode per inserirlo nell'editor.</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Azioni */}
          <Card>
            <CardFooter className="flex flex-col space-y-2 pt-6">
              <Button 
                onClick={handleSave} 
                disabled={saving || !template.title || !template.content}
                className="w-full"
                size="lg"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvataggio...' : 'Salva Template'}
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Editor principale */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Layout className="h-5 w-5 mr-2" />
                    Editor Template
                  </CardTitle>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={!isEditing}
                    onCheckedChange={(checked) => setIsEditing(!checked)}
                  />
                  <span className="text-sm font-bold text-primary">{isEditing ? 'Modalità Modifica' : 'Modalità Anteprima (Visualizzazione Sicura)'}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="border rounded-md bg-white">
                    <ReactQuill
                      ref={quillRef}
                      theme="snow"
                      value={template.content || ''}
                      onChange={handleEditorChange}
                      modules={quillModules}
                      formats={quillFormats}
                      style={{ 
                        height: '500px',
                        fontFamily: template.font_family,
                        fontSize: template.font_size,
                        paddingBottom: '40px'
                      }}
                    />
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span className="flex items-center">
                      <ImageIcon className="h-4 w-4 mr-1" />
                      Clicca sull'icona immagine nella toolbar per caricare immagini e ridimensionarle
                    </span>
                    <span className="flex items-center">
                      <Columns className="h-4 w-4 mr-1" />
                      Layout: {columnLayoutOptions.find(l => l.value === template.column_layout)?.label}
                    </span>
                  </div>
                </div>
              ) : (
                <div 
                  className="border rounded-md p-6 min-h-[500px] bg-white"
                  style={{ 
                    fontFamily: template.font_family,
                    fontSize: template.font_size
                  }}
                >
                  {/* 🌟 FIX FOR WHITE SCREEN: Ensure content is NEVER passed as null to ShortcodeProcessor */}
                  <div className={`prose max-w-none ${getColumnClass()}`} dangerouslySetInnerHTML={{ __html: template.content || '' }} />
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Shortcode Disponibili - Riepilogo */}
          <Card>
            <CardHeader>
              <CardTitle>Shortcode Disponibili - Riepilogo</CardTitle>
              <CardDescription>
                Elenco completo degli shortcode che puoi utilizzare nel template
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h3 className="font-medium mb-2 text-blue-600">Sezioni Testo</h3>
                  <div className="space-y-1">
                    {availableShortcodes.text.map((item) => (
                      <div key={item.code} className="flex items-center justify-between p-2 bg-slate-50 rounded text-sm">
                        <code className="text-blue-600">[{item.code}]</code>
                        <span className="text-xs text-muted-foreground">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2 text-green-600">Grafici</h3>
                  <div className="space-y-1">
                    {availableShortcodes.charts.map((item) => (
                      <div key={item.code} className="flex items-center justify-between p-2 bg-slate-50 rounded text-sm">
                        <code className="text-green-600">[{item.code}]</code>
                        <span className="text-xs text-muted-foreground">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2 text-purple-600">Tabelle</h3>
                  <div className="space-y-1">
                    {availableShortcodes.tables.map((item) => (
                      <div key={item.code} className="flex items-center justify-between p-2 bg-slate-50 rounded text-sm">
                        <code className="text-purple-600">[{item.code}]</code>
                        <span className="text-xs text-muted-foreground">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReportTemplateEditor;