import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { calculateLoan, formatCurrency, formatPercentage, LoanSimulation } from '@/lib/loanCalculator';
import { Calculator, TrendingUp, Calendar, DollarSign } from 'lucide-react';

interface LoanSimulatorProps {
  onSimulate?: (simulation: LoanSimulation) => void;
  showApplyButton?: boolean;
  defaultInterestRate?: number;
}

export function LoanSimulator({ 
  onSimulate, 
  showApplyButton = false,
  defaultInterestRate = 0.025 
}: LoanSimulatorProps) {
  const [amount, setAmount] = useState(10000);
  const [termMonths, setTermMonths] = useState(12);
  const [interestRate, setInterestRate] = useState(defaultInterestRate);
  const [simulation, setSimulation] = useState<LoanSimulation | null>(null);

  useEffect(() => {
    const result = calculateLoan(amount, termMonths, interestRate);
    setSimulation(result);
  }, [amount, termMonths, interestRate]);

  const handleApply = () => {
    if (simulation && onSimulate) {
      onSimulate(simulation);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value.replace(/\D/g, '')) || 0;
    setAmount(Math.min(Math.max(value, 1000), 500000));
  };

  return (
    <Card className="w-full shadow-lg border-0 bg-card">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <Calculator className="h-6 w-6 text-primary" />
          <CardTitle className="text-2xl">Simulador de Empréstimo</CardTitle>
        </div>
        <CardDescription>
          Simule seu empréstimo com parcelas fixas (Tabela Price)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Amount Input */}
        <div className="space-y-3">
          <Label htmlFor="amount" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            Valor do Empréstimo
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
            <Input
              id="amount"
              type="text"
              value={amount.toLocaleString('pt-BR')}
              onChange={handleAmountChange}
              className="pl-10 text-lg font-semibold"
            />
          </div>
          <Slider
            value={[amount]}
            onValueChange={(value) => setAmount(value[0])}
            min={1000}
            max={500000}
            step={1000}
            className="py-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>R$ 1.000</span>
            <span>R$ 500.000</span>
          </div>
        </div>

        {/* Term Input */}
        <div className="space-y-3">
          <Label htmlFor="term" className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Prazo em Meses
          </Label>
          <div className="text-2xl font-bold text-center py-2">{termMonths} meses</div>
          <Slider
            value={[termMonths]}
            onValueChange={(value) => setTermMonths(value[0])}
            min={3}
            max={60}
            step={1}
            className="py-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>3 meses</span>
            <span>60 meses</span>
          </div>
        </div>

        {/* Interest Rate Display */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Taxa de Juros Mensal
          </Label>
          <div className="text-xl font-semibold text-primary">
            {formatPercentage(interestRate)} ao mês
          </div>
        </div>

        {/* Results */}
        {simulation && (
          <div className="mt-6 pt-6 border-t space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary/10 rounded-xl p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">Parcela Mensal</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(simulation.monthlyPayment)}
                </p>
              </div>
              <div className="bg-muted rounded-xl p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">Total a Pagar</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(simulation.totalAmount)}
                </p>
              </div>
            </div>
            <div className="bg-muted/50 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total de Juros</span>
                <span className="font-semibold">{formatCurrency(simulation.totalInterest)}</span>
              </div>
            </div>

            {showApplyButton && (
              <Button 
                onClick={handleApply} 
                className="w-full h-12 text-lg font-semibold gradient-primary"
              >
                Solicitar Empréstimo
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
