import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from 'sonner';

interface AddWorkoutSheetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  onSuccess: () => void;
}

export function AddWorkoutSheetDialog({
  open,
  onOpenChange,
  studentId,
  onSuccess
}: AddWorkoutSheetDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Nome da ficha é obrigatório');
      return;
    }

    if (!profile?.id) {
      toast.error('Erro de autenticação');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('workout_sheets')
        .insert({
          student_id: studentId,
          name: name.trim(),
          description: description.trim() || null,
          created_by: profile.id
        });

      if (error) throw error;

      toast.success('Ficha de treino criada com sucesso!');
      setName('');
      setDescription('');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating workout sheet:', error);
      toast.error('Erro ao criar ficha de treino');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Ficha de Treino</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Ficha *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Treino A - Peito e Tríceps"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição opcional do treino..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Ficha'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}