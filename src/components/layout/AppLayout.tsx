import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/components/auth/AuthProvider";
import { LogoutDialog } from "@/components/ui/logout-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, LogOut, Settings } from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const { profile, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const confirmLogout = () => {
    setShowLogoutDialog(true);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <main className="flex-1 flex flex-col">
          <header className="h-16 border-b bg-card/50 backdrop-blur-sm flex items-center px-4 sticky top-0 z-40">
            <SidebarTrigger className="h-8 w-8" />
            <div className="flex-1" />
            
            {/* User Info and Logout */}
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground hidden sm:block">
                Sistema de Gestão KGym
              </div>
              
              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {profile?.name ? getInitials(profile.name) : 'A'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {profile?.name || 'Administrador'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {profile?.email || 'admin@kgym.com'}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4 mr-2" />
                    Configurações
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={confirmLogout} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Direct Logout Button (Mobile) */}
              <Button
                variant="ghost"
                size="sm"
                onClick={confirmLogout}
                className="text-destructive hover:text-destructive sm:hidden"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          
          <div className="flex-1 p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Logout Dialog */}
      <LogoutDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        onConfirm={handleLogout}
        title="Sair do Sistema de Gestão"
        description="Tem certeza que deseja sair do sistema de gestão? Você precisará fazer login novamente para acessar o painel administrativo."
      />
    </SidebarProvider>
  );
}