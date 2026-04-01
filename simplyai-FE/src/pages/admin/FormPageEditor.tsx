import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactQuill, { Quill } from 'react-quill';
import "react-quill/dist/quill.snow.css";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Eye, Image as ImageIcon, Columns, LayoutTemplate } from 'lucide-react';
import { API_BASE_URL } from '@/config/api';

// Quill modules configuration with full features
const modules = {
  toolbar: {
    container: [
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['link', 'image', 'video'],
      ['clean']
    ]
  },
  clipboard: {
    matchVisual: false,
  }
};

const formats = [
  'size', 'header', 'bold', 'italic', 'underline', 'strike',
  'color', 'background', 'align', 'blockquote', 'code-block',
  'list', 'bullet', 'indent', 'link', 'image', 'video'
];

const FormPageEditor = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    pageContent: '<h1>Questionario</h1><p>Benvenuto al questionario. Di seguito troverai una serie di domande a cui rispondere.</p>',
    instructions: '',
    headerImageUrl: '',
    footerContent: '<p class="text-center text-sm text-gray-500 mt-8">Grazie per aver compilato il questionario. Le tue risposte sono importanti per noi.</p>'
  });

  const pageContentQuillRef = useRef<ReactQuill>(null);
  const footerContentQuillRef = useRef<ReactQuill>(null);

  // Fetch from database
  useEffect(() => {
    const fetchFormData = async () => {
      if (!formId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const formResponse = await fetch(`${API_BASE_URL}/forms/${formId}`);
        const formResult = await formResponse.json();
        if (!formResult.success) throw new Error('Form not found');

        const layoutResponse = await fetch(`${API_BASE_URL}/forms/${formId}/layout`);
        const layoutResult = await layoutResponse.json();

        const layout = layoutResult.success ? layoutResult.data : {};
        const form = formResult.data || {};

        setFormData({
          id: formId,
          title: form.title || '',
          description: form.description || '',
          pageContent: layout.pageContent || '<h1>Questionario</h1><p>Benvenuto al questionario. Di seguito troverai una serie di domande a cui rispondere.</p>',
          instructions: layout.instructions || '',
          headerImageUrl: layout.headerImageUrl || '',
          footerContent: layout.footerContent || '<p class="text-center text-sm text-gray-500 mt-8">Grazie per aver compilato il questionario. Le tue risposte sono importanti per noi.</p>'
        });
      } catch (error) {
        toast({
          title: 'Errore',
          description: 'Si è verificato un errore nel caricamento dei dati del form',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    fetchFormData();
  }, [formId, toast]);

  // 🌟 FIX: Global Image Resize & Delete Handlers (No clashing) 🌟
  useEffect(() => {
    let isResizing = false;
    let currentImage: HTMLImageElement | null = null;
    let startX = 0, startY = 0, startWidth = 0, startHeight = 0;
    let resizeDirection = '';
    let activeEditorRef: React.RefObject<ReactQuill> | null = null;

    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG' && target.closest('.ql-editor')) {
        document.querySelectorAll('.ql-image-selected').forEach(img => img.classList.remove('ql-image-selected'));
        target.classList.add('ql-image-selected');
        target.style.position = 'relative';
      } else if (target.tagName !== 'IMG') {
        document.querySelectorAll('.ql-image-selected').forEach(img => img.classList.remove('ql-image-selected'));
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && !e.repeat) {
        const selectedImg = document.querySelector('.ql-image-selected') as HTMLElement;
        if (selectedImg) {
          e.preventDefault();
          const isPageEditor = pageContentQuillRef.current?.getEditor().root.contains(selectedImg);
          const quillRef = isPageEditor ? pageContentQuillRef : footerContentQuillRef;
          const quill = quillRef.current?.getEditor();
          
          if (quill) {
            const blot = Quill.find(selectedImg);
            if (blot) {
              const index = blot.offset(quill.scroll);
              quill.deleteText(index, 1, 'user');
            } else {
              selectedImg.remove();
            }
            const html = quill.root.innerHTML;
            if (isPageEditor) setFormData(prev => ({...prev, pageContent: html}));
            else setFormData(prev => ({...prev, footerContent: html}));
            
            toast({ title: "Immagine eliminata" });
          }
        }
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG' && target.classList.contains('ql-image-selected')) {
        const rect = target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cornerSize = 20;
        let isResizeHandle = false;
        
        if (x > rect.width - cornerSize && y > rect.height - cornerSize) { isResizeHandle = true; resizeDirection = 'se'; }
        else if (x < cornerSize && y > rect.height - cornerSize) { isResizeHandle = true; resizeDirection = 'sw'; }
        else if (x > rect.width - cornerSize && y < cornerSize) { isResizeHandle = true; resizeDirection = 'ne'; }
        else if (x < cornerSize && y < cornerSize) { isResizeHandle = true; resizeDirection = 'nw'; }
        
        if (isResizeHandle) {
          e.preventDefault();
          isResizing = true;
          currentImage = target as HTMLImageElement;
          startX = e.clientX;
          startY = e.clientY;
          startWidth = target.offsetWidth;
          startHeight = target.offsetHeight;
          target.classList.add('resizing');
          
          activeEditorRef = pageContentQuillRef.current?.getEditor().root.contains(target) 
            ? pageContentQuillRef 
            : footerContentQuillRef;
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !currentImage) return;
      e.preventDefault();
      const dx = e.clientX - startX;
      const aspectRatio = startWidth / startHeight;
      let newWidth = startWidth;
      
      if (resizeDirection === 'se' || resizeDirection === 'sw') newWidth = startWidth + dx;
      else if (resizeDirection === 'ne' || resizeDirection === 'nw') newWidth = startWidth - dx;
      
      newWidth = Math.max(50, Math.min(newWidth, 1200));
      currentImage.style.width = Math.round(newWidth) + 'px';
      currentImage.style.height = Math.round(newWidth / aspectRatio) + 'px';
    };

    const handleMouseUp = () => {
      if (isResizing && currentImage && activeEditorRef?.current) {
        isResizing = false;
        currentImage.classList.remove('resizing');
        currentImage.setAttribute('width', currentImage.style.width.replace('px', ''));
        currentImage.setAttribute('height', currentImage.style.height.replace('px', ''));
        
        const html = activeEditorRef.current.getEditor().root.innerHTML;
        if (activeEditorRef === pageContentQuillRef) setFormData(prev => ({...prev, pageContent: html}));
        else setFormData(prev => ({...prev, footerContent: html}));
        
        currentImage = null;
        resizeDirection = '';
      }
    };

    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleInsertImage = (quillRef: React.RefObject<ReactQuill>) => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();
    input.onchange = async () => {
      const file = input.files?.[0];
      if (file && quillRef.current) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const quill = quillRef.current!.getEditor();
          const range = quill.getSelection(true);
          quill.insertEmbed(range.index, 'image', e.target?.result as string, 'user');
          quill.setSelection(range.index + 1, 0, 'user');
        };
        reader.readAsDataURL(file);
      }
    };
  };

  const handleInsertLayout = (quillRef: React.RefObject<ReactQuill>, columns: number) => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      const range = quill.getSelection(true);
      let layout = `<div class="grid grid-cols-1 md:grid-cols-${columns} gap-4 my-4">`;
      for (let i = 0; i < columns; i++) {
        layout += `<div class="col border p-4 rounded-md bg-gray-50"><p>Colonna ${i + 1}</p></div>`;
      }
      layout += `</div><p><br/></p>`;
      quill.clipboard.dangerouslyPasteHTML(range.index, layout);
      quill.setSelection(range.index + layout.length);
    }
  };

  const handleNewSection = (quillRef: React.RefObject<ReactQuill>) => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      const range = quill.getSelection(true);
      const sectionHtml = `<section class="py-8 my-4 border-y border-dashed border-gray-300">
        <h2 class="text-2xl font-bold mb-4">Nuova Sezione</h2>
        <p>Aggiungi qui il contenuto della sezione...</p>
      </section><p><br/></p>`;
      quill.clipboard.dangerouslyPasteHTML(range.index, sectionHtml);
      quill.setSelection(range.index + sectionHtml.length);
    }
  };

  const handleSave = async () => {
    if (!formId) return;
    setSaving(true);
    try {
      const pageContent = pageContentQuillRef.current?.getEditor().root.innerHTML || '';
      const footerContent = footerContentQuillRef.current?.getEditor().root.innerHTML || '';
      const updatedFormData = { ...formData, pageContent, footerContent };
      
      const response = await fetch(`${API_BASE_URL}/forms/${formId}/layout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageContent: updatedFormData.pageContent,
          footerContent: updatedFormData.footerContent,
          headerImageUrl: updatedFormData.headerImageUrl,
          instructions: updatedFormData.instructions,
          title: updatedFormData.title,
          description: updatedFormData.description
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Failed to save');

      setFormData(updatedFormData);
      toast({ title: '✅ Pagina salvata', description: 'Le modifiche alla pagina del form sono state salvate' });
    } catch (error) {
      toast({ title: 'Errore', description: 'Errore nel salvataggio della pagina', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/form-builder')} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Torna ai form
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Editor Pagina Form</h1>
            <p className="text-muted-foreground mt-1">Modifica il layout e la descrizione della pagina che visualizza il form</p>
          </div>
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
            <Eye className="h-4 w-4 mr-2" /> {previewMode ? 'Modifica' : 'Anteprima'}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" /> {saving ? 'Salvataggio...' : 'Salva'}
          </Button>
        </div>
      </div>
      
      {previewMode ? (
        <Card>
          <CardHeader><CardTitle>Anteprima Pagina Form</CardTitle></CardHeader>
          <CardContent>
            <div className="border rounded-md p-6 bg-white">
              {formData.headerImageUrl && (
                <div className="mb-6"><img src={formData.headerImageUrl} alt="Header" className="w-full h-auto max-h-48 object-cover rounded-md"/></div>
              )}
              <div className="prose max-w-none mb-8" dangerouslySetInnerHTML={{ __html: formData.pageContent }} />
              {formData.instructions && (
                <div className="bg-blue-50 text-blue-800 p-4 rounded-md mb-8">
                  <strong>Istruzioni:</strong> {formData.instructions}
                </div>
              )}
              <div className="border-t border-b py-8 my-8"><div className="text-center text-lg font-medium mb-4">[Contenuto del form verrà visualizzato qui]</div></div>
              <div className="mt-8" dangerouslySetInnerHTML={{ __html: formData.footerContent }} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Informazioni Base</CardTitle>
              <CardDescription>Modifica le informazioni di base del form</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Titolo Form</Label><Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Titolo del form" /></div>
              <div><Label>Descrizione breve</Label><Input value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Breve descrizione del form" /></div>
              <div><Label>Istruzioni di compilazione</Label><Input value={formData.instructions} onChange={(e) => setFormData({...formData, instructions: e.target.value})} placeholder="Istruzioni per la compilazione del form" /></div>
              <div><Label>URL Immagine Intestazione</Label><Input value={formData.headerImageUrl} onChange={(e) => setFormData({...formData, headerImageUrl: e.target.value})} placeholder="URL dell'immagine di intestazione" /></div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Contenuto Pagina (Prima del Form)</CardTitle>
              <CardDescription>Modifica il contenuto mostrato prima del form.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 items-center bg-gray-50 p-3 border rounded-md">
                  <Button variant="outline" size="sm" onClick={() => handleInsertImage(pageContentQuillRef)}>
                    <ImageIcon className="h-4 w-4 mr-2" /> Carica Immagine
                  </Button>
                  <div className="w-px h-6 bg-gray-300 mx-2"></div>
                  <Button variant="outline" size="sm" onClick={() => handleNewSection(pageContentQuillRef)}>
                    <LayoutTemplate className="h-4 w-4 mr-2" /> Nuova Sezione
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleInsertLayout(pageContentQuillRef, 2)}>
                    <Columns className="h-4 w-4 mr-2" /> 2 Colonne
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleInsertLayout(pageContentQuillRef, 3)}>
                    <Columns className="h-4 w-4 mr-2" /> 3 Colonne
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleInsertLayout(pageContentQuillRef, 4)}>
                    <Columns className="h-4 w-4 mr-2" /> 4 Colonne
                  </Button>
                </div>
                <div className="border rounded-md overflow-hidden">
                  <ReactQuill ref={pageContentQuillRef} theme="snow" value={formData.pageContent} onChange={(content) => setFormData({...formData, pageContent: content})} modules={modules} formats={formats} className="min-h-[400px] bg-white" style={{ height: '400px' }} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Contenuto Footer (Dopo il Form)</CardTitle>
              <CardDescription>Modifica il contenuto mostrato dopo il form.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 items-center bg-gray-50 p-3 border rounded-md">
                  <Button variant="outline" size="sm" onClick={() => handleInsertImage(footerContentQuillRef)}>
                    <ImageIcon className="h-4 w-4 mr-2" /> Carica Immagine
                  </Button>
                  <div className="w-px h-6 bg-gray-300 mx-2"></div>
                  <Button variant="outline" size="sm" onClick={() => handleNewSection(footerContentQuillRef)}>
                    <LayoutTemplate className="h-4 w-4 mr-2" /> Nuova Sezione
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleInsertLayout(footerContentQuillRef, 2)}>
                    <Columns className="h-4 w-4 mr-2" /> 2 Colonne
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleInsertLayout(footerContentQuillRef, 3)}>
                    <Columns className="h-4 w-4 mr-2" /> 3 Colonne
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleInsertLayout(footerContentQuillRef, 4)}>
                    <Columns className="h-4 w-4 mr-2" /> 4 Colonne
                  </Button>
                </div>
                <div className="border rounded-md overflow-hidden">
                  <ReactQuill ref={footerContentQuillRef} theme="snow" value={formData.footerContent} onChange={(content) => setFormData({...formData, footerContent: content})} modules={modules} formats={formats} className="min-h-[200px] bg-white" style={{ height: '200px' }} />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" /> {saving ? 'Salvataggio...' : 'Salva Modifiche'}
              </Button>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
};

export default FormPageEditor;