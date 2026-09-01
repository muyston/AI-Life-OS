import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { prisma } from "../prisma";
import { logAgentRun } from "./agent-logger";
import {
  IdeaCategory,
  MultiSolutionAnalysis,
  SolverOption,
  SolverActionProposal,
  ProjectCategory,
  PriorityLevel,
  AiActionType,
  CognitiveCostLevel,
} from "../types";

function isProjectCategory(val: unknown): val is ProjectCategory {
  return typeof val === "string" && ["tech", "business", "academic", "performance", "personal"].includes(val);
}

function isPriorityLevel(val: unknown): val is PriorityLevel {
  return typeof val === "string" && ["LOW", "MEDIUM", "HIGH", "CRITICAL", "URGENT"].includes(val);
}

function isAiActionType(val: unknown): val is AiActionType {
  return (
    typeof val === "string" &&
    ["TASK_PROPOSAL", "CALENDAR_RESCHEDULE", "CODE_SNIPPET", "OUTREACH_DRAFT", "STRATEGY_ALERT"].includes(val)
  );
}

function isCognitiveCost(val: unknown): val is CognitiveCostLevel {
  return typeof val === "string" && ["LOW", "MEDIUM", "HIGH"].includes(val);
}

/**
 * Motor determinista de contingencia para formular las 3 soluciones divergentes
 * en modo local / offline o cuando la API Key no está presente.
 */
export function deterministicSolverAnalysis(
  rawContent: string,
  category: IdeaCategory = "general"
): MultiSolutionAnalysis {
  const lines = rawContent.split("\n").map((l) => l.trim()).filter(Boolean);
  const firstLine = lines[0] || "Situación o desafío no especificado";
  const titleCandidate = firstLine.length > 55 ? firstLine.slice(0, 52) + "..." : firstLine;
  const lowerText = rawContent.toLowerCase();

  let targetCat: IdeaCategory = category !== "general" ? category : "tech";
  if (lowerText.includes("cliente") || lowerText.includes("venta") || lowerText.includes("lead") || lowerText.includes("clinica")) {
    targetCat = "business";
  } else if (lowerText.includes("upm") || lowerText.includes("estudiar") || lowerText.includes("examen") || lowerText.includes("ingenieria")) {
    targetCat = "academic";
  } else if (lowerText.includes("padel") || lowerText.includes("entreno") || lowerText.includes("salud") || lowerText.includes("fisico")) {
    targetCat = "performance";
  } else if (lowerText.includes("finanza") || lowerText.includes("banco") || lowerText.includes("viaje") || lowerText.includes("casa")) {
    targetCat = "personal";
  }

  const primaryDomain: ProjectCategory = targetCat;

  // 1. Opción A: Quick Win / Mitigación Inmediata
  const optionA: SolverOption = {
    id: "option-a",
    type: "QUICK_WIN",
    title: `Mitigación Inmediata 80/20 para "${titleCandidate}"`,
    badge: "Vía Rápida (Quick Win)",
    summary: `Intervención de bajo coste cognitivo enfocada en mitigar el bloqueo en menos de 60 minutos aplicando una solución directa o parche temporal controlado.`,
    tradeOffs: {
      estimatedTimeHours: 0.75,
      cognitiveCost: "LOW",
      roiDescription: "Retorno inmediato y desbloqueo operativo con mínima fricción.",
      successProbability: 88,
    },
    multidomainImpact: {
      primaryDomain,
      domainImpacts: [
        {
          category: primaryDomain,
          impactLevel: "POSITIVE",
          description: "Desbloquea el avance inmediato eliminando la parálisis por análisis.",
        },
        {
          category: "personal",
          impactLevel: "POSITIVE",
          description: "Reduce la carga de estrés y libera ancho de banda mental de forma instantánea.",
        },
      ],
    },
    actions: [
      {
        title: `Ejecutar parche rápido o solución 80/20: ${titleCandidate}`,
        description: `Implementar la versión más simple y funcional posible para resolver el cuello de botella inmediato.`,
        category: primaryDomain,
        actionType: "TASK_PROPOSAL",
        priority: "URGENT",
        estimatedDuration: 30,
      },
      {
        title: `Validar efectividad y registrar notas de seguimiento`,
        description: `Comprobar que la mitigación cumple el objetivo mínimo y documentar compromisos adquiridos.`,
        category: primaryDomain,
        actionType: "TASK_PROPOSAL",
        priority: "MEDIUM",
        estimatedDuration: 15,
      },
    ],
  };

  // 2. Opción B: Solución Estructural / Óptima
  const optionB: SolverOption = {
    id: "option-b",
    type: "STRUCTURAL",
    title: `Arquitectura y Protocolo Estructural para "${titleCandidate}"`,
    badge: "Solución Estructural (Óptima)",
    summary: `Resolución definitiva de la causa raíz mediante refactorización profunda, diseño de contratos estrictos y creación de un estándar replicable a largo plazo.`,
    tradeOffs: {
      estimatedTimeHours: 3.5,
      cognitiveCost: "HIGH",
      roiDescription: "Máxima escalabilidad, robustez institucional y prevención de deuda técnica recurrente.",
      successProbability: 95,
    },
    multidomainImpact: {
      primaryDomain,
      domainImpacts: [
        {
          category: primaryDomain,
          impactLevel: "HIGH_IMPACT",
          description: "Establece un cimiento sólido y sostenible para todos los proyectos dependientes.",
        },
        {
          category: "tech",
          impactLevel: "HIGH_IMPACT",
          description: "Aumenta la mantenibilidad y reduce la tasa de errores futuros en un 80%.",
        },
      ],
    },
    actions: [
      {
        title: `Diseñar especificación técnica y modelo de datos para ${titleCandidate}`,
        description: `Definir contratos de interfaces, esquemas de persistencia y flujo de datos robusto.`,
        category: primaryDomain,
        actionType: "TASK_PROPOSAL",
        priority: "HIGH",
        estimatedDuration: 60,
      },
      {
        title: `Implementar refactorización estructural y capa de validación`,
        description: `Construir la solución integral con tipado estricto y manejo exhaustivo de excepciones.`,
        category: primaryDomain,
        actionType: "TASK_PROPOSAL",
        priority: "HIGH",
        estimatedDuration: 90,
      },
      {
        title: `Elaborar suite de pruebas y documentación de mantenimiento`,
        description: `Asegurar cobertura de validación determinista y guía operativa para prevenir regresiones.`,
        category: primaryDomain,
        actionType: "TASK_PROPOSAL",
        priority: "MEDIUM",
        estimatedDuration: 45,
      },
    ],
  };

  // 3. Opción C: Delegación & Automatización por Agentes
  const optionC: SolverOption = {
    id: "option-c",
    type: "DELEGATED",
    title: `Automatización Asistida por Agentes de IA para "${titleCandidate}"`,
    badge: "Delegación & Agentes",
    summary: `Orquestación mediante agentes autónomos y scripts en segundo plano para delegar la investigación, generación o ejecución reduciendo la intervención humana al mínimo.`,
    tradeOffs: {
      estimatedTimeHours: 1.25,
      cognitiveCost: "MEDIUM",
      roiDescription: "Apalancamiento exponencial del tiempo propio mediante automatización de flujos repetitivos.",
      successProbability: 84,
    },
    multidomainImpact: {
      primaryDomain,
      domainImpacts: [
        {
          category: "tech",
          impactLevel: "POSITIVE",
          description: "Añade un activo de automatización reutilizable en el ecosistema.",
        },
        {
          category: "business",
          impactLevel: "POSITIVE",
          description: "Acelera los ciclos de entrega delegando el trabajo pesado a subagentes de IA.",
        },
      ],
    },
    actions: [
      {
        title: `Configurar pipeline automatizado o prompt especializado para ${titleCandidate}`,
        description: `Diseñar la instrucción del agente y el esquema de datos para procesamiento autónomo.`,
        category: primaryDomain,
        actionType: "TASK_PROPOSAL",
        priority: "HIGH",
        estimatedDuration: 30,
      },
      {
        title: `Ejecutar corrida de validación de agentes y supervisar resultados`,
        description: `Despachar la ejecución en segundo plano y validar la salida en el feed de acciones IA.`,
        category: primaryDomain,
        actionType: "STRATEGY_ALERT",
        priority: "MEDIUM",
        estimatedDuration: 20,
      },
    ],
  };

  return {
    executiveDiagnosis: `Diagnóstico estratégico para "${titleCandidate}". La situación requiere una toma de decisión clara entre mitigación de choque, ingeniería estructural o delegación automatizada.`,
    rootCause: `Se identifica una oportunidad de optimización en el flujo de ${primaryDomain.toUpperCase()} que puede abordarse según el horizonte temporal y la tolerancia a carga cognitiva.`,
    keyVariables: [
      `Disponibilidad de tiempo y prioridad en el dominio ${primaryDomain.toUpperCase()}`,
      "Impacto a largo plazo vs. velocidad de desbloqueo táctico",
      "Potencial de apalancamiento mediante automatización con agentes",
    ],
    solutions: [optionA, optionB, optionC],
    suggestedProjectName: titleCandidate,
    targetCategory: targetCat,
  };
}

/**
 * Ejecuta el Solver Engine mediante Gemini 2.5 Flash con esquema estructurado JSON,
 * o delega en el motor determinista como contingencia segura.
 */
export async function runMultiSolutionSolver(
  rawContent: string,
  category: IdeaCategory = "general"
): Promise<MultiSolutionAnalysis> {
  const startTime = Date.now();
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.includes("tu_clave") || apiKey.trim() === "") {
    const fallback = deterministicSolverAnalysis(rawContent, category);
    await logAgentRun({
      agentName: "SOLVER_ENGINE",
      triggerType: "MANUAL",
      inputPayload: { rawLength: rawContent.length, engine: "DETERMINISTIC" },
      outputPayload: { optionsCount: 3, targetCategory: fallback.targetCategory },
      tokensUsed: 0,
      costEstimate: 0.0,
      status: "SUCCESS",
      executionTimeMs: Date.now() - startTime,
    });
    return fallback;
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
            executiveDiagnosis: { type: SchemaType.STRING },
            rootCause: { type: SchemaType.STRING },
            keyVariables: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
            },
            suggestedProjectName: { type: SchemaType.STRING },
            targetCategory: { type: SchemaType.STRING },
            solutions: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  id: { type: SchemaType.STRING },
                  type: { type: SchemaType.STRING },
                  title: { type: SchemaType.STRING },
                  badge: { type: SchemaType.STRING },
                  summary: { type: SchemaType.STRING },
                  tradeOffs: {
                    type: SchemaType.OBJECT,
                    properties: {
                      estimatedTimeHours: { type: SchemaType.NUMBER },
                      cognitiveCost: { type: SchemaType.STRING },
                      roiDescription: { type: SchemaType.STRING },
                      successProbability: { type: SchemaType.NUMBER },
                    },
                    required: ["estimatedTimeHours", "cognitiveCost", "roiDescription", "successProbability"],
                  },
                  multidomainImpact: {
                    type: SchemaType.OBJECT,
                    properties: {
                      primaryDomain: { type: SchemaType.STRING },
                      domainImpacts: {
                        type: SchemaType.ARRAY,
                        items: {
                          type: SchemaType.OBJECT,
                          properties: {
                            category: { type: SchemaType.STRING },
                            impactLevel: { type: SchemaType.STRING },
                            description: { type: SchemaType.STRING },
                          },
                          required: ["category", "impactLevel", "description"],
                        },
                      },
                    },
                    required: ["primaryDomain", "domainImpacts"],
                  },
                  actions: {
                    type: SchemaType.ARRAY,
                    items: {
                      type: SchemaType.OBJECT,
                      properties: {
                        title: { type: SchemaType.STRING },
                        description: { type: SchemaType.STRING },
                        category: { type: SchemaType.STRING },
                        actionType: { type: SchemaType.STRING },
                        priority: { type: SchemaType.STRING },
                        estimatedDuration: { type: SchemaType.NUMBER },
                      },
                      required: ["title", "description", "category", "actionType", "priority", "estimatedDuration"],
                    },
                  },
                },
                required: ["id", "type", "title", "badge", "summary", "tradeOffs", "multidomainImpact", "actions"],
              },
            },
          },
          required: [
            "executiveDiagnosis",
            "rootCause",
            "keyVariables",
            "suggestedProjectName",
            "targetCategory",
            "solutions",
          ],
        },
      },
      systemInstruction: `Eres el Principal Multi-Solution Solver Engine de AI Life OS (Ecosistema Lanzing).
Tu objetivo es formular EXACTAMENTE 3 SOLUCIONES ACCIONABLES DIVERGENTES para cualquier entrada en bruto (problema, bloqueo, decisión estratégica, nueva meta o cuello de botella):

1. Opción A (id: "option-a", type: "QUICK_WIN"):
   - Vía Rápida / Mínimo Esfuerzo / 80-20.
   - Mitigación inmediata en minutos u horas.
   - Coste cognitivo BAJO.
2. Opción B (id: "option-b", type: "STRUCTURAL"):
   - Solución Estructural / Óptima / Arquitectura Robusta.
   - Resuelve la causa raíz, máxima escalabilidad.
   - Coste cognitivo MEDIO o ALTO.
3. Opción C (id: "option-c", type: "DELEGATED"):
   - Delegación, automatización con scripts o agentes de IA en background.
   - Apalancamiento autónomo.

Reglas estrictas de calidad:
- CERO EMOJIS en cualquier parte del texto, títulos o descripciones.
- Tono institucional, corporativo y clínico de alta ingeniería.
- Cada opción debe contener entre 2 y 4 acciones atómicas concretas con duraciones estimadas realistas.
- Los dominios válidos son: tech, business, academic, performance, personal, operations.`,
    });

    const response = await model.generateContent(
      `Formula la matriz de resolución de 3 vías divergentes para la siguiente entrada (categoría sugerida: ${category}):\n"""\n${rawContent}\n"""`
    );

    const parsed = JSON.parse(response.response.text()) as Partial<MultiSolutionAnalysis>;
    const baseFallback = deterministicSolverAnalysis(rawContent, category);

    // Sanitización rigurosa de tipos
    const rawSolutions = Array.isArray(parsed.solutions) && parsed.solutions.length === 3
      ? parsed.solutions
      : baseFallback.solutions;

    const validatedSolutions: [SolverOption, SolverOption, SolverOption] = [
      sanitizeOption(rawSolutions[0], "option-a", "QUICK_WIN", "Vía Rápida (Quick Win)", baseFallback.solutions[0]),
      sanitizeOption(rawSolutions[1], "option-b", "STRUCTURAL", "Solución Estructural (Óptima)", baseFallback.solutions[1]),
      sanitizeOption(rawSolutions[2], "option-c", "DELEGATED", "Delegación & Agentes", baseFallback.solutions[2]),
    ];

    const finalAnalysis: MultiSolutionAnalysis = {
      executiveDiagnosis: parsed.executiveDiagnosis || baseFallback.executiveDiagnosis,
      rootCause: parsed.rootCause || baseFallback.rootCause,
      keyVariables: Array.isArray(parsed.keyVariables) && parsed.keyVariables.length > 0 ? parsed.keyVariables : baseFallback.keyVariables,
      solutions: validatedSolutions,
      suggestedProjectName: parsed.suggestedProjectName || baseFallback.suggestedProjectName,
      targetCategory: (["tech", "business", "personal", "academic", "performance", "general"].includes(parsed.targetCategory as string)
        ? (parsed.targetCategory as IdeaCategory)
        : baseFallback.targetCategory),
    };

    const tokensUsed = response.response.usageMetadata?.totalTokenCount || 0;
    const executionTimeMs = Date.now() - startTime;

    await logAgentRun({
      agentName: "SOLVER_ENGINE",
      triggerType: "MANUAL",
      inputPayload: { rawLength: rawContent.length, engine: "GOOGLE_GEMINI_2_5_FLASH" },
      outputPayload: {
        executiveDiagnosis: finalAnalysis.executiveDiagnosis,
        options: finalAnalysis.solutions.map((s) => s.title),
      },
      tokensUsed,
      costEstimate: 0.0,
      status: "SUCCESS",
      executionTimeMs,
    });

    return finalAnalysis;
  } catch (error) {
    console.error("Error en Solver Engine con Gemini, ejecutando fallback determinista:", error);
    const fallbackResult = deterministicSolverAnalysis(rawContent, category);
    const executionTimeMs = Date.now() - startTime;

    await logAgentRun({
      agentName: "SOLVER_ENGINE",
      triggerType: "MANUAL",
      inputPayload: { rawLength: rawContent.length, fallbackActive: true },
      outputPayload: { options: fallbackResult.solutions.map((s) => s.title) },
      tokensUsed: 0,
      costEstimate: 0.0,
      status: "FAILED",
      errorMessage: error instanceof Error ? error.message : String(error),
      executionTimeMs,
    });

    return fallbackResult;
  }
}

function sanitizeOption(
  raw: Partial<SolverOption> | undefined,
  fallbackId: "option-a" | "option-b" | "option-c",
  fallbackType: "QUICK_WIN" | "STRUCTURAL" | "DELEGATED",
  fallbackBadge: string,
  fallbackOption: SolverOption
): SolverOption {
  if (!raw) return fallbackOption;

  const validId = raw.id === "option-a" || raw.id === "option-b" || raw.id === "option-c" ? raw.id : fallbackId;
  const validType = raw.type === "QUICK_WIN" || raw.type === "STRUCTURAL" || raw.type === "DELEGATED" ? raw.type : fallbackType;

  const actions: SolverActionProposal[] = Array.isArray(raw.actions) && raw.actions.length > 0
    ? raw.actions.map((act) => ({
        title: act.title || "Acción sin título",
        description: act.description || "",
        category: isProjectCategory(act.category) || act.category === "operations" ? act.category : "tech",
        actionType: isAiActionType(act.actionType) ? act.actionType : "TASK_PROPOSAL",
        priority: isPriorityLevel(act.priority) ? act.priority : "MEDIUM",
        estimatedDuration: typeof act.estimatedDuration === "number" ? act.estimatedDuration : 30,
        payload: typeof act.payload === "string" ? act.payload : null,
      }))
    : fallbackOption.actions;

  const cognitiveCost: CognitiveCostLevel = isCognitiveCost(raw.tradeOffs?.cognitiveCost)
    ? raw.tradeOffs!.cognitiveCost
    : fallbackOption.tradeOffs.cognitiveCost;

  const primaryDomain: ProjectCategory = isProjectCategory(raw.multidomainImpact?.primaryDomain)
    ? raw.multidomainImpact!.primaryDomain
    : fallbackOption.multidomainImpact.primaryDomain;

  return {
    id: validId,
    type: validType,
    title: raw.title || fallbackOption.title,
    badge: raw.badge || fallbackBadge,
    summary: raw.summary || fallbackOption.summary,
    tradeOffs: {
      estimatedTimeHours: typeof raw.tradeOffs?.estimatedTimeHours === "number" ? raw.tradeOffs.estimatedTimeHours : fallbackOption.tradeOffs.estimatedTimeHours,
      cognitiveCost,
      roiDescription: raw.tradeOffs?.roiDescription || fallbackOption.tradeOffs.roiDescription,
      successProbability: typeof raw.tradeOffs?.successProbability === "number" ? raw.tradeOffs.successProbability : fallbackOption.tradeOffs.successProbability,
    },
    multidomainImpact: {
      primaryDomain,
      domainImpacts: Array.isArray(raw.multidomainImpact?.domainImpacts)
        ? raw.multidomainImpact!.domainImpacts.map((d) => ({
            category: isProjectCategory(d.category) ? d.category : "tech",
            impactLevel: d.impactLevel === "HIGH_IMPACT" || d.impactLevel === "POSITIVE" ? d.impactLevel : "NEUTRAL",
            description: d.description || "Impacto operativo registrado.",
          }))
        : fallbackOption.multidomainImpact.domainImpacts,
    },
    actions,
  };
}
