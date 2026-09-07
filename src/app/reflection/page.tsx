"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  Sparkles, 
  Camera, 
  Printer, 
  Save, 
  CheckCircle2, 
  Sun, 
  Moon, 
  Code2, 
  Briefcase, 
  GraduationCap, 
  Dumbbell, 
  User, 
  Plus, 
  Trash2, 
  Clock, 
  ChevronRight,
  TrendingUp,
  Shield,
  Target,
  ArrowRight,
  RefreshCw,
  Sliders,
  CalendarCheck
} from "lucide-react";
import { DailyReflection, ProjectCategory, ReflectionType, ReflectionPaperAnalysisResult, PriorityLevel } from "@/lib/types";
import { ReflectionPaperScanModal } from "@/components/reflection/ReflectionPaperScanModal";
import { PrintableReflectionSheet } from "@/components/reflection/PrintableReflectionSheet";
import { VoiceInputButton } from "@/components/voice/VoiceInputButton";

const DOMAINS: { id: ProjectCategory; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { id: "tech", label: "Tech & Software", icon: Code2, color: "text-cyan-400" },
  { id: "business", label: "Business Lanzing", icon: Briefcase, color: "text-amber-400" },
  { id: "academic", label: "Academico UPM", icon: GraduationCap, color: "text-blue-400" },
  { id: "performance", label: "Performance Fisico", icon: Dumbbell, color: "text-emerald-400" },
  { id: "personal", label: "Personal & Mental", icon: User, color: "text-purple-400" },
];

interface AiCoachResult {
  executiveDiagnosis: string;
  blindSpot: string;
  domainAssessment: {
    strongestDomain: string;
    vulnerableDomain: string;
    rationale: string;
  };
  actionableTasks: {
    title: string;
    description: string;
    priority: PriorityLevel;
    category: ProjectCategory;
    estimatedDuration: number;
  }[];
  tacticalPrinciple: string;
}

export default function ReflectionPage() {
  const [reflections, setReflections] = useState<DailyReflection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Mode Selection: MORNING, EVENING, WEEKLY
  const [reflectionType, setReflectionType] = useState<ReflectionType>("EVENING");
  const [activeTab, setActiveTab] = useState<"form" | "coach" | "history">("form");

  // Form State
  const [clarityScore, setClarityScore] = useState<number>(8);
  const [energyScore, setEnergyScore] = useState<number>(8);
  const [domainRatings, setDomainRatings] = useState<Record<ProjectCategory, number>>({
    tech: 8,
    business: 8,
    academic: 8,
    performance: 8,
    personal: 8,
  });

  const [wins, setWins] = useState<string[]>([""]);
  const [frictionPoints, setFrictionPoints] = useState<string[]>([""]);
  const [keyLearnings, setKeyLearnings] = useState<string[]>([""]);
  const [nextDayCommitments, setNextDayCommitments] = useState<string[]>([""]);
  const [morningPriority, setMorningPriority] = useState<string>("");
  const [anticipatedObstacle, setAnticipatedObstacle] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // AI Coach State
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [aiCoachResult, setAiCoachResult] = useState<AiCoachResult | null>(null);
  const [appliedTaskIndices, setAppliedTaskIndices] = useState<Set<number>>(new Set());

  // Modals
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isPrintSheetOpen, setIsPrintSheetOpen] = useState(false);

  const todayStr = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
  const todayIso = format(new Date(), "yyyy-MM-dd");

  const loadReflections = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/reflection", { cache: "no-store" });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setReflections(data.data);
      }
    } catch (err) {
      console.error("Error al cargar reflexiones:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReflections();
  }, [loadReflections]);

  const handleRatingChange = (domain: ProjectCategory, value: number) => {
    setDomainRatings((prev) => ({ ...prev, [domain]: value }));
  };

  const handleItemChange = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    value: string
  ) => {
    const updated = [...list];
    updated[index] = value;
    setList(updated);
  };

  const addItem = (setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    setList((prev) => [...prev, ""]);
  };

  const removeItem = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    index: number
  ) => {
    if (list.length <= 1) {
      setList([""]);
      return;
    }
    setList(list.filter((_, i) => i !== index));
  };

  const handleApplyPaperAnalysis = (result: ReflectionPaperAnalysisResult) => {
    if (result.wins?.length > 0) setWins(result.wins);
    if (result.frictionPoints?.length > 0) setFrictionPoints(result.frictionPoints);
    if (result.keyLearnings?.length > 0) setKeyLearnings(result.keyLearnings);
    if (result.extractedTasks?.length > 0) setNextDayCommitments(result.extractedTasks);
    if (result.estimatedMoodScore) {
      setClarityScore(result.estimatedMoodScore);
      setEnergyScore(result.estimatedMoodScore);
    }
    if (result.summary) {
      setNotes((prev) => (prev ? `${prev}\n\n${result.summary}` : result.summary));
    }
    setFeedback("Notas manuscritas volcadas en la reflexión diaria.");
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleRunAiCoach = async () => {
    try {
      setIsAnalyzingAi(true);
      setFeedback(null);
      const res = await fetch("/api/reflection/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: reflectionType,
          date: todayIso,
          clarityScore,
          energyScore,
          domainRatings,
          wins: wins.filter((w) => w.trim().length > 0),
          frictionPoints: frictionPoints.filter((f) => f.trim().length > 0),
          keyLearnings: keyLearnings.filter((k) => k.trim().length > 0),
          nextDayCommitments: nextDayCommitments.filter((c) => c.trim().length > 0),
          notes: notes + (morningPriority ? `\nPrioridad Mañana: ${morningPriority}` : ""),
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setAiCoachResult(data.data);
        setActiveTab("coach");
        setFeedback("Auditoría de IA generada con éxito.");
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch {
      setFeedback("Error al conectar con el Coach de IA.");
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  const handleApplyAiTask = async (task: AiCoachResult["actionableTasks"][0], index: number) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: task.title,
          description: task.description,
          priority: task.priority,
          estimatedDuration: task.estimatedDuration,
          type: "NORMAL",
          origin: "AGENT_PLANNING",
        }),
      });

      if (res.ok) {
        setAppliedTaskIndices((prev) => new Set([...prev, index]));
        setFeedback(`Tarea "${task.title}" incorporada al gestor de tareas.`);
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch {
      setFeedback("Error al crear la tarea.");
    }
  };

  const handleSaveReflection = async () => {
    try {
      setIsSaving(true);
      setFeedback(null);

      const payload = {
        date: todayIso,
        type: reflectionType,
        domainRatings,
        clarityScore,
        energyScore,
        wins: wins.filter((w) => w.trim().length > 0),
        frictionPoints: frictionPoints.filter((f) => f.trim().length > 0),
        keyLearnings: keyLearnings.filter((k) => k.trim().length > 0),
        nextDayCommitments: nextDayCommitments.filter((c) => c.trim().length > 0),
        notes: notes + (morningPriority ? `\n[Prioridad #1]: ${morningPriority}` : "") + (anticipatedObstacle ? `\n[Obstáculo Previsto]: ${anticipatedObstacle}` : ""),
      };

      const res = await fetch("/api/reflection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback("Reflexión diaria guardada y compromisos sincronizados.");
        setTimeout(() => setFeedback(null), 4000);
        await loadReflections();
      } else {
        setFeedback("Error al guardar la reflexión.");
      }
    } catch {
      setFeedback("Error de conexión al guardar la reflexión.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] flex-wrap gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-surface-400 block capitalize">
            {todayStr}
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-surface-50 flex items-center gap-2.5 mt-0.5">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            Reflexión Diaria & Calibración Holística
          </h1>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Mode Selector (Day One / Stoic Style) */}
          <div className="flex items-center bg-surface-950 border border-white/10 rounded-xl p-0.5 text-xs shadow-xs">
            <button
              type="button"
              onClick={() => setReflectionType("MORNING")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                reflectionType === "MORNING"
                  ? "bg-surface-800 text-cyan-300 shadow-xs border border-white/10"
                  : "text-surface-400 hover:text-surface-200"
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Matutina</span>
            </button>
            <button
              type="button"
              onClick={() => setReflectionType("EVENING")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                reflectionType === "EVENING"
                  ? "bg-surface-800 text-purple-300 shadow-xs border border-white/10"
                  : "text-surface-400 hover:text-surface-200"
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-purple-400" />
              <span>Nocturna</span>
            </button>
            <button
              type="button"
              onClick={() => setReflectionType("FULL_DAY")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                reflectionType === "FULL_DAY"
                  ? "bg-surface-800 text-blue-300 shadow-xs border border-white/10"
                  : "text-surface-400 hover:text-surface-200"
              }`}
            >
              <CalendarCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Semanal</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleRunAiCoach}
            disabled={isAnalyzingAi}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-700/60 text-purple-200 text-xs font-medium transition-all shadow-md active:scale-95 disabled:opacity-50"
            title="Analizar y generar síntesis con IA"
          >
            <Sparkles className={`w-3.5 h-3.5 text-purple-400 ${isAnalyzingAi ? "animate-spin" : ""}`} />
            <span>{isAnalyzingAi ? "Analizando..." : "Auditar con IA"}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsScanModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-900 hover:bg-surface-800 text-cyan-300 border border-cyan-500/30 text-xs font-medium transition-colors"
            title="Escanear y digitalizar foto de cuaderno manuscrito"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Escanear Papel</span>
          </button>

          <VoiceInputButton
            variant="pill"
            title="Dictar reflexión por voz"
            onActionCompleted={loadReflections}
          />

          <button
            type="button"
            onClick={handleSaveReflection}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-medium transition-all shadow-md shadow-cyan-600/20 active:scale-95 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? "Guardando..." : "Guardar"}</span>
          </button>
        </div>
      </div>

      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ willChange: "transform" }}
          className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 text-xs text-cyan-300 flex items-center gap-2 shadow-lg"
        >
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{feedback}</span>
        </motion.div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("form")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === "form" ? "bg-surface-800 text-surface-50 border border-white/10" : "text-surface-400 hover:text-surface-200"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Formulario de Calibración</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("coach")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === "coach" ? "bg-surface-800 text-purple-300 border border-purple-500/30" : "text-surface-400 hover:text-surface-200"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Coach IA & Acciones {aiCoachResult && "(Activo)"}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === "history" ? "bg-surface-800 text-surface-50 border border-white/10" : "text-surface-400 hover:text-surface-200"
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
          <span>Historial & Métrica ({reflections.length})</span>
        </button>
      </div>

      {/* TAB 1: FORM VIEW */}
      {activeTab === "form" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-6">
            {/* Template Specific Header: Morning vs Evening */}
            {reflectionType === "MORNING" ? (
              <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-amber-500/30 shadow-xl space-y-4 bg-amber-950/10">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 uppercase tracking-wider">
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>Preparación Matutina Estoica (Prioridad No Negociable)</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-surface-200 font-medium block mb-1">
                      ¿Cuál es tu objetivo número uno de apalancamiento hoy?
                    </label>
                    <input
                      type="text"
                      value={morningPriority}
                      onChange={(e) => setMorningPriority(e.target.value)}
                      placeholder="Ej. Cerrar contrato con la clínica dental y desplegar landing..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-950/80 border border-white/10 text-xs text-surface-100 placeholder:text-surface-500 focus:outline-hidden focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-surface-200 font-medium block mb-1">
                      Obstáculo o distracción anticipada (Premeditatio Malorum) y tu respuesta:
                    </label>
                    <input
                      type="text"
                      value={anticipatedObstacle}
                      onChange={(e) => setAnticipatedObstacle(e.target.value)}
                      placeholder="Si me disperso con mensajes matutinos, activaré el modo enfoque de 90 min..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-950/80 border border-white/10 text-xs text-surface-100 placeholder:text-surface-500 focus:outline-hidden focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {/* Calibración de Dominios de Vida */}
            <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-white/10 shadow-xl space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-surface-100 uppercase tracking-wider">
                  1. Calibración de Energía y Foco por Dominios
                </h3>
                <p className="text-[11px] text-surface-400 mt-0.5">
                  Evalúa del 1 al 10 tu nivel de alineación y entrega en cada ámbito
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {DOMAINS.map((d) => {
                  const Icon = d.icon;
                  const val = domainRatings[d.id] || 8;
                  return (
                    <div
                      key={d.id}
                      className="p-3 rounded-2xl bg-surface-950/80 border border-white/[0.06] flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-xl bg-surface-900 border border-white/10 flex items-center justify-center shrink-0">
                          <Icon className={`w-3.5 h-3.5 ${d.color}`} />
                        </div>
                        <span className="text-xs font-medium text-surface-200 truncate">
                          {d.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={val}
                          onChange={(e) => handleRatingChange(d.id, parseInt(e.target.value, 10))}
                          className="w-16 accent-cyan-400 cursor-pointer"
                        />
                        <span className="text-xs font-mono font-bold text-cyan-400 w-5 text-right">
                          {val}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-white/[0.06] grid grid-cols-2 gap-4">
                <div className="p-3 rounded-2xl bg-surface-950/80 border border-white/[0.06] flex items-center justify-between">
                  <span className="text-xs text-surface-300 font-medium">Claridad Mental:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={clarityScore}
                      onChange={(e) => setClarityScore(parseInt(e.target.value, 10))}
                      className="w-20 accent-cyan-400 cursor-pointer"
                    />
                    <span className="text-xs font-mono font-bold text-cyan-400 w-5 text-right">
                      {clarityScore}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-surface-950/80 border border-white/[0.06] flex items-center justify-between">
                  <span className="text-xs text-surface-300 font-medium">Energía Física:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={energyScore}
                      onChange={(e) => setEnergyScore(parseInt(e.target.value, 10))}
                      className="w-20 accent-emerald-400 cursor-pointer"
                    />
                    <span className="text-xs font-mono font-bold text-emerald-400 w-5 text-right">
                      {energyScore}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Victorias y Avances Principales (Wins) */}
            <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-white/10 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                    2. Victorias y Logros del Día (Wins)
                  </h3>
                  <p className="text-[11px] text-surface-400 mt-0.5">
                    Reconocimiento consciente de hitos alcanzados y avances concretos
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => addItem(setWins)}
                  className="p-1.5 rounded-lg bg-surface-900 hover:bg-surface-800 text-emerald-400 border border-emerald-800/40 transition-colors"
                  title="Añadir otra victoria"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2">
                {wins.map((win, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-emerald-400 font-mono text-xs w-4 text-center">
                      {index + 1}.
                    </span>
                    <input
                      type="text"
                      value={win}
                      onChange={(e) => handleItemChange(wins, setWins, index, e.target.value)}
                      placeholder="Ej. Completada optimización de sincronización y subido a Git..."
                      className="flex-1 px-3.5 py-2 rounded-xl bg-surface-950/80 border border-white/10 text-xs text-surface-100 placeholder:text-surface-500 focus:outline-hidden focus:border-emerald-500/50"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(wins, setWins, index)}
                      className="p-2 text-surface-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Fricciones y Lecciones */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Fricciones */}
              <div className="glass-panel rounded-3xl p-5 border border-white/10 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                    3. Fricciones o Bloqueos
                  </h3>
                  <button
                    type="button"
                    onClick={() => addItem(setFrictionPoints)}
                    className="p-1.5 rounded-lg bg-surface-900 text-amber-400 border border-amber-800/40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-2">
                  {frictionPoints.map((f, index) => (
                    <div key={index} className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={f}
                        onChange={(e) => handleItemChange(frictionPoints, setFrictionPoints, index, e.target.value)}
                        placeholder="Fricción o distracción..."
                        className="flex-1 px-3 py-1.5 rounded-xl bg-surface-950/80 border border-white/10 text-xs text-surface-100 placeholder:text-surface-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(frictionPoints, setFrictionPoints, index)}
                        className="p-1.5 text-surface-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lecciones */}
              <div className="glass-panel rounded-3xl p-5 border border-white/10 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                    4. Lecciones Aprendidas
                  </h3>
                  <button
                    type="button"
                    onClick={() => addItem(setKeyLearnings)}
                    className="p-1.5 rounded-lg bg-surface-900 text-cyan-400 border border-cyan-800/40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-2">
                  {keyLearnings.map((k, index) => (
                    <div key={index} className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={k}
                        onChange={(e) => handleItemChange(keyLearnings, setKeyLearnings, index, e.target.value)}
                        placeholder="Conclusión o principio..."
                        className="flex-1 px-3 py-1.5 rounded-xl bg-surface-950/80 border border-white/10 text-xs text-surface-100 placeholder:text-surface-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(keyLearnings, setKeyLearnings, index)}
                        className="p-1.5 text-surface-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Compromisos para Mañana */}
            <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-white/10 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                    5. Compromisos No Negociables para Mañana
                  </h3>
                  <p className="text-[11px] text-surface-400 mt-0.5">
                    Se sincronizan automáticamente con tu gestor de tareas prioritarias
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => addItem(setNextDayCommitments)}
                  className="p-1.5 rounded-lg bg-surface-900 hover:bg-surface-800 text-blue-400 border border-blue-800/40"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2">
                {nextDayCommitments.map((c, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-blue-400 font-mono text-xs w-4 text-center">
                      {index + 1}.
                    </span>
                    <input
                      type="text"
                      value={c}
                      onChange={(e) => handleItemChange(nextDayCommitments, setNextDayCommitments, index, e.target.value)}
                      placeholder="Ej. Entregar propuesta técnica a cliente Lanzing..."
                      className="flex-1 px-3.5 py-2 rounded-xl bg-surface-950/80 border border-white/10 text-xs text-surface-100 placeholder:text-surface-500 focus:outline-hidden focus:border-blue-500/50"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(nextDayCommitments, setNextDayCommitments, index)}
                      className="p-2 text-surface-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Vaciado Mental y Notas Libres */}
            <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-white/10 shadow-xl space-y-2">
              <label className="text-xs font-semibold text-surface-200 uppercase tracking-wider block">
                6. Vaciado Mental y Observaciones Libres
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Escribe libremente cualquier reflexión, conversación relevante o calibración del día..."
                rows={4}
                className="w-full text-xs bg-surface-950/80 border border-white/10 rounded-2xl p-3.5 text-surface-100 placeholder:text-surface-500 focus:outline-hidden focus:border-cyan-500/50 leading-relaxed resize-none"
              />
            </div>
          </div>

          {/* Right Column: AI Quick Actions */}
          <div className="lg:col-span-4 space-y-5">
            <div className="glass-panel rounded-3xl p-5 border border-purple-500/30 shadow-xl space-y-4 bg-purple-950/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold text-surface-100 uppercase tracking-wider">
                  AI Reflection Assistant
                </h3>
              </div>
              <p className="text-xs text-surface-300 leading-relaxed">
                Pulsa el botón para que el modelo cognitivo analice tus entradas, identifique puntos ciegos y formule tus 3 acciones prioritarias.
              </p>
              <button
                type="button"
                onClick={handleRunAiCoach}
                disabled={isAnalyzingAi}
                className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all shadow-md shadow-purple-600/25 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isAnalyzingAi ? "animate-spin" : ""}`} />
                <span>{isAnalyzingAi ? "Analizando Reflexión..." : "Ejecutar Auditoría Cognitiva"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AI COACH VIEW */}
      {activeTab === "coach" && (
        <div className="space-y-6">
          {aiCoachResult ? (
            <div className="space-y-6">
              {/* Diagnosis Header Card */}
              <div className="glass-panel rounded-3xl p-6 border border-purple-500/40 shadow-2xl bg-gradient-to-br from-purple-950/30 via-surface-950 to-surface-950 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-mono uppercase tracking-wider text-purple-300 font-semibold">
                      Diagnóstico Institucional del Asistente IA
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-900/60 border border-purple-700/60 text-purple-200">
                    Gemini Intelligence
                  </span>
                </div>
                <p className="text-sm text-surface-100 leading-relaxed font-medium">
                  {aiCoachResult.executiveDiagnosis}
                </p>
                <div className="p-3 rounded-2xl bg-surface-950/80 border border-white/[0.06] text-xs space-y-1">
                  <span className="text-amber-400 font-semibold block">Punto Ciego Detectado:</span>
                  <span className="text-surface-300">{aiCoachResult.blindSpot}</span>
                </div>
                <div className="p-3 rounded-2xl bg-surface-950/80 border border-white/[0.06] text-xs flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <span className="text-surface-400 text-[11px]">Dominio Sólido:</span>{" "}
                    <strong className="text-emerald-400">{aiCoachResult.domainAssessment.strongestDomain}</strong>
                  </div>
                  <div>
                    <span className="text-surface-400 text-[11px]">Atención Prioritaria:</span>{" "}
                    <strong className="text-amber-400">{aiCoachResult.domainAssessment.vulnerableDomain}</strong>
                  </div>
                </div>
              </div>

              {/* 3 Actionable Tasks derived by AI */}
              <div className="glass-panel rounded-3xl p-6 border border-white/10 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-xs font-bold text-surface-100 uppercase tracking-wider">
                      Compromisos Tácticos para Mañana (Derivados por IA)
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-surface-400">
                    3 acciones recomendadas
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {aiCoachResult.actionableTasks.map((task, idx) => {
                    const isApplied = appliedTaskIndices.has(idx);
                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-surface-950/80 border border-white/[0.06] space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-surface-800 text-surface-300">
                              {task.category}
                            </span>
                            <span className="text-[10px] font-mono text-cyan-400 font-semibold">
                              {task.estimatedDuration} min
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-surface-100">{task.title}</h4>
                          <p className="text-[11px] text-surface-400 leading-relaxed">
                            {task.description}
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={isApplied}
                          onClick={() => handleApplyAiTask(task, idx)}
                          className={`w-full py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                            isApplied
                              ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800/80"
                              : "bg-surface-900 hover:bg-surface-800 text-surface-200 border border-white/10 active:scale-95"
                          }`}
                        >
                          {isApplied ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Incorporada a Tareas</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Añadir a Tareas</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Stoic Guiding Maxim */}
              <div className="p-4 rounded-2xl bg-surface-950/90 border border-cyan-500/20 text-center space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                  Principio Rector Institucional
                </span>
                <p className="text-xs text-surface-200 italic">
                  &quot;{aiCoachResult.tacticalPrinciple}&quot;
                </p>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center space-y-3 glass-panel rounded-3xl p-8 border border-white/10">
              <Sparkles className="w-8 h-8 text-purple-400 mx-auto" />
              <h3 className="text-sm font-bold text-surface-100">
                Aún no has generado una auditoría de IA hoy
              </h3>
              <p className="text-xs text-surface-400 max-w-md mx-auto">
                Completa tu calibración o pulsa el botón para que el asistente cognitivo analice tu estado y formule tu estrategia.
              </p>
              <button
                type="button"
                onClick={handleRunAiCoach}
                disabled={isAnalyzingAi}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all shadow-md active:scale-95"
              >
                {isAnalyzingAi ? "Analizando..." : "Iniciar Auditoría con IA"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: HISTORY VIEW */}
      {activeTab === "history" && (
        <div className="space-y-6">
          <div className="glass-panel rounded-3xl p-6 border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-surface-100 uppercase tracking-wider">
                  Historial de Calibraciones ({reflections.length} Registros)
                </h3>
              </div>
            </div>

            {reflections.length === 0 ? (
              <div className="py-12 text-center text-xs text-surface-500">
                Aún no hay reflexiones registradas. Completa la primera para comenzar el seguimiento.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reflections.map((r) => (
                  <div
                    key={r.id}
                    className="p-4 rounded-2xl bg-surface-950/80 border border-white/[0.06] space-y-3 hover:border-cyan-500/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-surface-100">{r.date}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-900 border border-white/10 text-cyan-300">
                        {r.type === "MORNING" ? "Matutina" : r.type === "EVENING" ? "Nocturna" : "Semanal"}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono">
                      <div>
                        <span className="text-surface-400">Claridad:</span>{" "}
                        <strong className="text-cyan-400">{r.clarityScore}/10</strong>
                      </div>
                      <div>
                        <span className="text-surface-400">Energía:</span>{" "}
                        <strong className="text-emerald-400">{r.energyScore}/10</strong>
                      </div>
                    </div>

                    {r.wins && r.wins.length > 0 && (
                      <div className="text-[11px] text-surface-300 italic line-clamp-2 border-l-2 border-l-emerald-500 pl-2">
                        &quot;{r.wins[0]}&quot;
                      </div>
                    )}

                    {r.notes && (
                      <p className="text-[11px] text-surface-400 line-clamp-2">
                        {r.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <ReflectionPaperScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onApplyAnalysis={handleApplyPaperAnalysis}
      />

      {isPrintSheetOpen && (
        <PrintableReflectionSheet onClose={() => setIsPrintSheetOpen(false)} />
      )}
    </div>
  );
}
