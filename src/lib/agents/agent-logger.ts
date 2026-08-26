import { prisma } from "../prisma";

interface LogAgentRunOptions {
  agentName: string;
  triggerType: "MANUAL" | "CRON" | "EVENT";
  inputPayload?: Record<string, unknown> | null;
  outputPayload?: Record<string, unknown> | null;
  tokensUsed?: number;
  costEstimate?: number;
  status: "SUCCESS" | "FAILED" | "RUNNING";
  errorMessage?: string | null;
  executionTimeMs: number;
}

export async function logAgentRun(options: LogAgentRunOptions) {
  try {
    const run = await prisma.agentRun.create({
      data: {
        agentName: options.agentName,
        triggerType: options.triggerType,
        inputPayload: options.inputPayload ? JSON.stringify(options.inputPayload) : null,
        outputPayload: options.outputPayload ? JSON.stringify(options.outputPayload) : null,
        tokensUsed: options.tokensUsed || 0,
        costEstimate: options.costEstimate || 0.0,
        status: options.status,
        errorMessage: options.errorMessage || null,
        executionTimeMs: options.executionTimeMs,
      },
    });
    return run;
  } catch (error) {
    console.error("Error al registrar ejecucion de agente en AgentRun:", error);
    return null;
  }
}
