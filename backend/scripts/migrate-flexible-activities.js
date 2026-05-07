import { sequelize } from '../src/config/database.js';

async function columnExists(tableName, columnName) {
  const [rows] = await sequelize.query(
    `
    SELECT COUNT(*) AS count
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = :tableName
      AND COLUMN_NAME = :columnName
    `,
    {
      replacements: { tableName, columnName }
    }
  );

  return Number(rows[0].count) > 0;
}

async function runMigration() {
  console.log('Connecting to database...');
  await sequelize.authenticate();
  console.log('Database connected.');

  console.log('Updating lesson_activities.type...');
  await sequelize.query(`
    ALTER TABLE lesson_activities
    MODIFY COLUMN type VARCHAR(40) NOT NULL
  `);

  const hasInstructions = await columnExists('lesson_activities', 'instructions');
  if (!hasInstructions) {
    console.log('Adding lesson_activities.instructions...');
    await sequelize.query(`
      ALTER TABLE lesson_activities
      ADD COLUMN instructions TEXT NULL AFTER title
    `);
  } else {
    console.log('lesson_activities.instructions already exists.');
  }

  const hasDataJson = await columnExists('lesson_activities', 'dataJson');
  if (!hasDataJson) {
    console.log('Adding lesson_activities.dataJson...');
    await sequelize.query(`
      ALTER TABLE lesson_activities
      ADD COLUMN dataJson JSON NULL AFTER instructions
    `);
  } else {
    console.log('lesson_activities.dataJson already exists.');
  }

  console.log('Flexible activity migration completed.');
}

runMigration()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });