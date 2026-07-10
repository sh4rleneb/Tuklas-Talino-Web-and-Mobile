import { Router } from 'express';
import bcrypt from 'bcryptjs';
import {
  loginSchema,
  validate,
  studentSchema,
  teacherSchema
} from '../validators/common.js';
import { signToken, authenticate, requireRole } from '../middleware/auth.js';
import { Role, User, Student, Teacher, AdminProfile } from '../models/index.js';
import { audit } from '../services/audit.service.js';

import { assertSafeContentPayload } from '../validators/contentSafety.js';
const router = Router();

function normalizeLoginIdentifier(value, role = '') {
  const cleaned = String(value || '')
    .replace(/\s+/g, '')
    .trim();

  return ['student', 'teacher'].includes(String(role || '').toLowerCase())
    ? cleaned.toUpperCase()
    : cleaned;
}

function normalizeLoginPassword(value) {
  return String(value || '').replace(/\s+/g, '');
}

function isValidLoginIdentifier(value) {
  return /^[A-Za-z0-9._@-]+$/.test(String(value || ''));
}

const PASSWORD_POLICY_MESSAGE = 'Password must be at least 8 characters and include uppercase, lowercase, and special character.';
const FIRST_TEMP_LOGIN_LOCK_ATTEMPT = 6;
const PERMANENT_LOGIN_LOCK_ATTEMPT = 10;
const TEMP_LOGIN_LOCK_BASE_MS = 45 * 60 * 1000;
const TEMP_LOGIN_LOCK_INCREMENT_MS = 5 * 60 * 1000;
const PERMANENT_LOGIN_LOCK_UNTIL = new Date('9999-12-31T23:59:59.000Z');
const MAX_FAILED_LOGIN_ATTEMPTS = PERMANENT_LOGIN_LOCK_ATTEMPT;

function validatePasswordPolicy(value = '') {
  const password = String(value || '');

  if (password.length < 8) return PASSWORD_POLICY_MESSAGE;
  if (!/[A-Z]/.test(password)) return PASSWORD_POLICY_MESSAGE;
  if (!/[a-z]/.test(password)) return PASSWORD_POLICY_MESSAGE;
  if (!/[^A-Za-z0-9]/.test(password)) return PASSWORD_POLICY_MESSAGE;

  return '';
}

function isPermanentLoginLock(user = {}) {
  if (!user?.lockedUntil) return false;

  const lockedUntil = new Date(user.lockedUntil);
  return Number.isFinite(lockedUntil.getTime()) && lockedUntil.getFullYear() >= 9999;
}

function temporaryLoginLockDurationMs(attempts = 0) {
  const failedAttempts = Number(attempts || 0);
  const extraLockSteps = Math.max(0, failedAttempts - FIRST_TEMP_LOGIN_LOCK_ATTEMPT);

  return TEMP_LOGIN_LOCK_BASE_MS + (extraLockSteps * TEMP_LOGIN_LOCK_INCREMENT_MS);
}

function activeLoginLockMessage(user, now = new Date()) {
  if (!user?.lockedUntil) return null;

  if (isPermanentLoginLock(user)) {
    return 'Account is permanently locked after repeated failed login attempts. Please contact an administrator for assistance.';
  }

  const lockedUntil = new Date(user.lockedUntil);

  if (!(lockedUntil > now)) return null;

  const remainingMs = Math.max(0, lockedUntil.getTime() - now.getTime());
  const remainingMinutes = Math.max(1, Math.ceil(remainingMs / (60 * 1000)));

  return `Account is locked. Please try again in about ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}.`;
}

function hasExpiredTemporaryLoginLock(user = {}, now = new Date()) {
  if (!user?.lockedUntil || isPermanentLoginLock(user)) return false;

  const lockedUntil = new Date(user.lockedUntil);
  return Number.isFinite(lockedUntil.getTime()) && lockedUntil <= now;
}

function nextFailedLoginState(user, now = new Date()) {
  const cycleWasReset = hasExpiredTemporaryLoginLock(user, now);

  const previousCycleAttempts = cycleWasReset
    ? 0
    : Number(user?.failedLoginAttempts || 0);

  const failedLoginAttempts = previousCycleAttempts + 1;
  const totalFailedLoginAttempts =
    Number(user?.totalFailedLoginAttempts || 0) + 1;

  const state = {
    failedLoginAttempts,
    totalFailedLoginAttempts,
    failedLoginWindowStartedAt:
      cycleWasReset || !user?.failedLoginWindowStartedAt
        ? now
        : user.failedLoginWindowStartedAt,
    lockedUntil: null,
    message: '',
  };

  if (totalFailedLoginAttempts >= PERMANENT_LOGIN_LOCK_ATTEMPT) {
    state.lockedUntil = PERMANENT_LOGIN_LOCK_UNTIL;
    state.message =
      'Account is permanently locked after 10 failed login attempts. Please contact an administrator for assistance.';
    return state;
  }

  if (failedLoginAttempts >= FIRST_TEMP_LOGIN_LOCK_ATTEMPT) {
    const lockDurationMs = temporaryLoginLockDurationMs(failedLoginAttempts);
    const lockMinutes = Math.round(lockDurationMs / (60 * 1000));

    state.lockedUntil = new Date(now.getTime() + lockDurationMs);
    state.message =
      `Too many failed login attempts. Account is locked for ${lockMinutes} minutes.`;
    return state;
  }

  const attemptsBeforeTemporaryLock =
    FIRST_TEMP_LOGIN_LOCK_ATTEMPT - failedLoginAttempts;

  const attemptsBeforePermanentLock =
    PERMANENT_LOGIN_LOCK_ATTEMPT - totalFailedLoginAttempts;

  state.message =
    `Invalid password. ${attemptsBeforeTemporaryLock} ` +
    `attempt${attemptsBeforeTemporaryLock === 1 ? '' : 's'} left before temporary lockout. ` +
    `${attemptsBeforePermanentLock} ` +
    `attempt${attemptsBeforePermanentLock === 1 ? '' : 's'} left before permanent lockdown.`;

  return state;
}

async function recordFailedLogin(user, now = new Date()) {
  const state = nextFailedLoginState(user, now);

  user.failedLoginAttempts = state.failedLoginAttempts;
  user.totalFailedLoginAttempts = state.totalFailedLoginAttempts;
  user.failedLoginWindowStartedAt = state.failedLoginWindowStartedAt;
  user.lockedUntil = state.lockedUntil;

  await user.save();

  return {
    status: state.lockedUntil ? 423 : 401,
    message: state.message
  };
}

async function resetFailedLoginState(user) {
  user.failedLoginAttempts = 0;
  user.totalFailedLoginAttempts = 0;
  user.failedLoginWindowStartedAt = null;
  user.lockedUntil = null;
}




function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    role: user.Role?.name,
    mustChangePassword: user.mustChangePassword,
    student: user.Student,
    teacher: user.Teacher,
    admin: user.AdminProfile
  };
}


function verifyLoginAccount(user) {
  const role = String(user?.Role?.name || '').toLowerCase();

  if (user?.status && user.status !== 'active') {
    return {
      status: 403,
      message: 'This account is archived. Please contact the administrator.'
    };
  }

  if (role === 'teacher') {
    if (!user.Teacher) {
      return {
        status: 403,
        message: 'Teacher account verification failed. Teacher profile was not found.'
      };
    }

    if (user.Teacher.status && user.Teacher.status !== 'active') {
      return {
        status: 403,
        message: 'This teacher account is archived. Please contact the administrator.'
      };
    }
  }

  if (role === 'admin' && !user.AdminProfile) {
    return {
      status: 403,
      message: 'Admin account verification failed. Admin profile was not found.'
    };
  }

  return null;
}

function loginAvatar(value) {
  const avatar = typeof value === 'string' ? value.trim() : '';
  return avatar && avatar.length <= 16 ? avatar : null;
}


async function findTeacherLoginUser(identifier) {
  const rawIdentifier = String(identifier || '').trim();
  const normalizedIdentifier = normalizeLoginIdentifier(rawIdentifier, 'teacher');

  if (!normalizedIdentifier) return null;

  const directUser = await User.findOne({
    where: { username: normalizedIdentifier },
    include: [Role, Teacher]
  });

  if (directUser) return directUser;

  const teacher = await Teacher.findOne({
    where: { employeeCode: normalizedIdentifier }
  });

  if (teacher) {
    return User.findOne({
      where: { id: teacher.userId },
      include: [Role, Teacher]
    });
  }

  if (rawIdentifier.includes('@')) {
    return User.findOne({
      where: { email: rawIdentifier },
      include: [Role, Teacher]
    });
  }

  return null;
}

async function findAdminLoginUser(identifier) {
  const rawIdentifier = String(identifier || '').trim();

  if (!rawIdentifier) return null;

  const directUser = await User.findOne({
    where: { username: rawIdentifier },
    include: [Role, AdminProfile]
  });

  if (directUser) return directUser;

  if (rawIdentifier.includes('@')) {
    return User.findOne({
      where: { email: rawIdentifier },
      include: [Role, AdminProfile]
    });
  }

  return null;
}

function teacherLoginCheckPayload(user) {
  const exists = Boolean(
    user &&
    user.status === 'active' &&
    user.Role?.name === 'teacher' &&
    user.Teacher &&
    user.Teacher.status === 'active'
  );

  return {
    exists,
    role: exists ? 'teacher' : null,
    name: exists ? user.Teacher?.name || user.displayName : null
  };
}

function adminLoginCheckPayload(user) {
  const exists = Boolean(
    user &&
    user.status === 'active' &&
    user.Role?.name === 'admin' &&
    user.AdminProfile
  );

  return {
    exists,
    role: exists ? 'admin' : null,
    name: exists ? user.AdminProfile?.name || user.displayName : null
  };
}

router.get('/check-student/:identifier', async (req, res, next) => {
  try {
    const identifier = String(req.params.identifier || '').trim();

    if (!identifier) {
      return res.json({ exists: false });
    }

    const user = await User.findOne({
      where: { username: identifier },
      include: [Role, Student]
    });

    const exists = Boolean(
      user &&
      user.status === 'active' &&
      user.Role?.name === 'student' &&
      user.Student?.status === 'active'
    );

    return res.json({ exists });
  } catch (err) {
    next(err);
  }
});


router.get('/check-teacher/:identifier', async (req, res, next) => {
  try {
    const identifier = String(req.params.identifier || '').trim();

    if (!identifier) {
      return res.json({ exists: false });
    }

    const user = await findTeacherLoginUser(identifier);

    return res.json(teacherLoginCheckPayload(user));
  } catch (err) {
    next(err);
  }
});

router.get('/check-admin/:identifier', async (req, res, next) => {
  try {
    const identifier = String(req.params.identifier || '').trim();

    if (!identifier) {
      return res.json({ exists: false });
    }

    const user = await findAdminLoginUser(identifier);

    return res.json(adminLoginCheckPayload(user));
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const body = validate(loginSchema, req.body);
    body.role = String(body.role || '').trim().toLowerCase();
    body.identifier = normalizeLoginIdentifier(body.identifier, body.role);
    body.password = normalizeLoginPassword(body.password);

    if (!isValidLoginIdentifier(body.identifier)) {
      return res.status(422).json({
        message: 'Login username/code contains unsupported characters.'
      });
    }
    const identifier = body.identifier.trim();

    const user = await User.findOne({
      where: { username: identifier },
      include: [Role, Student, Teacher, AdminProfile]
    });

    if (!user || user.status !== 'active') {
      return res.status(404).json({ message: 'Username was not found for this login type.' });
    }

    if (body.role && user.Role?.name !== body.role) {
      return res.status(403).json({
        message: `This account is not a ${body.role} account.`
      });
    }

    const lockMessage = activeLoginLockMessage(user);
    if (lockMessage) {
      return res.status(423).json({ message: lockMessage });
    }

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) {
      const failedLogin = await recordFailedLogin(user);
      return res.status(failedLogin.status).json({ message: failedLogin.message });
    }

    const loginVerification = verifyLoginAccount(user);
    if (loginVerification) {
      return res.status(loginVerification.status).json({ message: loginVerification.message });
    }

    const requestedAvatar = loginAvatar(req.body.avatar);
    if (user.Role?.name === 'student' && user.Student && requestedAvatar) {
      user.Student.avatar = requestedAvatar;
      await user.Student.save();
    }

    await resetFailedLoginState(user);
    user.lastLoginAt = new Date();
    await user.save();

    await audit(user.id, 'auth.login', 'user', user.id, {
      role: user.Role?.name
    });

    return res.json({
      token: signToken(user),
      user: publicUser(user)
    });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', authenticate, async (req, res) => {
  await audit(req.user.id, 'auth.logout', 'user', req.user.id);
  return res.json({ message: 'Logged out. Delete the client token.' });
});

router.get('/me', authenticate, async (req, res) => {
  return res.json({ user: publicUser(req.user) });
});


router.post('/verify-password', authenticate, async (req, res, next) => {
  try {
    const password = String(req.body.password || '');

    const valid = await bcrypt.compare(
      password,
      req.user.passwordHash
    );

    if (!valid) {
      return res.status(401).json({
        message: 'Password verification failed.'
      });
    }

    await audit(
      req.user.id,
      'auth.verify_password',
      'user',
      req.user.id
    );

    return res.json({
      verified: true
    });
  } catch (err) {
    next(err);
  }
});

router.post('/change-password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const passwordPolicyError = validatePasswordPolicy(newPassword);

    if (passwordPolicyError) {
      return res.status(422).json({
        message: passwordPolicyError
      });
    }

    if (newPassword === currentPassword) {
      return res.status(422).json({
        message: 'New password must be different from the current password.'
      });
    }

    const valid = await bcrypt.compare(
      currentPassword || '',
      req.user.passwordHash
    );

    if (!valid) {
      return res.status(401).json({
        message: 'Current password is incorrect.'
      });
    }

    req.user.passwordHash = await bcrypt.hash(newPassword, 12);
    req.user.mustChangePassword = false;
    await req.user.save();

    await audit(req.user.id, 'auth.change_password', 'user', req.user.id);

    return res.json({ message: 'Password updated.' });
  } catch (err) {
    next(err);
  }
});

/*
  PUBLIC STUDENT SIGNUP
  Mobile app can call:
  POST /api/auth/register/student

  Accepts:
  {
    fullName,
    name,
    email,
    username,
    password,
    gradeLevel,
    section,
    avatar
  }
*/
router.post('/register/student', async (req, res, next) => {
  try {
    const name = req.body.name || req.body.fullName;
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    const gradeLevel = Number(req.body.gradeLevel);
    const section = req.body.section || 'N/A';
    const avatar = req.body.avatar || '🙂';

    assertSafeContentPayload({ name, section }, 'student registration');

    if (!name || !username || !password || !gradeLevel) {
      return res.status(422).json({
        message: 'Name, username, password, and grade level are required.'
      });
    }

    if (gradeLevel < 1 || gradeLevel > 6) {
      return res.status(422).json({
        message: 'Grade level must be from 1 to 6.'
      });
    }

    if (password.length < 6) {
      return res.status(422).json({
        message: 'Password must be at least 6 characters.'
      });
    }

    const existingUser = await User.findOne({
      where: { username }
    });

    if (existingUser) {
      return res.status(409).json({
        message: 'Username is already taken.'
      });
    }

    const role = await Role.findOne({
      where: { name: 'student' }
    });

    if (!role) {
      return res.status(500).json({
        message: 'Student role not found.'
      });
    }

    const user = await User.create({
      roleId: role.id,
      username,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      displayName: name,
      status: 'active',
      mustChangePassword: false
    });

    const studentCode = `STU-${new Date().getFullYear()}-${Date.now()}`;

    const student = await Student.create({
      userId: user.id,
      studentCode,
      name,
      gradeLevel,
      section,
      avatar,
      status: 'active'
    });

    return res.status(201).json({
      message: 'Student account created successfully.',
      student,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        role: 'student',
        student
      }
    });
  } catch (err) {
    next(err);
  }
});

/*
  TEACHER REGISTRATION
  Still protected. Admin only.
*/
router.post(
  '/register/teacher',
  authenticate,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const body = validate(teacherSchema, req.body);
      assertSafeContentPayload({ name: body.name, employeeCode: body.employeeCode }, 'teacher registration');

      const role = await Role.findOne({
        where: { name: 'teacher' }
      });

      const user = await User.create({
        roleId: role.id,
        username: body.username,
        email: body.email,
        passwordHash: await bcrypt.hash(
          body.password || process.env.DEMO_TEACHER_PASSWORD || 'teach123',
          12
        ),
        displayName: body.name,
        status: 'active',
        mustChangePassword: true
      });

      const teacher = await Teacher.create({
        userId: user.id,
        employeeCode: body.employeeCode,
        name: body.name,
        status: 'active'
      });

      await audit(req.user.id, 'teacher.create', 'teacher', teacher.id);

      return res.status(201).json({ teacher });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
