import { useEffect, useState } from "react";
import { Calendar, CreditCard, Activity, Clock, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

interface StudentPlan {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  plans: {
    name: string;
    price: number;
    duration_months: number;
  };
}

interface CheckIn {
  id: string;
  check_in_time: string;
}

export default function StudentDashboard() {
  const [plan, setPlan] = useState<StudentPlan | null>(null);
  const [recentCheckIns, setRecentCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    if (profile) {
      fetchStudentData();
    }
  }, [profile]);

  const fetchStudentData = async () => {
    try {
      // Fetch student's active plan
      const { data: planData, error: planError } = await supabase
        .from('student_plans')
        .select(`
          *,
          plans (
            name,
            price,
            duration_months
          )
        `)
        .eq('student_id', profile?.id)
        .eq('status', 'active')
        .single();

      if (planError && planError.code !== 'PGRST116') {
        console.error('Error fetching plan:', planError);
      } else if (planData) {
        setPlan(planData);
      }

      // Fetch recent check-ins (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: checkInData, error: checkInError } = await supabase
        .from('check_ins')
        .select('*')
        .eq('student_id', profile?.id)
        .gte('check_in_time', sevenDaysAgo.toISOString())
        .order('check_in_time', { ascending: false })
        .limit(5);

      if (checkInError) {
        console.error('Error fetching check-ins:', checkInError);
      } else {
        setRecentCheckIns(checkInData || []);
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlanStatus = () => {
    if (!plan) return { status: 'inactive', label: 'Sem Plano', variant: 'secondary' as const };

    const endDate = new Date(plan.end_date);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry <= 0) {
      return { status: 'expired', label: 'Expirado', variant: 'destructive' as const };
    } else if (daysUntilExpiry <= 7) {
      return { status: 'expiring', label: 'Expirando', variant: 'outline' as const };
    } else {
      return { status: 'active', label: 'Ativo', variant: 'default' as const };
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Carregando seus dados...
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-20"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16 mb-2"></div>
                <div className="h-3 bg-muted rounded w-24"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const planStatus = getPlanStatus();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Bem-vindo, {profile?.full_name}! Aqui está um resumo da sua conta.
        </p>
      </div>

      {/* Plan Status */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Meu Plano
          </CardTitle>
        </CardHeader>
        <CardContent>
          {plan ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{plan.plans.name}</h3>
                  <p className="text-muted-foreground">
                    {formatPrice(plan.plans.price)} • {plan.plans.duration_months} mês{plan.plans.duration_months > 1 ? 'es' : ''}
                  </p>
                </div>
                <Badge variant={planStatus.variant}>
                  {planStatus.label}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Início</p>
                  <p className="font-medium">{formatDate(plan.start_date)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Vencimento</p>
                  <p className="font-medium">{formatDate(plan.end_date)}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>Você não possui um plano ativo</p>
              <p className="text-sm">Entre em contato com a academia para adquirir um plano</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Check-ins Recentes
            </CardTitle>
            <CardDescription>
              Seus últimos acessos à academia
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentCheckIns.length > 0 ? (
              <div className="space-y-3">
                {recentCheckIns.map((checkIn) => {
                  const { date, time } = formatDateTime(checkIn.check_in_time);
                  return (
                    <div key={checkIn.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-success" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Check-in realizado</p>
                        <p className="text-xs text-muted-foreground">
                          {date} às {time}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>Nenhum check-in recente</p>
                <p className="text-sm">Seus check-ins aparecerão aqui</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Próximos Vencimentos
            </CardTitle>
            <CardDescription>
              Informações importantes sobre seu plano
            </CardDescription>
          </CardHeader>
          <CardContent>
            {plan ? (
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Status do Plano</p>
                  <p className="font-medium">{planStatus.label}</p>
                </div>
                
                {planStatus.status === 'expiring' && (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-sm text-orange-800">
                      ⚠️ Seu plano vence em breve. Entre em contato com a academia para renovação.
                    </p>
                  </div>
                )}
                
                {planStatus.status === 'expired' && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      ❌ Seu plano expirou. Renove para continuar usando a academia.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>Nenhum plano ativo</p>
                <p className="text-sm">Adquira um plano para ver informações aqui</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

