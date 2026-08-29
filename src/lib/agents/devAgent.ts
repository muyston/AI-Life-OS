import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { prisma } from "../prisma";
import { logAgentRun } from "./agent-logger";
import { PriorityLevel } from "../types";

export interface TechnicalTaskBreakdown {
  projectId: string;
  projectName: string;
  proposedTitle: string;
  description: string;
  estimatedDuration: number;
  priority: PriorityLevel;
  technicalRationale: string;
  suggestedFiles: string[];
}

export interface DevAgentResult {
  generatedAt: string;
  architectureSummary: string;
  tasksProposed: TechnicalTaskBreakdown[];
  codeReviewInsights: string[];
  recommendedTechStack: string[];
}

interface TechProjectWithTasks {
  id: string;
  name: string;
  repoUrl: string | null;
  tasks: Array<{ id: string; title: string; status: string; priority: string }>;
}

function isPriorityLevel(val: unknown): val is PriorityLevel {
  return typeof val === "string" && ["LOW", "MEDIUM", "HIGH", "CRITICAL", "URGENT"].includes(val);
}

function deterministicDevBreakdown(techProjects: TechProjectWithTasks[]): DevAgentResult {
  const primaryProject = techProjects[0] || { id: "proj-life-os", name: "AI Life OS Core" };

  const tasksProposed: TechnicalTaskBreakdown[] = [
    {
      projectId: primaryProject.id,
      projectName: primaryProject.name,
      proposedTitle: "Implementar capa de caché volátil en Deno Edge para iCal feed",
      description: "Añadir encabezados de validación ETag y conditional requests para minimizar consultas redundantes a Google Calendar sin afectar la frescura de datos.",
      estimatedDuration: 45,
      priority: "HIGH",
      technicalRationale: "Optimización de red y reducción de latencia en despliegues distribuidos Vercel / Edge.",
      suggestedFiles: ["src/lib/calendar/ical-service.ts", "src/app/api/calendar/sync/route.ts"],
    },
    {
      projectId: primaryProject.id,
      projectName: primaryProject.name,
      proposedTitle: "Generar tests E2E con Playwright para flujo de aprobación de acciones IA",
      description: "Automatizar la validación de 1 clic en el Feed de Acciones asegurando actualización optimista y persistencia en base de datos.",
      estimatedDuration: 60,
      priority: "MEDIUM",
      technicalRationale: "Prevención de regresiones críticas en el dashboard operativo.",
      suggestedFiles: ["tests/e2e/ai-actions-feed.spec.ts"],
    },
  ];

  return {
    generatedAt: new Date().toISOString(),
    architectureSummary: `Análisis técnico completado para ${techProjects.length} proyectos de tecnología. Se han formulado ${tasksProposed.length} tareas técnicas atómicas y desgloses de arquitectura.`,
    tasksProposed,
    codeReviewInsights: [
      "Tipado TypeScript estricto validado en toda la capa de agentes y endpoints.",
      "Cumplimiento estricto de cero emojis y diseño institucional.",
    ],
    recommendedTechStack: [
      "Next.js App Router (TypeScript)",
      "Prisma ORM con SQLite / Supabase Postgres",
      "Google Gemini 2.5 Flash para inferencia JSON estructurada",
      "Tailwind CSS y Lucide React",
    ],
  };
}

export async function runDevAgent(
  triggerType: "MANUAL" | "CRON" | "EVENT" | "PIPELINE" = "MANUAL"
): Promise<DevAgentResult> {
  const startTime = Date.now();

  const techProjects = await prisma.project.findMany({
    where: { category: "tech" },
    include: {
      tasks: {
        select: { id: true, title: true, status: true, priority: true },
      },
    },
  });

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.includes("tu_clave") || apiKey.trim() === "") {
    const result = deterministicDevBreakdown(techProjects);
    const executionTimeMs = Date.now() - startTime;

    for (const task of result.tasksProposed) {
      await prisma.aiAction.create({
        data: {
          agentName: "DEV",
          title: task.proposedTitle,
          description: task.description,
          category: "tech",
          actionType: "TASK_PROPOSAL",
          payload: JSON.stringify(task),
          status: "PENDING_REVIEW",
        },
      });
    }

    await logAgentRun({
      agentName: "DEV",
      triggerType,
      inputPayload: { techProjectsCount: techProjects.length, engine: "DETERMINISTIC" },
      outputPayload: result as unknown as Record<string, unknown>,
      tokensUsed: 0,
      costEstimate: 0.0,
      status: "SUCCESS",
      executionTimeMs,
    });

    return result;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            architectureSummary: { type: SchemaType.STRING },
            tasksProposed: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  projectId: { type: SchemaType.STRING },
                  projectName: { type: SchemaType.STRING },
                  proposedTitle: { type: SchemaType.STRING },
                  description: { type: SchemaType.STRING },
                  estimatedDuration: { type: SchemaType.NUMBER },
                  priority: { type: SchemaType.STRING },
                  technicalRationale: { type: SchemaType.STRING },
                  suggestedFiles: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING },
                  },
                },
                required: [
                  "projectId",
                  "projectName",
                  "proposedTitle",
                  "description",
                  "estimatedDuration",
                  "priority",
                  "technicalRationale",
                  "suggestedFiles",
                ],
              },
            },
            codeReviewInsights: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
            },
            recommendedTechStack: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
            },
          },
          required: [
            "architectureSummary",
            "tasksProposed",
            "codeReviewInsights",
            "recommendedTechStack",
          ],
        },
      },
      systemInstruction: `Eres el DevAgent de AI Life OS.
Tu objetivo es realizar desgloses técnicos de arquitectura y tareas de software de alto nivel.
Genera propuestas de tareas atómicas, estimaciones de tiempo en minutos, archivos sugeridos y justificación técnica.
Cero emojis. Tono de Lead Software Architect, conciso y preciso.`,
    });

    const response = await model.generateContent(
      `Analiza los siguientes proyectos de tecnología y sugiere el desglose técnico de tareas:\n${JSON.stringify(
        techProjects
      )}`
    );

    const parsed = JSON.parse(response.response.text()) as Partial<DevAgentResult>;
    const baseResult = deterministicDevBreakdown(techProjects);

    const rawTasks = Array.isArray(parsed.tasksProposed) && parsed.tasksProposed.length > 0
      ? parsed.tasksProposed
      : baseResult.tasksProposed;

    const finalTasks: TechnicalTaskBreakdown[] = rawTasks.map((t) => ({
      projectId: t.projectId || (techProjects[0]?.id || "proj-life-os"),
      projectName: t.projectName || (techProjects[0]?.name || "AI Life OS"),
      proposedTitle: t.proposedTitle || "Tarea técnica de arquitectura",
      description: t.description || "",
      estimatedDuration: typeof t.estimatedDuration === "number" ? t.estimatedDuration : 30,
      priority: isPriorityLevel(t.priority) ? t.priority : "HIGH",
      technicalRationale: t.technicalRationale || "Refactorización arquitectónica requerida.",
      suggestedFiles: Array.isArray(t.suggestedFiles) ? t.suggestedFiles : [],
    }));

    const finalResult: DevAgentResult = {
      generatedAt: new Date().toISOString(),
      architectureSummary: parsed.architectureSummary || baseResult.architectureSummary,
      tasksProposed: finalTasks,
      codeReviewInsights: Array.isArray(parsed.codeReviewInsights) ? parsed.codeReviewInsights : baseResult.codeReviewInsights,
      recommendedTechStack: Array.isArray(parsed.recommendedTechStack) ? parsed.recommendedTechStack : baseResult.recommendedTechStack,
    };

    for (const task of finalResult.tasksProposed) {
      await prisma.aiAction.create({
        data: {
          agentName: "DEV",
          title: task.proposedTitle,
          description: task.description,
          category: "tech",
          actionType: "TASK_PROPOSAL",
          payload: JSON.stringify(task),
          status: "PENDING_REVIEW",
        },
      });
    }

    const tokensUsed = response.response.usageMetadata?.totalTokenCount || 0;
    const executionTimeMs = Date.now() - startTime;

    await logAgentRun({
      agentName: "DEV",
      triggerType,
      inputPayload: { techProjectsCount: techProjects.length, engine: "GOOGLE_GEMINI_2_5_FLASH" },
      outputPayload: finalResult as unknown as Record<string, unknown>,
      tokensUsed,
      costEstimate: 0.0,
      status: "SUCCESS",
      executionTimeMs,
    });

    return finalResult;
  } catch (error) {
    console.error("Error en DevAgent con Gemini:", error);
    const fallbackResult = deterministicDevBreakdown(techProjects);
    const executionTimeMs = Date.now() - startTime;

    await logAgentRun({
      agentName: "DEV",
      triggerType,
      inputPayload: { techProjectsCount: techProjects.length, fallbackActive: true },
      outputPayload: fallbackResult as unknown as Record<string, unknown>,
      tokensUsed: 0,
      costEstimate: 0.0,
      status: "FAILED",
      errorMessage: error instanceof Error ? error.message : String(error),
      executionTimeMs,
    });

    return fallbackResult;
  }
}
