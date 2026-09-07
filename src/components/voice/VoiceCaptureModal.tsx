"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  CheckCircle2, 
  X, 
  RefreshCw, 
  CheckSquare, 
  Inbox, 
  Flame, 
  ArrowRight,
  AlertCircle
} from "lucide-react";
import { BrowserSpeechRecognizer } from "@/lib/voice/speech-recognition";
import { VoiceProcessResult, PriorityLevel, ProjectCategory } from "@/lib/types";

interface VoiceCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActionCompleted?: () => void;
}

export function VoiceCaptureModal({ isOpen, onClose, onActionCompleted }: VoiceCaptureModalProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [processResult, setProcessResult] = useState<VoiceProcessResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successFeedback, setSuccessFeedback] = useState<string | null>(null);

  const recognizerRef = useRef<BrowserSpeechRecognizer | null>(null);

  const handleStartListening = useCallback(() => {
    setErrorMessage(null);
    setSuccessFeedback(null);
    setProcessResult(null);
    setTranscript("");

    if (!recognizerRef.current) {
      recognizerRef.current = new BrowserSpeechRecognizer({
        lang: "es-ES",
        continuous: false,
        onResult: (text, isFinal) => {
          setTranscript(text);
          if (isFinal) {
            setIsRecording(false);
            processSpeech(text);
          }
        },
        onError: (err) => {
          setIsRecording(false);
          setErrorMessage(`Error de micrófono: ${err}. Comprueba los permisos en tu navegador.`);
        },
        onEnd: () => {
          setIsRecording(false);
        },
      });
    }

    if (!recognizerRef.current.isSupported()) {
      setErrorMessage("Tu navegador no soporta Web Speech API. Puedes escribir la nota manualmente.");
      return;
    }

    const started = recognizerRef.current.start();
    if (started) {
      setIsRecording(true);
    } else {
      setErrorMessage("No se pudo iniciar la escucha de voz.");
    }
  }, []);

  const handleStopListening = useCallback(() => {
    if (recognizerRef.current) {
      recognizerRef.current.stop();
      setIsRecording(false);
      if (transcript.trim()) {
        processSpeech(transcript);
      }
    }
  }, [transcript]);

  useEffect(() => {
    if (isOpen) {
      handleStartListening();
    } else {
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }
      setIsRecording(false);
      setTranscript("");
      setProcessResult(null);
      setErrorMessage(null);
      setSuccessFeedback(null);
    }
  }, [isOpen, handleStartListening]);

  const processSpeech = async (textToProcess: string) => {
    if (!textToProcess.trim()) return;

    try {
      setIsProcessing(true);
      setErrorMessage(null);

      const res = await fetch("/api/voice/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: textToProcess.trim() }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setProcessResult(data.data);
      } else {
        setErrorMessage(data.error || "No se pudo interpretar el audio.");
      }
    } catch {
      setErrorMessage("Error de conexión al procesar el audio.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteAction = async () => {
    if (!processResult) return;

    try {
      setIsExecuting(true);
      setErrorMessage(null);

      if (processResult.intent === "TASK" && processResult.taskData) {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: processResult.taskData.title,
            description: processResult.taskData.description || null,
            priority: processResult.taskData.priority,
            estimatedDuration: processResult.taskData.estimatedDuration || 30,
            type: "NORMAL",
            origin: "VOICE_CAPTURE",
          }),
        });

        if (res.ok) {
          setSuccessFeedback("Tarea creada con éxito en el sistema.");
          window.dispatchEvent(new CustomEvent("task-created"));
          setTimeout(() => {
            if (onActionCompleted) onActionCompleted();
            onClose();
          }, 1200);
        } else {
          throw new Error("No se pudo guardar la tarea.");
        }
      } else if (processResult.intent === "IDEA" && processResult.ideaData) {
        const res = await fetch("/api/ideas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rawContent: processResult.ideaData.rawContent,
            category: processResult.ideaData.category,
            assignedAgent: processResult.ideaData.assignedAgent,
          }),
        });

        if (res.ok) {
          setSuccessFeedback("Idea capturada y enviada al Smart Inbox.");
          setTimeout(() => {
            if (onActionCompleted) onActionCompleted();
            onClose();
          }, 1200);
        } else {
          throw new Error("No se pudo guardar la idea.");
        }
      } else if (processResult.intent === "HABIT_LOG" && processResult.habitData) {
        // Buscar hábito coincidente
        const habitsRes = await fetch("/api/habits");
        const habitsData = await habitsRes.json();
        const habitList = habitsData.data || [];

        const targetName = (processResult.habitData.habitName || "").toLowerCase();
        const match = habitList.find((h: any) => h.title.toLowerCase().includes(targetName) || targetName.includes(h.title.toLowerCase()));

        if (match) {
          await fetch(`/api/habits/${match.id}/log`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date: processResult.habitData.date }),
          });
          setSuccessFeedback(`Hábito "${match.title}" marcado como cumplido.`);
          setTimeout(() => {
            if (onActionCompleted) onActionCompleted();
            onClose();
          }, 1200);
        } else {
          // Si no encuentra el hábito exacto, creamos una tarea rápida
          await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: `Hábito: ${processResult.habitData.habitName}`,
              priority: "MEDIUM",
              status: "COMPLETED",
              origin: "VOICE_CAPTURE",
            }),
          });
          setSuccessFeedback("Registro completado y archivado.");
          setTimeout(() => {
            if (onActionCompleted) onActionCompleted();
            onClose();
          }, 1200);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Error al ejecutar la acción.");
    } finally {
      setIsExecuting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="glass-panel rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-white/10 relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] relative">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-accent-500/20 border border-accent-500/30 flex items-center justify-center text-accent-400">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-surface-100">
                Captura de Voz Inteligente
              </h2>
              <span className="text-[11px] text-surface-400 font-mono block">
                Dicta tareas, ideas o hábitos en lenguaje natural
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/5 text-surface-400 hover:text-surface-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Audio Wave Visualizer & Record Button */}
        <div className="flex flex-col items-center justify-center py-6 space-y-4">
          <button
            type="button"
            onClick={isRecording ? handleStopListening : handleStartListening}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 relative shadow-lg ${
              isRecording
                ? "bg-rose-600 text-white shadow-rose-500/30 scale-105"
                : "bg-surface-800 hover:bg-surface-700 text-accent-400 border border-white/10"
            }`}
          >
            {isRecording && (
              <>
                <span className="absolute inset-0 rounded-full bg-rose-500/40 animate-ping" />
                <span className="absolute -inset-2 rounded-full border border-rose-500/50 animate-pulse" />
              </>
            )}
            {isRecording ? <Mic className="w-8 h-8 relative z-10" /> : <MicOff className="w-7 h-7" />}
          </button>

          <div className="text-center">
            <span className="text-xs font-medium text-surface-200 block">
              {isRecording ? "Escuchando... Di lo que necesitas" : "Pulsa el micrófono para dictar"}
            </span>
            <span className="text-[11px] text-surface-400 font-mono mt-0.5 block">
              Ej: &quot;Nueva tarea: revisar métricas de marketing para mañana prioridad alta&quot;
            </span>
          </div>

          {/* Siri Waveform Bars Simulation */}
          {isRecording && (
            <div className="flex items-center gap-1.5 h-6">
              {[40, 75, 100, 60, 90, 45, 80, 50, 70, 30].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-accent-400 rounded-full transition-all duration-150 animate-pulse"
                  style={{
                    height: `${Math.max(6, Math.min(24, (h * Math.random()) + 6))}px`,
                    animationDelay: `${i * 100}ms`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Live Transcript Box */}
        <div className="glass-card rounded-xl p-3.5 space-y-1.5 min-h-[64px]">
          <div className="text-[10px] font-mono text-surface-400 uppercase tracking-wider">
            Transcripción en Tiempo Real:
          </div>
          <p className="text-xs text-surface-100 font-medium italic min-h-[20px]">
            {transcript || (isRecording ? "Habla ahora..." : "Sin audio capturado.")}
          </p>
        </div>

        {/* Error Feedback */}
        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/80 text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {/* Success Feedback */}
        {successFeedback && (
          <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/80 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successFeedback}</span>
          </div>
        )}

        {/* Parsed Result Preview */}
        {isProcessing ? (
          <div className="py-4 text-center text-xs text-surface-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-accent-400" />
            <span>Analizando intención con IA...</span>
          </div>
        ) : processResult && !successFeedback ? (
          <div className="glass-card rounded-xl p-4 space-y-3 border border-accent-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {processResult.intent === "TASK" && <CheckSquare className="w-4 h-4 text-accent-400" />}
                {processResult.intent === "IDEA" && <Inbox className="w-4 h-4 text-purple-400" />}
                {processResult.intent === "HABIT_LOG" && <Flame className="w-4 h-4 text-amber-400" />}
                <span className="text-xs font-semibold text-surface-100 uppercase tracking-wider">
                  {processResult.intent === "TASK" ? "Tarea Detectada" : processResult.intent === "IDEA" ? "Idea para Smart Inbox" : "Hábito a Registrar"}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-800 text-surface-300 border border-surface-700">
                Confianza: {Math.round(processResult.confidence * 100)}%
              </span>
            </div>

            <div className="text-xs text-surface-200">
              {processResult.summary}
            </div>

            {processResult.taskData && (
              <div className="text-[11px] font-mono text-surface-400 space-y-1 pt-1 border-t border-white/[0.06]">
                <div>Prioridad: <span className="text-accent-300 font-semibold">{processResult.taskData.priority}</span></div>
                <div>Categoría: <span className="text-surface-200">{processResult.taskData.category || "tech"}</span></div>
              </div>
            )}

            <button
              type="button"
              onClick={handleExecuteAction}
              disabled={isExecuting}
              className="w-full mt-2 py-2.5 px-4 bg-accent-600 hover:bg-accent-500 text-white rounded-xl text-xs font-medium transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isExecuting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Confirmar y Guardar</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </>
              )}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
