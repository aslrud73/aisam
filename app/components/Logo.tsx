type LogoProps = {
  size?: number;
  className?: string;
};

export function Logo({ size = 36, className = "" }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="쌤노트 로고"
    >
      <defs>
        <linearGradient id="ssaemLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E85A4F" />
          <stop offset="100%" stopColor="#F58575" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#ssaemLogoGradient)" />
      <rect x="14" y="22" width="36" height="38" rx="3" fill="white" />
      <line x1="20" y1="38" x2="44" y2="38" stroke="#E85A4F" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="20" y1="44" x2="40" y2="44" stroke="#E85A4F" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <line x1="20" y1="50" x2="42" y2="50" stroke="#E85A4F" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <line x1="20" y1="56" x2="38" y2="56" stroke="#E85A4F" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <circle cx="32" cy="18" r="10" fill="white" />
      <circle cx="29" cy="17" r="1" fill="#2C2420" />
      <circle cx="35" cy="17" r="1" fill="#2C2420" />
      <path d="M29 21 Q32 23 35 21" stroke="#2C2420" strokeWidth="1" fill="none" strokeLinecap="round" />
    </svg>
  );
}
