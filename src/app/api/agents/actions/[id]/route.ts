import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { UpdateAiActionSchema } from "@/lib/validations/schemas";
import { PriorityLevel } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface RouteContext {
  params: { id: string };
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const json = await request.json().catch(() => ({}));
    const { status, execute } = UpdateAiActionSchema.parse(json);

    const action = await prisma.aiAction.findUnique({
      where: { id: params.id },
    });

    if (!action) {
      return apiError("Acción IA no encontrada.", { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (status === "APPROVED" && execute && action.payload) {
        try {
          const payload = JSON.parse(action.payload);

          if (action.actionType === "TASK_PROPOSAL") {
            const validPriorities: PriorityLevel[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL", "URGENT"];
            const priority: PriorityLevel = validPriorities.includes(payload.priority)
              ? payload.priority
              : "MEDIUM";

            await tx.task.create({
              data: {
                projectId: payload.projectId || null,
                title: payload.proposedTitle || action.title,
                description: payload.description || action.description,
                priority,
                estimatedDuration: Number(payload.estimatedDuration) || 30,
                status: "PENDING",
                origin: `${action.agentName}_AGENT`,
              },
            });
          } else if (action.actionType === "CALENDAR_RESCHEDULE" && Array.isArray(payload)) {
            for (const item of payload) {
              if (item.taskId && item.assignedStart && item.assignedEnd) {
                await tx.task.update({
                  where: { id: item.taskId },
                  data: {
                    scheduledStart: new Date(item.assignedStart),
                    scheduledEnd: new Date(item.assignedEnd),
                    status: "IN_PROGRESS",
                  },
                });
              }
            }
          }
        } catch (err) {
          console.warn("Advertencia al materializar payload de acción IA:", err);
        }
      }

      return await tx.aiAction.update({
        where: { id: params.id },
        data: { status },
      });
    });

    return apiSuccess(updated, { message: `Acción marcada como ${status}.` });
  } catch (error) {
    return handleApiError(error, "Error al actualizar la acción IA.");
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const existing = await prisma.aiAction.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return apiError("Acción IA no encontrada.", { status: 404 });
    }

    await prisma.aiAction.delete({
      where: { id: params.id },
    });

    return apiSuccess({ id: params.id }, { message: "Acción IA eliminada del feed." });
  } catch (error) {
    return handleApiError(error, "Error al eliminar la acción IA.");
  }
}