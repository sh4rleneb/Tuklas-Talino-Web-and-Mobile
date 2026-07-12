import {
  findDuplicateAccount,
  duplicateAccountPayload,
} from '../services/accountDuplicate.service.js';
import { sequelize } from '../config/database.js';
import {
  Router } from 'express'; import bcrypt from 'bcryptjs'; import { Op,
  DataTypes } from 'sequelize'; import crypto from 'crypto'; import {   Role,
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
  LessonActivity
} from '../models/index.js';
import { authenticate, requirePasswordChanged, requireRole } from '../middleware/auth.js';
import { teacherSchema, validate } from '../validators/common.js';
import {
  adminAccountCreationLimiter,
  requireRecentAdminPassword,
  requestAuditContext,
} from '../middleware/adminReauth.js';
import { audit } from '../services/audit.service.js';
import { generateTeacherCode } from '../services/accountCode.service.js';

import { assertSafeContentPayload, assertSafeText } from '../validators/contentSafety.js';
import { awardXp, awardThresholdBadges } from '../services/progress.service.js';
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

const SAFE_USER_ATTRIBUTES = Object.freeze([
  'id',
  'roleId',
  'username',
  'email',
  'displayName',
  'status',
  'mustChangePassword',
  'lastLoginAt',
  'createdAt',
  'updatedAt',
]);

function safeUserInclude() {
  return {
    model: User,
    attributes: SAFE_USER_ATTRIBUTES,
  };
}

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
      include: [safeUserInclude()],
      order: [['name', 'ASC']]
    });

    res.json({ teachers });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  requireRole('admin'),
  adminAccountCreationLimiter,
  requireRecentAdminPassword,
  async (req, res, next) => {
  try {
    const body = validate(teacherSchema, req.body);
    assertSafeContentPayload(
        {
          name: body.name,
          email: body.email || '',
        },
        'teacher account'
      );

    const duplicateAccount =
      await findDuplicateAccount({
        accountType: 'teacher',
        name: body.name,
        email: body.email,
        username: body.username,
        code: body.employeeCode,
      });

    if (duplicateAccount) {
      return res.status(409).json(
        duplicateAccountPayload(
          duplicateAccount
        )
      );
    }

    const role = await Role.findOne({
      where: { name: 'teacher' },
    });

    if (!role) {
      return res.status(500).json({
        message: 'Teacher role not found.',
      });
    }

    const temporaryPin = generateTemporaryPin();
    const teacherCode = await generateTeacherCode();
    const passwordHash = await bcrypt.hash(
      temporaryPin,
      12
    );

    const teacher = await sequelize.transaction(
      async (transaction) => {
        const user = await User.create(
          {
            roleId: role.id,
            username: teacherCode,
            email: body.email,
            displayName: body.name,
            passwordHash,
            mustChangePassword: true,
          },
          { transaction }
        );

        return Teacher.create(
          {
            userId: user.id,
            employeeCode: teacherCode,
            name: body.name,
          },
          { transaction }
        );
      }
    );
    await audit(
      req.user.id,
      'teacher.create',
      'teacher',
      teacher.id,
      {
        teacherCode,
        name: body.name,
        email: body.email || null,
        ...requestAuditContext(req),
      }
    );
    res.status(201).json({
      teacher,
      username: teacherCode,
      temporaryPin
    });
  } catch (err) {
    if (err?.name === "SequelizeUniqueConstraintError") {
      const field = err.errors?.[0]?.path;

      const messages = {
        username: "Username already exists.",
        employeeCode: "Employee code already exists.",
        email: "Email already exists."
      };

      return res.status(409).json({
        message: messages[field] || "A record with the same information already exists."
      });
    }

    next(err);
  }
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
    const teacher = await Teacher.findByPk(req.params.id, { include: [safeUserInclude()] });
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
      include: [safeUserInclude()]
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
    const teacher = await Teacher.findByPk(req.params.id, { include: [safeUserInclude()] });
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
    const teacher = await Teacher.findByPk(req.params.id, { include: [safeUserInclude()] });
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


function normalizeWritingReviewStatus(value) {
  return String(value || 'pending').trim().toLowerCase();
}

function writingScoreToXp(score) {
  const value = Number(score);
  if (!Number.isInteger(value) || value < 1 || value > 10) return 0;
  return value;
}

function isGradeThreeToSix(value) {
  const grade = Number(value || 0);
  return grade >= 3 && grade <= 6;
}

function canTeacherReviewWriting(student, lesson, row = {}) {
  const status = normalizeWritingReviewStatus(row.reviewStatus);
  return (
    isGradeThreeToSix(student?.gradeLevel) &&
    isGradeThreeToSix(lesson?.gradeLevel || student?.gradeLevel) &&
    status === 'pending'
  );
}


let speechReviewColumnsReady = false;

async function ensureSpeechReviewColumns() {
  if (speechReviewColumnsReady) return;

  const queryInterface = sequelize.getQueryInterface();
  const table = await queryInterface.describeTable('speech_attempts');

  const columns = [
    ['feedback', { type: DataTypes.TEXT, allowNull: true }],
    ['review_status', { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'pending' }],
    ['reviewed_at', { type: DataTypes.DATE, allowNull: true }],
    ['reviewed_by_teacher_id', { type: DataTypes.INTEGER, allowNull: true }],
  ];

  for (const [name, definition] of columns) {
    if (!table[name]) {
      await queryInterface.addColumn('speech_attempts', name, definition);
    }
  }

  speechReviewColumnsReady = true;
}

function normalizeSpeechReviewStatus(row = {}) {
  return String(row.reviewStatus || (row.feedback ? 'reviewed' : 'pending')).trim().toLowerCase() || 'pending';
}

async function speechReviewAssignedStudentIds(req) {
  if (req.role === 'admin') return null;
  if (req.role !== 'teacher') return [];
  if (!req.teacher?.id) return [];

  const assignments = await TeacherAssignment.findAll({
    where: { teacherId: req.teacher.id },
  });

  if (!assignments.length) return [];

  const classFilters = assignments
    .map((assignment) => {
      const row = assignment.toJSON ? assignment.toJSON() : assignment;
      const gradeLevel = row.gradeLevel || row.grade || row.classGradeLevel;
      const section = row.section || row.classSection;

      if (!gradeLevel || !section) return null;

      return { gradeLevel, section };
    })
    .filter(Boolean);

  if (!classFilters.length) return [];

  const students = await Student.findAll({
    where: { [Op.or]: classFilters },
    attributes: ['id'],
  });

  return students.map((student) => Number(student.id));
}

router.get('/reviews/writing-speech', requireRole('teacher', 'admin'), async (req, res, next) => {
  try {
    await ensureSpeechReviewColumns();
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

    const writingItems = writing.map((row) => {
      const student = studentById.get(Number(row.studentId));
      const lesson = lessonById.get(Number(row.lessonId));
      const task = writingTaskById.get(Number(row.taskId));
      const reviewStatus = normalizeWritingReviewStatus(row.reviewStatus);
      const reviewEligible = canTeacherReviewWriting(student, lesson, row);
      const score = Number.isInteger(Number(row.score)) ? Number(row.score) : null;

      return {
        id: row.id,
        type: 'writing',
        content: row.content || '',
        feedback: row.feedback || '',
        reviewStatus,
        score,
        reviewedAt: formatDate(row.reviewedAt),
        reviewedByTeacherId: row.reviewedByTeacherId || null,
        reviewEligible,
        xpPreview: reviewStatus === 'graded' && score !== null ? writingScoreToXp(score) : null,
        submittedAt: formatDate(row.submittedAt || row.createdAt),
        student: formatStudent(student),
        lesson: formatLesson(lesson),
        task: task ? {
          id: task.id,
          prompt: task.prompt || '',
          rubricJson: task.rubricJson || null,
        } : null,
      };
    });

    const speechItems = speech.map((row) => {
      const task = speechTaskById.get(Number(row.taskId));

      return {
        id: row.id,
        type: 'speech',
        transcript: row.transcript || '',
        audioUrl: row.audioUrl || null,
        score: row.score ?? null,
        feedback: row.feedback || '',
        reviewStatus: normalizeSpeechReviewStatus(row),
        reviewedAt: formatDate(row.reviewedAt),
        reviewedByTeacherId: row.reviewedByTeacherId || null,
        reviewEligible: true,
        submittedAt: formatDate(row.createdAt || row.submittedAt),
        student: formatStudent(studentById.get(Number(row.studentId))),
        lesson: formatLesson(lessonById.get(Number(row.lessonId))),
        task: task ? {
          id: task.id,
          targetText: task.targetText || '',
          promptJson: task.promptJson || null,
        } : null,
      };
    });

    return res.json({
      summary: {
        total: writingItems.length + speechItems.length,
        writing: writingItems.length,
        speech: speechItems.length,
        pendingWriting: writingItems.filter((item) => item.reviewStatus === 'pending' && item.reviewEligible).length,
        gradedWriting: writingItems.filter((item) => item.reviewStatus === 'graded').length,
        reviewEligibleWriting: writingItems.filter((item) => item.reviewEligible).length,
      },
      writing: writingItems,
      speech: speechItems,
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/reviews/writing/:submissionId', requireRole('teacher', 'admin'), async (req, res, next) => {
  try {
    const submissionId = Number(req.params.submissionId);

    if (!Number.isInteger(submissionId) || submissionId <= 0) {
      return res.status(400).json({ message: 'Invalid writing submission.' });
    }

    const score = Number(req.body?.score);
    if (!Number.isInteger(score) || score < 1 || score > 10) {
      return res.status(422).json({ message: 'Score must be a whole number from 1 to 10.' });
    }

    const feedback = String(req.body?.feedback || req.body?.teacherFeedback || '').trim();
    assertSafeText(feedback, 'teacher feedback');

    const submission = await WritingSubmission.findByPk(submissionId);

    if (!submission) {
      return res.status(404).json({ message: 'Writing submission not found.' });
    }

    const [student, lesson] = await Promise.all([
      Student.findByPk(submission.studentId),
      Lesson.findByPk(submission.lessonId),
    ]);

    if (!student || !lesson) {
      return res.status(404).json({ message: 'Writing submission is missing student or lesson details.' });
    }

    const assignments = await getTeacherAssignments(req);
    const assignedStudentIds =
      assignments === null
        ? null
        : await getAssignedStudentIds(assignments);

    if (
      Array.isArray(assignedStudentIds) &&
      !assignedStudentIds.includes(Number(submission.studentId))
    ) {
      return res.status(403).json({ message: 'You can only grade writing submissions from your assigned students.' });
    }

    if (!isGradeThreeToSix(student.gradeLevel) || !isGradeThreeToSix(lesson.gradeLevel || student.gradeLevel)) {
      return res.status(422).json({ message: 'Only Grade 3 to Grade 6 writing submissions can be graded by teachers.' });
    }

    const currentStatus = normalizeWritingReviewStatus(submission.reviewStatus);

    if (currentStatus !== 'pending') {
      return res.status(409).json({
        message: 'This writing submission has already been graded.',
        submission: {
          id: submission.id,
          reviewStatus: currentStatus,
          score: submission.score ?? null,
          feedback: submission.feedback || '',
          reviewedAt: submission.reviewedAt || null,
          reviewedByTeacherId: submission.reviewedByTeacherId || null,
        },
        xpAwarded: 0,
      });
    }

    const reviewedAt = new Date();

    const [updatedCount] = await WritingSubmission.update(
      {
        reviewStatus: 'graded',
        score,
        feedback: feedback || submission.feedback || null,
        reviewedAt,
        reviewedByTeacherId: req.teacher?.id || null,
      },
      {
        where: {
          id: submission.id,
          reviewStatus: 'pending',
        },
      }
    );

    if (!updatedCount) {
      const latest = await WritingSubmission.findByPk(submission.id);
      return res.status(409).json({
        message: 'This writing submission was already graded. Please refresh the page.',
        submission: latest ? {
          id: latest.id,
          reviewStatus: normalizeWritingReviewStatus(latest.reviewStatus),
          score: latest.score ?? null,
          feedback: latest.feedback || '',
          reviewedAt: latest.reviewedAt || null,
          reviewedByTeacherId: latest.reviewedByTeacherId || null,
        } : null,
        xpAwarded: 0,
      });
    }

    const updatedSubmission = await WritingSubmission.findByPk(submission.id);
    const xpToAward = writingScoreToXp(score);

    const xpResult = await awardXp(
      submission.studentId,
      xpToAward,
      'writing_review',
      submission.id,
      `Teacher writing grade ${score}/10`
    );

    const xpAwarded = Number(xpResult?.xpAwarded ?? (xpResult?.xpAlreadyAwarded ? 0 : xpToAward));

    if (xpAwarded > 0) {
      await awardThresholdBadges(xpResult || student);
    }

    return res.json({
      submission: {
        id: updatedSubmission.id,
        type: 'writing',
        content: updatedSubmission.content || '',
        feedback: updatedSubmission.feedback || '',
        reviewStatus: normalizeWritingReviewStatus(updatedSubmission.reviewStatus),
        score: updatedSubmission.score ?? null,
        reviewedAt: updatedSubmission.reviewedAt || null,
        reviewedByTeacherId: updatedSubmission.reviewedByTeacherId || null,
        student: {
          id: student.id,
          name: student.name,
          avatar: student.avatar,
          gradeLevel: student.gradeLevel,
          section: student.section,
        },
        lesson: {
          id: lesson.id,
          title: lesson.title,
          subject: lesson.subject,
          gradeLevel: lesson.gradeLevel,
        },
      },
      xpAwarded,
      xpAlreadyAwarded: Boolean(xpResult?.xpAlreadyAwarded),
      message: `Writing grade saved. Student earned +${xpAwarded} XP.`,
    });
  } catch (err) {
    next(err);
  }
});



router.patch('/reviews/speech/:attemptId', requireRole('teacher', 'admin'), async (req, res, next) => {
  try {
    await ensureSpeechReviewColumns();

    const attemptId = Number(req.params.attemptId);

    if (!Number.isInteger(attemptId) || attemptId <= 0) {
      return res.status(400).json({ message: 'Invalid speech attempt.' });
    }

    const rawScore = req.body?.score;
    const hasScore = rawScore !== undefined && rawScore !== null && String(rawScore).trim() !== '';
    const score = hasScore ? Number(rawScore) : null;

    if (hasScore && (!Number.isInteger(score) || score < 1 || score > 10)) {
      return res.status(422).json({ message: 'Score must be a whole number from 1 to 10.' });
    }

    const feedback = String(req.body?.feedback || req.body?.teacherFeedback || '').trim();
    assertSafeText(feedback, 'teacher feedback');

    if (!feedback && !hasScore) {
      return res.status(422).json({ message: 'Add feedback or a score before saving the speech review.' });
    }

    const attempt = await SpeechAttempt.findByPk(attemptId);

    if (!attempt) {
      return res.status(404).json({ message: 'Speech attempt not found.' });
    }

    const [student, lesson] = await Promise.all([
      Student.findByPk(attempt.studentId),
      Lesson.findByPk(attempt.lessonId),
    ]);

    if (!student || !lesson) {
      return res.status(404).json({ message: 'Speech attempt is missing student or lesson details.' });
    }

    const assignedStudentIds = await speechReviewAssignedStudentIds(req);

    if (
      Array.isArray(assignedStudentIds) &&
      !assignedStudentIds.includes(Number(attempt.studentId))
    ) {
      return res.status(403).json({ message: 'You can only review speech attempts from your assigned students.' });
    }

    const reviewedAt = new Date();

    await attempt.update({
      score: hasScore ? score : attempt.score,
      feedback: feedback || attempt.feedback || null,
      reviewStatus: 'reviewed',
      reviewedAt,
      reviewedByTeacherId: req.teacher?.id || null,
    });

    const updatedAttempt = await SpeechAttempt.findByPk(attempt.id);

    await audit(req.user.id, 'speech_attempt.review', 'speech_attempt', attempt.id, {
      studentId: attempt.studentId,
      lessonId: attempt.lessonId,
      score: updatedAttempt.score ?? null,
      reviewStatus: normalizeSpeechReviewStatus(updatedAttempt),
    });

    return res.json({
      attempt: {
        id: updatedAttempt.id,
        type: 'speech',
        score: updatedAttempt.score ?? null,
        feedback: updatedAttempt.feedback || '',
        reviewStatus: normalizeSpeechReviewStatus(updatedAttempt),
        reviewedAt: updatedAttempt.reviewedAt || null,
        reviewedByTeacherId: updatedAttempt.reviewedByTeacherId || null,
      },
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
