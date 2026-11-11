import { apiRequest } from "../../lib/api";
import { userResponseSchema, type User } from "./auth.schema";

export async function getCurrentUser(
  token: string,
  signal?: AbortSignal,
): Promise<User> {
  const response = await apiRequest("/api/auth/me", userResponseSchema, {
    token,
    signal,
  });
  return response.user;
}
