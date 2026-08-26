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

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
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
}

export const api = {
  get: (endpoint: string) => fetchApi(endpoint, { method: 'GET' }),
  post: (endpoint: string, body?: any) => fetchApi(endpoint, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: (endpoint: string, body?: any) => fetchApi(endpoint, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: (endpoint: string) => fetchApi(endpoint, { method: 'DELETE' }),
};


