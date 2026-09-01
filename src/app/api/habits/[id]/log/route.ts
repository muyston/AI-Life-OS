import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, handleApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: habitId } = params;
    const body = await request.json().catch(() => ({}));
    const todayStr = new Date().toISOString().split("T")[0];
    const targetDate = body.date || todayStr;

    // Verificar si ya existe log para hoy
    const existingLog = await prisma.habitLog.findUnique({
      where: {
        habitId_date: {
          habitId,
          date: targetDate,
        },
      },
    });

    if (existingLog) {
      // Toggle estado
      const updated = await prisma.habitLog.update({
        where: { id: existingLog.id },
        data: {
          completed: !existingLog.completed,
        },
      });

      return apiSuccess(updated, {
        message: updated.completed
          ? "Hábito marcado como completado hoy."
          : "Hábito desmarcado.",
      });
    }

    // Crear nuevo log
    const newLog = await prisma.habitLog.create({
      data: {
        habitId,
        date: targetDate,
        completed: true,
      },
    });

    return apiSuccess(newLog, {
      status: 201,
      message: "Hábito completado con éxito hoy.",
    });
  } catch (error) {
    return handleApiError(error, "Error al registrar estado del hábito.");
  }
}
