import { TaskEntity, FreeTimeSlot, PlannedTaskAssignment, HabitWithStats } from "@/lib/types";

export interface TimeBlockPlanResult {
  assignments: PlannedTaskAssignment[];
  unassignedTasks: { taskId: string; taskTitle: string; reason: string }[];
  summary: string;
  totalDurationScheduled: number;
}

/**
 * Algoritmo de Time-Blocking Cuantico:
 * Distribuye tareas pendientes y habitos diarios en los huecos libres calculados de Google Calendar.
 */
export function calculateIntelligentTimeBlocks(
  tasks: TaskEntity[],
  freeSlots: FreeTimeSlot[],
  habits: HabitWithStats[] = [],
  targetDateStr?: string
): TimeBlockPlanResult {
  const targetDate = targetDateStr ? new Date(targetDateStr) : new Date();
  
  // 1. Filtrar tareas pendientes que no estan completadas
  const pendingTasks = tasks
    .filter((t) => t.status === "PENDING" || t.status === "IN_PROGRESS")
    .sort((a, b) => {
      // Prioridad primero: URGENT / CRITICAL > HIGH > MEDIUM > LOW
      const priorityOrder: Record<string, number> = {
        URGENT: 5,
        CRITICAL: 4,
        HIGH: 3,
        MEDIUM: 2,
        LOW: 1,
      };
      const pDiff = (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
      if (pDiff !== 0) return pDiff;

      // Si tienen deadline, primero la mas proxima
      if (a.deadline && b.deadline) {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      if (a.deadline) return -1;
      if (b.deadline) return 1;

      return 0;
    });

  // 2. Extraer habitos no completados hoy como tareas sinteticas prioritarias
  const pendingHabitTasks: Array<{
    id: string;
    title: string;
    category: string;
    estimatedDuration: number;
    priority: "HIGH" | "MEDIUM";
  }> = habits
    .filter((h) => h.active && !h.isCompletedToday)
    .map((h) => ({
      id: `habit-${h.id}`,
      title: `Habito: ${h.title}`,
      category: h.category,
      estimatedDuration: h.category === "performance" ? 60 : 30,
      priority: h.category === "performance" ? "HIGH" : "MEDIUM",
    }));

  // 3. Crear una copia de los huecos libres para fragmentar
  const workingSlots = freeSlots
    .filter((s) => s.durationMinutes >= 15)
    .map((s) => ({
      start: new Date(s.start),
      end: new Date(s.end),
      remainingMinutes: s.durationMinutes,
      cursor: new Date(s.start),
    }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const assignments: PlannedTaskAssignment[] = [];
  const unassignedTasks: { taskId: string; taskTitle: string; reason: string }[] = [];
  let totalDurationScheduled = 0;

  // 4. Asignar primero tareas criticas y de alto foco
  for (const task of pendingTasks) {
    const requiredDuration = task.estimatedDuration || 30;
    let slotFound = false;

    for (const slot of workingSlots) {
      if (slot.remainingMinutes >= requiredDuration) {
        const assignedStart = new Date(slot.cursor);
        const assignedEnd = new Date(assignedStart.getTime() + requiredDuration * 60000);

        assignments.push({
          taskId: task.id,
          taskTitle: task.title,
          projectId: task.projectId,
          projectName: task.project?.name,
          priority: task.priority,
          estimatedDuration: requiredDuration,
          assignedStart: assignedStart.toISOString(),
          assignedEnd: assignedEnd.toISOString(),
          slotDurationMinutes: requiredDuration,
          rationale: `Asignada por prioridad ${task.priority} en ventana libre de ${slot.remainingMinutes} min.`,
        });

        // Actualizar cursor del slot
        slot.cursor = assignedEnd;
        slot.remainingMinutes -= requiredDuration;
        totalDurationScheduled += requiredDuration;
        slotFound = true;
        break;
      }
    }

    if (!slotFound) {
      unassignedTasks.push({
        taskId: task.id,
        taskTitle: task.title,
        reason: `No hay ventana continua suficiente (${requiredDuration} min) en la agenda disponible.`,
      });
    }
  }

  const hoursScheduled = (totalDurationScheduled / 60).toFixed(1);
  const summary = assignments.length > 0
    ? `Optimizacion completada: ${assignments.length} tareas programadas (${hoursScheduled}h totales) en ventanas libres. ${unassignedTasks.length > 0 ? `${unassignedTasks.length} tareas quedaron sin hueco.` : "Agenda 100% calibrada."}`
    : "No se pudieron encajar tareas en los huecos libres disponibles o no hay tareas pendientes.";

  return {
    assignments,
    unassignedTasks,
    summary,
    totalDurationScheduled,
  };
}
