import { apiRequest } from "../../lib/api";
import { DEFAULT_PAGE_SIZE } from "../../lib/pagination";
import {
  authorPostsPageSchema,
  postResponseSchema,
  postsPageSchema,
  type AuthorPostsPage,
  type Post,
  type PostFormValues,
  type PostsPage,
} from "./posts.schema";

function buildPageParams(cursor: string | null): string {
  const params = new URLSearchParams({ limit: String(DEFAULT_PAGE_SIZE) });
  if (cursor) {
    params.set("cursor", cursor);
  }
  return params.toString();
}

export function listPosts(
  cursor: string | null,
  signal?: AbortSignal,
): Promise<PostsPage> {
  return apiRequest(
    `/api/posts?${buildPageParams(cursor)}`,
    postsPageSchema,
    { signal },
  );
}

export function listAuthorPosts(
  userId: string,
  cursor: string | null,
  signal?: AbortSignal,
): Promise<AuthorPostsPage> {
  return apiRequest(
    `/api/posts/by-user/${encodeURIComponent(userId)}?${buildPageParams(cursor)}`,
    authorPostsPageSchema,
    { signal },
  );
}

export async function createPost(
  token: string,
  values: PostFormValues,
): Promise<Post> {
  const response = await apiRequest("/api/posts", postResponseSchema, {
    method: "POST",
    token,
    body: {
      title: values.title,
      content: values.content,
    },
  });
  return response.post;
}
