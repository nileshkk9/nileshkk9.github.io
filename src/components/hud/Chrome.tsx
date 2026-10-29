"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronLeft, ChevronRight, Check, CircleHelp, Map as MapIcon, MousePointerClick, ScrollText, Sparkles, Volume2, VolumeX } from "lucide-react";
import { originArtifacts } from "@/content/archive";
import { isObjectiveDone, useExperience } from "@/store/experience";
import { CHAPTERS, chapterLabel, worldById } from "@/worlds/registry";
import { warp } from "@/three/Warp";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/lib/useIsMobile";

const ease = [0.22, 1, 0.36, 1] as const;

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-px font-mono text-[10px] text-white/45">{children}</kbd>
  );
}

export function TopBar() {
  const phase = useExperience((s) => s.phase);
  const world = worldById(useExperience((s) => s.activeWorld));
  const togglePanel = useExperience((s) => s.togglePanel);
  const panel = useExperience((s) => s.panel);
  if (phase !== "world") return null;

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease, delay: 0.4 }}
      className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-start justify-between p-3 md:p-7"
    >
      <div className="pointer-events-auto flex items-center gap-4">
        <div className="relative grid size-9 place-items-center rounded-full border border-white/15">
          <div className="size-2 rounded-full bg-cyan shadow-[0_0_14px_#5CE1FF]" />
          <div className="absolute inset-[-5px] animate-spin rounded-full border border-transparent border-t-cyan/40 [animation-duration:6s]" />
        </div>
        <div className="hidden leading-tight sm:block">
          <div className="text-[13px] font-medium tracking-tight text-white">Nilesh Kumar Pandey</div>
          <div className="eyebrow mt-0.5 text-white/40">
            <span style={{ color: world.accent }}>{world.title}</span>
          </div>
        </div>
      </div>

      <JourneyBar />

      <nav className="pointer-events-auto flex items-center gap-1.5 md:gap-2">
        <HudButton active={panel === "ai"} onClick={() => togglePanel("ai")} icon={<Sparkles className="size-3.5" />} label="Ask the Architect" kbd="/" primary />
        <HudButton active={panel === "starmap"} onClick={() => togglePanel("starmap")} icon={<MapIcon className="size-3.5" />} label="Map" kbd="M" />
        <HudButton active={panel === "log"} onClick={() => togglePanel("log")} icon={<ScrollText className="size-3.5" />} label="Résumé" kbd="`" />
        <SoundButton />
        <HudButton active={panel === "help"} onClick={() => togglePanel("help")} icon={<CircleHelp className="size-3.5" />} label="Help" kbd="?" compact />
      </nav>
    </motion.header>
  );
}

/** The career as a timeline, grouped by employer, so a visitor always knows which chapter they are in. */
function JourneyBar() {
  const activeWorld = useExperience((s) => s.activeWorld);
  const completed = useExperience((s) => s.completed);
  const warping = useExperience((s) => s.warping);
  const travel = useExperience((s) => s.travel);
  return (
    <div className="pointer-events-auto absolute top-5 left-1/2 hidden -translate-x-1/2 items-start gap-1.5 md:top-7 xl:flex">
      {CHAPTERS.map((c) => {
        const inChapter = c.worlds.some((w) => w.id === activeWorld);
        const era = c.worlds[0].era.replace(" — Present", " → now").replace(/(\d{2})(\d{2}) — \d{2}(\d{2})/, "$1$2–$3");
        return (
          <div key={c.employer} className="flex flex-col items-center">
            <div className={cn("glass flex items-center gap-0.5 rounded-full p-1 transition-colors", inChapter && "border-white/20")}>
              {c.worlds.map((w) => {
                const here = w.id === activeWorld;
                const done = completed.includes(w.id);
                return (
                  <button
                    key={w.id}
                    onClick={() => !warping && travel(w.id, 0)}
                    title={`${w.employer} · ${w.project ?? w.role} · ${w.era}`}
                    className={cn(
                      "relative flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] transition-colors",
                      here ? "text-void" : "text-white/55 hover:text-white",
                    )}
                  >
                    {here && <motion.span layoutId="journey-pill" className="absolute inset-0 rounded-full" style={{ background: w.accent }} transition={{ type: "spring", bounce: 0.15, duration: 0.6 }} />}
                    <span
                      className={cn("relative size-1.5 rounded-full", here && "bg-void/60")}
                      style={here ? undefined : { background: done ? w.accent : "rgba(255,255,255,0.2)", boxShadow: done ? `0 0 8px ${w.accent}` : "none" }}
                    />
                    <span className="relative font-medium">{w.chapter}</span>
                  </button>
                );
              })}
            </div>
            <div className={cn("eyebrow mt-1.5 text-[9px] whitespace-nowrap", inChapter ? "text-white/60" : "text-white/25")}>
              {c.worlds.length > 1 ? `${c.employer} · ${c.worlds.length} projects · ${era}` : c.employer === c.worlds[0].chapter || era === "Next" ? era : `${c.employer} · ${era}`}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SoundButton() {
  const muted = useExperience((s) => s.muted);
  const setMuted = useExperience((s) => s.setMuted);
  return (
    <HudButton
      onClick={() => setMuted(!muted)}
      icon={muted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
      label={muted ? "Sound off" : "Sound on"}
      kbd="S"
      compact
    />
  );
}

function HudButton({
  icon,
  label,
  kbd,
  onClick,
  active,
  compact,
  primary,
}: {
  icon: React.ReactNode;
  label: string;
  kbd: string;
  onClick: () => void;
  active?: boolean;
  compact?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={`${label} (${kbd})`}
      className={cn(
        "glass flex h-9 items-center gap-2 rounded-full text-[12px] text-white/75 transition hover:text-white",
        compact ? "w-9 justify-center" : "px-3.5",
        active && "border-cyan/40 text-white",
      )}
    >
      {icon}
      {!compact && (
        <>
          <span className={primary ? "hidden md:inline" : "hidden 2xl:inline"}>{label}</span>
          <span className="hidden 2xl:inline">
            <Kbd>{kbd}</Kbd>
          </span>
        </>
      )}
    </button>
  );
}

/** Chapter briefing: which part of the career this is, what happened, and what to do here. */
export function Objectives() {
  const phase = useExperience((s) => s.phase);
  const worldId = useExperience((s) => s.activeWorld);
  const objectives = useExperience((s) => s.objectives);
  const collected = useExperience((s) => s.collected.length);
  const completed = useExperience((s) => s.completed.includes(worldId));
  const briefingOpen = useExperience((s) => s.briefingOpen);
  const setBriefingOpen = useExperience((s) => s.setBriefingOpen);
  const sheet = useExperience((s) => s.sheet);
  const setSheet = useExperience((s) => s.setSheet);
  const mobile = useIsMobile();
  const open = mobile ? sheet === "briefing" : briefingOpen;
  const setOpen = (v: boolean) => (mobile ? setSheet(v ? "briefing" : null) : setBriefingOpen(v));
  const world = worldById(worldId);
  if (phase !== "world") return null;
  const doneCount = world.objectives.filter((o) => isObjectiveDone(objectives, worldId, o.id)).length;
  const nextId = world.objectives.find((o) => !isObjectiveDone(objectives, worldId, o.id))?.id;

  return (
    <motion.aside
      key={worldId}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.9, ease, delay: 1.2 }}
      className="glass fixed inset-x-3 top-[60px] z-20 rounded-2xl md:inset-x-auto md:top-24 md:left-7 md:w-[316px]"
    >
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-start justify-between gap-3 p-4 pb-3 text-left">
        <span>
          <span className="eyebrow block tracking-[0.16em] whitespace-nowrap text-white/40">{chapterLabel(worldId)}</span>
          <span className="mt-1.5 block text-[16px] leading-tight font-medium tracking-tight text-white">
            {world.project ? `${world.org} · ${world.project}` : world.org}
          </span>
          <span className="mt-0.5 block text-[12px]" style={{ color: world.accent }}>
            {world.era === "Next" ? world.role : `${world.role} · ${world.era}`}
          </span>
        </span>
        <span className="mt-0.5 flex shrink-0 items-center gap-2">
          {world.objectives.length > 0 && (
            <span className="font-mono text-[10px] text-white/45">{completed ? "DONE" : `${doneCount}/${world.objectives.length}`}</span>
          )}
          <ChevronDown className={cn("size-4 text-white/40 transition-transform", open && "rotate-180")} />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.45, ease }} className="overflow-hidden">
            <div className="max-h-[58svh] overflow-y-auto px-4 pb-4 md:max-h-none">
              <p className="text-[12.5px] leading-relaxed text-white/65">{world.story}</p>
              <div className="hairline my-3.5" />
              <div className="eyebrow flex items-center gap-1.5 text-white/40">
                <MousePointerClick className="size-3" /> How to play
              </div>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/85">{world.howTo}</p>
              {world.objectives.length > 0 && (
                <ul className="mt-3.5 space-y-2">
                  {world.objectives.map((o) => {
                    const done = isObjectiveDone(objectives, worldId, o.id);
                    const next = o.id === nextId;
                    const label = o.id === "collect" && worldId === "origin" ? `${o.label} · ${collected}/${originArtifacts.length}` : o.label;
                    return (
                      <li key={o.id} className="flex items-start gap-2.5 text-[12.5px]">
                        <span
                          className={cn(
                            "mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border transition-all duration-500",
                            done ? "border-transparent text-void" : next ? "border-white/60" : "border-white/20",
                          )}
                          style={done ? { background: world.accent } : undefined}
                        >
                          {done && <Check className="size-2.5" strokeWidth={3} />}
                          {next && <span className="size-1.5 animate-pulse rounded-full" style={{ background: world.accent }} />}
                        </span>
                        <span>
                          <span className={cn("transition-colors", done ? "text-white/40 line-through decoration-white/20" : "text-white/85")}>{label}</span>
                          {next && <span className="mt-0.5 block text-[11.5px] text-white/50">{o.hint}</span>}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}

export function ShotRail() {
  const phase = useExperience((s) => s.phase);
  const worldId = useExperience((s) => s.activeWorld);
  const shot = useExperience((s) => s.shot);
  const setShot = useExperience((s) => s.setShot);
  const world = worldById(worldId);
  if (phase !== "world" || !world.shots.length) return null;
  const n = world.shots.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease, delay: 1 }}
      className="fixed bottom-6 left-1/2 z-20 -translate-x-1/2 md:bottom-8"
    >
      <div className="glass flex items-center gap-1 rounded-full p-1">
        <span className="eyebrow hidden pl-3 text-white/35 md:inline">Views</span>
        <button aria-label="Previous view" onClick={() => setShot((shot - 1 + n) % n)} className="grid size-8 place-items-center rounded-full text-white/60 transition hover:bg-white/5 hover:text-white">
          <ChevronLeft className="size-4" />
        </button>
        {world.shots.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setShot(i)}
            className={cn(
              "relative rounded-full px-3 py-1.5 text-[11.5px] transition-colors",
              i === shot ? "text-void" : "text-white/55 hover:text-white",
            )}
          >
            {i === shot && <motion.span layoutId="shot-pill" className="absolute inset-0 rounded-full bg-holo" transition={{ type: "spring", bounce: 0.15, duration: 0.6 }} />}
            <span className={cn("relative", i !== shot && "hidden sm:inline")}>{s.label}</span>
            {i !== shot && <span className="relative sm:hidden">•</span>}
          </button>
        ))}
        <button aria-label="Next view" onClick={() => setShot((shot + 1) % n)} className="grid size-8 place-items-center rounded-full text-white/60 transition hover:bg-white/5 hover:text-white">
          <ChevronRight className="size-4" />
        </button>
      </div>
    </motion.div>
  );
}

export function WorldTitle() {
  const phase = useExperience((s) => s.phase);
  const worldId = useExperience((s) => s.activeWorld);
  const world = worldById(worldId);
  const visible = useRef(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (phase !== "world") return;
    const id = ++visible.current;
    setShow(true);
    const t = setTimeout(() => id === visible.current && setShow(false), 4200);
    return () => clearTimeout(t);
  }, [phase, worldId, setShow]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={worldId}
          className="pointer-events-none fixed inset-0 z-20 flex flex-col items-center justify-center text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(8px)", transition: { duration: 1.1 } }}
          transition={{ duration: 1.2, delay: 0.25 }}
        >
          <motion.div initial={{ letterSpacing: "0.6em", opacity: 0 }} animate={{ letterSpacing: "0.32em", opacity: 1 }} transition={{ duration: 1.6, ease }} className="eyebrow mb-5" style={{ color: world.accent }}>
            {chapterLabel(worldId)}
          </motion.div>
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1.4, ease, delay: 0.35 }}
            className="text-[clamp(44px,8vw,112px)] leading-[0.95] font-light tracking-[-0.045em] text-white text-glow"
          >
            {world.title}
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 0.9 }} className="mt-6 max-w-md text-[15px] text-white/60">
            {world.tagline}
          </motion.p>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.6, ease, delay: 0.6 }} className="hairline mt-8 w-64" />
          <div className="eyebrow mt-4 text-white/40">
            {world.project ? `${world.org} · ${world.project}` : world.org} · {world.era}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Caption() {
  const caption = useExperience((s) => s.caption);
  const phase = useExperience((s) => s.phase);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-28 z-30 flex justify-center">
      <AnimatePresence mode="wait">
        {caption && (
          <motion.p
            key={caption}
            initial={{ opacity: 0, y: 6, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -6, filter: "blur(6px)" }}
            transition={{ duration: 0.7, ease }}
            className={cn(
              "px-6 text-center tracking-tight text-white/85",
              phase === "intro" ? "text-[clamp(20px,2.6vw,34px)] font-light" : "glass rounded-full px-5 py-2 text-sm",
            )}
          >
            {caption}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export function IntroSkip() {
  const phase = useExperience((s) => s.phase);
  const warping = useExperience((s) => s.warping);
  return (
    <AnimatePresence>
      {phase === "intro" && !warping && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 1.5 } }}
          exit={{ opacity: 0 }}
          onClick={() => window.dispatchEvent(new Event("intro:skip"))}
          className="eyebrow fixed right-7 bottom-7 z-30 text-white/40 transition hover:text-white"
        >
          Skip sequence →
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export function FlashOverlay() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      if (ref.current) ref.current.style.opacity = String(warp.flash * 0.85);
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <div ref={ref} className="pointer-events-none fixed inset-0 z-40 bg-[radial-gradient(circle_at_center,#ffffff,#bfefff_40%,#5CE1FF00_80%)] opacity-0" />;
}
