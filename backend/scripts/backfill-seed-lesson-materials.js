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

const { Lesson, LessonActivity } = await import('../src/models/index.js');
const {
  ensureSeedLessonMaterialFiles,
  lessonMaterialBank,
  materialForSeedLesson
} = await import('../src/seed/lessonMaterialBank.js');

const dryRun = process.argv.includes('--dry-run');

async function main() {
  ensureSeedLessonMaterialFiles();

  const lessons = await Lesson.findAll({
    where: { title: Object.keys(lessonMaterialBank) },
    include: [{ model: LessonActivity, as: 'activities' }],
    order: [['gradeLevel', 'ASC'], ['subject', 'ASC'], ['id', 'ASC']]
  });

  let lessonsChecked = 0;
  let existingSkipped = 0;
  let materialsToAdd = 0;
  let materialsAdded = 0;

  for (const lesson of lessons) {
    lessonsChecked += 1;

    const lessonJson = lesson.toJSON();
    const material = materialForSeedLesson(lessonJson);

    if (!material) continue;

    const existingMaterial = lesson.activities?.find(activity => {
      const data = activity.dataJson || {};
      return activity.type === 'material' && (
        data.fileUrl === material.fileUrl ||
        data.fileName === material.fileName
      );
    });

    if (existingMaterial) {
      existingSkipped += 1;
      continue;
    }

    materialsToAdd += 1;

    if (dryRun) {
      console.log(`[DRY RUN] ${lesson.title}: would add demo PDF material ${material.fileName}`);
      continue;
    }

    await LessonActivity.create({
      lessonId: lesson.id,
      type: 'material',
      title: 'Materyal',
      instructions: 'Buksan ang demo PDF material bago magpatuloy sa aralin.',
      dataJson: material,
      sortOrder: 1
    });

    materialsAdded += 1;
    console.log(`[ADDED] ${lesson.title}: ${material.fileName}`);
  }

  console.log('');
  console.log('=== MATERIAL BACKFILL SUMMARY ===');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'WRITE'}`);
  console.log(`Lessons checked: ${lessonsChecked}`);
  console.log(`Existing materials skipped: ${existingSkipped}`);
  console.log(`Materials ${dryRun ? 'to add' : 'added'}: ${dryRun ? materialsToAdd : materialsAdded}`);

  if (dryRun) {
    console.log('');
    console.log('No database changes were made.');
    console.log('Run without --dry-run to apply demo PDF materials.');
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
