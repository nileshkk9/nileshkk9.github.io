import Fuse from "fuse.js";
import type { WorldId } from "@/worlds/registry";

export type Intent = {
  id: string;
  world: WorldId;
  shot: number;
  prompt: string;
  keywords: string[];
  answer: string[];
};

export const INTENTS: Intent[] = [
  {
    id: "scheduling",
    world: "nexus",
    shot: 1,
    prompt: "How did Nilesh build the scheduling platform?",
    keywords: ["scheduling", "scheduler", "schedule", "zinier", "optimization platform", "manpower", "workforce", "allocation", "kafka", "spring boot"],
    answer: [
      "This is the Optimization Nexus — Zinier's scheduling platform, which Nilesh designed and built.",
      "It allocates field workers to tasks at scale, on Java Spring Boot services running on Kubernetes and AWS, coordinated through Kafka events.",
      "He led the performance tuning and reliability work that made high-throughput, event-driven execution possible, cutting latency and hours of manual planning.",
      "Use the controls to switch between continuous and batch scheduling.",
    ],
  },
  {
    id: "batch",
    world: "nexus",
    shot: 0,
    prompt: "Batch vs continuous scheduling?",
    keywords: ["batch", "continuous", "real time", "realtime", "difference", "modes"],
    answer: [
      "Continuous scheduling assigns each task the moment it arrives. Watch the amber requests stream straight to cyan workers.",
      "Batch scheduling collects a window of demand, then solves it all at once for a better global plan. The queue links to the engine, then releases in one synchronized wave.",
      "The platform supports both, so operations teams can trade latency for optimality.",
    ],
  },
  {
    id: "capacity",
    world: "nexus",
    shot: 3,
    prompt: "What is capacity planning?",
    keywords: ["capacity", "planning", "forecast", "multithreading", "concurrency", "heatmap", "demand"],
    answer: [
      "Capacity planning answers one question: will there be enough people, in the right places, for tomorrow's demand?",
      "Nilesh built the algorithm with Java multithreading and concurrent execution, which made scheduling computation far faster and removed operational bottlenecks.",
      "On the map, cyan districts have spare capacity and amber ones are over-subscribed.",
    ],
  },
  {
    id: "dispatch",
    world: "nexus",
    shot: 0,
    prompt: "Tell me about bulk dispatch.",
    keywords: ["dispatch", "bulk", "sqs", "queue", "throughput", "crash", "fault tolerant"],
    answer: [
      "Bulk Dispatch pushes very large volumes of task assignments out to the field.",
      "Nilesh rebuilt it as a fault-tolerant pipeline on AWS SQS with Spring Boot consumers. The server crashes stopped, and assignment throughput rose by 40%.",
      "Press Bulk Dispatch to watch the surge.",
    ],
  },
  {
    id: "origin",
    world: "origin",
    shot: 0,
    prompt: "Who is Nilesh?",
    keywords: ["who", "nilesh", "about", "background", "start", "story", "kolkata", "intro"],
    answer: [
      "Nilesh Kumar Pandey is a Senior Software Engineer in Bangalore, originally from Kolkata.",
      "For 5+ years he has built distributed systems, optimization engines, routing platforms, developer tooling and AI infrastructure.",
      "This island is where it started. Recover the artifacts to learn more.",
    ],
  },
  {
    id: "education",
    world: "origin",
    shot: 1,
    prompt: "Where did he study?",
    keywords: ["education", "college", "nsec", "university", "degree", "btech", "study", "graduate"],
    answer: [
      "Netaji Subhash Engineering College, Kolkata — B.Tech in Information Technology, 2016–2020, YGPA 8.43.",
    ],
  },
  {
    id: "research",
    world: "origin",
    shot: 2,
    prompt: "What research has he published?",
    keywords: ["research", "paper", "publication", "arxiv", "intrusion", "peafowl", "evolutionary", "ids"],
    answer: [
      "\"Feature Selection using Peafowl Mating Concept for Intrusion Detection Systems\" — an evolutionary algorithm that picks out the features that matter for detecting network intrusions.",
      "It's on arXiv. Optimization was his instinct well before it was his job.",
    ],
  },
  {
    id: "certs",
    world: "origin",
    shot: 3,
    prompt: "Which certifications does he hold?",
    keywords: ["certification", "certified", "oracle", "java", "ocp", "oca", "nptel", "cloud computing"],
    answer: [
      "Oracle Certified Professional and Oracle Certified Associate, both Java SE 8 Programmer, plus NPTEL Cloud Computing.",
      "They are the crystals orbiting this island.",
    ],
  },
  {
    id: "cp",
    world: "origin",
    shot: 3,
    prompt: "Does he do competitive programming?",
    keywords: ["competitive", "leetcode", "dsa", "algorithms", "data structures", "problem solving"],
    answer: [
      "Yes — the Logic Prism among the artifacts. Years of LeetCode sharpened the algorithmic instinct behind every optimizer he built later.",
    ],
  },
  {
    id: "legacy",
    world: "legacy",
    shot: 0,
    prompt: "What did he do at Infosys?",
    keywords: ["infosys", "legacy", "spring mvc", "citibank", "security", "vulnerability", "modernize", "modernization"],
    answer: [
      "This is Legacy System City — Infosys, 2020 to 2022, where Nilesh worked as a Power Programmer.",
      "He modernized the legacy frontend of Citibank's Advice Generation System and remediated critical vulnerabilities in its Java Spring MVC services.",
      "Click each failing district to repair it, and watch the city light up.",
    ],
  },
  {
    id: "udaan",
    world: "logistics",
    shot: 0,
    prompt: "What did he build at Udaan?",
    keywords: ["udaan", "warehouse", "logistics", "supply chain", "inbound", "outbound", "wms", "kotlin"],
    answer: [
      "The Logistics Realm — Udaan, 2022. Nilesh optimized inbound supply-chain workflows across warehouses, cutting operational delays by 70%.",
      "He also refactored and stabilized Kotlin services in a high-volume warehouse management system, working alongside the on-ground operations teams. Repeat issues fell by 70–80%.",
      "Unjam the inbound flow, warehouse operations and the outbound flow to see what that felt like.",
    ],
  },
  {
    id: "routing",
    world: "routeverse",
    shot: 0,
    prompt: "Tell me about the routing engine.",
    keywords: ["routing", "route", "maps", "map", "eta", "pathfinding", "google maps", "third party", "cost"],
    answer: [
      "RouteVerse — one of Nilesh's projects at Zinier. He built an in-house routing and optimization platform to replace third-party map APIs, deployed on Kubernetes across regions.",
      "Path computation and ETA models were tuned per region. External API dependency and cost fell by 60–70%, while routing accuracy and reliability improved.",
      "Break the chains to bring the engine online, then click two cities to compute a route yourself.",
    ],
  },
  {
    id: "zpilot",
    world: "forge",
    shot: 0,
    prompt: "What is ZPilot?",
    keywords: ["zpilot", "lsp", "language server", "vscode", "vs code", "extension", "developer productivity", "tooling", "ide"],
    answer: [
      "ZPilot is another of Nilesh's Zinier projects: a Language Server Protocol–based VS Code extension with real-time validation, auto-fixes and intelligent suggestions for the platform's developers.",
      "It raised developer productivity by 45% and cut bug turnaround time by 40%.",
      "Boot the robot, click a red code block to see a live diagnostic, then run an auto-fix.",
    ],
  },
  {
    id: "rag",
    world: "archive",
    shot: 0,
    prompt: "How does his RAG platform work?",
    keywords: ["rag", "retrieval", "langchain", "opensearch", "llm", "ai", "vector", "embedding", "observability", "opentelemetry", "fastapi"],
    answer: [
      "The Neural Archive — Nilesh's RAG platform at Zinier. FastAPI and LangChain over OpenSearch, containerized with Docker and running on Kubernetes.",
      "Distributed observability uses OpenTelemetry, Loki and Tempo, so a single trace follows a question end to end. That made diagnosis faster and cut field technicians' troubleshooting time.",
      "Each star is a document. Ask one of the example questions and follow it to the answer.",
    ],
  },
  {
    id: "future",
    world: "future",
    shot: 0,
    prompt: "What is he building next?",
    keywords: ["future", "next", "agents", "mcp", "autonomous", "open source", "side projects", "ambition", "goals"],
    answer: [
      "AI agents, MCP systems and autonomous software: multi-agent LLM trading in stock-agent, NapLocker shipped through Homebrew, and products like HackerGrade.",
      "Each portal in this wormhole is one path. Click one to read more.",
    ],
  },
  {
    id: "contact",
    world: "future",
    shot: 2,
    prompt: "How do I contact him?",
    keywords: ["contact", "email", "hire", "reach", "linkedin", "github", "talk", "connect", "resume"],
    answer: [
      "Open a channel: nileshkk9@gmail.com, or github.com/nileshkk9.",
      "Click the beacon at the centre of the portals, or “Get in touch” in the panel, to send a message. The Résumé view (press `) has every link.",
    ],
  },
];

const fuse = new Fuse(INTENTS, {
  keys: [
    { name: "keywords", weight: 0.7 },
    { name: "prompt", weight: 0.3 },
  ],
  threshold: 0.42,
  ignoreLocation: true,
  includeScore: true,
});

const reCache = new Map<string, RegExp>();
function keywordRe(k: string) {
  if (!reCache.has(k)) {
    const esc = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    reCache.set(k, new RegExp(`\\b${esc}${k.length <= 3 ? "\\b" : ""}`));
  }
  return reCache.get(k)!;
}

export function resolveIntent(query: string): Intent | null {
  const q = query.toLowerCase().trim();
  if (!q) return null;
  let best: Intent | null = null;
  let bestScore = 0;
  for (const intent of INTENTS) {
    const score = intent.keywords.reduce((s, k) => (keywordRe(k).test(q) ? s + k.split(" ").length + 1 : s), 0);
    if (score > bestScore) {
      best = intent;
      bestScore = score;
    }
  }
  if (best) return best;
  const words = q.split(/\s+/).filter((w) => w.length > 3);
  for (const w of words) {
    const hit = fuse.search(w)[0];
    if (hit && (hit.score ?? 1) < 0.3) return hit.item;
  }
  return fuse.search(q)[0]?.item ?? null;
}

export const intentById = (id: string) => INTENTS.find((i) => i.id === id) ?? null;
