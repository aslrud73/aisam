import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className = "" }: CardProps) {
  return (
    <section
      className={`bg-white rounded-2xl border border-line-light shadow-soft p-5 md:p-6 ${className}`}
    >
      {children}
    </section>
  );
}

type StepHeaderProps = {
  step: number | string;
  title: string;
  hint?: string;
  accent?: "coral" | "sage" | "mustard" | "lavender" | "navy";
  right?: ReactNode;
};

const STEP_TEXT: Record<NonNullable<StepHeaderProps["accent"]>, string> = {
  coral: "text-coral",
  sage: "text-sage",
  mustard: "text-mustard",
  lavender: "text-lavender",
  navy: "text-navy",
};

export function StepHeader({
  step,
  title,
  hint,
  accent = "coral",
  right,
}: StepHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="min-w-0 flex-1">
        <h2 className="font-bold text-[1.125rem] text-ink tracking-[-0.02em] flex items-center gap-2">
          <span
            className={`inline-flex items-center justify-center w-6 h-6 rounded-full bg-current/10 text-xs font-extrabold ${STEP_TEXT[accent]}`}
            aria-hidden
          >
            {step}
          </span>
          <span>{title}</span>
        </h2>
        {hint && (
          <p className="text-sm text-ink-secondary mt-1 leading-relaxed">{hint}</p>
        )}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}
