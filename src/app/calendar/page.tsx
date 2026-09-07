"use client";

import { useState, useEffect, useCallback } from "react";
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
  Share2,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Columns,
  CalendarDays,
  Plus
} from "lucide-react";
import { 
  format, 
  addMonths, 
  subMonths, 
  addWeeks, 
  subWeeks, 
  addDays, 
  subDays 
} from "date-fns";
import { es } from "date-fns/locale";
import { CalendarEventEntity, FreeTimeSlot, TaskEntity, CalendarViewType, TaskStatus } from "@/lib/types";
import { CalendarMonthView } from "@/components/calendar/CalendarMonthView";
import { CalendarWeekView } from "@/components/calendar/CalendarWeekView";
import { CalendarDayView } from "@/components/calendar/CalendarDayView";
import { CalendarTodoPanel } from "@/components/calendar/CalendarTodoPanel";
import { CalendarExportModal } from "@/components/calendar/CalendarExportModal";
import { VoiceInputButton } from "@/components/voice/VoiceInputButton";
import { VisionScheduleButton } from "@/components/vision/VisionScheduleButton";

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
  const [tasks, setTasks] = useState<TaskEntity[]>([]);
  const [freeSlots, setFreeSlots] = useState<FreeTimeSlot[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewType>("month");
  const [mobileTab, setMobileTab] = useState<"calendar" | "todo">("calendar");

  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // Config modal state
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [configData, setConfigData] = useState<CalendarConfigData | null>(null);
  const [inputIcalUrl, setInputIcalUrl] = useState("");
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");

  const loadCalendarData = useCallback(async (dateStr: string) => {
    try {
      setIsLoading(true);
      const [calRes, tasksRes] = await Promise.all([
        fetch(`/api/calendar/events?date=${dateStr}`, { cache: "no-store" }),
        fetch("/api/tasks?status=ALL", { cache: "no-store" }),
      ]);

      const calData = await calRes.json();
      const tasksData = await tasksRes.json();

      if (calData.success) {
        setEvents(calData.data.events || []);
        setFreeSlots(calData.data.freeSlots || []);
      }
      if (tasksData.success) {
        setTasks(tasksData.data || []);
      }
    } catch (err) {
      console.error("Error al cargar datos del calendario:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    loadCalendarData(selectedDateStr);
    loadCalendarConfig();
  }, [selectedDateStr, loadCalendarData]);

  // Navegación de fechas
  const handlePrev = () => {
    if (viewMode === "month") {
      setCurrentDate((prev) => subMonths(prev, 1));
    } else if (viewMode === "week") {
      setCurrentDate((prev) => subWeeks(prev, 1));
      setSelectedDate((prev) => subWeeks(prev, 1));
    } else {
      setSelectedDate((prev) => subDays(prev, 1));
      setCurrentDate((prev) => subDays(prev, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      setCurrentDate((prev) => addMonths(prev, 1));
    } else if (viewMode === "week") {
      setCurrentDate((prev) => addWeeks(prev, 1));
      setSelectedDate((prev) => addWeeks(prev, 1));
    } else {
      setSelectedDate((prev) => addDays(prev, 1));
      setCurrentDate((prev) => addDays(prev, 1));
    }
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

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
          message: data.message || `Sincronización completada: ${data.data.eventsSynced} eventos actualizados.`,
        });
      } else if (data.success) {
        setSyncFeedback({
          type: "info",
          message: data.message || "Sincronización ejecutada sin nuevos eventos detectados.",
        });
      } else {
        setSyncFeedback({
          type: "error",
          message: data.message || "Error al sincronizar con Google Calendar.",
        });
      }
      await loadCalendarData(selectedDateStr);
      await loadCalendarConfig();
    } catch {
      setSyncFeedback({
        type: "error",
        message: "Error de conexión al sincronizar con el servidor.",
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
        setSyncFeedback({
          type: "success",
          message: "Enlace iCal guardado y sincronizado con éxito.",
        });
        setIsConfigOpen(false);
        await loadCalendarData(selectedDateStr);
        await loadCalendarConfig();
      } else {
        setSyncFeedback({
          type: "error",
          message: data.error || "No se pudo guardar la configuración.",
        });
      }
    } catch {
      setSyncFeedback({
        type: "error",
        message: "Error crítico al guardar la configuración.",
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
      await loadCalendarData(selectedDateStr);
    } catch {
      setSyncFeedback({
        type: "error",
        message: "Error al cargar eventos demo.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // To-Do list actions
  const handleTaskStatusToggle = async (taskId: string, currentStatus: string) => {
    const nextStatus: TaskStatus = currentStatus === "COMPLETED" ? "PENDING" : "COMPLETED";
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t)));

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch {
      await loadCalendarData(selectedDateStr);
    }
  };

  const handleAddTask = async (taskData: Partial<TaskEntity>) => {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskData),
    });
    if (res.ok) {
      await loadCalendarData(selectedDateStr);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("¿Deseas eliminar esta tarea?")) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
      }
    } catch (err) {
      console.error("Error al eliminar tarea:", err);
    }
  };

  const formattedMonthHeader = format(
    viewMode === "day" ? selectedDate : currentDate,
    viewMode === "day" ? "EEEE, d 'de' MMMM 'de' yyyy" : "MMMM 'de' yyyy",
    { locale: es }
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto w-full">
      {/* Top Google Calendar Navigation Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] flex-wrap gap-4">
        {/* Date Navigation */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-500/20 border border-accent-500/30 flex items-center justify-center text-accent-400">
            <Calendar className="w-5 h-5" />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToday}
              className="px-3 py-1.5 rounded-xl bg-surface-900 hover:bg-surface-800 text-surface-200 border border-white/10 text-xs font-medium transition-all shadow-xs active:scale-95"
            >
              Hoy
            </button>

            <div className="flex items-center bg-surface-950 border border-white/10 rounded-xl p-0.5">
              <button
                type="button"
                onClick={handlePrev}
                className="p-1.5 rounded-lg text-surface-400 hover:text-surface-100 hover:bg-white/5 transition-colors"
                title="Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="p-1.5 rounded-lg text-surface-400 hover:text-surface-100 hover:bg-white/5 transition-colors"
                title="Siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <h1 className="text-base sm:text-lg font-bold tracking-tight text-surface-50 capitalize ml-1">
              {formattedMonthHeader}
            </h1>
          </div>
        </div>

        {/* View Switcher & Action Tools */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Segmented View Switcher */}
          <div className="flex items-center bg-surface-950/90 border border-white/10 rounded-xl p-1 shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode("month")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === "month"
                  ? "bg-surface-800 text-surface-50 shadow-xs border border-white/10"
                  : "text-surface-400 hover:text-surface-200"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Mes</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("week")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === "week"
                  ? "bg-surface-800 text-surface-50 shadow-xs border border-white/10"
                  : "text-surface-400 hover:text-surface-200"
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Semana</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("day")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === "day"
                  ? "bg-surface-800 text-surface-50 shadow-xs border border-white/10"
                  : "text-surface-400 hover:text-surface-200"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Día</span>
            </button>
          </div>

          <VisionScheduleButton
            variant="pill"
            onRoutineApplied={() => loadCalendarData(selectedDateStr)}
            title="Importar horario universitario o rutina desde foto"
          />

          <VoiceInputButton
            variant="pill"
            onActionCompleted={() => loadCalendarData(selectedDateStr)}
            title="Dictar evento o tarea"
          />

          <button
            type="button"
            onClick={() => setIsConfigOpen(true)}
            className="p-2 rounded-xl bg-surface-900 hover:bg-surface-800 text-surface-300 border border-white/10 transition-colors"
            title="Configurar enlace iCal de Google Calendar"
          >
            <Settings className="w-4 h-4 text-accent-400" />
          </button>

          <button
            type="button"
            onClick={() => setIsExportOpen(true)}
            className="p-2 rounded-xl bg-surface-900 hover:bg-surface-800 text-surface-300 border border-white/10 transition-colors"
            title="Exportar feed iCal para suscripción móvil"
          >
            <Share2 className="w-4 h-4 text-brand-400" />
          </button>

          <button
            type="button"
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-accent-600 hover:bg-accent-500 text-white rounded-xl text-xs font-medium transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{isSyncing ? "Sincronizando..." : "Sincronizar Google"}</span>
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncFeedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            syncFeedback.type === "success"
              ? "bg-emerald-950/40 border-emerald-800/80 text-emerald-200"
              : syncFeedback.type === "error"
              ? "bg-rose-950/40 border-rose-800/80 text-rose-200"
              : "bg-surface-900/80 border-surface-700 text-surface-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {syncFeedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : syncFeedback.type === "error" ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-accent-400 shrink-0" />
            )}
            <span>{syncFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setSyncFeedback(null)}
            className="text-[11px] text-surface-400 hover:text-surface-200 font-mono"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Mobile Tab Switcher (Calendar vs To-Do List) */}
      <div className="flex md:hidden items-center gap-2 p-1 bg-surface-950 rounded-xl border border-white/10 text-xs">
        <button
          type="button"
          onClick={() => setMobileTab("calendar")}
          className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
            mobileTab === "calendar" ? "bg-surface-800 text-surface-100 shadow-xs" : "text-surface-400"
          }`}
        >
          Calendario
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("todo")}
          className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
            mobileTab === "todo" ? "bg-surface-800 text-surface-100 shadow-xs" : "text-surface-400"
          }`}
        >
          Organizador To-Do ({tasks.filter(t => t.status === "PENDING").length})
        </button>
      </div>

      {/* Main Split Grid: Calendar View + To-Do List Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left / Center Calendar View */}
        <div className={`lg:col-span-8 space-y-4 ${mobileTab === "todo" ? "hidden md:block" : "block"}`}>
          {viewMode === "month" && (
            <CalendarMonthView
              currentDate={currentDate}
              selectedDate={selectedDate}
              onSelectDate={(d) => setSelectedDate(d)}
              onDoubleClickDate={(d) => {
                setSelectedDate(d);
                setViewMode("day");
              }}
              events={events}
              tasks={tasks}
            />
          )}

          {viewMode === "week" && (
            <CalendarWeekView
              currentDate={currentDate}
              selectedDate={selectedDate}
              onSelectDate={(d) => setSelectedDate(d)}
              events={events}
              freeSlots={freeSlots}
            />
          )}

          {viewMode === "day" && (
            <CalendarDayView
              selectedDate={selectedDate}
              events={events}
              freeSlots={freeSlots}
              onScheduleSlot={(slot) => {
                handleAddTask({
                  title: "Bloque de trabajo enfocado",
                  scheduledStart: new Date(slot.start).toISOString(),
                  scheduledEnd: new Date(slot.end).toISOString(),
                  estimatedDuration: slot.durationMinutes,
                  priority: "HIGH",
                });
              }}
            />
          )}
        </div>

        {/* Right Side: Quick To-Do List Panel */}
        <div className={`lg:col-span-4 ${mobileTab === "calendar" ? "hidden md:block" : "block"}`}>
          <CalendarTodoPanel
            tasks={tasks}
            onToggleStatus={handleTaskStatusToggle}
            onAddTask={handleAddTask}
            onDeleteTask={handleDeleteTask}
            freeSlots={freeSlots}
            onRefresh={() => loadCalendarData(selectedDateStr)}
          />
        </div>
      </div>

      {/* iCal Configuration Modal */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 border border-white/10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-accent-400" />
                <h2 className="text-base font-bold text-surface-100">
                  Configuración de Enlace iCal de Google Calendar
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsConfigOpen(false)}
                className="p-1 rounded-full hover:bg-white/5 text-surface-400 hover:text-surface-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tutorial */}
            <div className="glass-card rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-accent-400 uppercase tracking-wider">
                <Info className="w-4 h-4" />
                <span>Cómo obtener tu enlace iCal privado en 4 pasos:</span>
              </div>
              <ol className="text-xs text-surface-300 space-y-2 list-decimal list-inside leading-relaxed">
                <li>
                  Abre <a href="https://calendar.google.com" target="_blank" rel="noreferrer" className="text-accent-400 underline inline-flex items-center gap-0.5">Google Calendar <ExternalLink className="w-2.5 h-2.5" /></a> en tu ordenador.
                </li>
                <li>
                  En el menú de la izquierda, pasa el ratón sobre tu calendario y pulsa <strong>⋮ &rarr; Configurar y compartir</strong>.
                </li>
                <li>
                  En la barra lateral izquierda, pulsa en <strong>&quot;Integrar el calendario&quot;</strong>.
                </li>
                <li>
                  Copia la URL del recuadro <strong>&quot;Dirección secreta en formato iCal&quot;</strong>.
                  <div className="mt-1 text-[11px] font-mono text-amber-300 bg-surface-950 p-2 rounded-lg border border-white/[0.06]">
                    https://calendar.google.com/calendar/ical/.../private-.../basic.ics
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
                    className="w-full pl-9 pr-3 py-2 bg-surface-950 border border-white/10 rounded-xl text-xs text-surface-100 font-mono placeholder:text-surface-600 focus:outline-none focus:border-accent-500"
                  />
                  <LinkIcon className="w-4 h-4 text-surface-500 absolute left-3 top-2.5" />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={handleSeedDemo}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 px-3 py-2 bg-surface-950 hover:bg-surface-800 text-surface-300 border border-white/10 rounded-xl text-xs transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Cargar Datos Demo</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsConfigOpen(false)}
                    className="px-3.5 py-2 rounded-xl text-xs text-surface-300 hover:bg-white/5 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingConfig || !inputIcalUrl.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-accent-600 hover:bg-accent-500 text-white rounded-xl text-xs font-medium transition-all shadow-md disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSavingConfig ? "animate-spin" : ""}`} />
                    <span>{isSavingConfig ? "Guardando..." : "Guardar y Sincronizar"}</span>
                  </button>
                </div>
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
