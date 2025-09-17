import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/components/auth/AuthProvider";
import { LoginForm } from "@/components/auth/LoginForm";
import { StudentLoginForm } from "@/components/auth/StudentLoginForm";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Plans from "./pages/Plans";
import CheckIn from "./pages/CheckIn";
import Reports from "./pages/Reports";
import StudentArea from "./pages/student/StudentArea";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, profile } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <LoginForm />;
  }

  // Check if user is admin
  if (profile?.role === 'admin') {
    return <>{children}</>;
  }

  // If user is student, redirect to student area
  if (profile?.role === 'student') {
    return <Navigate to="/student" replace />;
  }
  
  return <>{children}</>;
}

function StudentProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, profile } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <StudentLoginForm />;
  }

  // Check if user is student
  if (profile?.role === 'student') {
    return <>{children}</>;
  }

  // If user is admin, show student area anyway (for testing purposes)
  if (profile?.role === 'admin') {
    return <>{children}</>;
  }
  
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/student" replace />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/students" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Students />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/plans" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Plans />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/checkin" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <CheckIn />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/reports" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Reports />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student" 
              element={
                <StudentProtectedRoute>
                  <StudentArea />
                </StudentProtectedRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
