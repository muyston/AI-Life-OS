import { prisma } from "../prisma";
import { syncEventsFromIcal, calculateFreeSlotsForDate, SyncCalendarResult } from "./ical-service";

/**
 * Servicio unificado de sincronizacion de calendario
 */
export async function syncCalendar(explicitIcalUrl?: string): Promise<SyncCalendarResult> {
  const icalUrl = explicitIcalUrl || process.env.GOOGLE_CALENDAR_ICAL_URL;

  if (icalUrl) {
    return await syncEventsFromIcal(icalUrl);
  }

  // Si no hay configuracion externa, verificamos si ya hay eventos en la BD
  const existingEventsCount = await prisma.calendarEvent.count();

  if (existingEventsCount > 0) {
    return {
      success: true,
      eventsSynced: existingEventsCount,
      message: `Calendario operativo con ${existingEventsCount} eventos existentes en base de datos.`,
      source: "MOCK",
    };
  }

  return {
    success: false,
    eventsSynced: 0,
    message: "No se ha configurado GOOGLE_CALENDAR_ICAL_URL en .env. Configure el enlace iCal de su calendario para sincronizacion automatica.",
    source: "ICAL_URL",
  };
}

/**
 * Inserta eventos iniciales de prueba representativos si el usuario lo solicita
 */
export async function seedDemoCalendarEvents(): Promise<number> {
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth();
  const d = today.getDate();

  const demoEvents = [
    {
      externalId: `demo-event-1-${y}-${m}-${d}`,
      summary: "Reunion de Seguimiento Tecnico",
      description: "Revisión de arquitectura y sincronizacion de hitos semanales.",
      startTime: new Date(y, m, d, 9, 30),
      endTime: new Date(y, m, d, 10, 30),
      location: "Google Meet",
      status: "CONFIRMED",
    },
    {
      externalId: `demo-event-2-${y}-${m}-${d}`,
      summary: "Revision de Metricas y Operaciones",
      description: "Analisis de rendimiento y ejecucion de servicios.",
      startTime: new Date(y, m, d, 12, 0),
      endTime: new Date(y, m, d, 13, 0),
      location: "Oficina",
      status: "CONFIRMED",
    },
    {
      externalId: `demo-event-3-${y}-${m}-${d}`,
      summary: "Sincronizacion de Proyectos Activos",
      description: "Puesta en comun de prioridades y dependencias criticas.",
      startTime: new Date(y, m, d, 16, 0),
      endTime: new Date(y, m, d, 17, 0),
      location: "Google Meet",
      status: "CONFIRMED",
    },
  ];

  let count = 0;
  for (const ev of demoEvents) {
    await prisma.calendarEvent.upsert({
      where: { externalId: ev.externalId },
      update: {
        summary: ev.summary,
        description: ev.description,
        startTime: ev.startTime,
        endTime: ev.endTime,
        location: ev.location,
        status: ev.status,
        syncedAt: new Date(),
      },
      create: {
        externalId: ev.externalId,
        summary: ev.summary,
        description: ev.description,
        startTime: ev.startTime,
        endTime: ev.endTime,
        location: ev.location,
        status: ev.status,
        syncedAt: new Date(),
      },
    });
    count++;
  }

  return count;
}

export { calculateFreeSlotsForDate };
