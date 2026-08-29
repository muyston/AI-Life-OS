"use client";

import { useState, useEffect } from "react";
import { AgentRunEntity, AgentSpecialistInfo, AgentName, AgentStatus, SPECIALIST_AGENTS } from "@/lib/types";
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
  ShieldCheck,
  Play,
  Sparkles,
  TrendingUp,
  Briefcase,
  Code2,
  Calendar,
  Layers,
  Activity,
  type LucideIcon,
} from "lucide-react";
import { format } from "date-fns";

export default function AgentsPage() {
  const [runs, setRuns] = useState<AgentRunEntity[]>([]);
  const [specialists, setSpecialists] = useState<AgentSpecialistInfo[]>(SPECIALIST_AGENTS);
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [runningAgent, setRunningAgent] = useState<string | null>(null);
  const [lastExecutionFeedback, setLastExecutionFeedback] = useState<string | null>(null);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  const loadAgentRuns = async (agentFilter = "ALL") => {
    try {
      setIsLoading(true);
      const url = agentFilter === "ALL" 
        ? "/api/agents/runs" 
        : `/api/agents/runs?agentName=${agentFilter}`;
      const res = await fetch(url, { cache: "no-store" });
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
    loadAgentRuns(selectedAgentFilter);
  }, [selectedAgentFilter]);

  const handleExecuteAgent = async (agentId: AgentName | "PIPELINE") => {
    try {
      setRunningAgent(agentId);
      setLastExecutionFeedback(null);

      setSpecialists((prev) =>
        prev.map((s) =>
          s.id === agentId || agentId === "PIPELINE"
            ? { ...s, status: "THINKING" }
            : s
        )
      );

      const res = await fetch("/api/agents/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentName: agentId,
          triggerType: "MANUAL",
        }),
      });

      const data = await res.json();

      if (data.success) {
        setLastExecutionFeedback(
          data.message || `Agente ${agentId} ejecutado con éxito.`
        );
        setSpecialists((prev) =>
          prev.map((s) =>
            s.id === agentId || agentId === "PIPELINE"
              ? { ...s, status: "COMPLETED" }
              : s
          )
        );
        setTimeout(() => {
          setSpecialists((prev) =>
            prev.map((s) =>
              s.id === agentId || agentId === "PIPELINE"
                ? { ...s, status: "IDLE" }
                : s
            )
          );
        }, 4000);

        await loadAgentRuns(selectedAgentFilter);
      } else {
        setLastExecutionFeedback(`Error en ejecución: ${data.error || "Fallo interno"}`);
        setSpecialists((prev) =>
          prev.map((s) =>
            s.id === agentId || agentId === "PIPELINE"
              ? { ...s, status: "ERROR" }
              : s
          )
        );
      }
    } catch (err) {
      console.error("Error al disparar ejecución de agente:", err);
      setLastExecutionFeedback("Error de conexión al ejecutar el agente.");
    } finally {
      setRunningAgent(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedRunId(expandedRunId === id ? null : id);
  };

  const agentIcons: Record<string, LucideIcon> = {
    ORCHESTRATOR: Sparkles,
    STRATEGY: TrendingUp,
    SALES: Briefcase,
    DEV: Code2,
    OPERATIONS: Calendar,
  };

  const statusBadge = (status: AgentStatus) => {
    switch (status) {
      case "THINKING":
      case "RUNNING":
        return { text: "Pensando / Ejecutando", color: "bg-amber-950/60 text-amber-400 border-amber-800/80 animate-pulse" };
      case "COMPLETED":
        return { text: "Tarea Completada", color: "bg-brand-950/60 text-brand-400 border-brand-800/80" };
      case "ERROR":
        return { text: "Error en Ejecución", color: "bg-red-950/60 text-red-400 border-red-800/80" };
      case "IDLE":
      default:
        return { text: "Inactivo (Listo)", color: "bg-surface-800 text-surface-400 border-surface-700" };
    }
  };

  const totalTokens = runs.reduce((acc, r) => acc + (r.tokensUsed || 0), 0);
  const totalCost = runs.reduce((acc, r) => acc + (r.costEstimate || 0), 0);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-surface-800 flex-wrap gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-surface-400 block">
            Arquitectura Multi-Agente Autónoma
          </span>
          <h1 className="text-xl font-bold tracking-tight text-surface-100 flex items-center gap-2">
            <Bot className="w-5 h-5 text-accent-500" />
            Panel de Control y Especialistas de IA
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleExecuteAgent("PIPELINE")}
            disabled={runningAgent !== null}
            className="flex items-center gap-1.5 px-4 py-2 bg-accent-600 hover:bg-accent-500 text-white rounded text-xs font-medium transition-colors disabled:opacity-50 shadow-sm"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${runningAgent === "PIPELINE" ? "animate-spin" : ""}`} />
            {runningAgent === "PIPELINE" ? "Ejecutando Pipeline..." : "Ejecutar Pipeline Completo"}
          </button>
        </div>
      </div>

      {lastExecutionFeedback && (
        <div className="p-3.5 rounded bg-surface-900 border border-brand-800/70 text-xs text-surface-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />
            <span>{lastExecutionFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setLastExecutionFeedback(null)}
            className="text-surface-400 hover:text-surface-200 text-xs font-mono"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Specialist Agents Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-surface-100 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-500" />
            Especialistas del Sistema ({specialists.length})
          </h3>
          <span className="text-[11px] text-surface-400">
            Monitor de estado en tiempo real
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {specialists.map((spec) => {
            const Icon = agentIcons[spec.id] || Bot;
            const badge = statusBadge(spec.status);
            const isCurrentlyRunning = runningAgent === spec.id;

            return (
              <div
                key={spec.id}
                className="bg-surface-900 border border-surface-800 rounded-lg p-5 flex flex-col justify-between hover:border-surface-700 transition-all space-y-4 shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded bg-surface-800 border border-surface-700 flex items-center justify-center text-accent-400">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-surface-100">
                          {spec.name}
                        </h4>
                        <span className="text-[10px] text-surface-400 font-mono">
                          {spec.role}
                        </span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase shrink-0 ${badge.color}`}>
                      {badge.text}
                    </span>
                  </div>

                  <p className="text-xs text-surface-300 mt-3 leading-relaxed">
                    {spec.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-surface-800 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-surface-400">
                    Área: {spec.category}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleExecuteAgent(spec.id)}
                    disabled={runningAgent !== null}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-800 hover:bg-surface-700 text-surface-200 border border-surface-700 rounded text-xs transition-colors disabled:opacity-50 font-medium"
                  >
                    <Play className={`w-3 h-3 ${isCurrentlyRunning ? "animate-spin" : ""}`} />
                    {isCurrentlyRunning ? "Procesando..." : "Ejecutar"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-900 border border-surface-800 rounded-lg p-4">
          <div className="text-xs text-surface-400 font-medium">Ejecuciones Registradas</div>
          <div className="text-2xl font-bold text-surface-100 mt-1 font-mono">
            {runs.length}
          </div>
          <div className="text-[11px] text-surface-400 mt-0.5">
            En tabla AgentRun
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
            Google Gemini 2.5 Flash
          </div>
        </div>

        <div className="bg-surface-900 border border-surface-800 rounded-lg p-4">
          <div className="text-xs text-surface-400 font-medium">Tasa de Éxito</div>
          <div className="text-2xl font-bold text-surface-100 mt-1 font-mono">
            {runs.length > 0
              ? `${Math.round((runs.filter((r) => r.status === "SUCCESS").length / runs.length) * 100)}%`
              : "100%"}
          </div>
          <div className="text-[11px] text-surface-400 mt-0.5">
            Sin fallos de ejecución
          </div>
        </div>
      </div>

      {/* Runs Audit Log */}
      <div className="bg-surface-900 border border-surface-800 rounded-lg p-5">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-surface-800 flex-wrap gap-3">
          <h3 className="text-xs font-semibold text-surface-100 uppercase tracking-wider flex items-center gap-2">
            <Terminal className="w-4 h-4 text-accent-500" />
            Historial Cronológico de Decisiones y Auditoría (AgentRun)
          </h3>

          <div className="flex items-center gap-3">
            <select
              value={selectedAgentFilter}
              onChange={(e) => setSelectedAgentFilter(e.target.value)}
              className="px-3 py-1.5 bg-surface-950 border border-surface-800 rounded text-xs text-surface-200 focus:outline-none focus:border-accent-500 font-mono"
            >
              <option value="ALL">Todos los Agentes</option>
              <option value="ORCHESTRATOR">Orchestrator Central</option>
              <option value="STRATEGY">StrategyAgent</option>
              <option value="SALES">SalesAgent</option>
              <option value="DEV">DevAgent</option>
              <option value="OPERATIONS">OperationsAgent</option>
              <option value="PLANNING_AGENT">PlanningAgent</option>
            </select>

            <button
              type="button"
              onClick={() => loadAgentRuns(selectedAgentFilter)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-950 hover:bg-surface-800 text-surface-300 border border-surface-700 rounded text-xs transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Actualizar
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-xs text-surface-400">
            Cargando historial de agentes...
          </div>
        ) : runs.length === 0 ? (
          <div className="py-16 text-center text-xs text-surface-400 space-y-2">
            <ShieldCheck className="w-8 h-8 text-surface-600 mx-auto" />
            <p>Aún no se han registrado ejecuciones de agentes en la base de datos.</p>
            <p className="text-[11px] text-surface-400">
              Pulsa en &quot;Ejecutar Pipeline Completo&quot; o ejecuta cualquiera de los especialistas para registrar la primera auditoría.
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