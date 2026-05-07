import { ImageResponse } from "next/og";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon() {
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
          fontSize: 92,
          fontWeight: 800,
          letterSpacing: "-0.04em",
          borderRadius: 32,
        }}
      >
        오늘
      </div>
    ),
    { ...size },
  );
}
