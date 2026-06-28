import {
  listMissionsForStudent } from './missions.routes.js';
import {
  Router } from 'express'; import bcrypt from 'bcryptjs'; import crypto from 'crypto'; import { Op } from 'sequelize'; import { authenticate,
  requireRole,
  requirePasswordChanged } from '../middleware/auth.js'; import { Role,
  User,
  Student,
  TeacherAssignment,
  Lesson,
  LessonActivity,
  MCQQuestion,
  MCQOption,
  WritingTask,
  SpeechTask,
  CompletedLesson,
  LessonProgress,
  Badge,
  StudentBadge,
  XpLog,
  QuizHistory,
  QuizAttempt,
  WritingSubmission,
  SpeechAttempt,
  GroupMember,
  Group,
  GroupTask,
  GroupTaskCompletion,
  MissionCompletion,
  Notification
} from '../models/index.js'; import { calculateLevel,
  nextLevelXp,
  levelTitleForXp
} from '../services/progress.service.js';
import { audit } from '../services/audit.service.js';
import { studentSchema, validate } from '../validators/common.js';

import { assertSafeContentPayload } from '../validators/contentSafety.js';
function generateTemporaryPin() {
  return Array.from({ length: 4 }, () => crypto.randomInt(2, 10)).join('');
}

const router = Router();

const CORE_BADGE_DEFINITIONS = [
  {
    code: 'first_lesson',
    name: 'Unang Hakbang',
    description: 'Natapos ang unang lesson.',
    icon: '🌱',
    xpThreshold: null,
    target: 1,
    metric: 'completedLessons'
  },
  {
    code: 'reader_3',
    name: 'Batang Mambabasa',
    description: 'Makatapos ng 3 lessons.',
    icon: '📖',
    xpThreshold: null,
    target: 3,
    metric: 'completedLessons'
  },
  {
    code: 'quiz_perfect',
    name: 'Quiz Bayani',
    description: 'Makakuha ng perfect score sa quiz.',
    icon: '🧠',
    xpThreshold: null,
    target: 1,
    metric: 'perfectQuizzes'
  },
  {
    code: 'writing_3',
    name: 'Sagot Star',
    description: 'Complete 3 Punan ang Patlang or writing activities.',
    icon: '✍️',
    xpThreshold: null,
    target: 3,
    metric: 'writingSubmissions'
  },
  {
    code: 'speech_3',
    name: 'Boses Bituin',
    description: 'Magsumite ng 3 magkakaibang speech activities.',
    icon: '🎤',
    xpThreshold: null,
    target: 3,
    metric: 'speechAttempts'
  },
  {
    code: 'group_1',
    name: 'Kaagapay sa Gawain',
    description: 'Makatapos ng 1 approved group task.',
    icon: '🤝',
    xpThreshold: null,
    target: 1,
    metric: 'approvedGroupTasks'
  },
  {
    code: 'xp_100',
    name: 'Sipag Star',
    description: 'Makaipon ng 100 XP.',
    icon: '⭐',
    xpThreshold: 100,
    target: 100,
    metric: 'xp'
  },
  {
    code: 'level_10',
    name: 'Tuklas Kampeon',
    description: 'Maabot ang Level 10.',
    icon: '🏆',
    xpThreshold: null,
    target: 10,
    metric: 'level'
  }
];

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

async function countUniqueSpeechTasks(studentId) {
  const rows = await SpeechAttempt.findAll({
    where: { studentId },
    attributes: ['taskId'],
    group: ['taskId'],
    raw: true,
  });

  return rows.length;
}

function badgeProgressValue(stats, metric) {
  if (metric === 'completedLessons') return stats.completedLessons;
  if (metric === 'perfectQuizzes') return stats.perfectQuizzes;
  if (metric === 'writingSubmissions') return stats.writingSubmissions;
  if (metric === 'speechAttempts') return stats.speechAttempts;
  if (metric === 'approvedGroupTasks') return stats.approvedGroupTasks;
  if (metric === 'xp') return stats.xp;
  if (metric === 'level') return stats.level;

  return 0;
}

async function buildBadgeProgress(studentId, xp = 0) {
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

  const stats = {
    completedLessons,
    perfectQuizzes,
    writingSubmissions,
    speechAttempts,
    approvedGroupTasks,
    xp: Number(xp || 0),
    level: calculateLevel(xp)
  };

  return CORE_BADGE_DEFINITIONS.map(definition => {
    const current = badgeProgressValue(stats, definition.metric);
    const target = definition.target || 1;
    const percent = Math.min(100, Math.round((Math.min(current, target) / target) * 100));

    
return {
      code: definition.code,
      name: definition.name,
      icon: definition.icon,
      description: definition.description,
      metric: definition.metric,
      current,
      target,
      percent,
      remaining: Math.max(0, target - current),
      completed: current >= target
    };
  });
}

router.use(authenticate);
router.use(requirePasswordChanged);

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

async function getStudentForRequest(req, idParam) {
  if (req.role === 'student') return req.student;
  if (req.role === 'admin') return Student.findByPk(idParam);

  const assignments = await getTeacherAssignments(req);
  const where = {
    ...assignedStudentWhere(assignments),
    id: idParam
  };

  return Student.findOne({ where });
}

async function dashboardPayload(student) {
  const lessons = await Lesson.findAll({
    where: { gradeLevel: student.gradeLevel, status: 'published' },
    include: [
      {
        model: LessonActivity,
        as: 'activities',
        include: [
          {
            model: MCQQuestion,
            as: 'questions',
            include: [{ model: MCQOption, as: 'options' }]
          },
          { model: WritingTask, as: 'writingTask' },
          { model: SpeechTask, as: 'speechTask' }
        ]
      }
    ],
    order: [
      ['subject', 'ASC'],
      ['id', 'ASC'],
      [{ model: LessonActivity, as: 'activities' }, 'sortOrder', 'ASC'],
      [{ model: LessonActivity, as: 'activities' }, { model: MCQQuestion, as: 'questions' }, 'sortOrder', 'ASC'],
      [{ model: LessonActivity, as: 'activities' }, { model: MCQQuestion, as: 'questions' }, { model: MCQOption, as: 'options' }, 'sortOrder', 'ASC']
    ]
  });
  const [
    completed,
    lessonProgressRows,
    allBadges,
    badges,
    badgeProgress,
    xpLogs,
    quizAttemptRows,
    writingSubmissionRows,
    speechAttemptRows,
    groupTaskCompletions,
    memberships,
    missionResult
  ] = await Promise.all([
    CompletedLesson.findAll({ where: { studentId: student.id } }),
    LessonProgress.findAll({ where: { studentId: student.id } }),
    ensureCoreBadges(),
    StudentBadge.findAll({
      where: { studentId: student.id },
      include: [Badge]
    }),
    buildBadgeProgress(student.id, student.xp),
    XpLog.findAll({
      where: { studentId: student.id },
      order: [['createdAt', 'DESC']],
      limit: 10
    }),
    QuizAttempt.findAll({
      where: { studentId: student.id },
      order: [['submittedAt', 'ASC'], ['id', 'ASC']]
    }),
    WritingSubmission.findAll({
      where: { studentId: student.id },
      order: [['submittedAt', 'ASC'], ['id', 'ASC']]
    }),
    SpeechAttempt.findAll({
      where: { studentId: student.id },
      order: [['submittedAt', 'ASC'], ['id', 'ASC']]
    }),
    GroupTaskCompletion.findAll({
      where: { studentId: student.id }
    }),
    GroupMember.findAll({
      where: { studentId: student.id },
      include: [{
        model: Group,
        include: [{ model: GroupTask, as: 'tasks' }]
      }]
    }),
    listMissionsForStudent(student)
  ]);

  const completedIds = new Set(completed.map(c => c.lessonId));
  const { missions } = missionResult;

  const quizAttempts = quizAttemptRows.reduce((map, attempt) => {
    const row = attempt.toJSON();
    const quizId = row.quizId || `lesson-${row.lessonId}`;

    if (!map[quizId]) {
      map[quizId] = [];
    }

    map[quizId].push({
      id: row.id,
      quizId,
      quizTitle: row.quizTitle,
      lessonId: row.lessonId,
      score: row.score,
      total: row.total,
      percent: row.percent,
      mastery: row.masteryLabel
        ? { label: row.masteryLabel }
        : undefined,
      masteryLabel: row.masteryLabel,
      attemptNo: row.attemptNo,
      xpAwarded: row.xpAwarded,
      xpPossible: row.xpPossible,
      review: row.reviewJson || [],
      submittedAt: row.submittedAt,
      backendSaved: true,
    });

    return map;
  }, {});

  const groupTaskCompletionMap = new Map(
    groupTaskCompletions.map(completion => [
      Number(completion.groupTaskId),
      completion.toJSON
        ? completion.toJSON()
        : completion,
    ])
  );

  const lessonProgressMap = new Map(lessonProgressRows.map(progress => {
    const row = progress.toJSON();
    const totalSteps = Math.max(1, Number(row.totalSteps || 1));
    const currentStep = Math.max(1, Math.min(Number(row.currentStep || 1), totalSteps));

    return [
      Number(row.lessonId),
      {
        ...row,
        currentStep,
        totalSteps,
        percent: row.status === 'completed'
          ? 100
          : Math.round(((currentStep - 1) / totalSteps) * 100)
      }
    ];
  }));



  function rowJson(row) {
    return row?.toJSON ? row.toJSON() : row;
  }

  function parseReviewJson(value) {
    if (Array.isArray(value)) return value;

    if (typeof value === 'string' && value.trim()) {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }

    return [];
  }

  function latestByTask(rows = [], keyGetter) {
    const map = new Map();

    for (const sourceRow of rows) {
      const row = rowJson(sourceRow);
      const key = Number(keyGetter(row) || 0);
      if (!key) continue;

      map.set(key, row);
    }

    return map;
  }

  const mcqAttemptByQuestionId = new Map();

  for (const sourceRow of quizAttemptRows) {
    const row = rowJson(sourceRow);
    const reviewItems = parseReviewJson(row.reviewJson);

    for (const review of reviewItems) {
      const questionId = Number(
        review?.questionId ||
        review?.mcqQuestionId ||
        review?.id ||
        review?.question?.id ||
        0
      );

      if (!questionId) continue;

      const selectedOptionId =
        review?.selectedOptionId ??
        review?.optionId ??
        review?.answerOptionId ??
        review?.selectedId ??
        review?.selectedOption?.id ??
        null;

      const isCorrect = Boolean(
        review?.isCorrect ??
        review?.correct ??
        review?.selectedOption?.isCorrect ??
        false
      );

      mcqAttemptByQuestionId.set(questionId, {
        id: row.id,
        quizId: row.quizId || `lesson-${row.lessonId}`,
        lessonId: row.lessonId,
        selectedOptionId,
        isCorrect,
        answeredAt: row.submittedAt,
        attemptNo: row.attemptNo,
        xpAwarded: row.xpAwarded,
        backendSaved: true
      });
    }
  }

  const writingSubmissionByTaskId = latestByTask(writingSubmissionRows, row => row.taskId);
  const speechAttemptByTaskId = latestByTask(speechAttemptRows, row => row.taskId);

  function hydrateLessonActivitySubmissions(lesson) {
    const lessonRow = rowJson(lesson);

    return {
      ...lessonRow,
      activities: Array.isArray(lessonRow.activities)
        ? lessonRow.activities.map(activity => {
            const activityType = String(activity?.type || '').toLowerCase();
            const hydrated = { ...activity };

            if (activityType === 'mcq') {
              hydrated.questions = Array.isArray(activity.questions)
                ? activity.questions.map(question => {
                    const attempt = mcqAttemptByQuestionId.get(Number(question?.id || 0));
                    return attempt ? { ...question, mcqAttempt: attempt } : question;
                  })
                : [];
            }

            if (activityType === 'writing') {
              const taskId = Number(activity?.writingTask?.id || activity?.taskId || 0);
              const submission = writingSubmissionByTaskId.get(taskId);

              if (submission) {
                hydrated.completed = true;
                hydrated.writingSubmission = submission;
                hydrated.latestSubmission = submission;
                hydrated.submission = submission;

                if (activity.writingTask) {
                  hydrated.writingTask = {
                    ...activity.writingTask,
                    completed: true,
                    writingSubmission: submission,
                    latestSubmission: submission,
                    submission
                  };
                }
              }
            }

            if (activityType === 'speech') {
              const taskId = Number(activity?.speechTask?.id || activity?.taskId || 0);
              const attempt = speechAttemptByTaskId.get(taskId);

              if (attempt) {
                hydrated.completed = true;
                hydrated.speechAttempt = attempt;
                hydrated.latestAttempt = attempt;
                hydrated.attempt = attempt;

                if (activity.speechTask) {
                  hydrated.speechTask = {
                    ...activity.speechTask,
                    completed: true,
                    speechAttempt: attempt,
                    latestAttempt: attempt,
                    attempt,
                    transcript: attempt.transcript || ''
                  };
                }
              }
            }

            return hydrated;
          })
        : []
    };
  }

  const completedGroupTaskIds = new Set(
    groupTaskCompletions
      .filter(completion => completion.verificationStatus === 'approved')
      .map(completion => Number(completion.groupTaskId))
  );




  console.log('[DASHBOARD DEBUG]', {
    studentId: student.id,
    xp: student.xp,
    level: calculateLevel(student.xp)
  });

  return {
    student,
    missions,
    level: calculateLevel(student.xp),
    levelTitle: levelTitleForXp(student.xp),
    nextLevelXp: nextLevelXp(student.xp),
    progress: {
      completedLessons: completed.length,
      totalLessons: lessons.length,
      percent: lessons.length ? Math.round((completed.length / lessons.length) * 100) : 0
    },
    lessons: lessons.map(l => {
      const lessonRow = hydrateLessonActivitySubmissions(l);

      return {
        ...lessonRow,
        completed: completedIds.has(Number(lessonRow.id)),
        progress: lessonProgressMap.get(Number(lessonRow.id)) || null
      };
    }),
    badges: badges.map(sb => sb.Badge),
    earnedBadges: badges.map(sb => ({
      ...sb.Badge.toJSON(),
      awardedAt: sb.awardedAt
    })),
    allBadges,
    badgeProgress,
    xpLogs,
    quizAttempts,
    groups: memberships.map(m => {
      const group = m.Group?.toJSON ? m.Group.toJSON() : m.Group;
      if (!group) return null;

      const tasks = Array.isArray(group.tasks) ? group.tasks : [];

      return {
        ...group,
        currentStudentGroupRole: m.groupRole || 'member',
        currentStudentIsLeader: (m.groupRole || 'member') === 'leader',
        tasks: tasks.map(task => {
          const completion = groupTaskCompletionMap.get(Number(task.id)) || null;
          const verificationStatus = completion?.verificationStatus || null;
          const completed = verificationStatus === 'approved';

          return {
            ...task,
            completed,
            completedByStudent: completed,
            pendingTeacherCheck: verificationStatus === 'pending',
            returnedByTeacher: verificationStatus === 'returned',
            verificationStatus,
            completion
          };
        })
      };
    }).filter(Boolean)
  };
}

router.get('/', requireRole('admin', 'teacher'), async (req, res, next) => {
  try {
    const assignments = await getTeacherAssignments(req);
    const where = assignedStudentWhere(assignments);

    if (req.query.status) where.status = req.query.status;
    if (req.query.q) where.name = { [Op.like]: `%${req.query.q}%` };

    const students = await Student.findAll({
      where,
      include: [User],
      order: [['gradeLevel','ASC'], ['name','ASC']]
    });

    res.json({ students });
  } catch (err) { next(err); }
});

router.post('/', requireRole('admin'), async (req, res, next) => {
  try {
    const body = validate(studentSchema, req.body);
    assertSafeContentPayload({ name: body.name, section: body.section }, 'student account');
    const role = await Role.findOne({ where: { name: 'student' } });

    const temporaryPin = generateTemporaryPin();

    const user = await User.create({
  roleId: role.id,
  username: body.studentCode,
  displayName: body.name,
  passwordHash: await bcrypt.hash(temporaryPin, 12),
  mustChangePassword: true
});
    const student = await Student.create({ userId: user.id, ...body });
    await audit(req.user.id, 'student.create', 'student', student.id);
    res.status(201).json({ student, temporaryPin });
  } catch (err) { next(err); }
});

router.get('/notifications', requireRole('student'), async (req, res, next) => {
  try {
    const notifications = await Notification.findAll({
      where: {
        userId: req.user.id,
        role: 'student',
        isRead: false,
      },
      order: [['createdAt', 'ASC']],
      limit: 10,
    });

    res.json({ notifications });
  } catch (err) {
    next(err);
  }
});

router.post('/notifications/:id/read', requireRole('student'), async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
        role: 'student',
      },
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    await notification.update({
      isRead: true,
      readAt: new Date(),
    });

    res.json({ notification });
  } catch (err) {
    next(err);
  }
});

router.get('/dashboard', requireRole('student'), async (req, res, next) => {
  try { res.json(await dashboardPayload(req.student)); } catch (err) { next(err); }
});

router.get('/:id/dashboard', requireRole('admin', 'teacher'), async (req, res, next) => {
  try {
    const student = await getStudentForRequest(req, req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found.' });
    res.json(await dashboardPayload(student));
  } catch (err) { next(err); }
});

router.get('/:id/progress', requireRole('admin', 'teacher', 'student'), async (req, res, next) => {
  try {
    const student = await getStudentForRequest(req, req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found.' });
    if (req.role === 'student' && student.id !== req.student.id) return res.status(403).json({ message: 'Access denied.' });
    const completed = await CompletedLesson.count({ where: { studentId: student.id } });
    const total = await Lesson.count({ where: { gradeLevel: student.gradeLevel, status: 'published' } });
    res.json({ xp: student.xp, level: calculateLevel(student.xp), levelTitle: levelTitleForXp(student.xp), nextLevelXp: nextLevelXp(student.xp), completed, total, percent: total ? Math.round(completed / total * 100) : 0 });
  } catch (err) { next(err); }
});

router.get('/:id/badges', requireRole('admin', 'teacher', 'student'), async (req, res, next) => {
  try {
    const student = await getStudentForRequest(req, req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found.' });
    if (req.role === 'student' && student.id !== req.student.id) return res.status(403).json({ message: 'Access denied.' });
    const allBadges = await ensureCoreBadges();
    const badges = await StudentBadge.findAll({ where: { studentId: student.id }, include: [Badge] });
    const badgeProgress = await buildBadgeProgress(student.id, student.xp);
    res.json({
      badges: badges.map(b => b.Badge),
      earnedBadges: badges.map(b => ({
        ...b.Badge.toJSON(),
        awardedAt: b.awardedAt
      })),
      allBadges,
      badgeProgress,
      level: calculateLevel(student.xp),
      levelTitle: levelTitleForXp(student.xp),
      nextLevelXp: nextLevelXp(student.xp)
    });
  } catch (err) { next(err); }
});

router.patch('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.id, { include: [User] });
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    assertSafeContentPayload({ name: req.body.name, section: req.body.section }, 'student profile');

    if (
      req.body.gradeLevel !== undefined &&
      Number(req.body.gradeLevel) !== Number(student.gradeLevel)
    ) {
      const promotionReason = String(
        req.body.promotionReason || ''
      ).trim();

      if (!promotionReason) {
        return res.status(422).json({
          message: 'Promotion reason is required.'
        });
      }

      const currentGrade = Number(student.gradeLevel);
      const requestedGrade = Number(req.body.gradeLevel);

      if (requestedGrade !== currentGrade + 1) {
        return res.status(422).json({
          message: 'Students may only advance one grade level at a time.'
        });
      }

      const completed = await CompletedLesson.count({
        where: { studentId: student.id }
      });

      const total = await Lesson.count({
        where: {
          gradeLevel: currentGrade,
          status: 'published'
        }
      });

      if (total > 0 && completed < total) {
        return res.status(422).json({
          message: 'Student must complete all lessons before promotion.'
        });
      }
    }

    const allowed = ['name','gradeLevel','section','avatar','status'];
    for (const key of allowed) if (req.body[key] !== undefined) student[key] = req.body[key];
    await student.save();
    if (req.body.name && student.User) {
      student.User.displayName = req.body.name;
      await student.User.save();
    }
    await audit(req.user.id, 'student.update', 'student', student.id, req.body);
    res.json({ student });
  } catch (err) { next(err); }
});

router.patch('/:id/avatar', requireRole('admin', 'student'), async (req, res, next) => {
  try {
    const student = await getStudentForRequest(req, req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found.' });
    if (req.role === 'student' && student.id !== req.student.id) return res.status(403).json({ message: 'Access denied.' });
    const avatar = typeof req.body.avatar === 'string' ? req.body.avatar.trim() : '';
    if (!avatar || avatar.length > 16) {
      return res.status(422).json({ message: 'Choose a valid avatar.' });
    }
    student.avatar = avatar;
    await student.save();
    res.json({ student });
  } catch (err) { next(err); }
});

router.post('/:id/archive', requireRole('admin'), async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.id, { include: [User] });
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    const reason = String(req.body.reason || '').trim();

    if (!reason) {
      return res.status(422).json({
        message: 'Archive reason is required.'
      });
    }

    student.status = 'archived';
    await student.save();
    if (student.User) { student.User.status = 'archived'; await student.User.save(); }
    await audit(
      req.user.id,
      'student.archive',
      'student',
      student.id,
      { reason }
    );
    res.json({ student });
  } catch (err) { next(err); }
});

router.post('/:id/reactivate', requireRole('admin'), async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.id, { include: [User] });
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    const reason = String(req.body.reason || '').trim();

    if (!reason) {
      return res.status(422).json({
        message: 'Reactivation reason is required.'
      });
    }

    student.status = 'active';
    await student.save();
    if (student.User) { student.User.status = 'active'; await student.User.save(); }
    await audit(
      req.user.id,
      'student.reactivate',
      'student',
      student.id,
      { reason }
    );
    res.json({ student });
  } catch (err) { next(err); }
});

router.post('/:id/reset-password', requireRole('admin'), async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.id, {
      include: [User]
    });

    if (!student || !student.User) {
      return res.status(404).json({
        message: 'Student account not found.'
      });
    }

    if (student.status !== 'active' || student.User.status !== 'active') {
      return res.status(422).json({
        message: 'Reactivate the student account before resetting the password.'
      });
    }

    const temporaryPin = req.body.temporaryPin?.trim() || generateTemporaryPin();

    if (!/^[2-9]{4}$/.test(temporaryPin)) {
      return res.status(422).json({
        message: 'Temporary PIN must be exactly 4 digits using numbers 2-9.'
      });
    }

    student.User.passwordHash = await bcrypt.hash(temporaryPin, 12);
    student.User.mustChangePassword = true;

    await student.User.save();

    await audit(req.user.id, 'student.reset_password', 'student', student.id, {
      forcedPasswordChange: true
    });

    res.json({
      message: 'Student password reset successfully.',
      temporaryPin
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/reset-progress', requireRole('admin'), async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    const reason =
      String(req.body.reason || '').trim() ||
      'Admin reset student progress';
    await Promise.all([
      CompletedLesson.destroy({ where: { studentId: student.id } }),
      LessonProgress.destroy({ where: { studentId: student.id } }),
      XpLog.destroy({ where: { studentId: student.id } }),
      QuizHistory.destroy({ where: { studentId: student.id } }),
      QuizAttempt.destroy({ where: { studentId: student.id } }),
      WritingSubmission.destroy({ where: { studentId: student.id } }),
      SpeechAttempt.destroy({ where: { studentId: student.id } }),
      StudentBadge.destroy({ where: { studentId: student.id } }),
      GroupTaskCompletion.destroy({ where: { studentId: student.id } }),
      MissionCompletion.destroy({ where: { studentId: student.id } })
    ]);
    student.xp = 0;
    await student.save();
    await audit(
      req.user.id,
      'student.reset_progress',
      'student',
      student.id,
      { reason }
    );
    res.json({ message: 'Progress reset.', student });
  } catch (err) { next(err); }
});

export { dashboardPayload, ensureCoreBadges, buildBadgeProgress, calculateLevel, levelTitleForXp, nextLevelXp };
export default router;
