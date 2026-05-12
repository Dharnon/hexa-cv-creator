const TOKEN_KEY = 'hexa_cv_token';

export function getApiBaseUrl(): string {
  // En desarrollo siempre mismo origen + proxy `/api` en vite.config (evita CORS).
  if (import.meta.env.DEV) {
    return '';
  }
  const url = import.meta.env.VITE_API_URL as string | undefined;
  if (url && url.trim()) {
    return url.replace(/\/$/, '');
  }
  return '';
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    /* ignore */
  }
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const base = getApiBaseUrl();
  const headers = new Headers(init.headers);
  const token = getStoredToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && init.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(`${base}${path}`, { ...init, headers });
}
