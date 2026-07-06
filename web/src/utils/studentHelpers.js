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

export const SHORT_LEVEL_TITLES = [
  'Bagong Tuklas',
  'Masipag',
  'Aktibo',
  'Mahusay',
  'Magaling',
  'Matalino',
  'Masigasig',
  'Natatangi',
  'Dalubhasa',
  'Kampeon'
];


export const LEVEL_THRESHOLDS = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700];
export const MAX_LEVEL = LEVEL_TITLES.length;

import { EARLY_GROUP_ROLES, UPPER_GROUP_ROLES } from '../constants/studentConstants';
export function levelForXp(xp = 0) {
  const totalXp = Math.max(0, Number(xp || 0));
  let level = 1;

  for (let index = 0; index < LEVEL_THRESHOLDS.length; index += 1) {
    if (totalXp >= LEVEL_THRESHOLDS[index]) {
      level = index + 1;
    }
  }

  return Math.min(MAX_LEVEL, level);
}

export function xpPercent(xp = 0) {
  const totalXp = Math.max(0, Number(xp || 0));
  const level = levelForXp(totalXp);

  if (level >= MAX_LEVEL) {
    return 100;
  }

  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] || currentThreshold + 100;
  const span = Math.max(1, nextThreshold - currentThreshold);
  const earnedInLevel = Math.max(0, totalXp - currentThreshold);

  return Math.max(0, Math.min(100, Math.round((earnedInLevel / span) * 100)));
}

export function fmtDate(value) {
  if (!value) return '—';
  try { return new Date(value).toLocaleDateString(); } catch { return '—'; }
}

export function subjectTheme(subject) {
  const map = {
    'Pagbasa': { icon: '📖', bg: '#DFF7E8', accent: '#2ECC71', tag: 'Kwento' },
    'Bokabularyo': { icon: '🔤', bg: '#DFF2FF', accent: '#3498DB', tag: 'Salita' },
    'Panitikan': { icon: '📜', bg: '#FFF0DD', accent: '#F39C12', tag: 'Tula' },
    'Komunikasyong Pagsasalita': { icon: '🎙️', bg: '#FFE2EA', accent: '#E67EA2', tag: 'Bigkas' },
    'Pagsulat': { icon: '✍️', bg: '#FFF8CF', accent: '#F1C40F', tag: 'Sulatin' },
    'Grupo': { icon: '👥', bg: '#EFE5FF', accent: '#9B59B6', tag: 'Sama-sama' }
  };
  return map[subject] || { icon: '📚', bg: '#F6F6F6', accent: '#95A5A6', tag: 'Lessons' };
}

export function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export function masteryFromPercent(percent = 0) {
  const value = Number(percent || 0);
  if (value >= 90) return { label: 'Advanced', icon: '🏆', tone: 'green', note: 'Excellent mastery. Keep challenging yourself.' };
  if (value >= 75) return { label: 'Proficient', icon: '🌟', tone: 'blue', note: 'Good understanding. A short review can make it stronger.' };
  if (value >= 50) return { label: 'Developing', icon: '🌱', tone: 'yellow', note: 'You are getting there. Review the missed questions.' };
  return { label: 'Needs Practice', icon: '🧭', tone: 'pink', note: 'Try again after reviewing the lesson.' };
}

export function lessonXp(lesson) {
  return lesson?.xpReward ?? lesson?.xp ?? 0;
}

export function displayDue(dateValue) {
  if (!dateValue) return 'Walang due date';
  try {
    return new Date(dateValue).toLocaleDateString('fil-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return String(dateValue); }
}

export function taskCompletionPercent(task = {}, localDone = false) {
  if (localDone || task.completed || task.isCompleted || task.status === 'completed') return 100;
  if (task.status === 'submitted') return 75;
  if (task.status === 'in_progress') return 45;
  return 15;
}

export function effectivenessBand(percent = 0) {
  const value = Number(percent || 0);
  if (value >= 85) return { label: 'Mastery', icon: '🏆', note: 'Students are showing strong understanding.' };
  if (value >= 70) return { label: 'Developing', icon: '🌱', note: 'Most students are progressing, but some need practice.' };
  if (value >= 40) return { label: 'Needs Support', icon: '🧭', note: 'Review missed skills and give guided practice.' };
  return { label: 'Starting', icon: '✨', note: 'Students are beginning the activity or need more attempts.' };
}

export function lessonAssessmentProfile(activities = []) {
  const rows = asArray(activities);
  const has = (type) => rows.some(activity => activity?.type === type);
  return {
    hasContent: has('infographic') || has('vocabulary'),
    hasObjectiveQuiz: has('mcq') || has('matching'),
    hasWriting: has('writing'),
    hasSpeech: has('speech'),
    activityCount: rows.length
  };
}

export function getBestQuizAttempt(attempts = {}, quizId) {
  const rows = asArray(attempts?.[quizId]);
  if (!rows.length) return null;
  return rows.reduce((best, row) => Number(row.percent || 0) > Number(best.percent || 0) ? row : best, rows[0]);
}

export function rolesForGradeLevel(gradeLevel) {
  return Number(gradeLevel || 4) <= 2 ? EARLY_GROUP_ROLES : UPPER_GROUP_ROLES;
}
export function levelTitleForLevel(level = 1) {
  const safeLevel = Math.max(1, Math.min(MAX_LEVEL, Number(level || 1)));

  return LEVEL_TITLES[safeLevel - 1] || LEVEL_TITLES[0];
}

export function levelTitleForXp(xp = 0) {
  return levelTitleForLevel(levelForXp(xp));
}


export function shortLevelTitleForLevel(level = 1) {
  const safeLevel = Math.max(1, Math.min(MAX_LEVEL, Number(level || 1)));

  return SHORT_LEVEL_TITLES[safeLevel - 1] || SHORT_LEVEL_TITLES[0];
}

export function shortLevelTitleForXp(xp = 0) {
  return shortLevelTitleForLevel(levelForXp(xp));
}

