import { useEffect, useState } from "react";
import { Users, CreditCard, Activity, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  totalPlans: number;
  todayCheckins: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    activeStudents: 0,
    totalPlans: 0,
    todayCheckins: 0,
  });
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    if (profile) {
      fetchStats();
    }
  }, [profile]);

  const fetchStats = async () => {
    try {
      // Total students
      const { count: totalStudents } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student');

      // Active students (with active plans)
      const { count: activeStudents } = await supabase
        .from('student_plans')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Total plans
      const { count: totalPlans } = await supabase
        .from('plans')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Today's check-ins
      const today = new Date().toISOString().split('T')[0];
      const { count: todayCheckins } = await supabase
        .from('check_ins')
        .select('*', { count: 'exact', head: true })
        .gte('check_in_time', today);

      setStats({
        totalStudents: totalStudents || 0,
        activeStudents: activeStudents || 0,
        totalPlans: totalPlans || 0,
        todayCheckins: todayCheckins || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total de Alunos",
      value: stats.totalStudents,
      description: "Alunos cadastrados",
      icon: Users,
      gradient: "bg-gradient-primary",
    },
    {
      title: "Alunos Ativos",
      value: stats.activeStudents,
      description: "Com planos ativos",
      icon: TrendingUp,
      gradient: "bg-gradient-accent",
    },
    {
      title: "Planos Disponíveis",
      value: stats.totalPlans,
      description: "Planos ativos",
      icon: CreditCard,
      gradient: "bg-gradient-dark",
    },
    {
      title: "Check-ins Hoje",
      value: stats.todayCheckins,
      description: "Frequência do dia",
      icon: Activity,
      gradient: "bg-gradient-primary",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Carregando dados...
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-20"></div>
                <div className="h-4 w-4 bg-muted rounded"></div>
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Bem-vindo ao sistema de gestão do KGym, {profile?.full_name}!
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => (
          <Card key={index} className="shadow-card hover:shadow-primary transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.gradient}`}>
                <card.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>
              Últimas atividades do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Sistema iniciado</p>
                  <p className="text-xs text-muted-foreground">Há alguns minutos</p>
                </div>
              </div>
              <div className="text-center py-8 text-muted-foreground">
                <p>Mais atividades aparecerão aqui conforme você usar o sistema</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Próximos Vencimentos</CardTitle>
            <CardDescription>
              Planos que vencem em breve
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum vencimento próximo</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}