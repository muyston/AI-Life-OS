import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { processIdeaPipeline } from "@/lib/agents/ideaLabAgent";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { CreateIdeaSchema } from "@/lib/validations/schemas";
import { IdeaStructuredAnalysis } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const ideas = await prisma.idea.findMany({
      where: {
        ...(status && status !== "ALL" ? { status } : {}),
        ...(category && category !== "ALL" ? { category } : {}),
        ...(search && search.trim() !== ""
          ? {
              rawContent: {
                contains: search.trim(),
              },
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    const parsedIdeas = ideas.map((idea) => {
      let structuredAnalysis: IdeaStructuredAnalysis | null = null;
      if (idea.analysis) {
        try {
          structuredAnalysis = JSON.parse(idea.analysis) as IdeaStructuredAnalysis;
        } catch {
          structuredAnalysis = null;
        }
      }
      return {
        ...idea,
        structuredAnalysis,
      };
    });

    return apiSuccess(parsedIdeas);
  } catch (error) {
    return handleApiError(error, "Error al recuperar las ideas.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json().catch(() => ({}));
    const validated = CreateIdeaSchema.parse(json);

    // 1. Guardar la entrada inicialmente en estado PROCESSING
    const initialIdea = await prisma.idea.create({
      data: {
        rawContent: validated.rawContent.trim(),
        category: validated.category || "general",
        status: "PROCESSING",
        assignedAgent: validated.assignedAgent || "general",
      },
    });

    // 2. Ejecutar clasificador, especialista y estructuración
    const result = await processIdeaPipeline(initialIdea.id, validated.assignedAgent);

    if (!result.success || !result.data) {
      return apiError(result.error || "Fallo en el procesamiento de la idea.", {
        status: 500,
        details: initialIdea,
      });
    }

    return apiSuccess(result.data, {
      status: 201,
      message: "Idea procesada y analizada correctamente.",
    });
  } catch (error) {
    return handleApiError(error, "Error al procesar la idea.");
  }
}
