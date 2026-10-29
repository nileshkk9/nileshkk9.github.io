export const architect = {
  name: "Nilesh Kumar Pandey",
  shortName: "Nilesh",
  title: "Senior Software Engineer",
  focus: ["Distributed Systems", "Optimization Engines", "Routing", "Developer Tooling", "AI Infrastructure"],
  location: "Bangalore, India",
  origin: "Kolkata, India",
  summary:
    "Backend-focused full stack engineer with 5+ years building scalable distributed systems, developer tooling, cloud-native platforms and AI-powered automation.",
  links: {
    email: "nileshkk9@gmail.com",
    github: "https://github.com/nileshkk9",
    linkedin: "https://www.linkedin.com/in/nileshkk9",
    leetcode: "https://leetcode.com/nileshkk9",
  },
} as const;

export type Artifact = {
  id: string;
  name: string;
  kind: string;
  year: string;
  inscription: string;
  detail: string;
  href?: string;
};

export const originArtifacts: Artifact[] = [
  {
    id: "nsec",
    name: "Netaji Subhash Engineering College",
    kind: "Foundation Stone",
    year: "2016 — 2020",
    inscription: "B.Tech, Information Technology. YGPA 8.43.",
    detail: "Four years in Kolkata where data structures, networks and systems first clicked into place.",
  },
  {
    id: "arxiv",
    name: "Peafowl Mating Feature Selection",
    kind: "Research Codex",
    year: "Published",
    inscription: "Feature Selection using Peafowl Mating Concept for Intrusion Detection Systems.",
    detail: "An evolutionary algorithm that selects the features that matter for detecting network intrusions. Optimization, before it became a career.",
    href: "https://arxiv.org",
  },
  {
    id: "ocp",
    name: "Oracle Certified Professional",
    kind: "Ancient Crystal",
    year: "Java SE 8 Programmer",
    inscription: "This artifact unlocked enterprise-scale development.",
    detail: "Deep command of the JVM, concurrency and the Java language that would later power scheduling engines.",
  },
  {
    id: "oca",
    name: "Oracle Certified Associate",
    kind: "Seed Crystal",
    year: "Java SE 8 Programmer",
    inscription: "The first key. Fundamentals, forged into certainty.",
    detail: "The base layer of the Java stack: types, collections, exceptions, the object model.",
  },
  {
    id: "nptel",
    name: "Cloud Computing — NPTEL",
    kind: "Sky Shard",
    year: "Certification",
    inscription: "A glimpse of the infrastructure beyond a single machine.",
    detail: "Virtualization, distributed storage and service models — the vocabulary of every system that came after.",
  },
  {
    id: "leetcode",
    name: "Competitive Programming",
    kind: "Logic Prism",
    year: "LeetCode",
    inscription: "Thousands of constraints. One optimal answer.",
    detail: "Algorithms and data structures sharpened under time pressure — the instinct behind every optimizer that followed.",
    href: "https://leetcode.com/nileshkk9",
  },
];

export type Chapter = {
  org: string;
  role: string;
  period: string;
  location: string;
  highlights: string[];
  metrics: { value: string; label: string }[];
  stack: string[];
};

export const chapters: Record<string, Chapter> = {
  legacy: {
    org: "Infosys",
    role: "Power Programmer",
    period: "Nov 2020 — Feb 2022",
    location: "Bangalore",
    highlights: [
      "Modernized a legacy frontend stack for Citibank's Advice Generation System.",
      "Remediated critical security vulnerabilities across Java Spring MVC services.",
    ],
    metrics: [{ value: "Critical", label: "vulnerabilities remediated" }],
    stack: ["Java", "Spring MVC", "Security", "Frontend modernization"],
  },
  logistics: {
    org: "Udaan",
    role: "Application Developer",
    period: "Feb 2022 — Nov 2022",
    location: "Bangalore",
    highlights: [
      "Optimized inbound supply-chain workflows across warehouses by reworking backend service logic.",
      "Refactored and stabilized Kotlin services in a high-volume warehouse management system, closing the process gaps behind Non-FCR issues.",
      "Worked with on-ground operations teams to find bottlenecks in inbound and outbound flows.",
    ],
    metrics: [
      { value: "−70%", label: "operational delay" },
      { value: "−70–80%", label: "repeat issues" },
    ],
    stack: ["Kotlin", "WMS", "Supply chain", "Backend services"],
  },
  nexus: {
    org: "Zinier",
    role: "Software Development Engineer 2",
    period: "Nov 2022 — Present",
    location: "Bangalore",
    highlights: [
      "Designed and built an optimization platform for batch and continuous scheduling of manpower at scale.",
      "Led performance tuning and reliability work across distributed services for high-throughput, event-driven execution.",
      "Built a fault-tolerant Bulk Dispatch system on AWS SQS with Spring Boot consumers, eliminating server crashes.",
      "Created a capacity planning algorithm using Java multithreading and concurrent execution.",
    ],
    metrics: [
      { value: "+40%", label: "bulk dispatch throughput" },
      { value: "0", label: "dispatch server crashes" },
    ],
    stack: ["Java", "Spring Boot", "Kafka", "Kubernetes", "AWS SQS"],
  },
  routeverse: {
    org: "Zinier",
    role: "Routing Platform",
    period: "Zinier",
    location: "Multi-region",
    highlights: [
      "Built and scaled an in-house routing and optimization platform to replace third-party map APIs.",
      "Optimized path computation and ETA models across regions, deployed on Kubernetes.",
    ],
    metrics: [{ value: "−60–70%", label: "external API cost" }],
    stack: ["Routing", "ETA models", "Kubernetes"],
  },
  forge: {
    org: "Zinier",
    role: "ZPilot",
    period: "Zinier",
    location: "VS Code Marketplace",
    highlights: [
      "Built ZPilot, a Language Server Protocol based VS Code extension.",
      "Real-time validation, auto-fixes and intelligent suggestions for the platform's developers.",
    ],
    metrics: [
      { value: "+45%", label: "developer productivity" },
      { value: "−40%", label: "bug turnaround" },
    ],
    stack: ["TypeScript", "LSP", "WebSocket", "VS Code"],
  },
  archive: {
    org: "Zinier",
    role: "RAG Platform",
    period: "Zinier",
    location: "Production",
    highlights: [
      "Designed and operated a production RAG platform on FastAPI, LangChain and OpenSearch.",
      "Containerized with Docker, deployed on Kubernetes.",
      "End-to-end distributed observability with OpenTelemetry, Loki and Tempo.",
    ],
    metrics: [{ value: "Faster", label: "field troubleshooting" }],
    stack: ["FastAPI", "LangChain", "OpenSearch", "OpenTelemetry", "Docker", "Kubernetes"],
  },
};

export const futurePaths = [
  { id: "agents", label: "AI Agents", note: "stock-agent — multi-agent LLM analysis and paper trading for NSE.", href: "https://github.com/nileshkk9/stock-agent" },
  { id: "mcp", label: "MCP Systems", note: "Tools and context protocols that let agents act on real systems." },
  { id: "autonomous", label: "Autonomous Software", note: "autofill-ai, InstaApply, leetcode-pilot — software that does the work." },
  { id: "research", label: "Research", note: "From evolutionary feature selection to retrieval systems." },
  { id: "oss", label: "Open Source", note: "NapLocker — a native macOS app shipped through Homebrew.", href: "https://github.com/nileshkk9/NapLocker" },
  { id: "founder", label: "Founder Track", note: "HackerGrade and Eugenics — products built and shipped end to end." },
  { id: "staff", label: "Staff+ Engineering", note: "Owning systems that span teams, regions and years." },
];

export const awards = [
  "Outstanding Contribution Award at Zinier — 3 times",
  "Winner, Zinnovation Hackathon 2025",
];

export const sideProjects = [
  { name: "HackerGrade", href: "https://hackergrade.com", note: "Learning and hiring platform with in-browser IDE and automated evaluation. Next.js, NestJS, Prisma, GCP." },
  { name: "Warehouse Management System", note: "Full-stack warehouse operations platform. Spring Boot, Hibernate, Flyway, PostgreSQL, Next.js on GCP." },
  { name: "Eugenics Reporting PWA", href: "https://eugenicspharma.in", note: "Offline-first medical reporting PWA with real-time sync." },
];
