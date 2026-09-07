"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { 
  TaskEntity, 
  TaskStatus, 
  ProjectEntity, 
  CalendarEventEntity, 
  FreeTimeSlot, 
  HabitWithStats, 
  AiActionEntity, 
  AiActionStatus,
  PlannedTaskAssignment 
} from "@/lib/types";

interface LifeOSContextType {
  tasks: TaskEntity[];
  projects: ProjectEntity[];
  habits: HabitWithStats[];
  events: CalendarEventEntity[];
  freeSlots: FreeTimeSlot[];
  aiActions: AiActionEntity[];
  isLoading: boolean;
  isSyncingCalendar: boolean;
  lastSyncTime: Date | null;
  activeFocusTask: TaskEntity | null;
  isFocusModalOpen: boolean;
  isCommandPaletteOpen: boolean;
  
  // Modales y control de foco
  setActiveFocusTask: (task: TaskEntity | null) => void;
  setFocusModalOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;

  // Acciones optimistas (0ms)
  toggleTaskStatus: (taskId: string) => Promise<void>;
  saveTask: (taskData: Partial<TaskEntity>) => Promise<TaskEntity>;
  deleteTask: (taskId: string) => Promise<void>;
  toggleHabitDay: (habitId: string, dateStr: string) => Promise<void>;
  saveHabit: (habitData: Partial<HabitWithStats>) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  handleActionStatusChange: (actionId: string, status: AiActionStatus) => Promise<void>;
  syncCalendar: () => Promise<string>;
  applyAutoSchedule: (assignments: PlannedTaskAssignment[]) => Promise<void>;
  refreshAll: () => Promise<void>;
}

const LifeOSContext = createContext<LifeOSContextType | null>(null);

export function LifeOSProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<TaskEntity[]>([]);
  const [projects, setProjects] = useState<ProjectEntity[]>([]);
  const [habits, setHabits] = useState<HabitWithStats[]>([]);
  const [events, setEvents] = useState<CalendarEventEntity[]>([]);
  const [freeSlots, setFreeSlots] = useState<FreeTimeSlot[]>([]);
  const [aiActions, setAiActions] = useState<AiActionEntity[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Estados de Focus & Command Palette
  const [activeFocusTask, setActiveFocusTask] = useState<TaskEntity | null>(null);
  const [isFocusModalOpen, setFocusModalOpen] = useState(false);
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const refreshAll = useCallback(async () => {
    try {
      const [tasksRes, projectsRes, calRes, habitsRes, actionsRes] = await Promise.all([
        fetch("/api/tasks?status=ALL", { cache: "no-store" }),
        fetch("/api/projects", { cache: "no-store" }),
        fetch("/api/calendar/events", { cache: "no-store" }),
        fetch("/api/habits", { cache: "no-store" }),
        fetch("/api/agents/actions", { cache: "no-store" }),
      ]);

      const [tasksData, projectsData, calData, habitsData, actionsData] = await Promise.all([
        tasksRes.json(),
        projectsRes.json(),
        calRes.json(),
        habitsRes.json(),
        actionsRes.json(),
      ]);

      if (tasksData.success) setTasks(tasksData.data || []);
      if (projectsData.success) setProjects(projectsData.data || []);
      if (calData.success) {
        setEvents(calData.data.events || []);
        setFreeSlots(calData.data.freeSlots || []);
      }
      if (habitsData.success && Array.isArray(habitsData.data)) {
        setHabits(habitsData.data);
      }
      if (actionsData.success) {
        setAiActions(actionsData.data || []);
      }
      setLastSyncTime(new Date());
    } catch (err) {
      console.error("Error al sincronizar estado global de Life OS:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Escuchar eventos globales existentes para retrocompatibilidad
  useEffect(() => {
    const handleTaskCreated = () => refreshAll();
    const handleOpenFocus = (e: Event) => {
      const customEvent = e as CustomEvent<TaskEntity | undefined>;
      if (customEvent.detail) {
        setActiveFocusTask(customEvent.detail);
      }
      setFocusModalOpen(true);
    };
    const handleOpenPalette = () => {
      setCommandPaletteOpen(true);
    };

    window.addEventListener("task-created", handleTaskCreated);
    window.addEventListener("open-focus-mode", handleOpenFocus);
    window.addEventListener("open-command-palette", handleOpenPalette);

    return () => {
      window.removeEventListener("task-created", handleTaskCreated);
      window.removeEventListener("open-focus-mode", handleOpenFocus);
      window.removeEventListener("open-command-palette", handleOpenPalette);
    };
  }, [refreshAll]);

  // Mutacion Optimista 0ms: Cambiar estado de tarea
  const toggleTaskStatus = async (taskId: string) => {
    const originalTasks = [...tasks];
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const nextStatus: TaskStatus = targetTask.status === "COMPLETED" ? "PENDING" : "COMPLETED";
    
    // Actualizacion instantanea en memoria (0ms)
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t))
    );

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        setTasks(originalTasks);
      }
    } catch {
      setTasks(originalTasks);
    }
  };

  // Mutacion Optimista 0ms: Guardar/Crear tarea
  const saveTask = async (taskData: Partial<TaskEntity>): Promise<TaskEntity> => {
    const isEdit = Boolean(taskData.id);
    const url = isEdit ? `/api/tasks/${taskData.id}` : "/api/tasks";
    const method = isEdit ? "PATCH" : "POST";

    // Si es edicion, actualizamos optimistamente
    if (isEdit) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskData.id ? { ...t, ...taskData } as TaskEntity : t))
      );
    }

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskData),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      await refreshAll();
      throw new Error(json.error || "Error al procesar la tarea.");
    }

    const saved: TaskEntity = json.data;
    if (!isEdit) {
      setTasks((prev) => [saved, ...prev]);
    } else {
      setTasks((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));
    }

    return saved;
  };

  // Mutacion Optimista 0ms: Eliminar tarea
  const deleteTask = async (taskId: string) => {
    const originalTasks = [...tasks];
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) {
        setTasks(originalTasks);
      }
    } catch {
      setTasks(originalTasks);
    }
  };

  // Mutacion Optimista 0ms: Alternar dia de habito
  const toggleHabitDay = async (habitId: string, dateStr: string) => {
    const originalHabits = [...habits];

    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === habitId) {
          const updatedWeek = h.weekDaysStatus.map((d) =>
            d.date === dateStr ? { ...d, completed: !d.completed } : d
          );
          const isToday = dateStr === new Date().toISOString().split("T")[0];
          const newCompletedToday = isToday ? !h.isCompletedToday : h.isCompletedToday;
          const streakDelta = newCompletedToday ? 1 : -1;

          return {
            ...h,
            isCompletedToday: newCompletedToday,
            streak: Math.max(0, h.streak + (isToday ? streakDelta : 0)),
            weekDaysStatus: updatedWeek,
          };
        }
        return h;
      })
    );

    try {
      const res = await fetch(`/api/habits/${habitId}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr }),
      });
      if (!res.ok) {
        setHabits(originalHabits);
      }
    } catch {
      setHabits(originalHabits);
    }
  };

  // Guardar/Crear habito
  const saveHabit = async (habitData: Partial<HabitWithStats>) => {
    const url = habitData.id ? `/api/habits/${habitData.id}` : "/api/habits";
    const method = habitData.id ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(habitData),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Error al procesar el habito.");
    }
    await refreshAll();
  };

  // Eliminar habito
  const deleteHabit = async (habitId: string) => {
    const original = [...habits];
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
    try {
      const res = await fetch(`/api/habits/${habitId}`, { method: "DELETE" });
      if (!res.ok) setHabits(original);
    } catch {
      setHabits(original);
    }
  };

  // Mutacion Optimista 0ms: Acciones IA (Aprobar/Rechazar)
  const handleActionStatusChange = async (actionId: string, status: AiActionStatus) => {
    const originalActions = [...aiActions];
    setAiActions((prev) =>
      prev.map((a) => (a.id === actionId ? { ...a, status } : a))
    );

    try {
      const res = await fetch(`/api/agents/actions/${actionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, execute: true }),
      });

      if (res.ok) {
        if (status === "APPROVED") {
          await refreshAll();
        }
      } else {
        setAiActions(originalActions);
      }
    } catch {
      setAiActions(originalActions);
    }
  };

  // Sincronizar Google Calendar
  const syncCalendar = async (): Promise<string> => {
    try {
      setIsSyncingCalendar(true);
      const res = await fetch("/api/calendar/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      await refreshAll();
      return data.message || "Calendario sincronizado correctamente.";
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  // Aplicar Time-Blocking automatico de tareas a slots del calendario
  const applyAutoSchedule = async (assignments: PlannedTaskAssignment[]) => {
    try {
      // Aplicar optimistamente a las tareas en memoria
      setTasks((prev) =>
        prev.map((t) => {
          const matched = assignments.find((a) => a.taskId === t.id);
          if (matched) {
            return {
              ...t,
              scheduledStart: matched.assignedStart,
              scheduledEnd: matched.assignedEnd,
            };
          }
          return t;
        })
      );

      // Despachar cada asignacion
      await Promise.all(
        assignments.map((assignment) =>
          fetch(`/api/tasks/${assignment.taskId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              scheduledStart: assignment.assignedStart,
              scheduledEnd: assignment.assignedEnd,
            }),
          })
        )
      );

      await refreshAll();
    } catch (err) {
      console.error("Error al aplicar time-blocking:", err);
      await refreshAll();
      throw err;
    }
  };

  return (
    <LifeOSContext.Provider
      value={{
        tasks,
        projects,
        habits,
        events,
        freeSlots,
        aiActions,
        isLoading,
        isSyncingCalendar,
        lastSyncTime,
        activeFocusTask,
        isFocusModalOpen,
        isCommandPaletteOpen,
        setActiveFocusTask,
        setFocusModalOpen,
        setCommandPaletteOpen,
        toggleTaskStatus,
        saveTask,
        deleteTask,
        toggleHabitDay,
        saveHabit,
        deleteHabit,
        handleActionStatusChange,
        syncCalendar,
        applyAutoSchedule,
        refreshAll,
      }}
    >
      {children}
    </LifeOSContext.Provider>
  );
}

export function useLifeOS() {
  const context = useContext(LifeOSContext);
  if (!context) {
    throw new Error("useLifeOS debe ser utilizado dentro de un LifeOSProvider.");
  }
  return context;
}
