"use client";

import { useMemo } from "react";
import { format, isToday, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarEventEntity, TaskEntity } from "@/lib/types";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  CheckSquare, 
  ChevronRight,
  ExternalLink 
} from "lucide-react";

interface CalendarAgendaViewProps {
  currentDate: Date;
  events: CalendarEventEntity[];
  tasks: TaskEntity[];
  onSelectEvent: (event: CalendarEventEntity) => void;
  onSelectDate: (date: Date) => void;
}

interface AgendaDayGroup {
  date: Date;
  dateKey: string;
  isCurrentDay: boolean;
  events: CalendarEventEntity[];
  tasks: TaskEntity[];
}

export function CalendarAgendaView({
  currentDate,
  events,
  tasks,
  onSelectEvent,
  onSelectDate,
}: CalendarAgendaViewProps) {
  const groupedAgenda = useMemo(() => {
    const dayMap = new Map<string, AgendaDayGroup>();

    // Añadir eventos
    events.forEach((ev) => {
      const start = new Date(ev.startTime);
      const key = format(start, "yyyy-MM-dd");
      if (!dayMap.has(key)) {
        dayMap.set(key, {
          date: start,
          dateKey: key,
          isCurrentDay: isToday(start),
          events: [],
          tasks: [],
        });
      }
      dayMap.get(key)!.events.push(ev);
    });

    // Añadir tareas con fecha
    tasks.forEach((t) => {
      const taskDate = t.scheduledStart ? new Date(t.scheduledStart) : t.deadline ? new Date(t.deadline) : null;
      if (taskDate) {
        const key = format(taskDate, "yyyy-MM-dd");
        if (!dayMap.has(key)) {
          dayMap.set(key, {
            date: taskDate,
            dateKey: key,
            isCurrentDay: isToday(taskDate),
            events: [],
            tasks: [],
          });
        }
        dayMap.get(key)!.tasks.push(t);
      }
    });

    const groups = Array.from(dayMap.values());
    groups.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Ordenar elementos dentro de cada dia
    groups.forEach((g) => {
      g.events.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    });

    return groups;
  }, [events, tasks]);

  return (
    <div className="glass-panel rounded-2xl overflow-hidden border border-white/10 shadow-xl flex flex-col min-h-[580px]">
      {/* Header */}
      <div className="p-4 bg-surface-950/80 border-b border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-accent-400" />
          <span className="text-xs font-semibold text-surface-200 uppercase tracking-wider">
            Vista de Agenda Cronológica
          </span>
        </div>
        <span className="text-[11px] font-mono text-surface-400">
          {events.length} eventos / {tasks.length} tareas
        </span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/[0.06] p-2 space-y-4">
        {groupedAgenda.length === 0 ? (
          <div className="py-16 text-center text-xs text-surface-500">
            No hay eventos programados en este período.
          </div>
        ) : (
          groupedAgenda.map((group) => (
            <div key={group.dateKey} className="pt-3 first:pt-1 space-y-2">
              {/* Date Separator Header */}
              <div
                onClick={() => onSelectDate(group.date)}
                className="flex items-center gap-2.5 px-2 py-1 cursor-pointer group select-none"
              >
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold transition-all ${
                    group.isCurrentDay
                      ? "bg-accent-600 text-white shadow-md shadow-accent-600/30"
                      : "bg-surface-800 text-surface-200 group-hover:bg-surface-700"
                  }`}
                >
                  {format(group.date, "d")}
                </span>
                <span className="text-xs font-bold text-surface-200 capitalize group-hover:text-accent-300 transition-colors">
                  {format(group.date, "EEEE, d 'de' MMMM", { locale: es })}
                </span>
                {group.isCurrentDay && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent-500/20 text-accent-300 font-semibold">
                    HOY
                  </span>
                )}
              </div>

              {/* Items for this day */}
              <div className="space-y-1.5 pl-3 sm:pl-9 pr-1">
                {group.events.map((ev) => {
                  const evStart = new Date(ev.startTime);
                  const evEnd = new Date(ev.endTime);
                  return (
                    <div
                      key={ev.id}
                      onClick={() => onSelectEvent(ev)}
                      className="p-2.5 rounded-xl bg-surface-950/70 hover:bg-surface-900 border border-white/[0.06] hover:border-blue-500/40 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Time pill */}
                        <div className="text-right shrink-0 min-w-[70px]">
                          {ev.isAllDay ? (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-300 font-semibold border border-blue-800/60">
                              Día completo
                            </span>
                          ) : (
                            <div className="text-[11px] font-mono text-blue-300 font-medium">
                              {format(evStart, "HH:mm")} - {format(evEnd, "HH:mm")}
                            </div>
                          )}
                        </div>

                        {/* Color dot & summary */}
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                          <span className="text-xs font-semibold text-surface-100 truncate group-hover:text-blue-300 transition-colors">
                            {ev.summary}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {ev.location && (
                          <span className="text-[10px] text-surface-400 max-w-[120px] truncate hidden sm:inline flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-surface-500" />
                            {ev.location}
                          </span>
                        )}
                        <ChevronRight className="w-3.5 h-3.5 text-surface-500 group-hover:text-surface-200 transition-colors" />
                      </div>
                    </div>
                  );
                })}

                {group.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-2 rounded-xl bg-surface-950/50 hover:bg-surface-900 border border-white/[0.04] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 shrink-0 font-medium">
                        Tarea
                      </span>
                      <span
                        className={`truncate ${
                          task.status === "COMPLETED"
                            ? "text-surface-500 line-through"
                            : "text-surface-200 font-medium"
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-surface-500 shrink-0">
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
