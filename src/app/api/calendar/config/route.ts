import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { updateEnvVariable, getEnvVariable } from "@/lib/config-service";
import { syncCalendar } from "@/lib/calendar/google-calendar";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET: Obtiene la configuracion actual del calendario e informacion de conectividad
 */
export async function GET() {
  try {
    const rawUrl = getEnvVariable("GOOGLE_CALENDAR_ICAL_URL") || "";
    const isConfigured = Boolean(rawUrl && rawUrl.trim().length > 0);
    const isPublicUrl = rawUrl.includes("/public/basic.ics");
    const isPrivateUrl = rawUrl.includes("/private-");

    const eventsCount = await prisma.calendarEvent.count();
    const lastEvent = await prisma.calendarEvent.findFirst({
      orderBy: { syncedAt: "desc" },
      select: { syncedAt: true },
    });

    return apiSuccess({
      icalUrl: rawUrl,
      isConfigured,
      isPublicUrl,
      isPrivateUrl,
      eventsCount,
      lastSyncedAt: lastEvent?.syncedAt || null,
      statusRecommendation: isPublicUrl
        ? "El enlace actual es de tipo 'public'. Si el calendario no esta compartido publicamente en Google Calendar, devolvera error 404. Se recomienda usar la 'Direccion secreta en formato iCal'."
        : isConfigured
        ? "Configuracion activa."
        : "Sin enlace iCal configurado.",
    });
  } catch (error) {
    return handleApiError(error, "Error al recuperar la configuracion de calendario.");
  }
}

/**
 * POST: Guarda y valida una nueva URL iCal de Google Calendar
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { icalUrl } = body as { icalUrl?: string };

    if (!icalUrl || typeof icalUrl !== "string" || !icalUrl.trim().startsWith("http")) {
      return handleApiError(
        new Error("Debe proporcionar una URL valida que comience por http:// o https://"),
        "URL no valida"
      );
    }

    const trimmedUrl = icalUrl.trim();

    // Guardar en .env y memoria
    updateEnvVariable("GOOGLE_CALENDAR_ICAL_URL", trimmedUrl);

    // Ejecutar sincronizacion con la nueva URL
    const syncResult = await syncCalendar(trimmedUrl);

    return apiSuccess(
      {
        icalUrl: trimmedUrl,
        syncResult,
      },
      {
        message: syncResult.success
          ? `Enlace guardado y sincronizacion completada exitosamente (${syncResult.eventsSynced} eventos procesados).`
          : `Enlace guardado, pero hubo un detalle en la sincronizacion: ${syncResult.message}`,
      }
    );
  } catch (error) {
    return handleApiError(error, "Error al guardar y sincronizar la configuracion del calendario.");
  }
}
