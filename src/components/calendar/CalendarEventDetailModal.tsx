"use client";

import { CalendarEventEntity } from "@/lib/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  X, 
  Clock, 
  Calendar as CalendarIcon, 
  MapPin, 
  Video, 
  ExternalLink, 
  AlignLeft,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";

interface CalendarEventDetailModalProps {
  event: CalendarEventEntity | null;
  onClose: () => void;
}

export function CalendarEventDetailModal({ event, onClose }: CalendarEventDetailModalProps) {
  if (!event) return null;

  const start = new Date(event.startTime);
  const end = new Date(event.endTime);
  const isAllDay = event.isAllDay;

  const formattedDate = format(start, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
  const formattedTime = isAllDay
    ? "Todo el día"
    : `${format(start, "HH:mm")} - ${format(end, "HH:mm")}`;

  const durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  const durationText = isAllDay
    ? "Día completo"
    : durationMinutes >= 60
    ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60 > 0 ? `${durationMinutes % 60}m` : ""}`
    : `${durationMinutes} min`;

  // Detect video call url
  const meetMatch = (event.location || "").match(/https:\/\/(meet\.google\.com\/[^\s]+|zoom\.us\/[^\s]+)/) ||
                    (event.description || "").match(/https:\/\/(meet\.google\.com\/[^\s]+|zoom\.us\/[^\s]+)/);
  const meetUrl = meetMatch ? meetMatch[0] : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="glass-panel rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-white/10 relative overflow-hidden">
        {/* Top Google Calendar color strip */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-blue-950/80 border border-blue-800/80 text-blue-300 font-semibold flex items-center gap-1">
                <CalendarIcon className="w-3 h-3" />
                Google Calendar
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Confirmado
              </span>
            </div>
            <h2 className="text-lg font-bold text-surface-50 break-words mt-1">
              {event.summary}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/5 text-surface-400 hover:text-surface-200 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Details Grid */}
        <div className="space-y-3.5 text-xs">
          {/* Time & Date */}
          <div className="p-3.5 rounded-xl bg-surface-950/80 border border-white/[0.06] flex items-start gap-3">
            <Clock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-medium text-surface-100 capitalize">
                {formattedDate}
              </div>
              <div className="font-mono text-surface-400">
                {formattedTime} <span className="text-surface-600">|</span> Duración: {durationText}
              </div>
            </div>
          </div>

          {/* Location / Meeting */}
          {meetUrl ? (
            <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-800/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-300 shrink-0">
                  <Video className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <div className="font-semibold text-blue-200">Reunión Virtual</div>
                  <div className="text-[11px] font-mono text-blue-400 truncate">{meetUrl}</div>
                </div>
              </div>
              <a
                href={meetUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-all flex items-center gap-1 shrink-0"
              >
                <span>Unirse</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ) : event.location ? (
            <div className="p-3.5 rounded-xl bg-surface-950/80 border border-white/[0.06] flex items-start gap-3">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-surface-200">Ubicación</div>
                <div className="text-surface-400">{event.location}</div>
              </div>
            </div>
          ) : null}

          {/* Description */}
          {event.description && (
            <div className="p-3.5 rounded-xl bg-surface-950/80 border border-white/[0.06] space-y-1.5">
              <div className="text-[10px] font-mono text-surface-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlignLeft className="w-3.5 h-3.5" />
                <span>Descripción</span>
              </div>
              <p className="text-surface-200 whitespace-pre-wrap leading-relaxed">
                {event.description}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
          <span className="text-[10px] font-mono text-surface-500">
            ID: {event.externalId.slice(0, 18)}...
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-surface-900 hover:bg-surface-800 text-surface-200 border border-white/10 text-xs font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
