import React from 'react';
import { asArray } from '../../utils/studentHelpers';

export function EarlyGroupsScreen({ data, go, completeGroupTask }) {
  const groups = data?.groups || [];
  const roles = rolesForGradeLevel(data?.student?.gradeLevel);
  const [selectedRoles, setSelectedRoles] = useState({});
  const [doneTasks, setDoneTasks] = useState({});
  const [taskFeelings, setTaskFeelings] = useState({});

  async function markTaskDone(taskId) {
    setDoneTasks(prev => ({ ...prev, [taskId]: true }));
    await completeGroupTask(taskId);
  }

  return (
    <EarlyStudentChrome
      data={data}
      activeTab="groups"
      go={go}
      icon="👥"
      title="Team Missions"
      subtitle="Pumili ng role, gawin ang task, at tulungan ang iyong grupo."
    >
      <style>{`
        .g12-team-path { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 18px 0; }
        .g12-team-step { min-height: 76px; border-radius: 24px; padding: 12px; background: #ffffff; border: 2px solid rgba(21,150,90,0.12); display: grid; place-items: center; text-align: center; color: #14223b; font-weight: 1000; }
        .g12-role-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 14px; }
        .g12-role-choice { border: 0; min-height: 104px; border-radius: 28px; padding: 14px; background: #ffffff; box-shadow: inset 0 0 0 2px rgba(21,150,90,0.10); cursor: pointer; text-align: center; color: #14223b; font-weight: 1000; }
        .g12-role-choice.selected { background: #fff5cf; box-shadow: inset 0 0 0 4px rgba(246,196,83,0.34), 0 8px 0 rgba(246,196,83,0.44); }
        .g12-role-choice span { display: block; font-size: 36px; margin-bottom: 6px; }
        .g12-feeling-row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
        .g12-feeling-row button { border: 0; min-height: 48px; padding: 0 16px; border-radius: 18px; background: #ffffff; color: #14223b; font-size: 16px; font-weight: 1000; cursor: pointer; box-shadow: inset 0 0 0 1px rgba(21,150,90,0.14); }
        .g12-feeling-row button.selected { background: #edf8f1; color: #0f7d49; box-shadow: inset 0 0 0 3px rgba(21,150,90,0.18); }
      `}</style>

      <section className="g12-section-card">
        <div className="g12-section-head">
          <div>
            <h2 className="g12-section-title">👥 Team Missions</h2>
            <p className="g12-section-subtitle">Mas malinaw na ngayon ang gagawin: role → activity → self-check.</p>
          </div>
        </div>

        <div className="g12-team-path" aria-label="Group mission steps">
          <div className="g12-team-step">1️⃣ Pumili ng Role</div>
          <div className="g12-team-step">2️⃣ Gawin ang Task</div>
          <div className="g12-team-step">3️⃣ Sabihin kung kaya</div>
        </div>

        <div className="g12-card-grid">
          {groups.map(group => (
            <div className="g12-group-card" key={group.id}>
              <h3>👥 {group.name}</h3>
              <p className="g12-muted">{group.description || 'Team mission para sa Filipino practice.'}</p>

              <div className="g12-role-grid">
                {roles.map(role => (
                  <button
                    type="button"
                    key={`${group.id}-${role.id}`}
                    className={`g12-role-choice ${selectedRoles[group.id] === role.id ? 'selected' : ''}`}
                    onClick={() => setSelectedRoles(prev => ({ ...prev, [group.id]: role.id }))}
                  >
                    <span>{role.icon}</span>
                    {role.label}
                    <small style={{ display: 'block', marginTop: 6, color: '#526988', lineHeight: 1.3 }}>{role.helper}</small>
                  </button>
                ))}
              </div>

              {(group.tasks || []).map(task => {
                const pct = taskCompletionPercent(task, doneTasks[task.id]);
                return (
                  <div className="g12-task-card" key={task.id}>
                    <div className="g12-task-icon">{doneTasks[task.id] ? '🎉' : '🧩'}</div>
                    <div>
                      <h3 style={{ fontSize: 24, marginBottom: 6 }}>{task.title}</h3>
                      <p className="g12-muted">Due: {fmtDate(task.dueAt)} • +{task.xpReward || 0} XP</p>
                      <div className="g12-module-progress" style={{ marginTop: 10 }}><span style={{ width: `${pct}%` }} /></div>
                      <div className="g12-feeling-row">
                        {['😊 Madali', '😐 Sakto', '🙋 Help po'].map(choice => (
                          <button
                            type="button"
                            key={choice}
                            className={taskFeelings[task.id] === choice ? 'selected' : ''}
                            onClick={() => setTaskFeelings(prev => ({ ...prev, [task.id]: choice }))}
                          >
                            {choice}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button type="button" className="g12-main-btn" onClick={() => markTaskDone(task.id)}>
                      {doneTasks[task.id] ? 'Done' : 'Tapos na'}
                    </button>
                  </div>
                );
              })}

              {!(group.tasks || []).length && (
                <div className="g12-empty" style={{ marginTop: 14 }}>Wala pang team mission para sa grupong ito.</div>
              )}
            </div>
          ))}
        </div>

        {!groups.length && (
          <div className="g12-empty">No group tasks yet.</div>
        )}
      </section>
    </EarlyStudentChrome>
  );
}

export function StudentGroups({ data, go, completeGroupTask }) {
  const early = Number(data?.student?.gradeLevel || 4) <= 2;
  const groups = data?.groups || [];
  const roles = rolesForGradeLevel(data?.student?.gradeLevel);
  const [selectedRoles, setSelectedRoles] = useState({});
  const [taskNotes, setTaskNotes] = useState({});
  const [taskRatings, setTaskRatings] = useState({});
  const [submittedTasks, setSubmittedTasks] = useState({});

  if (early) {
    return <EarlyGroupsScreen data={data} go={go} completeGroupTask={completeGroupTask} />;
  }

  async function submitGroupTask(taskId) {
    setSubmittedTasks(prev => ({ ...prev, [taskId]: true }));
    await completeGroupTask(taskId);
  }

  return (
    <Grade46StudentChrome
      data={data}
      activeTab="groups"
      go={go}
      icon="👥"
      title="Group Collaboration"
      subtitle="Choose a role, submit group output, and record your contribution."
    >
      <section className="g46-ref-panel">
        <div className="g46-ref-panel-head">
          <div>
            <h2>Group Tasks</h2>
            <p className="g46-ref-muted">Teachers can judge collaboration better when students show role, output, and contribution evidence.</p>
          </div>
        </div>

        {groups.map(group => (
          <div className="g46-ref-panel" key={group.id} style={{ marginBottom: 14, boxShadow: 'none', background: '#fbfefc' }}>
            <div className="g46-ref-panel-head">
              <div>
                <h3>👥 {group.name}</h3>
                <p className="g46-ref-muted">{group.description || 'Collaborative Filipino task.'}</p>
              </div>
              <span className="g46-ref-tag">{group.tasks?.length || 0} task{(group.tasks?.length || 0) === 1 ? '' : 's'}</span>
            </div>

            <div className="g46-ref-filter-row" style={{ marginBottom: 14 }}>
              {roles.map(role => (
                <button
                  type="button"
                  key={`${group.id}-${role.id}`}
                  className={selectedRoles[group.id] === role.id ? 'active' : ''}
                  onClick={() => setSelectedRoles(prev => ({ ...prev, [group.id]: role.id }))}
                  title={role.helper}
                >
                  {role.icon} {role.label}
                </button>
              ))}
            </div>

            {(group.tasks || []).map(task => {
              const pct = taskCompletionPercent(task, submittedTasks[task.id]);
              const band = effectivenessBand(pct);
              return (
                <div className="g46-ref-task-row" key={task.id} style={{ gridTemplateColumns: '58px minmax(0, 1fr)', alignItems: 'start' }}>
                  <span className="g46-ref-card-icon">{submittedTasks[task.id] ? '✅' : '📝'}</span>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div>
                        <h3 style={{ fontSize: 26, marginBottom: 6 }}>{task.title}</h3>
                        <p className="g46-ref-muted" style={{ margin: 0 }}>Due: {fmtDate(task.dueAt)} • +{task.xpReward || 0} XP • {band.icon} {band.label}</p>
                      </div>
                      <button type="button" className="g46-ref-primary-btn" onClick={() => submitGroupTask(task.id)}>
                        {submittedTasks[task.id] ? 'Submitted' : 'Submit Task'}
                      </button>
                    </div>

                    <div className="g46-ref-mini-track" style={{ marginTop: 12 }}><span style={{ width: `${pct}%` }} /></div>

                    <textarea
                      className="input-field"
                      rows="3"
                      value={taskNotes[task.id] || ''}
                      onChange={(e) => setTaskNotes(prev => ({ ...prev, [task.id]: e.target.value }))}
                      placeholder="Write your group answer, summary, or contribution note here..."
                      style={{ marginTop: 12, minHeight: 92 }}
                    />

                    <div className="g46-ref-filter-row" style={{ marginTop: 12, marginBottom: 0 }}>
                      {['I helped a lot', 'I helped some', 'I need to participate more'].map(choice => (
                        <button
                          type="button"
                          key={choice}
                          className={taskRatings[task.id] === choice ? 'active' : ''}
                          onClick={() => setTaskRatings(prev => ({ ...prev, [task.id]: choice }))}
                        >
                          {choice}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            {!(group.tasks || []).length && <div className="g46-ref-empty">No tasks yet for this group.</div>}
          </div>
        ))}

        {!groups.length && <div className="g46-ref-empty">No group tasks yet.</div>}
      </section>
    </Grade46StudentChrome>
  );
}
