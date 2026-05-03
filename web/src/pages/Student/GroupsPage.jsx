import { useEffect, useState } from 'react';
import { api } from '../../api/client';

export default function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [message, setMessage] = useState('');

  async function load() {
    const data = await api('/groups');
    setGroups(data.groups || []);
  }

  useEffect(() => { load(); }, []);

  async function complete(taskId) {
    const data = await api(`/groups/tasks/${taskId}/complete`, { method: 'POST' });
    setMessage(data.xpAwarded ? `Group task complete! +${data.xpAwarded} XP` : 'Already completed.');
    load();
  }

  return (
    <section>
      <h1>Group Tasks</h1>
      {message && <div className="alert success">{message}</div>}
      <div className="card-grid">
        {groups.length ? groups.map(group => (
          <article className="content-card" key={group.id}>
            <h2>🤝 {group.name}</h2>
            <p>{group.description}</p>
            {(group.tasks || []).map(task => (
              <div className="task-card" key={task.id}>
                <strong>{task.title}</strong>
                <p>{task.description}</p>
                <button className="btn secondary" onClick={() => complete(task.id)}>Complete Task</button>
              </div>
            ))}
          </article>
        )) : <p className="empty">You are not assigned to a group yet.</p>}
      </div>
    </section>
  );
}
