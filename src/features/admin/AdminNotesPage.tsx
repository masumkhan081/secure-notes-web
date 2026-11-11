import { useEffect, useId, useState } from "react";
import { PaginationControls } from "../../components/PaginationControls";
import {
  INITIAL_PAGE_QUERY,
  canGoPrevious,
  getCurrentCursor,
  popPreviousCursor,
  pushNextCursor,
  retryCurrentPage,
  type CursorPageQuery,
  type PageInfo,
} from "../../lib/pagination";
import { formatNoteDate } from "../notes/formatDate";
import { formatContentPreview } from "../notes/formatNotePreview";
import { NoteDetail } from "../notes/NoteDetail";
import { getAdminNote, listAdminNotes } from "./admin.api";
import type { AdminNote } from "./admin.schema";

type Props = {
  token: string;
};

type ViewTarget = {
  id: string;
  revision: number;
};

export function AdminNotesPage({ token }: Props) {
  const headingId = useId();
  const [listQuery, setListQuery] =
    useState<CursorPageQuery>(INITIAL_PAGE_QUERY);
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [listError, setListError] = useState("");

  const [viewTarget, setViewTarget] = useState<ViewTarget | null>(null);
  const [viewedNote, setViewedNote] = useState<AdminNote | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState("");

  const currentCursor = getCurrentCursor(listQuery);

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    async function loadNotes() {
      setIsLoadingList(true);
      setListError("");
      setPageInfo(null);
      setNotes([]);

      try {
        const page = await listAdminNotes(
          token,
          currentCursor,
          controller.signal,
        );
        if (ignore || controller.signal.aborted) return;
        setNotes(page.items);
        setPageInfo(page.pageInfo);
      } catch (error: unknown) {
        if (ignore || controller.signal.aborted) return;
        setListError(
          error instanceof Error ? error.message : "Failed to load notes.",
        );
      } finally {
        if (!ignore && !controller.signal.aborted) {
          setIsLoadingList(false);
        }
      }
    }

    void loadNotes();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [token, currentCursor, listQuery.revision]);

  useEffect(() => {
    if (!viewTarget) {
      setViewedNote(null);
      setDetailError("");
      setIsLoadingDetail(false);
      return;
    }

    const targetId = viewTarget.id;
    const controller = new AbortController();
    let ignore = false;

    async function loadDetail() {
      setIsLoadingDetail(true);
      setDetailError("");
      setViewedNote(null);

      try {
        const note = await getAdminNote(token, targetId, controller.signal);
        if (ignore || controller.signal.aborted) return;
        setViewedNote(note);
      } catch (error: unknown) {
        if (ignore || controller.signal.aborted) return;
        setDetailError(
          error instanceof Error ? error.message : "Failed to load note.",
        );
      } finally {
        if (!ignore && !controller.signal.aborted) {
          setIsLoadingDetail(false);
        }
      }
    }

    void loadDetail();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [token, viewTarget]);

  const hasPrevious = canGoPrevious(listQuery);
  const canGoNext =
    !isLoadingList &&
    !listError &&
    Boolean(pageInfo?.hasMore && pageInfo.nextCursor);

  return (
    <section aria-labelledby={headingId} className="mt-6 space-y-6">
      <h2 id={headingId} className="text-xl font-semibold text-slate-900">
        All notes
      </h2>

      {viewTarget && (
        <NoteDetail
          note={viewedNote}
          isLoading={isLoadingDetail}
          error={detailError}
          focusKey={`${viewTarget.id}:${viewTarget.revision}`}
          onClose={() => setViewTarget(null)}
        />
      )}

      <section className="space-y-4">
        {isLoadingList && (
          <p role="status" className="text-sm text-slate-600">
            Loading notes...
          </p>
        )}

        {!isLoadingList && listError && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded border border-red-300 bg-red-50 p-4 text-sm text-red-800"
          >
            <p>{listError}</p>
            <button
              type="button"
              onClick={() => setListQuery(retryCurrentPage)}
              className="rounded border border-red-400 bg-white px-3 py-1.5 font-medium text-red-800 hover:bg-red-100"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoadingList && !listError && notes.length === 0 && (
          <p className="rounded border border-slate-300 bg-white p-4 text-sm text-slate-700">
            {listQuery.cursorHistory.length === 1
              ? "No notes found."
              : "No notes found on this page."}
          </p>
        )}

        {!isLoadingList && !listError && notes.length > 0 && (
          <ul className="space-y-3">
            {notes.map((note) => {
              const isSelected = viewTarget?.id === note.id;

              return (
                <li
                  key={note.id}
                  className={`rounded border bg-white p-4 ${
                    isSelected ? "border-slate-500" : "border-slate-300"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <h3 className="break-words text-base font-semibold text-slate-900">
                        {note.title}
                      </h3>
                      <p className="text-xs text-slate-600">
                        Owner ID: {note.ownerId} · Updated:{" "}
                        {formatNoteDate(note.updatedAt)}
                      </p>
                      <p className="line-clamp-2 whitespace-pre-wrap break-words text-sm text-slate-700">
                        {formatContentPreview(note.content)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setViewTarget((prev) => ({
                          id: note.id,
                          revision: (prev?.revision ?? 0) + 1,
                        }))
                      }
                      className="rounded border border-slate-400 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-100"
                    >
                      View
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <PaginationControls
          ariaLabel="All notes pagination"
          canGoPrevious={hasPrevious}
          canGoNext={canGoNext}
          onPrevious={() => setListQuery(popPreviousCursor)}
          onNext={() => {
            const nextCursor = pageInfo?.nextCursor;
            if (!nextCursor) return;
            setListQuery((prev) => pushNextCursor(prev, nextCursor));
          }}
        />
      </section>
    </section>
  );
}
