import { useEffect, useState } from 'react';
import { api } from '../../api/client';

const TUKLAS_KAAGAPAY_BADGE_IMAGE = '/badges/kaagapay-sa-gawain.png';
const TUKLAS_BITUIN_BADGE_IMAGE = '/badges/bituin-sa-pagsagot.png';
const TUKLAS_HENYO_BADGE_IMAGE = '/badges/henyo-sa-pagsusulit.png';

function isTuklasKaagapayBadge(badge) {
  const name = String(badge?.name || '').trim().toLowerCase();
  const code = String(badge?.code || '').trim().toLowerCase();
  return name === 'kaagapay sa gawain' || code === 'group_1' || code.includes('kaagapay');
}

const TUKLAS_BADGE_IMAGE_BY_CODE = {
  first_lesson: '/badges/unang-hakbang.png',
  firstlesson: '/badges/unang-hakbang.png',
  reader: '/badges/batang-mambabasa.png',
  reader_3: '/badges/batang-mambabasa.png',
  quiz_perfect: '/badges/henyo-sa-pagsusulit.png',
  writing_3: '/badges/bituin-sa-pagsagot.png',
  speech_3: '/badges/boses-bituin.png',
  group_1: '/badges/kaagapay-sa-gawain.png',
  xp_100: '/badges/bituin-ng-kasipagan.png',
  level_10: '/badges/tuklas-kampeon.png',
};

const TUKLAS_BADGE_IMAGE_BY_NAME = {
  'unang hakbang': '/badges/unang-hakbang.png',
  'batang mambabasa': '/badges/batang-mambabasa.png',
  'henyo sa pagsusulit': '/badges/henyo-sa-pagsusulit.png',
  'bituin sa pagsagot': '/badges/bituin-sa-pagsagot.png',
  'boses bituin': '/badges/boses-bituin.png',
  'kaagapay sa gawain': '/badges/kaagapay-sa-gawain.png',
  'bituin ng kasipagan': '/badges/bituin-ng-kasipagan.png',
  'tuklas kampeon': '/badges/tuklas-kampeon.png',
};

function getTuklasBadgeImage(badge) {
  const name = String(badge?.name || '').trim().toLowerCase();
  const code = String(badge?.code || '').trim().toLowerCase();
  return TUKLAS_BADGE_IMAGE_BY_CODE[code] || TUKLAS_BADGE_IMAGE_BY_NAME[name] || '';
}

function isTuklasHenyoBadge(badge) {
  const name = String(badge?.name || '').trim().toLowerCase();
  const code = String(badge?.code || '').trim().toLowerCase();
  return name === 'henyo sa pagsusulit' || code === 'quiz_perfect';
}

function isTuklasBituinBadge(badge) {
  const name = String(badge?.name || '').trim().toLowerCase();
  const code = String(badge?.code || '').trim().toLowerCase();
  return name === 'bituin sa pagsagot' || code === 'writing_3' || code.includes('writing') || code.includes('sagot');
}

function TuklasBadgeVisual({ badge, fallback = '🏅', size = 72 }) {
  const mappedTuklasBadgeImage = getTuklasBadgeImage(badge);
  if (mappedTuklasBadgeImage) {
    return (
      <img
        src={mappedTuklasBadgeImage}
        alt={badge?.name || 'Gantimpala'}
        style={{ width: size, height: size, objectFit: 'contain', display: 'inline-block' }}
      />
    );
  }

  if (isTuklasHenyoBadge(badge)) {
    return (
      <img
        src={TUKLAS_HENYO_BADGE_IMAGE}
        alt={badge?.name || 'Henyo sa Quizzes'}
        style={{ width: size, height: size, objectFit: 'contain', display: 'inline-block' }}
      />
    );
  }

  if (isTuklasBituinBadge(badge)) {
    return (
      <img
        src={TUKLAS_BITUIN_BADGE_IMAGE}
        alt={badge?.name || 'Bituin sa Pagsagot'}
        style={{ width: size, height: size, objectFit: 'contain', display: 'inline-block' }}
      />
    );
  }

  if (isTuklasKaagapayBadge(badge)) {
    return (
      <img
        src={TUKLAS_KAAGAPAY_BADGE_IMAGE}
        alt={badge?.name || 'Kaagapay sa Gawain'}
        style={{ width: size, height: size, objectFit: 'contain', display: 'inline-block' }}
      />
    );
  }

  return <>{badge?.icon || fallback}</>;
}


const KAAGAPAY_BADGE_IMAGE = '/badges/kaagapay-sa-gawain.png';
const BITUIN_BADGE_IMAGE = '/badges/bituin-sa-pagsagot.png';

function isKaagapayBadge(badge) {
  const name = String(badge?.name || '').trim().toLowerCase();
  const code = String(badge?.code || '').trim().toLowerCase();
  return name === 'kaagapay sa gawain' || code.includes('kaagapay');
}

const BADGE_IMAGE_BY_CODE = {
  first_lesson: '/badges/unang-hakbang.png',
  firstlesson: '/badges/unang-hakbang.png',
  reader: '/badges/batang-mambabasa.png',
  reader_3: '/badges/batang-mambabasa.png',
  quiz_perfect: '/badges/henyo-sa-pagsusulit.png',
  writing_3: '/badges/bituin-sa-pagsagot.png',
  speech_3: '/badges/boses-bituin.png',
  group_1: '/badges/kaagapay-sa-gawain.png',
  xp_100: '/badges/bituin-ng-kasipagan.png',
  level_10: '/badges/tuklas-kampeon.png',
};

const BADGE_IMAGE_BY_NAME = {
  'unang hakbang': '/badges/unang-hakbang.png',
  'batang mambabasa': '/badges/batang-mambabasa.png',
  'henyo sa pagsusulit': '/badges/henyo-sa-pagsusulit.png',
  'bituin sa pagsagot': '/badges/bituin-sa-pagsagot.png',
  'boses bituin': '/badges/boses-bituin.png',
  'kaagapay sa gawain': '/badges/kaagapay-sa-gawain.png',
  'bituin ng kasipagan': '/badges/bituin-ng-kasipagan.png',
  'tuklas kampeon': '/badges/tuklas-kampeon.png',
};

function getBadgeImage(badge) {
  const name = String(badge?.name || '').trim().toLowerCase();
  const code = String(badge?.code || '').trim().toLowerCase();
  return BADGE_IMAGE_BY_CODE[code] || BADGE_IMAGE_BY_NAME[name] || '';
}

function isHenyoBadge(badge) {
  const name = String(badge?.name || '').trim().toLowerCase();
  const code = String(badge?.code || '').trim().toLowerCase();
  return name === 'henyo sa pagsusulit' || code === 'quiz_perfect';
}

function isBituinBadge(badge) {
  const name = String(badge?.name || '').trim().toLowerCase();
  const code = String(badge?.code || '').trim().toLowerCase();
  return name === 'bituin sa pagsagot' || code === 'writing_3' || code.includes('writing') || code.includes('sagot');
}

function BadgeVisual({ badge }) {
  const mappedBadgeImage = getBadgeImage(badge);
  if (mappedBadgeImage) {
    return (
      <img
        src={mappedBadgeImage}
        alt={badge?.name || 'Gantimpala'}
        style={{ width: 56, height: 56, objectFit: 'contain', display: 'inline-block' }}
      />
    );
  }

  if (isHenyoBadge(badge)) {
    return (
      <img
        src={HENYO_BADGE_IMAGE}
        alt={badge?.name || 'Henyo sa Quizzes'}
        style={{ width: 56, height: 56, objectFit: 'contain', display: 'inline-block' }}
      />
    );
  }

  if (isBituinBadge(badge)) {
    return (
      <img
        src={BITUIN_BADGE_IMAGE}
        alt={badge?.name || 'Bituin sa Pagsagot'}
        style={{ width: 56, height: 56, objectFit: 'contain', display: 'inline-block' }}
      />
    );
  }

  if (isKaagapayBadge(badge)) {
    return (
      <img
        src={KAAGAPAY_BADGE_IMAGE}
        alt={badge?.name || 'Kaagapay sa Gawain'}
        style={{ width: 56, height: 56, objectFit: 'contain', display: 'inline-block' }}
      />
    );
  }

  return <>{badge?.icon}</>;
}

export default function BadgesPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api('/students/dashboard').then(d => api(`/students/${d.student.id}/badges`).then(setData));
  }, []);

  if (!data) return <div className="loading-card">Inihahanda ang mga gantimpala...</div>;

  const owned = new Set(data.badges.map(b => b.id));

  return (
    <section>
      <h1>Mga Gantimpala</h1>
      <div className="badge-grid">
        {data.allBadges.map(b => (
          <article className={`badge-card ${owned.has(b.id) ? 'owned' : ''}`} key={b.id}>
            <span><BadgeVisual badge={b} /></span>
            <strong>{b.name}</strong>
            <p>{b.description}</p>
            <small>{owned.has(b.id) ? 'Nakuha na' : `${b.xpThreshold || 0} XP kailangan`}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
