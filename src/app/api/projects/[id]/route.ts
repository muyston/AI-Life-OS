import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { UpdateProjectSchema } from "@/lib/validations/schemas";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface RouteContext {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        tasks: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!project) {
      return apiError("Proyecto no encontrado.", { status: 404 });
    }

    return apiSuccess(project);
  } catch (error) {
    return handleApiError(error, "Error al recuperar el proyecto.");
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const json = await request.json().catch(() => ({}));
    const validated = UpdateProjectSchema.parse(json);

    const existing = await prisma.project.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return apiError("Proyecto no encontrado.", { status: 404 });
    }

    const updated = await prisma.project.update({
      where: { id: params.id },
      data: {
        ...(validated.name !== undefined && { name: validated.name.trim() }),
        ...(validated.description !== undefined && { description: validated.description?.trim() || null }),
        ...(validated.repoUrl !== undefined && { repoUrl: validated.repoUrl?.trim() || null }),
        ...(validated.category !== undefined && { category: validated.category }),
        ...(validated.status !== undefined && { status: validated.status }),
        ...(validated.priority !== undefined && { priority: validated.priority }),
      },
    });

    return apiSuccess(updated, { message: "Proyecto actualizado correctamente." });
  } catch (error) {
    return handleApiError(error, "Error al actualizar el proyecto.");
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const existing = await prisma.project.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return apiError("Proyecto no encontrado.", { status: 404 });
    }

    await prisma.project.delete({
      where: { id: params.id },
    });

    return apiSuccess({ id: params.id }, { message: "Proyecto eliminado correctamente." });
  } catch (error) {
    return handleApiError(error, "Error al eliminar el proyecto.");
  }
}
