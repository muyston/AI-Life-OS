import { NextRequest } from "next/server";
import { syncAntigravityProjects } from "@/lib/antigravity/antigravity-sync";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const totalProjects = await prisma.project.count();
    const totalTasks = await prisma.task.count();
    const lastProject = await prisma.project.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    });

    return apiSuccess({
      totalProjects,
      totalTasks,
      lastSyncTime: lastProject?.updatedAt || null,
      status: "READY",
    });
  } catch (error) {
    return handleApiError(error, "Error al consultar estado de sincronizacion de proyectos.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await syncAntigravityProjects();
    return apiSuccess(result, {
      message: result.message,
    });
  } catch (error) {
    return handleApiError(error, "Error durante la sincronizacion de proyectos de Antigravity.");
  }
}
