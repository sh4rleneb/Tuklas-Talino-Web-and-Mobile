import { sequelize } from '../src/config/database.js';

async function main() {
  const [rows] = await sequelize.query(`
    SELECT
      id,
      grade_level,
      title,
      LEFT(passage,120) AS preview
    FROM lessons
    ORDER BY grade_level,id;
  `);

  console.log("\n=== POSSIBLY OUTDATED LESSONS ===\n");

  for (const row of rows) {
    const text = row.preview || '';

    const outdated =
      text.includes('TUKLAS TALINO SAMPLE LESSON PLAN') ||
      !text.includes('Layunin:');

    if (outdated) {
      console.log(`[${row.id}] Grade ${row.grade_level} - ${row.title}`);
    }
  }

  await sequelize.close();
}

main().catch(async (err) => {
  console.error(err);
  await sequelize.close();
});
