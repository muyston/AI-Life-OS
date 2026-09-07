"use client";

import { useState } from "react";
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
import { X, Plus, Calendar as CalendarIcon, Clock } from "lucide-react";

interface CalendarMonthViewProps {
  currentDate: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onDoubleClickDate?: (date: Date) => void;
  onSelectEvent?: (event: CalendarEventEntity) => void;
  onQuickAdd?: (date: Date) => void;
  events: CalendarEventEntity[];
  tasks?: TaskEntity[];
}

export function CalendarMonthView({
  currentDate,
  selectedDate,
  onSelectDate,
  onDoubleClickDate,
  onSelectEvent,
  onQuickAdd,
  events,
  tasks = [],
}: CalendarMonthViewProps) {
  const [popoverDay, setPopoverDay] = useState<{ date: Date; events: CalendarEventEntity[]; tasks: TaskEntity[] } | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDayNames = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

  return (
    <div className="glass-panel rounded-2xl overflow-hidden border border-white/10 shadow-xl flex flex-col h-full min-h-[640px] relative">
      {/* Weekday Header */}
      <div className="grid grid-cols-7 border-b border-white/[0.08] bg-surface-950/80 text-center py-2.5">
        {weekDayNames.map((name, i) => (
          <div
            key={name}
            className={`text-[11px] font-mono font-semibold tracking-wider ${
              i >= 5 ? "text-surface-500" : "text-surface-300"
            }`}
          >
            {name}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-surface-950/20">
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

          const totalItems = dayEvents.length + dayTasks.length;
          const maxVisible = 3;
          const overflowCount = Math.max(0, totalItems - maxVisible);

          return (
            <div
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              onDoubleClick={() => {
                if (onDoubleClickDate) onDoubleClickDate(day);
                else if (onQuickAdd) onQuickAdd(day);
              }}
              className={`min-h-[105px] p-2 border-b border-r border-white/[0.06] transition-colors flex flex-col justify-between cursor-pointer group select-none ${
                !isCurrentMonth ? "opacity-25 bg-surface-950/70" : "hover:bg-white/[0.02]"
              } ${isSelected ? "bg-accent-500/[0.08] ring-1 ring-inset ring-accent-500/30" : ""}`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-mono w-6 h-6 flex items-center justify-center rounded-full transition-all ${
                    isDayToday
                      ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-500/30"
                      : isSelected
                      ? "bg-surface-800 text-accent-300 font-bold"
                      : isCurrentMonth
                      ? "text-surface-200 group-hover:text-surface-50"
                      : "text-surface-600"
                  }`}
                >
                  {format(day, "d")}
                </span>

                {isCurrentMonth && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onQuickAdd) onQuickAdd(day);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded-md hover:bg-white/10 text-surface-400 hover:text-surface-100 transition-opacity"
                    title="Añadir evento o tarea en esta fecha"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Day Event Chips (Google Calendar Style) */}
              <div className="space-y-1 mt-1 flex-1 overflow-hidden">
                {dayEvents.slice(0, maxVisible).map((ev) => {
                  const evStart = new Date(ev.startTime);
                  return (
                    <div
                      key={ev.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectEvent) onSelectEvent(ev);
                      }}
                      className={`px-1.5 py-0.5 rounded-md text-[10px] truncate font-medium flex items-center gap-1 transition-all cursor-pointer ${
                        ev.isAllDay
                          ? "bg-blue-600 text-white shadow-xs hover:bg-blue-500"
                          : "bg-blue-950/80 text-blue-200 border-l-2 border-l-blue-500 border border-blue-900/60 hover:bg-blue-900/60"
                      }`}
                      title={`${ev.summary} (${format(evStart, "HH:mm")})`}
                    >
                      {!ev.isAllDay && (
                        <span className="text-[9px] font-mono text-blue-400 font-semibold shrink-0">
                          {format(evStart, "HH:mm")}
                        </span>
                      )}
                      <span className="truncate">{ev.summary}</span>
                    </div>
                  );
                })}

                {/* Day Tasks */}
                {dayTasks.slice(0, Math.max(0, maxVisible - dayEvents.length)).map((task) => (
                  <div
                    key={task.id}
                    className={`px-1.5 py-0.5 rounded-md text-[10px] truncate border-l-2 flex items-center gap-1 font-medium ${
                      task.status === "COMPLETED"
                        ? "bg-surface-900 text-surface-500 border-l-surface-600 border border-white/[0.04] line-through"
                        : task.priority === "URGENT" || task.priority === "HIGH"
                        ? "bg-rose-950/70 text-rose-200 border-l-rose-500 border border-rose-900/50"
                        : "bg-emerald-950/70 text-emerald-200 border-l-emerald-500 border border-emerald-900/50"
                    }`}
                    title={`Tarea: ${task.title}`}
                  >
                    <span className="truncate">{task.title}</span>
                  </div>
                ))}

                {overflowCount > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPopoverDay({ date: day, events: dayEvents, tasks: dayTasks });
                    }}
                    className="text-[9px] font-mono text-blue-400 hover:text-blue-300 font-semibold pl-1 text-left block w-full truncate hover:underline"
                  >
                    +{overflowCount} más
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Popover for "+X more" events of a day */}
      {popoverDay && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl max-w-sm w-full p-4 border border-white/10 shadow-2xl space-y-3 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <div>
                <span className="text-[10px] font-mono text-surface-400 uppercase tracking-wider block">
                  {format(popoverDay.date, "EEEE", { locale: es })}
                </span>
                <h4 className="text-sm font-bold text-surface-100">
                  {format(popoverDay.date, "d 'de' MMMM 'de' yyyy", { locale: es })}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setPopoverDay(null)}
                className="p-1 rounded-full hover:bg-white/10 text-surface-400 hover:text-surface-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1 text-xs">
              {popoverDay.events.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => {
                    setPopoverDay(null);
                    if (onSelectEvent) onSelectEvent(ev);
                  }}
                  className="p-2 rounded-xl bg-blue-950/60 hover:bg-blue-900/60 border border-blue-800/60 cursor-pointer flex items-center justify-between gap-2"
                >
                  <div className="truncate min-w-0">
                    <div className="font-semibold text-blue-200 truncate">{ev.summary}</div>
                    <div className="text-[10px] font-mono text-blue-400">
                      {ev.isAllDay ? "Todo el día" : `${format(new Date(ev.startTime), "HH:mm")} - ${format(new Date(ev.endTime), "HH:mm")}`}
                    </div>
                  </div>
                </div>
              ))}

              {popoverDay.tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-2 rounded-xl bg-surface-950/60 border border-white/[0.06] flex items-center justify-between gap-2"
                >
                  <span className="text-surface-200 truncate">{task.title}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-800 text-surface-400">
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
