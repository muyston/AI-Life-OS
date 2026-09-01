import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 64,
          background: "linear-gradient(135deg, #020617 0%, #0f172a 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#0ea5e9",
          fontWeight: 800,
          border: "6px solid #1e293b",
          borderRadius: "36px",
          letterSpacing: "-2px",
          fontFamily: "sans-serif",
        }}
      >
        OS
      </div>
    ),
    {
      ...size,
    }
  );
}
