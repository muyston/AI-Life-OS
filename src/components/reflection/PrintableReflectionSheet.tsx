"use client";

import { Printer, Calendar, User, ShieldCheck, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function PrintableReflectionSheet({
  onClose,
}: {
  onClose: () => void;
}) {
  const handlePrint = () => {
    window.print();
  };

  const todayStr = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 print:p-0 print:bg-white print:static print:block">
      {/* Top Bar (No imprimir) */}
      <div className="w-full max-w-3xl flex items-center justify-between mb-3 print:hidden">
        <div className="flex items-center gap-2 text-surface-200 text-xs font-medium">
          <Printer className="w-4 h-4 text-cyan-400" />
          <span>Plantilla Imprimible de Reflexion Diaria Offline</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium shadow-md transition-all active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir en Papel (A4)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-surface-800 text-surface-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* A4 Sheet Container */}
      <div className="w-full max-w-3xl bg-white text-slate-900 rounded-2xl shadow-2xl p-8 sm:p-10 border border-slate-300 overflow-y-auto max-h-[85vh] print:max-h-none print:shadow-none print:border-none print:p-8 font-sans">
        {/* Header Institucional */}
        <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-950 uppercase">
              AI Life OS &bull; Protocolo de Reflexion Diaria
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Calibracion de Alto Rendimiento, Gratitud y Alineacion Estrategica
            </p>
          </div>
          <div className="text-right font-mono text-xs text-slate-700">
            <span className="block font-semibold capitalize">{todayStr}</span>
            <span className="text-[10px] text-slate-500">Formato Analógico de Libreta</span>
          </div>
        </div>

        {/* Evaluacion de los 5 Dominios */}
        <div className="my-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 border-b border-slate-200 pb-1">
            1. Calibracion de Energia y Claridad por Dominios (Escala 1 al 10)
          </h2>
          <div className="grid grid-cols-5 gap-3 text-center">
            {[
              { label: "Tech & Software", desc: "Codigo y Sistemas" },
              { label: "Business", desc: "Lanzing y Clientes" },
              { label: "Academico UPM", desc: "Ingenieria y Estudio" },
              { label: "Performance", desc: "Fisico y Energia" },
              { label: "Personal", desc: "Calma y Mentalidad" },
            ].map((d, i) => (
              <div key={i} className="border border-slate-300 rounded-xl p-3 bg-slate-50">
                <span className="text-[11px] font-bold block text-slate-900">{d.label}</span>
                <span className="text-[9px] text-slate-500 block mb-2">{d.desc}</span>
                <div className="w-10 h-8 mx-auto border-2 border-dashed border-slate-400 rounded-lg flex items-center justify-center font-mono text-xs text-slate-400">
                  /10
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Victorias y Logros */}
        <div className="my-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 border-b border-slate-200 pb-1">
            2. Victorias y Avances Principales del Dia (Wins)
          </h2>
          <div className="space-y-3 pt-1">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-500">{num}.</span>
                <div className="flex-1 border-b border-slate-300 h-6" />
              </div>
            ))}
          </div>
        </div>

        {/* Fricciones y Lecciones */}
        <div className="my-6 grid grid-cols-2 gap-6">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 border-b border-slate-200 pb-1">
              3. Fricciones o Bloqueos Encontrados
            </h2>
            <div className="space-y-3 pt-1">
              {[1, 2].map((num) => (
                <div key={num} className="border-b border-slate-300 h-6" />
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 border-b border-slate-200 pb-1">
              4. Aprendizaje Clave / Conclusiones
            </h2>
            <div className="space-y-3 pt-1">
              {[1, 2].map((num) => (
                <div key={num} className="border-b border-slate-300 h-6" />
              ))}
            </div>
          </div>
        </div>

        {/* Compromisos Manana */}
        <div className="my-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 border-b border-slate-200 pb-1">
            5. Los 3 Compromisos No Negociables para Manana
          </h2>
          <div className="space-y-3 pt-1">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border border-slate-400" />
                <div className="flex-1 border-b border-slate-300 h-6" />
              </div>
            ))}
          </div>
        </div>

        {/* Notas Libres y Vaciado Mental */}
        <div className="my-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 border-b border-slate-200 pb-1">
            6. Vaciado Mental y Observaciones Libres
          </h2>
          <div className="border border-slate-200 rounded-xl p-4 min-h-[90px] bg-slate-50 border-dashed space-y-3">
            <div className="border-b border-slate-200 h-4" />
            <div className="border-b border-slate-200 h-4" />
            <div className="border-b border-slate-200 h-4" />
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>AI Life OS &bull; Arquitectura de Precision</span>
          <span>Digitalizable con 1 foto desde la app en el boton Escanear Papel</span>
        </div>
      </div>
    </div>
  );
}
