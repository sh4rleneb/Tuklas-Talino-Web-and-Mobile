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

    const [completion, created] = await MissionCompletion.findOrCreate({
      where: {
        studentId: student.id,
        missionId
      },
      defaults: {
        title: mission.title,
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
        `${mission.title} mission completed`
      );

      xpAwarded = mission.xp;
    }

    const freshStudent = updatedStudent || await Student.findByPk(student.id);

    res.json({
      missionId,
      title: mission.title,
      completed: true,
      alreadyCompleted: !created,
      xpAwarded,
      totalXp: freshStudent?.xp || 0,
      level: calculateLevel(freshStudent?.xp || 0),
      nextLevelXp: nextLevelXp(freshStudent?.xp || 0),
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
