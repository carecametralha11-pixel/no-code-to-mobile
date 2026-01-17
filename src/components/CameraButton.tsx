import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCamera } from '@/hooks/useCamera';
import { Camera, Image, Upload, Loader2, X } from 'lucide-react';

interface CameraButtonProps {
  onCapture: (imageData: string) => void;
  label?: string;
  className?: string;
}

export function CameraButton({ onCapture, label = 'Tirar Foto', className }: CameraButtonProps) {
  const [open, setOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { capturePhoto, selectFromGallery, loading, isNative } = useCamera({
    onCapture: (imageData) => {
      setCapturedImage(imageData);
    },
  });

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setCapturedImage(result);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleConfirm = useCallback(() => {
    if (capturedImage) {
      onCapture(capturedImage);
      setCapturedImage(null);
      setOpen(false);
    }
  }, [capturedImage, onCapture]);

  const handleCancel = useCallback(() => {
    setCapturedImage(null);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <Camera className="h-4 w-4 mr-2" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Capturar Documento</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {capturedImage ? (
            <div className="relative">
              <img 
                src={capturedImage} 
                alt="Captured" 
                className="w-full rounded-lg object-cover max-h-64"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleCancel}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {isNative ? (
                <>
                  <Button 
                    onClick={capturePhoto} 
                    disabled={loading}
                    className="w-full h-20 flex flex-col gap-2"
                  >
                    {loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <>
                        <Camera className="h-6 w-6" />
                        <span>Tirar Foto</span>
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={selectFromGallery} 
                    disabled={loading}
                    className="w-full h-20 flex flex-col gap-2"
                  >
                    {loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <>
                        <Image className="h-6 w-6" />
                        <span>Escolher da Galeria</span>
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-20 flex flex-col gap-2"
                  >
                    <Upload className="h-6 w-6" />
                    <span>Enviar Arquivo</span>
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    💡 No aplicativo nativo, você terá acesso à câmera do celular
                  </p>
                </>
              )}
            </div>
          )}

          {capturedImage && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleConfirm} className="flex-1">
                Usar esta foto
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
