"use client";

import { useState } from "react";
import { CloudRain, Disc3, Coffee, Waves } from "lucide-react";
import { getNoiseEngine, type LayerId } from "@/lib/noiseEngine";
import ChannelStrip from "./ChannelStrip";

interface LayerConfig {
  id: LayerId;
  label: string;
  icon: typeof CloudRain;
  defaultVolume: number;
}

const LAYERS: LayerConfig[] = [
  { id: "rain", label: "Rain", icon: CloudRain, defaultVolume: 0.6 },
  { id: "vinyl", label: "Vinyl", icon: Disc3, defaultVolume: 0.4 },
  { id: "cafe", label: "Cafe", icon: Coffee, defaultVolume: 0.35 },
  { id: "hiss", label: "Tape hiss", icon: Waves, defaultVolume: 0.25 },
];

export default function Soundboard() {
  const [active, setActive] = useState<Record<LayerId, boolean>>({
    rain: false,
    vinyl: false,
    cafe: false,
    hiss: false,
  });
  const [volumes, setVolumes] = useState<Record<LayerId, number>>({
    rain: 0.6,
    vinyl: 0.4,
    cafe: 0.35,
    hiss: 0.25,
  });

  const handleToggle = async (id: LayerId) => {
    const engine = getNoiseEngine();
    const next = !active[id];
    setActive((prev) => ({ ...prev, [id]: next }));
    await engine.toggle(id, next);
    engine.setVolume(id, volumes[id]);
  };

  const handleVolume = (id: LayerId, value: number) => {
    setVolumes((prev) => ({ ...prev, [id]: value }));
    getNoiseEngine().setVolume(id, value);
  };

  return (
    <div className="glass flex items-end justify-center gap-8 rounded-3xl px-10 py-8 shadow-glass sm:gap-12">
      {LAYERS.map((layer) => (
        <ChannelStrip
          key={layer.id}
          label={layer.label}
          icon={layer.icon}
          active={active[layer.id]}
          volume={volumes[layer.id]}
          onToggle={() => handleToggle(layer.id)}
          onVolumeChange={(v) => handleVolume(layer.id, v)}
        />
      ))}
    </div>
  );
}
