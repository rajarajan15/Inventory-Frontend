const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');

/**
 * Two independent sessions: the StockWise super admin portal ("platform") and an organization
 * portal ("org"). A token from one area is never sent to the other.
 */
const SESSION_KEYS = {
  platform: 'stockwise_platform_session',
  org: 'stockwise_org_session',
};

const FALLBACK_MESSAGES = {
  0: 'Unable to reach the StockWise server. Check your internet connection and that the server is running.',
  401: 'Please sign in to continue.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested item could not be found.',
  413: 'The file is too large.',
  429: 'Too many attempts. Please wait a moment and try again.',
  500: 'Something went wrong on our side. Please try again.',
};

export class ApiError extends Error {
  constructor(payload, status) {
    super(payload?.message || FALLBACK_MESSAGES[status] || (status >= 500 ? FALLBACK_MESSAGES[500] : 'Something went wrong. Please try again.'));
    this.status = status;
    this.payload = payload || {};
    this.validationErrors = payload?.validationErrors || null;
  }
}

export const sessions = {
  get(scope) {
    try {
      const raw = localStorage.getItem(SESSION_KEYS[scope]);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  /** Stores a login response ({ accessToken, refreshToken, id, name, ... }) and returns the user. */
  save(scope, authData) {
    const user = {
      id: authData.id,
      name: authData.name,
      email: authData.email,
      role: authData.role,
      organizationSlug: authData.organizationSlug || null,
      organizationName: authData.organizationName || null,
    };
    localStorage.setItem(SESSION_KEYS[scope], JSON.stringify({
      accessToken: authData.accessToken,
      refreshToken: authData.refreshToken,
      user,
    }));
    return user;
  },

  updateTokens(scope, { accessToken, refreshToken }) {
    const current = sessions.get(scope);
    if (!current) return;
    localStorage.setItem(SESSION_KEYS[scope], JSON.stringify({
      ...current,
      accessToken: accessToken || current.accessToken,
      refreshToken: refreshToken || current.refreshToken,
    }));
  },

  clear(scope) {
    localStorage.removeItem(SESSION_KEYS[scope]);
  },

  /**
   * localStorage is shared by every tab, so a sign-in or sign-out in one tab changes the token all tabs send.
   * Calls onChange in the other tabs so they show the account that is actually signed in.
   */
  watch(scope, onChange) {
    const handler = (e) => {
      if (e.key === SESSION_KEYS[scope] || e.key === null) onChange(sessions.get(scope));
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  },
};

/** One refresh at a time per session: parallel 401s wait for the same refresh instead of each starting one. */
const refreshInFlight = {};

async function refreshSession(scope, refreshToken) {
  if (!refreshInFlight[scope]) {
    refreshInFlight[scope] = (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return false;
        sessions.updateTokens(scope, await res.json());
        return true;
      } catch {
        return false;
      } finally {
        delete refreshInFlight[scope];
      }
    })();
  }
  return refreshInFlight[scope];
}

/**
 * @param path      API path
 * @param options   fetch options plus:
 *                  scope       – 'platform' | 'org' session to authenticate with (omit for public calls)
 *                  skipRefresh – do not try a token refresh on 401 (login calls)
 */
export async function request(path, options = {}, retry = true) {
  const { scope, skipRefresh, ...fetchOptions } = options;
  const method = (fetchOptions.method || 'GET').toUpperCase();
  const session = scope ? sessions.get(scope) : null;

  const isFormData = fetchOptions.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
    ...(fetchOptions.headers || {}),
  };

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...fetchOptions, method, headers });
  } catch {
    throw new ApiError(null, 0);
  }

  if (response.status === 401 && scope && !skipRefresh) {
    // Another request already renewed the token while this one was in flight: just retry with the new token
    const current = sessions.get(scope);
    if (retry && current?.accessToken && current.accessToken !== session?.accessToken) {
      return request(path, options, false);
    }
    if (retry && session?.refreshToken && await refreshSession(scope, session.refreshToken)) {
      return request(path, options, false);
    }
    sessions.clear(scope);
    window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: { scope } }));
    throw new ApiError({ message: 'Your session has expired. Please sign in again.' }, 401);
  }

  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(data, response.status);
  return data;
}

const json = (body) => JSON.stringify(body);

/** Builds "?a=1&b=2" from an object, skipping empty values. */
export function queryString(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, v);
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

async function logout(scope) {
  const refreshToken = sessions.get(scope)?.refreshToken;
  try {
    if (refreshToken) {
      await request('/api/auth/logout', { method: 'POST', body: json({ refreshToken }), skipRefresh: true });
    }
  } catch {
    // Server-side revoke is best effort; the local session is cleared regardless
  } finally {
    sessions.clear(scope);
  }
}

/** Unauthenticated pages: subscription request, organization lookup, invitations. */
export const publicApi = {
  requestAccess: (body) => request('/api/public/subscription-requests', { method: 'POST', body: json(body) }),
  organization: (slug) => request(`/api/public/organizations/${encodeURIComponent(slug)}`),
  invitation: (token) => request(`/api/public/invitations/${encodeURIComponent(token)}`),
  acceptInvitation: (token, body) => request(`/api/public/invitations/${encodeURIComponent(token)}/accept`, { method: 'POST', body: json(body) }),
};

/** StockWise super admin portal. */
export const platformApi = (() => {
  const call = (path, options = {}) => request(`/api/platform${path}`, { ...options, scope: 'platform' });
  return {
    login: async (credentials) => {
      const data = await request('/api/platform/auth/login', { method: 'POST', body: json(credentials), skipRefresh: true });
      return sessions.save('platform', data);
    },
    logout: () => logout('platform'),

    requests: (status) => call(`/subscription-requests${status ? `?status=${status}` : ''}`),
    rejectRequest: (id, note) => call(`/subscription-requests/${id}/reject`, { method: 'POST', body: json({ note }) }),

    organizations: () => call('/organizations'),
    organization: (id) => call(`/organizations/${id}`),
    createOrganization: (body) => call('/organizations', { method: 'POST', body: json(body) }),
    setOrganizationStatus: (id, status) => call(`/organizations/${id}/status`, { method: 'PATCH', body: json({ status }) }),
    admins: (id) => call(`/organizations/${id}/admins`),
    inviteAdmin: (id, body) => call(`/organizations/${id}/admin-invitations`, { method: 'POST', body: json(body) }),
  };
})();

/** One organization's portal; every call is scoped to /api/orgs/{slug}. */
export function orgApi(slug) {
  const base = `/api/orgs/${encodeURIComponent(slug)}`;
  const call = (path, options = {}) => request(`${base}${path}`, { ...options, scope: 'org' });

  return {
    // Auth
    login: async (credentials) => {
      const data = await request(`${base}/auth/login`, { method: 'POST', body: json(credentials), skipRefresh: true });
      return sessions.save('org', data);
    },
    register: (body) => request(`${base}/auth/register`, { method: 'POST', body: json(body), skipRefresh: true }),
    logout: () => logout('org'),

    // Organization
    organization: () => call('/organization'),
    setupOrg: (body) => call('/organization/setup', { method: 'POST', body: json(body) }),
    importCsv: (formData) => call('/organization/import-csv', { method: 'POST', body: formData }),

    // Products. products() returns a page: { content, page, size, totalElements, totalPages }
    products: (params) => call(`/products${queryString(params)}`),
    productSummary: () => call('/products/summary'),
    movements: (id, params) => call(`/products/${id}/movements${queryString(params)}`),
    product: (id) => call(`/products/${id}`),
    saveProduct: (body, id) => call(id ? `/products/${id}` : '/products', { method: id ? 'PUT' : 'POST', body: json(body) }),
    deleteProduct: (id) => call(`/products/${id}`, { method: 'DELETE' }),
    stock: (id, type, quantity, notes = '') => call(`/products/${id}/stock/${type}`, { method: 'POST', body: json({ quantity, notes }) }),
    lowStock: () => call('/products/low-stock'),

    // Categories
    categories: () => call('/categories'),
    category: (id) => call(`/categories/${id}`),
    saveCategory: (body, id) => call(id ? `/categories/${id}` : '/categories', { method: id ? 'PUT' : 'POST', body: json(body) }),
    deleteCategory: (id) => call(`/categories/${id}`, { method: 'DELETE' }),

    // Members
    users: (status) => call(`/users${status ? `?status=${status}` : ''}`),
    user: (id) => call(`/users/${id}`),
    approveUser: (id) => call(`/users/${id}/approve`, { method: 'POST' }),
    rejectUser: (id) => call(`/users/${id}/reject`, { method: 'POST' }),
    disableUser: (id) => call(`/users/${id}/disable`, { method: 'POST' }),
    enableUser: (id) => call(`/users/${id}/enable`, { method: 'POST' }),
    inviteUser: (body) => call('/users/invite', { method: 'POST', body: json(body) }),
  };
}
