import { Router } from 'express';
import { authenticate, requireRole, requirePasswordChanged } from '../middleware/auth.js';
import { Lesson, LessonActivity, MCQQuestion, MCQOption, WritingTask, SpeechTask, CompletedLesson, QuizHistory, WritingSubmission, SpeechAttempt } from '../models/index.js';
import { awardXp } from '../services/progress.service.js';
import { lessonSchema, validate } from '../validators/common.js';
import { audit } from '../services/audit.service.js';

const router = Router();
router.use(authenticate);
router.use(requirePasswordChanged);

const lessonIncludes = [{
  model: LessonActivity,
  as: 'activities',
  include: [
    { model: MCQQuestion, as: 'questions', include: [{ model: MCQOption, as: 'options' }] },
    { model: WritingTask, as: 'writingTask' },
    { model: SpeechTask, as: 'speechTask' }
  ]
}];

function buildActivityData(activity) {
  if (activity.type === 'matching') {
    return {
      pairs: activity.pairs || []
    };
  }

  if (activity.type === 'vocabulary') {
    return {
      words: activity.words || []
    };
  }

  if (activity.type === 'infographic') {
    return {
      content: activity.content || ''
    };
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
      sortOrder: i + 1
    });

    if (activity.type === 'mcq') {
      const questions = activity.questions || [];

      for (let qIndex = 0; qIndex < questions.length; qIndex++) {
        const q = questions[qIndex];

        const question = await MCQQuestion.create({
          activityId: created.id,
          question: q.question,
          sortOrder: qIndex + 1
        });

        for (let oIndex = 0; oIndex < (q.options || []).length; oIndex++) {
          await MCQOption.create({
            questionId: question.id,
            optionText: q.options[oIndex].text,
            isCorrect: Boolean(q.options[oIndex].isCorrect),
            sortOrder: oIndex + 1
          });
        }
      }
    }

    if (activity.type === 'writing') {
      await WritingTask.create({
        activityId: created.id,
        prompt: activity.prompt || 'Sumulat ng iyong sagot.',
        rubricJson: activity.rubric || null
      });
    }

    if (activity.type === 'speech') {
      await SpeechTask.create({
        activityId: created.id,
        promptJson: activity.prompts || [],
        targetText: activity.targetText || lesson.speechTarget || ''
      });
    }
  }
}

router.get('/', async (req, res, next) => {
  try {
    const where = { status: 'published' };
    if (req.query.gradeLevel) where.gradeLevel = Number(req.query.gradeLevel);
    if (req.query.subject) where.subject = req.query.subject;
    const lessons = await Lesson.findAll({ where, order: [['gradeLevel','ASC'], ['subject','ASC'], ['id','ASC']] });
    res.json({ lessons });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const lesson = await Lesson.findByPk(req.params.id, { include: lessonIncludes });
    if (!lesson) return res.status(404).json({ message: 'Lesson not found.' });
    res.json({ lesson });
  } catch (err) { next(err); }
});

router.post('/', requireRole('admin', 'teacher'), async (req, res, next) => {
  try {
    const body = validate(lessonSchema, req.body);
    const { activities = [], ...lessonPayload } = body;

    const lesson = await Lesson.create({
      ...lessonPayload,
      createdByUserId: req.user.id,
      status: 'published'
    });

    await createActivities(lesson, activities);
    await audit(req.user.id, 'lesson.create', 'lesson', lesson.id);

    const full = await Lesson.findByPk(lesson.id, { include: lessonIncludes });
    res.status(201).json({ lesson: full });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requireRole('admin', 'teacher'), async (req, res, next) => {
  try {
    const lesson = await Lesson.findByPk(req.params.id);
    if (!lesson) return res.status(404).json({ message: 'Lesson not found.' });
    if (req.role === 'teacher' && lesson.createdByUserId && lesson.createdByUserId !== req.user.id) {
      return res.status(403).json({ message: 'Teachers can edit only their created lessons.' });
    }
    const allowed = ['gradeLevel','subject','title','duration','xpReward','passage','instructions','speechTarget','status'];
    for (const key of allowed) if (req.body[key] !== undefined) lesson[key] = req.body[key];
    await lesson.save();
    await audit(req.user.id, 'lesson.update', 'lesson', lesson.id, req.body);
    res.json({ lesson });
  } catch (err) { next(err); }
});

router.post('/:id/complete', requireRole('student'), async (req, res, next) => {
  try {
    const lesson = await Lesson.findByPk(req.params.id);
    if (!lesson) return res.status(404).json({ message: 'Lesson not found.' });
    const [completed, created] = await CompletedLesson.findOrCreate({
      where: { studentId: req.student.id, lessonId: lesson.id },
      defaults: { score: req.body.score || null }
    });
    if (created) await awardXp(req.student.id, lesson.xpReward, 'lesson', lesson.id, `Completed ${lesson.title}`);
    await audit(req.user.id, 'lesson.complete', 'lesson', lesson.id);
    res.json({ completed, xpAwarded: created ? lesson.xpReward : 0 });
  } catch (err) { next(err); }
});

router.post('/:id/mcq', requireRole('student'), async (req, res, next) => {
  try {
    const option = await MCQOption.findByPk(req.body.selectedOptionId);
    const question = await MCQQuestion.findByPk(req.body.questionId);
    if (!option || !question) return res.status(404).json({ message: 'Question or option not found.' });
    const history = await QuizHistory.create({
      studentId: req.student.id,
      lessonId: req.params.id,
      questionId: question.id,
      selectedOptionId: option.id,
      isCorrect: option.isCorrect
    });
    if (option.isCorrect) await awardXp(req.student.id, 5, 'mcq', question.id, 'Correct MCQ answer');
    res.json({ correct: option.isCorrect, history });
  } catch (err) { next(err); }
});

router.post('/:id/writing', requireRole('student'), async (req, res, next) => {
  try {
    if (!req.body.content || req.body.content.trim().length < 5) {
      return res.status(422).json({ message: 'Please write a longer answer.' });
    }
    const submission = await WritingSubmission.create({
      studentId: req.student.id,
      lessonId: req.params.id,
      taskId: req.body.taskId,
      content: req.body.content,
      feedback: 'Salamat sa iyong sagot. Naka-save na ito para sa pagsusuri ng guro.'
    });
    await awardXp(req.student.id, 8, 'writing', submission.id, 'Submitted writing task');
    res.status(201).json({ submission });
  } catch (err) { next(err); }
});

router.post('/:id/speech', requireRole('student'), async (req, res, next) => {
  try {
    const attempt = await SpeechAttempt.create({
      studentId: req.student.id,
      lessonId: req.params.id,
      taskId: req.body.taskId,
      transcript: req.body.transcript || '',
      score: req.body.score || null
    });
    await awardXp(req.student.id, 6, 'speech', attempt.id, 'Submitted speech attempt');
    res.status(201).json({ attempt });
  } catch (err) { next(err); }
});

export default router;
