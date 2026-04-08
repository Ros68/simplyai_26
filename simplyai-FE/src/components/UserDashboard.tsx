import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { UserProfile } from "./dashboard/UserProfile";
import { UserReports } from "./dashboard/UserReports";
import { UserQuestionnaires } from "./dashboard/UserQuestionnaires";
import { UserSubscriptions } from "./dashboard/UserSubscriptions";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  User,
  FileText,
  LogOut,
  FileDown,
  CheckSquare,
  Menu,
} from "lucide-react";

const UserDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("questionnaires");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const savedToken = localStorage.getItem("auth_token");
    if (!savedToken) {
      navigate("/login");
      return;
    }

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [navigate]);

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
            <FileText className="mr-2 h-4 w-4" />
            I miei report
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
    return null;
  }

  return (
    // ✅ FIX: Correct structure — Navbar top, sidebar+content middle, Footer bottom
    <div className="min-h-screen flex flex-col">

      {/* Navbar — full width at top */}
      <Navbar />

      {/* Middle: sidebar + main content */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar — desktop only */}
        {!isMobile && (
          <div className="w-64 border-r bg-white shadow-sm flex-shrink-0 hidden md:block overflow-y-auto">
            <SidebarContent />
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Mobile header — hamburger + logout, hidden on desktop */}
          <header className="bg-white border-b py-2 px-4 flex justify-between items-center md:hidden">
            <div className="flex items-center space-x-2">
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

          {/* Main content area */}
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

              <TabsContent value="questionnaires">
                <UserQuestionnaires />
              </TabsContent>

              <TabsContent value="reports">
                <UserReports />
              </TabsContent>

              <TabsContent value="subscriptions">
                <UserSubscriptions />
              </TabsContent>

              <TabsContent value="profile">
                <UserProfile />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Footer — full width at bottom */}
      <Footer />
    </div>
  );
};

export default UserDashboard;