// Thin API client for the Django backend. The base URL points at the Django
// dev server (port 8000) and can be overridden with NEXT_PUBLIC_API_URL.

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://smdanial.pythonanywhere.com/api/";

/** DRF-style error body: field name -> list of messages (or a bare string). */
export type ApiErrorBody = Record<string, string[] | string>;

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody) {
    super("API request failed");
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/** First human-readable message from a DRF error body, with a fallback. */
export function firstErrorMessage(body: ApiErrorBody): string {
  for (const value of Object.values(body)) {
    if (typeof value === "string" && value.trim()) return value;
    if (Array.isArray(value) && value.length > 0) return value[0];
  }
  return "Something went wrong. Please try again.";
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  // FormData must not set Content-Type: the browser adds the multipart
  // boundary itself.
  const isFormData = options.body instanceof FormData;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(!isFormData ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    let body: ApiErrorBody = {};
    try {
      body = (await res.json()) as ApiErrorBody;
    } catch {
      // Non-JSON error body (e.g. 500 HTML page) — keep the generic message.
    }
    throw new ApiError(res.status, body);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}
