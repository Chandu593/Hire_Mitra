const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function getToken() { return localStorage.getItem('token'); }
export function setToken(token) { token ? localStorage.setItem('token', token) : localStorage.removeItem('token'); }

export async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try { msg = (await res.json()).message || msg; } catch {}
    throw new Error(msg);
  }
  if (res.headers.get('content-type')?.includes('text/csv')) return res.blob();
  return res.status === 204 ? null : res.json();
}

export { API_URL };
