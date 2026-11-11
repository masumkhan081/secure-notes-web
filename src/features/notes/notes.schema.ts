import { z } from "zod";

export const noteSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const noteResponseSchema = z.object({
  note: noteSchema,
});

export const notesPageSchema = z.object({
  items: z.array(noteSchema),
  pageInfo: z.object({
    hasMore: z.boolean(),
    nextCursor: z.string().nullable(),
  }),
});

export const noteFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Enter a title.")
    .max(200, "Title must be at most 200 characters."),
  content: z
    .string()
    .trim()
    .min(1, "Enter note content.")
    .max(20_000, "Content must be at most 20,000 characters."),
});

export type Note = z.infer<typeof noteSchema>;
export type NotesPage = z.infer<typeof notesPageSchema>;
export type NoteFormValues = z.infer<typeof noteFormSchema>;
