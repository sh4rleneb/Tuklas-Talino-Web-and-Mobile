import React from "react";
import { MISSION_GAMES, MissionStyles as ImportedMissionStyles } from "../../components/student/missions/MissionUI";

function fallbackAsArray(value) {
  return Array.isArray(value) ? value : [];
}

function fallbackLevelForXp(xp = 0) {
  const value = Number(xp || 0);
  return Math.max(1, Math.floor(value / 100) + 1);
}

function fallbackXpPercent(xp = 0) {
  const value = Number(xp || 0);
  return Math.max(0, Math.min(100, value % 100));
}

function FallbackStudentChrome({ children }) {
  return <>{children}</>;
}


export default function MissionsPage({
  data,
  go,
  onPlayMission,
  levelForXp = fallbackLevelForXp,
  xpPercent = fallbackXpPercent,
  asArray = fallbackAsArray,
  MissionStyles = ImportedMissionStyles,
  EarlyStudentChrome = FallbackStudentChrome,
  Grade46StudentChrome = FallbackStudentChrome,
}) {
 if (!data) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "32px",
        background: "#eefbf3",
        color: "#203451",
        fontFamily: "inherit",
      }}
    >
      <div
        style={{
          maxWidth: "520px",
          width: "100%",
          padding: "28px",
          borderRadius: "28px",
          background: "#ffffff",
          boxShadow: "0 18px 40px rgba(31, 73, 61, 0.12)",
          textAlign: "center",
        }}
      >
        <h2 style={{ margin: "0 0 10px", fontSize: "32px" }}>
          Loading Missions...
        </h2>
        <p style={{ margin: 0, fontWeight: 700 }}>
          Please wait while Tuklas Talino prepares your learning missions.
        </p>
      </div>
    </div>
  );
}
  const student = data?.student || {};
  const gradeLevel = Number(student?.gradeLevel || 4);
  const early = gradeLevel <= 2;
  const xp = Number(student?.xp || 0);
  const level = data?.level || levelForXp(xp);
  const xpPct = xpPercent(xp);
  const completedLessons = asArray(data?.lessons).filter(lesson => lesson?.completed).length;
  const badgeCount = asArray(data?.badges).length;
  const games = missionGamesForStudent(data);
  const availableCount = games.filter(game => game.status !== 'Locked').length;
  const completedCount = games.filter(game => game.status === 'Completed').length;
  const nextBadgeProgress = Math.min(3, completedLessons);

  const openTab = (tab) => {
    if (tab === 'home') return go('screen-student');
    if (tab === 'lessons') return go('screen-lessons');
    if (tab === 'quizzes') return go('screen-stu-quizzes');
    if (tab === 'missions') return go('screen-stu-missions');
    if (tab === 'groups') return go('screen-stu-groups');
    if (tab === 'profile') return go('screen-stu-profile');
  };

  const playMission = (game) => {
    if (!game || game.status === 'Locked') return;
    if (typeof onPlayMission === 'function') {
      onPlayMission(game.id);
      return;
    }
    go('screen-stu-mission-play');
  };

  const content = (
    <>
      <MissionStyles />

      <div className={`missions-wrap ${early ? 'early' : 'standard'}`}>
        <section className="missions-hero">
          <div className="missions-hero-copy">
            <div className="missions-hero-icon">🚀</div>
            <h2>{early ? 'Tuklas Missions' : 'Learning Games'}</h2>
            <p>
              {early
                ? 'Pumili ng game at pindutin ang Play. Sagutin ang challenge para sa XP preview!'
                : 'A separate game-based Filipino learning area where each card opens its own mission screen for vocabulary, reading, writing, comprehension, and oral communication practice.'}
            </p>
          </div>

          <div className="missions-progress-card">
            <strong>🪙 {xp} XP • Level {level}</strong>
            <div className="missions-progress-track">
              <span className="missions-progress-fill" style={{ width: `${Math.max(6, xpPct)}%` }} />
            </div>
            <p style={{ margin: '12px 0 0', color: '#526988', fontWeight: 850 }}>
              {100 - xpPct} XP pa bago ang susunod na level.
            </p>
          </div>
        </section>

        <section className="missions-stat-grid" aria-label="Mission progress summary">
          <div className="missions-stat-card"><b>{availableCount}</b><span>Available games</span></div>
          <div className="missions-stat-card"><b>{completedCount}</b><span>Completed missions</span></div>
          <div className="missions-stat-card"><b>{badgeCount}</b><span>Unlocked badges</span></div>
          <div className="missions-stat-card"><b>{nextBadgeProgress}/3</b><span>Badge challenge</span></div>
        </section>

        <section className="missions-section">
          <div className="missions-section-head">
            <div>
              <h3>🎮 Available Learning Games</h3>
              <p>Tap Play and Earn XP points!</p>
            </div>
          </div>

          <div className="missions-game-grid">
            {games.map(game => {
              const locked = game.status === 'Locked';

              return (
                <button
                  type="button"
                  className={`missions-game-card ${game.tone} ${locked ? 'locked' : ''}`}
                  key={game.id}
                  onClick={() => playMission(game)}
                  disabled={locked}
                >
                  <div>
                    <div className="missions-game-top">
                      <span className="missions-game-icon">{game.icon}</span>
                      <span className="missions-status">{game.status}</span>
                    </div>
                    <h4>{game.title}</h4>
                    <p>{game.short}</p>
                    <div className="missions-tag-row">
                      <span className="missions-tag">{game.module}</span>
                      <span className="missions-tag">+{game.xp} XP</span>
                    </div>
                  </div>

                  <span
                    className={`missions-play-btn ${locked ? 'locked' : ''}`}
                    role="button"
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    {locked ? '🔒 Locked' : '▶ Play'}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="missions-badge-card">
          <h3>🏅 Badge Preview</h3>
          <p>Keep playing learning games to unlock more rewards and stay motivated.</p>
          <div className="missions-badge-preview-row">
            <div className="missions-badge-preview"><div><span>🔤</span>Bokabularyo Star</div></div>
            <div className="missions-badge-preview"><div><span>📖</span>Pagbasa Hero</div></div>
            <div className="missions-badge-preview"><div><span>🎙️</span>Oral Champ</div></div>
          </div>
        </section>
      </div>
    </>
  );

  if (early) {
    return (
      <EarlyStudentChrome
        data={data}
        activeTab="missions"
        go={go}
        icon="🎮"
        title="Tuklas Missions"
        subtitle=""
      >
        {content}
      </EarlyStudentChrome>
    );
  }

  return (
    <Grade46StudentChrome
      data={data}
      activeTab="missions"
      go={go}
      icon="🎮"
      title="Tuklas Missions"
      subtitle="Play Filipino learning games connected to vocabulary, reading, writing, comprehension, and oral communication."
    >
      {content}
    </Grade46StudentChrome>
  );
}
