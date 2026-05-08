import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { authenticate, requireRole, requirePasswordChanged } from '../middleware/auth.js';
import { Role, User, Teacher, Student, CompletedLesson, Lesson, Group, GroupMember } from '../models/index.js';
import { teacherSchema, validate } from '../validators/common.js';
import { audit } from '../services/audit.service.js';

const router = Router();
router.use(authenticate);
router.use(requirePasswordChanged);

router.get('/', requireRole('admin'), async (req, res, next) => {
  try {
    const teachers = await Teacher.findAll({ include: [User], order: [['name','ASC']] });
    res.json({ teachers });
  } catch (err) { next(err); }
});

router.post('/', requireRole('admin'), async (req, res, next) => {
  try {
    const body = validate(teacherSchema, req.body);
    const role = await Role.findOne({ where: { name: 'teacher' } });
    const user = await User.create({
  roleId: role.id,
  username: body.username,
  email: body.email,
  displayName: body.name,
  passwordHash: await bcrypt.hash(body.password || process.env.DEMO_TEACHER_PASSWORD || 'teach123', 12),
  mustChangePassword: true
});
    const teacher = await Teacher.create({ userId: user.id, employeeCode: body.employeeCode, name: body.name });
    await audit(req.user.id, 'teacher.create', 'teacher', teacher.id);
    res.status(201).json({ teacher });
  } catch (err) { next(err); }
});

router.get('/dashboard', requireRole('teacher', 'admin'), async (req, res, next) => {
  try {
    const [students, lessons, completed, groups] = await Promise.all([
      Student.count({ where: { status: 'active' } }),
      Lesson.count({ where: { status: 'published' } }),
      CompletedLesson.count(),
      Group.count({ where: { status: 'active' } })
    ]);
    const recentStudents = await Student.findAll({ order: [['updatedAt','DESC']], limit: 8 });
    res.json({ stats: { students, lessons, completed, groups }, recentStudents });
  } catch (err) { next(err); }
});

router.get('/monitoring/stats', requireRole('teacher', 'admin'), async (req, res, next) => {
  try {
    const students = await Student.findAll({ order: [['gradeLevel','ASC'], ['name','ASC']] });
    const totalLessons = await Lesson.count({ where: { status: 'published' } });
    const rows = [];
    for (const s of students) {
      const completed = await CompletedLesson.count({ where: { studentId: s.id } });
      rows.push({
        id: s.id,
        studentCode: s.studentCode,
        name: s.name,
        gradeLevel: s.gradeLevel,
        section: s.section,
        xp: s.xp,
        completed,
        totalLessons,
        percent: totalLessons ? Math.round(completed / totalLessons * 100) : 0,
        status: s.status
      });
    }
    res.json({ rows });
  } catch (err) { next(err); }
});

router.get('/students/:studentId', requireRole('teacher', 'admin'), async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.studentId, { include: [GroupMember] });
    if (!student) return res.status(404).json({ message: 'Student not found.' });
    const completed = await CompletedLesson.findAll({ where: { studentId: student.id }, include: [Lesson] });
    res.json({ student, completed });
  } catch (err) { next(err); }
});

router.patch('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const teacher = await Teacher.findByPk(req.params.id, { include: [User] });
    if (!teacher) return res.status(404).json({ message: 'Teacher not found.' });
    for (const key of ['name','employeeCode','status']) if (req.body[key] !== undefined) teacher[key] = req.body[key];
    await teacher.save();
    if (req.body.name && teacher.User) { teacher.User.displayName = req.body.name; await teacher.User.save(); }
    await audit(req.user.id, 'teacher.update', 'teacher', teacher.id, req.body);
    res.json({ teacher });
  } catch (err) { next(err); }
});

router.post('/:id/archive', requireRole('admin'), async (req, res, next) => {
  try {
    const teacher = await Teacher.findByPk(req.params.id, { include: [User] });
    if (!teacher) return res.status(404).json({ message: 'Teacher not found.' });
    teacher.status = 'archived';
    await teacher.save();
    if (teacher.User) { teacher.User.status = 'archived'; await teacher.User.save(); }
    await audit(req.user.id, 'teacher.archive', 'teacher', teacher.id);
    res.json({ teacher });
  } catch (err) { next(err); }
});

router.post('/:id/reactivate', requireRole('admin'), async (req, res, next) => {
  try {
    const teacher = await Teacher.findByPk(req.params.id, { include: [User] });
    if (!teacher) return res.status(404).json({ message: 'Teacher not found.' });
    teacher.status = 'active';
    await teacher.save();
    if (teacher.User) { teacher.User.status = 'active'; await teacher.User.save(); }
    await audit(req.user.id, 'teacher.reactivate', 'teacher', teacher.id);
    res.json({ teacher });
  } catch (err) { next(err); }
});

export default router;
