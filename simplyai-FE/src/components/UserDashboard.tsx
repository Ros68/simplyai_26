import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { API_BASE_URL } from "@/config/api";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { UserProfile } from "./dashboard/UserProfile";
import { UserReports } from "./dashboard/UserReports";
import { UserQuestionnaires } from "./dashboard/UserQuestionnaires";
import { UserSubscriptions } from "./dashboard/UserSubscriptions";
import {
  User,
  FileText,
  LogOut,
  FileDown,
  CheckSquare,
  Menu,
  Home,
} from "lucide-react";

const UserDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("questionnaires");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    // Verifica se l'utente è autenticato
    // if (!user) {
    //   toast({
    //     variant: "destructive",
    //     title: "Accesso richiesto",
    //     description: "Effettua il login per accedere alla dashboard",
    //   });
    //   navigate("/login");
    // }

    // useEffect(() => {
    const savedToken = localStorage.getItem("auth_token");
    if (!savedToken) {
      return navigate("/login");
    }
    // }, []);

    // Carica le impostazioni dell'applicazione
    const loadSettings = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/settings`);
        const result = await response.json();

        if (result.success && result.data) {
          if (result.data.logo) {
            setLogoUrl(result.data.logo);
          }
        }
      } catch (error) {
        console.error("Errore nel caricamento delle impostazioni:", error);
      }
    };

    if (user) {
      loadSettings();
    }

    // Gestione responsive
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [user, navigate, toast]);

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logout effettuato",
        description: "Hai effettuato il logout con successo",
      });
      navigate("/login");
    } catch (error) {
      console.error("Errore durante il logout:", error);
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Si è verificato un errore durante il logout",
      });
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center space-x-3 p-4 border-b">
        <div className="flex items-center space-x-3 p-4 border-b">
          {logoUrl && (
            <Link
              to="/"
              className="flex items-center space-x-2 hover:opacity-90 transition-opacity"
            >
              <img
                src={logoUrl}
                alt="Logo"
                className="h-24 w-24 cursor-pointer rounded-lg object-contain hover:scale-105 transition-transform duration-200"
              />
            </Link>
          )}
        </div>
      </div>
      {/* <div className="flex flex-col space-y-1 p-2 mt-4">
        <Link to="/">
          <Button variant="ghost" className="w-full justify-start">
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
        </Link>
        <Link to="/about">
          <Button variant="ghost" className="w-full justify-start">
            <User className="mr-2 h-4 w-4" />
            Chi Siamo
          </Button>
        </Link>
        <Link to="/guide">
          <Button variant="ghost" className="w-full justify-start">
            <FileText className="mr-2 h-4 w-4" />
            Guida
          </Button>
        </Link>
        <Link to="/pricing">
          <Button variant="ghost" className="w-full justify-start">
            <FileDown className="mr-2 h-4 w-4" />
            Prezzi
          </Button>
        </Link>
        <Link to="/contact">
          <Button variant="ghost" className="w-full justify-start">
            <Menu className="mr-2 h-4 w-4" />
            Contatti
          </Button>
        </Link>
      </div> */}
      <div className="border-t my-4"></div>
      <div className="flex flex-col space-y-1 p-2">
        <Link to="/dashboard">
          <Button
            variant={activeTab === "questionnaires" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("questionnaires")}
          >
            <CheckSquare className="mr-2 h-4 w-4" />
            Questionari
          </Button>
        </Link>
        <Link to="/dashboard">
          <Button
            variant={activeTab === "reports" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("reports")}
          >
            <FileText className="mr-2 h-4 w-4" />I miei report
          </Button>
        </Link>
        <Link to="/dashboard">
          <Button
            variant={activeTab === "subscriptions" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("subscriptions")}
          >
            <FileDown className="mr-2 h-4 w-4" />
            Abbonamenti
          </Button>
        </Link>
        <Link to="/dashboard">
          <Button
            variant={activeTab === "profile" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("profile")}
          >
            <User className="mr-2 h-4 w-4" />
            Profilo
          </Button>
        </Link>
      </div>
      <div className="mt-auto p-4">
        <Button variant="outline" onClick={handleLogout} className="w-full">
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );

  if (!user) {
    return null; // Non renderizzare nulla se l'utente non è autenticato
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar per desktop */}
      {!isMobile && (
        <div className="w-64 border-r bg-white shadow-sm h-screen hidden md:block">
          <SidebarContent />
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header mobile */}
        <header className="bg-white border-b py-2 px-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            {isMobile && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0">
                  <SidebarContent />
                </SheetContent>
              </Sheet>
            )}

            {/* <div className="flex items-center">
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-10 w-auto cursor-pointer rounded-lg object-contain hover:scale-105 transition-transform duration-200"
                />
              )}
            </div> */}
          </div>

          <div className="flex items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </header>

        {/* Contenuto principale */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="mb-6">
              <TabsTrigger value="questionnaires">Questionari</TabsTrigger>
              <TabsTrigger value="reports">I miei report</TabsTrigger>
              <TabsTrigger value="subscriptions">Abbonamenti</TabsTrigger>
              <TabsTrigger value="profile">Profilo</TabsTrigger>
            </TabsList>

            {/* Contenuto Questionari */}
            <TabsContent value="questionnaires">
              <UserQuestionnaires />
            </TabsContent>

            {/* Contenuto Report */}
            <TabsContent value="reports">
              <UserReports />
            </TabsContent>

            {/* Contenuto Abbonamenti */}
            <TabsContent value="subscriptions">
              <UserSubscriptions />
            </TabsContent>

            {/* Contenuto Profilo */}
            <TabsContent value="profile">
              <UserProfile />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;