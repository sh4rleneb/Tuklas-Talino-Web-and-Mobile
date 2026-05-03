import { Badge, Student, StudentBadge, XpLog } from '../models/index.js';

export function calculateLevel(xp = 0) {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 25)) + 1;
}

export function nextLevelXp(xp = 0) {
  const nextLevel = calculateLevel(xp) + 1;
  return Math.pow(nextLevel - 1, 2) * 25;
}

export async function awardXp(studentId, points, sourceType, sourceId = null, note = '') {
  const student = await Student.findByPk(studentId);
  if (!student) return null;

  student.xp += points;
  student.lastActiveAt = new Date();
  await student.save();
  await XpLog.create({ studentId, sourceType, sourceId, points, note });
  await awardThresholdBadges(student);
  return student;
}

export async function awardThresholdBadges(student) {
  const badges = await Badge.findAll();
  for (const badge of badges) {
    if (badge.xpThreshold !== null && student.xp >= badge.xpThreshold) {
      await StudentBadge.findOrCreate({ where: { studentId: student.id, badgeId: badge.id } });
    }
  }
}
