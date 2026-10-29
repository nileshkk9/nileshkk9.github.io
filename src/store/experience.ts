import { create } from "zustand";
import { persist } from "zustand/middleware";
import { WORLDS, type WorldId } from "@/worlds/registry";

export type Phase = "boot" | "intro" | "world";
export type Quality = "high" | "mid" | "low";
export type Panel = "none" | "starmap" | "log" | "ai" | "help" | "transmit";
export type NexusMode = "continuous" | "batch";

type TravelRequest = { world: WorldId; shot: number; id: number };

type State = {
  phase: Phase;
  activeWorld: WorldId;
  shot: number;
  warping: boolean;
  travelRequest: TravelRequest | null;
  quality: Quality;
  reducedMotion: boolean;
  panel: Panel;
  activeArtifact: string | null;
  aiIntent: string | null;
  caption: string | null;

  introSeen: boolean;
  unlocked: WorldId[];
  completed: WorldId[];
  objectives: string[];
  collected: string[];

  nexusMode: NexusMode;
  nexusCapacity: boolean;
  dispatchAt: number;
  batchAt: number;

  routeStart: number | null;
  routeStats: RouteStats | null;

  onboarded: boolean;
  briefingOpen: boolean;
  /** Small screens show one bottom/top sheet at a time. */
  sheet: "briefing" | "console" | null;
  setSheet: (sheet: "briefing" | "console" | null) => void;
  muted: boolean;
  forgeAutofixAt: number;
  archiveQuery: string | null;
  archiveAt: number;
  futurePath: string | null;
};

export type RouteStats = { explored: number; hops: number; ms: number; km: number; manual: boolean };

type Actions = {
  setPhase: (p: Phase) => void;
  travel: (world: WorldId, shot?: number) => void;
  arrive: (world: WorldId, shot: number) => void;
  setWarping: (w: boolean) => void;
  setShot: (s: number) => void;
  setQuality: (q: Quality) => void;
  setReducedMotion: (r: boolean) => void;
  setPanel: (p: Panel) => void;
  togglePanel: (p: Panel) => void;
  openArtifact: (id: string | null) => void;
  collect: (id: string) => void;
  completeObjective: (world: WorldId, id: string) => void;
  completeWorld: (world: WorldId) => void;
  setAiIntent: (id: string | null) => void;
  setCaption: (c: string | null) => void;
  setNexusMode: (m: NexusMode) => void;
  setNexusCapacity: (c: boolean) => void;
  fireDispatch: () => void;
  fireBatch: () => void;
  setRouteStart: (n: number | null) => void;
  setRouteStats: (s: RouteStats | null) => void;
  resetProgress: () => void;
  setOnboarded: (v: boolean) => void;
  setMuted: (v: boolean) => void;
  setBriefingOpen: (v: boolean) => void;
  runAutofix: () => void;
  askArchive: (id: string) => void;
  setFuturePath: (id: string | null) => void;
};

let travelSeq = 0;

export const useExperience = create<State & Actions>()(
  persist(
    (set, get) => ({
      phase: "boot",
      activeWorld: "origin",
      shot: 0,
      warping: false,
      travelRequest: null,
      quality: "high",
      reducedMotion: false,
      panel: "none",
      activeArtifact: null,
      aiIntent: null,
      caption: null,

      introSeen: false,
      unlocked: ["origin"],
      completed: [],
      objectives: [],
      collected: [],

      nexusMode: "continuous",
      nexusCapacity: false,
      dispatchAt: -100,
      batchAt: -100,

      routeStart: null,
      routeStats: null,

      onboarded: false,
      briefingOpen: true,
      sheet: null,
      muted: false,
      forgeAutofixAt: -100,
      archiveQuery: null,
      archiveAt: -100,
      futurePath: null,

      setPhase: (phase) => set({ phase, ...(phase === "world" ? { introSeen: true } : {}) }),
      travel: (world, shot = 0) => {
        const { activeWorld, phase, warping } = get();
        if (warping) return;
        if (world === activeWorld && phase === "world") {
          set({ shot });
          return;
        }
        set({ travelRequest: { world, shot, id: ++travelSeq }, activeArtifact: null });
      },
      arrive: (world, shot) =>
        set((s) => ({
          sheet: null,
          activeWorld: world,
          shot,
          phase: "world",
          introSeen: true,
          unlocked: s.unlocked.includes(world) ? s.unlocked : [...s.unlocked, world],
        })),
      setWarping: (warping) => set({ warping }),
      setShot: (shot) => set({ shot }),
      setQuality: (quality) => set({ quality }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      setPanel: (panel) => set({ panel }),
      togglePanel: (p) => set((s) => ({ panel: s.panel === p ? "none" : p })),
      openArtifact: (activeArtifact) => set({ activeArtifact }),
      collect: (id) =>
        set((s) => (s.collected.includes(id) ? { activeArtifact: id } : { collected: [...s.collected, id], activeArtifact: id })),
      completeObjective: (world, id) =>
        set((s) => {
          const key = `${world}:${id}`;
          return s.objectives.includes(key) ? s : { objectives: [...s.objectives, key] };
        }),
      completeWorld: (world) =>
        set((s) => {
          if (s.completed.includes(world)) return s;
          const i = WORLDS.findIndex((w) => w.id === world);
          const next = WORLDS[i + 1]?.id;
          return {
            completed: [...s.completed, world],
            unlocked: next && !s.unlocked.includes(next) ? [...s.unlocked, next] : s.unlocked,
          };
        }),
      setAiIntent: (aiIntent) => set({ aiIntent }),
      setCaption: (caption) => set({ caption }),
      setNexusMode: (nexusMode) => {
        set({ nexusMode });
        get().completeObjective("nexus", nexusMode);
        if (nexusMode === "batch") set({ batchAt: performance.now() / 1000 });
      },
      setNexusCapacity: (nexusCapacity) => {
        set({ nexusCapacity });
        if (nexusCapacity) get().completeObjective("nexus", "capacity");
      },
      fireDispatch: () => {
        set({ dispatchAt: performance.now() / 1000 });
        get().completeObjective("nexus", "dispatch");
      },
      fireBatch: () => set({ batchAt: performance.now() / 1000 }),
      setRouteStart: (routeStart) => set({ routeStart }),
      setRouteStats: (routeStats) => set({ routeStats }),
      resetProgress: () =>
        set({ unlocked: ["origin"], completed: [], objectives: [], collected: [], introSeen: false, onboarded: false }),
      setOnboarded: (onboarded) => set({ onboarded }),
      setMuted: (muted) => set({ muted }),
      setBriefingOpen: (briefingOpen) => set({ briefingOpen }),
      setSheet: (sheet) => set({ sheet }),
      runAutofix: () => {
        set({ forgeAutofixAt: performance.now() / 1000 });
        get().completeObjective("forge", "autofix");
      },
      askArchive: (id) => {
        set({ archiveQuery: id, archiveAt: performance.now() / 1000, ...(get().shot === 0 ? { shot: 1 } : {}) });
        get().completeObjective("archive", "query");
      },
      setFuturePath: (futurePath) => {
        set({ futurePath });
        if (futurePath) get().completeObjective("future", "path");
      },
    }),
    {
      name: "systems-architect",
      partialize: (s) => ({
        introSeen: s.introSeen,
        unlocked: s.unlocked,
        completed: s.completed,
        objectives: s.objectives,
        collected: s.collected,
        onboarded: s.onboarded,
        briefingOpen: s.briefingOpen,
        muted: s.muted,
      }),
    },
  ),
);

export const isObjectiveDone = (objectives: string[], world: WorldId, id: string) =>
  objectives.includes(`${world}:${id}`);

export const useObjective = (world: WorldId, id: string) =>
  useExperience((s) => s.objectives.includes(`${world}:${id}`));
