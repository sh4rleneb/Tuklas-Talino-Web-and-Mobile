import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { subjects } from '../../utils/progress';

const STUDENT_SUBJECT_DISPLAY_LABELS = {
  'Oral Comm': 'Komunikasyong Pagsasalita',
  'Oral Communication': 'Komunikasyong Pagsasalita',
  'Komunikasyong Pagsasalita': 'Komunikasyong Pagsasalita',
  'Pasalitang Komunikasyon': 'Komunikasyong Pagsasalita',
};

function formatStudentSubjectDisplay(subject) {
  const value = String(subject || '').trim();
  return STUDENT_SUBJECT_DISPLAY_LABELS[value] || subject || 'Filipino';
}


export default function LessonsPage() {
  const [dashboard, setDashboard] = useState(null);
  const [subject, setSubject] = useState('Lahat');

  useEffect(() => { api('/students/dashboard').then(setDashboard); }, []);

  const lessons = useMemo(() => {
    if (!dashboard) return [];
    return dashboard.lessons.filter(l => subject === 'Lahat' || l.subject === subject);
  }, [dashboard, subject]);

  if (!dashboard) return <div className="loading-card">Inihahanda ang mga aralin...</div>;

  return (
    <section>
      <div className="section-heading">
        <h1>Mga Aralin</h1>
        <select value={subject} onChange={e => setSubject(e.target.value)}>
          <option>Lahat</option>
          {subjects.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div className="lesson-grid">
        {lessons.map(lesson => (
          <Link to={`/student/lessons/${lesson.id}`} className={`lesson-card ${lesson.completed ? 'done' : ''}`} key={lesson.id}>
            <span>{lesson.completed ? '✅' : '📘'}</span>
            <strong>{lesson.title}</strong>
            <small>{formatStudentSubjectDisplay(lesson.subject)} • Baitang {lesson.gradeLevel} • {lesson.xpReward} XP</small>
          </Link>
        ))}
      </div>
    </section>
  );
}