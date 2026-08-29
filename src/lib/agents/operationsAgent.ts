import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { prisma } from "../prisma";
import { calculateFreeSlotsForDate } from "../calendar/ical-service";
import { logAgentRun } from "./agent-logger";
import { PlannedTaskAssignment, PriorityLevel, FreeTimeSlot } from "../types";

export interface OperationsAgentResult {
  generatedAt: string;
  targetDate: string;
  scheduleSummary: string;
  totalFreeMinutes: number;
  freeSlotsCount: number;
  tasksScheduledCount: number;
  unassignedTasksCount: number;
  assignments: PlannedTaskAssignment[];
  unassignedTasks: {
    taskId: string;
    taskTitle: string;
    reason: string;
  }[];
  operationalRecommendations: string[];
}

interface PendingTaskForSchedule {
  id: string;
  title: string;
  projectId: string | null;
  project?: { id: string; name: string; category?: string } | null;
  priority: string;
  deadline: Date | null;
  estimatedDuration: number;
}

function isPriorityLevel(val: unknown): val is PriorityLevel {
  return typeof val === "string" && ["LOW", "MEDIUM", "HIGH", "CRITICAL", "URGENT"].includes(val);
}

function deterministicOperationsSchedule(
  targetDate: Date,
  tasks: PendingTaskForSchedule[],
  freeSlots: FreeTimeSlot[]
): OperationsAgentResult {
  const priorityWeight: Record<string, number> = {
    URGENT: 5,
    CRITICAL: 5,
    HIGH: 4,
    MEDIUM: 3,
    LOW: 1,
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    const pDiff = (priorityWeight[b.priority] || 3) - (priorityWeight[a.priority] || 3);
    if (pDiff !== 0) return pDiff;
    if (a.deadline && b.deadline) return a.deadline.getTime() - b.deadline.getTime();
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    return a.estimatedDuration - b.estimatedDuration;
  });

  const availableSlots = freeSlots.map((s) => ({
    start: new Date(s.start),
    end: new Date(s.end),
    remainingMinutes: s.durationMinutes,
    currentPointer: new Date(s.start),
  }));

  const assignments: PlannedTaskAssignment[] = [];
  const unassignedTasks: { taskId: string; taskTitle: string; reason: string }[] = [];

  for (const task of sortedTasks) {
    let assigned = false;
    const taskDuration = Math.max(15, task.estimatedDuration || 30);

    for (const slot of availableSlots) {
      if (slot.remainingMinutes >= taskDuration) {
        const taskStart = new Date(slot.currentPointer);
        const taskEnd = new Date(taskStart.getTime() + taskDuration * 60000);

        assignments.push({
          taskId: task.id,
          taskTitle: task.title,
          projectId: task.projectId,
          projectName: task.project?.name,
          priority: isPriorityLevel(task.priority) ? task.priority : "MEDIUM",
          estimatedDuration: taskDuration,
          assignedStart: taskStart.toISOString(),
          assignedEnd: taskEnd.toISOString(),
          slotDurationMinutes: taskDuration,
          rationale: `Asignación óptima en bloque de ${slot.remainingMinutes} min por prioridad ${task.priority}.`,
        });

        slot.remainingMinutes -= taskDuration;
        slot.currentPointer = taskEnd;
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      unassignedTasks.push({
        taskId: task.id,
        taskTitle: task.title,
        reason: "Agenda ocupada o duración mayor a los intervalos libres disponibles.",
      });
    }
  }

  const totalFreeMinutes = freeSlots.reduce((acc, s) => acc + s.durationMinutes, 0);

  return {
    generatedAt: new Date().toISOString(),
    targetDate: targetDate.toISOString().split("T")[0],
    scheduleSummary: `Planificación de operaciones completada: ${assignments.length} tareas asignadas en ${freeSlots.length} huecos libres (${totalFreeMinutes} min disponibles).`,
    totalFreeMinutes,
    freeSlotsCount: freeSlots.length,
    tasksScheduledCount: assignments.length,
    unassignedTasksCount: unassignedTasks.length,
    assignments,
    unassignedTasks,
    operationalRecommendations: [
      "Ejecutar primero las tareas asignadas en las ventanas matutinas de mayor concentración.",
      "Revisar las tareas no programadas para transferir a la siguiente jornada.",
    ],
  };
}

export async function runOperationsAgent(
  targetDateInput?: Date | string,
  triggerType: "MANUAL" | "CRON" | "EVENT" | "PIPELINE" = "MANUAL"
): Promise<OperationsAgentResult> {
  const startTime = Date.now();
  const targetDate = targetDateInput ? new Date(targetDateInput) : new Date();

  const pendingTasks = await prisma.task.findMany({
    where: {
      status: { in: ["PENDING", "IN_PROGRESS"] },
    },
    include: {
      project: {
        select: { id: true, name: true, category: true },
      },
    },
    orderBy: [
      { priority: "desc" },
      { deadline: "asc" },
      { createdAt: "asc" },
    ],
  });

  const freeSlots = await calculateFreeSlotsForDate(targetDate);
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.includes("tu_clave") || apiKey.trim() === "") {
    const result = deterministicOperationsSchedule(targetDate, pendingTasks, freeSlots);
    const executionTimeMs = Date.now() - startTime;

    if (result.assignments.length > 0) {
      await prisma.aiAction.create({
        data: {
          agentName: "OPERATIONS",
          title: "Reagendación de tareas en huecos de Google Calendar",
          description: `Se han distribuido ${result.tasksScheduledCount} tareas en ${result.freeSlotsCount} ventanas libres de hoy.`,
          category: "operations",
          actionType: "CALENDAR_RESCHEDULE",
          payload: JSON.stringify(result.assignments),
          status: "PENDING_REVIEW",
        },
      });
    }

    await logAgentRun({
      agentName: "OPERATIONS",
      triggerType,
      inputPayload: {
        targetDate: targetDate.toISOString(),
        pendingTasksCount: pendingTasks.length,
        freeSlotsCount: freeSlots.length,
        engine: "DETERMINISTIC",
      },
      outputPayload: result as unknown as Record<string, unknown>,
      tokensUsed: 0,
      costEstimate: 0.0,
      status: "SUCCESS",
      executionTimeMs,
    });

    return result;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            scheduleSummary: { type: SchemaType.STRING },
            assignments: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  taskId: { type: SchemaType.STRING },
                  taskTitle: { type: SchemaType.STRING },
                  projectId: { type: SchemaType.STRING, nullable: true },
                  priority: { type: SchemaType.STRING },
                  estimatedDuration: { type: SchemaType.NUMBER },
                  assignedStart: { type: SchemaType.STRING },
                  assignedEnd: { type: SchemaType.STRING },
                  slotDurationMinutes: { type: SchemaType.NUMBER },
                  rationale: { type: SchemaType.STRING },
                },
                required: [
                  "taskId",
                  "taskTitle",
                  "priority",
                  "estimatedDuration",
                  "assignedStart",
                  "assignedEnd",
                  "slotDurationMinutes",
                  "rationale",
                ],
              },
            },
            unassignedTasks: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  taskId: { type: SchemaType.STRING },
                  taskTitle: { type: SchemaType.STRING },
                  reason: { type: SchemaType.STRING },
                },
                required: ["taskId", "taskTitle", "reason"],
              },
            },
            operationalRecommendations: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
            },
          },
          required: [
            "scheduleSummary",
            "assignments",
            "unassignedTasks",
            "operationalRecommendations",
          ],
        },
      },
      systemInstruction: `Eres el OperationsAgent de AI Life OS.
Tu misión es distribuir tareas pendientes en los huecos libres calculados de Google Calendar sin solapamientos.
Respeta duraciones estimadas, prioridades (URGENT/HIGH primero) y límites de jornada laboral.
Cero emojis. Tono institucional, riguroso y técnico.`,
    });

    const userPayload = JSON.stringify({
      targetDate: targetDate.toISOString().split("T")[0],
      freeSlots: freeSlots.map((s) => ({
        start: s.start.toISOString(),
        end: s.end.toISOString(),
        durationMinutes: s.durationMinutes,
      })),
      pendingTasks: pendingTasks.map((t) => ({
        id: t.id,
        title: t.title,
        projectName: t.project?.name || null,
        priority: t.priority,
        estimatedDurationMinutes: t.estimatedDuration,
        deadline: t.deadline ? t.deadline.toISOString() : null,
      })),
    });

    const response = await model.generateContent(
      `Calcula la distribución operativa de tareas en la agenda:\n${userPayload}`
    );

    const parsed = JSON.parse(response.response.text()) as Partial<OperationsAgentResult>;
    const baseResult = deterministicOperationsSchedule(targetDate, pendingTasks, freeSlots);

    const rawAssignments = Array.isArray(parsed.assignments) && parsed.assignments.length > 0
      ? parsed.assignments
      : baseResult.assignments;

    const finalAssignments: PlannedTaskAssignment[] = rawAssignments.map((a) => ({
      taskId: a.taskId,
      taskTitle: a.taskTitle,
      projectId: a.projectId || null,
      projectName: a.projectName,
      priority: isPriorityLevel(a.priority) ? a.priority : "MEDIUM",
      estimatedDuration: typeof a.estimatedDuration === "number" ? a.estimatedDuration : 30,
      assignedStart: a.assignedStart,
      assignedEnd: a.assignedEnd,
      slotDurationMinutes: typeof a.slotDurationMinutes === "number" ? a.slotDurationMinutes : 30,
      rationale: a.rationale || "Asignación en ventana disponible.",
    }));

    const totalFreeMinutes = freeSlots.reduce((acc, s) => acc + s.durationMinutes, 0);

    const finalResult: OperationsAgentResult = {
      generatedAt: new Date().toISOString(),
      targetDate: targetDate.toISOString().split("T")[0],
      scheduleSummary: parsed.scheduleSummary || baseResult.scheduleSummary,
      totalFreeMinutes,
      freeSlotsCount: freeSlots.length,
      tasksScheduledCount: finalAssignments.length,
      unassignedTasksCount: Array.isArray(parsed.unassignedTasks) ? parsed.unassignedTasks.length : baseResult.unassignedTasksCount,
      assignments: finalAssignments,
      unassignedTasks: Array.isArray(parsed.unassignedTasks) ? parsed.unassignedTasks : baseResult.unassignedTasks,
      operationalRecommendations: Array.isArray(parsed.operationalRecommendations)
        ? parsed.operationalRecommendations
        : baseResult.operationalRecommendations,
    };

    if (finalResult.assignments.length > 0) {
      await prisma.aiAction.create({
        data: {
          agentName: "OPERATIONS",
          title: "Reagendación de tareas en huecos de Google Calendar",
          description: `Se han distribuido ${finalResult.tasksScheduledCount} tareas en ${finalResult.freeSlotsCount} ventanas libres de hoy.`,
          category: "operations",
          actionType: "CALENDAR_RESCHEDULE",
          payload: JSON.stringify(finalResult.assignments),
          status: "PENDING_REVIEW",
        },
      });
    }

    const tokensUsed = response.response.usageMetadata?.totalTokenCount || 0;
    const executionTimeMs = Date.now() - startTime;

    await logAgentRun({
      agentName: "OPERATIONS",
      triggerType,
      inputPayload: {
        targetDate: targetDate.toISOString(),
        pendingTasksCount: pendingTasks.length,
        freeSlotsCount: freeSlots.length,
        engine: "GOOGLE_GEMINI_2_5_FLASH",
      },
      outputPayload: finalResult as unknown as Record<string, unknown>,
      tokensUsed,
      costEstimate: 0.0,
      status: "SUCCESS",
      executionTimeMs,
    });

    return finalResult;
  } catch (error) {
    console.error("Error en OperationsAgent con Gemini:", error);
    const fallbackResult = deterministicOperationsSchedule(targetDate, pendingTasks, freeSlots);
    const executionTimeMs = Date.now() - startTime;

    await logAgentRun({
      agentName: "OPERATIONS",
      triggerType,
      inputPayload: {
        targetDate: targetDate.toISOString(),
        pendingTasksCount: pendingTasks.length,
        fallbackActive: true,
      },
      outputPayload: fallbackResult as unknown as Record<string, unknown>,
      tokensUsed: 0,
      costEstimate: 0.0,
      status: "FAILED",
      errorMessage: error instanceof Error ? error.message : String(error),
      executionTimeMs,
    });

    return fallbackResult;
  }
}
