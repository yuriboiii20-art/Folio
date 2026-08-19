import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Voice search for the AI Studio composer.
 * Wraps the Web Speech API (SpeechRecognition / webkitSpeechRecognition) and
 * reports interim results so the input fills in live while the student speaks.
 */

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

const getRecognitionCtor = (): (new () => SpeechRecognitionLike) | null => {
  if (typeof window === 'undefined') return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
};

export interface UseSpeechRecognitionOptions {
  lang?: string;
  /** Fired once the student stops talking, with the final transcript. */
  onFinalResult?: (transcript: string) => void;
  /** Fired on every partial result, for live input preview. */
  onInterimResult?: (transcript: string) => void;
}

export interface SpeechRecognitionState {
  supported: boolean;
  listening: boolean;
  transcript: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  toggle: () => void;
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}): SpeechRecognitionState {
  const { lang = 'en-US', onFinalResult, onInterimResult } = options;

  const [supported] = useState<boolean>(() => Boolean(getRecognitionCtor()));
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef('');

  // Keep the latest callbacks without re-creating the recogniser each render.
  const finalHandlerRef = useRef(onFinalResult);
  const interimHandlerRef = useRef(onInterimResult);
  useEffect(() => { finalHandlerRef.current = onFinalResult; }, [onFinalResult]);
  useEffect(() => { interimHandlerRef.current = onInterimResult; }, [onInterimResult]);

  useEffect(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      finalRef.current = '';
      setError(null);
      setListening(true);
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let finalText = finalRef.current;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript || '';
        if (result.isFinal) finalText += text;
        else interim += text;
      }

      finalRef.current = finalText;
      const combined = (finalText + interim).trim();
      setTranscript(combined);
      if (combined) interimHandlerRef.current?.(combined);
    };

    recognition.onerror = (event: any) => {
      const code = event?.error || 'unknown';
      const message =
        code === 'not-allowed' || code === 'service-not-allowed'
          ? 'Microphone access was blocked. Allow mic permission to use voice search.'
          : code === 'no-speech'
            ? 'No speech detected. Try again and speak clearly.'
            : code === 'audio-capture'
              ? 'No microphone found on this device.'
              : `Voice input error: ${code}`;
      setError(message);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
      const finalText = finalRef.current.trim();
      if (finalText) finalHandlerRef.current?.(finalText);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.onstart = null;
      try { recognition.abort(); } catch { /* already stopped */ }
      recognitionRef.current = null;
    };
  }, [lang]);

  const start = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || listening) return;
    setTranscript('');
    try {
      recognition.start();
    } catch {
      // start() throws if called while already running — safe to ignore.
    }
  }, [listening]);

  const stop = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    try { recognition.stop(); } catch { /* already stopped */ }
    setListening(false);
  }, []);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  return { supported, listening, transcript, error, start, stop, toggle };
}

export default useSpeechRecognition;
