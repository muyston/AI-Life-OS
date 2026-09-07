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
  TrendingUp
} from "lucide-react";
import { DailyReflection, ProjectCategory, ReflectionType, ReflectionPaperAnalysisResult } from "@/lib/types";
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

export default function ReflectionPage() {
  const [reflections, setReflections] = useState<DailyReflection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Form State
  const [reflectionType, setReflectionType] = useState<ReflectionType>("EVENING");
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
  const [notes, setNotes] = useState<string>("");

  // Modales
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
    setFeedback("Notas manuscritas volcadas en la reflexion diaria.");
    setTimeout(() => setFeedback(null), 4000);
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
        notes,
      };

      const res = await fetch("/api/reflection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback("Reflexion diaria guardada y compromisos sincronizados.");
        setTimeout(() => setFeedback(null), 4000);
        await loadReflections();
      } else {
        setFeedback("Error al guardar la reflexion.");
      }
    } catch {
      setFeedback("Error de conexion al guardar la reflexion.");
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
            Reflexion Diaria & Calibracion Holistica
          </h1>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center bg-surface-950 border border-white/10 rounded-xl p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setReflectionType("MORNING")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                reflectionType === "MORNING"
                  ? "bg-surface-800 text-cyan-300 shadow-xs"
                  : "text-surface-400 hover:text-surface-200"
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Matutina</span>
            </button>
            <button
              type="button"
              onClick={() => setReflectionType("EVENING")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                reflectionType === "EVENING"
                  ? "bg-surface-800 text-purple-300 shadow-xs"
                  : "text-surface-400 hover:text-surface-200"
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Nocturna</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsPrintSheetOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-900 hover:bg-surface-800 text-surface-300 border border-white/10 text-xs font-medium transition-colors"
            title="Imprimir hoja física para escribir en papel"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hoja en Papel</span>
          </button>

          <button
            type="button"
            onClick={() => setIsScanModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-900 hover:bg-surface-800 text-cyan-300 border border-cyan-500/30 text-xs font-medium transition-colors"
            title="Escanear y digitalizar foto de cuaderno manuscrito"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Escanear Cuaderno</span>
          </button>

          <VoiceInputButton
            variant="pill"
            title="Dictar reflexion por voz"
            onActionCompleted={loadReflections}
          />

          <button
            type="button"
            onClick={handleSaveReflection}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-medium transition-all shadow-md shadow-cyan-600/20 active:scale-95 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? "Guardando..." : "Guardar Reflexion"}</span>
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

      {/* Main Grid: Formulario + Radar/Historial */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Cols: Structured Reflection Form */}
        <div className="lg:col-span-8 space-y-6">
          {/* Calibracion de Dominios de Vida */}
          <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-white/10 shadow-xl space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-surface-100 uppercase tracking-wider">
                1. Calibracion de Energia y Foco por Dominios
              </h3>
              <p className="text-[11px] text-surface-400 mt-0.5">
                Evalua del 1 al 10 tu nivel de alineacion y entrega en cada ambito
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
                <span className="text-xs text-surface-300 font-medium">Claridad Mental General:</span>
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
                <span className="text-xs text-surface-300 font-medium">Nivel de Energia Fisica:</span>
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
                  2. Victorias y Logros del Dia (Wins)
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
                    placeholder="Ej. Completada optimizacion de carga en la base de datos..."
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
                      placeholder="Friccion o distraccion..."
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
                      placeholder="Conclusion o principio..."
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
                  5. Compromisos No Negociables para Manana
                </h3>
                <p className="text-[11px] text-surface-400 mt-0.5">
                  Se crean automaticamente como tareas prioritarias en tu gestor de tareas
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
                    placeholder="Ej. Entregar propuesta tecnica a cliente Lanzing..."
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
              placeholder="Escribe libremente cualquier reflexion, conversacion relevante o calibracion del dia..."
              rows={4}
              className="w-full text-xs bg-surface-950/80 border border-white/10 rounded-2xl p-3.5 text-surface-100 placeholder:text-surface-500 focus:outline-hidden focus:border-cyan-500/50 leading-relaxed resize-none"
            />
          </div>
        </div>

        {/* Right 4 Cols: Historial y Metricas */}
        <div className="lg:col-span-4 space-y-5">
          <div className="glass-panel rounded-3xl p-5 border border-white/10 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <h3 className="text-xs font-semibold text-surface-100 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Historial de Reflexiones
              </h3>
              <span className="text-[10px] font-mono text-surface-400">
                {reflections.length} entradas
              </span>
            </div>

            {reflections.length === 0 ? (
              <div className="py-8 text-center text-xs text-surface-500">
                Aun no has registrado reflexiones. Completa la primera para calibrar tus metricas.
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {reflections.map((r) => (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-2xl bg-surface-950/80 border border-white/[0.06] space-y-2 hover:border-cyan-500/30 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-surface-200">{r.date}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-surface-900 border border-white/10 text-cyan-300">
                        {r.type === "MORNING" ? "Matutina" : "Nocturna"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-mono text-surface-400">
                      <span>Claridad: <strong className="text-cyan-400">{r.clarityScore}/10</strong></span>
                      <span>Energia: <strong className="text-emerald-400">{r.energyScore}/10</strong></span>
                    </div>

                    {r.wins && r.wins.length > 0 && (
                      <p className="text-[11px] text-surface-300 line-clamp-2 italic">
                        "{r.wins[0]}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modales */}
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
