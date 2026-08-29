import { NextRequest } from "next/server";
import { runMultiAgentPipeline } from "@/lib/agents/orchestrator";
import { syncCalendar } from "@/lib/calendar/google-calendar";
import { apiSuccess, handleApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_request: NextRequest) {
  try {
    // 1. Sincronizar calendario automáticamente antes de la orquestación
    await syncCalendar();

    // 2. Ejecutar el pipeline de agentes completo para el briefing matutino
    const briefingResult = await runMultiAgentPipeline("CRON");

    return apiSuccess(briefingResult, {
      message: "Daily briefing matutino generado exitosamente por el Orchestrator.",
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    return handleApiError(error, "Error interno al ejecutar el daily briefing matutino.");
  }
}
