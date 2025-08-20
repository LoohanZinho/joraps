"use client";

import { useState, useRef, useCallback, MouseEvent, useEffect, DragEvent } from "react";
import { Mic, StopCircle, Copy, Check, Loader2, AlertCircle, Wand2, Pause, Play, Timer, Trash2, FilePenLine, UploadCloud, X, Send, Bot, User, Volume2, Volume1, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import AudioVisualizer from "./audio-visualizer";
import { transcribeAudio, expandText, rewriteText, chatAboutContent } from "@/ai/client";

type Status = "idle" | "recording" | "paused" | "processing" | "ready" | "error" | "file-loaded";
type AiActionStatus = "idle" | "processing" | "error";

interface TranscriptionHistoryItem {
  text: string;
  date: string;
}

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}


// Componente do Player de Mídia Personalizado
function CustomMediaPlayer({ file, url, type, onEnded }: { file: File | null, url: string, type: 'audio' | 'video', onEnded: () => void }) {
    const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [volume, setVolume] = useState(1);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        const media = mediaRef.current;
        if (!media) return;

        const setMediaData = () => {
            setDuration(media.duration);
            setCurrentTime(media.currentTime);
        };

        const setTime = () => {
            const newTime = media.currentTime;
            setCurrentTime(newTime);
            setProgress((newTime / media.duration) * 100);
        };

        media.addEventListener('loadedmetadata', setMediaData);
        media.addEventListener('timeupdate', setTime);
        media.addEventListener('ended', onEnded);
        
        // Sincroniza o volume inicial
        media.volume = volume;
        media.muted = isMuted;

        return () => {
            media.removeEventListener('loadedmetadata', setMediaData);
            media.removeEventListener('timeupdate', setTime);
            media.removeEventListener('ended', onEnded);
        };
    }, [url, onEnded]);
    
    useEffect(() => {
      const media = mediaRef.current;
      if(media) {
        media.volume = isMuted ? 0 : volume;
      }
    }, [volume, isMuted])

    const togglePlay = () => {
        const media = mediaRef.current;
        if (media) {
            if (isPlaying) {
                media.pause();
            } else {
                media.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleProgressChange = (value: number[]) => {
        const media = mediaRef.current;
        if (media) {
            const newTime = (value[0] / 100) * duration;
            media.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };
    
    const handleVolumeChange = (value: number[]) => {
        const newVolume = value[0];
        setVolume(newVolume);
        if(newVolume > 0 && isMuted) {
            setIsMuted(false);
        }
    };
    
    const toggleMute = () => {
        setIsMuted(!isMuted);
    }

    const formatTime = (time: number) => {
        if (isNaN(time)) return '00:00';
        const minutes = Math.floor(time / 60).toString().padStart(2, '0');
        const seconds = Math.floor(time % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    };

    const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

    return (
        <div className="relative w-full max-w-lg group/player">
            {type === 'video' ? (
                <video ref={mediaRef as React.RefObject<HTMLVideoElement>} src={url} className="w-full rounded-lg bg-black" />
            ) : (
                <div className="w-full h-48 bg-black rounded-lg flex items-center justify-center">
                    {/* Placeholder para visualização de áudio se desejado */}
                    <p className="text-white font-mono">{file?.name}</p>
                </div>
            )}
             <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover/player:opacity-100 transition-opacity duration-300 rounded-b-lg">
                <div className="flex flex-col gap-2">
                    <Slider
                        value={[progress]}
                        onValueChange={handleProgressChange}
                        max={100}
                        step={0.1}
                        className="w-full h-2 cursor-pointer"
                    />
                    <div className="flex items-center justify-between text-white">
                        <div className="flex items-center gap-3">
                            <Button onClick={togglePlay} variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-white">
                                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                            </Button>
                            <div className="flex items-center gap-2 group/volume">
                                <Button onClick={toggleMute} variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-white">
                                  <VolumeIcon className="w-6 h-6"/>
                                </Button>
                                <Slider
                                    value={[isMuted ? 0 : volume]}
                                    onValueChange={handleVolumeChange}
                                    max={1}
                                    step={0.05}
                                    className="w-24 h-2 cursor-pointer transition-all duration-300"
                                />
                            </div>
                        </div>
                        <div className="font-mono text-sm">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AudioRecorder() {
  const [status, setStatus] = useState<Status>("idle");
  const [expansionStatus, setExpansionStatus] = useState<AiActionStatus>("idle");
  const [rewriteStatus, setRewriteStatus] = useState<AiActionStatus>("idle");
  const [chatStatus, setChatStatus] = useState<AiActionStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isNoiseSuppressionEnabled, setIsNoiseSuppressionEnabled] = useState(true);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcriptionHistory, setTranscriptionHistory] = useState<TranscriptionHistoryItem[]>([]);
  const [copiedHistory, setCopiedHistory] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isCancelledRef = useRef(false);
  const chatScrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem("transcriptionHistory");
      if (storedHistory) {
        setTranscriptionHistory(JSON.parse(storedHistory));
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
    if(chatMessages.length > 0) setChatMessages([]);

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
            setStatus(uploadedFile ? "file-loaded" : "ready");
        } else {
             setError("Não foi possível transcrever o áudio. A resposta da IA estava vazia.");
             setStatus("error");
        }
    } catch (e: unknown) {
        console.error("Transcription failed:", e);
        setError(getErrorMessage(e));
        setStatus("error");
    }
  }, [isNoiseSuppressionEnabled, chatMessages, uploadedFile]);

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
    } catch (e: unknown)
      {
      console.error(e);
      setError(getErrorMessage(e));
    } finally {
      setRewriteStatus("idle");
    }
  }, [transcript]);


  const startRecording = useCallback(async () => {
    try {
      isCancelledRef.current = false;
      clearUploadedFile();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream);
      setStatus("recording");
      setTranscript("");
      setError(null);
      setRecordingTime(0);
      setChatMessages([]);
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
  }, [handleTranscription]);
  
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
    const validTypes = ["audio/mpeg", "audio/mp4", "video/mp4", "audio/mp3", "audio/webm", "video/webm"];
    if (!validTypes.includes(file.type)) {
      setError(`Formato de arquivo não suportado: ${file.type}. Por favor, use MP3, MP4 ou WEBM.`);
      setStatus("error");
      return;
    }
    clearUploadedFile();
    setUploadedFile(file);
    setUploadedFileUrl(URL.createObjectURL(file));
    setStatus("file-loaded");
    setError(null);
    setTranscript("");
    setChatMessages([]);
  };

  const clearUploadedFile = () => {
    if (uploadedFileUrl) {
      URL.revokeObjectURL(uploadedFileUrl);
    }
    setUploadedFile(null);
    setUploadedFileUrl(null);
    if(['file-loaded', 'ready', 'error', 'processing'].includes(status)) {
        setStatus("idle");
    }
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
    setTranscript("");
    setChatMessages([]);
    setError(null);
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

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !transcript) return;

    const newMessages: ChatMessage[] = [...chatMessages, { sender: 'user', text: chatInput }];
    setChatMessages(newMessages);
    const question = chatInput;
    setChatInput("");
    setChatStatus("processing");
    setError(null);

    try {
      const result = await chatAboutContent(transcript, question);
      setChatMessages([...newMessages, { sender: 'bot', text: result.answer }]);
    } catch (e: unknown) {
      const errorMessage = getErrorMessage(e);
      setError(`Chat Error: ${errorMessage}`);
      setChatMessages([...newMessages, { sender: 'bot', text: `Desculpe, ocorreu um erro: ${errorMessage}` }]);
    } finally {
      setChatStatus("idle");
    }
  };
  
  useEffect(() => {
    if (chatScrollAreaRef.current) {
      chatScrollAreaRef.current.scrollTop = chatScrollAreaRef.current.scrollHeight;
    }
  }, [chatMessages]);
  
  const isAiProcessing = expansionStatus === "processing" || rewriteStatus === "processing" || chatStatus === "processing";
  const showPlayer = !!uploadedFileUrl;
  
  return (
    <div className="w-full bg-card rounded-xl border-primary/20 border shadow-sm p-6 space-y-6">
       {(status === 'error' || expansionStatus === 'error' || rewriteStatus === 'error' || chatStatus === 'error') && error && (
           <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna da Esquerda: Player ou Gravação */}
        <div className="flex flex-col items-center justify-center bg-secondary/50 rounded-lg p-4 min-h-[300px]">
          {showPlayer ? (
              <div className="flex flex-col items-center gap-3 w-full">
                  <div className="relative w-full">
                      <CustomMediaPlayer 
                          file={uploadedFile}
                          url={uploadedFileUrl} 
                          type={uploadedFile?.type.startsWith('video') ? 'video' : 'audio'}
                          onEnded={() => {
                              // Opcional: fazer algo quando a mídia terminar
                          }}
                      />
                      <Button variant="ghost" size="icon" className="absolute -top-3 -right-3 h-7 w-7 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80 z-10" onClick={clearUploadedFile}>
                          <X className="h-4 w-4" />
                      </Button>
                  </div>
                  <p className="text-sm text-muted-foreground truncate max-w-xs">{uploadedFile?.name}</p>
              </div>
          ) : (
              <div 
                  className={cn(
                    "flex flex-col justify-center items-center py-4 w-full h-full min-h-[180px] gap-4 border-2 border-dashed rounded-lg transition-colors duration-200",
                    {"border-primary bg-primary/10": dragOver},
                    {"border-border": !dragOver},
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
                  accept="audio/mpeg,audio/mp3,video/mp4,audio/mp4,audio/webm,video/webm"
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
          )}

          {status === 'processing' && (
             <div className="flex items-center justify-center gap-2 text-primary font-medium">
               <Loader2 className="h-5 w-5 animate-spin" />
               <span>Transcrevendo, isso pode levar um momento...</span>
             </div>
          )}

          {(status === 'file-loaded' && uploadedFile && !transcript) && (
              <div className="flex justify-center mt-4">
                  <Button onClick={handleTranscribeFile} size="lg" className="bg-accent hover:bg-accent/90">
                      <FilePenLine className="mr-2 h-5 w-5"/>
                      Transcrever Arquivo
                  </Button>
              </div>
          )}
        </div>

        {/* Coluna da Direita: Transcrição e Chat */}
        <div className="space-y-4">
          <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="transcription-area" className="text-sm font-medium">Sua Transcrição</Label>
                <div className="flex gap-2">
                <Button
                  onClick={handleRewrite}
                  variant="outline"
                  size="sm"
                  disabled={isAiProcessing || !transcript}
                >
                  {rewriteStatus === "processing" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FilePenLine className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline ml-2">{rewriteStatus === "processing" ? "Reescrevendo..." : "Reescrever"}</span>
                </Button>
                <Button
                  onClick={handleExpansion}
                  variant="outline"
                  size="sm"
                  disabled={isAiProcessing || !transcript}
                >
                  {expansionStatus === "processing" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline ml-2">{expansionStatus === "processing" ? "Expandindo..." : "Expandir"}</span>
                </Button>
                </div>
              </div>
              <div className="relative">
                <Textarea
                  id="transcription-area"
                  placeholder={
                    status === 'recording' ? 'Gravação em andamento...' : 
                    status === 'paused' ? 'Gravação pausada...' :
                    status === 'processing' ? 'Sua transcrição aparecerá aqui em breve...' :
                    status === 'file-loaded' && uploadedFile ? `Pronto para transcrever "${uploadedFile?.name}". Clique em "Transcrever Arquivo".` :
                    'Sua transcrição aparecerá aqui...'
                  }
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  disabled={isAiProcessing || (status !== 'ready' && status !== 'file-loaded')}
                  rows={8}
                  className="resize-none bg-secondary/50 rounded-lg text-base select-text"
                />
                {(isAiProcessing && chatStatus !== 'processing') && (
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

          {transcript && (status === 'ready' || status === 'file-loaded') && (
            <div className="space-y-4">
                <Card className="bg-secondary/30">
                    <CardHeader className="pb-2 pt-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Bot />
                            Converse com a IA
                        </CardTitle>
                        <CardDescription>
                            Faça perguntas sobre o conteúdo transcrito.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ScrollArea className="h-48 w-full pr-4" ref={chatScrollAreaRef}>
                            <div className="space-y-4">
                                {chatMessages.map((message, index) => (
                                  <div key={index} className={cn("flex items-start gap-3", message.sender === 'user' ? "justify-end" : "justify-start")}>
                                      {message.sender === 'bot' && <Avatar className="h-8 w-8"><Bot className="h-5 w-5"/></Avatar>}
                                      <div className={cn(
                                          "max-w-xs rounded-lg px-4 py-2 text-sm",
                                          message.sender === 'user' ? "bg-primary text-primary-foreground" : "bg-muted"
                                      )}>
                                          <p>{message.text}</p>
                                      </div>
                                      {message.sender === 'user' && <Avatar className="h-8 w-8"><User className="h-5 w-5"/></Avatar>}
                                  </div>
                                ))}
                                {chatStatus === 'processing' && (
                                  <div className="flex items-start gap-3 justify-start">
                                      <Avatar className="h-8 w-8"><Bot className="h-5 w-5"/></Avatar>
                                      <div className="bg-muted rounded-lg px-4 py-2 text-sm flex items-center gap-2">
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                          <span>Pensando...</span>
                                      </div>
                                  </div>
                                )}
                            </div>
                        </ScrollArea>
                        <form onSubmit={handleChatSubmit} className="flex items-center gap-2">
                            <Input 
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="O que foi falado no vídeo?"
                                disabled={chatStatus === 'processing'}
                            />
                            <Button type="submit" disabled={chatStatus === 'processing' || !chatInput.trim()}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
          )}
        </div>
      </div>
      
      {/* Rodapé com ações */}
      <div className="flex items-center justify-between gap-4 border-t pt-4 mt-6">
        <div className="flex items-center space-x-2">
          <Switch 
            id="noise-suppression-switch" 
            checked={isNoiseSuppressionEnabled}
            onCheckedChange={handleToggleNoiseSuppression}
          />
          <Label htmlFor="noise-suppression-switch" className="text-xs sm:text-sm">Supressão de Ruído</Label>
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
      </div>
    </div>
  );
}
