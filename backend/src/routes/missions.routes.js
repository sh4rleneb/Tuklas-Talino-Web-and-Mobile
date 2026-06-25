import { Router } from 'express';
import { authenticate, requireRole, requirePasswordChanged } from '../middleware/auth.js';
import { CompletedLesson, MissionCompletion, Student } from '../models/index.js';
import { awardXp, calculateLevel, nextLevelXp } from '../services/progress.service.js';

const router = Router();

router.use(authenticate);
router.use(requirePasswordChanged);
router.use(requireRole('student'));

const MISSION_CATALOG = {
  'word-match': {
    title: 'Word Match',
    xp: 15,
        perChallenge: true,
    requiredCompletedLessons: 1
  },
  'letter-pop': {
    title: 'Letter Pop',
    xp: 12,
    perChallenge: true,
    requiredCompletedLessons: 2
  },
  'picture-guess': {
    title: 'Picture Guess',
    xp: 12,
    perChallenge: true,
    requiredCompletedLessons: 3
  },
  'sentence-builder': {
    title: 'Sentence Builder',
    xp: 18,
    perChallenge: true,
    requiredCompletedLessons: 4
  },
  'story-quest': {
    title: 'Story Quest',
    xp: 20,
    perChallenge: true,
    requiredCompletedLessons: 5
  }
};

function missionIsCompleted(completions, missionId) {
  return completions.some((completion) => {
    const completionId = String(completion.missionId || '');
    return completionId === missionId || completionId.startsWith(`${missionId}:`);
  });
}

function missionPayload(missionId, mission, completions, completedLessons) {
  const completed = missionIsCompleted(completions, missionId);
  const target = Number(mission.requiredCompletedLessons || 0);
  const current = Math.min(Number(completedLessons || 0), target);
  const state = completed
    ? 'claimed'
    : current >= target
      ? 'ready_to_claim'
      : current > 0
        ? 'in_progress'
        : 'locked';

  return {
    missionId,
    title: mission.title,
    xp: mission.xp,
    completed,
    state,
    requirement: {
      type: 'completed_lessons',
      current,
      target,
      percent: target ? Math.round((current / target) * 100) : 100
    }
  };
}

async function listMissionsForStudent(studentId) {
  const [completions, completedLessons] = await Promise.all([
    MissionCompletion.findAll({
      where: { studentId },
      order: [['completedAt', 'DESC']]
    }),
    CompletedLesson.count({ where: { studentId } })
  ]);

  return {
    missions: Object.entries(MISSION_CATALOG).map(([missionId, mission]) =>
      missionPayload(missionId, mission, completions, completedLessons)
    ),
    completions
  };
}

async function completeMission(req, res, next, options = {}) {
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

    if (options.requireEligibility) {
      const [completedLessons, completions] = await Promise.all([
        CompletedLesson.count({ where: { studentId: student.id } }),
        MissionCompletion.findAll({ where: { studentId: student.id } })
      ]);
      const availability = missionPayload(missionId, mission, completions, completedLessons);

      if (availability.state !== 'ready_to_claim') {
        return res.status(409).json({
          message: availability.state === 'claimed'
            ? 'Mission XP was already claimed.'
            : `Complete ${availability.requirement.target} lessons before claiming this mission.`,
          mission: availability
        });
      }
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
}

function claimMission(req, res, next) {
  return completeMission(req, res, next, { requireEligibility: true });
}

router.post('/:missionId/complete', completeMission);
router.post('/:missionId/claim', claimMission);

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

export { MISSION_CATALOG, claimMission, completeMission, listMissionsForStudent };
export default router;
