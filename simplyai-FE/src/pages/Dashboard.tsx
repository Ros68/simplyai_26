import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserProfile } from "@/components/dashboard/UserProfile";
import { UserReports } from "@/components/dashboard/UserReports";
import QuestionnaireView from "@/components/dashboard/QuestionnaireView";
import { UserSubscriptions } from "@/components/dashboard/UserSubscriptions";
import { User, FileText, LogOut, FileDown, Bell, Clock } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("questionnaire");

  useEffect(() => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Accesso richiesto",
        description: "Effettua il login per accedere alla dashboard",
      });
      navigate("/login");
    }
  }, [user, navigate, toast]);

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard Utente</h1>
        <Button
          variant="outline"
          onClick={signOut}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>

      <Tabs
        defaultValue={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="mb-6">
          <TabsTrigger
            value="questionnaire"
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            Questionari
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />I miei report
          </TabsTrigger>
          <TabsTrigger
            value="subscriptions"
            className="flex items-center gap-2"
          >
            <FileDown className="h-4 w-4" />
            Abbonamenti
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profilo
          </TabsTrigger>
        </TabsList>

        {/* Contenuto Questionario */}
        <TabsContent value="questionnaire">
          <QuestionnaireView />
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
  );
};

export default Dashboard;
