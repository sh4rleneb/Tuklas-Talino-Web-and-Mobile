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
import { sequelize } from '../config/database.js';
import { audit } from '../services/audit.service.js';
import { emitRealtime } from '../realtime.js';

import { assertSafeContentPayload, assertSafeText, getEducationalLessonAllowedTerms } from '../validators/contentSafety.js';
const DEFAULT_MAX_QUIZ_ATTEMPTS = 2;
const MIN_QUIZ_ATTEMPTS = 1;
const MAX_CONFIGURABLE_QUIZ_ATTEMPTS = 10;

function normalizeQuizAttemptLimit(value, fallback = DEFAULT_MAX_QUIZ_ATTEMPTS) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    return fallback;
  }

  return Math.min(
    MAX_CONFIGURABLE_QUIZ_ATTEMPTS,
    Math.max(MIN_QUIZ_ATTEMPTS, parsed)
  );
}

function activityAttemptLimit(activity) {
  const row = activity?.toJSON ? activity.toJSON() : (activity || {});
  const data = row.dataJson || row.data_json || {};

  return normalizeQuizAttemptLimit(
    row.maxAttempts ??
    row.max_attempts ??
    data.maxAttempts ??
    data.max_attempts
  );
}

function mergeRawActivitySettings(validatedActivities = [], rawActivities = []) {
  return validatedActivities.map((activity, index) => {
    const raw = rawActivities[index] || {};

    return {
      ...activity,
      id: activity.id ?? raw.id,
      maxAttempts:
        activity.maxAttempts ??
        raw.maxAttempts ??
        raw.max_attempts,
      deadline:
        activity.deadline ??
        raw.deadline ??
        raw.dueAt ??
        raw.due_at ??
        null,
      dueAt:
        activity.dueAt ??
        raw.dueAt ??
        raw.deadline ??
        raw.due_at ??
        null,
    };
  });
}

async function updateActivityAttemptSettings(lessonId, activities = []) {
  const existing = await LessonActivity.findAll({
    where: { lessonId },
    order: [['sortOrder', 'ASC'], ['id', 'ASC']],
  });

  for (let index = 0; index < activities.length; index += 1) {
    const incoming = activities[index] || {};

    let target = null;

    if (incoming.id) {
      target = existing.find(
        (activity) => Number(activity.id) === Number(incoming.id)
      );
    }

    if (!target) {
      target = existing.find(
        (activity) =>
          String(activity.type) === String(incoming.type) &&
          Number(activity.sortOrder) === index + 1
      );
    }

    if (!target && incoming.type === 'mcq') {
      target = existing.find(
        (activity) => String(activity.type) === 'mcq'
      );
    }

    if (!target) continue;

    const currentData =
      target.dataJson && typeof target.dataJson === 'object'
        ? target.dataJson
        : {};

    target.dataJson = {
      ...currentData,
      maxAttempts: normalizeQuizAttemptLimit(incoming.maxAttempts),
      ...(incoming.deadline || incoming.dueAt
        ? { deadline: incoming.deadline || incoming.dueAt }
        : {}),
    };

    target.changed('dataJson', true);
    await target.save();
  }
}

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
  const existingData =
    activity.dataJson && typeof activity.dataJson === 'object'
      ? activity.dataJson
      : {};

  const settings = {
    ...existingData,
    maxAttempts: normalizeQuizAttemptLimit(activity.maxAttempts),
    ...(activity.deadline || activity.dueAt
      ? { deadline: activity.deadline || activity.dueAt }
      : {}),
  };

  if (activity.type === 'material') {
    return {
      ...settings,
      fileName: activity.fileName || '',
      fileUrl: activity.fileUrl || activity.url || '',
      fileType: activity.fileType || '',
      mimeType: activity.mimeType || '',
      size: activity.size || null
    };
  }

  if (activity.type === 'matching') {
    return { ...settings, pairs: activity.pairs || [] };
  }

  if (activity.type === 'vocabulary') {
    return { ...settings, words: activity.words || [] };
  }

  if (activity.type === 'infographic') {
    return { ...settings, content: activity.content || '' };
  }

  return settings;
}

async function createActivityTree(
  lesson,
  activity,
  sortOrder,
  transaction = null
) {
  const created = await LessonActivity.create({
    lessonId: lesson.id,
    type: activity.type,
    title: activity.title || activity.type,
    instructions: activity.instructions || null,
    dataJson: buildActivityData(activity),
    sortOrder,
  }, { transaction });

  if (activity.type === 'mcq') {
    const questions = Array.isArray(activity.questions)
      ? activity.questions
      : [];

    for (let questionIndex = 0; questionIndex < questions.length; questionIndex += 1) {
      const incomingQuestion = questions[questionIndex];

      const question = await MCQQuestion.create({
        activityId: created.id,
        question: incomingQuestion.question,
        sortOrder: questionIndex + 1,
      }, { transaction });

      const options = Array.isArray(incomingQuestion.options)
        ? incomingQuestion.options
        : [];

      for (let optionIndex = 0; optionIndex < options.length; optionIndex += 1) {
        const incomingOption = options[optionIndex];

        await MCQOption.create({
          questionId: question.id,
          optionText:
            incomingOption.text ??
            incomingOption.optionText ??
            '',
          isCorrect: Boolean(
            incomingOption.isCorrect ??
            incomingOption.correct
          ),
          sortOrder: optionIndex + 1,
        }, { transaction });
      }
    }
  }

  if (activity.type === 'writing') {
    await WritingTask.create({
      activityId: created.id,
      prompt:
        activity.prompt ??
        activity.writingTask?.prompt ??
        'Sumulat ng iyong sagot.',
      rubricJson:
        activity.rubric ??
        activity.rubricJson ??
        activity.writingTask?.rubricJson ??
        null,
    }, { transaction });
  }

  if (activity.type === 'speech') {
    await SpeechTask.create({
      activityId: created.id,
      promptJson:
        activity.prompts ??
        activity.promptJson ??
        activity.speechTask?.promptJson ??
        [],
      targetText:
        activity.targetText ??
        activity.content ??
        activity.speechTask?.targetText ??
        lesson.speechTarget ??
        '',
    }, { transaction });
  }

  return created;
}

async function createActivities(
  lesson,
  activities = [],
  transaction = null
) {
  for (let index = 0; index < activities.length; index += 1) {
    await createActivityTree(
      lesson,
      activities[index],
      index + 1,
      transaction
    );
  }
}

function lessonUpdateConflict(message) {
  const error = new Error(message);
  error.statusCode = 409;
  return error;
}

function numericId(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0
    ? parsed
    : null;
}

function activityQuestionRows(activity = {}) {
  return Array.isArray(activity.questions)
    ? activity.questions
    : [];
}

function questionOptionRows(question = {}) {
  return Array.isArray(question.options)
    ? question.options
    : [];
}

async function syncMcqQuestions(
  activity,
  incomingActivity,
  transaction
) {
  const existingQuestions = await MCQQuestion.findAll({
    where: { activityId: activity.id },
    include: [{ model: MCQOption, as: 'options' }],
    order: [
      ['sortOrder', 'ASC'],
      ['id', 'ASC'],
      [{ model: MCQOption, as: 'options' }, 'sortOrder', 'ASC'],
      [{ model: MCQOption, as: 'options' }, 'id', 'ASC'],
    ],
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  const questionById = new Map(
    existingQuestions.map((question) => [
      Number(question.id),
      question,
    ])
  );

  const incomingQuestions = activityQuestionRows(incomingActivity);

  for (
    let questionIndex = 0;
    questionIndex < incomingQuestions.length;
    questionIndex += 1
  ) {
    const incomingQuestion = incomingQuestions[questionIndex];
    const incomingQuestionId = numericId(incomingQuestion.id);

    let question = incomingQuestionId
      ? questionById.get(incomingQuestionId)
      : existingQuestions[questionIndex];

    if (incomingQuestionId && !question) {
      throw lessonUpdateConflict(
        `Quiz question ${incomingQuestionId} does not belong to this activity.`
      );
    }

    if (!question) {
      question = await MCQQuestion.create({
        activityId: activity.id,
        question:
          incomingQuestion.question ??
          incomingQuestion.prompt ??
          '',
        sortOrder: questionIndex + 1,
      }, { transaction });
    } else {
      question.question =
        incomingQuestion.question ??
        incomingQuestion.prompt ??
        question.question;

      question.sortOrder = questionIndex + 1;
      await question.save({ transaction });
    }

    const existingOptions = Array.isArray(question.options)
      ? question.options
      : await MCQOption.findAll({
          where: { questionId: question.id },
          order: [
            ['sortOrder', 'ASC'],
            ['id', 'ASC'],
          ],
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

    const optionById = new Map(
      existingOptions.map((option) => [
        Number(option.id),
        option,
      ])
    );

    const incomingOptions = questionOptionRows(incomingQuestion);

    for (
      let optionIndex = 0;
      optionIndex < incomingOptions.length;
      optionIndex += 1
    ) {
      const incomingOption = incomingOptions[optionIndex];
      const incomingOptionId = numericId(incomingOption.id);

      let option = incomingOptionId
        ? optionById.get(incomingOptionId)
        : existingOptions[optionIndex];

      if (incomingOptionId && !option) {
        throw lessonUpdateConflict(
          `Quiz option ${incomingOptionId} does not belong to question ${question.id}.`
        );
      }

      const optionText =
        incomingOption.text ??
        incomingOption.optionText ??
        incomingOption.label ??
        '';

      const isCorrect = Boolean(
        incomingOption.isCorrect ??
        incomingOption.correct
      );

      if (!option) {
        await MCQOption.create({
          questionId: question.id,
          optionText,
          isCorrect,
          sortOrder: optionIndex + 1,
        }, { transaction });
      } else {
        option.optionText = optionText || option.optionText;
        option.isCorrect = isCorrect;
        option.sortOrder = optionIndex + 1;
        await option.save({ transaction });
      }
    }
  }

  // Omitted questions and options are intentionally preserved.
  // The mobile editor currently exposes only the first MCQ question.
}

async function syncWritingTask(
  activity,
  incomingActivity,
  transaction
) {
  const existingTask = await WritingTask.findOne({
    where: { activityId: activity.id },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  const requestedTaskId = numericId(
    incomingActivity.writingTask?.id ??
    incomingActivity.taskId
  );

  if (
    requestedTaskId &&
    (!existingTask || Number(existingTask.id) !== requestedTaskId)
  ) {
    throw lessonUpdateConflict(
      `Writing task ${requestedTaskId} does not belong to this activity.`
    );
  }

  const prompt =
    incomingActivity.prompt ??
    incomingActivity.content ??
    incomingActivity.writingTask?.prompt ??
    'Sumulat ng iyong sagot.';

  const rubricJson =
    incomingActivity.rubric ??
    incomingActivity.rubricJson ??
    incomingActivity.writingTask?.rubricJson ??
    existingTask?.rubricJson ??
    null;

  if (existingTask) {
    existingTask.prompt = prompt;
    existingTask.rubricJson = rubricJson;
    existingTask.changed('rubricJson', true);
    await existingTask.save({ transaction });
    return;
  }

  await WritingTask.create({
    activityId: activity.id,
    prompt,
    rubricJson,
  }, { transaction });
}

async function syncSpeechTask(
  lesson,
  activity,
  incomingActivity,
  transaction
) {
  const existingTask = await SpeechTask.findOne({
    where: { activityId: activity.id },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  const requestedTaskId = numericId(
    incomingActivity.speechTask?.id ??
    incomingActivity.taskId
  );

  if (
    requestedTaskId &&
    (!existingTask || Number(existingTask.id) !== requestedTaskId)
  ) {
    throw lessonUpdateConflict(
      `Speech task ${requestedTaskId} does not belong to this activity.`
    );
  }

  const promptJson =
    incomingActivity.prompts ??
    incomingActivity.promptJson ??
    incomingActivity.speechTask?.promptJson ??
    existingTask?.promptJson ??
    [];

  const targetText =
    incomingActivity.targetText ??
    incomingActivity.content ??
    incomingActivity.speechTask?.targetText ??
    lesson.speechTarget ??
    existingTask?.targetText ??
    '';

  if (existingTask) {
    existingTask.promptJson = promptJson;
    existingTask.targetText = targetText;
    existingTask.changed('promptJson', true);
    await existingTask.save({ transaction });
    return;
  }

  await SpeechTask.create({
    activityId: activity.id,
    promptJson,
    targetText,
  }, { transaction });
}

async function syncLessonActivities(
  lesson,
  incomingActivities = [],
  transaction
) {
  const existingActivities = await LessonActivity.findAll({
    where: { lessonId: lesson.id },
    order: [
      ['sortOrder', 'ASC'],
      ['id', 'ASC'],
    ],
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  const activityById = new Map(
    existingActivities.map((activity) => [
      Number(activity.id),
      activity,
    ])
  );

  for (
    let activityIndex = 0;
    activityIndex < incomingActivities.length;
    activityIndex += 1
  ) {
    const incomingActivity = incomingActivities[activityIndex];
    const incomingActivityId = numericId(incomingActivity.id);

    let activity = incomingActivityId
      ? activityById.get(incomingActivityId)
      : null;

    if (incomingActivityId && !activity) {
      throw lessonUpdateConflict(
        `Activity ${incomingActivityId} does not belong to this lesson.`
      );
    }

    if (!activity) {
      await createActivityTree(
        lesson,
        incomingActivity,
        activityIndex + 1,
        transaction
      );
      continue;
    }

    if (
      String(activity.type) !==
      String(incomingActivity.type)
    ) {
      throw lessonUpdateConflict(
        `Activity ${activity.id} cannot be changed from ${activity.type} to ${incomingActivity.type}. Create a new activity instead.`
      );
    }

    activity.title =
      incomingActivity.title ??
      activity.title;

    activity.instructions =
      incomingActivity.instructions ??
      null;

    activity.dataJson = buildActivityData({
      ...incomingActivity,
      dataJson:
        activity.dataJson &&
        typeof activity.dataJson === 'object'
          ? activity.dataJson
          : {},
    });

    activity.sortOrder = activityIndex + 1;
    activity.changed('dataJson', true);
    await activity.save({ transaction });

    if (activity.type === 'mcq') {
      await syncMcqQuestions(
        activity,
        incomingActivity,
        transaction
      );
    }

    if (activity.type === 'writing') {
      await syncWritingTask(
        activity,
        incomingActivity,
        transaction
      );
    }

    if (activity.type === 'speech') {
      await syncSpeechTask(
        lesson,
        activity,
        incomingActivity,
        transaction
      );
    }
  }

  // Existing activities omitted from the request are intentionally
  // retained because they may have learner progress or submissions.
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

router.post('/materials/upload', requireRole('admin', 'teacher'), lessonMaterialUpload.fields([{ name: 'material', maxCount: 1 }, { name: 'file', maxCount: 1 }, { name: 'lessonMaterial', maxCount: 1 }]), async (req, res, next) => {
  try {
    const uploadedLessonMaterial = firstUploadedLessonMaterial(req);
    req.file = uploadedLessonMaterial;

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
    assertSafeContentPayload(body, 'lesson content', { allowedTerms: getEducationalLessonAllowedTerms() });
    const {
      activities: validatedActivities = [],
      ...lessonPayload
    } = body;
    const activities = mergeRawActivitySettings(
      validatedActivities,
      Array.isArray(req.body.activities) ? req.body.activities : []
    );

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
  const transaction = await sequelize.transaction();

  try {
    assertSafeContentPayload(req.body, 'lesson update', { allowedTerms: getEducationalLessonAllowedTerms() });

    const lesson = await Lesson.findByPk(req.params.id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!lesson) {
      await transaction.rollback();
      return res.status(404).json({
        message: 'Lesson not found.',
      });
    }

    if (
      req.role === 'teacher' &&
      lesson.createdByUserId &&
      Number(lesson.createdByUserId) !== Number(req.user.id)
    ) {
      await transaction.rollback();
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

    await lesson.save({ transaction });

    if (Array.isArray(req.body.activities)) {
      await syncLessonActivities(
        lesson,
        req.body.activities,
        transaction
      );
    }

    await transaction.commit();

    await audit(
      req.user.id,
      'lesson.update',
      'lesson',
      lesson.id,
      req.body
    );

    const full = await Lesson.findByPk(lesson.id, {
      include: lessonIncludes,
    });

    res.json({ lesson: full });
  } catch (err) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

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

function quizPlain(row) {
  return row?.toJSON ? row.toJSON() : (row || {});
}

function quizTextValue(value, fallback = '') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function quizQuestionPrompt(question, fallback = '') {
  const row = quizPlain(question);
  return quizTextValue(
    row.prompt ?? row.question ?? row.text ?? row.title,
    fallback
  );
}

function quizOptionLabel(option, fallback = '') {
  const row = quizPlain(option);
  return quizTextValue(
    row.text ?? row.optionText ?? row.label ?? row.value,
    fallback
  );
}

function quizOptionId(option) {
  const row = quizPlain(option);
  return row.id ?? null;
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


    const review = Array.isArray(req.body.review) ? req.body.review : [];

    if (!review.length) {
      return res.status(422).json({
        message: 'Quiz answers are required before saving a quiz result.',
      });
    }

    const normalizedReview = review
      .map((item) => ({
        questionId: Number(item.questionId || 0),
        selectedOptionId: Number(item.selectedOptionId || 0),
      }))
      .filter((item) => item.questionId && item.selectedOptionId);

    if (normalizedReview.length !== review.length) {
      return res.status(422).json({
        message: 'Every quiz answer must include a valid question and option.',
      });
    }

    const submittedQuestionIds = normalizedReview.map((item) => item.questionId);
    const uniqueSubmittedQuestionIds = new Set(submittedQuestionIds);

    if (uniqueSubmittedQuestionIds.size !== submittedQuestionIds.length) {
      return res.status(422).json({
        message: 'Each quiz question can only be answered once.',
      });
    }

    const lessonActivities = await LessonActivity.findAll({
      where: { lessonId: lesson.id },
      order: [['sortOrder', 'ASC'], ['id', 'ASC']],
    });

    const quizActivity = lessonActivities.find(
      (activity) => String(activity.type) === 'mcq'
    );

    const maxAttempts = activityAttemptLimit(quizActivity);
    const lessonActivityIds = lessonActivities.map(
      (activity) => Number(activity.id)
    );

    const expectedQuestions = lessonActivityIds.length
      ? await MCQQuestion.findAll({ where: { activityId: lessonActivityIds } })
      : [];

    const expectedQuestionIds = new Set(
      expectedQuestions.map((question) => Number(question.id))
    );

    if (!expectedQuestionIds.size) {
      return res.status(422).json({
        message: 'This lesson has no quiz questions configured.',
      });
    }

    const answeredAllQuestions =
      normalizedReview.length === expectedQuestionIds.size &&
      normalizedReview.every((item) => expectedQuestionIds.has(item.questionId));

    if (!answeredAllQuestions) {
      return res.status(422).json({
        message: 'Please answer all quiz questions before submitting.',
      });
    }

    const expectedQuestionIdList = [...expectedQuestionIds];
    const allOptions = expectedQuestionIdList.length
      ? await MCQOption.findAll({ where: { questionId: expectedQuestionIdList } })
      : [];

    const questionById = new Map(
      expectedQuestions.map((question) => [Number(question.id), question])
    );
    const optionById = new Map(
      allOptions.map((option) => [Number(option.id), option])
    );
    const optionsByQuestionId = new Map();

    for (const option of allOptions) {
      const optionRow = quizPlain(option);
      const questionId = Number(optionRow.questionId || 0);

      if (!questionId) continue;

      if (!optionsByQuestionId.has(questionId)) {
        optionsByQuestionId.set(questionId, []);
      }

      optionsByQuestionId.get(questionId).push(option);
    }

    const historyRows = [];

    for (const item of normalizedReview) {
      const question = questionById.get(item.questionId);
      const option = optionById.get(item.selectedOptionId);

      if (
        !question ||
        !option ||
        Number(option.questionId) !== Number(question.id)
      ) {
        return res.status(422).json({
          message: 'Quiz answers must belong to this lesson.',
        });
      }

      historyRows.push({
        studentId: req.student.id,
        lessonId: lesson.id,
        questionId: question.id,
        selectedOptionId: option.id,
        isCorrect: Boolean(option.isCorrect),
      });
    }

    const score = historyRows.filter((row) => row.isCorrect).length;
    const total = expectedQuestions.length;
    const percent = total
      ? Math.max(0, Math.min(100, Math.round((score / total) * 100)))
      : 0;

    const xpPossible = quizXpForPercent(percent);
    const masteryLabel = quizMasteryLabel(percent);

    const beforeBadgeIds = await getStudentBadgeIds(req.student.id);
    let xpAwarded = 0;
    let xpResult = null;

    const legacyQuizLogs = await XpLog.findAll({
      where: {
        studentId: req.student.id,
        sourceType: 'quiz',
        sourceId: lesson.id,
      },
    });

    const legacyLoggedQuizXp = legacyQuizLogs.reduce(
      (sum, log) => sum + Number(log.points || 0),
      0
    );

    const quizXpTiers = [
      {
        unlockXp: 5,
        points: 5,
        sourceType: 'quiz_base',
        note: `Quiz participation for ${lesson.title}: ${percent}%`,
      },
      {
        unlockXp: 10,
        points: 5,
        sourceType: 'quiz_tier_50',
        note: `Quiz improvement 50%+ for ${lesson.title}: ${percent}%`,
      },
      {
        unlockXp: 15,
        points: 5,
        sourceType: 'quiz_tier_75',
        note: `Quiz improvement 75%+ for ${lesson.title}: ${percent}%`,
      },
      {
        unlockXp: 20,
        points: 5,
        sourceType: 'quiz_tier_90',
        note: `Quiz improvement 90%+ for ${lesson.title}: ${percent}%`,
      },
    ];

    let tierLoggedQuizXp = 0;

    for (const tier of quizXpTiers) {
      const existingTierLog = await XpLog.findOne({
        where: {
          studentId: req.student.id,
          sourceType: tier.sourceType,
          sourceId: lesson.id,
        },
      });

      if (existingTierLog) {
        tierLoggedQuizXp += Number(existingTierLog.points || 0);
      }
    }

    const previousAttemptBestXp = existingAttempts.reduce(
      (best, attempt) => Math.max(
        best,
        Number(attempt.xpPossible || attempt.xpAwarded || 0)
      ),
      0
    );

    const previousBestXp = Math.max(
      legacyLoggedQuizXp,
      tierLoggedQuizXp,
      previousAttemptBestXp
    );

    const tiersToAward = quizXpTiers.filter((tier) =>
      xpPossible >= tier.unlockXp && previousBestXp < tier.unlockXp
    );

    for (const tier of tiersToAward) {
      const tierResult = await awardXp(
        req.student.id,
        tier.points,
        tier.sourceType,
        lesson.id,
        tier.note
      );

      const tierAwarded = Number(
        tierResult?.getDataValue?.('xpAwarded') || 0
      );

      if (tierAwarded > 0) {
        xpAwarded += tierAwarded;
        xpResult = tierResult;
      }
    }

    if (xpAwarded > 0) {
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
    const submittedReviewByQuestionId = new Map(
      review
        .map((item) => ({
          ...item,
          questionId: Number(item?.questionId || 0),
        }))
        .filter((item) => item.questionId)
        .map((item) => [item.questionId, item])
    );

    const reviewJson = historyRows.map((row, index) => {
      const question = questionById.get(Number(row.questionId));
      const selectedOption = optionById.get(Number(row.selectedOptionId));
      const questionOptions = optionsByQuestionId.get(Number(row.questionId)) || [];
      const correctOption =
        questionOptions.find((option) => Boolean(quizPlain(option).isCorrect)) ||
        null;
      const submitted = submittedReviewByQuestionId.get(Number(row.questionId)) || {};
      const correct = Boolean(row.isCorrect);
      const points = Number(quizPlain(question).points || submitted.points || 1);

      return {
        index: Number(submitted.index || index + 1),
        questionId: row.questionId,
        prompt: quizTextValue(
          submitted.prompt,
          quizQuestionPrompt(question, `Question ${index + 1}`)
        ),
        selectedOptionId: row.selectedOptionId,
        selectedText: quizTextValue(
          submitted.selectedText,
          quizOptionLabel(selectedOption, 'No answer')
        ),
        correctOptionId: submitted.correctOptionId || quizOptionId(correctOption),
        correctText: quizTextValue(
          submitted.correctText,
          quizOptionLabel(correctOption, '—')
        ),
        correct,
        isCorrect: correct,
        pointsEarned: correct ? points : 0,
        points,
      };
    });

    const existingQuizAttempts = await QuizAttempt.findAll({
      where: {
        studentId: req.student.id,
        lessonId: lesson.id,
        quizId,
      },
      order: [['attemptNo', 'ASC']]
    });

    if (existingQuizAttempts.length >= maxAttempts) {
      return res.status(409).json({
        message: `You already used all ${maxAttempts} quiz attempts. Review your answers instead.`,
        maxAttempts,
        attemptsUsed: existingQuizAttempts.length,
        quizAttempts: existingQuizAttempts.map(formatQuizAttempt)
      });
    }

    const attempt = await QuizAttempt.create({
      studentId: req.student.id,
      lessonId: lesson.id,
      quizId,
      quizTitle: req.body.quizTitle || lesson.title,
      score,
      total,
      percent,
      attemptNo: existingQuizAttempts.length + 1,
      xpAwarded,
      xpPossible,
      masteryLabel,
      reviewJson,
    });

    await awardThresholdBadges(xpResult || req.student);
    const newBadges = await getNewBadgeResponses(req.student.id, beforeBadgeIds);

    const allAttempts = [...existingQuizAttempts, attempt].map(formatQuizAttempt);

    await audit(req.user.id, 'quiz.result', 'lesson', lesson.id, {
      score,
      total,
      percent,
      xpAwarded,
      xpPossible,
      previousBestXp,
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
        xpAlreadyAwarded: xpAwarded <= 0 && previousBestXp >= xpPossible,
        previousBestXp,
        savedAnswers,
      },
      quizAttempts: allAttempts,
      maxAttempts,
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
          .normalize('NFC')
          .toLocaleLowerCase('fil-PH')
          .replace(/[‘’]/g, "'")
          .replace(/[–—]/g, '-')
          .replace(/[.,!?;:"“”()[\]{}]/g, '')
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
          ? [
              fillTemplate(
                rubric.template ||
                  rubric.sentence ||
                  task?.prompt ||
                  'Ang ____ ay ____.',
                rubric.correctWords
              )
            ]
          : [])
      ]
        .map(normalizeWritingAnswer)
        .filter(Boolean)
        .filter((answer, index, answers) => answers.indexOf(answer) === index);

      const normalizedContent = normalizeWritingAnswer(content);

      const isCorrect =
        Boolean(normalizedContent) &&
        expectedAnswers.includes(normalizedContent);

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
        reviewStatus: 'auto_checked',
        score: 100,
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
      reviewStatus: 'pending',
      score: null,
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


function collectSpeechSafetyTargets(task = {}, activity = {}) {
  const values = [];

  function collect(value) {
    if (value === null || value === undefined) return;

    if (Array.isArray(value)) {
      value.forEach(collect);
      return;
    }

    if (typeof value === 'object') {
      [
        value.targetText,
        value.speechTarget,
        value.target,
        value.word,
        value.text,
        value.phrase,
        value.prompt,
        value.value,
        value.label,
      ].forEach(collect);
      return;
    }

    const text = String(value || '').trim();
    if (text) values.push(text);
  }

  [
    task.targetText,
    task.speechTarget,
    task.target,
    task.word,
    task.text,
    task.phrase,
    task.prompt,
    activity.targetText,
    activity.speechTarget,
    activity.target,
    activity.word,
    activity.text,
    activity.phrase,
    activity.prompt,
    activity.dataJson,
    activity.data,
    activity.rubricJson,
  ].forEach(collect);

  return [...new Set(values)];
}

function firstUploadedLessonMaterial(req = {}) {
  return (
    req.file ||
    req.files?.material?.[0] ||
    req.files?.file?.[0] ||
    req.files?.lessonMaterial?.[0] ||
    null
  );
}

router.post('/:id/speech', requireRole('student'), async (req, res, next) => {
  try {
    const task = await SpeechTask.findByPk(req.body.taskId);
    const activity = task ? await LessonActivity.findByPk(task.activityId) : null;

    if (!task || !activity || Number(activity.lessonId) !== Number(req.params.id)) {
      return res.status(404).json({
        message: 'Speech task was not found in this lesson.'
      });
    }

    assertSafeText(req.body.transcript || '', 'speech transcript', {
      allowedTerms: getEducationalLessonAllowedTerms(collectSpeechSafetyTargets(task, activity)),
    });

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
