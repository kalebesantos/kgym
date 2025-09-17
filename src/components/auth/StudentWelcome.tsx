import { User, CreditCard, Calendar, QrCode, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function StudentWelcome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <User className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            Área do Aluno
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Acesse sua área pessoal para gerenciar seu plano, fazer check-in e acompanhar sua evolução na academia.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="shadow-card hover:shadow-primary transition-all duration-300">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Meu Plano</CardTitle>
              <CardDescription>
                Visualize detalhes do seu plano atual, vencimento e histórico
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className="mb-2">Disponível</Badge>
              <p className="text-sm text-muted-foreground">
                Acompanhe o progresso do seu plano e receba alertas de vencimento
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-primary transition-all duration-300">
            <CardHeader>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <QrCode className="h-6 w-6 text-accent" />
              </div>
              <CardTitle>Check-in Rápido</CardTitle>
              <CardDescription>
                Faça check-in na academia usando seu código QR pessoal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className="mb-2">Disponível</Badge>
              <p className="text-sm text-muted-foreground">
                Sistema rápido e seguro para registrar sua presença
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-primary transition-all duration-300">
            <CardHeader>
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-secondary" />
              </div>
              <CardTitle>Dashboard Pessoal</CardTitle>
              <CardDescription>
                Acompanhe sua frequência e estatísticas pessoais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className="mb-2">Disponível</Badge>
              <p className="text-sm text-muted-foreground">
                Visualize seus check-ins recentes e métricas de uso
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Login Section */}
        <Card className="shadow-card max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Acesse sua Conta</CardTitle>
            <CardDescription>
              Faça login para acessar todas as funcionalidades
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium">Use seu email cadastrado</p>
                  <p className="text-sm text-muted-foreground">
                    O mesmo email usado no cadastro
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium">Digite os 6 primeiros dígitos do CPF</p>
                  <p className="text-sm text-muted-foreground">
                    Exemplo: 123456 (sem pontos ou hífens)
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <p className="text-sm text-muted-foreground text-center mb-4">
                Não tem uma conta? Entre em contato com a academia para se cadastrar.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-muted-foreground">
          <p>KGym - Sistema de Gestão para Academias</p>
          <p>Transformando a gestão de academias com tecnologia moderna! 🏋️‍♂️💪</p>
        </div>
      </div>
    </div>
  );
}
