import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/client';

export default function LessonDetailPage() {
  const { id } = useParams();
  const [lesson, setLesson] = useState(null);
  const [message, setMessage] = useState('');
  const [writing, setWriting] = useState('');
  const [transcript, setTranscript] = useState('');

  useEffect(() => { api(`/lessons/${id}`).then(data => setLesson(data.lesson)); }, [id]);

  const mcq = useMemo(() => lesson?.activities?.find(a => a.type === 'mcq')?.questions?.[0], [lesson]);
  const writingTask = useMemo(() => lesson?.activities?.find(a => a.type === 'writing')?.writingTask, [lesson]);
  const speechTask = useMemo(() => lesson?.activities?.find(a => a.type === 'speech')?.speechTask, [lesson]);

  async function answer(optionId) {
    const data = await api(`/lessons/${id}/mcq`, { method: 'POST', body: { questionId: mcq.id, selectedOptionId: optionId } });
    setMessage(data.correct ? 'Tama! +5 XP' : 'Subukan muli. Kaya mo yan!');
  }

  async function submitWriting() {
    const data = await api(`/lessons/${id}/writing`, { method: 'POST', body: { taskId: writingTask.id, content: writing } });
    setMessage(data.submission.feedback);
  }

  async function submitSpeech() {
    await api(`/lessons/${id}/speech`, { method: 'POST', body: { taskId: speechTask.id, transcript } });
    setMessage('Speech attempt saved. +6 XP');
  }

  async function completeLesson() {
    const data = await api(`/lessons/${id}/complete`, { method: 'POST', body: { score: 100 } });
    setMessage(data.xpAwarded ? `Lesson complete! +${data.xpAwarded} XP` : 'Lesson was already completed.');
  }

  if (!lesson) return <div className="loading-card">Loading lesson...</div>;

  return (
    <section className="lesson-detail">
      <article className="content-card">
        <p className="eyebrow">Grade {lesson.gradeLevel} • {lesson.subject}</p>
        <h1>{lesson.title}</h1>
        <p>{lesson.instructions}</p>
        <div className="passage">{lesson.passage}</div>
      </article>

      {mcq && (
        <article className="content-card">
          <h2>MCQ Activity</h2>
          <p>{mcq.question}</p>
          <div className="option-list">
            {mcq.options.map(o => <button className="option-btn" key={o.id} onClick={() => answer(o.id)}>{o.optionText}</button>)}
          </div>
        </article>
      )}

      {writingTask && (
        <article className="content-card">
          <h2>Writing Activity</h2>
          <p>{writingTask.prompt}</p>
          <textarea value={writing} onChange={e => setWriting(e.target.value)} placeholder="Isulat ang iyong sagot dito..." />
          <button className="btn primary" onClick={submitWriting}>Submit Writing</button>
        </article>
      )}

      {speechTask && (
        <article className="content-card">
          <h2>Speech / Oral Practice</h2>
          <p>Target: <strong>{speechTask.targetText}</strong></p>
          <textarea value={transcript} onChange={e => setTranscript(e.target.value)} placeholder="Type or paste transcript while browser/mobile speech support is connected." />
          <button className="btn secondary" onClick={submitSpeech}>Save Speech Attempt</button>
        </article>
      )}

      {message && <div className="alert success">{message}</div>}
      <button className="btn primary big" onClick={completeLesson}>Mark Lesson Complete</button>
    </section>
  );
}
