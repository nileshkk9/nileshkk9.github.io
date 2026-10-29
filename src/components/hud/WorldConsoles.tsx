"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Check, ChevronUp, X } from "lucide-react";
import { architect, awards, chapters, futurePaths } from "@/content/archive";
import { isObjectiveDone, useExperience } from "@/store/experience";
import { nextReadyWorld, worldById, type WorldId } from "@/worlds/registry";
import { LEGACY_SYSTEMS } from "@/worlds/legacy/systems";
import { LOGISTICS_STATIONS, optimizeStation } from "@/worlds/logistics/stations";
import { ARCHIVE_QUERIES, QUERY_TIMING, TRACE_SPANS, archiveBus } from "@/worlds/archive/data";
import { PATH_COLORS } from "@/worlds/future/colors";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/lib/useIsMobile";

const ease = [0.22, 1, 0.36, 1] as const;

export function ConsoleShell({ world, title, children }: { world: WorldId; title: string; children: React.ReactNode }) {
  const phase = useExperience((s) => s.phase);
  const active = useExperience((s) => s.activeWorld);
  const sheet = useExperience((s) => s.sheet);
  const setSheet = useExperience((s) => s.setSheet);
  const overlay = useExperience((s) => s.panel !== "none");
  const mobile = useIsMobile();
  if (phase !== "world" || active !== world || (mobile && overlay)) return null;
  const org = chapters[world]?.org ?? "";
  const accent = worldById(world).accent;
  const open = !mobile || sheet === "console";
  const header = (
    <>
      <div className="eyebrow" style={{ color: accent }}>
        {title}
      </div>
      <span className="flex items-center gap-1.5 font-mono text-[10px] text-white/40">
        <span className="size-1.5 animate-pulse rounded-full" style={{ background: accent }} /> {org}
        {mobile && <ChevronUp className={cn("ml-1 size-4 transition-transform", open && "rotate-180")} />}
      </span>
    </>
  );
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease, delay: 1.4 }}
      className="glass fixed inset-x-3 bottom-[76px] z-20 rounded-2xl md:inset-x-auto md:right-7 md:bottom-8 md:w-[340px] md:p-5"
    >
      {mobile ? (
        <button onClick={() => setSheet(open ? null : "console")} aria-expanded={open} className="flex w-full items-center justify-between p-4 text-left">
          {header}
        </button>
      ) : (
        <div className="flex items-center justify-between">{header}</div>
      )}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={mobile ? { height: 0, opacity: 0 } : false}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease }}
            className="overflow-hidden"
          >
            <div className="max-h-[52svh] overflow-y-auto px-4 pb-4 md:max-h-none md:overflow-visible md:p-0">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Meter({ value, accent, label, right }: { value: number; accent: string; label: string; right: string }) {
  return (
    <div className="mt-4">
      <div className="flex items-baseline justify-between text-[11px]">
        <span className="text-white/50">{label}</span>
        <span className="font-mono text-white tabular-nums">{right}</span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/8">
        <motion.div className="h-full rounded-full" style={{ background: accent }} animate={{ width: `${value * 100}%` }} transition={{ duration: 1.4, ease }} />
      </div>
    </div>
  );
}

function Stack({ world }: { world: string }) {
  return (
    <div className="mt-4 flex flex-wrap gap-1.5 border-t border-white/5 pt-4">
      {chapters[world].stack.map((s) => (
        <span key={s} className="rounded-full border border-white/10 px-2 py-0.5 font-mono text-[10px] text-white/50">
          {s}
        </span>
      ))}
    </div>
  );
}

export function LegacyConsole() {
  const objectives = useExperience((s) => s.objectives);
  const done = LEGACY_SYSTEMS.filter((s) => isObjectiveDone(objectives, "legacy", s.id)).length;
  const c = chapters.legacy;
  return (
    <ConsoleShell world="legacy" title="System integrity">
      <Meter value={0.18 + (done / LEGACY_SYSTEMS.length) * 0.82} accent={done === 5 ? "#5CE1FF" : "#FFB547"} label="City modernized" right={`${done}/${LEGACY_SYSTEMS.length} systems`} />
      <ul className="mt-4 space-y-1.5">
        {LEGACY_SYSTEMS.map((s) => {
          const ok = isObjectiveDone(objectives, "legacy", s.id);
          return (
            <li key={s.id} className="flex items-center justify-between text-[12px]">
              <span className={ok ? "text-white/45" : "text-white/80"}>{s.error}</span>
              <span className={cn("font-mono text-[10px] tracking-wider uppercase", ok ? "text-cyan" : "text-[#FF5C48]")}>
                {ok ? s.fixed : s.severity}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-[12px] leading-relaxed text-white/50">{c.highlights[0]}</p>
      <Stack world="legacy" />
    </ConsoleShell>
  );
}

export function LogisticsConsole() {
  const objectives = useExperience((s) => s.objectives);
  const done = LOGISTICS_STATIONS.filter((s) => isObjectiveDone(objectives, "logistics", s.id)).length;
  const throughput = 0.3 + (done / 3) * 0.7;
  const delay = Math.round(100 - (done / 3) * 70);
  return (
    <ConsoleShell world="logistics" title="Warehouse throughput">
      <Meter value={throughput} accent="#7CF2C8" label="Throughput" right={`${Math.round(throughput * 100)}%`} />
      <Meter value={delay / 100} accent={done === 3 ? "#7CF2C8" : "#FF7A48"} label="Operational delay" right={`${delay}% of baseline`} />
      <ul className="mt-4 space-y-1.5">
        {LOGISTICS_STATIONS.map((s, i) => {
          const ok = isObjectiveDone(objectives, "logistics", s.id);
          return (
            <li key={s.id}>
              <button
                onClick={() => optimizeStation(i)}
                disabled={ok}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-[12px] transition",
                  ok ? "border-transparent bg-white/3 text-white/45" : "border-white/10 text-white/85 hover:border-[#7CF2C8]/40",
                )}
              >
                <span>
                  {s.title}
                  <span className="block text-[10.5px] text-white/40">{ok ? s.fix : s.jam}</span>
                </span>
                {ok ? <Check className="size-3.5 text-[#7CF2C8]" /> : <span className="font-mono text-[10px] text-[#FF7A48]">OPTIMIZE</span>}
              </button>
            </li>
          );
        })}
      </ul>
      <Stack world="logistics" />
    </ConsoleShell>
  );
}

export function RouteConsole() {
  const broken = useExperience((s) => isObjectiveDone(s.objectives, "routeverse", "chains"));
  const stats = useExperience((s) => s.routeStats);
  const start = useExperience((s) => s.routeStart);
  const metric = chapters.routeverse.metrics[0];
  return (
    <ConsoleShell world="routeverse" title="Routing engine">
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10.5px] text-white/40">Provider</div>
          <div className={cn("mt-0.5 text-[13px]", broken ? "text-white" : "text-[#FF5C48]")}>{broken ? "In-house engine" : "Third-party API"}</div>
        </div>
        <div>
          <div className="text-[10.5px] text-white/40">External cost</div>
          <div className={cn("mt-0.5 font-mono text-[13px]", broken ? "text-[#8AB4FF]" : "text-white")}>{broken ? metric.value : "100%"}</div>
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-white/8 bg-white/3 p-3">
        {!broken ? (
          <p className="text-[12px] text-white/60">Every route is computed by someone else&apos;s servers, billed per request. Sever the chains.</p>
        ) : stats ? (
          <div className="grid grid-cols-3 gap-2">
            <Mini label="explored" value={stats.explored.toLocaleString()} />
            <Mini label="hops" value={String(stats.hops)} />
            <Mini label="compute" value={`${stats.ms < 1 ? stats.ms.toFixed(2) : stats.ms.toFixed(1)} ms`} />
            <div className="col-span-3 mt-1 text-[11px] text-white/45">
              {stats.manual ? "Your route" : "Live traffic"} · {Math.round(stats.km).toLocaleString()} km · A* over great-circle distance
            </div>
          </div>
        ) : (
          <p className="text-[12px] text-white/60">Engine warming up…</p>
        )}
      </div>
      {broken && (
        <p className="mt-3 text-[12px] text-white/55">
          {start === null ? "Click any two cities on the planet to compute your own route." : "Origin locked. Now pick a destination."}
        </p>
      )}
      <Stack world="routeverse" />
    </ConsoleShell>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[14px] text-white tabular-nums">{value}</div>
      <div className="text-[10px] text-white/40">{label}</div>
    </div>
  );
}

export function Achievement() {
  const objectives = useExperience((s) => s.objectives);
  const active = useExperience((s) => s.activeWorld);
  const allDone = LOGISTICS_STATIONS.every((s) => isObjectiveDone(objectives, "logistics", s.id));
  const prev = useRef(allDone);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const fresh = allDone && !prev.current;
    prev.current = allDone;
    if (!fresh || useExperience.getState().activeWorld !== "logistics") return;
    const t1 = setTimeout(() => setShow(true), 1800);
    const t2 = setTimeout(() => setShow(false), 7000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [allDone]);
  useEffect(() => {
    if (active !== "logistics") setShow(false);
  }, [active]);
  const m = chapters.logistics.metrics;
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-30 flex flex-col items-center justify-center text-center"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, filter: "blur(8px)" }}
          transition={{ duration: 1, ease }}
        >
          <div className="eyebrow text-[#7CF2C8]">Achievement unlocked · Udaan</div>
          <div className="mt-4 text-[clamp(56px,10vw,140px)] leading-none font-light tracking-[-0.05em] text-white text-glow">{m[0].value}</div>
          <div className="mt-3 text-xl font-light tracking-tight text-white/80">operational delay</div>
          <div className="hairline mt-8 w-56" />
          <div className="mt-4 text-sm text-white/50">
            and {m[1].value} {m[1].label} after stabilizing the warehouse management system
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function NextSector() {
  const phase = useExperience((s) => s.phase);
  const warping = useExperience((s) => s.warping);
  const worldId = useExperience((s) => s.activeWorld);
  const objectives = useExperience((s) => s.objectives);
  const world = worldById(worldId);
  const allDone = world.objectives.length > 0 && world.objectives.every((o) => isObjectiveDone(objectives, worldId, o.id));
  const next = nextReadyWorld(worldId);

  useEffect(() => {
    if (allDone) useExperience.getState().completeWorld(worldId);
  }, [allDone, worldId]);

  const visible = phase === "world" && !warping && allDone && !!next && worldId !== "origin";
  return (
    <AnimatePresence>
      {visible && next && (
        <motion.button
          key={worldId}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 2.5, duration: 0.8, ease } }}
          exit={{ opacity: 0, y: 6 }}
          onClick={() => useExperience.getState().travel(next, 0)}
          className="group glass fixed bottom-22 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full py-2.5 pr-4 pl-5 text-[13px] text-white md:bottom-24"
        >
          <span className="eyebrow text-white/45">Sector complete</span>
          <span className="h-3 w-px bg-white/15" />
          <span>
            Continue to <span style={{ color: worldById(next).accent }}>{worldById(next).title}</span>
          </span>
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export function ForgeConsole() {
  const online = useExperience((s) => isObjectiveDone(s.objectives, "forge", "core"));
  const fixed = useExperience((s) => isObjectiveDone(s.objectives, "forge", "autofix"));
  const runAutofix = useExperience((s) => s.runAutofix);
  const m = chapters.forge.metrics;
  const problems = fixed ? 0 : online ? 37 : 128;
  return (
    <ConsoleShell world="forge" title="ZPilot · language server">
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10.5px] text-white/40">Status</div>
          <div className={cn("mt-0.5 text-[13px]", online ? "text-cyan" : "text-[#FF7A66]")}>{online ? "Online in VS Code" : "Offline"}</div>
        </div>
        <div>
          <div className="text-[10.5px] text-white/40">Problems in workspace</div>
          <div className="mt-0.5 font-mono text-[13px] text-white tabular-nums">{problems}</div>
        </div>
      </div>
      <Meter value={fixed ? 1 : 0.55} accent="#FFB547" label="Developer productivity" right={fixed ? m[0].value : "baseline"} />
      <Meter value={fixed ? 0.6 : 1} accent={fixed ? "#5CE1FF" : "#FF7A48"} label="Bug turnaround time" right={fixed ? m[1].value : "baseline"} />
      <button
        onClick={runAutofix}
        disabled={!online || fixed}
        className={cn(
          "mt-4 w-full rounded-xl border px-3 py-2.5 text-left transition",
          fixed ? "border-cyan/30 bg-cyan/10" : online ? "border-[#FFB547]/40 hover:bg-[#FFB547]/10" : "cursor-not-allowed border-white/8 opacity-60",
        )}
      >
        <div className="text-[12.5px] text-white">{fixed ? "Workspace clean" : "Run auto-fix"}</div>
        <div className="mt-0.5 text-[10.5px] text-white/45">
          {fixed ? "Every flow validated and repaired" : online ? "Validate and repair every flow at once" : "Boot the ZPilot core first — click the robot"}
        </div>
      </button>
      <p className="mt-4 text-[12px] leading-relaxed text-white/50">{chapters.forge.highlights.join(" ")}</p>
      <Stack world="forge" />
    </ConsoleShell>
  );
}

export function ArchiveConsole() {
  const queryId = useExperience((s) => s.archiveQuery);
  const askedAt = useExperience((s) => s.archiveAt);
  const ask = useExperience((s) => s.askArchive);
  const traced = useExperience((s) => isObjectiveDone(s.objectives, "archive", "trace"));
  const [now, setNow] = useState(0);
  const [showTrace, setShowTrace] = useState(false);
  useEffect(() => {
    setShowTrace(false);
    const id = setInterval(() => setNow(performance.now() / 1000), 200);
    return () => clearInterval(id);
  }, [askedAt]);
  const q = ARCHIVE_QUERIES.find((x) => x.id === queryId);
  const t = now - askedAt;
  const T = QUERY_TIMING;
  const stage = !q
    ? null
    : t < T.toSearch
      ? "Routing the question through FastAPI → LangChain…"
      : t < T.toSearch + T.retrieve
        ? `Searching ${archiveBus.docs.toLocaleString()} documents in OpenSearch…`
        : t < T.answer
          ? "Reranking passages and generating an answer…"
          : null;
  return (
    <ConsoleShell world="archive" title="Ask the archive">
      <div className="mt-3 space-y-1.5">
        {ARCHIVE_QUERIES.map((x) => (
          <button
            key={x.id}
            onClick={() => ask(x.id)}
            className={cn(
              "w-full rounded-lg border px-3 py-2 text-left text-[12px] transition",
              x.id === queryId ? "border-[#B9A6FF]/50 bg-[#B9A6FF]/10 text-white" : "border-white/10 text-white/75 hover:border-white/25",
            )}
          >
            {x.question}
          </button>
        ))}
      </div>
      <div className="mt-3 min-h-20 rounded-xl border border-white/8 bg-white/3 p-3">
        {!q ? (
          <p className="text-[12px] text-white/55">Pick a question. Watch it travel through the pipeline, find the right documents, and come back as an answer.</p>
        ) : stage ? (
          <p className="flex items-center gap-2 text-[12px] text-white/70">
            <span className="size-1.5 animate-pulse rounded-full bg-[#B9A6FF]" /> {stage}
          </p>
        ) : showTrace ? (
          <div>
            <div className="eyebrow mb-2 text-white/40">OpenTelemetry trace · one request</div>
            <div className="space-y-1">
              {TRACE_SPANS.map((s) => (
                <div key={s.name} className="grid grid-cols-[92px_1fr] items-center gap-2 text-[10.5px]">
                  <span className="truncate text-white/55">{s.name}</span>
                  <span className="relative h-2.5 rounded-sm bg-white/5">
                    <span className="absolute inset-y-0 rounded-sm bg-[#B9A6FF]/70" style={{ left: `${s.start}%`, width: `${Math.max(2, s.end - s.start)}%` }} />
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10.5px] text-white/40">Every step of every question is traced, so slow or failing steps show up immediately.</p>
          </div>
        ) : (
          <div>
            <p className="text-[12.5px] leading-relaxed text-white/85">{q.answer}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {q.sources.map((s) => (
                <span key={s} className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/50">
                  {s}
                </span>
              ))}
            </div>
            <button
              onClick={() => {
                setShowTrace(true);
                useExperience.getState().completeObjective("archive", "trace");
              }}
              className="mt-3 text-[11.5px] text-[#B9A6FF] transition hover:text-white"
            >
              {traced ? "Open trace again →" : "Open trace →"}
            </button>
          </div>
        )}
      </div>
      <p className="mt-2 text-[10px] text-white/30">Example questions and documents are illustrative.</p>
      <Stack world="archive" />
    </ConsoleShell>
  );
}

export function FutureConsole() {
  const selected = useExperience((s) => s.futurePath);
  const setPath = useExperience((s) => s.setFuturePath);
  return (
    <ConsoleShell world="future" title="Paths ahead">
      <ul className="mt-3 space-y-1">
        {futurePaths.map((p) => {
          const on = p.id === selected;
          return (
            <li key={p.id}>
              <button
                onClick={() => setPath(on ? null : p.id)}
                className={cn("w-full rounded-lg px-2.5 py-1.5 text-left text-[12px] transition", on ? "bg-white/6 text-white" : "text-white/70 hover:bg-white/4 hover:text-white")}
              >
                <span className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full" style={{ background: PATH_COLORS[p.id], boxShadow: `0 0 8px ${PATH_COLORS[p.id]}` }} />
                  {p.label}
                </span>
                {on && (
                  <span className="mt-1 block pl-3.5 text-[11.5px] leading-relaxed text-white/55">
                    {p.note}
                    {p.href && (
                      <a href={p.href} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="ml-1 inline-flex items-center gap-0.5 text-cyan hover:text-white">
                        GitHub <ArrowUpRight className="size-3" />
                      </a>
                    )}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      <button
        onClick={() => {
          const s = useExperience.getState();
          s.completeObjective("future", "transmit");
          s.setPanel("transmit");
        }}
        className="mt-4 flex w-full items-center justify-between rounded-xl bg-holo px-4 py-2.5 text-[13px] font-medium text-void transition hover:bg-white"
      >
        Get in touch <ArrowRight className="size-4" />
      </button>
      <div className="mt-4 border-t border-white/5 pt-3">
        <div className="eyebrow text-white/35">Recognition</div>
        <ul className="mt-1.5 space-y-0.5 text-[11.5px] text-white/55">
          {awards.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </div>
    </ConsoleShell>
  );
}

export function TransmissionPanel() {
  const panel = useExperience((s) => s.panel);
  const setPanel = useExperience((s) => s.setPanel);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const open = panel === "transmit";
  const email = architect.links.email;
  const mailto = `mailto:${email}?subject=${encodeURIComponent(`Hello from ${name || "your portfolio"}`)}&body=${encodeURIComponent(msg)}`;
  const links = [
    { label: "GitHub", href: architect.links.github },
    { label: "LinkedIn", href: architect.links.linkedin },
    { label: "LeetCode", href: architect.links.leetcode },
  ];
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 grid place-items-center bg-void/55 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setPanel("none")}
        >
          <motion.div
            role="dialog"
            aria-label="Contact"
            initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 10, filter: "blur(6px)" }}
            transition={{ duration: 0.55, ease }}
            onClick={(e) => e.stopPropagation()}
            className="glass relative w-[min(480px,100%)] rounded-2xl p-6"
          >
            <button aria-label="Close" onClick={() => setPanel("none")} className="absolute top-4 right-4 text-white/40 transition hover:text-white">
              <X className="size-4" />
            </button>
            <div className="eyebrow text-cyan">Open a transmission</div>
            <h2 className="mt-3 text-[24px] leading-tight font-light tracking-tight text-white">Let&apos;s build the next system.</h2>
            <p className="mt-2 text-[13px] text-white/55">
              {architect.name} · {architect.title} · {architect.location}
            </p>
            <form
              className="mt-5 space-y-2.5"
              onSubmit={(e) => {
                e.preventDefault();
                window.location.href = mailto;
              }}
            >
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="Your name"
                className="w-full rounded-lg border border-white/10 bg-white/4 px-3 py-2 text-[13px] text-white placeholder:text-white/30 focus:border-cyan/40 focus:outline-none"
              />
              <textarea
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="What are you building?"
                rows={4}
                className="w-full resize-none rounded-lg border border-white/10 bg-white/4 px-3 py-2 text-[13px] text-white placeholder:text-white/30 focus:border-cyan/40 focus:outline-none"
              />
              <div className="flex gap-2">
                <button type="submit" className="flex-1 rounded-lg bg-holo px-4 py-2 text-[13px] font-medium text-void transition hover:bg-white">
                  Send via email
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(email);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1800);
                  }}
                  className="rounded-lg border border-white/10 px-3 py-2 text-[12px] text-white/70 transition hover:border-white/25 hover:text-white"
                >
                  {copied ? "Copied" : email}
                </button>
              </div>
            </form>
            <div className="mt-5 flex gap-4 border-t border-white/5 pt-4">
              {links.map((l) => (
                <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12.5px] text-white/60 transition hover:text-white">
                  {l.label} <ArrowUpRight className="size-3.5" />
                </a>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
