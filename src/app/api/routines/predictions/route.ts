import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { analyzeAndPredictRoutines, schedulePredictedRoutines, RoutineHabitInput } from "@/lib/engine/routine-prediction-engine";
import { calculateFreeSlotsForDate } from "@/lib/calendar/ical-service";
import { TaskEntity } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date") || new Date().toISOString().split("T")[0];

    // Cargar tareas, eventos y habitos
    const [tasksRaw, eventsRaw, habitsRaw] = await Promise.all([
      prisma.task.findMany({
        include: { project: { select: { id: true, name: true, category: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.calendarEvent.findMany({
        orderBy: { startTime: "asc" },
      }),
      prisma.habit.findMany({
        where: { active: true },
        include: {
          logs: {
            orderBy: { date: "desc" },
            take: 30,
          },
        },
      }),
    ]);

    const formattedHabits: RoutineHabitInput[] = habitsRaw.map((h) => {
      const logs = h.logs || [];
      const completedDaysCount = logs.filter((l) => l.completed).length;
      return {
        id: h.id,
        category: h.category as any,
        completedDaysCount,
      };
    });

    const formattedTasks: TaskEntity[] = tasksRaw.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      projectId: t.projectId,
      type: t.type as any,
      priority: t.priority as any,
      status: t.status as any,
      origin: t.origin as any,
      deadline: t.deadline ? t.deadline.toISOString() : null,
      estimatedDuration: t.estimatedDuration,
      scheduledStart: t.scheduledStart ? t.scheduledStart.toISOString() : null,
      scheduledEnd: t.scheduledEnd ? t.scheduledEnd.toISOString() : null,
      completedAt: t.completedAt ? t.completedAt.toISOString() : null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      project: t.project ? { id: t.project.id, name: t.project.name, category: t.project.category as any } : undefined,
    }));

    const formattedEvents = eventsRaw.map((e) => ({
      id: e.id,
      externalId: e.externalId,
      summary: e.summary,
      description: e.description,
      startTime: e.startTime.toISOString(),
      endTime: e.endTime.toISOString(),
      isAllDay: e.isAllDay,
      location: e.location,
      status: e.status as any,
      syncedAt: e.syncedAt.toISOString(),
    }));

    const report = analyzeAndPredictRoutines(formattedTasks, formattedEvents, formattedHabits);

    return apiSuccess(report);
  } catch (error) {
    return handleApiError(error, "Error al generar predicciones de rutinas.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const targetDate = body.targetDate || new Date().toISOString().split("T")[0];
    const selectedRoutineIds: string[] = body.selectedRoutineIds || [];

    // Cargar datos
    const [tasksRaw, eventsRaw, habitsRaw] = await Promise.all([
      prisma.task.findMany({
        include: { project: { select: { id: true, name: true, category: true } } },
      }),
      prisma.calendarEvent.findMany({
        orderBy: { startTime: "asc" },
      }),
      prisma.habit.findMany({ where: { active: true } }),
    ]);

    const formattedTasks: TaskEntity[] = tasksRaw.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      projectId: t.projectId,
      type: t.type as any,
      priority: t.priority as any,
      status: t.status as any,
      origin: t.origin as any,
      deadline: t.deadline ? t.deadline.toISOString() : null,
      estimatedDuration: t.estimatedDuration,
      scheduledStart: t.scheduledStart ? t.scheduledStart.toISOString() : null,
      scheduledEnd: t.scheduledEnd ? t.scheduledEnd.toISOString() : null,
      completedAt: t.completedAt ? t.completedAt.toISOString() : null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));

    const formattedEvents = eventsRaw.map((e) => ({
      id: e.id,
      externalId: e.externalId,
      summary: e.summary,
      description: e.description,
      startTime: e.startTime.toISOString(),
      endTime: e.endTime.toISOString(),
      isAllDay: e.isAllDay,
      location: e.location,
      status: e.status as any,
      syncedAt: e.syncedAt.toISOString(),
    }));

    const formattedHabits: RoutineHabitInput[] = habitsRaw.map((h) => ({
      id: h.id,
      category: h.category as any,
      completedDaysCount: 1,
    }));

    const report = analyzeAndPredictRoutines(formattedTasks, formattedEvents, formattedHabits);
    const routinesToSchedule = report.predictions.filter((p) =>
      selectedRoutineIds.length === 0 || selectedRoutineIds.includes(p.id)
    );

    const freeSlots = await calculateFreeSlotsForDate(new Date(targetDate));
    const assignments = schedulePredictedRoutines(routinesToSchedule, freeSlots, targetDate);

    // Crear o programar las tareas en la base de datos
    const createdTasks = [];
    for (const assignment of assignments) {
      const routine = routinesToSchedule.find((r) => r.id === assignment.taskId);
      const newTask = await prisma.task.create({
        data: {
          title: assignment.taskTitle,
          description: assignment.rationale,
          type: "RECURRING",
          priority: "HIGH",
          status: "PENDING",
          origin: "AGENT_PLANNING",
          estimatedDuration: assignment.slotDurationMinutes,
          scheduledStart: new Date(assignment.assignedStart),
          scheduledEnd: new Date(assignment.assignedEnd),
        },
      });
      createdTasks.push(newTask);
    }

    return apiSuccess({
      message: `Se han programado ${createdTasks.length} rutinas predictivas para el dia ${targetDate}.`,
      scheduledCount: createdTasks.length,
      assignments,
    });
  } catch (error) {
    return handleApiError(error, "Error al auto-planificar rutinas predictivas.");
  }
}
