import { useState, useEffect } from "react";
import { Calendar, Clock, User, Trash2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CheckIn {
  id: string;
  student_id: string;
  check_in_time: string;
  created_at: string;
  profiles: {
    full_name: string;
    phone: string | null;
  };
}

interface CheckInHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCheckInDeleted?: () => void;
}

export function CheckInHistoryDialog({ open, onOpenChange, onCheckInDeleted }: CheckInHistoryDialogProps) {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCheckIn, setSelectedCheckIn] = useState<CheckIn | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchCheckIns();
    }
  }, [open]);

  const fetchCheckIns = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('check_ins')
        .select(`
          *,
          profiles (
            full_name,
            phone
          )
        `)
        .order('check_in_time', { ascending: false })
        .limit(100);

      if (error) throw error;
      setCheckIns(data || []);
    } catch (error) {
      console.error('Error fetching check-ins:', error);
      toast({
        title: "Erro ao carregar check-ins",
        description: "Não foi possível carregar o histórico de check-ins",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCheckIn = (checkIn: CheckIn) => {
    setSelectedCheckIn(checkIn);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedCheckIn) return;

    try {
      const { error } = await supabase
        .from('check_ins')
        .delete()
        .eq('id', selectedCheckIn.id);

      if (error) throw error;

      toast({
        title: "Check-in excluído",
        description: "Check-in foi excluído com sucesso!",
      });

      fetchCheckIns();
      onCheckInDeleted?.();
      setShowDeleteDialog(false);
    } catch (error: any) {
      console.error('Error deleting check-in:', error);
      toast({
        title: "Erro ao excluir check-in",
        description: error.message || "Erro inesperado ao excluir check-in",
        variant: "destructive",
      });
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const filteredCheckIns = checkIns.filter(checkIn =>
    checkIn.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (checkIn.profiles.phone && checkIn.profiles.phone.includes(searchTerm))
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Histórico de Check-ins
            </DialogTitle>
            <DialogDescription>
              Visualize e gerencie o histórico de check-ins dos alunos
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <div className="border rounded-lg max-h-[50vh] overflow-auto">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">
                  Carregando check-ins...
                </div>
              ) : filteredCheckIns.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>Nenhum check-in encontrado</p>
                  <p className="text-sm">
                    {searchTerm ? "Tente ajustar os filtros de busca" : "Os check-ins aparecerão aqui"}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aluno</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Horário</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCheckIns.map((checkIn) => {
                      const { date, time } = formatDateTime(checkIn.check_in_time);
                      return (
                        <TableRow key={checkIn.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              {checkIn.profiles.full_name}
                            </div>
                          </TableCell>
                          <TableCell>{date}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              {time}
                            </div>
                          </TableCell>
                          <TableCell>{checkIn.profiles.phone || '-'}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCheckIn(checkIn)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>

            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>
                {filteredCheckIns.length} check-in{filteredCheckIns.length !== 1 ? 's' : ''} encontrado{filteredCheckIns.length !== 1 ? 's' : ''}
              </span>
              <span>
                Mostrando últimos 100 registros
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Check-in</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este check-in?
              <br />
              <br />
              <strong>Aluno:</strong> {selectedCheckIn?.profiles.full_name}
              <br />
              <strong>Data:</strong> {selectedCheckIn && formatDateTime(selectedCheckIn.check_in_time).date}
              <br />
              <strong>Horário:</strong> {selectedCheckIn && formatDateTime(selectedCheckIn.check_in_time).time}
              <br />
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir Check-in
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
