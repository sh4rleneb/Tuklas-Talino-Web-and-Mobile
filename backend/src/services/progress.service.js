import {
  Badge,
  CompletedLesson,
  GroupTaskCompletion,
  QuizAttempt,
  SpeechAttempt,
  Student,
  StudentBadge,
  WritingSubmission,
  XpLog
} from '../models/index.js';

export const LEVEL_TITLES = [
  'Bagong Tuklas',
  'Masipag na Mag-aaral',
  'Aktibong Mag-aaral',
  'Mahusay na Mag-aaral',
  'Magaling na Mag-aaral',
  'Matalinong Mag-aaral',
  'Masigasig na Mag-aaral',
  'Natatanging Mag-aaral',
  'Dalubhasang Mag-aaral',
  'Tuklas Kampeon'
];

export const LEVEL_THRESHOLDS = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700];
export const MAX_LEVEL = LEVEL_TITLES.length;

export const CORE_BADGE_DEFINITIONS = [
  {
    code: 'first_lesson',
    name: 'Unang Hakbang',
    description: 'Natapos ang unang lesson.',
    icon: '🌱',
    xpThreshold: null,
    metric: 'completedLessons',
    target: 1
  },
  {
    code: 'reader_3',
    name: 'Batang Mambabasa',
    description: 'Makatapos ng 3 lessons.',
    icon: '📖',
    xpThreshold: null,
    metric: 'completedLessons',
    target: 3
  },
  {
    code: 'quiz_perfect',
    name: 'Henyo sa Pagsusulit',
    description: 'Makakuha ng perpektong iskor sa isang pagsusulit.',
    icon: '🧠',
    xpThreshold: null,
    metric: 'perfectQuizzes',
    target: 1
  },
  {
    code: 'writing_3',
    name: 'Bituin sa Pagsagot',
    description: 'Complete 3 Punan ang Patlang or writing activities.',
    icon: '✍️',
    xpThreshold: null,
    metric: 'writingSubmissions',
    target: 3
  },
  {
    code: 'speech_3',
    name: 'Boses Bituin',
    description: 'Magsumite ng 3 magkakaibang speech activities.',
    icon: '🎤',
    xpThreshold: null,
    metric: 'speechAttempts',
    target: 3
  },
  {
    code: 'group_1',
    name: 'Kaagapay sa Gawain',
    description: 'Makatapos ng 1 approved group task.',
    icon: '🤝',
    xpThreshold: null,
    metric: 'approvedGroupTasks',
    target: 1
  },
  {
    code: 'xp_100',
    name: 'Bituin ng Kasipagan',
    description: 'Makaipon ng 100 XP.',
    icon: '⭐',
    xpThreshold: 100,
    metric: 'xp',
    target: 100
  },
  {
    code: 'level_10',
    name: 'Tuklas Kampeon',
    description: 'Maabot ang Level 10.',
    icon: '🏆',
    xpThreshold: null,
    metric: 'level',
    target: 10
  }
];

function normalizeBadgeCode(code = '') {
  return String(code || '').trim().toLowerCase();
}

function badgeDefinitionForCode(code) {
  const normalizedCode = normalizeBadgeCode(code);

  const aliases = {
    first_lesson: 'first_lesson',
    reader: 'reader_3',
    writer: 'writing_3',
    speaker: 'speech_3',
    teamwork: 'group_1'
  };

  const targetCode = aliases[normalizedCode] || normalizedCode;

  return CORE_BADGE_DEFINITIONS.find(definition => normalizeBadgeCode(definition.code) === targetCode);
}

async function ensureCoreBadges() {
  const badges = [];

  for (const definition of CORE_BADGE_DEFINITIONS) {
    const [badge] = await Badge.findOrCreate({
      where: { code: definition.code },
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
      if (badge[field] !== definition[field]) {
        badge[field] = definition[field];
        changed = true;
      }
    }

    if (changed) {
      await badge.save();
    }

    badges.push(badge);
  }

  return badges;
}

async function buildBadgeStats(student) {
  const studentId = student.id;

  const timer = () => undefined;

  let t = Date.now();
  const completedLessons =
    await CompletedLesson.count({ where: { studentId } });
  timer('CompletedLesson.count', t);

  t = Date.now();
  const perfectQuizzes =
    await QuizAttempt.count({ where: { studentId, percent: 100 } });
  timer('QuizAttempt.count', t);

  t = Date.now();
  const writingSubmissions =
    await WritingSubmission.count({ where: { studentId } });
  timer('WritingSubmission.count', t);

  t = Date.now();
  const speechAttempts =
    await countUniqueSpeechTasks(studentId);
  timer('countUniqueSpeechTasks', t);

  t = Date.now();
  const approvedGroupTasks =
    await GroupTaskCompletion.count({
      where: {
        studentId,
        verificationStatus: 'approved'
      }
    });
  timer('GroupTaskCompletion.count', t);

  return {
    completedLessons,
    perfectQuizzes,
    writingSubmissions,
    speechAttempts,
    approvedGroupTasks,
    xp: Number(student.xp || 0),
    level: calculateLevel(student.xp)
  };
}

async function countUniqueSpeechTasks(studentId) {
  const rows = await SpeechAttempt.findAll({
    where: { studentId },
    attributes: ['taskId'],
    group: ['taskId'],
    raw: true,
  });

  return rows.length;
}

function badgeMetricValue(stats, metric) {
  if (metric === 'completedLessons') return stats.completedLessons;
  if (metric === 'perfectQuizzes') return stats.perfectQuizzes;
  if (metric === 'writingSubmissions') return stats.writingSubmissions;
  if (metric === 'speechAttempts') return stats.speechAttempts;
  if (metric === 'approvedGroupTasks') return stats.approvedGroupTasks;
  if (metric === 'xp') return stats.xp;
  if (metric === 'level') return stats.level;

  return 0;
}

function plainBadge(badge) {
  return badge?.toJSON ? badge.toJSON() : badge;
}

export function calculateLevel(xp = 0) {
  const totalXp = Math.max(0, Number(xp || 0));
  let level = 1;

  for (let index = 0; index < LEVEL_THRESHOLDS.length; index += 1) {
    if (totalXp >= LEVEL_THRESHOLDS[index]) {
      level = index + 1;
    }
  }

  return Math.min(MAX_LEVEL, level);
}

export function nextLevelXp(xp = 0) {
  const level = calculateLevel(xp);

  if (level >= MAX_LEVEL) {
    return null;
  }

  return LEVEL_THRESHOLDS[level];
}

function canonicalBadgeCode(code = '') {
  const raw = String(code || '').trim().toLowerCase();

  if (raw === 'reader') return 'reader_3';
  if (raw === 'writer') return 'writing_3';
  if (raw === 'speaker') return 'speech_3';
  if (raw === 'teamwork') return 'group_1';
  if (raw === 'firstlesson') return 'first_lesson';

  return raw;
}

function normalizeBadgeResponse(badge = {}) {
  const plain = badge?.toJSON ? badge.toJSON() : badge;
  const code = canonicalBadgeCode(plain?.code);

  if (code === 'writing_3') {
    return {
      ...plain,
      code: 'writing_3',
      name: 'Bituin sa Pagsagot',
      description: 'Complete 3 Punan ang Patlang or writing activities.',
      icon: plain?.icon || '✍️'
    };
  }

  if (code === 'reader_3') {
    return {
      ...plain,
      code: 'reader_3',
      name: 'Batang Mambabasa',
      description: 'Makatapos ng 3 lessons.',
      icon: plain?.icon || '📖'
    };
  }

  return {
    ...plain,
    code: plain?.code || code
  };
}

function uniqueBadgeResponses(badges = []) {
  const grouped = new Map();

  badges.filter(Boolean).forEach((badge, index) => {
    const plain = badge?.toJSON ? badge.toJSON() : badge;
    const rawCode = String(plain?.code || '').trim().toLowerCase();
    const code = canonicalBadgeCode(rawCode);
    const name = String(plain?.name || '').trim().toLowerCase();
    const key = code || name || `badge-${index}`;
    const normalized = normalizeBadgeResponse(plain);
    const current = grouped.get(key);

    if (!current) {
      grouped.set(key, { badge: normalized, canonical: rawCode === code });
      return;
    }

    if (!current.canonical && rawCode === code) {
      grouped.set(key, { badge: normalized, canonical: true });
    }
  });

  return Array.from(grouped.values()).map(entry => entry.badge);
}


export async function awardXp(studentId, points, sourceType, sourceId = null, note = '') {
  const safePoints = Math.max(0, Number(points || 0));
  const normalizedSourceType = String(sourceType || '').trim();
  const normalizedSourceId =
    sourceId === undefined || sourceId === ''
      ? null
      : sourceId;

  const canCheckDuplicateSource =
    Boolean(normalizedSourceType) &&
    normalizedSourceId !== null &&
    normalizedSourceId !== undefined;

  const sequelize = Student.sequelize;
  let updatedStudent = null;
  let xpAwarded = 0;
  let xpAlreadyAwarded = false;

  await sequelize.transaction(async (transaction) => {
    const student = await Student.findByPk(studentId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!student) {
      updatedStudent = null;
      return;
    }

    if (canCheckDuplicateSource) {
      const existingXpLog = await XpLog.findOne({
        where: {
          studentId,
          sourceType: normalizedSourceType,
          sourceId: normalizedSourceId
        },
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (existingXpLog) {
        xpAlreadyAwarded = true;
        updatedStudent = student;
        return;
      }
    }

    if (safePoints <= 0) {
      updatedStudent = student;
      return;
    }

    xpAwarded = safePoints;
    student.xp = Number(student.xp || 0) + xpAwarded;
    student.lastActiveAt = new Date();

    const today = new Date().toISOString().slice(0, 10);
    const previousDate = student.lastActivityDate;

    if (!previousDate) {
      student.currentStreak = 1;
    } else {
      const previous = new Date(previousDate);
      const current = new Date(today);

      const diffDays = Math.floor(
        (current - previous) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1) {
        student.currentStreak =
          Number(student.currentStreak || 0) + 1;
      } else if (diffDays > 1) {
        student.currentStreak = 1;
      }
    }

    student.longestStreak = Math.max(
      Number(student.longestStreak || 0),
      Number(student.currentStreak || 0)
    );

    student.lastActivityDate = today;

    await student.save({ transaction });

    await XpLog.create({
      studentId,
      sourceType: normalizedSourceType || sourceType,
      sourceId: normalizedSourceId,
      points: xpAwarded,
      note
    }, { transaction });

    updatedStudent = student;
  });

  if (!updatedStudent) return null;

  let newBadges = [];

  if (xpAwarded > 0) {
    newBadges = await awardThresholdBadges(updatedStudent);
  }

  updatedStudent.newBadges = newBadges;

  if (typeof updatedStudent.setDataValue === 'function') {
    updatedStudent.setDataValue('newBadges', newBadges);
    updatedStudent.setDataValue('xpAwarded', xpAwarded);
    updatedStudent.setDataValue('xpAlreadyAwarded', xpAlreadyAwarded);
  }

  return updatedStudent;
}

export async function awardThresholdBadges(student) {
  const profile = () => undefined;

  const badges = await Badge.findAll();
  profile('Badge.findAll');
  const stats = await buildBadgeStats(student);
  profile('buildBadgeStats');
  const newBadges = [];

  for (const badge of badges) {
    const badgeTimer = Date.now();
    const definition = badgeDefinitionForCode(badge.code);
    let isEligible = false;

    if (definition) {
      isEligible = badgeMetricValue(stats, definition.metric) >= definition.target;
    } else if (badge.xpThreshold !== null && badge.xpThreshold !== undefined) {
      isEligible = Number(student.xp || 0) >= Number(badge.xpThreshold || 0);
    }

    if (!isEligible) {
      continue;
    }

    const [studentBadge, created] = await StudentBadge.findOrCreate({
      where: {
        studentId: student.id,
        badgeId: badge.id
      }
    });

    if (created || studentBadge) {
      if (created) {
        newBadges.push(plainBadge(badge));
      }
    }

    void 0;
  }

  profile('badge loop');
  profile('awardThresholdBadges complete');
  return uniqueBadgeResponses(newBadges);
}

export function levelTitleForLevel(level = 1) {
  const safeLevel = Math.max(1, Math.min(MAX_LEVEL, Number(level || 1)));

  return LEVEL_TITLES[safeLevel - 1] || LEVEL_TITLES[0];
}

export function levelTitleForXp(xp = 0) {
  return levelTitleForLevel(calculateLevel(xp));
}

