"use client";

import { useMemo } from "react";
import { 
  Activity, 
  Code2, 
  Briefcase, 
  GraduationCap, 
  Dumbbell, 
  User, 
  AlertCircle,
  CheckCircle2,
  PieChart
} from "lucide-react";
import { ProjectEntity, TaskEntity, ProjectCategory } from "@/lib/types";

interface MultidomainRadarProps {
  projects: ProjectEntity[];
  tasks: TaskEntity[];
}

export function MultidomainRadar({ projects, tasks }: MultidomainRadarProps) {
  const domainData = useMemo(() => {
    const categories: { id: ProjectCategory; label: string; icon: React.ComponentType<{ className?: string }>; color: string; barColor: string }[] = [
      { id: "tech", label: "Tech & SaaS", icon: Code2, color: "text-cyan-400", barColor: "bg-cyan-500" },
      { id: "business", label: "Business & Ventas", icon: Briefcase, color: "text-emerald-400", barColor: "bg-emerald-500" },
      { id: "academic", label: "Académico (UPM)", icon: GraduationCap, color: "text-indigo-400", barColor: "bg-indigo-500" },
      { id: "performance", label: "Pádel & Salud", icon: Dumbbell, color: "text-amber-400", barColor: "bg-amber-500" },
      { id: "personal", label: "Personal & Finanzas", icon: User, color: "text-purple-400", barColor: "bg-purple-500" },
    ];

    const totalTasksCount = tasks.length || 1;

    return categories.map((cat) => {
      const catProjects = projects.filter((p) => p.category === cat.id);
      const catTasks = tasks.filter((t) => t.project?.category === cat.id || (t as { category?: string }).category === cat.id);
      const pendingTasks = catTasks.filter((t) => t.status === "PENDING" || t.status === "IN_PROGRESS").length;
      const completedTasks = catTasks.filter((t) => t.status === "COMPLETED").length;

      // Calcular peso relativo del dominio
      const sharePercent = Math.round(((catTasks.length || catProjects.length) / (totalTasksCount || 1)) * 100);

      // Score de salud del dominio (0 a 100)
      let healthScore = 85;
      if (catProjects.length === 0 && catTasks.length === 0) {
        healthScore = 40; // Desatendido
      } else if (pendingTasks > 4 && completedTasks === 0) {
        healthScore = 55; // Cuello de botella
      } else if (completedTasks > 0) {
        healthScore = 95; // Activo y con tracción
      }

      return {
        ...cat,
        projectsCount: catProjects.length,
        tasksCount: catTasks.length,
        pendingTasks,
        completedTasks,
        sharePercent: Math.min(100, Math.max(10, sharePercent)),
        healthScore,
      };
    });
  }, [projects, tasks]);

  const globalHealthScore = Math.round(
    domainData.reduce((acc, d) => acc + d.healthScore, 0) / domainData.length
  );

  return (
    <div className="bg-surface-900 border border-surface-800 rounded-lg p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-surface-800">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-surface-400 block">
            Auditoría de Carga Cognitiva y Equilibrio
          </span>
          <h3 className="text-xs font-semibold text-surface-100 uppercase tracking-wider flex items-center gap-2 mt-0.5">
            <Activity className="w-4 h-4 text-cyan-400" />
            Radar Multidominio del Sistema
          </h3>
        </div>

        <div className="text-right">
          <div className="text-xs font-mono font-bold text-cyan-400">
            {globalHealthScore}% Salud Global
          </div>
          <span className="text-[10px] text-surface-400 font-mono">5 Dominios Activos</span>
        </div>
      </div>

      {/* Domain Bars */}
      <div className="space-y-3">
        {domainData.map((d) => {
          const Icon = d.icon;
          return (
            <div key={d.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Icon className={`w-3.5 h-3.5 ${d.color}`} />
                  <span className="text-surface-200 font-medium text-[11px]">{d.label}</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="text-surface-400">
                    {d.projectsCount} proj &bull; {d.pendingTasks} pend
                  </span>
                  <span className={`font-semibold ${d.color}`}>
                    {d.healthScore}%
                  </span>
                </div>
              </div>

              <div className="w-full h-1.5 bg-surface-950 rounded-full overflow-hidden">
                <div
                  className={`h-full ${d.barColor} rounded-full transition-all duration-500`}
                  style={{ width: `${d.healthScore}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Strategic Insight */}
      <div className="p-3 rounded-lg bg-surface-950 border border-surface-800 text-[11px] text-surface-300 flex items-start gap-2.5">
        <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-surface-200 block">Diagnóstico de Equilibrio:</span>
          <p className="text-surface-400 mt-0.5 leading-relaxed">
            Ecosistema en balance estable. Los 8 workspaces de Antigravity alimentan el eje técnico y comercial, mientras los hábitos mantienen tracción diaria en rendimiento deportivo y académico.
          </p>
        </div>
      </div>
    </div>
  );
}
