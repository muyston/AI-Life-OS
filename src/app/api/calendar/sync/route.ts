import { NextRequest } from "next/server";
import { syncCalendar, seedDemoCalendarEvents } from "@/lib/calendar/google-calendar";
import { apiSuccess, handleApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action } = body as { action?: string };

    if (action === "seed_demo") {
      const count = await seedDemoCalendarEvents();
      return apiSuccess(
        {
          eventsSynced: count,
          source: "DEMO_SEED",
        },
        {
          message: `Se han configurado ${count} eventos iniciales de prueba en la agenda.`,
        }
      );
    }

    const result = await syncCalendar();
    return apiSuccess(result, {
      message: result.message,
    });
  } catch (error) {
    return handleApiError(error, "Error interno al sincronizar el calendario.");
  }
}
