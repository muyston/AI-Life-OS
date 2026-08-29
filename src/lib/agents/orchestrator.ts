import { prisma } from "../prisma";
import { logAgentRun } from "./agent-logger";
import { runStrategyAgent, StrategyAgentResult } from "./strategyAgent";
import { runSalesAgent, SalesAgentResult } from "./salesAgent";
import { runDevAgent, DevAgentResult } from "./devAgent";
import { runOperationsAgent, OperationsAgentResult } from "./operationsAgent";
import { AgentName, SPECIALIST_AGENTS } from "../types";
export { SPECIALIST_AGENTS };

export interface OrchestratorPipelineResult {
  executionId: string;
  timestamp: string;
  triggerType: "MANUAL" | "CRON" | "EVENT" | "PIPELINE";
  executiveRoadmap: string;
  executiveSummary: string;
  strategy: StrategyAgentResult;
  sales: SalesAgentResult;
  dev: DevAgentResult;
  operations: OperationsAgentResult;
  actionsCreatedCount: number;
  totalTokensUsed: number;
  totalExecutionTimeMs: number;
}

export async function runSpecialistAgent(
  agentName: AgentName,
  options?: { targetDate?: string; triggerType?: "MANUAL" | "CRON" | "EVENT" | "PIPELINE" }
): Promise<{
  success: boolean;
  agentName: AgentName;
  data: unknown;
  message: string;
}> {
  const triggerType = options?.triggerType || "MANUAL";

  switch (agentName) {
    case "STRATEGY": {
      const data = await runStrategyAgent(triggerType);
      return { success: true, agentName, data, message: "StrategyAgent ejecutado correctamente." };
    }
    case "SALES": {
      const data = await runSalesAgent(triggerType);
      return { success: true, agentName, data, message: "SalesAgent ejecutado correctamente." };
    }
    case "DEV": {
      const data = await runDevAgent(triggerType);
      return { success: true, agentName, data, message: "DevAgent ejecutado correctamente." };
    }
    case "OPERATIONS":
    case "PLANNING_AGENT": {
      const data = await runOperationsAgent(options?.targetDate, triggerType);
      return { success: true, agentName: "OPERATIONS", data, message: "OperationsAgent ejecutado correctamente." };
    }
    case "ORCHESTRATOR": {
      const data = await runMultiAgentPipeline(triggerType, options?.targetDate);
      return { success: true, agentName, data, message: "Pipeline multi-agente completado con éxito." };
    }
    default: {
      throw new Error(`Agente no reconocido: ${agentName}`);
    }
  }
}

export async function runMultiAgentPipeline(
  triggerType: "MANUAL" | "CRON" | "EVENT" | "PIPELINE" = "MANUAL",
  targetDateInput?: string
): Promise<OrchestratorPipelineResult> {
  const startTime = Date.now();

  // 1. Ejecutar en paralelo o cascada los especialistas
  const [strategyResult, salesResult, devResult, operationsResult] = await Promise.all([
    runStrategyAgent("PIPELINE"),
    runSalesAgent("PIPELINE"),
    runDevAgent("PIPELINE"),
    runOperationsAgent(targetDateInput, "PIPELINE"),
  ]);

  const totalExecutionTimeMs = Date.now() - startTime;

  // 2. Contar acciones generadas en estado pendiente de revisión
  const pendingActionsCount = await prisma.aiAction.count({
    where: { status: "PENDING_REVIEW" },
  });

  // 3. Sintetizar roadmap ejecutivo institucional
  const executiveRoadmap = `ROADMAP OPERATIVO Y ESTRATÉGICO DIARIO

1. ESTRATEGIA Y SALUD GLOBAL:
   - Índice de Salud del Sistema: ${strategyResult.scoreGlobalSystem}%
   - Alertas estratégicas activas: ${strategyResult.strategicAlerts.length}

2. DESARROLLO Y TECNOLOGÍA:
   - Tareas atómicas desglosadas: ${devResult.tasksProposed.length}
   - Foco técnico: ${devResult.tasksProposed[0]?.proposedTitle || "Mantenimiento general de arquitectura"}

3. PIPELINE COMERCIAL Y VENTAS:
   - Borradores de prospección generados: ${salesResult.draftsGenerated.length}
   - Estado: Requieren validación humana en el Feed de Acciones

4. OPERACIONES Y AGENDA:
   - Tiempo libre disponible hoy: ${operationsResult.totalFreeMinutes} minutos en ${operationsResult.freeSlotsCount} ventanas
   - Tareas programadas en huecos de Google Calendar: ${operationsResult.tasksScheduledCount}`;

  const pipelineResult: OrchestratorPipelineResult = {
    executionId: `pipeline-${Date.now()}`,
    timestamp: new Date().toISOString(),
    triggerType,
    executiveRoadmap,
    executiveSummary: executiveRoadmap,
    strategy: strategyResult,
    sales: salesResult,
    dev: devResult,
    operations: operationsResult,
    actionsCreatedCount: pendingActionsCount,
    totalTokensUsed: 0,
    totalExecutionTimeMs,
  };

  await logAgentRun({
    agentName: "ORCHESTRATOR",
    triggerType,
    inputPayload: { targetDate: targetDateInput || new Date().toISOString(), pipeline: "FULL_CASCADE" },
    outputPayload: {
      summary: executiveRoadmap,
      scoreGlobal: strategyResult.scoreGlobalSystem,
      tasksScheduled: operationsResult.tasksScheduledCount,
      draftsGenerated: salesResult.draftsGenerated.length,
      tasksProposed: devResult.tasksProposed.length,
    },
    tokensUsed: 0,
    costEstimate: 0.0,
    status: "SUCCESS",
    executionTimeMs: totalExecutionTimeMs,
  });

  return pipelineResult;
}
