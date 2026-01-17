import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatCPF, formatPhone } from '@/lib/loanCalculator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Loader2, Search, Eye, UserCheck, UserX, Shield, ShieldOff, 
  Users, ArrowLeft, Mail, Phone, MapPin, Briefcase, DollarSign 
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from 'react-router-dom';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  cpf: string;
  phone: string;
  address: string | null;
  city: string | null;
  state: string | null;
  occupation: string | null;
  employer: string | null;
  monthly_income: number | null;
  created_at: string;
  isAdmin?: boolean;
  totalLoans?: number;
  activeLoans?: number;
}

export default function AdminUsuarios() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      // Load all profiles
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Load admin roles
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      const adminUserIds = new Set(adminRoles?.map(r => r.user_id) || []);

      // Load loan counts
      const { data: loans } = await supabase
        .from('loan_requests')
        .select('user_id, status');

      const loanCounts = new Map<string, { total: number; active: number }>();
      loans?.forEach(loan => {
        const current = loanCounts.get(loan.user_id) || { total: 0, active: 0 };
        current.total++;
        if (['pending', 'under_review', 'approved', 'disbursed'].includes(loan.status)) {
          current.active++;
        }
        loanCounts.set(loan.user_id, current);
      });

      const usersWithData = profiles?.map(profile => ({
        ...profile,
        isAdmin: adminUserIds.has(profile.user_id),
        totalLoans: loanCounts.get(profile.user_id)?.total || 0,
        activeLoans: loanCounts.get(profile.user_id)?.active || 0,
      })) || [];

      setUsers(usersWithData);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Erro ao carregar usuários',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminRole = async (user: UserProfile) => {
    setProcessing(true);
    try {
      if (user.isAdmin) {
        // Remove admin role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', user.user_id)
          .eq('role', 'admin');

        if (error) throw error;
        toast({ title: 'Permissão de admin removida' });
      } else {
        // Add admin role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: user.user_id, role: 'admin' });

        if (error) throw error;
        toast({ title: 'Usuário promovido a admin' });
      }

      await loadUsers();
      setDetailsOpen(false);
    } catch (error: any) {
      console.error('Error toggling admin:', error);
      toast({
        title: 'Erro ao alterar permissão',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const filteredUsers = users.filter(user => {
    if (filter === 'admin' && !user.isAdmin) return false;
    if (filter === 'client' && user.isAdmin) return false;
    if (filter === 'withLoans' && user.totalLoans === 0) return false;

    if (search) {
      const searchLower = search.toLowerCase();
      return (
        user.full_name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.cpf.includes(search.replace(/\D/g, ''))
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background app-container">
        <Header />
        <div className="container py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background app-container">
      <Header />
      <div className="container px-4 py-4 md:py-8">
        <div className="flex items-center gap-4 mb-6 md:mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Gerenciar Usuários</h1>
            <p className="text-sm text-muted-foreground">{users.length} usuários cadastrados</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome, email ou CPF..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="pl-10" 
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="admin">Administradores</SelectItem>
              <SelectItem value="client">Clientes</SelectItem>
              <SelectItem value="withLoans">Com Empréstimos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum usuário encontrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead className="hidden sm:table-cell">CPF</TableHead>
                      <TableHead className="hidden md:table-cell">Empréstimos</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.full_name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {formatCPF(user.cpf)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-sm">{user.totalLoans} total / {user.activeLoans} ativos</span>
                        </TableCell>
                        <TableCell>
                          {user.isAdmin ? (
                            <Badge className="bg-purple-500">Admin</Badge>
                          ) : (
                            <Badge variant="secondary">Cliente</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => { setSelectedUser(user); setDetailsOpen(true); }}
                          >
                            <Eye className="h-4 w-4 mr-1" /> Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Detalhes do Usuário
                {selectedUser?.isAdmin && <Badge className="bg-purple-500">Admin</Badge>}
              </DialogTitle>
              <DialogDescription>
                Cadastrado em {selectedUser && format(new Date(selectedUser.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </DialogDescription>
            </DialogHeader>
            
            {selectedUser && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Nome Completo</Label>
                    <p className="font-medium">{selectedUser.full_name}</p>
                  </div>
                  
                  <div>
                    <Label className="text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" /> Email
                    </Label>
                    <p className="font-medium text-sm break-all">{selectedUser.email}</p>
                  </div>
                  
                  <div>
                    <Label className="text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" /> Telefone
                    </Label>
                    <p className="font-medium text-sm">{formatPhone(selectedUser.phone)}</p>
                  </div>
                  
                  <div>
                    <Label className="text-muted-foreground">CPF</Label>
                    <p className="font-medium text-sm">{formatCPF(selectedUser.cpf)}</p>
                  </div>
                  
                  {selectedUser.monthly_income && (
                    <div>
                      <Label className="text-muted-foreground flex items-center gap-1">
                        <DollarSign className="h-3 w-3" /> Renda
                      </Label>
                      <p className="font-medium text-sm">
                        R$ {selectedUser.monthly_income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  )}
                  
                  {selectedUser.city && (
                    <div>
                      <Label className="text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> Cidade
                      </Label>
                      <p className="font-medium text-sm">{selectedUser.city}/{selectedUser.state}</p>
                    </div>
                  )}
                  
                  {selectedUser.occupation && (
                    <div>
                      <Label className="text-muted-foreground flex items-center gap-1">
                        <Briefcase className="h-3 w-3" /> Ocupação
                      </Label>
                      <p className="font-medium text-sm">{selectedUser.occupation}</p>
                    </div>
                  )}
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm font-medium mb-2">Empréstimos</p>
                  <div className="flex gap-4 text-sm">
                    <span>Total: <strong>{selectedUser.totalLoans}</strong></span>
                    <span>Ativos: <strong>{selectedUser.activeLoans}</strong></span>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="flex-col sm:flex-row gap-2 mt-6">
              {selectedUser && (
                <>
                  <Button
                    variant={selectedUser.isAdmin ? "destructive" : "default"}
                    onClick={() => toggleAdminRole(selectedUser)}
                    disabled={processing}
                    className="w-full sm:w-auto"
                  >
                    {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {selectedUser.isAdmin ? (
                      <>
                        <ShieldOff className="h-4 w-4 mr-2" />
                        Remover Admin
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Tornar Admin
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    asChild
                    className="w-full sm:w-auto"
                  >
                    <Link to={`/admin/solicitacoes?search=${selectedUser.email}`}>
                      Ver Empréstimos
                    </Link>
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
