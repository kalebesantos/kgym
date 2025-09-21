import { useState } from "react";
import { QrCode, Scan, Clock, CheckCircle, History, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckInHistoryDialog } from "@/components/checkins/CheckInHistoryDialog";
import { FaceRecognitionCamera } from "@/components/face/FaceRecognitionCamera";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";

export default function CheckIn() {
  const [qrInput, setQrInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastCheckIn, setLastCheckIn] = useState<any>(null);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  const processCheckIn = async (qrCode: string) => {
    setLoading(true);
    try {
      // Extract student ID from QR code format: "KGYM-CHECKIN-{student_id}"
      const parts = qrCode.split('-');
      if (parts.length !== 3 || parts[0] !== 'KGYM' || parts[1] !== 'CHECKIN') {
        throw new Error('QR Code inválido');
      }

      const studentId = parts[2];

      // Verify student exists and has active plan
      const { data: student, error: studentError } = await supabase
        .from('profiles')
        .select(`
          *,
          student_plans (
            status,
            end_date,
            plans (name)
          )
        `)
        .eq('id', studentId)
        .eq('role', 'student')
        .single();

      if (studentError || !student) {
        throw new Error('Aluno não encontrado');
      }

      const activePlan = student.student_plans?.find((sp: any) => sp.status === 'active');
      if (!activePlan) {
        throw new Error('Aluno sem plano ativo');
      }

      // Check if plan is expired
      const endDate = new Date(activePlan.end_date);
      const today = new Date();
      if (endDate < today) {
        throw new Error('Plano expirado');
      }

      // Create check-in record
      const { error: checkInError } = await supabase
        .from('check_ins')
        .insert({
          student_id: studentId,
          check_in_time: new Date().toISOString(),
        });

      if (checkInError) throw checkInError;

      setLastCheckIn({
        student_name: student.full_name,
        plan_name: activePlan.plans?.name,
        time: new Date(),
      });

      toast({
        title: "Check-in realizado!",
        description: `${student.full_name} fez check-in com sucesso`,
      });

      setQrInput("");
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (qrInput.trim()) {
      processCheckIn(qrInput.trim());
    }
  };

  const generateStudentQR = (studentId: string) => {
    return `KGYM-CHECKIN-${studentId}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Check-in
          </h1>
          <p className="text-muted-foreground">
            Sistema de controle de acesso à academia
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setShowHistoryDialog(true)}
          className="flex items-center gap-2"
        >
          <History className="h-4 w-4" />
          Histórico
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Método de Check-in */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Check-in do Aluno
            </CardTitle>
            <CardDescription>
              Escolha o método de check-in: reconhecimento facial ou QR Code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="face" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="face" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Reconhecimento Facial
                </TabsTrigger>
                <TabsTrigger value="qr" className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  QR Code
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="face" className="mt-4">
                <FaceRecognitionCamera
                  onRecognized={(studentId) => processCheckIn(`KGYM-CHECKIN-${studentId}`)}
                  onFallbackToQR={() => {
                    // Switch to QR tab
                    const qrTab = document.querySelector('[value="qr"]') as HTMLElement;
                    qrTab?.click();
                  }}
                />
              </TabsContent>
              
              <TabsContent value="qr" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Scan className="h-5 w-5" />
                      Scanner de QR Code
                    </CardTitle>
                    <CardDescription>
                      Escaneie ou digite o código QR do aluno
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Input
                          placeholder="Código QR do aluno (KGYM-CHECKIN-...)"
                          value={qrInput}
                          onChange={(e) => setQrInput(e.target.value)}
                          className="font-mono"
                        />
                      </div>
                      <Button 
                        type="submit" 
                        variant="primary" 
                        className="w-full"
                        disabled={loading || !qrInput.trim()}
                      >
                        {loading ? "Processando..." : "Fazer Check-in"}
                      </Button>
                    </form>

                    {lastCheckIn && (
                      <div className="mt-6 p-4 bg-success/10 border border-success/20 rounded-lg">
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
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Como usar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium">Reconhecimento Facial</p>
                  <p className="text-sm text-muted-foreground">
                    Posicione o rosto do aluno na moldura circular e clique em "Escanear Face"
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium">QR Code Alternativo</p>
                  <p className="text-sm text-muted-foreground">
                    Use um leitor de QR Code ou digite manualmente no formato KGYM-CHECKIN-{"{ID}"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium">Confirmação automática</p>
                  <p className="text-sm text-muted-foreground">
                    O sistema verifica o plano e registra o acesso
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                <strong>Nota:</strong> Para usar reconhecimento facial, o aluno deve ter cadastrado sua foto no perfil.
                Apenas alunos com planos ativos podem fazer check-in.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Check-ins */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Check-ins Recentes
          </CardTitle>
          <CardDescription>
            Últimos acessos registrados hoje
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>Nenhum check-in registrado hoje</p>
            <p className="text-sm">
              Os check-ins aparecerão aqui conforme forem realizados
            </p>
          </div>
        </CardContent>
      </Card>

      <CheckInHistoryDialog
        open={showHistoryDialog}
        onOpenChange={setShowHistoryDialog}
      />
    </div>
  );
}