
import { Router } from 'express';
import {
  authenticate,
  requirePasswordChanged,
  requireRole,
} from '../middleware/auth.js';
import {
  StudentBadge,
  Badge,
  Student,
} from '../models/index.js';
import studentRoutes, {
  dashboardPayload,
  ensureCoreBadges,
  buildBadgeProgress,
  calculateLevel,
  levelTitleForXp,
  nextLevelXp,
} from './students.routes.js';
import missionsRoutes, {
  claimMission,
  listMissionsForStudent,
} from './missions.routes.js';
import authRoutes from './auth.routes.js';
import teacherRoutes from './teachers.routes.js';
import lessonRoutes from './lessons.routes.js';
import groupRoutes from './groups.routes.js';
import adminRoutes from './admin.routes.js';
import reportRoutes from './reports.routes.js';
import ttsRoutes from './tts.routes.js';

const router = Router();

router.get('/health', (req, res) => res.json({ ok: true, service: 'tuklas-talino-api' }));

router.get('/dashboard', authenticate, requirePasswordChanged, requireRole('student'), async (req, res, next) => {
  try {
    res.json(await dashboardPayload(req.student));
  } catch (err) {
    next(err);
  }
});

router.get('/badges', authenticate, requirePasswordChanged, requireRole('student'), async (req, res, next) => {
  try {
    const student = req.student;
    const allBadges = await ensureCoreBadges();
    const badges = await StudentBadge.findAll({
      where: { studentId: student.id },
      include: [Badge],
    });
    const badgeProgress = await buildBadgeProgress(student.id, student.xp);

    res.json({
      badges: badges.map((sb) => sb.Badge),
      earnedBadges: badges.map((sb) => ({
        ...sb.Badge.toJSON(),
        awardedAt: sb.awardedAt,
      })),
      allBadges,
      badgeProgress,
      level: calculateLevel(student.xp),
      levelTitle: levelTitleForXp(student.xp),
      nextLevelXp: nextLevelXp(student.xp),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/missions', authenticate, requirePasswordChanged, requireRole('student'), async (req, res, next) => {
  try {
    res.json(await listMissionsForStudent(req.student.id));
  } catch (err) {
    next(err);
  }
});



router.get('/leaderboard', authenticate, requirePasswordChanged, requireRole('student'), async (req, res, next) => {
  try {
    const students = await Student.findAll({
      where: { status: 'active' },
      attributes: [
        'id',
        'name',
        'avatar',
        'xp',
        'currentStreak',
        'gradeLevel',
      ],
      order: [['xp', 'DESC']],
      limit: 20,
    });

    res.json({
      leaderboard: students.map((student, index) => ({
        rank: index + 1,
        ...student.toJSON(),
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/missions/:missionId/claim', authenticate, requirePasswordChanged, requireRole('student'), claimMission);

router.use('/auth', authRoutes);
router.use('/students', studentRoutes);
router.use('/teachers', teacherRoutes);
router.use('/lessons', lessonRoutes);
router.use('/groups', groupRoutes);
router.use('/admin', adminRoutes);
router.use('/reports', reportRoutes);
router.use('/missions', missionsRoutes);
router.use('/tts', ttsRoutes);

export default router;
