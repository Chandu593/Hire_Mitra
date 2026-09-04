import { api, setToken, getToken } from './http';
export async function login(email, password) { const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); setToken(data.token); return data.user; }
export async function me() { if (!getToken()) return null; return (await api('/auth/me')).user; }
export function logout() { setToken(null); }
