"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { 
  Sparkles, 
  CornerDownLeft, 
  Send, 
  Cpu, 
  Layers, 
  Trash2,
  Loader2,
  Bot
} from "lucide-react";
import { IdeaAssignedAgent, IdeaCategory } from "@/lib/types";

interface IdeaInputProps {
  onSubmit: (rawContent: string, assignedAgent?: IdeaAssignedAgent, category?: IdeaCategory) => Promise<void>;
  isProcessing: boolean;
}

export function IdeaInput({ onSubmit, isProcessing }: IdeaInputProps) {
  const [content, setContent] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<IdeaAssignedAgent | "auto">("auto");
  const [selectedCategory, setSelectedCategory] = useState<IdeaCategory | "auto">("auto");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async () => {
    if (!content.trim() || isProcessing) return;
    const textToSend = content;
    setContent("");
    
    await onSubmit(
      textToSend,
      selectedAgent === "auto" ? undefined : selectedAgent,
      selectedCategory === "auto" ? undefined : selectedCategory
    );
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="bg-surface-900 border border-surface-800 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-brand-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-surface-300">
            Captura Rapida / Smart Inbox
          </span>
        </div>
        <span className="text-[11px] text-surface-400 font-mono hidden sm:inline-flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-surface-800 border border-surface-700 rounded text-[10px]">Cmd / Ctrl + Enter</kbd>
          <span>para procesar</span>
        </span>
      </div>

      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Introduce una idea, requerimiento técnico, oportunidad comercial o nota en bruto..."
        rows={3}
        disabled={isProcessing}
        className="w-full bg-surface-950/80 border border-surface-800 rounded-md p-3 text-sm text-surface-100 placeholder:text-surface-400 focus:outline-none focus:border-brand-500/80 focus:ring-1 focus:ring-brand-500/50 resize-none transition-colors"
      />

      <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-2 border-t border-surface-800/80">
        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de Agente Especialista */}
          <div className="flex items-center gap-1.5 text-xs text-surface-400 bg-surface-950 border border-surface-800 rounded px-2 py-1">
            <Cpu className="w-3.5 h-3.5 text-surface-400" />
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value as IdeaAssignedAgent | "auto")}
              disabled={isProcessing}
              className="bg-transparent text-surface-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="auto" className="bg-surface-900 text-surface-200">Agente: Auto-Clasificar</option>
              <option value="strategy" className="bg-surface-900 text-surface-200">Especialista: Strategy</option>
              <option value="dev" className="bg-surface-900 text-surface-200">Especialista: Dev & Arch</option>
              <option value="sales" className="bg-surface-900 text-surface-200">Especialista: Sales & B2B</option>
              <option value="operations" className="bg-surface-900 text-surface-200">Especialista: Operations</option>
              <option value="general" className="bg-surface-900 text-surface-200">Especialista: General</option>
            </select>
          </div>

          {/* Selector de Categoria opcional */}
          <div className="flex items-center gap-1.5 text-xs text-surface-400 bg-surface-950 border border-surface-800 rounded px-2 py-1">
            <Layers className="w-3.5 h-3.5 text-surface-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as IdeaCategory | "auto")}
              disabled={isProcessing}
              className="bg-transparent text-surface-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="auto" className="bg-surface-900 text-surface-200">Dominio: Auto</option>
              <option value="tech" className="bg-surface-900 text-surface-200">Tech</option>
              <option value="business" className="bg-surface-900 text-surface-200">Business</option>
              <option value="personal" className="bg-surface-900 text-surface-200">Personal</option>
              <option value="academic" className="bg-surface-900 text-surface-200">Academic</option>
              <option value="performance" className="bg-surface-900 text-surface-200">Performance</option>
              <option value="general" className="bg-surface-900 text-surface-200">General</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {content.trim().length > 0 && (
            <button
              type="button"
              onClick={() => setContent("")}
              disabled={isProcessing}
              className="p-1.5 text-surface-400 hover:text-surface-200 hover:bg-surface-800 rounded transition-colors"
              title="Limpiar texto"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!content.trim() || isProcessing}
            className="flex items-center gap-2 px-4 py-2 rounded text-xs font-medium bg-brand-600 hover:bg-brand-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Analizando...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Procesar Idea</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
