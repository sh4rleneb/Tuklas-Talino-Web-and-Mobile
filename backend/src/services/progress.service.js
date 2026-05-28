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
    name: 'Quiz Bayani',
    description: 'Makakuha ng perfect score sa quiz.',
    icon: '🧠',
    xpThreshold: null,
    metric: 'perfectQuizzes',
    target: 1
  },
  {
    code: 'writing_3',
    name: 'Sagot Star',
    description: 'Complete 3 Punan ang Patlang or writing activities.',
    icon: '✍️',
    xpThreshold: null,
    metric: 'writingSubmissions',
    target: 3
  },
  {
    code: 'speech_3',
    name: 'Boses Bituin',
    description: 'Magsumite ng 3 speech attempts.',
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
    name: 'Sipag Star',
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

  const [
    completedLessons,
    perfectQuizzes,
    writingSubmissions,
    speechAttempts,
    approvedGroupTasks
  ] = await Promise.all([
    CompletedLesson.count({ where: { studentId } }),
    QuizAttempt.count({ where: { studentId, percent: 100 } }),
    WritingSubmission.count({ where: { studentId } }),
    SpeechAttempt.count({ where: { studentId } }),
    GroupTaskCompletion.count({ where: { studentId, verificationStatus: 'approved' } })
  ]);

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
      name: 'Sagot Star',
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
  const student = await Student.findByPk(studentId);
  if (!student) return null;

  const safePoints = Math.max(0, Number(points || 0));

  student.xp = Number(student.xp || 0) + safePoints;
  student.lastActiveAt = new Date();

  await student.save();
  await XpLog.create({ studentId, sourceType, sourceId, points: safePoints, note });

  const newBadges = await awardThresholdBadges(student);

  student.newBadges = newBadges;

  if (typeof student.setDataValue === 'function') {
    student.setDataValue('newBadges', newBadges);
  }

  return student;
}

export async function awardThresholdBadges(student) {
  await ensureCoreBadges();

  const badges = await Badge.findAll();
  const stats = await buildBadgeStats(student);
  const newBadges = [];

  for (const badge of badges) {
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
  }

  return uniqueBadgeResponses(newBadges);
}

export function levelTitleForLevel(level = 1) {
  const safeLevel = Math.max(1, Math.min(MAX_LEVEL, Number(level || 1)));

  return LEVEL_TITLES[safeLevel - 1] || LEVEL_TITLES[0];
}

export function levelTitleForXp(xp = 0) {
  return levelTitleForLevel(calculateLevel(xp));
}

