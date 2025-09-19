import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { WorkoutSheet } from '@/lib/types';
import { WorkoutSheetDialog } from '@/components/workouts/WorkoutSheetDialog';
import { Eye, Calendar, User } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function StudentWorkout() {
  const [workoutSheets, setWorkoutSheets] = useState<WorkoutSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutSheet | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { profile } = useAuth();

  useEffect(() => {
    if (profile?.id) {
      fetchWorkoutSheets();
    }
  }, [profile]);

  const fetchWorkoutSheets = async () => {
    if (!profile?.id) return;

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
        .eq('student_id', profile.id)
        .eq('is_active', true)
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

  const handleViewWorkout = (workout: WorkoutSheet) => {
    setSelectedWorkout(workout);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-9 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Minhas Fichas de Treino</h1>
        <p className="text-muted-foreground">
          Visualize suas fichas de treino criadas pelo seu instrutor
        </p>
      </div>

      {workoutSheets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma ficha de treino</h3>
            <p className="text-muted-foreground text-center">
              Você ainda não possui fichas de treino criadas.<br />
              Entre em contato com seu instrutor para criar sua primeira ficha.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workoutSheets.map((workout) => (
            <Card key={workout.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
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

                <Button 
                  onClick={() => handleViewWorkout(workout)}
                  className="w-full"
                  variant="outline"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Ficha
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <WorkoutSheetDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        workoutSheet={selectedWorkout}
        onSuccess={fetchWorkoutSheets}
        readOnly={true}
      />
    </div>
  );
}