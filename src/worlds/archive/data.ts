export type ArchiveQuery = {
  id: string;
  question: string;
  answer: string;
  sources: string[];
  /** Which document cluster the retrieval lands in. */
  cluster: number;
};

/** Illustrative field-service questions; the documents and answers are demo data, not customer content. */
export const ARCHIVE_QUERIES: ArchiveQuery[] = [
  {
    id: "hvac",
    question: "Why does this HVAC unit keep throwing error E4?",
    answer: "E4 means the condenser fan is overheating. Check the fan capacitor first — most recent field reports for this model trace E4 back to it.",
    sources: ["HVAC service manual · §7.3", "Field report · condenser fan", "Known issue · capacitor wear"],
    cluster: 1,
  },
  {
    id: "fiber",
    question: "How do I reset a fibre ONT without losing its config?",
    answer: "Hold the reset button for 3 seconds, not 10 — a short press reboots the unit and keeps the provisioning profile. A long press restores factory settings.",
    sources: ["ONT install guide · reset", "Network ops runbook", "Technician note · re-provisioning"],
    cluster: 4,
  },
  {
    id: "safety",
    question: "What safety checks are required before a pole-top job?",
    answer: "Confirm the line is de-energised and grounded, inspect the pole for rot, and wear a rated harness and arc-flash PPE. Log the checklist in the work order before climbing.",
    sources: ["Safety policy · elevated work", "Pre-climb checklist", "Incident review · lessons learned"],
    cluster: 6,
  },
];

export type StackNode = { id: string; name: string; role: string; detail: string };

export const ARCHIVE_STACK: StackNode[] = [
  { id: "fastapi", name: "FastAPI", role: "API gateway", detail: "Receives each question and streams the answer back to the technician's app." },
  { id: "langchain", name: "LangChain", role: "Orchestration", detail: "Turns the question into a retrieval plan, builds the prompt and calls the model." },
  { id: "opensearch", name: "OpenSearch", role: "Vector + keyword search", detail: "Indexes every manual and field report so the right passages are found in milliseconds." },
  { id: "otel", name: "OpenTelemetry", role: "Tracing", detail: "One trace follows a question end to end — with Loki and Tempo, slow steps are obvious." },
  { id: "docker", name: "Docker", role: "Packaging", detail: "Every service ships as a container, identical from laptop to production." },
  { id: "k8s", name: "Kubernetes", role: "Runtime", detail: "Runs and scales the platform in production." },
];

/** Pipeline order a question travels through before retrieval. */
export const PIPELINE = ["fastapi", "langchain", "opensearch"] as const;

export const TRACE_SPANS = [
  { name: "POST /ask", service: "FastAPI", start: 0, end: 100 },
  { name: "embed question", service: "LangChain", start: 2, end: 9 },
  { name: "hybrid search", service: "OpenSearch", start: 9, end: 21 },
  { name: "rerank passages", service: "LangChain", start: 21, end: 27 },
  { name: "generate answer", service: "LLM", start: 27, end: 93 },
  { name: "stream response", service: "FastAPI", start: 93, end: 100 },
];

/** Timeline of a query animation, in seconds after the question is asked. */
export const QUERY_TIMING = { toSearch: 1.6, retrieve: 1.3, converge: 0.9, answer: 4.0 };

export const archiveBus = { docs: 0 };
