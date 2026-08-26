import { NextRequest, NextResponse } from "next/server";
import { runPlanningAgent } from "@/lib/agents/planning-agent";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action, targetDate, assignments } = body as {
      action?: "RUN" | "APPLY";
      targetDate?: string;
      assignments?: Array<{
        taskId: string;
        assignedStart: string;
        assignedEnd: string;
      }>;
    };

    if (action === "APPLY" && Array.isArray(assignments)) {
      // Aplicar el plan confirmado por el usuario en la base de datos
      let appliedCount = 0;
      for (const item of assignments) {
        if (item.taskId && item.assignedStart && item.assignedEnd) {
          await prisma.task.update({
            where: { id: item.taskId },
            data: {
              scheduledStart: new Date(item.assignedStart),
              scheduledEnd: new Date(item.assignedEnd),
              status: "IN_PROGRESS",
            },
          });
          appliedCount++;
        }
      }

      return NextResponse.json({
        success: true,
        message: `Plan aplicado con éxito a ${appliedCount} tareas.`,
        appliedCount,
      });
    }

    // Ejecutar el agente de planificacion
    const proposal = await runPlanningAgent(targetDate, "MANUAL");

    return NextResponse.json({
      success: true,
      data: proposal,
    });
  } catch (error) {
    console.error("Error en API de Agente de Planificacion:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error interno al ejecutar el Agente de Planificación.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
