import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { DailyReflection } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "30", 10);

    const records = await prisma.idea.findMany({
      where: {
        category: "personal",
        assignedAgent: "strategy",
        rawContent: { startsWith: "[REFLEXION" },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const reflections: DailyReflection[] = [];

    for (const r of records) {
      if (r.analysis) {
        try {
          const parsed = JSON.parse(r.analysis);
          reflections.push({
            id: r.id,
            ...parsed,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString(),
          });
        } catch {
          // Si no es JSON valido, ignorar o adaptar
        }
      }
    }

    return apiSuccess(reflections);
  } catch (error) {
    return handleApiError(error, "Error al recuperar las reflexiones diarias.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const dateStr = body.date || new Date().toISOString().split("T")[0];
    const type = body.type || "EVENING";

    const reflectionPayload = {
      date: dateStr,
      type,
      domainRatings: body.domainRatings || {
        tech: 8,
        business: 8,
        academic: 8,
        performance: 8,
        personal: 8,
      },
      clarityScore: body.clarityScore || 8,
      energyScore: body.energyScore || 8,
      wins: body.wins || [],
      frictionPoints: body.frictionPoints || [],
      keyLearnings: body.keyLearnings || [],
      nextDayCommitments: body.nextDayCommitments || [],
      notes: body.notes || "",
      audioTranscript: body.audioTranscript || null,
      paperScanImageUrl: body.paperScanImageUrl || null,
      paperScanAnalysis: body.paperScanAnalysis || null,
    };

    const summaryHeadline = `[REFLEXION ${type}] ${dateStr} - Claridad: ${reflectionPayload.clarityScore}/10 | Energia: ${reflectionPayload.energyScore}/10`;

    const saved = await prisma.idea.create({
      data: {
        rawContent: summaryHeadline,
        category: "personal",
        status: "COMPLETED",
        assignedAgent: "strategy",
        analysis: JSON.stringify(reflectionPayload),
      },
    });

    // Si hay compromisos o tareas derivadas, crear tareas opcionales
    if (Array.isArray(body.nextDayCommitments) && body.nextDayCommitments.length > 0) {
      for (const commitment of body.nextDayCommitments.slice(0, 3)) {
        if (typeof commitment === "string" && commitment.trim().length > 3) {
          await prisma.task.create({
            data: {
              title: commitment.trim(),
              description: `Compromiso derivado de la reflexion diaria del ${dateStr}`,
              type: "NORMAL",
              priority: "HIGH",
              status: "PENDING",
              origin: "MANUAL",
              estimatedDuration: 45,
            },
          });
        }
      }
    }

    return apiSuccess({
      id: saved.id,
      ...reflectionPayload,
      createdAt: saved.createdAt.toISOString(),
      updatedAt: saved.updatedAt.toISOString(),
    });
  } catch (error) {
    return handleApiError(error, "Error al registrar la reflexion diaria.");
  }
}
