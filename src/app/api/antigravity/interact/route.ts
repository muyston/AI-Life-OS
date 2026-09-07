import { NextRequest } from "next/server";
import { dispatchAntigravityInstruction } from "@/lib/antigravity/antigravity-service";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { projectPath, instruction, category, createTask } = body;

    if (!projectPath || !instruction) {
      return apiError("Se requieren projectPath e instruction para despachar la directiva.", { status: 400 });
    }

    const result = await dispatchAntigravityInstruction({
      projectPath,
      instruction,
      category,
      createTask: createTask ?? true,
    });

    return apiSuccess(result, {
      message: result.message,
    });
  } catch (error) {
    return handleApiError(error, "Error al enviar directiva al workspace de Antigravity.");
  }
}
