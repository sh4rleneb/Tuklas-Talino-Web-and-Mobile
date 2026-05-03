import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { loginSchema, validate, studentSchema, teacherSchema } from '../validators/common.js';
import { signToken, authenticate, requireRole } from '../middleware/auth.js';
import { Role, User, Student, Teacher, AdminProfile } from '../models/index.js';
import { audit } from '../services/audit.service.js';

const router = Router();

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    role: user.Role?.name,
    student: user.Student,
    teacher: user.Teacher,
    admin: user.AdminProfile
  };
}

router.post('/login', async (req, res, next) => {
  try {
    const body = validate(loginSchema, req.body);
    const user = await User.findOne({
      where: { username: body.identifier },
      include: [Role, Student, Teacher, AdminProfile]
    });

    if (!user || user.status !== 'active') {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    if (body.role && user.Role?.name !== body.role) {
      return res.status(403).json({ message: `This account is not a ${body.role} account.` });
    }

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials.' });

    user.lastLoginAt = new Date();
    await user.save();
    await audit(user.id, 'auth.login', 'user', user.id, { role: user.Role?.name });

    return res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) { next(err); }
});

router.post('/logout', authenticate, async (req, res) => {
  await audit(req.user.id, 'auth.logout', 'user', req.user.id);
  return res.json({ message: 'Logged out. Delete the client token.' });
});

router.get('/me', authenticate, async (req, res) => {
  return res.json({ user: publicUser(req.user) });
});

router.post('/change-password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(422).json({ message: 'New password must be at least 6 characters.' });
    }
    const valid = await bcrypt.compare(currentPassword || '', req.user.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Current password is incorrect.' });

    req.user.passwordHash = await bcrypt.hash(newPassword, 12);
    await req.user.save();
    await audit(req.user.id, 'auth.change_password', 'user', req.user.id);
    return res.json({ message: 'Password updated.' });
  } catch (err) { next(err); }
});

router.post('/register/student', authenticate, requireRole('admin', 'teacher'), async (req, res, next) => {
  try {
    const body = validate(studentSchema, req.body);
    const role = await Role.findOne({ where: { name: 'student' } });
    const user = await User.create({
      roleId: role.id,
      username: body.studentCode,
      passwordHash: await bcrypt.hash(body.password || process.env.DEMO_STUDENT_PASSWORD || 'student123', 12),
      displayName: body.name,
      status: 'active'
    });
    const student = await Student.create({
      userId: user.id,
      studentCode: body.studentCode,
      name: body.name,
      gradeLevel: body.gradeLevel,
      section: body.section,
      avatar: body.avatar,
      status: 'active'
    });
    await audit(req.user.id, 'student.create', 'student', student.id);
    return res.status(201).json({ student });
  } catch (err) { next(err); }
});

router.post('/register/teacher', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const body = validate(teacherSchema, req.body);
    const role = await Role.findOne({ where: { name: 'teacher' } });
    const user = await User.create({
      roleId: role.id,
      username: body.username,
      email: body.email,
      passwordHash: await bcrypt.hash(body.password || process.env.DEMO_TEACHER_PASSWORD || 'teach123', 12),
      displayName: body.name,
      status: 'active'
    });
    const teacher = await Teacher.create({
      userId: user.id,
      employeeCode: body.employeeCode,
      name: body.name,
      status: 'active'
    });
    await audit(req.user.id, 'teacher.create', 'teacher', teacher.id);
    return res.status(201).json({ teacher });
  } catch (err) { next(err); }
});

export default router;
