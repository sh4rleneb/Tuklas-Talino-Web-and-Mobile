import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadBackendEnv() {
  const envPath = path.resolve(__dirname, '../.env');

  if (!fs.existsSync(envPath)) {
    console.warn(`[ENV] backend/.env not found at ${envPath}. Using existing process env/defaults.`);
    return;
  }

  const raw = fs.readFileSync(envPath, 'utf8');

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) continue;

    const equalIndex = trimmed.indexOf('=');
    if (equalIndex === -1) continue;

    const key = trimmed.slice(0, equalIndex).trim();
    let value = trimmed.slice(equalIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }

  console.log('[ENV] Loaded backend/.env for database connection.');
}

loadBackendEnv();

const {
  Lesson,
  LessonActivity,
  MCQQuestion,
  MCQOption
} = await import('../src/models/index.js');

const { lessonMcqBank, questionsForSeedLesson } = await import('../src/seed/lessonMcqBank.js');

const dryRun = process.argv.includes('--dry-run');

function normalize(text = '') {
  return String(text || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

async function ensureQuestion(activity, item, sortOrder) {
  const question = await MCQQuestion.create({
    activityId: activity.id,
    question: item.question,
    sortOrder
  });

  const options = Array.isArray(item.options) ? item.options : [];
  const correct = Number(item.correct || 0);

  for (let i = 0; i < options.length; i++) {
    await MCQOption.create({
      questionId: question.id,
      optionText: options[i],
      isCorrect: i === correct,
      sortOrder: i + 1
    });
  }
}

async function main() {
  const lessons = await Lesson.findAll({
    where: {
      title: Object.keys(lessonMcqBank)
    },
    include: [
      {
        model: LessonActivity,
        as: 'activities',
        include: [
          {
            model: MCQQuestion,
            as: 'questions',
            include: [{ model: MCQOption, as: 'options' }]
          }
        ]
      }
    ],
    order: [
      ['gradeLevel', 'ASC'],
      ['subject', 'ASC'],
      ['id', 'ASC'],
      [{ model: LessonActivity, as: 'activities' }, 'sortOrder', 'ASC'],
      [{ model: LessonActivity, as: 'activities' }, { model: MCQQuestion, as: 'questions' }, 'sortOrder', 'ASC']
    ]
  });

  let lessonsChecked = 0;
  let questionsToAdd = 0;
  let questionsAdded = 0;
  let skippedExisting = 0;

  for (const lesson of lessons) {
    lessonsChecked += 1;

    const lessonJson = lesson.toJSON();
    const targetQuestions = questionsForSeedLesson(lessonJson);
    if (!targetQuestions.length) continue;

    let mcqActivity = lesson.activities?.find(activity => activity.type === 'mcq');

    if (!mcqActivity) {
      if (dryRun) {
        questionsToAdd += targetQuestions.length;
        console.log(`[DRY RUN] ${lesson.title}: would create MCQ activity and ${targetQuestions.length} questions.`);
        continue;
      }

      mcqActivity = await LessonActivity.create({
        lessonId: lesson.id,
        type: 'mcq',
        title: 'Pagsusulit',
        sortOrder: 1
      });
    }

    const existingQuestions = await MCQQuestion.findAll({
      where: { activityId: mcqActivity.id },
      order: [['sortOrder', 'ASC'], ['id', 'ASC']]
    });

    const existingSet = new Set(existingQuestions.map(item => normalize(item.question)));
    let nextSortOrder = existingQuestions.length + 1;
    let plannedCount = existingQuestions.length;

    const targetTotal = 5;
    const candidateQuestions = existingQuestions.length > 0
      ? targetQuestions.slice(1)
      : targetQuestions;

    for (const item of candidateQuestions) {
      if (plannedCount >= targetTotal) break;

      if (!item?.question || !Array.isArray(item.options) || item.options.length < 2) {
        console.warn(`[SKIP] ${lesson.title}: invalid question data.`);
        continue;
      }

      if (existingSet.has(normalize(item.question))) {
        skippedExisting += 1;
        continue;
      }

      questionsToAdd += 1;
      plannedCount += 1;

      if (dryRun) {
        console.log(`[DRY RUN] ${lesson.title}: would add question "${item.question}"`);
        continue;
      }

      await ensureQuestion(mcqActivity, item, nextSortOrder);
      existingSet.add(normalize(item.question));
      nextSortOrder += 1;
      questionsAdded += 1;
      console.log(`[ADDED] ${lesson.title}: ${item.question}`);
    }

    if (plannedCount < targetTotal) {
      console.warn(`[WARN] ${lesson.title}: only ${plannedCount}/${targetTotal} MCQ questions available after backfill.`);
    }
  }

  console.log('');
  console.log('=== BACKFILL SUMMARY ===');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'WRITE'}`);
  console.log(`Lessons checked: ${lessonsChecked}`);
  console.log(`Existing matching questions skipped: ${skippedExisting}`);
  console.log(`Questions ${dryRun ? 'to add' : 'added'}: ${dryRun ? questionsToAdd : questionsAdded}`);

  if (dryRun) {
    console.log('');
    console.log('No database changes were made.');
    console.log('Run without --dry-run to apply the missing questions.');
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await Lesson.sequelize.close();
  });
