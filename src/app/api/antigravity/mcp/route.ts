import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getAntigravityMcpServers } from "@/lib/antigravity/antigravity-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const servers = await getAntigravityMcpServers();
    return apiSuccess({
      servers,
      totalServers: servers.length,
      connectedAt: new Date().toISOString(),
    });
  } catch (error) {
    return handleApiError(error, "Error al consultar los servidores MCP de Antigravity.");
  }
}
