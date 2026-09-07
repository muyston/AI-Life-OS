"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";
import { 
  TaskEntity, 
  PlanningAgentProposal
} from "@/lib/types";
import { useLifeOS } from "@/lib/store/life-os-store";
import { calculateIntelligentTimeBlocks } from "@/lib/engine/time-blocking-engine";
import { DailyTimeline } from "@/components/dashboard/DailyTimeline";
import { PlanningWidget } from "@/components/dashboard/PlanningWidget";
import { AiActivityFeed } from "@/components/dashboard/AiActivityFeed";
import { MultidomainRadar } from "@/components/dashboard/MultidomainRadar";
import { HabitTrackerWidget } from "@/components/habits/HabitTrackerWidget";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskModal } from "@/components/tasks/TaskModal";
import { VoiceInputButton } from "@/components/voice/VoiceInputButton";
import { VisionScheduleButton } from "@/components/vision/VisionScheduleButton";
import { RoutinePredictionWidget } from "@/components/dashboard/RoutinePredictionWidget";
import { 
  RefreshCw, 
  Plus, 
  Sparkles,
  ArrowRight,
  Bot,
  Calendar,
  Flame,
  CheckSquare,
  Activity,
  Zap,
  Radio,
  Sliders,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const {
    tasks,
    projects,
    events,
    freeSlots,
    habits,
    aiActions,
    isLoading,
    isSyncingCalendar,
    syncCalendar,
    toggleTaskStatus,
    saveTask,
    deleteTask,
    handleActionStatusChange,
    applyAutoSchedule,
    setActiveFocusTask,
    setFocusModalOpen,
    refreshAll,
  } = useLifeOS();

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskEntity | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [isAutoScheduling, setIsAutoScheduling] = useState(false);
  const [proposal, setProposal] = useState<PlanningAgentProposal | null>(null);
  const [isPlanningLoading, setIsPlanningLoading] = useState(false);

  const todayStr = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });

  const pendingTasks = useMemo(
    () => tasks.filter((t) => t.status === "PENDING" || t.status === "IN_PROGRESS"),
    [tasks]
  );
  const urgentTasks = useMemo(
    () => pendingTasks.filter((t) => t.priority === "URGENT" || t.priority === "CRITICAL" || t.priority === "HIGH"),
    [pendingTasks]
  );
  const totalFreeMinutes = useMemo(
    () => freeSlots.reduce((acc, s) => acc + s.durationMinutes, 0),
    [freeSlots]
  );
  const completedHabitsToday = useMemo(
    () => habits.filter((h) => h.active && h.isCompletedToday).length,
    [habits]
  );
  const totalActiveHabits = useMemo(
    () => habits.filter((h) => h.active).length,
    [habits]
  );

  const handleSyncCalendarClick = async () => {
    try {
      const msg = await syncCalendar();
      setSyncFeedback(msg);
      setTimeout(() => setSyncFeedback(null), 5000);
    } catch {
      setSyncFeedback("Error al sincronizar Google Calendar.");
      setTimeout(() => setSyncFeedback(null), 5000);
    }
  };

  // 1-Click Auto-Schedule Inteligente
  const handleQuickAutoSchedule = async () => {
    try {
      setIsAutoScheduling(true);
      const plan = calculateIntelligentTimeBlocks(tasks, freeSlots, habits);
      if (plan.assignments.length === 0) {
        setSyncFeedback("No hay ventanas libres suficientes o no hay tareas pendientes.");
        setTimeout(() => setSyncFeedback(null), 5000);
        return;
      }

      await applyAutoSchedule(plan.assignments);
      setSyncFeedback(`Time-Blocking ejecutado: ${plan.assignments.length} tareas programadas.`);
      setTimeout(() => setSyncFeedback(null), 5000);
    } catch {
      setSyncFeedback("Error al aplicar la planificacion automatica.");
      setTimeout(() => setSyncFeedback(null), 5000);
    } finally {
      setIsAutoScheduling(false);
    }
  };

  const handleRunPlanning = async () => {
    try {
      setIsPlanningLoading(true);
      const res = await fetch("/api/agents/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentName: "OPERATIONS", triggerType: "MANUAL" }),
      });
      const data = await res.json();
      if (data.success) {
        const opsData = data.data;
        const adaptedProposal: PlanningAgentProposal = {
          generatedAt: opsData.generatedAt,
          targetDate: opsData.targetDate,
          summary: opsData.scheduleSummary,
          totalTasksAnalyzed: opsData.tasksScheduledCount + opsData.unassignedTasksCount,
          tasksAssignedCount: opsData.tasksScheduledCount,
          unassignedTasksCount: opsData.unassignedTasksCount,
          assignments: opsData.assignments || [],
          unassignedTasks: opsData.unassignedTasks || [],
          calendarFreeSlotsFound: opsData.freeSlotsCount || 0,
          recommendations: opsData.operationalRecommendations || [],
        };
        setProposal(adaptedProposal);
      }
    } catch (err) {
      console.error("Error al ejecutar agente de planificacion:", err);
    } finally {
      setIsPlanningLoading(false);
    }
  };

  const handleApplyPlan = async (assignments: PlanningAgentProposal["assignments"]) => {
    await applyAutoSchedule(assignments);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Header Ejecutivo */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] flex-wrap gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-surface-400 block capitalize">
            {todayStr}
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-surface-50 flex items-center gap-2.5 mt-0.5">
            Vista Diaria & Sistema Operativo
          </h1>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleQuickAutoSchedule}
            disabled={isAutoScheduling || pendingTasks.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-cyan-600/90 to-blue-600/90 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-medium transition-all shadow-md shadow-cyan-600/20 active:scale-95 disabled:opacity-50"
            title="Encajar tareas en ventanas libres automaticamente"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>{isAutoScheduling ? "Calibrando..." : "Auto-Schedule 1-Clic"}</span>
          </button>

          <VisionScheduleButton
            variant="pill"
            onRoutineApplied={refreshAll}
            title="Importar horario de universidad o rutina desde foto"
          />

          <VoiceInputButton
            variant="pill"
            onActionCompleted={refreshAll}
            title="Dictar tarea o idea"
          />

          <button
            type="button"
            onClick={handleSyncCalendarClick}
            disabled={isSyncingCalendar}
            className="flex items-center gap-1.5 px-3 py-2 bg-surface-900/80 hover:bg-surface-800 text-surface-300 border border-white/10 rounded-xl text-xs transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCalendar ? "animate-spin text-cyan-400" : ""}`} />
            <span className="hidden sm:inline">Sincronizar Google</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedTask(null);
              setIsTaskModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-surface-800 hover:bg-surface-700 text-surface-100 border border-white/15 rounded-xl text-xs font-medium transition-all shadow-xs active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Tarea</span>
          </button>
        </div>
      </div>

      {syncFeedback && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ willChange: "transform" }}
          className="p-3.5 rounded-2xl bg-surface-900/90 border border-cyan-500/40 text-xs text-cyan-300 flex items-center justify-between shadow-lg"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
        </motion.div>
      )}

      {/* KPI Cards Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div 
          whileHover={{ y: -2 }}
          style={{ willChange: "transform" }}
          className="glass-card rounded-2xl p-4 sm:p-5 border border-white/[0.08]"
        >
          <div className="flex items-center justify-between text-xs text-surface-400">
            <span>Tareas Pendientes</span>
            <CheckSquare className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-surface-50 mt-1.5 font-mono">
            {pendingTasks.length}
          </div>
          <div className="text-[11px] text-surface-400 mt-1">
            {urgentTasks.length} de prioridad alta/urgente
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -2 }}
          style={{ willChange: "transform" }}
          className="glass-card rounded-2xl p-4 sm:p-5 border border-white/[0.08]"
        >
          <div className="flex items-center justify-between text-xs text-surface-400">
            <span>Agenda Hoy</span>
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 mt-1.5 font-mono">
            {events.length} eventos
          </div>
          <div className="text-[11px] text-surface-400 mt-1">
            Google Calendar sincronizado
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -2 }}
          style={{ willChange: "transform" }}
          className="glass-card rounded-2xl p-4 sm:p-5 border border-white/[0.08]"
        >
          <div className="flex items-center justify-between text-xs text-surface-400">
            <span>Ventanas Libres</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1.5 font-mono">
            {(totalFreeMinutes / 60).toFixed(1)} h
          </div>
          <div className="text-[11px] text-surface-400 mt-1">
            En {freeSlots.length} bloques disponibles
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -2 }}
          style={{ willChange: "transform" }}
          className="glass-card rounded-2xl p-4 sm:p-5 border border-white/[0.08]"
        >
          <div className="flex items-center justify-between text-xs text-surface-400">
            <span>Habitos Hoy</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-1.5 font-mono">
            {completedHabitsToday} / {totalActiveHabits}
          </div>
          <div className="text-[11px] text-surface-400 mt-1">
            {totalActiveHabits - completedHabitsToday} pendientes de completar
          </div>
        </motion.div>
      </div>

      {/* AI Activity Feed */}
      <AiActivityFeed
        actions={aiActions}
        onActionStatusChange={handleActionStatusChange}
        isLoading={isLoading}
      />

      {/* Motor Predictivo de Rutinas */}
      <RoutinePredictionWidget onRoutinesApplied={refreshAll} />

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

          {/* Pending Tasks Section con Focus Launch */}
          <div className="glass-panel rounded-2xl p-5 space-y-4 border border-white/10 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <h3 className="text-xs font-semibold text-surface-100 uppercase tracking-wider flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-cyan-400" />
                  Tareas Pendientes Priorizadas
                </h3>
                <p className="text-[11px] text-surface-400 mt-0.5">
                  Respuesta instantanea de 0ms al alternar estados
                </p>
              </div>

              <Link
                href="/tasks"
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium transition-colors"
              >
                <span>Ver todas ({tasks.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {pendingTasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-surface-400 glass-card rounded-2xl">
                No tienes tareas pendientes para hoy. El sistema esta al dia.
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingTasks.slice(0, 6).map((task) => (
                  <div key={task.id} className="relative group">
                    <TaskCard
                      task={task}
                      onStatusToggle={() => toggleTaskStatus(task.id)}
                      onEdit={(t) => {
                        setSelectedTask(t);
                        setIsTaskModalOpen(true);
                      }}
                      onDelete={() => deleteTask(task.id)}
                    />
                    
                    {/* Boton rapido de Focus Studio sobre la tarea */}
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
          </div>
        </div>

        {/* Right Column: Daily Timeline, Habits & Multidomain Radar */}
        <div className="lg:col-span-5 space-y-6">
          <DailyTimeline
            events={events}
            freeSlots={freeSlots}
            assignments={proposal?.assignments || []}
          />

          <HabitTrackerWidget />

          <MultidomainRadar
            projects={projects}
            tasks={tasks}
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
        onSave={async (d) => {
          await saveTask(d);
        }}
        task={selectedTask}
        projects={projects}
      />
    </div>
  );
}
