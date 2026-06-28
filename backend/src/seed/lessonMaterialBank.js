import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '../../uploads/lesson-materials');

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;

function escapePdfText(value = '') {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function cleanText(value = '') {
  return String(value || '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function wrapText(text = '', maxChars = 54) {
  const words = cleanText(text).split(' ').filter(Boolean);
  const lines = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;

    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

function rgb(r, g, b) {
  return `${r} ${g} ${b} rg\n${r} ${g} ${b} RG`;
}

function drawRect(x, y, w, h, r, g, b, stroke = false) {
  const paint = stroke ? 'B' : 'f';
  return `${rgb(r, g, b)}\n${x} ${y} ${w} ${h} re ${paint}`;
}

function drawLine(x1, y1, x2, y2, width = 2, r = 0.82, g = 0.18, b = 0.18) {
  return `${rgb(r, g, b)}\n${width} w\n${x1} ${y1} m\n${x2} ${y2} l\nS`;
}

function drawCircle(x, y, radius, r, g, b) {
  const c = radius * 0.5522847498;
  return [
    rgb(r, g, b),
    `${x + radius} ${y} m`,
    `${x + radius} ${y + c} ${x + c} ${y + radius} ${x} ${y + radius} c`,
    `${x - c} ${y + radius} ${x - radius} ${y + c} ${x - radius} ${y} c`,
    `${x - radius} ${y - c} ${x - c} ${y - radius} ${x} ${y - radius} c`,
    `${x + c} ${y - radius} ${x + radius} ${y - c} ${x + radius} ${y} c`,
    'f'
  ].join('\n');
}

function drawText(text, x, y, size = 18, font = 'F1', r = 0, g = 0, b = 0) {
  return [
    rgb(r, g, b),
    'BT',
    `/${font} ${size} Tf`,
    `${x} ${y} Td`,
    `(${escapePdfText(cleanText(text))}) Tj`,
    'ET'
  ].join('\n');
}

function drawWrappedText(text, x, y, options = {}) {
  const {
    size = 18,
    font = 'F1',
    color = [0, 0, 0],
    maxChars = 54,
    lineGap = Math.round(size * 1.35),
    maxLines = 10
  } = options;

  return wrapText(text, maxChars)
    .slice(0, maxLines)
    .map((line, index) => drawText(line, x, y - (index * lineGap), size, font, ...color))
    .join('\n');
}

function drawFooter(pageNumber, totalPages, lessonCode) {
  return [
    drawLine(54, 48, 558, 48, 1, 0.88, 0.88, 0.88),
    drawText(`${lessonCode} | Demo Reading Material`, 54, 28, 9, 'F1', 0.32, 0.32, 0.32),
    drawText(`Page ${pageNumber} of ${totalPages}`, 486, 28, 9, 'F1', 0.32, 0.32, 0.32)
  ].join('\n');
}

function drawBookIcon(x, y, scale = 1) {
  const w = 86 * scale;
  const h = 56 * scale;

  return [
    drawRect(x, y, w, h, 0.95, 0.24, 0.24),
    drawRect(x + w, y, w, h, 0.18, 0.48, 0.88),
    drawLine(x + w, y, x + w, y + h, 2, 1, 1, 1),
    drawLine(x + 12 * scale, y + h - 12 * scale, x + w - 10 * scale, y + h - 12 * scale, 1, 1, 1, 1),
    drawLine(x + w + 10 * scale, y + h - 12 * scale, x + (2 * w) - 12 * scale, y + h - 12 * scale, 1, 1, 1, 1),
    drawLine(x + 12 * scale, y + h - 25 * scale, x + w - 10 * scale, y + h - 25 * scale, 1, 1, 1, 1),
    drawLine(x + w + 10 * scale, y + h - 25 * scale, x + (2 * w) - 12 * scale, y + h - 25 * scale, 1, 1, 1, 1)
  ].join('\n');
}

function drawKidReader(x, y, scale = 1) {
  return [
    drawCircle(x, y + 72 * scale, 22 * scale, 1, 0.82, 0.58),
    drawCircle(x - 8 * scale, y + 76 * scale, 2.1 * scale, 0, 0, 0),
    drawCircle(x + 8 * scale, y + 76 * scale, 2.1 * scale, 0, 0, 0),
    drawLine(x - 7 * scale, y + 66 * scale, x + 7 * scale, y + 66 * scale, 1.4, 0.64, 0.18, 0.12),
    drawRect(x - 26 * scale, y + 18 * scale, 52 * scale, 42 * scale, 0.23, 0.58, 0.92),
    drawBookIcon(x - 62 * scale, y - 18 * scale, 0.72 * scale)
  ].join('\n');
}

function drawSlideBackground(pageIndex, title) {
  const colors = [
    [0.98, 0.94, 0.86],
    [0.92, 0.97, 1.00],
    [0.94, 0.98, 0.92],
    [1.00, 0.95, 0.98],
    [0.96, 0.95, 1.00]
  ];
  const [r, g, b] = colors[(pageIndex - 1) % colors.length];

  return [
    drawRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, r, g, b),
    drawRect(36, 704, 540, 48, 1, 1, 1),
    drawText(title, 54, 722, 24, 'F2', 0.78, 0.12, 0.12)
  ].join('\n');
}

function drawSectionCard(x, y, w, h, heading, body, options = {}) {
  const {
    headingColor = [0.05, 0.46, 0.24],
    bodySize = 16,
    bodyMaxChars = 48,
    iconNumber = null
  } = options;

  return [
    drawRect(x, y, w, h, 1, 1, 1, true),
    iconNumber ? drawCircle(x + 26, y + h - 27, 15, 0.96, 0.24, 0.24) : '',
    iconNumber ? drawText(String(iconNumber), x + 21, y + h - 33, 13, 'F2', 1, 1, 1) : '',
    drawText(heading, x + (iconNumber ? 50 : 20), y + h - 35, 18, 'F2', ...headingColor),
    drawWrappedText(body, x + 20, y + h - 67, {
      size: bodySize,
      font: 'F1',
      maxChars: bodyMaxChars,
      lineGap: Math.round(bodySize * 1.45),
      maxLines: 7
    })
  ].join('\n');
}

function buildPages(material) {
  const totalPages = 5;
  const pageTitle = material.slideTitle || material.title;
  const pages = [];

  pages.push([
    drawSlideBackground(1, pageTitle),
    drawText(material.coverKicker || 'Tuklas Talino', 58, 646, 18, 'F2', 0.12, 0.42, 0.76),
    drawWrappedText(material.coverTitle, 58, 596, {
      size: 34,
      font: 'F2',
      color: [0.78, 0.12, 0.12],
      maxChars: 18,
      lineGap: 42,
      maxLines: 3
    }),
    drawWrappedText(material.coverSubtitle, 58, 430, {
      size: 18,
      font: 'F1',
      maxChars: 42,
      lineGap: 25,
      maxLines: 5
    }),
    drawKidReader(438, 382, 1.45),
    drawFooter(1, totalPages, material.lessonCode)
  ].join('\n'));

  pages.push([
    drawSlideBackground(2, 'Mga Layunin'),
    drawText('Pagkatapos ng aralin, kaya kong:', 58, 646, 22, 'F2', 0.12, 0.42, 0.76),
    ...material.objectives.map((objective, index) =>
      drawSectionCard(62, 566 - (index * 118), 488, 88, `Layunin ${index + 1}`, objective, {
        iconNumber: index + 1,
        bodySize: 15,
        bodyMaxChars: 54
      })
    ),
    drawBookIcon(390, 92, 0.7),
    drawFooter(2, totalPages, material.lessonCode)
  ].join('\n'));

  pages.push([
    drawSlideBackground(3, material.conceptTitle || 'Alamin'),
    drawSectionCard(54, 552, 504, 126, material.keyIdeaTitle, material.keyIdea, {
      headingColor: [0.78, 0.12, 0.12],
      bodySize: 17,
      bodyMaxChars: 55
    }),
    drawSectionCard(54, 374, 238, 132, material.vocabTitle || 'Mga Salita', material.vocab, {
      headingColor: [0.06, 0.52, 0.28],
      bodySize: 15,
      bodyMaxChars: 25
    }),
    drawSectionCard(320, 374, 238, 132, material.strategyTitle || 'Gabay sa Pagbasa', material.strategy, {
      headingColor: [0.12, 0.42, 0.76],
      bodySize: 15,
      bodyMaxChars: 25
    }),
    drawKidReader(424, 150, 0.92),
    drawFooter(3, totalPages, material.lessonCode)
  ].join('\n'));

  pages.push([
    drawSlideBackground(4, material.passageTitle || 'Basahin Natin'),
    drawSectionCard(54, 420, 504, 250, 'Maikling Teksto', material.passage, {
      headingColor: [0.78, 0.12, 0.12],
      bodySize: material.passageSize || 17,
      bodyMaxChars: material.passageMaxChars || 56
    }),
    drawSectionCard(54, 220, 504, 144, 'Pag-usapan', material.discussion, {
      headingColor: [0.06, 0.52, 0.28],
      bodySize: 16,
      bodyMaxChars: 56
    }),
    drawBookIcon(385, 92, 0.72),
    drawFooter(4, totalPages, material.lessonCode)
  ].join('\n'));

  pages.push([
    drawSlideBackground(5, material.activityTitle || 'Gawain'),
    drawSectionCard(54, 534, 504, 132, 'Mini Activity', material.activity, {
      headingColor: [0.78, 0.12, 0.12],
      bodySize: 16,
      bodyMaxChars: 56
    }),
    drawSectionCard(54, 354, 504, 126, 'Tandaan', material.remember, {
      headingColor: [0.06, 0.52, 0.28],
      bodySize: 16,
      bodyMaxChars: 56
    }),
    drawText('Kaya ko ito!', 72, 218, 28, 'F2', 0.12, 0.42, 0.76),
    drawWrappedText(material.encouragement, 72, 178, {
      size: 17,
      font: 'F1',
      maxChars: 44,
      lineGap: 24,
      maxLines: 3
    }),
    drawKidReader(438, 122, 1.0),
    drawFooter(5, totalPages, material.lessonCode)
  ].join('\n'));

  return pages;
}

function writeSlidePdf(filePath, material) {
  const pageStreams = buildPages(material);
  const objects = [];

  objects.push('<< /Type /Catalog /Pages 2 0 R >>');

  const pageIds = pageStreams.map((_, index) => 3 + (index * 2));
  objects.push(`<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageStreams.length} >>`);

  const fontStartId = 3 + (pageStreams.length * 2);
  const fontResources = `<< /F1 ${fontStartId} 0 R /F2 ${fontStartId + 1} 0 R /F3 ${fontStartId + 2} 0 R >>`;

  pageStreams.forEach((stream, index) => {
    const pageObjectId = 3 + (index * 2);
    const contentObjectId = pageObjectId + 1;

    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font ${fontResources} >> /Contents ${contentObjectId} 0 R >>`);
    objects.push(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`);
  });

  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>');

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
    slideTitle: 'Pagbasa 1',
    lessonCode: 'Grade 1 - Pagbasa 1',
    coverTitle: 'Si Ana at ang Bola',
    coverSubtitle: 'Isang maikling kuwento tungkol kay Ana at sa kanyang pulang bola.',
    objectives: [
      'Makilala ang tauhan sa kuwento.',
      'Masagot ang tanong na Sino ang may bola?',
      'Mabasa nang malinaw ang maiikling pangungusap.'
    ],
    conceptTitle: 'Alamin',
    keyIdeaTitle: 'Ano ang babasahin?',
    keyIdea: 'Ang kuwento ay tungkol kay Ana. Mayroon siyang pulang bola. Tingnan ang mga salita at unawain kung ano ang nangyari.',
    vocabTitle: 'Mga Salita',
    vocab: 'Ana, bola, pula, saya, laro',
    strategyTitle: 'Gabay',
    strategy: 'Basahin nang dahan-dahan. Ituro ang bawat salita habang binabasa.',
    passageTitle: 'Basahin Natin',
    passage: 'Si Ana ay may bola. Ang bola ay pula. Masaya si Ana. Naglaro siya sa bakuran. Inalagaan niya ang kanyang bola.',
    discussion: 'Sino ang may bola? Ano ang kulay ng bola? Saan naglaro si Ana?',
    activity: 'Bilugan ang salitang bola. Iguhit ang bola ni Ana. Sabihin: Si Ana ay may pulang bola.',
    remember: 'Kapag nagbabasa, alamin muna kung sino ang tauhan at ano ang mahalagang bagay sa kuwento.',
    encouragement: 'Mahusay! Kaya mong basahin ang maikling kuwento.'
  },
  'Pagbasa 2: Ang Punong Mangga': {
    fileName: 'seed-grade-2-pagbasa-material.pdf',
    title: 'Grade 2 PDF Material - Ang Punong Mangga',
    slideTitle: 'Pagbasa 2',
    lessonCode: 'Grade 2 - Pagbasa 2',
    coverTitle: 'Ang Punong Mangga',
    coverSubtitle: 'Basahin ang kuwento at tukuyin ang tauhan, lugar, at pangyayari.',
    objectives: [
      'Matukoy ang sino, ano, at saan sa kuwento.',
      'Maunawaan ang tagpuan ng binasang teksto.',
      'Makapagbigay ng simpleng sagot tungkol sa kuwento.'
    ],
    conceptTitle: 'Alamin',
    keyIdeaTitle: 'Sino? Ano? Saan?',
    keyIdea: 'Kapag nagbabasa, hanapin ang tauhan, bagay, at lugar. Nakakatulong ito para mas maintindihan ang kuwento.',
    vocabTitle: 'Mga Salita',
    vocab: 'mangga, puno, bakuran, lilim, bunga',
    strategyTitle: 'Gabay',
    strategy: 'Tanungin ang sarili: Sino ang nasa kuwento? Saan ito nangyari?',
    passageTitle: 'Basahin Natin',
    passage: 'Sa bakuran nina Nena ay may malaking puno ng mangga. Tuwing hapon, naglalaro sina Nena at Kiko sa ilalim nito. Kapag may hinog na bunga, pinupulot nila ito at ibinabahagi sa pamilya.',
    discussion: 'Saan naglalaro sina Nena at Kiko? Ano ang ginagawa nila sa hinog na mangga?',
    activity: 'Isulat ang tauhan, tagpuan, at isang pangyayari mula sa kuwento.',
    remember: 'Mas madaling maunawaan ang kuwento kapag alam mo ang tauhan, tagpuan, at pangyayari.',
    encouragement: 'Magaling! Marunong ka nang maghanap ng detalye.'
  },
  'Pagbasa 3: Ang Batang Matulungin': {
    fileName: 'seed-grade-3-pagbasa-material.pdf',
    title: 'Grade 3 PDF Material - Ang Batang Matulungin',
    slideTitle: 'Pagbasa 3',
    lessonCode: 'Grade 3 - Pagbasa 3',
    coverTitle: 'Ang Batang Matulungin',
    coverSubtitle: 'Kilalanin ang ugali ng tauhan at ang aral sa kuwento.',
    objectives: [
      'Matukoy ang pangunahing tauhan.',
      'Mailarawan ang ugali ng tauhan batay sa kilos niya.',
      'Makapagbigay ng sariling halimbawa ng pagtulong.'
    ],
    conceptTitle: 'Alamin',
    keyIdeaTitle: 'Ugali ng Tauhan',
    keyIdea: 'Ang ugali ng tauhan ay makikita sa kanyang kilos, salita, at desisyon. Basahin ang mga pangyayari upang malaman kung anong katangian ang ipinakita.',
    vocabTitle: 'Mga Salita',
    vocab: 'matulungin, kaklase, aklat, pasasalamat, kabutihan',
    strategyTitle: 'Gabay',
    strategy: 'Hanapin ang ginawa ng tauhan. Itanong: Mabuti ba ang kilos niya?',
    passageTitle: 'Basahin Natin',
    passage: 'Nakita ni Carlo na nahulog ang aklat ng kanyang kaklase. Agad niya itong pinulot at ibinalik. Nagpasalamat ang kaklase niya. Masaya si Carlo dahil nakatulong siya sa simpleng paraan.',
    discussion: 'Ano ang ginawa ni Carlo? Anong ugali ang ipinakita niya? Kailan ka rin nakatulong sa iba?',
    activity: 'Sumulat ng dalawang pangungusap tungkol sa isang pagkakataong tumulong ka.',
    remember: 'Natutukoy ang ugali ng tauhan sa pamamagitan ng kanyang kilos at salita.',
    encouragement: 'Very good! Ang pagbabasa ay tumutulong para makita ang mabuting aral.'
  },
  'Pagbasa 4: Pangangalaga sa Tubig': {
    fileName: 'seed-grade-4-pagbasa-material.pdf',
    title: 'Grade 4 PDF Material - Pangangalaga sa Tubig',
    slideTitle: 'Pagbasa 4',
    lessonCode: 'Grade 4 - Pagbasa 4',
    coverTitle: 'Pangangalaga sa Tubig',
    coverSubtitle: 'Unawain ang impormasyon at alamin kung paano makakatipid ng tubig.',
    objectives: [
      'Maipaliwanag kung bakit mahalaga ang tubig.',
      'Matukoy ang pangunahing ideya ng tekstong binasa.',
      'Makapagmungkahi ng paraan sa pagtitipid ng tubig.'
    ],
    conceptTitle: 'Alamin',
    keyIdeaTitle: 'Pangunahing Ideya',
    keyIdea: 'Ang pangunahing ideya ang pinakamahalagang kaisipan ng teksto. Ito ang gustong ipaintindi ng binabasa.',
    vocabTitle: 'Mga Salita',
    vocab: 'tubig, gripo, tipid, linis, kalikasan',
    strategyTitle: 'Gabay',
    strategy: 'Basahin ang pamagat. Hanapin ang paulit-ulit na ideya sa bawat pangungusap.',
    passageTitle: 'Basahin Natin',
    passage: 'Mahalaga ang tubig sa pagluluto, paglilinis, at pag-inom. Dapat isara ang gripo kapag hindi ginagamit. Maaari ring gumamit ng timba sa pagdidilig upang hindi masayang ang tubig. Sa simpleng paraan, nakakatulong tayo sa kalikasan.',
    discussion: 'Ano ang pangunahing ideya ng teksto? Bakit kailangan nating magtipid ng tubig?',
    activity: 'Gumawa ng listahan ng tatlong paraan upang makatipid ng tubig sa bahay o paaralan.',
    remember: 'Ang pangunahing ideya ay tumutulong para maunawaan ang kabuuang mensahe ng teksto.',
    encouragement: 'Mahusay! Kaya mong gamitin ang pagbabasa para gumawa ng tamang aksyon.'
  },
  'Pagbasa 5: Barangay Clean-Up Drive': {
    fileName: 'seed-grade-5-pagbasa-material.pdf',
    title: 'Grade 5 PDF Material - Barangay Clean-Up Drive',
    slideTitle: 'Pagbasa 5',
    lessonCode: 'Grade 5 - Pagbasa 5',
    coverTitle: 'Barangay Clean-Up Drive',
    coverSubtitle: 'Basahin ang teksto at suriin kung paano nakakatulong ang pagtutulungan.',
    objectives: [
      'Maunawaan ang layunin ng clean-up drive.',
      'Makilala ang sanhi at bunga sa binasang teksto.',
      'Makapagbigay ng paraan upang makatulong sa komunidad.'
    ],
    conceptTitle: 'Alamin',
    keyIdeaTitle: 'Sanhi at Bunga',
    keyIdea: 'Ang sanhi ay dahilan ng pangyayari. Ang bunga naman ay resulta nito. Mahalaga itong makita upang maunawaan ang daloy ng teksto.',
    vocabTitle: 'Mga Salita',
    vocab: 'barangay, boluntaryo, kalinisan, komunidad, tulungan',
    strategyTitle: 'Gabay',
    strategy: 'Hanapin ang dahilan at resulta. Gamitin ang tanong na Bakit? at Ano ang nangyari?',
    passageTitle: 'Basahin Natin',
    passage: 'Nagkaroon ng clean-up drive sa barangay. Maagang dumating ang mga mamamayan dala ang walis, sako, at guwantes. Dahil sa kanilang pagtutulungan, naging malinis ang paligid at mas ligtas ang daan para sa mga bata.',
    discussion: 'Ano ang sanhi ng paglilinis? Ano ang naging bunga ng pagtutulungan?',
    activity: 'Gumawa ng cause-and-effect chart tungkol sa clean-up drive.',
    remember: 'Mas naiintindihan ang teksto kapag nakikita ang ugnayan ng sanhi at bunga.',
    encouragement: 'Ang galing! Nakakatulong ang pagbabasa para maging responsableng mamamayan.'
  },
  'Pagbasa 6: Bakit Mahalaga ang Pagbabasa': {
    fileName: 'seed-grade-6-pagbasa-material.pdf',
    title: 'Grade 6 PDF Material - Bakit Mahalaga ang Pagbabasa',
    slideTitle: 'Pagbasa 6',
    lessonCode: 'Grade 6 - Pagbasa 6',
    coverTitle: 'Bakit Mahalaga ang Pagbabasa',
    coverSubtitle: 'Suriin ang kahalagahan ng pagbabasa sa pagkatuto at araw-araw na buhay.',
    objectives: [
      'Maipaliwanag ang pakinabang ng pagbabasa.',
      'Matukoy ang opinyon at suportang detalye sa teksto.',
      'Makabuo ng sariling dahilan kung bakit dapat magbasa.'
    ],
    conceptTitle: 'Alamin',
    keyIdeaTitle: 'Opinyon at Suporta',
    keyIdea: 'May mga tekstong nagpapahayag ng opinyon. Upang maging malinaw ito, kailangan ng mga detalyeng sumusuporta sa ideya.',
    vocabTitle: 'Mga Salita',
    vocab: 'kaalaman, talasalitaan, impormasyon, opinyon, dahilan',
    strategyTitle: 'Gabay',
    strategy: 'Hanapin ang pangunahing pahayag. Pagkatapos, tukuyin ang mga detalyeng nagpapatunay dito.',
    passageTitle: 'Basahin Natin',
    passage: 'Mahalaga ang pagbabasa dahil nagpapalawak ito ng kaalaman. Natututo tayo ng bagong salita, ideya, at impormasyon. Sa pagbabasa, mas nagiging handa tayong umunawa, magpaliwanag, at gumawa ng mabuting desisyon.',
    discussion: 'Ano ang pangunahing opinyon ng teksto? Anong mga detalye ang sumusuporta rito?',
    activity: 'Sumulat ng limang pangungusap tungkol sa tanong: Bakit mahalaga ang pagbabasa para sa akin?',
    remember: 'Ang mabuting mambabasa ay marunong humanap ng ideya, ebidensya, at kahulugan.',
    encouragement: 'Excellent! Ang pagbabasa ay susi sa mas malawak na pagkatuto.'
  }
};

export function ensureSeedLessonMaterialFiles() {
  fs.mkdirSync(uploadDir, { recursive: true });

  for (const material of Object.values(lessonMaterialBank)) {
    const filePath = path.join(uploadDir, material.fileName);
    writeSlidePdf(filePath, material);
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
