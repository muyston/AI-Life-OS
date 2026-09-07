import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateFreeSlotsForDate } from "@/lib/calendar/ical-service";
import { apiSuccess, handleApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const dateParam = searchParams.get("date");

    let rangeStart: Date;
    let rangeEnd: Date;
    let targetDate: Date;

    if (startDateParam && endDateParam) {
      rangeStart = new Date(startDateParam);
      rangeEnd = new Date(endDateParam);
      rangeEnd.setHours(23, 59, 59, 999);
      targetDate = new Date(startDateParam);
    } else if (dateParam) {
      targetDate = new Date(dateParam);
      // Ventana completa: 15 dias antes y 45 dias despues para cubrir la cuadricula mensual completa
      rangeStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      rangeStart.setDate(rangeStart.getDate() - 7);
      rangeStart.setHours(0, 0, 0, 0);

      rangeEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
      rangeEnd.setDate(rangeEnd.getDate() + 14);
      rangeEnd.setHours(23, 59, 59, 999);
    } else {
      targetDate = new Date();
      rangeStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      rangeStart.setDate(rangeStart.getDate() - 7);
      rangeStart.setHours(0, 0, 0, 0);

      rangeEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
      rangeEnd.setDate(rangeEnd.getDate() + 14);
      rangeEnd.setHours(23, 59, 59, 999);
    }

    let events = await prisma.calendarEvent.findMany({
      where: {
        startTime: { lte: rangeEnd },
        endTime: { gte: rangeStart },
        status: { not: "CANCELLED" },
      },
      orderBy: { startTime: "asc" },
    });

    // Si no hay eventos en base de datos para este rango, intentar auto-sincronizar de Google Calendar
    if (events.length === 0 && process.env.GOOGLE_CALENDAR_ICAL_URL) {
      const { syncCalendar } = await import("@/lib/calendar/google-calendar");
      await syncCalendar().catch(() => null);
      events = await prisma.calendarEvent.findMany({
        where: {
          startTime: { lte: rangeEnd },
          endTime: { gte: rangeStart },
          status: { not: "CANCELLED" },
        },
        orderBy: { startTime: "asc" },
      });
    }

    const freeSlots = await calculateFreeSlotsForDate(targetDate);

    const data = {
      date: targetDate.toISOString().split("T")[0],
      rangeStart: rangeStart.toISOString(),
      rangeEnd: rangeEnd.toISOString(),
      events,
      freeSlots,
      summary: {
        totalEvents: events.length,
        freeSlotsCount: freeSlots.length,
        totalFreeMinutes: freeSlots.reduce((acc, s) => acc + s.durationMinutes, 0),
      },
    };

    return apiSuccess(data);
  } catch (error) {
    return handleApiError(error, "Error interno al recuperar eventos del calendario.");
  }
}
