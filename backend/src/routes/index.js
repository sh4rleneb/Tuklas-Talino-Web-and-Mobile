
import { Router } from 'express';
import {
  authenticate,
  requirePasswordChanged,
  requireRole,
} from '../middleware/auth.js';
import {
  StudentBadge,
  Badge,
  MissionCompletion,
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
  MISSION_CATALOG,
  completeMission,
} from './missions.routes.js';
import authRoutes from './auth.routes.js';
import teacherRoutes from './teachers.routes.js';
import lessonRoutes from './lessons.routes.js';
import groupRoutes from './groups.routes.js';
import adminRoutes from './admin.routes.js';
import reportRoutes from './reports.routes.js';

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
    const student = req.student;
    const completions = await MissionCompletion.findAll({ where: { studentId: student.id } });
    const completedIds = new Set(completions.map((completion) => String(completion.missionId)));

    const missions = Object.entries(MISSION_CATALOG).map(([missionId, mission]) => ({
      missionId,
      title: mission.title,
      xp: mission.xp,
      completed: completedIds.has(missionId),
    }));

    res.json({ missions, completions });
  } catch (err) {
    next(err);
  }
});

router.post('/missions/:missionId/claim', authenticate, requirePasswordChanged, requireRole('student'), completeMission);

router.use('/auth', authRoutes);
router.use('/students', studentRoutes);
router.use('/teachers', teacherRoutes);
router.use('/lessons', lessonRoutes);
router.use('/groups', groupRoutes);
router.use('/admin', adminRoutes);
router.use('/reports', reportRoutes);
router.use('/missions', missionsRoutes);

export default router;
