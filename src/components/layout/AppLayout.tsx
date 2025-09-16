import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <main className="flex-1 flex flex-col">
          <header className="h-16 border-b bg-card/50 backdrop-blur-sm flex items-center px-4 sticky top-0 z-40">
            <SidebarTrigger className="h-8 w-8" />
            <div className="flex-1" />
            <div className="text-sm text-muted-foreground">
              Sistema de Gestão KGym
            </div>
          </header>
          
          <div className="flex-1 p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}