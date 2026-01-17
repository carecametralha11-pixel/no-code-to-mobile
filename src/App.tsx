import { useEffect, useRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { usePermissions } from "@/hooks/usePermissions";
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

// Component to handle push notifications and permissions
function AppInitializer() {
  const { user } = useAuth();
  const { registerPushNotifications, isNative } = usePushNotifications();
  const { requestAllPermissions } = usePermissions();
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Initialize app on native platform when user logs in
    if (user && isNative && !hasInitialized.current) {
      hasInitialized.current = true;
      
      // Delay initialization to ensure app is fully loaded
      const timer = setTimeout(async () => {
        console.log('Initializing native app for user:', user.id);
        
        // Request all permissions
        await requestAllPermissions();
        
        // Register push notifications
        await registerPushNotifications(user.id);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
    
    // Reset if user logs out
    if (!user) {
      hasInitialized.current = false;
    }
  }, [user, isNative, registerPushNotifications, requestAllPermissions]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <AppInitializer />
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
