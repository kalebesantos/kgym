import { useEffect, useState } from "react";
import { CreditCard, Calendar, DollarSign, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";

interface StudentPlan {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
  plans: {
    name: string;
    description: string | null;
    price: number;
    duration_months: number;
  };
}

export default function StudentPlan() {
  const [plan, setPlan] = useState<StudentPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (profile) {
      fetchStudentPlan();
    }
  }, [profile]);

  const fetchStudentPlan = async () => {
    try {
      const { data, error } = await supabase
        .from('student_plans')
        .select(`
          *,
          plans (
            name,
            description,
            price,
            duration_months
          )
        `)
        .eq('student_id', profile?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching plan:', error);
        throw error;
      }

      // Get the most recent plan (active or not)
      setPlan(data?.[0] || null);
    } catch (error) {
      console.error('Error fetching student plan:', error);
      toast({
        title: "Erro ao carregar plano",
        description: "Não foi possível carregar as informações do seu plano",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPlanStatus = () => {
    if (!plan) return { status: 'inactive', label: 'Sem Plano', variant: 'secondary' as const };

    const endDate = new Date(plan.end_date);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (plan.status === 'inactive') {
      return { status: 'inactive', label: 'Inativo', variant: 'secondary' as const };
    } else if (plan.status === 'expired') {
      return { status: 'expired', label: 'Expirado', variant: 'destructive' as const };
    } else if (daysUntilExpiry <= 0) {
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
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getDaysUntilExpiry = () => {
    if (!plan) return 0;
    const endDate = new Date(plan.end_date);
    const today = new Date();
    return Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getProgressPercentage = () => {
    if (!plan) return 0;
    const startDate = new Date(plan.start_date);
    const endDate = new Date(plan.end_date);
    const today = new Date();
    
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysPassed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return Math.min(Math.max((daysPassed / totalDays) * 100, 0), 100);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Meu Plano
          </h1>
          <p className="text-muted-foreground">
            Carregando informações do seu plano...
          </p>
        </div>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-32"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded w-48"></div>
              <div className="h-4 bg-muted rounded w-24"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const planStatus = getPlanStatus();
  const daysUntilExpiry = getDaysUntilExpiry();
  const progressPercentage = getProgressPercentage();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Meu Plano
        </h1>
        <p className="text-muted-foreground">
          Informações detalhadas sobre seu plano na academia
        </p>
      </div>

      {plan ? (
        <div className="space-y-6">
          {/* Plan Overview */}
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    {plan.plans.name}
                  </CardTitle>
                  <CardDescription>
                    {plan.plans.description || 'Plano de academia'}
                  </CardDescription>
                </div>
                <Badge variant={planStatus.variant} className="text-sm">
                  {planStatus.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Plan Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Valor</span>
                  </div>
                  <p className="text-2xl font-bold">{formatPrice(plan.plans.price)}</p>
                  <p className="text-xs text-muted-foreground">
                    por {plan.plans.duration_months} mês{plan.plans.duration_months > 1 ? 'es' : ''}
                  </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Início</span>
                  </div>
                  <p className="text-lg font-semibold">{formatDate(plan.start_date)}</p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Vencimento</span>
                  </div>
                  <p className="text-lg font-semibold">{formatDate(plan.end_date)}</p>
                  {daysUntilExpiry > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {daysUntilExpiry} dia{daysUntilExpiry > 1 ? 's' : ''} restante{daysUntilExpiry > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progresso do Plano</span>
                  <span className="font-medium">{Math.round(progressPercentage)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* Status Alerts */}
              {planStatus.status === 'expiring' && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Seu plano vence em {daysUntilExpiry} dia{daysUntilExpiry > 1 ? 's' : ''}. 
                    Entre em contato com a academia para renovação.
                  </AlertDescription>
                </Alert>
              )}

              {planStatus.status === 'expired' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Seu plano expirou. Renove para continuar usando a academia.
                  </AlertDescription>
                </Alert>
              )}

              {planStatus.status === 'active' && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Seu plano está ativo e você pode usar a academia normalmente.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Plan History */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Histórico do Plano</CardTitle>
              <CardDescription>
                Informações sobre quando seu plano foi ativado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">Plano Ativado</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(plan.created_at)}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {planStatus.label}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="shadow-card">
          <CardContent className="py-12">
            <div className="text-center">
              <CreditCard className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">Nenhum Plano Ativo</h3>
              <p className="text-muted-foreground mb-4">
                Você não possui um plano ativo no momento.
              </p>
              <p className="text-sm text-muted-foreground">
                Entre em contato com a academia para adquirir um plano e começar a treinar.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
