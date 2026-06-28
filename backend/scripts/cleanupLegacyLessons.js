import dotenv from 'dotenv';
import path from 'path';

// ✅ CORRECT ENV LOCATION
dotenv.config({
  path: path.resolve('backend/.env')
});

import mysql from 'mysql2/promise';

console.log("DB CONFIG:", {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  db: process.env.DB_NAME
});

const connectionConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
};

function normalize(text = '') {
  const cleaned = String(text || '')
    .replace(/TUKLAS TALINO SAMPLE LESSON PLAN[\s\S]*?Lesson Title:/i, '')
    .replace(/Subject:[\s\S]*?\n/i, '')
    .replace(/Module:[\s\S]*?\n/i, '')
    .trim();

  const match = cleaned.match(/Aralin:\s*([\s\S]*?)(?=\n[A-Za-z ]+:|$)/i);
  return match ? match[1].trim() : cleaned;
}

async function main() {
  const conn = await mysql.createConnection(connectionConfig);

  const [rows] = await conn.execute(`
    SELECT id, passage
    FROM lessons
    WHERE grade_level IN (1,2,3)
  `);

  for (const row of rows) {
    const text = row.passage || '';

    const isLegacy =
      text.includes('TUKLAS TALINO SAMPLE LESSON PLAN') ||
      text.includes('Subject:') ||
      text.includes('Module:');

    if (!isLegacy) continue;

    const cleaned = normalize(text);

    const rebuilt = `
Layunin: Matututo ang mag-aaral sa araling ito.

Panimula: Simulan ang pagkatuto sa pamamagitan ng pagbabasa.

Aralin:
${cleaned}

Gawain: Basahin at sagutin ang mga tanong.
`.trim();

    await conn.execute(
      `UPDATE lessons SET passage = ? WHERE id = ?`,
      [rebuilt, row.id]
    );

    console.log(`CLEANED ${row.id}`);
  }

  await conn.end();
}

main().catch(err => {
  console.error('FAILED:', err);
});
