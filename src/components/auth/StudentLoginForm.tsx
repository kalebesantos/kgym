import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Lock, Info, ArrowLeft } from "lucide-react";
import { StudentWelcome } from "./StudentWelcome";

const studentLoginSchema = z.object({
  email: z.string().email("Email inválido"),
  cpf: z.string().min(6, "CPF deve ter pelo menos 6 dígitos"),
});

type StudentLoginFormData = z.infer<typeof studentLoginSchema>;

export function StudentLoginForm() {
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const { toast } = useToast();
  const { setUser, setProfile } = useAuth();

  const form = useForm<StudentLoginFormData>({
    resolver: zodResolver(studentLoginSchema),
    defaultValues: {
      email: "",
      cpf: "",
    },
  });

  const onSubmit = async (data: StudentLoginFormData) => {
    setLoading(true);
    try {
      console.log('Tentando login do aluno:', data.email);
      
      // Try to sign in with email and CPF as password
      const cpfDigits = data.cpf.replace(/\D/g, ''); // Remove non-digits
      console.log('CPF digits:', cpfDigits);
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: cpfDigits, // Use CPF as password
      });

      console.log('Auth result:', { authData, authError });

      if (authError) {
        console.error('Auth error:', authError);
        throw new Error('Email ou CPF incorretos');
      }

      if (authData.user) {
        console.log('User found:', authData.user.id);
        
        // Get student profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', authData.user.id)
          .eq('role', 'student')
          .single();

        console.log('Profile result:', { profile, profileError });

        if (profileError || !profile) {
          throw new Error('Perfil do aluno não encontrado');
        }

        // Set user and profile in context
        setUser(authData.user);
        setProfile(profile);

        console.log('Login successful, redirecting...');

        toast({
          title: "Login realizado",
          description: `Bem-vindo, ${profile.full_name}!`,
        });
      }

    } catch (error: any) {
      console.error('Student login error:', error);
      toast({
        title: "Erro no login",
        description: error.message || "Erro inesperado ao fazer login",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!showLogin) {
    return (
      <div>
        <StudentWelcome />
        <div className="fixed bottom-6 right-6">
          <Button 
            onClick={() => setShowLogin(true)}
            className="shadow-lg"
            size="lg"
          >
            Fazer Login
            <ArrowLeft className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Área do Aluno</CardTitle>
          <CardDescription>
            Faça login para acessar sua área pessoal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-10"
                  {...form.register("email")}
                />
              </div>
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF (6 primeiros dígitos) *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="cpf"
                  placeholder="123456"
                  className="pl-10"
                  maxLength={6}
                  {...form.register("cpf")}
                />
              </div>
              {form.formState.errors.cpf && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.cpf.message}
                </p>
              )}
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Use os 6 primeiros dígitos do seu CPF como senha
              </AlertDescription>
            </Alert>

            <Button 
              type="submit" 
              className="w-full" 
              variant="primary"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar na Área do Aluno"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Problemas para acessar? Entre em contato com a academia.</p>
          </div>

          <div className="mt-4 text-center">
            <Button 
              variant="ghost" 
              onClick={() => setShowLogin(false)}
              className="text-muted-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
