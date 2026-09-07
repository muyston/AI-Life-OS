"use client";

import { useState, useMemo } from "react";
import { 
  Flame, 
  Plus, 
  TrendingUp, 
  Award, 
  Layers, 
  Code2, 
  Briefcase, 
  GraduationCap, 
  Dumbbell, 
  User,
  CheckCircle2,
  CalendarCheck
} from "lucide-react";
import { HabitWithStats } from "@/lib/types";
import { useLifeOS } from "@/lib/store/life-os-store";
import { HabitStreakMatrix } from "@/components/habits/HabitStreakMatrix";
import { HabitModal } from "@/components/habits/HabitModal";
import { VoiceInputButton } from "@/components/voice/VoiceInputButton";

export default function HabitsPage() {
  const {
    habits,
    isLoading,
    toggleHabitDay,
    saveHabit,
    deleteHabit,
    refreshAll,
  } = useLifeOS();

  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<HabitWithStats | null>(null);

  const categories = [
    { id: "ALL", label: "Todos los Dominios", icon: Layers },
    { id: "tech", label: "Tech & Codigo", icon: Code2 },
    { id: "business", label: "Business & Ventas", icon: Briefcase },
    { id: "academic", label: "Academico UPM", icon: GraduationCap },
    { id: "performance", label: "Performance / Fisico", icon: Dumbbell },
    { id: "personal", label: "Personal & Salud", icon: User },
  ];

  const filteredHabits = useMemo(() => {
    return habits.filter(
      (h) => selectedCategory === "ALL" || h.category === selectedCategory
    );
  }, [habits, selectedCategory]);

  // Estadisticas globales
  const completedToday = useMemo(() => habits.filter((h) => h.isCompletedToday).length, [habits]);
  const todayProgressPercent = habits.length > 0 ? Math.round((completedToday / habits.length) * 100) : 0;
  const bestStreakGlobal = useMemo(() => habits.reduce((max, h) => Math.max(max, h.bestStreak), 0), [habits]);
  const avgConsistency = useMemo(() => {
    return habits.length > 0
      ? Math.round(habits.reduce((acc, h) => acc + h.consistencyPercent, 0) / habits.length)
      : 0;
  }, [habits]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] flex-wrap gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-surface-400 block">
            Matriz de Disciplina y Consistencia No Negociable
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-surface-50 flex items-center gap-2.5 mt-0.5">
            <Flame className="w-5 h-5 text-amber-500 fill-amber-500/20" />
            Habitos, Streaks & Rendimiento
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <VoiceInputButton
            variant="pill"
            onActionCompleted={refreshAll}
            title="Dictar habito cumplido"
          />

          <button
            type="button"
            onClick={() => {
              setSelectedHabit(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-medium transition-all shadow-md active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Habito</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-white/[0.08]">
          <div className="text-xs text-surface-400 font-medium">Cumplimiento Hoy</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
            {completedToday}/{habits.length} ({todayProgressPercent}%)
          </div>
          <div className="w-full h-1.5 bg-surface-950 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${todayProgressPercent}%` }}
            />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-white/[0.08]">
          <div className="text-xs text-surface-400 font-medium">Mejor Racha del Sistema</div>
          <div className="text-2xl font-bold text-amber-400 mt-1 font-mono flex items-center gap-1.5">
            <Award className="w-5 h-5 text-amber-400" />
            <span>{bestStreakGlobal} dias</span>
          </div>
          <div className="text-[11px] text-surface-400 mt-1">
            Record de consistencia continua
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-white/[0.08]">
          <div className="text-xs text-surface-400 font-medium">Consistencia Mensual</div>
          <div className="text-2xl font-bold text-cyan-400 mt-1 font-mono">
            {avgConsistency}%
          </div>
          <div className="text-[11px] text-surface-400 mt-1">
            Promedio ultimos 30 dias
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-white/[0.08]">
          <div className="text-xs text-surface-400 font-medium">Habitos Registrados</div>
          <div className="text-2xl font-bold text-surface-100 mt-1 font-mono">
            {habits.length}
          </div>
          <div className="text-[11px] text-surface-400 mt-1">
            5 Dominios estructurados
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/[0.06]">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap border ${
                isSelected
                  ? "bg-surface-800 border-cyan-500 text-surface-50 shadow-xs"
                  : "bg-surface-950 border-white/[0.06] text-surface-400 hover:text-surface-200 hover:bg-surface-900"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-cyan-400" : "text-surface-400"}`} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Habits List with 7-Day Matrix */}
      <HabitStreakMatrix
        habits={filteredHabits}
        onToggleDay={toggleHabitDay}
        onEditHabit={(h) => {
          setSelectedHabit(h);
          setIsModalOpen(true);
        }}
        onDeleteHabit={deleteHabit}
        isLoading={isLoading}
      />

      {/* Habit Modal */}
      <HabitModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedHabit(null);
        }}
        onSave={saveHabit}
        habit={selectedHabit}
      />
    </div>
  );
}
