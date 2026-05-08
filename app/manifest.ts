import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "쌤chat — 선생님을 위한 AI 기록 자동화",
    short_name: "쌤chat",
    description:
      "유치원·어린이집 선생님을 위한 AI 기록 자동화. 알림장·관찰일지·학부모 답변·놀이기록까지 한 번에.",
    start_url: "/",
    display: "standalone",
    background_color: "#FBF7F0",
    theme_color: "#C56B4A",
    orientation: "portrait",
    lang: "ko",
    categories: ["education", "productivity"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
