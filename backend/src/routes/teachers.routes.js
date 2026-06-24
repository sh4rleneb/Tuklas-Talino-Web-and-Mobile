import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import crypto from 'crypto';
import {
  Role,
  User,
  Teacher,
  TeacherAssignment,
  Student,
  CompletedLesson,
  Lesson,
  Group,
  GroupMember,
  QuizAttempt,
  WritingSubmission,
  WritingTask,
  SpeechAttempt,
  SpeechTask,
  LessonActivity,
} from '../models/index.js';
import { authenticate, requirePasswordChanged, requireRole } from '../middleware/auth.js';
import { teacherSchema, validate } from '../validators/common.js';
import { audit } from '../services/audit.service.js';

import { assertSafeContentPayload } from '../validators/contentSafety.js';
function generateTemporaryPin() {
  return Array.from({ length: 4 }, () => crypto.randomInt(2, 10)).join('');
}

async function getTeacherAssignments(req) {
  if (req.role === 'admin') return null;
  if (!req.teacher?.id) return [];

  return TeacherAssignment.findAll({
    where: {
      teacherId: req.teacher.id,
      status: 'active'
    },
    order: [
      ['gradeLevel', 'ASC'],
      ['section', 'ASC']
    ]
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

function assignedLessonWhere(assignments) {
  const where = { status: 'published' };
  if (assignments === null) return where;
  if (!assignments.length) return { ...where, gradeLevel: [] };

  where.gradeLevel = [...new Set(assignments.map((assignment) => Number(assignment.gradeLevel)))];
  return where;
}

async function getAssignedStudentIds(assignments) {
  const where = assignedStudentWhere(assignments);
  const students = await Student.findAll({
    where,
    attributes: ['id']
  });

  return students.map((student) => Number(student.id));
}

function assignmentPayload(assignments) {
  if (!Array.isArray(assignments)) return [];

  return assignments.map((assignment) => ({
    id: assignment.id,
    teacherId: assignment.teacherId,
    gradeLevel: assignment.gradeLevel,
    section: assignment.section,
    status: assignment.status
  }));
}

const router = Router();
router.use(authenticate);
router.use(requirePasswordChanged);

router.get('/', requireRole('admin'), async (req, res, next) => {
  try {
    const where = {};

    if (['active', 'archived'].includes(req.query.status)) {
      where.status = req.query.status;
    }

    const teachers = await Teacher.findAll({
      where,
      include: [User],
      order: [['name', 'ASC']]
    });

    res.json({ teachers });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireRole('admin'), async (req, res, next) => {
  try {
    const body = validate(teacherSchema, req.body);
    assertSafeContentPayload({ name: body.name, employeeCode: body.employeeCode }, 'teacher account');
    const role = await Role.findOne({ where: { name: 'teacher' } });

    const temporaryPin = generateTemporaryPin();

    const user = await User.create({
  roleId: role.id,
  username: body.username,
  email: body.email,
  displayName: body.name,
  passwordHash: await bcrypt.hash(temporaryPin, 12),
  mustChangePassword: true
});
    const teacher = await Teacher.create({ userId: user.id, employeeCode: body.employeeCode, name: body.name });
    await audit(req.user.id, 'teacher.create', 'teacher', teacher.id);
    res.status(201).json({ teacher, temporaryPin });
  } catch (err) { next(err); }
});

router.get('/dashboard', requireRole('teacher', 'admin'), async (req, res, next) => {
  try {
    const assignments = await getTeacherAssignments(req);
    const studentWhere = assignedStudentWhere(assignments);
    const lessonWhere = assignedLessonWhere(assignments);
    const assignedStudentIds = assignments === null ? null : await getAssignedStudentIds(assignments);

    const completedWhere = {};
    if (assignedStudentIds) completedWhere.studentId = assignedStudentIds;

    const groupWhere = { status: 'active' };
    if (req.role === 'teacher') groupWhere.createdByTeacherId = req.teacher?.id || 0;

    const draftWhere = {
      ...(req.role === 'teacher' ? { createdByUserId: req.user.id } : {}),
      status: 'draft'
    };

    const [students, lessons, draftLessons, completed, groups] = await Promise.all([
      Student.count({ where: { ...studentWhere, status: 'active' } }),
      Lesson.count({ where: lessonWhere }),
      Lesson.count({ where: draftWhere }),
      CompletedLesson.count({ where: completedWhere }),
      Group.count({ where: groupWhere })
    ]);

    const recentStudents = await Student.findAll({
      where: studentWhere,
      order: [['updatedAt','DESC']],
      limit: 8
    });

    res.json({
      stats: {
        students,
        lessons,
        publishedLessons: lessons,
        draftLessons,
        completed,
        groups,
        classProgress: lessons && students
          ? Math.round((completed / (lessons * students)) * 100)
          : 0
      },
      recentStudents,
      assignedClasses: assignmentPayload(assignments)
    });
  } catch (err) { next(err); }
});

router.get('/monitoring/stats', requireRole('teacher', 'admin'), async (req, res, next) => {
  try {
    const assignments = await getTeacherAssignments(req);
    const studentWhere = assignedStudentWhere(assignments);

    const students = await Student.findAll({
      where: studentWhere,
      order: [['gradeLevel','ASC'], ['name','ASC']]
    });

    const rows = [];

    for (const s of students) {
      const completed = await CompletedLesson.count({ where: { studentId: s.id } });
      const totalLessons = await Lesson.count({
        where: {
          gradeLevel: s.gradeLevel,
          status: 'published'
        }
      });

      rows.push({
        id: s.id,
        studentCode: s.studentCode,
        name: s.name,
        avatar: s.avatar,
        gradeLevel: s.gradeLevel,
        section: s.section,
        xp: s.xp,
        completed,
        totalLessons,
        percent: totalLessons ? Math.round(completed / totalLessons * 100) : 0,
        status: s.status
      });
    }

    res.json({
      rows,
      assignedClasses: assignmentPayload(assignments)
    });
  } catch (err) { next(err); }
});


function quizStatus(percent = 0) {
  const value = Number(percent || 0);

  if (value >= 90) return 'Advanced';
  if (value >= 75) return 'Proficient';
  if (value >= 50) return 'Developing';
  return 'Needs Support';
}

router.get('/quiz-performance', requireRole('teacher', 'admin'), async (req, res, next) => {
  try {
    const assignments = await getTeacherAssignments(req);
    const assignedStudentIds = assignments === null ? null : await getAssignedStudentIds(assignments);
    const attemptWhere = {};

    if (assignedStudentIds) {
      attemptWhere.studentId = assignedStudentIds;
    }

    const attempts = await QuizAttempt.findAll({
      where: attemptWhere,
      include: [Student, Lesson],
      order: [
        ['studentId', 'ASC'],
        ['quizId', 'ASC'],
        ['attemptNo', 'ASC'],
        ['submittedAt', 'ASC']
      ]
    });

    const grouped = new Map();

    for (const attempt of attempts) {
      const row = attempt.toJSON();
      const student = row.Student || {};
      const lesson = row.Lesson || {};
      const key = `${row.studentId}-${row.quizId}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          key,
          studentId: row.studentId,
          studentName: student.name || 'Student',
          gradeLevel: student.gradeLevel || lesson.gradeLevel || null,
          section: student.section || '',
          lessonId: row.lessonId,
          quizId: row.quizId,
          quizTitle: row.quizTitle || lesson.title || 'Quiz',
          attempts: [],
          attempt1: null,
          attempt2: null,
          bestPercent: 0,
          latestPercent: 0,
          status: 'Needs Support'
        });
      }

      const item = grouped.get(key);
      const attemptData = {
        id: row.id,
        attemptNo: row.attemptNo,
        score: row.score,
        total: row.total,
        percent: row.percent,
        xpAwarded: row.xpAwarded,
        submittedAt: row.submittedAt
      };

      item.attempts.push(attemptData);

      if (Number(row.attemptNo) === 1) item.attempt1 = attemptData;
      if (Number(row.attemptNo) === 2) item.attempt2 = attemptData;

      item.bestPercent = Math.max(item.bestPercent, Number(row.percent || 0));
      item.latestPercent = Number(row.percent || item.latestPercent || 0);
      item.status = quizStatus(item.bestPercent);
    }

    const rows = Array.from(grouped.values()).sort((a, b) => {
      if (a.gradeLevel !== b.gradeLevel) return Number(a.gradeLevel || 0) - Number(b.gradeLevel || 0);
      return String(a.studentName).localeCompare(String(b.studentName));
    });

    const needsSupport = rows.filter(row => row.bestPercent < 50).length;
    const developing = rows.filter(row => row.bestPercent >= 50 && row.bestPercent < 75).length;
    const proficient = rows.filter(row => row.bestPercent >= 75 && row.bestPercent < 90).length;
    const advanced = rows.filter(row => row.bestPercent >= 90).length;
    const averageBest = rows.length
      ? Math.round(rows.reduce((sum, row) => sum + Number(row.bestPercent || 0), 0) / rows.length)
      : 0;

    res.json({
      summary: {
        total: rows.length,
        averageBest,
        needsSupport,
        developing,
        proficient,
        advanced
      },
      rows,
      assignedClasses: assignmentPayload(assignments)
    });
  } catch (err) {
    next(err);
  }
});


router.get('/students/:studentId', requireRole('teacher', 'admin'), async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.studentId, { include: [GroupMember] });
    if (!student) return res.status(404).json({ message: 'Student not found.' });
    const completed = await CompletedLesson.findAll({ where: { studentId: student.id }, include: [Lesson] });
    res.json({ student, completed });
  } catch (err) { next(err); }
});

router.patch('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const teacher = await Teacher.findByPk(req.params.id, { include: [User] });
    if (!teacher) return res.status(404).json({ message: 'Teacher not found.' });

    assertSafeContentPayload({ name: req.body.name, employeeCode: req.body.employeeCode }, 'teacher profile');

    for (const key of ['name','employeeCode','status']) if (req.body[key] !== undefined) teacher[key] = req.body[key];
    await teacher.save();
    if (req.body.name && teacher.User) { teacher.User.displayName = req.body.name; await teacher.User.save(); }
    await audit(req.user.id, 'teacher.update', 'teacher', teacher.id, req.body);
    res.json({ teacher });
  } catch (err) { next(err); }
});

router.post('/:id/reset-password', requireRole('admin'), async (req, res, next) => {
  try {
    const teacher = await Teacher.findByPk(req.params.id, {
      include: [User]
    });

    if (!teacher || !teacher.User) {
      return res.status(404).json({
        message: 'Teacher account not found.'
      });
    }

    if (teacher.status !== 'active' || teacher.User.status !== 'active') {
      return res.status(422).json({
        message: 'Reactivate the teacher account before resetting the password.'
      });
    }

    const reason =
      String(req.body.reason || '').trim() ||
      'Admin reset teacher password';

    const temporaryPin = req.body.temporaryPin?.trim() || generateTemporaryPin();

    if (!/^[2-9]{4}$/.test(temporaryPin)) {
      return res.status(422).json({
        message: 'Temporary PIN must be exactly 4 digits using numbers 2-9.'
      });
    }

    teacher.User.passwordHash = await bcrypt.hash(temporaryPin, 12);
    teacher.User.mustChangePassword = true;

    await teacher.User.save();

    await audit(req.user.id, 'teacher.reset_password', 'teacher', teacher.id, {
      forcedPasswordChange: true,
      reason
    });

    res.json({
      message: 'Teacher password reset successfully.',
      temporaryPin
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/archive', requireRole('admin'), async (req, res, next) => {
  try {
    const teacher = await Teacher.findByPk(req.params.id, { include: [User] });
    if (!teacher) return res.status(404).json({ message: 'Teacher not found.' });

    const reason = String(req.body.reason || '').trim();

    if (!reason) {
      return res.status(422).json({
        message: 'Archive reason is required.'
      });
    }

    teacher.status = 'archived';
    await teacher.save();
    if (teacher.User) { teacher.User.status = 'archived'; await teacher.User.save(); }
    await audit(
      req.user.id,
      'teacher.archive',
      'teacher',
      teacher.id,
      { reason }
    );
    res.json({ teacher });
  } catch (err) { next(err); }
});

router.post('/:id/reactivate', requireRole('admin'), async (req, res, next) => {
  try {
    const teacher = await Teacher.findByPk(req.params.id, { include: [User] });
    if (!teacher) return res.status(404).json({ message: 'Teacher not found.' });

    const reason = String(req.body.reason || '').trim();

    if (!reason) {
      return res.status(422).json({
        message: 'Reactivation reason is required.'
      });
    }

    teacher.status = 'active';
    await teacher.save();
    if (teacher.User) { teacher.User.status = 'active'; await teacher.User.save(); }
    await audit(
      req.user.id,
      'teacher.reactivate',
      'teacher',
      teacher.id,
      { reason }
    );
    res.json({ teacher });
  } catch (err) { next(err); }
});


router.get('/reviews/writing-speech', requireRole('teacher', 'admin'), async (req, res, next) => {
  try {
    const assignments = await getTeacherAssignments(req);
    const assignedStudentIds =
      assignments === null
        ? null
        : await getAssignedStudentIds(assignments);

    if (Array.isArray(assignedStudentIds) && assignedStudentIds.length === 0) {
      return res.json({
        summary: {
          total: 0,
          writing: 0,
          speech: 0,
        },
        writing: [],
        speech: [],
      });
    }

    const scopeWhere = Array.isArray(assignedStudentIds)
      ? { studentId: assignedStudentIds }
      : {};

    const [writingRows, speechRows] = await Promise.all([
      WritingSubmission.findAll({
        where: scopeWhere,
        order: [['submittedAt', 'DESC'], ['id', 'DESC']],
        limit: 100,
      }),
      SpeechAttempt.findAll({
        where: scopeWhere,
        order: [['createdAt', 'DESC'], ['id', 'DESC']],
        limit: 100,
      }),
    ]);

    const normalizeRow = (row) => row?.toJSON ? row.toJSON() : row;

    const writing = writingRows.map(normalizeRow);
    const speech = speechRows.map(normalizeRow);

    const uniqueIds = (items) => [...new Set(
      items
        .map((item) => Number(item))
        .filter((item) => Number.isFinite(item) && item > 0)
    )];

    const studentIds = uniqueIds([
      ...writing.map((row) => row.studentId),
      ...speech.map((row) => row.studentId),
    ]);
    const lessonIds = uniqueIds([
      ...writing.map((row) => row.lessonId),
      ...speech.map((row) => row.lessonId),
    ]);
    const writingTaskIds = uniqueIds(writing.map((row) => row.taskId));
    const speechTaskIds = uniqueIds(speech.map((row) => row.taskId));

    const [students, lessons, writingTasks, speechTasks] = await Promise.all([
      studentIds.length ? Student.findAll({ where: { id: studentIds } }) : [],
      lessonIds.length ? Lesson.findAll({ where: { id: lessonIds } }) : [],
      writingTaskIds.length ? WritingTask.findAll({ where: { id: writingTaskIds } }) : [],
      speechTaskIds.length ? SpeechTask.findAll({ where: { id: speechTaskIds } }) : [],
    ]);

    const byId = (rows) => new Map(
      rows.map((row) => {
        const item = normalizeRow(row);
        return [Number(item.id), item];
      })
    );

    const studentById = byId(students);
    const lessonById = byId(lessons);
    const writingTaskById = byId(writingTasks);
    const speechTaskById = byId(speechTasks);

    const formatStudent = (student) => student ? {
      id: student.id,
      name: student.name,
      avatar: student.avatar,
      gradeLevel: student.gradeLevel,
      section: student.section,
    } : null;

    const formatLesson = (lesson) => lesson ? {
      id: lesson.id,
      title: lesson.title,
      subject: lesson.subject,
      gradeLevel: lesson.gradeLevel,
    } : null;

    const formatDate = (value) => value ? new Date(value).toISOString() : null;

    return res.json({
      summary: {
        total: writing.length + speech.length,
        writing: writing.length,
        speech: speech.length,
      },
      writing: writing.map((row) => {
        const task = writingTaskById.get(Number(row.taskId));

        return {
          id: row.id,
          type: 'writing',
          content: row.content || '',
          feedback: row.feedback || '',
          submittedAt: formatDate(row.submittedAt || row.createdAt),
          student: formatStudent(studentById.get(Number(row.studentId))),
          lesson: formatLesson(lessonById.get(Number(row.lessonId))),
          task: task ? {
            id: task.id,
            prompt: task.prompt || '',
            rubricJson: task.rubricJson || null,
          } : null,
        };
      }),
      speech: speech.map((row) => {
        const task = speechTaskById.get(Number(row.taskId));

        return {
          id: row.id,
          type: 'speech',
          transcript: row.transcript || '',
          score: row.score ?? null,
          submittedAt: formatDate(row.createdAt || row.submittedAt),
          student: formatStudent(studentById.get(Number(row.studentId))),
          lesson: formatLesson(lessonById.get(Number(row.lessonId))),
          task: task ? {
            id: task.id,
            targetText: task.targetText || '',
            promptJson: task.promptJson || null,
          } : null,
        };
      }),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
