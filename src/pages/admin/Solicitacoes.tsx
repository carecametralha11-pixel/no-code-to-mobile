import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/StatusBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatCPF, formatPhone } from '@/lib/loanCalculator';
import { format, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, Search, Eye, CheckCircle2, XCircle, DollarSign, FileText, Users, CreditCard, MapPin, Briefcase, ArrowLeft } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';

interface LoanRequest {
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
}

interface Profile {
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
}

interface BankAccount {
  bank_name: string;
  agency: string;
  account_number: string;
  account_type: string;
  pix_key: string | null;
}

interface Reference {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  document_type: string;
}

interface LoanWithProfile extends LoanRequest {
  profile?: Profile;
}

export default function AdminSolicitacoes() {
  const [searchParams] = useSearchParams();
  const initialFilter = searchParams.get('filter') || 'all';
  
  const [loans, setLoans] = useState<LoanWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState<LoanWithProfile | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState(initialFilter);
  const [search, setSearch] = useState('');
  const [references, setReferences] = useState<Reference[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadLoans();
  }, []);

  const loadLoans = async () => {
    try {
      // First, get all loans
      const { data: loansData, error: loansError } = await supabase
        .from('loan_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (loansError) throw loansError;

      if (loansData && loansData.length > 0) {
        // Get unique user IDs
        const userIds = [...new Set(loansData.map(l => l.user_id))];
        
        // Fetch profiles for these users
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', userIds);

        // Create a map for quick lookup
        const profileMap = new Map<string, Profile>();
        profilesData?.forEach(p => {
          profileMap.set(p.user_id, {
            full_name: p.full_name,
            email: p.email,
            cpf: p.cpf,
            phone: p.phone,
            address: p.address,
            city: p.city,
            state: p.state,
            occupation: p.occupation,
            employer: p.employer,
            monthly_income: p.monthly_income,
          });
        });

        // Combine loans with profiles
        const loansWithProfiles: LoanWithProfile[] = loansData.map(loan => ({
          ...loan,
          profile: profileMap.get(loan.user_id),
        }));

        setLoans(loansWithProfiles);
      } else {
        setLoans([]);
      }
    } catch (error) {
      console.error('Error loading loans:', error);
      toast({
        title: 'Erro ao carregar solicitações',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openDetails = async (loan: LoanWithProfile) => {
    setSelectedLoan(loan);
    setAdminNotes(loan.admin_notes || '');
    
    try {
      // Load references
      const { data: refs } = await supabase
        .from('loan_references')
        .select('*')
        .eq('loan_request_id', loan.id);
      setReferences(refs || []);
      
      // Load documents
      const { data: docs } = await supabase
        .from('loan_documents')
        .select('*')
        .eq('loan_request_id', loan.id);
      setDocuments(docs || []);
      
      // Load bank account
      const { data: bank } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', loan.user_id)
        .maybeSingle();
      setBankAccount(bank);
    } catch (error) {
      console.error('Error loading details:', error);
    }
    
    setDetailsOpen(true);
  };

  const updateStatus = async (status: string) => {
    if (!selectedLoan || !user) return;
    setProcessing(true);

    try {
      const updates: Record<string, any> = {
        status,
        admin_notes: adminNotes,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      };

      if (status === 'disbursed') {
        updates.disbursed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('loan_requests')
        .update(updates)
        .eq('id', selectedLoan.id);

      if (error) throw error;

      // Create payment schedule if disbursed
      if (status === 'disbursed') {
        const payments = [];
        for (let i = 1; i <= selectedLoan.term_months; i++) {
          payments.push({
            loan_request_id: selectedLoan.id,
            installment_number: i,
            due_date: format(addMonths(new Date(), i), 'yyyy-MM-dd'),
            amount: selectedLoan.monthly_payment,
            status: 'pending' as const,
          });
        }
        
        const { error: paymentError } = await supabase
          .from('loan_payments')
          .insert(payments);

        if (paymentError) throw paymentError;
      }
      
      const statusMessages: Record<string, string> = {
        'approved': 'aprovada',
        'rejected': 'recusada', 
        'disbursed': 'liberada',
        'under_review': 'marcada para análise',
      };

      toast({ 
        title: 'Sucesso!', 
        description: `Solicitação ${statusMessages[status] || 'atualizada'} com sucesso.`,
      });
      
      await loadLoans();
      setDetailsOpen(false);
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({ 
        title: 'Erro', 
        description: error.message || 'Erro ao atualizar solicitação', 
        variant: 'destructive' 
      });
    } finally {
      setProcessing(false);
    }
  };

  const viewDocument = async (doc: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('loan-documents')
        .createSignedUrl(doc.file_path, 3600);
      
      if (error) throw error;
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      toast({
        title: 'Erro ao abrir documento',
        variant: 'destructive',
      });
    }
  };

  const filteredLoans = loans.filter(loan => {
    if (filter !== 'all' && loan.status !== filter) return false;
    if (search) {
      const searchLower = search.toLowerCase();
      const nameMatch = loan.profile?.full_name?.toLowerCase().includes(searchLower);
      const cpfMatch = loan.profile?.cpf?.includes(search.replace(/\D/g, ''));
      const emailMatch = loan.profile?.email?.toLowerCase().includes(searchLower);
      if (!nameMatch && !cpfMatch && !emailMatch) return false;
    }
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
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Gerenciar Solicitações</h1>
            <p className="text-muted-foreground">{loans.length} solicitações no total</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome, CPF ou email..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="pl-10" 
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="under_review">Em Análise</SelectItem>
              <SelectItem value="approved">Aprovados</SelectItem>
              <SelectItem value="rejected">Recusados</SelectItem>
              <SelectItem value="disbursed">Liberados</SelectItem>
              <SelectItem value="completed">Finalizados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {filteredLoans.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma solicitação encontrada</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead className="hidden md:table-cell">Parcelas</TableHead>
                      <TableHead className="hidden sm:table-cell">Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLoans.map((loan) => (
                      <TableRow key={loan.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetails(loan)}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{loan.profile?.full_name || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground hidden sm:block">{loan.profile?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(loan.amount)}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {loan.term_months}x de {formatCurrency(loan.monthly_payment)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {format(new Date(loan.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={loan.status as any} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openDetails(loan); }}>
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

        {/* Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Detalhes da Solicitação
                {selectedLoan && <StatusBadge status={selectedLoan.status as any} />}
              </DialogTitle>
              <DialogDescription>
                {selectedLoan && `Solicitada em ${format(new Date(selectedLoan.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`}
              </DialogDescription>
            </DialogHeader>
            
            {selectedLoan && (
              <Tabs defaultValue="info" className="mt-4">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="info">Informações</TabsTrigger>
                  <TabsTrigger value="references">Referências ({references.length})</TabsTrigger>
                  <TabsTrigger value="documents">Documentos ({documents.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Loan Info */}
                    <Card className="p-4">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-primary" /> 
                        Dados do Empréstimo
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Valor Solicitado:</span>
                          <span className="font-medium">{formatCurrency(selectedLoan.amount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Parcelas:</span>
                          <span className="font-medium">{selectedLoan.term_months}x de {formatCurrency(selectedLoan.monthly_payment)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Taxa de Juros:</span>
                          <span className="font-medium">{(selectedLoan.interest_rate * 100).toFixed(2)}% a.m.</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total a Pagar:</span>
                          <span className="font-medium">{formatCurrency(selectedLoan.total_amount)}</span>
                        </div>
                        {selectedLoan.purpose && (
                          <div className="pt-2 border-t">
                            <span className="text-muted-foreground">Finalidade:</span>
                            <p className="mt-1">{selectedLoan.purpose}</p>
                          </div>
                        )}
                      </div>
                    </Card>

                    {/* Client Info */}
                    <Card className="p-4">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" /> 
                        Dados do Cliente
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Nome:</span>
                          <span className="font-medium">{selectedLoan.profile?.full_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">CPF:</span>
                          <span className="font-medium">{formatCPF(selectedLoan.profile?.cpf || '')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Telefone:</span>
                          <span className="font-medium">{formatPhone(selectedLoan.profile?.phone || '')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Email:</span>
                          <span className="font-medium text-xs">{selectedLoan.profile?.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Renda:</span>
                          <span className="font-medium">{formatCurrency(selectedLoan.profile?.monthly_income || 0)}</span>
                        </div>
                      </div>
                    </Card>

                    {/* Address */}
                    {selectedLoan.profile?.address && (
                      <Card className="p-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" /> 
                          Endereço
                        </h4>
                        <div className="text-sm">
                          <p>{selectedLoan.profile.address}</p>
                          <p>{selectedLoan.profile.city} - {selectedLoan.profile.state}</p>
                        </div>
                      </Card>
                    )}

                    {/* Work Info */}
                    {selectedLoan.profile?.occupation && (
                      <Card className="p-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-primary" /> 
                          Informações Profissionais
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Ocupação:</span>
                            <span className="font-medium">{selectedLoan.profile.occupation}</span>
                          </div>
                          {selectedLoan.profile.employer && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Empregador:</span>
                              <span className="font-medium">{selectedLoan.profile.employer}</span>
                            </div>
                          )}
                        </div>
                      </Card>
                    )}
                  </div>

                  {/* Bank Account */}
                  {bankAccount && (
                    <Card className="p-4">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-primary" /> 
                        Dados Bancários para Depósito
                      </h4>
                      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Banco:</span>
                          <p className="font-medium">{bankAccount.bank_name}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Agência:</span>
                          <p className="font-medium">{bankAccount.agency}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Conta:</span>
                          <p className="font-medium">{bankAccount.account_number}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Tipo:</span>
                          <p className="font-medium">{bankAccount.account_type === 'corrente' ? 'Conta Corrente' : 'Poupança'}</p>
                        </div>
                        {bankAccount.pix_key && (
                          <div className="sm:col-span-2 md:col-span-4">
                            <span className="text-muted-foreground">Chave PIX:</span>
                            <p className="font-medium">{bankAccount.pix_key}</p>
                          </div>
                        )}
                      </div>
                    </Card>
                  )}

                  {/* Admin Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="adminNotes">Observações do Administrador</Label>
                    <Textarea 
                      id="adminNotes"
                      value={adminNotes} 
                      onChange={(e) => setAdminNotes(e.target.value)} 
                      placeholder="Adicione observações sobre a análise..." 
                      rows={3}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="references">
                  {references.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma referência cadastrada</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {references.map((ref) => (
                        <Card key={ref.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{ref.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {ref.relationship} • {formatPhone(ref.phone)}
                              </p>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <a href={`tel:${ref.phone}`}>Ligar</a>
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="documents">
                  {documents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum documento enviado</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {documents.map((doc) => (
                        <Card key={doc.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-primary" />
                              <div>
                                <p className="font-medium">{doc.file_name}</p>
                                <p className="text-xs text-muted-foreground">{doc.document_type}</p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => viewDocument(doc)}>
                              <Eye className="h-4 w-4 mr-1" />
                              Visualizar
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}

            <DialogFooter className="gap-2 sm:gap-0 mt-6">
              {selectedLoan?.status === 'pending' && (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => updateStatus('under_review')} 
                    disabled={processing}
                  >
                    {processing && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                    Marcar em Análise
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => updateStatus('rejected')} 
                    disabled={processing}
                  >
                    {processing && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                    <XCircle className="h-4 w-4 mr-1" /> Recusar
                  </Button>
                  <Button 
                    onClick={() => updateStatus('approved')} 
                    disabled={processing}
                  >
                    {processing && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Aprovar
                  </Button>
                </>
              )}
              {selectedLoan?.status === 'under_review' && (
                <>
                  <Button 
                    variant="destructive" 
                    onClick={() => updateStatus('rejected')} 
                    disabled={processing}
                  >
                    {processing && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                    <XCircle className="h-4 w-4 mr-1" /> Recusar
                  </Button>
                  <Button 
                    onClick={() => updateStatus('approved')} 
                    disabled={processing}
                  >
                    {processing && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Aprovar
                  </Button>
                </>
              )}
              {selectedLoan?.status === 'approved' && (
                <Button 
                  onClick={() => updateStatus('disbursed')} 
                  disabled={processing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {processing && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  <DollarSign className="h-4 w-4 mr-1" /> Liberar Valor
                </Button>
              )}
              {(selectedLoan?.status === 'disbursed' || selectedLoan?.status === 'completed' || selectedLoan?.status === 'rejected') && (
                <p className="text-sm text-muted-foreground">
                  Esta solicitação já foi {selectedLoan.status === 'rejected' ? 'recusada' : 'processada'}.
                </p>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
