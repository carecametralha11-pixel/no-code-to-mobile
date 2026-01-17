import { useState, useCallback } from 'react';
import { takePicture, pickFromGallery, isNativePlatform } from '@/lib/nativeFeatures';
import { useToast } from '@/hooks/use-toast';

interface UseCameraOptions {
  onCapture?: (imageData: string) => void;
}

export function useCamera(options: UseCameraOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const capturePhoto = useCallback(async () => {
    if (!isNativePlatform()) {
      toast({
        title: 'Câmera não disponível',
        description: 'A câmera só está disponível no aplicativo nativo.',
        variant: 'destructive',
      });
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const imageData = await takePicture();
      if (imageData && options.onCapture) {
        options.onCapture(imageData);
      }
      return imageData;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao capturar foto';
      setError(errorMessage);
      toast({
        title: 'Erro na câmera',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [options, toast]);

  const selectFromGallery = useCallback(async () => {
    if (!isNativePlatform()) {
      toast({
        title: 'Galeria não disponível',
        description: 'A galeria só está disponível no aplicativo nativo.',
        variant: 'destructive',
      });
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const imageData = await pickFromGallery();
      if (imageData && options.onCapture) {
        options.onCapture(imageData);
      }
      return imageData;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao selecionar foto';
      setError(errorMessage);
      toast({
        title: 'Erro na galeria',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [options, toast]);

  return {
    capturePhoto,
    selectFromGallery,
    loading,
    error,
    isNative: isNativePlatform(),
  };
}
