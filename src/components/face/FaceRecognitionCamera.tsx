import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, User, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FaceRecognitionCameraProps {
  onRecognized: (studentId: string) => void;
  onFallbackToQR: () => void;
}

export const FaceRecognitionCamera: React.FC<FaceRecognitionCameraProps> = ({
  onRecognized,
  onFallbackToQR
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState<'waiting' | 'scanning' | 'found' | 'error'>('waiting');
  const [detectedStudent, setDetectedStudent] = useState<string | null>(null);
  const { toast } = useToast();

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      }
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      setStatus('error');
      toast({
        title: "Erro de Câmera",
        description: "Não foi possível acessar a câmera. Use o QR Code como alternativa.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Simulação básica de reconhecimento facial
  // Em uma implementação real, aqui seria usado MediaPipe/TensorFlow
  const performFaceRecognition = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsScanning(true);
    setStatus('scanning');

    try {
      // Capturar frame atual
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.drawImage(video, 0, 0);
      
      // Simular processamento (em produção seria o algoritmo real)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Buscar perfis com face_encoding no banco
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, face_encoding')
        .not('face_encoding', 'is', null);

      if (error) {
        throw error;
      }

      // Simular reconhecimento - em produção compararia embeddings
      if (profiles && profiles.length > 0) {
        // Para demonstração, vamos pegar o primeiro perfil com face_encoding
        const recognizedProfile = profiles[0];
        setDetectedStudent(recognizedProfile.full_name);
        setStatus('found');
        
        setTimeout(() => {
          onRecognized(recognizedProfile.id);
        }, 1000);
      } else {
        setStatus('waiting');
        toast({
          title: "Nenhuma face reconhecida",
          description: "Tente posicionar seu rosto na moldura ou use o QR Code.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro no reconhecimento facial:', error);
      setStatus('error');
      toast({
        title: "Erro no Reconhecimento",
        description: "Falha ao processar o reconhecimento facial.",
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
    }
  }, [onRecognized, toast]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const getStatusInfo = () => {
    switch (status) {
      case 'waiting':
        return { text: 'Posicione seu rosto na moldura', variant: 'secondary' as const };
      case 'scanning':
        return { text: 'Analisando...', variant: 'default' as const };
      case 'found':
        return { text: `Reconhecido: ${detectedStudent}`, variant: 'default' as const };
      case 'error':
        return { text: 'Erro na câmera', variant: 'destructive' as const };
      default:
        return { text: 'Aguardando...', variant: 'secondary' as const };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Reconhecimento Facial
        </CardTitle>
        <Badge variant={statusInfo.variant} className="w-fit">
          {statusInfo.text}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full rounded-lg bg-muted"
            style={{ transform: 'scaleX(-1)' }}
          />
          
          {/* Moldura de detecção */}
          <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none">
            <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 rounded-full transition-colors ${
              status === 'found' ? 'border-green-500' : 
              status === 'scanning' ? 'border-yellow-500 animate-pulse' : 
              'border-primary'
            } opacity-70`}></div>
          </div>

          {/* Status overlay */}
          {status === 'scanning' && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-lg">
              <div className="bg-background/90 px-4 py-2 rounded-lg">
                <p className="text-sm">Processando...</p>
              </div>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <div className="flex gap-2 justify-center">
          <Button 
            onClick={performFaceRecognition} 
            disabled={isScanning || status === 'error'}
            className="flex-1"
          >
            <Camera className="h-4 w-4 mr-2" />
            {isScanning ? 'Escaneando...' : 'Escanear Face'}
          </Button>
          
          <Button variant="outline" onClick={onFallbackToQR}>
            <AlertCircle className="h-4 w-4 mr-2" />
            Usar QR Code
          </Button>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>Posicione seu rosto dentro da moldura circular</p>
          <p>Mantenha-se imóvel durante o escaneamento</p>
        </div>
      </CardContent>
    </Card>
  );
};