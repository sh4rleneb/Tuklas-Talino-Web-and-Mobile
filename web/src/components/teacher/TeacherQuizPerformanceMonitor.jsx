import { useState } from 'react';
import { asArray } from '../../utils/studentHelpers';

function TeacherQuizPerformanceMonitor({
  quizPerformance = {},
  selectedQuiz = "ALL",
  onSelectQuiz = () => {}
}) {
  const summary = quizPerformance.summary || {};
  const rows = asArray(quizPerformance.rows);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAll, setShowAll] = useState(false);

  const statusOptions = ['All', 'Needs Support', 'Developing', 'Proficient', 'Advanced'];
  const normalizedQuery = query.trim().toLowerCase();

  const assessmentRows =
    selectedQuiz && selectedQuiz !== "ALL"
      ? rows.filter(row => row.quizId === selectedQuiz)
      : rows;

  const filteredRows = assessmentRows.filter(row => {
    const matchesStatus = statusFilter === 'All' || String(row.status || '') === statusFilter;
    const haystack = [
      row.studentName,
      row.quizTitle,
      row.quizId,
      row.section,
      row.gradeLevel ? `grade ${row.gradeLevel}` : ''
    ].join(' ').toLowerCase();

    return matchesStatus && (!normalizedQuery || haystack.includes(normalizedQuery));
  });

  const visibleRows = showAll ? filteredRows : filteredRows.slice(0, 8);
  const hiddenCount = Math.max(0, filteredRows.length - visibleRows.length);

  function scoreText(attempt) {
    if (!attempt) return '—';
    return `${attempt.percent ?? 0}%`;
  }

  function statusClass(status = '') {
    const value = String(status).toLowerCase();
    if (value.includes('advanced') || value.includes('proficient')) return 'good';
    if (value.includes('developing')) return 'warn';
    return 'bad';
  }

  return (
    <div className="teacher-workspace-card" style={{ margin: '18px 0', boxShadow: 'none', background: '#fbfffd' }}>

      <div className="teacher-monitor-summary">
        <div><span>Completed Assessments</span><strong>{summary.total || rows.length || 0}</strong></div>
        <div><span>Average Score</span><strong>{summary.averageBest || 0}%</strong></div>
        <div><span>Needs Support</span><strong>{summary.needsSupport || 0}</strong></div>
        <div><span>Proficient Students</span><strong>{Number(summary.proficient || 0) + Number(summary.advanced || 0)}</strong></div>
      </div>

      <div style={{ marginTop: 18, marginBottom: 18 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: '#5d728f',
            marginBottom: 10,
            textTransform: 'uppercase',
            letterSpacing: '.08em'
          }}
        >
          Assessment
        </div>

        <select
          value={selectedQuiz}
          onChange={(event) => onSelectQuiz(event.target.value)}
          style={{
            width: '100%',
            maxWidth: 420,
            minHeight: 48,
            borderRadius: 12,
            border: '2px solid #d8e7da',
            padding: '0 14px',
            fontWeight: 600,
            fontSize: '0.96rem',
            background: '#fff',
            color: '#14223b'
          }}
        >
          <option value="ALL">🌎 All Assessments</option>

          {Array.from(
            new Map(
              rows.map(row => [
                row.quizId,
                row.quizTitle
              ])
            ).entries()
          ).map(([quizId, quizTitle]) => (
            <option
              key={quizId}
              value={quizId}
            >
              {quizTitle}
            </option>
          ))}
        </select>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 1fr) auto',
          gap: 12,
          alignItems: 'center',
          marginTop: 16
        }}
      >
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setShowAll(false);
          }}
          placeholder="🔍 Search student or assessment..."
          style={{
            minHeight: 54,
            borderRadius: 16,
            border: '2px solid #d8e7da',
            padding: '0 18px',
            fontWeight: 600,
            fontSize: '0.96rem',
            color: '#14223b',
            background: '#fff',
            boxShadow: '0 2px 10px rgba(18,83,52,.06)',
            transition: 'all .2s ease'
          }}
        />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }}>
          {statusOptions.map(option => (
            <button
              key={option}
              type="button"
              className={statusFilter === option ? 'lms-report-button' : 'quiz-secondary'}
              onClick={() => {
                setStatusFilter(option);
                setShowAll(false);
              }}
              style={{ minHeight: 42 }}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 10, color: '#526988', fontWeight: 800 }}>
        Showing {visibleRows.length} of {filteredRows.length} assessment record{filteredRows.length === 1 ? '' : 's'}
      </div>

      <div className="teacher-table-wrapper" style={{ marginTop: 16 }}>
        <table className="teacher-monitor-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Assessment</th>
              <th>Attempt 1</th>
              <th>Attempt 2</th>
              <th>Best Score</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.length ? visibleRows.map(row => (
              <tr key={row.key || `${row.studentId}-${row.quizId}`}>
                <td>
                  <strong>{row.studentName}</strong>
                  <small>Grade {row.gradeLevel || '—'}{row.section ? ` • Section ${row.section}` : ''}</small>
                </td>
                <td>
                  <strong>{row.quizTitle}</strong>
                                  </td>
                <td>{scoreText(row.attempt1)}</td>
                <td>{scoreText(row.attempt2)}</td>
                <td><strong>{row.bestPercent || 0}%</strong></td>
                <td>
                  <span className={`lms-mini-pill ${statusClass(row.status)}`}>
                    {row.status || 'Needs Support'}
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6">
                  <div className="teacher-empty-panel" style={{ boxShadow: 'none' }}>
                    <div>🧠</div>
                    <strong>No matching assessment records.</strong>
                    <p>Try another search or wait for students to complete their assessments.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filteredRows.length > 8 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
          <button
            type="button"
            className="lms-report-button"
            onClick={() => setShowAll(prev => !prev)}
          >
            {showAll ? 'Show Less' : `Show More (${hiddenCount} more)`}
          </button>
        </div>
      )}
    </div>
  );
}

export default TeacherQuizPerformanceMonitor;
