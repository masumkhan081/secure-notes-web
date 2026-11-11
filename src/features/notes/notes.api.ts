import { z } from "zod";
import { apiRequest } from "../../lib/api";
import {
  noteResponseSchema,
  notesPageSchema,
  type Note,
  type NoteFormValues,
  type NotesPage,
} from "./notes.schema";

export const NOTES_PAGE_SIZE = 10;

export function listNotes(
  token: string,
  cursor: string | null,
  signal?: AbortSignal,
): Promise<NotesPage> {
  const params = new URLSearchParams({ limit: String(NOTES_PAGE_SIZE) });
  if (cursor) {
    params.set("cursor", cursor);
  }

  return apiRequest(`/api/notes?${params.toString()}`, notesPageSchema, {
    token,
    signal,
  });
}

export async function getNote(
  token: string,
  id: string,
  signal?: AbortSignal,
): Promise<Note> {
  const response = await apiRequest(
    `/api/notes/${encodeURIComponent(id)}`,
    noteResponseSchema,
    { token, signal },
  );
  return response.note;
}

export async function createNote(
  token: string,
  values: NoteFormValues,
): Promise<Note> {
  const response = await apiRequest("/api/notes", noteResponseSchema, {
    method: "POST",
    token,
    body: {
      title: values.title,
      content: values.content,
    },
  });
  return response.note;
}

export async function updateNote(
  token: string,
  id: string,
  values: NoteFormValues,
): Promise<Note> {
  const response = await apiRequest(
    `/api/notes/${encodeURIComponent(id)}`,
    noteResponseSchema,
    {
      method: "PATCH",
      token,
      body: {
        title: values.title,
        content: values.content,
      },
    },
  );
  return response.note;
}

export function deleteNote(token: string, id: string): Promise<void> {
  return apiRequest(`/api/notes/${encodeURIComponent(id)}`, z.void(), {
    method: "DELETE",
    token,
  });
}
