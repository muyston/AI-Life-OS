import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, handleApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const agentName = searchParams.get("agentName");
    const limit = Number(searchParams.get("limit")) || 30;

    const actions = await prisma.aiAction.findMany({
      where: {
        ...(status && status !== "ALL" ? { status } : {}),
        ...(agentName && agentName !== "ALL" ? { agentName } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return apiSuccess(actions);
  } catch (error) {
    return handleApiError(error, "Error al recuperar el feed de acciones IA.");
  }
}
