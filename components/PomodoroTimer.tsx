"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { useLocalStorage } from "@/lib/useLocalStorage";
import {
  EMPTY_STATS,
  currentStreak,
  recordCompletedFocus,
  todayCount,
  totalCount,
  type FocusStats,
} from "@/lib/stats";
import { getNoiseEngine } from "@/lib/noiseEngine";

type Mode = "focus" | "short" | "long";

const MODE_SECONDS: Record<Mode, number> = {
  focus: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
};

const MODE_LABEL: Record<Mode, string> = {
  focus: "Focus",
  short: "Short break",
  long: "Long break",
};

const RADIUS = 110;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function PomodoroTimer() {
  const [mode, setMode] = useState<Mode>("focus");
  const [secondsLeft, setSecondsLeft] = useState(MODE_SECONDS.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useLocalStorage<FocusStats>(
    "amber-hours-stats",
    EMPTY_STATS
  );

  const deadlineRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const switchMode = useCallback((next: Mode) => {
    setMode(next);
    setIsRunning(false);
    setSecondsLeft(MODE_SECONDS[next]);
    deadlineRef.current = null;
  }, []);

  const handleComplete = useCallback(() => {
    setIsRunning(false);
    getNoiseEngine().playChime();
    if (mode === "focus") {
      setStats((prev) => recordCompletedFocus(prev));
      const justCompleted = todayCount(
        recordCompletedFocus(stats)
      );
      const next: Mode = justCompleted % 4 === 0 ? "long" : "short";
      setMode(next);
      setSecondsLeft(MODE_SECONDS[next]);
    } else {
      setMode("focus");
      setSecondsLeft(MODE_SECONDS.focus);
    }
    deadlineRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, stats, setStats]);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    if (deadlineRef.current === null) {
      deadlineRef.current = Date.now() + secondsLeft * 1000;
    }

    intervalRef.current = setInterval(() => {
      const remainingMs = (deadlineRef.current ?? Date.now()) - Date.now();
      const remaining = Math.max(0, Math.round(remainingMs / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        handleComplete();
      }
    }, 250);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  const toggleRunning = async () => {
    await getNoiseEngine().resume();
    if (!isRunning) {
      deadlineRef.current = Date.now() + secondsLeft * 1000;
    } else {
      deadlineRef.current = null;
    }
    setIsRunning((prev) => !prev);
  };

  const reset = () => {
    setIsRunning(false);
    deadlineRef.current = null;
    setSecondsLeft(MODE_SECONDS[mode]);
  };

  const total = MODE_SECONDS[mode];
  const progress = 1 - secondsLeft / total;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  const minutes = Math.floor(secondsLeft / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (secondsLeft % 60).toString().padStart(2, "0");

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Mode selector — styled like deck buttons, not pill tabs */}
      <div className="flex gap-1 rounded-full border border-paper/10 bg-base-900/60 p-1 font-mono text-xs tracking-wide">
        {(Object.keys(MODE_SECONDS) as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`rounded-full px-4 py-2 transition-colors duration-300 ${
              mode === m
                ? "bg-accent text-base-950"
                : "text-paper-muted hover:text-paper"
            }`}
          >
            {MODE_LABEL[m]}
          </button>
        ))}
      </div>

      {/* Dial */}
      <div className="relative flex items-center justify-center">
        <svg width={280} height={280} className="-rotate-90">
          <circle
            cx={140}
            cy={140}
            r={RADIUS}
            fill="none"
            stroke="rgba(237,227,211,0.08)"
            strokeWidth={10}
          />
          <circle
            cx={140}
            cy={140}
            r={RADIUS}
            fill="none"
            stroke="#C97C3D"
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            className="transition-[stroke-dashoffset] duration-300 ease-linear"
            style={{ filter: "drop-shadow(0 0 6px rgba(201,124,61,0.5))" }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="font-display text-6xl font-medium tabular-nums text-paper">
            {minutes}:{seconds}
          </span>
          <span className="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-paper-muted">
            {MODE_LABEL[mode]}
          </span>
        </div>
      </div>

      {/* Transport controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={reset}
          aria-label="Reset timer"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-paper/10 text-paper-muted transition-colors duration-300 hover:border-paper/20 hover:text-paper"
        >
          <RotateCcw size={18} />
        </button>
        <button
          onClick={toggleRunning}
          aria-label={isRunning ? "Pause timer" : "Start timer"}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-base-950 shadow-glow transition-transform duration-300 ease-deck hover:scale-105 active:scale-95"
        >
          {isRunning ? (
            <Pause size={26} fill="currentColor" />
          ) : (
            <Play size={26} fill="currentColor" className="ml-1" />
          )}
        </button>
        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-transparent" />
      </div>

      {/* Stats strip */}
      <div className="flex items-center gap-6 font-mono text-xs text-paper-muted">
        <span>
          <span className="text-paper">{todayCount(stats)}</span> today
        </span>
        <span className="h-3 w-px bg-paper/15" />
        <span>
          <span className="text-paper">{currentStreak(stats)}</span> day
          streak
        </span>
        <span className="h-3 w-px bg-paper/15" />
        <span>
          <span className="text-paper">{totalCount(stats)}</span> total
        </span>
      </div>
    </div>
  );
}
