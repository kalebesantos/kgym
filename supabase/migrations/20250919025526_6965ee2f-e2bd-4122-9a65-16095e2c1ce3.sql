-- Create workout_sheets table for training plans
CREATE TABLE public.workout_sheets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Create exercises table for individual exercises in workout sheets
CREATE TABLE public.exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_sheet_id UUID NOT NULL REFERENCES public.workout_sheets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  muscle_group TEXT,
  sets INTEGER,
  reps TEXT,
  weight TEXT,
  rest_time TEXT,
  instructions TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.workout_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workout_sheets
CREATE POLICY "Admins can manage all workout sheets" 
ON public.workout_sheets 
FOR ALL 
USING (is_admin() = true);

CREATE POLICY "Students can view their own workout sheets" 
ON public.workout_sheets 
FOR SELECT 
USING (student_id = (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()));

-- RLS Policies for exercises
CREATE POLICY "Admins can manage all exercises" 
ON public.exercises 
FOR ALL 
USING (is_admin() = true);

CREATE POLICY "Students can view exercises from their workout sheets" 
ON public.exercises 
FOR SELECT 
USING (workout_sheet_id IN (
  SELECT id FROM public.workout_sheets 
  WHERE student_id = (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid())
));

-- Create indexes for performance
CREATE INDEX idx_workout_sheets_student_id ON public.workout_sheets(student_id);
CREATE INDEX idx_exercises_workout_sheet_id ON public.exercises(workout_sheet_id);
CREATE INDEX idx_exercises_order ON public.exercises(workout_sheet_id, order_index);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_workout_sheets_updated_at
BEFORE UPDATE ON public.workout_sheets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at
BEFORE UPDATE ON public.exercises
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();