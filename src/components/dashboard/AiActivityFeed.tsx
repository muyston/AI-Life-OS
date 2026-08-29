"use client";

import { useState } from "react";
import { AiActionEntity, AiActionStatus } from "@/lib/types";
import { 
  Sparkles, 
  Check, 
  X, 
  ChevronDown, 
  ChevronRight, 
  Clock, 
  Code2, 
  Briefcase, 
  TrendingUp, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  Filter,
  type LucideIcon,
} from "lucide-react";
import { format } from "date-fns";

interface AiActivityFeedProps {
  actions: AiActionEntity[];
  onActionStatusChange: (actionId: string, status: AiActionStatus) => Promise<void>;
  isLoading?: boolean;
}

export function AiActivityFeed({
  actions,
  onActionStatusChange,
  isLoading = false,
}: AiActivityFeedProps) {
  const [filter, setFilter] = useState<string>("PENDING_REVIEW");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const filteredActions = actions.filter((action) => {
    if (filter === "ALL") return true;
    return action.status === filter;
  });

  const handleAction = async (actionId: string, status: AiActionStatus) => {
    try {
      setProcessingId(actionId);
      await onActionStatusChange(actionId, status);
    } finally {
      setProcessingId(null);
    }
  };

  const agentBadges: Record<string, { label: string; color: string; icon: LucideIcon }> = {
    STRATEGY: { label: "Strategy", color: "bg-indigo-950/60 text-indigo-400 border-indigo-800/80", icon: TrendingUp },
    SALES: { label: "Sales", color: "bg-emerald-950/60 text-emerald-400 border-emerald-800/80", icon: Briefcase },
    DEV: { label: "Dev & Arch", color: "bg-cyan-950/60 text-cyan-400 border-cyan-800/80", icon: Code2 },
    OPERATIONS: { label: "Operations", color: "bg-amber-950/60 text-amber-400 border-amber-800/80", icon: Calendar },
    ORCHESTRATOR: { label: "Orchestrator", color: "bg-purple-950/60 text-purple-400 border-purple-800/80", icon: Sparkles },
  };

  const statusLabels: Record<AiActionStatus, { text: string; color: string }> = {
    PENDING_REVIEW: { text: "Pendiente de Validación", color: "text-amber-400 bg-amber-950/50 border-amber-800/60" },
    APPROVED: { text: "Aprobada", color: "text-brand-400 bg-brand-950/50 border-brand-800/60" },
    REJECTED: { text: "Rechazada", color: "text-red-400 bg-red-950/50 border-red-800/60" },
    EXECUTED: { text: "Ejecutada", color: "text-blue-400 bg-blue-950/50 border-blue-800/60" },
  };

  const pendingCount = actions.filter((a) => a.status === "PENDING_REVIEW").length;

  return (
    <div className="bg-surface-900 border border-surface-800 rounded-lg p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-surface-800 flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-brand-950/80 border border-brand-800/80 flex items-center justify-center text-brand-400">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-surface-100 uppercase tracking-wider flex items-center gap-2">
              Feed de Acciones de la IA
              {pendingCount > 0 && (
                <span className="text-[10px] bg-amber-950 text-amber-400 border border-amber-800 px-1.5 py-0.2 rounded font-mono font-normal">
                  {pendingCount} pendientes
                </span>
              )}
            </h3>
            <p className="text-[11px] text-surface-400">
              Propuestas generadas por agentes que requieren validación humana (Intervención 1 clic)
            </p>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center bg-surface-950 border border-surface-800 rounded p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setFilter("PENDING_REVIEW")}
            className={`px-2.5 py-1 rounded transition-colors ${
              filter === "PENDING_REVIEW"
                ? "bg-surface-800 text-surface-100 font-medium"
                : "text-surface-400 hover:text-surface-200"
            }`}
          >
            Pendientes ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("APPROVED")}
            className={`px-2.5 py-1 rounded transition-colors ${
              filter === "APPROVED"
                ? "bg-surface-800 text-surface-100 font-medium"
                : "text-surface-400 hover:text-surface-200"
            }`}
          >
            Aprobadas
          </button>
          <button
            type="button"
            onClick={() => setFilter("ALL")}
            className={`px-2.5 py-1 rounded transition-colors ${
              filter === "ALL"
                ? "bg-surface-800 text-surface-100 font-medium"
                : "text-surface-400 hover:text-surface-200"
            }`}
          >
            Todas ({actions.length})
          </button>
        </div>
      </div>

      {/* Content list */}
      {isLoading ? (
        <div className="py-10 text-center text-xs text-surface-400">
          Cargando feed de acciones...
        </div>
      ) : filteredActions.length === 0 ? (
        <div className="py-10 text-center text-xs text-surface-400 space-y-1.5 bg-surface-950/40 rounded border border-surface-800/60">
          <CheckCircle2 className="w-6 h-6 text-brand-500 mx-auto" />
          <p>No hay acciones pendientes en este estado.</p>
          <p className="text-[11px] text-surface-400">
            Los agentes registrarán nuevas propuestas tras su ejecución automática o bajo demanda.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredActions.map((action) => {
            const badge = agentBadges[action.agentName] || agentBadges.ORCHESTRATOR;
            const AgentIcon = badge.icon;
            const isExpanded = expandedId === action.id;
            const statusConfig = statusLabels[action.status] || statusLabels.PENDING_REVIEW;
            const isProcessing = processingId === action.id;

            return (
              <div
                key={action.id}
                className="bg-surface-950 border border-surface-800 rounded-lg p-4 transition-all hover:border-surface-700/80 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase shrink-0 flex items-center gap-1 mt-0.5 ${badge.color}`}
                    >
                      <AgentIcon className="w-3 h-3" />
                      {badge.label}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-surface-100">
                        {action.title}
                      </h4>
                      <p className="text-xs text-surface-300 mt-1 leading-relaxed">
                        {action.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${statusConfig.color}`}
                    >
                      {statusConfig.text}
                    </span>
                  </div>
                </div>

                {/* Footer and Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-surface-800/80 text-xs flex-wrap gap-2">
                  <div className="flex items-center gap-3 text-[11px] text-surface-400 font-mono">
                    <span>
                      {format(new Date(action.createdAt), "dd/MM HH:mm")}
                    </span>
                    {action.payload && (
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : action.id)}
                        className="text-accent-400 hover:text-accent-300 flex items-center gap-0.5"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronDown className="w-3 h-3" /> Ocultar datos
                          </>
                        ) : (
                          <>
                            <ChevronRight className="w-3 h-3" /> Ver detalles
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {action.status === "PENDING_REVIEW" && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleAction(action.id, "REJECTED")}
                        className="px-2.5 py-1 bg-surface-900 hover:bg-surface-800 text-red-400 hover:text-red-300 border border-surface-700 rounded text-xs transition-colors flex items-center gap-1 disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        Rechazar
                      </button>

                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleAction(action.id, "APPROVED")}
                        className="px-3 py-1 bg-brand-600 hover:bg-brand-500 text-white rounded text-xs font-medium transition-colors flex items-center gap-1 disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        {isProcessing ? "Aplicando..." : "Aprobar y Ejecutar"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Collapsible payload preview */}
                {isExpanded && action.payload && (
                  <div className="pt-2 border-t border-surface-800 text-xs">
                    <div className="text-[10px] font-mono text-surface-400 uppercase mb-1">
                      Payload estructurado de la acción:
                    </div>
                    <pre className="p-3 bg-surface-900 border border-surface-800 rounded font-mono text-[11px] text-surface-300 overflow-x-auto max-h-48">
                      {JSON.stringify(JSON.parse(action.payload), null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}