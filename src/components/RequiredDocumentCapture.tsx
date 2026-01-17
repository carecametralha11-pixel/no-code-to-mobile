import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Camera, Upload, Loader2, X, CheckCircle2, AlertCircle, Image, CreditCard, RefreshCw } from 'lucide-react';
import { isNativePlatform } from '@/lib/nativeFeatures';

interface RequiredDocument {
  id: string;
  type: 'rg_frente' | 'rg_verso' | 'selfie_documento' | 'cartao_frente' | 'cartao_verso';
  label: string;
  description: string;
  data?: string; // base64 data URL
  captured: boolean;
}

interface RequiredDocumentCaptureProps {
  documents: RequiredDocument[];
  onDocumentsChange: (documents: RequiredDocument[]) => void;
}

const initialDocuments: RequiredDocument[] = [
  {
    id: 'rg_frente',
    type: 'rg_frente',
    label: 'RG ou CNH - Frente',
    description: 'Foto da frente do seu documento',
    captured: false,
  },
  {
    id: 'rg_verso',
    type: 'rg_verso',
    label: 'RG ou CNH - Verso',
    description: 'Foto do verso do seu documento',
    captured: false,
  },
  {
    id: 'selfie_documento',
    type: 'selfie_documento',
    label: 'Selfie com Documento',
    description: 'Foto do seu rosto segurando o documento',
    captured: false,
  },
  {
    id: 'cartao_frente',
    type: 'cartao_frente',
    label: 'Cartão Bancário - Frente',
    description: 'Foto da frente do seu cartão (crédito ou débito)',
    captured: false,
  },
  {
    id: 'cartao_verso',
    type: 'cartao_verso',
    label: 'Cartão Bancário - Verso',
    description: 'Foto do verso do cartão (tape o CVV com o dedo)',
    captured: false,
  },
];

export function RequiredDocumentCapture({ 
  documents, 
  onDocumentsChange 
}: RequiredDocumentCaptureProps) {
  const [loadingDoc, setLoadingDoc] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const { toast } = useToast();
  const isNative = isNativePlatform();

  const updateDocument = useCallback((docId: string, data: string) => {
    console.log('Updating document:', docId, 'data length:', data?.length);
    const updatedDocs = documents.map(doc => 
      doc.id === docId 
        ? { ...doc, data, captured: true }
        : doc
    );
    onDocumentsChange(updatedDocs);
    toast({
      title: 'Foto capturada!',
      description: 'Documento adicionado com sucesso.',
    });
  }, [documents, onDocumentsChange, toast]);

  const removeDocument = useCallback((docId: string) => {
    const updatedDocs = documents.map(doc => 
      doc.id === docId 
        ? { ...doc, data: undefined, captured: false }
        : doc
    );
    onDocumentsChange(updatedDocs);
  }, [documents, onDocumentsChange]);

  const handleCameraCapture = async (docId: string) => {
    if (!isNative) {
      toast({
        title: 'Câmera não disponível',
        description: 'Use a opção "Enviar Arquivo" ou abra no app nativo.',
        variant: 'destructive',
      });
      return;
    }

    setLoadingDoc(docId);
    
    try {
      const { Camera: CameraPlugin, CameraResultType, CameraSource } = await import('@capacitor/camera');
      
      // Request permission first
      const permStatus = await CameraPlugin.checkPermissions();
      if (permStatus.camera !== 'granted') {
        const permRequest = await CameraPlugin.requestPermissions();
        if (permRequest.camera !== 'granted') {
          toast({
            title: 'Permissão negada',
            description: 'Ative a câmera nas configurações do app.',
            variant: 'destructive',
          });
          setLoadingDoc(null);
          return;
        }
      }

      const image = await CameraPlugin.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        correctOrientation: true,
        width: 1200,
        height: 1600,
      });

      if (image.dataUrl) {
        updateDocument(docId, image.dataUrl);
      } else {
        throw new Error('Nenhuma imagem capturada');
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      if (!err.message?.includes('cancelled') && !err.message?.includes('User cancelled')) {
        toast({
          title: 'Erro na câmera',
          description: err.message || 'Não foi possível capturar a foto. Tente novamente.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoadingDoc(null);
    }
  };

  const handleGallerySelect = async (docId: string) => {
    if (!isNative) {
      // On web, use file input
      fileInputRefs.current[docId]?.click();
      return;
    }

    setLoadingDoc(docId);
    
    try {
      const { Camera: CameraPlugin, CameraResultType, CameraSource } = await import('@capacitor/camera');
      
      const image = await CameraPlugin.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
        correctOrientation: true,
        width: 1200,
        height: 1600,
      });

      if (image.dataUrl) {
        updateDocument(docId, image.dataUrl);
      } else {
        throw new Error('Nenhuma imagem selecionada');
      }
    } catch (err: any) {
      console.error('Gallery error:', err);
      if (!err.message?.includes('cancelled') && !err.message?.includes('User cancelled')) {
        toast({
          title: 'Erro na galeria',
          description: err.message || 'Não foi possível selecionar a foto.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoadingDoc(null);
    }
  };

  const handleFileUpload = (docId: string) => {
    fileInputRefs.current[docId]?.click();
  };

  const onFileChange = useCallback((docId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor, selecione uma imagem.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'A imagem deve ter no máximo 10MB.',
        variant: 'destructive',
      });
      return;
    }

    setLoadingDoc(docId);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      updateDocument(docId, result);
      setLoadingDoc(null);
    };
    reader.onerror = () => {
      toast({
        title: 'Erro ao ler arquivo',
        description: 'Não foi possível processar a imagem.',
        variant: 'destructive',
      });
      setLoadingDoc(null);
    };
    reader.readAsDataURL(file);

    // Reset input
    event.target.value = '';
  }, [updateDocument, toast]);

  const completedCount = documents.filter(d => d.captured).length;
  const totalCount = documents.length;
  const isComplete = completedCount === totalCount;

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <span className="text-sm font-medium">Documentos obrigatórios</span>
        <Badge variant={isComplete ? "default" : "secondary"} className={isComplete ? "bg-green-500" : ""}>
          {completedCount}/{totalCount} enviados
        </Badge>
      </div>

      {/* Document Cards */}
      <div className="space-y-4">
        {documents.map((doc) => (
          <Card key={doc.id} className={`p-4 transition-all ${doc.captured ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20' : ''}`}>
            <div className="flex items-start gap-4">
              {/* Preview or Icon */}
              <div className="shrink-0">
                {doc.captured && doc.data ? (
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-green-500/50">
                    <img 
                      src={doc.data} 
                      alt={doc.label} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => removeDocument(doc.id)}
                        className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className={`w-20 h-20 rounded-lg flex items-center justify-center border-2 border-dashed ${
                    doc.type === 'selfie_documento' 
                      ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700' 
                      : doc.type === 'cartao_frente' || doc.type === 'cartao_verso'
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                  }`}>
                    {loadingDoc === doc.id ? (
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    ) : doc.type === 'selfie_documento' ? (
                      <Camera className="h-8 w-8 text-purple-500" />
                    ) : doc.type === 'cartao_frente' || doc.type === 'cartao_verso' ? (
                      <CreditCard className="h-8 w-8 text-green-500" />
                    ) : (
                      <Image className="h-8 w-8 text-blue-500" />
                    )}
                  </div>
                )}
              </div>

              {/* Info and Actions */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      {doc.label}
                      {doc.captured && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    </h4>
                    <p className="text-xs text-muted-foreground">{doc.description}</p>
                  </div>
                </div>

                {!doc.captured ? (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {isNative && (
                      <>
                        <Button
                          type="button"
                          variant="default"
                          size="sm"
                          onClick={() => handleCameraCapture(doc.id)}
                          disabled={loadingDoc === doc.id}
                          className="text-xs"
                        >
                          {loadingDoc === doc.id ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Camera className="h-3 w-3 mr-1" />
                          )}
                          Tirar Foto
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleGallerySelect(doc.id)}
                          disabled={loadingDoc === doc.id}
                          className="text-xs"
                        >
                          <Image className="h-3 w-3 mr-1" />
                          Galeria
                        </Button>
                      </>
                    )}
                    <Button
                      type="button"
                      variant={isNative ? "ghost" : "default"}
                      size="sm"
                      onClick={() => handleFileUpload(doc.id)}
                      disabled={loadingDoc === doc.id}
                      className="text-xs"
                    >
                      {loadingDoc === doc.id ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Upload className="h-3 w-3 mr-1" />
                      )}
                      {isNative ? 'Arquivo' : 'Enviar Arquivo'}
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2 mt-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => isNative ? handleCameraCapture(doc.id) : handleFileUpload(doc.id)}
                      disabled={loadingDoc === doc.id}
                      className="text-xs"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Trocar foto
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDocument(doc.id)}
                      className="text-xs text-destructive hover:text-destructive"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Remover
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Hidden file input for each document */}
            <input
              type="file"
              ref={(el) => { fileInputRefs.current[doc.id] = el; }}
              onChange={(e) => onFileChange(doc.id, e)}
              accept="image/*"
              capture={isNative ? "environment" : undefined}
              className="hidden"
            />
          </Card>
        ))}
      </div>

      {/* Tips */}
      <Card className="p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">Dicas para uma boa foto:</p>
            <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
              <li>• Certifique-se de que o documento está bem iluminado</li>
              <li>• Evite reflexos e sombras</li>
              <li>• O documento deve estar completamente visível</li>
              <li>• Na selfie, mantenha o documento ao lado do rosto</li>
              <li>• <strong>No cartão:</strong> tape o código CVV com o dedo na foto do verso</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Card Verification Info */}
      <Card className="p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
        <div className="flex gap-3">
          <CreditCard className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-green-800 dark:text-green-200 mb-1">Por que pedimos foto do cartão?</p>
            <p className="text-xs text-green-700 dark:text-green-300">
              A foto do cartão bancário (crédito ou débito) comprova que você é o titular da conta informada. 
              Isso aumenta a segurança e agiliza a aprovação do seu empréstimo.
            </p>
          </div>
        </div>
      </Card>

      {!isNative && (
        <p className="text-xs text-center text-muted-foreground">
          💡 No aplicativo nativo, você terá acesso à câmera do celular para fotografar documentos
        </p>
      )}
    </div>
  );
}

export { initialDocuments };
export type { RequiredDocument };
