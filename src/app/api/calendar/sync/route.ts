import { NextRequest, NextResponse } from "next/server";
import { syncCalendar, seedDemoCalendarEvents } from "@/lib/calendar/google-calendar";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action } = body as { action?: string };

    if (action === "seed_demo") {
      const count = await seedDemoCalendarEvents();
      return NextResponse.json({
        success: true,
        message: `Se han configurado ${count} eventos iniciales de prueba en la agenda.`,
        eventsSynced: count,
        source: "DEMO_SEED",
      });
    }

    const result = await syncCalendar();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error al sincronizar calendario:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error interno al sincronizar el calendario.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
