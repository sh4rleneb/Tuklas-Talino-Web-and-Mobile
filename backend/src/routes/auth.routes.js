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

function loginAvatar(value) {
  const avatar = typeof value === 'string' ? value.trim() : '';
  return avatar && avatar.length <= 16 ? avatar : null;
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

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Password is incorrect.' });
    }

    const requestedAvatar = loginAvatar(req.body.avatar);
    if (user.Role?.name === 'student' && user.Student && requestedAvatar) {
      user.Student.avatar = requestedAvatar;
      await user.Student.save();
    }

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

    if (!newPassword || newPassword.length < 8) {
      return res.status(422).json({
        message: 'New password must be at least 8 characters.'
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
