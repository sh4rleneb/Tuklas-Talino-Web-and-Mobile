import { Router } from 'express';
import { PERMISSIONS } from '../constants/permissions.js';
import {
  authenticate,
  requirePermission,
  requirePasswordChanged
} from '../middleware/auth.js';
import { Badge, CompletedLesson, MissionCompletion, Student, StudentBadge } from '../models/index.js';
import { awardXp, calculateLevel, nextLevelXp } from '../services/progress.service.js';

const router = Router();

router.use(authenticate);
router.use(requirePasswordChanged);
router.use(
  requirePermission(
    PERMISSIONS.MISSIONS_PARTICIPATE
  )
);

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
  },
  'sound-and-say': {
    title: 'Sound and Say',
    xp: 15,
    requiredCompletedLessons: 1,
    perChallenge: true
  },
};

const MAX_MISSION_ATTEMPTS = 5;

const MISSION_BITUIN_BADGE_DEFINITIONS = {
  default: {
    code: 'writing_3',
    name: 'Bituin sa Pagsagot',
    description: 'Nakuha sa pagtatapos ng misyon at pagkolekta ng bituin.',
    icon: '⭐',
    xpThreshold: null
  },
  'sound-and-say': {
    code: 'speech_3',
    name: 'Boses Bituin',
    description: 'Nakuha sa pagtatapos ng misyon sa pakikinig at pagbigkas.',
    icon: '🎙️',
    xpThreshold: null
  },
  'sentence-builder': {
    code: 'writing_3',
    name: 'Bituin sa Pagsagot',
    description: 'Nakuha sa pagtatapos ng misyon sa pagbuo ng pangungusap.',
    icon: '⭐',
    xpThreshold: null
  }
};

function missionBituinDefinition(missionId) {
  return MISSION_BITUIN_BADGE_DEFINITIONS[missionId] ||
    MISSION_BITUIN_BADGE_DEFINITIONS.default;
}

function plainMissionBadgeResponse(badge = {}) {
  const plain = badge?.toJSON ? badge.toJSON() : badge;

  return {
    id: plain.id,
    code: plain.code,
    slug: plain.code,
    name: plain.name,
    title: plain.name,
    description: plain.description,
    icon: plain.icon || '⭐',
    xpThreshold: plain.xpThreshold ?? plain.xp_threshold ?? null
  };
}

function uniqueMissionBadges(badges = []) {
  const seen = new Set();

  return badges
    .filter(Boolean)
    .map(plainMissionBadgeResponse)
    .filter((badge) => {
      const key = String(badge.code || badge.name || badge.id || '')
        .trim()
        .toLowerCase();

      if (!key || seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

async function awardMissionBituinBadge(studentId, missionId) {
  const definition = missionBituinDefinition(missionId);

  const [badge] = await Badge.findOrCreate({
    where: {
      code: definition.code
    },
    defaults: {
      code: definition.code,
      name: definition.name,
      description: definition.description,
      icon: definition.icon,
      xpThreshold: definition.xpThreshold
    }
  });

  let changed = false;

  for (const field of ['name', 'description', 'icon', 'xpThreshold']) {
    if (
      definition[field] !== undefined &&
      badge[field] !== definition[field]
    ) {
      badge[field] = definition[field];
      changed = true;
    }
  }

  if (changed) {
    await badge.save();
  }

  const existing = await StudentBadge.findOne({
    where: {
      studentId,
      badgeId: badge.id
    }
  });

  if (existing) {
    return null;
  }

  await StudentBadge.create({
    studentId,
    badgeId: badge.id
  });

  return plainMissionBadgeResponse(badge);
}


function missionAttemptCompletions(completions, missionId) {
  return completions.filter((completion) => {
    const completionId = String(completion.missionId || '');
    return completionId === missionId || completionId.startsWith(`${missionId}:`);
  });
}

function missionAttemptCount(completions, missionId) {
  return missionAttemptCompletions(completions, missionId).length;
}

function missionIsCompleted(completions, missionId, maxAttempts = MAX_MISSION_ATTEMPTS) {
  return missionAttemptCount(completions, missionId) >= maxAttempts;
}

function missionPayload(missionId, mission, completions, completedLessons) {
  const completed = missionIsCompleted(completions, missionId);
  const target = Number(mission.requiredCompletedLessons || 0);
  const current = Math.min(Number(completedLessons || 0), target);
  const state = completed
    ? 'claimed'
    : 'available';

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

function missionStudentId(value) {
  const id = Number(
    typeof value === 'object' && value !== null
      ? value.id
      : value
  );

  return Number.isInteger(id) && id > 0 ? id : null;
}

async function listMissionsForStudent(studentId) {
  const normalizedStudentId = missionStudentId(studentId);

  if (!normalizedStudentId) {
    return {
      missions: Object.entries(MISSION_CATALOG).map(([missionId, mission]) =>
        missionPayload(missionId, mission, [], 0)
      ),
      completions: []
    };
  }

  const [completions, completedLessons] = await Promise.all([
    MissionCompletion.findAll({
      where: { studentId: normalizedStudentId },
      order: [['completedAt', 'DESC']]
    }),
    CompletedLesson.count({ where: { studentId: normalizedStudentId } })
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

    const existingMissionCompletions = await MissionCompletion.findAll({
      where: { studentId: student.id }
    });
    const maxAttempts = Number(mission.maxAttempts || MAX_MISSION_ATTEMPTS);
    const existingMissionAttempts = missionAttemptCount(existingMissionCompletions, missionId);

    if (existingMissionAttempts >= maxAttempts) {
      return res.status(409).json({
        message: `You already used all ${maxAttempts} attempts for this mission.`,
        attemptsUsed: existingMissionAttempts,
        maxAttempts,
        attemptsRemaining: 0
      });
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

    void 0;

    if (created) {
      void 0;
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
    const dbStudent = await Student.findByPk(student.id);

    void 0;

    const attemptsUsed = created
      ? existingMissionAttempts + 1
      : existingMissionAttempts;

    const currentAttemptNo = attemptsUsed;

    const shouldClaimBituin =
      created &&
      (
        req.body?.claimBituin === true ||
        req.body?.claimBituin === 'true' ||
        currentAttemptNo >= maxAttempts
      );

    const thresholdBadges =
      updatedStudent?.getDataValue?.('newBadges') ||
      updatedStudent?.newBadges ||
      [];

    const bituinBadge = shouldClaimBituin
      ? await awardMissionBituinBadge(student.id, missionId)
      : null;

    const newBadges = uniqueMissionBadges([
      ...thresholdBadges,
      bituinBadge
    ]);

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
      attemptNo: currentAttemptNo || attemptsUsed,
      attemptsUsed,
      maxAttempts,
      bituinClaimed: Boolean(bituinBadge),
      bituinBadge,
      newBadges,
      message: created
        ? shouldClaimBituin
          ? `Mission complete! +${xpAwarded} XP added and bituin badge checked.`
          : `Mission complete! +${xpAwarded} XP added.`
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
