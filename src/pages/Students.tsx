import { useEffect, useState } from "react";
import { Plus, Search, MoreHorizontal, Edit, Trash2, Users, CreditCard } from "lucide-react";
import { AddStudentDialog } from "@/components/students/AddStudentDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";

interface Student {
  id: string;
  full_name: string;
  phone: string;
  cpf: string;
  created_at: string;
  student_plans?: {
    status: string;
    plan_id: string;
    end_date: string;
    plans: {
      name: string;
    };
  }[];
}

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          student_plans (
            status,
            plan_id,
            end_date,
            plans (
              name
            )
          )
        `)
        .eq('role', 'student')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching students:', error);
        throw error;
      }
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStudentStatus = (student: Student) => {
    if (!student.student_plans || student.student_plans.length === 0) {
      return { status: 'inactive', label: 'Sem Plano', variant: 'secondary' as const };
    }

    const activePlan = student.student_plans.find(sp => sp.status === 'active');
    if (activePlan) {
      const endDate = new Date(activePlan.end_date);
      const today = new Date();
      const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry <= 0) {
        return { status: 'expired', label: 'Expirado', variant: 'destructive' as const };
      } else if (daysUntilExpiry <= 7) {
        return { status: 'expiring', label: 'Expirando', variant: 'outline' as const };
      } else {
        return { status: 'active', label: 'Ativo', variant: 'default' as const };
      }
    }

    return { status: 'inactive', label: 'Inativo', variant: 'secondary' as const };
  };

  const getCurrentPlan = (student: Student) => {
    if (!student.student_plans || student.student_plans.length === 0) {
      return '-';
    }
    const activePlan = student.student_plans.find(sp => sp.status === 'active');
    return activePlan?.plans?.name || '-';
  };

  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.cpf && student.cpf.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Alunos
          </h1>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              Carregando alunos...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Alunos
          </h1>
          <p className="text-muted-foreground">
            Gerencie os alunos da academia
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Aluno
        </Button>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Lista de Alunos</CardTitle>
          <CardDescription>
            {students.length} aluno{students.length !== 1 ? 's' : ''} cadastrado{students.length !== 1 ? 's' : ''}
          </CardDescription>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, telefone ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>Nenhum aluno encontrado</p>
              <p className="text-sm">
                {students.length === 0 
                  ? "Comece cadastrando seu primeiro aluno" 
                  : "Tente ajustar os filtros de busca"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Plano Atual</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => {
                  const status = getStudentStatus(student);
                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        {student.full_name}
                      </TableCell>
                      <TableCell>{student.phone || '-'}</TableCell>
                      <TableCell>{student.cpf || '-'}</TableCell>
                      <TableCell>{getCurrentPlan(student)}</TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(student.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <CreditCard className="h-4 w-4 mr-2" />
                              Gerenciar Plano
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddStudentDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onStudentAdded={fetchStudents}
      />
    </div>
  );
}