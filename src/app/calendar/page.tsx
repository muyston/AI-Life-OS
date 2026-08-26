"use client";

import { useState, useEffect } from "react";
import { CalendarEventEntity, FreeTimeSlot } from "@/lib/types";
import { 
  Calendar, 
  RefreshCw, 
  Sparkles, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle,
  Link as LinkIcon
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEventEntity[]>([]);
  const [freeSlots, setFreeSlots] = useState<FreeTimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const loadCalendarData = async (dateStr: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/calendar/events?date=${dateStr}`);
      const data = await res.json();
      if (data.success) {
        setEvents(data.data.events);
        setFreeSlots(data.data.freeSlots);
      }
    } catch (err) {
      console.error("Error al cargar eventos del calendario:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCalendarData(selectedDate);
  }, [selectedDate]);

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      setSyncFeedback(null);
      const res = await fetch("/api/calendar/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setSyncFeedback(data.message || (data.success ? "Sincronizacion completada." : "Error de sincronizacion."));
      await loadCalendarData(selectedDate);
    } catch (err) {
      setSyncFeedback("Error de conexion al sincronizar.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSeedDemo = async () => {
    try {
      setIsSyncing(true);
      setSyncFeedback(null);
      const res = await fetch("/api/calendar/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed_demo" }),
      });
      const data = await res.json();
      setSyncFeedback(data.message || "Eventos demo cargados.");
      await loadCalendarData(selectedDate);
    } catch (err) {
      setSyncFeedback("Error al cargar eventos demo.");
    } finally {
      setIsSyncing(false);
    }
  };

  const totalFreeMinutes = freeSlots.reduce((acc, s) => acc + s.durationMinutes, 0);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-surface-800 flex-wrap gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-surface-400 block">
            Integracion de Solo Lectura
          </span>
          <h1 className="text-xl font-bold tracking-tight text-surface-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-accent-500" />
            Agenda y Google Calendar
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSeedDemo}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-2 bg-surface-900 hover:bg-surface-800 text-surface-300 border border-surface-700 rounded text-xs transition-colors disabled:opacity-50"
            title="Carga una jornada demo con reuniones para probar sin configurar GCP"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Cargar Agenda Demo
          </button>

          <button
            type="button"
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-accent-600 hover:bg-accent-500 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Sincronizando..." : "Sincronizar con Google"}
          </button>
        </div>
      </div>

      {syncFeedback && (
        <div className="p-3 rounded bg-surface-900 border border-surface-700 text-xs text-surface-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* Date Selector & Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-900 border border-surface-800 rounded-lg p-4 flex items-center justify-between">
          <div>
            <label className="block text-xs text-surface-400 font-medium">Fecha de Consulta</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="mt-1 px-2.5 py-1.5 bg-surface-950 border border-surface-800 rounded text-xs text-surface-100 focus:outline-none focus:border-accent-500"
            />
          </div>
          <Calendar className="w-6 h-6 text-surface-600" />
        </div>

        <div className="bg-surface-900 border border-surface-800 rounded-lg p-4">
          <div className="text-xs text-surface-400 font-medium">Eventos Fijos</div>
          <div className="text-2xl font-bold text-surface-100 mt-1 font-mono">
            {events.length}
          </div>
          <div className="text-[11px] text-surface-400 mt-0.5">
            Bloquean ventanas de trabajo
          </div>
        </div>

        <div className="bg-surface-900 border border-surface-800 rounded-lg p-4">
          <div className="text-xs text-surface-400 font-medium">Tiempo Libre Disponible</div>
          <div className="text-2xl font-bold text-brand-400 mt-1 font-mono">
            {totalFreeMinutes} min
          </div>
          <div className="text-[11px] text-surface-400 mt-0.5">
            En {freeSlots.length} huecos detectados
          </div>
        </div>
      </div>

      {/* Grid: Events List vs Free Slots */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Events column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-surface-900 border border-surface-800 rounded-lg p-5">
            <h3 className="text-xs font-semibold text-surface-100 uppercase tracking-wider pb-3 border-b border-surface-800 mb-4">
              Eventos Sincronizados ({events.length})
            </h3>

            {isLoading ? (
              <div className="py-12 text-center text-xs text-surface-400">
                Cargando eventos...
              </div>
            ) : events.length === 0 ? (
              <div className="py-12 text-center text-xs text-surface-400 space-y-2">
                <Calendar className="w-6 h-6 text-surface-600 mx-auto" />
                <p>No hay eventos registrados para este día.</p>
                <p className="text-[11px] text-surface-400">
                  Configura `GOOGLE_CALENDAR_ICAL_URL` en `.env` o pulsa &quot;Cargar Agenda Demo&quot;.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3.5 rounded bg-surface-950 border border-surface-800 flex items-start justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-surface-100">
                          {ev.summary}
                        </span>
                        {ev.isAllDay && (
                          <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-1.5 py-0.2 rounded font-mono">
                            Día completo
                          </span>
                        )}
                      </div>
                      {ev.description && (
                        <p className="text-[11px] text-surface-400 mt-1 line-clamp-2">
                          {ev.description}
                        </p>
                      )}
                      {ev.location && (
                        <div className="flex items-center gap-1 text-[11px] text-surface-400 mt-1">
                          <MapPin className="w-3 h-3 text-surface-400" />
                          <span>{ev.location}</span>
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono text-blue-300">
                        {format(new Date(ev.startTime), "HH:mm")} - {format(new Date(ev.endTime), "HH:mm")}
                      </div>
                      <div className="text-[10px] text-surface-400 font-mono mt-0.5">
                        {Math.round((new Date(ev.endTime).getTime() - new Date(ev.startTime).getTime()) / 60000)} min
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Free slots column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-surface-900 border border-surface-800 rounded-lg p-5">
            <h3 className="text-xs font-semibold text-surface-100 uppercase tracking-wider pb-3 border-b border-surface-800 mb-4 flex items-center justify-between">
              <span>Huecos Libres Calculados ({freeSlots.length})</span>
              <span className="text-brand-400 font-mono text-[11px]">
                {totalFreeMinutes} min útiles
              </span>
            </h3>

            {freeSlots.length === 0 ? (
              <div className="py-8 text-center text-xs text-surface-400">
                No hay huecos libres identificados en la ventana laboral.
              </div>
            ) : (
              <div className="space-y-2.5">
                {freeSlots.map((slot, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded bg-surface-950 border border-brand-900/50 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-brand-500" />
                      <span className="text-xs font-medium text-surface-200">
                        Ventana {idx + 1}
                      </span>
                      <span className="text-[10px] font-mono bg-brand-950 text-brand-400 px-1.5 py-0.5 rounded border border-brand-800">
                        {slot.durationMinutes} min
                      </span>
                    </div>

                    <div className="text-xs font-mono text-surface-400">
                      {format(new Date(slot.start), "HH:mm")} - {format(new Date(slot.end), "HH:mm")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
