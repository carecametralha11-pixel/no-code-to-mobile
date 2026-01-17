import { useState, useCallback } from 'react';
import { getCurrentPosition, isNativePlatform } from '@/lib/nativeFeatures';
import { useToast } from '@/hooks/use-toast';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  city?: string;
  state?: string;
}

interface UseGeolocationOptions {
  onSuccess?: (location: LocationData) => void;
  onError?: (error: string) => void;
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const getLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let coords: { latitude: number; longitude: number; accuracy: number };

      if (isNativePlatform()) {
        // Use Capacitor for native platforms
        coords = await getCurrentPosition();
      } else {
        // Use browser geolocation API for web
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocalização não suportada pelo navegador'));
            return;
          }
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        });
        coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
      }

      // Try to get city name using reverse geocoding
      let city: string | undefined;
      let state: string | undefined;

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&accept-language=pt-BR`
        );
        const data = await response.json();
        city = data.address?.city || data.address?.town || data.address?.village;
        state = data.address?.state;
      } catch (geoError) {
        console.log('Reverse geocoding failed, using coordinates only');
      }

      const locationData: LocationData = {
        ...coords,
        city,
        state,
      };

      setLocation(locationData);
      options.onSuccess?.(locationData);

      toast({
        title: 'Localização obtida',
        description: city ? `${city}${state ? `, ${state}` : ''}` : 'Coordenadas capturadas',
      });

      return locationData;
    } catch (err: any) {
      let errorMessage = 'Erro ao obter localização';
      
      if (err.code === 1) {
        errorMessage = 'Permissão de localização negada';
      } else if (err.code === 2) {
        errorMessage = 'Localização indisponível';
      } else if (err.code === 3) {
        errorMessage = 'Tempo esgotado ao obter localização';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      options.onError?.(errorMessage);

      toast({
        title: 'Erro de localização',
        description: errorMessage,
        variant: 'destructive',
      });

      return null;
    } finally {
      setLoading(false);
    }
  }, [options, toast]);

  const clearLocation = useCallback(() => {
    setLocation(null);
    setError(null);
  }, []);

  return {
    location,
    loading,
    error,
    getLocation,
    clearLocation,
    isNative: isNativePlatform(),
  };
}
