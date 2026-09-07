"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { 
  Camera, 
  Upload, 
  X, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Dumbbell, 
  BookOpen, 
  Flame, 
  RefreshCw, 
  ArrowRight,
  Check,
  Info,
  Clock,
  MapPin,
  FileImage,
  Sliders
} from "lucide-react";
import { 
  VisionRoutineProposal, 
  VisionRoutineClass, 
  VisionRoutineGymSession, 
  VisionRoutineStudySession, 
  VisionRoutineHabit 
} from "@/lib/types";

interface VisionScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoutineApplied?: () => void;
}

type TabType = "classes" | "gym" | "study" | "habits" | "advice";

const PROMPT_CHIPS = [
  "Integra 4 días de gimnasio por la tarde a partir de las 18:00 con rutina torso/pierna.",
  "Integra 3 días de gimnasio por la mañana antes de las clases.",
  "Añade 2 horas de estudio diario para las asignaturas más complejas.",
  "Mantén los viernes por la tarde completamente libres de tareas y entrenamientos.",
  "Deja 1 hora de descanso y comida tras las clases antes de cualquier otra actividad.",
];

export function VisionScheduleModal({ isOpen, onClose, onRoutineApplied }: VisionScheduleModalProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [instructions, setInstructions] = useState("");
  const [targetStartDate, setTargetStartDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>("");
  const [proposal, setProposal] = useState<VisionRoutineProposal | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("classes");

  // Selection states inside proposal
  const [classes, setClasses] = useState<VisionRoutineClass[]>([]);
  const [gymSessions, setGymSessions] = useState<VisionRoutineGymSession[]>([]);
  const [studySessions, setStudySessions] = useState<VisionRoutineStudySession[]>([]);
  const [habits, setHabits] = useState<VisionRoutineHabit[]>([]);

  const [createCalendarEvents, setCreateCalendarEvents] = useState(true);
  const [createTasks, setCreateTasks] = useState(true);
  const [createHabits, setCreateHabits] = useState(true);

  const [isApplying, setIsApplying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successFeedback, setSuccessFeedback] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Escuchar evento de pegar imagen con Ctrl+V
  const handlePaste = useCallback((e: ClipboardEvent) => {
    if (!isOpen || proposal) return;
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          processImageFile(file);
          break;
        }
      }
    }
  }, [isOpen, proposal]);

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  // Limpiar estado al cerrar o abrir
  useEffect(() => {
    if (!isOpen) {
      setImageFile(null);
      setImageBase64(null);
      setProposal(null);
      setErrorMessage(null);
      setSuccessFeedback(null);
      setIsAnalyzing(false);
      setIsApplying(false);
    }
  }, [isOpen]);

  const processImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Por favor selecciona un archivo de imagen válido (PNG, JPG o WebP).");
      return;
    }

    setImageFile(file);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setImageBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleAnalyze = async () => {
    if (!imageBase64) {
      setErrorMessage("Adjunta una foto o captura de tu horario antes de continuar.");
      return;
    }

    try {
      setIsAnalyzing(true);
      setErrorMessage(null);
      setSuccessFeedback(null);
      setAnalysisStep("Conectando con Gemini 2.5 Flash Vision...");

      const timer1 = setTimeout(() => {
        setAnalysisStep("Decodificando asignaturas y celdas horarias del calendario...");
      }, 1500);

      const timer2 = setTimeout(() => {
        setAnalysisStep("Cruzando disponibilidad y planificando sesiones de gimnasio...");
      }, 3000);

      const res = await fetch("/api/vision/routine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64,
          instructions: instructions.trim(),
          targetStartDate,
        }),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      const data = await res.json();

      if (data.success && data.data) {
        const p: VisionRoutineProposal = data.data;
        setProposal(p);
        setClasses(p.detectedClasses);
        setGymSessions(p.gymSessions);
        setStudySessions(p.studySessions);
        setHabits(p.suggestedHabits);
        setActiveTab("classes");
      } else {
        setErrorMessage(data.error || "No se pudo interpretar el horario. Inténtalo de nuevo.");
      }
    } catch {
      setErrorMessage("Error de conexión al procesar la imagen con IA.");
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep("");
    }
  };

  const handleApplyRoutine = async () => {
    if (!proposal) return;

    try {
      setIsApplying(true);
      setErrorMessage(null);

      const selectedClasses = classes.filter((c) => c.selected);
      const selectedGym = gymSessions.filter((g) => g.selected);
      const selectedStudy = studySessions.filter((s) => s.selected);
      const selectedHabits = habits.filter((h) => h.selected);

      const res = await fetch("/api/vision/routine/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetStartDate,
          classes: selectedClasses,
          gymSessions: selectedGym,
          studySessions: selectedStudy,
          habits: selectedHabits,
          createCalendarEvents,
          createTasks,
          createHabits,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccessFeedback(data.message || "Rutina aplicada correctamente al sistema.");
        setTimeout(() => {
          if (onRoutineApplied) onRoutineApplied();
          onClose();
        }, 1800);
      } else {
        setErrorMessage(data.error || "No se pudo aplicar la rutina.");
      }
    } catch {
      setErrorMessage("Error de conexión al aplicar la rutina.");
    } finally {
      setIsApplying(false);
    }
  };

  const toggleClassSelected = (id: string) => {
    setClasses((prev) => prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c)));
  };

  const toggleGymSelected = (id: string) => {
    setGymSessions((prev) => prev.map((g) => (g.id === id ? { ...g, selected: !g.selected } : g)));
  };

  const toggleStudySelected = (id: string) => {
    setStudySessions((prev) => prev.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s)));
  };

  const toggleHabitSelected = (id: string) => {
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, selected: !h.selected } : h)));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="glass-panel rounded-2xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl border border-white/10 relative max-h-[92vh] flex flex-col overflow-hidden">
        {/* Glow ambient */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent-500/20 border border-accent-500/30 flex items-center justify-center text-accent-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-surface-100 tracking-tight">
                Planificador Multimodal de Rutinas con Foto
              </h2>
              <span className="text-[11px] text-surface-400 font-mono block">
                Google Gemini Vision: horario de clases, gimnasio y estudio
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/80 text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successFeedback && (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successFeedback}</span>
            </div>
          )}

          {!proposal ? (
            /* STEP 1: Upload Image & Enter Instructions */
            <div className="space-y-4">
              {/* Image Drag & Drop / Preview Box */}
              {!imageBase64 ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/15 hover:border-accent-500/50 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all bg-surface-950/50 hover:bg-surface-900/50 group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/jpg"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-surface-900 group-hover:bg-accent-500/20 border border-white/10 flex items-center justify-center mx-auto mb-3 text-surface-400 group-hover:text-accent-400 transition-all">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h3 className="text-xs font-semibold text-surface-100">
                    Arrastra o sube la foto de tu horario o calendario
                  </h3>
                  <p className="text-[11px] text-surface-400 mt-1 max-w-sm mx-auto">
                    Admite capturas de pantalla, fotos tomadas con el móvil o pega directamente con <kbd className="px-1.5 py-0.5 bg-surface-800 text-[10px] rounded border border-white/10 font-mono">Ctrl + V</kbd>.
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-900 text-[11px] font-medium text-accent-400 border border-white/10">
                    <FileImage className="w-3.5 h-3.5" />
                    <span>Seleccionar archivo local</span>
                  </div>
                </div>
              ) : (
                <div className="glass-card rounded-2xl p-3 border border-accent-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={imageBase64}
                      alt="Horario seleccionado"
                      className="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-surface-100 truncate">
                        {imageFile?.name || "Foto del horario adjuntada"}
                      </div>
                      <div className="text-[10px] text-surface-400 font-mono mt-0.5">
                        {imageFile ? `${Math.round(imageFile.size / 1024)} KB` : "Imagen en memoria"} • Formato listo para Gemini Vision
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImageBase64(null);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-surface-900 hover:bg-surface-800 text-surface-300 border border-white/10 text-xs transition-colors shrink-0"
                  >
                    Cambiar foto
                  </button>
                </div>
              )}

              {/* Instructions Textarea */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-surface-200 uppercase tracking-wider">
                  Instrucciones Adicionales para la IA
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Ej: Integra el gimnasio 4 días por la tarde a las 18:00 (rutina torso/pierna), 2 horas de estudio diario para asignaturas críticas y deja el viernes tarde libre para descansar..."
                  rows={3}
                  className="w-full p-3 bg-surface-950/80 border border-white/10 rounded-xl text-xs text-surface-100 placeholder-surface-500 focus:outline-none focus:border-accent-500 font-medium transition-all"
                />

                {/* Prompt Shortcut Chips */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-surface-400 uppercase tracking-wider block">
                    Atajos de Instrucción Rápida:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PROMPT_CHIPS.map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setInstructions((prev) => (prev ? `${prev} ${chip}` : chip));
                        }}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-surface-900 hover:bg-surface-800 text-surface-300 border border-white/10 transition-colors text-left"
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Date of Reference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-medium text-surface-300 mb-1">
                    Fecha de inicio de la semana de referencia:
                  </label>
                  <input
                    type="date"
                    value={targetStartDate}
                    onChange={(e) => setTargetStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-950 border border-white/10 rounded-xl text-xs text-surface-100 font-mono focus:outline-none focus:border-accent-500"
                  />
                </div>

                <div className="flex items-end">
                  <div className="text-[11px] text-surface-400 p-2 rounded-xl bg-surface-950/50 border border-white/5 leading-relaxed">
                    Las clases y bloques de gimnasio se distribuirán calculando las fechas exactas a partir del lunes de esa semana.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* STEP 2: Proposal Review & Human Validation */
            <div className="space-y-4">
              {/* Executive Summary */}
              <div className="glass-card rounded-xl p-3.5 space-y-1 border border-accent-500/20">
                <div className="flex items-center justify-between text-xs text-surface-400 mb-1">
                  <span className="font-mono text-[11px]">
                    Semana objetivo: {targetStartDate}
                  </span>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-accent-400">{classes.filter(c => c.selected).length} clases</span>
                    <span>•</span>
                    <span className="text-amber-400">{gymSessions.filter(g => g.selected).length} entrenos</span>
                    <span>•</span>
                    <span className="text-brand-400">{studySessions.filter(s => s.selected).length} estudios</span>
                  </div>
                </div>
                <p className="text-xs text-surface-200 leading-relaxed">{proposal.summary}</p>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-1.5 border-b border-white/[0.08] pb-2 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab("classes")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    activeTab === "classes"
                      ? "bg-accent-600 text-white shadow-xs"
                      : "text-surface-400 hover:text-surface-200 hover:bg-white/5"
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Clases ({classes.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("gym")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    activeTab === "gym"
                      ? "bg-amber-600 text-white shadow-xs"
                      : "text-surface-400 hover:text-surface-200 hover:bg-white/5"
                  }`}
                >
                  <Dumbbell className="w-3.5 h-3.5" />
                  <span>Gimnasio ({gymSessions.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("study")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    activeTab === "study"
                      ? "bg-brand-600 text-white shadow-xs"
                      : "text-surface-400 hover:text-surface-200 hover:bg-white/5"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Estudio ({studySessions.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("habits")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    activeTab === "habits"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-surface-400 hover:text-surface-200 hover:bg-white/5"
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Hábitos ({habits.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("advice")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    activeTab === "advice"
                      ? "bg-surface-800 text-surface-100 shadow-xs"
                      : "text-surface-400 hover:text-surface-200 hover:bg-white/5"
                  }`}
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>Consejos Tácticos</span>
                </button>
              </div>

              {/* Tab Content: Classes */}
              {activeTab === "classes" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-surface-400 px-1">
                    <span>Marca las clases que deseas incorporar a tu calendario:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const allSelected = classes.every((c) => c.selected);
                        setClasses((prev) => prev.map((c) => ({ ...c, selected: !allSelected })));
                      }}
                      className="text-accent-400 hover:underline font-mono"
                    >
                      {classes.every((c) => c.selected) ? "Deseleccionar todas" : "Seleccionar todas"}
                    </button>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {classes.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => toggleClassSelected(item.id)}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                          item.selected
                            ? "bg-surface-900/90 border-accent-500/40"
                            : "bg-surface-950/40 border-white/5 opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={!!item.selected}
                            onChange={() => toggleClassSelected(item.id)}
                            className="rounded border-surface-700 bg-surface-900 text-accent-500 focus:ring-0 w-4 h-4 cursor-pointer shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-surface-100 truncate">
                              {item.subject}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-surface-400 font-mono mt-0.5">
                              <span className="text-accent-400 font-semibold">{item.dayName}</span>
                              {item.classroom && (
                                <span className="flex items-center gap-0.5">
                                  <MapPin className="w-2.5 h-2.5" />
                                  {item.classroom}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-mono font-semibold text-surface-200">
                            {item.startTime} - {item.endTime}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab Content: Gym */}
              {activeTab === "gym" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-surface-400 px-1">
                    <span>Sesiones de gimnasio integradas sin solapamiento con clases:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const allSelected = gymSessions.every((g) => g.selected);
                        setGymSessions((prev) => prev.map((g) => ({ ...g, selected: !allSelected })));
                      }}
                      className="text-amber-400 hover:underline font-mono"
                    >
                      {gymSessions.every((g) => g.selected) ? "Deseleccionar todas" : "Seleccionar todas"}
                    </button>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {gymSessions.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => toggleGymSelected(item.id)}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                          item.selected
                            ? "bg-surface-900/90 border-amber-500/40"
                            : "bg-surface-950/40 border-white/5 opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={!!item.selected}
                            onChange={() => toggleGymSelected(item.id)}
                            className="rounded border-surface-700 bg-surface-900 text-amber-500 focus:ring-0 w-4 h-4 cursor-pointer shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-surface-100 truncate">
                              {item.focus}
                            </div>
                            <div className="text-[10px] text-surface-400 font-mono mt-0.5">
                              <span className="text-amber-400 font-semibold">{item.dayName}</span> • {item.rationale}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-mono font-semibold text-amber-300">
                            {item.startTime} - {item.endTime}
                          </div>
                          <div className="text-[10px] text-surface-400 font-mono">
                            {item.durationMinutes} min
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab Content: Study */}
              {activeTab === "study" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-surface-400 px-1">
                    <span>Bloques de estudio y repaso para las materias universitarias:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const allSelected = studySessions.every((s) => s.selected);
                        setStudySessions((prev) => prev.map((s) => ({ ...s, selected: !allSelected })));
                      }}
                      className="text-brand-400 hover:underline font-mono"
                    >
                      {studySessions.every((s) => s.selected) ? "Deseleccionar todas" : "Seleccionar todas"}
                    </button>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {studySessions.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => toggleStudySelected(item.id)}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                          item.selected
                            ? "bg-surface-900/90 border-brand-500/40"
                            : "bg-surface-950/40 border-white/5 opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={!!item.selected}
                            onChange={() => toggleStudySelected(item.id)}
                            className="rounded border-surface-700 bg-surface-900 text-brand-500 focus:ring-0 w-4 h-4 cursor-pointer shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-surface-100 truncate">
                              {item.subject}
                            </div>
                            <div className="text-[10px] text-surface-400 font-mono mt-0.5">
                              <span className="text-brand-400 font-semibold">{item.dayName}</span> • {item.rationale}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-mono font-semibold text-brand-300">
                            {item.startTime} - {item.endTime}
                          </div>
                          <div className="text-[10px] text-surface-400 font-mono">
                            {item.durationMinutes} min
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab Content: Habits */}
              {activeTab === "habits" && (
                <div className="space-y-2">
                  <div className="text-[11px] text-surface-400 px-1">
                    Hábitos recomendados para seguimiento de streaks en tu Life OS:
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {habits.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => toggleHabitSelected(item.id)}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                          item.selected
                            ? "bg-surface-900/90 border-purple-500/40"
                            : "bg-surface-950/40 border-white/5 opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={!!item.selected}
                            onChange={() => toggleHabitSelected(item.id)}
                            className="rounded border-surface-700 bg-surface-900 text-purple-500 focus:ring-0 w-4 h-4 cursor-pointer shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-surface-100">
                              {item.title}
                            </div>
                            <div className="text-[11px] text-surface-400 mt-0.5">
                              {item.description}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0 font-mono text-[11px] text-purple-300">
                          {item.targetDays} días / sem
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab Content: Advice */}
              {activeTab === "advice" && (
                <div className="glass-card rounded-xl p-4 space-y-2">
                  <div className="text-xs font-semibold text-surface-100 uppercase tracking-wider flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-accent-400" />
                    <span>Recomendaciones Tácticas de Rendimiento</span>
                  </div>
                  <ul className="space-y-2 text-xs text-surface-300">
                    {proposal.tacticalAdvice.map((adv, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-accent-400 font-mono font-bold">•</span>
                        <span>{adv}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* System Targets Checkboxes */}
              <div className="p-3.5 rounded-xl bg-surface-950/80 border border-white/[0.08] space-y-2">
                <div className="text-[11px] font-semibold text-surface-300 uppercase tracking-wider">
                  Destinos de Integración en el Sistema:
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-surface-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createCalendarEvents}
                      onChange={(e) => setCreateCalendarEvents(e.target.checked)}
                      className="rounded border-surface-700 bg-surface-900 text-accent-500 focus:ring-0 w-4 h-4"
                    />
                    <span>Eventos de Calendario</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createTasks}
                      onChange={(e) => setCreateTasks(e.target.checked)}
                      className="rounded border-surface-700 bg-surface-900 text-accent-500 focus:ring-0 w-4 h-4"
                    />
                    <span>Tareas de Gimnasio y Estudio</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createHabits}
                      onChange={(e) => setCreateHabits(e.target.checked)}
                      className="rounded border-surface-700 bg-surface-900 text-accent-500 focus:ring-0 w-4 h-4"
                    />
                    <span>Hábitos en Tracker</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between gap-3 shrink-0 flex-wrap">
          {!proposal ? (
            <>
              <span className="text-[11px] text-surface-400 font-mono">
                {imageBase64 ? "Foto cargada. Lista para analizar con Gemini." : "Esperando imagen..."}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-xl text-xs text-surface-400 hover:text-surface-200 hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={!imageBase64 || isAnalyzing}
                  className="flex items-center gap-2 px-4 py-2 bg-accent-600 hover:bg-accent-500 text-white rounded-xl text-xs font-medium transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{analysisStep || "Analizando con Gemini..."}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Analizar y Generar Rutina</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setProposal(null)}
                className="px-3 py-2 rounded-xl text-xs text-surface-400 hover:text-surface-200 hover:bg-white/5 transition-colors font-mono"
              >
                &larr; Volver a configurar
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-xl text-xs text-surface-400 hover:text-surface-200 hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleApplyRoutine}
                  disabled={isApplying}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {isApplying ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Aplicando en BD...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirmar y Aplicar Rutina</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
