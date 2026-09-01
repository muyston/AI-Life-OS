import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json().catch(() => ({}));
    const { minutesSpent, notes, markCompleted } = body as {
      minutesSpent?: number;
      notes?: string;
      markCompleted?: boolean;
    };

    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      return apiError("Tarea no encontrada", { status: 404 });
    }

    const updatedDescription = notes && notes.trim()
      ? `${task.description ? task.description + "\n\n" : ""}[Sesión Deep Work - ${new Date().toLocaleDateString("es-ES")}]:\n${notes.trim()}`
      : task.description;

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        estimatedDuration: (task.estimatedDuration || 0) + (minutesSpent || 0),
        description: updatedDescription,
        status: markCompleted ? "COMPLETED" : task.status,
        completedAt: markCompleted ? new Date() : task.completedAt,
      },
    });

    return apiSuccess(updatedTask, {
      message: `Sesión de ${minutesSpent || 0} minutos registrada en la tarea.`,
    });
  } catch (error) {
    return handleApiError(error, "Error al registrar tiempo de foco.");
  }
}
