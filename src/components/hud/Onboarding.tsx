"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Compass, MousePointerClick, Orbit, X } from "lucide-react";
import { useExperience } from "@/store/experience";
import { Kbd } from "./Chrome";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

const STEPS = [
  {
    icon: Orbit,
    title: "A career, told as a universe",
    body: "Each world is a part of Nilesh's career, in order: college in Kolkata, Infosys, Udaan, then four worlds for the projects he built at Zinier, ending with what's next. The timeline at the top always shows where you are.",
  },
  {
    icon: MousePointerClick,
    title: "Every world has a short mission",
    body: "The card on the left explains what happened in that chapter and what to click. Glowing objects are interactive — the cursor changes when you hover them. Missions take under a minute.",
  },
  {
    icon: Compass,
    title: "Getting around",
    body: null,
  },
] as const;

const CONTROLS: [string, React.ReactNode][] = [
  ["Change camera view", <><Kbd>←</Kbd> <Kbd>→</Kbd> or the bottom bar</>],
  ["Jump to any chapter", <>the timeline, or <Kbd>M</Kbd> for the map</>],
  ["Ask a question — it flies you to the answer", <Kbd key="a">/</Kbd>],
  ["Read everything as a plain résumé", <Kbd key="r">`</Kbd>],
  ["Mute or unmute sound", <Kbd key="s">S</Kbd>],
];

export function Onboarding() {
  const phase = useExperience((s) => s.phase);
  const warping = useExperience((s) => s.warping);
  const onboarded = useExperience((s) => s.onboarded);
  const panel = useExperience((s) => s.panel);
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (phase !== "world" || onboarded || warping) return;
    const t = setTimeout(() => setReady(true), 5200);
    return () => clearTimeout(t);
  }, [phase, onboarded, warping]);

  useEffect(() => {
    if (panel === "help") setStep(0);
  }, [panel]);

  const open = phase === "world" && !warping && (panel === "help" || (!onboarded && ready && panel === "none"));
  const finish = () => {
    const s = useExperience.getState();
    s.setOnboarded(true);
    if (s.panel === "help") s.setPanel("none");
  };
  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 grid place-items-center bg-void/45 p-4 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          onClick={finish}
        >
          <motion.div
            role="dialog"
            aria-label="How this site works"
            initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 10, filter: "blur(6px)" }}
            transition={{ duration: 0.55, ease }}
            onClick={(e) => e.stopPropagation()}
            className="glass relative w-[min(460px,100%)] rounded-2xl p-6"
          >
            <button aria-label="Close" onClick={finish} className="absolute top-4 right-4 text-white/40 transition hover:text-white">
              <X className="size-4" />
            </button>
            <div className="eyebrow text-cyan">
              How this works · {step + 1}/{STEPS.length}
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.3 }} className="mt-5 min-h-44">
                <div className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/5">
                  <Icon className="size-5 text-white/80" />
                </div>
                <h2 className="mt-4 text-[20px] leading-tight font-medium tracking-tight text-white">{current.title}</h2>
                {current.body ? (
                  <p className="mt-2 text-[13.5px] leading-relaxed text-white/65">{current.body}</p>
                ) : (
                  <ul className="mt-3 space-y-2.5">
                    {CONTROLS.map(([label, keys]) => (
                      <li key={label} className="flex items-center justify-between gap-4 text-[13px]">
                        <span className="text-white/70">{label}</span>
                        <span className="shrink-0 text-[11.5px] text-white/45">{keys}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="mt-6 flex items-center justify-between">
              <div className="flex gap-1.5">
                {STEPS.map((_, i) => (
                  <span key={i} className={cn("h-1 rounded-full transition-all", i === step ? "w-5 bg-white" : "w-1.5 bg-white/20")} />
                ))}
              </div>
              <div className="flex items-center gap-2">
                {step > 0 ? (
                  <button onClick={() => setStep(step - 1)} className="rounded-full px-3 py-1.5 text-[12.5px] text-white/55 transition hover:text-white">
                    Back
                  </button>
                ) : (
                  <button onClick={finish} className="rounded-full px-3 py-1.5 text-[12.5px] text-white/45 transition hover:text-white">
                    Skip
                  </button>
                )}
                <button
                  onClick={() => (step < STEPS.length - 1 ? setStep(step + 1) : finish())}
                  className="rounded-full bg-holo px-4 py-1.5 text-[12.5px] font-medium text-void transition hover:bg-white"
                >
                  {step < STEPS.length - 1 ? "Next" : "Start exploring"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
