import { useCallback, useEffect, useRef, useState } from "react";

// Le décompte se base sur un timestamp de fin (Date.now() + durée), pas sur
// un simple compteur décrémenté à chaque tick : ça évite que le minuteur
// dérive ou reste bloqué si l'app passe en arrière-plan pendant le repos.
export function useRestTimer() {
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const endAtRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    if (endAtRef.current === null) return;
    const remaining = Math.max(0, Math.round((endAtRef.current - Date.now()) / 1000));
    setSecondsLeft(remaining);
    if (remaining <= 0) {
      setRunning(false);
      endAtRef.current = null;
      clearTick();
    }
  }, [clearTick]);

  useEffect(() => clearTick, [clearTick]);

  function start(seconds: number) {
    setTotalSeconds(seconds);
    setSecondsLeft(seconds);
    endAtRef.current = Date.now() + seconds * 1000;
    setRunning(true);
    clearTick();
    intervalRef.current = setInterval(tick, 250);
  }

  function pause() {
    if (!running) return;
    setRunning(false);
    endAtRef.current = null;
    clearTick();
  }

  function resume() {
    if (running || secondsLeft <= 0) return;
    endAtRef.current = Date.now() + secondsLeft * 1000;
    setRunning(true);
    intervalRef.current = setInterval(tick, 250);
  }

  function addSeconds(delta: number) {
    setSecondsLeft((s) => Math.max(0, s + delta));
    setTotalSeconds((t) => Math.max(1, t + delta));
    if (endAtRef.current !== null) {
      endAtRef.current += delta * 1000;
    }
  }

  function dismiss() {
    setRunning(false);
    endAtRef.current = null;
    clearTick();
    setSecondsLeft(0);
    setTotalSeconds(0);
  }

  return {
    secondsLeft,
    totalSeconds,
    running,
    active: totalSeconds > 0,
    start,
    pause,
    resume,
    addSeconds,
    dismiss,
  };
}
