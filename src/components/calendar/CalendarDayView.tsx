"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarEventEntity, FreeTimeSlot } from "@/lib/types";
import { Calendar, Clock, MapPin, Sparkles, CheckCircle2 } from "lucide-react";

interface CalendarDayViewProps {
  selectedDate: Date;
  events: CalendarEventEntity[];
  freeSlots: FreeTimeSlot[];
  onScheduleSlot?: (slot: FreeTimeSlot) => void;
  onSelectEvent?: (event: CalendarEventEntity) => void;
}

export function CalendarDayView({
  selectedDate,
  events,
  freeSlots,
  onScheduleSlot,
  onSelectEvent,
}: CalendarDayViewProps) {
  const formattedDate = format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
  const totalFreeMinutes = freeSlots.reduce((acc, s) => acc + s.durationMinutes, 0);

  // Combinar cronológicamente eventos y huecos libres
  const combinedBlocks = [
    ...events.map((e) => ({
      type: "EVENT" as const,
      id: e.id,
      rawEvent: e,
      title: e.summary,
      description: e.description,
      location: e.location,
      startTime: new Date(e.startTime),
      endTime: new Date(e.endTime),
      durationMinutes: Math.round((new Date(e.endTime).getTime() - new Date(e.startTime).getTime()) / 60000),
      isAllDay: e.isAllDay,
    })),
    ...freeSlots.map((s, idx) => ({
      type: "FREE_SLOT" as const,
      id: `free-slot-${idx}`,
      title: `Hueco Libre (${s.durationMinutes} min)`,
      description: null,
      location: null,
      startTime: new Date(s.start),
      endTime: new Date(s.end),
      durationMinutes: s.durationMinutes,
      isAllDay: false,
      slotData: s,
    })),
  ].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  return (
    <div className="glass-panel rounded-2xl p-5 space-y-5 border border-white/10 shadow-xl">
      {/* Day Title & Metrics */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] flex-wrap gap-2">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-surface-400 block capitalize">
            {formattedDate}
          </span>
          <h2 className="text-sm sm:text-base font-bold text-surface-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-accent-400" />
            Agenda Detallada del Día
          </h2>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="px-2.5 py-1 rounded-lg bg-blue-950/60 border border-blue-800/60 text-blue-300">
            {events.length} Eventos Fijos
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 font-bold">
            {totalFreeMinutes} min Libres
          </div>
        </div>
      </div>

      {/* Timeline Items */}
      {combinedBlocks.length === 0 ? (
        <div className="py-16 text-center text-xs text-surface-400 space-y-2">
          <Clock className="w-8 h-8 text-surface-600 mx-auto" />
          <p>No hay eventos registrados para este día.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {combinedBlocks.map((item) => {
            if (item.type === "EVENT") {
              return (
                <div
                  key={item.id}
                  onClick={() => onSelectEvent && onSelectEvent(item.rawEvent)}
                  className="glass-card rounded-xl p-3.5 border-l-4 border-l-blue-500 flex items-start justify-between gap-4 transition-all hover:border-white/20 cursor-pointer hover:bg-white/[0.03]"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-semibold text-surface-100">
                        {item.title}
                      </h4>
                      {item.isAllDay && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-900/60 text-blue-300 border border-blue-700">
                          Todo el día
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-[11px] text-surface-400 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    {item.location && (
                      <div className="flex items-center gap-1 text-[11px] text-surface-400 font-mono">
                        <MapPin className="w-3 h-3 text-surface-500" />
                        <span className="truncate">{item.location}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono font-bold text-blue-300">
                      {format(item.startTime, "HH:mm")} - {format(item.endTime, "HH:mm")}
                    </div>
                    <div className="text-[10px] text-surface-400 font-mono mt-0.5">
                      {item.durationMinutes} min
                    </div>
                  </div>
                </div>
              );
            }

            // Free slot
            return (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-surface-950/70 border border-brand-900/40 border-dashed flex items-center justify-between gap-3 transition-colors hover:border-brand-500/50"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-brand-400 shrink-0" />
                  <div>
                    <span className="text-xs font-medium text-brand-300">
                      Ventana Libre de Trabajo
                    </span>
                    <span className="text-[10px] font-mono text-surface-400 ml-2">
                      ({item.durationMinutes} min útiles)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-mono text-surface-400">
                    {format(item.startTime, "HH:mm")} - {format(item.endTime, "HH:mm")}
                  </span>
                  {onScheduleSlot && (
                    <button
                      type="button"
                      onClick={() => onScheduleSlot((item as any).slotData)}
                      className="px-2.5 py-1 rounded-lg bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 border border-brand-500/40 text-[11px] font-medium transition-colors"
                    >
                      Agendar Tarea
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
