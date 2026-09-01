import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 512,
  height: 512,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 180,
          background: "linear-gradient(135deg, #020617 0%, #0f172a 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#0ea5e9",
          fontWeight: 800,
          border: "16px solid #1e293b",
          borderRadius: "128px",
          letterSpacing: "-4px",
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
