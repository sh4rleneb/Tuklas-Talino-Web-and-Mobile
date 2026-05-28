import React from "react";

export default function MissionPlayer({
  data,
  go,
  selectedGameId = "word-match",
  onBack,
  getMissionDemo,
  MissionStyles,
  Grade46StudentChrome,
}) {
  const [missionChoice, setMissionChoice] = useState('');
  const [missionResult, setMissionResult] = useState('');
  const student = data?.student || {};
  const gradeLevel = Number(student?.gradeLevel || 4);
  const early = gradeLevel <= 2;
  const xp = Number(student?.xp || 0);
  const games = missionGamesForStudent(data);
  const selectedGame = games.find(game => game.id === selectedGameId) || games[0];
  const demo = getMissionDemo(selectedGame?.id);
  const locked = selectedGame?.status === 'Locked';

  useEffect(() => {
    setMissionChoice('');
    setMissionResult('');
  }, [selectedGame?.id]);

  const openTab = (tab) => {
    if (tab === 'home') return go('screen-student');
    if (tab === 'lessons') return go('screen-lessons');
    if (tab === 'quizzes') return go('screen-stu-quizzes');
    if (tab === 'missions') return go('screen-stu-missions');
    if (tab === 'groups') return go('screen-stu-groups');
    if (tab === 'profile') return go('screen-stu-profile');
  };

  const backToMissions = () => {
    if (typeof onBack === 'function') {
      onBack();
      return;
    }
    go('screen-stu-missions');
  };

  const checkMissionAnswer = (choice) => {
    if (!demo || locked) return;

    setMissionChoice(choice);
    if (choice === demo.correct) {
      setMissionResult(`✅ ${demo.success} Demo reward: +${selectedGame?.xp || 0} XP preview.`);
    } else {
      setMissionResult('⭐ Hindi pa tama. Subukan muli!');
    }
  };

  const restartDemo = () => {
    setMissionChoice('');
    setMissionResult('');
  };

  const content = (
    <>
      <MissionStyles />

      <div className={`missions-wrap ${early ? 'early' : 'standard'}`}>
        <section className="mission-play-shell">
          <div className="mission-play-card">
            <div className="mission-play-head">
              <div className="mission-play-icon">{selectedGame?.icon || '🎮'}</div>
              <div>
                <h2>{selectedGame?.title || 'Mission'}</h2>
                <p>
                  {locked
                    ? 'This mission is still locked. Complete more lessons or games to unlock it.'
                    : `${selectedGame?.module || 'Filipino'} mission • +${selectedGame?.xp || 0} XP preview • ${selectedGame?.status || 'Available'}`}
                </p>
              </div>
            </div>

            {locked ? (
              <>
                <div className="mission-prompt-box">
                  🔒 Locked mission. Complete {selectedGame?.minCompleted || 3} lessons or missions to unlock this challenge.
                </div>

                <div className="mission-play-actions">
                  <button type="button" className="mission-play-action secondary" onClick={backToMissions}>
                    ← Back to Missions
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mission-prompt-box">
                  <strong>Mission:</strong> {demo?.prompt}
                  <br />
                  <strong>Clue:</strong> {demo?.sample}
                </div>

                <div className="mission-play-options" aria-label="Mission choices">
                  {(demo?.options || []).map(choice => (
                    <button
                      type="button"
                      className={`mission-play-choice ${missionChoice === choice ? 'selected' : ''}`}
                      key={choice}
                      onClick={() => checkMissionAnswer(choice)}
                    >
                      {choice}
                    </button>
                  ))}
                </div>

                {missionResult && (
                  <div className={`mission-result ${missionResult.includes('✅') ? 'good' : ''}`}>
                    {missionResult}
                  </div>
                )}

                <div className="mission-play-actions">
                  <button type="button" className="mission-play-action secondary" onClick={backToMissions}>
                    ← Back to Missions
                  </button>
                  <button type="button" className="mission-play-action" onClick={restartDemo}>
                    🔄 Restart
                  </button>
                  <button type="button" className="mission-play-action purple" onClick={() => openTab('lessons')}>
                    📖 Go to Lessons
                  </button>
                </div>

                <p style={{ margin: '18px 0 0', color: '#526988', fontWeight: 850 }}>
                  Frontend demo only: XP is previewed here. Real mission completion, saved XP, streaks, and badge unlocks can be connected to backend routes later.
                </p>
              </>
            )}
          </div>
        </section>
      </div>
    </>
  );

  if (early) {
    return (
      <>
        <EarlyStudentSubpageStyles />
        <div className="g12-page">
          <header className="g12-topbar">
            <button type="button" className="g12-brand" onClick={backToMissions}>
              <span className="g12-brand-icon">{selectedGame?.icon || '🎮'}</span>
              <span>{selectedGame?.title || 'Mission'}</span>
            </button>

            <div className="g12-top-actions">
              <div className="g12-pill">🌸 Grade {student.gradeLevel || '—'} • {student.section || '—'}</div>
              <div className="g12-pill">⚡ {xp} XP</div>
              <button type="button" className="g12-action-btn" onClick={backToMissions}>🎮 Missions</button>
              <button type="button" className="g12-action-btn" onClick={() => go('screen-student')}>🏠 Home</button>
            </div>
          </header>

          <main className="g12-shell g12-subpage-shell g12-mission-play-nohero">
            {content}
          </main>

          <nav className="g12-nav g12-mission-play-nav" aria-label="Student navigation">
            <button type="button" onClick={() => openTab('home')}><span className="g12-nav-icon">🏠</span>Home</button>
            <button type="button" onClick={() => openTab('lessons')}><span className="g12-nav-icon">📖</span>Lessons</button>
            <button type="button" className="active" onClick={() => openTab('missions')}><span className="g12-nav-icon">🎮</span>Missions</button>
            <button type="button" onClick={() => openTab('groups')}><span className="g12-nav-icon">👥</span>Groups</button>
            <button type="button" onClick={() => openTab('profile')}><span className="g12-nav-icon">🐰</span>Profile</button>
          </nav>
        </div>
      </>
    );
  }

  return (
    <Grade46StudentChrome
      data={data}
      activeTab="missions"
      go={go}
      icon={selectedGame?.icon || '🎮'}
      title={selectedGame?.title || 'Mission'}
      subtitle={`${selectedGame?.module || 'Filipino'} mission • +${selectedGame?.xp || 0} XP preview`}
      titleAction={<button type="button" className="g46-ref-soft-btn" onClick={backToMissions}>← Missions</button>}
    >
      {content}
    </Grade46StudentChrome>
  );
}