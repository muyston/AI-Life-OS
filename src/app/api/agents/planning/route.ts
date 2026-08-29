import { NextRequest } from "next/server";
import { runPlanningAgent } from "@/lib/agents/planning-agent";
import { prisma } from "@/lib/prisma";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { ApplyPlanningSchema } from "@/lib/validations/schemas";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const json = await request.json().catch(() => ({}));
    const validated = ApplyPlanningSchema.parse(json);

    if (validated.action === "APPLY" && Array.isArray(validated.assignments) && validated.assignments.length > 0) {
      // Aplicar el plan confirmado por el usuario en una transacción atómica
      const appliedCount = await prisma.$transaction(async (tx) => {
        let count = 0;
        for (const item of validated.assignments!) {
          if (item.taskId && item.assignedStart && item.assignedEnd) {
            await tx.task.update({
              where: { id: item.taskId },
              data: {
                scheduledStart: new Date(item.assignedStart),
                scheduledEnd: new Date(item.assignedEnd),
                status: "IN_PROGRESS",
              },
            });
            count++;
          }
        }
        return count;
      });

      return apiSuccess(
        { appliedCount },
        { message: `Plan aplicado con éxito a ${appliedCount} tareas.` }
      );
    }

    // Ejecutar el agente de planificación
    const proposal = await runPlanningAgent(validated.targetDate, "MANUAL");

    return apiSuccess(proposal);
  } catch (error) {
    return handleApiError(error, "Error al ejecutar el Agente de Planificación.");
  }
}
