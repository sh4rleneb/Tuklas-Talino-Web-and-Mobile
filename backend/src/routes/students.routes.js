import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { authenticate, requireRole, requirePasswordChanged } from '../middleware/auth.js';
import { Role, User, Student, Lesson, CompletedLesson, Badge, StudentBadge, XpLog, GroupMember, Group, GroupTask, GroupTaskCompletion } from '../models/index.js';
import { calculateLevel, nextLevelXp } from '../services/progress.service.js';
import { audit } from '../services/audit.service.js';
import { studentSchema, validate } from '../validators/common.js';

const router = Router();
router.use(authenticate);
router.use(requirePasswordChanged);

async function getStudentForRequest(req, idParam) {
  if (req.role === 'student') return req.student;
  return Student.findByPk(idParam);
}

async function dashboardPayload(student) {
  const lessons = await Lesson.findAll({
    where: { gradeLevel: student.gradeLevel, status: 'published' },
    order: [['subject', 'ASC'], ['id', 'ASC']]
  });
  const completed = await CompletedLesson.findAll({ where: { studentId: student.id } });
  const completedIds = new Set(completed.map(c => c.lessonId));
  const badges = await StudentBadge.findAll({ where: { studentId: student.id }, include: [Badge] });
  const xpLogs = await XpLog.findAll({ where: { studentId: student.id }, order: [['createdAt', 'DESC']], limit: 10 });
  const memberships = await GroupMember.findAll({ where: { studentId: student.id }, include: [{ model: Group, include: [{ model: GroupTask, as: 'tasks' }] }] });

  return {
    student,
    level: calculateLevel(student.xp),
    nextLevelXp: nextLevelXp(student.xp),
    progress: {
      completedLessons: completed.length,
      totalLessons: lessons.length,
      percent: lessons.length ? Math.round((completed.length / lessons.length) * 100) : 0
    },
    lessons: lessons.map(l => ({ ...l.toJSON(), completed: completedIds.has(l.id) })),
    badges: badges.map(sb => sb.Badge),
    xpLogs,
    groups: memberships.map(m => m.Group)
  };
}

router.get('/', requireRole('admin', 'teacher'), async (req, res, next) => {
  try {
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.q) where.name = { [Op.like]: `%${req.query.q}%` };
    const students = await Student.findAll({ where, include: [User], order: [['gradeLevel','ASC'], ['name','ASC']] });
    res.json({ students });
  } catch (err) { next(err); }
});

router.post('/', requireRole('admin', 'teacher'), async (req, res, next) => {
  try {
    const body = validate(studentSchema, req.body);
    const role = await Role.findOne({ where: { name: 'student' } });
    const user = await User.create({
  roleId: role.id,
  username: body.studentCode,
  displayName: body.name,
  passwordHash: await bcrypt.hash(body.password || process.env.DEMO_STUDENT_PASSWORD || 'student123', 12),
  mustChangePassword: true
});
    const student = await Student.create({ userId: user.id, ...body });
    await audit(req.user.id, 'student.create', 'student', student.id);
    res.status(201).json({ student });
  } catch (err) { next(err); }
});

router.get('/dashboard', requireRole('student'), async (req, res, next) => {
  try { res.json(await dashboardPayload(req.student)); } catch (err) { next(err); }
});

router.get('/:id/dashboard', requireRole('admin', 'teacher'), async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found.' });
    res.json(await dashboardPayload(student));
  } catch (err) { next(err); }
});

router.get('/:id/progress', requireRole('admin', 'teacher', 'student'), async (req, res, next) => {
  try {
    const student = await getStudentForRequest(req, req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found.' });
    if (req.role === 'student' && student.id !== req.student.id) return res.status(403).json({ message: 'Access denied.' });
    const completed = await CompletedLesson.count({ where: { studentId: student.id } });
    const total = await Lesson.count({ where: { gradeLevel: student.gradeLevel, status: 'published' } });
    res.json({ xp: student.xp, level: calculateLevel(student.xp), completed, total, percent: total ? Math.round(completed / total * 100) : 0 });
  } catch (err) { next(err); }
});

router.get('/:id/badges', requireRole('admin', 'teacher', 'student'), async (req, res, next) => {
  try {
    const student = await getStudentForRequest(req, req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found.' });
    if (req.role === 'student' && student.id !== req.student.id) return res.status(403).json({ message: 'Access denied.' });
    const badges = await StudentBadge.findAll({ where: { studentId: student.id }, include: [Badge] });
    const allBadges = await Badge.findAll();
    res.json({ badges: badges.map(b => b.Badge), allBadges });
  } catch (err) { next(err); }
});

router.patch('/:id', requireRole('admin', 'teacher'), async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.id, { include: [User] });
    if (!student) return res.status(404).json({ message: 'Student not found.' });
    const allowed = ['name','gradeLevel','section','avatar','status'];
    for (const key of allowed) if (req.body[key] !== undefined) student[key] = req.body[key];
    await student.save();
    if (req.body.name && student.User) {
      student.User.displayName = req.body.name;
      await student.User.save();
    }
    await audit(req.user.id, 'student.update', 'student', student.id, req.body);
    res.json({ student });
  } catch (err) { next(err); }
});

router.patch('/:id/avatar', requireRole('admin', 'teacher', 'student'), async (req, res, next) => {
  try {
    const student = await getStudentForRequest(req, req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found.' });
    if (req.role === 'student' && student.id !== req.student.id) return res.status(403).json({ message: 'Access denied.' });
    student.avatar = req.body.avatar || student.avatar;
    await student.save();
    res.json({ student });
  } catch (err) { next(err); }
});

router.post('/:id/archive', requireRole('admin', 'teacher'), async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.id, { include: [User] });
    if (!student) return res.status(404).json({ message: 'Student not found.' });
    student.status = 'archived';
    await student.save();
    if (student.User) { student.User.status = 'archived'; await student.User.save(); }
    await audit(req.user.id, 'student.archive', 'student', student.id);
    res.json({ student });
  } catch (err) { next(err); }
});

router.post('/:id/reactivate', requireRole('admin', 'teacher'), async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.id, { include: [User] });
    if (!student) return res.status(404).json({ message: 'Student not found.' });
    student.status = 'active';
    await student.save();
    if (student.User) { student.User.status = 'active'; await student.User.save(); }
    await audit(req.user.id, 'student.reactivate', 'student', student.id);
    res.json({ student });
  } catch (err) { next(err); }
});

router.post('/:id/reset-progress', requireRole('admin', 'teacher'), async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found.' });
    await Promise.all([
      CompletedLesson.destroy({ where: { studentId: student.id } }),
      XpLog.destroy({ where: { studentId: student.id } }),
      StudentBadge.destroy({ where: { studentId: student.id } }),
      GroupTaskCompletion.destroy({ where: { studentId: student.id } })
    ]);
    student.xp = 0;
    await student.save();
    await audit(req.user.id, 'student.reset_progress', 'student', student.id);
    res.json({ message: 'Progress reset.', student });
  } catch (err) { next(err); }
});

export default router;
