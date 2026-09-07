"use client";

// Declaración de tipos para Web Speech API en navegadores
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface SpeechRecognitionHookOptions {
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
  lang?: string;
  continuous?: boolean;
}

export class BrowserSpeechRecognizer {
  private recognition: any = null;
  private isListening: boolean = false;
  private manualStopRequested: boolean = false;
  private accumulatedFinalText: string = "";

  constructor(options: SpeechRecognitionHookOptions = {}) {
    if (typeof window === "undefined") return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = options.lang || "es-ES";

      this.recognition.onresult = (event: any) => {
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result.isFinal) {
            const finalChunk = result[0].transcript.trim();
            if (finalChunk) {
              this.accumulatedFinalText = this.accumulatedFinalText
                ? `${this.accumulatedFinalText} ${finalChunk}`
                : finalChunk;
            }
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        const fullText = (this.accumulatedFinalText + (interimTranscript ? ` ${interimTranscript}` : "")).trim();
        if (options.onResult) {
          options.onResult(fullText, false);
        }
      };

      this.recognition.onerror = (event: any) => {
        // En navegadores, 'no-speech' es simplemente una pausa silenciosa, no un error fatal
        if (event.error === "no-speech") {
          return;
        }

        if (event.error === "aborted" && !this.manualStopRequested) {
          return;
        }

        this.isListening = false;
        if (options.onError) {
          options.onError(event.error || "Error en el reconocimiento de voz");
        }
      };

      this.recognition.onend = () => {
        // Si el navegador corta por silencio pero el usuario no ha pulsado stop, reiniciar
        if (!this.manualStopRequested && this.isListening) {
          try {
            this.recognition.start();
            return;
          } catch {
            // Si no se puede reiniciar inmediatamente, esperar un breve instante
            setTimeout(() => {
              if (!this.manualStopRequested && this.isListening) {
                try {
                  this.recognition.start();
                } catch {
                  this.isListening = false;
                  if (options.onEnd) options.onEnd();
                }
              }
            }, 200);
            return;
          }
        }

        this.isListening = false;
        if (options.onEnd) {
          options.onEnd();
        }
      };
    }
  }

  public isSupported(): boolean {
    if (typeof window === "undefined") return false;
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  public start(): boolean {
    if (!this.recognition) return false;
    this.manualStopRequested = false;
    this.accumulatedFinalText = "";

    if (this.isListening) return true;

    try {
      this.recognition.start();
      this.isListening = true;
      return true;
    } catch {
      this.isListening = false;
      return false;
    }
  }

  public stop(): string {
    this.manualStopRequested = true;
    this.isListening = false;

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignorar error al detener
      }
    }

    return this.accumulatedFinalText.trim();
  }

  public getActive(): boolean {
    return this.isListening;
  }
}

