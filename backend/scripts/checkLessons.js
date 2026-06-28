import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config({ path: './backend/.env' });

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
});

const [rows] = await conn.execute(`
  SELECT id, grade_level, title,
         LEFT(passage, 200) AS preview
  FROM lessons
  ORDER BY grade_level, id
`);

console.log(JSON.stringify(rows, null, 2));

await conn.end();
