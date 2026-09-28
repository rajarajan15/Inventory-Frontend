const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(payload, status) { super(payload?.message || 'Something went wrong.'); this.status = status; this.payload = payload || {}; }
}

const readCookie = (name) => document.cookie.split('; ').find((row) => row.startsWith(`${name}=`))?.split('=').slice(1).join('=');
const csrfHeader = () => ({ 'X-XSRF-TOKEN': decodeURIComponent(readCookie('XSRF-TOKEN') || '') });

export async function request(path, options = {}, retry = true) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) };
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && !path.endsWith('/register') && !path.endsWith('/login')) Object.assign(headers, csrfHeader());
  let response;
  try { response = await fetch(`${API_BASE_URL}${path}`, { ...options, method, headers, credentials: 'include' }); }
  catch { throw new ApiError({ message: 'Unable to reach the inventory server. Check that it is running.' }, 0); }
  if (response.status === 401 && retry && !path.includes('/auth/')) {
    const refresh = await fetch(`${API_BASE_URL}/api/auth/refresh`, { method: 'POST', credentials: 'include', headers: csrfHeader() });
    if (refresh.ok) return request(path, options, false);
  }
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(data, response.status);
  return data;
}

export const api = {
  initializeCsrf: () => request('/api/auth/csrf'),
  login: (body) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  register: (body) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  products: (query = '') => request(`/api/products${query}`),
  product: (id) => request(`/api/products/${id}`),
  saveProduct: (body, id) => request(id ? `/api/products/${id}` : '/api/products', { method: id ? 'PUT' : 'POST', body: JSON.stringify(body) }),
  deleteProduct: (id) => request(`/api/products/${id}`, { method: 'DELETE' }),
  stock: (id, type, quantity) => request(`/api/products/${id}/stock/${type}`, { method: 'POST', body: JSON.stringify({ quantity }) }),
  lowStock: () => request('/api/products/low-stock'),
  categories: () => request('/api/categories'),
  saveCategory: (body, id) => request(id ? `/api/categories/${id}` : '/api/categories', { method: id ? 'PUT' : 'POST', body: JSON.stringify(body) }),
  deleteCategory: (id) => request(`/api/categories/${id}`, { method: 'DELETE' }),
  users: () => request('/api/users'),
};
