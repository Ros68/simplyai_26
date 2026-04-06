import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
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
} from "lucide-react";

import Footer from "@/components/Footer";   // ← Import aggiunto

const UserDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("questionnaires");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    const savedToken = localStorage.getItem("auth_token");
    if (!savedToken) {
      return navigate("/login");
    }

    const loadSettings = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/settings`);
        const result = await response.json();

        if (result.success && result.data?.logo) {
          setLogoUrl(result.data.logo);
        }
      } catch (error) {
        console.error("Errore nel caricamento delle impostazioni:", error);
      }
    };

    if (user) loadSettings();

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [user, navigate]);

  const handleLogout = async () => {
    try {
      await signOut();
      toast({ title: "Logout effettuato" });
      navigate("/login");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Errore durante il logout",
      });
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center space-x-3 p-4 border-b">
        {logoUrl && (
          <Link to="/" className="flex items-center space-x-2 hover:opacity-90">
            <img src={logoUrl} alt="Logo" className="h-24 w-24 rounded-lg object-contain" />
          </Link>
        )}
      </div>

      <div className="border-t my-4" />

      <div className="flex flex-col space-y-1 p-2">
        <Link to="/dashboard" onClick={() => setActiveTab("questionnaires")}>
          <Button variant={activeTab === "questionnaires" ? "default" : "ghost"} className="w-full justify-start">
            <CheckSquare className="mr-2 h-4 w-4" />
            Questionari
          </Button>
        </Link>
        <Link to="/dashboard" onClick={() => setActiveTab("reports")}>
          <Button variant={activeTab === "reports" ? "default" : "ghost"} className="w-full justify-start">
            <FileText className="mr-2 h-4 w-4" />
            I miei report
          </Button>
        </Link>
        <Link to="/dashboard" onClick={() => setActiveTab("subscriptions")}>
          <Button variant={activeTab === "subscriptions" ? "default" : "ghost"} className="w-full justify-start">
            <FileDown className="mr-2 h-4 w-4" />
            Abbonamenti
          </Button>
        </Link>
        <Link to="/dashboard" onClick={() => setActiveTab("profile")}>
          <Button variant={activeTab === "profile" ? "default" : "ghost"} className="w-full justify-start">
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

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar Desktop */}
      {!isMobile && (
        <div className="w-64 border-r bg-white shadow-sm h-screen hidden md:block">
          <SidebarContent />
        </div>
      )}

      {/* Contenuto principale */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Mobile */}
        <header className="bg-white border-b py-2 px-4 flex justify-between items-center md:hidden">
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
          </div>

          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </header>

        {/* Area contenuto scrollabile */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="questionnaires">Questionari</TabsTrigger>
              <TabsTrigger value="reports">I miei report</TabsTrigger>
              <TabsTrigger value="subscriptions">Abbonamenti</TabsTrigger>
              <TabsTrigger value="profile">Profilo</TabsTrigger>
            </TabsList>

            <TabsContent value="questionnaires"><UserQuestionnaires /></TabsContent>
            <TabsContent value="reports"><UserReports /></TabsContent>
            <TabsContent value="subscriptions"><UserSubscriptions /></TabsContent>
            <TabsContent value="profile"><UserProfile /></TabsContent>
          </Tabs>
        </div>

        {/* Footer - Aggiunto in modo sicuro */}
        <Footer />
      </div>
    </div>
  );
};

export default UserDashboard;
