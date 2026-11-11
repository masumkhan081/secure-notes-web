import { z } from "zod";
import { pageInfoSchema } from "../../lib/pagination";

export const postSchema = z.object({
  id: z.string(),
  authorId: z.string(),
  title: z.string(),
  content: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const postResponseSchema = z.object({
  post: postSchema,
});

export const postsPageSchema = z.object({
  items: z.array(postSchema),
  pageInfo: pageInfoSchema,
});

export const authorPostsPageSchema = z.object({
  author: z.object({
    id: z.string(),
    name: z.string(),
  }),
  items: z.array(postSchema),
  pageInfo: pageInfoSchema,
});

export const postFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Enter a post title.")
    .max(200, "Title must be at most 200 characters."),
  content: z
    .string()
    .trim()
    .min(1, "Enter post content.")
    .max(20_000, "Content must be at most 20,000 characters."),
});

export type Post = z.infer<typeof postSchema>;
export type PostsPage = z.infer<typeof postsPageSchema>;
export type AuthorPostsPage = z.infer<typeof authorPostsPageSchema>;
export type PostFormValues = z.infer<typeof postFormSchema>;
