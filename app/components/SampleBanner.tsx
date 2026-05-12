"use client";

interface Props {
  onClear: () => void;
  message?: string;
}

export function SampleBanner({ onClear, message }: Props) {
  return (
    <div className="rounded-2xl border border-mustard-300 bg-mustard-50 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
      <p className="text-sm text-mustard-800 leading-relaxed">
        <strong>샘플 데이터입니다.</strong>{" "}
        {message ??
          "실제 사용 전 미리보기용이에요. ‘지우고 시작하기’를 누르면 모두 비워집니다."}
      </p>
      <button
        type="button"
        onClick={onClear}
        className="text-xs font-semibold bg-paper hover:bg-warm-50 border border-mustard-300 text-mustard-800 rounded-xl px-3 py-1.5 whitespace-nowrap"
      >
        지우고 시작하기
      </button>
    </div>
  );
}

interface TryButtonProps {
  onClick: () => void;
  label?: string;
}

export function TrySampleButton({ onClick, label }: TryButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-sm font-semibold bg-mustard-100 hover:bg-mustard-200 text-mustard-800 rounded-2xl px-4 py-2 border border-mustard-200 transition"
    >
      {label ?? "체험해보기 (샘플)"}
    </button>
  );
}
