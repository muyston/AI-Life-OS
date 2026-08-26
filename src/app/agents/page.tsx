"use client";

import { useState, useEffect } from "react";
import { AgentRunEntity } from "@/lib/types";
import { 
  Bot, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Coins, 
  Terminal, 
  ChevronDown, 
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { format } from "date-fns";

export default function AgentsPage() {
  const [runs, setRuns] = useState<AgentRunEntity[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  const loadAgentRuns = async (agentFilter = "ALL") => {
    try {
      setIsLoading(true);
      const url = agentFilter === "ALL" 
        ? "/api/agents/runs" 
        : `/api/agents/runs?agentName=${agentFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setRuns(data.data);
      }
    } catch (err) {
      console.error("Error al cargar registros de agentes:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAgentRuns(selectedAgent);
  }, [selectedAgent]);

  const toggleExpand = (id: string) => {
    setExpandedRunId(expandedRunId === id ? null : id);
  };

  const totalTokens = runs.reduce((acc, r) => acc + (r.tokensUsed || 0), 0);
  const totalCost = runs.reduce((acc, r) => acc + (r.costEstimate || 0), 0);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-surface-800 flex-wrap gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-surface-400 block">
            Auditoria y Transparencia de IA
          </span>
          <h1 className="text-xl font-bold tracking-tight text-surface-100 flex items-center gap-2">
            <Bot className="w-5 h-5 text-accent-500" />
            Panel de Ejecuciones de Agentes (AgentRun)
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="px-3 py-1.5 bg-surface-900 border border-surface-800 rounded text-xs text-surface-200 focus:outline-none focus:border-accent-500"
          >
            <option value="ALL">Todos los Agentes</option>
            <option value="PLANNING_AGENT">Agente de Planificacion</option>
            <option value="CAPTURE_AGENT">Agente de Captura</option>
            <option value="PATTERN_AGENT">Agente de Patrones</option>
            <option value="BRIEFING_AGENT">Agente de Briefing</option>
            <option value="MINI_APP_GENERATOR">Generador de Mini-Apps</option>
          </select>

          <button
            type="button"
            onClick={() => loadAgentRuns(selectedAgent)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-900 hover:bg-surface-800 text-surface-300 border border-surface-700 rounded text-xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface-900 border border-surface-800 rounded-lg p-4">
          <div className="text-xs text-surface-400 font-medium">Ejecuciones Totales</div>
          <div className="text-2xl font-bold text-surface-100 mt-1 font-mono">
            {runs.length}
          </div>
          <div className="text-[11px] text-surface-400 mt-0.5">
            Registros en tabla AgentRun
          </div>
        </div>

        <div className="bg-surface-900 border border-surface-800 rounded-lg p-4">
          <div className="text-xs text-surface-400 font-medium">Tokens Consumidos</div>
          <div className="text-2xl font-bold text-surface-100 mt-1 font-mono">
            {totalTokens.toLocaleString()}
          </div>
          <div className="text-[11px] text-surface-400 mt-0.5">
            Entrada y salida de API
          </div>
        </div>

        <div className="bg-surface-900 border border-surface-800 rounded-lg p-4">
          <div className="text-xs text-surface-400 font-medium">Coste Estimado API</div>
          <div className="text-2xl font-bold text-brand-400 mt-1 font-mono">
            ${totalCost.toFixed(4)}
          </div>
          <div className="text-[11px] text-surface-400 mt-0.5">
            Google Gemini 2.5 / JSON Schema
          </div>
        </div>

        <div className="bg-surface-900 border border-surface-800 rounded-lg p-4">
          <div className="text-xs text-surface-400 font-medium">Tasa de Exito</div>
          <div className="text-2xl font-bold text-surface-100 mt-1 font-mono">
            {runs.length > 0
              ? `${Math.round((runs.filter((r) => r.status === "SUCCESS").length / runs.length) * 100)}%`
              : "100%"}
          </div>
          <div className="text-[11px] text-surface-400 mt-0.5">
            Ejecuciones sin fallo
          </div>
        </div>
      </div>

      {/* Runs Audit Log */}
      <div className="bg-surface-900 border border-surface-800 rounded-lg p-5">
        <h3 className="text-xs font-semibold text-surface-100 uppercase tracking-wider pb-3 border-b border-surface-800 mb-4 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-accent-500" />
          Historial Cronologico de Decisiones
        </h3>

        {isLoading ? (
          <div className="py-16 text-center text-xs text-surface-400">
            Cargando historial de agentes...
          </div>
        ) : runs.length === 0 ? (
          <div className="py-16 text-center text-xs text-surface-400 space-y-2">
            <ShieldCheck className="w-8 h-8 text-surface-600 mx-auto" />
            <p>Aun no se han registrado ejecuciones de agentes en la base de datos.</p>
            <p className="text-[11px] text-surface-400">
              Ejecuta el Agente de Planificación desde la Vista Diaria para registrar la primera auditoría.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {runs.map((run) => {
              const isExpanded = expandedRunId === run.id;
              return (
                <div
                  key={run.id}
                  className="bg-surface-950 border border-surface-800 rounded-lg overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => toggleExpand(run.id)}
                    className="w-full p-3.5 flex items-center justify-between text-left hover:bg-surface-900/50 transition-colors gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-surface-400 shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-surface-400 shrink-0" />
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-semibold text-surface-200">
                            {run.agentName}
                          </span>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                              run.status === "SUCCESS"
                                ? "bg-brand-950/60 text-brand-400 border-brand-800/80"
                                : "bg-red-950/60 text-red-400 border-red-800/80"
                            }`}
                          >
                            {run.status}
                          </span>
                          <span className="text-[10px] bg-surface-800 text-surface-400 px-1.5 py-0.2 rounded font-mono">
                            Disparo: {run.triggerType}
                          </span>
                        </div>
                        <div className="text-[11px] text-surface-400 mt-1 font-mono">
                          {format(new Date(run.createdAt), "dd/MM/yyyy HH:mm:ss")}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right shrink-0 font-mono text-xs text-surface-400">
                      <div>
                        <div>{run.tokensUsed} tokens</div>
                        <div className="text-[10px] text-surface-400">${run.costEstimate.toFixed(5)}</div>
                      </div>
                      <div className="text-surface-400 text-xs">
                        {run.executionTimeMs} ms
                      </div>
                    </div>
                  </button>

                  {/* Expanded Payload Viewer */}
                  {isExpanded && (
                    <div className="p-4 border-t border-surface-800 bg-surface-950 space-y-4 text-xs">
                      {run.errorMessage && (
                        <div className="p-3 rounded bg-red-950/50 border border-red-800/80 text-red-300">
                          <div className="font-semibold mb-1">Detalle del Error:</div>
                          <div className="font-mono text-[11px]">{run.errorMessage}</div>
                        </div>
                      )}

                      <div>
                        <div className="font-semibold text-surface-400 mb-1.5 font-mono text-[11px] uppercase">
                          Input Payload (Datos de Entrada):
                        </div>
                        <pre className="p-3 bg-surface-900 border border-surface-800 rounded font-mono text-[11px] text-surface-300 overflow-x-auto max-h-60">
                          {run.inputPayload
                            ? JSON.stringify(JSON.parse(run.inputPayload), null, 2)
                            : "Sin payload de entrada"}
                        </pre>
                      </div>

                      <div>
                        <div className="font-semibold text-surface-400 mb-1.5 font-mono text-[11px] uppercase">
                          Output Payload (Decisiones / Respuesta del Agente):
                        </div>
                        <pre className="p-3 bg-surface-900 border border-surface-800 rounded font-mono text-[11px] text-brand-300/90 overflow-x-auto max-h-60">
                          {run.outputPayload
                            ? JSON.stringify(JSON.parse(run.outputPayload), null, 2)
                            : "Sin payload de salida"}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
