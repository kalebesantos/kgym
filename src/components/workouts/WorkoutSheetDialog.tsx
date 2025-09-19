import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { WorkoutSheet, Exercise } from '@/lib/types';
import { toast } from 'sonner';
import { Plus, Trash2, GripVertical } from 'lucide-react';

interface WorkoutSheetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workoutSheet: WorkoutSheet | null;
  onSuccess: () => void;
  readOnly?: boolean;
}

export function WorkoutSheetDialog({
  open,
  onOpenChange,
  workoutSheet,
  onSuccess,
  readOnly = false
}: WorkoutSheetDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (workoutSheet) {
      setName(workoutSheet.name);
      setDescription(workoutSheet.description || '');
      fetchExercises();
    } else {
      setName('');
      setDescription('');
      setExercises([]);
    }
  }, [workoutSheet]);

  const fetchExercises = async () => {
    if (!workoutSheet?.id) return;

    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('workout_sheet_id', workoutSheet.id)
        .order('order_index');

      if (error) throw error;
      setExercises(data || []);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      toast.error('Erro ao carregar exercícios');
    }
  };

  const handleUpdateWorkoutSheet = async () => {
    if (!workoutSheet?.id || readOnly) return;

    if (!name.trim()) {
      toast.error('Nome da ficha é obrigatório');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('workout_sheets')
        .update({
          name: name.trim(),
          description: description.trim() || null
        })
        .eq('id', workoutSheet.id);

      if (error) throw error;

      toast.success('Ficha atualizada com sucesso!');
      onSuccess();
    } catch (error: any) {
      console.error('Error updating workout sheet:', error);
      toast.error('Erro ao atualizar ficha');
    } finally {
      setLoading(false);
    }
  };

  const addExercise = () => {
    if (readOnly) return;
    
    const newExercise: Partial<Exercise> = {
      id: `temp-${Date.now()}`,
      workout_sheet_id: workoutSheet?.id || '',
      name: '',
      muscle_group: '',
      sets: 1,
      reps: '',
      weight: '',
      rest_time: '',
      instructions: '',
      order_index: exercises.length
    };
    setExercises([...exercises, newExercise as Exercise]);
  };

  const updateExercise = (index: number, field: keyof Exercise, value: any) => {
    if (readOnly) return;
    
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  const removeExercise = (index: number) => {
    if (readOnly) return;
    
    const updated = exercises.filter((_, i) => i !== index);
    setExercises(updated);
  };

  const saveExercises = async () => {
    if (!workoutSheet?.id || readOnly) return;

    setLoading(true);

    try {
      // Delete existing exercises
      await supabase
        .from('exercises')
        .delete()
        .eq('workout_sheet_id', workoutSheet.id);

      // Insert new exercises
      const exercisesToSave = exercises
        .filter(ex => ex.name.trim())
        .map((ex, index) => ({
          workout_sheet_id: workoutSheet.id,
          name: ex.name,
          muscle_group: ex.muscle_group || null,
          sets: ex.sets || 1,
          reps: ex.reps || null,
          weight: ex.weight || null,
          rest_time: ex.rest_time || null,
          instructions: ex.instructions || null,
          order_index: index
        }));

      if (exercisesToSave.length > 0) {
        const { error } = await supabase
          .from('exercises')
          .insert(exercisesToSave);

        if (error) throw error;
      }

      toast.success('Exercícios salvos com sucesso!');
      onSuccess();
    } catch (error: any) {
      console.error('Error saving exercises:', error);
      toast.error('Erro ao salvar exercícios');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {readOnly ? 'Minha Ficha de Treino' : 'Editar Ficha de Treino'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Workout Sheet Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Ficha</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={readOnly}
                placeholder="Nome da ficha de treino"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={readOnly}
                placeholder="Descrição da ficha..."
                rows={2}
              />
            </div>

            {!readOnly && (
              <Button
                onClick={handleUpdateWorkoutSheet}
                disabled={loading}
                variant="outline"
              >
                Salvar Informações
              </Button>
            )}
          </div>

          <Separator />

          {/* Exercises Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Exercícios</h3>
              {!readOnly && (
                <Button onClick={addExercise} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Exercício
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {exercises.map((exercise, index) => (
                <Card key={exercise.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        Exercício {index + 1}
                      </CardTitle>
                      {!readOnly && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExercise(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label>Nome do Exercício</Label>
                        <Input
                          value={exercise.name}
                          onChange={(e) => updateExercise(index, 'name', e.target.value)}
                          disabled={readOnly}
                          placeholder="Ex: Supino reto"
                        />
                      </div>
                      <div>
                        <Label>Grupo Muscular</Label>
                        <Input
                          value={exercise.muscle_group || ''}
                          onChange={(e) => updateExercise(index, 'muscle_group', e.target.value)}
                          disabled={readOnly}
                          placeholder="Ex: Peito"
                        />
                      </div>
                      <div>
                        <Label>Séries</Label>
                        <Input
                          type="number"
                          value={exercise.sets || ''}
                          onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value) || 1)}
                          disabled={readOnly}
                          placeholder="3"
                        />
                      </div>
                      <div>
                        <Label>Repetições</Label>
                        <Input
                          value={exercise.reps || ''}
                          onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                          disabled={readOnly}
                          placeholder="Ex: 8-12"
                        />
                      </div>
                      <div>
                        <Label>Carga</Label>
                        <Input
                          value={exercise.weight || ''}
                          onChange={(e) => updateExercise(index, 'weight', e.target.value)}
                          disabled={readOnly}
                          placeholder="Ex: 20kg"
                        />
                      </div>
                      <div>
                        <Label>Descanso</Label>
                        <Input
                          value={exercise.rest_time || ''}
                          onChange={(e) => updateExercise(index, 'rest_time', e.target.value)}
                          disabled={readOnly}
                          placeholder="Ex: 90s"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Instruções</Label>
                      <Textarea
                        value={exercise.instructions || ''}
                        onChange={(e) => updateExercise(index, 'instructions', e.target.value)}
                        disabled={readOnly}
                        placeholder="Instruções específicas para o exercício..."
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {!readOnly && exercises.length > 0 && (
              <Button onClick={saveExercises} disabled={loading} className="w-full">
                {loading ? 'Salvando...' : 'Salvar Exercícios'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}