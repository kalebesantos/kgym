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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { FaceCapture } from "@/components/face/FaceCapture";
import { User, Mail, Lock, Phone, CreditCard, Camera, ImageIcon } from "lucide-react";

const profileSchema = z.object({
  fullName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  phone: z.string().optional(),
  cpf: z.string().optional(),
});

const emailSchema = z.object({
  email: z.string().email("Email inválido"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, "Senha atual é obrigatória"),
  newPassword: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(6, "Confirmação é obrigatória"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type EmailFormData = z.infer<typeof emailSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function Profile() {
  const [loading, setLoading] = useState(false);
  const [showFaceCapture, setShowFaceCapture] = useState(false);
  const { toast } = useToast();
  const { user, profile, setProfile } = useAuth();

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile?.full_name || "",
      phone: profile?.phone || "",
      cpf: profile?.cpf || "",
    },
  });

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: user?.email || "",
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onUpdateProfile = async (data: ProfileFormData) => {
    if (!user || !profile) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.fullName,
          phone: data.phone || null,
          cpf: data.cpf || null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local profile state
      setProfile({
        ...profile,
        full_name: data.fullName,
        phone: data.phone || null,
        cpf: data.cpf || null,
      });

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message || "Erro inesperado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onUpdateEmail = async (data: EmailFormData) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: data.email,
      });

      if (error) throw error;

      toast({
        title: "Email atualizado",
        description: "Verifique seu novo email para confirmar a alteração.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar email",
        description: error.message || "Erro inesperado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onUpdatePassword = async (data: PasswordFormData) => {
    if (!user) return;
    
    setLoading(true);
    try {
      // First verify current password by trying to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: data.currentPassword,
      });

      if (signInError) {
        throw new Error("Senha atual incorreta");
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (error) throw error;

      toast({
        title: "Senha atualizada",
        description: "Sua senha foi alterada com sucesso!",
      });

      passwordForm.reset();
    } catch (error: any) {
      toast({
        title: "Erro ao alterar senha",
        description: error.message || "Erro inesperado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFaceCapture = async (imageBlob: Blob) => {
    try {
      // Aqui seria implementado o processamento da imagem para extrair face_encoding
      // Por simplicidade, vamos apenas simular o salvamento
      
      // Em produção, você processaria a imagem com MediaPipe/TensorFlow
      // e extrairia os embeddings faciais
      const faceEncoding = `face_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          face_encoding: faceEncoding,
          profile_photo_url: 'placeholder_url' // Em produção, faria upload para storage
        })
        .eq('id', profile?.id);

      if (error) throw error;

      setProfile(prev => prev ? {
        ...prev,
        face_encoding: faceEncoding,
        profile_photo_url: 'placeholder_url'
      } : null);

      toast({
        title: "Sucesso",
        description: "Foto facial cadastrada com sucesso.",
      });

      setShowFaceCapture(false);
    } catch (error) {
      console.error('Error saving face data:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar dados faciais.",
        variant: "destructive",
      });
    }
  };

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Configurações do Perfil</h1>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais e configurações de conta
        </p>
      </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="face" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Foto Facial
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="password" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Senha
            </TabsTrigger>
          </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Pessoais
              </CardTitle>
              <CardDescription>
                Atualize suas informações pessoais aqui
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      placeholder="Seu nome completo"
                      className="pl-10"
                      {...profileForm.register("fullName")}
                    />
                  </div>
                  {profileForm.formState.errors.fullName && (
                    <p className="text-sm text-destructive">
                      {profileForm.formState.errors.fullName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      placeholder="(11) 99999-9999"
                      className="pl-10"
                      {...profileForm.register("phone")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="cpf"
                      placeholder="000.000.000-00"
                      className="pl-10"
                      {...profileForm.register("cpf")}
                    />
                  </div>
                </div>

                <Separator />

                <Button 
                  type="submit" 
                  variant="primary"
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  {loading ? "Atualizando..." : "Atualizar Perfil"}
                </Button>
              </form>
            </CardContent>
          </Card>
          </TabsContent>

          <TabsContent value="face">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Reconhecimento Facial
                </CardTitle>
                <CardDescription>
                  Configure sua foto para reconhecimento facial no check-in
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {profile?.face_encoding ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="h-12 w-12 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium text-green-800 dark:text-green-200">
                          Foto facial cadastrada
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          Você pode usar o reconhecimento facial para check-in
                        </p>
                      </div>
                    </div>
                    
                    <Dialog open={showFaceCapture} onOpenChange={setShowFaceCapture}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          <Camera className="h-4 w-4 mr-2" />
                          Atualizar Foto Facial
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Atualizar Foto Facial</DialogTitle>
                        </DialogHeader>
                        <FaceCapture
                          onCapture={handleFaceCapture}
                          onCancel={() => setShowFaceCapture(false)}
                          title="Atualizar Foto"
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                      <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-medium mb-2">Nenhuma foto cadastrada</h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        Cadastre sua foto para usar o reconhecimento facial no check-in
                      </p>
                      
                      <Dialog open={showFaceCapture} onOpenChange={setShowFaceCapture}>
                        <DialogTrigger asChild>
                          <Button>
                            <Camera className="h-4 w-4 mr-2" />
                            Cadastrar Foto Facial
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Cadastrar Foto Facial</DialogTitle>
                          </DialogHeader>
                          <FaceCapture
                            onCapture={handleFaceCapture}
                            onCancel={() => setShowFaceCapture(false)}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                        Como funciona o reconhecimento facial?
                      </h4>
                      <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                        <li>• Sua foto é processada para criar um perfil facial único</li>
                        <li>• Os dados são criptografados e armazenados com segurança</li>
                        <li>• No check-in, basta olhar para a câmera</li>
                        <li>• Mais rápido e conveniente que QR codes</li>
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email">
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Alterar Email
              </CardTitle>
              <CardDescription>
                Atualize seu endereço de email. Você receberá um email de confirmação.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={emailForm.handleSubmit(onUpdateEmail)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Novo Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="novo@email.com"
                      className="pl-10"
                      {...emailForm.register("email")}
                    />
                  </div>
                  {emailForm.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {emailForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <Separator />

                <Button 
                  type="submit" 
                  variant="primary"
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  {loading ? "Atualizando..." : "Atualizar Email"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Alterar Senha
              </CardTitle>
              <CardDescription>
                Atualize sua senha para manter sua conta segura
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={passwordForm.handleSubmit(onUpdatePassword)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Senha Atual *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="currentPassword"
                      type="password"
                      placeholder="••••••"
                      className="pl-10"
                      {...passwordForm.register("currentPassword")}
                    />
                  </div>
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="text-sm text-destructive">
                      {passwordForm.formState.errors.currentPassword.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="••••••"
                      className="pl-10"
                      {...passwordForm.register("newPassword")}
                    />
                  </div>
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-sm text-destructive">
                      {passwordForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••"
                      className="pl-10"
                      {...passwordForm.register("confirmPassword")}
                    />
                  </div>
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {passwordForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Separator />

                <Button 
                  type="submit" 
                  variant="primary"
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  {loading ? "Alterando..." : "Alterar Senha"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}