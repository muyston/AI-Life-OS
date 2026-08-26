import ical from "node-ical";
import { prisma } from "../prisma";
import { FreeTimeSlot } from "../types";

export interface SyncCalendarResult {
  success: boolean;
  eventsSynced: number;
  message: string;
  source: "ICAL_URL" | "GOOGLE_API" | "MOCK";
}

/**
 * Sincroniza eventos de Google Calendar a traves del enlace privado iCal (ICS)
 */
export async function syncEventsFromIcal(icalUrl?: string): Promise<SyncCalendarResult> {
  const url = icalUrl || process.env.GOOGLE_CALENDAR_ICAL_URL;

  if (!url) {
    return {
      success: false,
      eventsSynced: 0,
      message: "No se ha configurado GOOGLE_CALENDAR_ICAL_URL en el entorno.",
      source: "ICAL_URL",
    };
  }

  try {
    const webEvents = await ical.async.fromURL(url);
    let count = 0;

    for (const key in webEvents) {
      if (!Object.prototype.hasOwnProperty.call(webEvents, key)) continue;
      const ev = webEvents[key];

      if (ev.type === "VEVENT" && ev.start && ev.end) {
        const externalId = ev.uid || key;
        const summary = ev.summary || "Evento sin titulo";
        const description = ev.description ? String(ev.description) : null;
        const location = ev.location ? String(ev.location) : null;
        const startTime = new Date(ev.start);
        const endTime = new Date(ev.end);
        const isAllDay = (ev as { datetype?: string }).datetype === "date" || 
          (endTime.getTime() - startTime.getTime()) >= 86400000;

        await prisma.calendarEvent.upsert({
          where: { externalId },
          update: {
            summary,
            description,
            startTime,
            endTime,
            isAllDay,
            location,
            status: "CONFIRMED",
            rawData: JSON.stringify({
              uid: ev.uid,
              created: ev.created,
              lastmodified: ev.lastmodified,
            }),
            syncedAt: new Date(),
          },
          create: {
            externalId,
            summary,
            description,
            startTime,
            endTime,
            isAllDay,
            location,
            status: "CONFIRMED",
            rawData: JSON.stringify({
              uid: ev.uid,
              created: ev.created,
              lastmodified: ev.lastmodified,
            }),
            syncedAt: new Date(),
          },
        });
        count++;
      }
    }

    return {
      success: true,
      eventsSynced: count,
      message: `Sincronizacion completada con exito. ${count} eventos sincronizados.`,
      source: "ICAL_URL",
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const is404 = errorMsg.includes("404") || (typeof error === "object" && error !== null && (error as { response?: { status?: number } }).response?.status === 404);
    
    const message = is404
      ? "Google Calendar devolvio error 404. Si el calendario no es publico, usa la 'Direccion secreta en formato iCal' (private) desde la configuracion de Google Calendar."
      : `Error al procesar el feed iCal: ${errorMsg}`;

    console.warn("Advertencia al sincronizar feed iCal:", message);
    return {
      success: false,
      eventsSynced: 0,
      message,
      source: "ICAL_URL",
    };
  }
}

/**
 * Calcula los huecos libres en un dia especifico dentro del horario laboral configurado (default: 08:30 a 19:30)
 */
export async function calculateFreeSlotsForDate(
  targetDate: Date,
  workDayStartHour = 8,
  workDayStartMinute = 30,
  workDayEndHour = 19,
  workDayEndMinute = 30
): Promise<FreeTimeSlot[]> {
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Obtener eventos del dia
  const events = await prisma.calendarEvent.findMany({
    where: {
      startTime: { lte: endOfDay },
      endTime: { gte: startOfDay },
      status: { not: "CANCELLED" },
    },
    orderBy: {
      startTime: "asc",
    },
  });

  // Ventana laboral del dia
  const windowStart = new Date(targetDate);
  windowStart.setHours(workDayStartHour, workDayStartMinute, 0, 0);

  const windowEnd = new Date(targetDate);
  windowEnd.setHours(workDayEndHour, workDayEndMinute, 0, 0);

  // Filtrar eventos y normalizar dentro de la ventana laboral
  const busyRanges: { start: Date; end: Date }[] = [];

  for (const ev of events) {
    if (ev.isAllDay) {
      // Si hay un evento de todo el dia, no consideramos huecos libres ese dia
      return [];
    }

    const evStart = new Date(Math.max(ev.startTime.getTime(), windowStart.getTime()));
    const evEnd = new Date(Math.min(ev.endTime.getTime(), windowEnd.getTime()));

    if (evStart < evEnd) {
      busyRanges.push({ start: evStart, end: evEnd });
    }
  }

  // Ordenar y fusionar intervalos ocupados solapados
  busyRanges.sort((a, b) => a.start.getTime() - b.start.getTime());

  const mergedBusy: { start: Date; end: Date }[] = [];
  for (const range of busyRanges) {
    if (mergedBusy.length === 0) {
      mergedBusy.push({ ...range });
    } else {
      const last = mergedBusy[mergedBusy.length - 1];
      if (range.start.getTime() <= last.end.getTime()) {
        if (range.end.getTime() > last.end.getTime()) {
          last.end = range.end;
        }
      } else {
        mergedBusy.push({ ...range });
      }
    }
  }

  // Calcular huecos libres complementarios
  const freeSlots: FreeTimeSlot[] = [];
  let currentPointer = new Date(windowStart);

  for (const busy of mergedBusy) {
    if (busy.start.getTime() > currentPointer.getTime()) {
      const duration = Math.round((busy.start.getTime() - currentPointer.getTime()) / (1000 * 60));
      if (duration >= 15) { // Minimo 15 minutos para ser un bloque util
        freeSlots.push({
          start: new Date(currentPointer),
          end: new Date(busy.start),
          durationMinutes: duration,
        });
      }
    }
    if (busy.end.getTime() > currentPointer.getTime()) {
      currentPointer = new Date(busy.end);
    }
  }

  // Ultimo hueco hasta el final de la ventana laboral
  if (windowEnd.getTime() > currentPointer.getTime()) {
    const duration = Math.round((windowEnd.getTime() - currentPointer.getTime()) / (1000 * 60));
    if (duration >= 15) {
      freeSlots.push({
        start: new Date(currentPointer),
        end: new Date(windowEnd),
        durationMinutes: duration,
      });
    }
  }

  return freeSlots;
}
