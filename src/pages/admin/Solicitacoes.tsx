import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/StatusBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatCPF, formatPhone } from '@/lib/loanCalculator';
import { format, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, Search, Eye, CheckCircle2, XCircle, DollarSign, FileText, Users, CreditCard } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LoanWithProfile {
  id: string;
  amount: number;
  term_months: number;
  interest_rate: number;
  monthly_payment: number;
  total_amount: number;
  status: string;
  purpose: string | null;
  admin_notes: string | null;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
    email: string;
    cpf: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    occupation: string;
    monthly_income: number;
  } | null;
}

export default function AdminSolicitacoes() {
  const [loans, setLoans] = useState<LoanWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState<LoanWithProfile | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [references, setReferences] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [bankAccount, setBankAccount] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadLoans();
  }, []);

  const loadLoans = async () => {
    const { data, error } = await supabase
      .from('loan_requests')
      .select(`*, profiles!loan_requests_user_id_fkey(*)`)
      .order('created_at', { ascending: false });

    if (!error) setLoans(data || []);
    setLoading(false);
  };

  const openDetails = async (loan: LoanWithProfile) => {
    setSelectedLoan(loan);
    setAdminNotes(loan.admin_notes || '');
    
    // Load references
    const { data: refs } = await supabase.from('loan_references').select('*').eq('loan_request_id', loan.id);
    setReferences(refs || []);
    
    // Load documents
    const { data: docs } = await supabase.from('loan_documents').select('*').eq('loan_request_id', loan.id);
    setDocuments(docs || []);
    
    // Load bank account
    const { data: bank } = await supabase.from('bank_accounts').select('*').eq('user_id', loan.user_id).maybeSingle();
    setBankAccount(bank);
    
    setDetailsOpen(true);
  };

  const updateStatus = async (status: string) => {
    if (!selectedLoan || !user) return;
    setProcessing(true);

    const updates: any = {
      status,
      admin_notes: adminNotes,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    };

    if (status === 'disbursed') {
      updates.disbursed_at = new Date().toISOString();
    }

    const { error } = await supabase.from('loan_requests').update(updates).eq('id', selectedLoan.id);

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      // Create payment schedule if disbursed
      if (status === 'disbursed') {
        for (let i = 1; i <= selectedLoan.term_months; i++) {
          await supabase.from('loan_payments').insert({
            loan_request_id: selectedLoan.id,
            installment_number: i,
            due_date: format(addMonths(new Date(), i), 'yyyy-MM-dd'),
            amount: selectedLoan.monthly_payment,
            status: 'pending',
          });
        }
      }
      
      toast({ title: 'Sucesso', description: `Solicitação ${status === 'approved' ? 'aprovada' : status === 'rejected' ? 'recusada' : 'liberada'}!` });
      loadLoans();
      setDetailsOpen(false);
    }
    setProcessing(false);
  };

  const filteredLoans = loans.filter(loan => {
    if (filter !== 'all' && loan.status !== filter) return false;
    if (search && !loan.profiles?.full_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

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
        <h1 className="text-3xl font-bold mb-8">Gerenciar Solicitações</h1>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="under_review">Em Análise</SelectItem>
              <SelectItem value="approved">Aprovados</SelectItem>
              <SelectItem value="rejected">Recusados</SelectItem>
              <SelectItem value="disbursed">Liberados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Parcelas</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLoans.map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{loan.profiles?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{loan.profiles?.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(loan.amount)}</TableCell>
                  <TableCell>{loan.term_months}x de {formatCurrency(loan.monthly_payment)}</TableCell>
                  <TableCell>{format(new Date(loan.created_at), 'dd/MM/yyyy')}</TableCell>
                  <TableCell><StatusBadge status={loan.status as any} /></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => openDetails(loan)}>
                      <Eye className="h-4 w-4 mr-1" /> Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes da Solicitação</DialogTitle>
            </DialogHeader>
            {selectedLoan && (
              <Tabs defaultValue="info">
                <TabsList className="mb-4">
                  <TabsTrigger value="info">Informações</TabsTrigger>
                  <TabsTrigger value="references">Referências</TabsTrigger>
                  <TabsTrigger value="documents">Documentos</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card className="p-4">
                      <h4 className="font-semibold mb-2 flex items-center gap-2"><DollarSign className="h-4 w-4" /> Empréstimo</h4>
                      <p><span className="text-muted-foreground">Valor:</span> {formatCurrency(selectedLoan.amount)}</p>
                      <p><span className="text-muted-foreground">Parcelas:</span> {selectedLoan.term_months}x de {formatCurrency(selectedLoan.monthly_payment)}</p>
                      <p><span className="text-muted-foreground">Total:</span> {formatCurrency(selectedLoan.total_amount)}</p>
                      <p><span className="text-muted-foreground">Finalidade:</span> {selectedLoan.purpose || 'Não informada'}</p>
                    </Card>
                    <Card className="p-4">
                      <h4 className="font-semibold mb-2 flex items-center gap-2"><Users className="h-4 w-4" /> Cliente</h4>
                      <p><span className="text-muted-foreground">Nome:</span> {selectedLoan.profiles?.full_name}</p>
                      <p><span className="text-muted-foreground">CPF:</span> {formatCPF(selectedLoan.profiles?.cpf || '')}</p>
                      <p><span className="text-muted-foreground">Tel:</span> {formatPhone(selectedLoan.profiles?.phone || '')}</p>
                      <p><span className="text-muted-foreground">Renda:</span> {formatCurrency(selectedLoan.profiles?.monthly_income || 0)}</p>
                    </Card>
                  </div>
                  {bankAccount && (
                    <Card className="p-4">
                      <h4 className="font-semibold mb-2 flex items-center gap-2"><CreditCard className="h-4 w-4" /> Dados Bancários</h4>
                      <p><span className="text-muted-foreground">Banco:</span> {bankAccount.bank_name}</p>
                      <p><span className="text-muted-foreground">Ag:</span> {bankAccount.agency} | <span className="text-muted-foreground">Conta:</span> {bankAccount.account_number}</p>
                      {bankAccount.pix_key && <p><span className="text-muted-foreground">PIX:</span> {bankAccount.pix_key}</p>}
                    </Card>
                  )}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Observações do Admin</label>
                    <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Adicione observações..." />
                  </div>
                </TabsContent>

                <TabsContent value="references">
                  {references.length === 0 ? <p className="text-muted-foreground">Sem referências</p> : (
                    <div className="space-y-2">
                      {references.map((ref, i) => (
                        <Card key={i} className="p-3">
                          <p className="font-medium">{ref.name}</p>
                          <p className="text-sm text-muted-foreground">{ref.relationship} - {formatPhone(ref.phone)}</p>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="documents">
                  {documents.length === 0 ? <p className="text-muted-foreground">Sem documentos</p> : (
                    <div className="space-y-2">
                      {documents.map((doc, i) => (
                        <Card key={i} className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span>{doc.file_name}</span>
                          </div>
                          <Button variant="outline" size="sm" onClick={async () => {
                            const { data } = await supabase.storage.from('loan-documents').createSignedUrl(doc.file_path, 3600);
                            if (data?.signedUrl) window.open(data.signedUrl, '_blank');
                          }}>Visualizar</Button>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
            <DialogFooter className="gap-2">
              {selectedLoan?.status === 'pending' || selectedLoan?.status === 'under_review' ? (
                <>
                  <Button variant="destructive" onClick={() => updateStatus('rejected')} disabled={processing}>
                    <XCircle className="h-4 w-4 mr-1" /> Recusar
                  </Button>
                  <Button onClick={() => updateStatus('approved')} disabled={processing}>
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Aprovar
                  </Button>
                </>
              ) : selectedLoan?.status === 'approved' ? (
                <Button onClick={() => updateStatus('disbursed')} disabled={processing}>
                  <DollarSign className="h-4 w-4 mr-1" /> Liberar Valor
                </Button>
              ) : null}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
