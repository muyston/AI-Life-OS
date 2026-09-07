"use client";

import { useState, useEffect, useCallback } from "react";
import { ProjectEntity, ProjectCategory, ProjectStatus } from "@/lib/types";
import { ProjectModal } from "@/components/projects/ProjectModal";
import { AntigravityConsole } from "@/components/projects/AntigravityConsole";
import { VoiceInputButton } from "@/components/voice/VoiceInputButton";
import { 
  FolderKanban, 
  Plus, 
  ExternalLink, 
  GitBranch, 
  Trash2, 
  Edit3,
  LayoutGrid,
  Kanban,
  Code2,
  Briefcase,
  GraduationCap,
  Dumbbell,
  User,
  CheckCircle2,
  Layers,
  RefreshCw,
  Laptop,
  Terminal
} from "lucide-react";

type ViewMode = "grid" | "kanban" | "antigravity";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectEntity[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncingAntigravity, setIsSyncingAntigravity] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectEntity | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      const url = selectedCategory === "ALL" 
        ? "/api/projects" 
        : `/api/projects?category=${selectedCategory}`;
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setProjects(data.data);
      }
    } catch (err) {
      console.error("Error al cargar proyectos:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleSyncAntigravity = async () => {
    try {
      setIsSyncingAntigravity(true);
      setSyncFeedback(null);
      const res = await fetch("/api/projects/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (data.success) {
        setSyncFeedback(
          data.message || `Sincronizados ${data.data?.projectsSynced || 0} proyectos de Antigravity.`
        );
        await loadProjects();
      } else {
        setSyncFeedback("Error al sincronizar proyectos con Antigravity.");
      }
    } catch {
      setSyncFeedback("Error de conexión al sincronizar con Antigravity.");
    } finally {
      setIsSyncingAntigravity(false);
    }
  };

  const handleSaveProject = async (projectData: Partial<ProjectEntity>) => {
    const url = projectData.id ? `/api/projects/${projectData.id}` : "/api/projects";
    const method = projectData.id ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(projectData),
    });

    if (res.ok) {
      await loadProjects();
    } else {
      const errorData = await res.json();
      throw new Error(errorData.error || "Error al procesar el proyecto");
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("¿Deseas eliminar este proyecto permanentemente?")) return;
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error("Error al eliminar proyecto:", err);
    }
  };

  const categories = [
    { id: "ALL", label: "Todos", icon: Layers, count: projects.length },
    { id: "tech", label: "Tech & SaaS", icon: Code2, desc: "Antigravity, PPT, SaaS" },
    { id: "business", label: "Business & Ventas", icon: Briefcase, desc: "Lanzing, Clientes" },
    { id: "academic", label: "Académico", icon: GraduationCap, desc: "Ingeniería UPM, MotoStudent" },
    { id: "performance", label: "Performance", icon: Dumbbell, desc: "Pádel, Gimnasio, Hábitos" },
    { id: "personal", label: "Personal", icon: User, desc: "Vida, Finanzas" },
  ];

  const categoryColors: Record<ProjectCategory, string> = {
    tech: "text-cyan-400 bg-cyan-950/60 border-cyan-800/80",
    business: "text-emerald-400 bg-emerald-950/60 border-emerald-800/80",
    academic: "text-indigo-400 bg-indigo-950/60 border-indigo-800/80",
    performance: "text-amber-400 bg-amber-950/60 border-amber-800/80",
    personal: "text-purple-400 bg-purple-950/60 border-purple-800/80",
  };

  const priorityColors = {
    CRITICAL: "text-rose-300 bg-rose-950/60 border-rose-800/80",
    HIGH: "text-amber-300 bg-amber-950/60 border-amber-800/80",
    MEDIUM: "text-blue-300 bg-blue-950/60 border-blue-800/80",
    LOW: "text-surface-400 bg-surface-900 border-white/[0.08]",
  };

  const statusLabels: Record<ProjectStatus, string> = {
    ACTIVE: "Activo",
    ON_HOLD: "En Pausa",
    COMPLETED: "Completado",
    ARCHIVED: "Archivado",
  };

  const kanbanColumns: { status: ProjectStatus; title: string; color: string }[] = [
    { status: "ACTIVE", title: "Proyectos Activos", color: "border-brand-500/50 text-brand-400" },
    { status: "ON_HOLD", title: "En Pausa / Standby", color: "border-amber-500/50 text-amber-400" },
    { status: "COMPLETED", title: "Completados", color: "border-blue-500/50 text-blue-400" },
    { status: "ARCHIVED", title: "Archivados", color: "border-surface-700 text-surface-400" },
  ];

  const renderProjectCard = (project: ProjectEntity) => {
    const totalTasks = project.tasksCount?.total || 0;
    const completedTasks = project.tasksCount?.completed || 0;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const categoryBadgeClass = categoryColors[project.category] || categoryColors.tech;

    return (
      <div
        key={project.id}
        className="glass-card rounded-2xl p-5 flex flex-col justify-between hover:border-white/20 transition-all shadow-md space-y-4"
      >
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded-md border uppercase inline-block ${categoryBadgeClass}`}>
                  {project.category || "tech"}
                </span>
                {project.repoUrl && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewMode("antigravity");
                    }}
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded-md border border-white/10 bg-surface-950 text-surface-400 hover:text-accent-300 hover:border-accent-500/40 flex items-center gap-1 transition-colors cursor-pointer"
                    title="Abrir consola Antigravity en vivo"
                  >
                    <Terminal className="w-2.5 h-2.5 text-accent-400" />
                    Antigravity
                  </button>
                )}
              </div>
              <h3 className="text-sm font-semibold text-surface-100 truncate">
                {project.name}
              </h3>
            </div>
            <span
              className={`text-[9px] font-mono px-2 py-0.5 rounded-md border uppercase shrink-0 ${
                priorityColors[project.priority as keyof typeof priorityColors] || priorityColors.MEDIUM
              }`}
            >
              {project.priority}
            </span>
          </div>

          {project.description && (
            <p className="text-xs text-surface-400 mt-2 line-clamp-2 leading-relaxed break-words">
              {project.description}
            </p>
          )}

          {project.repoUrl && (
            <div className="mt-3">
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] text-accent-400 hover:text-accent-300 font-mono"
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span className="truncate max-w-[200px]">
                  {project.repoUrl.replace("https://github.com/", "")}
                </span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        <div className="space-y-3 pt-3 border-t border-white/[0.06]">
          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-surface-400">
              <span>Hitos y Tareas</span>
              <span className="font-mono">{completedTasks}/{totalTasks} ({progress}%)</span>
            </div>
            <div className="w-full h-1.5 bg-surface-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-surface-400 pt-1">
            <span className="font-mono text-[10px]">
              Estado: {statusLabels[project.status as keyof typeof statusLabels] || project.status}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedProject(project);
                  setIsModalOpen(true);
                }}
                className="p-1.5 rounded-lg hover:bg-white/5 text-surface-400 hover:text-surface-200 transition-colors"
                title="Editar proyecto"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleDeleteProject(project.id)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-surface-400 hover:text-rose-400 transition-colors"
                title="Eliminar proyecto"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] flex-wrap gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-surface-400 block">
            Núcleo de Memoria Estructurada Multidominio & Workspaces
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-surface-50 flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-accent-500" />
            Gestión de Proyectos & Workspaces
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <VoiceInputButton
            variant="pill"
            onActionCompleted={loadProjects}
            title="Dictar nuevo proyecto o tarea"
          />

          {/* Antigravity Sync Button */}
          <button
            type="button"
            onClick={handleSyncAntigravity}
            disabled={isSyncingAntigravity}
            className="flex items-center gap-1.5 px-3 py-2 bg-surface-900 hover:bg-surface-800 text-surface-200 border border-white/10 rounded-xl text-xs transition-colors disabled:opacity-50"
            title="Escanear y sincronizar workspaces de Antigravity"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-accent-400 ${isSyncingAntigravity ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{isSyncingAntigravity ? "Sincronizando..." : "Sincronizar Antigravity"}</span>
          </button>

          {/* View mode switcher */}
          <div className="flex items-center bg-surface-950 border border-white/10 rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ${
                viewMode === "grid" 
                  ? "bg-surface-800 text-surface-100 font-medium" 
                  : "text-surface-400 hover:text-surface-200"
              }`}
              title="Vista Cuadrícula"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ${
                viewMode === "kanban" 
                  ? "bg-surface-800 text-surface-100 font-medium" 
                  : "text-surface-400 hover:text-surface-200"
              }`}
              title="Vista Tablero Kanban"
            >
              <Kanban className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("antigravity")}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors ${
                viewMode === "antigravity" 
                  ? "bg-accent-600/30 text-accent-300 border border-accent-500/40 font-medium" 
                  : "text-surface-400 hover:text-surface-200"
              }`}
              title="Consola Antigravity en Vivo"
            >
              <Terminal className="w-3.5 h-3.5 text-accent-400" />
              <span className="hidden sm:inline">Antigravity</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedProject(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-accent-600 hover:bg-accent-500 text-white rounded-xl text-xs font-medium transition-all shadow-md active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Proyecto</span>
          </button>
        </div>
      </div>

      {/* Sync Feedback Toast */}
      {syncFeedback && (
        <div className="p-3.5 rounded-xl bg-surface-900 border border-brand-800/60 text-xs text-surface-200 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setSyncFeedback(null)}
            className="text-[11px] text-surface-400 hover:text-surface-200 font-mono"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Category Tabs (Ocultos en modo Consola Antigravity para mantener el foco institucional) */}
      {viewMode !== "antigravity" && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/[0.06]">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap border ${
                  isSelected
                    ? "bg-surface-800 border-accent-500 text-surface-50 shadow-xs"
                    : "bg-surface-950 border-white/[0.06] text-surface-400 hover:text-surface-200 hover:bg-surface-900"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-accent-400" : "text-surface-400"}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Content Rendering */}
      {viewMode === "antigravity" ? (
        <AntigravityConsole onSyncTriggered={loadProjects} />
      ) : isLoading ? (
        <div className="py-16 text-center text-xs text-surface-400 glass-card rounded-2xl">
          Cargando proyectos del sistema...
        </div>
      ) : projects.length === 0 ? (
        <div className="py-16 text-center text-xs text-surface-400 glass-card rounded-2xl space-y-3">
          <FolderKanban className="w-8 h-8 text-surface-600 mx-auto" />
          <p>No tienes proyectos registrados en esta categoría aún.</p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleSyncAntigravity}
              className="px-3.5 py-2 bg-surface-900 hover:bg-surface-800 text-surface-200 border border-white/10 rounded-xl text-xs transition-colors"
            >
              Sincronizar Workspaces
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-2 bg-accent-600 hover:bg-accent-500 text-white rounded-xl text-xs transition-colors shadow-sm"
            >
              Nuevo Proyecto
            </button>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => renderProjectCard(project))}
        </div>
      ) : (
        /* Kanban View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {kanbanColumns.map((col) => {
            const colProjects = projects.filter((p) => p.status === col.status);
            return (
              <div
                key={col.status}
                className="glass-panel rounded-2xl p-4 space-y-3 flex flex-col border border-white/10"
              >
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                  <h3 className={`text-xs font-semibold uppercase tracking-wider ${col.color}`}>
                    {col.title}
                  </h3>
                  <span className="text-[10px] font-mono text-surface-400 bg-surface-950 px-2 py-0.5 rounded-md border border-white/[0.06]">
                    {colProjects.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)]">
                  {colProjects.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-surface-500">
                      Sin proyectos
                    </div>
                  ) : (
                    colProjects.map((project) => renderProjectCard(project))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Project Modal */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProject(null);
        }}
        onSave={handleSaveProject}
        project={selectedProject}
      />
    </div>
  );
}
