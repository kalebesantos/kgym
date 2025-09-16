import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Student {
  id: string;
  full_name: string;
  phone: string | null;
  cpf: string | null;
  user_id: string;
}

interface DeleteStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStudentDeleted: () => void;
  student: Student | null;
}

export function DeleteStudentDialog({ open, onOpenChange, onStudentDeleted, student }: DeleteStudentDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!student) return;
    
    setLoading(true);
    try {
      // Delete user from auth first
      const { error: authError } = await supabase.auth.admin.deleteUser(student.user_id);
      
      if (authError) {
        console.warn('Auth deletion failed, but continuing with profile deletion:', authError);
      }

      // Delete profile (this will cascade delete related records)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', student.id);

      if (profileError) throw profileError;

      toast({
        title: "Aluno excluído",
        description: `${student.full_name} foi excluído com sucesso!`,
      });

      onStudentDeleted();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error deleting student:', error);
      toast({
        title: "Erro ao excluir aluno",
        description: error.message || "Erro inesperado ao excluir aluno",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Aluno</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir <strong>{student?.full_name}</strong>?
            <br />
            <br />
            Esta ação não pode ser desfeita. Todos os dados do aluno, incluindo:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Perfil e informações pessoais</li>
              <li>Histórico de planos</li>
              <li>Registros de check-in</li>
              <li>Conta de acesso</li>
            </ul>
            serão permanentemente removidos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? "Excluindo..." : "Excluir Aluno"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
