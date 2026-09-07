"use client";

import { useState } from "react";
import { AiActionEntity, AiActionStatus } from "@/lib/types";
import { 
  Sparkles, 
  Check, 
  X, 
  ChevronDown, 
  ChevronRight, 
  Code2, 
  Briefcase, 
  TrendingUp, 
  Calendar, 
  CheckCircle2, 
  type LucideIcon 
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
    STRATEGY: { label: "Strategy", color: "bg-indigo-950/60 text-indigo-300 border-indigo-800/80", icon: TrendingUp },
    SALES: { label: "Sales", color: "bg-emerald-950/60 text-emerald-300 border-emerald-800/80", icon: Briefcase },
    DEV: { label: "Dev & Arch", color: "bg-cyan-950/60 text-cyan-300 border-cyan-800/80", icon: Code2 },
    OPERATIONS: { label: "Operations", color: "bg-amber-950/60 text-amber-300 border-amber-800/80", icon: Calendar },
    ORCHESTRATOR: { label: "Orchestrator", color: "bg-purple-950/60 text-purple-300 border-purple-800/80", icon: Sparkles },
  };

  const statusLabels: Record<AiActionStatus, { text: string; color: string }> = {
    PENDING_REVIEW: { text: "Pendiente", color: "text-amber-400 bg-amber-950/50 border-amber-800/60" },
    APPROVED: { text: "Aprobada", color: "text-brand-400 bg-brand-950/50 border-brand-800/60" },
    REJECTED: { text: "Rechazada", color: "text-rose-400 bg-rose-950/50 border-rose-800/60" },
    EXECUTED: { text: "Ejecutada", color: "text-blue-400 bg-blue-950/50 border-blue-800/60" },
  };

  const pendingCount = actions.filter((a) => a.status === "PENDING_REVIEW").length;

  return (
    <div className="glass-panel rounded-2xl p-5 space-y-4 border border-white/10 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-950/80 border border-brand-800/80 flex items-center justify-center text-brand-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-surface-100 uppercase tracking-wider flex items-center gap-2">
              Feed de Acciones IA
              {pendingCount > 0 && (
                <span className="text-[10px] bg-amber-950 text-amber-400 border border-amber-800 px-1.5 py-0.2 rounded-md font-mono font-normal">
                  {pendingCount} pendientes
                </span>
              )}
            </h3>
            <p className="text-[11px] text-surface-400">
              Propuestas autónomas de los agentes con validación humana en 1 clic
            </p>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center bg-surface-950 border border-white/10 rounded-xl p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setFilter("PENDING_REVIEW")}
            className={`px-3 py-1 rounded-lg transition-colors ${
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
            className={`px-3 py-1 rounded-lg transition-colors ${
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
            className={`px-3 py-1 rounded-lg transition-colors ${
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
        <div className="py-8 text-center text-xs text-surface-400 space-y-1.5 glass-card rounded-xl">
          <CheckCircle2 className="w-6 h-6 text-brand-400 mx-auto" />
          <p>No hay acciones pendientes en este estado.</p>
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
                className="glass-card rounded-xl p-4 transition-all hover:border-white/15 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-md border uppercase shrink-0 flex items-center gap-1 mt-0.5 ${badge.color}`}
                    >
                      <AgentIcon className="w-3 h-3" />
                      {badge.label}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-surface-100">
                        {action.title}
                      </h4>
                      <p className="text-xs text-surface-300 mt-1 leading-relaxed break-words">
                        {action.description}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 rounded-md border uppercase shrink-0 ${statusConfig.color}`}
                  >
                    {statusConfig.text}
                  </span>
                </div>

                {/* Footer and Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs flex-wrap gap-2">
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
                        className="px-2.5 py-1 bg-surface-950 hover:bg-surface-800 text-rose-300 border border-white/10 rounded-xl text-xs transition-colors flex items-center gap-1 disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Rechazar</span>
                      </button>

                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleAction(action.id, "APPROVED")}
                        className="px-3 py-1 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-medium transition-all shadow-xs flex items-center gap-1 active:scale-95 disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isProcessing ? "Aplicando..." : "Aprobar y Ejecutar"}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Collapsible payload */}
                {isExpanded && action.payload && (
                  <div className="pt-2 border-t border-white/[0.06] text-xs">
                    <pre className="p-3 bg-surface-950/80 border border-white/10 rounded-xl font-mono text-[11px] text-surface-300 overflow-x-auto max-h-48">
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