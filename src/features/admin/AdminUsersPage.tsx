import { useEffect, useId, useRef, useState } from "react";
import { PaginationControls } from "../../components/PaginationControls";
import { ApiError } from "../../lib/api";
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
import { getCurrentUser } from "../auth/auth.api";
import type { User } from "../auth/auth.schema";
import {
  createAdminUser,
  deleteAdminUser,
  getAdminUser,
  listAdminUsers,
  updateAdminUser,
} from "./admin.api";
import type {
  CreateAdminUserPayload,
  UpdateAdminUserPayload,
} from "./admin.schema";
import { AdminUserDetail } from "./AdminUserDetail";
import { AdminUserForm } from "./AdminUserForm";

type Props = {
  token: string;
  currentUserId: string;
  onCurrentUserUpdated: (user: User) => void;
};

type ViewTarget = {
  id: string;
  revision: number;
};

export function AdminUsersPage({
  token,
  currentUserId,
  onCurrentUserUpdated,
}: Props) {
  const headingId = useId();
  const [listQuery, setListQuery] =
    useState<CursorPageQuery>(INITIAL_PAGE_QUERY);
  const [users, setUsers] = useState<User[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [listError, setListError] = useState("");

  const [viewTarget, setViewTarget] = useState<ViewTarget | null>(null);
  const [viewedUser, setViewedUser] = useState<User | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const deletingRef = useRef<Set<string>>(new Set());

  const [statusMessage, setStatusMessage] = useState("");
  const [actionError, setActionError] = useState("");

  const currentCursor = getCurrentCursor(listQuery);

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    async function loadUsers() {
      setIsLoadingList(true);
      setListError("");
      setPageInfo(null);
      setUsers([]);

      try {
        const page = await listAdminUsers(
          token,
          currentCursor,
          controller.signal,
        );
        if (ignore || controller.signal.aborted) return;
        setUsers(page.items);
        setPageInfo(page.pageInfo);
      } catch (error: unknown) {
        if (ignore || controller.signal.aborted) return;
        setListError(
          error instanceof Error ? error.message : "Failed to load users.",
        );
      } finally {
        if (!ignore && !controller.signal.aborted) {
          setIsLoadingList(false);
        }
      }
    }

    void loadUsers();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [token, currentCursor, listQuery.revision]);

  useEffect(() => {
    if (!viewTarget) {
      setViewedUser(null);
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
      setViewedUser(null);

      try {
        const user = await getAdminUser(token, targetId, controller.signal);
        if (ignore || controller.signal.aborted) return;
        setViewedUser(user);
      } catch (error: unknown) {
        if (ignore || controller.signal.aborted) return;
        setDetailError(
          error instanceof Error ? error.message : "Failed to load user.",
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

  async function handleCreate(values: CreateAdminUserPayload) {
    setActionError("");
    setStatusMessage("");
    await createAdminUser(token, values);
    setStatusMessage("User created.");
    refreshPageOne();
  }

  async function handleUpdate(userId: string, values: UpdateAdminUserPayload) {
    setActionError("");
    setStatusMessage("");
    const updated = await updateAdminUser(token, userId, values);
    setEditingUser(null);
    if (viewTarget?.id === updated.id) {
      setViewedUser(updated);
      setDetailError("");
    }
    setStatusMessage("User updated.");
    refreshPageOne();

    if (userId === currentUserId) {
      try {
        const freshUser = await getCurrentUser(token);
        onCurrentUserUpdated(freshUser);
      } catch (error: unknown) {
        if (!(error instanceof ApiError && error.status === 401)) {
          setActionError(
            error instanceof Error
              ? `User updated, but could not refresh session profile: ${error.message}`
              : "User updated, but could not refresh session profile.",
          );
        }
      }
    }
  }

  async function handleDelete(user: User) {
    if (user.role === "ADMIN") return;

    const confirmed = window.confirm(
      `Delete user "${user.name}" (${user.email})? This will also delete their notes and posts. This action cannot be undone.`,
    );
    if (!confirmed || deletingRef.current.has(user.id)) return;

    deletingRef.current.add(user.id);
    setDeletingIds((prev) => [...prev, user.id]);
    setActionError("");
    setStatusMessage("");

    try {
      await deleteAdminUser(token, user.id);
      if (editingUser?.id === user.id) {
        setEditingUser(null);
      }
      if (viewTarget?.id === user.id) {
        setViewTarget(null);
      }
      setStatusMessage("User deleted.");
      refreshPageOne();
    } catch (error: unknown) {
      setActionError(
        error instanceof Error ? error.message : "Failed to delete user.",
      );
    } finally {
      deletingRef.current.delete(user.id);
      setDeletingIds((prev) => prev.filter((id) => id !== user.id));
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
        Users
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
          Create user
        </h3>
        <AdminUserForm mode="create" onSubmitCreate={handleCreate} />
      </section>

      {editingUser && (
        <section className="rounded border border-slate-400 bg-white p-4">
          <h3 className="mb-3 text-base font-semibold text-slate-900">
            Edit user
          </h3>
          {/* Keyed by user id so editing another user starts clean, while list refreshes preserve unsaved drafts. */}
          <AdminUserForm
            key={editingUser.id}
            mode="edit"
            user={editingUser}
            onSubmitEdit={(values) => handleUpdate(editingUser.id, values)}
            onCancel={() => setEditingUser(null)}
            autoFocusName
          />
        </section>
      )}

      {viewTarget && (
        <AdminUserDetail
          user={viewedUser}
          isLoading={isLoadingDetail}
          error={detailError}
          focusKey={`${viewTarget.id}:${viewTarget.revision}`}
          onClose={() => setViewTarget(null)}
        />
      )}

      <section className="space-y-4">
        {isLoadingList && (
          <p role="status" className="text-sm text-slate-600">
            Loading users...
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

        {!isLoadingList && !listError && users.length === 0 && (
          <p className="rounded border border-slate-300 bg-white p-4 text-sm text-slate-700">
            {listQuery.cursorHistory.length === 1
              ? "No users found."
              : "No users found on this page."}
          </p>
        )}

        {!isLoadingList && !listError && users.length > 0 && (
          <ul className="space-y-3">
            {users.map((user) => {
              const isDeleting = deletingIds.includes(user.id);
              const isAdmin = user.role === "ADMIN";
              const isSelected =
                viewTarget?.id === user.id || editingUser?.id === user.id;

              return (
                <li
                  key={user.id}
                  className={`rounded border bg-white p-4 ${
                    isSelected ? "border-slate-500" : "border-slate-300"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <h3 className="break-words text-base font-semibold text-slate-900">
                        {user.name}
                      </h3>
                      <p className="break-words text-sm text-slate-700">
                        {user.email}
                      </p>
                      <p className="text-xs text-slate-600">
                        Role: {user.role} · Interests:{" "}
                        {user.interests.length > 0
                          ? user.interests.join(", ")
                          : "None"}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setViewTarget((prev) => ({
                              id: user.id,
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
                            setEditingUser(user);
                          }}
                          className="rounded border border-slate-400 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-100 disabled:opacity-60"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          disabled={isAdmin || isDeleting}
                          onClick={() => {
                            void handleDelete(user);
                          }}
                          className="rounded border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          {isDeleting ? "Deleting..." : "Delete"}
                        </button>
                      </div>

                      {isAdmin && (
                        <p className="text-xs text-slate-500">
                          Administrator accounts cannot be deleted.
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <PaginationControls
          ariaLabel="Users pagination"
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
