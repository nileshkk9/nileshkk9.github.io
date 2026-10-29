export type WorldId =
  | "origin"
  | "legacy"
  | "logistics"
  | "nexus"
  | "routeverse"
  | "forge"
  | "archive"
  | "future";

export type Vec3 = [number, number, number];

export type Shot = {
  id: string;
  label: string;
  position: Vec3;
  target: Vec3;
  fov?: number;
};

export type Objective = { id: string; label: string; hint: string };

export type WorldMeta = {
  id: WorldId;
  index: number;
  code: string;
  title: string;
  /** Short name used on the journey timeline. */
  chapter: string;
  /** Career chapter this world belongs to; consecutive worlds with the same employer are one chapter. */
  employer: string;
  /** Set when the world is one project inside a longer tenure. */
  project?: string;
  org: string;
  role: string;
  era: string;
  tagline: string;
  /** What this world means in real life, in one or two plain sentences. */
  story: string;
  /** What the visitor should do here. */
  howTo: string;
  accent: string;
  fog: string;
  ready: boolean;
  shots: Shot[];
  objectives: Objective[];
};

export const WORLDS: WorldMeta[] = [
  {
    id: "origin",
    index: 1,
    code: "SECTOR 01",
    title: "The Origin",
    chapter: "Education",
    employer: "Education",
    org: "NSEC, Kolkata",
    role: "Student · B.Tech IT",
    era: "2016 — 2020",
    tagline: "Every system begins as a question.",
    story: "Where it started: an IT degree in Kolkata, a published research paper, Java certifications and years of competitive programming.",
    howTo: "Click the glowing crystals floating around the island. Each one is a real achievement.",
    accent: "#5CE1FF",
    fog: "#03060c",
    ready: true,
    shots: [
      { id: "overview", label: "Island", position: [26, 12, 30], target: [0, 1, 0] },
      { id: "campus", label: "Campus", position: [-9, 5, 11], target: [-3, 2.5, 0] },
      { id: "lab", label: "Research Lab", position: [12, 5, -4], target: [5, 2, -4] },
      { id: "artifacts", label: "Artifacts", position: [0, 20, 22], target: [0, 2, 0] },
      { id: "gate", label: "Gate", position: [0, 4, 20], target: [0, 4, 9] },
    ],
    objectives: [
      { id: "collect", label: "Recover the 6 artifacts", hint: "Click the crystals orbiting the island." },
      { id: "gate", label: "Open the gate", hint: "Click the glowing ring at the front of the island." },
    ],
  },
  {
    id: "legacy",
    index: 2,
    code: "SECTOR 02",
    title: "Legacy System City",
    chapter: "Infosys",
    employer: "Infosys",
    org: "Infosys",
    role: "Power Programmer",
    era: "2020 — 2022",
    tagline: "Old systems don't die. They wait to be rebuilt.",
    story: "First job. At Infosys, Nilesh modernized Citibank's ageing Advice Generation System and fixed critical security flaws in its Java services.",
    howTo: "The city is running on broken software. Click each red marker to repair that district.",
    accent: "#FFB547",
    fog: "#0a0705",
    ready: true,
    shots: [
      { id: "overview", label: "City", position: [118, 74, 118], target: [0, 12, 0], fov: 42 },
      { id: "core", label: "Advice Engine", position: [30, 34, 34], target: [0, 30, 0] },
      { id: "street", label: "Street Level", position: [-74, 5, 0.5], target: [0, 26, 0], fov: 58 },
      { id: "skyline", label: "Skyline", position: [-130, 40, -50], target: [0, 18, 0], fov: 38 },
    ],
    objectives: [
      { id: "deps", label: "Patch vulnerable dependencies", hint: "Click the red “Vulnerable dependency” marker." },
      { id: "endpoints", label: "Harden exposed endpoints", hint: "Click the red “Unsafe endpoint” marker." },
      { id: "mvc", label: "Modernize Spring MVC services", hint: "Click the “Legacy Spring MVC service” marker." },
      { id: "frontend", label: "Rebuild the legacy frontend", hint: "Click the “Outdated frontend stack” marker." },
      { id: "pipeline", label: "Restore the advice pipeline", hint: "Click the “Advice generation degraded” marker." },
    ],
  },
  {
    id: "logistics",
    index: 3,
    code: "SECTOR 03",
    title: "The Logistics Realm",
    chapter: "Udaan",
    employer: "Udaan",
    org: "Udaan",
    role: "Application Developer",
    era: "2022",
    tagline: "A continent that never stops moving.",
    story: "At Udaan, India's B2B marketplace, Nilesh reworked warehouse backend services so goods moved faster — operational delays fell by 70%.",
    howTo: "Packages are piling up. Click the red beacons, or use the panel on the right, to unjam each part of the warehouse.",
    accent: "#7CF2C8",
    fog: "#030a08",
    ready: true,
    shots: [
      { id: "overview", label: "Continent", position: [0, 105, 135], target: [0, 0, 0], fov: 42 },
      { id: "inbound", label: "Inbound", position: [-122, 46, 72], target: [-62, 8, 0] },
      { id: "hub", label: "Sortation Hub", position: [22, 34, 48], target: [0, 6, 0] },
      { id: "outbound", label: "Outbound", position: [122, 46, 72], target: [62, 8, 0] },
    ],
    objectives: [
      { id: "inbound", label: "Unjam the inbound flow", hint: "Click the “Inbound Flow” beacon on the left." },
      { id: "ops", label: "Stabilize warehouse operations", hint: "Click the beacon above the central hub." },
      { id: "outbound", label: "Clear the outbound flow", hint: "Click the “Outbound Flow” beacon on the right." },
    ],
  },
  {
    id: "nexus",
    index: 4,
    code: "SECTOR 04",
    title: "Optimization Nexus",
    chapter: "Scheduling",
    employer: "Zinier",
    project: "Scheduling platform",
    org: "Zinier",
    role: "SDE 2",
    era: "2022 — Present",
    tagline: "Ten thousand workers. One plan. Recomputed every second.",
    story: "Nilesh joined Zinier, a field-service platform, in 2022. His main work: the scheduling platform that assigns technicians to jobs. Each cyan dot is a worker; each amber spark is a task.",
    howTo: "Use the panel on the right: switch scheduling modes, open capacity planning and fire a bulk dispatch.",
    accent: "#5CE1FF",
    fog: "#02050a",
    ready: true,
    shots: [
      { id: "overview", label: "City", position: [95, 80, 95], target: [0, 0, 0], fov: 42 },
      { id: "engine", label: "Scheduling Engine", position: [26, 22, 30], target: [0, 14, 0] },
      { id: "street", label: "Street Level", position: [-46, 5, 22], target: [-10, 6, -8], fov: 55 },
      { id: "capacity", label: "Capacity Map", position: [0, 175, 1], target: [0, 0, 0], fov: 50 },
    ],
    objectives: [
      { id: "continuous", label: "Watch continuous scheduling", hint: "Tasks are assigned the instant they arrive." },
      { id: "batch", label: "Trigger a batch run", hint: "Press “Batch” in the panel on the right." },
      { id: "capacity", label: "Open capacity planning", hint: "Press “Capacity planning” in the panel." },
      { id: "dispatch", label: "Fire a bulk dispatch", hint: "Press “Bulk dispatch” in the panel." },
    ],
  },
  {
    id: "routeverse",
    index: 5,
    code: "SECTOR 05",
    title: "RouteVerse",
    chapter: "Routing",
    employer: "Zinier",
    project: "Routing engine",
    org: "Zinier",
    role: "SDE 2",
    era: "2022 — Present",
    tagline: "Break the chains. Compute your own roads.",
    story: "Also at Zinier: every route used to be bought from a third-party maps API. Nilesh built an in-house routing engine that replaced it, cutting that cost by 60–70%.",
    howTo: "Click the red chains to cut the dependency. Then click any two cities on the planet to compute a route.",
    accent: "#8AB4FF",
    fog: "#03040c",
    ready: true,
    shots: [
      { id: "overview", label: "Planet", position: [14, 10, 130], target: [-22, 10, -6], fov: 44 },
      { id: "chains", label: "Dependency", position: [-38, 36, 62], target: [-50, 14, -10] },
      { id: "route", label: "Route Engine", position: [44, 46, 58], target: [0, 0, 0] },
      { id: "costs", label: "Cost Towers", position: [104, 6, 66], target: [72, -6, 18] },
    ],
    objectives: [
      { id: "chains", label: "Break the third-party chains", hint: "Click the red chains or the black monolith." },
      { id: "route", label: "Compute a route between two cities", hint: "Click one city on the planet, then another." },
      { id: "costs", label: "Inspect the cost collapse", hint: "Open the “Cost Towers” view in the bottom bar." },
    ],
  },
  {
    id: "forge",
    index: 6,
    code: "SECTOR 06",
    title: "Developer Forge",
    chapter: "ZPilot",
    employer: "Zinier",
    project: "ZPilot",
    org: "Zinier",
    role: "SDE 2",
    era: "2022 — Present",
    tagline: "Code enters. Better code leaves.",
    story: "Also at Zinier: ZPilot, a VS Code extension Nilesh built that checks the platform's code as developers type and fixes mistakes automatically.",
    howTo: "Code flows left to right through ZPilot. Click the robot to boot it, click a red code block, then run an auto-fix.",
    accent: "#FFB547",
    fog: "#0a0604",
    ready: true,
    shots: [
      { id: "overview", label: "Forge", position: [0, 15, 44], target: [0, 5, 0], fov: 46 },
      { id: "core", label: "ZPilot Core", position: [9, 9, 15], target: [0, 7.5, -3] },
      { id: "line", label: "Assembly Line", position: [-30, 6, 14], target: [-6, 2, 0], fov: 50 },
      { id: "output", label: "Clean Output", position: [32, 7, 14], target: [10, 2, 0], fov: 50 },
    ],
    objectives: [
      { id: "core", label: "Boot the ZPilot core", hint: "Click the robot standing over the conveyor." },
      { id: "validate", label: "Catch a bug in real time", hint: "Click any red code block on the conveyor." },
      { id: "autofix", label: "Run an auto-fix sweep", hint: "Press “Run auto-fix” in the panel on the right." },
    ],
  },
  {
    id: "archive",
    index: 7,
    code: "SECTOR 07",
    title: "Neural Archive",
    chapter: "RAG",
    employer: "Zinier",
    project: "RAG platform",
    org: "Zinier",
    role: "SDE 2",
    era: "2022 — Present",
    tagline: "Every answer is a path through the stars.",
    story: "Also at Zinier: field technicians ask questions in plain language. Nilesh's RAG platform finds the right manuals among thousands of documents and answers with sources.",
    howTo: "Each star is a document. Ask a question from the panel on the right and follow how the answer is found.",
    accent: "#B9A6FF",
    fog: "#05030c",
    ready: true,
    shots: [
      { id: "overview", label: "Archive", position: [0, 24, 62], target: [0, -2, 0], fov: 50 },
      { id: "pipeline", label: "Pipeline", position: [0, 30, 34], target: [0, 0, 0], fov: 50 },
      { id: "core", label: "Answer Core", position: [10, 4, 16], target: [0, 0, 0] },
    ],
    objectives: [
      { id: "query", label: "Ask the archive a question", hint: "Pick a question in the panel on the right." },
      { id: "trace", label: "Follow the trace", hint: "Press “Open trace” after the answer arrives." },
      { id: "stack", label: "Inspect the platform stack", hint: "Click any labelled node in the ring." },
    ],
  },
  {
    id: "future",
    index: 8,
    code: "SECTOR ∞",
    title: "The Infinite Future",
    chapter: "Future",
    employer: "What's next",
    org: "The road ahead",
    role: "Where this is heading",
    era: "Next",
    tagline: "Nothing built yet. Only possibilities.",
    story: "The road ahead: AI agents, MCP systems, open source and products — the directions Nilesh is building towards, and how to reach him.",
    howTo: "Click any glowing portal to explore a path. When you're ready, open a transmission to get in touch.",
    accent: "#E8F1FF",
    fog: "#020205",
    ready: true,
    shots: [
      { id: "tunnel", label: "Wormhole", position: [0, 1.5, 40], target: [0, 0, -100], fov: 55 },
      { id: "paths", label: "Paths", position: [0, 0, -62], target: [0, 0, -120], fov: 58 },
      { id: "transmit", label: "Transmission", position: [0, 2, -98], target: [0, 0, -122], fov: 50 },
    ],
    objectives: [
      { id: "path", label: "Explore a future path", hint: "Click one of the glowing portals." },
      { id: "transmit", label: "Open a transmission", hint: "Click the beacon at the centre, or press “Get in touch”." },
    ],
  },
];

export const worldById = (id: WorldId) => WORLDS.find((w) => w.id === id)!;

/** Worlds grouped into career chapters, in order (Education, Infosys, Udaan, Zinier, What's next). */
export const CHAPTERS = WORLDS.reduce<{ employer: string; worlds: WorldMeta[] }[]>((acc, w) => {
  const last = acc[acc.length - 1];
  if (last && last.employer === w.employer) last.worlds.push(w);
  else acc.push({ employer: w.employer, worlds: [w] });
  return acc;
}, []);

export function chapterOf(id: WorldId) {
  const number = CHAPTERS.findIndex((c) => c.worlds.some((w) => w.id === id));
  const chapter = CHAPTERS[number];
  return {
    number: number + 1,
    total: CHAPTERS.length,
    employer: chapter.employer,
    era: chapter.worlds[0].era,
    project: chapter.worlds.findIndex((w) => w.id === id) + 1,
    projects: chapter.worlds.length,
  };
}

/** e.g. "Chapter 4 of 5 · Project 2 of 4" */
export function chapterLabel(id: WorldId) {
  const c = chapterOf(id);
  const base = `Chapter ${c.number} of ${c.total}`;
  return c.projects > 1 ? `${base} · Project ${c.project} of ${c.projects}` : base;
}

export const nextReadyWorld = (id: WorldId): WorldId | null => {
  const i = WORLDS.findIndex((w) => w.id === id);
  return WORLDS.slice(i + 1).find((w) => w.ready)?.id ?? null;
};
