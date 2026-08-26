import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: "Tarea no encontrada." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    console.error("Error al obtener tarea:", error);
    return NextResponse.json(
      { success: false, error: "Error interno al recuperar la tarea." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      projectId,
      type,
      priority,
      status,
      deadline,
      estimatedDuration,
      origin,
      scheduledStart,
      scheduledEnd,
    } = body;

    const dataToUpdate: Record<string, unknown> = {};

    if (title !== undefined) dataToUpdate.title = title.trim();
    if (description !== undefined) dataToUpdate.description = description ? description.trim() : null;
    if (projectId !== undefined) dataToUpdate.projectId = projectId || null;
    if (type !== undefined) dataToUpdate.type = type;
    if (priority !== undefined) dataToUpdate.priority = priority;
    if (status !== undefined) {
      dataToUpdate.status = status;
      if (status === "COMPLETED") {
        dataToUpdate.completedAt = new Date();
      } else if (status === "PENDING" || status === "IN_PROGRESS") {
        dataToUpdate.completedAt = null;
      }
    }
    if (deadline !== undefined) dataToUpdate.deadline = deadline ? new Date(deadline) : null;
    if (estimatedDuration !== undefined) dataToUpdate.estimatedDuration = Number(estimatedDuration);
    if (origin !== undefined) dataToUpdate.origin = origin;
    if (scheduledStart !== undefined) dataToUpdate.scheduledStart = scheduledStart ? new Date(scheduledStart) : null;
    if (scheduledEnd !== undefined) dataToUpdate.scheduledEnd = scheduledEnd ? new Date(scheduledEnd) : null;

    const updated = await prisma.task.update({
      where: { id: params.id },
      data: dataToUpdate,
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error al actualizar tarea:", error);
    return NextResponse.json(
      { success: false, error: "Error interno al actualizar la tarea." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.task.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Tarea eliminada correctamente." });
  } catch (error) {
    console.error("Error al eliminar tarea:", error);
    return NextResponse.json(
      { success: false, error: "Error interno al eliminar la tarea." },
      { status: 500 }
    );
  }
}
