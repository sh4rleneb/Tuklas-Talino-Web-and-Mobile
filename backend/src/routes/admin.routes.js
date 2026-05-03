import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { User, Role, Student, Teacher, Lesson, CompletedLesson, AuditLog } from '../models/index.js';

const router = Router();
router.use(authenticate, requireRole('admin'));

router.get('/stats', async (req, res, next) => {
  try {
    const [users, students, teachers, lessons, completions] = await Promise.all([
      User.count(),
      Student.count(),
      Teacher.count(),
      Lesson.count(),
      CompletedLesson.count()
    ]);
    res.json({ stats: { users, students, teachers, lessons, completions } });
  } catch (err) { next(err); }
});

router.get('/accounts', async (req, res, next) => {
  try {
    const users = await User.findAll({ include: [Role], order: [['createdAt','DESC']] });
    res.json({ users });
  } catch (err) { next(err); }
});

router.patch('/accounts/:id/status', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Account not found.' });
    user.status = req.body.status === 'archived' ? 'archived' : 'active';
    await user.save();
    res.json({ user });
  } catch (err) { next(err); }
});

router.get('/audit-logs', async (req, res, next) => {
  try {
    const logs = await AuditLog.findAll({ order: [['createdAt','DESC']], limit: Number(req.query.limit || 100) });
    res.json({ logs });
  } catch (err) { next(err); }
});

export default router;
