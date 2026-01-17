import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Loader2, ArrowLeft, Settings, Percent, DollarSign, 
  Calendar, Save, RotateCcw
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface SystemSettings {
  interest_rate: string;
  min_amount: string;
  max_amount: string;
  min_term: string;
  max_term: string;
  auto_approve_limit: string;
  require_location: string;
  require_documents: string;
}

const defaultSettings: SystemSettings = {
  interest_rate: '4.99',
  min_amount: '500',
  max_amount: '50000',
  min_term: '3',
  max_term: '48',
  auto_approve_limit: '0',
  require_location: 'true',
  require_documents: 'true',
};

export default function AdminConfiguracoes() {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');

      if (error) throw error;

      if (data && data.length > 0) {
        const settingsMap: Record<string, string> = {};
        data.forEach(setting => {
          settingsMap[setting.setting_key] = setting.setting_value;
        });

        setSettings({
          ...defaultSettings,
          ...settingsMap,
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: 'Erro ao carregar configurações',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Upsert each setting
      const settingsArray = Object.entries(settings).map(([key, value]) => ({
        setting_key: key,
        setting_value: value,
        description: getSettingDescription(key),
      }));

      for (const setting of settingsArray) {
        const { error } = await supabase
          .from('system_settings')
          .upsert(setting, { onConflict: 'setting_key' });

        if (error) throw error;
      }

      toast({
        title: 'Configurações salvas',
        description: 'As configurações foram atualizadas com sucesso',
      });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getSettingDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      interest_rate: 'Taxa de juros mensal padrão',
      min_amount: 'Valor mínimo de empréstimo',
      max_amount: 'Valor máximo de empréstimo',
      min_term: 'Prazo mínimo em meses',
      max_term: 'Prazo máximo em meses',
      auto_approve_limit: 'Limite para aprovação automática (0 = desativado)',
      require_location: 'Exigir localização na solicitação',
      require_documents: 'Exigir documentos na solicitação',
    };
    return descriptions[key] || '';
  };

  const resetToDefaults = () => {
    setSettings(defaultSettings);
    toast({
      title: 'Valores restaurados',
      description: 'Os valores padrão foram restaurados. Clique em salvar para aplicar.',
    });
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
            <h1 className="text-2xl md:text-3xl font-bold">Configurações</h1>
            <p className="text-sm text-muted-foreground">Ajuste os parâmetros do sistema</p>
          </div>
        </div>

        <div className="max-w-2xl space-y-6">
          {/* Loan Parameters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Parâmetros de Empréstimo
              </CardTitle>
              <CardDescription>
                Configure os limites e valores padrão para empréstimos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="interest_rate" className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-muted-foreground" />
                  Taxa de Juros Mensal (%)
                </Label>
                <Input
                  id="interest_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={settings.interest_rate}
                  onChange={(e) => setSettings({ ...settings, interest_rate: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Taxa aplicada mensalmente nos empréstimos</p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_amount">Valor Mínimo (R$)</Label>
                  <Input
                    id="min_amount"
                    type="number"
                    min="0"
                    value={settings.min_amount}
                    onChange={(e) => setSettings({ ...settings, min_amount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_amount">Valor Máximo (R$)</Label>
                  <Input
                    id="max_amount"
                    type="number"
                    min="0"
                    value={settings.max_amount}
                    onChange={(e) => setSettings({ ...settings, max_amount: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_term" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Prazo Mínimo (meses)
                  </Label>
                  <Input
                    id="min_term"
                    type="number"
                    min="1"
                    value={settings.min_term}
                    onChange={(e) => setSettings({ ...settings, min_term: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_term">Prazo Máximo (meses)</Label>
                  <Input
                    id="max_term"
                    type="number"
                    min="1"
                    value={settings.max_term}
                    onChange={(e) => setSettings({ ...settings, max_term: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Automation Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Automação
              </CardTitle>
              <CardDescription>
                Configure regras automáticas do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="auto_approve_limit">
                  Limite para Aprovação Automática (R$)
                </Label>
                <Input
                  id="auto_approve_limit"
                  type="number"
                  min="0"
                  value={settings.auto_approve_limit}
                  onChange={(e) => setSettings({ ...settings, auto_approve_limit: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Empréstimos abaixo deste valor podem ser aprovados automaticamente. 
                  Use 0 para desativar.
                </p>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Exigir Localização</Label>
                  <p className="text-xs text-muted-foreground">
                    Solicitar localização GPS do cliente
                  </p>
                </div>
                <Switch
                  checked={settings.require_location === 'true'}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, require_location: checked ? 'true' : 'false' })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Exigir Documentos</Label>
                  <p className="text-xs text-muted-foreground">
                    Solicitar upload de documentos
                  </p>
                </div>
                <Switch
                  checked={settings.require_documents === 'true'}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, require_documents: checked ? 'true' : 'false' })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={saveSettings} 
              disabled={saving}
              className="flex-1"
              size="lg"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Configurações
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={resetToDefaults}
              className="flex-1 sm:flex-initial"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar Padrões
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
