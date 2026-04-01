import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/useAuth";
import { fetchAllPages } from "@/services/pagesService";
import { LogOut } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext"; 

interface Page {
  id: string;
  title: string;
  menuTitle: string;
  inMainMenu: boolean;
  order: number;
}

const Navbar = () => {
  const { user, signOut } = useAuth();
  const { settings } = useSettings(); 
  const [menuPages, setMenuPages] = useState<Page[]>([]);

  const siteName = settings?.site_name || "";
  const logoUrl = settings?.logo || "";

  const loadPages = async () => {
    const pages = await fetchAllPages();
    const menuItems = pages
      .filter((p) => p.inMainMenu !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    setMenuPages(menuItems);
  };

  useEffect(() => {
    loadPages();
    const handlePagesUpdate = () => { loadPages(); };
    window.addEventListener("pagesUpdated", handlePagesUpdate);

    return () => {
      window.removeEventListener("pagesUpdated", handlePagesUpdate);
    };
  }, []);

  const getPageLink = (pageId: string) => {
    if (pageId === "home") return "/";
    return `/${pageId}`;
  };

  return (
    <nav className="w-full py-3 px-6 flex justify-between items-center border-b border-gray-100">
      <div className="flex items-center">
        <Link to="/" className="flex items-center">
          {logoUrl && (
            <img
              src={logoUrl}
              alt={siteName}
              className="h-24 w-24 mr-3 rounded-lg object-contain site-logo"
            />
          )}
        </Link>

        <div className="hidden md:flex ml-10 space-x-8">
          {menuPages.map((page) => (
            <Link
              key={page.id}
              to={getPageLink(page.id)}
              className="text-gray-600 hover:text-[var(--color-primary)] transition-colors"
            >
              {page.menuTitle || page.title}
            </Link>
          ))}
        </div>
      </div>

      <div className="space-x-2">
        {user ? (
          <div className="flex space-x-2">
            <Link to="/dashboard">
              <Button>Dashboard</Button>
            </Link>
            <Link to="/profile">
              <Button>Account</Button>
            </Link>
            <Button
              onClick={() => {
                if (window.confirm("Sei sicuro di voler uscire?")) signOut();
              }}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        ) : (
          <div className="flex space-x-2">
            <Link to="/login">
              <Button>Accedi</Button>
            </Link>
            {/* FIX 6.1: Registrati button removed as per client request */}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;