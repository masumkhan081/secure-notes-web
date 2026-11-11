import { useEffect, useId, useState } from "react";
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
import { formatNoteDate } from "../notes/formatDate";
import { createPost, listAuthorPosts, listPosts } from "./posts.api";
import { PostForm } from "./PostForm";
import type { AuthorPostsPage, Post, PostFormValues } from "./posts.schema";

type Props = {
  token?: string;
  onRequestLogin?: () => void;
};

const PREVIEW_MAX_CHARS = 240;
const PREVIEW_MAX_LINES = 3;

function isTruncatablePost(content: string): boolean {
  return (
    content.length > PREVIEW_MAX_CHARS ||
    content.split("\n").length > PREVIEW_MAX_LINES
  );
}

function getCollapsedPostText(content: string): string {
  const lines = content.split("\n");
  const hasExtraLines = lines.length > PREVIEW_MAX_LINES;
  const lineClipped = hasExtraLines
    ? lines.slice(0, PREVIEW_MAX_LINES).join("\n")
    : content;

  if (lineClipped.length > PREVIEW_MAX_CHARS) {
    return `${lineClipped.slice(0, PREVIEW_MAX_CHARS)}...`;
  }

  return hasExtraLines ? `${lineClipped}...` : lineClipped;
}

export function PostsPage({ token, onRequestLogin }: Props) {
  const headingId = useId();

  const [allPostsQuery, setAllPostsQuery] =
    useState<CursorPageQuery>(INITIAL_PAGE_QUERY);
  const [posts, setPosts] = useState<Post[]>([]);
  const [allPageInfo, setAllPageInfo] = useState<PageInfo | null>(null);
  const [isLoadingAll, setIsLoadingAll] = useState(true);
  const [allError, setAllError] = useState("");

  const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(null);
  const [authorQuery, setAuthorQuery] =
    useState<CursorPageQuery>(INITIAL_PAGE_QUERY);
  const [authorData, setAuthorData] = useState<AuthorPostsPage | null>(null);
  const [isLoadingAuthor, setIsLoadingAuthor] = useState(false);
  const [authorError, setAuthorError] = useState("");

  const [expandedPostIds, setExpandedPostIds] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState("");

  const allCursor = getCurrentCursor(allPostsQuery);
  const authorCursor = getCurrentCursor(authorQuery);

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    async function loadPosts() {
      setIsLoadingAll(true);
      setAllError("");
      setAllPageInfo(null);
      setPosts([]);

      try {
        const page = await listPosts(allCursor, controller.signal);
        if (ignore || controller.signal.aborted) return;
        setPosts(page.items);
        setAllPageInfo(page.pageInfo);
      } catch (error: unknown) {
        if (ignore || controller.signal.aborted) return;
        setAllError(
          error instanceof Error ? error.message : "Failed to load posts.",
        );
      } finally {
        if (!ignore && !controller.signal.aborted) {
          setIsLoadingListDone();
        }
      }
    }

    function setIsLoadingListDone() {
      setIsLoadingAll(false);
    }

    void loadPosts();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [allCursor, allPostsQuery.revision]);

  useEffect(() => {
    if (!selectedAuthorId) {
      setAuthorData(null);
      setAuthorError("");
      setIsLoadingAuthor(false);
      return;
    }

    const targetAuthorId = selectedAuthorId;
    const controller = new AbortController();
    let ignore = false;

    async function loadAuthorPosts() {
      setIsLoadingAuthor(true);
      setAuthorError("");
      setAuthorData(null);

      try {
        const page = await listAuthorPosts(
          targetAuthorId,
          authorCursor,
          controller.signal,
        );
        if (ignore || controller.signal.aborted) return;
        setAuthorData(page);
      } catch (error: unknown) {
        if (ignore || controller.signal.aborted) return;
        setAuthorError(
          error instanceof Error
            ? error.message
            : "Failed to load author posts.",
        );
      } finally {
        if (!ignore && !controller.signal.aborted) {
          setIsLoadingAuthor(false);
        }
      }
    }

    void loadAuthorPosts();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [selectedAuthorId, authorCursor, authorQuery.revision]);

  async function handleCreate(values: PostFormValues) {
    if (!token) return;
    setStatusMessage("");
    await createPost(token, values);
    setSelectedAuthorId(null);
    setExpandedPostIds([]);
    setStatusMessage("Public post published.");
    setAllPostsQuery(resetToFirstPage);
  }

  function openAuthorPosts(authorId: string) {
    setSelectedAuthorId(authorId);
    setAuthorQuery(INITIAL_PAGE_QUERY);
    setExpandedPostIds([]);
  }

  function toggleExpanded(postId: string) {
    setExpandedPostIds((prev) =>
      prev.includes(postId)
        ? prev.filter((id) => id !== postId)
        : [...prev, postId],
    );
  }

  const isAuthorView = selectedAuthorId !== null;
  const activeQuery = isAuthorView ? authorQuery : allPostsQuery;
  const activeItems = isAuthorView ? (authorData?.items ?? []) : posts;
  const activePageInfo = isAuthorView
    ? (authorData?.pageInfo ?? null)
    : allPageInfo;
  const isLoading = isAuthorView ? isLoadingAuthor : isLoadingAll;
  const activeError = isAuthorView ? authorError : allError;

  const hasPrevious = canGoPrevious(activeQuery);
  const canGoNext =
    !isLoading &&
    !activeError &&
    Boolean(activePageInfo?.hasMore && activePageInfo.nextCursor);

  return (
    <section aria-labelledby={headingId} className="mt-6 space-y-6">
      <h2 id={headingId} className="text-xl font-semibold text-slate-900">
        Public posts
      </h2>

      {statusMessage && (
        <p
          role="status"
          className="rounded border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
        >
          {statusMessage}
        </p>
      )}

      {token ? (
        <section className="rounded border border-slate-300 bg-white p-4">
          <h3 className="text-base font-semibold text-slate-900">
            Create public post
          </h3>
          <p className="mb-3 mt-1 text-xs text-slate-600">
            Posts are public and can be read by anyone, including visitors who
            are not logged in.
          </p>
          <PostForm onSubmitPost={handleCreate} />
        </section>
      ) : (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded border border-slate-300 bg-white p-4">
          <p className="text-sm text-slate-700">
            Anyone can read public posts. Log in to write and publish a post.
          </p>
          {onRequestLogin && (
            <button
              type="button"
              onClick={onRequestLogin}
              className="rounded border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Log in to write a post
            </button>
          )}
        </section>
      )}

      <section className="space-y-4">
        {isAuthorView && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-slate-300 bg-white p-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {authorData
                  ? `Posts by ${authorData.author.name}`
                  : "Author posts"}
              </h3>
              <p className="text-xs text-slate-600">
                Author ID: {selectedAuthorId}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedAuthorId(null);
                setExpandedPostIds([]);
              }}
              className="rounded border border-slate-400 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-100"
            >
              Back to all posts
            </button>
          </div>
        )}

        {isLoading && (
          <p role="status" className="text-sm text-slate-600">
            Loading posts...
          </p>
        )}

        {!isLoading && activeError && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded border border-red-300 bg-red-50 p-4 text-sm text-red-800"
          >
            <p>{activeError}</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  if (isAuthorView) {
                    setAuthorQuery(retryCurrentPage);
                  } else {
                    setAllPostsQuery(retryCurrentPage);
                  }
                }}
                className="rounded border border-red-400 bg-white px-3 py-1.5 font-medium text-red-800 hover:bg-red-100"
              >
                Retry
              </button>

              {isAuthorView && (
                <button
                  type="button"
                  onClick={() => setSelectedAuthorId(null)}
                  className="rounded border border-slate-400 bg-white px-3 py-1.5 font-medium text-slate-800 hover:bg-slate-100"
                >
                  Back to all posts
                </button>
              )}
            </div>
          </div>
        )}

        {!isLoading && !activeError && activeItems.length === 0 && (
          <p className="rounded border border-slate-300 bg-white p-4 text-sm text-slate-700">
            {isAuthorView
              ? activeQuery.cursorHistory.length === 1
                ? "This author has not published any posts yet."
                : "No posts found on this page."
              : activeQuery.cursorHistory.length === 1
                ? "No public posts yet."
                : "No posts found on this page."}
          </p>
        )}

        {!isLoading && !activeError && activeItems.length > 0 && (
          <ul className="space-y-3">
            {activeItems.map((post) => {
              const truncatable = isTruncatablePost(post.content);
              const isExpanded = expandedPostIds.includes(post.id);
              const displayContent =
                !truncatable || isExpanded
                  ? post.content
                  : getCollapsedPostText(post.content);

              return (
                <li
                  key={post.id}
                  className="rounded border border-slate-300 bg-white p-4"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <h3 className="break-words text-base font-semibold text-slate-900">
                          {post.title}
                        </h3>
                        <p className="text-xs text-slate-600">
                          Author ID: {post.authorId} · Published:{" "}
                          {formatNoteDate(post.createdAt)}
                        </p>
                      </div>

                      {!isAuthorView && (
                        <button
                          type="button"
                          onClick={() => openAuthorPosts(post.authorId)}
                          className="rounded border border-slate-400 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-100"
                        >
                          View author's posts
                        </button>
                      )}
                    </div>

                    <p className="whitespace-pre-wrap break-words text-sm text-slate-800">
                      {displayContent}
                    </p>

                    {truncatable && (
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        onClick={() => toggleExpanded(post.id)}
                        className="text-sm font-medium text-slate-800 underline hover:text-slate-950"
                      >
                        {isExpanded ? "Show less" : "Show full post"}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <PaginationControls
          ariaLabel={
            isAuthorView ? "Author posts pagination" : "Public posts pagination"
          }
          canGoPrevious={hasPrevious}
          canGoNext={canGoNext}
          onPrevious={() => {
            setExpandedPostIds([]);
            if (isAuthorView) {
              setAuthorQuery(popPreviousCursor);
            } else {
              setAllPostsQuery(popPreviousCursor);
            }
          }}
          onNext={() => {
            const nextCursor = activePageInfo?.nextCursor;
            if (!nextCursor) return;
            setExpandedPostIds([]);
            if (isAuthorView) {
              setAuthorQuery((prev) => pushNextCursor(prev, nextCursor));
            } else {
              setAllPostsQuery((prev) => pushNextCursor(prev, nextCursor));
            }
          }}
        />
      </section>
    </section>
  );
}
