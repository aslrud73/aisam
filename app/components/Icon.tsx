import type { SVGProps } from "react";

export type IconName =
  | "note"
  | "chat"
  | "camera"
  | "chart"
  | "settings"
  | "users"
  | "sun"
  | "pencil"
  | "sparkle"
  | "check"
  | "bowl"
  | "smile"
  | "moon"
  | "info"
  | "key"
  | "link"
  | "plus"
  | "x"
  | "copy"
  | "shield";

const COMMON: SVGProps<SVGSVGElement> = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const PATHS: Record<IconName, JSX.Element> = {
  note: (
    <>
      <path d="M5 4h11l3 3v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
      <path d="M16 4v3h3" />
      <path d="M8 12h8M8 16h5" />
    </>
  ),
  chat: (
    <>
      <path d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-7l-4 3v-3H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8h3l2-2h6l2 2h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  chart: (
    <>
      <path d="M4 19h16" />
      <path d="M7 19v-7" />
      <path d="M12 19v-11" />
      <path d="M17 19v-5" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 19c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17" cy="9" r="2.6" />
      <path d="M15 14c2.6 0 6 1.7 6 5" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
    </>
  ),
  pencil: (
    <>
      <path d="M14 4l6 6L9 21H3v-6L14 4Z" />
      <path d="M13 5l6 6" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6 8 8M16 16l2.4 2.4M5.6 18.4 8 16M16 8l2.4-2.4" />
    </>
  ),
  check: (
    <>
      <path d="M5 12l5 5 9-11" />
    </>
  ),
  bowl: (
    <>
      <path d="M3 11h18a9 9 0 0 1-9 9 9 9 0 0 1-9-9Z" />
      <path d="M14 6c0 1.5-1 1.5-1 3M11 7c0 1.5-1 1.5-1 3" />
    </>
  ),
  smile: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 14c1 1.3 2.2 2 3.5 2s2.5-.7 3.5-2" />
      <circle cx="9" cy="10" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="15" cy="10" r="0.8" fill="currentColor" stroke="none" />
    </>
  ),
  moon: (
    <>
      <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <circle cx="12" cy="8" r="0.8" fill="currentColor" stroke="none" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="14" r="3.5" />
      <path d="M11 12l8-8" />
      <path d="M17 6l2 2" />
      <path d="M14 9l2 2" />
    </>
  ),
  link: (
    <>
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14M5 12h14" />
    </>
  ),
  x: (
    <>
      <path d="M6 6l12 12M18 6 6 18" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a1 1 0 0 1 1-1h10" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 4 6v6c0 4.5 3.4 8.4 8 9 4.6-.6 8-4.5 8-9V6l-8-3Z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
};

export function Icon({
  name,
  size = 20,
  className,
  strokeWidth,
  ...rest
}: {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
} & Omit<SVGProps<SVGSVGElement>, "name">) {
  return (
    <svg
      {...COMMON}
      width={size}
      height={size}
      strokeWidth={strokeWidth ?? COMMON.strokeWidth}
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
