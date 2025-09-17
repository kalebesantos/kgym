import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const studentSchema = z.object({
  full_name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  cpf: z.string().min(6, "CPF deve ter pelo menos 6 dígitos"),
});

type StudentFormData = z.infer<typeof studentSchema>;

interface AddStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStudentAdded: () => void;
}

export function AddStudentDialog({ open, onOpenChange, onStudentAdded }: AddStudentDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      cpf: "",
    },
  });

  const onSubmit = async (data: StudentFormData) => {
    setLoading(true);
    try {
      // Use first 6 digits of CPF as password
      const cpfDigits = data.cpf?.replace(/\D/g, '').slice(0, 6) || '123456';
      const password = cpfDigits.length >= 6 ? cpfDigits : '123456';

      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: authData.user.id,
            full_name: data.full_name,
            phone: data.phone || null,
            cpf: data.cpf || null,
            role: 'student',
          });

        if (profileError) throw profileError;

        toast({
          title: "Aluno cadastrado",
          description: `${data.full_name} foi cadastrado com sucesso!`,
        });

        form.reset();
        onStudentAdded();
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error('Error creating student:', error);
      toast({
        title: "Erro ao cadastrar aluno",
        description: error.message || "Erro inesperado ao cadastrar aluno",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Aluno</DialogTitle>
            <DialogDescription>
              Preencha as informações do novo aluno. Uma conta será criada automaticamente.
              <br />
              <strong>Nota:</strong> A senha será os 6 primeiros dígitos do CPF.
            </DialogDescription>
          </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nome Completo *</Label>
            <Input
              id="full_name"
              placeholder="Nome completo do aluno"
              {...form.register("full_name")}
            />
            {form.formState.errors.full_name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.full_name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@exemplo.com"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>


          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                placeholder="(11) 99999-9999"
                {...form.register("phone")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                placeholder="000.000.000-00"
                {...form.register("cpf")}
              />
              {form.formState.errors.cpf && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.cpf.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? "Cadastrando..." : "Cadastrar Aluno"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}