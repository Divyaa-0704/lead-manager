const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'lead-manager-token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw { message: 'Cannot reach the server. Please check that the API is running.' };
  }

  if (response.status === 204) return null;

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw {
      message: body.error || 'Something went wrong',
      details: body.details,
      status: response.status,
    };
  }
  return body;
}

// ---------- Auth ----------
export function signup(user) {
  return request('/auth/signup', { method: 'POST', body: JSON.stringify(user) });
}

export function login(credentials) {
  return request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
}

export function getMe() {
  return request('/auth/me');
}

// ---------- Leads ----------
export function getLeads({ search, status, sortBy, order, page, limit }) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (status) params.set('status', status);
  if (sortBy) params.set('sortBy', sortBy);
  if (order) params.set('order', order);
  params.set('page', page || 1);
  params.set('limit', limit || 10);
  return request(`/leads?${params.toString()}`);
}

export function getStats() {
  return request('/leads/stats');
}

export function createLead(lead) {
  return request('/leads', { method: 'POST', body: JSON.stringify(lead) });
}

export function updateLead(id, lead) {
  return request(`/leads/${id}`, { method: 'PUT', body: JSON.stringify(lead) });
}

export function deleteLead(id) {
  return request(`/leads/${id}`, { method: 'DELETE' });
}