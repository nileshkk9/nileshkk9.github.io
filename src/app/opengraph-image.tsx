import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const alt = "The Systems Architect — an interactive portfolio by Nilesh Kumar Pandey";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function stars() {
  let s = 1987;
  const rand = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  return Array.from({ length: 140 }, (_, i) => ({ i, x: rand() * 1200, y: rand() * 630, r: rand() < 0.1 ? 2.5 : 1.2, o: 0.2 + rand() * 0.6 }));
}

const CHAPTERS = [
  { label: "Education", color: "#5CE1FF" },
  { label: "Infosys", color: "#FFB547" },
  { label: "Udaan", color: "#7CF2C8" },
  { label: "Zinier · 4 projects", color: "#8AB4FF" },
  { label: "What's next", color: "#E8F1FF" },
];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 88px",
          background: "radial-gradient(circle at 78% 42%, #12324a 0%, #070b16 38%, #04050a 70%)",
          color: "white",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        {stars().map((st) => (
          <div
            key={st.i}
            style={{ position: "absolute", left: st.x, top: st.y, width: st.r, height: st.r, borderRadius: 9, background: "white", opacity: st.o }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            right: -110,
            top: 115,
            width: 400,
            height: 400,
            borderRadius: 999,
            border: "2px solid rgba(92,225,255,0.55)",
            boxShadow: "0 0 80px rgba(92,225,255,0.35), inset 0 0 60px rgba(92,225,255,0.25)",
            display: "flex",
          }}
        />
        <div style={{ position: "absolute", right: 50, top: 275, width: 80, height: 80, borderRadius: 999, background: "#E8F1FF", boxShadow: "0 0 90px #5CE1FF", display: "flex" }} />
        <div style={{ display: "flex", fontSize: 20, letterSpacing: 8, color: "#5CE1FF", textTransform: "uppercase" }}>Enter the simulation</div>
        <div style={{ display: "flex", fontSize: 86, fontWeight: 300, letterSpacing: -3, marginTop: 18, lineHeight: 1 }}>The Systems Architect</div>
        <div style={{ display: "flex", fontSize: 32, color: "rgba(255,255,255,0.75)", marginTop: 22 }}>Nilesh Kumar Pandey · Senior Software Engineer</div>
        <div style={{ display: "flex", fontSize: 22, color: "rgba(255,255,255,0.45)", marginTop: 12 }}>
          Distributed scheduling · Routing engines · Developer tooling · AI infrastructure
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 44 }}>
          {CHAPTERS.map((c) => (
            <div
              key={c.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 18px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.05)",
                fontSize: 20,
                color: "rgba(255,255,255,0.8)",
              }}
            >
              <div style={{ width: 9, height: 9, borderRadius: 9, background: c.color, display: "flex" }} />
              {c.label}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
