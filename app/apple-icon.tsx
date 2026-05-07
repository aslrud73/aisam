import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#C56B4A",
          color: "#FBF7F0",
          fontSize: 86,
          fontWeight: 800,
          letterSpacing: "-0.04em",
        }}
      >
        오늘
      </div>
    ),
    { ...size },
  );
}
