/**
 * Minimal JSON helper for Member C's features.
 *
 * Member B owns `src/api/client.ts`. Until it lands, these features call the
 * backend through this helper. Once it exists, `request` can simply delegate to it;
 * no component imports `fetch` directly.
 *
 *   VITE_API_BASE_URL   default http://localhost:8000
 *   VITE_USE_MOCK=true  answer from the contract examples, no backend needed
 */

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

type Env = { VITE_API_BASE_URL?: string; VITE_USE_MOCK?: string };
const env: Env = ((import.meta as unknown as { env?: Env }).env ?? {}) as Env;

export const API_BASE_URL = (env.VITE_API_BASE_URL ?? "http://localhost:8000").replace(/\/$/, "");
export const USE_MOCK = env.VITE_USE_MOCK === "true";

export async function request<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
  opts: { timeoutMs?: number; signal?: AbortSignal } = {},
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 8000);
  opts.signal?.addEventListener("abort", () => controller.abort());
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      let detail = res.statusText;
      try {
        detail = ((await res.json()) as { detail?: string }).detail ?? detail;
      } catch {
        /* non-JSON error body */
      }
      throw new ApiError(res.status, String(detail));
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/** Resolve after a short delay, so mock mode feels like a real network call. */
export function mockResponse<T>(value: T, ms = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
