import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '../../uploads/lesson-materials');

function escapePdfText(value = '') {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function writeSimplePdf(filePath, title, lines = []) {
  const safeLines = [title, '', ...lines].map(line => String(line || ''));

  const contentLines = [
    'BT',
    '/F1 18 Tf',
    '72 760 Td',
    `(${escapePdfText(safeLines[0])}) Tj`,
    '/F1 11 Tf',
    '0 -30 Td'
  ];

  for (const line of safeLines.slice(1)) {
    contentLines.push(`(${escapePdfText(line)}) Tj`);
    contentLines.push('0 -18 Td');
  }

  contentLines.push('ET');

  const stream = contentLines.join('\n');

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';

  offsets.slice(1).forEach(offset => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF\n`;

  fs.writeFileSync(filePath, pdf);
}

export const lessonMaterialBank = {
  'Pagbasa 1: Si Ana at ang Bola': {
    fileName: 'seed-grade-1-pagbasa-material.pdf',
    title: 'Grade 1 PDF Material - Si Ana at ang Bola',
    lines: [
      'Lesson: Pagbasa 1 - Si Ana at ang Bola',
      'Layunin: Makilala kung sino ang nasa kuwento.',
      'Basahin: Si Ana ay may pulang bola.',
      'Tanong: Sino ang may bola?',
      'Gawain: Iguhit o isulat ang bola ni Ana.'
    ]
  },
  'Pagbasa 2: Ang Punong Mangga': {
    fileName: 'seed-grade-2-pagbasa-material.pdf',
    title: 'Grade 2 PDF Material - Ang Punong Mangga',
    lines: [
      'Lesson: Pagbasa 2 - Ang Punong Mangga',
      'Layunin: Masagot ang sino, ano, at saan sa kuwento.',
      'Basahin: May malaking puno ng mangga sa bakuran.',
      'Tanong: Saan naglalaro sina Nena at Kiko?',
      'Gawain: Isulat ang tagpuan ng kuwento.'
    ]
  },
  'Pagbasa 3: Ang Batang Matulungin': {
    fileName: 'seed-grade-3-pagbasa-material.pdf',
    title: 'Grade 3 PDF Material - Ang Batang Matulungin',
    lines: [
      'Lesson: Pagbasa 3 - Ang Batang Matulungin',
      'Layunin: Matukoy ang ugali ng tauhan.',
      'Basahin: Si Carlo ay tumutulong sa kanyang kaklase.',
      'Tanong: Anong ugali ang ipinakita ni Carlo?',
      'Gawain: Magbigay ng sariling halimbawa ng pagtulong.'
    ]
  },
  'Pagbasa 4: Pangangalaga sa Tubig': {
    fileName: 'seed-grade-4-pagbasa-material.pdf',
    title: 'Grade 4 PDF Material - Pangangalaga sa Tubig',
    lines: [
      'Lesson: Pagbasa 4 - Pangangalaga sa Tubig',
      'Layunin: Maipaliwanag kung bakit mahalaga ang tubig.',
      'Basahin: Isara ang gripo kapag hindi ginagamit.',
      'Tanong: Paano natin pangangalagaan ang tubig?',
      'Gawain: Sumulat ng dalawang paraan ng pagtitipid ng tubig.'
    ]
  },
  'Pagbasa 5: Barangay Clean-Up Drive': {
    fileName: 'seed-grade-5-pagbasa-material.pdf',
    title: 'Grade 5 PDF Material - Barangay Clean-Up Drive',
    lines: [
      'Lesson: Pagbasa 5 - Barangay Clean-Up Drive',
      'Layunin: Maunawaan ang kahalagahan ng pagtutulungan.',
      'Basahin: Ang mga mamamayan ay naglinis ng barangay.',
      'Tanong: Bakit mahalaga ang clean-up drive?',
      'Gawain: Magbigay ng isang paraan para makatulong sa komunidad.'
    ]
  },
  'Pagbasa 6: Bakit Mahalaga ang Pagbabasa': {
    fileName: 'seed-grade-6-pagbasa-material.pdf',
    title: 'Grade 6 PDF Material - Bakit Mahalaga ang Pagbabasa',
    lines: [
      'Lesson: Pagbasa 6 - Bakit Mahalaga ang Pagbabasa',
      'Layunin: Maipaliwanag ang pakinabang ng pagbabasa.',
      'Basahin: Ang pagbabasa ay nagdaragdag ng kaalaman.',
      'Tanong: Ano ang makukuha natin sa pagbabasa?',
      'Gawain: Sumulat ng maikling dahilan kung bakit dapat magbasa araw-araw.'
    ]
  }
};

export function ensureSeedLessonMaterialFiles() {
  fs.mkdirSync(uploadDir, { recursive: true });

  for (const material of Object.values(lessonMaterialBank)) {
    const filePath = path.join(uploadDir, material.fileName);
    writeSimplePdf(filePath, material.title, material.lines);
  }

  return uploadDir;
}

export function materialForSeedLesson(body = {}) {
  const material = lessonMaterialBank[body.title];

  if (!material) return null;

  const filePath = path.join(uploadDir, material.fileName);
  const size = fs.existsSync(filePath) ? fs.statSync(filePath).size : 0;

  return {
    fileName: material.fileName,
    fileUrl: `/uploads/lesson-materials/${material.fileName}`,
    fileType: 'PDF',
    mimeType: 'application/pdf',
    size
  };
}
