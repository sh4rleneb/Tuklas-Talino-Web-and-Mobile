import { Router } from 'express';
import { authenticate, requireRole, requirePasswordChanged } from '../middleware/auth.js';
import { MissionCompletion, Student } from '../models/index.js';
import { awardXp, calculateLevel, nextLevelXp } from '../services/progress.service.js';

const router = Router();

router.use(authenticate);
router.use(requirePasswordChanged);
router.use(requireRole('student'));

const MISSION_CATALOG = {
  'word-match': {
    title: 'Word Match',
    xp: 15
  },
  'letter-pop': {
    title: 'Letter Pop',
    xp: 12,
    perChallenge: true
  }
};

router.post('/:missionId/complete', async (req, res, next) => {
  try {
    const student = req.student;
    const missionId = String(req.params.missionId || '').trim();
    const mission = MISSION_CATALOG[missionId];

    if (!student?.id) {
      return res.status(403).json({ message: 'Student account required.' });
    }

    if (!mission) {
      return res.status(404).json({ message: 'Mission not found.' });
    }

    const challengeKey = mission.perChallenge
      ? String(req.body?.challengeId || 'default')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 60) || 'default'
      : '';

    const completionMissionId = mission.perChallenge ? `${missionId}:${challengeKey}` : missionId;
    const rawChallengeTitle = String(req.body?.challengeTitle || challengeKey || mission.title)
      .trim()
      .slice(0, 80);
    const completionTitle = mission.perChallenge
      ? `${mission.title}: ${rawChallengeTitle || challengeKey}`
      : mission.title;

    const [completion, created] = await MissionCompletion.findOrCreate({
      where: {
        studentId: student.id,
        missionId: completionMissionId
      },
      defaults: {
        title: completionTitle,
        xpAwarded: mission.xp,
        completedAt: new Date()
      }
    });

    let updatedStudent = await Student.findByPk(student.id);
    let xpAwarded = 0;

    if (created) {
      updatedStudent = await awardXp(
        student.id,
        mission.xp,
        'mission_completion',
        completion.id,
        `${completionTitle} mission completed`
      );

      xpAwarded = mission.xp;
    }

    const freshStudent = updatedStudent || await Student.findByPk(student.id);
    const newBadges = updatedStudent?.getDataValue?.('newBadges') || updatedStudent?.newBadges || [];

    res.json({
      missionId,
      completionMissionId,
      challengeId: challengeKey || null,
      title: completionTitle,
      completed: true,
      alreadyCompleted: !created,
      xpAwarded,
      totalXp: freshStudent?.xp || 0,
      level: calculateLevel(freshStudent?.xp || 0),
      nextLevelXp: nextLevelXp(freshStudent?.xp || 0),
      newBadges,
      message: created
        ? `Mission complete! +${xpAwarded} XP added.`
        : 'Mission already completed. XP was already awarded before.'
    });
  } catch (err) {
    next(err);
  }
});

router.get('/completions/me', async (req, res, next) => {
  try {
    const student = req.student;

    if (!student?.id) {
      return res.status(403).json({ message: 'Student account required.' });
    }

    const completions = await MissionCompletion.findAll({
      where: { studentId: student.id },
      order: [['completedAt', 'DESC']]
    });

    res.json({ completions });
  } catch (err) {
    next(err);
  }
});

export default router;
