import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { subjects } from '../../utils/progress';

export default function LessonsPage() {
  const [dashboard, setDashboard] = useState(null);
  const [subject, setSubject] = useState('All');

  useEffect(() => { api('/students/dashboard').then(setDashboard); }, []);

  const lessons = useMemo(() => {
    if (!dashboard) return [];
    return dashboard.lessons.filter(l => subject === 'All' || l.subject === subject);
  }, [dashboard, subject]);

  if (!dashboard) return <div className="loading-card">Loading lessons...</div>;

  return (
    <section>
      <div className="section-heading">
        <h1>Lessons</h1>
        <select value={subject} onChange={e => setSubject(e.target.value)}>
          <option>All</option>
          {subjects.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div className="lesson-grid">
        {lessons.map(lesson => (
          <Link to={`/student/lessons/${lesson.id}`} className={`lesson-card ${lesson.completed ? 'done' : ''}`} key={lesson.id}>
            <span>{lesson.completed ? '✅' : '📘'}</span>
            <strong>{lesson.title}</strong>
            <small>{lesson.subject} • Grade {lesson.gradeLevel} • {lesson.xpReward} XP</small>
          </Link>
        ))}
      </div>
    </section>
  );
}
