"use client";

import { useState } from "react";
import { 
  IdeaEntity, 
  IdeaAssignedAgent, 
  IdeaCategory 
} from "@/lib/types";
import { 
  Bot, 
  Sparkles, 
  FolderKanban, 
  CheckSquare, 
  RefreshCw, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Code2, 
  Briefcase, 
  TrendingUp, 
  Calendar, 
  FileText, 
  Layers, 
  Copy, 
  Check, 
  ChevronRight,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ConvertModal } from "./ConvertModal";
import { MultiSolutionMatrix } from "./MultiSolutionMatrix";
import { deterministicSolverAnalysis } from "@/lib/agents/solverAgent";

interface IdeaDetailProps {
  idea: IdeaEntity | null;
  onReanalyze: (ideaId: string, assignedAgent?: IdeaAssignedAgent) => Promise<void>;
  onDelete: (ideaId: string) => Promise<void>;
  onConverted: () => void;
  isProcessing: boolean;
}

export function IdeaDetail({
  idea,
  onReanalyze,
  onDelete,
  onConverted,
  isProcessing,
}: IdeaDetailProps) {
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [selectedAgentForReanalyze, setSelectedAgentForReanalyze] = useState<IdeaAssignedAgent>("dev");
  const [isQuickConvertingTasks, setIsQuickConvertingTasks] = useState(false);
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!idea) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-surface-900 border border-surface-800 rounded-lg text-center">
        <Bot className="w-10 h-10 text-surface-700 mb-3" />
        <h3 className="text-sm font-semibold text-surface-200">
          Ninguna nota seleccionada
        </h3>
        <p className="text-xs text-surface-400 max-w-sm mt-1">
          Selecciona una idea del Smart Inbox para inspeccionar el diagnóstico, la investigación y los pasos accionables formulados por los agentes.
        </p>
      </div>
    );
  }

  const analysis = idea.structuredAnalysis;

  const agentConfig: Record<string, { label: string; icon: LucideIcon; color: string; desc: string }> = {
    strategy: { label: "Strategy & KPIs Agent", icon: TrendingUp, color: "text-indigo-400 bg-indigo-950/50 border-indigo-800/60", desc: "Auditor Estrategico" },
    dev: { label: "Architecture & Dev Agent", icon: Code2, color: "text-cyan-400 bg-cyan-950/50 border-cyan-800/60", desc: "Lead Software Architect" },
    sales: { label: "Sales & Pipeline Agent", icon: Briefcase, color: "text-emerald-400 bg-emerald-950/50 border-emerald-800/60", desc: "Gestor Comercial B2B" },
    operations: { label: "Operations & Calendar Agent", icon: Calendar, color: "text-amber-400 bg-amber-950/50 border-amber-800/60", desc: "Programador de Agenda" },
    general: { label: "General Multidisciplinary Agent", icon: FileText, color: "text-surface-300 bg-surface-800/60 border-surface-700/60", desc: "Analista General" },
  };

  const currentAgent = agentConfig[idea.assignedAgent] || agentConfig.general;
  const AgentIcon = currentAgent.icon;

  const priorityColors: Record<string, string> = {
    LOW: "text-surface-400 bg-surface-800 border-surface-700",
    MEDIUM: "text-accent-400 bg-accent-950/50 border-accent-800/60",
    HIGH: "text-amber-400 bg-amber-950/50 border-amber-800/60",
    CRITICAL: "text-rose-400 bg-rose-950/50 border-rose-800/60",
    URGENT: "text-rose-400 bg-rose-950/50 border-rose-800/60",
  };

  const handleCopyRaw = () => {
    navigator.clipboard.writeText(idea.rawContent);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  const handleQuickConvertTasks = async () => {
    if (!analysis?.recommendedActions?.length) return;
    try {
      setIsQuickConvertingTasks(true);
      setFeedbackMessage(null);
      const res = await fetch(`/api/ideas/${idea.id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: "TASKS" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al crear tareas");
      }
      setFeedbackMessage({
        type: "success",
        text: `Se han anadido ${data.data?.tasksCount || analysis.recommendedActions.length} tareas pendientes a la base de datos.`,
      });
      onConverted();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedbackMessage({
        type: "error",
        text: msg || "Error al convertir tareas.",
      });
    } finally {
      setIsQuickConvertingTasks(false);
    }
  };

  const handleReanalyzeTrigger = async () => {
    setFeedbackMessage(null);
    await onReanalyze(idea.id, selectedAgentForReanalyze);
  };

  return (
    <div className="flex flex-col h-full bg-surface-900 border border-surface-800 rounded-lg overflow-hidden">
      {/* Top Header */}
      <div className="p-4 border-b border-surface-800 flex flex-wrap items-center justify-between gap-3 bg-surface-900">
        <div className="flex flex-wrap items-center gap-2">
          {/* Agent Badge */}
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-medium font-mono ${currentAgent.color}`}>
            <AgentIcon className="w-3.5 h-3.5" />
            <span>{currentAgent.label}</span>
          </div>

          {/* Category Badge */}
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-800 border border-surface-700 text-xs font-mono text-surface-300 uppercase">
            <Layers className="w-3 h-3 text-surface-400" />
            <span>{idea.category}</span>
          </div>

          {/* Status Badge */}
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono">
            {idea.status === "PROCESSING" && (
              <span className="flex items-center gap-1 text-amber-400">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Procesando</span>
              </span>
            )}
            {idea.status === "COMPLETED" && (
              <span className="flex items-center gap-1 text-brand-500">
                <CheckCircle2 className="w-3 h-3" />
                <span>Analisis Completado</span>
              </span>
            )}
            {idea.status === "FAILED" && (
              <span className="flex items-center gap-1 text-rose-400">
                <AlertCircle className="w-3 h-3" />
                <span>Fallo de Ejecucion</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-surface-400 font-mono hidden md:inline">
            {format(new Date(idea.createdAt), "dd MMM yyyy HH:mm", { locale: es })}
          </span>

          <button
            type="button"
            onClick={() => onDelete(idea.id)}
            disabled={isProcessing}
            className="p-1.5 text-surface-400 hover:text-rose-400 hover:bg-surface-800 rounded transition-colors"
            title="Eliminar idea"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Action Bar (Conversion & Re-Analysis) */}
      <div className="px-4 py-2.5 bg-surface-950/80 border-b border-surface-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsConvertModalOpen(true)}
            disabled={isProcessing || !analysis}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Convertir en Proyecto</span>
          </button>

          <button
            type="button"
            onClick={handleQuickConvertTasks}
            disabled={isProcessing || isQuickConvertingTasks || !analysis}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-800 hover:bg-surface-700 text-surface-200 border border-surface-700 rounded text-xs font-medium transition-colors disabled:opacity-50"
          >
            {isQuickConvertingTasks ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckSquare className="w-3.5 h-3.5 text-brand-500" />
            )}
            <span>Anadir a Tareas Pendientes</span>
          </button>
        </div>

        {/* Re-analizar selector */}
        <div className="flex items-center gap-1.5 text-xs">
          <select
            value={selectedAgentForReanalyze}
            onChange={(e) => setSelectedAgentForReanalyze(e.target.value as IdeaAssignedAgent)}
            disabled={isProcessing}
            className="bg-surface-900 border border-surface-700 rounded px-2 py-1 text-xs text-surface-300 focus:outline-none cursor-pointer"
          >
            <option value="dev">Agente Dev</option>
            <option value="sales">Agente Sales</option>
            <option value="strategy">Agente Strategy</option>
            <option value="operations">Agente Operations</option>
            <option value="general">Agente General</option>
          </select>

          <button
            type="button"
            onClick={handleReanalyzeTrigger}
            disabled={isProcessing}
            className="flex items-center gap-1 px-2.5 py-1 bg-surface-800 hover:bg-surface-700 border border-surface-700 text-surface-200 rounded text-xs font-medium transition-colors disabled:opacity-50"
            title="Re-ejecutar analisis con el agente seleccionado"
          >
            {isProcessing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 text-accent-400" />
            )}
            <span className="hidden sm:inline">Re-analizar</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMessage && (
        <div
          className={`px-4 py-2 text-xs flex items-center justify-between border-b ${
            feedbackMessage.type === "success"
              ? "bg-brand-950/60 border-brand-800 text-brand-300"
              : "bg-rose-950/60 border-rose-800 text-rose-300"
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-surface-400 hover:text-surface-200"
          >
            x
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {/* Card 1: Original Raw Note */}
        <div className="bg-surface-950/60 border border-surface-800/80 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider">
              Nota Original en Bruto
            </span>
            <button
              onClick={handleCopyRaw}
              className="flex items-center gap-1 text-[11px] text-surface-400 hover:text-surface-200 transition-colors"
            >
              {copiedRaw ? (
                <>
                  <Check className="w-3 h-3 text-brand-500" />
                  <span className="text-brand-500">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>
          <div className="text-xs text-surface-200 whitespace-pre-wrap font-mono leading-relaxed bg-surface-900/60 p-3 rounded border border-surface-800/50">
            {idea.rawContent}
          </div>
        </div>

        {/* Card 2: Analysis Section */}
        {idea.status === "PROCESSING" ? (
          <div className="flex flex-col items-center justify-center p-12 bg-surface-950/40 border border-surface-800/60 rounded-lg text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-surface-200">
                Agente especialista procesando diagnostico...
              </h4>
              <p className="text-[11px] text-surface-400">
                Extrayendo viabilidad, dependencias y pasos tecnicos accionables.
              </p>
            </div>
          </div>
        ) : analysis ? (
          <div className="space-y-6">
            {/* Multi-Solution Solver Matrix (Primary Decision Engine) */}
            <MultiSolutionMatrix
              ideaId={idea.id}
              analysis={analysis.solverAnalysis || deterministicSolverAnalysis(idea.rawContent, idea.category)}
              onSolutionApplied={onConverted}
              isProcessing={isProcessing}
            />

            {/* Complementary Diagnostic Details (Collapsible / Secondary) */}
            <details className="bg-surface-950/60 border border-surface-800 rounded-lg p-4 space-y-4 group">
              <summary className="text-xs font-semibold text-surface-400 uppercase tracking-wider cursor-pointer list-none flex items-center justify-between hover:text-surface-200">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-accent-400" />
                  <span>Diagnóstico Adicional & Viabilidad de Especialista</span>
                </div>
                <span className="text-[10px] font-mono text-surface-500 group-open:rotate-90 transition-transform">
                  &gt;
                </span>
              </summary>

              <div className="pt-3 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <span className="font-semibold text-surface-300 block">Resumen Ejecutivo:</span>
                  <p className="text-surface-300 leading-relaxed bg-surface-900/60 p-3 rounded border border-surface-800/60">
                    {analysis.executiveSummary}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="font-semibold text-surface-300 block">Investigación & Viabilidad Técnica:</span>
                  <p className="text-surface-300 leading-relaxed bg-surface-900/60 p-3 rounded border border-surface-800/60">
                    {analysis.researchAndViability}
                  </p>
                </div>

                {analysis.keyInsights && analysis.keyInsights.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="font-semibold text-surface-300 block">Observaciones Clave:</span>
                    <ul className="space-y-1 bg-surface-900/60 p-3 rounded border border-surface-800/60">
                      {analysis.keyInsights.map((insight, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-surface-300 text-[11px]">
                          <ChevronRight className="w-3.5 h-3.5 text-surface-400 shrink-0 mt-0.5" />
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </details>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-surface-400 bg-surface-950 border border-surface-800 rounded-lg">
            No hay analisis disponible para esta nota. Utiliza el boton Re-analizar para delegar su procesamiento a un agente especialista.
          </div>
        )}
      </div>

      {/* Convert Modal */}
      {isConvertModalOpen && (
        <ConvertModal
          idea={idea}
          isOpen={isConvertModalOpen}
          onClose={() => setIsConvertModalOpen(false)}
          onSuccess={(targetType, count) => {
            setFeedbackMessage({
              type: "success",
              text: targetType === "PROJECT" 
                ? `Proyecto creado exitosamente con ${count} tareas asociadas.`
                : `${count} tareas agregadas a la bandeja de pendientes.`,
            });
            onConverted();
          }}
        />
      )}
    </div>
  );
}
