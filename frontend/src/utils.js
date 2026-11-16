export function formatDate(value, options = {}) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', ...options }).format(date);
}

export function formatStatus(status) {
  const labels = {
    SEVERE_HEATWAVE_EMERGENCY: 'Severe Emergency',
    HEATWAVE_WARNING: 'Heatwave Warning',
    HEAT_WATCH_CAUTION: 'Heat Watch',
    NORMAL_CONDITIONS: 'Normal Conditions',
    REVIEW_REQUIRED: 'Review Required'
  };
  return labels[status] || status?.replaceAll('_', ' ') || 'Unknown';
}

export function formatEnum(value) {
  return value ? value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : '—';
}

export function toLocalDateTimeInput(value = new Date()) {
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function asIso(value) {
  return value ? new Date(value).toISOString() : null;
}

export function errorText(error) {
  return error?.message || 'Something went wrong. Please try again.';
}
