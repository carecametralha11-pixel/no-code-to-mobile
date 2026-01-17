import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Smartphone, Camera, Bell, MapPin } from 'lucide-react';
import { isNativePlatform } from '@/lib/nativeFeatures';

export function NativeFeaturesBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsNative(isNativePlatform());
    // Check if user previously dismissed the banner
    const wasDismissed = localStorage.getItem('nativeBannerDismissed');
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('nativeBannerDismissed', 'true');
  };

  // Don't show if on native app or if dismissed
  if (isNative || dismissed) {
    return null;
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 mb-6 relative overflow-hidden">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-foreground"
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
      </Button>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Smartphone className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
              <Smartphone className="h-5 w-5 sm:hidden text-primary" />
              Experimente nosso App!
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Baixe o aplicativo EmprestAí para ter acesso a recursos exclusivos:
            </p>
            <div className="flex flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-background border">
                <Camera className="h-3.5 w-3.5 text-primary" />
                <span>Câmera para documentos</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-background border">
                <Bell className="h-3.5 w-3.5 text-primary" />
                <span>Notificações push</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-background border">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span>Localização GPS</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
