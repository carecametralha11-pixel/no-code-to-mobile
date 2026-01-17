import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePermissions } from '@/hooks/usePermissions';
import { Camera, MapPin, Bell, CheckCircle2, XCircle, AlertTriangle, Loader2, Shield } from 'lucide-react';

interface PermissionsBannerProps {
  autoRequest?: boolean;
  onComplete?: () => void;
}

export function PermissionsBanner({ autoRequest = false, onComplete }: PermissionsBannerProps) {
  const { 
    permissions, 
    loading, 
    isNative,
    requestAllPermissions,
    requestCameraPermission,
    requestLocationPermission,
    requestNotificationPermission,
  } = usePermissions();
  
  const [dismissed, setDismissed] = useState(false);
  const [requesting, setRequesting] = useState(false);

  // Check if all permissions are granted
  const allGranted = permissions.camera === 'granted' && 
                     permissions.location === 'granted' && 
                     permissions.notifications === 'granted';

  // Check if any permission needs to be requested
  const needsRequest = permissions.camera === 'prompt' || 
                       permissions.location === 'prompt' || 
                       permissions.notifications === 'prompt';

  useEffect(() => {
    if (autoRequest && needsRequest && isNative && !requesting) {
      setRequesting(true);
      requestAllPermissions().finally(() => setRequesting(false));
    }
  }, [autoRequest, needsRequest, isNative, requestAllPermissions, requesting]);

  useEffect(() => {
    if (allGranted && onComplete) {
      onComplete();
    }
  }, [allGranted, onComplete]);

  // Don't show on web or if dismissed
  if (!isNative || dismissed || allGranted) {
    return null;
  }

  const handleRequestAll = async () => {
    setRequesting(true);
    await requestAllPermissions();
    setRequesting(false);
  };

  const getStatusIcon = (status: string) => {
    if (status === 'granted') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (status === 'denied') return <XCircle className="h-4 w-4 text-red-500" />;
    return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  };

  const getStatusText = (status: string) => {
    if (status === 'granted') return 'Permitido';
    if (status === 'denied') return 'Bloqueado';
    return 'Pendente';
  };

  return (
    <Card className="p-4 mb-4 border-primary/30 bg-primary/5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1">Permissões do App</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Para uma melhor experiência, precisamos de algumas permissões
          </p>
          
          <div className="space-y-2 mb-3">
            <button
              onClick={requestCameraPermission}
              className="w-full flex items-center justify-between p-2 rounded-lg bg-background/50 hover:bg-background transition-colors"
              disabled={permissions.camera === 'granted' || requesting}
            >
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs">Câmera</span>
              </div>
              {getStatusIcon(permissions.camera)}
            </button>
            
            <button
              onClick={requestLocationPermission}
              className="w-full flex items-center justify-between p-2 rounded-lg bg-background/50 hover:bg-background transition-colors"
              disabled={permissions.location === 'granted' || requesting}
            >
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs">Localização</span>
              </div>
              {getStatusIcon(permissions.location)}
            </button>
            
            <button
              onClick={requestNotificationPermission}
              className="w-full flex items-center justify-between p-2 rounded-lg bg-background/50 hover:bg-background transition-colors"
              disabled={permissions.notifications === 'granted' || requesting}
            >
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs">Notificações</span>
              </div>
              {getStatusIcon(permissions.notifications)}
            </button>
          </div>
          
          <div className="flex gap-2">
            {needsRequest && (
              <Button 
                size="sm" 
                onClick={handleRequestAll}
                disabled={requesting}
                className="flex-1"
              >
                {requesting ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Solicitando...
                  </>
                ) : (
                  'Permitir Todas'
                )}
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setDismissed(true)}
              className="text-xs"
            >
              Depois
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
