"use client";

import { useState, useMemo } from "react";
import { TaskEntity } from "@/lib/types";
import { useLifeOS } from "@/lib/store/life-os-store";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskModal } from "@/components/tasks/TaskModal";
import { VoiceInputButton } from "@/components/voice/VoiceInputButton";
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Layers,
  Filter,
  Radio,
  Sliders
} from "lucide-react";

export default function TasksPage() {
  const {
    tasks,
    projects,
    isLoading,
    toggleTaskStatus,
    saveTask,
    deleteTask,
    setActiveFocusTask,
    setFocusModalOpen,
    refreshAll
  } = useLifeOS();

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskEntity | null>(null);

  // Filtrado reactivo en memoria (0ms)
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
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
  }, [tasks, selectedStatus, selectedPriority, selectedProjectId, selectedType, searchQuery]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] flex-wrap gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-surface-400 block">
            Gestion Operativa de Alto Nivel
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-surface-50 flex items-center gap-2 mt-0.5">
            <CheckSquare className="w-5 h-5 text-cyan-400" />
            Todas las Tareas ({tasks.length})
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <VoiceInputButton
            variant="pill"
            onActionCompleted={refreshAll}
            title="Dictar tarea por voz"
          />

          <button
            type="button"
            onClick={() => {
              setSelectedTask(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-medium transition-all shadow-md active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Tarea</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel rounded-2xl p-4 space-y-3 border border-white/10">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-surface-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por titulo, descripcion o proyecto..."
              className="w-full pl-9 pr-3 py-1.5 bg-surface-950 border border-white/10 rounded-xl text-xs text-surface-100 placeholder-surface-500 focus:outline-hidden focus:border-cyan-500/50 font-medium"
            />
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 bg-surface-950 border border-white/10 rounded-xl text-xs text-surface-200 focus:outline-hidden focus:border-cyan-500/50"
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
            className="px-3 py-1.5 bg-surface-950 border border-white/10 rounded-xl text-xs text-surface-200 focus:outline-hidden focus:border-cyan-500/50"
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
            className="px-3 py-1.5 bg-surface-950 border border-white/10 rounded-xl text-xs text-surface-200 focus:outline-hidden focus:border-cyan-500/50"
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
            className="px-3 py-1.5 bg-surface-950 border border-white/10 rounded-xl text-xs text-surface-200 focus:outline-hidden focus:border-cyan-500/50"
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
        <div className="py-16 text-center text-xs text-surface-400 glass-card rounded-2xl">
          Cargando tareas del sistema...
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="py-16 text-center text-xs text-surface-400 glass-card rounded-2xl space-y-3">
          <CheckSquare className="w-8 h-8 text-surface-600 mx-auto" />
          <p>No se han encontrado tareas con los filtros seleccionados.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map((task) => (
            <div key={task.id} className="relative group">
              <TaskCard
                task={task}
                onStatusToggle={() => toggleTaskStatus(task.id)}
                onEdit={(t) => {
                  setSelectedTask(t);
                  setIsModalOpen(true);
                }}
                onDelete={() => deleteTask(task.id)}
              />

              {/* Boton rapido Focus Studio */}
              <button
                type="button"
                onClick={() => {
                  setActiveFocusTask(task);
                  setFocusModalOpen(true);
                }}
                className="absolute right-14 top-3 px-2 py-1 rounded-lg bg-surface-900/90 hover:bg-cyan-950 text-[10px] font-mono text-cyan-300 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                title="Abrir Focus Studio en esta tarea"
              >
                <Radio className="w-3 h-3 text-cyan-400" />
                <span>Focus</span>
              </button>
            </div>
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
        onSave={async (d) => {
          await saveTask(d);
        }}
        task={selectedTask}
        projects={projects}
      />
    </div>
  );
}
