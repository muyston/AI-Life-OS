"use client";

import { useState, useMemo } from "react";
import { 
  CheckCircle2, 
  Circle, 
  Flame, 
  Award, 
  Edit3, 
  Trash2, 
  Code2, 
  Briefcase, 
  GraduationCap, 
  Dumbbell, 
  User,
  Calendar,
  Sun,
  Zap,
  Moon,
  LayoutGrid,
  ListFilter
} from "lucide-react";
import { HabitWithStats, ProjectCategory } from "@/lib/types";

interface HabitStreakMatrixProps {
  habits: HabitWithStats[];
  onToggleDay: (habitId: string, dateStr: string) => Promise<void>;
  onEditHabit: (habit: HabitWithStats) => void;
  onDeleteHabit: (habitId: string) => Promise<void>;
  isLoading?: boolean;
}

type GroupMode = "ALL" | "ROUTINE";

interface RoutineSection {
  id: string;
  name: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  categories: ProjectCategory[];
}

export function HabitStreakMatrix({
  habits,
  onToggleDay,
  onEditHabit,
  onDeleteHabit,
  isLoading,
}: HabitStreakMatrixProps) {
  const [activeToggles, setActiveToggles] = useState<Record<string, boolean>>({});
  const [groupMode, setGroupMode] = useState<GroupMode>("ROUTINE");

  const categoryIcons: Record<ProjectCategory, React.ComponentType<{ className?: string }>> = {
    tech: Code2,
    business: Briefcase,
    academic: GraduationCap,
    performance: Dumbbell,
    personal: User,
  };

  const categoryColors: Record<ProjectCategory, { text: string; bg: string; border: string }> = {
    tech: { text: "text-cyan-400", bg: "bg-cyan-950/50", border: "border-cyan-800/60" },
    business: { text: "text-emerald-400", bg: "bg-emerald-950/50", border: "border-emerald-800/60" },
    academic: { text: "text-indigo-400", bg: "bg-indigo-950/50", border: "border-indigo-800/60" },
    performance: { text: "text-amber-400", bg: "bg-amber-950/50", border: "border-amber-800/60" },
    personal: { text: "text-purple-400", bg: "bg-purple-950/50", border: "border-purple-800/60" },
  };

  const routines: RoutineSection[] = [
    {
      id: "morning",
      name: "Rutina Matutina y Despegue",
      subtitle: "Activación cognitiva, hidratación y foco previo a la jornada",
      icon: Sun,
      categories: ["personal", "performance"],
    },
    {
      id: "deepwork",
      name: "Bloque de Enfoque y Ejecución Primaria",
      subtitle: "Deep work, desarrollo técnico, prospección comercial y estudio",
      icon: Zap,
      categories: ["tech", "business", "academic"],
    },
  ];

  const handleDayClick = async (habitId: string, dateStr: string) => {
    const key = `${habitId}-${dateStr}`;
    if (activeToggles[key]) return;

    setActiveToggles((prev) => ({ ...prev, [key]: true }));
    try {
      await onToggleDay(habitId, dateStr);
    } finally {
      setActiveToggles((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Helper to generate last 28 days for the mini-heatmap
  const getHeatmapDays = (recentLogs: { date: string; completed: boolean }[]) => {
    const logsMap = new Map<string, boolean>();
    recentLogs.forEach((l) => logsMap.set(l.date, l.completed));

    const days: { dateStr: string; completed: boolean }[] = [];
    const today = new Date();
    for (let i = 27; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dayStr = String(d.getDate()).padStart(2, "0");
      const dateFormatted = `${y}-${m}-${dayStr}`;
      days.push({
        dateStr: dateFormatted,
        completed: logsMap.get(dateFormatted) || false,
      });
    }
    return days;
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center text-xs text-surface-400 glass-card rounded-2xl">
        Cargando matriz de hábitos y consistencia...
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <div className="py-16 text-center text-xs text-surface-400 glass-card rounded-2xl space-y-3">
        <Flame className="w-8 h-8 text-surface-600 mx-auto" />
        <p>No tienes hábitos activos en esta categoría.</p>
      </div>
    );
  }

  const renderHabitCard = (habit: HabitWithStats) => {
    const Icon = categoryIcons[habit.category] || Code2;
    const color = categoryColors[habit.category] || categoryColors.tech;
    const heatmapDays = getHeatmapDays(habit.recentLogs || []);

    return (
      <div
        key={habit.id}
        className={`glass-card rounded-2xl p-4 sm:p-5 transition-all duration-200 space-y-4 hover:border-white/15 ${
          habit.isCompletedToday ? "bg-surface-900/40" : ""
        }`}
      >
        {/* Top Row: Category, Title, Streaks and Actions */}
        <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`w-8 h-8 rounded-xl ${color.bg} ${color.border} border flex items-center justify-center shrink-0 mt-0.5`}>
              <Icon className={`w-4 h-4 ${color.text}`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xs sm:text-sm font-semibold text-surface-100 truncate">
                  {habit.title}
                </h3>
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded-md border uppercase ${color.bg} ${color.text} ${color.border}`}>
                  {habit.category}
                </span>
              </div>
              {habit.description && (
                <p className="text-[11px] text-surface-400 mt-1 line-clamp-1">
                  {habit.description}
                </p>
              )}
            </div>
          </div>

          {/* Badges & Actions */}
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            {/* Current Streak */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-400 text-xs font-mono font-bold" title="Racha activa consecutiva">
              <Flame className="w-3.5 h-3.5 fill-amber-400/20" />
              <span>{habit.streak}d</span>
            </div>

            {/* Best Streak */}
            <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-950 border border-white/10 text-surface-300 text-xs font-mono" title="Mejor racha histórica">
              <Award className="w-3 h-3 text-surface-400" />
              <span className="text-[11px]">{habit.bestStreak}d</span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 border-l border-white/10 pl-2">
              <button
                type="button"
                onClick={() => onEditHabit(habit)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-surface-400 hover:text-surface-200 transition-colors"
                title="Editar hábito"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDeleteHabit(habit.id)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-surface-400 hover:text-rose-400 transition-colors"
                title="Eliminar hábito"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Row: 7-Day Interactive Checkboxes & 28-Day Consistency Matrix */}
        <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-4 flex-wrap">
          {/* 7-Day Interactive Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {habit.weekDaysStatus.map((day) => {
              const isToggling = activeToggles[`${habit.id}-${day.date}`];
              return (
                <button
                  key={day.date}
                  type="button"
                  disabled={isToggling}
                  onClick={() => handleDayClick(habit.id, day.date)}
                  className={`flex flex-col items-center justify-center w-8 h-10 sm:w-9 sm:h-11 rounded-xl transition-all duration-150 relative ${
                    day.isToday ? "ring-1 ring-brand-500/60 shadow-xs" : ""
                  } ${
                    day.completed
                      ? "bg-brand-500/20 text-brand-400 border border-brand-500/40 hover:bg-brand-500/30"
                      : "bg-surface-950/80 text-surface-500 border border-white/[0.06] hover:border-white/20 hover:text-surface-300"
                  }`}
                  title={`${day.dayName} ${day.dayNumber} - ${day.completed ? "Cumplido (clic para desmarcar)" : "Pendiente (clic para marcar)"}`}
                >
                  <span className="text-[9px] font-mono uppercase font-medium">
                    {day.dayName}
                  </span>
                  <div className="mt-1">
                    {day.completed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-surface-600" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Consistency Metrics & 28-Day Heatmap */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs font-mono font-bold text-surface-200">
                {habit.weeklyCompletedCount}/{habit.targetDays} días
              </div>
              <span className="text-[10px] text-surface-400 font-mono">
                {habit.consistencyPercent}% mes
              </span>
            </div>

            {/* 28-Day Consistency Heatmap (4 weeks x 7 days) */}
            <div className="hidden lg:flex flex-col gap-1 p-1.5 bg-surface-950/90 rounded-lg border border-white/[0.06]">
              <div className="grid grid-cols-7 gap-1">
                {heatmapDays.map((hDay, idx) => (
                  <div
                    key={idx}
                    className={`w-2 h-2 rounded-xs transition-colors ${
                      hDay.completed 
                        ? "bg-emerald-500" 
                        : "bg-surface-800 hover:bg-surface-700"
                    }`}
                    title={`${hDay.dateStr}: ${hDay.completed ? "Cumplido" : "Pendiente"}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* View Mode Switcher */}
      <div className="flex items-center justify-between pb-1">
        <span className="text-[11px] font-mono text-surface-400 uppercase tracking-wider">
          {habits.length} Hábitos en Seguimiento
        </span>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-950 border border-white/[0.06]">
          <button
            type="button"
            onClick={() => setGroupMode("ROUTINE")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              groupMode === "ROUTINE"
                ? "bg-surface-800 text-surface-100 shadow-xs border border-white/10"
                : "text-surface-400 hover:text-surface-200"
            }`}
          >
            <ListFilter className="w-3 h-3" />
            <span>Por Rutina</span>
          </button>
          <button
            type="button"
            onClick={() => setGroupMode("ALL")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              groupMode === "ALL"
                ? "bg-surface-800 text-surface-100 shadow-xs border border-white/10"
                : "text-surface-400 hover:text-surface-200"
            }`}
          >
            <LayoutGrid className="w-3 h-3" />
            <span>Lista Completa</span>
          </button>
        </div>
      </div>

      {groupMode === "ALL" ? (
        <div className="space-y-3.5">
          {habits.map((habit) => renderHabitCard(habit))}
        </div>
      ) : (
        <div className="space-y-6">
          {routines.map((routine) => {
            const routineHabits = habits.filter((h) => routine.categories.includes(h.category));
            if (routineHabits.length === 0) return null;

            const RoutineIcon = routine.icon;

            return (
              <div key={routine.id} className="space-y-3">
                <div className="flex items-center gap-2.5 pb-2 border-b border-white/[0.06]">
                  <div className="w-6 h-6 rounded-lg bg-surface-900 border border-white/10 flex items-center justify-center text-surface-300">
                    <RoutineIcon className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-surface-200">
                      {routine.name}
                    </h3>
                    <p className="text-[10px] text-surface-400 font-mono">
                      {routine.subtitle}
                    </p>
                  </div>
                </div>

                <div className="space-y-3.5">
                  {routineHabits.map((habit) => renderHabitCard(habit))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
