"use client";

import { useState, useRef, useCallback, MouseEvent, useEffect, DragEvent } from "react";
import { Mic, StopCircle, Copy, Check, Loader2, AlertCircle, Wand2, Pause, Play, Timer, Trash2, FilePenLine, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import AudioVisualizer from "./audio-visualizer";
import { transcribeAudio, expandText, rewriteText } from "@/ai/client";

type Status = "idle" | "recording" | "paused" | "processing" | "ready" | "error" | "file-loaded";
type AiActionStatus = "idle" | "processing" | "error";

interface TranscriptionHistoryItem {
  text: string;
  date: string;
}

export default function AudioRecorder() {
  const [status, setStatus] = useState<Status>("idle");
  const [expansionStatus, setExpansionStatus] = useState<AiActionStatus>("idle");
  const [rewriteStatus, setRewriteStatus] = useState<AiActionStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [is3dEffectEnabled, setIs3dEffectEnabled] = useState(true);
  const [isNoiseSuppressionEnabled, setIsNoiseSuppressionEnabled] = useState(true);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcriptionHistory, setTranscriptionHistory] = useState<TranscriptionHistoryItem[]>([]);
  const [copiedHistory, setCopiedHistory] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isCancelledRef = useRef(false);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem("transcriptionHistory");
      if (storedHistory) {
        setTranscriptionHistory(JSON.parse(storedHistory));
      }
      const stored3dEffect = localStorage.getItem("is3dEffectEnabled");
      if (stored3dEffect !== null) {
        setIs3dEffectEnabled(JSON.parse(stored3dEffect));
      }
      const storedNoiseSuppression = localStorage.getItem("isNoiseSuppressionEnabled");
      if (storedNoiseSuppression !== null) {
        setIsNoiseSuppressionEnabled(JSON.parse(storedNoiseSuppression));
      }
    } catch (e) {
      console.error("Failed to parse from localStorage", e);
    }
  }, []);

  useEffect(() => {
    if (status === 'recording') {
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [status]);
  
  const handleTranscription = useCallback(async (blob: Blob) => {
    isCancelledRef.current = false;
    setStatus("processing");
    setError(null);

    if (blob.size < 1000) {
        setError("Nenhum áudio foi gravado ou o arquivo está vazio. A gravação pode estar vazia ou muito curta.");
        setStatus("error");
        return;
    }
    try {
        const audioDataUri = await blobToDataUri(blob);
        const parts = audioDataUri.split(',');
        const mimeType = parts[0].split(':')[1].split(';')[0];
        const audioData = parts[1];

        if (isCancelledRef.current) return;

        const result = await transcribeAudio(mimeType, audioData, isNoiseSuppressionEnabled);
        
        if (result && result.transcription) {
            const newTranscription = result.transcription;
            setTranscript(newTranscription);
            const newItem: TranscriptionHistoryItem = { text: newTranscription, date: new Date().toISOString() };
            
            setTranscriptionHistory(prevHistory => {
              const newHistory = [newItem, ...prevHistory];
              try {
                localStorage.setItem("transcriptionHistory", JSON.stringify(newHistory));
              } catch (e) {
                console.error("Failed to save to localStorage", e);
              }
              return newHistory;
            });
            setStatus("ready");
        } else {
             setError("Não foi possível transcrever o áudio. A resposta da IA estava vazia.");
             setStatus("error");
        }
    } catch (e: unknown) {
        console.error("Transcription failed:", e);
        setError(getErrorMessage(e));
        setStatus("error");
    } finally {
      clearUploadedFile();
    }
  }, [isNoiseSuppressionEnabled]);


  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !is3dEffectEnabled) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const rotateY = 5 * ((mouseX - width / 2) / (width / 2));
    const rotateX = -5 * ((mouseY - height / 2) / (height / 2));
    setRotate({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    if (!is3dEffectEnabled) return;
    setRotate({ x: 0, y: 0 });
  };
  
  const handleToggle3dEffect = (checked: boolean) => {
    setIs3dEffectEnabled(checked);
    localStorage.setItem("is3dEffectEnabled", JSON.stringify(checked));
    if (!checked) {
      setRotate({ x: 0, y: 0 });
    }
  };

  const handleToggleNoiseSuppression = (checked: boolean) => {
    setIsNoiseSuppressionEnabled(checked);
    localStorage.setItem("isNoiseSuppressionEnabled", JSON.stringify(checked));
  };

  const blobToDataUri = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Falha ao converter o blob para data URI'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const getErrorMessage = (e: unknown): string => {
    let errorMessage = "Ocorreu um erro desconhecido.";
    if (e instanceof Error) {
        errorMessage = e.message;
        if (e.message.includes('API key not valid')) {
          errorMessage = 'A chave de API do Google não é válida. Verifique o arquivo .env.local.'
        }
    }
    return errorMessage;
  };

  const handleExpansion = useCallback(async () => {
    if (!transcript) return;
    setExpansionStatus("processing");
    setError(null);
    try {
      const result = await expandText(transcript);
      setTranscript(result.expandedText);
    } catch (e: unknown) {
      console.error(e);
      setError(getErrorMessage(e));
    } finally {
      setExpansionStatus("idle");
    }
  }, [transcript]);

  const handleRewrite = useCallback(async () => {
    if (!transcript) return;
    setRewriteStatus("processing");
    setError(null);
    try {
      const result = await rewriteText(transcript);
      setTranscript(result.rewrittenText);
    } catch (e: unknown) {
      console.error(e);
      setError(getErrorMessage(e));
    } finally {
      setRewriteStatus("idle");
    }
  }, [transcript]);


  const startRecording = useCallback(async () => {
    if(status !== 'idle') return;
    try {
      isCancelledRef.current = false;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream);
      setStatus("recording");
      setTranscript("");
      setError(null);
      setRecordingTime(0);
      audioChunksRef.current = [];
      const mimeTypes = [
        "audio/webm; codecs=opus",
        "audio/webm",
      ];
      const supportedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));

      if (!supportedMimeType) {
        setError("Nenhum formato de áudio suportado foi encontrado no seu navegador.");
        setStatus("error");
        return;
      }

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: supportedMimeType });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        if (isCancelledRef.current) {
            console.log("Transcrição cancelada pelo usuário.");
            return;
        }
        const recordedAudioBlob = new Blob(audioChunksRef.current, { type: supportedMimeType });
        handleTranscription(recordedAudioBlob);
      };

      mediaRecorderRef.current.start();
    } catch (err: unknown) {
      console.error("Erro ao iniciar a gravação:", err);
      let errorMessage = "Ocorreu um erro desconhecido ao tentar acessar o microfone.";
      if (err instanceof DOMException) {
          switch (err.name) {
              case "NotAllowedError":
                  errorMessage = "Acesso ao microfone negado. Para gravar, clique no ícone de cadeado na barra de endereço do navegador e permita o acesso ao microfone.";
                  break;
              case "NotFoundError":
                  errorMessage = "Nenhum microfone foi encontrado. Por favor, conecte um microfone e tente novamente.";
                  break;
              case "NotReadableError":
                  errorMessage = "O microfone está sendo usado por outro aplicativo ou processo. Por favor, feche-o e tente novamente.";
                  break;
              case "AbortError":
                  errorMessage = "A requisição do microfone foi abortada. Tente novamente.";
                  break;
              case "SecurityError":
                  errorMessage = "Acesso ao microfone bloqueado por razões de segurança. Certifique-se de que a página está sendo acessada via HTTPS.";
                  break;
              default:
                  errorMessage = `Ocorreu um erro inesperado: ${err.name}.`;
          }
      }
      setError(errorMessage);
      setStatus("error");
    }
  }, [handleTranscription, status]);
  
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && (status === "recording" || status === "paused")) {
      isCancelledRef.current = false;
      mediaRecorderRef.current.stop();
       if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        setMediaStream(null);
      }
    }
  }, [status, mediaStream]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      setStatus("paused");
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      setStatus("recording");
    }
  }, []);

  const cancelProcessing = useCallback(() => {
    isCancelledRef.current = true;
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    window.location.reload();
  }, []);


  const handleCopy = () => {
    if(!transcript) return;
    navigator.clipboard.writeText(transcript);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };
  
  const handleCopyHistory = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedHistory(index);
    setTimeout(() => setCopiedHistory(null), 2000);
  };

  const handleDeleteHistoryItem = (indexToDelete: number) => {
    const newHistory = transcriptionHistory.filter((_, index) => index !== indexToDelete);
    setTranscriptionHistory(newHistory);
    try {
      localStorage.setItem("transcriptionHistory", JSON.stringify(newHistory));
    } catch (e) {
      console.error("Failed to save to localStorage", e);
    }
  };
  
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60).toString().padStart(2, '0');
    const seconds = (time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  // Funções de Drag and Drop e Upload
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      loadFile(file);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      loadFile(file);
    }
  };

  const loadFile = (file: File) => {
    const validTypes = ["audio/mpeg", "audio/mp4", "video/mp4", "audio/mp3"];
    if (!validTypes.includes(file.type)) {
      setError(`Formato de arquivo não suportado: ${file.type}. Por favor, use MP3 ou MP4.`);
      setStatus("error");
      return;
    }
    setUploadedFile(file);
    setUploadedFileUrl(URL.createObjectURL(file));
    setStatus("file-loaded");
    setError(null);
    setTranscript("");
  };

  const clearUploadedFile = () => {
    if (uploadedFileUrl) {
      URL.revokeObjectURL(uploadedFileUrl);
    }
    setUploadedFile(null);
    setUploadedFileUrl(null);
    if(status === 'file-loaded' || status === 'ready' || status === 'error') {
      setStatus("idle");
    }
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleTranscribeFile = () => {
    if(uploadedFile) {
        handleTranscription(uploadedFile);
    }
  }

  const handleDragEvents = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === "dragenter" || event.type === "dragover") {
      setDragOver(true);
    } else if (event.type === "dragleave") {
      setDragOver(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  const isAiProcessing = expansionStatus === "processing" || rewriteStatus === "processing";
  const canInteract = status === 'idle' || status === 'file-loaded';

  return (
    <Card 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
        transition: 'transform 0.1s ease-out',
      }}
      className="w-full shadow-2xl shadow-primary/10 border-primary/20 rounded-2xl will-change-transform">
      <CardHeader className="text-center">
        <CardTitle>Sua Ferramenta de Mídia Inteligente</CardTitle>
        <CardDescription>Grave áudios ou carregue arquivos MP3/MP4 para transcrever.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {(status === 'error' || expansionStatus === 'error' || rewriteStatus === 'error') && error && (
           <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div 
            className={cn(
              "flex flex-col justify-center items-center py-4 min-h-[180px] gap-4 border-2 border-dashed rounded-lg transition-colors duration-200",
              {"border-primary bg-primary/10": dragOver},
              {"border-border": !dragOver}
            )}
            onDrop={handleDrop}
            onDragEnter={handleDragEvents}
            onDragLeave={handleDragEvents}
            onDragOver={handleDragEvents}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="audio/mpeg,audio/mp3,video/mp4"
            className="hidden"
          />
          {status === 'recording' || status === 'paused' ? (
            <>
              {mediaStream && <AudioVisualizer mediaStream={mediaStream} isSuppressed={isNoiseSuppressionEnabled} />}
              <div className="flex w-full items-center justify-center gap-4">
                 <div className="flex items-center gap-2 text-muted-foreground font-mono text-lg">
                    <Timer className="h-5 w-5"/>
                    <span>{formatTime(recordingTime)}</span>
                </div>
                {status === 'recording' ? (
                  <Button onClick={pauseRecording} variant="outline" size="lg">
                    <Pause className="mr-2 h-5 w-5" />
                    Pausar
                  </Button>
                ) : (
                  <Button onClick={resumeRecording} variant="outline" size="lg">
                    <Play className="mr-2 h-5 w-5" />
                    Retomar
                  </Button>
                )}
                <Button onClick={stopRecording} variant="destructive" size="lg" className="shadow-md transition-transform hover:scale-105">
                  <StopCircle className="mr-2 h-5 w-5" />
                  Parar
                </Button>
              </div>
            </>
          ) : status === 'processing' ? (
             <div className="flex flex-col items-center gap-4">
                <div className="relative flex h-32 w-32 items-center justify-center">
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Loader2 className="h-40 w-40 animate-spin text-destructive/50" />
                  </div>
                   <Button
                    onClick={cancelProcessing}
                    variant="destructive"
                    className={cn(
                      "h-32 w-32 rounded-full",
                      "flex flex-col items-center justify-center gap-2",
                      "transition-all duration-300 ease-in-out transform hover:scale-105",
                      "text-lg font-bold shadow-lg"
                    )}
                    aria-label="Cancelar"
                  >
                    <Trash2 className="h-8 w-8" />
                    <span>Cancelar</span>
                  </Button>
                </div>
                <p className="text-sm font-medium text-destructive mt-2">Processando...</p>
              </div>
          ) : status === 'file-loaded' && uploadedFile && uploadedFileUrl ? (
            <div className="flex flex-col items-center gap-3 w-full">
              <div className="relative w-full max-w-sm p-2 bg-secondary rounded-md">
                {uploadedFile.type.startsWith('video') ? (
                    <video src={uploadedFileUrl} controls className="w-full rounded" />
                ) : (
                    <audio src={uploadedFileUrl} controls className="w-full" />
                )}
                <Button variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80" onClick={clearUploadedFile}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground truncate max-w-xs">{uploadedFile.name}</p>
              <Button onClick={handleTranscribeFile} size="lg" className="bg-accent hover:bg-accent/90">
                Transcrever Arquivo
              </Button>
            </div>
          ) : (
             <div className="flex flex-col items-center gap-4 text-center">
                <Button
                  onClick={startRecording}
                  disabled={isAiProcessing}
                  className={cn(
                    "h-24 w-24 rounded-full",
                    "flex flex-col items-center justify-center gap-2",
                    "transition-all duration-300 ease-in-out transform hover:scale-105",
                    "text-md font-bold shadow-lg"
                  )}
                  aria-label="Gravar"
                >
                  <Mic className="h-8 w-8" />
                  <span>Gravar</span>
                </Button>
                <div className="text-muted-foreground text-sm">ou</div>
                <Button variant="outline" onClick={triggerFileInput}>
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Selecione um arquivo (MP3, MP4)
                </Button>
                <p className="text-xs text-muted-foreground mt-2">Você também pode arrastar e soltar um arquivo aqui.</p>
             </div>
          )}
        </div>
        <div className="space-y-2">
            <div className="flex justify-end gap-2">
              <Button
                onClick={handleRewrite}
                variant="outline"
                disabled={isAiProcessing || !transcript}
              >
                {rewriteStatus === "processing" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FilePenLine className="mr-2 h-4 w-4" />
                )}
                {rewriteStatus === "processing" ? "Reescrevendo..." : "Reescrever"}
              </Button>
              <Button
                onClick={handleExpansion}
                variant="outline"
                disabled={isAiProcessing || !transcript}
              >
                {expansionStatus === "processing" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-4 w-4" />
                )}
                {expansionStatus === "processing" ? "Expandindo..." : "Expandir"}
              </Button>
            </div>
            <div className="relative">
              <Textarea
                placeholder={
                  status === 'recording' ? 'Gravação em andamento...' : 
                  status === 'paused' ? 'Gravação pausada...' :
                  status === 'processing' ? 'Sua transcrição aparecerá aqui em breve...' :
                  status === 'file-loaded' ? `Pronto para transcrever "${uploadedFile?.name}". Clique em "Transcrever Arquivo".` :
                  'Sua transcrição aparecerá aqui...'
                }
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                disabled={isAiProcessing || status !== 'ready'}
                rows={10}
                className="resize-none bg-secondary/50 rounded-lg text-base select-text"
              />
              {(isAiProcessing) && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-md">
                  <div className="flex flex-col items-center gap-2 text-primary">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="text-sm font-medium">
                      {expansionStatus === "processing" ? "Expandindo texto..." : 
                      "Reescrevendo texto..."}
                    </span>
                  </div>
                </div>
              )}
            </div>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Switch 
            id="noise-suppression-switch" 
            checked={isNoiseSuppressionEnabled}
            onCheckedChange={handleToggleNoiseSuppression}
          />
          <Label htmlFor="noise-suppression-switch">Supressão de Ruído</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch 
            id="animation-switch" 
            checked={is3dEffectEnabled}
            onCheckedChange={handleToggle3dEffect}
          />
          <Label htmlFor="animation-switch">Efeito 3D</Label>
        </div>
        <div className="flex-1 text-center text-xs text-muted-foreground">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="link" className="text-xs text-muted-foreground p-0 h-auto">
                Transcrição realizada: {transcriptionHistory.length}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Histórico de Transcrições</DialogTitle>
              </DialogHeader>
              <ScrollArea className="h-96">
                <div className="space-y-4 pr-6">
                  {transcriptionHistory.length > 0 ? (
                    transcriptionHistory.map((item, index) => (
                      <div key={index} className="border-b pb-4">
                        <p className="text-xs text-muted-foreground mb-2">
                          {new Date(item.date).toLocaleString()}
                        </p>
                        <div className="flex items-start gap-4">
                          <p className="flex-1 text-sm select-text">{item.text}</p>
                          <div className="flex flex-row items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCopyHistory(item.text, index)}
                            >
                              {copiedHistory === index ? (
                                 <Check className="h-4 w-4" />
                              ) : (
                                 <Copy className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteHistoryItem(index)}
                              className="text-destructive hover:text-destructive"
                            >
                               <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-16">Nenhuma transcrição no histórico.</p>
                  )}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
         <Button 
            onClick={handleCopy} 
            variant="default" 
            className="bg-primary hover:bg-primary/90"
            disabled={!transcript || isAiProcessing}
          >
            {isCopied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            {isCopied ? "Copiado!" : "Copiar"}
        </Button>
      </CardFooter>
    </Card>
  );
}

    