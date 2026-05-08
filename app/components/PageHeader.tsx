type PageHeaderProps = {
  title: string;
  description?: string;
  illustration?: React.ReactNode;
  accent?: "coral" | "sage" | "mustard" | "lavender" | "navy" | "neutral";
};

const ACCENT_BG: Record<NonNullable<PageHeaderProps["accent"]>, string> = {
  coral: "bg-coral-bg",
  sage: "bg-sage-bg",
  mustard: "bg-mustard-bg",
  lavender: "bg-lavender-bg",
  navy: "bg-navy-bg",
  neutral: "bg-warm",
};

export function PageHeader({
  title,
  description,
  illustration,
  accent = "neutral",
}: PageHeaderProps) {
  return (
    <header
      className={`rounded-2xl ${ACCENT_BG[accent]} p-5 md:p-6 flex items-center gap-4 md:gap-5`}
    >
      {illustration && (
        <div className="shrink-0 w-16 h-16 md:w-20 md:h-20">{illustration}</div>
      )}
      <div className="min-w-0">
        <h1
          className="font-extrabold text-[1.5rem] md:text-[1.75rem] text-ink leading-tight"
          style={{ letterSpacing: "-0.04em" }}
        >
          {title}
        </h1>
        {description && (
          <p className="text-sm md:text-[15px] text-ink-secondary mt-1.5 leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </header>
  );
}
