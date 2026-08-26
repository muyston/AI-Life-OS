import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { prisma } from "../prisma";
import { calculateFreeSlotsForDate } from "../calendar/ical-service";
import { logAgentRun } from "./agent-logger";
import { PlanningAgentProposal, PlannedTaskAssignment, PriorityLevel } from "../types";

/**
 * Algoritmo determinista de planificacion en caso de no disponer de API Key o como fallback
 */
function deterministicPlanner(
  targetDate: Date,
  tasks: Array<{
    id: string;
    title: string;
    projectId: string | null;
    project?: { name: string } | null;
    priority: string;
    deadline: Date | null;
    estimatedDuration: number;
  }>,
  freeSlots: Array<{ start: Date; end: Date; durationMinutes: number }>
): PlanningAgentProposal {
  const priorityWeight: Record<string, number> = {
    URGENT: 5,
    CRITICAL: 5,
    HIGH: 4,
    MEDIUM: 3,
    LOW: 1,
  };

  // Ordenar tareas por prioridad y deadline
  const sortedTasks = [...tasks].sort((a, b) => {
    const pDiff = (priorityWeight[b.priority] || 3) - (priorityWeight[a.priority] || 3);
    if (pDiff !== 0) return pDiff;
    if (a.deadline && b.deadline) return a.deadline.getTime() - b.deadline.getTime();
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    return a.estimatedDuration - b.estimatedDuration;
  });

  const availableSlots = freeSlots.map(s => ({
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
          priority: task.priority as PriorityLevel,
          estimatedDuration: taskDuration,
          assignedStart: taskStart.toISOString(),
          assignedEnd: taskEnd.toISOString(),
          slotDurationMinutes: taskDuration,
          rationale: `Asignada por prioridad ${task.priority} y ajuste en ventana disponible.`,
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
        reason: "No hay huecos disponibles de duracion suficiente en la agenda de hoy.",
      });
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    targetDate: targetDate.toISOString().split("T")[0],
    summary: `Planificacion calculada con ${assignments.length} tareas asignadas y ${unassignedTasks.length} pendientes.`,
    totalTasksAnalyzed: tasks.length,
    tasksAssignedCount: assignments.length,
    unassignedTasksCount: unassignedTasks.length,
    assignments,
    unassignedTasks,
    calendarFreeSlotsFound: freeSlots.length,
    recommendations: [
      "Completar primero las tareas asignadas antes de aceptar nuevos compromisos.",
      "Revisar las tareas no asignadas para reagendar en la siguiente jornada.",
    ],
  };
}

/**
 * Ejecuta el Agente de Planificacion usando Google Gemini
 */
export async function runPlanningAgent(
  targetDateInput?: Date | string,
  triggerType: "MANUAL" | "CRON" | "EVENT" = "MANUAL"
): Promise<PlanningAgentProposal> {
  const startTime = Date.now();
  const targetDate = targetDateInput ? new Date(targetDateInput) : new Date();

  // 1. Obtener tareas pendientes
  const pendingTasks = await prisma.task.findMany({
    where: {
      status: { in: ["PENDING", "IN_PROGRESS"] },
    },
    include: {
      project: {
        select: { id: true, name: true },
      },
    },
    orderBy: [
      { priority: "desc" },
      { deadline: "asc" },
      { createdAt: "asc" },
    ],
  });

  // 2. Obtener eventos de calendario del dia
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const fixedEvents = await prisma.calendarEvent.findMany({
    where: {
      startTime: { lte: endOfDay },
      endTime: { gte: startOfDay },
      status: { not: "CANCELLED" },
    },
    orderBy: { startTime: "asc" },
  });

  // 3. Calcular huecos libres reales
  const freeSlots = await calculateFreeSlotsForDate(targetDate);

  const apiKey = process.env.GEMINI_API_KEY;

  // Si no hay clave de Gemini o es placeholder, usar el planificador determinista
  if (!apiKey || apiKey.includes("tu_clave") || apiKey.trim() === "") {
    const proposal = deterministicPlanner(targetDate, pendingTasks, freeSlots);
    const executionTimeMs = Date.now() - startTime;

    await logAgentRun({
      agentName: "PLANNING_AGENT",
      triggerType,
      inputPayload: {
        targetDate: targetDate.toISOString(),
        pendingTasksCount: pendingTasks.length,
        fixedEventsCount: fixedEvents.length,
        freeSlotsCount: freeSlots.length,
        engine: "DETERMINISTIC_FALLBACK",
      },
      outputPayload: proposal as unknown as Record<string, unknown>,
      tokensUsed: 0,
      costEstimate: 0.0,
      status: "SUCCESS",
      executionTimeMs,
    });

    return proposal;
  }

  // 4. Inferencia con Google Gemini
  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            summary: { type: SchemaType.STRING },
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
            recommendations: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
            },
          },
          required: ["summary", "assignments", "unassignedTasks", "recommendations"],
        },
      },
      systemInstruction: `Eres el Agente de Planificacion de AI Life OS, un sistema operativo personal de alto rendimiento.
Tu objetivo es analizar las tareas pendientes del usuario (con sus prioridades, duraciones estimadas y deadlines) y cruzarlas con los eventos fijos de Google Calendar y los huecos libres calculados para hoy.

Reglas estrictas:
1. Nunca solapes tareas con eventos fijos del calendario.
2. Respeta la duracion estimada de cada tarea.
3. Prioriza tareas con fecha limite proxima o prioridad URGENT/HIGH.
4. Si una tarea no cabe en los huecos disponibles, marcala en unassignedTasks con la razon exacta.
5. Proporciona siempre una justificacion concisa y profesional para cada asignacion.
6. Prohibido terminantemente el uso de emojis en cualquier texto, resumen o recomendacion.`,
    });

    const userPrompt = JSON.stringify({
      targetDate: targetDate.toISOString().split("T")[0],
      fixedEvents: fixedEvents.map(e => ({
        id: e.id,
        summary: e.summary,
        start: e.startTime.toISOString(),
        end: e.endTime.toISOString(),
        isAllDay: e.isAllDay,
      })),
      calculatedFreeSlots: freeSlots.map(s => ({
        start: s.start.toISOString(),
        end: s.end.toISOString(),
        durationMinutes: s.durationMinutes,
      })),
      pendingTasks: pendingTasks.map(t => ({
        id: t.id,
        title: t.title,
        projectName: t.project?.name || null,
        priority: t.priority,
        deadline: t.deadline ? t.deadline.toISOString() : null,
        estimatedDurationMinutes: t.estimatedDuration,
        type: t.type,
      })),
    });

    const result = await model.generateContent(
      `Analiza la siguiente jornada y genera el plan estructurado de trabajo:\n${userPrompt}`
    );

    const responseText = result.response.text();
    const parsedData = JSON.parse(responseText);

    const proposal: PlanningAgentProposal = {
      generatedAt: new Date().toISOString(),
      targetDate: targetDate.toISOString().split("T")[0],
      summary: parsedData.summary,
      totalTasksAnalyzed: pendingTasks.length,
      tasksAssignedCount: parsedData.assignments?.length || 0,
      unassignedTasksCount: parsedData.unassignedTasks?.length || 0,
      assignments: (parsedData.assignments || []) as PlannedTaskAssignment[],
      unassignedTasks: parsedData.unassignedTasks || [],
      calendarFreeSlotsFound: freeSlots.length,
      recommendations: parsedData.recommendations || [],
    };

    const tokensUsed = result.response.usageMetadata?.totalTokenCount || 0;
    const executionTimeMs = Date.now() - startTime;

    await logAgentRun({
      agentName: "PLANNING_AGENT",
      triggerType,
      inputPayload: {
        targetDate: targetDate.toISOString(),
        pendingTasksCount: pendingTasks.length,
        fixedEventsCount: fixedEvents.length,
        engine: "GOOGLE_GEMINI_2_5_FLASH",
      },
      outputPayload: proposal as unknown as Record<string, unknown>,
      tokensUsed,
      costEstimate: 0.0,
      status: "SUCCESS",
      executionTimeMs,
    });

    return proposal;
  } catch (error) {
    console.error("Error en ejecucion de Agente de Planificacion con Gemini:", error);
    const proposal = deterministicPlanner(targetDate, pendingTasks, freeSlots);
    const executionTimeMs = Date.now() - startTime;

    await logAgentRun({
      agentName: "PLANNING_AGENT",
      triggerType,
      inputPayload: {
        targetDate: targetDate.toISOString(),
        pendingTasksCount: pendingTasks.length,
        fallbackActive: true,
      },
      outputPayload: proposal as unknown as Record<string, unknown>,
      tokensUsed: 0,
      costEstimate: 0.0,
      status: "FAILED",
      errorMessage: error instanceof Error ? error.message : String(error),
      executionTimeMs,
    });

    return proposal;
  }
}
