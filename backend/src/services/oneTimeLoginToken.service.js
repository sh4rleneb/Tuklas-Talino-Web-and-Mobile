import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import jwt from 'jsonwebtoken';

const JWT_ISSUER =
  process.env.JWT_ISSUER ||
  'tuklas-talino-api';

const ONE_TIME_AUDIENCE =
  process.env.ONE_TIME_LOGIN_AUDIENCE ||
  'tuklas-talino-one-time-login';

const JWT_ALGORITHM = String(
  process.env.JWT_ALGORITHM ||
  process.env.JWT_ALG ||
  'HS256'
).toUpperCase();

const TTL_SECONDS = Number.parseInt(
  process.env.ONE_TIME_LOGIN_TTL_SECONDS || '300',
  10
);

const STORE_DIR =
  process.env.ONE_TIME_LOGIN_STORE_DIR ||
  path.resolve('.runtime/one-time-login');

const ALLOWED_ALGORITHMS = new Set([
  'HS256',
  'HS384',
  'HS512',
]);

function createServiceError(
  code,
  message,
  statusCode = 401
) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;

  return error;
}

function getJwtSecret() {
  const secret = String(
    process.env.JWT_SECRET || ''
  );

  if (!secret) {
    throw createServiceError(
      'JWT_SECRET_MISSING',
      'JWT signing secret is unavailable.',
      500
    );
  }

  return secret;
}

function validateConfiguration() {
  if (!ALLOWED_ALGORITHMS.has(JWT_ALGORITHM)) {
    throw createServiceError(
      'JWT_ALGORITHM_UNSUPPORTED',
      `Unsupported JWT algorithm: ${JWT_ALGORITHM}`,
      500
    );
  }

  if (
    !Number.isInteger(TTL_SECONDS) ||
    TTL_SECONDS < 30 ||
    TTL_SECONDS > 900
  ) {
    throw createServiceError(
      'ONE_TIME_TTL_INVALID',
      'One-time token TTL must be between 30 and 900 seconds.',
      500
    );
  }
}

function ensureStoreDirectory() {
  fs.mkdirSync(STORE_DIR, {
    recursive: true,
    mode: 0o700,
  });

  try {
    fs.chmodSync(STORE_DIR, 0o700);
  } catch {
    // The deployment may manage directory permissions.
  }
}

function hashJti(jti) {
  return crypto
    .createHash('sha256')
    .update(String(jti))
    .digest('hex');
}

function activeRecordPath(jti) {
  return path.join(
    STORE_DIR,
    `${hashJti(jti)}.active.json`
  );
}

function usedRecordPath(jti) {
  return path.join(
    STORE_DIR,
    `${hashJti(jti)}.used.json`
  );
}

function pruneExpiredRecords() {
  ensureStoreDirectory();

  const now = Math.floor(Date.now() / 1000);
  const retentionSeconds = 24 * 60 * 60;

  for (const filename of fs.readdirSync(STORE_DIR)) {
    if (
      !filename.endsWith('.active.json') &&
      !filename.endsWith('.used.json')
    ) {
      continue;
    }

    const recordPath = path.join(
      STORE_DIR,
      filename
    );

    try {
      const record = JSON.parse(
        fs.readFileSync(recordPath, 'utf8')
      );

      const expiration = Number(record.exp);

      if (
        Number.isFinite(expiration) &&
        expiration + retentionSeconds < now
      ) {
        fs.unlinkSync(recordPath);
      }
    } catch {
      // Preserve malformed records for investigation.
    }
  }
}

function registerActiveJti(record) {
  ensureStoreDirectory();
  pruneExpiredRecords();

  const destination = activeRecordPath(
    record.jti
  );

  let descriptor;

  try {
    descriptor = fs.openSync(
      destination,
      'wx',
      0o600
    );

    fs.writeFileSync(
      descriptor,
      JSON.stringify(record),
      'utf8'
    );

    fs.fsyncSync(descriptor);
  } catch (error) {
    if (error?.code === 'EEXIST') {
      throw createServiceError(
        'ONE_TIME_JTI_COLLISION',
        'Unable to register the one-time token.',
        500
      );
    }

    throw error;
  } finally {
    if (descriptor !== undefined) {
      fs.closeSync(descriptor);
    }
  }
}

export function issueOneTimeLoginToken(
  userId
) {
  validateConfiguration();

  const normalizedUserId = Number(userId);

  if (
    !Number.isInteger(normalizedUserId) ||
    normalizedUserId <= 0
  ) {
    throw createServiceError(
      'ONE_TIME_USER_INVALID',
      'A valid user is required.',
      400
    );
  }

  const jti = crypto.randomUUID();

  const token = jwt.sign(
    {
      userId: normalizedUserId,
      tokenUse: 'one-time-login',
    },
    getJwtSecret(),
    {
      algorithm: JWT_ALGORITHM,
      issuer: JWT_ISSUER,
      audience: ONE_TIME_AUDIENCE,
      expiresIn: TTL_SECONDS,
      jwtid: jti,
    }
  );

  const decoded = jwt.decode(token);

  if (
    !decoded?.jti ||
    !Number.isFinite(Number(decoded.exp))
  ) {
    throw createServiceError(
      'ONE_TIME_TOKEN_CREATION_FAILED',
      'Unable to create the one-time login token.',
      500
    );
  }

  registerActiveJti({
    jti: decoded.jti,
    userId: normalizedUserId,
    exp: Number(decoded.exp),
    createdAt: new Date().toISOString(),
  });

  return {
    token,
    expiresAt: new Date(
      Number(decoded.exp) * 1000
    ).toISOString(),
  };
}

export function consumeOneTimeLoginToken(
  rawToken
) {
  validateConfiguration();
  pruneExpiredRecords();

  const token = String(rawToken || '').trim();

  if (!token) {
    throw createServiceError(
      'ONE_TIME_TOKEN_REQUIRED',
      'One-time login token is required.',
      400
    );
  }

  let payload;

  try {
    payload = jwt.verify(
      token,
      getJwtSecret(),
      {
        algorithms: [JWT_ALGORITHM],
        issuer: JWT_ISSUER,
        audience: ONE_TIME_AUDIENCE,
      }
    );
  } catch {
    throw createServiceError(
      'ONE_TIME_TOKEN_INVALID',
      'The one-time login token is invalid or expired.',
      401
    );
  }

  if (
    payload?.tokenUse !== 'one-time-login' ||
    !payload?.jti ||
    !Number.isInteger(Number(payload.userId))
  ) {
    throw createServiceError(
      'ONE_TIME_TOKEN_PURPOSE_INVALID',
      'The supplied token is not a valid one-time login token.',
      401
    );
  }

  const activePath = activeRecordPath(
    payload.jti
  );

  const usedPath = usedRecordPath(
    payload.jti
  );

  if (fs.existsSync(usedPath)) {
    throw createServiceError(
      'ONE_TIME_TOKEN_ALREADY_USED',
      'The one-time login token has already been used.',
      401
    );
  }

  /*
   * Atomic rename is the consumption point.
   * Concurrent redemption requests cannot both succeed.
   */
  try {
    fs.renameSync(
      activePath,
      usedPath
    );
  } catch (error) {
    if (error?.code === 'ENOENT') {
      throw createServiceError(
        'ONE_TIME_TOKEN_USED_OR_UNKNOWN',
        'The one-time login token has already been used or is not recognized.',
        401
      );
    }

    throw error;
  }

  let record;

  try {
    record = JSON.parse(
      fs.readFileSync(usedPath, 'utf8')
    );
  } catch {
    throw createServiceError(
      'ONE_TIME_TOKEN_RECORD_INVALID',
      'The one-time token record is invalid.',
      401
    );
  }

  if (
    String(record.jti) !==
      String(payload.jti) ||
    Number(record.userId) !==
      Number(payload.userId) ||
    Number(record.exp) !==
      Number(payload.exp)
  ) {
    throw createServiceError(
      'ONE_TIME_TOKEN_RECORD_MISMATCH',
      'The one-time token record does not match.',
      401
    );
  }

  return {
    userId: Number(payload.userId),
    jti: String(payload.jti),
  };
}

export function getOneTimeLoginStoreDirectory() {
  return STORE_DIR;
}
