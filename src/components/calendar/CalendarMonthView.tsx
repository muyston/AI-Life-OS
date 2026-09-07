"use client";

import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday, 
  format 
} from "date-fns";
import { es } from "date-fns/locale";
import { CalendarEventEntity, TaskEntity } from "@/lib/types";

interface CalendarMonthViewProps {
  currentDate: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onDoubleClickDate?: (date: Date) => void;
  events: CalendarEventEntity[];
  tasks?: TaskEntity[];
}

export function CalendarMonthView({
  currentDate,
  selectedDate,
  onSelectDate,
  onDoubleClickDate,
  events,
  tasks = [],
}: CalendarMonthViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDayNames = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

  return (
    <div className="glass-panel rounded-2xl overflow-hidden border border-white/10 shadow-xl flex flex-col h-full min-h-[580px]">
      {/* Weekday Header */}
      <div className="grid grid-cols-7 border-b border-white/[0.08] bg-surface-950/60 text-center py-2.5">
        {weekDayNames.map((name, i) => (
          <div key={name} className={`text-[11px] font-mono font-semibold ${i >= 5 ? "text-surface-500" : "text-surface-300"}`}>
            {name}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-surface-950/30">
        {days.map((day) => {
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isSelected = isSameDay(day, selectedDate);
          const isDayToday = isToday(day);
          const dayDateStr = format(day, "yyyy-MM-dd");

          // Eventos para este día
          const dayEvents = events.filter((ev) => {
            const evStartStr = format(new Date(ev.startTime), "yyyy-MM-dd");
            return evStartStr === dayDateStr;
          });

          // Tareas programadas o con deadline para este día
          const dayTasks = tasks.filter((t) => {
            if (t.scheduledStart) {
              return format(new Date(t.scheduledStart), "yyyy-MM-dd") === dayDateStr;
            }
            if (t.deadline) {
              return format(new Date(t.deadline), "yyyy-MM-dd") === dayDateStr;
            }
            return false;
          });

          return (
            <div
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              onDoubleClick={() => onDoubleClickDate && onDoubleClickDate(day)}
              className={`min-h-[90px] p-1.5 border-b border-r border-white/[0.06] transition-colors flex flex-col justify-between cursor-pointer group ${
                !isCurrentMonth ? "opacity-30 bg-surface-950/70" : "hover:bg-white/[0.03]"
              } ${isSelected ? "bg-accent-500/[0.08] ring-1 ring-inset ring-accent-500/40" : ""}`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-mono w-6 h-6 flex items-center justify-center rounded-full transition-all ${
                    isDayToday
                      ? "bg-accent-600 text-white font-bold shadow-xs"
                      : isSelected
                      ? "bg-surface-800 text-accent-300 font-semibold"
                      : isCurrentMonth
                      ? "text-surface-200"
                      : "text-surface-500"
                  }`}
                >
                  {format(day, "d")}
                </span>

                {(dayEvents.length > 0 || dayTasks.length > 0) && (
                  <span className="text-[10px] font-mono text-surface-400">
                    {dayEvents.length + dayTasks.length}
                  </span>
                )}
              </div>

              {/* Day Event Chips */}
              <div className="space-y-1 mt-1 flex-1 overflow-hidden">
                {dayEvents.slice(0, 3).map((ev) => (
                  <div
                    key={ev.id}
                    className="px-1.5 py-0.5 rounded text-[10px] truncate bg-blue-950/70 text-blue-200 border border-blue-800/60 font-medium flex items-center gap-1"
                    title={`${ev.summary} (${format(new Date(ev.startTime), "HH:mm")} - ${format(new Date(ev.endTime), "HH:mm")})`}
                  >
                    {!ev.isAllDay && (
                      <span className="text-[9px] font-mono text-blue-400 shrink-0">
                        {format(new Date(ev.startTime), "HH:mm")}
                      </span>
                    )}
                    <span className="truncate">{ev.summary}</span>
                  </div>
                ))}

                {dayTasks.slice(0, 2).map((task) => (
                  <div
                    key={task.id}
                    className={`px-1.5 py-0.5 rounded text-[10px] truncate border flex items-center gap-1 font-medium ${
                      task.status === "COMPLETED"
                        ? "bg-surface-900 text-surface-500 border-surface-800 line-through"
                        : task.priority === "URGENT" || task.priority === "HIGH"
                        ? "bg-rose-950/60 text-rose-300 border-rose-800/60"
                        : "bg-emerald-950/60 text-emerald-300 border-emerald-800/60"
                    }`}
                    title={`Tarea: ${task.title} (${task.priority})`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span className="truncate">{task.title}</span>
                  </div>
                ))}

                {dayEvents.length + dayTasks.length > 4 && (
                  <div className="text-[9px] font-mono text-surface-400 pl-1">
                    +{dayEvents.length + dayTasks.length - 4} más
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
