import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { processIdeaPipeline } from "@/lib/agents/ideaLabAgent";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { UpdateIdeaSchema } from "@/lib/validations/schemas";
import { IdeaStructuredAnalysis } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface RouteContext {
  params: { id: string };
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const idea = await prisma.idea.findUnique({
      where: { id },
    });

    if (!idea) {
      return apiError("Idea no encontrada.", { status: 404 });
    }

    let structuredAnalysis: IdeaStructuredAnalysis | null = null;
    if (idea.analysis) {
      try {
        structuredAnalysis = JSON.parse(idea.analysis) as IdeaStructuredAnalysis;
      } catch {
        structuredAnalysis = null;
      }
    }

    return apiSuccess({
      ...idea,
      structuredAnalysis,
    });
  } catch (error) {
    return handleApiError(error, "Error al recuperar la idea.");
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const json = await request.json().catch(() => ({}));
    const validated = UpdateIdeaSchema.parse(json);

    const existing = await prisma.idea.findUnique({
      where: { id },
    });

    if (!existing) {
      return apiError("Idea no encontrada.", { status: 404 });
    }

    // Actualizar contenido preliminar si fue suministrado
    if (validated.rawContent && validated.rawContent !== existing.rawContent) {
      await prisma.idea.update({
        where: { id },
        data: {
          rawContent: validated.rawContent.trim(),
          category: validated.category || existing.category,
        },
      });
    }

    // Si se solicita reanálisis
    if (validated.reanalyze) {
      const result = await processIdeaPipeline(id, validated.assignedAgent);

      if (!result.success || !result.data) {
        return apiError(result.error || "Error al re-analizar la idea.", { status: 500 });
      }

      return apiSuccess(result.data, { message: "Idea re-analizada con éxito." });
    }

    const updated = await prisma.idea.update({
      where: { id },
      data: {
        ...(validated.category ? { category: validated.category } : {}),
        ...(validated.assignedAgent ? { assignedAgent: validated.assignedAgent } : {}),
      },
    });

    let structuredAnalysis: IdeaStructuredAnalysis | null = null;
    if (updated.analysis) {
      try {
        structuredAnalysis = JSON.parse(updated.analysis) as IdeaStructuredAnalysis;
      } catch {
        structuredAnalysis = null;
      }
    }

    return apiSuccess(
      {
        ...updated,
        structuredAnalysis,
      },
      { message: "Idea actualizada correctamente." }
    );
  } catch (error) {
    return handleApiError(error, "Error al actualizar la idea.");
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const existing = await prisma.idea.findUnique({
      where: { id },
    });

    if (!existing) {
      return apiError("Idea no encontrada.", { status: 404 });
    }

    await prisma.idea.delete({
      where: { id },
    });

    return apiSuccess({ id }, { message: "Idea eliminada correctamente." });
  } catch (error) {
    return handleApiError(error, "Error al eliminar la idea.");
  }
}
