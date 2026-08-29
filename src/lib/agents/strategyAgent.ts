import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { prisma } from "../prisma";
import { logAgentRun } from "./agent-logger";
import { ProjectCategory, PriorityLevel } from "../types";

export interface StrategyDomainMetric {
  category: ProjectCategory;
  projectCount: number;
  activeProjects: number;
  totalTasks: number;
  pendingTasks: number;
  completedTasks: number;
  urgentTasksCount: number;
  healthScore: number;
  statusSummary: string;
}

export interface StrategyAlertItem {
  id?: string;
  title: string;
  description: string;
  category: ProjectCategory;
  priority: PriorityLevel;
  recommendedAction: string;
}

export interface StrategyAgentResult {
  generatedAt: string;
  executiveSummary: string;
  domainMetrics: StrategyDomainMetric[];
  bottlenecksIdentified: string[];
  strategicAlerts: StrategyAlertItem[];
  scoreGlobalSystem: number;
}

interface ProjectWithTasks {
  id: string;
  name: string;
  category: string;
  status: string;
  priority: string;
  tasks: Array<{ id: string; status: string; priority: string }>;
}

function isProjectCategory(val: unknown): val is ProjectCategory {
  return typeof val === "string" && ["tech", "business", "academic", "performance", "personal"].includes(val);
}

function isPriorityLevel(val: unknown): val is PriorityLevel {
  return typeof val === "string" && ["LOW", "MEDIUM", "HIGH", "CRITICAL", "URGENT"].includes(val);
}

function deterministicStrategyAnalysis(projects: ProjectWithTasks[]): StrategyAgentResult {
  const categories: ProjectCategory[] = ["tech", "business", "academic", "performance", "personal"];
  const domainMetrics: StrategyDomainMetric[] = [];
  const bottlenecks: string[] = [];
  const strategicAlerts: StrategyAlertItem[] = [];

  for (const cat of categories) {
    const catProjects = projects.filter((p) => p.category === cat);
    const activeProjects = catProjects.filter((p) => p.status === "ACTIVE").length;
    let totalTasks = 0;
    let pendingTasks = 0;
    let completedTasks = 0;
    let urgentTasksCount = 0;

    for (const p of catProjects) {
      for (const t of p.tasks) {
        totalTasks++;
        if (t.status === "PENDING" || t.status === "IN_PROGRESS") {
          pendingTasks++;
          if (t.priority === "URGENT" || t.priority === "CRITICAL" || t.priority === "HIGH") {
            urgentTasksCount++;
          }
        } else if (t.status === "COMPLETED") {
          completedTasks++;
        }
      }
    }

    let healthScore = 100;
    if (catProjects.length === 0) {
      healthScore = 50;
    } else {
      if (urgentTasksCount > 2) healthScore -= 20;
      if (pendingTasks > 5 && completedTasks === 0) healthScore -= 25;
      if (activeProjects === 0 && catProjects.length > 0) healthScore -= 15;
    }
    healthScore = Math.max(20, Math.min(100, healthScore));

    let statusSummary = "Operatividad equilibrada.";
    if (urgentTasksCount > 0) {
      statusSummary = `${urgentTasksCount} tareas prioritarias requieren atención inmediata.`;
      bottlenecks.push(`Dominio ${cat.toUpperCase()}: ${urgentTasksCount} tareas de alta prioridad pendientes.`);
    } else if (catProjects.length === 0) {
      statusSummary = "Sin proyectos activos registrados en este dominio.";
    }

    domainMetrics.push({
      category: cat,
      projectCount: catProjects.length,
      activeProjects,
      totalTasks,
      pendingTasks,
      completedTasks,
      urgentTasksCount,
      healthScore,
      statusSummary,
    });
  }

  const scoreGlobalSystem = Math.round(
    domainMetrics.reduce((acc, m) => acc + m.healthScore, 0) / domainMetrics.length
  );

  const academicMetric = domainMetrics.find((m) => m.category === "academic");
  if (academicMetric && academicMetric.pendingTasks > 0) {
    strategicAlerts.push({
      title: "Supervisión de entregas de ingeniería UPM",
      description: "Se detectan tareas académicas en progreso que requieren revisión de hitos.",
      category: "academic",
      priority: "HIGH",
      recommendedAction: "Asignar bloque de estudio de 90 minutos en la próxima ventana libre.",
    });
  }

  const businessMetric = domainMetrics.find((m) => m.category === "business");
  if (businessMetric && businessMetric.urgentTasksCount > 0) {
    strategicAlerts.push({
      title: "Prioridad comercial en pipeline de clientes",
      description: "Existen tareas comerciales críticas que impactan en la captación y cierre.",
      category: "business",
      priority: "URGENT",
      recommendedAction: "Ejecutar revisión del SalesAgent y despachar borradores de prospección.",
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    executiveSummary: `Evaluación estratégica multidominio completada con índice de salud global del ${scoreGlobalSystem}%. Se monitorizan ${projects.length} proyectos en 5 dominios.`,
    domainMetrics,
    bottlenecksIdentified: bottlenecks.length > 0 ? bottlenecks : ["No se identificaron cuellos de botella críticos."],
    strategicAlerts,
    scoreGlobalSystem,
  };
}

export async function runStrategyAgent(
  triggerType: "MANUAL" | "CRON" | "EVENT" | "PIPELINE" = "MANUAL"
): Promise<StrategyAgentResult> {
  const startTime = Date.now();

  const projects = await prisma.project.findMany({
    include: {
      tasks: {
        select: { id: true, status: true, priority: true, deadline: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.includes("tu_clave") || apiKey.trim() === "") {
    const result = deterministicStrategyAnalysis(projects);
    const executionTimeMs = Date.now() - startTime;

    for (const alert of result.strategicAlerts) {
      await prisma.aiAction.create({
        data: {
          agentName: "STRATEGY",
          title: alert.title,
          description: alert.description,
          category: alert.category,
          actionType: "STRATEGY_ALERT",
          payload: JSON.stringify(alert),
          status: "PENDING_REVIEW",
        },
      });
    }

    await logAgentRun({
      agentName: "STRATEGY",
      triggerType,
      inputPayload: { projectsCount: projects.length, engine: "DETERMINISTIC" },
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
            executiveSummary: { type: SchemaType.STRING },
            scoreGlobalSystem: { type: SchemaType.NUMBER },
            bottlenecksIdentified: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
            },
            strategicAlerts: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  title: { type: SchemaType.STRING },
                  description: { type: SchemaType.STRING },
                  category: { type: SchemaType.STRING },
                  priority: { type: SchemaType.STRING },
                  recommendedAction: { type: SchemaType.STRING },
                },
                required: ["title", "description", "category", "priority", "recommendedAction"],
              },
            },
          },
          required: ["executiveSummary", "scoreGlobalSystem", "bottlenecksIdentified", "strategicAlerts"],
        },
      },
      systemInstruction: `Eres el StrategyAgent de AI Life OS.
Tu misión es auditar el equilibrio multidominio entre Tech, Business, Academic, Performance y Personal.
Identifica cuellos de botella, riesgos de sobrecarga y genera alertas estratégicas institucionales.
Prohibido el uso de emojis en cualquier texto o recomendación.
Tono corporativo, riguroso y conciso.`,
    });

    const promptData = JSON.stringify({
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        status: p.status,
        priority: p.priority,
        tasksCount: p.tasks.length,
        pendingTasks: p.tasks.filter((t) => t.status === "PENDING" || t.status === "IN_PROGRESS").length,
      })),
    });

    const response = await model.generateContent(
      `Realiza una evaluación estratégica de los siguientes proyectos:\n${promptData}`
    );

    const parsed = JSON.parse(response.response.text()) as Partial<StrategyAgentResult>;
    const baseAnalysis = deterministicStrategyAnalysis(projects);

    const sanitizedAlerts: StrategyAlertItem[] = (parsed.strategicAlerts || baseAnalysis.strategicAlerts).map((a) => ({
      title: a.title || "Alerta de supervisión estratégica",
      description: a.description || "Revisión operativa recomendada.",
      category: isProjectCategory(a.category) ? a.category : "tech",
      priority: isPriorityLevel(a.priority) ? a.priority : "MEDIUM",
      recommendedAction: a.recommendedAction || "Revisar estado de tareas en el dashboard.",
    }));

    const finalResult: StrategyAgentResult = {
      generatedAt: new Date().toISOString(),
      executiveSummary: parsed.executiveSummary || baseAnalysis.executiveSummary,
      domainMetrics: baseAnalysis.domainMetrics,
      bottlenecksIdentified: parsed.bottlenecksIdentified || baseAnalysis.bottlenecksIdentified,
      strategicAlerts: sanitizedAlerts,
      scoreGlobalSystem: typeof parsed.scoreGlobalSystem === "number" ? parsed.scoreGlobalSystem : baseAnalysis.scoreGlobalSystem,
    };

    for (const alert of finalResult.strategicAlerts) {
      await prisma.aiAction.create({
        data: {
          agentName: "STRATEGY",
          title: alert.title,
          description: alert.description,
          category: alert.category,
          actionType: "STRATEGY_ALERT",
          payload: JSON.stringify(alert),
          status: "PENDING_REVIEW",
        },
      });
    }

    const tokensUsed = response.response.usageMetadata?.totalTokenCount || 0;
    const executionTimeMs = Date.now() - startTime;

    await logAgentRun({
      agentName: "STRATEGY",
      triggerType,
      inputPayload: { projectsCount: projects.length, engine: "GOOGLE_GEMINI_2_5_FLASH" },
      outputPayload: finalResult as unknown as Record<string, unknown>,
      tokensUsed,
      costEstimate: 0.0,
      status: "SUCCESS",
      executionTimeMs,
    });

    return finalResult;
  } catch (error) {
    console.error("Error en StrategyAgent con Gemini:", error);
    const fallbackResult = deterministicStrategyAnalysis(projects);
    const executionTimeMs = Date.now() - startTime;

    await logAgentRun({
      agentName: "STRATEGY",
      triggerType,
      inputPayload: { projectsCount: projects.length, fallbackActive: true },
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
