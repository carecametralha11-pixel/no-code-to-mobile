import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatPhone, LoanSimulation } from '@/lib/loanCalculator';
import { RequiredDocumentCapture, RequiredDocument, initialDocuments } from '@/components/RequiredDocumentCapture';
import { LocationCapture, LocationData } from '@/components/LocationCapture';
import { 
  Loader2, 
  User, 
  MapPin, 
  Briefcase, 
  CreditCard, 
  Users, 
  FileText,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

interface PersonalData {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  occupation: string;
  employer: string;
  monthlyIncome: string;
}

interface BankData {
  bankName: string;
  agency: string;
  accountNumber: string;
  accountType: string;
  pixKey: string;
}

interface Reference {
  name: string;
  phone: string;
  relationship: string;
}

const brazilianStates = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const banks = [
  'Banco do Brasil', 'Caixa Econômica', 'Bradesco', 'Itaú', 'Santander',
  'Nubank', 'Inter', 'C6 Bank', 'PagBank', 'Mercado Pago', 'Outro'
];

const relationships = [
  'Familiar', 'Amigo', 'Colega de Trabalho', 'Vizinho', 'Outro'
];

export default function SolicitarEmprestimo() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [simulation, setSimulation] = useState<LoanSimulation | null>(null);
  const [purpose, setPurpose] = useState('');
  const [location, setLocation] = useState<LocationData | null>(null);
  
  const [personalData, setPersonalData] = useState<PersonalData>({
    address: '',
    city: '',
    state: '',
    zipCode: '',
    occupation: '',
    employer: '',
    monthlyIncome: '',
  });

  const [bankData, setBankData] = useState<BankData>({
    bankName: '',
    agency: '',
    accountNumber: '',
    accountType: 'corrente',
    pixKey: '',
  });

  const [references, setReferences] = useState<Reference[]>([
    { name: '', phone: '', relationship: '' },
    { name: '', phone: '', relationship: '' },
  ]);

  const [requiredDocuments, setRequiredDocuments] = useState<RequiredDocument[]>(initialDocuments);

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Load simulation from sessionStorage
    const savedSimulation = sessionStorage.getItem('loanSimulation');
    if (savedSimulation) {
      setSimulation(JSON.parse(savedSimulation));
    } else {
      navigate('/simulador');
    }

    // Load existing profile data
    loadProfileData();
  }, [navigate]);

  const loadProfileData = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profile) {
      setPersonalData({
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        zipCode: profile.zip_code || '',
        occupation: profile.occupation || '',
        employer: profile.employer || '',
        monthlyIncome: profile.monthly_income?.toString() || '',
      });
    }

    // Load existing bank account
    const { data: bankAccount } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (bankAccount) {
      setBankData({
        bankName: bankAccount.bank_name,
        agency: bankAccount.agency,
        accountNumber: bankAccount.account_number,
        accountType: bankAccount.account_type,
        pixKey: bankAccount.pix_key || '',
      });
    }
  };

  const handleReferenceChange = (index: number, field: keyof Reference, value: string) => {
    const newReferences = [...references];
    if (field === 'phone') {
      value = formatPhone(value.replace(/\D/g, ''));
    }
    newReferences[index][field] = value;
    setReferences(newReferences);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!personalData.address || !personalData.city || !personalData.state || 
            !personalData.occupation || !personalData.monthlyIncome) {
          toast({
            title: 'Preencha todos os campos',
            description: 'Os campos de endereço, ocupação e renda são obrigatórios',
            variant: 'destructive',
          });
          return false;
        }
        return true;
      case 2:
        if (!bankData.bankName || !bankData.agency || !bankData.accountNumber) {
          toast({
            title: 'Preencha todos os campos',
            description: 'Os dados bancários são obrigatórios',
            variant: 'destructive',
          });
          return false;
        }
        return true;
      case 3:
        const validRefs = references.filter(r => r.name && r.phone && r.relationship);
        if (validRefs.length < 2) {
          toast({
            title: 'Referências incompletas',
            description: 'Preencha pelo menos 2 referências',
            variant: 'destructive',
          });
          return false;
        }
        return true;
      case 4:
        const missingDocs = requiredDocuments.filter(d => !d.captured);
        if (missingDocs.length > 0) {
          toast({
            title: 'Documentos obrigatórios',
            description: `Faltam ${missingDocs.length} documento(s): ${missingDocs.map(d => d.label).join(', ')}`,
            variant: 'destructive',
          });
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  // Convert base64 to Blob for upload
  const base64ToBlob = (base64: string): Blob => {
    const parts = base64.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
  };

  const handleSubmit = async () => {
    if (!user || !simulation) return;
    
    setLoading(true);

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          address: personalData.address,
          city: personalData.city,
          state: personalData.state,
          zip_code: personalData.zipCode,
          occupation: personalData.occupation,
          employer: personalData.employer,
          monthly_income: parseFloat(personalData.monthlyIncome.replace(/\D/g, '')) / 100,
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Upsert bank account
      const { error: bankError } = await supabase
        .from('bank_accounts')
        .upsert({
          user_id: user.id,
          bank_name: bankData.bankName,
          agency: bankData.agency,
          account_number: bankData.accountNumber,
          account_type: bankData.accountType,
          pix_key: bankData.pixKey || null,
        }, {
          onConflict: 'user_id'
        });

      if (bankError) throw bankError;

      // Create loan request with location
      const { data: loanRequest, error: loanError } = await supabase
        .from('loan_requests')
        .insert({
          user_id: user.id,
          amount: simulation.amount,
          term_months: simulation.termMonths,
          interest_rate: simulation.interestRate,
          monthly_payment: simulation.monthlyPayment,
          total_amount: simulation.totalAmount,
          purpose: purpose || null,
          status: 'pending',
          request_location: location ? {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            city: location.city,
            state: location.state,
          } : null,
        })
        .select()
        .single();

      if (loanError) throw loanError;

      // Add references
      const validRefs = references.filter(r => r.name && r.phone && r.relationship);
      for (const ref of validRefs) {
        const { error: refError } = await supabase
          .from('loan_references')
          .insert({
            loan_request_id: loanRequest.id,
            name: ref.name,
            phone: ref.phone.replace(/\D/g, ''),
            relationship: ref.relationship,
          });

        if (refError) throw refError;
      }

      // Upload required documents
      for (const doc of requiredDocuments) {
        if (!doc.data) continue;
        
        const blob = base64ToBlob(doc.data);
        const fileName = `${user.id}/${loanRequest.id}/${doc.type}_${Date.now()}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from('loan-documents')
          .upload(fileName, blob);

        if (uploadError) throw uploadError;

        // Create document record with proper type
        const { error: docError } = await supabase
          .from('loan_documents')
          .insert({
            loan_request_id: loanRequest.id,
            document_type: doc.type,
            file_name: doc.label,
            file_path: fileName,
          });

        if (docError) throw docError;
      }

      // Clear simulation from sessionStorage
      sessionStorage.removeItem('loanSimulation');

      toast({
        title: 'Solicitação enviada!',
        description: 'Sua solicitação foi enviada com sucesso. Acompanhe o status na área de empréstimos.',
      });

      navigate('/meus-emprestimos');
    } catch (error: any) {
      console.error('Error submitting loan request:', error);
      toast({
        title: 'Erro ao enviar solicitação',
        description: error.message || 'Tente novamente mais tarde',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatMoneyInput = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const amount = parseInt(numbers) / 100;
    return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (!simulation) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background app-container">
      <Header />
      <div className="container px-4 py-4 md:py-8">
        {/* Simulation Summary */}
        <Card className="mb-6 md:mb-8 border-primary/20 bg-primary/5">
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-2 md:flex md:flex-wrap md:items-center md:justify-between gap-3 md:gap-4">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Valor do Empréstimo</p>
                <p className="text-lg md:text-2xl font-bold">{formatCurrency(simulation.amount)}</p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Parcelas</p>
                <p className="text-lg md:text-2xl font-bold">{simulation.termMonths}x de {formatCurrency(simulation.monthlyPayment)}</p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Total a Pagar</p>
                <p className="text-lg md:text-2xl font-bold">{formatCurrency(simulation.totalAmount)}</p>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => navigate('/simulador')} className="text-xs md:text-sm">
                  Alterar Simulação
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Steps */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-between px-1">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center font-semibold text-sm md:text-base transition-colors ${
                    step < currentStep
                      ? 'bg-primary text-primary-foreground'
                      : step === currentStep
                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/30'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step < currentStep ? <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5" /> : step}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 px-1">
            <span className="text-[10px] md:text-xs text-muted-foreground text-center w-9 md:w-10">Dados</span>
            <span className="text-[10px] md:text-xs text-muted-foreground text-center w-9 md:w-10">Banco</span>
            <span className="text-[10px] md:text-xs text-muted-foreground text-center w-9 md:w-10">Refs</span>
            <span className="text-[10px] md:text-xs text-muted-foreground text-center w-9 md:w-10">Docs</span>
            <span className="text-[10px] md:text-xs text-muted-foreground text-center w-9 md:w-10">Fim</span>
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {currentStep === 1 && <><User className="h-5 w-5" /> Dados Pessoais</>}
              {currentStep === 2 && <><CreditCard className="h-5 w-5" /> Dados Bancários</>}
              {currentStep === 3 && <><Users className="h-5 w-5" /> Referências Pessoais</>}
              {currentStep === 4 && <><FileText className="h-5 w-5" /> Documentos</>}
              {currentStep === 5 && <><CheckCircle2 className="h-5 w-5" /> Confirmação</>}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && 'Complete seus dados pessoais e de endereço'}
              {currentStep === 2 && 'Informe sua conta para receber o valor'}
              {currentStep === 3 && 'Adicione pelo menos 2 referências pessoais'}
              {currentStep === 4 && 'Envie os documentos necessários (tire fotos ou envie arquivos)'}
              {currentStep === 5 && 'Revise e confirme sua solicitação'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Personal Data */}
            {currentStep === 1 && (
              <div className="space-y-6">
                {/* Location Capture */}
                <LocationCapture
                  location={location}
                  onLocationChange={setLocation}
                  autoCapture={true}
                />

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="address">Endereço Completo *</Label>
                    <Input
                      id="address"
                      placeholder="Rua, número, complemento"
                      value={personalData.address}
                      onChange={(e) => setPersonalData({ ...personalData, address: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade *</Label>
                    <Input
                      id="city"
                      placeholder="São Paulo"
                      value={personalData.city}
                      onChange={(e) => setPersonalData({ ...personalData, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado *</Label>
                    <Select
                      value={personalData.state}
                      onValueChange={(value) => setPersonalData({ ...personalData, state: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {brazilianStates.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">CEP</Label>
                    <Input
                      id="zipCode"
                      placeholder="00000-000"
                      value={personalData.zipCode}
                      onChange={(e) => setPersonalData({ ...personalData, zipCode: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="occupation">Ocupação *</Label>
                    <Input
                      id="occupation"
                      placeholder="Sua profissão"
                      value={personalData.occupation}
                      onChange={(e) => setPersonalData({ ...personalData, occupation: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employer">Empregador</Label>
                    <Input
                      id="employer"
                      placeholder="Nome da empresa"
                      value={personalData.employer}
                      onChange={(e) => setPersonalData({ ...personalData, employer: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthlyIncome">Renda Mensal *</Label>
                    <Input
                      id="monthlyIncome"
                      placeholder="R$ 0,00"
                      value={personalData.monthlyIncome}
                      onChange={(e) => setPersonalData({ ...personalData, monthlyIncome: formatMoneyInput(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Bank Data */}
            {currentStep === 2 && (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Banco *</Label>
                  <Select
                    value={bankData.bankName}
                    onValueChange={(value) => setBankData({ ...bankData, bankName: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o banco" />
                    </SelectTrigger>
                    <SelectContent>
                      {banks.map((bank) => (
                        <SelectItem key={bank} value={bank}>
                          {bank}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountType">Tipo de Conta *</Label>
                  <Select
                    value={bankData.accountType}
                    onValueChange={(value) => setBankData({ ...bankData, accountType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="corrente">Conta Corrente</SelectItem>
                      <SelectItem value="poupanca">Conta Poupança</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agency">Agência *</Label>
                  <Input
                    id="agency"
                    placeholder="0000"
                    value={bankData.agency}
                    onChange={(e) => setBankData({ ...bankData, agency: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Número da Conta *</Label>
                  <Input
                    id="accountNumber"
                    placeholder="00000-0"
                    value={bankData.accountNumber}
                    onChange={(e) => setBankData({ ...bankData, accountNumber: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="pixKey">Chave PIX (opcional)</Label>
                  <Input
                    id="pixKey"
                    placeholder="CPF, email, telefone ou chave aleatória"
                    value={bankData.pixKey}
                    onChange={(e) => setBankData({ ...bankData, pixKey: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Step 3: References */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {references.map((ref, index) => (
                  <Card key={index} className="p-4">
                    <h4 className="font-semibold mb-4">Referência {index + 1} *</h4>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Nome Completo</Label>
                        <Input
                          placeholder="Nome da pessoa"
                          value={ref.name}
                          onChange={(e) => handleReferenceChange(index, 'name', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Telefone</Label>
                        <Input
                          placeholder="(00) 00000-0000"
                          value={ref.phone}
                          onChange={(e) => handleReferenceChange(index, 'phone', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Relação</Label>
                        <Select
                          value={ref.relationship}
                          onValueChange={(value) => handleReferenceChange(index, 'relationship', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {relationships.map((rel) => (
                              <SelectItem key={rel} value={rel}>
                                {rel}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </Card>
                ))}
                <Button
                  variant="outline"
                  onClick={() => setReferences([...references, { name: '', phone: '', relationship: '' }])}
                >
                  + Adicionar mais uma referência
                </Button>
              </div>
            )}

            {/* Step 4: Documents */}
            {currentStep === 4 && (
              <RequiredDocumentCapture
                documents={requiredDocuments}
                onDocumentsChange={setRequiredDocuments}
              />
            )}

            {/* Step 5: Confirmation */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" /> Dados Pessoais
                    </h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-muted-foreground">Endereço:</span> {personalData.address}</p>
                      <p><span className="text-muted-foreground">Cidade:</span> {personalData.city} - {personalData.state}</p>
                      <p><span className="text-muted-foreground">Ocupação:</span> {personalData.occupation}</p>
                      <p><span className="text-muted-foreground">Renda:</span> {personalData.monthlyIncome}</p>
                      {location && (
                        <p className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-primary" />
                          <span className="text-muted-foreground">Localização:</span>{' '}
                          {location.city ? `${location.city}, ${location.state}` : 'Capturada'}
                        </p>
                      )}
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <CreditCard className="h-4 w-4" /> Dados Bancários
                    </h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-muted-foreground">Banco:</span> {bankData.bankName}</p>
                      <p><span className="text-muted-foreground">Agência:</span> {bankData.agency}</p>
                      <p><span className="text-muted-foreground">Conta:</span> {bankData.accountNumber}</p>
                      <p><span className="text-muted-foreground">Tipo:</span> {bankData.accountType === 'corrente' ? 'Corrente' : 'Poupança'}</p>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4" /> Referências
                    </h4>
                    <div className="space-y-2 text-sm">
                      {references.filter(r => r.name).map((ref, index) => (
                        <p key={index}>
                          <span className="text-muted-foreground">{ref.relationship}:</span> {ref.name}
                        </p>
                      ))}
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" /> Documentos
                    </h4>
                    <div className="space-y-1 text-sm">
                      {requiredDocuments.filter(d => d.captured).map((doc) => (
                        <p key={doc.id} className="flex items-center gap-2">
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                          {doc.label}
                        </p>
                      ))}
                    </div>
                  </Card>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purpose">Finalidade do Empréstimo (opcional)</Label>
                  <Textarea
                    id="purpose"
                    placeholder="Ex: Reforma da casa, pagamento de dívidas, investimento no negócio..."
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                  />
                </div>

                <Card className="p-4 bg-primary/5 border-primary/20">
                  <h4 className="font-semibold mb-3">Resumo da Solicitação</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Valor</p>
                      <p className="text-lg font-bold">{formatCurrency(simulation.amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Parcelas</p>
                      <p className="text-lg font-bold">{simulation.termMonths}x</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Valor da Parcela</p>
                      <p className="text-lg font-bold">{formatCurrency(simulation.monthlyPayment)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-lg font-bold">{formatCurrency(simulation.totalAmount)}</p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              
              {currentStep < 5 ? (
                <Button onClick={nextStep}>
                  Próximo
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Enviar Solicitação
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
