import { useEffect, useRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Simulador from "./pages/Simulador";
import SolicitarEmprestimo from "./pages/SolicitarEmprestimo";
import MeusEmprestimos from "./pages/MeusEmprestimos";
import Perfil from "./pages/Perfil";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminSolicitacoes from "./pages/admin/Solicitacoes";
import AdminUsuarios from "./pages/admin/Usuarios";
import AdminNotificacoes from "./pages/admin/Notificacoes";
import AdminConfiguracoes from "./pages/admin/Configuracoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Component to handle push notifications registration
function PushNotificationHandler() {
  const { user } = useAuth();
  const { registerPushNotifications, isNative } = usePushNotifications();
  const hasRegistered = useRef(false);

  useEffect(() => {
    // Register push notifications when user logs in on native platform
    // Only register once per session
    if (user && isNative && !hasRegistered.current) {
      hasRegistered.current = true;
      // Delay registration to ensure app is fully initialized
      const timer = setTimeout(() => {
        registerPushNotifications(user.id);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user, isNative]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <PushNotificationHandler />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/simulador" element={<Simulador />} />
            <Route path="/solicitar" element={
              <ProtectedRoute>
                <SolicitarEmprestimo />
              </ProtectedRoute>
            } />
            <Route path="/meus-emprestimos" element={
              <ProtectedRoute>
                <MeusEmprestimos />
              </ProtectedRoute>
            } />
            <Route path="/perfil" element={
              <ProtectedRoute>
                <Perfil />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/solicitacoes" element={
              <ProtectedRoute requireAdmin>
                <AdminSolicitacoes />
              </ProtectedRoute>
            } />
            <Route path="/admin/usuarios" element={
              <ProtectedRoute requireAdmin>
                <AdminUsuarios />
              </ProtectedRoute>
            } />
            <Route path="/admin/notificacoes" element={
              <ProtectedRoute requireAdmin>
                <AdminNotificacoes />
              </ProtectedRoute>
            } />
            <Route path="/admin/configuracoes" element={
              <ProtectedRoute requireAdmin>
                <AdminConfiguracoes />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
