import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useGeolocation } from '@/hooks/useGeolocation';
import { MapPin, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { isNativePlatform } from '@/lib/nativeFeatures';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  city?: string;
  state?: string;
}

interface LocationCaptureProps {
  onLocationChange: (location: LocationData | null) => void;
  location: LocationData | null;
  autoCapture?: boolean;
}

export function LocationCapture({ 
  onLocationChange, 
  location, 
  autoCapture = true 
}: LocationCaptureProps) {
  const { getLocation, loading, error, isNative } = useGeolocation({
    onSuccess: onLocationChange,
  });

  // Auto-capture on mount if enabled
  useEffect(() => {
    if (autoCapture && !location) {
      getLocation();
    }
  }, [autoCapture]);

  const handleRetry = () => {
    getLocation();
  };

  return (
    <Card className="p-4">
      <div className="flex items-start gap-4">
        <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
          location 
            ? 'bg-green-100 dark:bg-green-900/30' 
            : error 
              ? 'bg-red-100 dark:bg-red-900/30' 
              : 'bg-muted'
        }`}>
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : location ? (
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          ) : error ? (
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          ) : (
            <MapPin className="h-5 w-5 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm mb-1">Localização</h4>
          
          {loading ? (
            <p className="text-xs text-muted-foreground">
              Obtendo sua localização...
            </p>
          ) : location ? (
            <div className="space-y-1">
              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                {location.city 
                  ? `${location.city}${location.state ? `, ${location.state}` : ''}`
                  : 'Localização capturada'
                }
              </p>
              <p className="text-xs text-muted-foreground">
                Precisão: ±{Math.round(location.accuracy)}m
              </p>
            </div>
          ) : error ? (
            <div className="space-y-2">
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="h-7 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Tentar novamente
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Precisamos da sua localização para segurança
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={getLocation}
                className="h-7 text-xs"
              >
                <MapPin className="h-3 w-3 mr-1" />
                Capturar localização
              </Button>
            </div>
          )}
        </div>
      </div>

      {!isNative && (
        <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
          💡 No aplicativo nativo, a localização GPS é mais precisa
        </p>
      )}
    </Card>
  );
}

export type { LocationData };
