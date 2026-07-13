/*
 * ADMIN_RECENT_PASSWORD_REAUTH
 *
 * Short-lived proof issued only after the authenticated administrator
 * successfully re-enters the current password.
 *
 * The proof is bound to the current primary JWT session through its jti.
 * It is intentionally supplied through a separate request header and is
 * never stored in the database, localStorage, or SecureStore.
 */

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';

import { jwtPrivateKey as ES256_PRIVATE_KEY, jwtPublicKey as ES256_PUBLIC_KEY } from '../config/jwtEs256.js';
const ADMIN_REAUTH_ISSUER =
  'tuklas-talino-admin-reauth';

const ADMIN_REAUTH_AUDIENCE =
  'tuklas-talino-sensitive-admin-write';

const ADMIN_REAUTH_PURPOSE =
  'sensitive-admin-write';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      'JWT_SECRET is required for administrator reauthentication.'
    );
  }

  if (
    secret === 'dev_secret_change_me' ||
    secret === 'change_this_to_a_long_random_secret'
  ) {
    throw new Error(
      'JWT_SECRET must not use a default placeholder.'
    );
  }

  return secret;
}

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(
    String(value ?? ''),
    10
  );

  return Number.isInteger(parsed) && parsed > 0
    ? parsed
    : fallback;
}

export function adminReauthTtlSeconds() {
  return positiveInteger(
    process.env.ADMIN_REAUTH_TTL_SECONDS,
    300
  );
}

export function issueAdminReauthToken(req) {
  if (
    req.role !== 'admin' ||
    !req.user?.id
  ) {
    const error = new Error(
      'Administrator authentication is required.'
    );

    error.statusCode = 403;
    throw error;
  }

  const sessionJti =
    String(req.auth?.jti || '').trim();

  if (!sessionJti) {
    const error = new Error(
      'Sign in again before verifying your password.'
    );

    error.statusCode = 401;
    error.code = 'ADMIN_SESSION_REFRESH_REQUIRED';
    throw error;
  }

  const expiresInSeconds =
    adminReauthTtlSeconds();

  const token = jwt.sign(
    {
      sub: req.user.id,
      role: 'admin',
      purpose: ADMIN_REAUTH_PURPOSE,
      sessionJti,
    },
    ES256_PRIVATE_KEY,
    {
      algorithm: 'ES256',
      issuer: ADMIN_REAUTH_ISSUER,
      audience: ADMIN_REAUTH_AUDIENCE,
      expiresIn: expiresInSeconds,
      jwtid: crypto.randomUUID(),
    }
  );

  return {
    token,
    expiresInSeconds,
  };
}

export function requireRecentAdminPassword(
  req,
  res,
  next
) {
  if (
    req.role !== 'admin' ||
    !req.user?.id
  ) {
    return res.status(403).json({
      message:
        'Administrator authentication is required.',
      code: 'ADMIN_REQUIRED',
    });
  }

  const proof = String(
    req.get('x-admin-reauth') || ''
  ).trim();

  if (!proof) {
    return res.status(428).json({
      message:
        'Re-enter the administrator password before completing this action.',
      code: 'ADMIN_REAUTH_REQUIRED',
    });
  }

  try {
    const payload = jwt.verify(
      proof,
      ES256_PUBLIC_KEY,
      {
        algorithms: ['ES256'],
        issuer: ADMIN_REAUTH_ISSUER,
        audience: ADMIN_REAUTH_AUDIENCE,
      }
    );

    const valid =
      Number(payload.sub) ===
        Number(req.user.id) &&
      payload.role === 'admin' &&
      payload.purpose ===
        ADMIN_REAUTH_PURPOSE &&
      Boolean(req.auth?.jti) &&
      payload.sessionJti ===
        req.auth.jti;

    if (!valid) {
      return res.status(401).json({
        message:
          'Administrator password verification is invalid for this session.',
        code: 'ADMIN_REAUTH_INVALID',
      });
    }

    req.adminReauth = payload;
    next();
  } catch {
    return res.status(401).json({
      message:
        'Administrator password verification expired or is invalid.',
      code: 'ADMIN_REAUTH_INVALID',
    });
  }
}

export const adminPasswordVerificationLimiter =
  rateLimit({
    windowMs: positiveInteger(
      process.env.ADMIN_REAUTH_RATE_LIMIT_WINDOW_MS,
      15 * 60 * 1000
    ),
    max: positiveInteger(
      process.env.ADMIN_REAUTH_RATE_LIMIT_MAX,
      5
    ),
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    keyGenerator: (req) =>
      `admin-reauth:${req.user?.id || 'unknown'}`,
    handler: (req, res) => {
      res.status(429).json({
        message:
          'Too many unsuccessful administrator password verification attempts.',
        code: 'ADMIN_REAUTH_RATE_LIMITED',
      });
    },
  });

export const adminAccountCreationLimiter =
  rateLimit({
    windowMs: positiveInteger(
      process.env.ADMIN_ACCOUNT_CREATE_RATE_LIMIT_WINDOW_MS,
      15 * 60 * 1000
    ),
    max: positiveInteger(
      process.env.ADMIN_ACCOUNT_CREATE_RATE_LIMIT_MAX,
      10
    ),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) =>
      `admin-account-create:${req.user?.id || 'unknown'}`,
    handler: (req, res) => {
      res.status(429).json({
        message:
          'Too many account creation requests. Please wait before trying again.',
        code: 'ADMIN_ACCOUNT_CREATE_RATE_LIMITED',
      });
    },
  });

export function requestAuditContext(req) {
  const forwarded = String(
    req.headers?.['x-forwarded-for'] || ''
  )
    .split(',')[0]
    .trim();

  return {
    sourceIp: String(
      req.ip ||
      forwarded ||
      req.socket?.remoteAddress ||
      ''
    ).slice(0, 120),

    userAgent: String(
      req.get?.('user-agent') || ''
    ).slice(0, 300),

    requestId: String(
      req.get?.('x-request-id') || ''
    ).slice(0, 120),

    reauthJti: String(
      req.adminReauth?.jti || ''
    ).slice(0, 120),
  };
}
