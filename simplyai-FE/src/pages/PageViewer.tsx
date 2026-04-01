import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchPageData, PageContent } from "@/services/pagesService";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const PageViewer = () => {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState<PageContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPage = async () => {
      if (!pageId) {
        navigate("/");
        return;
      }

      // Handle "home" specially - redirect to root
      if (pageId === "home") {
        navigate("/");
        return;
      }

      const data = await fetchPageData(pageId);
      if (data) {
        setPage(data);
      } else {
        // Page not found in database
        navigate("/404");
      }
      setLoading(false);
    };

    loadPage();
  }, [pageId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Caricamento...</div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Pagina non trovata</div>
      </div>
    );
  }

  return (
    // Yahan 'flex flex-col' add kiya hai
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      
      {/* Yahan 'flex-grow' add kiya hai taake ye empty space fill kare */}
      <main className="container mx-auto px-6 py-12 flex-grow">
        <div 
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: page.content || "" }}
        />
      </main>
      
      <Footer/>
    </div>
  );
};

export default PageViewer;