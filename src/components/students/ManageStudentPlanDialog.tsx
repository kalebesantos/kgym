import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Profile, Plan, StudentPlan } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const studentPlanSchema = z.object({
  plan_id: z.string().min(1, "Selecione um plano"),
  start_date: z.string().min(1, "Data de início é obrigatória"),
  end_date: z.string().min(1, "Data de fim é obrigatória"),
  status: z.enum(["active", "inactive", "expired"]),
});

type StudentPlanFormData = z.infer<typeof studentPlanSchema>;

type Student = Profile;

interface ManageStudentPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlanUpdated: () => void;
  student: Student | null;
  currentPlan?: StudentPlan | null;
}

export function ManageStudentPlanDialog({ 
  open, 
  onOpenChange, 
  onPlanUpdated, 
  student, 
  currentPlan 
}: ManageStudentPlanDialogProps) {
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const { toast } = useToast();

  const form = useForm<StudentPlanFormData>({
    resolver: zodResolver(studentPlanSchema),
    defaultValues: {
      plan_id: "",
      start_date: "",
      end_date: "",
      status: "active",
    },
  });

  useEffect(() => {
    if (open) {
      fetchPlans();
      if (currentPlan) {
        form.reset({
          plan_id: currentPlan.plan_id,
          start_date: currentPlan.start_date,
          end_date: currentPlan.end_date,
          status: currentPlan.status as "active" | "inactive" | "expired",
        });
      } else {
        const today = new Date().toISOString().split('T')[0];
        form.reset({
          plan_id: "",
          start_date: today,
          end_date: "",
          status: "active",
        });
      }
    }
  }, [open, currentPlan, form]);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const calculateEndDate = (startDate: string, durationMonths: number) => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + durationMonths);
    return end.toISOString().split('T')[0];
  };

  const handlePlanChange = (planId: string) => {
    const selectedPlan = plans.find(p => p.id === planId);
    if (selectedPlan && form.getValues('start_date')) {
      const endDate = calculateEndDate(form.getValues('start_date'), selectedPlan.duration_months);
      form.setValue('end_date', endDate);
    }
  };

  const handleStartDateChange = (startDate: string) => {
    const planId = form.getValues('plan_id');
    if (planId) {
      const selectedPlan = plans.find(p => p.id === planId);
      if (selectedPlan) {
        const endDate = calculateEndDate(startDate, selectedPlan.duration_months);
        form.setValue('end_date', endDate);
      }
    }
  };

  const onSubmit = async (data: StudentPlanFormData) => {
    if (!student) return;
    
    setLoading(true);
    try {
      if (currentPlan) {
        // Update existing plan
        const { error } = await supabase
          .from('student_plans')
          .update({
            plan_id: data.plan_id,
            start_date: data.start_date,
            end_date: data.end_date,
            status: data.status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentPlan.id);

        if (error) throw error;

        toast({
          title: "Plano atualizado",
          description: "Plano do aluno foi atualizado com sucesso!",
        });
      } else {
        // Create new plan
        const { error } = await supabase
          .from('student_plans')
          .insert({
            student_id: student.id,
            plan_id: data.plan_id,
            start_date: data.start_date,
            end_date: data.end_date,
            status: data.status,
          });

        if (error) throw error;

        toast({
          title: "Plano atribuído",
          description: "Plano foi atribuído ao aluno com sucesso!",
        });
      }

      onPlanUpdated();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error managing student plan:', error);
      toast({
        title: "Erro ao gerenciar plano",
        description: error.message || "Erro inesperado ao gerenciar plano",
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
          <DialogTitle>
            {currentPlan ? "Editar Plano do Aluno" : "Atribuir Plano ao Aluno"}
          </DialogTitle>
          <DialogDescription>
            {currentPlan 
              ? `Gerencie o plano de ${student?.full_name}`
              : `Atribua um plano para ${student?.full_name}`
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="plan_id">Plano *</Label>
            <Select
              value={form.watch("plan_id")}
              onValueChange={(value) => {
                form.setValue("plan_id", value);
                handlePlanChange(value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um plano" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} - R$ {plan.price.toFixed(2)} ({plan.duration_months} mês{plan.duration_months > 1 ? 'es' : ''})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.plan_id && (
              <p className="text-sm text-destructive">
                {form.formState.errors.plan_id.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Data de Início *</Label>
              <Input
                id="start_date"
                type="date"
                {...form.register("start_date", {
                  onChange: (e) => handleStartDateChange(e.target.value)
                })}
              />
              {form.formState.errors.start_date && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.start_date.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">Data de Fim *</Label>
              <Input
                id="end_date"
                type="date"
                {...form.register("end_date")}
              />
              {form.formState.errors.end_date && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.end_date.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={form.watch("status")}
              onValueChange={(value) => form.setValue("status", value as "active" | "inactive" | "expired")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
                <SelectItem value="expired">Expirado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? "Salvando..." : currentPlan ? "Atualizar Plano" : "Atribuir Plano"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
