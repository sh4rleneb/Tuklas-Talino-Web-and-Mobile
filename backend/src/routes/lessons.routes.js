import { Router } from 'express';
import {
  authenticate,
  requireRole,
  requirePasswordChanged,
} from '../middleware/auth.js';

import {
  Lesson,
  TeacherAssignment,
  LessonActivity,
  MCQQuestion,
  MCQOption,
  WritingTask,
  SpeechTask,
  CompletedLesson,
  QuizHistory,
  QuizAttempt,
  WritingSubmission,
  SpeechAttempt,
  XpLog,
} from '../models/index.js';

import { awardXp } from '../services/progress.service.js';
import { lessonSchema, validate } from '../validators/common.js';
import { audit } from '../services/audit.service.js';
import { emitRealtime } from '../realtime.js';

const router = Router();

router.use(authenticate);
router.use(requirePasswordChanged);

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

function buildActivityData(activity) {
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
      const histories = await QuizHistory.findAll({
        where: {
          studentId: req.student.id,
          lessonId: lesson.id,
        },
        order: [['answeredAt', 'DESC']],
      });

      const latestByQuestion = new Map();

      for (const history of histories) {
        if (!latestByQuestion.has(Number(history.questionId))) {
          latestByQuestion.set(Number(history.questionId), {
            selectedOptionId: history.selectedOptionId,
            isCorrect: history.isCorrect,
            answeredAt: history.answeredAt,
          });
        }
      }

      for (const activity of lessonJson.activities || []) {
        for (const question of activity.questions || []) {
          const saved = latestByQuestion.get(Number(question.id));
          if (saved) {
            question.mcqAttempt = saved;
          }
        }
      }
    }

    res.json({ lesson: lessonJson });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireRole('admin', 'teacher'), async (req, res, next) => {
  try {
    const body = validate(lessonSchema, req.body);
    const { activities = [], ...lessonPayload } = body;

    const lesson = await Lesson.create({
      ...lessonPayload,
      createdByUserId: req.user.id,
      status: 'published',
    });

    await createActivities(lesson, activities);
    await audit(req.user.id, 'lesson.create', 'lesson', lesson.id);

    const full = await Lesson.findByPk(lesson.id, {
      include: lessonIncludes,
    });

    emitRealtime('teachers', 'lesson:created', {
      lessonId: lesson.id,
      title: lesson.title,
      gradeLevel: lesson.gradeLevel,
      subject: lesson.subject,
      message: `New lesson created: ${lesson.title}`,
    });

    res.status(201).json({ lesson: full });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requireRole('admin', 'teacher'), async (req, res, next) => {
  try {
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

    emitRealtime('teachers', 'lesson:updated', {
      lessonId: lesson.id,
      title: lesson.title,
      gradeLevel: lesson.gradeLevel,
      subject: lesson.subject,
      message: `Lesson updated: ${lesson.title}`,
    });

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

    if (created) {
      await awardXp(
        req.student.id,
        lesson.xpReward,
        'lesson',
        lesson.id,
        `Completed ${lesson.title}`
      );

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

    await audit(req.user.id, 'lesson.complete', 'lesson', lesson.id);

    res.json({
      completed,
      xpAwarded: created ? lesson.xpReward : 0,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/mcq', requireRole('student'), async (req, res, next) => {
  try {
    const option = await MCQOption.findByPk(req.body.selectedOptionId);
    const question = await MCQQuestion.findByPk(req.body.questionId);

    if (!option || !question) {
      return res.status(404).json({
        message: 'Question or option not found.',
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

    if (option.isCorrect) {
      const existingMcqXp = await XpLog.findOne({
        where: {
          studentId: req.student.id,
          sourceType: 'mcq',
          sourceId: question.id,
        },
      });

      if (!existingMcqXp) {
        await awardXp(
          req.student.id,
          5,
          'mcq',
          question.id,
          'Correct MCQ answer'
        );

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

    const score = Number(req.body.score || 0);
    const total = Number(req.body.total || 0);
    const submittedPercent = Number(req.body.percent);
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

    if (!existingQuizXp) {
      await awardXp(
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

    const review = Array.isArray(req.body.review) ? req.body.review : [];
    let savedAnswers = 0;

    for (const item of review) {
      const questionId = Number(item.questionId || 0);
      const selectedOptionId = Number(item.selectedOptionId || 0);

      if (!questionId || !selectedOptionId) continue;

      const question = await MCQQuestion.findByPk(questionId);
      const option = await MCQOption.findByPk(selectedOptionId);

      if (!question || !option || Number(option.questionId) !== Number(question.id)) {
        continue;
      }

      await QuizHistory.create({
        studentId: req.student.id,
        lessonId: lesson.id,
        questionId: question.id,
        selectedOptionId: option.id,
        isCorrect: option.isCorrect,
      });

      savedAnswers += 1;
    }

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
    });
  } catch (err) {
    next(err);
  }
});



router.post('/:id/writing', requireRole('student'), async (req, res, next) => {
  try {
    if (!req.body.content || req.body.content.trim().length < 5) {
      return res.status(422).json({
        message: 'Please write a longer answer.',
      });
    }

    const submission = await WritingSubmission.create({
      studentId: req.student.id,
      lessonId: req.params.id,
      taskId: req.body.taskId,
      content: req.body.content,
      feedback:
        'Salamat sa iyong sagot. Naka-save na ito para sa pagsusuri ng guro.',
    });

    await awardXp(
      req.student.id,
      8,
      'writing',
      submission.id,
      'Submitted writing task'
    );

    notifyTeacherAndLeaderboard({
      type: 'writing_submission',
      studentId: req.student.id,
      studentName: req.student.name,
      lessonId: Number(req.params.id),
      submissionId: submission.id,
      xp: 8,
      message: `${req.student.name} submitted a writing activity`,
    });

    res.status(201).json({ submission });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/speech', requireRole('student'), async (req, res, next) => {
  try {
    const attempt = await SpeechAttempt.create({
      studentId: req.student.id,
      lessonId: req.params.id,
      taskId: req.body.taskId,
      transcript: req.body.transcript || '',
      score: req.body.score || null,
    });

    await awardXp(
      req.student.id,
      6,
      'speech',
      attempt.id,
      'Submitted speech attempt'
    );

    notifyTeacherAndLeaderboard({
      type: 'speech_submission',
      studentId: req.student.id,
      studentName: req.student.name,
      lessonId: Number(req.params.id),
      attemptId: attempt.id,
      xp: 6,
      message: `${req.student.name} submitted a speech activity`,
    });

    res.status(201).json({ attempt });
  } catch (err) {
    next(err);
  }
});

export default router;