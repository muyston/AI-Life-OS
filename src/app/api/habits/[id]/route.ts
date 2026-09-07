import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json().catch(() => ({}));

    const existing = await prisma.habit.findUnique({
      where: { id },
    });

    if (!existing) {
      return apiError("Hábito no encontrado.", { status: 404 });
    }

    const updated = await prisma.habit.update({
      where: { id },
      data: {
        ...(body.title !== undefined ? { title: body.title.trim() } : {}),
        ...(body.description !== undefined ? { description: body.description?.trim() || null } : {}),
        ...(body.category !== undefined ? { category: body.category } : {}),
        ...(body.frequency !== undefined ? { frequency: body.frequency } : {}),
        ...(body.targetDays !== undefined ? { targetDays: Number(body.targetDays) } : {}),
        ...(body.active !== undefined ? { active: Boolean(body.active) } : {}),
      },
    });

    return apiSuccess(updated, { message: "Hábito actualizado correctamente." });
  } catch (error) {
    return handleApiError(error, "Error al actualizar el hábito.");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const existing = await prisma.habit.findUnique({
      where: { id },
    });

    if (!existing) {
      return apiError("Hábito no encontrado.", { status: 404 });
    }

    await prisma.habit.delete({
      where: { id },
    });

    return apiSuccess({ deletedId: id }, { message: "Hábito eliminado correctamente." });
  } catch (error) {
    return handleApiError(error, "Error al eliminar el hábito.");
  }
}
