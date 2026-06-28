import { sequelize } from '../src/config/database.js';

function extractBlock(text, keywords) {
  for (const key of keywords) {
    const regex = new RegExp(`${key}:([\\s\\S]*?)(?=\\n[A-Za-z ]+:|$)`, 'i');
    const match = text.match(regex);
    if (match) return match[1].trim();
  }
  return '';
}

function normalize(text) {
  const aralin =
    extractBlock(text, ['Aralin']) ||
    text; // fallback: whole content

  const layunin =
    extractBlock(text, ['Layunin', 'Objectives', 'Learning Objectives']);

  const panimula =
    extractBlock(text, ['Panimula']);

  const gawain =
    extractBlock(text, ['Gawain']);

  // If nothing structured exists, STILL force create usable lesson
  return `
Layunin: ${layunin || 'Matututo ang mag-aaral sa araling ito.'}

Panimula: ${panimula || 'Simulan ang pagkatuto sa pamamagitan ng obserbasyon.'}

Aralin:
${aralin}

Gawain: ${gawain || 'Basahin at sagutin ang tanong.'}
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

    const normalized = normalize(text);

    await sequelize.query(
      `UPDATE lessons SET passage = ? WHERE id = ?`,
      { replacements: [normalized, row.id] }
    );

    console.log(`NORMALIZED ${row.id}`);
  }

  await sequelize.close();
}

main().catch(async (err) => {
  console.error(err);
  await sequelize.close();
});
