import { NextRequest } from "next/server";
import { runSpecialistAgent, runMultiAgentPipeline, SPECIALIST_AGENTS } from "@/lib/agents/orchestrator";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { RunAgentSchema } from "@/lib/validations/schemas";
import { AgentName } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return apiSuccess(SPECIALIST_AGENTS);
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json().catch(() => ({}));
    const validated = RunAgentSchema.parse(json);

    if (validated.agentName === "ALL" || validated.agentName === "PIPELINE" || validated.agentName === "ORCHESTRATOR") {
      const result = await runMultiAgentPipeline(validated.triggerType, validated.targetDate);
      return apiSuccess(result, {
        message: "Pipeline Multi-Agente ejecutado con éxito.",
        meta: { agentName: "ORCHESTRATOR" },
      });
    }

    const result = await runSpecialistAgent(validated.agentName as AgentName, {
      targetDate: validated.targetDate,
      triggerType: validated.triggerType,
    });

    return apiSuccess(result.data, {
      message: result.message,
      meta: { agentName: result.agentName },
    });
  } catch (error) {
    return handleApiError(error, "Error interno al procesar la ejecución del agente.");
  }
}
