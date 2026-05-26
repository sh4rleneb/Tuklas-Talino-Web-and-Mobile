const DEFAULT_BLOCKED_TERMS = [
  'bobo',
  'bob0',
  'tanga',
  'tang4',
  'gago',
  'gag0',
  'ulol',
  'ul0l',
  'inutil',
  'tarantado',
  'hayop ka',
  'stupid',
  'idiot',
  'moron',
  'dumb',
  'shut up',
  'fuck',
  'fck',
  'shit',
  'bitch',
  'asshole',
  'puta',
  'pota',
  'putangina',
  'pakyu',
  'punyeta',
  'leche',
  'kantot',
  'porn',
  'nude',
  'kill yourself',
  'kys'
,
  'ogag',
  'engot',
  'bugok',
  'salot',
  'sira ulo',
  'siraulo',
  'inutil ka',
  'wala kang kwenta',
  'walang kwenta',
  'pangit mo',
  'kadiri ka',
  'baliw ka',
  'hayup ka',
  'hubad',
  'bold',
  'porno',
  'sex video',
  'send nudes',
  'jakol',
  'jabol',
  'libog',
  'malibog',
  'tite',
  'pepe',
  'pekpek',
  'puke',
  'burat',
  'suso',
  'kantutan',
  'kantutin',
  'rape',
  'magpakamatay',
  'mamatay ka',
  'patayin mo sarili mo',
  'saktan sarili',
  'saktan mo sarili mo',
  'kill me',
  'kill myself',
  'suicide',
  'self harm',
  'hurt myself',
  'patayin kita',
  'papatayin kita',
  'saksakin kita',
  'sasaksakin kita',
  'barilin kita'
,
  'tubol'
,
  'tae',
  't@e',
  't4e',
  'taena',
  'tangina',
  'tang ina',
  'tang-ina',
  'tae ka',
  'amoy tae',
  'mukha kang tae',
  'poop',
  'poo',
  'feces',
  'shit ka',
  'bobo ka',
  'boboka',
  'ang bobo mo',
  'tanga ka',
  'ang tanga mo',
  'gago ka',
  'ulol ka',
  'engot ka',
  'bugok ka',
  'salot ka',
  'basura ka',
  'loser',
  'loser ka',
  'noob',
  'noob ka',
  'pangit',
  'panget',
  'panget mo',
  'kadiri',
  'putek',
  'pucha',
  'puchangina',
  'pakshet',
  'paksit',
  'pakyu ka',
  'fuck you',
  'f u',
  'wtf',
  'bullshit',
  'suntukin kita',
  'sasaktan kita',
  'bugbugin kita',
  'mamatay kana',
  'mamatay ka na',
  'magpakamatay ka',
  'patay ka sakin'
];

const SAFE_TEXT_ERROR_MESSAGE = 'May salitang hindi angkop para sa learning space. Pakipalitan muna bago magpatuloy.';

const SKIPPED_KEYS = new Set([
  'password',
  'currentPassword',
  'newPassword',
  'confirmPassword',
  'token',
  'refreshToken',
  'avatar',
  'file',
  'fileUrl',
  'fileName',
  'filePath',
  'storedName',
  'materialUrl',
  'materialName',
  'materialType',
  'materialFile'
]);

function getConfiguredTerms() {
  const customTerms = String(process.env.CONTENT_BLOCKLIST || '')
    .split(',')
    .map(term => term.trim())
    .filter(Boolean);

  return [...DEFAULT_BLOCKED_TERMS, ...customTerms];
}

function normalizeText(value = '') {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[@]/g, 'a')
    .replace(/[4]/g, 'a')
    .replace(/[0]/g, 'o')
    .replace(/[1!|]/g, 'i')
    .replace(/[3]/g, 'e')
    .replace(/[5$]/g, 's')
    .replace(/[7]/g, 't')
    .replace(/[+]/g, 't')
    .replace(/\s+/g, ' ')
    .trim();
}

function compactText(value = '') {
  return normalizeText(value).replace(/[^a-z0-9]+/g, '');
}

function makeSafeError(label = 'content') {
  const err = new Error(SAFE_TEXT_ERROR_MESSAGE);
  err.status = 400;
  err.code = 'CONTENT_SAFETY_BLOCKED';
  err.field = label;
  return err;
}

export function findBlockedTerms(value = '') {
  const normalized = normalizeText(value);
  const compact = compactText(value);

  if (!normalized && !compact) return [];

  const matches = [];

  for (const term of getConfiguredTerms()) {
    const normalizedTerm = normalizeText(term);
    const compactTerm = compactText(term);

    if (!normalizedTerm && !compactTerm) continue;

    const phraseMatch = normalized.includes(normalizedTerm);
    const compactMatch = compactTerm.length >= 4 && compact.includes(compactTerm);

    if (phraseMatch || compactMatch) {
      matches.push(term);
    }
  }

  return [...new Set(matches)];
}

export function isSafeText(value = '') {
  return findBlockedTerms(value).length === 0;
}

export function assertSafeText(value = '', label = 'content') {
  if (value === null || value === undefined || value === '') return;

  if (!isSafeText(value)) {
    throw makeSafeError(label);
  }
}

export function assertSafeContentPayload(payload, label = 'content') {
  const seen = new Set();

  function scan(value, path = label) {
    if (value === null || value === undefined) return;

    if (typeof value === 'string') {
      assertSafeText(value, path);
      return;
    }

    if (typeof value !== 'object') return;

    if (seen.has(value)) return;
    seen.add(value);

    if (Array.isArray(value)) {
      value.forEach((item, index) => scan(item, `${path}[${index}]`));
      return;
    }

    for (const [key, childValue] of Object.entries(value)) {
      if (SKIPPED_KEYS.has(key)) continue;
      scan(childValue, `${path}.${key}`);
    }
  }

  scan(payload, label);
}

export { SAFE_TEXT_ERROR_MESSAGE };
