import { NextRequest } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { PriorityLevel, ProjectCategory } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface ReflectionAiCoachRequest {
  type?: "MORNING" | "EVENING" | "WEEKLY";
  date?: string;
  clarityScore?: number;
  energyScore?: number;
  domainRatings?: Record<string, number>;
  wins?: string[];
  frictionPoints?: string[];
  keyLearnings?: string[];
  nextDayCommitments?: string[];
  notes?: string;
}

export interface ReflectionAiCoachResponse {
  executiveDiagnosis: string;
  blindSpot: string;
  domainAssessment: {
    strongestDomain: string;
    vulnerableDomain: string;
    rationale: string;
  };
  actionableTasks: {
    title: string;
    description: string;
    priority: PriorityLevel;
    category: ProjectCategory;
    estimatedDuration: number;
  }[];
  tacticalPrinciple: string;
}

function deterministicFallback(payload: ReflectionAiCoachRequest): ReflectionAiCoachResponse {
  const isMorning = payload.type === "MORNING";
  return {
    executiveDiagnosis: isMorning
      ? "Preparación matutina enfocada en priorizar hitos de alto apalancamiento y blindar la atención contra dispersión operativa."
      : "Retrospectiva nocturna que consolida avances técnicos y comerciales, identificando oportunidades de calibración del descanso y mitigación de fricciones.",
    blindSpot: "Posible tendencia a postergar tareas de recuperación física o balance personal cuando la carga técnica y comercial se intensifica.",
    domainAssessment: {
      strongestDomain: "Tech & Software",
      vulnerableDomain: "Personal & Mental",
      rationale: "La cadencia de desarrollo es elevada, pero requiere mayor disciplina en pausas de descompresión cognitiva.",
    },
    actionableTasks: [
      {
        title: "Bloque de trabajo profundo ininterrumpido (90 min)",
        description: "Ejecutar la prioridad número uno del día sin notificaciones ni tareas secundarias.",
        priority: "HIGH",
        category: "tech",
        estimatedDuration: 90,
      },
      {
        title: "Revisión táctica de pipeline comercial",
        description: "Comprobar estado de respuestas y seguimiento de propuestas de clientes.",
        priority: "HIGH",
        category: "business",
        estimatedDuration: 30,
      },
      {
        title: "Sesión de movilidad y desconexión neuromotora",
        description: "30 minutos de estiramientos o actividad física regenerativa para restaurar energía.",
        priority: "MEDIUM",
        category: "performance",
        estimatedDuration: 30,
      },
    ],
    tacticalPrinciple: "La disciplina no es la restricción de la libertad, sino el vehículo para alcanzar la maestría y la serenidad ejecutiva.",
  };
}

export async function POST(request: NextRequest) {
  try {
    const payload: ReflectionAiCoachRequest = await request.json().catch(() => ({}));
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      return apiSuccess(deterministicFallback(payload));
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            executiveDiagnosis: {
              type: SchemaType.STRING,
              description: "Diagnóstico institucional riguroso sobre el estado cognitivo, claridad y entrega del usuario",
            },
            blindSpot: {
              type: SchemaType.STRING,
              description: "Punto ciego o fricción sutil detectada en las reflexiones y notas",
            },
            domainAssessment: {
              type: SchemaType.OBJECT,
              properties: {
                strongestDomain: { type: SchemaType.STRING, description: "Dominio más sólido (Tech, Business, Academic, Performance o Personal)" },
                vulnerableDomain: { type: SchemaType.STRING, description: "Dominio que requiere atención prioritaria" },
                rationale: { type: SchemaType.STRING, description: "Explicación concisa y clínica del balance" },
              },
              required: ["strongestDomain", "vulnerableDomain", "rationale"],
            },
            actionableTasks: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  title: { type: SchemaType.STRING, description: "Título directo e imperativo de la acción" },
                  description: { type: SchemaType.STRING, description: "Justificación operativa" },
                  priority: { type: SchemaType.STRING, format: "enum", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
                  category: { type: SchemaType.STRING, format: "enum", enum: ["tech", "business", "academic", "performance", "personal"] },
                  estimatedDuration: { type: SchemaType.INTEGER, description: "Duración estimada en minutos" },
                },
                required: ["title", "description", "priority", "category", "estimatedDuration"],
              },
              description: "Exactamente 3 tareas de alto impacto para incorporar al día siguiente",
            },
            tacticalPrinciple: {
              type: SchemaType.STRING,
              description: "Máxima o principio estoico de alto rendimiento sin clichés ni emojis",
            },
          },
          required: ["executiveDiagnosis", "blindSpot", "domainAssessment", "actionableTasks", "tacticalPrinciple"],
        },
      },
    });

    const prompt = `Actúa como Coach de Rendimiento Cognitivo e Inteligencia Estratégica del Ecosistema Lanzing.
Analiza la siguiente reflexión diaria de un fundador/ingeniero de alto rendimiento:

Tipo de Reflexión: ${payload.type || "EVENING"}
Fecha: ${payload.date || new Date().toISOString().split("T")[0]}
Claridad Mental Declarada: ${payload.clarityScore ?? 8}/10
Nivel de Energía Física: ${payload.energyScore ?? 8}/10
Calificación por Dominios: ${JSON.stringify(payload.domainRatings || {})}
Victorias / Logros (Wins): ${JSON.stringify(payload.wins || [])}
Fricciones / Bloqueos: ${JSON.stringify(payload.frictionPoints || [])}
Lecciones Clave: ${JSON.stringify(payload.keyLearnings || [])}
Compromisos Previos: ${JSON.stringify(payload.nextDayCommitments || [])}
Notas y Vaciado Mental: "${payload.notes || ""}"

Reglas estrictas de respuesta:
- Prohibición absoluta de emojis en todos los campos.
- Tono institucional, clínico, sobrio y estratégico de alto nivel.
- Entrega 3 tareas accionables precisas y 1 principio rector estoico.`;

    const result = await model.generateContent(prompt);
    const textResponse = result.response.text();
    const parsedData: ReflectionAiCoachResponse = JSON.parse(textResponse);

    return apiSuccess(parsedData);
  } catch (error) {
    console.warn("Advertencia al ejecutar AI Coach de reflexion, usando fallback:", error);
    const fallback = deterministicFallback({});
    return apiSuccess(fallback);
  }
}
