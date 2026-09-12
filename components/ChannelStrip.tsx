"use client";

import { type LucideIcon } from "lucide-react";

interface ChannelStripProps {
  label: string;
  icon: LucideIcon;
  active: boolean;
  volume: number;
  onToggle: () => void;
  onVolumeChange: (value: number) => void;
}

export default function ChannelStrip({
  label,
  icon: Icon,
  active,
  volume,
  onToggle,
  onVolumeChange,
}: ChannelStripProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* LED indicator */}
      <span
        className={`h-1.5 w-1.5 rounded-full transition-all duration-500 ${
          active
            ? "bg-accent shadow-[0_0_8px_2px_rgba(201,124,61,0.7)]"
            : "bg-paper/15"
        }`}
        aria-hidden="true"
      />

      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
        className="fader"
        aria-label={`${label} volume`}
        disabled={!active}
      />

      <button
        onClick={onToggle}
        aria-pressed={active}
        aria-label={`Toggle ${label}`}
        className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-300 ${
          active
            ? "border-accent/40 bg-accent/15 text-accent"
            : "border-paper/10 text-paper-muted hover:text-paper"
        }`}
      >
        <Icon size={18} />
      </button>

      <span className="font-mono text-[11px] tracking-wide text-paper-muted">
        {label}
      </span>
    </div>
  );
}
