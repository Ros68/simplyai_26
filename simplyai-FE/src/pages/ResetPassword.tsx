import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const formSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "La password deve essere di almeno 8 caratteri" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Le password non coincidono",
    path: ["confirmPassword"],
  });

const ResetPassword = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Extract token and uid from URL
  const params = new URLSearchParams(location.search);
  const token = params.get("token");
  const userId = params.get("uid");

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = async (values) => {
    if (!token || !userId) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Link non valido o mancante",
      });
      return;
    }
    try {
      setIsLoading(true);
      const API_BASE_URL =
        import.meta.env.VITE_API_BASE_URL || "https://simplyai.it/api";
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, token, newPassword: values.password }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        toast({
          title: "Password aggiornata",
          description: "Ora puoi accedere con la nuova password.",
        });
        setTimeout(() => navigate("/login"), 2000);
      } else {
        toast({
          variant: "destructive",
          title: "Errore",
          description: data.message || "Impossibile aggiornare la password.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: error.message || "Si è verificato un errore. Riprova.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-grow flex items-center justify-center p-4 bg-[var(--color-secondary)]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Reset Password</CardTitle>
            <CardDescription>
              Inserisci la nuova password per il tuo account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="text-green-600 text-center font-semibold py-4">
                Password aggiornata con successo! Reindirizzamento al login...
              </div>
            ) : (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nuova Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Nuova password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conferma Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Conferma password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-700)]"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Aggiornamento...
                      </>
                    ) : (
                      <>Aggiorna password</>
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-500">
              Torna al{" "}
              <a
                href="/login"
                className="text-[var(--color-primary)] hover:text-[var(--color-primary-700)]"
              >
                login
              </a>
            </p>
          </CardFooter>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default ResetPassword;
