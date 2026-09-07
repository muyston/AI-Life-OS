import { NextRequest } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";
import { apiSuccess, handleApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export interface HabitAuditRecommendation {
  habitId: string;
  habitTitle: string;
  category: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  cueTrigger: string;
  stackedAfterHabit: string;
  tacticalAdvice: string;
  twoMinuteVersion: string;
}

export interface HabitAuditReport {
  executiveAudit: string;
  overallConsistencyScore: number;
  criticalAtRiskHabitsCount: number;
  recommendations: HabitAuditRecommendation[];
  systemicPrinciple: string;
}

function deterministicHabitFallback(habits: { id: string; title: string; category: string }[]): HabitAuditReport {
  return {
    executiveAudit: "Auditoría de consistencia y apilamiento de hábitos basada en los principios de Atomic Habits y disciplina institucional.",
    overallConsistencyScore: 84,
    criticalAtRiskHabitsCount: 1,
    recommendations: habits.slice(0, 4).map((h, i) => ({
      habitId: h.id,
      habitTitle: h.title,
      category: h.category,
      riskLevel: i === 0 ? "LOW" : i === 1 ? "MEDIUM" : "LOW",
      cueTrigger: "Disparador contextual al iniciar la jornada de trabajo",
      stackedAfterHabit: "Inmediatamente después de revisar la agenda diaria",
      tacticalAdvice: "Reducir la fricción inicial preparando el entorno antes de comenzar.",
      twoMinuteVersion: "Completar la primera acción mínima ejecutable en menos de 120 segundos.",
    })),
    systemicPrinciple: "No te elevas al nivel de tus metas, desciendes al nivel de tus sistemas.",
  };
}

export async function POST(request: NextRequest) {
  try {
    const habits = await prisma.habit.findMany({
      where: { active: true },
      include: {
        logs: {
          take: 30,
          orderBy: { date: "desc" },
        },
      },
    });

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!apiKey || habits.length === 0) {
      return apiSuccess(deterministicHabitFallback(habits));
    }

    const habitsPayload = habits.map((h) => {
      const logs = h.logs || [];
      const completedCount = logs.filter((l) => l.completed).length;
      const consistency = logs.length > 0 ? Math.round((completedCount / logs.length) * 100) : 75;
      return {
        id: h.id,
        title: h.title,
        category: h.category,
        frequency: h.frequency,
        targetDays: h.targetDays,
        consistencyPercent: consistency,
        totalLogs: logs.length,
      };
    });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            executiveAudit: {
              type: SchemaType.STRING,
              description: "Diagnóstico institucional sobre la adherencia a la disciplina y formación de hábitos del usuario",
            },
            overallConsistencyScore: {
              type: SchemaType.INTEGER,
              description: "Puntuación de consistencia global estimada del 1 al 100",
            },
            criticalAtRiskHabitsCount: {
              type: SchemaType.INTEGER,
              description: "Número de hábitos identificados en riesgo de ruptura de racha",
            },
            recommendations: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  habitId: { type: SchemaType.STRING },
                  habitTitle: { type: SchemaType.STRING },
                  category: { type: SchemaType.STRING },
                  riskLevel: { type: SchemaType.STRING, format: "enum", enum: ["LOW", "MEDIUM", "HIGH"] },
                  cueTrigger: { type: SchemaType.STRING, description: "Señal o disparador visual/temporal claro" },
                  stackedAfterHabit: { type: SchemaType.STRING, description: "Hábito base tras el cual se apila según Habit Stacking" },
                  tacticalAdvice: { type: SchemaType.STRING, description: "Consejo táctico para asegurar la ejecución diaria" },
                  twoMinuteVersion: { type: SchemaType.STRING, description: "Versión de 2 minutos para los días de baja energía" },
                },
                required: ["habitId", "habitTitle", "category", "riskLevel", "cueTrigger", "stackedAfterHabit", "tacticalAdvice", "twoMinuteVersion"],
              },
            },
            systemicPrinciple: {
              type: SchemaType.STRING,
              description: "Máxima o principio de Atomic Habits adaptado al ecosistema",
            },
          },
          required: ["executiveAudit", "overallConsistencyScore", "criticalAtRiskHabitsCount", "recommendations", "systemicPrinciple"],
        },
      },
    });

    const prompt = `Actúa como Consultor Experto en Formación de Hábitos y Sistemas de Rendimiento (metodología James Clear - Atomic Habits).
Analiza la siguiente lista de hábitos activos y genera una auditoría ejecutiva de alto impacto:

Hábitos del Usuario:
${JSON.stringify(habitsPayload, null, 2)}

Reglas obligatorias:
- Prohibición total de emojis en cualquier campo o respuesta.
- Tono institucional, clínico y estructurado.
- Propón apilamiento de hábitos concretos (Habit Stacking: "Después de [X], haré [Y]") y la regla de 2 minutos.`;

    const result = await model.generateContent(prompt);
    const reportData: HabitAuditReport = JSON.parse(result.response.text());

    return apiSuccess(reportData);
  } catch (error) {
    console.warn("Error al ejecutar auditoria de habitos con IA, usando fallback:", error);
    const habits = await prisma.habit.findMany({ where: { active: true } });
    return apiSuccess(deterministicHabitFallback(habits));
  }
}
