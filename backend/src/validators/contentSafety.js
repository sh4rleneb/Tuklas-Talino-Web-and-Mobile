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

const EDUCATIONAL_LESSON_ALLOWED_TERMS = [
  'basura',
  'basurahan',
  'kanal',
  'estero',
  'dumi',
  'marumi',
  'kalinisan',
  'kapaligiran',
  'polusyon',
  'recycle',
  'pagre-recycle',
  'recycling',
  'waste',
  'garbage',
  'trash',
  'sewage',
  'pollution',
  'cleanliness',
  'sanitation',
  'environment'
];

export function getEducationalLessonAllowedTerms(extraTerms = []) {
  return [
    ...EDUCATIONAL_LESSON_ALLOWED_TERMS,
    ...(Array.isArray(extraTerms) ? extraTerms : [])
  ]
    .map((term) => String(term || '').trim())
    .filter(Boolean);
}

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


function escapeRegExp(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function containsWholeNormalizedTerm(text = '', term = '') {
  const normalizedText = normalizeText(text);
  const normalizedTerm = normalizeText(term);

  if (!normalizedText || !normalizedTerm) return false;
  if (normalizedText === normalizedTerm) return true;

  const termPattern = normalizedTerm
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => escapeRegExp(word))
    .join('[^a-z0-9]+');

  if (!termPattern) return false;

  const pattern = new RegExp(
    `(^|[^a-z0-9])${termPattern}([^a-z0-9]|$)`
  );

  return pattern.test(normalizedText);
}

function normalizeAllowedSafetyTerms(options = {}) {
  const values = Array.isArray(options.allowedTerms)
    ? options.allowedTerms
    : [];

  return values
    .map((term) => ({
      raw: String(term || ''),
      normalized: normalizeText(term),
      compact: compactText(term),
    }))
    .filter((term) => term.normalized || term.compact);
}

function isAllowedSafetyMatch(blockedTerm = '', allowedTerms = []) {
  const normalizedTerm = normalizeText(blockedTerm);
  const compactTerm = compactText(blockedTerm);

  return allowedTerms.some((allowed) => {
    if (!allowed.normalized && !allowed.compact) return false;

    const exactNormalizedMatch =
      normalizedTerm &&
      allowed.normalized &&
      allowed.normalized === normalizedTerm;

    const exactCompactMatch =
      compactTerm &&
      allowed.compact &&
      allowed.compact === compactTerm;

    const blockedTermAppearsInsideAllowedEducationalText =
      normalizedTerm &&
      allowed.normalized &&
      containsWholeNormalizedTerm(allowed.normalized, normalizedTerm);

    return exactNormalizedMatch || exactCompactMatch || blockedTermAppearsInsideAllowedEducationalText;
  });
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

    const isMultiwordPhrase =
      normalizedTerm.split(/\s+/).filter(Boolean).length > 1;

    const phraseMatch =
      containsWholeNormalizedTerm(normalized, normalizedTerm);

    const compactMatch =
      compactTerm.length >= 4 &&
      (
        isMultiwordPhrase
          ? compact === compactTerm
          : compact.includes(compactTerm)
      );

    if (phraseMatch || compactMatch) {
      matches.push(term);
    }
  }

  return [...new Set(matches)];
}

export function isSafeText(value = '', options = {}) {
  const allowedTerms = normalizeAllowedSafetyTerms(options);
  const blockedTerms = findBlockedTerms(value)
    .filter((term) => !isAllowedSafetyMatch(term, allowedTerms));

  return blockedTerms.length === 0;
}

export function assertSafeText(value = '', label = 'content', options = {}) {
  if (value === null || value === undefined || value === '') return;

  if (!isSafeText(value, options)) {
    throw makeSafeError(label);
  }
}

export function assertSafeContentPayload(payload, label = 'content', options = {}) {
  const seen = new Set();

  function scan(value, path = label) {
    if (value === null || value === undefined) return;

    if (typeof value === 'string') {
      assertSafeText(value, path, options);
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
