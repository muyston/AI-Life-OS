"use client";

import { useState } from "react";
import { 
  Cpu, 
  X, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Terminal, 
  GitBranch, 
  Database, 
  BookOpen, 
  Globe 
} from "lucide-react";
import { AntigravityMcpServerInfo, AntigravityProjectDetails } from "@/lib/types";

interface AntigravityMcpModalProps {
  isOpen: boolean;
  onClose: () => void;
  servers: AntigravityMcpServerInfo[];
  projects: AntigravityProjectDetails[];
  initialServer?: string | null;
}

export function AntigravityMcpModal({
  isOpen,
  onClose,
  servers,
  projects,
  initialServer,
}: AntigravityMcpModalProps) {
  const [selectedServer, setSelectedServer] = useState<string>(
    initialServer || (servers.length > 0 ? servers[0].name : "github")
  );
  const [selectedTool, setSelectedTool] = useState<string>("");
  const [selectedProjectPath, setSelectedProjectPath] = useState<string>(
    projects.length > 0 ? projects[0].localPath : ""
  );
  const [instruction, setInstruction] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [executionResult, setExecutionResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  if (!isOpen) return null;

  const currentServerInfo = servers.find((s) => s.name === selectedServer);

  const serverIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    github: GitBranch,
    memory: Database,
    context7: BookOpen,
    firecrawl: Globe,
  };

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setExecutionResult(null);

      const res = await fetch("/api/antigravity/mcp/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serverName: selectedServer,
          toolName: selectedTool || "agent_instruction",
          projectPath: selectedProjectPath || undefined,
          prompt: instruction.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setExecutionResult({
          success: true,
          message: data.data?.message || "Acción despachada exitosamente al agente Antigravity.",
          details: data.data,
        });
        setInstruction("");
      } else {
        setExecutionResult({
          success: false,
          message: data.error || "Error al procesar la invocación MCP.",
        });
      }
    } catch (err: any) {
      setExecutionResult({
        success: false,
        message: err.message || "Fallo de conexión al despachar herramienta MCP.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-100">
      <div className="glass-panel rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 border border-white/10 animate-in zoom-in-95 duration-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-800/80 flex items-center justify-center text-cyan-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-surface-100">
                Consola de Invocación MCP Antigravity
              </h2>
              <span className="text-[11px] text-surface-400 font-mono block">
                Comunica directivas y herramientas a través del Model Context Protocol
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

        {/* Server Selector Tabs */}
        <div className="space-y-2">
          <label className="text-[11px] font-mono text-surface-400 uppercase tracking-wider block">
            Servidor MCP Destino
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {servers.map((srv) => {
              const Icon = serverIcons[srv.name] || Cpu;
              const isSelected = selectedServer === srv.name;
              return (
                <button
                  key={srv.name}
                  type="button"
                  onClick={() => {
                    setSelectedServer(srv.name);
                    setSelectedTool("");
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "bg-cyan-950/60 border-cyan-500/70 text-cyan-300 shadow-xs"
                      : "bg-surface-950 border-white/[0.06] text-surface-400 hover:border-white/20 hover:text-surface-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold font-mono capitalize">{srv.name}</span>
                  </div>
                  <span className="text-[10px] text-surface-500 block mt-1">
                    {srv.toolsCount} herramientas
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {currentServerInfo && (
          <div className="p-3 rounded-xl bg-surface-950/70 border border-white/[0.06] text-xs text-surface-300">
            <span className="text-[10px] font-mono text-surface-400 uppercase block mb-0.5">
              Descripción del Servidor
            </span>
            {currentServerInfo.description}
          </div>
        )}

        <form onSubmit={handleExecute} className="space-y-4">
          {/* Target Project Workspace */}
          {projects.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-surface-400 uppercase tracking-wider block">
                Workspace de Proyecto en Antigravity
              </label>
              <select
                value={selectedProjectPath}
                onChange={(e) => setSelectedProjectPath(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-950 border border-white/10 text-xs text-surface-200 focus:outline-hidden focus:border-cyan-500 font-mono"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.localPath}>
                    {p.name} ({p.localPath})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Available Tools */}
          {currentServerInfo && currentServerInfo.tools.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-surface-400 uppercase tracking-wider block">
                Herramienta Específica (Opcional)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {currentServerInfo.tools.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTool(selectedTool === t ? "" : t)}
                    className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border transition-all ${
                      selectedTool === t
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/60"
                        : "bg-surface-900/60 text-surface-400 border-white/[0.06] hover:text-surface-200"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Direct Instruction / Command */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-surface-400 uppercase tracking-wider block">
              Directiva Operativa o Parámetros
            </label>
            <textarea
              rows={4}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Escribe la instrucción que el agente Antigravity ejecutará a través de esta herramienta o workspace..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-950 border border-white/10 text-xs text-surface-200 placeholder:text-surface-600 focus:outline-hidden focus:border-cyan-500 font-mono resize-none"
            />
          </div>

          {/* Feedback Result */}
          {executionResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                executionResult.success
                  ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
                  : "bg-rose-950/40 border-rose-800/60 text-rose-300"
              }`}
            >
              {executionResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              )}
              <div className="space-y-1">
                <p className="font-medium">{executionResult.message}</p>
                {executionResult.details?.directiveResult?.directiveFilePath && (
                  <p className="text-[10px] font-mono opacity-80">
                    Archivo de directiva: {executionResult.details.directiveResult.directiveFilePath}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-surface-400 hover:text-surface-200 transition-colors"
            >
              Cerrar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-medium transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Despachando..." : "Ejecutar Vía MCP"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
