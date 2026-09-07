import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { startOfWeek, addDays, format } from "date-fns";
import { es } from "date-fns/locale";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Calcula la racha consecutiva activa y la mejor racha histórica
 */
function calculateStreaks(logs: { date: string; completed: boolean }[]): { currentStreak: number; bestStreak: number } {
  if (!logs || logs.length === 0) return { currentStreak: 0, bestStreak: 0 };

  const completedDates = Array.from(
    new Set(
      logs
        .filter((l) => l.completed)
        .map((l) => l.date)
    )
  ).sort().reverse();

  if (completedDates.length === 0) return { currentStreak: 0, bestStreak: 0 };

  const todayStr = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  // Cálculo de racha actual
  let currentStreak = 0;
  if (completedDates.includes(todayStr) || completedDates.includes(yesterdayStr)) {
    let checkDate = new Date(completedDates.includes(todayStr) ? todayStr : yesterdayStr);
    for (let i = 0; i < 365; i++) {
      const dStr = checkDate.toISOString().split("T")[0];
      if (completedDates.includes(dStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Cálculo de mejor racha histórica
  const ascending = [...completedDates].sort();
  let bestStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  for (const dateStr of ascending) {
    const curDate = new Date(dateStr);
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diffTime = curDate.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
    if (tempStreak > bestStreak) bestStreak = tempStreak;
    prevDate = curDate;
  }

  if (currentStreak > bestStreak) bestStreak = currentStreak;

  return { currentStreak, bestStreak };
}

export async function GET(request: NextRequest) {
  try {
    const todayStr = new Date().toISOString().split("T")[0];

    let habits = await prisma.habit.findMany({
      where: { active: true },
      include: {
        logs: {
          orderBy: { date: "desc" },
          take: 60,
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
            take: 60,
          },
        },
        orderBy: { createdAt: "asc" },
      });
    }

    // Calcular días de la semana actual (Lunes a Domingo)
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const currentWeekDays = Array.from({ length: 7 }, (_, i) => {
      const d = addDays(weekStart, i);
      const dStr = format(d, "yyyy-MM-dd");
      return {
        date: dStr,
        dayName: format(d, "EEE", { locale: es }).toUpperCase().slice(0, 2),
        dayNumber: d.getDate(),
        isToday: dStr === todayStr,
      };
    });

    const formatted = habits.map((h) => {
      const isCompletedToday = h.logs.some((l) => l.date === todayStr && l.completed);
      const { currentStreak, bestStreak } = calculateStreaks(h.logs);

      // Cumplidos esta semana
      const weeklyCompletedCount = h.logs.filter((l) => {
        const isCompletedInWeek = currentWeekDays.some((w) => w.date === l.date);
        return isCompletedInWeek && l.completed;
      }).length;

      // Cumplidos últimos 30 días
      const monthlyCompletedCount = h.logs.filter((l) => {
        const logDate = new Date(l.date);
        const diffDays = (Date.now() - logDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 30 && l.completed;
      }).length;

      const consistencyPercent = Math.min(100, Math.round((monthlyCompletedCount / 30) * 100));

      const weekDaysStatus = currentWeekDays.map((w) => {
        const isDone = h.logs.some((l) => l.date === w.date && l.completed);
        return {
          ...w,
          completed: isDone,
        };
      });

      return {
        id: h.id,
        title: h.title,
        description: h.description,
        category: h.category,
        frequency: h.frequency,
        targetDays: h.targetDays,
        active: h.active,
        isCompletedToday,
        streak: currentStreak,
        bestStreak,
        weeklyCompletedCount,
        monthlyCompletedCount,
        consistencyPercent,
        recentLogs: h.logs.slice(0, 30),
        weekDaysStatus,
        createdAt: h.createdAt,
        updatedAt: h.updatedAt,
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

    if (!title || typeof title !== "string" || title.trim() === "") {
      return apiError("El título del hábito es obligatorio.", { status: 400 });
    }

    const habit = await prisma.habit.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        category: category || "tech",
        frequency: frequency || "DAILY",
        targetDays: typeof targetDays === "number" ? targetDays : 7,
      },
    });

    return apiSuccess(habit, { status: 201, message: "Hábito creado correctamente." });
  } catch (error) {
    return handleApiError(error, "Error al crear hábito.");
  }
}
