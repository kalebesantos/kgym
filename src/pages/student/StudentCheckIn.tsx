import { useState, useEffect } from "react";
import { QrCode, Scan, Clock, CheckCircle, AlertCircle, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";

interface StudentPlan {
  id: string;
  status: string;
  end_date: string;
  plans: {
    name: string;
  };
}

export default function StudentCheckIn() {
  const [loading, setLoading] = useState(false);
  const [lastCheckIn, setLastCheckIn] = useState<any>(null);
  const [studentPlan, setStudentPlan] = useState<StudentPlan | null>(null);
  const [qrCode, setQrCode] = useState<string>("");
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (profile) {
      fetchStudentPlan();
      generateQRCode();
    }
  }, [profile]);

  const fetchStudentPlan = async () => {
    try {
      const { data, error } = await supabase
        .from('student_plans')
        .select(`
          *,
          plans (
            name
          )
        `)
        .eq('student_id', profile?.id)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching plan:', error);
      } else if (data) {
        setStudentPlan(data);
      }
    } catch (error) {
      console.error('Error fetching student plan:', error);
    }
  };

  const generateQRCode = () => {
    if (profile) {
      const qrData = `KGYM-CHECKIN-${profile.id}`;
      setQrCode(qrData);
    }
  };

  const processCheckIn = async () => {
    if (!profile || !studentPlan) return;

    setLoading(true);
    try {
      // Check if plan is expired
      const endDate = new Date(studentPlan.end_date);
      const today = new Date();
      
      if (endDate < today) {
        throw new Error('Seu plano expirou. Renove para continuar usando a academia.');
      }

      // Check if plan is active
      if (studentPlan.status !== 'active') {
        throw new Error('Seu plano não está ativo. Entre em contato com a academia.');
      }

      // Create check-in record
      const { error: checkInError } = await supabase
        .from('check_ins')
        .insert({
          student_id: profile.id,
          check_in_time: new Date().toISOString(),
        });

      if (checkInError) throw checkInError;

      setLastCheckIn({
        student_name: profile.full_name,
        plan_name: studentPlan.plans.name,
        time: new Date(),
      });

      toast({
        title: "Check-in realizado!",
        description: `Bem-vindo à academia, ${profile.full_name}!`,
      });

    } catch (error: any) {
      console.error('Check-in error:', error);
      toast({
        title: "Erro no check-in",
        description: error.message || "Erro ao processar check-in",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPlanStatus = () => {
    if (!studentPlan) {
      return { status: 'inactive', label: 'Sem Plano', variant: 'secondary' as const };
    }

    const endDate = new Date(studentPlan.end_date);
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

  const planStatus = getPlanStatus();
  const canCheckIn = planStatus.status === 'active';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Check-in
        </h1>
        <p className="text-muted-foreground">
          Faça check-in na academia usando seu código QR
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Check-in Status */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Status da Conta
            </CardTitle>
            <CardDescription>
              Informações sobre seu plano e acesso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Plano Atual</span>
              <Badge variant={planStatus.variant}>
                {studentPlan ? studentPlan.plans.name : 'Sem Plano'}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant={planStatus.variant}>
                {planStatus.label}
              </Badge>
            </div>

            {studentPlan && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Vencimento</span>
                <span className="text-sm font-medium">
                  {new Date(studentPlan.end_date).toLocaleDateString('pt-BR')}
                </span>
              </div>
            )}

            {!canCheckIn && (
              <Alert variant={planStatus.status === 'expired' ? 'destructive' : 'default'}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {planStatus.status === 'expired' 
                    ? 'Seu plano expirou. Renove para continuar usando a academia.'
                    : 'Seu plano não está ativo. Entre em contato com a academia.'
                  }
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* QR Code */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Seu Código QR
            </CardTitle>
            <CardDescription>
              Use este código para fazer check-in na academia
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <div className="font-mono text-sm break-all">
                {qrCode}
              </div>
            </div>

            <Button 
              onClick={processCheckIn}
              disabled={!canCheckIn || loading}
              className="w-full"
              variant="primary"
            >
              {loading ? "Processando..." : "Fazer Check-in"}
            </Button>

            {lastCheckIn && (
              <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                <div className="flex items-center gap-2 text-success mb-2">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Check-in realizado!</span>
                </div>
                <div className="text-sm">
                  <p><strong>{lastCheckIn.student_name}</strong></p>
                  <p>Plano: {lastCheckIn.plan_name}</p>
                  <p>Horário: {lastCheckIn.time.toLocaleTimeString('pt-BR')}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Como usar o Check-in
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                1
              </div>
              <div>
                <p className="font-medium">Verifique seu status</p>
                <p className="text-sm text-muted-foreground">
                  Certifique-se de que seu plano está ativo antes de tentar fazer check-in
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                2
              </div>
              <div>
                <p className="font-medium">Use o código QR</p>
                <p className="text-sm text-muted-foreground">
                  Apresente seu código QR no leitor da academia ou use o botão "Fazer Check-in"
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                3
              </div>
              <div>
                <p className="font-medium">Confirmação</p>
                <p className="text-sm text-muted-foreground">
                  Aguarde a confirmação do check-in para ter acesso à academia
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>Nota:</strong> Apenas alunos com planos ativos podem fazer check-in. 
              Se você tiver problemas, entre em contato com a recepção da academia.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
