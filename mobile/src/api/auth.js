function sanitizeLoginIdentifierForRequest(value) {
  return String(value || '').replace(/\s+/g, '').trim();
}

function sanitizeLoginPasswordForRequest(value) {
  return String(value || '').replace(/\s+/g, '');
}

import { api, setToken } from './client';

export async function loginTeacher(identifier, password) {
  const data = await api('/auth/login', {
    method: 'POST',
    body: {
      role: 'teacher',
      identifier: sanitizeLoginIdentifierForRequest(identifier),
      password: sanitizeLoginPasswordForRequest(password),
    },
  });

  if (data.token) {
    await setToken(data.token);
  }

  return data;
}

export async function loginAdmin(identifier, password) {
  const data = await api('/auth/login', {
    method: 'POST',
    body: {
      role: 'admin',
      identifier: sanitizeLoginIdentifierForRequest(identifier),
      password: sanitizeLoginPasswordForRequest(password),
    },
  });

  if (data.token) {
    await setToken(data.token);
  }

  return data;
}


export async function verifyPassword(password) {
  return api('/auth/verify-password', {
    method: 'POST',
    body: {
      password,
    },
  });
}

export async function changePassword(currentPassword, newPassword) {
  return api('/auth/change-password', {
    method: 'POST',
    body: {
      currentPassword,
      newPassword,
    },
  });
}

export async function logout() {
  try {
    await api('/auth/logout', {
      method: 'POST',
    });
  } catch {
    // Local logout must still work when the API is unavailable.
  } finally {
    await setToken(null);
  }
}
