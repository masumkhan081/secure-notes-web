import { z } from "zod";

const apiUrl = z
  .string()
  .url()
  .parse(import.meta.env.VITE_API_URL)
  .replace(/\/+$/, "");

const errorSchema = z.object({
  error: z.object({
    message: z.string(),
  }),
});

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string;
  signal?: AbortSignal;
};

export async function apiRequest<T>(
  path: string,
  schema: z.ZodType<T>,
  options: ApiOptions = {},
): Promise<T> {
  const headers = new Headers();

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${apiUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    body:
      options.body === undefined
        ? undefined
        : JSON.stringify(options.body),
    signal: options.signal,
  });

  const data: unknown =
    response.status === 204
      ? undefined
      : await response.json().catch(() => undefined);

  if (!response.ok) {
    if (response.status === 401 && options.token) {
      window.dispatchEvent(new Event("auth-expired"));
    }

    const parsed = errorSchema.safeParse(data);

    throw new ApiError(
      response.status,
      parsed.success
        ? parsed.data.error.message
        : `Request failed (${response.status}). Please try again.`,
    );
  }

  const parsed = schema.safeParse(data);

  if (!parsed.success) {
    throw new Error("The server returned an unexpected response.");
  }

  return parsed.data;
}