"use client";

import { useState, useEffect } from "react";
import { ProjectEntity } from "@/lib/types";
import { ProjectModal } from "@/components/projects/ProjectModal";
import { 
  FolderKanban, 
  Plus, 
  ExternalLink, 
  GitBranch, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Edit3 
} from "lucide-react";
import { format } from "date-fns";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectEntity | null>(null);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (data.success) {
        setProjects(data.data);
      }
    } catch (err) {
      console.error("Error al cargar proyectos:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

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

  const priorityColors = {
    CRITICAL: "text-red-400 bg-red-950/60 border-red-800/80",
    HIGH: "text-amber-400 bg-amber-950/60 border-amber-800/80",
    MEDIUM: "text-blue-400 bg-blue-950/60 border-blue-800/80",
    LOW: "text-surface-400 bg-surface-800 border-surface-700",
  };

  const statusLabels = {
    ACTIVE: "Activo",
    ON_HOLD: "En Pausa",
    COMPLETED: "Completado",
    ARCHIVED: "Archivado",
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-surface-800 flex-wrap gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-surface-400 block">
            Nucleo de Memoria Estructurada
          </span>
          <h1 className="text-xl font-bold tracking-tight text-surface-100 flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-accent-500" />
            Gestion de Proyectos
          </h1>
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedProject(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-accent-600 hover:bg-accent-500 text-white rounded text-xs font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Nuevo Proyecto
        </button>
      </div>

      {/* Projects List Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-surface-400">
          Cargando proyectos del sistema...
        </div>
      ) : projects.length === 0 ? (
        <div className="py-16 text-center text-xs text-surface-400 bg-surface-900 border border-surface-800 rounded-lg space-y-3">
          <FolderKanban className="w-8 h-8 text-surface-600 mx-auto" />
          <p>No tienes proyectos registrados aún.</p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-1.5 bg-surface-800 hover:bg-surface-700 text-surface-200 rounded text-xs transition-colors"
          >
            Registrar Primer Proyecto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => {
            const totalTasks = project.tasksCount?.total || 0;
            const completedTasks = project.tasksCount?.completed || 0;
            const pendingTasks = project.tasksCount?.pending || 0;
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            return (
              <div
                key={project.id}
                className="bg-surface-900 border border-surface-800 rounded-lg p-5 flex flex-col justify-between hover:border-surface-700 transition-all shadow-sm space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-surface-100">
                      {project.name}
                    </h3>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                        priorityColors[project.priority as keyof typeof priorityColors] || priorityColors.MEDIUM
                      }`}
                    >
                      {project.priority}
                    </span>
                  </div>

                  {project.description && (
                    <p className="text-xs text-surface-400 mt-2 line-clamp-2">
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

                <div className="space-y-3 pt-3 border-t border-surface-800">
                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-surface-400">
                      <span>Progreso de Tareas</span>
                      <span className="font-mono">{completedTasks}/{totalTasks} ({progress}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-950 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-surface-400 pt-1">
                    <span className="font-mono">
                      Estado: {statusLabels[project.status as keyof typeof statusLabels] || project.status}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProject(project);
                          setIsModalOpen(true);
                        }}
                        className="p-1 rounded hover:bg-surface-800 text-surface-400 hover:text-surface-200 transition-colors"
                        title="Editar proyecto"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProject(project.id)}
                        className="p-1 rounded hover:bg-surface-800 text-surface-400 hover:text-red-400 transition-colors"
                        title="Eliminar proyecto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
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
