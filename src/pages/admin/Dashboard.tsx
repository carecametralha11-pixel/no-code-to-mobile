import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/loanCalculator';
import { 
  Loader2, DollarSign, Users, FileText, TrendingUp, Clock, CheckCircle2, XCircle, 
  AlertTriangle, ArrowRight, BarChart3 
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface DashboardStats {
  totalLoans: number;
  pendingLoans: number;
  approvedLoans: number;
  rejectedLoans: number;
  disbursedLoans: number;
  totalDisbursed: number;
  totalClients: number;
  overduePayments: number;
}

interface RecentLoan {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  user_id: string;
  clientName?: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentLoans, setRecentLoans] = useState<RecentLoan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load loan stats
      const { data: loans } = await supabase.from('loan_requests').select('*');
      const { data: clients } = await supabase.from('profiles').select('id');
      const { data: payments } = await supabase.from('loan_payments').select('*').eq('status', 'overdue');

      if (loans) {
        setStats({
          totalLoans: loans.length,
          pendingLoans: loans.filter(l => l.status === 'pending' || l.status === 'under_review').length,
          approvedLoans: loans.filter(l => l.status === 'approved').length,
          rejectedLoans: loans.filter(l => l.status === 'rejected').length,
          disbursedLoans: loans.filter(l => l.status === 'disbursed' || l.status === 'completed').length,
          totalDisbursed: loans.filter(l => ['disbursed', 'completed'].includes(l.status)).reduce((sum, l) => sum + Number(l.amount), 0),
          totalClients: clients?.length || 0,
          overduePayments: payments?.length || 0,
        });
      }

      // Load recent loans
      const { data: recentLoansData } = await supabase
        .from('loan_requests')
        .select('id, amount, status, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentLoansData) {
        // Fetch profiles for these loans
        const userIds = [...new Set(recentLoansData.map(l => l.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
        
        const loansWithNames = recentLoansData.map(loan => ({
          ...loan,
          clientName: profileMap.get(loan.user_id) || 'Cliente'
        }));
        
        setRecentLoans(loansWithNames);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const statusData = [
    { name: 'Pendentes', value: stats?.pendingLoans || 0, color: '#EAB308' },
    { name: 'Aprovados', value: stats?.approvedLoans || 0, color: '#22C55E' },
    { name: 'Recusados', value: stats?.rejectedLoans || 0, color: '#EF4444' },
    { name: 'Liberados', value: stats?.disbursedLoans || 0, color: '#8B5CF6' },
  ].filter(item => item.value > 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Painel Administrativo</h1>
            <p className="text-muted-foreground">Visão geral do sistema de empréstimos</p>
          </div>
          <Button asChild>
            <Link to="/admin/solicitacoes">
              <FileText className="h-4 w-4 mr-2" />
              Ver Todas Solicitações
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Emprestado</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(stats?.totalDisbursed || 0)}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Clientes</p>
                  <p className="text-2xl font-bold text-blue-600">{stats?.totalClients}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aguardando Análise</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats?.pendingLoans}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Parcelas Atrasadas</p>
                  <p className="text-2xl font-bold text-red-600">{stats?.overduePayments}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Distribuição por Status
              </CardTitle>
              <CardDescription>
                Visão geral de {stats?.totalLoans || 0} solicitações
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statusData.length > 0 ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={statusData} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={60}
                        outerRadius={100} 
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, 'Solicitações']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-72 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma solicitação ainda</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Loans */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Solicitações Recentes
              </CardTitle>
              <CardDescription>
                Últimas 5 solicitações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentLoans.length > 0 ? (
                <>
                  {recentLoans.map((loan) => (
                    <div key={loan.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                      <div>
                        <p className="font-medium text-sm">{loan.clientName}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(loan.amount)}</p>
                      </div>
                      <StatusBadge status={loan.status as any} />
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/admin/solicitacoes">
                      Ver Todas 
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma solicitação ainda</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                <Link to="/admin/solicitacoes">
                  <Clock className="h-6 w-6" />
                  <span>Analisar Pendentes</span>
                  <span className="text-xs text-muted-foreground">{stats?.pendingLoans} aguardando</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                <Link to="/admin/solicitacoes?filter=approved">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  <span>Liberar Aprovados</span>
                  <span className="text-xs text-muted-foreground">{stats?.approvedLoans} prontos</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                <Link to="/admin/solicitacoes?filter=disbursed">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                  <span>Ver Ativos</span>
                  <span className="text-xs text-muted-foreground">{stats?.disbursedLoans} empréstimos</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <span>Cobrar Atrasos</span>
                <span className="text-xs text-muted-foreground">{stats?.overduePayments} parcelas</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
