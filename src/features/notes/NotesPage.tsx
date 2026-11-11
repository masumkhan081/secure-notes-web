import { useEffect, useId, useRef, useState } from "react";
import { PaginationControls } from "../../components/PaginationControls";
import {
  INITIAL_PAGE_QUERY,
  canGoPrevious,
  getCurrentCursor,
  popPreviousCursor,
  pushNextCursor,
  resetToFirstPage,
  retryCurrentPage,
  type CursorPageQuery,
  type PageInfo,
} from "../../lib/pagination";
import { formatNoteDate } from "./formatDate";
import { formatContentPreview } from "./formatNotePreview";
import { NoteDetail } from "./NoteDetail";
import { NoteForm } from "./NoteForm";
import {
  createNote,
  deleteNote,
  getNote,
  listNotes,
  updateNote,
} from "./notes.api";
import type { Note, NoteFormValues } from "./notes.schema";

type Props = {
  token: string;
};

type ViewTarget = {
  id: string;
  revision: number;
};

export function NotesPage({ token }: Props) {
  const headingId = useId();
  const [listQuery, setListQuery] =
    useState<CursorPageQuery>(INITIAL_PAGE_QUERY);
  const [notes, setNotes] = useState<Note[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [listError, setListError] = useState("");

  const [viewTarget, setViewTarget] = useState<ViewTarget | null>(null);
  const [viewedNote, setViewedNote] = useState<Note | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const deletingRef = useRef<Set<string>>(new Set());

  const [statusMessage, setStatusMessage] = useState("");
  const [actionError, setActionError] = useState("");

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
        const page = await listNotes(token, currentCursor, controller.signal);
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
        const note = await getNote(token, targetId, controller.signal);
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

  function refreshPageOne() {
    setListQuery(resetToFirstPage);
  }

  async function handleCreate(values: NoteFormValues) {
    setActionError("");
    setStatusMessage("");
    await createNote(token, values);
    setStatusMessage("Note created.");
    refreshPageOne();
  }

  async function handleUpdate(noteId: string, values: NoteFormValues) {
    setActionError("");
    setStatusMessage("");
    const updated = await updateNote(token, noteId, values);
    setEditingNote(null);
    if (viewTarget?.id === updated.id) {
      setViewedNote(updated);
      setDetailError("");
    }
    setStatusMessage("Note updated.");
    refreshPageOne();
  }

  async function handleDelete(note: Note) {
    const confirmed = window.confirm(
      `Delete "${note.title}"? This action cannot be undone.`,
    );
    if (!confirmed || deletingRef.current.has(note.id)) return;

    deletingRef.current.add(note.id);
    setDeletingIds((prev) => [...prev, note.id]);
    setActionError("");
    setStatusMessage("");

    try {
      await deleteNote(token, note.id);
      if (editingNote?.id === note.id) {
        setEditingNote(null);
      }
      if (viewTarget?.id === note.id) {
        setViewTarget(null);
      }
      setStatusMessage("Note deleted.");
      refreshPageOne();
    } catch (error: unknown) {
      setActionError(
        error instanceof Error ? error.message : "Failed to delete note.",
      );
    } finally {
      deletingRef.current.delete(note.id);
      setDeletingIds((prev) => prev.filter((id) => id !== note.id));
    }
  }

  const hasPrevious = canGoPrevious(listQuery);
  const canGoNext =
    !isLoadingList &&
    !listError &&
    Boolean(pageInfo?.hasMore && pageInfo.nextCursor);

  return (
    <section aria-labelledby={headingId} className="mt-6 space-y-6">
      <h2 id={headingId} className="text-xl font-semibold text-slate-900">
        My notes
      </h2>

      {statusMessage && (
        <p
          role="status"
          className="rounded border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
        >
          {statusMessage}
        </p>
      )}

      {actionError && (
        <p
          role="alert"
          className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {actionError}
        </p>
      )}

      <section className="rounded border border-slate-300 bg-white p-4">
        <h3 className="mb-3 text-base font-semibold text-slate-900">
          Create note
        </h3>
        <NoteForm mode="create" onSubmitNote={handleCreate} />
      </section>

      {editingNote && (
        <section className="rounded border border-slate-400 bg-white p-4">
          <h3 className="mb-3 text-base font-semibold text-slate-900">
            Edit note
          </h3>
          {/* Keyed by note id so editing another note starts clean, while list refreshes preserve unsaved drafts. */}
          <NoteForm
            key={editingNote.id}
            mode="edit"
            initialValues={{
              title: editingNote.title,
              content: editingNote.content,
            }}
            onSubmitNote={(values) => handleUpdate(editingNote.id, values)}
            onCancel={() => setEditingNote(null)}
            autoFocusTitle
          />
        </section>
      )}

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
              ? "You have no notes yet."
              : "No notes found on this page."}
          </p>
        )}

        {!isLoadingList && !listError && notes.length > 0 && (
          <ul className="space-y-3">
            {notes.map((note) => {
              const isDeleting = deletingIds.includes(note.id);
              const isSelected =
                viewTarget?.id === note.id || editingNote?.id === note.id;

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
                        Updated: {formatNoteDate(note.updatedAt)}
                      </p>
                      <p className="line-clamp-2 whitespace-pre-wrap break-words text-sm text-slate-700">
                        {formatContentPreview(note.content)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
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

                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => {
                          setActionError("");
                          setStatusMessage("");
                          setEditingNote(note);
                        }}
                        className="rounded border border-slate-400 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-100 disabled:opacity-60"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => {
                          void handleDelete(note);
                        }}
                        className="rounded border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <PaginationControls
          ariaLabel="Notes pagination"
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
