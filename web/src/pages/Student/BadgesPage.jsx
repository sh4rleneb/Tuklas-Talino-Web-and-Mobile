import { useEffect, useState } from 'react';
import { api } from '../../api/client';

export default function BadgesPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api('/students/dashboard').then(d => api(`/students/${d.student.id}/badges`).then(setData));
  }, []);

  if (!data) return <div className="loading-card">Loading badges...</div>;

  const owned = new Set(data.badges.map(b => b.id));

  return (
    <section>
      <h1>Badges</h1>
      <div className="badge-grid">
        {data.allBadges.map(b => (
          <article className={`badge-card ${owned.has(b.id) ? 'owned' : ''}`} key={b.id}>
            <span>{b.icon}</span>
            <strong>{b.name}</strong>
            <p>{b.description}</p>
            <small>{owned.has(b.id) ? 'Unlocked' : `${b.xpThreshold || 0} XP needed`}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
