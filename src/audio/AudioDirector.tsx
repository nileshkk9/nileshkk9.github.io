"use client";

import { useEffect } from "react";
import { useExperience } from "@/store/experience";
import { audio } from "./engine";

/** Bridges experience state to the procedural sound engine. Renders nothing. */
export function AudioDirector() {
  useEffect(() => {
    const unlock = () => {
      if (!useExperience.getState().muted) audio.unlock();
    };
    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement | null)?.closest("button, a")) audio.click();
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    window.addEventListener("click", onClick);

    const s0 = useExperience.getState();
    audio.setMuted(s0.muted);
    // Browsers that already trust this site let audio start before any gesture; others wait for the first tap or key.
    if (!s0.muted) audio.unlock();
    audio.setWorld(s0.phase === "world" ? s0.activeWorld : "intro");

    const unsub = useExperience.subscribe((s, prev) => {
      if (s.muted !== prev.muted) {
        if (!s.muted) audio.unlock();
        audio.setMuted(s.muted);
      }
      if (s.phase === "world" && (s.activeWorld !== prev.activeWorld || prev.phase !== "world")) audio.setWorld(s.activeWorld);
      if (s.warping && !prev.warping) audio.warp();
      if (s.completed.length > prev.completed.length) audio.fanfare();
      else if (s.objectives.length > prev.objectives.length || s.collected.length > prev.collected.length) audio.chime();
      if (s.panel !== prev.panel && s.panel !== "none") audio.panel();
    });

    return () => {
      unsub();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("click", onClick);
    };
  }, []);
  return null;
}
