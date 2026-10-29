import gsap from "gsap";
import { isObjectiveDone, useExperience } from "@/store/experience";

export const LOGISTICS_STATIONS = [
  { id: "inbound", title: "Inbound Flow", jam: "Dock congestion", fix: "Flowing", x: -72 },
  { id: "ops", title: "Warehouse Operations", jam: "Non-FCR repeat issues", fix: "Stable", x: 0 },
  { id: "outbound", title: "Outbound Flow", jam: "Dispatch backlog", fix: "Flowing", x: 72 },
] as const;

/** Jam level per station (1 = jammed). Owned by the mounted world; the HUD and beacons both drive it. */
export const logisticsBus = { jam: null as { value: number[] } | null };

export function optimizeStation(index: number) {
  const st = LOGISTICS_STATIONS[index];
  const s = useExperience.getState();
  if (isObjectiveDone(s.objectives, "logistics", st.id)) return;
  s.completeObjective("logistics", st.id);
  const jam = logisticsBus.jam;
  if (!jam) return;
  const proxy = { v: jam.value[index] };
  gsap.to(proxy, {
    v: 0,
    duration: 2.6,
    ease: "power2.inOut",
    onUpdate: () => {
      jam.value[index] = proxy.v;
    },
  });
}
