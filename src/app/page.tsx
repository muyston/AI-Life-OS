"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  TaskEntity, 
  ProjectEntity, 
  CalendarEventEntity, 
  FreeTimeSlot, 
  PlanningAgentProposal 
} from "@/lib/types";
import { DailyTimeline } from "@/components/dashboard/DailyTimeline";
import { PlanningWidget } from "@/components/dashboard/PlanningWidget";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskModal } from "@/components/tasks/TaskModal";
import { 
  RefreshCw, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Sparkles,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [tasks, setTasks] = useState<TaskEntity[]>([]);
  const [projects, setProjects] = useState<ProjectEntity[]>([]);
  const [events, setEvents] = useState<CalendarEventEntity[]>([]);
  const [freeSlots, setFreeSlots] = useState<FreeTimeSlot[]>([]);
  const [proposal, setProposal] = useState<PlanningAgentProposal | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isPlanningLoading, setIsPlanningLoading] = useState(false);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskEntity | null>(null);

  const todayStr = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [tasksRes, projectsRes, calendarRes] = await Promise.all([
        fetch("/api/tasks?status=ALL"),
        fetch("/api/projects"),
        fetch("/api/calendar/events"),
      ]);

      const tasksData = await tasksRes.json();
      const projectsData = await projectsRes.json();
      const calendarData = await calendarRes.json();

      if (tasksData.success) setTasks(tasksData.data);
      if (projectsData.success) setProjects(projectsData.data);
      if (calendarData.success) {
        setEvents(calendarData.data.events);
        setFreeSlots(calendarData.data.freeSlots);
      }
    } catch (err) {
      console.error("Error al cargar datos del dashboard:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSyncCalendar = async () => {
    try {
      setIsSyncingCalendar(true);
      await fetch("/api/calendar/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      await loadData();
    } catch (err) {
      console.error("Error al sincronizar calendario:", err);
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  const handleStatusToggle = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "COMPLETED" ? "PENDING" : "COMPLETED";
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus as any } : t))
        );
      }
    } catch (err) {
      console.error("Error al cambiar estado de tarea:", err);
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
      throw new Error(errorData.error || "Error al procesar la tarea");
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

  const handleRunPlanning = async () => {
    try {
      setIsPlanningLoading(true);
      const res = await fetch("/api/agents/planning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RUN" }),
      });
      const data = await res.json();
      if (data.success) {
        setProposal(data.data);
      }
    } catch (err) {
      console.error("Error al ejecutar agente de planificacion:", err);
    } finally {
      setIsPlanningLoading(false);
    }
  };

  const handleApplyPlan = async (assignments: PlanningAgentProposal["assignments"]) => {
    const res = await fetch("/api/agents/planning", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "APPLY",
        assignments,
      }),
    });
    if (res.ok) {
      await loadData();
    }
  };

  // Tareas prioritarias y pendientes
  const pendingTasks = tasks.filter((t) => t.status === "PENDING" || t.status === "IN_PROGRESS");
  const completedTodayCount = tasks.filter((t) => t.status === "COMPLETED").length;
  const totalFreeMinutes = freeSlots.reduce((acc, s) => acc + s.durationMinutes, 0);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-surface-800 flex-wrap gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-surface-400 block capitalize">
            {todayStr}
          </span>
          <h1 className="text-xl font-bold tracking-tight text-surface-100">
            Vista Diaria y Planificacion Operativa
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSyncCalendar}
            disabled={isSyncingCalendar}
            className="flex items-center gap-1.5 px-3 py-2 bg-surface-900 hover:bg-surface-800 text-surface-300 border border-surface-700 rounded text-xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCalendar ? "animate-spin text-accent-500" : ""}`} />
            Sincronizar Calendario
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedTask(null);
              setIsTaskModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-accent-600 hover:bg-accent-500 text-white rounded text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Nueva Tarea
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface-900 border border-surface-800 rounded-lg p-4">
          <div className="text-xs text-surface-400 font-medium">Tareas Pendientes</div>
          <div className="text-2xl font-bold text-surface-100 mt-1 font-mono">
            {pendingTasks.length}
          </div>
          <div className="text-[11px] text-surface-400 mt-1">
            {pendingTasks.filter(t => t.priority === "URGENT" || t.priority === "HIGH").length} de alta prioridad
          </div>
        </div>

        <div className="bg-surface-900 border border-surface-800 rounded-lg p-4">
          <div className="text-xs text-surface-400 font-medium">Eventos Fijos Hoy</div>
          <div className="text-2xl font-bold text-surface-100 mt-1 font-mono">
            {events.length}
          </div>
          <div className="text-[11px] text-surface-400 mt-1">
            Sincronizados de Google Calendar
          </div>
        </div>

        <div className="bg-surface-900 border border-surface-800 rounded-lg p-4">
          <div className="text-xs text-surface-400 font-medium">Tiempo Libre Disponible</div>
          <div className="text-2xl font-bold text-brand-400 mt-1 font-mono">
            {totalFreeMinutes} min
          </div>
          <div className="text-[11px] text-surface-400 mt-1">
            En {freeSlots.length} ventanas de trabajo
          </div>
        </div>

        <div className="bg-surface-900 border border-surface-800 rounded-lg p-4">
          <div className="text-xs text-surface-400 font-medium">Tareas Completadas</div>
          <div className="text-2xl font-bold text-surface-100 mt-1 font-mono">
            {completedTodayCount}
          </div>
          <div className="text-[11px] text-surface-400 mt-1">
            En el historial actual
          </div>
        </div>
      </div>

      {/* Main Grid: Planning Agent + Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Planning Agent & Tasks */}
        <div className="lg:col-span-7 space-y-6">
          <PlanningWidget
            proposal={proposal}
            onRunPlanning={handleRunPlanning}
            onApplyPlan={handleApplyPlan}
            isLoading={isPlanningLoading}
          />

          {/* Pending Tasks Section */}
          <div className="bg-surface-900 border border-surface-800 rounded-lg p-5">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-surface-800">
              <div>
                <h3 className="text-xs font-semibold text-surface-100 uppercase tracking-wider">
                  Tareas Pendientes Priorizadas
                </h3>
                <p className="text-[11px] text-surface-400">
                  Ordenadas por urgencia y fecha limite
                </p>
              </div>

              <Link
                href="/tasks"
                className="text-xs text-accent-400 hover:text-accent-300 flex items-center gap-1 font-medium"
              >
                Ver todas ({tasks.length})
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {pendingTasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-surface-400">
                No tienes tareas pendientes para hoy. Buen trabajo.
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingTasks.slice(0, 6).map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusToggle={handleStatusToggle}
                    onEdit={(t) => {
                      setSelectedTask(t);
                      setIsTaskModalOpen(true);
                    }}
                    onDelete={handleDeleteTask}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Daily Timeline of Events and Free Slots */}
        <div className="lg:col-span-5 space-y-6">
          <DailyTimeline
            events={events}
            freeSlots={freeSlots}
            assignments={proposal?.assignments || []}
          />
        </div>
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(null);
        }}
        onSave={handleSaveTask}
        task={selectedTask}
        projects={projects}
      />
    </div>
  );
}
