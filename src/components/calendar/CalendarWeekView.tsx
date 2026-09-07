"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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

interface CalendarWeekViewProps {
  currentDate: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onSelectEvent?: (event: CalendarEventEntity) => void;
  onQuickAdd?: (date: Date, hour?: number) => void;
  events: CalendarEventEntity[];
  freeSlots?: FreeTimeSlot[];
}

interface PositionedEvent {
  event: CalendarEventEntity;
  startMinutes: number;
  durationMinutes: number;
  topPercent: number;
  heightPercent: number;
  colIndex: number;
  colTotal: number;
}

export function CalendarWeekView({
  currentDate,
  selectedDate,
  onSelectDate,
  onSelectEvent,
  onQuickAdd,
  events,
  freeSlots = [],
}: CalendarWeekViewProps) {
  const [now, setNow] = useState<Date>(new Date());
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll al cargar hacia las 08:00 o la hora actual
  useEffect(() => {
    if (scrollContainerRef.current) {
      const targetHour = Math.max(7, Math.min(now.getHours() - 1, 18));
      scrollContainerRef.current.scrollTop = targetHour * 56;
    }
  }, []);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Rango 00:00 a 24:00 (24 horas completas como Google Calendar)
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const totalMinutesInDay = 24 * 60;

  // Separar eventos de día completo
  const allDayEventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEventEntity[]>();
    weekDays.forEach((d) => {
      const dStr = format(d, "yyyy-MM-dd");
      const evs = events.filter((e) => {
        if (!e.isAllDay) return false;
        const eStr = format(new Date(e.startTime), "yyyy-MM-dd");
        return eStr === dStr;
      });
      map.set(dStr, evs);
    });
    return map;
  }, [events, weekDays]);

  const hasAnyAllDay = useMemo(() => {
    return Array.from(allDayEventsByDay.values()).some((arr) => arr.length > 0);
  }, [allDayEventsByDay]);

  // Posición del indicador de hora actual
  const currentMinutesFromMidnight = now.getHours() * 60 + now.getMinutes();
  const currentTimePercent = (currentMinutesFromMidnight / totalMinutesInDay) * 100;

  // Calculo de eventos posicionados con solapamientos
  const getPositionedEventsForDay = (dayDateStr: string): PositionedEvent[] => {
    const dayEvents = events.filter((ev) => {
      if (ev.isAllDay) return false;
      const evStartStr = format(new Date(ev.startTime), "yyyy-MM-dd");
      return evStartStr === dayDateStr;
    });

    if (dayEvents.length === 0) return [];

    dayEvents.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const positioned: PositionedEvent[] = [];

    for (let i = 0; i < dayEvents.length; i++) {
      const ev = dayEvents[i];
      const evStart = new Date(ev.startTime);
      const evEnd = new Date(ev.endTime);

      const startMin = evStart.getHours() * 60 + evStart.getMinutes();
      const durMin = Math.max(25, differenceInMinutes(evEnd, evStart));

      // Detectar solapamientos con eventos concurrentes
      const overlapping = dayEvents.filter((other, oIdx) => {
        if (oIdx === i) return true;
        const otherStart = new Date(other.startTime);
        const otherEnd = new Date(other.endTime);
        const oStartMin = otherStart.getHours() * 60 + otherStart.getMinutes();
        const oDurMin = Math.max(25, differenceInMinutes(otherEnd, otherStart));
        return (
          (startMin >= oStartMin && startMin < oStartMin + oDurMin) ||
          (startMin + durMin > oStartMin && startMin + durMin <= oStartMin + oDurMin) ||
          (startMin <= oStartMin && startMin + durMin >= oStartMin + oDurMin)
        );
      });

      const colIndex = overlapping.findIndex((x) => x.id === ev.id);
      const colTotal = Math.max(1, overlapping.length);

      const topPercent = (startMin / totalMinutesInDay) * 100;
      const heightPercent = (durMin / totalMinutesInDay) * 100;

      positioned.push({
        event: ev,
        startMinutes: startMin,
        durationMinutes: durMin,
        topPercent,
        heightPercent: Math.min(heightPercent, 100 - topPercent),
        colIndex: Math.max(0, colIndex),
        colTotal,
      });
    }

    return positioned;
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden border border-white/10 shadow-xl flex flex-col h-full min-h-[660px]">
      {/* Week Header */}
      <div className="grid grid-cols-8 border-b border-white/[0.08] bg-surface-950/90 sticky top-0 z-30">
        {/* Time Gutter Header */}
        <div className="p-3 text-[10px] font-mono text-surface-500 uppercase border-r border-white/[0.06] flex items-center justify-center select-none">
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
              className={`p-2.5 text-center border-r border-white/[0.06] cursor-pointer transition-colors select-none ${
                isSelected ? "bg-accent-500/[0.08]" : "hover:bg-white/[0.02]"
              }`}
            >
              <div
                className={`text-[10px] font-mono uppercase tracking-wider ${
                  isDayToday ? "text-blue-400 font-bold" : "text-surface-400"
                }`}
              >
                {format(day, "EEE", { locale: es })}
              </div>
              <div className="mt-0.5 flex justify-center">
                <span
                  className={`text-xs font-mono w-6 h-6 flex items-center justify-center rounded-full transition-all ${
                    isDayToday
                      ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-500/30"
                      : isSelected
                      ? "bg-surface-800 text-accent-300 font-bold"
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

      {/* Optional All-Day Events Row */}
      {hasAnyAllDay && (
        <div className="grid grid-cols-8 border-b border-white/[0.08] bg-surface-950/70 text-xs">
          <div className="p-2 border-r border-white/[0.06] text-[10px] font-mono text-surface-500 flex items-center justify-center">
            Todo el día
          </div>
          {weekDays.map((day) => {
            const dStr = format(day, "yyyy-MM-dd");
            const allDayEvs = allDayEventsByDay.get(dStr) || [];
            return (
              <div key={dStr} className="p-1 border-r border-white/[0.06] space-y-1">
                {allDayEvs.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => onSelectEvent && onSelectEvent(ev)}
                    className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-medium truncate cursor-pointer hover:bg-blue-500"
                    title={ev.summary}
                  >
                    {ev.summary}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Hourly Grid Body */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto relative bg-surface-950/30">
        <div className="grid grid-cols-8 relative" style={{ height: "1344px" }}>
          {/* Time Gutter Column */}
          <div className="border-r border-white/[0.06] bg-surface-950/60 select-none">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-[56px] border-b border-white/[0.04] text-[10px] font-mono text-surface-500 pr-2 pt-1 text-right"
              >
                {String(hour).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* 7 Day Event Columns */}
          {weekDays.map((day) => {
            const dayDateStr = format(day, "yyyy-MM-dd");
            const isDayToday = isToday(day);
            const dayPositionedEvents = getPositionedEventsForDay(dayDateStr);

            return (
              <div
                key={day.toISOString()}
                className="border-r border-white/[0.06] relative h-full"
              >
                {/* 24 Hour Slots */}
                {hours.map((hour) => (
                  <div
                    key={hour}
                    onClick={() => {
                      onSelectDate(day);
                      if (onQuickAdd) onQuickAdd(day, hour);
                    }}
                    className="h-[56px] border-b border-white/[0.04] hover:bg-white/[0.02] cursor-pointer transition-colors"
                  />
                ))}

                {/* Real-time indicator line on Today's column */}
                {isDayToday && (
                  <div
                    className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
                    style={{ top: `${currentTimePercent}%` }}
                  >
                    <div className="w-2 h-2 rounded-full bg-rose-500 -ml-1 shadow-sm shadow-rose-500/80" />
                    <div className="flex-1 border-t border-rose-500/90" />
                  </div>
                )}

                {/* Positioned Event Blocks (Google Calendar Look) */}
                {dayPositionedEvents.map(({ event: ev, topPercent, heightPercent, colIndex, colTotal }) => {
                  const evStart = new Date(ev.startTime);
                  const evEnd = new Date(ev.endTime);

                  const widthPercent = 100 / colTotal;
                  const leftPercent = colIndex * widthPercent;

                  return (
                    <div
                      key={ev.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectEvent) onSelectEvent(ev);
                      }}
                      className="absolute rounded-lg p-1.5 bg-blue-950/90 border-l-2 border-l-blue-400 border border-blue-800/80 text-blue-100 shadow-md overflow-hidden z-10 hover:z-20 transition-all hover:scale-[1.01] cursor-pointer"
                      style={{
                        top: `${topPercent}%`,
                        height: `${Math.max(24, heightPercent)}%`,
                        left: `${leftPercent + 1}%`,
                        width: `${widthPercent - 2}%`,
                      }}
                      title={`${ev.summary}\n${format(evStart, "HH:mm")} - ${format(evEnd, "HH:mm")}`}
                    >
                      <div className="text-[10px] font-bold text-blue-100 truncate leading-tight">
                        {ev.summary}
                      </div>
                      <div className="text-[9px] font-mono text-blue-300 truncate mt-0.5">
                        {format(evStart, "HH:mm")} - {format(evEnd, "HH:mm")}
                      </div>
                      {ev.location && (
                        <div className="text-[8px] text-blue-400/80 truncate">
                          {ev.location}
                        </div>
                      )}
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
