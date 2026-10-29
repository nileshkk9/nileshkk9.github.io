import { architect, awards, chapters, futurePaths, originArtifacts, sideProjects } from "@/content/archive";
import { WORLDS } from "@/worlds/registry";

/** Plain-text record of the whole simulation. Server-rendered for crawlers and screen readers, reused by the Mission Log. */
export function ArchiveText() {
  return (
    <article className="space-y-10 text-sm leading-relaxed text-white/70">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-white">{architect.name}</h1>
        <p className="text-white/80">
          {architect.title} · {architect.location}
        </p>
        <p>{architect.summary}</p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs">
          <li>
            <a className="text-cyan hover:underline" href={`mailto:${architect.links.email}`}>
              {architect.links.email}
            </a>
          </li>
          <li>
            <a className="text-cyan hover:underline" href={architect.links.github} target="_blank" rel="noreferrer">
              GitHub
            </a>
          </li>
          <li>
            <a className="text-cyan hover:underline" href={architect.links.linkedin} target="_blank" rel="noreferrer">
              LinkedIn
            </a>
          </li>
          <li>
            <a className="text-cyan hover:underline" href={architect.links.leetcode} target="_blank" rel="noreferrer">
              LeetCode
            </a>
          </li>
        </ul>
      </header>

      <section className="space-y-3">
        <h2 className="eyebrow text-cyan">Sector 01 · The Origin</h2>
        <ul className="space-y-2">
          {originArtifacts.map((a) => (
            <li key={a.id}>
              <span className="text-white">{a.name}</span> — {a.year}. {a.inscription}
            </li>
          ))}
        </ul>
      </section>

      {WORLDS.filter((w) => chapters[w.id]).map((w) => {
        const c = chapters[w.id];
        return (
          <section key={w.id} className="space-y-3">
            <h2 className="eyebrow text-cyan">
              {w.code} · {w.title}
            </h2>
            <p className="text-white">
              {c.org} — {c.role} <span className="text-white/40">· {c.period}</span>
            </p>
            <ul className="list-disc space-y-1 pl-5">
              {c.highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
            <p className="font-mono text-xs text-white/50">
              {c.metrics.map((m) => `${m.value} ${m.label}`).join(" · ")} — {c.stack.join(", ")}
            </p>
          </section>
        );
      })}

      <section className="space-y-3">
        <h2 className="eyebrow text-cyan">Sector ∞ · The Infinite Future</h2>
        <ul className="space-y-1">
          {futurePaths.map((p) => (
            <li key={p.id}>
              <span className="text-white">{p.label}</span> — {p.note}
            </li>
          ))}
        </ul>
        <h3 className="pt-2 text-white">Built independently</h3>
        <ul className="space-y-1">
          {sideProjects.map((p) => (
            <li key={p.name}>
              <span className="text-white">{p.name}</span> — {p.note}
            </li>
          ))}
        </ul>
        <h3 className="pt-2 text-white">Recognition</h3>
        <ul className="space-y-1">
          {awards.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </section>
    </article>
  );
}
