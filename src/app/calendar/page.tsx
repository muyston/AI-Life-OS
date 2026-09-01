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
  Settings,
  Link as LinkIcon,
  ExternalLink,
  Info,
  X,
  ShieldCheck,
  CalendarCheck,
  Share2
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarExportModal } from "@/components/calendar/CalendarExportModal";

interface CalendarConfigData {
  icalUrl: string;
  isConfigured: boolean;
  isPublicUrl: boolean;
  isPrivateUrl: boolean;
  eventsCount: number;
  lastSyncedAt: string | null;
  statusRecommendation: string;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEventEntity[]>([]);
  const [freeSlots, setFreeSlots] = useState<FreeTimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // Config modal state
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [configData, setConfigData] = useState<CalendarConfigData | null>(null);
  const [inputIcalUrl, setInputIcalUrl] = useState("");
  const [isSavingConfig, setIsSavingConfig] = useState(false);

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

  const loadCalendarConfig = async () => {
    try {
      const res = await fetch("/api/calendar/config");
      const data = await res.json();
      if (data.success) {
        setConfigData(data.data);
        setInputIcalUrl(data.data.icalUrl || "");
      }
    } catch (err) {
      console.error("Error al cargar configuracion de iCal:", err);
    }
  };

  useEffect(() => {
    loadCalendarData(selectedDate);
    loadCalendarConfig();
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
      if (data.success && data.data?.eventsSynced > 0) {
        setSyncFeedback({
          type: "success",
          message: data.message || `Sincronizacion completada: ${data.data.eventsSynced} eventos actualizados.`,
        });
      } else if (data.success) {
        setSyncFeedback({
          type: "info",
          message: data.message || "Sincronizacion ejecutada sin nuevos eventos detectados.",
        });
      } else {
        setSyncFeedback({
          type: "error",
          message: data.message || "Error al sincronizar con Google Calendar.",
        });
      }
      await loadCalendarData(selectedDate);
      await loadCalendarConfig();
    } catch (err) {
      setSyncFeedback({
        type: "error",
        message: "Error de conexion al sincronizar con el servidor.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputIcalUrl.trim()) return;

    try {
      setIsSavingConfig(true);
      setSyncFeedback(null);
      const res = await fetch("/api/calendar/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ icalUrl: inputIcalUrl.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        const syncRes = data.data?.syncResult;
        if (syncRes?.success) {
          setSyncFeedback({
            type: "success",
            message: `URL configurada correctamente. Sincronizados ${syncRes.eventsSynced} eventos.`,
          });
        } else {
          setSyncFeedback({
            type: "error",
            message: `URL guardada, pero la descarga devolvio: ${syncRes?.message || "Compruebe que sea la direccion secreta privada."}`,
          });
        }
        setIsConfigOpen(false);
        await loadCalendarData(selectedDate);
        await loadCalendarConfig();
      } else {
        setSyncFeedback({
          type: "error",
          message: data.error || "No se pudo guardar la configuracion.",
        });
      }
    } catch (err) {
      setSyncFeedback({
        type: "error",
        message: "Error critico al guardar la configuracion.",
      });
    } finally {
      setIsSavingConfig(false);
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
      setSyncFeedback({
        type: "success",
        message: data.message || "Eventos demo cargados en la base de datos.",
      });
      await loadCalendarData(selectedDate);
      await loadCalendarConfig();
    } catch (err) {
      setSyncFeedback({
        type: "error",
        message: "Error al cargar eventos demo.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const totalFreeMinutes = freeSlots.reduce((acc, s) => acc + s.durationMinutes, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-surface-800 flex-wrap gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-surface-400 block">
            Integracion de Solo Lectura y Deteccion de Huecos
          </span>
          <h1 className="text-xl font-bold tracking-tight text-surface-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-accent-500" />
            Agenda y Google Calendar
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-surface-900 hover:bg-surface-800 text-surface-200 border border-surface-700 rounded text-xs transition-colors"
            title="Exportar feed iCal para suscripción desde el móvil"
          >
            <Share2 className="w-3.5 h-3.5 text-brand-400" />
            Exportar Feed iCal
          </button>

          <button
            type="button"
            onClick={() => setIsConfigOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-surface-900 hover:bg-surface-800 text-surface-200 border border-surface-700 rounded text-xs transition-colors"
            title="Configurar enlace iCal de Google Calendar"
          >
            <Settings className="w-3.5 h-3.5 text-accent-400" />
            Configurar Enlace iCal
          </button>

          <button
            type="button"
            onClick={handleSeedDemo}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-2 bg-surface-900 hover:bg-surface-800 text-surface-300 border border-surface-700 rounded text-xs transition-colors disabled:opacity-50"
            title="Carga una jornada demo con reuniones para probar sin sincronizar"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Cargar Demo
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

      {/* Sync Status Banner */}
      {syncFeedback && (
        <div
          className={`p-4 rounded-lg border text-xs flex items-start gap-3 ${
            syncFeedback.type === "success"
              ? "bg-emerald-950/40 border-emerald-800/80 text-emerald-200"
              : syncFeedback.type === "error"
              ? "bg-rose-950/40 border-rose-800/80 text-rose-200"
              : "bg-surface-900 border-surface-700 text-surface-200"
          }`}
        >
          {syncFeedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : syncFeedback.type === "error" ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <Info className="w-4 h-4 text-accent-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="font-medium">{syncFeedback.message}</p>
            {syncFeedback.type === "error" && (
              <button
                type="button"
                onClick={() => setIsConfigOpen(true)}
                className="mt-2 inline-flex items-center gap-1 text-[11px] underline text-accent-400 hover:text-accent-300 font-mono"
              >
                Abrir guia de configuracion de iCal &rarr;
              </button>
            )}
          </div>
        </div>
      )}

      {/* Connection Status Helper if not configured or 404 alert */}
      {configData?.isPublicUrl && (
        <div className="p-4 rounded-lg bg-amber-950/30 border border-amber-800/70 text-amber-200 text-xs flex items-start justify-between gap-4">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Aviso de Privacidad de Google Calendar</span>
              <p className="text-surface-300 mt-1">
                La URL configurada actual es de tipo pública. Google Calendar rechaza (404) estas peticiones a menos que el calendario sea 100% público. Utiliza la <strong>Dirección secreta en formato iCal</strong> para sincronización privada e instantánea.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsConfigOpen(true)}
            className="shrink-0 px-3 py-1.5 bg-amber-600/30 hover:bg-amber-600/40 text-amber-200 border border-amber-600/60 rounded text-[11px] font-medium transition-colors"
          >
            Corregir Enlace iCal
          </button>
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
            <h3 className="text-xs font-semibold text-surface-100 uppercase tracking-wider pb-3 border-b border-surface-800 mb-4 flex items-center justify-between">
              <span>Eventos Sincronizados ({events.length})</span>
              <span className="text-[11px] font-mono text-surface-400">
                {format(new Date(`${selectedDate}T00:00:00`), "EEEE, d 'de' MMMM", { locale: es })}
              </span>
            </h3>

            {isLoading ? (
              <div className="py-12 text-center text-xs text-surface-400">
                Cargando eventos...
              </div>
            ) : events.length === 0 ? (
              <div className="py-12 text-center text-xs text-surface-400 space-y-3">
                <Calendar className="w-8 h-8 text-surface-600 mx-auto" />
                <p className="font-medium text-surface-200">No hay eventos registrados para este día.</p>
                <p className="text-[11px] text-surface-400 max-w-sm mx-auto">
                  Configura tu enlace iCal privado o pulsa &quot;Cargar Demo&quot; para comprobar la detección de huecos.
                </p>
                <div className="pt-2 flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsConfigOpen(true)}
                    className="px-3.5 py-1.5 bg-accent-600 hover:bg-accent-500 text-white rounded text-xs transition-colors"
                  >
                    Configurar Enlace iCal
                  </button>
                </div>
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

      {/* iCal Configuration Modal */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-900 border border-surface-700 rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-surface-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-accent-400" />
                <h2 className="text-base font-bold text-surface-100">
                  Configuración de Enlace iCal de Google Calendar
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsConfigOpen(false)}
                className="p-1 rounded hover:bg-surface-800 text-surface-400 hover:text-surface-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tutorial Step-by-Step */}
            <div className="bg-surface-950 border border-surface-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-accent-400 uppercase tracking-wider">
                <Info className="w-4 h-4" />
                <span>Cómo obtener tu enlace iCal privado en 4 pasos:</span>
              </div>
              <ol className="text-xs text-surface-300 space-y-2 list-decimal list-inside leading-relaxed">
                <li>
                  Abre <a href="https://calendar.google.com" target="_blank" rel="noreferrer" className="text-accent-400 underline inline-flex items-center gap-0.5">Google Calendar <ExternalLink className="w-2.5 h-2.5" /></a> en tu ordenador.
                </li>
                <li>
                  En el menú de la izquierda, busca <strong>&quot;Mis calendarios&quot;</strong>, pasa el ratón sobre tu calendario principal y pulsa los tres puntos verticales <strong>⋮</strong> &rarr; <strong>&quot;Configurar y compartir&quot;</strong>.
                </li>
                <li>
                  En la columna lateral izquierda, haz clic en <strong>&quot;Integrar el calendario&quot;</strong>.
                </li>
                <li>
                  Baja hasta encontrar el recuadro <strong>&quot;Dirección secreta en formato iCal&quot;</strong> y copia la URL completa.
                  <div className="mt-1 text-[11px] font-mono text-amber-300 bg-surface-900 p-2 rounded border border-surface-800">
                    Formato: https://calendar.google.com/calendar/ical/.../private-.../basic.ics
                  </div>
                </li>
              </ol>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-surface-200 mb-1.5">
                  URL Secreta en Formato iCal (.ics)
                </label>
                <div className="relative">
                  <input
                    type="url"
                    required
                    value={inputIcalUrl}
                    onChange={(e) => setInputIcalUrl(e.target.value)}
                    placeholder="https://calendar.google.com/calendar/ical/.../private-.../basic.ics"
                    className="w-full pl-9 pr-3 py-2 bg-surface-950 border border-surface-700 rounded text-xs text-surface-100 font-mono placeholder:text-surface-600 focus:outline-none focus:border-accent-500"
                  />
                  <LinkIcon className="w-4 h-4 text-surface-500 absolute left-3 top-2.5" />
                </div>
                <p className="text-[11px] text-surface-400 mt-1">
                  AI Life OS solo leerá los horarios de tus eventos para bloquear ventanas y calcular los huecos libres.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-800">
                <button
                  type="button"
                  onClick={() => setIsConfigOpen(false)}
                  className="px-3.5 py-2 rounded text-xs text-surface-300 hover:bg-surface-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingConfig || !inputIcalUrl.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-accent-600 hover:bg-accent-500 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSavingConfig ? "animate-spin" : ""}`} />
                  {isSavingConfig ? "Guardando y Validando..." : "Guardar y Sincronizar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Calendar Export Modal */}
      <CalendarExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
    </div>
  );
}
