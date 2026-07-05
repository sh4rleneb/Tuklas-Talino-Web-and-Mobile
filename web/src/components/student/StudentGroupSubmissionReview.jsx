export default function StudentGroupSubmissionReview({
  completion,
  task,
  submittedRole = '',
  submittedFileName = '',
  isAccepted = false,
  isPending = false,
  isReturned = false
}) {
  const teacherFeedback = String(completion?.teacherFeedback || '').trim();
  const xpEarned = Number(completion?.xpAwarded || (isAccepted ? task?.xpReward : 0) || 0);
  const submittedAt = completion?.submittedAt
    ? new Date(completion.submittedAt).toLocaleString()
    : '';
  const fileName = submittedFileName || completion?.fileName || '';
  const filePath = completion?.filePath || '';
  const fileUrl = completion?.fileUrl || (
    filePath && typeof window !== 'undefined'
      ? `${window.location.origin}${filePath}`
      : ''
  );

  const status = isAccepted
    ? 'approved'
    : isReturned
      ? 'returned'
      : isPending
        ? 'pending'
        : 'open';

  const icon = isAccepted ? '🏆' : isReturned ? '↩️' : '⏳';
  const title = isAccepted
    ? 'Group output approved'
    : isReturned
      ? 'Group output rejected'
      : 'Naipasa ang output ng grupo';

  const message = isAccepted
    ? 'Your teacher approved this task and XP has been awarded.'
    : isReturned
      ? 'Ibinalik ng guro ang ipinasa ninyo. Basahin ang puna at magpasa muli.'
      : 'Waiting for your teacher to review your group output.';

  return (
    <div className={`g46-submitted-summary ${status}`} style={{ marginBottom: isReturned ? 24 : undefined }}>
      <div className="g46-submit-box-head">
        <span className="g46-submit-icon">{icon}</span>
        <div>
          <strong>{title}</strong>
          <p className="g46-ref-muted">{message}</p>
        </div>
      </div>

      {teacherFeedback && (
        <div
          style={{
            marginTop: 12,
            padding: '12px 14px',
            borderRadius: 16,
            background: isReturned ? '#fff1f2' : '#f0fdf4',
            border: isReturned ? '1px solid #fecdd3' : '1px solid #bbf7d0'
          }}
        >
          <span
            style={{
              display: 'block',
              color: '#64748b',
              fontSize: 12,
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: 4
            }}
          >
            Teacher Remarks
          </span>
          <strong style={{ color: '#17324d', lineHeight: 1.45 }}>{teacherFeedback}</strong>
        </div>
      )}

      <div className="g46-submitted-list">
        <div>
          <span>Role</span>
          <strong>{submittedRole || completion?.studentRole || '—'}</strong>
        </div>

        <div>
          <span>File</span>
          <strong>{fileName || 'Uploaded group output'}</strong>
        </div>

        {submittedAt && (
          <div>
            <span>Submitted</span>
            <strong>{submittedAt}</strong>
          </div>
        )}

        {isAccepted && (
          <div>
            <span>XP Earned</span>
            <strong>+{xpEarned} XP</strong>
          </div>
        )}
      </div>

      {fileUrl && (
        <a
          className="teacher-file-link"
          href={fileUrl}
          target="_blank"
          rel="noreferrer"
          style={{ marginTop: 16, display: 'inline-flex', width: 'fit-content' }}
        >
          View Submitted File
        </a>
      )}
    </div>
  );
}
