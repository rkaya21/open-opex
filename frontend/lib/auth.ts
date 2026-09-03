/** JWT auth helpers. Tokens are kept in localStorage; authFetch retries once
 * through the refresh endpoint before giving up. */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const ACCESS_KEY = "openopex.access";
const REFRESH_KEY = "openopex.refresh";

export class AuthError extends Error {
  constructor() {
    super("Not authenticated");
    this.name = "AuthError";
  }
}

export function isLoggedIn(): boolean {
  return typeof window !== "undefined" && !!localStorage.getItem(ACCESS_KEY);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export async function login(email: string, password: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    throw new Error("Invalid email or password");
  }
  const { access, refresh } = (await response.json()) as {
    access: string;
    refresh: string;
  };
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

async function tryRefresh(): Promise<boolean> {
  const refresh = localStorage.getItem(REFRESH_KEY);
  if (!refresh) return false;
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!response.ok) return false;
  const { access } = (await response.json()) as { access: string };
  localStorage.setItem(ACCESS_KEY, access);
  return true;
}

export async function downloadFile(path: string, filename: string): Promise<void> {
  const response = await authFetch(path);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function authFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  if (!localStorage.getItem(ACCESS_KEY) && !localStorage.getItem(REFRESH_KEY)) {
    throw new AuthError();
  }
  const isFormData = options.body instanceof FormData;
  const doFetch = () =>
    fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        // Browsers set the multipart boundary themselves for FormData
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        Authorization: `Bearer ${localStorage.getItem(ACCESS_KEY) ?? ""}`,
        ...options.headers,
      },
    });

  let response = await doFetch();
  if (response.status === 401 && (await tryRefresh())) {
    response = await doFetch();
  }
  if (response.status === 401) {
    clearTokens();
    throw new AuthError();
  }
  return response;
}
