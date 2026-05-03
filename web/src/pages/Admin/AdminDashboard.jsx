import { useEffect, useState } from 'react';
import { api, downloadUrl, getToken } from '../../api/client';
import StatCard from '../../components/StatCard';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [message, setMessage] = useState('');

  async function load() {
    const [s, a, l] = await Promise.all([
      api('/admin/stats'),
      api('/admin/accounts'),
      api('/admin/audit-logs')
    ]);
    setStats(s.stats);
    setAccounts(a.users);
    setLogs(l.logs);
  }

  useEffect(() => { load(); }, []);

  async function setStatus(id, status) {
    if (!confirm(`Set account status to ${status}?`)) return;
    await api(`/admin/accounts/${id}/status`, { method: 'PATCH', body: { status } });
    setMessage('Account updated.');
    load();
  }

  if (!stats) return <div className="loading-card">Loading admin dashboard...</div>;

  return (
    <section>
      <div className="section-heading">
        <h1>Admin Dashboard</h1>
        <div className="button-row">
          <a className="btn ghost" href={`${downloadUrl('/reports/students.csv')}?token=${getToken()}`}>Students CSV</a>
          <a className="btn ghost" href={`${downloadUrl('/reports/activity-logs.csv')}?token=${getToken()}`}>Logs CSV</a>
        </div>
      </div>
      {message && <div className="alert success">{message}</div>}

      <div className="stats-grid">
        <StatCard icon="👥" label="Users" value={stats.users} />
        <StatCard icon="🧒" label="Students" value={stats.students} />
        <StatCard icon="👩‍🏫" label="Teachers" value={stats.teachers} />
        <StatCard icon="📚" label="Lessons" value={stats.lessons} />
      </div>

      <article className="content-card">
        <h2>Account Management</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>User</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {accounts.map(user => (
                <tr key={user.id}>
                  <td>{user.displayName}<br/><small>{user.username}</small></td>
                  <td>{user.Role?.name}</td>
                  <td>{user.status}</td>
                  <td>
                    <button className="btn tiny" onClick={() => setStatus(user.id, 'active')}>Reactivate</button>
                    <button className="btn tiny danger" onClick={() => setStatus(user.id, 'archived')}>Archive</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="content-card">
        <h2>Audit History</h2>
        <div className="log-list">
          {logs.map(log => <div key={log.id}><strong>{log.action}</strong><small>{new Date(log.createdAt).toLocaleString()}</small></div>)}
        </div>
      </article>
    </section>
  );
}
