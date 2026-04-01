import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchPageData } from '@/services/pagesService';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PagePreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pageContent, setPageContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPage = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Try to fetch from API first
        const data = await fetchPageData(id || '');
        
        if (data && data.content) {
          setPageContent(data);
        } else {
          // Fallback to local pages
          const pages = [
            { 
              id: 'home', 
              title: 'Home Page', 
              content: '<h1>Benvenuto</h1><p>Questa è la home page del sito.</p><img src="https://picsum.photos/800/400" alt="Immagine di esempio" /><p>SimolyAI offre strumenti avanzati per l\'analisi dei dati e la creazione di report interattivi.</p>' 
            },
            { 
              id: 'about', 
              title: 'Chi Siamo', 
              content: '<h1>Chi Siamo</h1><p>SimolyAI è un\'azienda innovativa nel campo dell\'intelligenza artificiale.</p><div class="team-section"><img src="https://picsum.photos/200/200" alt="Team member" /><h3>Mario Rossi</h3><p>CEO & Founder</p></div>' 
            },
            { 
              id: 'contact', 
              title: 'Contatti', 
              content: '<h1>Contattaci</h1><p>Siamo disponibili per qualsiasi informazione.</p><form><div><label>Nome:</label><input type="text" /></div><div><label>Email:</label><input type="email" /></div><div><label>Messaggio:</label><textarea></textarea></div><button>Invia</button></form>' 
            },
            { 
              id: 'guide', 
              title: 'Guida', 
              content: '<h1>Guida Utente</h1><p>Ecco come utilizzare i nostri servizi:</p><ol><li>Registrati sul sito</li><li>Compila il questionario iniziale</li><li>Visualizza i tuoi report personalizzati</li></ol>' 
            }
          ];
          
          const page = pages.find(p => p.id === id);
          if (page) {
            setPageContent(page);
          } else {
            setError('Pagina non trovata');
          }
        }
      } catch (err) {
        console.error('Error loading page:', err);
        setError('Errore nel caricamento della pagina');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadPage();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Caricamento anteprima...</div>
      </div>
    );
  }

  if (error || !pageContent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-lg text-red-600 mb-4">{error || 'Pagina non trovata'}</div>
        <Button onClick={() => navigate('/admin/page-editor')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Torna all'Editor
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Preview Bar */}
      <div className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/admin/page-editor')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Torna all'Editor
            </Button>
            <span className="text-sm text-gray-600">
              Anteprima: <span className="font-semibold">{pageContent.title}</span>
            </span>
          </div>
          <div className="text-xs text-gray-500">
            ID: {pageContent.id}
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="container mx-auto px-4 py-8">
        <div 
          className="bg-white rounded-lg shadow-lg p-8"
          dangerouslySetInnerHTML={{ __html: pageContent.content }}
        />
      </div>
    </div>
  );
};

export default PagePreview;