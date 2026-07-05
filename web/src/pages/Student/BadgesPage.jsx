import { useEffect, useState } from 'react';
import { api } from '../../api/client';

const TUKLAS_KAAGAPAY_BADGE_IMAGE = '/badges/kaagapay-sa-gawain.png';

function isTuklasKaagapayBadge(badge) {
  const name = String(badge?.name || '').trim().toLowerCase();
  const code = String(badge?.code || '').trim().toLowerCase();
  return name === 'kaagapay sa gawain' || code === 'group_1' || code.includes('kaagapay');
}

function TuklasBadgeVisual({ badge, fallback = '🏅', size = 72 }) {
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

function isKaagapayBadge(badge) {
  const name = String(badge?.name || '').trim().toLowerCase();
  const code = String(badge?.code || '').trim().toLowerCase();
  return name === 'kaagapay sa gawain' || code.includes('kaagapay');
}

function BadgeVisual({ badge }) {
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

  if (!data) return <div className="loading-card">Loading badges...</div>;

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
