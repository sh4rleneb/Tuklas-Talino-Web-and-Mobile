import jwt from 'jsonwebtoken';
import { permissionsForRole } from '../constants/permissions.js';
import crypto from 'crypto';
import { User, Role, Student, Teacher, AdminProfile } from '../models/index.js';

import { jwtPrivateKey as ES256_PRIVATE_KEY, jwtPublicKey as ES256_PUBLIC_KEY } from '../config/jwtEs256.js';
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is required. Set it in your backend .env file.');
  }

  if (secret === 'dev_secret_change_me' || secret === 'change_this_to_a_long_random_secret') {
    throw new Error('JWT_SECRET must be changed from the default placeholder value.');
  }

  return secret;
}

export function signToken(user) {
  const role = user.Role?.name;

  const expiresIn =
    role === 'admin'
      ? process.env.ADMIN_JWT_EXPIRES_IN || '2h'
      : process.env.JWT_EXPIRES_IN || '12h';

  return jwt.sign(
    {
      sub: user.id,
      role,
    },
    ES256_PRIVATE_KEY,
    {
      algorithm: 'ES256',
      issuer: 'tuklas-talino-api',
      audience: 'tuklas-talino-app',
      expiresIn,
      jwtid: crypto.randomUUID(),
    }
  );
}

export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';

    if (!header.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Missing or invalid authorization header.',
      });
    }

    const token = header.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        message: 'Missing token.',
      });
    }

    const payload = jwt.verify(
      token,
      ES256_PUBLIC_KEY,
      {
        algorithms: ['ES256'],
        issuer: 'tuklas-talino-api',
        audience: 'tuklas-talino-app',
      }
    );

    const user = await User.findByPk(payload.sub, {
      include: [
        Role,
        { model: Student },
        { model: Teacher },
        { model: AdminProfile },
      ],
    });

    if (!user || user.status !== 'active') {
      return res.status(401).json({
        message: 'Invalid or inactive account.',
      });
    }

    req.user = user;
    req.role = user.Role?.name;
    req.student = user.Student || null;
    req.teacher = user.Teacher || null;
    req.admin = user.AdminProfile || null;
    req.auth = payload;

    next();
  } catch (err) {
    return res.status(401).json({
      message: 'Invalid or expired token.',
    });
  }
}

export function hasPermission(
  role,
  permission
) {
  if (!permission) return false;

  return permissionsForRole(role).includes(
    permission
  );
}

export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required.',
      });
    }

    if (!hasPermission(req.role, permission)) {
      return res.status(403).json({
        message:
          'You do not have permission to access this resource.',
        requiredPermission: permission,
      });
    }

    return next();
  };
}

export function requireAnyPermission(
  ...permissions
) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required.',
      });
    }

    const allowed = permissions.some(
      (permission) =>
        hasPermission(req.role, permission)
    );

    if (!allowed) {
      return res.status(403).json({
        message:
          'You do not have permission to access this resource.',
        requiredPermissions: permissions,
      });
    }

    return next();
  };
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required.',
      });
    }

    if (!roles.includes(req.role)) {
      return res.status(403).json({
        message: 'You do not have permission to access this resource.',
      });
    }

    next();
  };
}

export function requirePasswordChanged(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      message: 'Authentication required.'
    });
  }

  if (req.user.mustChangePassword) {
    return res.status(403).json({
      message: 'Password change required before accessing this resource.',
      code: 'PASSWORD_CHANGE_REQUIRED'
    });
  }

  next();
}