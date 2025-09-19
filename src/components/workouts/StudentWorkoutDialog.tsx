import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { WorkoutSheet } from '@/lib/types';
import { AddWorkoutSheetDialog } from './AddWorkoutSheetDialog';
import { WorkoutSheetDialog } from './WorkoutSheetDialog';
import { toast } from 'sonner';
import { Plus, Eye, Edit, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StudentWorkoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: {
    id: string;
    full_name: string;
  } | null;
}

export function StudentWorkoutDialog({
  open,
  onOpenChange,
  student
}: StudentWorkoutDialogProps) {
  const [workoutSheets, setWorkoutSheets] = useState<WorkoutSheet[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutSheet | null>(null);

  useEffect(() => {
    if (student?.id) {
      fetchWorkoutSheets();
    }
  }, [student]);

  const fetchWorkoutSheets = async () => {
    if (!student?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('workout_sheets')
        .select(`
          *,
          exercises (
            id,
            workout_sheet_id,
            name,
            muscle_group,
            sets,
            reps,
            weight,
            rest_time,
            instructions,
            order_index,
            created_at,
            updated_at
          )
        `)
        .eq('student_id', student.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkoutSheets(data || []);
    } catch (error) {
      console.error('Error fetching workout sheets:', error);
      toast.error('Erro ao carregar fichas de treino');
    } finally {
      setLoading(false);
    }
  };

  const handleEditWorkout = (workout: WorkoutSheet) => {
    setSelectedWorkout(workout);
    setShowEditDialog(true);
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta ficha de treino?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('workout_sheets')
        .delete()
        .eq('id', workoutId);

      if (error) throw error;

      toast.success('Ficha de treino excluída com sucesso!');
      fetchWorkoutSheets();
    } catch (error: any) {
      console.error('Error deleting workout sheet:', error);
      toast.error('Erro ao excluir ficha de treino');
    }
  };

  const toggleWorkoutStatus = async (workoutId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('workout_sheets')
        .update({ is_active: !currentStatus })
        .eq('id', workoutId);

      if (error) throw error;

      toast.success(`Ficha ${!currentStatus ? 'ativada' : 'desativada'} com sucesso!`);
      fetchWorkoutSheets();
    } catch (error: any) {
      console.error('Error updating workout status:', error);
      toast.error('Erro ao atualizar status da ficha');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Fichas de Treino - {student?.full_name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Fichas de Treino</h3>
                <p className="text-sm text-muted-foreground">
                  Gerencie as fichas de treino do aluno
                </p>
              </div>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Ficha
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Carregando fichas...</p>
              </div>
            ) : workoutSheets.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground text-center">
                    Nenhuma ficha de treino criada ainda.<br />
                    Clique em "Nova Ficha" para criar a primeira.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {workoutSheets.map((workout) => (
                  <Card key={workout.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{workout.name}</CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(workout.created_at), "dd 'de' MMM, yyyy", {
                              locale: ptBR
                            })}
                          </div>
                        </div>
                        <Badge variant={workout.is_active ? "default" : "secondary"}>
                          {workout.is_active ? "Ativa" : "Inativa"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {workout.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {workout.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium">
                          {workout.exercises?.length || 0} exercícios
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleEditWorkout(workout)}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                        <Button
                          onClick={() => toggleWorkoutStatus(workout.id, workout.is_active)}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          {workout.is_active ? 'Desativar' : 'Ativar'}
                        </Button>
                        <Button
                          onClick={() => handleDeleteWorkout(workout.id)}
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AddWorkoutSheetDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        studentId={student?.id || ''}
        onSuccess={fetchWorkoutSheets}
      />

      <WorkoutSheetDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        workoutSheet={selectedWorkout}
        onSuccess={fetchWorkoutSheets}
      />
    </>
  );
}