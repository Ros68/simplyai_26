/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-var */
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import "@/styles/quill-custom.css"; 
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Edit, Trash2, Plus, Save, Eye, Columns, LayoutTemplate, ArrowUp, ArrowDown } from "lucide-react";
import { fetchAllPages, fetchPageData, savePageData, createPage, deletePage, PageContent } from "@/services/pagesService";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

// 🌟 BLOCK EDITOR TYPES
type BlockType = 'full' | '2-col' | '3-col' | '4-col';
interface EditorBlock {
  id: string;
  type: BlockType;
  content: string[]; // index 0 = col 1, index 1 = col 2, etc.
}

const generateId = () => Math.random().toString(36).substr(2, 9);

// 🌟 INDIVIDUAL QUILL EDITOR COMPONENT (Har column ka apna isolated editor)
const BlockEditorQuill = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
  const quillRef = useRef<ReactQuill>(null);
  const { toast } = useToast();

  const imageHandler = useCallback(() => {
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
          const range = quill.getSelection(true) || { index: quill.getLength() };
          const imageUrl = e.target?.result as string;
          quill.insertEmbed(range.index, 'image', imageUrl, 'user');
          quill.setSelection(range.index + 1, 0, 'user');
        };
        reader.readAsDataURL(file);
      }
    };
  }, []);

  const formats = ['size', 'header', 'bold', 'italic', 'underline', 'strike', 'color', 'background', 'align', 'blockquote', 'code-block', 'list', 'bullet', 'indent', 'link', 'image', 'video'];

  const modules = useMemo(() => ({
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
      ],
      handlers: { image: imageHandler }
    },
    clipboard: { matchVisual: false },
    keyboard: {
      bindings: {
        deleteImage: { key: 'Delete', handler: function() { return true; } }
      }
    }
  }), [imageHandler]);

  // 🌟 TUMHARI ORIGINAL IMAGE RESIZE LOGIC
  useEffect(() => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      let isResizing = false;
      let currentImage: HTMLImageElement | null = null;
      let startX = 0, startY = 0, startWidth = 0, startHeight = 0;
      let resizeDirection = '';
      
      const handleImageClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'IMG') {
          e.preventDefault(); e.stopPropagation();
          document.querySelectorAll('.ql-image-selected').forEach(img => img.classList.remove('ql-image-selected'));
          target.classList.add('ql-image-selected');
          const img = target as HTMLImageElement;
          img.style.position = 'relative';
          
          const handleKeyDown = (ke: KeyboardEvent) => {
            if ((ke.key === 'Delete' || ke.key === 'Backspace') && !ke.repeat) {
              const selectedImg = document.querySelector('.ql-image-selected');
              if (selectedImg) {
                ke.preventDefault();
                const blot = Quill.find(selectedImg);
                if (blot) {
                  const index = blot.offset(quill.scroll);
                  quill.deleteText(index, 1, 'user');
                } else {
                  selectedImg.remove();
                  onChange(quill.root.innerHTML);
                }
                selectedImg.classList.remove('ql-image-selected');
                toast({ title: "Immagine eliminata", description: "L'immagine è stata rimossa." });
              }
            }
          };
          document.addEventListener('keydown', handleKeyDown, { once: true });
        }
      };
      
      const handleMouseDown = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'IMG' && target.classList.contains('ql-image-selected')) {
          const rect = target.getBoundingClientRect();
          const x = e.clientX - rect.left, y = e.clientY - rect.top;
          const width = rect.width, height = rect.height;
          const cornerSize = 20; let isResizeHandle = false;
          
          if (x > width - cornerSize && y > height - cornerSize) { isResizeHandle = true; resizeDirection = 'se'; }
          else if (x < cornerSize && y > height - cornerSize) { isResizeHandle = true; resizeDirection = 'sw'; }
          else if (x > width - cornerSize && y < cornerSize) { isResizeHandle = true; resizeDirection = 'ne'; }
          else if (x < cornerSize && y < cornerSize) { isResizeHandle = true; resizeDirection = 'nw'; }
          
          if (isResizeHandle) {
            e.preventDefault(); isResizing = true; currentImage = target as HTMLImageElement;
            startX = e.clientX; startY = e.clientY; startWidth = target.offsetWidth; startHeight = target.offsetHeight;
            target.classList.add('resizing');
          }
        }
      };
      
      const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing || !currentImage) return;
        e.preventDefault();
        const dx = e.clientX - startX;
        let newWidth = startWidth, newHeight = startHeight;
        const aspectRatio = startWidth / startHeight;
        
        if (resizeDirection === 'se' || resizeDirection === 'sw') { newWidth = startWidth + dx; newHeight = newWidth / aspectRatio; }
        else if (resizeDirection === 'ne' || resizeDirection === 'nw') { newWidth = startWidth - dx; newHeight = newWidth / aspectRatio; }
        
        const MIN_SIZE = 50, MAX_SIZE = 1200;
        if (newWidth < MIN_SIZE) { newWidth = MIN_SIZE; newHeight = newWidth / aspectRatio; }
        if (newHeight < MIN_SIZE) { newHeight = MIN_SIZE; newWidth = newHeight * aspectRatio; }
        if (newWidth > MAX_SIZE) { newWidth = MAX_SIZE; newHeight = newWidth / aspectRatio; }
        
        currentImage.style.width = Math.round(newWidth) + 'px';
        currentImage.style.height = Math.round(newHeight) + 'px';
      };
      
      const handleMouseUp = () => {
        if (isResizing && currentImage) {
          isResizing = false; currentImage.classList.remove('resizing');
          currentImage.setAttribute('width', currentImage.style.width.replace('px', ''));
          currentImage.setAttribute('height', currentImage.style.height.replace('px', ''));
          onChange(quill.root.innerHTML); // Update block state!
          currentImage = null; resizeDirection = '';
        }
      };
      
      const handleDocumentClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'IMG') document.querySelectorAll('.ql-image-selected').forEach(img => img.classList.remove('ql-image-selected'));
      };
      
      quill.root.addEventListener('click', handleImageClick);
      quill.root.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('click', handleDocumentClick);
      
      return () => {
        quill.root.removeEventListener('click', handleImageClick);
        quill.root.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('click', handleDocumentClick);
      };
    }
  }, [onChange, toast]);

  return (
    <ReactQuill
      ref={quillRef}
      theme="snow"
      value={value}
      onChange={onChange}
      modules={modules}
      formats={formats}
      className="bg-white rounded-md min-h-[150px] shadow-sm border border-gray-100"
    />
  );
};

// Default pages for initial database seeding only
const defaultPages = [
  { id: "home", title: "Home", menuTitle: "Home", content: "<h1>Benvenuti in SimplyAI</h1><p>La piattaforma intelligente per l'analisi dei dati aziendali</p>", inMainMenu: true, order: 1 },
  { id: "about", title: "Chi Siamo", menuTitle: "Chi Siamo", content: "<h1>Chi Siamo</h1><p>SimplyAI è una piattaforma innovativa...</p>", inMainMenu: true, order: 2 },
  { id: "guide", title: "Guida", menuTitle: "Guida", content: "<h1>Guida all'uso</h1><p>Benvenuti alla guida...</p>", inMainMenu: true, order: 3 },
  { id: "contact", title: "Contatti", menuTitle: "Contatti", content: "<h1>Contattaci</h1><p>Siamo qui per aiutarti...</p>", inMainMenu: true, order: 4 },
  { id: "pricing", title: "Prezzi", menuTitle: "Prezzi", content: "<h1>I nostri piani</h1><p>Scegli il piano più adatto...</p>", inMainMenu: true, order: 5 },
];

const PageEditor = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pages, setPages] = useState<PageContent[]>([]);
  const [currentPage, setCurrentPage] = useState<PageContent | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState("");
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageDialog, setNewPageDialog] = useState(false);
  const [filterMainMenu, setFilterMainMenu] = useState(false);
  const [filteredPages, setFilteredPages] = useState<PageContent[]>([]);
  
  // 🌟 NAYA BLOCK STATE
  const [blocks, setBlocks] = useState<EditorBlock[]>([]);

  const cleanHTML = (html: string) => {
    if (!html) return html;
    let cleaned = html.replace(/<p><\/p>/g, '');
    cleaned = cleaned.replace(/<p>\s*<div/g, '<div');
    cleaned = cleaned.replace(/<\/div>\s*<\/p>/g, '</div>');
    cleaned = cleaned.replace(/<\/p>\s*<p>/g, '<br/>');
    return cleaned;
  };

  // 🌟 CONVERT BLOCKS TO FINAL HTML (For frontend)
  const blocksToHtml = (currentBlocks: EditorBlock[]) => {
    const rawData = encodeURIComponent(JSON.stringify(currentBlocks));
    const htmlContent = currentBlocks.map(block => {
      if (block.type === 'full') {
        return `<div class="simply-section w-full my-6">${block.content[0]}</div>`;
      } else {
        let cols = block.content.map(c => `<div class="simply-col flex-1 min-w-0">${c}</div>`).join('');
        return `<div class="simply-section w-full my-6 flex flex-col md:flex-row gap-6">${cols}</div>`;
      }
    }).join('');
    return `\n<div class="simply-page-content">\n${htmlContent}\n</div>`;
  };

  // 🌟 EXTRACT BLOCKS FROM LOADED HTML
  // 🌟 EXTRACT BLOCKS FROM LOADED HTML
  const htmlToBlocks = (html: string): EditorBlock[] => {
    if (!html) return [{ id: generateId(), type: 'full', content: [''] }];
    
    // 🌟 FIX: Used new RegExp string so it never gets stripped by code editors during copy/paste
    const regex = new RegExp("");
    const match = html.match(regex);
    
    if (match && match[1]) {
      try { return JSON.parse(decodeURIComponent(match[1])); } catch(e) { console.error("Parse error", e); }
    }
    return [{ id: generateId(), type: 'full', content: [html] }]; // Fallback for old pages
  };

  useEffect(() => {
    const loadPages = async () => {
      setLoading(true);
      const dbPages = await fetchAllPages();
      if (dbPages.length > 0) {
        const pagesWithContent = await Promise.all(
          dbPages.map(async (page) => {
            try {
              const fullData = await fetchPageData(page.id);
              return { ...page, content: fullData?.content || page.content || "" };
            } catch (err) { return page; }
          })
        );
        setPages(pagesWithContent);
        setCurrentPage(pagesWithContent[0]);
        setBlocks(htmlToBlocks(pagesWithContent[0].content || ""));
        setTempTitle(pagesWithContent[0].title);
      } else {
        for (const page of defaultPages) await createPage(page);
        setPages(defaultPages);
        setCurrentPage(defaultPages[0]);
        setBlocks(htmlToBlocks(defaultPages[0].content));
        setTempTitle(defaultPages[0].title);
      }
      setLoading(false);
    };
    loadPages();
  }, []);

  useEffect(() => {
    if (currentPage) {
      setBlocks(htmlToBlocks(currentPage.content || ""));
      setTempTitle(currentPage.title);
    }
  }, [currentPage?.id]);

  const savePageDataDB = async (id: string, title: string, content: string, menuTitle?: string, inMainMenu?: boolean, order?: number): Promise<boolean> => {
    try {
      const cleanContent = cleanHTML(content);
      const pageData: PageContent = { id, title, content: cleanContent, menuTitle: menuTitle || title, inMainMenu: inMainMenu !== false, order: order || 0 };
      const response = await savePageData(pageData);
      return response !== null;
    } catch (error) { return false; }
  };

  const handleSave = async () => {
    if (!currentPage) return;
    const finalHtml = blocksToHtml(blocks);
    try {
      const success = await savePageDataDB(currentPage.id, currentPage.title, finalHtml, currentPage.menuTitle, currentPage.inMainMenu, currentPage.order);
      if (success) {
        const updatedPages = pages.map((page) => page.id === currentPage.id ? { ...page, content: finalHtml, title: currentPage.title } : page);
        setPages(updatedPages);
        window.dispatchEvent(new CustomEvent('pagesUpdated'));
        toast({ title: "Pagina salvata", description: `La pagina "${currentPage.title}" è stata salvata.` });
      } else throw new Error("Failed to save page");
    } catch (error) {
      toast({ title: "Errore", description: "C'è stato un errore nel salvare la pagina. Riprova.", variant: "destructive" });
    }
  };

  const handleTitleEdit = () => { setEditingTitle(true); if (currentPage) setTempTitle(currentPage.title); };
  const handleTitleSave = async () => {
    if (!currentPage) return;
    if (tempTitle.trim()) {
      const updatedPage = { ...currentPage, title: tempTitle };
      setCurrentPage(updatedPage);
      const updatedPages = pages.map((page) => page.id === currentPage.id ? updatedPage : page);
      setPages(updatedPages);
      setEditingTitle(false);
      const success = await savePageDataDB(currentPage.id, tempTitle, blocksToHtml(blocks), updatedPage.menuTitle, updatedPage.inMainMenu, updatedPage.order);
      if (success) { window.dispatchEvent(new CustomEvent('pagesUpdated')); toast({ title: "Titolo aggiornato" }); }
    }
  };
  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); handleTitleSave(); } 
    else if (e.key === "Escape") { setEditingTitle(false); if (currentPage) setTempTitle(currentPage.title); }
  };

  const handleAddPage = async () => {
    if (!newPageTitle.trim()) return toast({ title: "Errore", description: "Il titolo non può essere vuoto", variant: "destructive" });
    const newId = newPageTitle.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (pages.some((page) => page.id === newId)) return toast({ title: "Errore", description: "Esiste già una pagina", variant: "destructive" });
    
    const initialBlocks: EditorBlock[] = [{ id: generateId(), type: 'full', content: [`<h1>${newPageTitle}</h1><p>Inizia a scrivere qui...</p>`] }];
    const newPage: PageContent = { id: newId, title: newPageTitle, menuTitle: newPageTitle, content: blocksToHtml(initialBlocks), inMainMenu: true, order: pages.length + 1 };
    
    if (await createPage(newPage)) {
      setPages([...pages, newPage]);
      setCurrentPage(newPage);
      setBlocks(initialBlocks);
      setTempTitle(newPageTitle);
      setNewPageTitle("");
      setNewPageDialog(false);
      window.dispatchEvent(new CustomEvent('pagesUpdated'));
      toast({ title: "Pagina creata" });
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (pages.length <= 1) return toast({ title: "Errore", description: "Non puoi eliminare l'unica pagina", variant: "destructive" });
    if (await deletePage(pageId)) {
      const remainingPages = pages.filter((page) => page.id !== pageId);
      setPages(remainingPages);
      if (currentPage?.id === pageId) {
        setCurrentPage(remainingPages[0]);
        setBlocks(htmlToBlocks(remainingPages[0].content || ""));
        setTempTitle(remainingPages[0].title);
      }
      window.dispatchEvent(new CustomEvent('pagesUpdated'));
      toast({ title: "Pagina eliminata" });
    }
  };

  const handleToggleMainMenu = async (pageId: string) => {
    const page = pages.find(p => p.id === pageId);
    if (!page) return;
    const updatedPage = { ...page, inMainMenu: !page.inMainMenu };
    if (await savePageDataDB(pageId, updatedPage.title, updatedPage.content || "", updatedPage.menuTitle, updatedPage.inMainMenu, updatedPage.order)) {
      setPages(pages.map((p) => p.id === pageId ? updatedPage : p));
      window.dispatchEvent(new CustomEvent('pagesUpdated'));
    }
  };

  const handlePageOrderChange = async (pageId: string, direction: "up" | "down") => {
    const pageIndex = pages.findIndex((p) => p.id === pageId);
    if (pageIndex < 0) return;
    const newPages = [...pages];
    if (direction === "up" && pageIndex > 0) {
      const tempOrder = newPages[pageIndex].order; newPages[pageIndex].order = newPages[pageIndex - 1].order; newPages[pageIndex - 1].order = tempOrder;
    } else if (direction === "down" && pageIndex < newPages.length - 1) {
      const tempOrder = newPages[pageIndex].order; newPages[pageIndex].order = newPages[pageIndex + 1].order; newPages[pageIndex + 1].order = tempOrder;
    }
    newPages.sort((a, b) => (a.order || 0) - (b.order || 0));
    await Promise.all(newPages.map(p => savePageDataDB(p.id, p.title, p.content || "", p.menuTitle, p.inMainMenu, p.order)));
    setPages(newPages);
    window.dispatchEvent(new CustomEvent('pagesUpdated'));
  };

  // 🌟 BLOCK MANAGEMENT FUNCTIONS
  const addBlock = (type: BlockType) => {
    const newBlock: EditorBlock = {
      id: generateId(), type,
      content: type === 'full' ? ['<p><br></p>'] : Array(parseInt(type[0])).fill('<p><br></p>')
    };
    setBlocks([...blocks, newBlock]);
  };

  const updateBlockContent = (blockId: string, colIndex: number, val: string) => {
    setBlocks(blocks.map(b => {
      if (b.id === blockId) {
        const newContent = [...b.content];
        newContent[colIndex] = val;
        return { ...b, content: newContent };
      }
      return b;
    }));
  };

  const deleteBlock = (index: number) => {
    if (blocks.length === 1) return;
    const newBlocks = [...blocks];
    newBlocks.splice(index, 1);
    setBlocks(newBlocks);
  };

  const moveBlockUp = (index: number) => {
    if (index === 0) return;
    const newBlocks = [...blocks];
    [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
    setBlocks(newBlocks);
  };

  const moveBlockDown = (index: number) => {
    if (index === blocks.length - 1) return;
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
    setBlocks(newBlocks);
  };

  useEffect(() => {
    setFilteredPages(filterMainMenu ? pages.filter((page) => page.inMainMenu) : pages);
  }, [pages, filterMainMenu]);

  if (loading) return <div className="flex justify-center items-center h-96"><div className="text-lg">Caricamento editor...</div></div>;
  if (!currentPage) return <div className="flex justify-center items-center h-96"><div className="text-lg">Nessuna pagina trovata...</div></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Editor Pagine</h1>
          <p className="text-muted-foreground mt-2">Modifica i contenuti delle pagine del sito in stile Block-Editor</p>
        </div>
        <div className="flex space-x-2">
          <div className="flex items-center space-x-2">
            <Label htmlFor="filter-main-menu">Solo menu principale</Label>
            <Switch id="filter-main-menu" checked={filterMainMenu} onCheckedChange={setFilterMainMenu} />
          </div>
          <Dialog open={newPageDialog} onOpenChange={setNewPageDialog}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Nuova Pagina</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Crea nuova pagina</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="page-title">Titolo della pagina</Label>
                  <Input id="page-title" value={newPageTitle} onChange={(e) => setNewPageTitle(e.target.value)} placeholder="Inserisci il titolo" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewPageDialog(false)}>Annulla</Button>
                <Button onClick={handleAddPage}>Crea Pagina</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue={currentPage.id} className="space-y-4">
        <TabsList className="flex overflow-x-auto pb-px">
          {filteredPages.map((page) => (
            <TabsTrigger key={page.id} value={page.id} onClick={() => setCurrentPage(page)} className="flex items-center space-x-2">
              <span>{page.title}</span>
              {page.inMainMenu && <span className="ml-1 text-xs bg-[var(--color-primary-100)] text-[var(--color-primary)] px-1.5 py-0.5 rounded-full">Menu</span>}
            </TabsTrigger>
          ))}
        </TabsList>

        {filteredPages.map((page) => (
          <TabsContent key={page.id} value={page.id} className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  {editingTitle && currentPage.id === page.id ? (
                    <Input value={tempTitle} onChange={(e) => setTempTitle(e.target.value)} onBlur={handleTitleSave} onKeyDown={handleTitleKeyDown} className="text-xl font-semibold" autoFocus />
                  ) : (
                    <CardTitle className="flex items-center space-x-2">
                      <span>{page.title}</span>
                      <button onClick={handleTitleEdit} className="text-gray-500 hover:text-gray-700"><Edit className="h-4 w-4" /></button>
                    </CardTitle>
                  )}
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleToggleMainMenu(page.id)}>{page.inMainMenu ? "Rimuovi dal Menu" : "Aggiungi al Menu"}</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeletePage(page.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <CardDescription>ID: {page.id} - Costruisci la pagina aggiungendo righe e colonne</CardDescription>
              </CardHeader>

              <CardContent>
                {/* 🌟 BLOCK EDITOR UI (WordPress Gutenberg Style) */}
                <div className="space-y-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {blocks.map((block, index) => (
                    <div key={block.id} className="relative border-2 border-transparent hover:border-primary/30 p-3 bg-white rounded-lg shadow-sm transition-all group">
                      
                      {/* Block Controls */}
                      <div className="absolute -top-3 right-4 opacity-0 group-hover:opacity-100 flex gap-1 bg-white border border-gray-200 shadow-md rounded-md p-1 z-10 transition-opacity">
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-500" onClick={() => moveBlockUp(index)} disabled={index === 0}><ArrowUp className="h-4 w-4"/></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-500" onClick={() => moveBlockDown(index)} disabled={index === blocks.length - 1}><ArrowDown className="h-4 w-4"/></Button>
                        <div className="w-px h-5 bg-gray-200 my-auto mx-1"></div>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:bg-red-50" onClick={() => deleteBlock(index)} disabled={blocks.length === 1}><Trash2 className="h-4 w-4"/></Button>
                      </div>

                      {/* Block Editors */}
                      {block.type === 'full' && (
                        <BlockEditorQuill value={block.content[0]} onChange={(val) => updateBlockContent(block.id, 0, val)} />
                      )}
                      {block.type !== 'full' && (
                        <div className="flex flex-col md:flex-row gap-4 w-full">
                          {block.content.map((colContent, colIndex) => (
                            <div className="flex-1 min-w-0 border-l-4 border-slate-100 pl-2" key={colIndex}>
                              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Colonna {colIndex + 1}</span>
                              <BlockEditorQuill value={colContent} onChange={(val) => updateBlockContent(block.id, colIndex, val)} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add Block Toolbar */}
                  <div className="flex flex-col items-center gap-3 pt-6 pb-2">
                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Aggiungi nuova sezione</span>
                    <div className="flex flex-wrap gap-2 items-center bg-white p-2 shadow-sm border border-gray-200 rounded-full">
                      <Button variant="ghost" className="rounded-full hover:bg-primary/10 hover:text-primary" onClick={() => addBlock('full')}>
                        <LayoutTemplate className="h-4 w-4 mr-2" /> Sezione Unica
                      </Button>
                      <div className="w-px h-6 bg-gray-200"></div>
                      <Button variant="ghost" className="rounded-full hover:bg-primary/10 hover:text-primary" onClick={() => addBlock('2-col')}>
                        <Columns className="h-4 w-4 mr-2" /> 2 Colonne
                      </Button>
                      <Button variant="ghost" className="rounded-full hover:bg-primary/10 hover:text-primary" onClick={() => addBlock('3-col')}>
                        <Columns className="h-4 w-4 mr-2" /> 3 Colonne
                      </Button>
                      <Button variant="ghost" className="rounded-full hover:bg-primary/10 hover:text-primary" onClick={() => addBlock('4-col')}>
                        <Columns className="h-4 w-4 mr-2" /> 4 Colonne
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between border-t pt-6 mt-2">
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => { handleSave(); window.open(`/${currentPage.id}`, '_blank'); }}>
                    <Eye className="h-4 w-4 mr-2" /> Anteprima
                  </Button>
                  <Button onClick={handleSave} className="px-8 shadow-md">
                    <Save className="h-4 w-4 mr-2" /> Salva Pagina
                  </Button>
                </div>
                <div className="space-x-2 flex items-center">
                  <Label>Titolo nel menu:</Label>
                  <Input
                    value={page.menuTitle || page.title}
                    onChange={(e) => {
                      const newMenuTitle = e.target.value;
                      setPages(pages.map((p) => p.id === page.id ? { ...p, menuTitle: newMenuTitle } : p));
                      if (currentPage.id === page.id) setCurrentPage({ ...currentPage, menuTitle: newMenuTitle });
                      savePageDataDB(page.id, page.title, blocksToHtml(blocks), newMenuTitle, page.inMainMenu, page.order).then(() => window.dispatchEvent(new CustomEvent('pagesUpdated')));
                    }}
                    className="inline-block w-48"
                  />
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default PageEditor;