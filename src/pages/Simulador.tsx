import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { LoanSimulator } from '@/components/LoanSimulator';
import { useAuth } from '@/hooks/useAuth';
import { LoanSimulation } from '@/lib/loanCalculator';
import { useToast } from '@/hooks/use-toast';

export default function Simulador() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSimulate = (simulation: LoanSimulation) => {
    if (!user) {
      toast({
        title: 'Faça login primeiro',
        description: 'Você precisa estar logado para solicitar um empréstimo',
      });
      navigate('/auth');
      return;
    }

    // Store simulation in sessionStorage and redirect to request page
    sessionStorage.setItem('loanSimulation', JSON.stringify(simulation));
    navigate('/solicitar');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-12">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Simulador de Empréstimo</h1>
            <p className="text-muted-foreground">
              Calcule as parcelas e veja quanto você pagará
            </p>
          </div>
          <LoanSimulator onSimulate={handleSimulate} showApplyButton />
        </div>
      </div>
    </div>
  );
}
