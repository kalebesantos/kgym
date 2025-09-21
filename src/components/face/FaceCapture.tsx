import React, { useRef, useState, useCallback } from 'react';
import { Camera, Check, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FaceCaptureProps {
  onCapture: (imageBlob: Blob) => void;
  onCancel: () => void;
  title?: string;
}

export const FaceCapture: React.FC<FaceCaptureProps> = ({
  onCapture,
  onCancel,
  title = "Capturar Foto Facial"
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

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
        setIsStreaming(true);
      }
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsStreaming(false);
    }
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const confirmCapture = useCallback(() => {
    if (canvasRef.current && capturedImage) {
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          onCapture(blob);
        }
      }, 'image/jpeg', 0.8);
    }
  }, [capturedImage, onCapture]);

  React.useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          {!capturedImage ? (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full rounded-lg bg-muted"
                style={{ transform: 'scaleX(-1)' }}
              />
              {isStreaming && (
                <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-primary rounded-full opacity-50"></div>
                </div>
              )}
            </div>
          ) : (
            <img
              src={capturedImage}
              alt="Foto capturada"
              className="w-full rounded-lg"
            />
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="flex gap-2 justify-center">
          {!capturedImage ? (
            <>
              <Button onClick={capturePhoto} disabled={!isStreaming}>
                <Camera className="h-4 w-4 mr-2" />
                Capturar
              </Button>
              <Button variant="outline" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </>
          ) : (
            <>
              <Button onClick={confirmCapture}>
                <Check className="h-4 w-4 mr-2" />
                Confirmar
              </Button>
              <Button variant="outline" onClick={retakePhoto}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Repetir
              </Button>
              <Button variant="outline" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </>
          )}
        </div>

        {!isStreaming && !capturedImage && (
          <div className="text-center text-muted-foreground">
            <p>Aguardando acesso à câmera...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};