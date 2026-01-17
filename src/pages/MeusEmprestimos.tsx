import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/loanCalculator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Loader2, 
  Plus, 
  FileText, 
  Calendar, 
  DollarSign, 
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface LoanRequest {
  id: string;
  amount: number;
  term_months: number;
  interest_rate: number;
  monthly_payment: number;
  total_amount: number;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'disbursed' | 'completed';
  purpose: string | null;
  created_at: string;
  reviewed_at: string | null;
  disbursed_at: string | null;
  admin_notes: string | null;
}

interface LoanPayment {
  id: string;
  installment_number: number;
  due_date: string;
  amount: number;
  paid_amount: number | null;
  paid_at: string | null;
  status: 'pending' | 'paid' | 'overdue';
  late_fee: number | null;
}

export default function MeusEmprestimos() {
  const [loans, setLoans] = useState<LoanRequest[]>([]);
  const [payments, setPayments] = useState<Record<string, LoanPayment[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadLoans();
    }
  }, [user]);

  const loadLoans = async () => {
    const { data, error } = await supabase
      .from('loan_requests')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading loans:', error);
    } else {
      setLoans(data || []);
      
      // Load payments for each loan
      for (const loan of data || []) {
        loadPayments(loan.id);
      }
    }
    setLoading(false);
  };

  const loadPayments = async (loanId: string) => {
    const { data, error } = await supabase
      .from('loan_payments')
      .select('*')
      .eq('loan_request_id', loanId)
      .order('installment_number', { ascending: true });

    if (!error && data) {
      setPayments(prev => ({ ...prev, [loanId]: data }));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'under_review':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'approved':
      case 'disbursed':
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const activeLoans = loans.filter(l => ['pending', 'under_review', 'approved', 'disbursed'].includes(l.status));
  const completedLoans = loans.filter(l => ['completed', 'rejected'].includes(l.status));

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Meus Empréstimos</h1>
            <p className="text-muted-foreground">Acompanhe suas solicitações e pagamentos</p>
          </div>
          <Button asChild>
            <Link to="/simulador">
              <Plus className="h-4 w-4 mr-2" />
              Nova Solicitação
            </Link>
          </Button>
        </div>

        {loans.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhum empréstimo encontrado</h3>
              <p className="text-muted-foreground mb-6">
                Você ainda não fez nenhuma solicitação de empréstimo.
              </p>
              <Button asChild>
                <Link to="/simulador">Simular Empréstimo</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="active">
            <TabsList className="mb-6">
              <TabsTrigger value="active">
                Em Andamento ({activeLoans.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Finalizados ({completedLoans.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {activeLoans.length === 0 ? (
                <Card className="text-center py-8">
                  <CardContent>
                    <p className="text-muted-foreground">Nenhum empréstimo em andamento</p>
                  </CardContent>
                </Card>
              ) : (
                activeLoans.map((loan) => (
                  <Card key={loan.id} className="overflow-hidden">
                    <CardHeader className="bg-muted/30">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(loan.status)}
                          <div>
                            <CardTitle className="text-lg">
                              Empréstimo de {formatCurrency(loan.amount)}
                            </CardTitle>
                            <CardDescription>
                              Solicitado em {format(new Date(loan.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </CardDescription>
                          </div>
                        </div>
                        <StatusBadge status={loan.status} />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div>
                          <p className="text-sm text-muted-foreground">Valor Solicitado</p>
                          <p className="text-lg font-semibold">{formatCurrency(loan.amount)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Parcelas</p>
                          <p className="text-lg font-semibold">{loan.term_months}x</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Valor da Parcela</p>
                          <p className="text-lg font-semibold">{formatCurrency(loan.monthly_payment)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total</p>
                          <p className="text-lg font-semibold">{formatCurrency(loan.total_amount)}</p>
                        </div>
                      </div>

                      {loan.admin_notes && (
                        <div className="bg-muted/50 rounded-lg p-4 mb-4">
                          <p className="text-sm font-medium mb-1">Observação da Análise:</p>
                          <p className="text-sm text-muted-foreground">{loan.admin_notes}</p>
                        </div>
                      )}

                      {/* Payment Schedule for Disbursed Loans */}
                      {loan.status === 'disbursed' && payments[loan.id] && (
                        <Accordion type="single" collapsible>
                          <AccordionItem value="payments">
                            <AccordionTrigger>
                              <span className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Cronograma de Pagamentos
                              </span>
                            </AccordionTrigger>
                            <AccordionContent>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Parcela</TableHead>
                                    <TableHead>Vencimento</TableHead>
                                    <TableHead>Valor</TableHead>
                                    <TableHead>Status</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {payments[loan.id].map((payment) => (
                                    <TableRow key={payment.id}>
                                      <TableCell>{payment.installment_number}/{loan.term_months}</TableCell>
                                      <TableCell>
                                        {format(new Date(payment.due_date), 'dd/MM/yyyy')}
                                      </TableCell>
                                      <TableCell>
                                        {formatCurrency(payment.amount)}
                                        {payment.late_fee && payment.late_fee > 0 && (
                                          <span className="text-xs text-red-500 ml-1">
                                            (+{formatCurrency(payment.late_fee)} multa)
                                          </span>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <StatusBadge status={payment.status} type="payment" />
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {completedLoans.length === 0 ? (
                <Card className="text-center py-8">
                  <CardContent>
                    <p className="text-muted-foreground">Nenhum empréstimo finalizado</p>
                  </CardContent>
                </Card>
              ) : (
                completedLoans.map((loan) => (
                  <Card key={loan.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(loan.status)}
                          <div>
                            <CardTitle className="text-lg">
                              Empréstimo de {formatCurrency(loan.amount)}
                            </CardTitle>
                            <CardDescription>
                              Solicitado em {format(new Date(loan.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </CardDescription>
                          </div>
                        </div>
                        <StatusBadge status={loan.status} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Valor</p>
                          <p className="font-semibold">{formatCurrency(loan.amount)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Parcelas</p>
                          <p className="font-semibold">{loan.term_months}x</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total</p>
                          <p className="font-semibold">{formatCurrency(loan.total_amount)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Status Final</p>
                          <p className="font-semibold">
                            {loan.status === 'completed' ? 'Quitado' : 'Recusado'}
                          </p>
                        </div>
                      </div>
                      {loan.admin_notes && (
                        <div className="bg-muted/50 rounded-lg p-4 mt-4">
                          <p className="text-sm font-medium mb-1">Observação:</p>
                          <p className="text-sm text-muted-foreground">{loan.admin_notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
