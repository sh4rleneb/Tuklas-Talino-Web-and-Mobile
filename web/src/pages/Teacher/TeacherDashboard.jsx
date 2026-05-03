import { useEffect, useMemo, useState } from 'react';
import { api, downloadUrl, getToken } from '../../api/client';
import StatCard from '../../components/StatCard';
import ProgressBar from '../../components/ProgressBar';

export default function TeacherDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [rows, setRows] = useState([]);
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [message, setMessage] = useState('');
  const [newGroup, setNewGroup] = useState('Pangkat Bituin');

  async function load() {
    const [d, m, s, g] = await Promise.all([
      api('/teachers/dashboard'),
      api('/teachers/monitoring/stats'),
      api('/students'),
      api('/groups')
    ]);
    setDashboard(d);
    setRows(m.rows);
    setStudents(s.students);
    setGroups(g.groups);
  }

  useEffect(() => { load(); }, []);

  const csv = useMemo(() => `${downloadUrl('/reports/students.csv')}?token=${getToken()}`, []);

  async function addGroup(e) {
    e.preventDefault();
    if (!newGroup.trim()) return;
    await api('/groups', { method: 'POST', body: { name: newGroup, description: 'Created from teacher dashboard' } });
    setMessage('Group created.');
    setNewGroup('');
    load();
  }

  async function archiveStudent(id) {
    if (!confirm('Archive this student?')) return;
    await api(`/students/${id}/archive`, { method: 'POST' });
    setMessage('Student archived.');
    load();
  }

  async function resetProgress(id) {
    if (!confirm('Reset all progress for this student?')) return;
    await api(`/students/${id}/reset-progress`, { method: 'POST' });
    setMessage('Progress reset.');
    load();
  }

  if (!dashboard) return <div className="loading-card">Loading teacher dashboard...</div>;

  return (
    <section>
      <div className="section-heading">
        <h1>Teacher Dashboard</h1>
        <a className="btn ghost" href={csv}>Export CSV</a>
      </div>
      {message && <div className="alert success">{message}</div>}

      <div className="stats-grid">
        <StatCard icon="🧒" label="Students" value={dashboard.stats.students} />
        <StatCard icon="📚" label="Lessons" value={dashboard.stats.lessons} />
        <StatCard icon="✅" label="Completions" value={dashboard.stats.completed} />
        <StatCard icon="🤝" label="Groups" value={dashboard.stats.groups} />
      </div>

      <article className="content-card">
        <h2>Student Monitoring</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Grade</th><th>Section</th><th>XP</th><th>Progress</th><th>Actions</th></tr></thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id}>
                  <td>{row.name}<br/><small>{row.studentCode}</small></td>
                  <td>{row.gradeLevel}</td>
                  <td>{row.section}</td>
                  <td>{row.xp}</td>
                  <td><ProgressBar value={row.percent} label={`${row.completed}/${row.totalLessons}`} /></td>
                  <td>
                    <button className="btn tiny" onClick={() => archiveStudent(row.id)}>Archive</button>
                    <button className="btn tiny danger" onClick={() => resetProgress(row.id)}>Reset</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="content-card">
        <h2>Groups</h2>
        <form className="inline-form" onSubmit={addGroup}>
          <input value={newGroup} onChange={e => setNewGroup(e.target.value)} placeholder="New group name" />
          <button className="btn primary">Create Group</button>
        </form>
        <div className="card-grid">
          {groups.map(group => (
            <div className="task-card" key={group.id}>
              <strong>{group.name}</strong>
              <p>{group.description}</p>
              <small>{group.status}</small>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
