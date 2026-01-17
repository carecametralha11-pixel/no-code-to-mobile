import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Simulador from "./pages/Simulador";
import SolicitarEmprestimo from "./pages/SolicitarEmprestimo";
import MeusEmprestimos from "./pages/MeusEmprestimos";
import Perfil from "./pages/Perfil";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminSolicitacoes from "./pages/admin/Solicitacoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
