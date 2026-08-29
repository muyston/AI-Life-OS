import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { UpdateTaskSchema } from "@/lib/validations/schemas";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface RouteContext {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        project: {
          select: { id: true, name: true, category: true },
        },
      },
    });

    if (!task) {
      return apiError("Tarea no encontrada.", { status: 404 });
    }

    return apiSuccess(task);
  } catch (error) {
    return handleApiError(error, "Error al recuperar la tarea.");
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const json = await request.json().catch(() => ({}));
    const validated = UpdateTaskSchema.parse(json);

    const existing = await prisma.task.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return apiError("Tarea no encontrada.", { status: 404 });
    }

    const dataToUpdate: Record<string, unknown> = {};

    if (validated.title !== undefined) dataToUpdate.title = validated.title.trim();
    if (validated.description !== undefined) dataToUpdate.description = validated.description ? validated.description.trim() : null;
    if (validated.projectId !== undefined) dataToUpdate.projectId = validated.projectId || null;
    if (validated.type !== undefined) dataToUpdate.type = validated.type;
    if (validated.priority !== undefined) dataToUpdate.priority = validated.priority;
    if (validated.status !== undefined) {
      dataToUpdate.status = validated.status;
      if (validated.status === "COMPLETED") {
        dataToUpdate.completedAt = new Date();
      } else if (validated.status === "PENDING" || validated.status === "IN_PROGRESS") {
        dataToUpdate.completedAt = null;
      }
    }
    if (validated.deadline !== undefined) {
      dataToUpdate.deadline = validated.deadline ? new Date(validated.deadline) : null;
    }
    if (validated.estimatedDuration !== undefined) {
      dataToUpdate.estimatedDuration = validated.estimatedDuration;
    }
    if (validated.origin !== undefined) {
      dataToUpdate.origin = validated.origin;
    }
    if (validated.scheduledStart !== undefined) {
      dataToUpdate.scheduledStart = validated.scheduledStart ? new Date(validated.scheduledStart) : null;
    }
    if (validated.scheduledEnd !== undefined) {
      dataToUpdate.scheduledEnd = validated.scheduledEnd ? new Date(validated.scheduledEnd) : null;
    }
    if (validated.completedAt !== undefined) {
      dataToUpdate.completedAt = validated.completedAt ? new Date(validated.completedAt) : null;
    }

    const updated = await prisma.task.update({
      where: { id: params.id },
      data: dataToUpdate,
      include: {
        project: {
          select: { id: true, name: true, category: true },
        },
      },
    });

    return apiSuccess(updated, { message: "Tarea actualizada correctamente." });
  } catch (error) {
    return handleApiError(error, "Error al actualizar la tarea.");
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const existing = await prisma.task.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return apiError("Tarea no encontrada.", { status: 404 });
    }

    await prisma.task.delete({
      where: { id: params.id },
    });

    return apiSuccess({ id: params.id }, { message: "Tarea eliminada correctamente." });
  } catch (error) {
    return handleApiError(error, "Error al eliminar la tarea.");
  }
}
