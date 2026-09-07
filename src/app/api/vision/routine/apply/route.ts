import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { VisionRoutineApplyPayload, VisionRoutineDayOfWeek } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DAY_OFFSETS: Record<VisionRoutineDayOfWeek, number> = {
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
  SATURDAY: 5,
  SUNDAY: 6,
};

/**
 * Calcula la fecha y hora completa a partir de la fecha base de la semana, el día y la hora "HH:mm"
 */
function calculateDateTime(baseMonday: Date, dayOfWeek: VisionRoutineDayOfWeek, timeStr: string): Date {
  const offset = DAY_OFFSETS[dayOfWeek] ?? 0;
  const target = new Date(baseMonday);
  target.setDate(baseMonday.getDate() + offset);

  const [hours, minutes] = timeStr.split(":").map((v) => parseInt(v, 10) || 0);
  target.setHours(hours, minutes, 0, 0);
  return target;
}

/**
 * Obtiene el lunes de la semana de una fecha dada
 */
function getMondayOfDate(dateInput: Date | string): Date {
  const d = new Date(dateInput);
  const day = d.getDay(); // 0 is Sunday, 1 is Monday...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as VisionRoutineApplyPayload;
    const {
      targetStartDate,
      classes = [],
      gymSessions = [],
      studySessions = [],
      habits = [],
      createCalendarEvents = true,
      createTasks = true,
      createHabits = true,
    } = body;

    const baseMonday = getMondayOfDate(targetStartDate || new Date());

    const result = await prisma.$transaction(async (tx) => {
      let createdEventsCount = 0;
      let createdTasksCount = 0;
      let createdHabitsCount = 0;

      // 1. Insertar Clases en CalendarEvent
      if (createCalendarEvents && classes.length > 0) {
        for (const c of classes) {
          const startTime = calculateDateTime(baseMonday, c.dayOfWeek, c.startTime);
          const endTime = calculateDateTime(baseMonday, c.dayOfWeek, c.endTime);

          const externalId = `vision-class-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

          await tx.calendarEvent.create({
            data: {
              externalId,
              summary: c.subject,
              description: `Clase universitaria detectada por Visión Artificial. Aula: ${c.classroom || "No especificada"}`,
              location: c.classroom || null,
              startTime,
              endTime,
              status: "CONFIRMED",
              rawData: JSON.stringify({ origin: "VISION_ROUTINE", dayOfWeek: c.dayOfWeek }),
            },
          });
          createdEventsCount++;
        }
      }

      // 2. Insertar Sesiones de Gimnasio
      if (gymSessions.length > 0) {
        for (const g of gymSessions) {
          const startTime = calculateDateTime(baseMonday, g.dayOfWeek, g.startTime);
          const endTime = calculateDateTime(baseMonday, g.dayOfWeek, g.endTime);

          // Como evento de calendario
          if (createCalendarEvents) {
            const externalId = `vision-gym-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            await tx.calendarEvent.create({
              data: {
                externalId,
                summary: `Gimnasio: ${g.focus}`,
                description: `Entrenamiento programado por Agente de Visión. Razón: ${g.rationale}`,
                startTime,
                endTime,
                status: "CONFIRMED",
                rawData: JSON.stringify({ origin: "VISION_ROUTINE", type: "GYM", focus: g.focus }),
              },
            });
            createdEventsCount++;
          }

          // Como tarea operativa
          if (createTasks) {
            await tx.task.create({
              data: {
                title: `Gimnasio: ${g.focus}`,
                description: `Sesión de fuerza/acondicionamiento. ${g.rationale}`,
                priority: "HIGH",
                estimatedDuration: g.durationMinutes || 90,
                scheduledStart: startTime,
                scheduledEnd: endTime,
                deadline: endTime,
                type: "RECURRING",
                origin: "MULTIMODAL_ROUTINE",
                status: "PENDING",
              },
            });
            createdTasksCount++;
          }
        }
      }

      // 3. Insertar Bloques de Estudio
      if (studySessions.length > 0) {
        for (const s of studySessions) {
          const startTime = calculateDateTime(baseMonday, s.dayOfWeek, s.startTime);
          const endTime = calculateDateTime(baseMonday, s.dayOfWeek, s.endTime);

          if (createTasks) {
            await tx.task.create({
              data: {
                title: `Estudio: ${s.subject}`,
                description: `Bloque de concentración académica para ${s.subject}. ${s.rationale}`,
                priority: "MEDIUM",
                estimatedDuration: s.durationMinutes || 90,
                scheduledStart: startTime,
                scheduledEnd: endTime,
                deadline: endTime,
                type: "NORMAL",
                origin: "MULTIMODAL_ROUTINE",
                status: "PENDING",
              },
            });
            createdTasksCount++;
          }
        }
      }

      // 4. Insertar Hábitos propuestos
      if (createHabits && habits.length > 0) {
        for (const h of habits) {
          const existing = await tx.habit.findFirst({
            where: {
              title: {
                equals: h.title,
                mode: "insensitive",
              },
            },
          });

          if (!existing) {
            await tx.habit.create({
              data: {
                title: h.title,
                description: h.description,
                category: h.category,
                frequency: h.frequency,
                targetDays: h.targetDays,
                active: true,
              },
            });
            createdHabitsCount++;
          }
        }
      }

      // 5. Registrar acción en ai_actions
      await tx.aiAction.create({
        data: {
          agentName: "PLANNING_AGENT",
          title: "Rutina Semanal Aplicada desde Visión Artificial",
          description: `Se han configurado ${createdEventsCount} eventos en calendario, ${createdTasksCount} tareas y ${createdHabitsCount} hábitos nuevos a partir del horario universitario analizado.`,
          category: "performance",
          actionType: "CALENDAR_RESCHEDULE",
          status: "APPROVED",
          payload: JSON.stringify({
            classesCount: classes.length,
            gymSessionsCount: gymSessions.length,
            studySessionsCount: studySessions.length,
            habitsCount: habits.length,
            baseMonday: baseMonday.toISOString(),
          }),
        },
      });

      return {
        createdEventsCount,
        createdTasksCount,
        createdHabitsCount,
      };
    });

    return apiSuccess(result, {
      message: `Rutina aplicada con éxito: ${result.createdEventsCount} eventos de calendario, ${result.createdTasksCount} tareas y ${result.createdHabitsCount} hábitos.`,
    });
  } catch (error) {
    return handleApiError(error, "Error al aplicar la rutina en el sistema.");
  }
}
