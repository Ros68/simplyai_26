import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext"; // FIX: was @/hooks/useAuth
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, KeyRound, User, FileText, MapPin } from "lucide-react";

// FIX 6.2.5 — Extended schema with all profile + billing fields
const profileSchema = z.object({
  firstName:   z.string().min(2, "Il nome deve contenere almeno 2 caratteri"),
  lastName:    z.string().min(2, "Il cognome deve contenere almeno 2 caratteri"),
  email:       z.string().email().optional(),
  phone:       z.string().optional(),
  // Extended personal fields
  dateOfBirth: z.string().optional(),
  gender:      z.string().optional(),
  jobTitle:    z.string().optional(),
  // Billing / invoice fields
  vatNumber:   z.string().optional(),
  address:     z.string().optional(),
  city:        z.string().optional(),
  zipCode:     z.string().optional(),
  country:     z.string().optional(),
});

const passwordSchema = z
  .object({
    password:        z.string().min(6, "La password deve contenere almeno 6 caratteri"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Le password non coincidono",
    path: ["confirmPassword"],
  });

type ProfileValues  = z.infer<typeof profileSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

export const UserProfile = () => {
  const { toast }  = useToast();
  const { user }   = useAuth();
  const [isLoading,         setIsLoading]         = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  // FIX 6.2.8 — always read the canonical key
  const token = localStorage.getItem("auth_token") || localStorage.getItem("authToken") || "";

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "", lastName: "", email: "", phone: "",
      dateOfBirth: "", gender: "", jobTitle: "",
      vatNumber: "", address: "", city: "", zipCode: "", country: "Italia",
    },
  });

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  // ── Load full profile on mount ────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      if (!token) return;
      setIsLoading(true);
      try {
        // Use /auth/me which already returns all profile fields from our fixed authService
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });

        if (!res.ok) throw new Error("Errore nel caricamento del profilo");

        const data = await res.json();

        if (data.success && data.data) {
          const d = data.data;
          // FIX 6.2.5 — populate ALL fields, not just name/email
          form.reset({
            firstName:   d.firstName   || "",
            lastName:    d.lastName    || "",
            email:       d.email       || "",
            phone:       d.phone       || "",
            dateOfBirth: d.dateOfBirth ? d.dateOfBirth.substring(0, 10) : "",
            gender:      d.gender      || "",
            jobTitle:    d.jobTitle    || "",
            vatNumber:   d.vatNumber   || d.fiscalCode || "",
            address:     d.address     || "",
            city:        d.city        || "",
            zipCode:     d.zipCode     || "",
            country:     d.country     || "Italia",
          });
        }
      } catch (err) {
        console.error("Errore caricamento profilo:", err);
        // Fallback: use auth context data for basic fields
        if (user) {
          form.reset({
            firstName: user.firstName || "",
            lastName:  user.lastName  || "",
            email:     user.email     || "",
          });
        }
        toast({ variant: "destructive", title: "Errore", description: "Non è stato possibile caricare i dati del profilo" });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Save profile ──────────────────────────────────────────────────────────
  const onSubmit = async (values: ProfileValues) => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      // Use the new PUT /users/:id/profile endpoint (from userRoutes.js)
      const res = await fetch(`${API_BASE_URL}/users/${user.id}/profile`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) throw new Error("Errore nell'aggiornamento del profilo");

      const data = await res.json();
      if (data.success) {
        toast({ title: "Profilo aggiornato", description: "Le informazioni sono state aggiornate con successo" });
      }
    } catch (err) {
      console.error("Errore aggiornamento profilo:", err);
      toast({ variant: "destructive", title: "Errore", description: "Non è stato possibile aggiornare il profilo" });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Change password ───────────────────────────────────────────────────────
  const onPasswordSubmit = async (values: PasswordValues) => {
    setIsPasswordLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: values.password }),
      });

      if (!res.ok) throw new Error("Errore nell'aggiornamento della password");

      const data = await res.json();
      if (data.success) {
        toast({ title: "Password aggiornata", description: "La tua password è stata aggiornata con successo" });
        passwordForm.reset();
      }
    } catch (err) {
      console.error("Errore aggiornamento password:", err);
      toast({ variant: "destructive", title: "Errore", description: "Non è stato possibile aggiornare la password" });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* ── Personal Info Card ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> Profilo Utente
          </CardTitle>
          <CardDescription>Gestisci le informazioni del tuo profilo</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                {/* Name row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FF control={form.control} name="firstName" label="Nome"    placeholder="Mario" />
                  <FF control={form.control} name="lastName"  label="Cognome" placeholder="Rossi" />
                </div>

                {/* Email (read-only) */}
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" disabled {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Phone */}
                <FF control={form.control} name="phone" label="Telefono" placeholder="+39 123 456 7890" />

                {/* Date of birth + Gender */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FF control={form.control} name="dateOfBirth" label="Data di nascita" type="date" />

                  {/* Gender select */}
                  <FormField control={form.control} name="gender" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sesso</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="">Seleziona...</option>
                          <option value="male">Uomo</option>
                          <option value="female">Donna</option>
                          <option value="other">Altro</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* Job title */}
                <FF control={form.control} name="jobTitle" label="Professione" placeholder="es. Libero professionista" />

                <Button type="submit" disabled={isLoading} className="w-full mt-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-700)]">
                  {isLoading
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvataggio...</>
                    : "Salva Modifiche"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      {/* ── Billing / Invoice Card ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" /> Dati di fatturazione
          </CardTitle>
          <CardDescription>Necessari per fattura elettronica e statistiche</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* VAT / Fiscal code */}
              <FF control={form.control} name="vatNumber" label="Codice Fiscale / P.IVA" placeholder="RSSMRA80A01H501U" />

              {/* Address */}
              <FF control={form.control} name="address" label="Indirizzo" placeholder="Via Roma 1" />

              {/* City / CAP / Country */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FF control={form.control} name="city"    label="Città"  placeholder="Milano" />
                <FF control={form.control} name="zipCode" label="CAP"    placeholder="20100" />
                <FF control={form.control} name="country" label="Paese"  placeholder="Italia" />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full mt-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-700)]">
                {isLoading
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvataggio...</>
                  : "Salva Dati Fatturazione"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* ── Password Card ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" /> Cambio Password
          </CardTitle>
          <CardDescription>Modifica la tua password di accesso</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <FormField control={passwordForm.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nuova Password</FormLabel>
                  <FormControl><Input type="password" placeholder="Inserisci la nuova password" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (
                <FormItem>
                  <FormLabel>Conferma Password</FormLabel>
                  <FormControl><Input type="password" placeholder="Conferma la nuova password" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" disabled={isPasswordLoading} className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-700)]">
                {isPasswordLoading
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Aggiornamento...</>
                  : "Aggiorna Password"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

    </div>
  );
};

// ── Tiny helper to avoid FormField repetition ─────────────────────────────────
const FF = ({ control, name, label, placeholder = "", type = "text" }: {
  control: any; name: string; label: string; placeholder?: string; type?: string;
}) => (
  <FormField control={control} name={name} render={({ field }) => (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <FormControl><Input type={type} placeholder={placeholder} {...field} /></FormControl>
      <FormMessage />
    </FormItem>
  )} />
);