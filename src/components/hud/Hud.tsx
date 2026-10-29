"use client";

import { useEffect } from "react";
import { useExperience } from "@/store/experience";
import { worldById } from "@/worlds/registry";
import { BootTerminal } from "./BootTerminal";
import { Onboarding } from "./Onboarding";
import { AudioDirector } from "@/audio/AudioDirector";
import { Caption, FlashOverlay, IntroSkip, Objectives, ShotRail, TopBar, WorldTitle } from "./Chrome";
import { ArchitectConsole, ArtifactCard, MissionLog, NexusConsole, StarMap } from "./Panels";
import { Achievement, ArchiveConsole, ForgeConsole, FutureConsole, LegacyConsole, LogisticsConsole, NextSector, RouteConsole, TransmissionPanel } from "./WorldConsoles";

function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useExperience.getState();
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if ((e.key === "s" || e.key === "S") && !e.metaKey && !e.ctrlKey) {
        s.setMuted(!s.muted);
        return;
      }
      if (s.phase !== "world") return;
      const shots = worldById(s.activeWorld).shots.length;

      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        e.preventDefault();
        s.togglePanel("ai");
      } else if (e.key === "?") {
        s.togglePanel("help");
      } else if (e.key === "m" || e.key === "M") {
        s.togglePanel("starmap");
      } else if (e.key === "`" || e.key === "~") {
        s.togglePanel("log");
      } else if (e.key === "Escape") {
        if (s.activeArtifact) s.openArtifact(null);
        else s.setPanel("none");
      } else if (e.key === "ArrowRight" && shots) {
        s.setShot((s.shot + 1) % shots);
      } else if (e.key === "ArrowLeft" && shots) {
        s.setShot((s.shot - 1 + shots) % shots);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

export function Hud() {
  useShortcuts();
  return (
    <>
      <AudioDirector />
      <TopBar />
      <Objectives />
      <ShotRail />
      <WorldTitle />
      <NexusConsole />
      <LegacyConsole />
      <LogisticsConsole />
      <RouteConsole />
      <ForgeConsole />
      <ArchiveConsole />
      <FutureConsole />
      <NextSector />
      <Achievement />
      <ArtifactCard />
      <Caption />
      <IntroSkip />
      <ArchitectConsole />
      <StarMap />
      <MissionLog />
      <Onboarding />
      <TransmissionPanel />
      <FlashOverlay />
      <BootTerminal />
    </>
  );
}
