import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateFreeSlotsForDate } from "@/lib/calendar/ical-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const targetDate = dateParam ? new Date(dateParam) : new Date();

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const events = await prisma.calendarEvent.findMany({
      where: {
        startTime: { lte: endOfDay },
        endTime: { gte: startOfDay },
        status: { not: "CANCELLED" },
      },
      orderBy: { startTime: "asc" },
    });

    const freeSlots = await calculateFreeSlotsForDate(targetDate);

    return NextResponse.json({
      success: true,
      data: {
        date: targetDate.toISOString().split("T")[0],
        events,
        freeSlots,
        summary: {
          totalEvents: events.length,
          freeSlotsCount: freeSlots.length,
          totalFreeMinutes: freeSlots.reduce((acc, s) => acc + s.durationMinutes, 0),
        },
      },
    });
  } catch (error) {
    console.error("Error al obtener eventos de calendario:", error);
    return NextResponse.json(
      { success: false, error: "Error interno al recuperar eventos del calendario." },
      { status: 500 }
    );
  }
}
