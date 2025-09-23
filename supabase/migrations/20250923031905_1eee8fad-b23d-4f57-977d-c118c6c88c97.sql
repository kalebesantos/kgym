-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  cpf TEXT,
  role TEXT NOT NULL DEFAULT 'student',
  face_encoding TEXT,
  profile_photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create plans table
CREATE TABLE public.plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  duration_months INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create student_plans table
CREATE TABLE public.student_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  plan_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create check_ins table
CREATE TABLE public.check_ins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  check_in_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workout_sheets table
CREATE TABLE public.workout_sheets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  student_id UUID NOT NULL,
  created_by UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exercises table
CREATE TABLE public.exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_sheet_id UUID NOT NULL,
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
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_plans_updated_at
  BEFORE UPDATE ON public.student_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workout_sheets_updated_at
  BEFORE UPDATE ON public.workout_sheets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at
  BEFORE UPDATE ON public.exercises
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create security definer functions
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.generate_student_qr_code(student_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN 'KGYM-CHECKIN-' || student_uuid::TEXT;
END;
$$;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all profiles"
ON public.profiles
FOR ALL
USING (public.is_admin() = true);

-- Create RLS policies for plans
CREATE POLICY "Anyone can view active plans"
ON public.plans
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage plans"
ON public.plans
FOR ALL
USING (public.is_admin() = true);

-- Create RLS policies for student_plans
CREATE POLICY "Students can view their own plans"
ON public.student_plans
FOR SELECT
USING (student_id = (
  SELECT profiles.id
  FROM profiles
  WHERE profiles.user_id = auth.uid()
));

CREATE POLICY "Admins can manage all student plans"
ON public.student_plans
FOR ALL
USING (public.is_admin() = true);

-- Create RLS policies for check_ins
CREATE POLICY "Students can view their own check-ins"
ON public.check_ins
FOR SELECT
USING (student_id = (
  SELECT profiles.id
  FROM profiles
  WHERE profiles.user_id = auth.uid()
));

CREATE POLICY "Students can create their own check-ins"
ON public.check_ins
FOR INSERT
WITH CHECK (student_id = (
  SELECT profiles.id
  FROM profiles
  WHERE profiles.user_id = auth.uid()
));

CREATE POLICY "Admins can view all check-ins"
ON public.check_ins
FOR SELECT
USING (public.is_admin() = true);

-- Create RLS policies for workout_sheets
CREATE POLICY "Students can view their own workout sheets"
ON public.workout_sheets
FOR SELECT
USING (student_id = (
  SELECT profiles.id
  FROM profiles
  WHERE profiles.user_id = auth.uid()
));

CREATE POLICY "Admins can manage all workout sheets"
ON public.workout_sheets
FOR ALL
USING (public.is_admin() = true);

-- Create RLS policies for exercises
CREATE POLICY "Students can view exercises from their workout sheets"
ON public.exercises
FOR SELECT
USING (workout_sheet_id IN (
  SELECT workout_sheets.id
  FROM workout_sheets
  WHERE workout_sheets.student_id = (
    SELECT profiles.id
    FROM profiles
    WHERE profiles.user_id = auth.uid()
  )
));

CREATE POLICY "Admins can manage all exercises"
ON public.exercises
FOR ALL
USING (public.is_admin() = true);

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    'student'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();