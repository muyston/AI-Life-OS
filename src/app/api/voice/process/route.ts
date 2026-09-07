import { NextRequest } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { VoiceProcessResult, PriorityLevel, ProjectCategory } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Motor determinista de contingencia para análisis de intenciones de voz
 */
function deterministicVoiceParse(text: string): VoiceProcessResult {
  const clean = text.trim();
  const lower = clean.toLowerCase();

  // Intención 1: Hábito completado
  if (lower.startsWith("hábito") || lower.startsWith("habito") || lower.includes("cumplido") || lower.includes("completar hábito")) {
    const habitName = clean.replace(/^(hábito|habito|completar hábito|completar habito|marcar hábito|marcar habito):?/i, "").trim();
    return {
      intent: "HABIT_LOG",
      transcript: clean,
      confidence: 0.85,
      summary: `Registrar cumplimiento de hábito: "${habitName || clean}"`,
      habitData: {
        habitName: habitName || clean,
        date: new Date().toISOString().split("T")[0],
        completed: true,
      },
    };
  }

  // Intención 2: Idea / Nota en bruto para Smart Inbox
  if (lower.startsWith("idea") || lower.startsWith("captura") || lower.startsWith("pensamiento") || lower.includes("nueva idea")) {
    let rawContent = clean.replace(/^(idea|captura|nueva idea|pensamiento):?/i, "").trim();
    let category: "tech" | "business" | "academic" | "performance" | "personal" | "general" = "general";

    if (lower.includes("negocio") || lower.includes("cliente") || lower.includes("venta") || lower.includes("clínica")) {
      category = "business";
    } else if (lower.includes("código") || lower.includes("app") || lower.includes("software") || lower.includes("saas")) {
      category = "tech";
    } else if (lower.includes("upm") || lower.includes("motostudent") || lower.includes("estudio")) {
      category = "academic";
    }

    return {
      intent: "IDEA",
      transcript: clean,
      confidence: 0.9,
      summary: `Capturar idea en Smart Inbox: "${rawContent}"`,
      ideaData: {
        rawContent: rawContent || clean,
        category,
        assignedAgent: "general",
      },
    };
  }

  // Intención 3: Tarea por defecto
  let title = clean.replace(/^(tarea|nueva tarea|recordar|hacer):?/i, "").trim();
  let priority: PriorityLevel = "MEDIUM";

  if (lower.includes("urgente") || lower.includes("crítico") || lower.includes("critico") || lower.includes("asap")) {
    priority = "URGENT";
  } else if (lower.includes("alta") || lower.includes("importante")) {
    priority = "HIGH";
  } else if (lower.includes("baja")) {
    priority = "LOW";
  }

  let category: ProjectCategory = "tech";
  if (lower.includes("cliente") || lower.includes("lanzing") || lower.includes("venta") || lower.includes("lead")) {
    category = "business";
  } else if (lower.includes("upm") || lower.includes("motostudent") || lower.includes("universidad")) {
    category = "academic";
  } else if (lower.includes("padel") || lower.includes("entreno") || lower.includes("gimnasio") || lower.includes("salud")) {
    category = "performance";
  } else if (lower.includes("comprar") || lower.includes("personal") || lower.includes("finanzas")) {
    category = "personal";
  }

  return {
    intent: "TASK",
    transcript: clean,
    confidence: 0.88,
    summary: `Crear tarea operativa: "${title}" (Prioridad: ${priority})`,
    taskData: {
      title: title || clean,
      priority,
      category,
      estimatedDuration: 30,
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const transcript = body.transcript;

    if (!transcript || typeof transcript !== "string" || transcript.trim() === "") {
      return apiError("La transcripción de audio está vacía.", { status: 400 });
    }

    const cleanText = transcript.trim();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.includes("tu_clave") || apiKey.trim() === "") {
      const fallback = deterministicVoiceParse(cleanText);
      return apiSuccess(fallback);
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
              intent: { type: SchemaType.STRING },
              confidence: { type: SchemaType.NUMBER },
              summary: { type: SchemaType.STRING },
              taskTitle: { type: SchemaType.STRING },
              taskDescription: { type: SchemaType.STRING },
              taskPriority: { type: SchemaType.STRING },
              taskCategory: { type: SchemaType.STRING },
              taskEstimatedDuration: { type: SchemaType.NUMBER },
              ideaContent: { type: SchemaType.STRING },
              ideaCategory: { type: SchemaType.STRING },
              habitName: { type: SchemaType.STRING },
            },
            required: ["intent", "confidence", "summary"],
          },
        },
        systemInstruction: `Eres el Voice NLU Engine de AI Life OS.
Tu tarea es clasificar la entrada dictada por voz del usuario en una de 3 intenciones:
1. TASK: El usuario quiere agendar o registrar una tarea a realizar (ej: "hacer llamada con clinica mañana prioridad alta", "revisar repo de antigravity").
2. IDEA: El usuario tiene un concepto, reflexión o proyecto en bruto que desea enviar al Smart Inbox (ej: "idea: crear sistema de afiliacion para clinicas").
3. HABIT_LOG: El usuario indica que ha completado un hábito (ej: "hábito completado entreno de padel", "marcar estudio terminado").

Reglas:
- CERO EMOJIS.
- Devuelve el JSON con los campos de datos estructurados según corresponda.`,
      });

      const response = await model.generateContent(
        `Clasifica y extrae entidades del siguiente audio dictado:\n"""\n${cleanText}\n"""`
      );

      const parsed = JSON.parse(response.response.text());

      const result: VoiceProcessResult = {
        intent: (["TASK", "IDEA", "HABIT_LOG"].includes(parsed.intent) ? parsed.intent : "TASK") as any,
        transcript: cleanText,
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.95,
        summary: parsed.summary || cleanText,
      };

      if (result.intent === "TASK") {
        result.taskData = {
          title: parsed.taskTitle || cleanText,
          description: parsed.taskDescription || undefined,
          priority: (["LOW", "MEDIUM", "HIGH", "CRITICAL", "URGENT"].includes(parsed.taskPriority) ? parsed.taskPriority : "MEDIUM") as PriorityLevel,
          category: (["tech", "business", "academic", "performance", "personal"].includes(parsed.taskCategory) ? parsed.taskCategory : "tech") as ProjectCategory,
          estimatedDuration: typeof parsed.taskEstimatedDuration === "number" ? parsed.taskEstimatedDuration : 30,
        };
      } else if (result.intent === "IDEA") {
        result.ideaData = {
          rawContent: parsed.ideaContent || cleanText,
          category: (["tech", "business", "personal", "academic", "performance", "general"].includes(parsed.ideaCategory) ? parsed.ideaCategory : "general") as any,
          assignedAgent: "general",
        };
      } else if (result.intent === "HABIT_LOG") {
        result.habitData = {
          habitName: parsed.habitName || cleanText,
          date: new Date().toISOString().split("T")[0],
          completed: true,
        };
      }

      return apiSuccess(result);
    } catch (llmError) {
      console.warn("Fallo en Gemini Voice NLU, aplicando fallback determinista:", llmError);
      const fallback = deterministicVoiceParse(cleanText);
      return apiSuccess(fallback);
    }
  } catch (error) {
    return handleApiError(error, "Error al procesar entrada de voz.");
  }
}
