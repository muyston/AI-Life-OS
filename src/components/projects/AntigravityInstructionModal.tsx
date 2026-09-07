"use client";

import { useState } from "react";
import { 
  X, 
  Send, 
  CheckCircle2, 
  Terminal, 
  Copy, 
  Check, 
  FolderGit2, 
  AlertTriangle 
} from "lucide-react";
import { AntigravityProjectDetails } from "@/lib/types";

interface AntigravityInstructionModalProps {
  isOpen: boolean;
  project: AntigravityProjectDetails | null;
  onClose: () => void;
  onInstructionSent?: () => void;
}

export function AntigravityInstructionModal({
  isOpen,
  project,
  onClose,
  onInstructionSent,
}: AntigravityInstructionModalProps) {
  const [instruction, setInstruction] = useState("");
  const [createTask, setCreateTask] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !project) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim()) {
      setErrorMessage("Por favor, introduce una directiva o tarea para el workspace.");
      return;
    }

    try {
      setIsSending(true);
      setErrorMessage(null);
      setFeedback(null);

      const res = await fetch("/api/antigravity/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectPath: project.localPath,
          instruction: instruction.trim(),
          category: project.category,
          createTask,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback(data.message || "Directiva despachada con exito al workspace.");
        setInstruction("");
        if (onInstructionSent) onInstructionSent();
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setErrorMessage(data.error || "Fallo al procesar la directiva.");
      }
    } catch {
      setErrorMessage("Error de comunicacion al despachar la directiva a Antigravity.");
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyPrompt = () => {
    if (!instruction.trim()) return;
    navigator.clipboard.writeText(instruction.trim());
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-surface-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-2xl rounded-2xl flex flex-col border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between gap-4 bg-surface-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-accent-950/80 border border-accent-800/80 text-accent-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-surface-400 block">
                Canal de Interaccion Bidireccional
              </span>
              <h2 className="text-base font-semibold text-surface-100">
                Despachar Directiva a Antigravity
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-surface-400 hover:text-surface-200 hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Messages */}
        {feedback && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-surface-900 border border-brand-800/80 text-xs text-surface-200 flex items-center gap-2 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSend} className="p-5 sm:p-6 space-y-4 text-xs">
          {/* Target Workspace Info */}
          <div className="p-3.5 rounded-xl bg-surface-900/60 border border-white/[0.06] space-y-1">
            <div className="flex items-center justify-between text-[11px] text-surface-400 font-mono">
              <span className="flex items-center gap-1.5 text-surface-200 font-medium">
                <FolderGit2 className="w-3.5 h-3.5 text-accent-400" />
                {project.name}
              </span>
              <span className="uppercase text-[9px] px-1.5 py-0.5 rounded bg-surface-950 border border-white/10 text-surface-400">
                {project.category}
              </span>
            </div>
            <p className="text-[10px] font-mono text-surface-400 truncate">
              {project.localPath}
            </p>
          </div>

          {/* Directive Text Area */}
          <div className="space-y-1.5">
            <label className="text-surface-200 font-medium block">
              Directiva / Prompt Tecnico para el Workspace
            </label>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Escribe la instruccion que debe procesar Antigravity (ej. 'Auditar rutas en src/app/api, agregar tests unitarios para autenticacion y verificar tipado estricto')..."
              rows={6}
              className="w-full rounded-xl bg-surface-950/80 border border-white/10 p-3.5 text-surface-100 placeholder:text-surface-600 focus:outline-none focus:border-accent-500 font-mono text-xs leading-relaxed resize-none"
            />
          </div>

          {/* Options */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-surface-300 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={createTask}
                onChange={(e) => setCreateTask(e.target.checked)}
                className="w-4 h-4 rounded bg-surface-900 border-white/20 text-accent-500 focus:ring-0 focus:ring-offset-0"
              />
              <span>Crear y sincronizar tarea vinculada en AI Life OS</span>
            </label>

            <button
              type="button"
              onClick={handleCopyPrompt}
              disabled={!instruction.trim()}
              className="flex items-center gap-1 text-[11px] text-accent-400 hover:text-accent-300 font-mono disabled:opacity-40"
            >
              {copiedPrompt ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedPrompt ? "Copiado" : "Copiar Prompt"}</span>
            </button>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-white/[0.08] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-surface-950 hover:bg-surface-900 text-surface-300 border border-white/[0.08] rounded-xl text-xs transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSending || !instruction.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-accent-600 hover:bg-accent-500 text-white rounded-xl text-xs font-medium transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? "Despachando..." : "Despachar a Workspace"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
