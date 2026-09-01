import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Calcula la racha consecutiva de un hábito
 */
function calculateStreak(logs: { date: string; completed: boolean }[]): number {
  if (!logs || logs.length === 0) return 0;

  // Ordenar fechas descendente
  const sorted = [...logs]
    .filter((l) => l.completed)
    .map((l) => l.date)
    .sort()
    .reverse();

  if (sorted.length === 0) return 0;

  const todayStr = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  // Comprobar si completó hoy o ayer para mantener la racha activa
  if (!sorted.includes(todayStr) && !sorted.includes(yesterdayStr)) {
    return 0;
  }

  let streak = 0;
  let checkDate = new Date(sorted.includes(todayStr) ? todayStr : yesterdayStr);

  for (let i = 0; i < 365; i++) {
    const dStr = checkDate.toISOString().split("T")[0];
    if (sorted.includes(dStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export async function GET(request: NextRequest) {
  try {
    const todayStr = new Date().toISOString().split("T")[0];

    let habits = await prisma.habit.findMany({
      where: { active: true },
      include: {
        logs: {
          orderBy: { date: "desc" },
          take: 30,
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Semilla inicial si no hay hábitos configurados
    if (habits.length === 0) {
      const defaultHabits = [
        {
          title: "Sincronización y Commit en Workspaces Antigravity",
          description: "Avanzar código y mantener repositorios actualizados.",
          category: "tech",
          frequency: "DAILY",
          targetDays: 7,
        },
        {
          title: "Prospección y Seguimiento Clínicas Lanzing",
          description: "Contactar nuevos prospectos y cualificar con el SalesAgent.",
          category: "business",
          frequency: "DAILY",
          targetDays: 5,
        },
        {
          title: "60 min Estudio / Proyecto MotoStudent UPM",
          description: "Bloque de ingeniería académica y desarrollo del prototipo.",
          category: "academic",
          frequency: "DAILY",
          targetDays: 6,
        },
        {
          title: "Entrenamiento Pádel / Físico & 8h de Sueño",
          description: "Sesión táctica o de fuerza y recuperación fisiológica.",
          category: "performance",
          frequency: "DAILY",
          targetDays: 7,
        },
        {
          title: "Revisión de Daily Briefing & Smart Inbox Zero",
          description: "Procesar ideas capturadas y planificar el día siguiente.",
          category: "personal",
          frequency: "DAILY",
          targetDays: 7,
        },
      ];

      for (const h of defaultHabits) {
        await prisma.habit.create({ data: h });
      }

      habits = await prisma.habit.findMany({
        where: { active: true },
        include: {
          logs: {
            orderBy: { date: "desc" },
            take: 30,
          },
        },
        orderBy: { createdAt: "asc" },
      });
    }

    const formatted = habits.map((h) => {
      const isCompletedToday = h.logs.some((l) => l.date === todayStr && l.completed);
      const streak = calculateStreak(h.logs);
      const weeklyCompletedCount = h.logs.filter((l) => {
        const logDate = new Date(l.date);
        const diffDays = (Date.now() - logDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 7 && l.completed;
      }).length;

      return {
        id: h.id,
        title: h.title,
        description: h.description,
        category: h.category,
        frequency: h.frequency,
        targetDays: h.targetDays,
        isCompletedToday,
        streak,
        weeklyCompletedCount,
        recentLogs: h.logs.slice(0, 7),
      };
    });

    return apiSuccess(formatted);
  } catch (error) {
    return handleApiError(error, "Error al obtener hábitos del sistema.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { title, description, category, frequency, targetDays } = body;

    if (!title || typeof title !== "string") {
      return apiError("Título es obligatorio", { status: 400 });
    }

    const habit = await prisma.habit.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        category: category || "tech",
        frequency: frequency || "DAILY",
        targetDays: targetDays || 7,
      },
    });

    return apiSuccess(habit, { status: 201, message: "Hábito creado correctamente." });
  } catch (error) {
    return handleApiError(error, "Error al crear hábito.");
  }
}
