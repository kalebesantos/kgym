import { useState, useEffect } from "react";
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

const planSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  price: z.number().min(0.01, "Preço deve ser maior que zero"),
  duration_months: z.number().min(1, "Duração deve ser de pelo menos 1 mês"),
  is_active: z.boolean(),
});

type PlanFormData = z.infer<typeof planSchema>;

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

interface EditPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlanUpdated: () => void;
  plan: Plan | null;
}

export function EditPlanDialog({ open, onOpenChange, onPlanUpdated, plan }: EditPlanDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      duration_months: 1,
      is_active: true,
    },
  });

  useEffect(() => {
    if (plan) {
      form.reset({
        name: plan.name,
        description: plan.description || "",
        price: plan.price,
        duration_months: plan.duration_months,
        is_active: plan.is_active,
      });
    }
  }, [plan, form]);

  const onSubmit = async (data: PlanFormData) => {
    if (!plan) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('plans')
        .update({
          name: data.name,
          description: data.description || null,
          price: data.price,
          duration_months: data.duration_months,
          is_active: data.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', plan.id);

      if (error) throw error;

      toast({
        title: "Plano atualizado",
        description: `${data.name} foi atualizado com sucesso!`,
      });

      onPlanUpdated();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating plan:', error);
      toast({
        title: "Erro ao atualizar plano",
        description: error.message || "Erro inesperado ao atualizar plano",
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
          <DialogTitle>Editar Plano</DialogTitle>
          <DialogDescription>
            Atualize as informações do plano.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Plano *</Label>
            <Input
              id="name"
              placeholder="Ex: Plano Mensal"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva os benefícios e características do plano"
              {...form.register("description")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="89.90"
                {...form.register("price", { valueAsNumber: true })}
              />
              {form.formState.errors.price && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.price.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration_months">Duração (meses) *</Label>
              <Input
                id="duration_months"
                type="number"
                min="1"
                placeholder="1"
                {...form.register("duration_months", { valueAsNumber: true })}
              />
              {form.formState.errors.duration_months && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.duration_months.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              {...form.register("is_active")}
              className="rounded border-gray-300"
            />
            <Label htmlFor="is_active" className="text-sm font-medium">
              Plano ativo
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? "Atualizando..." : "Atualizar Plano"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
