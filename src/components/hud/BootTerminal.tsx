"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useExperience } from "@/store/experience";
import { audio } from "@/audio/engine";
import { cn } from "@/lib/utils";

type Line = { text: string; kind?: "load" | "title" | "dim"; pause?: number };

const LINES: Line[] = [
  { text: "INITIALIZING...", kind: "dim", pause: 500 },
  { text: "", pause: 100 },
  { text: "Loading Distributed Systems...", kind: "load" },
  { text: "Loading Optimization Engine...", kind: "load" },
  { text: "Loading AI Infrastructure...", kind: "load", pause: 400 },
  { text: "", pause: 100 },
  { text: "Welcome Traveler.", kind: "title", pause: 700 },
  { text: "", pause: 100 },
  { text: "This world was built by", kind: "dim", pause: 200 },
  { text: "Nilesh Kumar Pandey.", kind: "title", pause: 300 },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function BootTerminal() {
  const phase = useExperience((s) => s.phase);
  const introSeen = useExperience((s) => s.introSeen);
  const setPhase = useExperience((s) => s.setPhase);
  const travel = useExperience((s) => s.travel);
  const [shown, setShown] = useState<{ text: string; progress: number }[]>([]);
  const [done, setDone] = useState(false);
  const fast = useRef(false);
  const muted = useExperience((s) => s.muted);
  const [soundOn, setSoundOn] = useState(false);
  const soundAsked = useRef(false);

  useEffect(() => {
    const id = setTimeout(() => {
      soundAsked.current ||= audio.ready;
      setSoundOn(audio.ready);
    }, 400);
    return () => clearTimeout(id);
  }, []);

  /** While sound is still blocked by the browser, the first gesture enables it instead of skipping the typing. */
  const accelerate = () => {
    if (!useExperience.getState().muted && !soundAsked.current && !audio.ready) {
      soundAsked.current = true;
      audio.unlock();
      setSoundOn(true);
      return;
    }
    fast.current = true;
  };

  useEffect(() => {
    if (phase !== "boot") return;
    let cancelled = false;
    (async () => {
      await sleep(600);
      for (const line of LINES) {
        if (cancelled) return;
        setShown((s) => [...s, { text: "", progress: 0 }]);
        for (let c = 1; c <= line.text.length; c++) {
          if (cancelled) return;
          setShown((s) => s.map((l, i) => (i === s.length - 1 ? { ...l, text: line.text.slice(0, c) } : l)));
          audio.key(line.text[c - 1] === " " ? "space" : line.kind === "title" ? "heavy" : "char");
          if (!fast.current) await sleep(line.kind === "title" ? 45 : 18);
        }
        if (line.kind === "load") {
          for (let p = 1; p <= 20; p++) {
            if (cancelled) return;
            setShown((s) => s.map((l, i) => (i === s.length - 1 ? { ...l, progress: p / 20 } : l)));
            if (p === 20) audio.ok();
            if (!fast.current) await sleep(22 + Math.random() * 30);
          }
        }
        if (!fast.current) await sleep(line.pause ?? 160);
      }
      if (!cancelled) setDone(true);
    })();
    return () => {
      cancelled = true;
      setShown([]);
      setDone(false);
    };
  }, [phase]);

  const enter = () => setPhase("intro");
  const resume = () => travel("origin", 0);

  useEffect(() => {
    if (phase !== "boot") return;
    const onKey = (e: KeyboardEvent) => {
      if (!done) {
        accelerate();
        return;
      }
      if (e.key === "Enter") enter();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, done]);

  return (
    <AnimatePresence>
      {phase === "boot" && (
        <motion.div
          key="boot"
          className="fixed inset-0 z-50 flex items-center justify-center bg-void"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 1.2, ease: [0.65, 0, 0.35, 1] } }}
          onPointerDown={() => {
            if (!done) accelerate();
          }}
        >
          <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background:repeating-linear-gradient(0deg,#fff_0,#fff_1px,transparent_1px,transparent_3px)]" />
          <div className="w-[min(560px,88vw)] font-mono text-[11.5px] leading-7 md:text-[13px]">
            {shown.map((l, i) => {
              const line = LINES[i];
              const isLast = i === shown.length - 1;
              return (
                <div key={i} className="flex min-h-7 items-center gap-3 md:gap-4">
                  <span
                    className={
                      line.kind === "title"
                        ? "font-sans text-xl font-medium tracking-tight text-holo text-glow md:text-2xl"
                        : line.kind === "dim"
                          ? "text-white/45"
                          : "text-white/75"
                    }
                  >
                    {l.text}
                    {isLast && !done && <span className="caret ml-0.5 inline-block h-4 w-2 translate-y-0.5 bg-cyan" />}
                  </span>
                  {line.kind === "load" && l.text.length === line.text.length && (
                    <span className="ml-auto flex shrink-0 items-center gap-3">
                      <span className="relative h-px w-8 overflow-hidden bg-white/10 md:w-24">
                        <span className="absolute inset-y-0 left-0 bg-cyan" style={{ width: `${l.progress * 100}%` }} />
                      </span>
                      <span className={l.progress >= 1 ? "text-cyan" : "text-white/30"}>
                        {l.progress >= 1 ? "OK" : `${Math.round(l.progress * 100)}%`}
                      </span>
                    </span>
                  )}
                </div>
              );
            })}

            <AnimatePresence>
              {done && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-10 flex flex-wrap items-center gap-3"
                >
                  <button
                    onClick={enter}
                    autoFocus
                    className="group glass flex items-center gap-3 rounded-full px-5 py-2.5 font-sans text-sm text-white transition hover:border-cyan/40"
                  >
                    <span className="size-1.5 rounded-full bg-cyan shadow-[0_0_12px_#5CE1FF]" />
                    Enter the simulation
                    <span className="font-mono text-[11px] text-white/40 group-hover:text-cyan">↵</span>
                  </button>
                  {introSeen && (
                    <button onClick={resume} className="rounded-full px-4 py-2.5 font-sans text-sm text-white/55 transition hover:text-white">
                      Skip to Sector 01
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className={cn("eyebrow absolute inset-x-6 bottom-8 text-center transition-colors", !done && !soundOn && !muted ? "animate-pulse text-cyan/70" : "text-white/25")}>
            {done ? (
              <>
                Sound on · best with headphones<span className="hidden md:inline"> · press S to mute</span>
              </>
            ) : (
              <>
                <span className="md:hidden">{soundOn || muted ? "Tap to accelerate" : "Tap for sound"}</span>
                <span className="hidden md:inline">{soundOn || muted ? "Press any key to accelerate" : "Press any key for sound"}</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
