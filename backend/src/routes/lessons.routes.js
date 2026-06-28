import {
  Router } from 'express'; import multer from 'multer'; import path from 'path'; import fs from 'fs'; import { fileURLToPath } from 'url'; import {   authenticate,
  requireRole,
  requirePasswordChanged,
  } from '../middleware/auth.js';  import {   Lesson,
  TeacherAssignment,
  LessonActivity,
  MCQQuestion,
  MCQOption,
  WritingTask,
  SpeechTask,
  CompletedLesson,
  LessonProgress,
  QuizHistory,
  QuizAttempt,
  WritingSubmission,
  SpeechAttempt,
  XpLog,
  Badge,
  StudentBadge } from '../models/index.js';  import { awardXp,
  awardThresholdBadges
} from '../services/progress.service.js';
import { lessonSchema, validate } from '../validators/common.js';
import { audit } from '../services/audit.service.js';
import { emitRealtime } from '../realtime.js';

import { assertSafeContentPayload, assertSafeText } from '../validators/contentSafety.js';
const router = Router();

function plainBadgeResponse(badge) {
  const row = badge?.toJSON ? badge.toJSON() : badge;

  if (!row) return null;

  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    icon: row.icon || '🏅',
    xpThreshold: row.xpThreshold ?? null
  };
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
  const plain = plainBadgeResponse ? plainBadgeResponse(badge) : (badge?.toJSON ? badge.toJSON() : badge);
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



async function getStudentBadgeIds(studentId) {
  const rows = await StudentBadge.findAll({
    where: { studentId },
    attributes: ['badgeId']
  });

  return new Set(rows.map(row => Number(row.badgeId)));
}

async function getNewBadgeResponses(studentId, beforeBadgeIds) {
  const rows = await StudentBadge.findAll({
    where: { studentId },
    include: [Badge]
  });

  return uniqueBadgeResponses(
    rows
      .filter(row => !beforeBadgeIds.has(Number(row.badgeId)))
      .map(row => plainBadgeResponse(row.Badge))
      .filter(Boolean)
  );
}


router.use(authenticate);
router.use(requirePasswordChanged);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const lessonMaterialUploadDir = path.join(__dirname, '../../uploads/lesson-materials');

fs.mkdirSync(lessonMaterialUploadDir, { recursive: true });


const speechUploadDir = path.join(__dirname, '../../uploads/speech-recordings');

fs.mkdirSync(speechUploadDir, { recursive: true });

const speechUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, speechUploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase();

      cb(
        null,
        `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`
      );
    }
  }),
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();

    const allowed = new Set([
      '.m4a',
      '.mp3',
      '.wav',
      '.caf'
    ]);

    if (allowed.has(ext)) {
      cb(null, true);
      return;
    }

    cb(new Error('Only audio recordings are allowed.'));
  },
  limits: {
    fileSize: 15 * 1024 * 1024
  }
});

const lessonMaterialUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, lessonMaterialUploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase();
      const safeBase = path.basename(file.originalname || 'lesson-material', ext)
        .replace(/[^a-z0-9-_]+/gi, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80) || 'lesson-material';

      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeBase}${ext}`);
    }
  }),
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const allowedExts = new Set(['.ppt', '.pptx', '.pdf']);

    if (allowedExts.has(ext)) {
      cb(null, true);
      return;
    }

    cb(new Error('Only PPT, PPTX, or PDF lesson materials are allowed.'));
  },
  limits: { fileSize: 25 * 1024 * 1024 }
});


const lessonIncludes = [
  {
    model: LessonActivity,
    as: 'activities',
    include: [
      {
        model: MCQQuestion,
        as: 'questions',
        include: [{ model: MCQOption, as: 'options' }],
      },
      { model: WritingTask, as: 'writingTask' },
      { model: SpeechTask, as: 'speechTask' },
    ],
  },
];

function progressResponse(progress) {
  const row = progress?.toJSON ? progress.toJSON() : progress;
  const totalSteps = Math.max(1, Number(row?.totalSteps || 1));
  const currentStep = Math.max(1, Math.min(Number(row?.currentStep || 1), totalSteps));

  return {
    ...row,
    currentStep,
    totalSteps,
    percent: row?.status === 'completed'
      ? 100
      : Math.round(((currentStep - 1) / totalSteps) * 100)
  };
}

async function lessonTotalSteps(lessonId) {
  return (await LessonActivity.count({ where: { lessonId } })) + 1;
}

function buildActivityData(activity) {
  if (activity.type === 'material') {
    return {
      fileName: activity.fileName || '',
      fileUrl: activity.fileUrl || '',
      fileType: activity.fileType || '',
      mimeType: activity.mimeType || '',
      size: activity.size || null
    };
  }

  if (activity.type === 'matching') {
    return { pairs: activity.pairs || [] };
  }

  if (activity.type === 'vocabulary') {
    return { words: activity.words || [] };
  }

  if (activity.type === 'infographic') {
    return { content: activity.content || '' };
  }

  return activity.dataJson || null;
}

async function createActivities(lesson, activities = []) {
  for (let i = 0; i < activities.length; i++) {
    const activity = activities[i];

    const created = await LessonActivity.create({
      lessonId: lesson.id,
      type: activity.type,
      title: activity.title || activity.type,
      instructions: activity.instructions || null,
      dataJson: buildActivityData(activity),
      sortOrder: i + 1,
    });

    if (activity.type === 'mcq') {
      const questions = activity.questions || [];

      for (let qIndex = 0; qIndex < questions.length; qIndex++) {
        const q = questions[qIndex];

        const question = await MCQQuestion.create({
          activityId: created.id,
          question: q.question,
          sortOrder: qIndex + 1,
        });

        for (let oIndex = 0; oIndex < (q.options || []).length; oIndex++) {
          await MCQOption.create({
            questionId: question.id,
            optionText: q.options[oIndex].text,
            isCorrect: Boolean(q.options[oIndex].isCorrect),
            sortOrder: oIndex + 1,
          });
        }
      }
    }

    if (activity.type === 'writing') {
      await WritingTask.create({
        activityId: created.id,
        prompt: activity.prompt || 'Sumulat ng iyong sagot.',
        rubricJson: activity.rubric || null,
      });
    }

    if (activity.type === 'speech') {
      await SpeechTask.create({
        activityId: created.id,
        promptJson: activity.prompts || [],
        targetText: activity.targetText || lesson.speechTarget || '',
      });
    }
  }
}

function notifyTeacherAndLeaderboard(payload) {
  emitRealtime('teachers', 'student:activity', payload);
  emitRealtime('leaderboard', 'leaderboard:update', {});
  emitRealtime('teachers', 'teacher:monitoring:update', {});
}

router.get('/', async (req, res, next) => {
  try {
    const where = { status: 'published' };

    if (req.query.gradeLevel) {
      where.gradeLevel = Number(req.query.gradeLevel);
    }

    if (req.query.subject) {
      where.subject = req.query.subject;
    }

    if (req.role === 'teacher') {
      where.createdByUserId = req.user.id;

      const assignments = await TeacherAssignment.findAll({
        where: {
          teacherId: req.teacher?.id || 0,
          status: 'active'
        }
      });

      const assignedGrades = [...new Set(assignments.map((assignment) => Number(assignment.gradeLevel)))];

      if (!assignedGrades.length) {
        where.gradeLevel = [];
      } else if (!req.query.gradeLevel) {
        where.gradeLevel = assignedGrades;
      }
    }

    const lessons = await Lesson.findAll({
      where,
      order: [
        ['gradeLevel', 'ASC'],
        ['subject', 'ASC'],
        ['id', 'ASC'],
      ],
    });

    res.json({ lessons });
  } catch (err) {
    next(err);
  }
});

router.get('/mine', requireRole('admin', 'teacher'), async (req, res, next) => {
  try {
    const where = {};

    if (req.role === 'teacher') {
      where.createdByUserId = req.user.id;
    }

    if (['published', 'draft', 'archived'].includes(req.query.status)) {
      where.status = req.query.status;
    }

    const lessons = await Lesson.findAll({
      where,
      include: lessonIncludes,
      order: [
        ['updatedAt', 'DESC'],
        ['id', 'DESC']
      ]
    });

    res.json({ lessons });
  } catch (err) {
    next(err);
  }
});

router.post('/materials/upload', requireRole('admin', 'teacher'), lessonMaterialUpload.single('material'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a PPT, PPTX, or PDF file.' });
    }

    const ext = path.extname(req.file.originalname || '').toLowerCase();
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const material = {
      fileName: req.file.originalname,
      storedName: req.file.filename,
      fileUrl: `${baseUrl}/uploads/lesson-materials/${req.file.filename}`,
      fileType: ext.replace('.', '').toUpperCase() || 'FILE',
      mimeType: req.file.mimetype,
      size: req.file.size
    };

    res.status(201).json({ material });
  } catch (err) {
    next(err);
  }
});


router.post(
  '/speech/upload',
  requireRole('student'),
  speechUpload.single('audio'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: 'Audio file is required.'
        });
      }

      const baseUrl =
        `${req.protocol}://${req.get('host')}`;

      return res.status(201).json({
        audioUrl:
          `${baseUrl}/uploads/speech-recordings/${req.file.filename}`
      });
    } catch (err) {
      next(err);
    }
  }
);


router.get('/:id', async (req, res, next) => {
  try {
    const lesson = await Lesson.findByPk(req.params.id, {
      include: lessonIncludes,
    });

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found.' });
    }

    if (req.role === 'teacher' && Number(lesson.createdByUserId) !== Number(req.user.id)) {
      return res.status(403).json({ message: 'You can only view lessons you created.' });
    }

    const lessonJson = lesson.toJSON();

    if (req.student?.id) {
      const [
        progress,
        histories,
        writingSubmissions,
        speechAttempts
      ] = await Promise.all([
        LessonProgress.findOne({
          where: {
            studentId: req.student.id,
            lessonId: lesson.id,
          },
        }),
        QuizHistory.findAll({
          where: {
            studentId: req.student.id,
            lessonId: lesson.id,
          },
          order: [['answeredAt', 'DESC']],
        }),
        WritingSubmission.findAll({
          where: {
            studentId: req.student.id,
            lessonId: lesson.id,
          },
          order: [['submittedAt', 'DESC'], ['id', 'DESC']],
        }),
        SpeechAttempt.findAll({
          where: {
            studentId: req.student.id,
            lessonId: lesson.id,
          },
          order: [['submittedAt', 'DESC'], ['id', 'DESC']],
        }),
      ]);

      if (progress) {
        lessonJson.progress = progressResponse(progress);
      }

      const latestByQuestion = new Map();

      for (const history of histories) {
        if (!latestByQuestion.has(Number(history.questionId))) {
          latestByQuestion.set(Number(history.questionId), {
            selectedOptionId: history.selectedOptionId,
            isCorrect: history.isCorrect,
            answeredAt: history.answeredAt,
            backendSaved: true,
          });
        }
      }

      const latestWritingByTaskId = new Map();

      for (const sourceRow of writingSubmissions) {
        const row = sourceRow?.toJSON ? sourceRow.toJSON() : sourceRow;
        const taskId = Number(row?.taskId || 0);

        if (taskId && !latestWritingByTaskId.has(taskId)) {
          latestWritingByTaskId.set(taskId, row);
        }
      }

      const latestSpeechByTaskId = new Map();

      for (const sourceRow of speechAttempts) {
        const row = sourceRow?.toJSON ? sourceRow.toJSON() : sourceRow;
        const taskId = Number(row?.taskId || 0);

        if (taskId && !latestSpeechByTaskId.has(taskId)) {
          latestSpeechByTaskId.set(taskId, row);
        }
      }

      for (const activity of lessonJson.activities || []) {
        const activityType = String(activity?.type || '').toLowerCase();

        if (activityType === 'mcq') {
          for (const question of activity.questions || []) {
            const saved = latestByQuestion.get(Number(question.id));
            if (saved) {
              question.mcqAttempt = saved;
            }
          }
        }

        if (activityType === 'writing') {
          const taskId = Number(activity?.writingTask?.id || activity?.taskId || 0);
          const submission = latestWritingByTaskId.get(taskId);

          if (submission) {
            activity.completed = true;
            activity.writingSubmission = submission;
            activity.latestSubmission = submission;
            activity.submission = submission;

            if (activity.writingTask) {
              activity.writingTask.completed = true;
              activity.writingTask.writingSubmission = submission;
              activity.writingTask.latestSubmission = submission;
              activity.writingTask.submission = submission;
            }
          }
        }

        if (activityType === 'speech') {
          const taskId = Number(activity?.speechTask?.id || activity?.taskId || 0);
          const attempt = latestSpeechByTaskId.get(taskId);

          if (attempt) {
            activity.completed = true;
            activity.speechAttempt = attempt;
            activity.latestAttempt = attempt;
            activity.attempt = attempt;

            if (activity.speechTask) {
              activity.speechTask.completed = true;
              activity.speechTask.speechAttempt = attempt;
              activity.speechTask.latestAttempt = attempt;
              activity.speechTask.attempt = attempt;
              activity.speechTask.transcript = attempt.transcript || '';
            }
          }
        }
      }
    }

    res.json({ lesson: lessonJson });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireRole('admin', 'teacher'), async (req, res, next) => {
  try {
    const lesson = await Lesson.findByPk(req.params.id);

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found.' });
    }

    if (req.role === 'teacher' && Number(lesson.createdByUserId) !== Number(req.user.id)) {
      return res.status(403).json({ message: 'You can only remove lessons you created.' });
    }

    lesson.status = 'archived';
    await lesson.save();

    await audit(req.user.id, 'lesson.archive', 'lesson', lesson.id);


    res.json({ lesson });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/progress', requireRole('student'), async (req, res, next) => {
  try {
    const lesson = await Lesson.findByPk(req.params.id);

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found.' });
    }

    const totalSteps = await lessonTotalSteps(lesson.id);
    const [progress] = await LessonProgress.findOrCreate({
      where: {
        studentId: req.student.id,
        lessonId: lesson.id
      },
      defaults: {
        currentStep: 1,
        totalSteps,
        status: 'started'
      }
    });

    if (progress.totalSteps !== totalSteps) {
      progress.totalSteps = totalSteps;
      progress.currentStep = Math.min(progress.currentStep, totalSteps);
      await progress.save();
    }

    res.json({ progress: progressResponse(progress) });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/progress', requireRole('student'), async (req, res, next) => {
  try {
    const lesson = await Lesson.findByPk(req.params.id);

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found.' });
    }

    const defaultTotalSteps = await lessonTotalSteps(lesson.id);
    const requestedTotalSteps = Number(req.body.totalSteps || defaultTotalSteps);
    const totalSteps = Math.max(
      1,
      Number.isFinite(requestedTotalSteps) ? requestedTotalSteps : defaultTotalSteps
    );
    const requestedStep = Number(req.body.currentStep || 1);
    const [progress] = await LessonProgress.findOrCreate({
      where: {
        studentId: req.student.id,
        lessonId: lesson.id
      },
      defaults: {
        currentStep: 1,
        totalSteps,
        status: 'started'
      }
    });

    if (progress.status !== 'completed') {
      const requestedSafeStep = Math.max(
        1,
        Math.min(
          Number.isFinite(requestedStep) ? requestedStep : 1,
          totalSteps
        )
      );
      const currentStep = Math.max(
        Number(progress.currentStep || 1),
        requestedSafeStep
      );
      progress.currentStep = currentStep;
      progress.totalSteps = totalSteps;
      progress.status = currentStep > 1 ? 'in_progress' : 'started';
      progress.lastActivityType = String(req.body.lastActivityType || '').trim().slice(0, 40) || null;
      await progress.save();
    }

    res.json({ progress: progressResponse(progress) });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireRole('admin', 'teacher'), async (req, res, next) => {
  try {
    const body = validate(lessonSchema, req.body);
    assertSafeContentPayload(body, 'lesson content');
    const { activities = [], ...lessonPayload } = body;

    if (req.role === 'teacher') {
      const assignments = await TeacherAssignment.findAll({
        where: {
          teacherId: req.teacher?.id || 0,
          status: 'active'
        }
      });

      const assignedGrades = [...new Set(assignments.map((assignment) => Number(assignment.gradeLevel)))];
      const requestedGrade = Number(body.gradeLevel);

      if (!assignedGrades.includes(requestedGrade)) {
        return res.status(403).json({
          message: 'You can only create lessons for your assigned grade levels.'
        });
      }
    }

    const lesson = await Lesson.create({
      ...lessonPayload,
      createdByUserId: req.user.id,
    });

    await createActivities(lesson, activities);
    await audit(req.user.id, 'lesson.create', 'lesson', lesson.id);

    const full = await Lesson.findByPk(lesson.id, {
      include: lessonIncludes,
    });

    res.status(201).json({ lesson: full });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requireRole('admin', 'teacher'), async (req, res, next) => {
  try {
    assertSafeContentPayload(req.body, 'lesson update');
    const lesson = await Lesson.findByPk(req.params.id);

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found.' });
    }

    if (
      req.role === 'teacher' &&
      lesson.createdByUserId &&
      lesson.createdByUserId !== req.user.id
    ) {
      return res.status(403).json({
        message: 'Teachers can edit only their created lessons.',
      });
    }

    const allowed = [
      'gradeLevel',
      'subject',
      'title',
      'duration',
      'xpReward',
      'passage',
      'instructions',
      'speechTarget',
      'status',
    ];

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        lesson[key] = req.body[key];
      }
    }

    await lesson.save();
    await audit(req.user.id, 'lesson.update', 'lesson', lesson.id, req.body);

    res.json({ lesson });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/complete', requireRole('student'), async (req, res, next) => {
  try {
    const lesson = await Lesson.findByPk(req.params.id);

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found.' });
    }

    const [completed, created] = await CompletedLesson.findOrCreate({
      where: {
        studentId: req.student.id,
        lessonId: lesson.id,
      },
      defaults: {
        score: req.body.score || null,
      },
    });

    let newBadges = [];
    const beforeBadgeIds = await getStudentBadgeIds(req.student.id);

    if (created) {
      const xpResult = await awardXp(
        req.student.id,
        lesson.xpReward,
        'lesson',
        lesson.id,
        `Completed ${lesson.title}`
      );

      newBadges = await getNewBadgeResponses(req.student.id, beforeBadgeIds);

      notifyTeacherAndLeaderboard({
        type: 'lesson_complete',
        studentId: req.student.id,
        studentName: req.student.name,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        xp: lesson.xpReward,
        message: `${req.student.name} completed ${lesson.title}`,
      });
    }

    const totalSteps = await lessonTotalSteps(lesson.id);
    const [progress] = await LessonProgress.findOrCreate({
      where: {
        studentId: req.student.id,
        lessonId: lesson.id
      },
      defaults: {
        currentStep: totalSteps,
        totalSteps,
        status: 'completed',
        completedAt: new Date()
      }
    });
    progress.currentStep = totalSteps;
    progress.totalSteps = totalSteps;
    progress.status = 'completed';
    progress.completedAt = progress.completedAt || new Date();
    await progress.save();

    await audit(req.user.id, 'lesson.complete', 'lesson', lesson.id);

    res.json({
      completed,
      progress: progressResponse(progress),
      xpAwarded: created ? lesson.xpReward : 0,
      newBadges,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/mcq', requireRole('student'), async (req, res, next) => {
  try {
    const option = await MCQOption.findByPk(req.body.selectedOptionId);
    const question = await MCQQuestion.findByPk(req.body.questionId);
    const activity = question ? await LessonActivity.findByPk(question.activityId) : null;

    if (
      !option ||
      !question ||
      !activity ||
      Number(option.questionId) !== Number(question.id) ||
      Number(activity.lessonId) !== Number(req.params.id)
    ) {
      return res.status(404).json({
        message: 'Question or option was not found in this lesson.',
      });
    }

    const history = await QuizHistory.create({
      studentId: req.student.id,
      lessonId: req.params.id,
      questionId: question.id,
      selectedOptionId: option.id,
      isCorrect: option.isCorrect,
    });

    let xpAwarded = 0;
    let newBadges = [];

    if (option.isCorrect) {
      const existingMcqXp = await XpLog.findOne({
        where: {
          studentId: req.student.id,
          sourceType: 'mcq',
          sourceId: question.id,
        },
      });

      if (!existingMcqXp) {
        const xpResult = await awardXp(
          req.student.id,
          5,
          'mcq',
          question.id,
          'Correct MCQ answer'
        );

        newBadges = xpResult?.getDataValue?.('newBadges') || xpResult?.newBadges || [];
        xpAwarded = 5;

        notifyTeacherAndLeaderboard({
          type: 'mcq_correct',
          studentId: req.student.id,
          studentName: req.student.name,
          lessonId: Number(req.params.id),
          questionId: question.id,
          xp: 5,
          message: `${req.student.name} answered an MCQ correctly`,
        });
      }
    }

    res.json({
      correct: option.isCorrect,
      history,
      xpAwarded,
      newBadges,
      message: xpAwarded
        ? 'Correct answer. XP awarded once for this question.'
        : 'Answer saved. No extra XP for repeated or incorrect answers.',
    });
  } catch (err) {
    next(err);
  }
});


function quizXpForPercent(percent = 0) {
  const value = Number(percent || 0);
  if (value >= 90) return 20;
  if (value >= 75) return 15;
  if (value >= 50) return 10;
  return 5;
}

function quizMasteryLabel(percent = 0) {
  const value = Number(percent || 0);
  if (value >= 90) return 'Advanced';
  if (value >= 75) return 'Proficient';
  if (value >= 50) return 'Developing';
  return 'Needs Practice';
}

function formatQuizAttempt(attempt) {
  const row = attempt.toJSON ? attempt.toJSON() : attempt;

  return {
    id: row.id,
    quizId: row.quizId,
    quizTitle: row.quizTitle,
    lessonId: row.lessonId,
    score: row.score,
    total: row.total,
    percent: row.percent,
    masteryLabel: row.masteryLabel,
    mastery: row.masteryLabel ? { label: row.masteryLabel } : undefined,
    attemptNo: row.attemptNo,
    xpAwarded: row.xpAwarded,
    xpPossible: row.xpPossible,
    review: row.reviewJson || [],
    submittedAt: row.submittedAt,
    backendSaved: true,
  };
}

router.post('/:id/quiz-result', requireRole('student'), async (req, res, next) => {
  try {
    const lesson = await Lesson.findByPk(req.params.id);

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found.' });
    }

    const quizId = String(req.body.quizId || `lesson-${lesson.id}`);

    const existingAttempts = await QuizAttempt.findAll({
      where: {
        studentId: req.student.id,
        lessonId: lesson.id,
        quizId,
      },
      order: [['attemptNo', 'ASC'], ['id', 'ASC']],
    });

    if (existingAttempts.length >= 2) {
      return res.status(409).json({
        message: 'Maximum quiz attempts reached.',
        quizAttempts: existingAttempts.map(formatQuizAttempt),
      });
    }

    const review = Array.isArray(req.body.review) ? req.body.review : [];
    const normalizedReview = review
      .map((item) => ({
        questionId: Number(item.questionId || 0),
        selectedOptionId: Number(item.selectedOptionId || 0),
      }))
      .filter((item) => item.questionId && item.selectedOptionId);

    const questionIds = [...new Set(normalizedReview.map((item) => item.questionId))];
    const optionIds = [...new Set(normalizedReview.map((item) => item.selectedOptionId))];

    const [questions, options] = await Promise.all([
      questionIds.length ? MCQQuestion.findAll({ where: { id: questionIds } }) : [],
      optionIds.length ? MCQOption.findAll({ where: { id: optionIds } }) : [],
    ]);
    const lessonActivities = questions.length
      ? await LessonActivity.findAll({
        where: { id: [...new Set(questions.map((question) => question.activityId))] }
      })
      : [];
    const lessonActivityIds = new Set(
      lessonActivities
        .filter((activity) => Number(activity.lessonId) === Number(lesson.id))
        .map((activity) => Number(activity.id))
    );
    const questionById = new Map(questions.map((question) => [Number(question.id), question]));
    const optionById = new Map(options.map((option) => [Number(option.id), option]));
    const historyRows = [];

    for (const item of normalizedReview) {
      const question = questionById.get(item.questionId);
      const option = optionById.get(item.selectedOptionId);

      if (
        !question ||
        !option ||
        !lessonActivityIds.has(Number(question.activityId)) ||
        Number(option.questionId) !== Number(question.id)
      ) {
        continue;
      }

      historyRows.push({
        studentId: req.student.id,
        lessonId: lesson.id,
        questionId: question.id,
        selectedOptionId: option.id,
        isCorrect: Boolean(option.isCorrect),
      });
    }

    const hasSubmittedReview = review.length > 0;

    if (hasSubmittedReview && historyRows.length !== review.length) {
      return res.status(422).json({
        message: 'Quiz answers must belong to this lesson.'
      });
    }

    const score = hasSubmittedReview
      ? historyRows.filter((row) => row.isCorrect).length
      : Number(req.body.score || 0);
    const total = hasSubmittedReview
      ? historyRows.length
      : Number(req.body.total || 0);
    const submittedPercent = hasSubmittedReview ? Number.NaN : Number(req.body.percent);
    const percent = Number.isFinite(submittedPercent)
      ? Math.max(0, Math.min(100, Math.round(submittedPercent)))
      : total
        ? Math.max(0, Math.min(100, Math.round((score / total) * 100)))
        : 0;

    const xpPossible = quizXpForPercent(percent);
    const masteryLabel = quizMasteryLabel(percent);

    const existingQuizXp = await XpLog.findOne({
      where: {
        studentId: req.student.id,
        sourceType: 'quiz',
        sourceId: lesson.id,
      },
    });

    let xpAwarded = 0;
    let newBadges = [];
    let xpResult = null;
    const beforeBadgeIds = await getStudentBadgeIds(req.student.id);

    if (!existingQuizXp) {
      xpResult = await awardXp(
        req.student.id,
        xpPossible,
        'quiz',
        lesson.id,
        `Quiz result for ${lesson.title}: ${percent}%`
      );

      xpAwarded = xpPossible;

      notifyTeacherAndLeaderboard({
        type: 'quiz_completed',
        studentId: req.student.id,
        studentName: req.student.name,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        xp: xpAwarded,
        message: `${req.student.name} completed a quiz with ${percent}%`,
      });
    }

    if (historyRows.length) {
      await QuizHistory.bulkCreate(historyRows);
    }

    const savedAnswers = historyRows.length;

    const attempt = await QuizAttempt.create({
      studentId: req.student.id,
      lessonId: lesson.id,
      quizId,
      quizTitle: req.body.quizTitle || lesson.title,
      score,
      total,
      percent,
      attemptNo: existingAttempts.length + 1,
      xpAwarded,
      xpPossible,
      masteryLabel,
      reviewJson: review,
    });

    await awardThresholdBadges(xpResult || req.student);
    newBadges = await getNewBadgeResponses(req.student.id, beforeBadgeIds);

    const allAttempts = [...existingAttempts, attempt].map(formatQuizAttempt);

    await audit(req.user.id, 'quiz.result', 'lesson', lesson.id, {
      score,
      total,
      percent,
      xpAwarded,
      attemptNo: attempt.attemptNo,
    });

    res.status(201).json({
      quizResult: {
        lessonId: lesson.id,
        quizId,
        quizTitle: req.body.quizTitle || lesson.title,
        score,
        total,
        percent,
        masteryLabel,
        attemptNo: attempt.attemptNo,
        xpPossible,
        xpAwarded,
        xpAlreadyAwarded: Boolean(existingQuizXp),
        savedAnswers,
      },
      quizAttempts: allAttempts,
      newBadges,
    });
  } catch (err) {
    next(err);
  }
});



router.post('/:id/writing', requireRole('student'), async (req, res, next) => {
  try {
    const lessonId = Number(req.params.id);
    const beforeBadgeIds = await getStudentBadgeIds(req.student.id);
    let newBadges = [];
    const taskId = Number(req.body.taskId || 0);
    const content = String(req.body.content || '').trim();
    assertSafeText(content, 'writing answer');
    const autoChecked = Boolean(req.body.autoChecked);

    if (!taskId) {
      return res.status(422).json({
        message: 'Writing task is missing.',
      });
    }

    if (!content || content.length < 2) {
      return res.status(422).json({
        message: 'Please write a longer answer.',
      });
    }

    const task = await WritingTask.findByPk(taskId);
    const activity = task ? await LessonActivity.findByPk(task.activityId) : null;

    if (!task || !activity || Number(activity.lessonId) !== lessonId) {
      return res.status(404).json({
        message: 'Writing task was not found in this lesson.'
      });
    }

    const existing = await WritingSubmission.findOne({
      where: {
        studentId: req.student.id,
        lessonId,
        taskId,
      },
      order: [['submittedAt', 'DESC']],
    });

    const existingIsCorrectAutoChecked = existing &&
      /Tama ang sagot|Correct fill-in-the-blank/i.test(existing.feedback || '');

    if (autoChecked && existingIsCorrectAutoChecked) {
      return res.json({
        submission: existing,
        alreadySubmitted: true,
        locked: true,
        newBadges,
      xpAwarded: 0,
        message: 'Nasagutan mo na ito 🌟',
      });
    }

    if (!autoChecked && existing) {
      return res.json({
        submission: existing,
        pendingReview: true,
        xpAwarded: 0,
        message: 'Naipasa na. Hihintayin ang pagsusuri ng guro.',
      });
    }

    if (autoChecked) {
      const rubric = task?.rubricJson && typeof task.rubricJson === 'object'
        ? task.rubricJson
        : {};

      function normalizeWritingAnswer(value) {
        return String(value || '')
          .toLowerCase()
          .replace(/[.,!?;:'"“”‘’()[\]{}]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
      }

      function fillTemplate(template, words) {
        let blankIndex = 0;
        return String(template || '').replace(/_{2,}|\[blank\]/gi, () => {
          const word = words[blankIndex];
          blankIndex += 1;
          return word || '';
        });
      }

      const expectedAnswers = [
        rubric.correctAnswer,
        rubric.answer,
        ...(Array.isArray(rubric.correctAnswers) ? rubric.correctAnswers : []),
        ...(Array.isArray(rubric.acceptedAnswers) ? rubric.acceptedAnswers : []),
        ...(Array.isArray(rubric.correctWords)
          ? [fillTemplate(rubric.template || rubric.sentence || task?.prompt || 'Ang ____ ay ____.', rubric.correctWords)]
          : []),
        'Ang bata ay masaya.',
        'Ang bata ay mabait.',
        'Ang bata ay nagbabasa.',
        'Ang bata ay tumutulong.',
        'Ang guro ay masaya.',
        'Ang guro ay mabait.',
        'Ang guro ay nagbabasa.',
        'Ang guro ay tumutulong.',
        'Ang bahay ay maganda.',
        'Ang bahay ay malinis.',
        'Ang paaralan ay maganda.',
        'Ang paaralan ay malinis.'
      ].filter(Boolean);

      function keywordScore(expected, actual) {
        const expectedWords = normalizeWritingAnswer(expected)
          .split(' ')
          .filter(Boolean);

        const actualWords = new Set(
          normalizeWritingAnswer(actual)
            .split(' ')
            .filter(Boolean)
        );

        let matched = 0;

        for (const word of expectedWords) {
          if (actualWords.has(word)) {
            matched++;
          }
        }

        return expectedWords.length
          ? matched / expectedWords.length
          : 0;
      }

      const isCorrect = expectedAnswers.some(answer =>
        keywordScore(answer, content) >= 0.8
      );

      if (!isCorrect) {
        return res.json({
          correct: false,
          xpAwarded: 0,
          message: 'Subukan muli 😊',
        });
      }

      const submission = await WritingSubmission.create({
        studentId: req.student.id,
        lessonId,
        taskId,
        content,
        feedback: 'Tama ang sagot. Na-award na ang XP.',
      });

      const xpAwarded = 10;

      const xpResult = await awardXp(
        req.student.id,
        xpAwarded,
        'writing',
        submission.id,
        'Correct fill-in-the-blank writing task'
      );

      notifyTeacherAndLeaderboard({
        type: 'writing_submission',
        studentId: req.student.id,
        studentName: req.student.name,
        lessonId,
        submissionId: submission.id,
        xp: xpAwarded,
        message: `${req.student.name} answered a writing activity correctly`,
      });

      await awardThresholdBadges(xpResult || req.student);
      newBadges = await getNewBadgeResponses(req.student.id, beforeBadgeIds);

      return res.status(201).json({
        submission,
        correct: true,
        locked: true,
        xpAwarded,
        newBadges,
        message: `Tama! +${xpAwarded} XP 🌟`,
      });
    }

    const submission = await WritingSubmission.create({
      studentId: req.student.id,
      lessonId,
      taskId,
      content,
      feedback:
        'Salamat sa iyong sagot. Naka-save na ito para sa pagsusuri ng guro.',
    });

    notifyTeacherAndLeaderboard({
      type: 'writing_submission',
      studentId: req.student.id,
      studentName: req.student.name,
      lessonId,
      submissionId: submission.id,
      xp: 0,
      message: `${req.student.name} submitted a writing activity for teacher review`,
    });

    await awardThresholdBadges(req.student);
    newBadges = await getNewBadgeResponses(req.student.id, beforeBadgeIds);

    res.status(201).json({
      submission,
      pendingReview: true,
      xpAwarded: 0,
      message: 'Naipasa na. Hihintayin ang pagsusuri ng guro.',
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/speech', requireRole('student'), async (req, res, next) => {
  try {
    assertSafeText(req.body.transcript || '', 'speech transcript');
    const task = await SpeechTask.findByPk(req.body.taskId);
    const activity = task ? await LessonActivity.findByPk(task.activityId) : null;

    if (!task || !activity || Number(activity.lessonId) !== Number(req.params.id)) {
      return res.status(404).json({
        message: 'Speech task was not found in this lesson.'
      });
    }

    const beforeBadgeIds = await getStudentBadgeIds(req.student.id);
    let attempt = await SpeechAttempt.findOne({
      where: {
        studentId: req.student.id,
        lessonId: req.params.id,
        taskId: req.body.taskId,
      },
    });
    const isNewSpeechAttempt = !attempt;
    const attemptPayload = {
      studentId: req.student.id,
      lessonId: req.params.id,
      taskId: req.body.taskId,
      transcript: req.body.transcript || '',
      audioUrl: req.body.audioUrl || null,
      score: req.body.score || null,
      submittedAt: new Date(),
    };

    if (attempt) {
      await attempt.update(attemptPayload);
    } else {
      attempt = await SpeechAttempt.create(attemptPayload);
    }

    const existingSpeechXp = await XpLog.findOne({
      where: {
        studentId: req.student.id,
        sourceType: 'speech',
        sourceId: task.id,
      },
    });

    let xpAwarded = 0;
    let xpResult = null;

    if (!existingSpeechXp) {
      xpResult = await awardXp(
        req.student.id,
        6,
        'speech',
        task.id,
        'Submitted speech attempt'
      );

      xpAwarded = 6;
    }

    if (isNewSpeechAttempt) {
      notifyTeacherAndLeaderboard({
        type: 'speech_submission',
        studentId: req.student.id,
        studentName: req.student.name,
        lessonId: Number(req.params.id),
        attemptId: attempt.id,
        xp: xpAwarded,
        message: `${req.student.name} submitted a speech activity`,
      });
    }

    await awardThresholdBadges(xpResult || req.student);
    const newBadges = await getNewBadgeResponses(req.student.id, beforeBadgeIds);

    res.status(201).json({
      attempt,
      xpAwarded,
      newBadges,
      message: xpAwarded
        ? 'Speech attempt saved. +6 XP'
        : 'Speech attempt saved. XP already awarded for this activity.'
    });
  } catch (err) {
    next(err);
  }
});

export default router;
