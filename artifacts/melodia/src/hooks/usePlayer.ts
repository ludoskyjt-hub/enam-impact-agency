/**
 * usePlayer — Lecteur audio global pour MelodiaPerTe
 * Gère la lecture, pause, progression et file d'attente
 */
import { useState, useRef, useEffect, useCallback } from "react";
import type { Track } from "@/lib/api";

interface PlayerState {
  track:       Track | null;
  isPlaying:   boolean;
  progress:    number; // 0-100
  volume:      number; // 0-1
  duration:    number;
  queue:       Track[];
  queueIndex:  number;
}

const initialState: PlayerState = {
  track: null, isPlaying: false, progress: 0,
  volume: 0.8, duration: 30, queue: [], queueIndex: -1,
};

// Store global (singleton simple)
let globalState = { ...initialState };
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(fn => fn());

export function usePlayer() {
  const [, forceUpdate] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const update = () => forceUpdate(n => n + 1);
    listeners.add(update);
    return () => { listeners.delete(update); };
  }, []);

  // Initialiser l'audio une seule fois
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = globalState.volume;

      audioRef.current.addEventListener("timeupdate", () => {
        const a = audioRef.current!;
        if (a.duration > 0) {
          globalState = { ...globalState, progress: (a.currentTime / a.duration) * 100 };
          notify();
        }
      });

      audioRef.current.addEventListener("ended", () => {
        // Passer au suivant
        playNext();
      });

      audioRef.current.addEventListener("loadedmetadata", () => {
        globalState = { ...globalState, duration: audioRef.current!.duration };
        notify();
      });
    }
  }, []);

  const play = useCallback((track: Track, queue?: Track[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!track.previewUrl) return; // Pas de preview disponible

    const newQueue  = queue ?? [track];
    const queueIdx  = newQueue.findIndex(t => t.trackId === track.trackId);

    globalState = { ...globalState, track, queue: newQueue, queueIndex: queueIdx >= 0 ? queueIdx : 0 };
    notify();

    audio.src = track.previewUrl;
    audio.volume = globalState.volume;
    audio.play().catch(() => {});
    globalState = { ...globalState, isPlaying: true };
    notify();
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !globalState.track) return;
    if (globalState.isPlaying) {
      audio.pause();
      globalState = { ...globalState, isPlaying: false };
    } else {
      audio.play().catch(() => {});
      globalState = { ...globalState, isPlaying: true };
    }
    notify();
  }, []);

  const seek = useCallback((pct: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = (pct / 100) * audio.duration;
    globalState = { ...globalState, progress: pct };
    notify();
  }, []);

  const setVolume = useCallback((v: number) => {
    if (audioRef.current) audioRef.current.volume = v;
    globalState = { ...globalState, volume: v };
    notify();
  }, []);

  const playNext = useCallback(() => {
    const { queue, queueIndex } = globalState;
    if (queue.length === 0) return;
    const next = queue[(queueIndex + 1) % queue.length];
    if (next) play(next, queue);
  }, [play]);

  const playPrev = useCallback(() => {
    const { queue, queueIndex } = globalState;
    if (queue.length === 0) return;
    const prev = queue[(queueIndex - 1 + queue.length) % queue.length];
    if (prev) play(prev, queue);
  }, [play]);

  return {
    ...globalState,
    play,
    togglePlay,
    seek,
    setVolume,
    playNext,
    playPrev,
  };
}
