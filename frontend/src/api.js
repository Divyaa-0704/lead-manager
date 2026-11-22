const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw { message: 'Cannot reach the server. Please check that the API is running.' };
  }

  if (response.status === 204) return null;

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw { message: body.error || 'Something went wrong', details: body.details };
  }
  return body;
}

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