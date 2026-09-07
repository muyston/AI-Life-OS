import { NextRequest } from "next/server";
import { scanAntigravityWorkspaces } from "@/lib/antigravity/antigravity-service";
import { apiSuccess, handleApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const workspaces = await scanAntigravityWorkspaces();
    return apiSuccess(workspaces, {
      message: `Se han detectado ${workspaces.length} workspaces de Antigravity en el entorno local.`,
    });
  } catch (error) {
    return handleApiError(error, "Error al escanear los workspaces de Antigravity.");
  }
}
