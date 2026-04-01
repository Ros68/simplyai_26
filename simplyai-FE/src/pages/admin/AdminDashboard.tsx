import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { dashboardService } from '@/services/dashboardService';
import { Link } from 'react-router-dom';
import { Users, FileText, BarChart2, Settings, LayoutGrid, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '@/config/api';

const RecentUserCard = ({ user }) => {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="flex items-center p-4 border rounded-lg mb-2">
      <div className="w-10 h-10 rounded-full bg-[var(--color-primary-300)] flex items-center justify-center text-white font-bold mr-4">
        {user.first_name ? user.first_name.charAt(0) : user.email ? user.email.charAt(0).toUpperCase() : 'U'}
      </div>
      <div className="flex-1">
        <h4 className="font-medium">
          {user.first_name && user.last_name
            ? `${user.first_name} ${user.last_name}`
            : user.email || 'Utente'}
        </h4>
        <p className="text-sm text-gray-500">
          Registrato: {formatDate(user.created_at)}
        </p>
        {user.email && (
          <p className="text-sm text-gray-400">{user.email}</p>
        )}
      </div>
      <Link to={`/admin/users?id=${user.id}`}>
        <Button variant="outline" size="sm">
          Dettagli
        </Button>
      </Link>
    </div>
  );
};

const AdminDashboard = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeQuestionnaires: 0,
    completedQuestionnaires: 0,
    totalReports: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentQuestionnaires, setRecentQuestionnaires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(false);
        
        console.log('🔄 Loading dashboard data from MySQL...');
        
        // 🌟 FIX 1: Fetch verified stats directly from the newly added backend API
        try {
          const statsRes = await fetch(`${API_BASE_URL}/admin/statistics/overview`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          const statsJson = await statsRes.json();
          if (statsJson.success) {
            setStats(statsJson.stats);
          }
        } catch (e) {
          console.error("Error with overview API, falling back...", e);
        }
        
        // Fetch recent users from MySQL
        try {
          const usersData = await dashboardService.getRecentUsers();
          setRecentUsers(usersData || []);
        } catch (userError) {
          setRecentUsers([]);
        }
        
        // Fetch recent questionnaire responses from MySQL
        try {
          const responsesData = await dashboardService.getRecentResponses();
          setRecentQuestionnaires(responsesData || []);
        } catch (responseError) {
          setRecentQuestionnaires([]);
        }
        
      } catch (error) {
        console.error('❌ Error fetching dashboard data:', error);
        setError(true);
        toast({
          title: 'Errore',
          description: 'Impossibile caricare i dati della dashboard dal database.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [toast]);

  if (loading) {
    return <div className="flex justify-center p-10">Caricamento...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Amministrazione</h1>
        <p className="text-muted-foreground mt-2">
          Benvenuto nel pannello di controllo SimolyAI
        </p>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md flex items-start mb-6">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5" />
          <div>
            <h3 className="font-medium">Errore di connessione al database</h3>
            <p className="text-sm">Impossibile caricare i dati dalla dashboard. Verificare la connessione MySQL.</p>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">{stats.totalUsers}</CardTitle>
            <CardDescription>Utenti Totali</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/admin/users">
              <Button variant="outline" className="w-full mt-2" size="sm">
                <Users className="mr-2 h-4 w-4" />
                Gestisci Utenti
              </Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">{stats.activeQuestionnaires}</CardTitle>
            <CardDescription>Questionari Attivi</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/admin/form-builder">
              <Button variant="outline" className="w-full mt-2" size="sm">
                <FileText className="mr-2 h-4 w-4" />
                Gestisci Form
              </Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">{stats.completedQuestionnaires}</CardTitle>
            <CardDescription>Questionari Completati</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/admin/form-builder">
              <Button variant="outline" className="w-full mt-2" size="sm">
                <LayoutGrid className="mr-2 h-4 w-4" />
                Form Builder
              </Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">{stats.totalReports}</CardTitle>
            <CardDescription>Report Generati</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/admin/reports">
              <Button variant="outline" className="w-full mt-2" size="sm">
                <BarChart2 className="mr-2 h-4 w-4" />
                Visualizza Report
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Ultimi Utenti</TabsTrigger>
          <TabsTrigger value="questionnaires">Ultimi Questionari</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Ultimi Utenti Registrati</CardTitle>
              <CardDescription>
                Gli utenti più recenti registrati sulla piattaforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentUsers.length > 0 ? (
                <div className="space-y-2">
                  {recentUsers.map((user) => (
                    <RecentUserCard key={user.id} user={user} />
                  ))}
                  <div className="mt-4 text-center">
                    <Link to="/admin/users">
                      <Button>Visualizza tutti gli utenti</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <p>Nessun utente registrato.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="questionnaires">
          <Card>
            <CardHeader>
              <CardTitle>Ultimi Questionari</CardTitle>
              <CardDescription>
                I questionari più recenti compilati dagli utenti
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentQuestionnaires.length > 0 ? (
                <div className="space-y-4">
                  {recentQuestionnaires.map((questionnaire) => (
                    <div key={questionnaire.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">
                          Questionario #{questionnaire.id.toString().substring(0, 8)}
                        </h4>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            questionnaire.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {questionnaire.status === 'completed' ? 'Completato' : 'Bozza'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
  {questionnaire.first_name && questionnaire.last_name 
    ? `${questionnaire.first_name} ${questionnaire.last_name}` 
    : questionnaire.email || `Utente ID: ${questionnaire.user_id?.toString().substring(0, 8) || 'Guest'}`}
</p>
                      <p className="text-sm text-gray-500">
                        Data: {new Date(questionnaire.created_at).toLocaleDateString('it-IT')}
                      </p>
                      {questionnaire.updated_at && questionnaire.updated_at !== questionnaire.created_at && (
                        <p className="text-sm text-gray-400">
                          Aggiornato: {new Date(questionnaire.updated_at).toLocaleDateString('it-IT')}
                        </p>
                      )}
                    </div>
                  ))}
                  <div className="mt-4 text-center">
                    <Link to="/admin/form-builder">
                      <Button>Visualizza tutti i questionari</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <p>Nessun questionario compilato.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Azioni Rapide</CardTitle>
            <CardDescription>
              Gestisci rapidamente le funzionalità principali
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/admin/users">
              <Button variant="outline" className="w-full justify-start" size="lg">
                <Users className="mr-2 h-5 w-5" />
                Gestione Utenti
              </Button>
            </Link>
            <Link to="/admin/page-editor">
              <Button variant="outline" className="w-full justify-start" size="lg">
                <FileText className="mr-2 h-5 w-5" />
                Editor Pagine
              </Button>
            </Link>
            <Link to="/admin/form-builder">
              <Button variant="outline" className="w-full justify-start" size="lg">
                <LayoutGrid className="mr-2 h-5 w-5" />
                Builder Form
              </Button>
            </Link>
            <Link to="/admin/settings">
              <Button variant="outline" className="w-full justify-start" size="lg">
                <Settings className="mr-2 h-5 w-5" />
                Impostazioni Sistema
              </Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Stato del Sistema</CardTitle>
            <CardDescription>
              Statistiche e informazioni sul sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="font-medium">Versione</span>
                <span>1.0.0</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="font-medium">Database MySQL</span>
                <span className={error ? "text-red-600" : "text-green-600"}>
                  {error ? "Errore di connessione" : "Online"}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="font-medium">Storage</span>
                <span className="text-green-600">Online</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="font-medium">Questionari</span>
                <span>{stats.activeQuestionnaires + stats.completedQuestionnaires} totali</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Report generati</span>
                <span>{stats.totalReports}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;