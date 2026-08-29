import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { ConvertIdeaSchema } from "@/lib/validations/schemas";
import { IdeaStructuredAnalysis, ProjectCategory, PriorityLevel, TaskType } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface RouteContext {
  params: { id: string };
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const json = await request.json().catch(() => ({}));
    const validated = ConvertIdeaSchema.parse(json);

    const idea = await prisma.idea.findUnique({
      where: { id },
    });

    if (!idea) {
      return apiError("Idea no encontrada.", { status: 404 });
    }

    if (!idea.analysis) {
      return apiError("La idea no cuenta con un análisis estructurado previo.", { status: 400 });
    }

    let structuredAnalysis: IdeaStructuredAnalysis;
    try {
      structuredAnalysis = JSON.parse(idea.analysis) as IdeaStructuredAnalysis;
    } catch {
      return apiError("No se pudo interpretar el análisis estructurado de la idea.", { status: 400 });
    }

    const allActions = structuredAnalysis.recommendedActions || [];
    const actionsToConvert = Array.isArray(validated.selectedActionIndices) && validated.selectedActionIndices.length > 0
      ? allActions.filter((_, idx) => validated.selectedActionIndices!.includes(idx))
      : allActions;

    if (actionsToConvert.length === 0) {
      return apiError("No hay acciones disponibles para convertir.", { status: 400 });
    }

    const validCategories: ProjectCategory[] = ["tech", "business", "academic", "performance", "personal"];
    const projectCategory: ProjectCategory = (
      validated.category ||
      (structuredAnalysis.targetCategory && validCategories.includes(structuredAnalysis.targetCategory as ProjectCategory)
        ? (structuredAnalysis.targetCategory as ProjectCategory)
        : validCategories.includes(idea.category as ProjectCategory)
        ? (idea.category as ProjectCategory)
        : "tech")
    );

    // Caso 1: Convertir en Proyecto + Tareas asociadas dentro de una transacción
    if (validated.target === "PROJECT") {
      const finalProjectName = (validated.projectName || structuredAnalysis.suggestedProjectName || "Proyecto Derivado de Smart Inbox").trim();
      const projectDescription = `${structuredAnalysis.executiveSummary}\n\nNota original:\n${idea.rawContent}`;

      const result = await prisma.$transaction(async (tx) => {
        const createdProject = await tx.project.create({
          data: {
            name: finalProjectName,
            description: projectDescription,
            category: projectCategory,
            status: "ACTIVE",
            priority: validated.priority || "MEDIUM",
          },
        });

        const tasksToCreate = actionsToConvert.map((action) => ({
          projectId: createdProject.id,
          title: action.title,
          description: action.description || null,
          type: (action.type || "NORMAL") as TaskType,
          status: "PENDING",
          priority: (action.priority || "MEDIUM") as PriorityLevel,
          estimatedDuration: Number(action.estimatedDuration) || 30,
          origin: "IDEA_LAB",
        }));

        await tx.task.createMany({
          data: tasksToCreate,
        });

        const createdTasks = await tx.task.findMany({
          where: { projectId: createdProject.id },
        });

        return { project: createdProject, tasks: createdTasks };
      });

      return apiSuccess(
        {
          type: "PROJECT",
          project: result.project,
          tasks: result.tasks,
          tasksCount: result.tasks.length,
        },
        {
          status: 201,
          message: `Proyecto "${result.project.name}" y ${result.tasks.length} tareas creadas exitosamente.`,
        }
      );
    }

    // Caso 2: Convertir directamente en Tareas Pendientes sueltas
    const createdTasks = await prisma.$transaction(async (tx) => {
      const tasksData = actionsToConvert.map((action) => ({
        title: action.title,
        description: `${action.description || ""}\n\nOrigen: Smart Inbox (${idea.id})`,
        type: (action.type || "NORMAL") as TaskType,
        status: "PENDING",
        priority: (action.priority || "MEDIUM") as PriorityLevel,
        estimatedDuration: Number(action.estimatedDuration) || 30,
        origin: "IDEA_LAB",
      }));

      await tx.task.createMany({
        data: tasksData,
      });

      return await tx.task.findMany({
        where: { origin: "IDEA_LAB" },
        orderBy: { createdAt: "desc" },
        take: tasksData.length,
      });
    });

    return apiSuccess(
      {
        type: "TASKS",
        tasks: createdTasks,
        tasksCount: createdTasks.length,
      },
      {
        status: 201,
        message: `${createdTasks.length} tareas agregadas a la bandeja de pendientes.`,
      }
    );
  } catch (error) {
    return handleApiError(error, "Error interno al convertir la idea.");
  }
}
