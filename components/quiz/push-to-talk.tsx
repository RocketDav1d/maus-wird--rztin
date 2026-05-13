"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Kbd } from "@/components/ui/kbd";

export type RecordingState =
  | "idle"
  | "requesting"
  | "recording"
  | "stopping"
  | "error";

export function PushToTalk({
  disabled,
  onAudioCaptured,
  className,
}: {
  disabled?: boolean;
  onAudioCaptured: (blob: Blob) => void;
  className?: string;
}) {
  const [state, setState] = useState<RecordingState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const stopOnReadyRef = useRef<boolean>(false);

  const stopMeter = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    analyserRef.current = null;
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    stopMeter();
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      try {
        recorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    chunksRef.current = [];
    setVolume(0);
  }, [stopMeter]);

  useEffect(() => () => cleanup(), [cleanup]);

  const start = useCallback(async () => {
    if (state !== "idle" || disabled) return;
    setError(null);
    setState("requesting");
    stopOnReadyRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      const mime = pickMimeType();
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        cleanup();
        setState("idle");
        if (blob.size > 0) onAudioCaptured(blob);
      };
      recorderRef.current = recorder;

      // Volume meter
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteTimeDomainData(data);
        let max = 0;
        for (let i = 0; i < data.length; i++) {
          const v = Math.abs(data[i] - 128) / 128;
          if (v > max) max = v;
        }
        setVolume(max);
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();

      recorder.start();
      setState("recording");

      // Race: user released before mic was ready
      if (stopOnReadyRef.current) {
        recorder.stop();
      }
    } catch (err) {
      console.error("getUserMedia failed", err);
      setError(
        err instanceof Error && err.name === "NotAllowedError"
          ? "Mikrofonzugriff verweigert."
          : "Mikrofon nicht verfügbar.",
      );
      setState("error");
      cleanup();
    }
  }, [state, disabled, onAudioCaptured, cleanup]);

  const stop = useCallback(() => {
    if (state === "requesting") {
      stopOnReadyRef.current = true;
      return;
    }
    if (state !== "recording" || !recorderRef.current) return;
    setState("stopping");
    try {
      recorderRef.current.stop();
    } catch {
      cleanup();
      setState("idle");
    }
  }, [state, cleanup]);

  // Keyboard support: hold Space to talk
  useEffect(() => {
    function down(e: KeyboardEvent) {
      if (e.code !== "Space" || e.repeat) return;
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return;
      e.preventDefault();
      start();
    }
    function up(e: KeyboardEvent) {
      if (e.code !== "Space") return;
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return;
      e.preventDefault();
      stop();
    }
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [start, stop]);

  const isActive = state === "recording" || state === "requesting";

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <button
        type="button"
        disabled={disabled}
        onMouseDown={start}
        onMouseUp={stop}
        onMouseLeave={stop}
        onTouchStart={(e) => {
          e.preventDefault();
          start();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          stop();
        }}
        aria-pressed={isActive}
        aria-label={isActive ? "Aufnahme läuft" : "Halten zum Sprechen"}
        className={cn(
          "relative size-24 rounded-full grid place-items-center transition-transform select-none",
          "bg-foreground text-background shadow-lg",
          isActive ? "scale-110" : "hover:scale-105 active:scale-95",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        <span
          className={cn(
            "absolute inset-0 rounded-full bg-red-500/40 pointer-events-none transition-opacity",
            isActive ? "opacity-100" : "opacity-0",
          )}
          style={{
            transform: `scale(${1 + volume * 0.7})`,
            transition: "transform 80ms linear",
          }}
        />
        {isActive ? (
          <Mic className="size-9 relative z-10" />
        ) : (
          <MicOff className="size-9 relative z-10" />
        )}
      </button>
      <div className="text-xs text-muted-foreground select-none inline-flex items-center gap-1.5">
        {state === "recording" ? (
          <span>Spreche, dann loslassen</span>
        ) : state === "requesting" ? (
          <span>Mikrofon vorbereiten …</span>
        ) : state === "stopping" ? (
          <span>Verarbeite …</span>
        ) : disabled ? (
          <span>Bitte warten</span>
        ) : (
          <>
            <span>Halten oder</span>
            <Kbd>Space</Kbd>
            <span>zum Sprechen</span>
          </>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function pickMimeType(): string | null {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4;codecs=mp4a.40.2",
    "audio/ogg;codecs=opus",
  ];
  for (const m of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)) {
      return m;
    }
  }
  return null;
}
