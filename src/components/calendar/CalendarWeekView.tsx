"use client";

import { useState, useEffect } from "react";
import { 
  startOfWeek, 
  addDays, 
  format, 
  isSameDay, 
  isToday, 
  differenceInMinutes 
} from "date-fns";
import { es } from "date-fns/locale";
import { CalendarEventEntity, FreeTimeSlot } from "@/lib/types";
import { Clock } from "lucide-react";

interface CalendarWeekViewProps {
  currentDate: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  events: CalendarEventEntity[];
  freeSlots?: FreeTimeSlot[];
}

export function CalendarWeekView({
  currentDate,
  selectedDate,
  onSelectDate,
  events,
  freeSlots = [],
}: CalendarWeekViewProps) {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Rango horario: 07:00 a 23:00 (16 horas = 960 minutos)
  const startHour = 7;
  const endHour = 23;
  const totalHours = endHour - startHour;
  const hours = Array.from({ length: totalHours + 1 }, (_, i) => startHour + i);

  // Posición del indicador de hora actual
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const isCurrentTimeInView = currentHour >= startHour && currentHour <= endHour;
  const currentTimePercent = isCurrentTimeInView
    ? (((currentHour - startHour) * 60 + currentMinute) / (totalHours * 60)) * 100
    : null;

  return (
    <div className="glass-panel rounded-2xl overflow-hidden border border-white/10 shadow-xl flex flex-col h-full min-h-[600px]">
      {/* Week Header */}
      <div className="grid grid-cols-8 border-b border-white/[0.08] bg-surface-950/80 sticky top-0 z-20">
        {/* Time Gutter Header */}
        <div className="p-3 text-[10px] font-mono text-surface-500 uppercase border-r border-white/[0.06] flex items-center justify-center">
          GMT+2
        </div>

        {/* 7 Days Columns Headers */}
        {weekDays.map((day) => {
          const isDayToday = isToday(day);
          const isSelected = isSameDay(day, selectedDate);

          return (
            <div
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={`p-2.5 text-center border-r border-white/[0.06] cursor-pointer transition-colors ${
                isSelected ? "bg-accent-500/[0.08]" : "hover:bg-white/[0.02]"
              }`}
            >
              <div className="text-[10px] font-mono font-medium text-surface-400 uppercase">
                {format(day, "EEE", { locale: es })}
              </div>
              <div className="mt-0.5 flex justify-center">
                <span
                  className={`text-xs font-mono w-6 h-6 flex items-center justify-center rounded-full ${
                    isDayToday
                      ? "bg-accent-600 text-white font-bold shadow-xs"
                      : isSelected
                      ? "bg-surface-800 text-accent-300 font-semibold"
                      : "text-surface-200"
                  }`}
                >
                  {format(day, "d")}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hourly Grid Body */}
      <div className="flex-1 overflow-y-auto relative bg-surface-950/40">
        <div className="grid grid-cols-8 relative" style={{ minHeight: `${totalHours * 60}px` }}>
          {/* Time Gutter Column */}
          <div className="border-r border-white/[0.06] bg-surface-950/60 select-none">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-[60px] border-b border-white/[0.04] text-[10px] font-mono text-surface-500 pr-2 pt-1 text-right"
              >
                {String(hour).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* 7 Day Event Columns */}
          {weekDays.map((day) => {
            const dayDateStr = format(day, "yyyy-MM-dd");
            const isDayToday = isToday(day);

            // Filtrar eventos del día
            const dayEvents = events.filter((ev) => {
              const evStartStr = format(new Date(ev.startTime), "yyyy-MM-dd");
              return evStartStr === dayDateStr && !ev.isAllDay;
            });

            return (
              <div
                key={day.toISOString()}
                className="border-r border-white/[0.06] relative"
              >
                {/* Horizontal Hour Lines */}
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="h-[60px] border-b border-white/[0.04]"
                  />
                ))}

                {/* Real-time indicator line on Today's column */}
                {isDayToday && currentTimePercent !== null && (
                  <div
                    className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
                    style={{ top: `${currentTimePercent}%` }}
                  >
                    <div className="w-2 h-2 rounded-full bg-rose-500 -ml-1 shadow-sm shadow-rose-500/80" />
                    <div className="flex-1 border-t border-rose-500/80" />
                  </div>
                )}

                {/* Event Blocks */}
                {dayEvents.map((ev) => {
                  const evStart = new Date(ev.startTime);
                  const evEnd = new Date(ev.endTime);

                  const startMinutesFromBase = (evStart.getHours() - startHour) * 60 + evStart.getMinutes();
                  const durationMinutes = Math.max(25, differenceInMinutes(evEnd, evStart));

                  const topPercent = Math.max(0, (startMinutesFromBase / (totalHours * 60)) * 100);
                  const heightPercent = Math.min(100 - topPercent, (durationMinutes / (totalHours * 60)) * 100);

                  return (
                    <div
                      key={ev.id}
                      className="absolute left-1 right-1 rounded-lg p-1.5 bg-blue-950/80 border border-blue-700/80 text-blue-100 shadow-md overflow-hidden z-10 hover:z-20 transition-all hover:scale-[1.01]"
                      style={{
                        top: `${topPercent}%`,
                        height: `${heightPercent}%`,
                        minHeight: "28px",
                      }}
                      title={`${ev.summary}\n${format(evStart, "HH:mm")} - ${format(evEnd, "HH:mm")}`}
                    >
                      <div className="text-[10px] font-semibold text-blue-100 truncate">
                        {ev.summary}
                      </div>
                      <div className="text-[9px] font-mono text-blue-300">
                        {format(evStart, "HH:mm")} - {format(evEnd, "HH:mm")}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
