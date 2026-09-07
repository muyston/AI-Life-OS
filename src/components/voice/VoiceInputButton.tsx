"use client";

import { useState } from "react";
import { Mic } from "lucide-react";
import { VoiceCaptureModal } from "./VoiceCaptureModal";

interface VoiceInputButtonProps {
  className?: string;
  variant?: "icon" | "pill" | "compact";
  title?: string;
  onActionCompleted?: () => void;
}

export function VoiceInputButton({
  className = "",
  variant = "icon",
  title = "Dictar por voz",
  onActionCompleted,
}: VoiceInputButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {variant === "pill" ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          title={title}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-900 hover:bg-surface-800 text-accent-400 border border-surface-700/80 hover:border-accent-500/50 text-xs font-medium transition-all shadow-xs active:scale-95 ${className}`}
        >
          <Mic className="w-3.5 h-3.5 text-accent-400" />
          <span>Voz</span>
        </button>
      ) : variant === "compact" ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          title={title}
          className={`p-1.5 rounded-lg bg-surface-900 hover:bg-surface-800 text-accent-400 border border-surface-700/80 hover:border-accent-500/50 transition-all shadow-xs active:scale-95 ${className}`}
        >
          <Mic className="w-3.5 h-3.5" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          title={title}
          className={`p-2 rounded-xl bg-surface-950 hover:bg-surface-800 text-accent-400 border border-surface-800 hover:border-accent-500/40 transition-all shadow-xs active:scale-95 flex items-center justify-center ${className}`}
        >
          <Mic className="w-4 h-4 text-accent-400" />
        </button>
      )}

      <VoiceCaptureModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onActionCompleted={onActionCompleted}
      />
    </>
  );
}
