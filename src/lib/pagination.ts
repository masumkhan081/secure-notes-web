import { z } from "zod";

export const DEFAULT_PAGE_SIZE = 10;

export const pageInfoSchema = z.object({
  hasMore: z.boolean(),
  nextCursor: z.string().nullable(),
});

export type PageInfo = z.infer<typeof pageInfoSchema>;

export type CursorPageQuery = {
  cursorHistory: Array<string | null>;
  revision: number;
};

export const INITIAL_PAGE_QUERY: CursorPageQuery = {
  cursorHistory: [null],
  revision: 0,
};

export function getCurrentCursor(query: CursorPageQuery): string | null {
  return query.cursorHistory[query.cursorHistory.length - 1] ?? null;
}

export function canGoPrevious(query: CursorPageQuery): boolean {
  return query.cursorHistory.length > 1;
}

export function pushNextCursor(
  query: CursorPageQuery,
  nextCursor: string,
): CursorPageQuery {
  return {
    ...query,
    cursorHistory: [...query.cursorHistory, nextCursor],
  };
}

export function popPreviousCursor(query: CursorPageQuery): CursorPageQuery {
  if (query.cursorHistory.length <= 1) return query;
  return {
    ...query,
    cursorHistory: query.cursorHistory.slice(0, -1),
  };
}

export function retryCurrentPage(query: CursorPageQuery): CursorPageQuery {
  return {
    ...query,
    revision: query.revision + 1,
  };
}

export function resetToFirstPage(query: CursorPageQuery): CursorPageQuery {
  return {
    cursorHistory: [null],
    revision: query.revision + 1,
  };
}
