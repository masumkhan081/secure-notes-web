import { useEffect, useId, useRef } from "react";
import { formatNoteDate } from "./formatDate";
import type { Note } from "./notes.schema";

type Props = {
  note: Note | null;
  isLoading: boolean;
  error: string;
  focusKey: string;
  onClose: () => void;
};

export function NoteDetail({
  note,
  isLoading,
  error,
  focusKey,
  onClose,
}: Props) {
  const headingId = useId();
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    sectionRef.current?.focus();
  }, [focusKey]);

  return (
    <section
      ref={sectionRef}
      tabIndex={-1}
      aria-labelledby={headingId}
      className="rounded border border-slate-300 bg-white p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 id={headingId} className="text-base font-semibold text-slate-900">
          Note details
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded border border-slate-400 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-100"
        >
          Close
        </button>
      </div>

      {isLoading && (
        <p role="status" className="mt-3 text-sm text-slate-600">
          Loading note...
        </p>
      )}

      {!isLoading && error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {!isLoading && !error && note && (
        <article className="mt-3 space-y-2 border-t border-slate-200 pt-3">
          <h4 className="break-words text-lg font-semibold text-slate-900">
            {note.title}
          </h4>
          <p className="text-xs text-slate-600">
            Created: {formatNoteDate(note.createdAt)} · Updated:{" "}
            {formatNoteDate(note.updatedAt)}
          </p>
          <p className="whitespace-pre-wrap break-words text-sm text-slate-800">
            {note.content}
          </p>
        </article>
      )}
    </section>
  );
}
