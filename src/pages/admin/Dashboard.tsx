import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/loanCalculator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Loader2, DollarSign, Users, FileText, TrendingUp, Clock, CheckCircle2, XCircle, 
  AlertTriangle, ArrowRight, BarChart3 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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
  profiles: { full_name: string } | null;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentLoans, setRecentLoans] = useState<RecentLoan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
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

    // Load recent loans with profile info
    const { data: recent } = await supabase
      .from('loan_requests')
      .select(`*, profiles!loan_requests_user_id_fkey(full_name)`)
      .order('created_at', { ascending: false })
      .limit(5);

    setRecentLoans(recent || []);
    setLoading(false);
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
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Painel Administrativo</h1>
            <p className="text-muted-foreground">Visão geral do sistema de empréstimos</p>
          </div>
          <Button asChild>
            <Link to="/admin/solicitacoes">Ver Todas Solicitações</Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Emprestado</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats?.totalDisbursed || 0)}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Clientes</p>
                  <p className="text-2xl font-bold">{stats?.totalClients}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold">{stats?.pendingLoans}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Em Atraso</p>
                  <p className="text-2xl font-bold">{stats?.overduePayments}</p>
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
              <CardTitle>Distribuição por Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {statusData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Loans */}
          <Card>
            <CardHeader>
              <CardTitle>Solicitações Recentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentLoans.map((loan) => (
                <div key={loan.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{loan.profiles?.full_name || 'Cliente'}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(loan.amount)}</p>
                  </div>
                  <StatusBadge status={loan.status as any} />
                </div>
              ))}
              <Button variant="outline" className="w-full" asChild>
                <Link to="/admin/solicitacoes">Ver Todas <ArrowRight className="h-4 w-4 ml-2" /></Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
