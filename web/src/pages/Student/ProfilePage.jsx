import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { avatars } from '../../utils/progress';

export default function ProfilePage() {
  const [dashboard, setDashboard] = useState(null);
  const [message, setMessage] = useState('');

  async function load() {
    setDashboard(await api('/students/dashboard'));
  }

  useEffect(() => { load(); }, []);

  async function setAvatar(avatar) {
    await api(`/students/${dashboard.student.id}/avatar`, { method: 'PATCH', body: { avatar } });
    setMessage('Avatar updated!');
    load();
  }

  if (!dashboard) return <div className="loading-card">Loading profile...</div>;

  return (
    <section className="profile-page">
      <div className="welcome-card">
        <div className="avatar-xl">{dashboard.student.avatar}</div>
        <div>
          <h1>{dashboard.student.name}</h1>
          <p>{dashboard.student.studentCode} • Grade {dashboard.student.gradeLevel} • {dashboard.student.section}</p>
        </div>
      </div>
      {message && <div className="alert success">{message}</div>}
      <h2>Choose Avatar</h2>
      <div className="avatar-picker">
        {avatars.map(a => <button key={a} className="avatar-choice" onClick={() => setAvatar(a)}>{a}</button>)}
      </div>
    </section>
  );
}
