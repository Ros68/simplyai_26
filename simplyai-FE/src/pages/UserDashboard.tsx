import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { API_BASE_URL } from "@/config/api";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";

// Import originali della dashboard (importanti!)
import { UserProfile } from "./dashboard/UserProfile";
import { UserReports } from "./dashboard/UserReports";
import { UserQuestionnaires } from "./dashboard/UserQuestionnaires";
import { UserSubscriptions } from "./dashboard/UserSubscriptions";

import { LogOut, Menu } from "lucide-react";

// Import Footer
import Footer from "@/components/Footer";

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
      toast({ variant: "destructive", title: "Errore durante il logout" });
    }
  };

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar Desktop - Semplificata per evitare errori */}
      {!isMobile && (
        <div className="w-64 border-r bg-white shadow-sm h-screen hidden md:block p-4">
          <div className="flex flex-col h-full">
            {logoUrl && (
              <img src={logoUrl} alt="Logo" className="h-16 w-16 mx-auto mb-6 object-contain" />
            )}

            <div className="space-y-2">
              <Button variant={activeTab === "questionnaires" ? "default" : "ghost"} className="w-full justify-start" onClick={() => setActiveTab("questionnaires")}>
                Questionari
              </Button>
              <Button variant={activeTab === "reports" ? "default" : "ghost"} className="w-full justify-start" onClick={() => setActiveTab("reports")}>
                I miei report
              </Button>
              <Button variant={activeTab === "subscriptions" ? "default" : "ghost"} className="w-full justify-start" onClick={() => setActiveTab("subscriptions")}>
                Abbonamenti
              </Button>
              <Button variant={activeTab === "profile" ? "default" : "ghost"} className="w-full justify-start" onClick={() => setActiveTab("profile")}>
                Profilo
              </Button>
            </div>

            <div className="mt-auto pt-6">
              <Button variant="outline" onClick={handleLogout} className="w-full">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Contenuto principale */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Mobile */}
        <header className="bg-white border-b p-4 flex justify-end md:hidden">
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </header>

        {/* Tabs Content */}
        <div className="flex-1 overflow-auto p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
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

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default UserDashboard;
