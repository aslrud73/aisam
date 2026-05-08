type IllustProps = {
  size?: number;
  className?: string;
};

const wrap = (size = 96, className = "") =>
  ({
    width: size,
    height: size,
    viewBox: "0 0 100 100",
    xmlns: "http://www.w3.org/2000/svg",
    className,
    "aria-hidden": true,
  }) as const;

// 1. 알림장 작성 — 노트 + 펜 + 별
export function AlrimIllust({ size = 96, className = "" }: IllustProps) {
  return (
    <svg {...wrap(size, className)}>
      <rect x="20" y="35" width="60" height="45" rx="3" fill="#FBF7F0" stroke="#E85A4F" strokeWidth="2.5" />
      <line x1="28" y1="48" x2="60" y2="48" stroke="#E85A4F" strokeWidth="2" strokeLinecap="round" />
      <line x1="28" y1="56" x2="65" y2="56" stroke="#E85A4F" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <line x1="28" y1="64" x2="55" y2="64" stroke="#E85A4F" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <line x1="28" y1="72" x2="62" y2="72" stroke="#E85A4F" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <rect x="62" y="20" width="6" height="35" rx="2" fill="#D4A537" transform="rotate(35 65 37)" />
      <polygon points="80,18 75,22 78,25" fill="#2C2420" />
      <path d="M85 30 L86 33 L89 33 L87 35 L88 38 L85 36 L82 38 L83 35 L81 33 L84 33 Z" fill="#D4A537" />
    </svg>
  );
}

// 2. 관찰일지 — 클립보드 + 체크
export function GwanchalIllust({ size = 96, className = "" }: IllustProps) {
  return (
    <svg {...wrap(size, className)}>
      <rect x="25" y="25" width="50" height="60" rx="3" fill="#FBF7F0" stroke="#5B8A6F" strokeWidth="2.5" />
      <rect x="35" y="20" width="30" height="12" rx="2" fill="#5B8A6F" />
      <circle cx="35" cy="45" r="3" fill="#5B8A6F" />
      <path d="M33 45 L34.5 46.5 L37 43.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <line x1="42" y1="45" x2="65" y2="45" stroke="#5B8A6F" strokeWidth="2" strokeLinecap="round" />
      <circle cx="35" cy="55" r="3" fill="#5B8A6F" />
      <path d="M33 55 L34.5 56.5 L37 53.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <line x1="42" y1="55" x2="60" y2="55" stroke="#5B8A6F" strokeWidth="2" strokeLinecap="round" />
      <circle cx="35" cy="65" r="3" fill="#5B8A6F" opacity="0.4" />
      <line x1="42" y1="65" x2="58" y2="65" stroke="#5B8A6F" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

// 3. 학부모 답변 — 말풍선 + 하트
export function ParentIllust({ size = 96, className = "" }: IllustProps) {
  return (
    <svg {...wrap(size, className)}>
      <path
        d="M20 30 Q20 22 28 22 L72 22 Q80 22 80 30 L80 55 Q80 63 72 63 L40 63 L30 73 L32 63 L28 63 Q20 63 20 55 Z"
        fill="#FBF1D8"
        stroke="#D4A537"
        strokeWidth="2.5"
      />
      <circle cx="38" cy="42" r="3" fill="#D4A537" />
      <circle cx="50" cy="42" r="3" fill="#D4A537" />
      <circle cx="62" cy="42" r="3" fill="#D4A537" />
      <path d="M75 18 Q72 15 69 18 Q66 15 63 18 Q63 22 69 28 Q75 22 75 18 Z" fill="#E85A4F" />
    </svg>
  );
}

// 4. 놀이기록 — 카메라 + 반짝
export function PlayIllust({ size = 96, className = "" }: IllustProps) {
  return (
    <svg {...wrap(size, className)}>
      <rect x="20" y="35" width="60" height="40" rx="5" fill="#ECE7F4" stroke="#8B7BB5" strokeWidth="2.5" />
      <rect x="35" y="28" width="20" height="10" rx="2" fill="#8B7BB5" />
      <circle cx="50" cy="55" r="12" fill="#FBF7F0" stroke="#8B7BB5" strokeWidth="2.5" />
      <circle cx="50" cy="55" r="6" fill="#8B7BB5" />
      <circle cx="68" cy="44" r="2" fill="#E85A4F" />
      <path d="M75 25 L77 28 L80 30 L77 32 L75 35 L73 32 L70 30 L73 28 Z" fill="#D4A537" opacity="0.7" />
    </svg>
  );
}

// 5. 성장 리포트 — 차트 + 별
export function ReportIllust({ size = 96, className = "" }: IllustProps) {
  return (
    <svg {...wrap(size, className)}>
      <rect x="20" y="20" width="60" height="60" rx="4" fill="#DCE6F0" stroke="#2D4A6B" strokeWidth="2.5" />
      <line x1="30" y1="68" x2="70" y2="68" stroke="#2D4A6B" strokeWidth="2" strokeLinecap="round" />
      <rect x="34" y="55" width="8" height="13" rx="1" fill="#2D4A6B" />
      <rect x="46" y="45" width="8" height="23" rx="1" fill="#5B8A6F" />
      <rect x="58" y="38" width="8" height="30" rx="1" fill="#E85A4F" />
      <path d="M35 30 L37 34 L41 34 L38 37 L39 41 L35 39 L31 41 L32 37 L29 34 L33 34 Z" fill="#D4A537" />
    </svg>
  );
}

// 6. 우리 반 — 사람들 + 하트
export function ClassIllust({ size = 96, className = "" }: IllustProps) {
  return (
    <svg {...wrap(size, className)}>
      <circle cx="30" cy="40" r="8" fill="#E85A4F" />
      <path d="M22 60 Q22 50 30 50 Q38 50 38 60 L38 70 L22 70 Z" fill="#E85A4F" />
      <circle cx="55" cy="48" r="6" fill="#5B8A6F" />
      <path d="M49 65 Q49 57 55 57 Q61 57 61 65 L61 72 L49 72 Z" fill="#5B8A6F" />
      <circle cx="72" cy="48" r="6" fill="#D4A537" />
      <path d="M66 65 Q66 57 72 57 Q78 57 78 65 L78 72 L66 72 Z" fill="#D4A537" />
      <path d="M44 22 Q42 20 40 22 Q38 20 36 22 Q36 25 40 28 Q44 25 44 22 Z" fill="#E85A4F" opacity="0.8" />
    </svg>
  );
}

// 7. 빈 상태 — 텅 빈 박스 + 물음표
export function EmptyIllust({ size = 96, className = "" }: IllustProps) {
  return (
    <svg {...wrap(size, className)}>
      <path d="M25 40 L50 28 L75 40 L75 70 L50 82 L25 70 Z" fill="#F5EFE3" stroke="#9A8C81" strokeWidth="2.5" />
      <line x1="25" y1="40" x2="50" y2="52" stroke="#9A8C81" strokeWidth="2" />
      <line x1="75" y1="40" x2="50" y2="52" stroke="#9A8C81" strokeWidth="2" />
      <line x1="50" y1="52" x2="50" y2="82" stroke="#9A8C81" strokeWidth="2" />
      <text x="50" y="62" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#9A8C81">
        ?
      </text>
    </svg>
  );
}

// 8. 완료 — 체크 원 + 반짝
export function DoneIllust({ size = 96, className = "" }: IllustProps) {
  return (
    <svg {...wrap(size, className)}>
      <circle cx="50" cy="50" r="30" fill="#E5EFE9" stroke="#5B8A6F" strokeWidth="2.5" />
      <path
        d="M38 50 L46 58 L62 42"
        stroke="#5B8A6F"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M82 30 L84 33 L87 35 L84 37 L82 40 L80 37 L77 35 L80 33 Z" fill="#D4A537" />
      <path d="M18 70 L20 73 L23 75 L20 77 L18 80 L16 77 L13 75 L16 73 Z" fill="#D4A537" opacity="0.6" />
    </svg>
  );
}
