export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone?: string;
  cpf?: string;
  role: 'admin' | 'student';
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration_months: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentPlan {
  id: string;
  student_id: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'inactive' | 'expired';
  created_at: string;
  updated_at: string;
  plans?: Plan;
}

export interface CheckIn {
  id: string;
  student_id: string;
  check_in_time: string;
  created_at: string;
}