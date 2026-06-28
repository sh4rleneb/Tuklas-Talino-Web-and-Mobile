import { sequelize } from '../src/config/database.js';

function extract(text, start, end) {
  const regex = new RegExp(`${start}:([\\s\\S]*?)(?=${end}:|$)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

function forceBuild(text) {
  const layunin =
    extract(text, 'Layunin') ||
    extract(text, 'Learning Objectives') ||
    extract(text, 'Objectives');

  const aralin =
    extract(text, 'Aralin');

  const panimula =
    extract(text, 'Panimula');

  const gawain =
    extract(text, 'Gawain');

  if (!aralin) return null;

  return `
Layunin: ${layunin || ''}

Panimula: ${panimula || ''}

Aralin:
${aralin}

Gawain: ${gawain || ''}
`.trim();
}

async function main() {
  const [rows] = await sequelize.query(`
    SELECT id, passage
    FROM lessons
    WHERE grade_level IN (1,2,3)
  `);

  for (const row of rows) {
    const text = row.passage || '';

    // 🚨 FORCE convert legacy lesson plan
    if (text.includes('TUKLAS TALINO SAMPLE LESSON PLAN')) {
      const rebuilt = forceBuild(text);

      if (rebuilt) {
        await sequelize.query(
          `UPDATE lessons SET passage = ? WHERE id = ?`,
          { replacements: [rebuilt, row.id] }
        );
        console.log(`FORCED FIX ${row.id}`);
      } else {
        console.log(`FAILED ${row.id}`);
      }
    }
  }

  await sequelize.close();
}

main().catch(async (err) => {
  console.error(err);
  await sequelize.close();
});
