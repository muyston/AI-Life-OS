import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { ApplySolverSolutionSchema } from "@/lib/validations/schemas";
import { deterministicSolverAnalysis } from "@/lib/agents/solverAgent";
import { logAgentRun } from "@/lib/agents/agent-logger";
import {
  IdeaStructuredAnalysis,
  MultiSolutionAnalysis,
  SolverOption,
  ProjectCategory,
} from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface RouteContext {
  params: { id: string };
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const json = await request.json().catch(() => ({}));
    const validated = ApplySolverSolutionSchema.parse(json);

    const idea = await prisma.idea.findUnique({
      where: { id },
    });

    if (!idea) {
      return apiError("No se encontró la idea especificada.", { status: 404 });
    }

    // 1. Extraer el análisis multi-solución
    let solverAnalysis: MultiSolutionAnalysis | null = null;
    if (idea.analysis) {
      try {
        const parsed = JSON.parse(idea.analysis) as IdeaStructuredAnalysis;
        if (parsed.solverAnalysis) {
          solverAnalysis = parsed.solverAnalysis;
        }
      } catch {
        solverAnalysis = null;
      }
    }

    if (!solverAnalysis) {
      const parsedCat = ["tech", "business", "personal", "academic", "performance", "general"].includes(idea.category)
        ? (idea.category as ProjectCategory)
        : "tech";
      solverAnalysis = deterministicSolverAnalysis(idea.rawContent, parsedCat);
    }

    // 2. Localizar la opción seleccionada (option-a, option-b u option-c)
    const selectedOption: SolverOption | undefined = solverAnalysis.solutions.find(
      (s) => s.id === validated.selectedOptionId
    );

    if (!selectedOption) {
      return apiError(`No se encontró la opción ${validated.selectedOptionId} en la matriz de soluciones.`, {
        status: 400,
      });
    }

    const startTime = Date.now();

    // 3. Ejecutar transacción interactiva en base de datos
    const transactionResult = await prisma.$transaction(async (tx) => {
      let createdProjectId: string | null = null;
      let createdProjectName: string | null = null;
      let actionsCreatedCount = 0;
      let tasksCreatedCount = 0;

      if (validated.mode === "DISPATCH_TO_AI_ACTIONS") {
        for (const action of selectedOption.actions) {
          await tx.aiAction.create({
            data: {
              agentName: "ORCHESTRATOR",
              title: action.title,
              description: action.description,
              category: action.category,
              actionType: action.actionType,
              payload: JSON.stringify({
                sourceIdeaId: idea.id,
                solutionId: selectedOption.id,
                solutionType: selectedOption.type,
                badge: selectedOption.badge,
                estimatedDuration: action.estimatedDuration,
                priority: action.priority,
              }),
              status: "PENDING_REVIEW",
            },
          });
          actionsCreatedCount++;
        }
      } else if (validated.mode === "MATERIALIZE_AS_TASKS") {
        for (const action of selectedOption.actions) {
          await tx.task.create({
            data: {
              title: action.title,
              description: action.description,
              priority: action.priority,
              estimatedDuration: action.estimatedDuration,
              type: "AGENT_GENERATED",
              origin: "AGENT_PLANNING",
              status: "PENDING",
            },
          });
          tasksCreatedCount++;
        }
      } else if (validated.mode === "CREATE_PROJECT") {
        const targetCategory = validated.category || selectedOption.multidomainImpact.primaryDomain || "tech";
        const targetPriority = validated.priority || "HIGH";
        const projName = validated.projectName || selectedOption.title;

        const newProject = await tx.project.create({
          data: {
            name: projName,
            description: `${selectedOption.summary}\n\nEstrategia: ${selectedOption.badge}`,
            category: targetCategory,
            priority: targetPriority,
            status: "ACTIVE",
          },
        });

        createdProjectId = newProject.id;
        createdProjectName = newProject.name;

        for (const action of selectedOption.actions) {
          await tx.task.create({
            data: {
              projectId: newProject.id,
              title: action.title,
              description: action.description,
              priority: action.priority,
              estimatedDuration: action.estimatedDuration,
              type: "AGENT_GENERATED",
              origin: "AGENT_PLANNING",
              status: "PENDING",
            },
          });
          tasksCreatedCount++;
        }
      }

      return {
        mode: validated.mode,
        selectedOptionId: selectedOption.id,
        solutionTitle: selectedOption.title,
        badge: selectedOption.badge,
        actionsCreatedCount,
        tasksCreatedCount,
        createdProjectId,
        createdProjectName,
      };
    });

    const executionTimeMs = Date.now() - startTime;

    // 4. Registrar auditoría del agente
    await logAgentRun({
      agentName: "SOLVER_APPLY_SOLUTION",
      triggerType: "MANUAL",
      inputPayload: {
        ideaId: idea.id,
        selectedOptionId: validated.selectedOptionId,
        mode: validated.mode,
      },
      outputPayload: transactionResult,
      tokensUsed: 0,
      costEstimate: 0.0,
      status: "SUCCESS",
      executionTimeMs,
    });

    let message = "";
    if (validated.mode === "DISPATCH_TO_AI_ACTIONS") {
      message = `Se han despachado ${transactionResult.actionsCreatedCount} acciones al Feed de Actividad IA en estado pendiente de revisión.`;
    } else if (validated.mode === "MATERIALIZE_AS_TASKS") {
      message = `Se han creado ${transactionResult.tasksCreatedCount} tareas atómicas en la bandeja operativa.`;
    } else {
      message = `Proyecto "${transactionResult.createdProjectName}" creado con éxito con ${transactionResult.tasksCreatedCount} tareas vinculadas.`;
    }

    return apiSuccess(transactionResult, {
      message,
      status: 200,
    });
  } catch (error) {
    return handleApiError(error, "Error al aplicar la solución del Solver.");
  }
}
