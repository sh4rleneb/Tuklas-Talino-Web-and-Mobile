import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { Student, AuditLog } from '../models/index.js';

const router = Router();
router.use(authenticate, requireRole('admin', 'teacher'));

function csvEscape(value) {
  const v = value === null || value === undefined ? '' : String(value);
  return `"${v.replace(/"/g, '""')}"`;
}

router.get('/students.csv', async (req, res, next) => {
  try {
    const students = await Student.findAll({ order: [['gradeLevel','ASC'], ['name','ASC']] });
    const lines = [['Student ID','Name','Grade','Section','XP','Status','Last Active'].map(csvEscape).join(',')];
    for (const s of students) lines.push([s.studentCode, s.name, s.gradeLevel, s.section, s.xp, s.status, s.lastActiveAt || ''].map(csvEscape).join(','));
    res.header('Content-Type', 'text/csv');
    res.attachment('tuklas-talino-students.csv');
    res.send(lines.join('\n'));
  } catch (err) { next(err); }
});

router.get('/activity-logs.csv', async (req, res, next) => {
  try {
    const logs = await AuditLog.findAll({ order: [['createdAt','DESC']], limit: 1000 });
    const lines = [['Date','Actor','Action','Entity','Entity ID','Metadata'].map(csvEscape).join(',')];
    for (const log of logs) lines.push([log.createdAt, log.actorUserId, log.action, log.entityType, log.entityId, JSON.stringify(log.metadata || {})].map(csvEscape).join(','));
    res.header('Content-Type', 'text/csv');
    res.attachment('tuklas-talino-activity-logs.csv');
    res.send(lines.join('\n'));
  } catch (err) { next(err); }
});

router.get('/summary', async (req, res, next) => {
  try {
    const students = await Student.count();
    const active = await Student.count({ where: { status: 'active' } });
    const xp = await Student.sum('xp');
    res.json({ generatedAt: new Date(), students, activeStudents: active, totalXp: xp || 0 });
  } catch (err) { next(err); }
});

export default router;
