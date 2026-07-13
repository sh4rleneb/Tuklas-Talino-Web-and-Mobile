import * as SecureStore from 'expo-secure-store';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  'https://tuklastalino.com/api';

const TOKEN_KEY = 'tuklas_token';

export async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token) {
  if (token) {
    return SecureStore.setItemAsync(TOKEN_KEY, token);
  }

  return SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function api(path, options = {}) {
  const token = await getToken();
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,

    body:
      options.body &&
      !isFormData &&
      typeof options.body !== 'string'
        ? JSON.stringify(options.body)
        : options.body,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || 'Request failed');
    error.status = response.status;
    error.code = data.code;
    error.details = data.details;
    throw error;
  }

  return data;
}

export async function apiText(path, options = {}) {
  const token = await getToken();
  const headers = { ...(options.headers || {}) };

  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });
  const text = await response.text();

  if (!response.ok) {
    const error = new Error(text || 'Request failed');
    error.status = response.status;
    throw error;
  }

  return text;
}


export async function apiBinary(path, options = {}) {
  const token = await getToken();

  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error('Request failed');
  }


  const blob = await response.blob();

  void 0;
  void 0;
  void 0;

  return blob;

}
