import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Formatea una fecha a formato ICS UTC (YYYYMMDDTHHmmssZ)
 */
function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/**
 * Escapa texto plano para formato iCalendar RFC 5545
 */
function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export async function GET(request: NextRequest) {
  try {
    // 1. Obtener tareas con fecha programada o con deadline
    const tasks = await prisma.task.findMany({
      where: {
        status: { not: "CANCELLED" },
        OR: [
          { scheduledStart: { not: null } },
          { deadline: { not: null } },
        ],
      },
      include: {
        project: {
          select: { name: true, category: true },
        },
      },
      orderBy: { scheduledStart: "asc" },
    });

    const nowIcs = formatIcsDate(new Date());

    // 2. Construir cabecera iCalendar
    const icsLines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//AI Life OS//Task Planning Feed//ES",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:AI Life OS - Tareas y Foco",
      "X-WR-TIMEZONE:Europe/Madrid",
      "X-WR-CALDESC:Feed dinámico de tareas programadas y bloques de trabajo de AI Life OS",
    ];

    // 3. Generar eventos para cada tarea
    for (const task of tasks) {
      const uid = `task-${task.id}@lifeos.local`;
      const summary = `[Life OS] ${task.title}`;
      const projectName = task.project?.name ? `Proyecto: ${task.project.name}` : "Sin proyecto";
      const priorityStr = `Prioridad: ${task.priority}`;
      const durationStr = `Duración estimada: ${task.estimatedDuration} min`;
      const desc = `${projectName}\n${priorityStr}\n${durationStr}\n\n${task.description || ""}`;

      let start = task.scheduledStart ? new Date(task.scheduledStart) : new Date(task.deadline!);
      let end = task.scheduledEnd
        ? new Date(task.scheduledEnd)
        : new Date(start.getTime() + (task.estimatedDuration || 30) * 60 * 1000);

      if (isNaN(start.getTime())) continue;
      if (isNaN(end.getTime()) || end <= start) {
        end = new Date(start.getTime() + 30 * 60 * 1000);
      }

      icsLines.push("BEGIN:VEVENT");
      icsLines.push(`UID:${uid}`);
      icsLines.push(`DTSTAMP:${nowIcs}`);
      icsLines.push(`DTSTART:${formatIcsDate(start)}`);
      icsLines.push(`DTEND:${formatIcsDate(end)}`);
      icsLines.push(`SUMMARY:${escapeIcsText(summary)}`);
      icsLines.push(`DESCRIPTION:${escapeIcsText(desc)}`);
      icsLines.push(`STATUS:${task.status === "COMPLETED" ? "CONFIRMED" : "TENTATIVE"}`);
      icsLines.push(`CATEGORIES:${task.project?.category ? task.project.category.toUpperCase() : "TASK"}`);
      icsLines.push("END:VEVENT");
    }

    icsLines.push("END:VCALENDAR");

    const icsContent = icsLines.join("\r\n");

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'inline; filename="lifeos-tasks.ics"',
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error al exportar feed iCal:", error);
    return new NextResponse("Error al generar feed iCal", { status: 500 });
  }
}
