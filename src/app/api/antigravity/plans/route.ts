import { NextRequest } from "next/server";
import { 
  getAntigravityPlanDetails, 
  approveAntigravityPlan, 
  importPlanTasksToLifeOs 
} from "@/lib/antigravity/antigravity-service";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return apiError("Parametro conversationId ausente.", { status: 400 });
    }

    const planData = await getAntigravityPlanDetails(conversationId);
    if (!planData) {
      return apiError("No se encontro documentacion para la conversacion especificada.", { status: 404 });
    }

    return apiSuccess(planData);
  } catch (error) {
    return handleApiError(error, "Error al recuperar los detalles del plan de Antigravity.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action, conversationId, approvalNote, projectId } = body;

    if (!conversationId) {
      return apiError("conversationId no proporcionado", { status: 400 });
    }

    if (action === "approve") {
      const result = await approveAntigravityPlan(conversationId, approvalNote);
      return apiSuccess(result, { message: result.message });
    }

    if (action === "import_tasks") {
      const result = await importPlanTasksToLifeOs(conversationId, projectId);
      return apiSuccess(result, { message: result.message });
    }

    return apiError("Accion no soportada en el endpoint de planes.", { status: 400 });
  } catch (error) {
    return handleApiError(error, "Error al procesar la operacion sobre el plan de Antigravity.");
  }
}
