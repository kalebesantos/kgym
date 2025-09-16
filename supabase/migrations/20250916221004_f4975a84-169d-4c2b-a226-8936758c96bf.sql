-- Fix infinite recursion in RLS policies

-- First, create security definer functions to avoid recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage plans" ON public.plans;
DROP POLICY IF EXISTS "Admins can manage all student plans" ON public.student_plans;
DROP POLICY IF EXISTS "Admins can view all check-ins" ON public.check_ins;

-- Create new policies using security definer functions
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (public.is_admin() = true);

CREATE POLICY "Admins can manage all profiles" 
ON public.profiles FOR ALL 
USING (public.is_admin() = true);

CREATE POLICY "Admins can manage plans" 
ON public.plans FOR ALL 
USING (public.is_admin() = true);

CREATE POLICY "Admins can manage all student plans" 
ON public.student_plans FOR ALL 
USING (public.is_admin() = true);

CREATE POLICY "Admins can view all check-ins" 
ON public.check_ins FOR SELECT 
USING (public.is_admin() = true);