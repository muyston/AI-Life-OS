"use client";

import { useState } from "react";
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
  Calendar
} from "lucide-react";
import { HabitWithStats, ProjectCategory } from "@/lib/types";

interface HabitStreakMatrixProps {
  habits: HabitWithStats[];
  onToggleDay: (habitId: string, dateStr: string) => Promise<void>;
  onEditHabit: (habit: HabitWithStats) => void;
  onDeleteHabit: (habitId: string) => Promise<void>;
  isLoading?: boolean;
}

export function HabitStreakMatrix({
  habits,
  onToggleDay,
  onEditHabit,
  onDeleteHabit,
  isLoading,
}: HabitStreakMatrixProps) {
  const [activeToggles, setActiveToggles] = useState<Record<string, boolean>>({});

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

  return (
    <div className="space-y-3.5">
      {habits.map((habit) => {
        const Icon = categoryIcons[habit.category] || Code2;
        const color = categoryColors[habit.category] || categoryColors.tech;

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
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-400 text-xs font-mono font-bold" title="Racha activa actual">
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

            {/* Bottom Row: 7-Day Interactive Matrix & 30-Day Heatmap */}
            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-4 flex-wrap">
              {/* 7-Day Interactive Checkboxes */}
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
                        day.isToday ? "ring-1 ring-brand-500/60" : ""
                      } ${
                        day.completed
                          ? "bg-brand-500/20 text-brand-400 border border-brand-500/40 hover:bg-brand-500/30 shadow-xs"
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

              {/* 30-Day Mini Heatmap & Consistency Metric */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-surface-200">
                    {habit.weeklyCompletedCount}/{habit.targetDays} días
                  </div>
                  <span className="text-[10px] text-surface-400 font-mono">
                    Objetivo semanal ({habit.consistencyPercent}% mes)
                  </span>
                </div>

                {/* Mini Dots of last 14 logs */}
                <div className="hidden md:grid grid-cols-7 gap-1 p-1.5 bg-surface-950/90 rounded-lg border border-white/[0.06]">
                  {habit.recentLogs.slice(0, 14).reverse().map((log, idx) => (
                    <div
                      key={idx}
                      className={`w-2 h-2 rounded-xs ${
                        log.completed ? "bg-brand-500" : "bg-surface-800"
                      }`}
                      title={`${log.date}: ${log.completed ? "Cumplido" : "No registrado"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
