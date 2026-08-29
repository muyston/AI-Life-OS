import ical from "node-ical";
import { prisma } from "../prisma";
import { FreeTimeSlot } from "../types";

export interface SyncCalendarResult {
  success: boolean;
  eventsSynced: number;
  message: string;
  source: "ICAL_URL" | "GOOGLE_API" | "MOCK";
  details?: {
    singleEvents: number;
    recurringInstances: number;
  };
}

/**
 * Convierte o asegura que una fecha esté ajustada a la referencia de inicio del día
 */
function getStartOfDayInMadrid(d: Date): Date {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

/**
 * Convierte o asegura que una fecha esté ajustada a la referencia de fin del día
 */
function getEndOfDayInMadrid(d: Date): Date {
  const dt = new Date(d);
  dt.setHours(23, 59, 59, 999);
  return dt;
}

/**
 * Sincroniza eventos de Google Calendar a traves del enlace privado iCal (ICS)
 * con soporte estricto de eventos recurrentes (rrule), exclusiones (exdate) y zona horaria.
 */
export async function syncEventsFromIcal(icalUrl?: string): Promise<SyncCalendarResult> {
  const url = icalUrl || process.env.GOOGLE_CALENDAR_ICAL_URL;

  if (!url) {
    return {
      success: false,
      eventsSynced: 0,
      message: "No se ha configurado GOOGLE_CALENDAR_ICAL_URL en las variables de entorno.",
      source: "ICAL_URL",
    };
  }

  try {
    // 1. Descarga del feed ICS desactivando la cache de Vercel/Next.js
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });

    if (!response.ok) {
      const is404 = response.status === 404;
      const message = is404
        ? "Google Calendar devolvio error 404. Asegurese de usar la 'Direccion secreta en formato iCal' (privada) desde los ajustes de Google Calendar."
        : `Error HTTP ${response.status} al descargar el feed de Google Calendar.`;

      console.warn("Advertencia de sincronizacion iCal:", message);
      return {
        success: false,
        eventsSynced: 0,
        message,
        source: "ICAL_URL",
      };
    }

    const icsText = await response.text();
    const parsedEvents = ical.sync.parseICS(icsText);

    // 2. Ventana de expansion para eventos recurrentes: 30 dias atras y 90 dias adelante
    const now = new Date();
    const windowStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    let singleEventsCount = 0;
    let recurringInstancesCount = 0;

    for (const key in parsedEvents) {
      if (!Object.prototype.hasOwnProperty.call(parsedEvents, key)) continue;
      const ev = parsedEvents[key];

      if (ev.type !== "VEVENT") continue;

      const summary = ev.summary ? String(ev.summary).trim() : "Evento sin titulo";
      const description = ev.description ? String(ev.description) : null;
      const location = ev.location ? String(ev.location) : null;
      const uid = ev.uid || key;

      // Evento recurrente con regla rrule
      if (ev.rrule && typeof ev.rrule.between === "function" && ev.start && ev.end) {
        const originalDuration = new Date(ev.end).getTime() - new Date(ev.start).getTime();
        const occurrences = ev.rrule.between(windowStart, windowEnd, true);

        // Conjunto de fechas excluidas
        const exdateMap = new Set<string>();
        if (ev.exdate) {
          if (Array.isArray(ev.exdate)) {
            for (const ex of ev.exdate) {
              const exDateStr = new Date(ex).toISOString().split("T")[0];
              exdateMap.add(exDateStr);
            }
          } else if (typeof ev.exdate === "object") {
            for (const k in ev.exdate) {
              const exDateStr = new Date(ev.exdate[k]).toISOString().split("T")[0];
              exdateMap.add(exDateStr);
            }
          }
        }

        for (const occ of occurrences) {
          const occDate = new Date(occ);
          const dateIsoKey = occDate.toISOString().split("T")[0];

          // Si la fecha esta excluida expresamente, omitir
          if (exdateMap.has(dateIsoKey)) {
            continue;
          }

          // Verificar si existe una sobreescritura (recurrence override)
          let occSummary = summary;
          let occDesc = description;
          let occLoc = location;
          let occStart = occDate;
          let occEnd = new Date(occStart.getTime() + originalDuration);

          if (ev.recurrences && ev.recurrences[dateIsoKey]) {
            const override = ev.recurrences[dateIsoKey];
            if (override.summary) occSummary = String(override.summary);
            if (override.description) occDesc = String(override.description);
            if (override.location) occLoc = String(override.location);
            if (override.start) occStart = new Date(override.start);
            if (override.end) occEnd = new Date(override.end);
          }

          const isAllDay = (ev as { datetype?: string }).datetype === "date" || 
            (occEnd.getTime() - occStart.getTime()) >= 86400000;

          const externalId = `${uid}_${dateIsoKey}`;

          await prisma.calendarEvent.upsert({
            where: { externalId },
            update: {
              summary: occSummary,
              description: occDesc,
              startTime: occStart,
              endTime: occEnd,
              isAllDay,
              location: occLoc,
              status: "CONFIRMED",
              rawData: JSON.stringify({
                uid,
                isRecurringInstance: true,
                dateIsoKey,
              }),
              syncedAt: new Date(),
            },
            create: {
              externalId,
              summary: occSummary,
              description: occDesc,
              startTime: occStart,
              endTime: occEnd,
              isAllDay,
              location: occLoc,
              status: "CONFIRMED",
              rawData: JSON.stringify({
                uid,
                isRecurringInstance: true,
                dateIsoKey,
              }),
              syncedAt: new Date(),
            },
          });

          recurringInstancesCount++;
        }
      } else if (ev.start && ev.end) {
        // Evento puntual no recurrente
        const startTime = new Date(ev.start);
        const endTime = new Date(ev.end);
        const isAllDay = (ev as { datetype?: string }).datetype === "date" || 
          (endTime.getTime() - startTime.getTime()) >= 86400000;

        await prisma.calendarEvent.upsert({
          where: { externalId: uid },
          update: {
            summary,
            description,
            startTime,
            endTime,
            isAllDay,
            location,
            status: "CONFIRMED",
            rawData: JSON.stringify({
              uid,
              created: ev.created,
              lastmodified: ev.lastmodified,
            }),
            syncedAt: new Date(),
          },
          create: {
            externalId: uid,
            summary,
            description,
            startTime,
            endTime,
            isAllDay,
            location,
            status: "CONFIRMED",
            rawData: JSON.stringify({
              uid,
              created: ev.created,
              lastmodified: ev.lastmodified,
            }),
            syncedAt: new Date(),
          },
        });

        singleEventsCount++;
      }
    }

    const totalSynced = singleEventsCount + recurringInstancesCount;

    return {
      success: true,
      eventsSynced: totalSynced,
      message: `Sincronizacion completada con exito. ${totalSynced} eventos procesados (${singleEventsCount} puntuales, ${recurringInstancesCount} instancias recurrentes).`,
      source: "ICAL_URL",
      details: {
        singleEvents: singleEventsCount,
        recurringInstances: recurringInstancesCount,
      },
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const message = `Error al procesar el feed iCal: ${errorMsg}`;

    console.error("Error critico en syncEventsFromIcal:", error);
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
 * ajustando a zona horaria Europe/Madrid.
 */
export async function calculateFreeSlotsForDate(
  targetDate: Date,
  workDayStartHour = 8,
  workDayStartMinute = 30,
  workDayEndHour = 19,
  workDayEndMinute = 30
): Promise<FreeTimeSlot[]> {
  const startOfDay = getStartOfDayInMadrid(targetDate);
  const endOfDay = getEndOfDayInMadrid(targetDate);

  // Obtener eventos del dia que solapan con la fecha de interes
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
