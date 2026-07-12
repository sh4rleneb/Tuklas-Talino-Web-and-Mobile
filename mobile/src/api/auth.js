function sanitizeLoginIdentifierForRequest(value) {
  return String(value || '').replace(/\s+/g, '').trim();
}

function sanitizeLoginPasswordForRequest(value) {
  return String(value || '').replace(/\s+/g, '');
}

import { api, setToken } from './client';

// ADMIN_REAUTH_CLIENT_CACHE
let adminReauthProof = null;

export function clearAdminReauthProof() {
  adminReauthProof = null;
}

export function hasAdminReauthProof() {
  if (
    !adminReauthProof?.token ||
    !Number.isFinite(adminReauthProof.expiresAt) ||
    Date.now() >= adminReauthProof.expiresAt
  ) {
    clearAdminReauthProof();
    return false;
  }

  return true;
}

export function getAdminReauthHeaders() {
  if (!hasAdminReauthProof()) {
    throw new Error(
      'Administrator password verification is required.'
    );
  }

  return {
    'X-Admin-Reauth': adminReauthProof.token,
  };
}

function cacheAdminReauthProof(data = {}) {
  const token =
    String(data.reauthToken || '').trim();

  if (!token) {
    clearAdminReauthProof();
    return;
  }

  const explicitExpiry =
    Date.parse(
      String(data.reauthExpiresAt || '')
    );

  const ttlSeconds =
    Number(data.reauthExpiresInSeconds);

  const fallbackExpiry =
    Date.now() +
    (
      Number.isFinite(ttlSeconds) &&
      ttlSeconds > 0
        ? ttlSeconds * 1000
        : 5 * 60 * 1000
    );

  adminReauthProof = {
    token,
    expiresAt:
      Number.isFinite(explicitExpiry)
        ? explicitExpiry
        : fallbackExpiry,
  };
}


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
    clearAdminReauthProof();
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
    clearAdminReauthProof();
    await setToken(data.token);
  }

  return data;
}


export async function verifyPassword(password) {
  clearAdminReauthProof();

  const data = await api('/auth/verify-password', {
    method: 'POST',
    body: {
      password,
    },
  });

  cacheAdminReauthProof(data);

  return data;
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
    clearAdminReauthProof();
    await setToken(null);
  }
}
