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

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_months: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface DeletePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlanDeleted: () => void;
  plan: Plan | null;
}

export function DeletePlanDialog({ open, onOpenChange, onPlanDeleted, plan }: DeletePlanDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!plan) return;
    
    setLoading(true);
    try {
      // Check if plan has active student plans
      const { data: studentPlans, error: checkError } = await supabase
        .from('student_plans')
        .select('id')
        .eq('plan_id', plan.id)
        .eq('status', 'active');

      if (checkError) throw checkError;

      if (studentPlans && studentPlans.length > 0) {
        toast({
          title: "Não é possível excluir",
          description: "Este plano possui alunos ativos. Desative o plano ou remova os alunos primeiro.",
          variant: "destructive",
        });
        return;
      }

      // Delete plan
      const { error } = await supabase
        .from('plans')
        .delete()
        .eq('id', plan.id);

      if (error) throw error;

      toast({
        title: "Plano excluído",
        description: `${plan.name} foi excluído com sucesso!`,
      });

      onPlanDeleted();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error deleting plan:', error);
      toast({
        title: "Erro ao excluir plano",
        description: error.message || "Erro inesperado ao excluir plano",
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
          <AlertDialogTitle>Excluir Plano</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o plano <strong>{plan?.name}</strong>?
            <br />
            <br />
            Esta ação não pode ser desfeita. O plano será permanentemente removido.
            <br />
            <br />
            <strong>Nota:</strong> Se houver alunos com este plano ativo, a exclusão será bloqueada.
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
            {loading ? "Excluindo..." : "Excluir Plano"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
