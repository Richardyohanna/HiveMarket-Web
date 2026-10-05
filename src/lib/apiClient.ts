import { API_BASE_URL } from './config';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './tokenStorage';

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  isFormData?: boolean;
  skipAuth?: boolean;
  // Internal: prevents infinite refresh loops.
  _retried?: boolean;
};

let refreshInFlight: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) return false;
    const data = await response.json();
    if (!data?.token) return false;
    setTokens(data.token, data.refreshToken || refreshToken);
    return true;
  } catch {
    return false;
  }
}

function extractErrorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    if (typeof record.message === 'string') return record.message;
  }
  if (typeof body === 'string' && body.trim()) return body;
  return fallback;
}

/**
 * Centralized fetch wrapper for every HiveMarket API call made from the web app.
 * Attaches the bearer token, parses JSON responses, retries once on a 401 by
 * refreshing the access token, and throws ApiError with a readable message
 * on any non-2xx response.
 */
export async function apiFetch<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, isFormData = false, skipAuth = false, _retried = false } = options;

  const headers: Record<string, string> = {};
  if (!isFormData) headers['Content-Type'] = 'application/json';

  if (!skipAuth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
  });

  if (response.status === 401 && !skipAuth && !_retried && getRefreshToken()) {
    refreshInFlight = refreshInFlight || doRefresh();
    const refreshed = await refreshInFlight;
    refreshInFlight = null;
    if (refreshed) {
      return apiFetch<T>(path, { ...options, _retried: true });
    }
    clearTokens();
  }

  const contentType = response.headers.get('content-type') || '';
  let parsedBody: unknown;
  if (contentType.includes('application/json')) {
    parsedBody = await response.json().catch(() => null);
  } else {
    const text = await response.text().catch(() => '');
    parsedBody = text || null;
  }

  if (!response.ok) {
    throw new ApiError(
      extractErrorMessage(parsedBody, `Request failed with status ${response.status}`),
      response.status,
      parsedBody,
    );
  }

  return parsedBody as T;
}
