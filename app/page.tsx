import PomodoroTimer from "@/components/PomodoroTimer";
import Soundboard from "@/components/Soundboard";

export default function Home() {
  return (
    <main className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-16 px-6 py-16">
      <header className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-display text-3xl italic text-paper">
          Amber Hours
        </h1>
        <p className="max-w-xs text-sm text-paper-muted">
          Twenty-five quiet minutes, a little rain, a little static.
        </p>
      </header>

      <PomodoroTimer />

      <Soundboard />

      <footer className="font-mono text-[11px] text-paper-faint">
        Sound is synthesized in your browser — nothing to load, nothing to
        stream.
      </footer>
    </main>
  );
}
