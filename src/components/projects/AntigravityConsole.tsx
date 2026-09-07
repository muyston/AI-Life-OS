"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Terminal, 
  RefreshCw, 
  GitBranch, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  FileText, 
  ListChecks, 
  Send, 
  Check, 
  Layers, 
  Cpu, 
  Activity, 
  FolderOpen
} from "lucide-react";
import { 
  AntigravityProjectDetails, 
  AntigravityWorkspaceStatus,
  AntigravityMcpServerInfo 
} from "@/lib/types";
import { AntigravityPlanModal } from "./AntigravityPlanModal";
import { AntigravityInstructionModal } from "./AntigravityInstructionModal";

interface AntigravityConsoleProps {
  onSyncTriggered?: () => void;
}

export function AntigravityConsole({ onSyncTriggered }: AntigravityConsoleProps) {
  const [workspaces, setWorkspaces] = useState<AntigravityProjectDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncingPrisma, setIsSyncingPrisma] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Modals state
  const [selectedPlanConvoId, setSelectedPlanConvoId] = useState<string | null>(null);
  const [selectedPlanProjectName, setSelectedPlanProjectName] = useState<string>("");
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

  const [selectedProjectForInstruction, setSelectedProjectForInstruction] = useState<AntigravityProjectDetails | null>(null);
  const [isInstructionModalOpen, setIsInstructionModalOpen] = useState(false);

  // MCP Servers state
  const [mcpServers, setMcpServers] = useState<AntigravityMcpServerInfo[]>([]);

  const loadMcpServers = useCallback(async () => {
    try {
      const res = await fetch("/api/antigravity/mcp", { cache: "no-store" });
      const data = await res.json();
      if (data.success && Array.isArray(data.data?.servers)) {
        setMcpServers(data.data.servers);
      }
    } catch {
      // Ignorar fallo de conexion silenciosamente
    }
  }, []);

  const loadWorkspaces = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch("/api/antigravity/projects", { cache: "no-store" });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setWorkspaces(data.data);
      }
    } catch (err) {
      console.error("Error al cargar workspaces de Antigravity:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadWorkspaces();
    loadMcpServers();
  }, [loadWorkspaces, loadMcpServers]);

  const handleSyncWithPrisma = async () => {
    try {
      setIsSyncingPrisma(true);
      setFeedback(null);
      const res = await fetch("/api/projects/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        setFeedback(data.message || "Sincronizacion completa con base de datos de Life OS.");
        await loadWorkspaces();
        if (onSyncTriggered) onSyncTriggered();
      } else {
        setFeedback("Error al sincronizar con la base de datos.");
      }
    } catch {
      setFeedback("Fallo de red al sincronizar con Life OS.");
    } finally {
      setIsSyncingPrisma(false);
    }
  };

  const handleQuickApprove = async (conversationId: string, projectName: string) => {
    try {
      const res = await fetch("/api/antigravity/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          conversationId,
          approvalNote: `Plan validado institucionalmente para ${projectName}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback(`Plan de ${projectName} aprobado correctamente.`);
        await loadWorkspaces();
      }
    } catch {
      setFeedback("Error al aprobar el plan.");
    }
  };

  const handleQuickImport = async (conversationId: string, projectName: string) => {
    try {
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
        setFeedback(data.message || `Hitos de ${projectName} importados a tareas de Life OS.`);
        await loadWorkspaces();
        if (onSyncTriggered) onSyncTriggered();
      }
    } catch {
      setFeedback("Error al importar tareas del plan.");
    }
  };

  // Metrics summary
  const totalWorkspaces = workspaces.length;
  const totalSteps = workspaces.reduce((acc, w) => acc + w.totalSteps, 0);
  const waitingApprovalCount = workspaces.filter((w) => w.status === "WAITING_APPROVAL").length;
  const activeCount = workspaces.filter((w) => w.status === "ACTIVE" || w.status === "PLANNING").length;

  const statusBadges: Record<AntigravityWorkspaceStatus, { label: string; bg: string; dot: string }> = {
    WAITING_APPROVAL: {
      label: "Requiere Aprobacion",
      bg: "text-amber-300 bg-amber-950/70 border-amber-800/80",
      dot: "bg-amber-400 animate-pulse",
    },
    ACTIVE: {
      label: "Activo / Ejecucion",
      bg: "text-emerald-300 bg-emerald-950/70 border-emerald-800/80",
      dot: "bg-emerald-400 animate-pulse",
    },
    PLANNING: {
      label: "Fase de Planificacion",
      bg: "text-cyan-300 bg-cyan-950/70 border-cyan-800/80",
      dot: "bg-cyan-400",
    },
    COMPLETED: {
      label: "Hitos Verificados",
      bg: "text-blue-300 bg-blue-950/70 border-blue-800/80",
      dot: "bg-blue-400",
    },
    IDLE: {
      label: "En Espera",
      bg: "text-surface-400 bg-surface-900 border-white/[0.08]",
      dot: "bg-surface-500",
    },
  };

  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return "Sin actividad";
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / (1000 * 60));
    if (mins < 1) return "Hace un momento";
    if (mins < 60) return `Hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Hace ${hours} h`;
    return new Date(dateStr).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="glass-card rounded-xl p-4 border border-white/10 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-accent-950/80 border border-accent-800/80 text-accent-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase text-surface-400">Workspaces</div>
            <div className="text-lg font-bold text-surface-50">{totalWorkspaces}</div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 border border-white/10 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-800/80 text-cyan-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase text-surface-400">Iteraciones / Pasos</div>
            <div className="text-lg font-bold text-surface-50">{totalSteps.toLocaleString()}</div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 border border-white/10 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-800/80 text-amber-400">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase text-surface-400">Pendiente Aprobacion</div>
            <div className="text-lg font-bold text-surface-50">{waitingApprovalCount}</div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 border border-white/10 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase text-surface-400">Sesiones Activas</div>
            <div className="text-lg font-bold text-surface-50">{activeCount}</div>
          </div>
        </div>
      </div>

      {/* MCP Servers Connected Strip */}
      {mcpServers.length > 0 && (
        <div className="glass-panel rounded-2xl p-4 border border-white/10 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-surface-200 uppercase tracking-wider">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Servidores MCP Conectados ({mcpServers.length})</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Ecosistema Activo
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {mcpServers.map((srv) => (
              <div
                key={srv.name}
                className="p-3 rounded-xl bg-surface-950/70 border border-white/[0.06] space-y-1 hover:border-cyan-500/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-cyan-300 capitalize">
                    {srv.name}
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-cyan-950/60 text-cyan-400 border border-cyan-800/60">
                    {srv.toolsCount} tools
                  </span>
                </div>
                <p className="text-[10px] text-surface-400 line-clamp-1">
                  {srv.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-surface-100 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-accent-400" />
            Consola Operativa de Antigravity
          </h2>
          <p className="text-xs text-surface-400">
            Monitorizacion en tiempo real de workspaces locales, planes de ejecucion e interaccion directa.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadWorkspaces}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-900 hover:bg-surface-800 text-surface-200 border border-white/10 rounded-xl text-xs transition-colors disabled:opacity-50"
            title="Escanear estado de Antigravity"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-accent-400 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>{isRefreshing ? "Actualizando..." : "Actualizar Estado"}</span>
          </button>

          <button
            type="button"
            onClick={handleSyncWithPrisma}
            disabled={isSyncingPrisma}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isSyncingPrisma ? "Sincronizando..." : "Sincronizar a Life OS"}</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className="p-3.5 rounded-xl bg-surface-900 border border-brand-800/80 text-xs text-surface-200 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0" />
            <span>{feedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-[11px] text-surface-400 hover:text-surface-200 font-mono"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Workspaces List */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-surface-400 glass-card rounded-2xl">
          Conectando con el entorno local de Antigravity...
        </div>
      ) : workspaces.length === 0 ? (
        <div className="py-20 text-center text-xs text-surface-400 glass-card rounded-2xl space-y-3">
          <Terminal className="w-8 h-8 text-surface-600 mx-auto" />
          <p>No se encontraron workspaces activos en C:\Users\grarr\.gemini\antigravity</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {workspaces.map((project) => {
            const badge = statusBadges[project.status] || statusBadges.IDLE;
            const latest = project.latestConversation;
            const hasPlan = Boolean(latest?.hasPlan);
            const requestFeedback = Boolean(latest?.requestFeedback);
            const hasWalkthrough = Boolean(latest?.hasWalkthrough);

            return (
              <div
                key={project.localPath}
                className="glass-card rounded-2xl p-5 flex flex-col justify-between hover:border-white/20 transition-all shadow-md space-y-4 border border-white/10"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded border border-white/10 bg-surface-950 text-surface-300">
                          {project.category}
                        </span>
                        <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded border flex items-center gap-1.5 ${badge.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-surface-100 truncate">
                        {project.name}
                      </h3>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono text-surface-400 bg-surface-950 px-2 py-0.5 rounded border border-white/[0.06] block">
                        {project.totalSteps} pasos
                      </span>
                      <span className="text-[9px] font-mono text-surface-500 mt-1 block">
                        {project.totalConversations} sesiones
                      </span>
                    </div>
                  </div>

                  {/* Local Path & Repo Link */}
                  <div className="space-y-1 pt-1">
                    <div className="text-[11px] font-mono text-surface-400 truncate flex items-center gap-1.5">
                      <FolderOpen className="w-3 h-3 text-surface-500 shrink-0" />
                      <span className="truncate">{project.localPath}</span>
                    </div>

                    {project.repoUrl && (
                      <a
                        href={project.repoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-[11px] text-accent-400 hover:text-accent-300 font-mono pt-0.5"
                      >
                        <GitBranch className="w-3 h-3" />
                        <span className="truncate max-w-[280px]">
                          {project.repoUrl.replace("https://github.com/", "")}
                        </span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {/* Latest Activity Quote */}
                  {latest && (
                    <div className="mt-3.5 p-3 rounded-xl bg-surface-950/70 border border-white/[0.06] space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono text-surface-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-accent-400" />
                          {formatTimeAgo(latest.lastStepTime)}
                        </span>
                        <span>ID: {latest.conversationId.slice(0, 8)}</span>
                      </div>
                      {latest.lastUserInput && (
                        <p className="text-xs text-surface-200 line-clamp-2 italic font-mono pt-1">
                          "{latest.lastUserInput}"
                        </p>
                      )}
                    </div>
                  )}

                  {/* Implementation Plan Card */}
                  {hasPlan && (
                    <div className="mt-3 p-3.5 rounded-xl bg-surface-900/60 border border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-surface-100">
                          <FileText className="w-3.5 h-3.5 text-accent-400" />
                          <span>Plan de Implementacion</span>
                        </div>
                        {requestFeedback && (
                          <span className="text-[9px] font-mono text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800/80">
                            Aprobacion Requerida
                          </span>
                        )}
                      </div>

                      {latest?.planSummary && (
                        <p className="text-[11px] text-surface-300 line-clamp-2 leading-relaxed">
                          {latest.planSummary}
                        </p>
                      )}

                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPlanConvoId(latest?.conversationId || null);
                            setSelectedPlanProjectName(project.name);
                            setIsPlanModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-surface-800 hover:bg-surface-700 text-surface-200 border border-white/10 rounded-lg text-[11px] font-medium transition-colors"
                        >
                          Ver Documento Completo
                        </button>

                        {requestFeedback && latest && (
                          <button
                            type="button"
                            onClick={() => handleQuickApprove(latest.conversationId, project.name)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-medium transition-colors shadow-xs"
                          >
                            <Check className="w-3 h-3" />
                            <span>Aprobar Plan</span>
                          </button>
                        )}

                        {latest && (
                          <button
                            type="button"
                            onClick={() => handleQuickImport(latest.conversationId, project.name)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-surface-950 hover:bg-surface-900 text-surface-300 border border-white/10 rounded-lg text-[11px] transition-colors"
                          >
                            <ListChecks className="w-3 h-3 text-accent-400" />
                            <span>Importar Hitos</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Walkthrough Card */}
                  {hasWalkthrough && (
                    <div className="mt-2.5 p-3 rounded-xl bg-blue-950/20 border border-blue-800/30 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono text-blue-300 uppercase tracking-wider block">
                          Walkthrough Verificado
                        </span>
                        <p className="text-[11px] text-surface-300 truncate mt-0.5">
                          {latest?.walkthroughSummary || "Cambios implementados y verificados con exito."}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPlanConvoId(latest?.conversationId || null);
                          setSelectedPlanProjectName(project.name);
                          setIsPlanModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-blue-900/50 hover:bg-blue-800/60 text-blue-200 border border-blue-700/50 rounded-lg text-[11px] font-medium transition-colors shrink-0"
                      >
                        Ver Walkthrough
                      </button>
                    </div>
                  )}
                </div>

                {/* Bottom Actions Bar */}
                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-3">
                  <div className="text-[11px] font-mono text-surface-400">
                    {project.tasksCount ? (
                      <span>
                        Tareas Life OS: {project.tasksCount.completed}/{project.tasksCount.total}
                      </span>
                    ) : (
                      <span>No vinculado a DB</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProjectForInstruction(project);
                        setIsInstructionModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-600 hover:bg-accent-500 text-white rounded-xl text-xs font-medium transition-all shadow-md active:scale-95"
                    >
                      <Send className="w-3 h-3" />
                      <span>Enviar Directiva</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Plan & Walkthrough Modal */}
      <AntigravityPlanModal
        isOpen={isPlanModalOpen}
        conversationId={selectedPlanConvoId}
        projectName={selectedPlanProjectName}
        onClose={() => {
          setIsPlanModalOpen(false);
          setSelectedPlanConvoId(null);
        }}
        onPlanApproved={loadWorkspaces}
        onTasksImported={loadWorkspaces}
      />

      {/* Technical Instruction Modal */}
      <AntigravityInstructionModal
        isOpen={isInstructionModalOpen}
        project={selectedProjectForInstruction}
        onClose={() => {
          setIsInstructionModalOpen(false);
          setSelectedProjectForInstruction(null);
        }}
        onInstructionSent={loadWorkspaces}
      />
    </div>
  );
}
