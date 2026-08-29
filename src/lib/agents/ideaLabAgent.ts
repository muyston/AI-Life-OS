import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { prisma } from "../prisma";
import { logAgentRun } from "./agent-logger";
import { 
  IdeaCategory, 
  IdeaAssignedAgent, 
  IdeaStatus,
  IdeaEntity,
  IdeaStructuredAnalysis, 
  IdeaRecommendedAction,
  PriorityLevel,
  TaskType 
} from "../types";

interface ClassificationResult {
  category: IdeaCategory;
  assignedAgent: IdeaAssignedAgent;
  reasoning: string;
}

/**
 * Motor determinista de clasificacion para contingencia o ejecucion local sin API Key.
 */
function deterministicClassify(rawContent: string): ClassificationResult {
  const text = rawContent.toLowerCase();

  // Deteccion de patrones tecnicos y arquitectura
  if (
    text.includes("api") ||
    text.includes("endpoint") ||
    text.includes("codigo") ||
    text.includes("código") ||
    text.includes("backend") ||
    text.includes("frontend") ||
    text.includes("database") ||
    text.includes("base de datos") ||
    text.includes("bug") ||
    text.includes("refactor") ||
    text.includes("typescript") ||
    text.includes("react") ||
    text.includes("prisma") ||
    text.includes("git") ||
    text.includes("servidor") ||
    text.includes("app") ||
    text.includes("desarrollar") ||
    text.includes("arquitectura")
  ) {
    return {
      category: "tech",
      assignedAgent: "dev",
      reasoning: "Contenido orientado a arquitectura de software, integraciones tecnicas o desarrollo.",
    };
  }

  // Deteccion de patrones comerciales y ventas
  if (
    text.includes("venta") ||
    text.includes("cliente") ||
    text.includes("prospecto") ||
    text.includes("clinica") ||
    text.includes("clínica") ||
    text.includes("outreach") ||
    text.includes("propuesta") ||
    text.includes("precio") ||
    text.includes("oferta") ||
    text.includes("lead") ||
    text.includes("conversion") ||
    text.includes("conversión") ||
    text.includes("marketing") ||
    text.includes("embudo") ||
    text.includes("paciente")
  ) {
    return {
      category: "business",
      assignedAgent: "sales",
      reasoning: "Contenido comercial, captacion B2B, prospeccion o conversion.",
    };
  }

  // Deteccion de operaciones y agenda
  if (
    text.includes("calendario") ||
    text.includes("agenda") ||
    text.includes("reunion") ||
    text.includes("reunión") ||
    text.includes("horario") ||
    text.includes("evento") ||
    text.includes("planificar") ||
    text.includes("organizar") ||
    text.includes("slot") ||
    text.includes("tiempo") ||
    text.includes("cita")
  ) {
    return {
      category: "personal",
      assignedAgent: "operations",
      reasoning: "Gestion de agenda, coordinacion temporal u optimizacion de calendario.",
    };
  }

  // Deteccion de estrategia y KPIs
  if (
    text.includes("estrategia") ||
    text.includes("kpi") ||
    text.includes("objetivo") ||
    text.includes("meta") ||
    text.includes("rendimiento") ||
    text.includes("metricas") ||
    text.includes("métricas") ||
    text.includes("prioridad") ||
    text.includes("roadmap") ||
    text.includes("vision") ||
    text.includes("visión")
  ) {
    return {
      category: "business",
      assignedAgent: "strategy",
      reasoning: "Evaluacion estrategica multidominio, priorizacion y definicion de objetivos.",
    };
  }

  // Deteccion academica / estudio
  if (
    text.includes("estudiar") ||
    text.includes("curso") ||
    text.includes("libro") ||
    text.includes("investigar") ||
    text.includes("paper") ||
    text.includes("tesis") ||
    text.includes("aprender")
  ) {
    return {
      category: "academic",
      assignedAgent: "general",
      reasoning: "Profundizacion conceptual, formacion o investigacion academica.",
    };
  }

  // Deteccion salud / rendimiento fisico
  if (
    text.includes("entreno") ||
    text.includes("dieta") ||
    text.includes("sueno") ||
    text.includes("sueño") ||
    text.includes("salud") ||
    text.includes("habito") ||
    text.includes("hábito") ||
    text.includes("rutina")
  ) {
    return {
      category: "performance",
      assignedAgent: "general",
      reasoning: "Optimizacion de rendimiento personal, habitos y bienestar fisico.",
    };
  }

  return {
    category: "general",
    assignedAgent: "general",
    reasoning: "Nota generica categorizada para analisis multidisciplinar.",
  };
}

/**
 * Clasifica la nota mediante LLM o heuristica determinista.
 */
export async function classifyIdea(rawContent: string): Promise<ClassificationResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return deterministicClassify(rawContent);
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
            category: { 
              type: SchemaType.STRING, 
            },
            assignedAgent: { 
              type: SchemaType.STRING, 
            },
            reasoning: { type: SchemaType.STRING },
          },
          required: ["category", "assignedAgent", "reasoning"],
        },
      },
      systemInstruction: `Eres el Clasificador Central de AI Life OS.
Tu mision es analizar notas en bruto e inferir:
1. Categoria del dominio (tech, business, personal, academic, performance, general).
2. Agente especialista asignado:
   - dev: Para requerimientos de software, bugs, arquitectura, scripts o integraciones.
   - sales: Para captacion, propuestas comerciales, prospectos, outreach o clinicas.
   - strategy: Para KPIs, analisis de viabilidad, alineacion multidominio o evaluacion de impacto.
   - operations: Para coordinacion de agenda, bloques de tiempo, eventos o logistica.
   - general: Para reflexiones, habitos, estudio u otros temas.
Prohibido el uso de emojis en cualquier texto o razonamiento.
Tono institucional, sobrio y conciso.`,
    });

    const response = await model.generateContent(
      `Clasifica la siguiente nota:\n"""\n${rawContent}\n"""`
    );

    const parsed = JSON.parse(response.response.text()) as ClassificationResult;
    return {
      category: parsed.category || "general",
      assignedAgent: parsed.assignedAgent || "general",
      reasoning: parsed.reasoning || "Clasificacion generada por modelo de inteligencia artificial.",
    };
  } catch (error) {
    console.error("Error en clasificador LLM, utilizando fallback determinista:", error);
    return deterministicClassify(rawContent);
  }
}

/**
 * Genera el analisis determinista estructurado cuando no hay API Key o como fallback.
 */
function deterministicAnalyze(
  rawContent: string, 
  category: IdeaCategory, 
  assignedAgent: IdeaAssignedAgent
): IdeaStructuredAnalysis {
  const lines = rawContent.split("\n").map(l => l.trim()).filter(Boolean);
  const firstLine = lines[0] || "Nota sin titulo";
  const titleCandidate = firstLine.length > 50 ? firstLine.slice(0, 47) + "..." : firstLine;

  const actions: IdeaRecommendedAction[] = [];

  switch (assignedAgent) {
    case "dev":
      actions.push(
        {
          title: `Especificar contrato tecnico y arquitectura para "${titleCandidate}"`,
          description: "Definir modelo de datos en Prisma, interfaces TypeScript y esquema de endpoints.",
          priority: "HIGH",
          estimatedDuration: 45,
          type: "NORMAL",
        },
        {
          title: `Implementar endpoints y logica backend`,
          description: "Crear rutas en Next.js App Router con validacion estricta y manejo de errores.",
          priority: "HIGH",
          estimatedDuration: 60,
          type: "NORMAL",
        },
        {
          title: `Desarrollar componentes UI y pruebas de integracion`,
          description: "Construir interfaz en React con Tailwind CSS y verificar renderizado.",
          priority: "MEDIUM",
          estimatedDuration: 60,
          type: "NORMAL",
        }
      );
      break;

    case "sales":
      actions.push(
        {
          title: `Auditar publico objetivo y propuesta de valor para "${titleCandidate}"`,
          description: "Definir perfil de cliente ideal, angulo de contacto y métricas de conversion esperadas.",
          priority: "HIGH",
          estimatedDuration: 30,
          type: "NORMAL",
        },
        {
          title: `Redactar secuencia de contacto y plantilla de outreach`,
          description: "Generar borradores personalizados de email y WhatsApp institucional.",
          priority: "MEDIUM",
          estimatedDuration: 45,
          type: "NORMAL",
        },
        {
          title: `Ejecutar campana inicial de prospeccion y medir respuestas`,
          description: "Contactar a los primeros 10 prospectos seleccionados y registrar feedback.",
          priority: "MEDIUM",
          estimatedDuration: 60,
          type: "NORMAL",
        }
      );
      break;

    case "strategy":
      actions.push(
        {
          title: `Evaluar viabilidad y alineacion estrategica de "${titleCandidate}"`,
          description: "Analizar retorno de inversion, tiempo de implementacion e impacto en objetivos anuales.",
          priority: "HIGH",
          estimatedDuration: 45,
          type: "NORMAL",
        },
        {
          title: `Definir metricas clave (KPIs) y criterios de exito`,
          description: "Establecer umbrales cuantitativos para medir avance y resultados.",
          priority: "MEDIUM",
          estimatedDuration: 30,
          type: "NORMAL",
        },
        {
          title: `Formular plan de ejecucion por fases`,
          description: "Desglosar cronograma y asignar responsabilidades operativas.",
          priority: "MEDIUM",
          estimatedDuration: 45,
          type: "NORMAL",
        }
      );
      break;

    case "operations":
      actions.push(
        {
          title: `Revisar ventanas disponibles en Google Calendar para "${titleCandidate}"`,
          description: "Localizar bloques de concentracion libres durante los proximos 5 dias laborales.",
          priority: "HIGH",
          estimatedDuration: 15,
          type: "NORMAL",
        },
        {
          title: `Agendar sesion de trabajo focalizado`,
          description: "Bloquear tiempo en la agenda con recordatorios y material preparatorio.",
          priority: "HIGH",
          estimatedDuration: 20,
          type: "NORMAL",
        },
        {
          title: `Preparar requerimientos previos y recursos`,
          description: "Consolidar documentacion y accesos requeridos antes de la ejecucion.",
          priority: "LOW",
          estimatedDuration: 30,
          type: "NORMAL",
        }
      );
      break;

    default:
      actions.push(
        {
          title: `Desglosar requerimientos iniciales para "${titleCandidate}"`,
          description: "Estructurar alcance, limitaciones y recursos indispensables.",
          priority: "MEDIUM",
          estimatedDuration: 30,
          type: "NORMAL",
        },
        {
          title: `Ejecutar investigacion y recopilacion de referencias`,
          description: "Revisar fuentes primarias, documentacion o casos de estudio similares.",
          priority: "MEDIUM",
          estimatedDuration: 45,
          type: "NORMAL",
        },
        {
          title: `Consolidar resumen y proximos pasos`,
          description: "Documentar conclusiones y definir si se convierte en proyecto permanente.",
          priority: "LOW",
          estimatedDuration: 30,
          type: "NORMAL",
        }
      );
      break;
  }

  return {
    executiveSummary: `Evaluacion preliminar institucional para la iniciativa "${titleCandidate}". Se clasifica bajo el dominio de ${category.toUpperCase()} con asignacion al especialista ${assignedAgent.toUpperCase()}. La propuesta presenta potencial de aplicacion directa y requiere ejecucion estructurada por fases.`,
    researchAndViability: `Se ha comprobado la consistencia del concepto respecto al ecosistema actual. La viabilidad operativa es favorable, estimando un tiempo de implementacion acotado con recursos existentes. Se recomienda preservar el enfoque modular y validar cada entregable de forma incremental.`,
    keyInsights: [
      "Alta pertinencia para el flujo operativo actual.",
      "Desglose en tareas atomicas con duracion promedio de 30 a 60 minutos.",
      "Posibilidad de conversion inmediata a proyecto o tareas independientes."
    ],
    recommendedActions: actions,
    suggestedProjectName: titleCandidate,
    targetCategory: category,
  };
}

/**
 * Analiza la idea delegando en el agente especialista correspondiente.
 */
export async function analyzeIdea(
  rawContent: string,
  category: IdeaCategory,
  assignedAgent: IdeaAssignedAgent
): Promise<IdeaStructuredAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    return deterministicAnalyze(rawContent, category, assignedAgent);
  }

  try {
    // 1. Recopilar contexto relevante del sistema
    const [existingProjects, recentEvents] = await Promise.all([
      prisma.project.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, name: true, category: true },
        take: 5,
      }),
      prisma.calendarEvent.findMany({
        where: { startTime: { gte: new Date() } },
        select: { summary: true, startTime: true, endTime: true },
        orderBy: { startTime: "asc" },
        take: 5,
      }),
    ]);

    const systemContext = {
      activeProjectsCount: existingProjects.length,
      activeProjects: existingProjects.map(p => `${p.name} (${p.category})`),
      upcomingCalendarEvents: recentEvents.map(e => `${e.summary} [${new Date(e.startTime).toLocaleDateString()}]`),
    };

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            executiveSummary: { type: SchemaType.STRING },
            researchAndViability: { type: SchemaType.STRING },
            keyInsights: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
            },
            suggestedProjectName: { type: SchemaType.STRING },
            targetCategory: { 
              type: SchemaType.STRING, 
            },
            recommendedActions: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  title: { type: SchemaType.STRING },
                  description: { type: SchemaType.STRING },
                  priority: { 
                    type: SchemaType.STRING, 
                  },
                  estimatedDuration: { type: SchemaType.INTEGER },
                  type: { 
                    type: SchemaType.STRING, 
                  },
                },
                required: ["title", "description", "priority", "estimatedDuration"],
              },
            },
          },
          required: [
            "executiveSummary",
            "researchAndViability",
            "keyInsights",
            "suggestedProjectName",
            "recommendedActions",
          ],
        },
      },
      systemInstruction: `Eres el Agente Especialista "${assignedAgent.toUpperCase()}" en el sistema AI Life OS.
Tu mision es analizar exhaustivamente la nota o idea introducida por el usuario, investigarla, evaluar su viabilidad tecnica/operativa y desglosarla en pasos accionables inmediatos.

Estructura de respuesta obligatoria:
1. Resumen Ejecutivo (Diagnostico conciso del valor, impacto y enfoque).
2. Investigacion y Viabilidad (Datos de mercado, referencias tecnicas, dependencias y justificacion).
3. Puntos Clave / Key Insights (Lista de observaciones de alto nivel).
4. Proximos Pasos Accionables (Lista de 2 a 5 tareas atomicas con titulo institucional, descripcion detallada, duracion estimada en minutos y prioridad).
5. Nombre de Proyecto sugerido si amerita creacion de proyecto.

Reglas estrictas:
- Prohibicion absoluta de cualquier emoji en toda la respuesta.
- Tono corporativo, riguroso, sobrio y de ingenieria de alto nivel.
- Todo texto en espanol institucional.`,
    });

    const promptPayload = `Analiza la siguiente nota delegada al agente ${assignedAgent.toUpperCase()} (categoria: ${category}):
"""
${rawContent}
"""

Contexto actual del sistema:
${JSON.stringify(systemContext, null, 2)}`;

    const response = await model.generateContent(promptPayload);
    const parsed = JSON.parse(response.response.text()) as IdeaStructuredAnalysis;

    // Sanitizar y validar tipos
    const validCategory: IdeaCategory = ["tech", "business", "personal", "academic", "performance", "general"].includes(parsed.targetCategory as string)
      ? (parsed.targetCategory as IdeaCategory)
      : category;

    const validatedActions: IdeaRecommendedAction[] = (parsed.recommendedActions || []).map((action) => ({
      title: action.title || "Tarea sin titulo",
      description: action.description || "",
      priority: (["LOW", "MEDIUM", "HIGH", "CRITICAL", "URGENT"].includes(action.priority) ? action.priority : "MEDIUM") as PriorityLevel,
      estimatedDuration: Number(action.estimatedDuration) || 30,
      type: (["NORMAL", "MANUAL", "RECURRING", "AGENT_GENERATED"].includes(action.type || "") ? action.type : "NORMAL") as TaskType,
    }));

    return {
      executiveSummary: parsed.executiveSummary || "Diagnostico procesado con exito.",
      researchAndViability: parsed.researchAndViability || "Viabilidad analizada conforme a parametros del sistema.",
      keyInsights: parsed.keyInsights || [],
      suggestedProjectName: parsed.suggestedProjectName || "Proyecto Derivado",
      targetCategory: validCategory,
      recommendedActions: validatedActions.length > 0 ? validatedActions : deterministicAnalyze(rawContent, category, assignedAgent).recommendedActions,
    };
  } catch (error) {
    console.error("Error en analisis LLM, recurriendo a generador determinista:", error);
    return deterministicAnalyze(rawContent, category, assignedAgent);
  }
}

/**
 * Pipeline integral de procesamiento de una Idea: clasifica, analiza, persiste y registra.
 */
export interface ProcessIdeaResult {
  success: boolean;
  data: (IdeaEntity & { structuredAnalysis?: IdeaStructuredAnalysis | null }) | null;
  error?: string;
}

/**
 * Pipeline integral de procesamiento de una Idea: clasifica, analiza, persiste y registra.
 */
export async function processIdeaPipeline(
  ideaId: string,
  forcedAgent?: IdeaAssignedAgent
): Promise<ProcessIdeaResult> {
  const startTime = Date.now();

  try {
    const existingIdea = await prisma.idea.findUnique({
      where: { id: ideaId },
    });

    if (!existingIdea) {
      throw new Error(`No se encontró la idea con identificador: ${ideaId}`);
    }

    // 1. Marcar en estado PROCESSING
    await prisma.idea.update({
      where: { id: ideaId },
      data: { status: "PROCESSING" },
    });

    // 2. Clasificación (o uso del agente forzado)
    let category: IdeaCategory = ["tech", "business", "personal", "academic", "performance", "general"].includes(existingIdea.category)
      ? (existingIdea.category as IdeaCategory)
      : "general";
    let assignedAgent: IdeaAssignedAgent = (forcedAgent || existingIdea.assignedAgent) as IdeaAssignedAgent;

    if (!forcedAgent || forcedAgent === "general") {
      const classification = await classifyIdea(existingIdea.rawContent);
      category = classification.category;
      assignedAgent = forcedAgent || classification.assignedAgent;
    }

    // 3. Análisis especializado
    const analysis = await analyzeIdea(existingIdea.rawContent, category, assignedAgent);

    const executionTimeMs = Date.now() - startTime;

    // 4. Actualizar registro en base de datos
    const updatedIdea = await prisma.idea.update({
      where: { id: ideaId },
      data: {
        category,
        assignedAgent,
        analysis: JSON.stringify(analysis),
        status: "COMPLETED",
      },
    });

    // 5. Registrar ejecución en logs
    await logAgentRun({
      agentName: `IDEA_LAB_${assignedAgent.toUpperCase()}`,
      triggerType: "MANUAL",
      inputPayload: { ideaId, rawContentLength: existingIdea.rawContent.length, assignedAgent },
      outputPayload: {
        category,
        assignedAgent,
        actionsCount: analysis.recommendedActions.length,
        suggestedProjectName: analysis.suggestedProjectName,
      },
      tokensUsed: 0,
      costEstimate: 0.0,
      status: "SUCCESS",
      executionTimeMs,
    });

    const parsedCategory: IdeaCategory = ["tech", "business", "personal", "academic", "performance", "general"].includes(updatedIdea.category)
      ? (updatedIdea.category as IdeaCategory)
      : "general";

    const parsedStatus: IdeaStatus = ["RAW", "PROCESSING", "COMPLETED", "FAILED"].includes(updatedIdea.status)
      ? (updatedIdea.status as IdeaStatus)
      : "COMPLETED";

    const parsedAgent: IdeaAssignedAgent = ["strategy", "dev", "sales", "operations", "general"].includes(updatedIdea.assignedAgent)
      ? (updatedIdea.assignedAgent as IdeaAssignedAgent)
      : "general";

    return {
      success: true,
      data: {
        id: updatedIdea.id,
        rawContent: updatedIdea.rawContent,
        category: parsedCategory,
        status: parsedStatus,
        assignedAgent: parsedAgent,
        analysis: updatedIdea.analysis,
        structuredAnalysis: analysis,
        createdAt: updatedIdea.createdAt,
        updatedAt: updatedIdea.updatedAt,
      },
    };
  } catch (error: unknown) {
    const executionTimeMs = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Error en processIdeaPipeline:", error);

    await prisma.idea
      .update({
        where: { id: ideaId },
        data: { status: "FAILED" },
      })
      .catch(() => {});

    await logAgentRun({
      agentName: "IDEA_LAB",
      triggerType: "MANUAL",
      inputPayload: { ideaId },
      outputPayload: { error: errorMsg },
      tokensUsed: 0,
      costEstimate: 0.0,
      status: "FAILED",
      errorMessage: errorMsg,
      executionTimeMs,
    });

    return {
      success: false,
      data: null,
      error: errorMsg || "Error interno al procesar la idea.",
    };
  }
}
