import { useEffect, useState } from 'react';
import { uploadForm } from '../../api/client';
import { SUBJECTS } from '../../constants/studentConstants';
import { asArray, fmtDate, lessonAssessmentProfile } from '../../utils/studentHelpers';
import { TeacherRedesignStyles } from '../../components/styles/StyleBlocks';
import TeacherQuizPerformanceMonitor from '../../components/teacher/TeacherQuizPerformanceMonitor';
import TeacherStudentLessonPreview from '../../components/teacher/TeacherStudentLessonPreview';
import TeacherQuizTextImporter from '../../components/teacher/TeacherQuizTextImporter';


// Local quiz helpers used by TeacherAssessmentCenter.
function normalizeQuizOption(option = {}, index = 0) {
  const rawText =
    option?.text ??
    option?.optionText ??
    option?.label ??
    option?.value ??
    `Choice ${index + 1}`;

  const text = String(rawText || `Choice ${index + 1}`).trim() || `Choice ${index + 1}`;

  return {
    id: String(option?.id ?? option?.value ?? `opt-${index}-${text}`),
    text,
    isCorrect: Boolean(option?.isCorrect || option?.correct)
  };
}

function stableShuffleOptions(options = [], seed = '') {
  const rows = [...options];
  let hash = String(seed || '').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  for (let i = rows.length - 1; i > 0; i--) {
    hash = (hash * 9301 + 49297) % 233280;
    const j = hash % (i + 1);
    [rows[i], rows[j]] = [rows[j], rows[i]];
  }
  return rows;
}

function buildFallbackOptions(correctText, alternates = []) {
  const correct = String(correctText || 'Filipino');
  const choices = [correct, ...alternates.filter(Boolean).filter(item => String(item) !== correct)];
  const fillers = ['Reading', 'Vocabulary', 'Literature', 'Oral Communication', 'Writing', 'Not specified'];
  fillers.forEach(item => {
    if (choices.length < 4 && !choices.includes(item)) choices.push(item);
  });

  const options = choices.slice(0, 4).map((text, index) => ({
    id: `fallback-${index}-${String(text).replace(/\s+/g, '-').toLowerCase()}`,
    text,
    isCorrect: String(text) === correct
  }));

  return stableShuffleOptions(options, correct);
}

function buildQuizQuestionsFromLesson(lesson = {}) {
  const activities = asArray(lesson?.activities);
  const questions = [];

  activities.forEach((activity, activityIndex) => {
    if (activity?.type === 'mcq') {
      asArray(activity.questions).forEach((question, questionIndex) => {
        const options = asArray(question.options || question.choices).map(normalizeQuizOption);
        if (!options.length) return;
        const hasCorrect = options.some(option => option.isCorrect);
        questions.push({
          id: String(question.id || `${lesson.id || 'lesson'}-${activityIndex}-${questionIndex}`),
          type: 'mcq',
          source: activity.title || 'Lesson Quiz',
          prompt: question.question || question.prompt || 'Choose the correct answer.',
          options: hasCorrect ? options : options.map((option, idx) => ({ ...option, isCorrect: idx === 0 })),
          points: Number(question.points || 1)
        });
      });
    }
  });

  return questions.slice(0, 25);
}

function TeacherAssessmentCenter({ lessons = [], rows = [], quizPerformance = {} }) {
  const [selectedQuizId, setSelectedQuizId] = useState("ALL");

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
          <div className="lms-section-label">Assessment Results</div>
          <h2>Student Assessment Results</h2>
          <p>Monitor student assessment completion, review quiz scores, and identify learners who need additional support.</p>
        </div>
      </div>



      <TeacherQuizPerformanceMonitor
        quizPerformance={quizPerformance}
        selectedQuiz={selectedQuizId}
        onSelectQuiz={setSelectedQuizId}
      />


    </section>
  );
}

function TeacherEffectivenessPanel({ rows = [], lessons = [], groups = [] }) {
  const totalLearners = rows.length;
  const averageProgress = rows.length
    ? Math.round(rows.reduce((sum, row) => sum + Number(row.percent || 0), 0) / rows.length)
    : 0;
  const recordedCompletions = rows.reduce((sum, row) => sum + Number(row.completed || 0), 0);
  const groupTaskCount = groups.reduce((sum, group) => sum + asArray(group.tasks).length, 0);

  return (
    <div className="teacher-workspace-card" style={{ margin: '18px 0', boxShadow: 'none', background: '#fbfffd' }}>
      <div className="teacher-workspace-heading">
        <div>
          <div className="lms-section-label">Academic Progress Overview</div>
          <h2>Class Learning Summary</h2>
        </div>
      </div>

      <div className="teacher-monitor-summary">
        <div><span>Total Learners</span><strong>{totalLearners}</strong></div>
        <div><span>Average Progress</span><strong>{averageProgress}%</strong></div>
        <div><span>Recorded Completions</span><strong>{recordedCompletions}</strong></div>
      </div>

      <div className="teacher-monitor-summary" style={{ marginTop: 12 }}>
        <div><span>Available Lessons</span><strong>{lessons.length}</strong></div>
        <div><span>Group Tasks</span><strong>{groupTaskCount}</strong></div>
        <div><span>Active Records</span><strong>{rows.filter(row => String(row.status || '').toLowerCase() === 'active').length}</strong></div>
      </div>
    </div>
  );
}




export default function TeacherDashboard({
  user,
  data,
  logout,
  reload,
  createGroup,
  addTask,
  addMember,
  setGroupLeader,
  deleteGroup,
  approveGroupTaskCompletion,
  rejectGroupTaskCompletion,
  createLesson,
  deleteLesson,
  exportStudentsCSV,
  exportLogsCSV,
  downloadSummaryReport,
  gradeWritingSubmission
}) {
  const [teacherTab, setTeacherTab] = useState('lessons');
  const [openGroupTools, setOpenGroupTools] = useState({});
  const [openGroupProgress, setOpenGroupProgress] = useState({});
  const [gradingWritingIds, setGradingWritingIds] = useState({});

  const lessons = data.lessons || [];
  const groups = data.groups || [];
  const students = data.students || [];
  const assignedClasses = data.assignedClasses || [];
  const rows = data.rows || [];
  const stats = data.stats || {};
  const quizPerformance = data.quizPerformance || { summary: {}, rows: [] };
  const pendingGroupChecks = data.pendingGroupChecks || { summary: {}, rows: [] };
  const teacherReviews = data.teacherReviews || { summary: {}, writing: [], speech: [] };
  const pendingGroupRows = asArray(pendingGroupChecks.rows).filter(row => Number(row.gradeLevel || 0) >= 3);
  const writingReviewRows = asArray(teacherReviews.writing);
  const pendingWritingReviewRows = writingReviewRows.filter(item =>
    String(item.reviewStatus || 'pending').toLowerCase() === 'pending' &&
    Boolean(item.reviewEligible) &&
    Number(item.student?.gradeLevel || item.lesson?.gradeLevel || 0) >= 3
  );
  const gradedWritingReviewRows = writingReviewRows
    .filter(item => String(item.reviewStatus || '').toLowerCase() === 'graded')
    .slice(0, 8);
  const speechReviewRows = asArray(teacherReviews.speech).slice(0, 12);
  const groupProgressRows = buildGroupProgressRows(groups);
  const teacherName = user?.displayName || 'Teacher 1';

  const publishedLessons = lessons.filter(lesson => (lesson.status || 'published') === 'published').length;
  const draftLessons = Math.max(0, lessons.length - publishedLessons);
  const studentCount = stats.students || students.length || rows.length || 0;
  const averageProgress = rows.length
    ? Math.round(rows.reduce((sum, row) => sum + Number(row.percent || 0), 0) / rows.length)
    : 0;

  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  function openTab(tab, targetId = 'teacher-dashboard-workspace') {
    setTeacherTab(tab);
    setTimeout(() => scrollTo(targetId), 0);
  }

  function openLessonsList() {
    setTeacherTab('lessons');
    setTimeout(() => scrollTo('teacher-recent-lessons'), 0);
  }

  function toggleGroupTools(groupId) {
    setOpenGroupTools(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  }

  function toggleGroupProgress(rowKey) {
    setOpenGroupProgress(prev => ({
      ...prev,
      [rowKey]: !prev[rowKey]
    }));
  }

  function buildGroupProgressRows(groupList = []) {
    const rows = [];

    for (const group of groupList || []) {
      const members = group.members || group.Members || [];
      const tasks = group.tasks || group.Tasks || [];
      const memberGradeLevels = members
        .map(member => Number((member.Student || member.student || member)?.gradeLevel || 0))
        .filter(Boolean);

      if (memberGradeLevels.length && memberGradeLevels.every(level => level <= 2)) {
        continue;
      }

      for (const task of tasks) {
        const completions = task.completions || task.Completions || [];

        const approvedCompletion = completions.find(item => item.verificationStatus === 'approved');
        const pendingCompletion = completions.find(item => item.verificationStatus === 'pending');
        const returnedCompletion = completions.find(item => item.verificationStatus === 'returned');
        const groupCompletion = approvedCompletion || pendingCompletion || returnedCompletion || null;
        const groupStatus = approvedCompletion
          ? 'approved'
          : pendingCompletion
            ? 'pending'
            : returnedCompletion
              ? 'returned'
              : 'not_submitted';

        const submittedById = groupCompletion?.submittedByStudentId || groupCompletion?.studentId || null;
        const submittedByMember = members.find(member => {
          const student = member.Student || member.student || member;
          return Number(student?.id) === Number(submittedById);
        });
        const submittedByStudent = submittedByMember?.Student || submittedByMember?.student || submittedByMember;
        const submittedByName = submittedByStudent?.name || groupCompletion?.studentName || '';

        const filePath = groupCompletion?.filePath || '';
        const fileUrl = groupCompletion?.fileUrl || (
          filePath
            ? `${typeof window !== 'undefined' ? window.location.origin : ''}${filePath}`
            : ''
        );

        const details = members.map(member => {
          const student = member.Student || member.student || member;
          const role = member.groupRole || member.role || student?.groupRole || 'member';

          return {
            studentId: student?.id,
            studentName: student?.name || 'Student',
            role
          };
        });

        rows.push({
          key: `${group.id}-${task.id}`,
          groupId: group.id,
          groupName: group.name,
          taskId: task.id,
          taskTitle: task.title || 'Group task',
          xpReward: task.xpReward || 0,
          status: groupStatus,
          submittedByName,
          submittedAt: groupCompletion?.submittedAt || groupCompletion?.createdAt || null,
          teacherFeedback: groupCompletion?.teacherFeedback || '',
          fileName: groupCompletion?.fileName || '',
          fileUrl,
          details
        });
      }
    }

    return rows;
  }

  function groupProgressStatusLabel(status) {
    if (status === 'approved') return 'Approved';
    if (status === 'pending') return 'Pending Review';
    if (status === 'returned') return 'Rejected';
    return 'Not Submitted';
  }

  function formatReviewDate(value) {
    if (!value) return 'No date yet';
    try {
      return new Date(value).toLocaleString();
    } catch {
      return 'No date yet';
    }
  }

  function handleSaveWritingGrade(item) {
    if (!item?.id || !gradeWritingSubmission) return;

    const scoreInputId = `writing-review-score-${item.id}`;
    const feedbackInputId = `writing-review-feedback-${item.id}`;
    const score = Number(document.getElementById(scoreInputId)?.value || 0);
    const feedback = String(document.getElementById(feedbackInputId)?.value || '').trim();

    if (!Number.isInteger(score) || score < 1 || score > 10) {
      window.alert('Please select a score from 1 to 10.');
      return;
    }

    setGradingWritingIds(prev => ({ ...prev, [item.id]: true }));

    Promise.resolve(gradeWritingSubmission(item.id, { score, feedback }))
      .finally(() => {
        setGradingWritingIds(prev => ({ ...prev, [item.id]: false }));
      });
  }

  function renderReviewIdentity(item, statusLabel = '') {
    const grade = item.student?.gradeLevel || item.lesson?.gradeLevel || '-';
    const section = item.student?.section || 'No section';
    const subject = item.lesson?.subject || 'Subject';
    const lessonTitle = item.lesson?.title || 'Lesson';

    return (
      <div className="teacher-review-identity-block">
        <div className="teacher-review-identity-main">
          <div>
            <strong className="teacher-review-student-name">{item.student?.name || 'Student'}</strong>
            <div className="teacher-review-chip-row">
              <span>Grade {grade}</span>
              <span>{section}</span>
              <span>{subject}</span>
            </div>
          </div>
          {statusLabel ? <span className="lms-mini-pill">{statusLabel}</span> : null}
        </div>

        <div className="teacher-review-lesson-box">
          <span>Lesson</span>
          <strong>{lessonTitle}</strong>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-redesign-page">
      <TeacherRedesignStyles />

      <style>{`
        /* wr-c-review-identity-visibility-polish */
        .teacher-review-identity-block {
          background: linear-gradient(135deg, #f0fdf4 0%, #fffbea 100%);
          border: 1px solid #bbf7d0;
          border-radius: 22px;
          padding: 15px 16px;
          margin-bottom: 14px;
          box-shadow: 0 10px 24px rgba(0, 107, 63, 0.08);
        }

        .teacher-review-identity-main {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .teacher-review-student-name {
          display: block;
          color: #061733;
          font-size: 1.28rem;
          line-height: 1.15;
          margin-bottom: 10px;
        }

        .teacher-review-chip-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
        }

        .teacher-review-chip-row span {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          background: #ffffff;
          border: 1px solid #b7ecd0;
          color: #006b3f;
          font-size: 0.86rem;
          font-weight: 950;
          padding: 7px 10px;
          letter-spacing: 0.01em;
        }

        .teacher-review-lesson-box {
          display: grid;
          gap: 5px;
          background: #ffffff;
          border: 1px solid #d9f4e5;
          border-radius: 16px;
          padding: 11px 12px;
        }

        .teacher-review-lesson-box span {
          color: #64748b;
          font-size: 0.74rem;
          font-weight: 950;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .teacher-review-lesson-box strong {
          color: #0f172a;
          font-size: 1rem;
          line-height: 1.35;
        }

        @media (max-width: 760px) {
          .teacher-review-identity-main {
            flex-direction: column;
          }

          .teacher-review-student-name {
            font-size: 1.14rem;
          }
        }
      `}</style>

      <style>{`
        /* teacher-verification-tab-polish */
        .teacher-verification-panel .teacher-tool-box {
          margin-bottom: 18px;
        }

        .teacher-verification-panel .teacher-workspace-heading h2 {
          font-size: 1.75rem;
        }
      `}</style>


      <style>{`
        /* teacher-group-task-progress-container */
        .teacher-group-progress-container {
          margin-bottom: 18px;
        }

        .teacher-group-progress-list {
          display: grid;
          grid-template-columns: repeat(2, minmax(280px, 1fr));
          gap: 16px;
        }

        .teacher-group-progress-card {
          background: #ffffff;
          border: 1px solid #dfeee6;
          border-radius: 24px;
          padding: 20px;
          box-shadow: 0 10px 24px rgba(13, 71, 45, 0.045);
        }

        .teacher-group-progress-card-top {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: flex-start;
        }

        .teacher-group-progress-card-top strong {
          display: block;
          color: #10213f;
          font-size: 1.1rem;
          line-height: 1.3;
        }

        .teacher-group-progress-card-top p {
          margin: 5px 0 0;
          color: #63756c;
          font-weight: 800;
          line-height: 1.35;
        }

        .teacher-group-progress-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-top: 16px;
        }

        .teacher-group-progress-stat {
          background: #f8fcfa;
          border: 1px solid #e4f1e9;
          border-radius: 18px;
          padding: 12px;
          text-align: center;
        }

        .teacher-group-progress-stat span {
          display: block;
          color: #6d7b73;
          font-size: 0.78rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .teacher-group-progress-stat strong {
          display: block;
          margin-top: 4px;
          color: #10213f;
          font-size: 1.25rem;
        }

        .teacher-group-progress-details {
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid #edf3ef;
          display: grid;
          gap: 8px;
        }

        .teacher-group-progress-student {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
          background: #f8fcfa;
          border: 1px solid #e5f1e9;
          border-radius: 16px;
          padding: 10px 12px;
          color: #10213f;
          font-weight: 850;
        }

        @media (max-width: 980px) {
          .teacher-group-progress-list,
          .teacher-group-progress-stats {
            grid-template-columns: 1fr;
          }

          .teacher-group-progress-card-top {
            flex-direction: column;
          }
        }
      `}</style>


      <style>{`
        /* teacher-group-member-task-polish */
        .clean-groups-panel .teacher-groups-grid {
          grid-template-columns: repeat(2, minmax(280px, 1fr)) !important;
          align-items: stretch;
        }

        .teacher-group-details-box {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 16px;
        }

        .teacher-group-detail-section {
          background: #f8fcfa;
          border: 1px solid #e3f0e8;
          border-radius: 18px;
          padding: 14px;
          min-height: 104px;
        }

        .teacher-group-detail-section h4 {
          margin: 0 0 10px;
          color: #006b3f;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .teacher-group-chip-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .teacher-group-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 999px;
          background: #ffffff;
          border: 1px solid #dcefe5;
          color: #10213f;
          padding: 8px 10px;
          font-weight: 850;
          font-size: 0.88rem;
          line-height: 1.2;
        }

        .teacher-group-task-list {
          display: grid;
          gap: 8px;
        }

        .teacher-group-task-item {
          background: #ffffff;
          border: 1px solid #dcefe5;
          border-radius: 14px;
          padding: 9px 10px;
          color: #10213f;
          font-weight: 850;
          font-size: 0.88rem;
          line-height: 1.3;
        }

        .teacher-group-task-item small {
          display: block;
          margin-top: 4px;
          color: #6d7b73;
          font-weight: 800;
        }

        .teacher-group-empty-note {
          color: #718178;
          font-weight: 800;
          font-size: 0.9rem;
          line-height: 1.35;
        }

        .clean-groups-panel .teacher-add-member-row {
          display: grid !important;
          grid-template-columns: minmax(0, 1fr) auto !important;
          align-items: center;
          gap: 12px;
          margin-top: 16px;
          padding: 14px;
          background: #f4fbf7;
          border: 1px solid #dcefe5;
          border-radius: 20px;
        }

        .clean-groups-panel .teacher-add-member-row .input-field {
          min-width: 0;
          width: 100%;
        }

        .clean-groups-panel .teacher-add-member-row button {
          white-space: nowrap;
          min-width: 130px;
        }

        @media (max-width: 1120px) {
          .clean-groups-panel .teacher-groups-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 760px) {
          .teacher-group-details-box {
            grid-template-columns: 1fr;
          }

          .clean-groups-panel .teacher-add-member-row {
            grid-template-columns: 1fr !important;
          }

          .clean-groups-panel .teacher-add-member-row button {
            width: 100%;
          }
        }
      `}</style>


      <style>{`
        /* teacher-group-manager-clean-polish */
        .clean-groups-panel .teacher-workspace-heading > div > p {
          display: none;
        }

        .clean-groups-panel .teacher-group-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }

        .clean-groups-panel .teacher-group-tools {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .clean-groups-panel .teacher-tool-box {
          padding: 24px !important;
          border-radius: 26px !important;
        }

        .clean-groups-panel .teacher-tool-box h3 {
          font-size: 1.45rem !important;
        }

        .clean-groups-panel .teacher-tool-box p {
          font-size: 1rem !important;
        }

        .clean-groups-panel .teacher-groups-area {
          padding: 24px !important;
          border-radius: 28px !important;
        }

        .clean-groups-panel .teacher-mini-heading {
          align-items: center;
          margin-bottom: 18px;
        }

        .clean-groups-panel .teacher-mini-heading h3 {
          font-size: 1.55rem !important;
        }

        .clean-groups-panel .teacher-groups-grid {
          grid-template-columns: repeat(3, minmax(220px, 1fr));
          gap: 16px;
        }

        .clean-groups-panel .teacher-group-item {
          padding: 20px !important;
          border-radius: 24px !important;
          box-shadow: 0 10px 24px rgba(13, 71, 45, 0.04);
        }

        .clean-groups-panel .teacher-group-item strong {
          font-size: 1.12rem !important;
          line-height: 1.3;
        }

        .clean-groups-panel .teacher-group-item p {
          font-size: 0.96rem !important;
          font-weight: 750;
        }

        .teacher-group-meta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 14px;
        }

        .teacher-group-actions-row {
          display: flex;
          gap: 10px;
          margin-top: 16px;
          padding-top: 14px;
          border-top: 1px solid #edf3ef;
        }

        .teacher-group-actions-row button {
          flex: 1;
        }

        .clean-groups-panel .teacher-add-member-row {
          margin-top: 14px;
          grid-template-columns: minmax(0, 1fr) auto;
          background: #f8fcfa;
          border: 1px solid #e3f0e8;
          border-radius: 18px;
          padding: 12px;
        }

        @media (max-width: 1120px) {
          .clean-groups-panel .teacher-groups-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 820px) {
          .clean-groups-panel .teacher-group-tools,
          .clean-groups-panel .teacher-groups-grid {
            grid-template-columns: 1fr;
          }

          .teacher-group-actions-row,
          .clean-groups-panel .teacher-add-member-row {
            grid-template-columns: 1fr;
            flex-direction: column;
          }
        }
      `}</style>


      <style>{`
        /* teacher-dashboard-assigned-classes-polish */
        .teacher-assigned-classes-card {
          padding: 30px 34px !important;
        }

        .teacher-assigned-classes-card .lms-section-label {
          font-size: 0.96rem !important;
        }

        .teacher-assigned-classes-card h2 {
          font-size: 1.8rem !important;
          line-height: 1.18 !important;
          margin-bottom: 10px !important;
        }

        .teacher-assigned-classes-card .pill {
          font-size: 1rem !important;
          padding: 10px 16px !important;
          border-radius: 999px !important;
        }
      `}</style>


      <style>{`
        /* lesson-builder-readable-text */
        .teacher-builder-workflow {
          gap: 12px;
          padding: 14px;
        }

        .teacher-builder-step {
          font-size: 1rem !important;
          padding: 14px 18px !important;
        }

        .teacher-builder-layout .teacher-design-card,
        .teacher-builder-layout .teacher-side-card,
        .teacher-builder-layout .teacher-tool-box {
          padding: 24px !important;
        }

        .teacher-builder-layout .lms-section-label {
          font-size: 0.9rem !important;
          letter-spacing: 0.08em;
        }

        .teacher-builder-layout h2 {
          font-size: 1.65rem !important;
          line-height: 1.2 !important;
        }

        .teacher-builder-layout h3 {
          font-size: 1.2rem !important;
          line-height: 1.25 !important;
        }

        .teacher-builder-layout p,
        .teacher-builder-layout .muted,
        .teacher-builder-layout small,
        .teacher-builder-layout li {
          font-size: 1rem !important;
          line-height: 1.55 !important;
        }

        .teacher-builder-layout label,
        .teacher-builder-layout .field-label {
          font-size: 1rem !important;
          font-weight: 900 !important;
        }

        .teacher-builder-layout .input-field,
        .teacher-builder-layout input,
        .teacher-builder-layout select,
        .teacher-builder-layout textarea {
          font-size: 1rem !important;
          min-height: 48px;
          padding: 13px 15px !important;
        }

        .teacher-builder-layout textarea.input-field,
        .teacher-builder-layout textarea {
          min-height: 120px;
        }

        .teacher-builder-layout .teacher-activity-block,
        .teacher-builder-layout .teacher-activity-item {
          padding: 20px !important;
        }

        .teacher-builder-layout .lms-mini-pill,
        .teacher-builder-layout .pill {
          font-size: 0.9rem !important;
          padding: 8px 12px !important;
        }

        .teacher-builder-layout .lms-action-primary,
        .teacher-builder-layout .lms-action-secondary,
        .teacher-builder-layout .lms-main-action,
        .teacher-builder-layout .lms-outline-action,
        .teacher-builder-layout button {
          font-size: 0.98rem;
        }

        .lms-bottom-action-bar {
          padding: 16px !important;
          gap: 12px !important;
        }

        .lms-bottom-action-bar button {
          font-size: 1rem !important;
          padding: 13px 18px !important;
        }

        .teacher-builder-layout .lms-live-preview,
        .teacher-builder-layout .lms-live-preview * {
          font-size: 1rem;
          line-height: 1.55;
        }

        .teacher-builder-layout .lms-live-preview h2 {
          font-size: 1.7rem !important;
        }

        .teacher-builder-layout .lms-live-preview h3 {
          font-size: 1.25rem !important;
        }

        .teacher-builder-layout .lms-recent-table,
        .teacher-builder-layout .lms-recent-table * {
          font-size: 1rem !important;
        }

        @media (max-width: 860px) {
          .teacher-builder-layout h2 {
            font-size: 1.45rem !important;
          }

          .teacher-builder-step {
            font-size: 0.95rem !important;
          }
        }
      `}</style>

      <style>{`
        .teacher-builder-layout > .teacher-builder-main > section,
        .teacher-builder-layout > .teacher-builder-side > section {
          display: none !important;
        }

        .teacher-builder-layout.builder-tab-source > .teacher-builder-main > section:nth-of-type(1) {
          display: block !important;
        }

        .teacher-builder-layout.builder-tab-details > .teacher-builder-main > section:nth-of-type(2),
        .teacher-builder-layout.builder-tab-details > .teacher-builder-main > section:nth-of-type(3) {
          display: block !important;
        }

        .teacher-builder-layout.builder-tab-activities > .teacher-builder-main > section:nth-of-type(4),
        .teacher-builder-layout.builder-tab-activities > .teacher-builder-main > section:nth-of-type(5),
        .teacher-builder-layout.builder-tab-activities > .teacher-builder-side > section:nth-of-type(2),
        .teacher-builder-layout.builder-tab-activities > .teacher-builder-side > section:nth-of-type(3) {
          display: block !important;
        }

        .teacher-builder-layout.builder-tab-preview {
          grid-template-columns: minmax(0, 1fr) !important;
        }

        .teacher-builder-layout.builder-tab-preview > .teacher-builder-main {
          display: none !important;
        }

        .teacher-builder-layout.builder-tab-preview > .teacher-builder-side {
          max-width: 820px;
          width: 100%;
          margin: 0 auto;
        }

        .teacher-builder-layout.builder-tab-preview > .teacher-builder-side > section:nth-of-type(1) {
          display: block !important;
        }

        .teacher-builder-layout.builder-tab-lessons {
          grid-template-columns: minmax(0, 1fr) !important;
        }

        .teacher-builder-layout.builder-tab-lessons > .teacher-builder-side {
          display: none !important;
        }

        .teacher-builder-layout.builder-tab-lessons > .teacher-builder-main > .builder-panel-lessons {
          display: block !important;
        }
      `}</style>



      <style>{`
        .admin-clean-table {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
          margin-top: 18px;
        }

        .admin-clean-table-head,
        .admin-clean-table-row {
          display: grid;
          grid-template-columns: 1.4fr 1fr .8fr 1.6fr;
          gap: 16px;
          align-items: center;
          padding: 14px 16px;
          border-radius: 18px;
        }

        .admin-clean-table-head {
          background: #f4fbf7;
          color: #43564d;
          font-size: 0.82rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .admin-clean-table-row {
          background: #ffffff;
          border: 1px solid #e1efe7;
          box-shadow: 0 8px 22px rgba(13, 71, 45, 0.04);
        }

        .admin-clean-table-row strong {
          display: block;
          color: #10213f;
          font-size: 0.98rem;
          line-height: 1.35;
        }

        .admin-clean-table-row small {
          display: block;
          color: #60736a;
          font-weight: 800;
          margin-top: 4px;
        }

        .admin-clean-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: flex-end;
        }

        .admin-audit-table .admin-clean-table-head,
        .admin-audit-table .admin-clean-table-row {
          grid-template-columns: 1.35fr 1fr .8fr 1fr;
        }

        @media (max-width: 980px) {
          .admin-clean-table-head {
            display: none;
          }

          .admin-clean-table-row,
          .admin-audit-table .admin-clean-table-row {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .admin-clean-actions {
            justify-content: flex-start;
          }
        }
      `}</style>

      <header className="teacher-main-header teacher-main-header-clean">
        <div className="teacher-brand-area">
          <div className="teacher-brand-mark">
            <img
              src="/tuklas-talino-icon.png"
              alt=""
              className="teacher-brand-logo-img"
              style={{ width: '52px', height: '52px', objectFit: 'contain', borderRadius: '14px', background: '#ffffff' }}
            />
            <div className="teacher-brand-text">
              <strong>Tuklas Talino</strong>
              <small>Tuklasin. Matuto. Magningning.</small>
            </div>
          </div>

        </div>

        <div className="teacher-header-actions">
          <div className="teacher-profile-pill">
            <div className="teacher-profile-avatar">👩‍🏫</div>
            <div className="teacher-profile-text">
              <strong>{teacherName}</strong>
              <small>Teacher</small>
            </div>
          </div>

        </div>
      </header>

      <main className="teacher-main-content teacher-main-content-clean" id="teacher-dashboard-top">
        <div className="teacher-sidebar-layout">
          <aside className="teacher-side-nav" aria-label="Teacher workspace navigation">
            <div className="teacher-side-nav-title">
              <span>📘</span>
              <strong>Workspace</strong>
            </div>

            <button
              className={`teacher-sidebar-button ${teacherTab === 'lessons' ? 'active' : ''}`}
              type="button"
              onClick={() => openTab('lessons')}
            >
              <span>📚</span>
              <strong>Lesson Builder</strong>
            </button>

            <button
              className={`teacher-sidebar-button ${teacherTab === 'groups' ? 'active' : ''}`}
              type="button"
              onClick={() => openTab('groups')}
            >
              <span>👥</span>
              <strong>Group Manager</strong>
            </button>

            <button
              className={`teacher-sidebar-button ${teacherTab === 'verification' ? 'active' : ''}`}
              type="button"
              onClick={() => openTab('verification')}
            >
              <span>✅</span>
              <strong>Teacher Verification</strong>
            </button>

            <button
              className={`teacher-sidebar-button ${teacherTab === 'reviews' ? 'active' : ''}`}
              type="button"
              onClick={() => openTab('reviews')}
            >
              <span>📝</span>
              <strong>Writing & Speech Reviews</strong>
            </button>

            <button
              className={`teacher-sidebar-button ${teacherTab === 'assessments' ? 'active' : ''}`}
              type="button"
              onClick={() => openTab('assessments')}
            >
              <span>🧠</span>
              <strong>Assessment Results</strong>
            </button>

            <button
              className={`teacher-sidebar-button ${teacherTab === 'students' ? 'active' : ''}`}
              type="button"
              onClick={() => openTab('students')}
            >
              <span>🎓</span>
              <strong>Student Monitoring</strong>
            </button>

            <button
              className="teacher-sidebar-button"
              type="button"
              onClick={downloadSummaryReport}
            >
              <span>📊</span>
              <strong>Report</strong>
            </button>

            <button
              className="teacher-sidebar-button danger"
              type="button"
              onClick={logout}
            >
              <span>⇥</span>
              <strong>Logout</strong>
            </button>
          </aside>

          <div className="teacher-main-workarea" id="teacher-dashboard-workspace">
        <section className="teacher-clean-hero">
          <div className="teacher-clean-hero-copy">
            <div className="lms-section-label">Teacher Workspace</div>
            <h1>Teacher Dashboard</h1>
          </div>

          <div className="teacher-clean-actions">
            <button className="lms-view-button" type="button" onClick={openLessonsList}>
              📚 View Lessons
            </button>
            <button className="teacher-logout-btn light" type="button" onClick={() => openTab('students')}>
              🎓 Monitor Students
            </button>
          </div>
        </section>

        <section className="teacher-workspace-card teacher-assigned-classes-card" style={{ marginBottom: 16 }}>
          <div className="lms-section-label">Assigned Classes</div>
          <h2>Your Handled Classes</h2>

          <div className="divider" />

          <div className="row" style={{ flexWrap: 'wrap', gap: 10 }}>
            {assignedClasses.length ? assignedClasses.map(item => (
              <span className="pill" key={item.id || `${item.gradeLevel}-${item.section}`}>
                Grade {item.gradeLevel} • {item.section}
              </span>
            )) : (
              <span className="muted">
                No assigned class yet. Ask the admin to assign your grade and section.
              </span>
            )}
          </div>
        </section>

        <section className="teacher-clean-metrics" aria-label="Teacher quick stats">
          <button className="teacher-clean-metric" type="button" onClick={() => openTab('lessons')}>
            <span className="metric-icon green">📄</span>
            <span>
              <small>Draft Lessons</small>
              <strong>{draftLessons || 0}</strong>
            </span>
          </button>

          <button className="teacher-clean-metric" type="button" onClick={openLessonsList}>
            <span className="metric-icon yellow">✅</span>
            <span>
              <small>Published Lessons</small>
              <strong>{publishedLessons || lessons.length || 0}</strong>
            </span>
          </button>

          <button className="teacher-clean-metric" type="button" onClick={() => openTab('students')}>
            <span className="metric-icon blue">👥</span>
            <span>
              <small>Students</small>
              <strong>{studentCount}</strong>
            </span>
          </button>

          <button className="teacher-clean-metric" type="button" onClick={() => openTab('students')}>
            <span className="metric-icon purple">⭐</span>
            <span>
              <small>Class Progress</small>
              <strong>{averageProgress}%</strong>
            </span>
          </button>
        </section>

        {teacherTab === 'lessons' && (
          <section className="teacher-clean-panel">
            <TeacherLessonManager lessons={lessons} createLesson={createLesson} deleteLesson={deleteLesson} assignedClasses={assignedClasses} />
          </section>
        )}


        {teacherTab === 'reviews' && (
          <section className="teacher-workspace-card clean-groups-panel teacher-review-panel" id="teacher-writing-speech-reviews">
            <div className="teacher-workspace-heading">
              <div>
                <div className="lms-section-label">Writing & Speech Reviews</div>
                <h2>Student Submission Review</h2>
                <p>Grade Grade 3–6 writing submissions and view speech attempts from your assigned learners.</p>
              </div>
            </div>

            <div className="teacher-monitor-summary" style={{ marginBottom: 18 }}>
              <div><span>Pending Writing</span><strong>{pendingWritingReviewRows.length}</strong></div>
              <div><span>Graded Writing</span><strong>{gradedWritingReviewRows.length}</strong></div>
              <div><span>Speech Attempts</span><strong>{speechReviewRows.length}</strong></div>
            </div>

            <div className="teacher-tool-box" style={{ marginBottom: 18 }}>
              <div className="teacher-workspace-heading" style={{ marginBottom: 12 }}>
                <div>
                  <div className="lms-section-label">Writing Submissions</div>
                  <h3>Writing Submissions for Grading</h3>
                  <p>Only Grade 3–6 pending writing submissions can be graded here. The score from 1–10 becomes the XP earned.</p>
                </div>
                <span className="lms-mini-pill">✍️ {pendingWritingReviewRows.length} pending</span>
              </div>

              {pendingWritingReviewRows.length ? (
                <div className="teacher-groups-grid">
                  {pendingWritingReviewRows.map(item => {
                    const scoreInputId = `writing-review-score-${item.id}`;
                    const feedbackInputId = `writing-review-feedback-${item.id}`;
                    const isSaving = Boolean(gradingWritingIds[item.id]);

                    return (
                      <div className="teacher-group-item" key={`writing-review-${item.id}`}>
                        {renderReviewIdentity(item, 'Pending Grade')}

                        <div className="teacher-group-submission-evidence">
                          <div>
                            <span>Submitted Date</span>
                            <strong>{formatReviewDate(item.submittedAt)}</strong>
                          </div>

                          <div>
                            <span>XP Rule</span>
                            <strong>Score 1–10 = +1 to +10 XP</strong>
                          </div>
                        </div>

                        <div style={{ marginTop: 14 }}>
                          <div className="g46-ref-muted" style={{ fontWeight: 950, marginBottom: 6 }}>Writing Prompt</div>
                          <div className="teacher-group-detail-section" style={{ minHeight: 'auto' }}>
                            {item.task?.prompt || 'No prompt available.'}
                          </div>
                        </div>

                        <div style={{ marginTop: 14 }}>
                          <div className="g46-ref-muted" style={{ fontWeight: 950, marginBottom: 6 }}>Student Answer</div>
                          <div className="teacher-group-detail-section" style={{ minHeight: 'auto', whiteSpace: 'pre-wrap' }}>
                            {item.content || 'No answer submitted.'}
                          </div>
                        </div>

                        <label className="g46-ref-muted" htmlFor={scoreInputId} style={{ display: 'grid', gap: 8, marginTop: 14, fontWeight: 900 }}>
                          Score
                          <select
                            id={scoreInputId}
                            className="input-field"
                            defaultValue=""
                            style={{ width: '100%', minHeight: 46 }}
                          >
                            <option value="">Select score from 1 to 10</option>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => (
                              <option key={score} value={score}>{score}/10 → +{score} XP</option>
                            ))}
                          </select>
                        </label>

                        <label className="g46-ref-muted" htmlFor={feedbackInputId} style={{ display: 'grid', gap: 8, marginTop: 14, fontWeight: 900 }}>
                          Teacher Feedback
                          <textarea
                            id={feedbackInputId}
                            className="input-field"
                            placeholder="Optional feedback for the student. Do not include XP here; the system will show XP separately."
                            rows="3"
                            style={{
                              width: '100%',
                              minHeight: 92,
                              resize: 'vertical',
                              fontSize: 15,
                              lineHeight: 1.45,
                              padding: '13px 15px'
                            }}
                          />
                        </label>

                        <button
                          type="button"
                          className="lms-main-action full"
                          style={{ marginTop: 12 }}
                          disabled={isSaving}
                          onClick={() => handleSaveWritingGrade(item)}
                        >
                          {isSaving ? 'Saving Grade...' : 'Save Grade'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="teacher-empty-panel">
                  <div>✅</div>
                  <strong>No pending writing submissions.</strong>
                  <p>Grade 3–6 writing submissions waiting for grades will appear here.</p>
                </div>
              )}
            </div>

            <div className="teacher-tool-box" style={{ marginBottom: 18 }}>
              <div className="teacher-workspace-heading" style={{ marginBottom: 12 }}>
                <div>
                  <div className="lms-section-label">Speech Review</div>
                  <h3>Speech Attempts</h3>
                  <p>View student speech attempts, transcript, target text, and recording if available.</p>
                </div>
                <span className="lms-mini-pill">🎙️ {speechReviewRows.length} attempts</span>
              </div>

              {speechReviewRows.length ? (
                <div className="teacher-groups-grid">
                  {speechReviewRows.map(item => (
                    <div className="teacher-group-item" key={`speech-review-${item.id}`}>
                      {renderReviewIdentity(item, 'View Only')}

                      <div className="teacher-group-submission-evidence">
                        <div>
                          <span>Submitted Date</span>
                          <strong>{formatReviewDate(item.submittedAt)}</strong>
                        </div>

                        <div>
                          <span>Speech Score</span>
                          <strong>{item.score ?? 'Not scored'}</strong>
                        </div>
                      </div>

                      <div style={{ marginTop: 14 }}>
                        <div className="g46-ref-muted" style={{ fontWeight: 950, marginBottom: 6 }}>Target Text</div>
                        <div className="teacher-group-detail-section" style={{ minHeight: 'auto' }}>
                          {item.task?.targetText || 'No target text available.'}
                        </div>
                      </div>

                      <div style={{ marginTop: 14 }}>
                        <div className="g46-ref-muted" style={{ fontWeight: 950, marginBottom: 6 }}>Student Transcript</div>
                        <div className="teacher-group-detail-section" style={{ minHeight: 'auto', whiteSpace: 'pre-wrap' }}>
                          {item.transcript || 'No transcript available.'}
                        </div>
                      </div>

                      {item.audioUrl ? (
                        <a
                          className="teacher-file-link"
                          href={item.audioUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ marginTop: 12, display: 'inline-flex' }}
                        >
                          ▶ Play Recording
                        </a>
                      ) : (
                        <p className="g46-ref-muted" style={{ marginTop: 12 }}>No recording link available.</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="teacher-empty-panel">
                  <div>🎙️</div>
                  <strong>No speech attempts yet.</strong>
                  <p>Speech attempts from assigned learners will appear here.</p>
                </div>
              )}
            </div>

            <div className="teacher-tool-box">
              <div className="teacher-workspace-heading" style={{ marginBottom: 12 }}>
                <div>
                  <div className="lms-section-label">Recently Graded</div>
                  <h3>Recently Graded Writing</h3>
                </div>
                <span className="lms-mini-pill">⭐ {gradedWritingReviewRows.length} graded</span>
              </div>

              {gradedWritingReviewRows.length ? (
                <div className="teacher-group-progress-list">
                  {gradedWritingReviewRows.map(item => (
                    <div className="teacher-group-progress-card" key={`graded-writing-${item.id}`}>
                      {renderReviewIdentity(item, `Score ${item.score ?? '-'} / 10`)}
                      <div style={{ marginTop: 10 }}>
                        <span className="lms-mini-pill">+{item.xpPreview ?? item.score ?? 0} XP</span>
                      </div>
                      <p className="g46-ref-muted" style={{ marginTop: 10 }}>
                        Feedback: {item.feedback || 'No feedback added.'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="teacher-empty-panel">
                  <div>📝</div>
                  <strong>No graded writing yet.</strong>
                  <p>Saved grades will appear here after teachers review writing submissions.</p>
                </div>
              )}
            </div>
          </section>
        )}


        {teacherTab === 'verification' && (
          <section className="teacher-workspace-card clean-groups-panel teacher-verification-panel" id="teacher-verification-panel">
            <div className="teacher-workspace-heading">
              <div>
                <div className="lms-section-label">Teacher Verification</div>
                <h2>Group Task Review</h2>
              </div>
            </div>

<div className="teacher-tool-box" style={{ marginBottom: 18 }}>
              <div className="teacher-workspace-heading" style={{ marginBottom: 12 }}>
                <div>
                  <div className="lms-section-label">Teacher Verification</div>
                  <h3>Pending Group Checks</h3>
                  <p>Review one leader submission before XP is awarded to the group.</p>
                </div>
                <span className="lms-mini-pill">⏳ {pendingGroupRows.length} pending</span>
              </div>

              {pendingGroupRows.length ? (
                <div className="teacher-groups-grid">
                  {pendingGroupRows.map(row => (
                    <div className="teacher-group-item" key={`${row.groupTaskId}-${row.studentId}`}>
                      {(() => {
                        const feedbackInputId = `group-review-feedback-${row.groupTaskId}-${row.studentId}`;
                        const submittedDate = row.submittedAt
                          ? new Date(row.submittedAt).toLocaleString()
                          : 'No submission date';

                        return (
                          <>
                            <div className="teacher-group-item-top">
                              <div>
                                <strong>{row.taskTitle || 'Group Task'}</strong>
                                <p>{row.groupName || 'Group'} • +{row.taskXp || 0} XP</p>
                                <p className="g46-ref-muted">
                                  Grade {row.gradeLevel || '-'} {row.section ? `• ${row.section}` : ''} • Submitted by {row.studentName || 'Leader'} as {row.studentRole || 'Leader'}
                                </p>
                              </div>
                              <span className="lms-mini-pill">Pending Review</span>
                            </div>

                            <div className="teacher-group-submission-evidence">
                              <div>
                                <span>Task Title</span>
                                <strong>{row.taskTitle || 'Group Task'}</strong>
                              </div>

                              <div>
                                <span>Group Name</span>
                                <strong>{row.groupName || 'Group'}</strong>
                              </div>

                              <div>
                                <span>Submitted Date</span>
                                <strong>{submittedDate}</strong>
                              </div>

                              <div>
                                <span>Current Status</span>
                                <strong>{groupProgressStatusLabel(row.verificationStatus || 'pending')}</strong>
                              </div>

                              <div>
                                <span>Submitted File</span>
                                <strong>{row.fileName || 'No file attached'}</strong>
                              </div>

                              {row.fileUrl ? (
                                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                                  <a
                                    className="teacher-file-link"
                                    href={row.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    View File
                                  </a>

                                  <a
                                    className="teacher-file-link"
                                    href={row.fileUrl}
                                    download={row.fileName || true}
                                  >
                                    Download File
                                  </a>
                                </div>
                              ) : (
                                <div className="g46-ref-muted">No file or link attached.</div>
                              )}
                            </div>

                            <label className="g46-ref-muted" htmlFor={feedbackInputId} style={{ display: 'grid', gap: 8, marginTop: 14, fontWeight: 900 }}>
                              Teacher Remarks
                              <textarea
                                id={feedbackInputId}
                                className="input-field"
                                placeholder="Write feedback for the group. Required if rejecting. Optional if approving."
                                rows="3"
                                style={{
                                  width: '100%',
                                  minHeight: 92,
                                  resize: 'vertical',
                                  fontSize: 15,
                                  lineHeight: 1.45,
                                  padding: '13px 15px'
                                }}
                              />
                            </label>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
                              <button
                                type="button"
                                className="lms-main-action full"
                                onClick={() => approveGroupTaskCompletion(
                                  row,
                                  document.getElementById(feedbackInputId)?.value || ''
                                )}
                              >
                                Approve
                              </button>

                              <button
                                type="button"
                                className="lms-action-secondary"
                                style={{
                                  borderColor: '#fca5a5',
                                  background: '#fef2f2',
                                  color: '#b91c1c',
                                  fontWeight: 950
                                }}
                                onClick={() => rejectGroupTaskCompletion(
                                  row,
                                  document.getElementById(feedbackInputId)?.value || ''
                                )}
                              >
                                Reject
                              </button>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="teacher-empty-panel">
                  <div>✅</div>
                  <strong>No pending checks.</strong>
                  <p>Student group submissions that need approval will appear here.</p>
                </div>
              )}
            </div>

            <div className="teacher-tool-box teacher-group-progress-container">
              <div className="teacher-workspace-heading" style={{ marginBottom: 12 }}>
                <div>
                  <div className="lms-section-label">Group Submission Summary</div>
                  <h3>Track each group’s submitted task and review status.</h3>
                </div>
                <span className="lms-mini-pill">📌 {groupProgressRows.length} task{groupProgressRows.length === 1 ? '' : 's'}</span>
              </div>

              {groupProgressRows.length ? (
                <div className="teacher-group-progress-list">
                  {groupProgressRows.map(row => {
                    const isOpen = Boolean(openGroupProgress[row.key]);
                    const submittedDate = row.submittedAt
                      ? new Date(row.submittedAt).toLocaleString()
                      : '';
                    const statusLabel = groupProgressStatusLabel(row.status);

                    return (
                      <div className="teacher-group-progress-card" key={row.key}>
                        <div className="teacher-group-progress-card-top">
                          <div>
                            <strong>{row.groupName}</strong>
                            <p>{row.taskTitle} • +{row.xpReward} XP</p>
                          </div>

                          <span className="lms-mini-pill">{statusLabel}</span>
                        </div>

                        <div
                          className="teacher-group-submission-evidence"
                          style={{ marginTop: 14 }}
                        >
                          <div>
                            <span>Group Name</span>
                            <strong>{row.groupName || 'Group'}</strong>
                          </div>

                          <div>
                            <span>Task Title</span>
                            <strong>{row.taskTitle || 'Group Task'}</strong>
                          </div>

                          <div>
                            <span>Current Status</span>
                            <strong>{statusLabel}</strong>
                          </div>

                          <div>
                            <span>Submitted By</span>
                            <strong>{row.submittedByName || 'No submission yet'}</strong>
                          </div>

                          <div>
                            <span>Submitted Date</span>
                            <strong>{submittedDate || 'No submission yet'}</strong>
                          </div>

                          {row.teacherFeedback && (
                            <div>
                              <span>Teacher Remarks</span>
                              <strong>{row.teacherFeedback}</strong>
                            </div>
                          )}

                          <div>
                            <span>Submitted File</span>
                            <strong>{row.fileName || 'No file attached'}</strong>
                          </div>

                          {row.fileUrl && (
                            <a
                              className="teacher-file-link"
                              href={row.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              View File
                            </a>
                          )}
                        </div>

                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ marginTop: 14 }}
                          onClick={() => toggleGroupProgress(row.key)}
                        >
                          {isOpen ? 'Hide Members' : 'View Details'}
                        </button>

                        {isOpen && (
                          <div className="teacher-group-progress-details">
                            {row.details.length ? row.details.map(detail => (
                              <div className="teacher-group-progress-student" key={`${row.key}-${detail.studentId}`}>
                                <span>{detail.studentName}</span>
                                <span className="lms-mini-pill">
                                  {String(detail.role || 'member').toLowerCase() === 'leader' ? 'Leader' : 'Member'}
                                </span>
                              </div>
                            )) : (
                              <div className="lms-empty-line">No members in this group yet.</div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="teacher-empty-panel">
                  <div>📌</div>
                  <strong>No group submissions yet.</strong>
                  <p>Add tasks to your groups first. Group submissions will appear here after the leader submits a task.</p>
                </div>
              )}
            </div>


          </section>
        )}

{teacherTab === 'groups' && (
          <section className="teacher-workspace-card clean-groups-panel" id="teacher-group-manager">
            <div className="teacher-workspace-heading">
              <div>
                <div className="lms-section-label">Classroom Tools</div>
                <h2>Group Manager</h2>
                <p>Create groups, assign tasks, and add students to collaborative learning groups.</p>
              </div>
            </div>

            <div className="teacher-group-layout">
              <div className="teacher-group-tools">
                <div className="teacher-tool-box">
                  <div className="teacher-tool-icon purple">➕</div>
                  <h3>Create Group</h3>
                  <p>Set up a group, class section, or collaborative activity team.</p>

                  <input className="input-field" id="t-group-name" placeholder="Group name" />
                  <input className="input-field" id="t-group-section" placeholder="Description / Section" />

                  <button className="lms-main-action full" onClick={createGroup}>
                    Create Group
                  </button>
                </div>

                <div className="teacher-tool-box">
                  <div className="teacher-tool-icon orange">📝</div>
                  <h3>Add Task</h3>
                  <p>Assign collaborative work with a deadline and XP reward.</p>

                  <select className="input-field" id="t-task-group">
                    {groups.length ? (
                      groups.map(group => (
                        <option value={group.id} key={group.id}>{group.name}</option>
                      ))
                    ) : (
                      <option value="">No groups yet</option>
                    )}
                  </select>

                  <input className="input-field" id="t-task-title" placeholder="Task title" />

                  <div className="teacher-two-fields">
                    <input className="input-field" id="t-task-deadline" type="date" />
                    <input className="input-field" id="t-task-xp" type="number" min="0" defaultValue="10" placeholder="XP" />
                  </div>

                  <button className="lms-outline-action full" onClick={addTask}>
                    Add Task
                  </button>
                </div>
              </div>

              <div className="teacher-groups-area">
                <div className="teacher-mini-heading">
                  <div>
                    <h3>Groups</h3>
                    <p>Add students to existing groups and review assigned tasks.</p>
                  </div>
                  <span className="lms-mini-pill">{groups.length} group{groups.length === 1 ? '' : 's'}</span>
                </div>

                <div className="teacher-groups-grid">
                  {groups.length ? groups.map(group => {
                    const members = group.members || group.Members || [];
                    const tasks = group.tasks || [];
                    const memberCount = members.length;
                    const taskCount = tasks.length;
                    const isOpen = Boolean(openGroupTools[group.id]);

                    return (
                      <div className="teacher-group-item" key={group.id}>
                        <div className="teacher-group-item-top">
                          <div>
                            <strong>{group.name}</strong>
                            <p>{group.description || 'No description added.'}</p>
                          </div>
                        </div>

                        <div className="teacher-group-meta-row">
                          <span className="lms-mini-pill">👥 {memberCount} member{memberCount === 1 ? '' : 's'}</span>
                          <span className="lms-mini-pill">✅ {taskCount} task{taskCount === 1 ? '' : 's'}</span>
                        </div>

                        <div className="teacher-group-details-box">
                          <div className="teacher-group-detail-section">
                            <h4>Members</h4>
                            {members.length ? (
                              <div className="teacher-group-chip-list">
                                {members.map(member => {
                                  const student = member.Student || member.student || member;
                                  const studentId = student.id || member.studentId;
                                  const isLeader = member.groupRole === 'leader';
                                  return (
                                    <div className={`teacher-group-chip teacher-group-member-chip ${isLeader ? 'leader' : ''}`} key={member.id || studentId || student.studentCode || student.name}>
                                      <span>👤 {student.name || 'Student'}</span>
                                      <small>{isLeader ? 'Leader' : 'Member'}</small>
                                      {!isLeader && (
                                        <button type="button" onClick={() => setGroupLeader(group.id, studentId)}>
                                          Set as Leader
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="teacher-group-empty-note">No members added yet.</div>
                            )}
                          </div>

                          <div className="teacher-group-detail-section">
                            <h4>Tasks</h4>
                            {tasks.length ? (
                              <div className="teacher-group-task-list">
                                {tasks.slice(0, 3).map(task => (
                                  <div className="teacher-group-task-item" key={task.id || task.title}>
                                    {task.title || 'Group task'}
                                    <small>+{task.xpReward || 0} XP</small>
                                  </div>
                                ))}
                                {tasks.length > 3 && (
                                  <div className="teacher-group-empty-note">+{tasks.length - 3} more task{tasks.length - 3 === 1 ? '' : 's'}</div>
                                )}
                              </div>
                            ) : (
                              <div className="teacher-group-empty-note">No tasks assigned yet.</div>
                            )}
                          </div>
                        </div>

                        <div className="teacher-group-actions-row">
                          <button
                            className="lms-outline-action"
                            type="button"
                            onClick={() => toggleGroupTools(group.id)}
                          >
                            {isOpen ? 'Hide Add Member' : 'Add Member'}
                          </button>

                          <button
                            className="lms-outline-action"
                            type="button"
                            style={{ color: '#b42318', borderColor: 'rgba(180, 35, 24, 0.28)' }}
                            onClick={() => deleteGroup(group.id, group.name)}
                          >
                            Remove Group
                          </button>
                        </div>

                        {isOpen && (
                          <div className="teacher-add-member-row">
                            <select className="input-field" id={`member-${group.id}`}>
                              {students.map(student => (
                                <option key={student.id} value={student.id}>
                                  {student.name} • Grade {student.gradeLevel}
                                </option>
                              ))}
                            </select>
                            <button className="lms-outline-action" onClick={() => addMember(group.id)}>
                              Add Member
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  }) : (
                    <div className="teacher-empty-panel">
                      <div>👥</div>
                      <strong>No groups yet.</strong>
                      <p>Create your first group to start collaborative learning tasks.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {teacherTab === 'assessments' && (
          <TeacherAssessmentCenter lessons={lessons} rows={rows} quizPerformance={quizPerformance} />
        )}

        {teacherTab === 'students' && (
          <section className="teacher-workspace-card clean-students-panel" id="teacher-monitoring-table">
            <div className="teacher-workspace-heading monitor">
              <div>
                <div className="lms-section-label">Learner Monitoring</div>
                <h2>Students Monitoring Table</h2>
              </div>

              <div className="teacher-monitor-actions">
                <button type="button" className="lms-report-button" onClick={reload}>Refresh</button>
                <button type="button" className="lms-report-button" onClick={exportStudentsCSV}>⬇️ Export CSV</button>
                <button type="button" className="lms-report-button" onClick={exportLogsCSV}>⬇️ Export Activity Logs</button>
                <button type="button" className="lms-report-button" onClick={downloadSummaryReport}>🧾 Summary Report</button>
              </div>
            </div>




            <div className="teacher-table-wrapper">
              <table className="teacher-monitor-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>XP</th>
                    <th>Lessons</th>
                    <th>Progress</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length ? rows.map(row => (
                    <tr key={row.id}>
                      <td>
                        <strong>{row.name}</strong>
                        <small>{row.studentCode} • Grade {row.gradeLevel}</small>
                      </td>
                      <td>{row.xp}</td>
                      <td>{row.completed}/{row.totalLessons}</td>
                      <td>
                        <div className="teacher-progress-cell">
                          <span>{row.percent}%</span>
                          <div className="teacher-progress-track">
                            <div style={{ width: `${Math.max(0, Math.min(100, Number(row.percent || 0)))}%` }} />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="lms-status neutral">{row.status || 'Active'}</span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5">
                        <div className="teacher-empty-panel table">
                          <div>📭</div>
                          <strong>No monitoring data yet.</strong>
                          <p>Student progress will appear here after learners start completing lessons.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <footer className="teacher-footer">
          <span>© 2026 Tuklas Talino. All rights reserved.</span>
          <span>Privacy Policy · Terms of Service · Help Center</span>
        </footer>
          </div>
        </div>
      </main>
    </div>
  );
}





function TeacherLessonManager({ lessons, createLesson, deleteLesson, assignedClasses = [] }) {
  const [builderTab, setBuilderTab] = useState('source');
  const [lessonDraft, setLessonDraft] = useState({
    gradeLevel: 1,
    subject: 'Reading',
    title: '',
    xpReward: 25,
    duration: '10 minuto',
    instructions: '',
    passage: '',
    layunin: '',
    alamin: '',
    lesson: ''
  });

  const assignedGrades = [...new Set((assignedClasses || [])
    .map(item => Number(item.gradeLevel))
    .filter(Boolean)
  )].sort((a, b) => a - b);

  useEffect(() => {
    if (!assignedGrades.length) return;

    if (!assignedGrades.includes(Number(lessonDraft.gradeLevel))) {
      setLessonDraft(prev => ({
        ...prev,
        gradeLevel: assignedGrades[0]
      }));
    }
  }, [assignedGrades.join('|'), lessonDraft.gradeLevel]);



  const [activities, setActivities] = useState([]);
  const [lessonPlanText, setLessonPlanText] = useState('');
  const [aiDraftNotice, setAiDraftNotice] = useState('');
  const [lessonPlanFile, setLessonPlanFile] = useState(null);
  const [lessonPlanFilePreview, setLessonPlanFilePreview] = useState('');
  const [lessonPlanFileStatus, setLessonPlanFileStatus] = useState('');

  function makeId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function updateLesson(field, value) {
    setLessonDraft(prev => ({
      ...prev,
      [field]: value
    }));
  }

  function addActivity(type) {
    const base = {
      id: makeId(),
      type,
      title: '',
      instructions: ''
    };

    const activityMap = {
      mcq: {
        ...base,
        title: 'Quiz',
        questions: [
          {
            id: makeId(),
            question: '',
            options: [
              { id: makeId(), text: '', isCorrect: true },
              { id: makeId(), text: '', isCorrect: false },
              { id: makeId(), text: '', isCorrect: false },
              { id: makeId(), text: '', isCorrect: false }
            ]
          }
        ]
      },
      writing: {
        ...base,
        title: 'Writing Activity',
        gawainType: Number(lessonDraft.gradeLevel || 1) <= 3 ? 'complete_sentence' : 'writing_task',
        prompt: '',
        template: 'Ang ____ ay ____.',
        choicesText: '',
        correctAnswer: ''
      },
      speech: {
        ...base,
        title: 'Speech Activity',
        targetText: ''
      },
      matching: {
        ...base,
        title: 'Matching',
        pairs: [
          { id: makeId(), left: '', right: '' },
          { id: makeId(), left: '', right: '' }
        ]
      },
      vocabulary: {
        ...base,
        title: 'Vocabulary',
        words: [
          { id: makeId(), word: '', meaning: '', example: '' }
        ]
      },
      infographic: {
        ...base,
        title: 'Info Card',
        content: ''
      }
    };

    setActivities(prev => [...prev, activityMap[type]]);
  }

  function updateActivity(activityId, patch) {
    setActivities(prev =>
      prev.map(activity =>
        activity.id === activityId
          ? { ...activity, ...patch }
          : activity
      )
    );
  }

  function removeActivity(activityId) {
    setActivities(prev => prev.filter(activity => activity.id !== activityId));
  }

  function duplicateActivity(activityId) {
    const original = activities.find(activity => activity.id === activityId);
    if (!original) return;

    const duplicate = {
      ...JSON.parse(JSON.stringify(original)),
      id: makeId(),
      title: `${original.title || original.type} Copy`
    };

    if (duplicate.questions) {
      duplicate.questions = duplicate.questions.map(question => ({
        ...question,
        id: makeId(),
        options: question.options.map(option => ({
          ...option,
          id: makeId()
        }))
      }));
    }

    if (duplicate.pairs) {
      duplicate.pairs = duplicate.pairs.map(pair => ({
        ...pair,
        id: makeId()
      }));
    }

    if (duplicate.words) {
      duplicate.words = duplicate.words.map(word => ({
        ...word,
        id: makeId()
      }));
    }

    setActivities(prev => [...prev, duplicate]);
  }

  function updateMcqQuestion(activityId, questionId, patch) {
    setActivities(prev =>
      prev.map(activity => {
        if (activity.id !== activityId) return activity;

        return {
          ...activity,
          questions: activity.questions.map(question =>
            question.id === questionId
              ? { ...question, ...patch }
              : question
          )
        };
      })
    );
  }

  function updateMcqOption(activityId, questionId, optionId, patch) {
    setActivities(prev =>
      prev.map(activity => {
        if (activity.id !== activityId) return activity;

        return {
          ...activity,
          questions: activity.questions.map(question => {
            if (question.id !== questionId) return question;

            return {
              ...question,
              options: question.options.map(option =>
                option.id === optionId
                  ? { ...option, ...patch }
                  : patch.isCorrect
                    ? { ...option, isCorrect: false }
                    : option
              )
            };
          })
        };
      })
    );
  }

  function addMcqQuestion(activityId) {
    setActivities(prev =>
      prev.map(activity => {
        if (activity.id !== activityId) return activity;

        return {
          ...activity,
          questions: [
            ...activity.questions,
            {
              id: makeId(),
              question: '',
              options: [
                { id: makeId(), text: '', isCorrect: true },
                { id: makeId(), text: '', isCorrect: false },
                { id: makeId(), text: '', isCorrect: false },
                { id: makeId(), text: '', isCorrect: false }
              ]
            }
          ]
        };
      })
    );
  }

  function updatePair(activityId, pairId, patch) {
    setActivities(prev =>
      prev.map(activity => {
        if (activity.id !== activityId) return activity;

        return {
          ...activity,
          pairs: activity.pairs.map(pair =>
            pair.id === pairId
              ? { ...pair, ...patch }
              : pair
          )
        };
      })
    );
  }

  function addPair(activityId) {
    setActivities(prev =>
      prev.map(activity =>
        activity.id === activityId
          ? {
              ...activity,
              pairs: [
                ...activity.pairs,
                { id: makeId(), left: '', right: '' }
              ]
            }
          : activity
      )
    );
  }

  function updateWord(activityId, wordId, patch) {
    setActivities(prev =>
      prev.map(activity => {
        if (activity.id !== activityId) return activity;

        return {
          ...activity,
          words: activity.words.map(item =>
            item.id === wordId
              ? { ...item, ...patch }
              : item
          )
        };
      })
    );
  }

  function addWord(activityId) {
    setActivities(prev =>
      prev.map(activity =>
        activity.id === activityId
          ? {
              ...activity,
              words: [
                ...activity.words,
                { id: makeId(), word: '', meaning: '', example: '' }
              ]
            }
          : activity
      )
    );
  }

  function formatLessonPlanFileSize(size = 0) {
    const bytes = Number(size || 0);
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function extractReadablePdfText(rawText = '') {
    const cleaned = String(rawText || '')
      .replace(/\r/g, '\n')
      .replace(/[^\x09\x0A\x0D\x20-\x7EÀ-žñÑ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const noiseWords = [
      'obj', 'endobj', 'stream', 'endstream', 'xref', 'trailer', 'startxref', 'Type',
      'Font', 'Length', 'Filter', 'FlateDecode', 'Pages', 'Catalog', 'MediaBox'
    ];

    const withoutNoise = noiseWords.reduce(
      (value, word) => value.replace(new RegExp(`\\b${word}\\b`, 'gi'), ' '),
      cleaned
    );

    return withoutNoise
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 3000);
  }

  async function handleLessonPlanFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const isAllowed = /\.(ppt|pptx|pdf)$/i.test(file.name || '');

    if (!isAllowed) {
      setLessonPlanFile(null);
      setLessonPlanFilePreview('');
      setLessonPlanFileStatus('Please upload a PPT, PPTX, or PDF lesson material.');
      setAiDraftNotice('Unsupported file type. Use PPT, PPTX, or PDF only.');
      event.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('material', file);

    setLessonPlanFileStatus('Uploading lesson material...');
    setAiDraftNotice('');

    try {
      const data = await uploadForm('/lessons/materials/upload', formData);
      const material = data.material || {};

      setLessonPlanFile({
        name: material.fileName || file.name,
        type: material.fileType || file.type || 'Lesson material',
        size: formatLessonPlanFileSize(material.size || file.size),
        fileName: material.fileName || file.name,
        fileUrl: material.fileUrl,
        fileType: material.fileType || '',
        mimeType: material.mimeType || file.type || '',
        rawSize: Number(material.size || file.size || 0)
      });

      setLessonPlanFilePreview('');
      setLessonPlanFileStatus('Material uploaded. Students will see this as Material inside the lesson after you publish.');
      setAiDraftNotice('');
    } catch (err) {
      setLessonPlanFile(null);
      setLessonPlanFilePreview('');
      setLessonPlanFileStatus(err?.message || 'Could not upload lesson material. Please try again.');
      setAiDraftNotice('Upload failed.');
      event.target.value = '';
    }
  }

  function clearLessonPlanSource() {
    setLessonPlanText('');
    setAiDraftNotice('');
    setLessonPlanFile(null);
    setLessonPlanFilePreview('');
    setLessonPlanFileStatus('');

    const input = document.getElementById('teacher-lesson-plan-file');
    if (input) input.value = '';
  }

  function cleanActivities() {
    return activities
      .map(activity => {
        if (activity.type === 'mcq') {
          const questions = (activity.questions || [])
            .map(question => {
              const options = (question.options || [])
                .filter(option => option.text.trim())
                .map(option => ({
                  text: option.text.trim(),
                  isCorrect: Boolean(option.isCorrect)
                }));

              if (!question.question.trim() || options.length < 2) return null;

              if (!options.some(option => option.isCorrect)) {
                options[0].isCorrect = true;
              }

              return {
                question: question.question.trim(),
                options
              };
            })
            .filter(Boolean);

          if (!questions.length) return null;

          return {
            type: 'mcq',
            title: activity.title || 'Quiz',
            instructions: activity.instructions || null,
            questions
          };
        }

        if (activity.type === 'writing') {
          const rawGawainType = activity.gawainType || 'writing_task';
          const activityType = rawGawainType === 'complete_sentence' ? 'complete_sentence' : 'writing_task';

          if (activityType === 'complete_sentence') {
            const template = String(activity.template || activity.prompt || '').trim();
            const choices = String(activity.choicesText || '')
              .split(/[\n,]/)
              .map(choice => choice.trim())
              .filter(Boolean);
            const correctAnswer = String(activity.correctAnswer || '').trim();

            if (!template || !correctAnswer) return null;

            return {
              type: 'writing',
              title: activity.title || 'Writing Activity',
              instructions: activity.instructions || 'Kumpletuhin ang pangungusap.',
              prompt: template,
              rubric: {
                activityType,
                template,
                choices,
                wordBank: choices,
                correctAnswer,
                acceptedAnswers: [correctAnswer],
                correctWords: [correctAnswer],
                autoChecked: true
              }
            };
          }

          if (!activity.prompt?.trim()) return null;

          return {
            type: 'writing',
            title: activity.title || 'Writing Activity',
            instructions: activity.instructions || null,
            prompt: activity.prompt.trim(),
            rubric: {
              activityType,
              needsTeacherReview: true
            }
          };
        }

        if (activity.type === 'speech') {
          if (!activity.targetText?.trim()) return null;

          return {
            type: 'speech',
            title: activity.title || 'Speech Activity',
            instructions: activity.instructions || null,
            targetText: activity.targetText.trim()
          };
        }

        if (activity.type === 'matching') {
          const pairs = (activity.pairs || [])
            .filter(pair => pair.left.trim() && pair.right.trim())
            .map(pair => ({
              left: pair.left.trim(),
              right: pair.right.trim()
            }));

          if (pairs.length < 2) return null;

          return {
            type: 'matching',
            title: activity.title || 'Matching',
            instructions: activity.instructions || null,
            pairs
          };
        }

        if (activity.type === 'vocabulary') {
          const words = (activity.words || [])
            .filter(item => item.word.trim() && item.meaning.trim())
            .map(item => ({
              word: item.word.trim(),
              meaning: item.meaning.trim(),
              example: item.example?.trim() || null
            }));

          if (!words.length) return null;

          return {
            type: 'vocabulary',
            title: activity.title || 'Vocabulary',
            instructions: activity.instructions || null,
            words
          };
        }

        if (activity.type === 'infographic') {
          if (!activity.content?.trim()) return null;

          return {
            type: 'infographic',
            title: activity.title || 'Info Card',
            instructions: activity.instructions || null,
            content: activity.content.trim()
          };
        }

        return null;
      })
      .filter(Boolean);
  }

  function getLineAfterLabel(text, labels = []) {
    const lines = String(text || '').split(/\n+/).map(line => line.trim()).filter(Boolean);

    for (const label of labels) {
      const found = lines.find(line => line.toLowerCase().startsWith(label.toLowerCase()));
      if (found) {
        return found.replace(new RegExp(`^${label}\\s*[:\\-]?\\s*`, 'i'), '').trim();
      }
    }

    return '';
  }

  function guessSubjectFromPlan(text) {
    const lower = String(text || '').toLowerCase();

    if (/oral|bigkas|pagbigkas|talumpati|speech|pronunciation|word nang malinaw/.test(lower)) return 'Oral Comm';
    if (/sulat|pagsulat|pangungusap|sanaysay|liham|tulaing isusulat/.test(lower)) return 'Writing';
    if (/panitikan|tula|alamat|pabula|maikling kwento|kuwento/.test(lower)) return 'Literature';
    if (/bokabularyo|talawordan|meaning|words |vocabulary/.test(lower)) return 'Vocabulary';
    if (/pagbasa|basa|reading|komprehensyon|unawa|story/.test(lower)) return 'Reading';

    return 'Reading';
  }

  function guessGradeFromPlan(text) {
    const match = String(text || '').match(/grade\s*([1-6])|grade\s*([1-6])/i);
    return Number(match?.[1] || match?.[2] || lessonDraft.gradeLevel || 1);
  }

  function getCleanSentences(text) {
    return String(text || '')
      .replace(/\s+/g, ' ')
      .split(/(?<=[.!?])\s+/)
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length > 20);
  }

  function getKeywordsFromPlan(text) {
    const stopWords = new Set([
      'ang', 'mga', 'para', 'with', 'that', 'this', 'from', 'lesson', 'grade', 'grade',
      'student', 'students', 'teacher', 'learning', 'objective', 'objectives', 'activity',
      'filipino', 'lesson', 'activity', 'instructions', 'after', 'may', 'must', 'will',
      'able', 'identify', 'understand', 'explain', 'write', 'read', 'using'
    ]);

    const words = String(text || '')
      .toLowerCase()
      .replace(/[^a-zA-ZÀ-žñÑ\s]/g, ' ')
      .split(/\s+/)
      .map(word => word.trim())
      .filter(word => word.length >= 5 && !stopWords.has(word));

    return Array.from(new Set(words)).slice(0, 6);
  }

  function generateFromLessonPlan() {
    const rawPlan = lessonPlanText.trim();

    if (!rawPlan) {
      setAiDraftNotice('Please upload lesson slides or paste teacher notes first.');
      return;
    }

    const lines = rawPlan.split(/\n+/).map(line => line.trim()).filter(Boolean);
    const titleFromLabel = getLineAfterLabel(rawPlan, ['Title', 'Lesson Title', 'Paksa', 'Aralin', 'Topic']);
    const firstShortLine = lines.find(line => line.length >= 8 && line.length <= 90) || '';
    const generatedTitle = titleFromLabel || firstShortLine || 'Generated Filipino Lesson';
    const generatedSubject = guessSubjectFromPlan(rawPlan);
    const generatedGrade = guessGradeFromPlan(rawPlan);
    const sentences = getCleanSentences(rawPlan);
    const keywords = getKeywordsFromPlan(rawPlan);
    const mainPassage = sentences.slice(0, 5).join('\n\n') || rawPlan.slice(0, 900);
    const vocabularyWords = (keywords.length ? keywords : ['word', 'meaning', 'lesson']).slice(0, 4);
    const firstSentence = sentences[0] || generatedTitle;

    const generatedActivities = [
      {
        id: makeId(),
        type: 'infographic',
        title: 'Info Card',
        instructions: 'Read the short guide before answering the activity.',
        content: `Topic: ${generatedTitle}\n\nKey ideas:\n- Read and understand the lesson.\n- Answer the activities after reading.\n- Ask the teacher for guidance if something is unclear.`
      },
      {
        id: makeId(),
        type: 'vocabulary',
        title: 'New Vocabulary Words',
        instructions: 'Study the word, meaning, and example.',
        words: vocabularyWords.map(word => ({
          id: makeId(),
          word: word.charAt(0).toUpperCase() + word.slice(1),
          meaning: 'Enter or correct the meaning of this word.',
          example: `Example usage of ${word} in a sentence.`
        }))
      },
      {
        id: makeId(),
        type: 'mcq',
        title: 'Mini Quiz',
        instructions: 'Choose the best answer.',
        questions: [
          {
            id: makeId(),
            question: `What is the main topic of the lesson na "${generatedTitle}"?`,
            options: [
              { id: makeId(), text: generatedSubject, isCorrect: true },
              { id: makeId(), text: 'Matematika', isCorrect: false },
              { id: makeId(), text: 'Agham', isCorrect: false },
              { id: makeId(), text: 'Social Studies', isCorrect: false }
            ]
          }
        ]
      },
      {
        id: makeId(),
        type: 'writing',
        title: 'Writing Activity',
        instructions: 'Write a short answer based on the lesson.',
        prompt: `Ano ang natutuhan mo tungkol sa ${generatedTitle}? Sumulat ng 2 hanggang 3 pangungusap.`
      },
      {
        id: makeId(),
        type: 'speech',
        title: 'Speech Activity',
        instructions: 'Read the sentence clearly.',
        targetText: firstSentence.slice(0, 180)
      }
    ];

    setLessonDraft(prev => ({
      ...prev,
      gradeLevel: generatedGrade,
      subject: generatedSubject,
      title: generatedTitle,
      xpReward: prev.xpReward || 25,
      duration: prev.duration || '10 minuto',
      instructions: 'Read the lesson, listen if needed, and answer the activities.',
      passage: mainPassage
    }));

    setActivities(generatedActivities);
    setAiDraftNotice('Lesson details filled from notes. Please review and edit before publishing.');
    setBuilderTab('details');
  }

  async function submitLessonBuilder() {
    if (!assignedGrades.length) {
      window.alert('Please ask the admin to assign your grade level before creating lessons.');
      setBuilderTab('details');
      return;
    }

    if (!assignedGrades.includes(Number(lessonDraft.gradeLevel))) {
      window.alert('You can only create lessons for your assigned grade levels.');
      setBuilderTab('details');
      return;
    }

    if (!lessonDraft.title.trim()) {
      alert('Please enter a lesson title.');
      return;
    }

    const preparedActivities = cleanActivities();

    if (lessonPlanFile?.fileUrl) {
      preparedActivities.unshift({
        type: 'material',
        title: 'Lesson Slides',
        instructions: 'Open the attached lesson material before answering the activities.',
        fileName: lessonPlanFile.fileName || lessonPlanFile.name,
        fileUrl: lessonPlanFile.fileUrl,
        fileType: lessonPlanFile.fileType || lessonPlanFile.type,
        mimeType: lessonPlanFile.mimeType || null,
        size: Number(lessonPlanFile.rawSize || 0) || null
      });
    }

    const hasQuiz = preparedActivities.some(activity => activity.type === 'mcq');
    const hasWritingActivity = preparedActivities.some(activity => activity.type === 'writing');
    const hasSpeechActivity = preparedActivities.some(activity => activity.type === 'speech');

    if (!hasQuiz || !hasWritingActivity || !hasSpeechActivity) {
      window.alert('Please add one Quiz, one Writing Activity, and one Speech Activity before publishing.');
      setBuilderTab('activities');
      return;
    }

    const structuredPassage = [
      lessonDraft.layunin?.trim() ? `Layunin:\n${lessonDraft.layunin.trim()}` : '',
      lessonDraft.alamin?.trim() ? `Alamin:\n${lessonDraft.alamin.trim()}` : '',
      lessonDraft.aralin?.trim() ? `Lesson:\n${lessonDraft.aralin.trim()}` : ''
    ].filter(Boolean).join('\n\n') || lessonDraft.passage || '';

    const payload = {
      gradeLevel: Number(lessonDraft.gradeLevel),
      subject: lessonDraft.subject,
      title: lessonDraft.title.trim(),
      xpReward: Number(lessonDraft.xpReward || 25),
      duration: '10 minuto',
      instructions: lessonDraft.instructions || 'Read the lesson and answer the activities.',
      passage: structuredPassage || null,
      activities: preparedActivities
    };

    await createLesson(payload);

    setLessonDraft({
      gradeLevel: 1,
      subject: 'Reading',
      title: '',
      xpReward: 25,
      duration: '10 minuto',
      instructions: '',
      passage: '',
      layunin: '',
      alamin: '',
      lesson: ''
    });

    setActivities([]);
    clearLessonPlanSource();
    setBuilderTab('lessons');
  }

  const validActivities = cleanActivities();
  const subjectMeta = SUBJECTS.find(s => s.name === lessonDraft.subject) || SUBJECTS[0];
  const [showAllLessons, setShowAllLessons] = useState(false);

  const allRecentLessons = [...(lessons || [])]
    .filter(lesson => (lesson.status || 'published') !== 'archived')
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();

      if (dateA !== dateB) return dateB - dateA;

      return Number(b.id || 0) - Number(a.id || 0);
    });

  const visibleRecentLessons = showAllLessons
    ? allRecentLessons
    : allRecentLessons.slice(0, 5);

  const activityButtonMeta = [
    { type: 'mcq', label: 'Quiz', icon: '?', className: 'choice-mcq' },
    { type: 'writing', label: 'Writing', icon: '✎', className: 'choice-writing' },
    { type: 'speech', label: 'Speech', icon: '🎙️', className: 'choice-speech' }
  ];

  const assessmentProfile = lessonAssessmentProfile(validActivities);
  const assessmentChecks = [
    { label: 'Content / Info', ok: assessmentProfile.hasContent, note: 'Adds lesson context before assessment.' },
    { label: 'Quiz', ok: assessmentProfile.hasObjectiveQuiz, note: 'Measures basic understanding with a score.' },
    { label: 'Writing Evidence', ok: assessmentProfile.hasWriting, note: 'Shows if students can express ideas clearly.' },
    { label: 'Speech Evidence', ok: assessmentProfile.hasSpeech, note: 'Supports pronunciation and oral communication.' }
  ];
  const readinessScore = Math.round((assessmentChecks.filter(item => item.ok).length / assessmentChecks.length) * 100);

  function scrollToRecentLessons() {
    document.getElementById('teacher-recent-lessons')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  function toggleShowAllLessons() {
    setShowAllLessons(prev => !prev);
    setTimeout(scrollToRecentLessons, 0);
  }

  function getActivityData(activity = {}) {
    return activity?.dataJson || activity || {};
  }

  function getActivityMaterialInfo(activitiesList = []) {
    const materialActivity = (activitiesList || []).find(activity => activity?.type === 'material');
    if (!materialActivity) return null;

    const material = getActivityData(materialActivity);
    const fileName = material.fileName || material.name || materialActivity.title || 'Lesson material';
    const rawType = String(
      material.fileType ||
      material.mimeType ||
      String(fileName).split('.').pop() ||
      'FILE'
    ).toUpperCase();

    const fileType = rawType.includes('PDF')
      ? 'PDF'
      : rawType.includes('PPTX')
        ? 'PPTX'
        : rawType.includes('PPT')
          ? 'PPT'
          : rawType.replace('APPLICATION/', '') || 'FILE';

    return {
      fileName,
      fileType,
      label: `${fileType} attached`
    };
  }

  function getLessonMaterialLabel(lesson = {}) {
    const info = getActivityMaterialInfo(lesson.activities || []);
    return info ? info.fileType : 'None';
  }

  function countQuizItemsFromActivities(activitiesList = []) {
    return (activitiesList || [])
      .filter(activity => activity?.type === 'mcq')
      .reduce((sum, activity) => sum + (activity.questions || []).length, 0);
  }

  function countLessonQuizItems(lesson = {}) {
    return countQuizItemsFromActivities(lesson.activities || []);
  }

  function formatQuizItemCount(count = 0) {
    return `${count} ${count === 1 ? 'item' : 'items'}`;
  }

  const draftMaterialInfo = lessonPlanFile
    ? {
      fileName: lessonPlanFile.fileName || lessonPlanFile.name,
      fileType: String(lessonPlanFile.fileType || lessonPlanFile.type || 'FILE').toUpperCase()
    }
    : null;

  const draftQuizItemCount = countQuizItemsFromActivities(validActivities);
  const draftMiniQuizCount = validActivities.some(activity => activity.type === 'mcq' && (activity.questions || []).length)
    ? 1
    : 0;
  const draftWritingCount = validActivities.filter(activity => activity.type === 'writing').length;
  const draftSpeechCount = validActivities.filter(activity => activity.type === 'speech').length;
  const draftOtherActivityCount = validActivities.filter(activity => !['mcq', 'writing', 'speech'].includes(activity.type)).length;

  return (
    <>
          <style>{`
            .teacher-builder-workflow {
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
              margin: 0 0 18px;
              padding: 12px;
              border-radius: 24px;
              background: #f4fbf7;
              border: 1px solid #dcefe2;
            }

            .teacher-builder-step {
              border: 0;
              border-radius: 18px;
              padding: 12px 16px;
              background: #ffffff;
              color: #315241;
              font-weight: 900;
              cursor: pointer;
              box-shadow: 0 8px 18px rgba(13, 71, 45, 0.06);
              transition: transform .18s ease, background .18s ease, color .18s ease;
            }

            .teacher-builder-step:hover {
              transform: translateY(-1px);
            }

            .teacher-builder-step.active {
              background: linear-gradient(135deg, var(--green), #46b56d);
              color: #ffffff;
            }

            .teacher-builder-layout .builder-panel,
            .teacher-builder-layout .builder-side-preview,
            .teacher-builder-layout .builder-side-activities {
              display: none;
            }

            .builder-tab-source .builder-panel-source,
            .builder-tab-details .builder-panel-details,
            .builder-tab-details .builder-panel-content,
            .builder-tab-activities .builder-panel-activities,
            .builder-tab-activities .builder-side-activities,
            .builder-tab-preview .builder-side-preview,
            .builder-tab-preview .builder-side-activities,
            .builder-tab-lessons .builder-panel-lessons {
              display: block;
            }

            .builder-tab-preview .teacher-builder-main,
            .builder-tab-lessons .teacher-builder-side {
              display: none;
            }

            .builder-tab-preview {
              grid-template-columns: minmax(0, 1fr);
            }

            .builder-tab-preview .teacher-builder-side {
              max-width: 760px;
              width: 100%;
              margin: 0 auto;
            }

            .builder-tab-lessons {
              grid-template-columns: minmax(0, 1fr);
            }

            .builder-tab-lessons .teacher-builder-main {
              max-width: 100%;
            }

            .teacher-builder-focus-note {
              margin: 0 0 16px;
              padding: 14px 16px;
              border-radius: 18px;
              background: #fffdf1;
              border: 1px solid #f4e7aa;
              color: #5f5022;
              font-weight: 800;
            }

            @media (max-width: 860px) {
              .teacher-builder-step {
                flex: 1 1 calc(50% - 10px);
              }
            }
                      /* === My Created Lessons compact table polish === */
            .teacher-builder-layout .lms-recent-table {
              table-layout: auto;
            }

            .teacher-builder-layout .lms-recent-table th {
              padding: 13px 12px;
              font-size: 0.92rem;
              line-height: 1.2;
              vertical-align: middle;
              white-space: nowrap;
            }

            .teacher-builder-layout .lms-recent-table td {
              padding: 13px 12px;
              font-size: 0.94rem;
              line-height: 1.3;
              vertical-align: middle;
            }

            .teacher-builder-layout .lms-recent-table td:nth-child(1) {
              font-weight: 900;
              max-width: 280px;
            }

            .teacher-builder-layout .lms-recent-table td:nth-child(6),
            .teacher-builder-layout .lms-recent-table td:nth-child(7),
            .teacher-builder-layout .lms-recent-table td:nth-child(8),
            .teacher-builder-layout .lms-recent-table td:nth-child(9) {
              white-space: nowrap;
            }

            .teacher-builder-layout .lms-recent-table .lms-status {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
              padding: 7px 12px;
              min-width: 0;
              min-height: 0;
              border-radius: 999px;
              font-size: 0.88rem;
              font-weight: 900;
              line-height: 1;
              white-space: nowrap;
              box-shadow: none;
            }

            .teacher-builder-layout .lms-recent-table .lms-status::before {
              font-size: 0.7rem;
            }

            .teacher-builder-layout .lms-recent-table .lms-outline-action {
              padding: 9px 13px !important;
              border-radius: 14px;
              font-size: 0.88rem;
              line-height: 1.1;
              min-height: 0;
              white-space: nowrap;
            }

            .teacher-builder-layout .lms-show-more {
              margin-top: 14px;
              font-size: 0.92rem;
            }

            @media (max-width: 1280px) {
              .teacher-builder-layout .lms-recent-table th,
              .teacher-builder-layout .lms-recent-table td {
                padding: 11px 9px;
                font-size: 0.88rem;
              }

              .teacher-builder-layout .lms-recent-table .lms-status {
                padding: 6px 10px;
                font-size: 0.84rem;
              }

              .teacher-builder-layout .lms-recent-table .lms-outline-action {
                padding: 8px 10px !important;
                font-size: 0.84rem;
              }
            }
            /* === End My Created Lessons compact table polish === */

            .teacher-builder-layout .lms-danger-outline-action {
              border-color: #FCA5A5 !important;
              color: #B91C1C !important;
              background: #FEF2F2 !important;
              font-weight: 950 !important;
              box-shadow: none !important;
              transition: all 0.18s ease !important;
            }

            .teacher-builder-layout .lms-danger-outline-action:hover {
              border-color: #DC2626 !important;
              color: #FFFFFF !important;
              background: #DC2626 !important;
              transform: translateY(-1px);
              box-shadow: 0 10px 22px rgba(220, 38, 38, 0.22) !important;
            }

            .teacher-builder-layout .teacher-inline-mcq {
              display: grid;
              gap: 16px;
              width: 100%;
            }

            .teacher-builder-layout .teacher-inline-mcq > .teacher-activity-row-fields {
              display: grid;
              gap: 12px;
              width: 100%;
            }

            .teacher-builder-layout .teacher-mcq-options-grid {
              display: grid;
              grid-template-columns: 1fr;
              gap: 12px;
              width: 100%;
            }

            .teacher-builder-layout .teacher-mcq-option-row {
              display: grid;
              grid-template-columns: 28px minmax(0, 1fr);
              gap: 12px;
              align-items: start;
              width: 100%;
            }

            .teacher-builder-layout .teacher-mcq-option-row input[type="radio"] {
              margin-top: 24px;
            }

            .teacher-builder-layout .teacher-mcq-option-row textarea.input-field {
              width: 100%;
              min-width: 0;
              white-space: normal;
              overflow-wrap: anywhere;
            }

            .teacher-builder-layout .teacher-mcq-question-actions {
              display: flex;
              justify-content: flex-end;
              margin-top: 10px;
            }

            .teacher-builder-layout .teacher-mcq-remove-question {
              border: 1px solid #fca5a5;
              background: #fef2f2;
              color: #b91c1c;
              border-radius: 14px;
              padding: 9px 12px;
              font-weight: 950;
              cursor: pointer;
              transition: all 0.18s ease;
            }

            .teacher-builder-layout .teacher-mcq-remove-question:hover {
              background: #dc2626;
              border-color: #dc2626;
              color: #ffffff;
              transform: translateY(-1px);
              box-shadow: 0 10px 22px rgba(220, 38, 38, 0.18);
            }

`}</style>

          <div className="teacher-builder-workflow" aria-label="Lesson builder steps">
            {[
              ['source', '📎 Lesson Material'],
              ['details', '📝 Lesson Details'],
              ['activities', '🧩 Activities'],
              ['preview', '👁 Preview'],
              ['lessons', '📚 My Lessons']
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`teacher-builder-step ${builderTab === key ? 'active' : ''}`}
                onClick={() => setBuilderTab(key)}
              >
                {label}
              </button>
            ))}
          </div>

      <div className={`teacher-builder-layout builder-tab-${builderTab}`}>
        <div className="teacher-builder-main">
          <section className="teacher-design-card soft builder-panel builder-panel-source" style={{ border: '2px solid #dcefe2', background: 'linear-gradient(135deg, #fbfffd, #f3fbf6)' }}>
            <div className="teacher-design-heading">
              <div className="teacher-design-step">FILE</div>
              <div>
                <h2>Optional Lesson Material</h2>

              </div>
            </div>

            <div className="teacher-field">
              <label>Upload PPT/PDF Material</label>
              <input
                id="teacher-lesson-plan-file"
                className="input-field"
                type="file"
                accept=".ppt,.pptx,.pdf"
                onChange={handleLessonPlanFileUpload}
              />
              <small style={{ color: '#6d7b73', fontWeight: 750, marginTop: 6 }}>
                Accepted files: PPT, PPTX, or PDF. PDFs can preview inside the student lesson. PPT/PPTX files open as slides or download.
              </small>
            </div>

            {lessonPlanFile && (
              <div className="lms-empty-line" style={{ marginTop: 12, background: '#ffffff', color: '#264136' }}>
                <strong>Uploaded Material:</strong> {lessonPlanFile.name} • {lessonPlanFile.size}
                <br />
                <span>{lessonPlanFileStatus}</span>
                <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-start' }}>
                  <button
                    type="button"
                    className="lms-outline-action lms-danger-outline-action"
                    onClick={clearLessonPlanSource}
                  >
                    Remove Material
                  </button>
                </div>
              </div>
            )}

            {lessonPlanFilePreview && (
              <div style={{ marginTop: 12, padding: 12, borderRadius: 18, background: '#ffffff', border: '1px solid #dcefe2' }}>
                <div style={{ color: '#0b8e4e', fontWeight: 950, marginBottom: 8 }}>Image Preview</div>
                <img
                  src={lessonPlanFilePreview}
                  alt="Uploaded lesson plan preview"
                  style={{ width: '100%', maxHeight: 260, objectFit: 'contain', borderRadius: 14, background: '#f8fcf9' }}
                />
              </div>
            )}
          </section>

          <section className="teacher-design-card soft">
            <div className="teacher-design-heading">
              <div className="teacher-design-step">1</div>
              <div>
                <h2>Lesson Information</h2>
                <p>Provide the basic details for your lesson.</p>
              </div>
            </div>

            <div className="teacher-form-row">
              <div className="teacher-field">
                <label>Grade Level</label>
                <select
                  className="input-field"
                  value={assignedGrades.length ? lessonDraft.gradeLevel : ''}
                  disabled={!assignedGrades.length}
                  onChange={(e) => updateLesson('gradeLevel', Number(e.target.value))}
                >
                  {assignedGrades.length ? (
                    assignedGrades.map(grade => (
                      <option key={grade} value={grade}>Grade {grade}</option>
                    ))
                  ) : (
                    <option value="">No assigned grade yet</option>
                  )}
                </select>
              </div>

              <div className="teacher-field">
                <label>Subject Area</label>
                <select
                  className="input-field"
                  value={lessonDraft.subject}
                  onChange={(e) => updateLesson('subject', e.target.value)}
                >
                  {SUBJECTS.map(subject => (
                    <option key={subject.name} value={subject.name}>
                      {subject.icon} {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="teacher-field">
                <label>XP Reward</label>
                <input
                  className="input-field"
                  type="number"
                  min="1"
                  max="500"
                  value={lessonDraft.xpReward}
                  onChange={(e) => updateLesson('xpReward', e.target.value)}
                />
              </div>
            </div>

            <div className="teacher-field" style={{ marginTop: 16 }}>
              <label>Lesson Title</label>
              <input
                className="input-field"
                value={lessonDraft.title}
                onChange={(e) => updateLesson('title', e.target.value)}
                placeholder="e.g. Nouns and Examples"
              />
            </div>

            <div className="teacher-field" style={{ marginTop: 16 }}>
            </div>
          </section>

          <section className="teacher-design-card soft">
            <div className="teacher-design-heading">
              <div className="teacher-design-step">2</div>
              <div>
                <h2>Learning Content</h2>
              </div>
            </div>

            {lessonPlanFile ? (
              <div className="muted" style={{ marginBottom: 12 }}>
                You uploaded a material. Add a short Objective, Background, and Lesson summary so students still have readable lesson cards.
              </div>
            ) : (
              <div className="muted" style={{ marginBottom: 12 }}>
                No uploaded material yet. Fill in the Lesson content manually.
              </div>
            )}

            <div className="teacher-field">
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 12,
                  fontWeight: 950
                }}
              >
                <span
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 999,
                    background: '#009A57',
                    color: '#FFFFFF',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 17,
                    fontWeight: 950,
                    flexShrink: 0
                  }}
                >
                  1
                </span>
                <span style={{ color: '#009A57', fontSize: 23, letterSpacing: '-0.03em' }}>Layunin</span>
                <span style={{ color: '#64748B', fontSize: 16, fontWeight: 850 }}>— Goal ng lesson</span>
              </label>
              <textarea
                className="input-field"
                value={lessonDraft.layunin || ''}
                onChange={(e) => updateLesson('layunin', e.target.value)}
                placeholder={"What will students learn?\n\nExample: Students identify words that start with the letter M."}
                rows="4"
                style={{
                  minHeight: 132,
                  fontSize: 16,
                  lineHeight: 1.55,
                  padding: '16px 18px'
                }}
              />
            </div>

            <div className="teacher-field" style={{ marginTop: 20 }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 12,
                  fontWeight: 950
                }}
              >
                <span
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 999,
                    background: '#009A57',
                    color: '#FFFFFF',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 17,
                    fontWeight: 950,
                    flexShrink: 0
                  }}
                >
                  2
                </span>
                <span style={{ color: '#009A57', fontSize: 23, letterSpacing: '-0.03em' }}>Alamin</span>
                <span style={{ color: '#64748B', fontSize: 16, fontWeight: 850 }}>— Short topic explanation</span>
              </label>
              <textarea
                className="input-field"
                value={lessonDraft.alamin || ''}
                onChange={(e) => updateLesson('alamin', e.target.value)}
                placeholder={"What should students know first about the topic?\n\nExample: The letter M has the /m/ sound. Some words start with M."}
                rows="4"
                style={{
                  minHeight: 144,
                  fontSize: 16,
                  lineHeight: 1.55,
                  padding: '16px 18px'
                }}
              />
            </div>

            <div className="teacher-field" style={{ marginTop: 20 }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 12,
                  fontWeight: 950
                }}
              >
                <span
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 999,
                    background: '#009A57',
                    color: '#FFFFFF',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 17,
                    fontWeight: 950,
                    flexShrink: 0
                  }}
                >
                  3
                </span>
                <span style={{ color: '#009A57', fontSize: 23, letterSpacing: '-0.03em' }}>Lesson</span>
                <span style={{ color: '#64748B', fontSize: 16, fontWeight: 850 }}>— Main lesson content</span>
              </label>
              <textarea
                className="input-field lms-editor-area"
                value={lessonDraft.aralin || ''}
                onChange={(e) => updateLesson('aralin', e.target.value)}
                placeholder={"What will students read or study?\n\nExample: Some words start with M, such as mata, mesa, and maya."}
                rows="8"
                style={{
                  minHeight: 190,
                  fontSize: 16,
                  lineHeight: 1.6,
                  padding: '16px 18px'
                }}
              />
            </div>
          </section>

          <section className="teacher-design-card soft">
            <div className="teacher-design-heading">
              <div className="teacher-design-step">3</div>
              <div>
                <h2>Activity Builder</h2>
                <p>Add activity blocks to build your lesson structure.</p>
              </div>
            </div>

            <div className="lms-add-choice-grid">
              {activityButtonMeta.map(item => (
                <button
                  key={item.type}
                  type="button"
                  className={`lms-add-choice ${item.className}`}
                  onClick={() => addActivity(item.type)}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>

            <div className="lms-activity-list">
              {activities.length ? (
                activities.map((activity, activityIndex) => (
                  <TeacherActivityBlock
                    key={activity.id}
                    activity={activity}
                    activityIndex={activityIndex}
                    updateActivity={updateActivity}
                    removeActivity={removeActivity}
                    duplicateActivity={duplicateActivity}
                    updateMcqQuestion={updateMcqQuestion}
                    updateMcqOption={updateMcqOption}
                    addMcqQuestion={addMcqQuestion}
                    updatePair={updatePair}
                    addPair={addPair}
                    updateWord={updateWord}
                    addWord={addWord}
                  />
                ))
              ) : (
                <div className="lms-empty-activity">
                  <strong>No activity blocks added yet.</strong>
                  <p>Use the buttons above to add activities to your lesson.</p>
                </div>
              )}
            </div>
          </section>

                    {builderTab === 'lessons' && (
<section className="teacher-design-card soft builder-panel builder-panel-lessons" id="teacher-recent-lessons">
            <div className="teacher-design-heading">
              <div className="teacher-design-step">5</div>
              <div>
                <h2>My Created Lessons</h2>
                <p>Your most recent published lessons.</p>
              </div>
              <button className="lms-view-lessons-btn" type="button" onClick={toggleShowAllLessons}>
                {showAllLessons ? 'Show Less' : 'View All Lessons'}
              </button>
            </div>

            <table className="lms-recent-table">
              <thead>
                <tr>
                  <th>Lesson Title</th>
                  <th>Subject</th>
                  <th>Grade</th>
                  <th>Material</th>
                  <th>Quiz Items</th>
                  <th>XP</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleRecentLessons.map(lesson => {
                  const isPublished = (lesson.status || 'published') === 'published';

                  return (
                    <tr key={lesson.id}>
                      <td>📘 {lesson.title}</td>
                      <td>{lesson.subject}</td>
                      <td>Grade {lesson.gradeLevel}</td>
                      <td>{getLessonMaterialLabel(lesson)}</td>
                      <td>{formatQuizItemCount(countLessonQuizItems(lesson))}</td>
                      <td>+{lesson.xpReward || 0}</td>
                      <td>
                        <span className={`lms-status ${isPublished ? 'published' : 'draft'}`}>
                          ● {isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td>{fmtDate(lesson.updatedAt || lesson.createdAt)}</td>
                      <td>
                        <button
                          type="button"
                          className="lms-outline-action"
                          style={{ color: '#b42318', borderColor: 'rgba(180, 35, 24, 0.28)', whiteSpace: 'nowrap' }}
                          onClick={() => deleteLesson(lesson.id, lesson.title)}
                        >
                          Remove Lesson
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {!visibleRecentLessons.length && (
                  <tr>
                    <td colSpan="9">No teacher-created lessons yet.</td>
                  </tr>
                )}
              </tbody>
            </table>

            {allRecentLessons.length > 5 && (
              <button className="lms-show-more" type="button" onClick={toggleShowAllLessons}>
                {showAllLessons ? 'Show less ↑' : 'Show more ↓'}
              </button>
            )}
          </section>
          )}
        </div>

        <aside className="teacher-builder-side">
          <TeacherStudentLessonPreview
            lessonDraft={lessonDraft}
            activities={validActivities}
            materialInfo={draftMaterialInfo}
            subjectMeta={subjectMeta}
          />

          <section className="teacher-side-card builder-side-activities">
            <div className="teacher-design-heading">
              <div>
                <h2>Activities in this Lesson</h2>
                <p>Current lesson flow.</p>
              </div>
            </div>

            <div className="lms-side-activity-list">
              {(activities.length ? activities : validActivities).map((activity, index) => {
                const meta = activityButtonMeta.find(item => item.type === activity.type) || activityButtonMeta[0];

                return (
                  <div className="lms-side-activity" key={activity.id || `${activity.type}-${index}`}>
                    <span className={`icon ${meta.className}`}>{meta.icon}</span>
                    <span className="order">{index + 1}</span>
                    <span>{activity.title || meta.label}</span>
                    <span>⋮</span>
                  </div>
                );
              })}

              {!activities.length && (
                <div className="lms-empty-activity">
                  <strong>No activities yet.</strong>
                  <p>Add blocks to build your lesson flow.</p>
                </div>
              )}
            </div>

            <button className="lms-view-lessons-btn" type="button" onClick={scrollToRecentLessons} style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>
              📚 View Lessons
            </button>
          </section>

          </aside>
      </div>

      <div className="lms-bottom-action-bar">
        {builderTab === 'source' && (
          <>
            <button className="lms-action-secondary" type="button">
              📋 Save Draft
            </button>
            <button className="lms-action-primary" type="button" onClick={() => setBuilderTab('details')}>
              Next: Lesson Details →
            </button>
          </>
        )}

        {builderTab === 'details' && (
          <>
            <button className="lms-action-secondary" type="button" onClick={() => setBuilderTab('source')}>
              ← Back to Source
            </button>
            <button className="lms-action-primary" type="button" onClick={() => setBuilderTab('activities')}>
              Next: Activities →
            </button>
          </>
        )}

        {builderTab === 'activities' && (
          <>
            <button className="lms-action-secondary" type="button" onClick={() => setBuilderTab('details')}>
              ← Back to Details
            </button>
            <button className="lms-action-primary" type="button" onClick={() => setBuilderTab('preview')}>
              Next: Preview →
            </button>
          </>
        )}

        {builderTab === 'preview' && (
          <>
            <button className="lms-action-secondary" type="button" onClick={() => setBuilderTab('activities')}>
              ← Back to Activities
            </button>
            <button className="lms-action-primary" type="button" onClick={submitLessonBuilder}>
              🚀 Create Lesson
            </button>
          </>
        )}

        {builderTab === 'lessons' && (
          <>
            <button className="lms-action-secondary" type="button" onClick={() => setBuilderTab('preview')}>
              ← Back to Preview
            </button>
            <button className="lms-action-primary" type="button" onClick={() => setBuilderTab('source')}>
              ✨ Create Another Lesson
            </button>
          </>
        )}
      </div>
    </>
  );
}



function TeacherActivityBlock({
  activity,
  activityIndex,
  updateActivity,
  removeActivity,
  duplicateActivity,
  updateMcqQuestion,
  updateMcqOption,
  addMcqQuestion,
  updatePair,
  addPair,
  updateWord,
  addWord
}) {
  const typeMeta = {
    mcq: {
      label: 'Quiz',
      desc: 'Multiple choice questions.',
      icon: '?',
      color: '#ec407a'
    },
    writing: {
      label: 'Writing',
      desc: 'Choose the best activity for the lesson.',
      icon: '✎',
      color: '#16a9b7'
    },
    speech: {
      label: 'Speech',
      desc: 'Practice speaking and pronunciation.',
      icon: '🎙️',
      color: '#f47c20'
    },
    matching: {
      label: 'Matching',
      desc: 'Match items or concepts.',
      icon: '⌘',
      color: '#8e44ad'
    },
    vocabulary: {
      label: 'Vocabulary',
      desc: 'Teach important words and meanings.',
      icon: 'Aa',
      color: '#27ae60'
    },
    infographic: {
      label: 'Info Card',
      desc: 'Introduce a concept or key information.',
      icon: 'i',
      color: '#2e86de'
    }
  };

  const meta = typeMeta[activity.type] || {
    label: activity.type,
    desc: 'Activity block.',
    icon: '•',
    color: '#95a5a6'
  };

  return (
    <div className="teacher-activity-row">
      <div className="teacher-activity-row-icon" style={{ background: meta.color }}>
        {meta.icon}
      </div>

      <div className="teacher-activity-row-main">
        <div className="teacher-activity-row-head">
          <div>
            <strong>{activity.title || meta.label}</strong>
            <small> · {meta.desc}</small>
          </div>
          <small>Block {activityIndex + 1}</small>
        </div>

        <div
          className="teacher-activity-row-fields grid2"
          style={{
            gridTemplateColumns: 'minmax(240px, 0.9fr) minmax(320px, 1.25fr)',
            gap: 14,
            alignItems: 'stretch'
          }}
        >
          <input
            className="input-field"
            value={activity.title}
            onChange={(e) => updateActivity(activity.id, { title: e.target.value })}
            placeholder="Example: Writing Activity"
            style={{ minHeight: 56, fontSize: 16, padding: '14px 18px' }}
          />

          <input
            className="input-field"
            value={activity.instructions}
            onChange={(e) => updateActivity(activity.id, { instructions: e.target.value })}
            placeholder="Example: Read the question and answer clearly."
            style={{ minHeight: 56, fontSize: 16, padding: '14px 18px' }}
          />
        </div>

        <div style={{ height: 10 }} />

        {activity.type === 'mcq' && (
          <div className="teacher-inline-mcq">
            <TeacherQuizTextImporter
              currentQuestionCount={(activity.questions || []).length}
              onImportQuestions={(questions) => updateActivity(activity.id, { questions })}
            />

            {activity.questions.map((question, qIndex) => (
              <div key={question.id} className="teacher-activity-row-fields">
                <textarea
                  className="input-field"
                  value={question.question}
                  onChange={(e) => updateMcqQuestion(activity.id, question.id, { question: e.target.value })}
                  placeholder={`Question ${qIndex + 1}`}
                  rows="2"
                  style={{
                    minHeight: 76,
                    width: '100%',
                    resize: 'vertical',
                    fontSize: 16,
                    lineHeight: 1.45,
                    padding: '14px 18px'
                  }}
                />

                <div className="teacher-mcq-options-grid">
                  {question.options.map((option, oIndex) => (
                    <div key={option.id} className="teacher-mcq-option-row">
                      <input
                        type="radio"
                        name={`correct-${activity.id}-${question.id}`}
                        checked={option.isCorrect}
                        onChange={() => updateMcqOption(activity.id, question.id, option.id, { isCorrect: true })}
                      />
                      <textarea
                        className="input-field"
                        value={option.text}
                        onChange={(e) => updateMcqOption(activity.id, question.id, option.id, { text: e.target.value })}
                        placeholder={`Choice ${String.fromCharCode(65 + oIndex)}`}
                        rows="2"
                        style={{
                          minHeight: 72,
                          width: '100%',
                          resize: 'vertical',
                          fontSize: 15,
                          lineHeight: 1.4,
                          padding: '13px 16px'
                        }}
                      />
                    </div>
                  ))}
                </div>

                <div className="teacher-mcq-question-actions">
                  <button
                    type="button"
                    className="teacher-mcq-remove-question"
                    onClick={() => {
                      if ((activity.questions || []).length <= 1) {
                        window.alert('At least one quiz question is required.');
                        return;
                      }

                      updateActivity(activity.id, {
                        questions: activity.questions.filter(item => item.id !== question.id)
                      });
                    }}
                  >
                    Remove Question
                  </button>
                </div>
              </div>
            ))}

            <button className="teacher-add-mini" onClick={() => addMcqQuestion(activity.id)} type="button">
              + Add MCQ Question
            </button>
          </div>
        )}

        {activity.type === 'writing' && (
          <div className="teacher-inline-activity" style={{ display: 'grid', gap: 12 }}>
            <div
              className="teacher-activity-row-fields"
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(280px, 340px) minmax(280px, 1fr)',
                gap: 18,
                alignItems: 'end'
              }}
            >
              <label style={{ display: 'grid', gap: 8, fontWeight: 900, fontSize: 16 }}>
                Activity Type
                <select
                  className="input-field"
                  value={(activity.gawainType || 'writing_task') === 'complete_sentence' ? 'complete_sentence' : 'writing_task'}
                  onChange={(e) => updateActivity(activity.id, { gawainType: e.target.value })}
                  style={{
                    minWidth: 280,
                    minHeight: 58,
                    fontSize: 16,
                    padding: '14px 18px'
                  }}
                >
                  <option value="complete_sentence">Complete the Sentence</option>
                  <option value="writing_task">Writing Task</option>
                </select>
              </label>

              <div
                className="muted"
                style={{
                  alignSelf: 'center',
                  fontSize: 16,
                  lineHeight: 1.45,
                  maxWidth: 380
                }}
              >
                Choose the activity that best fits the lesson.
              </div>
            </div>

            {(activity.gawainType || 'writing_task') === 'complete_sentence' ? (
              <>
                <textarea
                  className="input-field"
                  value={activity.template || ''}
                  onChange={(e) => updateActivity(activity.id, { template: e.target.value })}
                  placeholder={"Sentence Template\nExample: The ____ is beautiful."}
                  rows="3"
                  style={{
                    minHeight: 116,
                    fontSize: 16,
                    lineHeight: 1.55,
                    padding: '16px 18px'
                  }}
                />

                <textarea
                  className="input-field"
                  value={activity.choicesText || ''}
                  onChange={(e) => updateActivity(activity.id, { choicesText: e.target.value })}
                  placeholder={"Choices / Word Bank\nExample, one per line:\nhome\nschool"}
                  rows="4"
                  style={{
                    minHeight: 140,
                    fontSize: 16,
                    lineHeight: 1.55,
                    padding: '16px 18px'
                  }}
                />

                <input
                  className="input-field"
                  value={activity.correctAnswer || ''}
                  onChange={(e) => updateActivity(activity.id, { correctAnswer: e.target.value })}
                  placeholder="Correct Answer — Example: home"
                  style={{
                    minHeight: 58,
                    fontSize: 16,
                    padding: '14px 18px'
                  }}
                />
              </>
            ) : (
              <textarea
                className="input-field"
                value={activity.prompt}
                onChange={(e) => updateActivity(activity.id, { prompt: e.target.value })}
                placeholder={"Writing Task\nExample: Write 2 sentences about the lesson of the story."}
                rows="4"
                style={{
                  minHeight: 140,
                  fontSize: 16,
                  lineHeight: 1.55,
                  padding: '16px 18px'
                }}
              />
            )}
          </div>
        )}

        {activity.type === 'speech' && (
          <textarea
            className="input-field"
            value={activity.targetText}
            onChange={(e) => updateActivity(activity.id, { targetText: e.target.value })}
            placeholder="Speech target, e.g. Ang bata ay masayang nagbabasa."
            rows="3"
          />
        )}

        {activity.type === 'matching' && (
          <div className="teacher-inline-pairs">
            {activity.pairs.map((pair, pairIndex) => (
              <div key={pair.id} className="teacher-activity-row-fields grid2">
                <input
                  className="input-field"
                  value={pair.left}
                  onChange={(e) => updatePair(activity.id, pair.id, { left: e.target.value })}
                  placeholder={`Left item ${pairIndex + 1}`}
                />

                <input
                  className="input-field"
                  value={pair.right}
                  onChange={(e) => updatePair(activity.id, pair.id, { right: e.target.value })}
                  placeholder={`Right match ${pairIndex + 1}`}
                />
              </div>
            ))}

            <button className="teacher-add-mini" onClick={() => addPair(activity.id)} type="button">
              + Add Pair
            </button>
          </div>
        )}

        {activity.type === 'vocabulary' && (
          <div className="teacher-inline-words">
            {activity.words.map((item, wordIndex) => (
              <div key={item.id} className="teacher-activity-row-fields">
                <div className="teacher-activity-row-fields grid2">
                  <input
                    className="input-field"
                    value={item.word}
                    onChange={(e) => updateWord(activity.id, item.id, { word: e.target.value })}
                    placeholder={`Word ${wordIndex + 1}`}
                  />

                  <input
                    className="input-field"
                    value={item.meaning}
                    onChange={(e) => updateWord(activity.id, item.id, { meaning: e.target.value })}
                    placeholder="Meaning"
                  />
                </div>

                <input
                  className="input-field"
                  value={item.example}
                  onChange={(e) => updateWord(activity.id, item.id, { example: e.target.value })}
                  placeholder="Example sentence"
                />
              </div>
            ))}

            <button className="teacher-add-mini" onClick={() => addWord(activity.id)} type="button">
              + Add Word
            </button>
          </div>
        )}

        {activity.type === 'infographic' && (
          <textarea
            className="input-field"
            value={activity.content}
            onChange={(e) => updateActivity(activity.id, { content: e.target.value })}
            placeholder="Short info card content. Example: A noun is a word that refers to a person, thing, animal, place, or event."
            rows="3"
          />
        )}
      </div>

      <div className="teacher-activity-actions">
        <button className="teacher-activity-action" type="button">
          Edit
        </button>
        <button className="teacher-activity-action" onClick={() => duplicateActivity(activity.id)} type="button">
          Duplicate
        </button>
        <button className="teacher-activity-action danger" onClick={() => removeActivity(activity.id)} type="button">
          Remove
        </button>
      </div>
    </div>
  );
}
