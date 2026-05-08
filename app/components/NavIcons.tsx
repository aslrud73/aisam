type IconProps = {
  size?: number;
  className?: string;
  strokeWidth?: number;
};

const base = (size = 22, strokeWidth = 2) =>
  ({
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  }) as const;

// 오늘 기록 — 노트
export function TodayIcon({ size, className, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M5 4h11l3 3v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
      <path d="M16 4v3a1 1 0 0 0 1 1h2" />
      <line x1="8" y1="12" x2="15" y2="12" />
      <line x1="8" y1="16" x2="13" y2="16" />
    </svg>
  );
}

// 학부모 답변 — 말풍선
export function ParentIcon({ size, className, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-7l-4 4v-4H6a2 2 0 0 1-2-2V6Z" />
      <line x1="8" y1="10" x2="16" y2="10" />
      <line x1="8" y1="13" x2="13" y2="13" />
    </svg>
  );
}

// 놀이기록 — 카메라
export function PlayIcon({ size, className, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M3 8a2 2 0 0 1 2-2h2l2-2h6l2 2h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z" />
      <circle cx="12" cy="12.5" r="3.5" />
    </svg>
  );
}

// 성장 리포트 — 차트
export function ReportIcon({ size, className, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M5 4v16h16" />
      <rect x="8" y="12" width="3" height="6" rx="0.5" />
      <rect x="13" y="9" width="3" height="9" rx="0.5" />
      <rect x="18" y="6" width="3" height="12" rx="0.5" />
    </svg>
  );
}

// 설정 — 톱니
export function SettingsIcon({ size, className, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </svg>
  );
}

// 사용 설명서 — 책
export function HelpIcon({ size, className, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 3.5" />
      <line x1="12" y1="16" x2="12" y2="16.5" />
    </svg>
  );
}
