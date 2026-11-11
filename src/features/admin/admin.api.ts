import { z } from "zod";
import { apiRequest } from "../../lib/api";
import { DEFAULT_PAGE_SIZE } from "../../lib/pagination";
import { userResponseSchema, type User } from "../auth/auth.schema";
import {
  adminNoteResponseSchema,
  adminNotesPageSchema,
  adminUsersPageSchema,
  type AdminNote,
  type AdminNotesPage,
  type AdminUsersPage,
  type CreateAdminUserPayload,
  type UpdateAdminUserPayload,
} from "./admin.schema";

function buildPageParams(cursor: string | null): string {
  const params = new URLSearchParams({ limit: String(DEFAULT_PAGE_SIZE) });
  if (cursor) {
    params.set("cursor", cursor);
  }
  return params.toString();
}

export function listAdminUsers(
  token: string,
  cursor: string | null,
  signal?: AbortSignal,
): Promise<AdminUsersPage> {
  return apiRequest(
    `/api/admin/users?${buildPageParams(cursor)}`,
    adminUsersPageSchema,
    { token, signal },
  );
}

export async function getAdminUser(
  token: string,
  id: string,
  signal?: AbortSignal,
): Promise<User> {
  const response = await apiRequest(
    `/api/admin/users/${encodeURIComponent(id)}`,
    userResponseSchema,
    { token, signal },
  );
  return response.user;
}

export async function createAdminUser(
  token: string,
  payload: CreateAdminUserPayload,
): Promise<User> {
  const response = await apiRequest("/api/admin/users", userResponseSchema, {
    method: "POST",
    token,
    body: {
      name: payload.name,
      email: payload.email,
      password: payload.password,
      interests: payload.interests,
    },
  });
  return response.user;
}

export async function updateAdminUser(
  token: string,
  id: string,
  payload: UpdateAdminUserPayload,
): Promise<User> {
  const response = await apiRequest(
    `/api/admin/users/${encodeURIComponent(id)}`,
    userResponseSchema,
    {
      method: "PATCH",
      token,
      body: {
        name: payload.name,
        email: payload.email,
        interests: payload.interests,
      },
    },
  );
  return response.user;
}

export function deleteAdminUser(token: string, id: string): Promise<void> {
  return apiRequest(`/api/admin/users/${encodeURIComponent(id)}`, z.void(), {
    method: "DELETE",
    token,
  });
}

export function listAdminNotes(
  token: string,
  cursor: string | null,
  signal?: AbortSignal,
): Promise<AdminNotesPage> {
  return apiRequest(
    `/api/admin/notes?${buildPageParams(cursor)}`,
    adminNotesPageSchema,
    { token, signal },
  );
}

export async function getAdminNote(
  token: string,
  id: string,
  signal?: AbortSignal,
): Promise<AdminNote> {
  const response = await apiRequest(
    `/api/admin/notes/${encodeURIComponent(id)}`,
    adminNoteResponseSchema,
    { token, signal },
  );
  return response.note;
}
