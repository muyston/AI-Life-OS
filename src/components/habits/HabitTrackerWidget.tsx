"use client";

import { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  Circle, 
  Flame, 
  Code2, 
  Briefcase, 
  GraduationCap, 
  Dumbbell, 
  User, 
  Layers, 
  Plus, 
  Sparkles,
  TrendingUp
} from "lucide-react";
import { ProjectCategory } from "@/lib/types";

interface HabitItem {
  id: string;
  title: string;
  description: string | null;
  category: ProjectCategory;
  frequency: string;
  targetDays: number;
  isCompletedToday: boolean;
  streak: number;
  weeklyCompletedCount: number;
  recentLogs: { date: string; completed: boolean }[];
}

export function HabitTrackerWidget() {
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadHabits = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/habits", { cache: "no-store" });
      const data = await res.json();
      if (data.success && data.data) {
        setHabits(data.data);
      }
    } catch (err) {
      console.error("Error al cargar hábitos:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHabits();
  }, []);

  const handleToggle = async (habitId: string) => {
    // Actualización optimista
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === habitId) {
          const nextCompleted = !h.isCompletedToday;
          return {
            ...h,
            isCompletedToday: nextCompleted,
            streak: nextCompleted ? h.streak + 1 : Math.max(0, h.streak - 1),
          };
        }
        return h;
      })
    );

    try {
      await fetch(`/api/habits/${habitId}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      await loadHabits();
    } catch {
      await loadHabits();
    }
  };

  const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    tech: Code2,
    business: Briefcase,
    academic: GraduationCap,
    performance: Dumbbell,
    personal: User,
  };

  const categoryColors: Record<string, string> = {
    tech: "text-cyan-400 bg-cyan-950/60 border-cyan-800/70",
    business: "text-emerald-400 bg-emerald-950/60 border-emerald-800/70",
    academic: "text-indigo-400 bg-indigo-950/60 border-indigo-800/70",
    performance: "text-amber-400 bg-amber-950/60 border-amber-800/70",
    personal: "text-purple-400 bg-purple-950/60 border-purple-800/70",
  };

  const completedTodayCount = habits.filter((h) => h.isCompletedToday).length;
  const progressPercent = habits.length > 0 ? Math.round((completedTodayCount / habits.length) * 100) : 0;

  return (
    <div className="bg-surface-900 border border-surface-800 rounded-lg p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-surface-800">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-surface-400 block">
            Consistencia y Hábitos No Negociables
          </span>
          <h3 className="text-xs font-semibold text-surface-100 uppercase tracking-wider flex items-center gap-2 mt-0.5">
            <TrendingUp className="w-4 h-4 text-brand-400" />
            Matriz de Rachas Multidominio
          </h3>
        </div>

        <div className="text-right">
          <div className="text-xs font-mono font-bold text-brand-400">
            {completedTodayCount}/{habits.length} ({progressPercent}%)
          </div>
          <span className="text-[10px] text-surface-400 font-mono">Completados hoy</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-surface-950 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-500 rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>

      {/* Habits List */}
      {isLoading ? (
        <div className="py-6 text-center text-xs text-surface-400">
          Cargando hábitos del sistema...
        </div>
      ) : (
        <div className="space-y-2.5">
          {habits.map((habit) => {
            const Icon = categoryIcons[habit.category] || Code2;
            const badgeClass = categoryColors[habit.category] || categoryColors.tech;

            return (
              <div
                key={habit.id}
                className={`p-3 rounded-lg border transition-all flex items-center justify-between gap-3 ${
                  habit.isCompletedToday
                    ? "bg-surface-950/90 border-brand-900/50"
                    : "bg-surface-950 border-surface-800 hover:border-surface-700"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleToggle(habit.id)}
                    className="text-surface-400 hover:text-brand-400 transition-colors shrink-0"
                    title={habit.isCompletedToday ? "Desmarcar hábito" : "Marcar como cumplido hoy"}
                  >
                    {habit.isCompletedToday ? (
                      <CheckCircle2 className="w-5 h-5 text-brand-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-surface-500" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs font-medium ${
                          habit.isCompletedToday ? "text-surface-200 line-through opacity-80" : "text-surface-100"
                        }`}
                      >
                        {habit.title}
                      </span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border uppercase ${badgeClass}`}>
                        {habit.category}
                      </span>
                    </div>
                    {habit.description && (
                      <p className="text-[11px] text-surface-400 truncate mt-0.5">
                        {habit.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1 px-2 py-1 rounded bg-surface-900 border border-surface-800 text-[11px] font-mono text-amber-400">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>{habit.streak}d</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
