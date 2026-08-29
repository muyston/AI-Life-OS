"use client";

import { useState, useEffect, useCallback } from "react";
import { IdeaEntity, IdeaAssignedAgent, IdeaCategory } from "@/lib/types";
import { IdeaInput } from "@/components/ideas/IdeaInput";
import { IdeaList } from "@/components/ideas/IdeaList";
import { IdeaDetail } from "@/components/ideas/IdeaDetail";
import { 
  Inbox, 
  Sparkles, 
  RefreshCw, 
  ArrowLeft, 
  Layers,
  Activity
} from "lucide-react";

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<IdeaEntity[]>([]);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  const fetchIdeas = useCallback(async (selectIdAfterLoad?: string) => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/ideas");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setIdeas(json.data);
        if (selectIdAfterLoad) {
          setSelectedIdeaId(selectIdAfterLoad);
        } else if (json.data.length > 0 && !selectedIdeaId) {
          setSelectedIdeaId(json.data[0].id);
        }
      }
    } catch (err) {
      console.error("Error al cargar ideas:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedIdeaId]);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  const handleCreateIdea = async (
    rawContent: string, 
    assignedAgent?: IdeaAssignedAgent, 
    category?: IdeaCategory
  ) => {
    try {
      setIsProcessing(true);
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawContent, assignedAgent, category }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        // Recargar lista y seleccionar la idea recien creada
        await fetchIdeas(json.data.id);
        setShowMobileDetail(true);
      }
    } catch (err) {
      console.error("Error al crear idea:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReanalyze = async (ideaId: string, assignedAgent?: IdeaAssignedAgent) => {
    try {
      setIsProcessing(true);
      const res = await fetch(`/api/ideas/${ideaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reanalyze: true, assignedAgent }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setIdeas((prev) =>
          prev.map((item) => (item.id === ideaId ? json.data : item))
        );
      }
    } catch (err) {
      console.error("Error al re-analizar idea:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (ideaId: string) => {
    try {
      setIsProcessing(true);
      const res = await fetch(`/api/ideas/${ideaId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        const remaining = ideas.filter((item) => item.id !== ideaId);
        setIdeas(remaining);
        if (selectedIdeaId === ideaId) {
          setSelectedIdeaId(remaining[0]?.id || null);
          setShowMobileDetail(false);
        }
      }
    } catch (err) {
      console.error("Error al eliminar idea:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectIdea = (idea: IdeaEntity) => {
    setSelectedIdeaId(idea.id);
    setShowMobileDetail(true);
  };

  const selectedIdea = ideas.find((i) => i.id === selectedIdeaId) || null;

  return (
    <div className="flex flex-col h-[calc(100vh)] overflow-hidden bg-surface-950">
      {/* Header */}
      <header className="h-16 border-b border-surface-800 bg-surface-900/60 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-surface-800 border border-surface-700 flex items-center justify-center text-brand-500">
            <Inbox className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-surface-50 tracking-tight flex items-center gap-2">
              <span>Smart Inbox / Idea Lab</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-800 text-surface-300 border border-surface-700">
                Modulo /ideas
              </span>
            </h1>
            <p className="text-[11px] text-surface-400">
              Captura notas en bruto y delega su analisis, investigacion y conversion a los agentes del sistema.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showMobileDetail && (
            <button
              onClick={() => setShowMobileDetail(false)}
              className="md:hidden flex items-center gap-1 px-2.5 py-1.5 bg-surface-800 border border-surface-700 rounded text-xs text-surface-200"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a lista</span>
            </button>
          )}

          <button
            onClick={() => fetchIdeas()}
            disabled={isLoading || isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-800 hover:bg-surface-700 border border-surface-700 rounded text-xs font-medium text-surface-200 transition-colors disabled:opacity-50"
            title="Refrescar bandeja"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-surface-400 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refrescar</span>
          </button>
        </div>
      </header>

      {/* Main 2-Panel Content */}
      <div className="flex-1 flex min-h-0 p-4 md:p-6 gap-4 md:gap-6 overflow-hidden">
        {/* Left Panel: Quick Input + Ideas List */}
        <div
          className={`w-full md:w-[420px] lg:w-[480px] shrink-0 flex flex-col gap-4 min-h-0 h-full ${
            showMobileDetail ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Quick Capture Input */}
          <IdeaInput
            onSubmit={handleCreateIdea}
            isProcessing={isProcessing}
          />

          {/* Ideas List */}
          <div className="flex-1 min-h-0">
            <IdeaList
              ideas={ideas}
              selectedIdeaId={selectedIdeaId}
              onSelectIdea={handleSelectIdea}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Right Panel: Detail View & Actions */}
        <div
          className={`flex-1 min-w-0 min-h-0 h-full ${
            !showMobileDetail ? "hidden md:flex" : "flex"
          }`}
        >
          <IdeaDetail
            idea={selectedIdea}
            onReanalyze={handleReanalyze}
            onDelete={handleDelete}
            onConverted={() => fetchIdeas(selectedIdeaId || undefined)}
            isProcessing={isProcessing}
          />
        </div>
      </div>
    </div>
  );
}
