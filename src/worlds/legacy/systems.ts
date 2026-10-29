export const LEGACY_SYSTEMS = [
  { id: "deps", error: "Vulnerable dependency", severity: "Critical", fixed: "Patched" },
  { id: "endpoints", error: "Unsafe endpoint", severity: "Critical", fixed: "Hardened" },
  { id: "mvc", error: "Legacy Spring MVC service", severity: "Legacy", fixed: "Modernized" },
  { id: "frontend", error: "Outdated frontend stack", severity: "Legacy", fixed: "Rebuilt" },
  { id: "pipeline", error: "Advice generation degraded", severity: "Degraded", fixed: "Restored" },
] as const;
