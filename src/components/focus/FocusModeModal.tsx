"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  X, 
  Sparkles, 
  Clock, 
  FileText, 
  Volume2,
  VolumeX,
  Radio,
  Sliders,
  Maximize2,
  ChevronDown
} from "lucide-react";
import { useLifeOS } from "@/lib/store/life-os-store";
import { TaskEntity } from "@/lib/types";

type SoundMode = "MUTE" | "ALPHA_40HZ" | "BROWN_NOISE";

export function FocusModeModal({
  initialTask,
  onClose,
  onTaskCompleted,
}: {
  initialTask?: TaskEntity | null;
  onClose?: () => void;
  onTaskCompleted?: (taskId: string) => void;
}) {
  const { 
    tasks, 
    activeFocusTask, 
    setActiveFocusTask, 
    isFocusModalOpen, 
    setFocusModalOpen,
    toggleTaskStatus 
  } = useLifeOS();

  const selectedTask = activeFocusTask || initialTask || (tasks.find(t => t.status === "PENDING") || null);

  // Estados de cronometro
  const [presetMinutes, setPresetMinutes] = useState<number>(25);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Estados acusticos de Web Audio API
  const [soundMode, setSoundMode] = useState<SoundMode>("MUTE");
  const [volume, setVolume] = useState<number>(0.2);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundNodesRef = useRef<{ gain: GainNode; stop: () => void } | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Manejo de sonido sintetizado
  const stopAudio = useCallback(() => {
    if (soundNodesRef.current) {
      soundNodesRef.current.stop();
      soundNodesRef.current = null;
    }
  }, []);

  const startAudio = useCallback((mode: SoundMode, vol: number) => {
    stopAudio();
    if (mode === "MUTE" || typeof window === "undefined") return;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(vol, ctx.currentTime);
      masterGain.connect(ctx.destination);

      if (mode === "ALPHA_40HZ") {
        // Tono isocronico / binaural suave de 40 Hz para induccion de estado de flujo
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(140, ctx.currentTime); // Portadora 140Hz

        const modGain = ctx.createGain();
        const lfo = ctx.createOscillator();
        lfo.type = "sine";
        lfo.frequency.setValueAtTime(40, ctx.currentTime); // Modulacion gamma/alfa 40Hz
        lfo.connect(modGain.gain);

        osc.connect(modGain);
        modGain.connect(masterGain);

        osc.start();
        lfo.start();

        soundNodesRef.current = {
          gain: masterGain,
          stop: () => {
            try {
              osc.stop();
              lfo.stop();
              osc.disconnect();
              lfo.disconnect();
            } catch {
              // Silencio seguro
            }
          },
        };
      } else if (mode === "BROWN_NOISE") {
        // Generador de Ruido Marron filtrado (Deep Brown Noise)
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(350, ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(masterGain);
        whiteNoise.start();

        soundNodesRef.current = {
          gain: masterGain,
          stop: () => {
            try {
              whiteNoise.stop();
              whiteNoise.disconnect();
              filter.disconnect();
            } catch {
              // Silencio seguro
            }
          },
        };
      }
    } catch (err) {
      console.error("Error al inicializar sintetizador de enfoque:", err);
    }
  }, [stopAudio]);

  useEffect(() => {
    if (isRunning && soundMode !== "MUTE") {
      startAudio(soundMode, volume);
    } else {
      stopAudio();
    }
    return () => stopAudio();
  }, [isRunning, soundMode, volume, startAudio, stopAudio]);

  // Actualizar volumen en tiempo real
  useEffect(() => {
    if (soundNodesRef.current && audioCtxRef.current) {
      soundNodesRef.current.gain.gain.setValueAtTime(volume, audioCtxRef.current.currentTime);
    }
  }, [volume]);

  // Cronometro
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            stopAudio();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, stopAudio]);

  const handleSelectPreset = (mins: number) => {
    setPresetMinutes(mins);
    setSecondsRemaining(mins * 60);
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsRemaining(presetMinutes * 60);
    stopAudio();
  };

  const handleFinishSession = async (markCompleted: boolean) => {
    if (!selectedTask) return;
    try {
      setIsSaving(true);
      const elapsedSeconds = presetMinutes * 60 - secondsRemaining;
      const minutesSpent = Math.max(1, Math.round(elapsedSeconds / 60));

      await fetch(`/api/tasks/${selectedTask.id}/time-track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minutesSpent,
          notes,
          markCompleted,
        }),
      });

      if (markCompleted) {
        await toggleTaskStatus(selectedTask.id);
        if (onTaskCompleted) onTaskCompleted(selectedTask.id);
      }

      stopAudio();
      setFocusModalOpen(false);
      if (onClose) onClose();
    } catch (err) {
      console.error("Error al registrar sesion de enfoque:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isFocusModalOpen) return null;

  const totalSeconds = presetMinutes * 60;
  const progressPercent = Math.min(100, Math.max(0, ((totalSeconds - secondsRemaining) / totalSeconds) * 100));
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ willChange: "transform" }}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-2xl"
      >
        {/* Halo de iluminacion ambiental dinamica */}
        <div className="absolute w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none -top-20 -left-20" />
        <div className="absolute w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none -bottom-20 -right-20" />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          style={{ willChange: "transform" }}
          className="relative w-full max-w-2xl bg-surface-950/90 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden flex flex-col gap-6 backdrop-blur-3xl"
        >
          {/* Header Superior */}
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center text-cyan-400">
                <Radio className="w-4 h-4 animate-pulse-subtle" />
              </div>
              <div>
                <span className="text-[10px] font-mono tracking-widest text-surface-400 uppercase block">
                  Obsidian Flow Studio v2.0
                </span>
                <h2 className="text-base font-semibold text-surface-50 tracking-tight">
                  Entorno de Enfoque Profundo
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                stopAudio();
                setFocusModalOpen(false);
                if (onClose) onClose();
              }}
              className="p-2 rounded-xl text-surface-400 hover:text-surface-100 hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Selector de Tarea Asignada */}
          <div className="glass-card rounded-2xl p-4 border border-white/[0.08] space-y-2">
            <div className="flex items-center justify-between text-xs text-surface-400">
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400">
                Foco Operativo Activo
              </span>
              <span className="text-[10px] font-mono text-surface-400">
                {selectedTask?.priority || "NORMAL"} &bull; {selectedTask?.project?.name || "Sin proyecto"}
              </span>
            </div>

            {selectedTask ? (
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-sm sm:text-base font-medium text-surface-50 truncate">
                  {selectedTask.title}
                </h3>
                {tasks.length > 1 && (
                  <div className="relative shrink-0">
                    <select
                      value={selectedTask.id}
                      onChange={(e) => {
                        const nextTask = tasks.find(t => t.id === e.target.value);
                        if (nextTask) setActiveFocusTask(nextTask);
                      }}
                      className="text-xs bg-surface-900 border border-white/10 rounded-xl px-2.5 py-1 text-surface-300 hover:text-white cursor-pointer"
                    >
                      {tasks.filter(t => t.status === "PENDING").map(t => (
                        <option key={t.id} value={t.id} className="bg-surface-900 text-white">
                          {t.title.slice(0, 30)}...
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-surface-400">
                No hay tarea seleccionada. Se registrara como bloque general de trabajo profundo.
              </p>
            )}
          </div>

          {/* Cronometro Central Circular */}
          <div className="flex flex-col items-center justify-center py-2 space-y-5">
            <div className="relative w-52 h-52 flex items-center justify-center">
              {/* Anillo de fondo */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="transparent"
                  className="text-surface-900"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeDasharray={276}
                  strokeDashoffset={276 - (276 * progressPercent) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                  className="text-cyan-400 transition-all duration-500 ease-out"
                />
              </svg>

              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-4xl sm:text-5xl font-mono font-bold tracking-tighter text-surface-50">
                  {formattedTime}
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-surface-400 mt-1">
                  {isRunning ? "Sesion Activa" : "Pausado"}
                </span>
              </div>
            </div>

            {/* Selector de Cadencia */}
            <div className="flex items-center gap-2 p-1.5 glass-card rounded-2xl border border-white/[0.06]">
              {[
                { label: "25m Sprint", mins: 25 },
                { label: "50m Ultradian", mins: 50 },
                { label: "90m Deep Work", mins: 90 },
              ].map((preset) => (
                <button
                  key={preset.mins}
                  type="button"
                  onClick={() => handleSelectPreset(preset.mins)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all ${
                    presetMinutes === preset.mins
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold"
                      : "text-surface-400 hover:text-surface-100"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Controles de Reproduccion */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleReset}
                className="p-3 rounded-2xl bg-surface-900/80 hover:bg-surface-800 text-surface-400 hover:text-surface-200 transition-colors border border-white/[0.06]"
                title="Reiniciar cronometro"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsRunning(!isRunning)}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs sm:text-sm tracking-wide shadow-lg shadow-cyan-600/20 active:scale-95 transition-all flex items-center gap-2"
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>Pausar Sesion</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Iniciar Foco</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Modulo Acustico de Sonido Binaural */}
          <div className="glass-card rounded-2xl p-4 border border-white/[0.08] flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-surface-900 border border-white/10 flex items-center justify-center text-cyan-400">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-surface-400 block">
                  Aislamiento Acustico Web Audio
                </span>
                <span className="text-xs font-medium text-surface-200">
                  {soundMode === "MUTE" && "Sonido Desactivado"}
                  {soundMode === "ALPHA_40HZ" && "Ondas Alfa (40Hz Biorhythm Focus)"}
                  {soundMode === "BROWN_NOISE" && "Ruido Marron Profundo (Deep Shield)"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSoundMode(soundMode === "ALPHA_40HZ" ? "MUTE" : "ALPHA_40HZ")}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-mono transition-all ${
                  soundMode === "ALPHA_40HZ"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "bg-surface-900 text-surface-400 hover:text-surface-200 border border-white/[0.06]"
                }`}
              >
                40Hz Alfa
              </button>

              <button
                type="button"
                onClick={() => setSoundMode(soundMode === "BROWN_NOISE" ? "MUTE" : "BROWN_NOISE")}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-mono transition-all ${
                  soundMode === "BROWN_NOISE"
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                    : "bg-surface-900 text-surface-400 hover:text-surface-200 border border-white/[0.06]"
                }`}
              >
                Ruido Marron
              </button>

              {soundMode !== "MUTE" && (
                <input
                  type="range"
                  min="0.05"
                  max="0.5"
                  step="0.02"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-16 accent-cyan-400 cursor-pointer ml-2"
                  title="Volumen acustico"
                />
              )}
            </div>
          </div>

          {/* Notas Activas de Sesion */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-wider text-surface-400 block">
              Notas Rapidas de la Sesion (Se adjuntan al historial de la tarea)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anota descubrimientos, comandos, bloqueos o conclusiones..."
              rows={2}
              className="w-full text-xs bg-surface-900/90 border border-white/10 rounded-xl p-3 text-surface-100 placeholder:text-surface-500 focus:outline-hidden focus:border-cyan-500/50 resize-none"
            />
          </div>

          {/* Footer de Finalizacion */}
          <div className="flex items-center justify-between pt-3 border-t border-white/[0.08] flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleFinishSession(false)}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl bg-surface-900 hover:bg-surface-800 text-surface-300 text-xs font-medium border border-white/[0.06] transition-colors active:scale-95"
            >
              Guardar Tiempo Sin Completar
            </button>

            <button
              type="button"
              onClick={() => handleFinishSession(true)}
              disabled={isSaving || !selectedTask}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium tracking-wide shadow-md shadow-emerald-600/20 transition-all active:scale-95 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isSaving ? "Guardando..." : "Completar Tarea y Finalizar"}</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
