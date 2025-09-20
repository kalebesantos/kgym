import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Lock, Info, GraduationCap, UserCheck } from "lucide-react";

const teacherLoginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

const studentLoginSchema = z.object({
  email: z.string().email("Email inválido"),
  cpf: z.string().min(6, "CPF deve ter pelo menos 6 dígitos"),
});

const signupSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  fullName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  phone: z.string().optional(),
  cpf: z.string().optional(),
});

type TeacherLoginFormData = z.infer<typeof teacherLoginSchema>;
type StudentLoginFormData = z.infer<typeof studentLoginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { setUser, setProfile } = useAuth();
  const navigate = useNavigate();

  const teacherForm = useForm<TeacherLoginFormData>({
    resolver: zodResolver(teacherLoginSchema),
  });

  const studentForm = useForm<StudentLoginFormData>({
    resolver: zodResolver(studentLoginSchema),
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onTeacherLogin = async (data: TeacherLoginFormData) => {
    setLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;

      if (authData.user) {
        // Get admin profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', authData.user.id)
          .eq('role', 'admin')
          .single();

        if (profileError || !profile) {
          throw new Error('Acesso de professor não encontrado');
        }

        setUser(authData.user);
        setProfile(profile);

        toast({
          title: "Login realizado",
          description: `Bem-vindo, ${profile.full_name}!`,
        });

        // Redirect to dashboard for admin users
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: error.message || "Erro ao fazer login",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onStudentLogin = async (data: StudentLoginFormData) => {
    setLoading(true);
    try {
      const cpfDigits = data.cpf.replace(/\D/g, '');
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: cpfDigits,
      });

      if (authError) {
        throw new Error('Email ou CPF incorretos');
      }

      if (authData.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', authData.user.id)
          .eq('role', 'student')
          .single();

        if (profileError || !profile) {
          throw new Error('Perfil do aluno não encontrado');
        }

        setUser(authData.user);
        setProfile(profile);

        toast({
          title: "Login realizado",
          description: `Bem-vindo, ${profile.full_name}!`,
        });

        // Redirect to student area
        navigate('/student');
      }
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: error.message || "Erro inesperado ao fazer login",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSignup = async (data: SignupFormData) => {
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: authData.user.id,
            full_name: data.fullName,
            phone: data.phone || null,
            cpf: data.cpf || null,
            role: 'admin',
          });

        if (profileError) throw profileError;
      }

      toast({
        title: "Conta criada",
        description: "Sua conta foi criada com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: error.message || "Erro ao criar conta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">K</span>
          </div>
          <CardTitle className="text-2xl bg-gradient-primary bg-clip-text text-transparent">
            KGym
          </CardTitle>
          <CardDescription>
            Sistema de Gestão para Academias
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="student" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="student" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Aluno
              </TabsTrigger>
              <TabsTrigger value="teacher" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Professor
              </TabsTrigger>
              <TabsTrigger value="signup" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Cadastro
              </TabsTrigger>
            </TabsList>

            <TabsContent value="student">
              <form onSubmit={studentForm.handleSubmit(onStudentLogin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="student-email">Email</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="student-email"
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-10"
                      {...studentForm.register("email")}
                    />
                  </div>
                  {studentForm.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {studentForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="student-cpf">CPF (6 primeiros dígitos)</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="student-cpf"
                      placeholder="123456"
                      className="pl-10"
                      maxLength={6}
                      {...studentForm.register("cpf")}
                    />
                  </div>
                  {studentForm.formState.errors.cpf && (
                    <p className="text-sm text-destructive">
                      {studentForm.formState.errors.cpf.message}
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
                  variant="primary"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Entrando..." : "Entrar como Aluno"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="teacher">
              <form onSubmit={teacherForm.handleSubmit(onTeacherLogin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="teacher-email">Email</Label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="teacher-email"
                      type="email"
                      placeholder="professor@email.com"
                      className="pl-10"
                      {...teacherForm.register("email")}
                    />
                  </div>
                  {teacherForm.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {teacherForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teacher-password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="teacher-password"
                      type="password"
                      placeholder="••••••"
                      className="pl-10"
                      {...teacherForm.register("password")}
                    />
                  </div>
                  {teacherForm.formState.errors.password && (
                    <p className="text-sm text-destructive">
                      {teacherForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  variant="primary"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Entrando..." : "Entrar como Professor"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome Completo</Label>
                  <Input
                    id="signup-name"
                    placeholder="Seu nome completo"
                    {...signupForm.register("fullName")}
                  />
                  {signupForm.formState.errors.fullName && (
                    <p className="text-sm text-destructive">
                      {signupForm.formState.errors.fullName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="seu@email.com"
                    {...signupForm.register("email")}
                  />
                  {signupForm.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {signupForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••"
                    {...signupForm.register("password")}
                  />
                  {signupForm.formState.errors.password && (
                    <p className="text-sm text-destructive">
                      {signupForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">Telefone</Label>
                    <Input
                      id="signup-phone"
                      placeholder="(11) 99999-9999"
                      {...signupForm.register("phone")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-cpf">CPF</Label>
                    <Input
                      id="signup-cpf"
                      placeholder="000.000.000-00"
                      {...signupForm.register("cpf")}
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  variant="primary"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Criando conta..." : "Criar conta de Professor"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}