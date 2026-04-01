import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserDetails, AdminUser } from '@/services/adminService';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save, User, Clock, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { API_BASE_URL } from '@/config/api';

const CustomerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [customer, setCustomer] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    full_name: '',
    email: '',
    role: ''
  });

  // 🌟 FIX 9.4: Plan states
  const [plans, setPlans] = useState<any[]>([]);
  const [subData, setSubData] = useState({ plan_id: '', expires_at: '', status: 'active' });

  useEffect(() => {
    fetchCustomerDetails();
  }, [id]);

  const fetchCustomerDetails = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      const userData = await getUserDetails(id);
      
      setCustomer(userData);
      setFormData({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        full_name: userData.full_name || '',
        email: userData.email,
        role: userData.role
      });
      
      // 🌟 Fetch available plans
      const plansRes = await fetch(`${API_BASE_URL}/plans/admin/all`);
      const plansJson = await plansRes.json();
      if (plansJson.success) setPlans(plansJson.data);

      // 🌟 Fetch user's current subscription
      const subRes = await fetch(`${API_BASE_URL}/users/${id}/subscription`);
      if (subRes.ok) {
        const subJson = await subRes.json();
        if (subJson.success && subJson.data) {
          setSubData({
            plan_id: subJson.data.planId,
            expires_at: subJson.data.expires_at ? new Date(subJson.data.expires_at).toISOString().split('T')[0] : '',
            status: subJson.data.status
          });
        }
      }
      
    } catch (error) {
      console.error('Error fetching customer details:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare i dettagli del cliente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSaveChanges = async () => {
    if (!id) return;
    
    try {
      setSaving(true);
      
      // 🌟 FIX 9.4: Save Subscription Changes
      if (subData.plan_id) {
        await fetch(`${API_BASE_URL}/users/${id}/subscription`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            plan_id: subData.plan_id,
            expires_at: subData.expires_at ? new Date(subData.expires_at).toISOString() : null,
            status: subData.status
          })
        });
      }

      toast({
        title: 'Salvato',
        description: 'Dettagli cliente e piano salvati con successo.',
      });
      
      fetchCustomerDetails();
    } catch (error) {
      console.error('Error saving customer details:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile salvare i dettagli del cliente.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="flex justify-center p-10">Caricamento...</div>;
  }

  if (!customer) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => navigate('/admin/users')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Torna alla lista
          </Button>
        </div>
        <Card>
          <CardContent className="flex justify-center p-10">
            Cliente non trovato
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => navigate('/admin/users')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Torna alla lista
          </Button>
        </div>
        <h1 className="text-2xl font-bold">Dettagli Cliente</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            Profilo
          </TabsTrigger>
          <TabsTrigger value="forms" className="flex items-center">
            <FileText className="mr-2 h-4 w-4" />
            Form Compilati
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Informazioni Profilo</CardTitle>
              <CardDescription>
                Gestisci i dettagli personali del cliente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between">
                <div>
                  <h3 className="text-lg font-medium">
                    {formData.first_name || formData.last_name 
                      ? `${formData.first_name} ${formData.last_name}`
                      : 'Cliente'}
                  </h3>
                  <p className="text-muted-foreground">{formData.email}</p>
                </div>
                <div>
                  <Badge variant="outline">ID: {customer.id.substring(0, 8)}</Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome Completo</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Ruolo</Label>
                  <Input
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    disabled
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Informazioni Account</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Registrazione:</p>
                    <p>{formatDate(customer.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ultimo accesso:</p>
                    <p>{formatDate(customer.last_login)}</p>
                  </div>
                </div>
              </div>

              {/* 🌟 FIX 9.4: Change Plan & Deadline UI */}
              <div className="space-y-4 border-t pt-4 mt-6">
                <h4 className="font-medium text-lg">Informazioni sul piano</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Piano Selezionato</Label>
                    <Select value={subData.plan_id} onValueChange={(val) => setSubData({...subData, plan_id: val})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona un piano" />
                      </SelectTrigger>
                      <SelectContent>
                        {plans.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Scadenza (Deadline)</Label>
                    <Input 
                      type="date" 
                      value={subData.expires_at} 
                      onChange={(e) => setSubData({...subData, expires_at: e.target.value})} 
                    />
                    <p className="text-xs text-muted-foreground">Lascia vuoto per accesso a vita.</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveChanges} disabled={saving} className="ml-auto">
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Salvataggio...' : 'Salva Modifiche'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="forms">
          <Card>
            <CardHeader>
              <CardTitle>Form Compilati</CardTitle>
              <CardDescription>
                Visualizza i form compilati da questo cliente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-10 text-muted-foreground">
                Funzionalità in sviluppo...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerDetails;