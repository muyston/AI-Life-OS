"use client";

import { useState } from "react";
import { Camera } from "lucide-react";
import { VisionScheduleModal } from "./VisionScheduleModal";

interface VisionScheduleButtonProps {
  className?: string;
  variant?: "icon" | "pill" | "button";
  title?: string;
  onRoutineApplied?: () => void;
}

export function VisionScheduleButton({
  className = "",
  variant = "pill",
  title = "Crear rutina desde foto",
  onRoutineApplied,
}: VisionScheduleButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {variant === "pill" ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          title={title}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-900 hover:bg-surface-800 text-amber-400 border border-amber-500/30 hover:border-amber-500/60 text-xs font-medium transition-all shadow-xs active:scale-95 ${className}`}
        >
          <Camera className="w-3.5 h-3.5 text-amber-400" />
          <span>Foto / Horario</span>
        </button>
      ) : variant === "icon" ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          title={title}
          className={`p-2 rounded-xl bg-surface-950 hover:bg-surface-800 text-amber-400 border border-surface-800 hover:border-amber-500/40 transition-all shadow-xs active:scale-95 flex items-center justify-center ${className}`}
        >
          <Camera className="w-4 h-4 text-amber-400" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          title={title}
          className={`flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-amber-600/20 to-accent-600/20 hover:from-amber-600/30 hover:to-accent-600/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-medium transition-all shadow-sm active:scale-95 ${className}`}
        >
          <Camera className="w-3.5 h-3.5 text-amber-400" />
          <span>{title}</span>
        </button>
      )}

      <VisionScheduleModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onRoutineApplied={onRoutineApplied}
      />
    </>
  );
}
