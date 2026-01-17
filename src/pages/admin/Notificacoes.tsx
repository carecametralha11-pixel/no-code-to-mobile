import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Loader2, Bell, Send, ArrowLeft, Users, User, 
  CheckCircle2, XCircle, Smartphone, Search
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';

interface PushToken {
  id: string;
  user_id: string;
  token: string;
  platform: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

interface UserWithToken {
  user_id: string;
  full_name: string;
  email: string;
  hasToken: boolean;
}

export default function AdminNotificacoes() {
  const [tokens, setTokens] = useState<PushToken[]>([]);
  const [allUsers, setAllUsers] = useState<UserWithToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState('all');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load all profiles first
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .order('full_name');

      // Load push tokens
      const { data: tokensData, error: tokensError } = await supabase
        .from('push_tokens')
        .select('*')
        .order('created_at', { ascending: false });

      if (tokensError) throw tokensError;

      const tokenUserIds = new Set(tokensData?.map(t => t.user_id) || []);

      // Create users list with token status
      const usersWithTokenStatus: UserWithToken[] = (allProfiles || []).map(p => ({
        user_id: p.user_id,
        full_name: p.full_name,
        email: p.email,
        hasToken: tokenUserIds.has(p.user_id),
      }));

      setAllUsers(usersWithTokenStatus);

      // Load user profiles for tokens
      if (tokensData && tokensData.length > 0) {
        const profileMap = new Map(allProfiles?.map(p => [p.user_id, p]) || []);
        
        const tokensWithUsers = tokensData.map(token => ({
          ...token,
          user_name: profileMap.get(token.user_id)?.full_name || 'N/A',
          user_email: profileMap.get(token.user_id)?.email || 'N/A',
        }));

        setTokens(tokensWithUsers);
      } else {
        setTokens([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Erro ao carregar dados',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const sendNotification = async () => {
    if (!title || !message) {
      toast({
        title: 'Preencha todos os campos',
        description: 'Título e mensagem são obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    if (target === 'specific' && !selectedUserId) {
      toast({
        title: 'Selecione um usuário',
        description: 'Escolha o usuário que receberá a notificação',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      // Build payload based on target
      const payload: Record<string, any> = {
        title,
        message,
      };

      if (target === 'all') {
        payload.send_to_all = true;
      } else if (target === 'specific' && selectedUserId) {
        payload.user_id = selectedUserId;
      }

      // Call edge function
      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: payload,
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: 'Notificação enviada!',
          description: `Enviada para ${data.sent || 0} dispositivo(s)`,
        });

        // Clear form
        setTitle('');
        setMessage('');
        setTarget('all');
        setSelectedUserId('');
      } else {
        toast({
          title: 'Aviso',
          description: data?.message || 'Nenhum dispositivo encontrado',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error sending notification:', error);
      toast({
        title: 'Erro ao enviar notificação',
        description: error.message || 'Tente novamente mais tarde',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const filteredUsers = allUsers.filter(user => {
    if (!userSearch) return true;
    const searchLower = userSearch.toLowerCase();
    return (
      user.full_name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
  });
  const removeToken = async (tokenId: string) => {
    try {
      const { error } = await supabase
        .from('push_tokens')
        .delete()
        .eq('id', tokenId);

      if (error) throw error;

      setTokens(tokens.filter(t => t.id !== tokenId));
      toast({ title: 'Token removido' });
    } catch (error: any) {
      toast({
        title: 'Erro ao remover token',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

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
            <h1 className="text-2xl md:text-3xl font-bold">Notificações Push</h1>
            <p className="text-sm text-muted-foreground">{tokens.length} dispositivos registrados</p>
          </div>
        </div>

        <Tabs defaultValue="send" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="send">Enviar Notificação</TabsTrigger>
            <TabsTrigger value="devices">Dispositivos ({tokens.length})</TabsTrigger>
          </TabsList>

          {/* Send Notification Tab */}
          <TabsContent value="send">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Nova Notificação
                </CardTitle>
                <CardDescription>
                  Envie notificações push para os dispositivos dos usuários
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="target">Enviar para</Label>
                  <Select value={target} onValueChange={setTarget}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Todos os dispositivos
                        </div>
                      </SelectItem>
                      <SelectItem value="specific">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Usuário específico
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {target === 'specific' && (
                  <div className="space-y-2">
                    <Label htmlFor="user">Buscar Usuário</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nome ou email..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="pl-10 mb-2"
                      />
                    </div>
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha um usuário" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredUsers.map(user => (
                          <SelectItem key={user.user_id} value={user.user_id}>
                            <div className="flex items-center gap-2">
                              <span>{user.full_name}</span>
                              {user.hasToken ? (
                                <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">
                                  App instalado
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                  Sem app
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedUserId && !allUsers.find(u => u.user_id === selectedUserId)?.hasToken && (
                      <p className="text-xs text-amber-600">
                        ⚠️ Este usuário não tem o app instalado e não receberá notificações push
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="title">Título da Notificação</Label>
                  <Input
                    id="title"
                    placeholder="Ex: Empréstimo Aprovado!"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={50}
                  />
                  <p className="text-xs text-muted-foreground">{title.length}/50 caracteres</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Mensagem</Label>
                  <Textarea
                    id="message"
                    placeholder="Ex: Parabéns! Seu empréstimo foi aprovado. Acesse o app para mais detalhes."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground">{message.length}/200 caracteres</p>
                </div>

                {/* Preview */}
                {(title || message) && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-2">Prévia:</p>
                    <div className="bg-background rounded-lg p-3 border shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                          <span className="text-white font-bold">$</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{title || 'Título'}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {message || 'Mensagem da notificação'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={sendNotification} 
                  disabled={sending || !title || !message || (target === 'specific' && !selectedUserId)}
                  className="w-full"
                  size="lg"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Notificação
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Devices Tab */}
          <TabsContent value="devices">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Dispositivos Registrados
                </CardTitle>
                <CardDescription>
                  Dispositivos que podem receber notificações push
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {tokens.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <Smartphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhum dispositivo registrado</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Os dispositivos serão registrados quando os usuários abrirem o app nativo
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Usuário</TableHead>
                          <TableHead className="hidden sm:table-cell">Plataforma</TableHead>
                          <TableHead className="hidden md:table-cell">Registrado em</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tokens.map((token) => (
                          <TableRow key={token.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{token.user_name}</p>
                                <p className="text-xs text-muted-foreground">{token.user_email}</p>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <Badge variant="outline" className="capitalize">
                                {token.platform}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {format(new Date(token.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => removeToken(token.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <XCircle className="h-4 w-4" />
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
