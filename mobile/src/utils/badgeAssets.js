const BADGE_IMAGE_SOURCES = {
  'unang-hakbang': require('../../assets/badges/unang-hakbang.png'),
  'unang hakbang': require('../../assets/badges/unang-hakbang.png'),
  'first-lesson': require('../../assets/badges/unang-hakbang.png'),
  first_lesson: require('../../assets/badges/unang-hakbang.png'),

  'batang-mambabasa': require('../../assets/badges/batang-mambabasa.png'),
  'batang mambabasa': require('../../assets/badges/batang-mambabasa.png'),
  reader: require('../../assets/badges/batang-mambabasa.png'),
  'reader-3': require('../../assets/badges/batang-mambabasa.png'),
  reader_3: require('../../assets/badges/batang-mambabasa.png'),

  'henyo-sa-pagsusulit': require('../../assets/badges/henyo-sa-pagsusulit.png'),
  'henyo sa pagsusulit': require('../../assets/badges/henyo-sa-pagsusulit.png'),
  'quiz-perfect': require('../../assets/badges/henyo-sa-pagsusulit.png'),
  quiz_perfect: require('../../assets/badges/henyo-sa-pagsusulit.png'),

  'bituin-sa-pagsagot': require('../../assets/badges/bituin-sa-pagsagot.png'),
  'bituin sa pagsagot': require('../../assets/badges/bituin-sa-pagsagot.png'),
  'writing-3': require('../../assets/badges/bituin-sa-pagsagot.png'),
  writing_3: require('../../assets/badges/bituin-sa-pagsagot.png'),

  'boses-bituin': require('../../assets/badges/boses-bituin.png'),
  'boses bituin': require('../../assets/badges/boses-bituin.png'),
  'speech-3': require('../../assets/badges/boses-bituin.png'),
  speech_3: require('../../assets/badges/boses-bituin.png'),

  'kaagapay-sa-gawain': require('../../assets/badges/kaagapay-sa-gawain.png'),
  'kaagapay sa gawain': require('../../assets/badges/kaagapay-sa-gawain.png'),
  'group-1': require('../../assets/badges/kaagapay-sa-gawain.png'),
  group_1: require('../../assets/badges/kaagapay-sa-gawain.png'),

  'bituin-ng-kasipagan': require('../../assets/badges/bituin-ng-kasipagan.png'),
  'bituin ng kasipagan': require('../../assets/badges/bituin-ng-kasipagan.png'),
  'xp-100': require('../../assets/badges/bituin-ng-kasipagan.png'),
  xp_100: require('../../assets/badges/bituin-ng-kasipagan.png'),

  'tuklas-kampeon': require('../../assets/badges/tuklas-kampeon.png'),
  'tuklas kampeon': require('../../assets/badges/tuklas-kampeon.png'),
  'level-10': require('../../assets/badges/tuklas-kampeon.png'),
  level_10: require('../../assets/badges/tuklas-kampeon.png'),
};

function normalizeBadgeSlug(value = '') {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeBadgeImageUri(value = '') {
  const uri = String(value || '').trim();

  if (!uri) return '';
  if (/^https?:\/\//i.test(uri)) return uri;
  if (uri.startsWith('/')) return `https://tuklastalino.com${uri}`;

  return '';
}

function getBadgeImageSource(badge = {}) {
  const slugCandidates = [
    typeof badge === 'string' ? badge : null,
    badge?.slug,
    badge?.badge_slug,
    badge?.badgeSlug,
    badge?.id,
    badge?.key,
    badge?.code,
    badge?.badge_code,
    badge?.badgeCode,
    badge?.badge_id,
    badge?.badgeId,
    badge?.name,
    badge?.badge_name,
    badge?.badgeName,
    badge?.title,
    badge?.badge?.slug,
    badge?.badge?.badge_slug,
    badge?.badge?.badgeSlug,
    badge?.badge?.id,
    badge?.badge?.key,
    badge?.badge?.code,
    badge?.badge?.badge_code,
    badge?.badge?.badgeCode,
    badge?.badge?.name,
    badge?.badge?.badge_name,
    badge?.badge?.badgeName,
    badge?.badge?.title,
  ].map(normalizeBadgeSlug).filter(Boolean);

  for (const slug of slugCandidates) {
    if (BADGE_IMAGE_SOURCES[slug]) return BADGE_IMAGE_SOURCES[slug];
  }

  const remoteUri = normalizeBadgeImageUri(
    badge?.imageUrl ||
    badge?.iconUrl ||
    badge?.badgeImageUrl ||
    badge?.image ||
    badge?.iconImage ||
    badge?.badge?.imageUrl ||
    badge?.badge?.iconUrl ||
    ''
  );

  if (remoteUri) return { uri: remoteUri };

  return BADGE_IMAGE_SOURCES['tuklas-kampeon'];
}

export { BADGE_IMAGE_SOURCES, getBadgeImageSource };
export default getBadgeImageSource;
