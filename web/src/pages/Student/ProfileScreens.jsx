import React from 'react';
import { SUBJECTS } from '../../constants/studentConstants';
import { asArray, fmtDate, levelForXp, masteryFromPercent, subjectTheme, xpPercent } from '../../utils/studentHelpers';
import { ProgressBar, Stat } from '../../components/common/CommonUI';

export function EarlyBadgesScreen({ data, go }) {
  const badges = data?.badges || [];
  const s = data?.student || {};

  return (
    <EarlyStudentChrome
      data={data}
      activeTab="badges"
      go={go}
      icon="🏅"
      title="Badges"
      subtitle="Makikita dito ang rewards na nakuha mo sa lessons at activities."
    >
      <section className="g12-section-card">
        <div className="g12-section-head">
          <div>
            <h2 className="g12-section-title">🌟 Achievements</h2>
            <p className="g12-section-subtitle">{badges.length} badge{badges.length === 1 ? '' : 's'} unlocked • {s.xp || 0} XP</p>
          </div>
        </div>

        {badges.length ? (
          <div className="g12-badge-grid">
            {badges.map(badge => (
              <div className="g12-badge-card" key={badge.id || badge.name}>
                <div>
                  <div className="g12-badge-big">{badge.icon || '🏅'}</div>
                  <strong>{badge.name || 'Badge'}</strong>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="g12-empty">Wala pang badge. Tapusin ang lessons para makakuha!</div>
        )}
      </section>
    </EarlyStudentChrome>
  );
}

export function StudentBadges({ data, go }) {
  const early = Number(data?.student?.gradeLevel || 4) <= 2;

  if (early) {
    return <EarlyBadgesScreen data={data} go={go} />;
  }

  const badges = data?.badges || [];

  return (
    <Grade46StudentChrome
      data={data}
      activeTab="profile"
      go={go}
      icon="🏅"
      title="Badges"
      subtitle="Rewards and achievements from lessons, missions, and activities."
    >
      <section className="g46-ref-panel">
        <div className="g46-ref-panel-head">
          <div>
            <h2>Achievements</h2>
            <p className="g46-ref-muted">{badges.length} badge{badges.length === 1 ? '' : 's'} unlocked • {data?.student?.xp || 0} XP</p>
          </div>
        </div>

        {badges.length ? (
          <div className="g46-ref-badge-grid">
            {badges.map(badge => (
              <div className="g46-ref-badge" key={badge.id || badge.name}>
                <div><span>{badge.icon || '🏅'}</span>{badge.name || 'Badge'}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="g46-ref-empty">Wala pang badge. Tapusin ang lessons para makakuha!</div>
        )}
      </section>
    </Grade46StudentChrome>
  );
}

export function EarlyProfileScreen({ data, selectedAvatar, updateAvatar, go }) {
  const s = data?.student || {};

  return (
    <EarlyStudentChrome
      data={data}
      activeTab="profile"
      go={go}
      icon="🐰"
      title="Profile"
      subtitle="Piliin ang avatar mo at tingnan ang learning summary."
    >
      <section className="g12-section-card">
        <div className="g12-section-head">
          <div>
            <h2 className="g12-section-title">🐰 Avatar</h2>
            <p className="g12-section-subtitle">Piliin ang avatar na gusto mong gamitin sa account mo.</p>
          </div>
        </div>

        <div className="g12-avatar-grid">
          {AVATARS.map(avatar => (
            <button
              key={avatar}
              type="button"
              className={`g12-avatar-choice ${selectedAvatar === avatar ? 'selected' : ''}`}
              onClick={() => updateAvatar(avatar)}
              aria-label={`Choose avatar ${avatar}`}
            >
              {avatar}
            </button>
          ))}
        </div>
      </section>

      <section className="g12-section-card">
        <div className="g12-section-head">
          <div>
            <h2 className="g12-section-title">📊 Summary</h2>
            <p className="g12-section-subtitle">Basic profile and progress information.</p>
          </div>
        </div>

        <div className="g12-summary-grid">
          <div className="g12-summary-box"><span>👤</span><div><b>{s.name || '—'}</b><small>Name</small></div></div>
          <div className="g12-summary-box"><span>🎒</span><div><b>Grade {s.gradeLevel || '—'}</b><small>Grade</small></div></div>
          <div className="g12-summary-box"><span>🌸</span><div><b>{s.section || '—'}</b><small>Section</small></div></div>
          <div className="g12-summary-box"><span>⚡</span><div><b>{s.xp || 0} XP</b><small>XP</small></div></div>
        </div>
      </section>
    </EarlyStudentChrome>
  );
}

export function StudentProfile({ data, selectedAvatar, updateAvatar, go }) {
  const early = Number(data?.student?.gradeLevel || 4) <= 2;

  if (early) {
    return <EarlyProfileScreen data={data} selectedAvatar={selectedAvatar} updateAvatar={updateAvatar} go={go} />;
  }

  const s = data?.student || {};

  return (
    <Grade46StudentChrome
      data={data}
      activeTab="profile"
      go={go}
      icon="👤"
      title="Profile"
      subtitle="Piliin ang avatar mo at tingnan ang learning summary."
    >
      <section className="g46-ref-panel">
        <div className="g46-ref-panel-head">
          <div>
            <h2>Avatar</h2>
            <p className="g46-ref-muted">Piliin ang avatar na gusto mong gamitin sa account mo.</p>
          </div>
        </div>

        <div className="g46-ref-avatar-grid">
          {AVATARS.map(avatar => (
            <button
              key={avatar}
              type="button"
              className={`g46-ref-avatar-choice ${selectedAvatar === avatar ? 'selected' : ''}`}
              onClick={() => updateAvatar(avatar)}
              aria-label={`Choose avatar ${avatar}`}
            >
              {avatar}
            </button>
          ))}
        </div>
      </section>

      <section className="g46-ref-panel">
        <div className="g46-ref-panel-head">
          <div>
            <h2>Summary</h2>
            <p className="g46-ref-muted">Basic profile and progress information.</p>
          </div>
        </div>

        <div className="g46-ref-card-grid">
          <div className="g46-ref-card green"><span className="g46-ref-card-icon">👤</span><h4>{s.name || '—'}</h4><p>Name</p></div>
          <div className="g46-ref-card yellow"><span className="g46-ref-card-icon">🎒</span><h4>Grade {s.gradeLevel || '—'}</h4><p>Grade</p></div>
          <div className="g46-ref-card blue"><span className="g46-ref-card-icon">🌸</span><h4>{s.section || '—'}</h4><p>Section</p></div>
          <div className="g46-ref-card purple"><span className="g46-ref-card-icon">⚡</span><h4>{s.xp || 0} XP</h4><p>XP</p></div>
        </div>
      </section>
    </Grade46StudentChrome>
  );
}
