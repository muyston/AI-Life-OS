"use client";

import { useState, useEffect } from "react";
import { 
  Calendar, 
  Copy, 
  Check, 
  X, 
  ExternalLink, 
  Smartphone, 
  Share2, 
  Download,
  Info,
  ShieldCheck
} from "lucide-react";

interface CalendarExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CalendarExportModal({ isOpen, onClose }: CalendarExportModalProps) {
  const [copied, setCopied] = useState(false);
  const [exportUrl, setExportUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setExportUrl(`${window.location.origin}/api/calendar/export`);
    }
  }, []);

  const handleCopy = () => {
    if (!exportUrl) return;
    navigator.clipboard.writeText(exportUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-100">
      <div className="bg-surface-900 border border-surface-700 rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-surface-800">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-brand-400" />
            <h2 className="text-base font-bold text-surface-100">
              Suscripción Bidireccional de Tareas (Feed iCal)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-surface-400 hover:text-surface-200 hover:bg-surface-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-surface-300 leading-relaxed">
          Este feed iCalendar exporta automáticamente todas tus tareas programadas y bloques de foco de AI Life OS para que aparezcan en la app de calendario de tu teléfono móvil o tablet.
        </p>

        {/* URL Box */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-surface-200">
            URL de Suscripción iCal
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={exportUrl}
              className="w-full px-3 py-2 bg-surface-950 border border-surface-700 rounded text-xs text-surface-100 font-mono focus:outline-none select-all"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Copiado
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copiar
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tutorial */}
        <div className="bg-surface-950 border border-surface-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-accent-400 uppercase tracking-wider">
            <Smartphone className="w-4 h-4" />
            <span>Cómo suscribirte en tu dispositivo:</span>
          </div>

          <div className="space-y-2.5 text-xs text-surface-300 leading-relaxed">
            <div className="p-2.5 rounded bg-surface-900 border border-surface-800">
              <span className="font-semibold text-surface-100 block mb-0.5">En Google Calendar (Web / Android):</span>
              <p className="text-[11px] text-surface-400">
                En el panel lateral izquierdo, pulsa el signo <strong>+</strong> junto a &quot;Otros calendarios&quot; &rarr; <strong>&quot;Desde URL&quot;</strong>, pega la URL anterior y pulsa &quot;Añadir calendario&quot;.
              </p>
            </div>

            <div className="p-2.5 rounded bg-surface-900 border border-surface-800">
              <span className="font-semibold text-surface-100 block mb-0.5">En iPhone / iPad / Mac (Apple Calendar):</span>
              <p className="text-[11px] text-surface-400">
                Abre Ajustes &rarr; Calendario &rarr; Cuentas &rarr; <strong>&quot;Añadir cuenta&quot;</strong> &rarr; <strong>&quot;Otro&quot;</strong> &rarr; <strong>&quot;Añadir calendario suscrito&quot;</strong> y pega la URL.
              </p>
            </div>
          </div>
        </div>

        {/* Direct Download Button */}
        <div className="flex items-center justify-between pt-3 border-t border-surface-800">
          <a
            href="/api/calendar/export"
            download="lifeos-tasks.ics"
            className="inline-flex items-center gap-1.5 text-xs text-accent-400 hover:text-accent-300 font-medium"
          >
            <Download className="w-3.5 h-3.5" />
            Descargar archivo .ics directo
          </a>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-surface-800 hover:bg-surface-700 text-surface-200 rounded text-xs font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
