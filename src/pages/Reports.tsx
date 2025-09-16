import { useEffect, useState } from "react";
import { BarChart3, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState({
    monthlyRevenue: 0,
    monthlyCheckIns: 0,
    studentsGrowth: 0,
    planDistribution: [] as any[],
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      // Monthly revenue calculation
      const currentMonth = new Date();
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      
      const { data: activePlans } = await supabase
        .from('student_plans')
        .select(`
          plans (
            price
          )
        `)
        .eq('status', 'active')
        .gte('start_date', startOfMonth.toISOString().split('T')[0]);

      const monthlyRevenue = activePlans?.reduce((sum, plan: any) => 
        sum + (plan.plans?.price || 0), 0) || 0;

      // Monthly check-ins
      const { count: monthlyCheckIns } = await supabase
        .from('check_ins')
        .select('*', { count: 'exact', head: true })
        .gte('check_in_time', startOfMonth.toISOString());

      // Plan distribution
      const { data: planDistribution } = await supabase
        .from('student_plans')
        .select(`
          plans (
            name,
            price
          )
        `)
        .eq('status', 'active');

      const distribution = planDistribution?.reduce((acc: any, item: any) => {
        const planName = item.plans?.name || 'Desconhecido';
        acc[planName] = (acc[planName] || 0) + 1;
        return acc;
      }, {});

      const planDistributionArray = Object.entries(distribution || {}).map(([name, count]) => ({
        name,
        count,
      }));

      setReports({
        monthlyRevenue,
        monthlyCheckIns: monthlyCheckIns || 0,
        studentsGrowth: 0, // Placeholder
        planDistribution: planDistributionArray,
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Relatórios
          </h1>
          <p className="text-muted-foreground">
            Carregando dados...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Relatórios
        </h1>
        <p className="text-muted-foreground">
          Análise de desempenho e métricas da academia
        </p>
      </div>

      {/* Revenue Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Receita Mensal
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(reports.monthlyRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Baseado em planos ativos
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Check-ins no Mês
            </CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports.monthlyCheckIns}
            </div>
            <p className="text-xs text-muted-foreground">
              Acessos registrados
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Crescimento
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              +{reports.studentsGrowth}%
            </div>
            <p className="text-xs text-muted-foreground">
              Novos alunos este mês
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa de Retenção
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              85%
            </div>
            <p className="text-xs text-muted-foreground">
              Alunos que renovaram
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Plan Distribution */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Distribuição de Planos</CardTitle>
            <CardDescription>
              Número de alunos por tipo de plano
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reports.planDistribution.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>Nenhum dado disponível</p>
                <p className="text-sm">
                  Cadastre alunos com planos para ver a distribuição
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.planDistribution.map((plan, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        index === 0 ? 'bg-primary' : 
                        index === 1 ? 'bg-accent' : 'bg-secondary'
                      }`} />
                      <span className="font-medium">{plan.name}</span>
                    </div>
                    <span className="text-2xl font-bold">{plan.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Frequência Semanal</CardTitle>
            <CardDescription>
              Check-ins por dia da semana
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>Em desenvolvimento</p>
              <p className="text-sm">
                Gráfico de frequência será implementado em breve
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Métricas de Performance</CardTitle>
          <CardDescription>
            Indicadores importantes do negócio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(reports.monthlyRevenue / Math.max(reports.planDistribution.reduce((sum, plan) => sum + plan.count, 0), 1))}
              </div>
              <p className="text-sm text-muted-foreground">Receita Média por Aluno</p>
            </div>
            
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-accent">
                {Math.round(reports.monthlyCheckIns / Math.max(reports.planDistribution.reduce((sum, plan) => sum + plan.count, 0), 1))}
              </div>
              <p className="text-sm text-muted-foreground">Check-ins Médios por Aluno</p>
            </div>
            
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-success">
                {reports.planDistribution.reduce((sum, plan) => sum + plan.count, 0)}
              </div>
              <p className="text-sm text-muted-foreground">Total de Alunos Ativos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}