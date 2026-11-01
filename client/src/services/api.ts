const rawApiUrl =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
    ? 'https://parikshatantra.onrender.com/api'
    : '/api');

export const API_BASE = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl;

/**
 * Authoritative Bearer Token Resolver.
 * Rejects undefined, null, empty string, or whitespace tokens.
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('pt_token') || localStorage.getItem('pariksha_token');
  if (!token) return null;
  const trimmed = token.trim();
  if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') {
    return null;
  }
  return trimmed;
}

/**
 * Persists or clears the authentication token across canonical keys.
 */
export function setAuthToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token && token.trim() && token !== 'null' && token !== 'undefined') {
    localStorage.setItem('pt_token', token.trim());
    localStorage.setItem('pariksha_token', token.trim());
  } else {
    localStorage.removeItem('pt_token');
    localStorage.removeItem('pariksha_token');
  }
}

/**
 * Clears local credentials and broadcasts session termination.
 */
export function clearAuthSession(reason = 'SESSION_TERMINATED') {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('pt_token');
  localStorage.removeItem('pariksha_token');
  window.dispatchEvent(new CustomEvent('pt:auth_error', { detail: { reason } }));
}

// In-flight request cache for deduplication
const inFlightCache = new Map<string, Promise<any>>();

/**
 * Generates a cache key for request deduplication.
 * Only GET requests are deduplicated by default.
 */
function getCacheKey(endpoint: string, options: RequestInit): string {
  const method = options.method || 'GET';
  if (method !== 'GET') return '';
  const body = options.body ? JSON.stringify(options.body) : '';
  return `${method}:${endpoint}:${body}`;
}

export interface FetchApiOptions extends RequestInit {
  /**
   * Optional AbortSignal for request cancellation.
   * If not provided, a new AbortController is created internally.
   */
  signal?: AbortSignal;
  /**
   * Whether to skip deduplication for this request.
   * Defaults to false for GET, true for mutations.
   */
  skipDedupe?: boolean;
  /**
   * Custom cache key for deduplication.
   * If provided, this key is used instead of auto-generated one.
   */
  cacheKey?: string;
}

export async function fetchApi(endpoint: string, options: FetchApiOptions = {}): Promise<any> {
  const token = getAuthToken();
  const { signal, skipDedupe = false, cacheKey, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Request deduplication for GET requests
  const cacheKey_ = cacheKey || getCacheKey(endpoint, fetchOptions);
  if (!skipDedupe && cacheKey_ && inFlightCache.has(cacheKey_)) {
    return inFlightCache.get(cacheKey_)!;
  }

  const requestPromise = (async () => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...fetchOptions,
      headers,
      signal,
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 401) {
      clearAuthSession('UNAUTHORIZED');
      const err: any = new Error(data.message || data.error || 'Authentication Required: Session expired or invalid.');
      err.status = 401;
      err.isAuthError = true;
      throw err;
    }

    if (!res.ok) {
      const err: any = new Error(data.message || data.error || `HTTP Error ${res.status}`);
      err.status = res.status;
      throw err;
    }

    return data;
  })();

  // Store in cache for deduplication
  if (!skipDedupe && cacheKey_) {
    inFlightCache.set(cacheKey_, requestPromise);
    // Remove from cache after request completes (success or failure)
    requestPromise.finally(() => inFlightCache.delete(cacheKey_));
  }

  return requestPromise;
}

/**
 * Cancels all in-flight requests.
 * Useful for logout or major navigation changes.
 */
export function cancelAllRequests(): void {
  // Note: We can't actually cancel promises, but we can clear the cache
  // so subsequent requests won't return cached in-flight promises
  inFlightCache.clear();
}

/**
 * Creates an AbortController with timeout.
 * @param ms Timeout in milliseconds
 */
export function createTimeoutSignal(ms: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

export const api = {
  get: (endpoint: string, options?: Omit<FetchApiOptions, 'method'>) =>
    fetchApi(endpoint, { ...options, method: 'GET' }),
  post: (endpoint: string, body?: any, options?: Omit<FetchApiOptions, 'method' | 'body'>) =>
    fetchApi(endpoint, { ...options, method: 'POST', body: body ? JSON.stringify(body) : undefined, skipDedupe: true }),
  put: (endpoint: string, body?: any, options?: Omit<FetchApiOptions, 'method' | 'body'>) =>
    fetchApi(endpoint, { ...options, method: 'PUT', body: body ? JSON.stringify(body) : undefined, skipDedupe: true }),
  delete: (endpoint: string, options?: Omit<FetchApiOptions, 'method'>) =>
    fetchApi(endpoint, { ...options, method: 'DELETE', skipDedupe: true }),
};