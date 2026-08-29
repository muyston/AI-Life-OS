"use client";

import { useState } from "react";
import { IdeaEntity, IdeaCategory, IdeaStatus, IdeaAssignedAgent } from "@/lib/types";
import { 
  Search, 
  Clock, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Code2, 
  Briefcase, 
  TrendingUp, 
  Calendar, 
  FileText,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface IdeaListProps {
  ideas: IdeaEntity[];
  selectedIdeaId: string | null;
  onSelectIdea: (idea: IdeaEntity) => void;
  isLoading: boolean;
}

export function IdeaList({
  ideas,
  selectedIdeaId,
  onSelectIdea,
  isLoading,
}: IdeaListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  const agentConfig: Record<string, { label: string; icon: any; color: string }> = {
    strategy: { label: "Strategy", icon: TrendingUp, color: "text-indigo-400 bg-indigo-950/50 border-indigo-800/60" },
    dev: { label: "Dev", icon: Code2, color: "text-cyan-400 bg-cyan-950/50 border-cyan-800/60" },
    sales: { label: "Sales", icon: Briefcase, color: "text-emerald-400 bg-emerald-950/50 border-emerald-800/60" },
    operations: { label: "Operations", icon: Calendar, color: "text-amber-400 bg-amber-950/50 border-amber-800/60" },
    general: { label: "General", icon: FileText, color: "text-surface-300 bg-surface-800/60 border-surface-700/60" },
  };

  const categoryLabels: Record<string, { label: string; color: string }> = {
    tech: { label: "Tech", color: "text-cyan-400" },
    business: { label: "Business", color: "text-emerald-400" },
    personal: { label: "Personal", color: "text-amber-400" },
    academic: { label: "Academic", color: "text-purple-400" },
    performance: { label: "Performance", color: "text-rose-400" },
    general: { label: "General", color: "text-surface-400" },
  };

  const filteredIdeas = ideas.filter((idea) => {
    if (statusFilter !== "ALL" && idea.status !== statusFilter) return false;
    if (categoryFilter !== "ALL" && idea.category !== categoryFilter) return false;
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      const contentMatch = idea.rawContent.toLowerCase().includes(query);
      const summaryMatch = idea.structuredAnalysis?.executiveSummary?.toLowerCase().includes(query) || false;
      return contentMatch || summaryMatch;
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-surface-900 border border-surface-800 rounded-lg overflow-hidden">
      {/* Search & Filter Header */}
      <div className="p-3 border-b border-surface-800 space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar notas o análisis..."
            className="w-full pl-8 pr-3 py-1.5 bg-surface-950 border border-surface-800 rounded text-xs text-surface-100 placeholder:text-surface-400 focus:outline-none focus:border-surface-700"
          />
        </div>

        <div className="flex items-center justify-between gap-2 text-xs">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-surface-950 p-0.5 rounded border border-surface-800 text-[11px]">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-2 py-1 rounded transition-colors ${
                statusFilter === "ALL"
                  ? "bg-surface-800 text-surface-100 font-medium"
                  : "text-surface-400 hover:text-surface-200"
              }`}
            >
              Todas ({ideas.length})
            </button>
            <button
              onClick={() => setStatusFilter("PROCESSING")}
              className={`px-2 py-1 rounded transition-colors ${
                statusFilter === "PROCESSING"
                  ? "bg-surface-800 text-surface-100 font-medium"
                  : "text-surface-400 hover:text-surface-200"
              }`}
            >
              En Proceso
            </button>
            <button
              onClick={() => setStatusFilter("COMPLETED")}
              className={`px-2 py-1 rounded transition-colors ${
                statusFilter === "COMPLETED"
                  ? "bg-surface-800 text-surface-100 font-medium"
                  : "text-surface-400 hover:text-surface-200"
              }`}
            >
              Completadas
            </button>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1">
            <Filter className="w-3 h-3 text-surface-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-surface-950 border border-surface-800 rounded px-2 py-1 text-[11px] text-surface-300 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Todo Dominio</option>
              <option value="tech">Tech</option>
              <option value="business">Business</option>
              <option value="personal">Personal</option>
              <option value="academic">Academic</option>
              <option value="performance">Performance</option>
              <option value="general">General</option>
            </select>
          </div>
        </div>
      </div>

      {/* Idea List Items */}
      <div className="flex-1 overflow-y-auto divide-y divide-surface-800/60 min-h-[300px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48 text-surface-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-surface-400" />
            <span className="text-xs">Cargando Smart Inbox...</span>
          </div>
        ) : filteredIdeas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-surface-400 p-6 text-center">
            <FileText className="w-6 h-6 text-surface-400 mb-2" />
            <p className="text-xs font-medium text-surface-300">No se encontraron ideas</p>
            <p className="text-[11px] text-surface-400 mt-1">
              Introduce una nueva nota en el panel superior para procesarla.
            </p>
          </div>
        ) : (
          filteredIdeas.map((idea) => {
            const isSelected = selectedIdeaId === idea.id;
            const agent = agentConfig[idea.assignedAgent] || agentConfig.general;
            const AgentIcon = agent.icon;
            const categoryInfo = categoryLabels[idea.category] || categoryLabels.general;

            const firstLine = idea.rawContent.split("\n")[0] || "Nota sin titulo";
            const previewText = firstLine.length > 80 ? firstLine.slice(0, 77) + "..." : firstLine;

            const createdDate = new Date(idea.createdAt);

            return (
              <div
                key={idea.id}
                onClick={() => onSelectIdea(idea)}
                className={`p-3 cursor-pointer transition-all ${
                  isSelected
                    ? "bg-surface-800/90 border-l-2 border-brand-500 pl-2.5 shadow-sm"
                    : "hover:bg-surface-800/40 bg-surface-900"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {/* Badge de Agente */}
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-mono font-medium ${agent.color}`}>
                      <AgentIcon className="w-2.5 h-2.5" />
                      <span>{agent.label}</span>
                    </span>

                    {/* Dominio */}
                    <span className={`text-[10px] font-mono font-medium ${categoryInfo.color}`}>
                      {categoryInfo.label}
                    </span>
                  </div>

                  {/* Estado */}
                  <div className="flex items-center gap-1 text-[10px] font-mono">
                    {idea.status === "PROCESSING" && (
                      <span className="flex items-center gap-1 text-amber-400">
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        <span>Procesando</span>
                      </span>
                    )}
                    {idea.status === "COMPLETED" && (
                      <span className="flex items-center gap-1 text-brand-500">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>Completada</span>
                      </span>
                    )}
                    {idea.status === "FAILED" && (
                      <span className="flex items-center gap-1 text-rose-400">
                        <AlertCircle className="w-2.5 h-2.5" />
                        <span>Fallo</span>
                      </span>
                    )}
                    {idea.status === "RAW" && (
                      <span className="text-surface-400">Bruto</span>
                    )}
                  </div>
                </div>

                <p className="text-xs font-medium text-surface-100 line-clamp-2 leading-relaxed">
                  {previewText}
                </p>

                <div className="flex items-center justify-between mt-2 pt-1 text-[10px] text-surface-400 border-t border-surface-800/40 font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{format(createdDate, "dd MMM HH:mm", { locale: es })}</span>
                  </span>

                  {idea.structuredAnalysis?.recommendedActions && (
                    <span className="text-surface-400">
                      {idea.structuredAnalysis.recommendedActions.length} acciones sugeridas
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
