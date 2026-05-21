const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export function getToken() {
  return localStorage.getItem('tuklas_token');
}

export function setToken(token) {
  if (token) localStorage.setItem('tuklas_token', token);
  else localStorage.removeItem('tuklas_token');
}

export async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body: options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) {
    const error = new Error(data?.message || 'Request failed');
    error.details = data?.details;
    throw error;
  }
  return data;
}

export async function downloadFile(path, fallbackFilename = 'download') {
  const headers = new Headers();
  const token = getToken();

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, { headers });

  if (!response.ok) {
    const contentType = response.headers.get('content-type') || '';
    let message = 'Download failed';

    try {
      if (contentType.includes('application/json')) {
        const data = await response.json();
        message = data?.message || message;
      } else {
        const text = await response.text();
        message = text || message;
      }
    } catch {
      message = 'Download failed';
    }

    throw new Error(message);
  }

  const blob = await response.blob();
  const disposition = response.headers.get('content-disposition') || '';
  const filenameMatch = disposition.match(/filename="?([^";]+)"?/i);
  const filename = filenameMatch?.[1] || fallbackFilename;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
