-- KGym Database Schema

-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  cpf TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create plans table
CREATE TABLE public.plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration_months INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create student_plans table (relationship between students and plans)
CREATE TABLE public.student_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create check_ins table
CREATE TABLE public.check_ins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  check_in_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can manage all profiles" 
ON public.profiles FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Plans policies
CREATE POLICY "Anyone can view active plans" 
ON public.plans FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage plans" 
ON public.plans FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Student plans policies
CREATE POLICY "Students can view their own plans" 
ON public.student_plans FOR SELECT 
USING (
  student_id = (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all student plans" 
ON public.student_plans FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Check-ins policies
CREATE POLICY "Students can view their own check-ins" 
ON public.check_ins FOR SELECT 
USING (
  student_id = (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Students can create their own check-ins" 
ON public.check_ins FOR INSERT 
WITH CHECK (
  student_id = (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all check-ins" 
ON public.check_ins FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

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

-- Insert sample plans
INSERT INTO public.plans (name, description, price, duration_months) VALUES
('Mensal', 'Plano básico mensal com acesso completo à academia', 89.90, 1),
('Trimestral', 'Plano trimestral com desconto especial', 249.90, 3),
('Anual', 'Plano anual com maior economia e benefícios extras', 899.90, 12);

-- Create function to generate QR code data
CREATE OR REPLACE FUNCTION public.generate_student_qr_code(student_uuid UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN 'KGYM-CHECKIN-' || student_uuid::TEXT;
END;
$$ LANGUAGE plpgsql SET search_path = public;