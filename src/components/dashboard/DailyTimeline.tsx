"use client";

import { CalendarEventEntity, FreeTimeSlot, PlannedTaskAssignment } from "@/lib/types";
import { Clock, Calendar, ShieldAlert } from "lucide-react";
import { format } from "date-fns";

interface DailyTimelineProps {
  events: CalendarEventEntity[];
  freeSlots: FreeTimeSlot[];
  assignments?: PlannedTaskAssignment[];
}

export function DailyTimeline({ events, freeSlots, assignments = [] }: DailyTimelineProps) {
  // Combinar y ordenar cronológicamente todos los bloques del día
  const timelineItems = [
    ...events.map(e => ({
      type: "EVENT" as const,
      id: e.id,
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
      title: "Ventana Libre de Trabajo",
      description: null,
      location: null,
      startTime: new Date(s.start),
      endTime: new Date(s.end),
      durationMinutes: s.durationMinutes,
      isAllDay: false,
    })),
  ].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  return (
    <div className="bg-surface-900 border border-surface-800 rounded-lg p-5">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-surface-800">
        <div>
          <h3 className="text-xs font-semibold text-surface-100 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-accent-500" />
            Agenda y Disponibilidad de Hoy
          </h3>
          <p className="text-[11px] text-surface-400 mt-0.5">
            Eventos fijos de Google Calendar y huecos libres calculados
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-surface-400">
            <span className="w-2.5 h-2.5 rounded bg-blue-500/20 border border-blue-500/50"></span>
            Evento Fijo ({events.length})
          </span>
          <span className="flex items-center gap-1.5 text-surface-400">
            <span className="w-2.5 h-2.5 rounded bg-brand-500/20 border border-brand-500/50"></span>
            Hueco Libre ({freeSlots.length})
          </span>
        </div>
      </div>

      {timelineItems.length === 0 ? (
        <div className="py-8 text-center text-xs text-surface-400">
          No hay eventos sincronizados para la jornada de hoy.
        </div>
      ) : (
        <div className="space-y-3">
          {timelineItems.map((item) => {
            if (item.type === "EVENT") {
              return (
                <div
                  key={item.id}
                  className="p-3 rounded bg-blue-950/30 border border-blue-800/40 flex items-start justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-blue-200">
                        {item.title}
                      </span>
                      {item.isAllDay && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-900/60 text-blue-300 border border-blue-700">
                          Todo el dia
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-[11px] text-surface-400 mt-1 line-clamp-1">
                        {item.description}
                      </p>
                    )}
                    {item.location && (
                      <p className="text-[11px] text-surface-400 mt-0.5 font-mono">
                        Ubicacion: {item.location}
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0 text-xs font-mono text-blue-300">
                    <div>
                      {format(item.startTime, "HH:mm")} - {format(item.endTime, "HH:mm")}
                    </div>
                    <div className="text-[10px] text-surface-400 mt-0.5">
                      {item.durationMinutes} min
                    </div>
                  </div>
                </div>
              );
            }

            // Free slot
            const slotAssignments = assignments.filter(a => {
              const aStart = new Date(a.assignedStart).getTime();
              const aEnd = new Date(a.assignedEnd).getTime();
              return aStart >= item.startTime.getTime() && aEnd <= item.endTime.getTime();
            });

            return (
              <div
                key={item.id}
                className="p-3 rounded bg-surface-950/80 border border-brand-900/40 border-dashed space-y-2"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                    <span className="text-xs font-medium text-brand-400">
                      Hueco Disponible: {item.durationMinutes} minutos libres
                    </span>
                  </div>
                  <div className="text-xs font-mono text-surface-400">
                    {format(item.startTime, "HH:mm")} - {format(item.endTime, "HH:mm")}
                  </div>
                </div>

                {slotAssignments.length > 0 && (
                  <div className="pl-3.5 border-l-2 border-brand-500/40 space-y-1.5 mt-2">
                    <div className="text-[10px] font-semibold text-surface-400 uppercase tracking-wider">
                      Asignacion Propuesta por Agente:
                    </div>
                    {slotAssignments.map((assign) => (
                      <div
                        key={assign.taskId}
                        className="bg-surface-900 p-2 rounded border border-surface-800 text-xs flex items-center justify-between"
                      >
                        <div>
                          <span className="font-medium text-surface-100">{assign.taskTitle}</span>
                          <span className="text-[10px] text-surface-400 ml-2">
                            ({assign.estimatedDuration} min)
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-accent-400">
                          {format(new Date(assign.assignedStart), "HH:mm")} - {format(new Date(assign.assignedEnd), "HH:mm")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
