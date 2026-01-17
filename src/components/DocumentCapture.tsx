import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCamera } from '@/hooks/useCamera';
import { Camera, Image, Upload, Loader2, X, FileText, Plus } from 'lucide-react';
import { isNativePlatform } from '@/lib/nativeFeatures';

interface CapturedDocument {
  id: string;
  name: string;
  data: string; // base64 data URL
  type: 'image' | 'file';
}

interface DocumentCaptureProps {
  documents: CapturedDocument[];
  onDocumentsChange: (documents: CapturedDocument[]) => void;
  maxDocuments?: number;
}

export function DocumentCapture({ 
  documents, 
  onDocumentsChange, 
  maxDocuments = 10 
}: DocumentCaptureProps) {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isNative = isNativePlatform();

  const { capturePhoto, selectFromGallery, loading: cameraLoading } = useCamera({
    onCapture: (imageData) => {
      addDocument({
        id: Date.now().toString(),
        name: `Documento_${documents.length + 1}.jpg`,
        data: imageData,
        type: 'image',
      });
    },
  });

  const addDocument = useCallback((doc: CapturedDocument) => {
    if (documents.length < maxDocuments) {
      onDocumentsChange([...documents, doc]);
    }
  }, [documents, maxDocuments, onDocumentsChange]);

  const removeDocument = useCallback((id: string) => {
    onDocumentsChange(documents.filter(d => d.id !== id));
  }, [documents, onDocumentsChange]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setLoading(true);

    Array.from(files).forEach((file) => {
      if (documents.length >= maxDocuments) return;

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        addDocument({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          data: result,
          type: file.type.startsWith('image/') ? 'image' : 'file',
        });
      };
      reader.readAsDataURL(file);
    });

    setLoading(false);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [documents.length, maxDocuments, addDocument]);

  const handleCameraCapture = async () => {
    if (documents.length >= maxDocuments) return;
    await capturePhoto();
  };

  const handleGallerySelect = async () => {
    if (documents.length >= maxDocuments) return;
    await selectFromGallery();
  };

  return (
    <div className="space-y-4">
      {/* Capture Options */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {isNative ? (
          <>
            <Button
              type="button"
              variant="outline"
              className="h-20 flex flex-col gap-2"
              onClick={handleCameraCapture}
              disabled={cameraLoading || documents.length >= maxDocuments}
            >
              {cameraLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <Camera className="h-6 w-6" />
                  <span className="text-xs">Tirar Foto</span>
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-20 flex flex-col gap-2"
              onClick={handleGallerySelect}
              disabled={cameraLoading || documents.length >= maxDocuments}
            >
              {cameraLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <Image className="h-6 w-6" />
                  <span className="text-xs">Galeria</span>
                </>
              )}
            </Button>
          </>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className={`h-20 flex flex-col gap-2 ${!isNative ? 'col-span-full' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          disabled={loading || documents.length >= maxDocuments}
        >
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <>
              <Upload className="h-6 w-6" />
              <span className="text-xs">Enviar Arquivo</span>
            </>
          )}
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*,.pdf"
          multiple
          className="hidden"
        />
      </div>

      {!isNative && (
        <p className="text-xs text-center text-muted-foreground">
          💡 No aplicativo nativo, você terá acesso à câmera do celular para fotografar documentos
        </p>
      )}

      {/* Document List */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Documentos ({documents.length}/{maxDocuments}):
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {documents.map((doc) => (
              <Card key={doc.id} className="relative overflow-hidden group">
                {doc.type === 'image' ? (
                  <img
                    src={doc.data}
                    alt={doc.name}
                    className="w-full h-24 object-cover"
                  />
                ) : (
                  <div className="w-full h-24 flex items-center justify-center bg-muted">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removeDocument(doc.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="p-1.5">
                  <p className="text-xs truncate">{doc.name}</p>
                </div>
              </Card>
            ))}
            
            {documents.length < maxDocuments && (
              <Card 
                className="h-24 flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors border-dashed"
                onClick={() => isNative ? handleCameraCapture() : fileInputRef.current?.click()}
              >
                <Plus className="h-8 w-8 text-muted-foreground" />
              </Card>
            )}
          </div>
        </div>
      )}

      {documents.length === 0 && (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium mb-1">Nenhum documento enviado</p>
          <p className="text-xs text-muted-foreground">
            RG, CPF, Comprovante de Renda, Comprovante de Residência
          </p>
        </div>
      )}
    </div>
  );
}

export type { CapturedDocument };
