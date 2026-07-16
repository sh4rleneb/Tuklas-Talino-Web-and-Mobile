import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import StatCard from '../../components/StatCard';
import ProgressBar from '../../components/ProgressBar';

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


const STUDENT_SUBJECT_DISPLAY_LABELS = {
  'Oral Comm': 'Komunikasyong Pagsasalita',
  'Oral Communication': 'Komunikasyong Pagsasalita',
  'Komunikasyong Pagsasalita': 'Komunikasyong Pagsasalita',
  'Pasalitang Komunikasyon': 'Komunikasyong Pagsasalita',
};

function formatStudentSubjectDisplay(subject) {
  const value = String(subject || '').trim();
  return STUDENT_SUBJECT_DISPLAY_LABELS[value] || subject || 'Filipino';
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

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/students/dashboard').then(setData).catch(err => setError(err.message));
  }, []);

  if (error) return <div className="alert error">{error}</div>;
  if (!data) return <div className="loading-card">Inihahanda ang iyong mapa ng pag-aaral...</div>;

  const playful = data.student.gradeLevel <= 2 ? 'playful' : 'senior';

  return (
    <section className={`dashboard ${playful}`}>
      <div className="welcome-card">
        <div className="avatar-xl">{data.student.avatar}</div>
        <div>
          <p className="eyebrow">Baitang {data.student.gradeLevel} • {data.student.section}</p>
          <h1>Kumusta, {data.student.name}!</h1>
          <p>Ipagpatuloy ang iyong paglalakbay sa Filipino.</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon="⭐" label="XP" value={data.student.xp} tone="yellow" />
        <StatCard icon="🏆" label="Level" value={data.level} tone="blue" />
        <StatCard icon="✅" label="Mga Natapos na Aralin" value={`${data.progress.completedLessons}/${data.progress.totalLessons}`} tone="green" />
      </div>

      <ProgressBar value={data.progress.percent} label="Pag-unlad sa mga Aralin" />

      <div className="section-heading">
        <h2>Mga Inirerekomendang Aralin</h2>
        <Link to="/student/lessons" className="btn ghost">Tingnan Lahat</Link>
      </div>
      <div className="lesson-grid">
        {data.lessons.slice(0, 6).map(lesson => (
          <Link className={`lesson-card ${lesson.completed ? 'done' : ''}`} to={`/student/lessons/${lesson.id}`} key={lesson.id}>
            <span>{lesson.subject === 'Pagbasa' ? '📖' : lesson.subject === 'Bokabularyo' ? '🔤' : lesson.subject === 'Panitikan' ? '📜' : formatStudentSubjectDisplay(lesson.subject) === 'Komunikasyong Pagsasalita' ? '🎙️' : '✍️'}</span>
            <strong>{lesson.title}</strong>
            <small>{formatStudentSubjectDisplay(lesson.subject)} • {lesson.xpReward} XP</small>
          </Link>
        ))}
      </div>

      <div className="section-heading"><h2>Mga Gantimpala</h2><Link to="/student/badges">Tingnan ang mga gantimpala</Link></div>
      <div className="badge-row">
        {data.badges.length ? data.badges.map(b => <span className="badge-chip" key={b.id}><BadgeVisual badge={b} /> {b.name}</span>) : <p className="empty">Tapusin ang mga aralin upang mabuksan ang mga gantimpala.</p>}
      </div>
    </section>
  );
}