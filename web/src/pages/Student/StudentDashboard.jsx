import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import StatCard from '../../components/StatCard';
import ProgressBar from '../../components/ProgressBar';

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/students/dashboard').then(setData).catch(err => setError(err.message));
  }, []);

  if (error) return <div className="alert error">{error}</div>;
  if (!data) return <div className="loading-card">Loading your learning map...</div>;

  const playful = data.student.gradeLevel <= 2 ? 'playful' : 'senior';

  return (
    <section className={`dashboard ${playful}`}>
      <div className="welcome-card">
        <div className="avatar-xl">{data.student.avatar}</div>
        <div>
          <p className="eyebrow">Grade {data.student.gradeLevel} • {data.student.section}</p>
          <h1>Kumusta, {data.student.name}!</h1>
          <p>Ipagpatuloy ang iyong paglalakbay sa Filipino.</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon="⭐" label="XP" value={data.student.xp} tone="yellow" />
        <StatCard icon="🏆" label="Level" value={data.level} tone="blue" />
        <StatCard icon="✅" label="Lessons Done" value={`${data.progress.completedLessons}/${data.progress.totalLessons}`} tone="green" />
      </div>

      <ProgressBar value={data.progress.percent} label="Lesson progress" />

      <div className="section-heading">
        <h2>Recommended Lessons</h2>
        <Link to="/student/lessons" className="btn ghost">View all</Link>
      </div>
      <div className="lesson-grid">
        {data.lessons.slice(0, 6).map(lesson => (
          <Link className={`lesson-card ${lesson.completed ? 'done' : ''}`} to={`/student/lessons/${lesson.id}`} key={lesson.id}>
            <span>{lesson.subject === 'Pagbasa' ? '📖' : lesson.subject === 'Bokabularyo' ? '🔤' : lesson.subject === 'Panitikan' ? '📜' : lesson.subject === 'Oral Comm' ? '🎙️' : '✍️'}</span>
            <strong>{lesson.title}</strong>
            <small>{lesson.subject} • {lesson.xpReward} XP</small>
          </Link>
        ))}
      </div>

      <div className="section-heading"><h2>Badges</h2><Link to="/student/badges">See badges</Link></div>
      <div className="badge-row">
        {data.badges.length ? data.badges.map(b => <span className="badge-chip" key={b.id}>{b.icon} {b.name}</span>) : <p className="empty">Complete lessons to unlock badges.</p>}
      </div>
    </section>
  );
}
