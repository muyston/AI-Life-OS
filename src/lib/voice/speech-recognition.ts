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

  constructor(options: SpeechRecognitionHookOptions = {}) {
    if (typeof window === "undefined") return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = options.continuous ?? false;
      this.recognition.interimResults = true;
      this.recognition.lang = options.lang || "es-ES";

      this.recognition.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const text = finalTranscript || interimTranscript;
        if (options.onResult) {
          options.onResult(text, Boolean(finalTranscript));
        }
      };

      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        if (options.onError) {
          options.onError(event.error || "Error en el reconocimiento de voz");
        }
      };

      this.recognition.onend = () => {
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

  public stop(): void {
    if (!this.recognition || !this.isListening) return;
    try {
      this.recognition.stop();
      this.isListening = false;
    } catch {
      // Ignorar error al detener
    }
  }

  public getActive(): boolean {
    return this.isListening;
  }
}
