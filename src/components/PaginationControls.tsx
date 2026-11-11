type Props = {
  ariaLabel: string;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

export function PaginationControls({
  ariaLabel,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
}: Props) {
  return (
    <nav
      aria-label={ariaLabel}
      className="flex items-center justify-between gap-3 pt-1"
    >
      <button
        type="button"
        disabled={!canGoPrevious}
        onClick={onPrevious}
        className="rounded border border-slate-400 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 disabled:opacity-50"
      >
        Previous
      </button>

      <button
        type="button"
        disabled={!canGoNext}
        onClick={onNext}
        className="rounded border border-slate-400 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 disabled:opacity-50"
      >
        Next
      </button>
    </nav>
  );
}
