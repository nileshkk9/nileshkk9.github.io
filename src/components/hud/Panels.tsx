"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Lock, X, CornerDownLeft } from "lucide-react";
import { chapters, originArtifacts } from "@/content/archive";
import { INTENTS, intentById, resolveIntent } from "@/ai/intents";
import { useExperience } from "@/store/experience";
import { CHAPTERS, worldById, type WorldId } from "@/worlds/registry";
import { NEXUS_COUNTS } from "@/worlds/nexus/simGLSL";
import { ArchiveText } from "@/components/ArchiveText";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/lib/useIsMobile";
import { Kbd } from "./Chrome";
import { ConsoleShell } from "./WorldConsoles";

const ease = [0.22, 1, 0.36, 1] as const;

function useTypewriter(text: string, speed = 14, key: unknown = text) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const id = setInterval(
      () => setN((v) => (v >= text.length ? (clearInterval(id), v) : v + 2)),
      speed,
    );
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return text.slice(0, n);
}

export function ArtifactCard() {
  const id = useExperience((s) => s.activeArtifact);
  const open = useExperience((s) => s.openArtifact);
  const collected = useExperience((s) => s.collected.length);
  const a = originArtifacts.find((x) => x.id === id);
  const inscription = useTypewriter(a?.inscription ?? "", 18, id);

  return (
    <AnimatePresence>
      {a && (
        <motion.div
          key={a.id}
          initial={{ opacity: 0, x: 24, filter: "blur(8px)" }}
          animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, x: 16, filter: "blur(6px)" }}
          transition={{ duration: 0.7, ease }}
          className="glass fixed top-1/2 right-5 z-30 w-[min(360px,calc(100vw-40px))] -translate-y-1/2 rounded-2xl p-6 md:right-7"
        >
          <button
            aria-label="Close"
            onClick={() => open(null)}
            className="absolute top-4 right-4 text-white/40 transition hover:text-white"
          >
            <X className="size-4" />
          </button>
          <div className="eyebrow text-amber">
            Artifact recovered · {collected}/{originArtifacts.length}
          </div>
          <div className="mt-4 text-[11px] font-mono tracking-wider text-white/40 uppercase">
            {a.kind}
          </div>
          <h3 className="mt-1 text-[22px] leading-tight font-medium tracking-[-0.02em] text-white">
            {a.name}
          </h3>
          <div className="mt-1 text-[12px] text-white/45">{a.year}</div>
          <div className="hairline my-5" />
          <p className="min-h-12 font-mono text-[13px] leading-relaxed text-cyan">
            {inscription}
          </p>
          <p className="mt-4 text-[13px] leading-relaxed text-white/60">
            {a.detail}
          </p>
          {a.href && (
            <a
              href={a.href}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-1 text-[12px] text-white/70 transition hover:text-white"
            >
              Open record <ArrowUpRight className="size-3.5" />
            </a>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const MODE_COPY = {
  continuous: {
    title: "Continuous scheduling",
    body: "Every request is assigned the moment it arrives. Amber tasks stream straight to cyan workers.",
  },
  batch: {
    title: "Batch scheduling",
    body: "Demand is collected for a window, then solved all at once for a better global plan. Watch the queue release.",
  },
};

function useCounter(target: number) {
  const [v, setV] = useState(target);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      setV((cur) => {
        const next = cur + (target - cur) * 0.08;
        return Math.abs(next - target) < 1 ? target : next;
      });
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return Math.round(v);
}

export function NexusConsole() {
  const phase = useExperience((s) => s.phase);
  const world = useExperience((s) => s.activeWorld);
  const mode = useExperience((s) => s.nexusMode);
  const capacity = useExperience((s) => s.nexusCapacity);
  const setMode = useExperience((s) => s.setNexusMode);
  const setCapacity = useExperience((s) => s.setNexusCapacity);
  const fireDispatch = useExperience((s) => s.fireDispatch);
  const dispatchAt = useExperience((s) => s.dispatchAt);
  const quality = useExperience((s) => s.quality);
  const counts = NEXUS_COUNTS[quality];
  const [now, setNow] = useState(() => performance.now() / 1000);

  useEffect(() => {
    if (world !== "nexus") return;
    useExperience.getState().completeObjective("nexus", "continuous");
    const id = setInterval(() => setNow(performance.now() / 1000), 250);
    return () => clearInterval(id);
  }, [world]);

  const surging = now - dispatchAt < 7;
  const base =
    mode === "continuous"
      ? (counts.tasks * 0.62) / 7
      : (counts.tasks * 0.62) / 9;
  const rate = useCounter(Math.round(base * (surging ? 1.4 : 1)));
  const workers = useCounter(counts.workers);
  const tasks = useCounter(counts.tasks);

  if (phase !== "world" || world !== "nexus") return null;
  const c = chapters.nexus;

  return (
    <ConsoleShell world="nexus" title="Scheduling engine · live">
      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat value={workers.toLocaleString()} label="workers" />
        <Stat value={tasks.toLocaleString()} label="tasks" />
        <Stat
          value={rate.toLocaleString()}
          label="assign / s"
          accent={surging}
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-1 rounded-full bg-white/5 p-1">
        {(["continuous", "batch"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "relative rounded-full py-1.5 text-[12px] capitalize transition-colors",
              mode === m ? "text-void" : "text-white/60 hover:text-white",
            )}
          >
            {mode === m && (
              <motion.span
                layoutId="mode-pill"
                className="absolute inset-0 rounded-full bg-holo"
                transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
              />
            )}
            <span className="relative">{m}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.35 }}
          className="mt-3 min-h-16"
        >
          <div className="text-[13px] font-medium text-white">
            {MODE_COPY[mode].title}
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-white/55">
            {MODE_COPY[mode].body}
          </p>
        </motion.div>
      </AnimatePresence>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          onClick={() => setCapacity(!capacity)}
          className={cn(
            "rounded-xl border px-3 py-2.5 text-left transition",
            capacity
              ? "border-amber/40 bg-amber/10"
              : "border-white/10 hover:border-white/20",
          )}
        >
          <div className="text-[12px] text-white">Capacity planning</div>
          <div className="mt-0.5 text-[10.5px] text-white/45">
            {capacity ? "Demand heatmap on" : "Show demand vs. supply"}
          </div>
        </button>
        <button
          onClick={fireDispatch}
          disabled={surging}
          className={cn(
            "rounded-xl border px-3 py-2.5 text-left transition",
            surging
              ? "border-cyan/40 bg-cyan/10"
              : "border-white/10 hover:border-white/20",
          )}
        >
          <div className="text-[12px] text-white">Bulk dispatch</div>
          <div className="mt-0.5 text-[10.5px] text-white/45">
            {surging ? "+40% throughput · SQS" : "Fire an SQS surge"}
          </div>
        </button>
      </div>

      <div className="hairline my-4" />
      <div className="flex flex-wrap gap-1.5">
        {c.stack.map((s) => (
          <span
            key={s}
            className="rounded-full border border-white/10 px-2 py-0.5 font-mono text-[10px] text-white/50"
          >
            {s}
          </span>
        ))}
      </div>
    </ConsoleShell>
  );
}

function Stat({
  value,
  label,
  accent,
}: {
  value: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <div>
      <div
        className={cn(
          "font-mono text-[17px] tracking-tight tabular-nums transition-colors",
          accent ? "text-cyan" : "text-white",
        )}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[10.5px] text-white/40">{label}</div>
    </div>
  );
}

export function StarMap() {
  const panel = useExperience((s) => s.panel);
  const setPanel = useExperience((s) => s.setPanel);
  const travel = useExperience((s) => s.travel);
  const activeWorld = useExperience((s) => s.activeWorld);
  const unlocked = useExperience((s) => s.unlocked);
  const completed = useExperience((s) => s.completed);
  const open = panel === "starmap";
  const mobile = useIsMobile();

  const nodes = useMemo(
    () =>
      CHAPTERS.flatMap((c, ci) =>
        c.worlds.map((w, k) => ({
          w,
          x: 7 + ci * 19,
          y: 52 + (k - (c.worlds.length - 1) / 2) * 15,
          project: c.worlds.length > 1 ? k + 1 : 0,
        })),
      ),
    [],
  );
  const zinier = CHAPTERS.find((c) => c.worlds.length > 1);
  const zinierX = 7 + CHAPTERS.findIndex((c) => c === zinier) * 19;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 bg-void/70 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          onClick={() => setPanel("none")}
        >
          <div className="absolute inset-x-6 top-7 text-center">
            <div className="eyebrow text-white/40">Journey map</div>
            <div className="mt-2 text-2xl font-light tracking-tight text-white">
              One career, five chapters.
            </div>
            <div className="mt-1 text-[13px] text-white/45">
              {mobile
                ? "From college in Kolkata to Zinier today. Tap any world to travel there."
                : "From college in Kolkata to Zinier today, left to right — Zinier spans four projects. Click any world to travel there."}
            </div>
          </div>
          {mobile ? (
            <MobileJourney
              onPick={(id) => {
                setPanel("none");
                travel(id, 0);
              }}
            />
          ) : (
            <>
              <svg
                className="absolute inset-0 size-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <polyline
                  points={nodes.map((n) => `${n.x},${n.y}`).join(" ")}
                  fill="none"
                  stroke="url(#route)"
                  strokeWidth="0.15"
                  vectorEffect="non-scaling-stroke"
                  strokeDasharray="0.6 0.6"
                />
                <defs>
                  <linearGradient id="route" x1="0" x2="1">
                    <stop offset="0" stopColor="#5CE1FF" stopOpacity="0.8" />
                    <stop offset="1" stopColor="#E8F1FF" stopOpacity="0.15" />
                  </linearGradient>
                </defs>
              </svg>
              {zinier && (
                <div
                  className="pointer-events-none absolute -translate-x-3"
                  style={{ left: `${zinierX}%`, top: "20%" }}
                >
                  <div className="eyebrow text-white/50">
                    {zinier.employer} · {zinier.worlds[0].era}
                  </div>
                  <div className="mt-1 text-[12px] text-white/40">
                    {zinier.worlds.length} projects, one tenure
                  </div>
                </div>
              )}
              {nodes.map(({ w, x, y, project }, i) => {
                const isUnlocked = unlocked.includes(w.id);
                const isDone = completed.includes(w.id);
                const here = w.id === activeWorld;
                const status = !w.ready
                  ? "Coming soon"
                  : here
                    ? "You are here"
                    : isDone
                      ? "Complete"
                      : isUnlocked
                        ? "Visited"
                        : "Not visited yet";
                return (
                  <motion.button
                    key={w.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + i * 0.05, duration: 0.6, ease }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!w.ready) return;
                      setPanel("none");
                      travel(w.id, 0);
                    }}
                    className={cn(
                      "group absolute -translate-x-1/2 -translate-y-1/2 text-left",
                      !w.ready && "cursor-not-allowed",
                    )}
                    style={{ left: `${x}%`, top: `${y}%` }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="relative grid size-5 place-items-center">
                        <span
                          className={cn(
                            "size-2.5 rounded-full transition-transform group-hover:scale-150",
                            w.ready ? "" : "opacity-30",
                          )}
                          style={{
                            background: w.accent,
                            boxShadow: w.ready
                              ? `0 0 18px ${w.accent}`
                              : "none",
                          }}
                        />
                        {here && (
                          <span
                            className="absolute inset-0 animate-ping rounded-full border"
                            style={{ borderColor: w.accent }}
                          />
                        )}
                      </span>
                      <span className="hidden sm:block">
                        <span className="eyebrow block text-white/35">
                          {project
                            ? `Project ${project}`
                            : `${w.employer} · ${w.era}`}
                        </span>
                        <span
                          className={cn(
                            "block text-[14px] tracking-tight",
                            w.ready ? "text-white" : "text-white/40",
                          )}
                        >
                          {w.title}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-white/40">
                          {!isUnlocked && w.ready && (
                            <Lock className="size-3" />
                          )}
                          {w.project ?? w.role} · {status}
                        </span>
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </>
          )}
          <div className="eyebrow absolute inset-x-6 bottom-7 text-center text-white/30">
            {mobile ? (
              "Tap outside to close"
            ) : (
              <>
                Press <Kbd>M</Kbd> or click anywhere to close
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MobileJourney({ onPick }: { onPick: (id: WorldId) => void }) {
  const activeWorld = useExperience((s) => s.activeWorld);
  const completed = useExperience((s) => s.completed);
  return (
    <div className="absolute inset-x-5 top-40 bottom-16 overflow-y-auto">
      {CHAPTERS.map((c, ci) => (
        <div
          key={c.employer}
          className="relative border-l border-white/10 pb-5 pl-5"
        >
          <span className="absolute top-1 -left-[3px] size-1.5 rounded-full bg-white/30" />
          <div className="eyebrow text-white/40">
            Chapter {ci + 1} · {c.employer} · {c.worlds[0].era}
          </div>
          <div className="mt-2 space-y-1.5">
            {c.worlds.map((w) => {
              const here = w.id === activeWorld;
              const done = completed.includes(w.id);
              return (
                <button
                  key={w.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPick(w.id);
                  }}
                  className={cn(
                    "glass flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left",
                    here && "border-white/25",
                  )}
                >
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{
                      background: w.accent,
                      boxShadow: `0 0 12px ${w.accent}`,
                    }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] text-white">
                      {w.title}
                    </span>
                    <span className="block truncate text-[11px] text-white/45">
                      {w.project ?? w.role}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-[10px] text-white/40">
                    {here ? "HERE" : done ? "DONE" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ArchitectConsole() {
  const panel = useExperience((s) => s.panel);
  const setPanel = useExperience((s) => s.setPanel);
  const aiIntent = useExperience((s) => s.aiIntent);
  const setAiIntent = useExperience((s) => s.setAiIntent);
  const travel = useExperience((s) => s.travel);
  const [q, setQ] = useState("");
  const [miss, setMiss] = useState(false);
  const [line, setLine] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const open = panel === "ai";
  const intent = aiIntent ? intentById(aiIntent) : null;
  const text = useTypewriter(
    intent?.answer[line] ?? "",
    16,
    `${aiIntent}-${line}`,
  );

  useEffect(() => {
    if (open) setTimeout(() => input.current?.focus(), 50);
  }, [open]);

  const ask = (query: string) => {
    const hit = resolveIntent(query);
    setQ("");
    setLine(0);
    if (!hit) {
      setMiss(true);
      setAiIntent(null);
      return;
    }
    setMiss(false);
    setAiIntent(hit.id);
    const w = worldById(hit.world);
    if (w.ready) travel(hit.world, hit.shot);
  };

  const suggestions = useMemo(() => {
    const ids = ["scheduling", "batch", "routing", "zpilot", "rag", "origin"];
    return INTENTS.filter((i) => ids.includes(i.id));
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: 12, filter: "blur(6px)" }}
          transition={{ duration: 0.55, ease }}
          className="glass fixed bottom-24 left-1/2 z-40 w-[min(620px,calc(100vw-32px))] -translate-x-1/2 rounded-2xl"
        >
          <div className="flex items-center justify-between px-5 pt-4">
            <div className="flex items-center gap-2.5">
              <span className="relative grid size-5 place-items-center">
                <span className="size-2 rounded-full bg-holo shadow-[0_0_12px_#E8F1FF]" />
                <span className="absolute inset-0 rounded-full border border-cyan/50" />
              </span>
              <span className="eyebrow text-white/60">Architect AI</span>
            </div>
            <button
              aria-label="Close"
              onClick={() => setPanel("none")}
              className="text-white/40 transition hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="min-h-[92px] px-5 pt-3 pb-2">
            {intent ? (
              <div>
                <p className="text-[14.5px] leading-relaxed text-white/90">
                  {text}
                </p>
                <div className="mt-3 flex items-center gap-3 text-[11px] text-white/40">
                  {intent.answer.length > 1 && (
                    <>
                      <span className="font-mono">
                        {line + 1}/{intent.answer.length}
                      </span>
                      {line < intent.answer.length - 1 ? (
                        <button
                          onClick={() => setLine(line + 1)}
                          className="text-cyan transition hover:text-white"
                        >
                          Continue →
                        </button>
                      ) : (
                        <button
                          onClick={() => setLine(0)}
                          className="transition hover:text-white"
                        >
                          Replay
                        </button>
                      )}
                    </>
                  )}
                  {!worldById(intent.world).ready && (
                    <span className="text-amber/80">
                      Sector offline · compiling
                    </span>
                  )}
                </div>
              </div>
            ) : miss ? (
              <p className="text-[14px] text-white/70">
                I have no record of that yet. Ask about scheduling, routing,
                ZPilot, RAG, or where it all began.
              </p>
            ) : (
              <p className="text-[14px] text-white/55">
                I&apos;m the Architect&apos;s guide. Ask how something was built
                and I&apos;ll take you there.
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 px-5 pb-3">
            {suggestions.map((s) => (
              <button
                key={s.id}
                onClick={() => ask(s.prompt)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11.5px] transition",
                  aiIntent === s.id
                    ? "border-cyan/40 text-white"
                    : "border-white/10 text-white/55 hover:border-white/25 hover:text-white",
                )}
              >
                {s.prompt}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(q);
            }}
            className="flex items-center gap-3 border-t border-white/5 px-5 py-3.5"
          >
            <input
              ref={input}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="How did Nilesh build the scheduling platform?"
              className="flex-1 bg-transparent text-[14px] text-white placeholder:text-white/30 focus:outline-none"
              onKeyDown={(e) => e.stopPropagation()}
            />
            <button
              type="submit"
              className="text-white/40 transition hover:text-cyan"
              aria-label="Ask"
            >
              <CornerDownLeft className="size-4" />
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function MissionLog() {
  const panel = useExperience((s) => s.panel);
  const setPanel = useExperience((s) => s.setPanel);
  const open = panel === "log";
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 flex justify-end bg-void/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setPanel("none")}
        >
          <motion.div
            role="dialog"
            aria-label="Résumé"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ duration: 0.55, ease }}
            onClick={(e) => e.stopPropagation()}
            className="glass h-full w-[min(560px,100vw)] overflow-y-auto rounded-none border-y-0 border-r-0 p-8 md:p-10"
          >
            <div className="mb-8 flex items-center justify-between">
              <div className="eyebrow text-white/40">Résumé · plain text</div>
              <button
                aria-label="Close"
                onClick={() => setPanel("none")}
                className="text-white/40 transition hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>
            <ArchiveText />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
