"use client";

import { useState, useEffect } from "react";
import { TaskEntity, ProjectEntity, TaskStatus, PriorityLevel, TaskType } from "@/lib/types";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskModal } from "@/components/tasks/TaskModal";
import { 
  CheckSquare, 
  Plus, 
  Filter, 
  Search, 
  Layers,
  ArrowUpDown
} from "lucide-react";

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskEntity[]>([]);
  const [projects, setProjects] = useState<ProjectEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskEntity | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [tasksRes, projectsRes] = await Promise.all([
        fetch("/api/tasks?status=ALL"),
        fetch("/api/projects"),
      ]);

      const tasksData = await tasksRes.json();
      const projectsData = await projectsRes.json();

      if (tasksData.success) setTasks(tasksData.data);
      if (projectsData.success) setProjects(projectsData.data);
    } catch (err) {
      console.error("Error al cargar tareas:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusToggle = async (taskId: string, currentStatus: string) => {
    const nextStatus: TaskStatus = currentStatus === "COMPLETED" ? "PENDING" : "COMPLETED";
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t))
        );
      }
    } catch (err) {
      console.error("Error al actualizar estado de tarea:", err);
    }
  };

  const handleSaveTask = async (taskData: Partial<TaskEntity>) => {
    const url = taskData.id ? `/api/tasks/${taskData.id}` : "/api/tasks";
    const method = taskData.id ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskData),
    });

    if (res.ok) {
      await loadData();
    } else {
      const errorData = await res.json();
      throw new Error(errorData.error || "Error al guardar la tarea");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("¿Deseas eliminar esta tarea permanentemente?")) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
      }
    } catch (err) {
      console.error("Error al eliminar tarea:", err);
    }
  };

  // Filtrado reactivo en memoria
  const filteredTasks = tasks.filter((task) => {
    if (selectedStatus !== "ALL" && task.status !== selectedStatus) return false;
    if (selectedPriority !== "ALL" && task.priority !== selectedPriority) return false;
    if (selectedProjectId !== "ALL" && task.projectId !== selectedProjectId) return false;
    if (selectedType !== "ALL" && task.type !== selectedType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      const matchProject = task.project?.name.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchProject) return false;
    }
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-surface-800 flex-wrap gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-surface-400 block">
            Gestion Operativa
          </span>
          <h1 className="text-xl font-bold tracking-tight text-surface-100 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-accent-500" />
            Todas las Tareas ({tasks.length})
          </h1>
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedTask(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-accent-600 hover:bg-accent-500 text-white rounded text-xs font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Nueva Tarea
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-surface-900 border border-surface-800 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-surface-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por titulo, descripcion o proyecto..."
              className="w-full pl-9 pr-3 py-1.5 bg-surface-950 border border-surface-800 rounded text-xs text-surface-100 placeholder-surface-600 focus:outline-none focus:border-accent-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 bg-surface-950 border border-surface-800 rounded text-xs text-surface-200 focus:outline-none focus:border-accent-500"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="PENDING">Pendientes</option>
            <option value="IN_PROGRESS">En curso</option>
            <option value="COMPLETED">Completadas</option>
            <option value="CANCELLED">Canceladas</option>
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-1.5 bg-surface-950 border border-surface-800 rounded text-xs text-surface-200 focus:outline-none focus:border-accent-500"
          >
            <option value="ALL">Todas las Prioridades</option>
            <option value="URGENT">Urgente</option>
            <option value="HIGH">Alta</option>
            <option value="MEDIUM">Media</option>
            <option value="LOW">Baja</option>
          </select>

          {/* Project Filter */}
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-1.5 bg-surface-950 border border-surface-800 rounded text-xs text-surface-200 focus:outline-none focus:border-accent-500"
          >
            <option value="ALL">Todos los Proyectos</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-1.5 bg-surface-950 border border-surface-800 rounded text-xs text-surface-200 focus:outline-none focus:border-accent-500"
          >
            <option value="ALL">Todos los Tipos</option>
            <option value="NORMAL">Normal</option>
            <option value="MANUAL">Manual</option>
            <option value="RECURRING">Recurrente</option>
            <option value="AGENT_GENERATED">Generada por Agente</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-surface-400">
          Cargando tareas del sistema...
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="py-16 text-center text-xs text-surface-400 bg-surface-900 border border-surface-800 rounded-lg space-y-3">
          <CheckSquare className="w-8 h-8 text-surface-600 mx-auto" />
          <p>No se han encontrado tareas con los filtros seleccionados.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusToggle={handleStatusToggle}
              onEdit={(t) => {
                setSelectedTask(t);
                setIsModalOpen(true);
              }}
              onDelete={handleDeleteTask}
            />
          ))}
        </div>
      )}

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTask(null);
        }}
        onSave={handleSaveTask}
        task={selectedTask}
        projects={projects}
      />
    </div>
  );
}
