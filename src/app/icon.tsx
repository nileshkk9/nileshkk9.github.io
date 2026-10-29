import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#04050a", borderRadius: 14 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 99,
            border: "3px solid rgba(92,225,255,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ width: 14, height: 14, borderRadius: 99, background: "#5CE1FF", boxShadow: "0 0 12px #5CE1FF", display: "flex" }} />
        </div>
      </div>
    ),
    size,
  );
}
