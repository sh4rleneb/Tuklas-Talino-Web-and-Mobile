import { Router } from 'express';
import { Op } from 'sequelize';
import { authenticate, requireRole } from '../middleware/auth.js';
import { Student, TeacherAssignment, AuditLog } from '../models/index.js';

const router = Router();
router.use(authenticate, requireRole('admin', 'teacher'));


async function getTeacherAssignments(req) {
  if (req.role === 'admin') return null;
  if (req.role !== 'teacher') return null;
  if (!req.teacher?.id) return [];

  return TeacherAssignment.findAll({
    where: {
      teacherId: req.teacher.id,
      status: 'active'
    }
  });
}

function assignedStudentWhere(assignments) {
  if (assignments === null) return {};
  if (!assignments.length) return { id: [] };

  return {
    [Op.or]: assignments.map((assignment) => ({
      gradeLevel: assignment.gradeLevel,
      section: assignment.section
    }))
  };
}

function csvEscape(value) {
  const v = value === null || value === undefined ? '' : String(value);
  return `"${v.replace(/"/g, '""')}"`;
}

router.get('/students.csv', async (req, res, next) => {
  try {
    const assignments = await getTeacherAssignments(req);
    const where = assignedStudentWhere(assignments);

    const students = await Student.findAll({
      where,
      order: [['gradeLevel','ASC'], ['name','ASC']]
    });

    const lines = [['Student ID','Name','Grade','Section','XP','Status','Last Active'].map(csvEscape).join(',')];
    for (const s of students) lines.push([s.studentCode, s.name, s.gradeLevel, s.section, s.xp, s.status, s.lastActiveAt || ''].map(csvEscape).join(','));
    res.header('Content-Type', 'text/csv');
    res.attachment('tuklas-talino-students.csv');
    res.send(lines.join('\n'));
  } catch (err) { next(err); }
});

router.get('/activity-logs.csv', async (req, res, next) => {
  try {
    const where = req.role === 'teacher' ? { actorUserId: req.user.id } : {};

    const logs = await AuditLog.findAll({
      where,
      order: [['createdAt','DESC']],
      limit: 1000
    });

    const lines = [['Date','Actor','Action','Entity','Entity ID','Metadata'].map(csvEscape).join(',')];
    for (const log of logs) lines.push([log.createdAt, log.actorUserId, log.action, log.entityType, log.entityId, JSON.stringify(log.metadata || {})].map(csvEscape).join(','));
    res.header('Content-Type', 'text/csv');
    res.attachment('tuklas-talino-activity-logs.csv');
    res.send(lines.join('\n'));
  } catch (err) { next(err); }
});

router.get('/summary', async (req, res, next) => {
  try {
    const assignments = await getTeacherAssignments(req);
    const where = assignedStudentWhere(assignments);

    const students = await Student.count({ where });
    const active = await Student.count({ where: { ...where, status: 'active' } });
    const xp = await Student.sum('xp', { where });

    res.json({ generatedAt: new Date(), students, activeStudents: active, totalXp: xp || 0 });
  } catch (err) { next(err); }
});

router.get('/summary.txt', async (req, res, next) => {
  try {
    const assignments = await getTeacherAssignments(req);
    const where = assignedStudentWhere(assignments);

    const students = await Student.count({ where });
    const active = await Student.count({ where: { ...where, status: 'active' } });
    const xp = await Student.sum('xp', { where });

    const lines = [
      'Tuklas Talino Summary Report',
      `Generated At: ${new Date().toISOString()}`,
      `Total Students: ${students}`,
      `Active Students: ${active}`,
      `Total XP: ${xp || 0}`
    ];

    res.header('Content-Type', 'text/plain');
    res.attachment('tuklas-talino-summary-report.txt');
    res.send(lines.join('\n'));
  } catch (err) { next(err); }
});

export default router;
