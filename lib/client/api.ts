/**
 * CSRF-aware fetch wrapper. Reads csrf_token cookie (set by middleware on
 * safe-method responses) and mirrors it into X-CSRF-Token on state-changing
 * requests. Safe methods pass through untouched.
 *
 * Use this for any client-side fetch that hits /api/* with POST/PUT/PATCH/DELETE.
 */

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "X-CSRF-Token";

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const prefix = `${name}=`;
  for (const raw of document.cookie.split(";")) {
    const c = raw.trim();
    if (c.startsWith(prefix)) return decodeURIComponent(c.slice(prefix.length));
  }
  return undefined;
}

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();
  const isSafe = method === "GET" || method === "HEAD" || method === "OPTIONS";

  const headers = new Headers(init.headers);
  if (!isSafe) {
    const token = readCookie(CSRF_COOKIE_NAME);
    if (token) headers.set(CSRF_HEADER_NAME, token);
  }
  // Ensure cookies are sent for same-origin CSRF + auth.
  const credentials = init.credentials ?? "same-origin";

  return fetch(input, { ...init, headers, credentials });
}

export default apiFetch;
