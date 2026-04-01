import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  UserPlus,
  User,
  UsersRound,
  Loader2,
  Download,
  Mail,
  Filter,
  X,
} from "lucide-react";
import {
  fetchAllUsers,
  deleteUser,
  updateUserRole,
  AdminUser,
  createUser,
  CreateUserData,
  getAllUsersQuestionnaireProgress,
  QuestionnaireProgress,
  sendDeadlineReminders,
} from "@/services/adminService";

const AdminUserManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [questionnaireProgress, setQuestionnaireProgress] = useState<
    Record<string, QuestionnaireProgress>
  >({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchKey, setSearchKey] = useState(0);

  // Filter states
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planStatusFilter, setPlanStatusFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const [selectedUserForRole, setSelectedUserForRole] =
    useState<AdminUser | null>(null);
  const [selectedUserForDelete, setSelectedUserForDelete] =
    useState<AdminUser | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [newUserData, setNewUserData] = useState<CreateUserData>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "user",
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const dbUsers = await fetchAllUsers();
      let progressData = {};
      try {
        progressData = await getAllUsersQuestionnaireProgress();
      } catch (progressError) {
        console.warn("Could not load questionnaire progress data:", progressError);
      }

      const usersWithProgress = dbUsers.map((user) => ({
        ...user,
        planStatus: progressData[user.id] || {
          totalQuestionnaires: 0,
          completedQuestionnaires: 0,
          percentage: 0,
        },
      }));

      setUsers(usersWithProgress);
      setQuestionnaireProgress(progressData);
    } catch (error) {
      console.error("Error loading users:", error);
      toast({
        title: "Errore",
        description: "Impossibile caricare gli utenti.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = search.toLowerCase();
    const fullName =
      user.full_name ||
      `${user.first_name || ""} ${user.last_name || ""}`.trim();

    const matchesSearch =
      user.email.toLowerCase().includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower) ||
      fullName.toLowerCase().includes(searchLower);

    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && user.last_login) ||
      (statusFilter === "inactive" && !user.last_login);

    const matchesPlanStatus = (() => {
      if (planStatusFilter === "all") return true;
      const progress = user.planStatus;
      if (!progress || progress.totalQuestionnaires === 0) {
        return planStatusFilter === "no_plan";
      }
      if (planStatusFilter === "completed" && progress.percentage === 100)
        return true;
      if (
        planStatusFilter === "in_progress" &&
        progress.percentage > 0 &&
        progress.percentage < 100
      )
        return true;
      if (planStatusFilter === "not_started" && progress.percentage === 0)
        return true;
      return false;
    })();

    return matchesSearch && matchesRole && matchesStatus && matchesPlanStatus;
  });

  const exportToCSV = () => {
    const headers = [
      "Nome", "Email", "Ruolo", "Stato", "Piano Completamento %",
      "Questionari Completati", "Questionari Totali", "Nome Piano",
      "Data Registrazione", "Ultima Attività",
    ];

    const csvData = filteredUsers.map((user) => {
      const progress = user.planStatus;
      return [
        user.full_name || `${user.first_name || ""} ${user.last_name || ""}`.trim() || "N/A",
        user.email,
        user.role,
        user.last_login ? "Attivo" : "Inattivo",
        progress ? progress.percentage.toFixed(0) : "0",
        progress ? progress.completedQuestionnaires : "0",
        progress ? progress.totalQuestionnaires : "0",
        progress?.planName || "Nessun piano",
        new Date(user.created_at).toLocaleDateString("it-IT"),
        user.last_login ? new Date(user.last_login).toLocaleDateString("it-IT") : "Mai",
      ];
    });

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `utenti_export_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ title: "Export completato", description: `${filteredUsers.length} utenti esportati con successo.` });
  };

  const sendDeadlineEmails = async () => {
    try {
      const usersWithDeadlines = filteredUsers.filter((user) => {
        const progress = user.planStatus;
        return progress && progress.totalQuestionnaires > 0 && progress.percentage < 100;
      });

      if (usersWithDeadlines.length === 0) {
        toast({ title: "Nessun utente trovato", description: "Non ci sono utenti con piani incompleti." });
        return;
      }

      toast({ title: "Email in invio...", description: `Invio promemoria a ${usersWithDeadlines.length} utenti.` });
      const result = await sendDeadlineReminders(usersWithDeadlines.map((u) => u.id));

      if (!result.success) throw new Error(result.message || "Failed to send emails");

      toast({ title: "Email inviate", description: `Promemoria inviati a ${result.data.emailsSent} utenti con successo.` });
      setEmailDialogOpen(false);
    } catch (error) {
      toast({ title: "Errore", description: "Impossibile inviare le email di promemoria.", variant: "destructive" });
    }
  };

  const clearFilters = () => {
    setRoleFilter("all"); setStatusFilter("all"); setPlanStatusFilter("all");
    setSearch(""); setSearchKey((prev) => prev + 1);
    if (searchInputRef.current) searchInputRef.current.value = "";
  };

  const activeFiltersCount = (roleFilter !== "all" ? 1 : 0) + (statusFilter !== "all" ? 1 : 0) + (planStatusFilter !== "all" ? 1 : 0);

  const handleRoleChange = async () => {
    if (selectedUserForRole && newRole) {
      try {
        await updateUserRole(selectedUserForRole.id, newRole);
        const updatedUsers = users.map((user) => user.id === selectedUserForRole.id ? { ...user, role: newRole } : user);
        setUsers(updatedUsers);
        toast({ title: "Ruolo aggiornato", description: `Il ruolo di ${selectedUserForRole.email} è stato cambiato in ${newRole}.` });
        setRoleDialogOpen(false); setSelectedUserForRole(null); setNewRole("");
      } catch (error) {
        toast({ title: "Errore", description: "Impossibile aggiornare il ruolo dell'utente.", variant: "destructive" });
      }
    }
  };

  const handleDeleteUser = async () => {
    if (selectedUserForDelete) {
      try {
        await deleteUser(selectedUserForDelete.id);
        const updatedUsers = users.filter((user) => user.id !== selectedUserForDelete.id);
        setUsers(updatedUsers);
        toast({ title: "Utente eliminato", description: `${selectedUserForDelete.email} è stato eliminato con successo.` });
        setDeleteDialogOpen(false); setSelectedUserForDelete(null);
      } catch (error) {
        toast({ title: "Errore", description: "Impossibile eliminare l'utente.", variant: "destructive" });
      }
    }
  };

  const handleCreateUser = async () => {
    try {
      if (!newUserData.email || !newUserData.password || !newUserData.firstName || !newUserData.lastName) {
        toast({ title: "Errore", description: "Tutti i campi sono obbligatori.", variant: "destructive" });
        return;
      }
      const createdUser = await createUser(newUserData);
      setUsers([...users, createdUser]);
      setSearch(""); setSearchKey((prev) => prev + 1);
      if (searchInputRef.current) searchInputRef.current.value = "";
      toast({ title: "Utente creato", description: `${createdUser.email} è stato creato con successo.` });
      setCreateUserDialogOpen(false);
      setNewUserData({ email: "", password: "", firstName: "", lastName: "", role: "user" });
    } catch (error) {
      toast({ title: "Errore", description: "Impossibile creare l'utente.", variant: "destructive" });
    }
  };

  const goToUserDetails = (userId: string) => navigate(`/admin/users/${userId}`);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "administrator": return "bg-red-100 text-red-800";
      case "premium_user": return "bg-purple-100 text-purple-800";
      case "user": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "administrator": return "Amministratore";
      case "premium_user": return "Utente Premium";
      case "user": return "Utente";
      default: return role;
    }
  };

  const renderPlanStatus = (planStatus?: QuestionnaireProgress) => {
    if (!planStatus || planStatus.totalQuestionnaires === 0) return <div className="text-center"><span className="text-gray-500 text-sm">Nessun piano</span></div>;
    const { completedQuestionnaires, totalQuestionnaires, percentage, planName } = planStatus;
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">{completedQuestionnaires}/{totalQuestionnaires}</span>
          <span className="font-medium">{percentage.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className={`h-2 rounded-full transition-all duration-300 ${percentage === 100 ? "bg-green-500" : percentage >= 50 ? "bg-blue-500" : percentage > 0 ? "bg-yellow-500" : "bg-gray-300"}`} style={{ width: `${percentage}%` }}></div>
        </div>
        {planName && <div className="text-xs text-gray-500 truncate" title={planName}>{planName}</div>}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Caricamento utenti...</span>
      </div>
    );
  }

  const usersWithIncompletePlans = filteredUsers.filter((user) => {
    const progress = user.planStatus;
    return progress && progress.totalQuestionnaires > 0 && progress.percentage < 100;
  });

  return (
    <div className="space-y-6 w-full max-w-full">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Gestione Utenti</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gestisci gli utenti della piattaforma ({filteredUsers.length} di {users.length})
          </p>
        </div>
        <Dialog open={createUserDialogOpen} onOpenChange={setCreateUserDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto">
              <UserPlus className="h-4 w-4 mr-2" /> Aggiungi Utente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
            {/* Same Create User Modal Content */}
            <DialogHeader>
              <DialogTitle>Crea Nuovo Utente</DialogTitle>
              <DialogDescription>Inserisci i dettagli del nuovo utente. Tutti i campi sono obbligatori.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <label className="sm:text-right font-medium">Nome</label>
                <Input value={newUserData.firstName} onChange={(e) => setNewUserData({ ...newUserData, firstName: e.target.value })} className="sm:col-span-3" placeholder="Nome" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <label className="sm:text-right font-medium">Cognome</label>
                <Input value={newUserData.lastName} onChange={(e) => setNewUserData({ ...newUserData, lastName: e.target.value })} className="sm:col-span-3" placeholder="Cognome" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <label className="sm:text-right font-medium">Email</label>
                <Input type="email" value={newUserData.email} onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })} className="sm:col-span-3" placeholder="email@esempio.com" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <label className="sm:text-right font-medium">Password</label>
                <Input type="password" value={newUserData.password} onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })} className="sm:col-span-3" placeholder="Password" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <label className="sm:text-right font-medium">Ruolo</label>
                <Select value={newUserData.role} onValueChange={(value) => setNewUserData({ ...newUserData, role: value as any })}>
                  <SelectTrigger className="sm:col-span-3"><SelectValue placeholder="Seleziona ruolo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Utente</SelectItem>
                    <SelectItem value="premium_user">Utente Premium</SelectItem>
                    <SelectItem value="administrator">Amministratore</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setCreateUserDialogOpen(false)} className="w-full sm:w-auto">Annulla</Button>
              <Button onClick={handleCreateUser} className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto">Crea Utente</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" onClick={exportToCSV} className="w-full sm:w-auto">
          <Download className="h-4 w-4 mr-2" /> Esporta CSV ({filteredUsers.length})
        </Button>

        <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto" disabled={usersWithIncompletePlans.length === 0}>
              <Mail className="h-4 w-4 mr-2" /> Invia Promemoria ({usersWithIncompletePlans.length})
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invia Promemoria Scadenza</DialogTitle>
              <DialogDescription>Invia un'email di promemoria a {usersWithIncompletePlans.length} utenti con piani incompleti.</DialogDescription>
            </DialogHeader>
            <div className="py-4"><p className="text-sm text-gray-600">Verrà inviata un'email automatica agli utenti che hanno questionari non completati.</p></div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>Annulla</Button>
              <Button onClick={sendDeadlineEmails}><Mail className="h-4 w-4 mr-2" /> Invia Email</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button variant={showFilters ? "default" : "outline"} onClick={() => setShowFilters(!showFilters)} className="w-full sm:w-auto">
          <Filter className="h-4 w-4 mr-2" /> Filtri
          {activeFiltersCount > 0 && <Badge className="ml-2 bg-purple-600">{activeFiltersCount}</Badge>}
        </Button>
        {activeFiltersCount > 0 && (
          <Button variant="ghost" onClick={clearFilters} className="w-full sm:w-auto">
            <X className="h-4 w-4 mr-2" /> Cancella Filtri
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg border space-y-4">
          <h3 className="font-semibold">Filtri Avanzati</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Ruolo</label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i ruoli</SelectItem>
                  <SelectItem value="administrator">Amministratore</SelectItem>
                  <SelectItem value="premium_user">Utente Premium</SelectItem>
                  <SelectItem value="user">Utente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Stato Account</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti gli stati</SelectItem>
                  <SelectItem value="active">Attivi</SelectItem>
                  <SelectItem value="inactive">Inattivi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Stato Piano</label>
              <Select value={planStatusFilter} onValueChange={setPlanStatusFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i piani</SelectItem>
                  <SelectItem value="completed">Completati</SelectItem>
                  <SelectItem value="in_progress">In corso</SelectItem>
                  <SelectItem value="not_started">Non iniziati</SelectItem>
                  <SelectItem value="no_plan">Nessun piano</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      <div className="w-full">
        <Input key={searchKey} ref={searchInputRef} placeholder="Cerca utenti per email, nome o ruolo..." value={search || ""} onChange={(e) => setSearch(e.target.value)} className="w-full sm:max-w-md" type="text" autoComplete="off" />
      </div>

      {/* 🌟 FIX 9.1: Responsive, Wide Table with High/Low Scroll */}
      <div className="hidden lg:block border border-gray-200 rounded-lg shadow-sm bg-white overflow-hidden w-full">
        <div className="overflow-x-auto overflow-y-auto max-h-[70vh] relative custom-scrollbar">
          <Table className="min-w-full w-full">
            <TableHeader className="sticky top-0 bg-gray-50 z-10 shadow-sm">
              <TableRow>
                <TableHead className="font-semibold text-gray-700 min-w-[150px]">Nome</TableHead>
                <TableHead className="font-semibold text-gray-700 min-w-[220px]">Email</TableHead>
                <TableHead className="font-semibold text-gray-700 min-w-[100px]">Stato</TableHead>
                <TableHead className="font-semibold text-gray-700 min-w-[150px]">Ruolo</TableHead>
                <TableHead className="font-semibold text-gray-700 min-w-[200px]">Stato Piano</TableHead>
                <TableHead className="font-semibold text-gray-700 min-w-[150px]">Registrazione</TableHead>
                <TableHead className="font-semibold text-gray-700 min-w-[150px]">Ultima Attività</TableHead>
                <TableHead className="font-semibold text-gray-700 text-right min-w-[250px]">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-gray-50 transition-colors">
                    <TableCell className="font-medium whitespace-nowrap">{user.full_name || `${user.first_name || ""} ${user.last_name || ""}`.trim() || "N/A"}</TableCell>
                    <TableCell className="text-gray-600 whitespace-nowrap">{user.email}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${user.last_login ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                        {user.last_login ? "Attivo" : "Inattivo"}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role === "administrator" ? <><UsersRound className="h-3 w-3 mr-1" /> {getRoleDisplayName(user.role)}</> : user.role === "premium_user" ? <><User className="h-3 w-3 mr-1" /> {getRoleDisplayName(user.role)}</> : <>{getRoleDisplayName(user.role)}</>}
                      </Badge>
                    </TableCell>
                    <TableCell className="min-w-[180px]">{renderPlanStatus(user.planStatus)}</TableCell>
                    <TableCell className="whitespace-nowrap">{new Date(user.created_at).toLocaleDateString("it-IT")}</TableCell>
                    <TableCell className="whitespace-nowrap">{user.last_login ? new Date(user.last_login).toLocaleDateString("it-IT") : "Mai"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => goToUserDetails(user.id)} className="whitespace-nowrap">Dettagli</Button>
                        <Dialog open={roleDialogOpen && selectedUserForRole?.id === user.id} onOpenChange={setRoleDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => { setSelectedUserForRole(user); setNewRole(user.role); }} className="whitespace-nowrap">Cambia Ruolo</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Cambia Ruolo Utente</DialogTitle><DialogDescription>Seleziona il nuovo ruolo per {user.email}</DialogDescription></DialogHeader>
                            <div className="py-4">
                              <Select value={newRole} onValueChange={setNewRole}>
                                <SelectTrigger><SelectValue placeholder="Seleziona un ruolo" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">Utente</SelectItem>
                                  <SelectItem value="premium_user">Utente Premium</SelectItem>
                                  <SelectItem value="administrator">Amministratore</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>Annulla</Button>
                              <Button onClick={handleRoleChange}>Aggiorna Ruolo</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <Dialog open={deleteDialogOpen && selectedUserForDelete?.id === user.id} onOpenChange={setDeleteDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="destructive" size="sm" onClick={() => setSelectedUserForDelete(user)} className="whitespace-nowrap">Elimina</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Conferma Eliminazione</DialogTitle><DialogDescription>Sei sicuro di voler eliminare l'utente {selectedUserForDelete?.email}? Questa azione non può essere annullata.</DialogDescription></DialogHeader>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Annulla</Button>
                              <Button variant="destructive" onClick={handleDeleteUser}>Elimina</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-500">Nessun utente trovato</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile Card View remains unchanged... */}
    </div>
  );
};

export default AdminUserManagement;