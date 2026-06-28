import { sequelize } from '../src/config/database.js';

function extractSection(text, label) {
  const regex = new RegExp(`${label}:([\\s\\S]*?)(?=\\n[A-Za-z ]+:|$)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

function buildStructured(text) {
  const layunin = extractSection(text, 'Layunin') ||
                  extractSection(text, 'Objectives') ||
                  extractSection(text, 'Learning Objectives');

  const panimula = extractSection(text, 'Panimula');
  const aralin = extractSection(text, 'Aralin');
  const gawain = extractSection(text, 'Gawain');

  if (!aralin) return null;

  return `
Layunin: ${layunin}

Panimula: ${panimula}

Aralin:
${aralin}

Gawain: ${gawain}
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

    // ❌ delete garbage lessons
    if (text.includes('Ddjidk') || text.trim().length < 30) {
      await sequelize.query(`DELETE FROM lessons WHERE id = ${row.id}`);
      console.log(`Deleted junk lesson ${row.id}`);
      continue;
    }

    // ❌ skip already clean lessons
    if (text.includes('Layunin:') && text.includes('Aralin:')) {
      continue;
    }

    // 🔄 normalize legacy format
    const structured = buildStructured(text);

    if (structured) {
      await sequelize.query(
        `UPDATE lessons SET passage = ? WHERE id = ?`,
        { replacements: [structured, row.id] }
      );
      console.log(`Normalized lesson ${row.id}`);
    } else {
      console.log(`Skipped lesson ${row.id} (not parseable)`);
    }
  }

  await sequelize.close();
}

main().catch(async (err) => {
  console.error(err);
  await sequelize.close();
});
