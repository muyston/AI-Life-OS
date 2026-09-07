"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  CheckCircle2, 
  Clock, 
  FileText, 
  ListChecks, 
  Download, 
  Check, 
  AlertCircle,
  FileCheck2,
  GitCommit
} from "lucide-react";
import { AntigravityPlanData } from "@/lib/types";

interface AntigravityPlanModalProps {
  isOpen: boolean;
  conversationId: string | null;
  projectName: string;
  onClose: () => void;
  onPlanApproved?: () => void;
  onTasksImported?: () => void;
}

export function AntigravityPlanModal({
  isOpen,
  conversationId,
  projectName,
  onClose,
  onPlanApproved,
  onTasksImported,
}: AntigravityPlanModalProps) {
  const [activeTab, setActiveTab] = useState<"plan" | "walkthrough" | "tasks">("plan");
  const [planData, setPlanData] = useState<AntigravityPlanData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !conversationId) {
      setPlanData(null);
      setActionFeedback(null);
      return;
    }

    const fetchPlan = async () => {
      try {
        setIsLoading(true);
        setActionFeedback(null);
        const res = await fetch(`/api/antigravity/plans?conversationId=${conversationId}`);
        const data = await res.json();
        if (data.success && data.data) {
          setPlanData(data.data);
        }
      } catch (err) {
        console.error("Error al cargar plan de Antigravity:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlan();
  }, [isOpen, conversationId]);

  if (!isOpen) return null;

  const handleApprove = async () => {
    if (!conversationId) return;
    try {
      setIsApproving(true);
      setActionFeedback(null);
      const res = await fetch("/api/antigravity/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          conversationId,
          approvalNote: `Validado institucionalmente desde AI Life OS para ${projectName}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionFeedback("Plan aprobado formalmente. Se ha notificado al entorno Antigravity.");
        if (planData) {
          setPlanData({ ...planData, requestFeedback: false });
        }
        if (onPlanApproved) onPlanApproved();
      } else {
        setActionFeedback(data.error || "Error al registrar aprobacion.");
      }
    } catch {
      setActionFeedback("Fallo de conexion al aprobar el plan.");
    } finally {
      setIsApproving(false);
    }
  };

  const handleImportTasks = async () => {
    if (!conversationId) return;
    try {
      setIsImporting(true);
      setActionFeedback(null);
      const res = await fetch("/api/antigravity/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "import_tasks",
          conversationId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionFeedback(data.message || "Hitos importados exitosamente como tareas en AI Life OS.");
        if (onTasksImported) onTasksImported();
      } else {
        setActionFeedback(data.error || "Error al importar tareas.");
      }
    } catch {
      setActionFeedback("Fallo de conexion al importar tareas.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-surface-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-4xl max-h-[90vh] rounded-2xl flex flex-col border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between gap-4 bg-surface-900/60">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-accent-400 bg-accent-950/60 px-2 py-0.5 rounded border border-accent-800/60">
                Documentacion Tecnica Antigravity
              </span>
              {planData?.requestFeedback && (
                <span className="text-[10px] font-mono text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Requiere Aprobacion Humana
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-surface-100 truncate">
              {planData?.planTitle || projectName}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-surface-400 hover:text-surface-200 hover:bg-white/5 transition-colors"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Feedback Toast */}
        {actionFeedback && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-surface-900 border border-brand-800/80 text-xs text-surface-200 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0" />
              <span>{actionFeedback}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionFeedback(null)}
              className="text-[11px] text-surface-400 hover:text-surface-200 font-mono"
            >
              Descartar
            </button>
          </div>
        )}

        {/* Subheader Navigation */}
        <div className="px-5 pt-3 border-b border-white/[0.06] flex items-center gap-2 overflow-x-auto bg-surface-950/40">
          <button
            type="button"
            onClick={() => setActiveTab("plan")}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "plan"
                ? "border-accent-400 text-accent-300"
                : "border-transparent text-surface-400 hover:text-surface-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Plan de Implementacion</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tasks")}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "tasks"
                ? "border-accent-400 text-accent-300"
                : "border-transparent text-surface-400 hover:text-surface-200"
            }`}
          >
            <ListChecks className="w-3.5 h-3.5" />
            <span>Hitos y Tareas ({planData?.tasks.length || 0})</span>
          </button>

          {planData?.hasWalkthrough && (
            <button
              type="button"
              onClick={() => setActiveTab("walkthrough")}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "walkthrough"
                  ? "border-accent-400 text-accent-300"
                  : "border-transparent text-surface-400 hover:text-surface-200"
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Walkthrough de Verificacion</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs text-surface-300 leading-relaxed font-sans">
          {isLoading ? (
            <div className="py-20 text-center text-surface-400">
              Cargando especificacion de Antigravity...
            </div>
          ) : !planData ? (
            <div className="py-20 text-center text-surface-400">
              No se encontro archivo de plan ni walkthrough para esta sesion.
            </div>
          ) : activeTab === "plan" ? (
            <div className="space-y-4">
              {planData.planSummary && (
                <div className="p-4 rounded-xl bg-surface-900/80 border border-white/10 space-y-1.5">
                  <span className="text-[10px] font-mono text-surface-400 uppercase tracking-wider block">
                    Resumen Ejecutivo del Plan
                  </span>
                  <p className="text-surface-200 font-medium text-xs leading-relaxed">
                    {planData.planSummary}
                  </p>
                </div>
              )}

              <div className="p-4 rounded-xl bg-surface-950/70 border border-white/[0.06] font-mono text-[11px] whitespace-pre-wrap leading-relaxed max-h-[480px] overflow-y-auto selection:bg-accent-500/30">
                {planData.content}
              </div>
            </div>
          ) : activeTab === "tasks" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <span className="text-xs text-surface-400">
                  Desglose de cambios, archivos estructurados e hitos detectados en el plan.
                </span>
                <button
                  type="button"
                  onClick={handleImportTasks}
                  disabled={isImporting || planData.tasks.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-[11px] font-medium transition-colors disabled:opacity-50"
                >
                  <Download className="w-3 h-3" />
                  <span>{isImporting ? "Importando..." : "Importar a Tareas Life OS"}</span>
                </button>
              </div>

              {planData.tasks.length === 0 ? (
                <div className="py-12 text-center text-surface-500">
                  No se detectaron hitos explicitos con formato de tarea en este documento.
                </div>
              ) : (
                <div className="space-y-2">
                  {planData.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 rounded-xl bg-surface-900/60 border border-white/[0.06] flex items-start gap-3 hover:border-white/15 transition-colors"
                    >
                      <div className="mt-0.5">
                        {task.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Clock className="w-4 h-4 text-surface-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-surface-100 text-xs break-words">
                          {task.title}
                        </div>
                        <div className="text-[11px] text-surface-400 mt-0.5">
                          {task.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Walkthrough Tab */
            <div className="space-y-4">
              {planData.walkthroughSummary && (
                <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-800/40 space-y-1.5">
                  <span className="text-[10px] font-mono text-blue-300 uppercase tracking-wider block">
                    Resumen de Verificacion y Logros
                  </span>
                  <p className="text-surface-200 text-xs leading-relaxed">
                    {planData.walkthroughSummary}
                  </p>
                </div>
              )}

              <div className="p-4 rounded-xl bg-surface-950/70 border border-white/[0.06] font-mono text-[11px] whitespace-pre-wrap leading-relaxed max-h-[480px] overflow-y-auto">
                {planData.walkthroughContent || "No se ha registrado contenido detallado de walkthrough."}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-white/[0.08] flex items-center justify-between gap-3 bg-surface-900/80 flex-wrap">
          <div className="flex items-center gap-2 text-[11px] text-surface-400 font-mono">
            <GitCommit className="w-3.5 h-3.5" />
            <span>Sesion: {conversationId?.slice(0, 12)}...</span>
          </div>

          <div className="flex items-center gap-2.5">
            {planData?.requestFeedback && (
              <button
                type="button"
                onClick={handleApprove}
                disabled={isApproving}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isApproving ? "Aprobando..." : "Aprobar Plan Institucional"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleImportTasks}
              disabled={isImporting || !planData || planData.tasks.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-surface-800 hover:bg-surface-700 text-surface-200 border border-white/10 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-accent-400" />
              <span>Importar Tareas</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-surface-950 hover:bg-surface-900 text-surface-300 border border-white/[0.08] rounded-xl text-xs transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
