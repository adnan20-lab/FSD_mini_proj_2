const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export async function api(path, options = {}) {
  const token = path.startsWith('/auth/') ? null : localStorage.getItem('heatwave_token');
  const headers = { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers };
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new Error('Cannot reach the backend API. Check that Spring Boot is running on http://localhost:8080 and MongoDB is available.');
  }
  if (response.status === 204) return null;
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) {
    if (response.status === 401 && token && !path.startsWith('/auth/')) {
      localStorage.removeItem('heatwave_token');
      localStorage.removeItem('heatwave_user');
      window.dispatchEvent(new Event('auth:expired'));
    }
    const detail = data?.message || data?.error || `Request failed (${response.status})`;
    const fieldErrors = data?.fieldErrors ? Object.entries(data.fieldErrors).map(([field, message]) => `${field}: ${message}`).join(' · ') : '';
    throw new Error(fieldErrors ? `${detail} ${fieldErrors}` : detail);
  }
  return data;
}

export const jsonBody = (value) => JSON.stringify(value);
export const API_BASE_URL = API_BASE;
