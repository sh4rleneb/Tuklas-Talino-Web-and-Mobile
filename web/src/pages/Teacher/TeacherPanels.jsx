import React from 'react';
import { asArray, fmtDate } from '../../utils/studentHelpers';
import { ProgressBar, Stat } from '../../components/common/CommonUI';

export function TeacherAssessmentCenter({ lessons = [], rows = [] }) {
  const quizzes = lessons.map(lesson => ({
    lesson,
    questions: buildQuizQuestionsFromLesson(lesson),
    profile: lessonAssessmentProfile(lesson.activities || [])
  }));
  const withQuiz = quizzes.filter(item => item.profile.hasObjectiveQuiz).length;
  const questionCount = quizzes.reduce((sum, item) => sum + item.questions.length, 0);
  const missingQuiz = Math.max(0, lessons.length - withQuiz);
  const readiness = lessons.length ? Math.round((withQuiz / lessons.length) * 100) : 0;

  return (
    <section className="teacher-workspace-card" id="teacher-assessment-center">
      <div className="teacher-workspace-heading">
        <div>
          <div className="lms-section-label">Assessment Hub</div>
          <h2>Quiz Builder & Effectiveness Preview</h2>
          <p>Create the lesson first, then use each lesson's MCQ or matching activities as a separate student Quiz tab. Backend saving comes next.</p>
        </div>
      </div>

      <div className="teacher-monitor-summary">
        <div><span>Assessment Coverage</span><strong>{readiness}%</strong></div>
        <div><span>Quiz-ready Lessons</span><strong>{withQuiz}/{lessons.length}</strong></div>
        <div><span>Total Questions</span><strong>{questionCount}</strong></div>
      </div>

      <div className="teacher-monitor-summary" style={{ marginTop: 12 }}>
        <div><span>Lessons Missing Quiz</span><strong>{missingQuiz}</strong></div>
        <div><span>Students to Monitor</span><strong>{rows.length}</strong></div>
        <div><span>Passing Target</span><strong>75%</strong></div>
      </div>

      <div className="lms-empty-line" style={{ marginTop: 14, background: '#fff8df', color: '#6b4b00' }}>
        Recommended next backend step: save Assessment, AssessmentQuestion, AssessmentAttempt, and AssessmentResponse records so teachers can see real class averages, pass rates, and most-missed questions.
      </div>

      <div className="teacher-groups-area" style={{ marginTop: 16 }}>
        <div className="teacher-mini-heading">
          <div>
            <h3>Lesson-to-Quiz Checklist</h3>
            <p>Each lesson should have at least one objective quiz plus writing or speech evidence for stronger effectiveness measurement.</p>
          </div>
        </div>

        <div className="teacher-groups-grid">
          {quizzes.map(({ lesson, questions, profile }) => {
            const coverage = [profile.hasObjectiveQuiz, profile.hasWriting, profile.hasSpeech].filter(Boolean).length;
            return (
              <div className="teacher-group-item" key={lesson.id || lesson.title}>
                <div className="teacher-group-item-top">
                  <div>
                    <strong>{lesson.title || 'Untitled lesson'}</strong>
                    <p>{lesson.subject || 'Filipino'} • Grade {lesson.gradeLevel || '—'}</p>
                  </div>
                  <span className="lms-mini-pill">{questions.length} item{questions.length === 1 ? '' : 's'}</span>
                </div>
                <div className="teacher-progress-cell" style={{ marginTop: 12 }}>
                  <span>{coverage}/3 evidence types</span>
                  <div className="teacher-progress-track"><div style={{ width: `${Math.max(8, (coverage / 3) * 100)}%` }} /></div>
                </div>
                <p style={{ marginTop: 10 }}>
                  {profile.hasObjectiveQuiz ? '✅ Quiz/Matching' : '⚠️ Add quiz'} • {profile.hasWriting ? '✅ Writing' : 'Add writing'} • {profile.hasSpeech ? '✅ Speech' : 'Add speech'}
                </p>
              </div>
            );
          })}
          {!lessons.length && (
            <div className="teacher-empty-panel">
              <div>🧠</div>
              <strong>No lessons yet.</strong>
              <p>Create lessons first, then the Quiz tab will automatically show assessment cards.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function TeacherEffectivenessPanel({ rows = [], lessons = [], groups = [] }) {
  const avgProgress = rows.length
    ? Math.round(rows.reduce((sum, row) => sum + Number(row.percent || 0), 0) / rows.length)
    : 0;
  const completed = rows.reduce((sum, row) => sum + Number(row.completed || 0), 0);
  const totalLessons = rows.reduce((sum, row) => sum + Number(row.totalLessons || 0), 0);
  const completionRate = totalLessons ? Math.round((completed / totalLessons) * 100) : 0;
  const groupTaskCount = groups.reduce((sum, group) => sum + asArray(group.tasks).length, 0);
  const band = effectivenessBand(avgProgress || completionRate);
  const assessmentMix = lessons.reduce((acc, lesson) => {
    const profile = lessonAssessmentProfile(lesson.activities || []);
    acc.content += profile.hasContent ? 1 : 0;
    acc.quiz += profile.hasObjectiveQuiz ? 1 : 0;
    acc.writing += profile.hasWriting ? 1 : 0;
    acc.speech += profile.hasSpeech ? 1 : 0;
    return acc;
  }, { content: 0, quiz: 0, writing: 0, speech: 0 });

  return (
    <div className="teacher-workspace-card" style={{ margin: '18px 0', background: 'linear-gradient(135deg, #fbfffd, #fffdf0)', boxShadow: 'none' }}>
      <div className="teacher-workspace-heading">
        <div>
          <div className="lms-section-label">Learning Effectiveness</div>
          <h2>{band.icon} {band.label}</h2>
          <p>{band.note} Use quiz scores, writing, speech, group output, and self-checks instead of completion only.</p>
        </div>
      </div>

      <div className="teacher-monitor-summary">
        <div><span>Completion Rate</span><strong>{completionRate}%</strong></div>
        <div><span>Average Progress</span><strong>{avgProgress}%</strong></div>
        <div><span>Group Tasks</span><strong>{groupTaskCount}</strong></div>
      </div>

      <div className="teacher-monitor-summary" style={{ marginTop: 12 }}>
        <div><span>Lessons with Quiz/Matching</span><strong>{assessmentMix.quiz}/{lessons.length}</strong></div>
        <div><span>Lessons with Writing</span><strong>{assessmentMix.writing}/{lessons.length}</strong></div>
        <div><span>Lessons with Speech</span><strong>{assessmentMix.speech}/{lessons.length}</strong></div>
      </div>

      <div className="lms-empty-line" style={{ marginTop: 14, background: '#ffffff', color: '#264136' }}>
        Suggested teacher decision: if completion is high but quiz/speech/writing evidence is low, add a short post-test or reteaching activity before awarding full mastery.
      </div>
    </div>
  );
}
