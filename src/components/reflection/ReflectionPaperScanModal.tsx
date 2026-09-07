"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Camera, 
  Upload, 
  X, 
  Sparkles, 
  CheckCircle2, 
  FileText, 
  Check, 
  AlertCircle,
  BookOpen
} from "lucide-react";
import { ReflectionPaperAnalysisResult } from "@/lib/types";

export function ReflectionPaperScanModal({
  isOpen,
  onClose,
  onApplyAnalysis,
}: {
  isOpen: boolean;
  onClose: () => void;
  onApplyAnalysis: (result: ReflectionPaperAnalysisResult, imageBase64: string) => void;
}) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ReflectionPaperAnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMimeType(file.type || "image/jpeg");
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setAnalysisResult(null);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    try {
      setIsAnalyzing(true);
      setErrorMessage(null);

      const res = await fetch("/api/reflection/analyze-paper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: selectedImage,
          mimeType,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setAnalysisResult(data.data);
      } else {
        setErrorMessage(data.error || "No se pudo procesar la imagen del cuaderno.");
      }
    } catch {
      setErrorMessage("Error de comunicacion con el servidor de vision multimodal.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApply = () => {
    if (analysisResult && selectedImage) {
      onApplyAnalysis(analysisResult, selectedImage);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ willChange: "transform" }}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          style={{ willChange: "transform" }}
          className="w-full max-w-3xl bg-surface-950 border border-white/10 rounded-3xl p-5 sm:p-7 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-surface-100">
                  Digitalizacion de Cuaderno o Papel Manuscrito
                </h3>
                <p className="text-[11px] text-surface-400">
                  Vision por computador para extraer y estructurar tus reflexiones analógicas
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-surface-400 hover:text-surface-100 hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/80 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {!selectedImage ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/15 hover:border-cyan-500/40 rounded-2xl p-8 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-3 bg-surface-900/30 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-surface-800 flex items-center justify-center text-surface-400 group-hover:text-cyan-400 transition-colors">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-medium text-surface-200 block">
                    Haz clic para seleccionar o arrastrar la foto de tu libreta
                  </span>
                  <span className="text-[10px] text-surface-500 block mt-1 font-mono">
                    Compatible con JPG, PNG, WEBP de notas manuscritas
                  </span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden border border-white/10 max-h-56 bg-surface-950 flex items-center justify-center">
                  <img
                    src={selectedImage}
                    alt="Foto de cuaderno manuscrito"
                    className="object-contain max-h-56 w-full"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImage(null);
                      setAnalysisResult(null);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-surface-900/80 text-surface-300 hover:text-white border border-white/10"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {!analysisResult && (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-medium transition-all shadow-md active:scale-95 disabled:opacity-50"
                    >
                      <Sparkles className={`w-4 h-4 ${isAnalyzing ? "animate-spin" : ""}`} />
                      <span>{isAnalyzing ? "Analizando letra manuscrita..." : "Procesar con Vision OCR"}</span>
                    </button>
                  </div>
                )}

                {analysisResult && (
                  <div className="space-y-3 pt-2">
                    <div className="p-3.5 rounded-xl bg-surface-900/80 border border-white/10 space-y-2">
                      <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">
                        Sintesis Ejecutiva del Cuaderno
                      </span>
                      <p className="text-xs text-surface-200 leading-relaxed">
                        {analysisResult.summary}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 space-y-1.5">
                        <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">
                          Victorias Detectadas ({analysisResult.wins.length})
                        </span>
                        <ul className="text-xs text-surface-300 space-y-1">
                          {analysisResult.wins.map((w, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-emerald-400 font-bold">&bull;</span>
                              <span>{w}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 space-y-1.5">
                        <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block">
                          Fricciones o Desafios ({analysisResult.frictionPoints.length})
                        </span>
                        <ul className="text-xs text-surface-300 space-y-1">
                          {analysisResult.frictionPoints.map((f, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-amber-400 font-bold">&bull;</span>
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {analysisResult.extractedTasks.length > 0 && (
                      <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-800/40 space-y-1.5">
                        <span className="text-[10px] font-mono text-blue-400 uppercase tracking-wider block">
                          Compromisos y Tareas para Manana ({analysisResult.extractedTasks.length})
                        </span>
                        <ul className="text-xs text-surface-300 space-y-1">
                          {analysisResult.extractedTasks.map((t, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-blue-400 font-bold">&bull;</span>
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-surface-400 hover:text-surface-200"
            >
              Cancelar
            </button>

            {analysisResult && (
              <button
                type="button"
                onClick={handleApply}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-all shadow-md active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Volcar a la Reflexion Diaria</span>
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
