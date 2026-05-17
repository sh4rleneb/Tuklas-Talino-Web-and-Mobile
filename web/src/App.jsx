import React, { useEffect, useMemo, useState } from 'react';
import { api, downloadUrl } from './api/client';
import { useAuth } from './contexts/AuthContext';

const AVATARS = ['🦊', '🐼', '🐯', '🐸', '🐵', '🦄', '🐰', '🧒'];
const SUBJECTS = [
  { name: 'Pagbasa', icon: '📖', tone: 'green' },
  { name: 'Bokabularyo', icon: '🔤', tone: 'blue'},
  { name: 'Panitikan', icon: '📜', tone: 'purple' },
  { name: 'Oral Comm', icon: '🎙️', tone: 'yellow' },
  { name: 'Pagsulat', icon: '✍️', tone: 'pink'}
];

const MISSION_GAMES = [
  {
    id: 'word-match',
    title: 'Word Match',
    icon: '🧩',
    module: 'Bokabularyo',
    xp: 15,
    baseStatus: 'Available',
    short: 'Itugma ang salitang Filipino sa tamang kahulugan o larawan.',
    instruction: 'Hanapin ang tamang pares. Basahin ang salita, tingnan ang larawan o kahulugan, at piliin ang magkapareha.',
    sample: 'aso → larawan ng aso, bahay → larawan ng bahay',
    reward: 'Bokabularyo Star progress',
    tone: 'sky'
  },
  {
    id: 'letter-pop',
    title: 'Letter Pop',
    icon: '🎈',
    module: 'Pagbasa',
    xp: 12,
    baseStatus: 'Available',
    short: 'Tapikin ang tamang titik o pantig para mabuo ang salitang Filipino.',
    instruction: 'Piliin ang nawawalang titik o pantig. Kapag tama, bubuo ang salita at may XP reward.',
    sample: 'ba + ___ = bata',
    reward: 'Reading streak progress',
    tone: 'sun'
  },
  {
    id: 'picture-guess',
    title: 'Picture Guess',
    icon: '🖼️',
    module: 'Bokabularyo',
    xp: 12,
    baseStatus: 'Available',
    short: 'Tingnan ang larawan at piliin ang tamang salitang Filipino.',
    instruction: 'Pagmasdan ang picture card, pagkatapos piliin ang salitang tumutukoy dito.',
    sample: 'larawan ng pusa → pusa',
    reward: 'Vocabulary confidence',
    tone: 'mint'
  },
  {
    id: 'sentence-builder',
    title: 'Sentence Builder',
    icon: '🧱',
    module: 'Pagsulat',
    xp: 18,
    baseStatus: 'Available',
    short: 'Ayusin ang mga salita para makabuo ng wastong pangungusap.',
    instruction: 'Ilagay ang mga salita sa tamang ayos hanggang makabuo ng malinaw na pangungusap.',
    sample: 'Ako / ay / bata.',
    reward: 'Pagsulat Builder badge progress',
    tone: 'pink'
  },
  {
    id: 'story-quest',
    title: 'Story Quest',
    icon: '📖',
    module: 'Panitikan',
    xp: 20,
    baseStatus: 'Available',
    short: 'Basahin ang maikling kuwento at sagutin ang simpleng tanong.',
    instruction: 'Basahin ang story card. Sagutin ang tanong tungkol sa tauhan, tagpuan, o pangyayari.',
    sample: 'Sino ang pangunahing tauhan?',
    reward: 'Pag-unawa Quest progress',
    tone: 'violet'
  },
  {
    id: 'sound-and-say',
    title: 'Sound and Say',
    icon: '🎙️',
    module: 'Oral Comm',
    xp: 15,
    baseStatus: 'Practice',
    short: 'Magsanay bumigkas ng salitang Filipino o maikling parirala.',
    instruction: 'Pakinggan ang salita, pagkatapos bigkasin ito nang malinaw. Speech checking can be connected later.',
    sample: 'Magandang umaga po.',
    reward: 'Oral practice confidence',
    tone: 'rose',
    future: true
  },
  {
    id: 'badge-challenge',
    title: 'Badge Challenge',
    icon: '🏅',
    module: 'Rewards',
    xp: 25,
    baseStatus: 'Locked',
    short: 'Kumpletuhin ang mini-game streak para maka-unlock ng badge.',
    instruction: 'Tapusin ang 3 vocabulary or reading games para ma-unlock ang special badge.',
    sample: '3 games = Bokabularyo Star',
    reward: 'Bokabularyo Star badge',
    tone: 'orange',
    minCompleted: 3
  }
];


function read(id) {
  return document.getElementById(id)?.value?.trim() || '';
}

function levelForXp(xp = 0) {
  return Math.max(1, Math.floor(Number(xp || 0) / 100) + 1);
}

function xpPercent(xp = 0) {
  return Number(xp || 0) % 100;
}

function fmtDate(value) {
  if (!value) return '—';
  try { return new Date(value).toLocaleDateString(); } catch { return '—'; }
}

function ProgressBar({ value = 0 }) {
  const safe = Math.max(0, Math.min(100, Number(value || 0)));
  return <div className="progress-bar"><div className="progress-fill" style={{ width: `${safe}%` }} /></div>;
}

function Stat({ icon, label, value }) {
  return <div className="stat-card"><div className="stat-icon">{icon}</div><div><b>{value}</b><span>{label}</span></div></div>;
}

function Screen({ id, active, children }) {
  return <div id={id} className={`screen ${active ? 'active' : ''}`}>{children}</div>;
}

function Notification({ notice }) {
  if (!notice) return <div className="notif-wrap" id="notif-wrap" />;
  return <div className="notif-wrap" id="notif-wrap"><div className={`notif ${notice.type || ''}`}>{notice.text}</div></div>;
}

export default function App() {
  const { user, login, logout: authLogout, booting, setUser } = useAuth();
  const [screen, setScreen] = useState('screen-landing');
  const [notice, setNotice] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState('🦊');
  const [studentDash, setStudentDash] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizResult, setQuizResult] = useState(null);
  const [quizAttempts, setQuizAttempts] = useState({});
  const [selectedMissionGameId, setSelectedMissionGameId] = useState('word-match');
  const [lessonFeedback, setLessonFeedback] = useState('');
  const [teacherData, setTeacherData] = useState({ stats: null, rows: [], groups: [], students: [], lessons: [] });
const [adminData, setAdminData] = useState({
  stats: null,
  students: [],
  archivedStudents: [],
  teachers: [],
  archivedTeachers: [],
  logs: []
});
  const [loading, setLoading] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState('ALL');

  const activeRole = screen.includes('teacher') ? 'teacher' : screen.includes('admin') ? 'admin' : screen.includes('student') || screen.includes('stu') || screen.includes('lesson') ? 'student' : '';
  const gradeLevel = studentDash?.student?.gradeLevel || user?.student?.gradeLevel || 4;
  const gradeBand = Number(gradeLevel) <= 2 ? 'early' : 'grade46';

  useEffect(() => {
    if (activeRole) document.body.dataset.role = activeRole;
    else delete document.body.dataset.role;
    if (activeRole === 'student') document.body.dataset.gradeBand = gradeBand;
    else delete document.body.dataset.gradeBand;
  }, [activeRole, gradeBand]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 3600);
    return () => clearTimeout(t);
  }, [notice]);

  useEffect(() => {
    const studentId = studentDash?.student?.id || user?.student?.id;
    if (!studentId) return;
    setQuizAttempts(loadQuizAttempts(studentId));
  }, [studentDash?.student?.id, user?.student?.id]);

  useEffect(() => {
  if (!booting && user) {
    if (user.mustChangePassword) {
      setScreen('screen-change-password');
      return;
    }

    if (user.role === 'student') {
      setScreen('screen-student');
      loadStudentDashboard();
    } else if (user.role === 'teacher') {
      setScreen('screen-teacher');
      loadTeacherDashboard();
    } else if (user.role === 'admin') {
      setScreen('screen-admin');
      loadAdminDashboard();
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [booting, user?.id, user?.role, user?.mustChangePassword]);

  function notify(text, type = '') { setNotice({ text, type }); }
  function go(id) { setScreen(id); }

  async function safeRun(fn, fallback = 'May nangyaring error. Pakisubukan muli.') {
  try {
    setLoading(true);
    return await fn();
  } catch (err) {
    notify(err.message || fallback, 'bad');
    return null;
  } finally {
    setLoading(false);
  }
}

  async function doLogout() {
    authLogout();
    setStudentDash(null);
    setSelectedLesson(null);
    setSelectedQuiz(null);
    setQuizResult(null);
    setQuizAttempts({});
    setTeacherData({ stats: null, rows: [], groups: [], students: [], lessons: [] });
setAdminData({
  stats: null,
  students: [],
  archivedStudents: [],
  teachers: [],
  archivedTeachers: [],
  logs: []
});
    go('screen-landing');
  }

  async function handleLogin(role) {
    await safeRun(async () => {
      let identifier = '';
      let password = '';
      if (role === 'student') {
        identifier = read('stu-id');
        password = read('stu-password') || 'student123';
      }
      if (role === 'teacher') {
        identifier = read('t-username');
        password = read('t-password');
      }
      if (role === 'admin') {
        identifier = read('a-username');
        password = read('a-password');
      }
      if (!identifier) throw new Error(role === 'student' ? 'Ilagay ang Student ID.' : 'Ilagay ang username.');
      if (!password) throw new Error('Ilagay ang password.');
      const logged = await login({ role, identifier, password });

if (logged.mustChangePassword) {
  notify('Kailangan munang palitan ang temporary password bago magpatuloy.', 'warn');
  go('screen-change-password');
  return;
}

if (role === 'student') {
  setSelectedAvatar(logged.student?.avatar || selectedAvatar);
  await loadStudentDashboard();
  go('screen-student');
}

if (role === 'teacher') {
  await loadTeacherDashboard();
  go('screen-teacher');
}

if (role === 'admin') {
  await loadAdminDashboard();
  go('screen-admin');
}
    }, 'Hindi makapag-login.');
  }

  async function handleChangePassword() {
  const currentPassword = read('cp-current-password');
  const newPassword = read('cp-new-password');
  const confirmPassword = read('cp-confirm-password');

  if (!currentPassword) {
    return notify('Ilagay ang kasalukuyang password.', 'warn');
  }

  if (!newPassword) {
    return notify('Ilagay ang bagong password.', 'warn');
  }

  if (newPassword.length < 8) {
    return notify('Ang bagong password ay dapat hindi bababa sa 8 characters.', 'warn');
  }

  if (newPassword !== confirmPassword) {
    return notify('Hindi magkapareho ang bagong password at confirm password.', 'warn');
  }

  await safeRun(async () => {
    await api('/auth/change-password', {
      method: 'POST',
      body: {
        currentPassword,
        newPassword
      }
    });

    const updatedUser = {
      ...user,
      mustChangePassword: false
    };

    setUser(updatedUser);

    notify('Password changed successfully. Maaari ka nang magpatuloy.');

    if (updatedUser.role === 'student') {
      await loadStudentDashboard();
      go('screen-student');
    } else if (updatedUser.role === 'teacher') {
      await loadTeacherDashboard();
      go('screen-teacher');
    } else if (updatedUser.role === 'admin') {
      await loadAdminDashboard();
      go('screen-admin');
    }
  }, 'Hindi napalitan ang password.');
}

  async function loadStudentDashboard() {
    const data = await api('/students/dashboard');
    setStudentDash(data);
    if (data.student?.avatar) setSelectedAvatar(data.student.avatar);
  }

  async function refreshStudent() {
    await safeRun(async () => { await loadStudentDashboard(); });
  }

  async function openLesson(lesson) {
    await safeRun(async () => {
      const data = await api(`/lessons/${lesson.id}`);
      setSelectedLesson({
        ...data.lesson,
        completed: Boolean(lesson?.completed || data.lesson?.completed)
      });
      setLessonFeedback('');
      go('screen-lesson');
    });
  }

  function openQuiz(quiz) {
    if (!quiz) return;
    setSelectedQuiz(quiz);
    setQuizResult(null);
    go('screen-stu-quiz-play');
  }

  function submitQuiz(quiz, answers) {
    if (!quiz) return null;

    const studentId = studentDash?.student?.id || user?.student?.id || 'demo-student';
    const existingAttempts = quizAttempts?.[quiz.id] || [];
    const result = gradeQuizAttempt(quiz, answers, existingAttempts.length + 1);
    const updatedAttempts = appendQuizAttempt(studentId, quizAttempts, quiz.id, result);

    setQuizAttempts(updatedAttempts);
    setQuizResult(result);
    notify(`Quiz submitted: ${result.score}/${result.total} (${result.percent}%)`);
    go('screen-stu-quiz-result');
    return result;
  }

  async function completeLesson(options = {}) {
    if (!selectedLesson) return null;

    const { stay = false, silent = false } = options || {};

    return await safeRun(async () => {
      const data = await api(`/lessons/${selectedLesson.id}/complete`, { method: 'POST', body: {} });

      setSelectedLesson(prev => prev ? { ...prev, completed: true } : prev);

      if (!silent) {
        notify(data.xpAwarded ? `🎉 Natapos! +${data.xpAwarded} XP` : 'Nagawa mo na ang lesson na ito.');
      }

      await loadStudentDashboard();

      if (!stay) {
        go('screen-student');
      }

      return data;
    });
  }

  async function submitMcq(question, option) {
  if (!selectedLesson) return null;

  return await safeRun(async () => {
    const data = await api(`/lessons/${selectedLesson.id}/mcq`, {
      method: 'POST',
      body: { questionId: question.id, selectedOptionId: option.id }
    });

    setLessonFeedback(data.correct ? '✅ Tama! +5 XP' : '❌ Subukan muli.');
    await loadStudentDashboard();

    return data;
  });
}

  async function submitWriting(taskId, answer) {
  if (!selectedLesson) return;

  if (!answer || answer.trim().length < 2) {
    setLessonFeedback('✍️ Pakisulat muna ang iyong sagot bago i-submit.');
    return;
  }

  await safeRun(async () => {
    await api(`/lessons/${selectedLesson.id}/writing`, {
      method: 'POST',
      body: {
        taskId,
        content: answer
      }
    });

    setLessonFeedback('✍️ Na-save ang writing activity. +8 XP');
    await loadStudentDashboard();
  });
}

  async function submitSpeech(taskId, transcript, score) {
  if (!selectedLesson) return;

  if (!transcript || transcript.trim().length < 2) {
    setLessonFeedback('🎤 Paki-subukan munang magsalita bago i-submit.');
    return;
  }

  await safeRun(async () => {
    await api(`/lessons/${selectedLesson.id}/speech`, {
      method: 'POST',
      body: {
        taskId,
        transcript,
        score
      }
    });

    setLessonFeedback(`🎤 Na-save ang speech practice attempt. Score: ${score}% +6 XP`);
    await loadStudentDashboard();
  });
}

  async function updateAvatar(avatar) {
    setSelectedAvatar(avatar);
    if (!studentDash?.student?.id) return;
    await safeRun(async () => {
      const data = await api(`/students/${studentDash.student.id}/avatar`, { method: 'PATCH', body: { avatar } });
      setStudentDash(prev => prev ? { ...prev, student: data.student } : prev);
      setUser(prev => prev ? { ...prev, student: data.student } : prev);
      notify('Avatar updated!');
    });
  }

  async function loadTeacherDashboard() {
    const [dash, monitoring, groups, students, lessons] = await Promise.all([
      api('/teachers/dashboard'),
      api('/teachers/monitoring/stats'),
      api('/groups'),
      api('/students?status=active'),
      api('/lessons')
    ]);

    const sortedLessons = [...(lessons.lessons || [])].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();

      if (dateA !== dateB) return dateB - dateA;

      return Number(b.id || 0) - Number(a.id || 0);
    });

    setTeacherData({
      stats: dash.stats,
      rows: monitoring.rows || [],
      groups: groups.groups || [],
      students: students.students || [],
      lessons: sortedLessons
    });
  }

  async function teacherCreateGroup() {
    await safeRun(async () => {
      await api('/groups', { method: 'POST', body: { name: read('t-group-name'), description: read('t-group-section') } });
      notify('Group created.');
      await loadTeacherDashboard();
    });
  }

  async function teacherAddMember(groupId) {
    const studentId = Number(read(`member-${groupId}`));
    if (!studentId) return notify('Pumili ng student.', 'warn');
    await safeRun(async () => {
      await api(`/groups/${groupId}/members`, { method: 'POST', body: { studentId } });
      notify('Member added.');
      await loadTeacherDashboard();
    });
  }

  async function teacherAddTask() {
    await safeRun(async () => {
      const groupId = read('t-task-group');
      if (!groupId) throw new Error('Pumili muna ng group.');
      await api(`/groups/${groupId}/tasks`, {
        method: 'POST',
        body: { title: read('t-task-title'), dueAt: read('t-task-deadline') || null, xpReward: Number(read('t-task-xp') || 10) }
      });
      notify('Task added.');
      await loadTeacherDashboard();
    });
  }

 async function teacherCreateLesson(payload = null) {
  await safeRun(async () => {
    let requestBody = payload;

    if (!requestBody) {
      const activities = [];
      const question = read('t-mcq-q');

      if (question) {
        const correct = Number(read('t-mcq-correct') || 0);
        const choices = [read('t-mcq-a'), read('t-mcq-b'), read('t-mcq-c'), read('t-mcq-d')].filter(Boolean);

        activities.push({
          type: 'mcq',
          title: 'Multiple Choice Quiz',
          questions: [
            {
              question,
              options: choices.map((text, idx) => ({
                text,
                isCorrect: idx === correct
              }))
            }
          ]
        });
      }

      const prompt = read('t-writing-prompt');
      if (prompt) {
        activities.push({
          type: 'writing',
          title: 'Writing Activity',
          prompt
        });
      }

      const speechTarget = read('t-lesson-speechTarget');
      if (speechTarget) {
        activities.push({
          type: 'speech',
          title: 'Speech Practice',
          targetText: speechTarget
        });
      }

      requestBody = {
        gradeLevel: Number(read('t-lesson-grade')),
        subject: read('t-lesson-subject'),
        title: read('t-lesson-title'),
        xpReward: Number(read('t-lesson-xp') || 25),
        instructions: read('t-lesson-instructions'),
        passage: read('t-lesson-passage'),
        speechTarget,
        activities
      };
    }

    await api('/lessons', {
      method: 'POST',
      body: requestBody
    });

    notify('Lesson created.');
    await loadTeacherDashboard();
  });
}

async function loadAdminDashboard() {
  const [stats, students, archivedStudents, teachers, archivedTeachers, logs] = await Promise.all([
    api('/admin/stats'),
    api('/students?status=active'),
    api('/students?status=archived'),
    api('/teachers?status=active'),
    api('/teachers?status=archived'),
    api('/admin/audit-logs?limit=50')
  ]);

  setAdminData({
    stats: stats.stats,
    students: students.students || [],
    archivedStudents: archivedStudents.students || [],
    teachers: teachers.teachers || [],
    archivedTeachers: archivedTeachers.teachers || [],
    logs: logs.logs || []
  });
}

  async function adminAddStudent() {
    await safeRun(async () => {
      await api('/students', {
        method: 'POST',
        body: {
          studentCode: read('a-stu-id'),
          name: read('a-stu-name'),
          gradeLevel: Number(read('a-stu-grade')),
          section: read('a-stu-section'),
          avatar: '',
          password: read('a-stu-password') || 'student123'
        }
      });

      notify('Student added.');
      await loadAdminDashboard();
    });
  }

  async function adminAddTeacher() {
    await safeRun(async () => {
      await api('/teachers', {
        method: 'POST',
        body: {
          username: read('a-t-username'),
          name: read('a-t-name'),
          employeeCode: read('a-t-code') || read('a-t-username'),
          password: read('a-t-password') || 'teach123'
        }
      });

      notify('Teacher added.');
      await loadAdminDashboard();
    });
  }

  async function archiveStudent(id) {
  const confirmed = window.confirm(
    'Archive this student account? The student will not be able to log in until reactivated.'
  );

  if (!confirmed) return;

  await safeRun(async () => {
    await api(`/students/${id}/archive`, { method: 'POST' });
    notify('Student archived. You can restore this account from Archived Students.');
    await loadAdminDashboard();
    await loadTeacherDashboard().catch(() => null);
  });
}

async function reactivateStudent(id) {
  const confirmed = window.confirm(
    'Reactivate this student account? The student will be able to log in again.'
  );

  if (!confirmed) return;

  await safeRun(async () => {
    await api(`/students/${id}/reactivate`, { method: 'POST' });
    notify('Student reactivated.');
    await loadAdminDashboard();
    await loadTeacherDashboard().catch(() => null);
  });
}

async function resetStudentPassword(id, name = 'student') {
  const confirmed = window.confirm(
    `Reset password for ${name}? The system will generate a temporary 6-digit PIN. The student must change it after logging in.`
  );

  if (!confirmed) return;

  await safeRun(async () => {
    const data = await api(`/students/${id}/reset-password`, {
      method: 'POST',
      body: {}
    });

    window.alert(
      `Temporary PIN for ${name}:\n\n${data.temporaryPin}\n\nGive this PIN to the student. They will be required to change their password after logging in.`
    );

    notify('Student password reset. Temporary PIN was shown to admin.');
    await loadAdminDashboard();
  }, 'Hindi na-reset ang password.');
}

  async function resetStudent(id) {
    await safeRun(async () => {
      await api(`/students/${id}/reset-progress`, { method: 'POST' });
      notify('Progress reset.');
      await loadAdminDashboard();
      await loadTeacherDashboard().catch(() => null);
    });
  }

  async function resetTeacherPassword(id, name = 'teacher') {
  const confirmed = window.confirm(
    `Reset password for ${name}? The system will generate a temporary 6-digit PIN. The teacher must change it after logging in.`
  );

  if (!confirmed) return;

  await safeRun(async () => {
    const data = await api(`/teachers/${id}/reset-password`, {
      method: 'POST',
      body: {}
    });

    window.alert(
      `Temporary PIN for ${name}:\n\n${data.temporaryPin}\n\nGive this PIN to the teacher. They will be required to change their password after logging in.`
    );

    notify('Teacher password reset. Temporary PIN was shown to admin.');
    await loadAdminDashboard();
  }, 'Hindi na-reset ang teacher password.');
}

async function reactivateTeacher(id) {
  const confirmed = window.confirm(
    'Reactivate this teacher account? The teacher will be able to log in again.'
  );

  if (!confirmed) return;

  await safeRun(async () => {
    await api(`/teachers/${id}/reactivate`, { method: 'POST' });
    notify('Teacher reactivated.');
    await loadAdminDashboard();
  });
}

async function archiveTeacher(id) {
  const confirmed = window.confirm(
    'Archive this teacher account? The teacher will not be able to log in until reactivated.'
  );

  if (!confirmed) return;

  await safeRun(async () => {
    await api(`/teachers/${id}/archive`, { method: 'POST' });
    notify('Teacher archived. You can restore this account from Archived Teachers.');
    await loadAdminDashboard();
  });
}

  async function completeGroupTask(taskId) {
    await safeRun(async () => {
      const data = await api(`/groups/tasks/${taskId}/complete`, { method: 'POST' });
      notify(data.xpAwarded ? `Task completed! +${data.xpAwarded} XP` : 'Task already completed.');
      await loadStudentDashboard();
    });
  }

  function exportStudentsCSV() {
    window.location.href = downloadUrl('/reports/students.csv');
  }

  function exportLogsCSV() {
    window.location.href = downloadUrl('/reports/activity-logs.csv');
  }

  function downloadSummaryReport() {
    window.location.href = downloadUrl('/reports/summary.txt');
  }

  const lessonsBySubject = useMemo(() => {
    const lessons = studentDash?.lessons || [];
    return SUBJECTS.map(subject => ({
      ...subject,
      lessons: lessons.filter(lesson => lesson.subject === subject.name)
    }));
  }, [studentDash]);

  const visibleLessons = useMemo(() => {
    const lessons = studentDash?.lessons || [];
    return subjectFilter === 'ALL'
      ? lessons
      : lessons.filter(lesson => lesson.subject === subjectFilter);
  }, [studentDash, subjectFilter]);

  if (booting) {
    return (
      <div className="home-wrap">
        <div className="home-card">
          <div className="home-title">Tuklas Talino</div>
          <div className="muted">Starting Tuklas Talino...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .notif-wrap {
          position: fixed !important;
          inset: 0 !important;
          z-index: 500 !important;
          display: grid !important;
          place-items: center !important;
          padding: 24px !important;
          pointer-events: none !important;
          background: transparent !important;
        }

        .notif {
          pointer-events: auto !important;
          max-width: min(560px, calc(100vw - 40px)) !important;
          min-width: min(420px, calc(100vw - 40px)) !important;
          padding: 24px 28px !important;
          border-radius: 28px !important;
          background: rgba(255, 255, 255, 0.96) !important;
          color: #14223b !important;
          border: 3px solid rgba(255, 217, 102, 0.55) !important;
          box-shadow: 0 24px 70px rgba(20, 34, 59, 0.22) !important;
          text-align: center !important;
          font-size: clamp(20px, 2.4vw, 28px) !important;
          font-weight: 1000 !important;
          line-height: 1.35 !important;
          animation: centerNotifPop 0.22s ease-out both !important;
        }

        .notif.bad {
          border-color: rgba(239, 68, 68, 0.55) !important;
          background: #fff8f8 !important;
        }

        .notif.warn {
          border-color: rgba(245, 158, 11, 0.62) !important;
          background: #fffbeb !important;
        }

        @keyframes centerNotifPop {
          from { opacity: 0; transform: scale(0.92) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      <Notification notice={notice} />

      {loading && (
        <div className="notif-wrap">
          <div className="notif">⏳ Loading...</div>
        </div>
      )}

      <Screen id="screen-landing" active={screen === 'screen-landing'}>
        <LandingScreen go={go} />
      </Screen>

      <Screen id="screen-change-password" active={screen === 'screen-change-password'}>
  <ChangePasswordScreen
    user={user}
    onSubmit={handleChangePassword}
    onLogout={doLogout}
  />
</Screen>

      <Screen id="screen-home" active={screen === 'screen-home'}>
        <HomeScreen go={go} notify={notify} />
      </Screen>

      <Screen id="screen-login-student" active={screen === 'screen-login-student'}>
        <StudentLogin
          go={go}
          selectedAvatar={selectedAvatar}
          setSelectedAvatar={setSelectedAvatar}
          onLogin={() => handleLogin('student')}
        />
      </Screen>

      <Screen id="screen-login-teacher" active={screen === 'screen-login-teacher'}>
        <TeacherLogin
          go={go}
          onLogin={() => handleLogin('teacher')}
        />
      </Screen>

      <Screen id="screen-login-admin" active={screen === 'screen-login-admin'}>
        <AdminLogin
          go={go}
          onLogin={() => handleLogin('admin')}
        />
      </Screen>

      <Screen id="screen-student" active={screen === 'screen-student'}>
        <StudentDashboard
          data={studentDash}
          lessonsBySubject={lessonsBySubject}
          go={go}
          logout={doLogout}
          refresh={refreshStudent}
          openLesson={openLesson}
          selectedAvatar={selectedAvatar}
        />
      </Screen>

      <Screen id="screen-lessons" active={screen === 'screen-lessons'}>
        <LessonsScreen
          lessons={visibleLessons}
          subjectFilter={subjectFilter}
          setSubjectFilter={setSubjectFilter}
          go={go}
          openLesson={openLesson}
          data={studentDash}
        />
      </Screen>

      <Screen id="screen-stu-quizzes" active={screen === 'screen-stu-quizzes'}>
        <StudentQuizzes
          data={studentDash}
          go={go}
          openQuiz={openQuiz}
          quizAttempts={quizAttempts}
        />
      </Screen>

      <Screen id="screen-stu-quiz-play" active={screen === 'screen-stu-quiz-play'}>
        {selectedQuiz && (
          <StudentQuizPlay
            data={studentDash}
            quiz={selectedQuiz}
            go={go}
            submitQuiz={submitQuiz}
            quizAttempts={quizAttempts}
          />
        )}
      </Screen>

      <Screen id="screen-stu-quiz-result" active={screen === 'screen-stu-quiz-result'}>
        {quizResult && (
          <StudentQuizResult
            data={studentDash}
            result={quizResult}
            go={go}
            openQuiz={openQuiz}
          />
        )}
      </Screen>

      <Screen id="screen-lesson" active={screen === 'screen-lesson'}>
        {selectedLesson && (
          <LessonScreen
            lesson={selectedLesson}
            feedback={lessonFeedback}
            go={go}
            completeLesson={completeLesson}
            submitMcq={submitMcq}
            submitWriting={submitWriting}
            submitSpeech={submitSpeech}
            data={studentDash}
            openLesson={openLesson}
          />
        )}
      </Screen>

      <Screen id="screen-stu-missions" active={screen === 'screen-stu-missions'}>
        <StudentMissions
          data={studentDash}
          go={go}
          onPlayMission={(gameId) => {
            setSelectedMissionGameId(gameId);
            go('screen-stu-mission-play');
          }}
        />
      </Screen>

      <Screen id="screen-stu-mission-play" active={screen === 'screen-stu-mission-play'}>
        <StudentMissionPlay
          data={studentDash}
          go={go}
          selectedGameId={selectedMissionGameId}
          onBack={() => go('screen-stu-missions')}
        />
      </Screen>

      <Screen id="screen-stu-groups" active={screen === 'screen-stu-groups'}>
        <StudentGroups
          data={studentDash}
          go={go}
          completeGroupTask={completeGroupTask}
        />
      </Screen>

      <Screen id="screen-stu-badges" active={screen === 'screen-stu-badges'}>
        <StudentBadges
          data={studentDash}
          go={go}
        />
      </Screen>

      <Screen id="screen-stu-profile" active={screen === 'screen-stu-profile'}>
        <StudentProfile
          data={studentDash}
          selectedAvatar={selectedAvatar}
          updateAvatar={updateAvatar}
          go={go}
        />
      </Screen>

      <Screen id="screen-teacher" active={screen === 'screen-teacher'}>
        <TeacherDashboard
          user={user}
          data={teacherData}
          logout={doLogout}
          reload={() => safeRun(loadTeacherDashboard)}
          createGroup={teacherCreateGroup}
          addTask={teacherAddTask}
          addMember={teacherAddMember}
          createLesson={teacherCreateLesson}
          exportStudentsCSV={exportStudentsCSV}
          exportLogsCSV={exportLogsCSV}
          downloadSummaryReport={downloadSummaryReport}
        />
      </Screen>

      <Screen id="screen-admin" active={screen === 'screen-admin'}>
        <AdminDashboard
  data={adminData}
  logout={doLogout}
  addStudent={adminAddStudent}
  addTeacher={adminAddTeacher}
  archiveStudent={archiveStudent}
  reactivateStudent={reactivateStudent}
  resetStudentPassword={resetStudentPassword}
  resetTeacherPassword={resetTeacherPassword}
  resetStudent={resetStudent}
  archiveTeacher={archiveTeacher}
  reactivateTeacher={reactivateTeacher}
  reload={() => safeRun(loadAdminDashboard)}
/>
      </Screen>
    </>
  );
}

function LandingScreen({ go }) {
  return (
    <div className="tt-lms-home">
      <header className="tt-lms-nav">
        <button className="tt-logo" onClick={() => go('screen-landing')} aria-label="Tuklas Talino Home">
          <span className="tt-sun">☀️</span>
          <span><strong>Tuklas Talino</strong><small>Matuto. Tuklasin. Magtagumpay.</small></span>
        </button>
        <nav className="tt-main-menu" aria-label="Main navigation">
          <button className="active" onClick={() => go('screen-landing')}>🏠 Home</button>
          <button onClick={() => document.getElementById('tt-modules')?.scrollIntoView({ behavior: 'smooth' })}>📖 Modules</button>
          <button onClick={() => document.getElementById('tt-about')?.scrollIntoView({ behavior: 'smooth' })}>ℹ️ About</button>
          <button onClick={() => document.getElementById('tt-help')?.scrollIntoView({ behavior: 'smooth' })}>❔ Help</button>
        </nav>
        <div className="tt-login-actions">
          <button className="tt-login-pill student" onClick={() => go('screen-login-student')}>👤 Student Login</button>
          <button className="tt-login-pill teacher" onClick={() => go('screen-login-teacher')}>🖥️ Teacher Login</button>
          <button className="tt-login-pill admin" onClick={() => go('screen-login-admin')}>🛡️ Admin Login</button>
        </div>
      </header>
      <main className="tt-home-main">
        <section className="tt-hero-card" aria-label="Tuklas Talino introduction">
          <div className="tt-hero-copy">
            <h1>Mas masaya ang pag-aaral!</h1>
            <p>Ang inyong learning space para sa <strong>Grades 1–6.</strong></p>
            <div className="tt-hero-points">
              <div><span>📗</span><strong>Matuto</strong><small>Interactive modules</small></div>
              <div><span>🏆</span><strong>Tuklasin</strong><small>Fun missions at activities</small></div>
              <div><span>⭐</span><strong>Magtagumpay</strong><small>Rewards at badges</small></div>
            </div>
          </div>
          <div className="tt-hero-art" aria-hidden="true">
            <div className="tt-art-window" /><div className="tt-art-shelf" /><div className="tt-art-desk" />
            <div className="tt-child boy">👦</div><div className="tt-child girl">👧</div><div className="tt-laptop">💻</div>
            <div className="tt-book-stack">📚</div><div className="tt-notebook">📖</div><div className="tt-pencil-cup">✏️</div>
          </div>
          <div className="tt-slider-dots" aria-hidden="true"><span /><span /><span /></div>
        </section>
        <section className="tt-panel tt-role-panel" aria-label="Role login cards">
          <h2>👥 Mag-login bilang:</h2>
          <div className="tt-role-cards">
            <article className="tt-role-card student"><div className="tt-role-avatar">👦</div><div className="tt-role-content"><h3>Student</h3><p>Mag-access sa modules, activities at inyong progress.</p></div><button onClick={() => go('screen-login-student')}>Student Login <span>→</span></button></article>
            <article className="tt-role-card teacher"><div className="tt-role-avatar">👩‍🏫</div><div className="tt-role-content"><h3>Teacher</h3><p>Pamahalaan ang klase, aralin at mga gawain ng inyong mag-aaral.</p></div><button onClick={() => go('screen-login-teacher')}>Teacher Login <span>→</span></button></article>
            <article className="tt-role-card admin"><div className="tt-role-avatar">👨‍💻</div><div className="tt-role-content"><h3>Admin</h3><p>Pamahalaan ang users, content at system settings.</p></div><button onClick={() => go('screen-login-admin')}>Admin Login <span>→</span></button></article>
          </div>
        </section>
        <section className="tt-panel tt-modules-panel" id="tt-modules" aria-label="Popular modules">
          <div className="tt-section-heading"><h2>📚 Mga Popular na Modules</h2><button onClick={() => go('screen-login-student')}>View all modules →</button></div>
          <div className="tt-module-grid">
            {SUBJECTS.map((s, idx) => <article className={`tt-module-card ${s.tone}`} key={s.name}><div className="tt-module-icon">{s.icon}</div><h3>{s.name}</h3><p>{s.desc}</p><div className="tt-progress"><span style={{ width: `${[75,60,65,55,70][idx]}%` }} /></div><small>Integrated Module</small></article>)}
          </div>
        </section>
        <section className="tt-panel tt-why-panel" id="tt-about" aria-label="Why use Tuklas Talino">
          <h2>⭐ Bakit gamitin ang Tuklas Talino?</h2>
          <div className="tt-why-grid">
            <div><span>📗</span><strong>Batay sa MELC</strong><small>Alinsunod sa Most Essential Learning Competencies para sa Grades 1–6.</small></div>
            <div><span>⭐</span><strong>Masaya at Interaktibo</strong><small>Mga laro, gawain, at aktibidad na makabuluhan at nakaka-engganyo.</small></div>
            <div><span>👥</span><strong>Para sa Lahat</strong><small>Dinisenyo para sa estudyante, guro, at admin.</small></div>
            <div><span>🛡️</span><strong>Ligtas at Maaasahan</strong><small>Ligtas na platform para sa bawat mag-aaral.</small></div>
          </div>
        </section>
        <section className="tt-ready-card" id="tt-help" aria-label="Get started">
          <div className="tt-ready-art" aria-hidden="true"><span>👦</span><span>👧</span><span>👦</span><div>📚</div></div>
          <div className="tt-ready-copy"><h2>Handa nang magsimula?</h2><p>Pumili ng inyong role at simulan ang masayang paglalakbay tungo sa kaalaman!</p><button onClick={() => go('screen-home')}>Mag-login na! <span>→</span></button></div>
        </section>
      </main>
      <footer className="tt-footer">
        <div className="tt-footer-brand"><span>☀️</span><div><strong>Tuklas Talino</strong><small>Matuto. Tuklasin. Magtagumpay.</small></div></div>
        <div><strong>Quick Links</strong><button onClick={() => go('screen-landing')}>Home</button><button onClick={() => document.getElementById('tt-modules')?.scrollIntoView({ behavior: 'smooth' })}>Modules</button><button onClick={() => document.getElementById('tt-about')?.scrollIntoView({ behavior: 'smooth' })}>About</button><button onClick={() => document.getElementById('tt-help')?.scrollIntoView({ behavior: 'smooth' })}>Help</button></div>
        <div><strong>For Users</strong><button onClick={() => go('screen-login-student')}>Student Login</button><button onClick={() => go('screen-login-teacher')}>Teacher Login</button><button onClick={() => go('screen-login-admin')}>Admin Login</button></div>
        <div><strong>Connect with Us</strong><p className="tt-socials">● ▶ ✉</p></div>
      </footer>
    </div>
  );
}

function HomeScreen({ go, notify }) {
  return <div className="home-wrap home-wrap-v2">
    <div className="home-bg-shape shape-one" /><div className="home-bg-shape shape-two" /><div className="home-bg-shape shape-three" />
    <div className="home-card home-card-v2">
      <button className="btn btn-outline btn-sm home-back-btn" onClick={() => go('screen-landing')}>← Back to Welcome</button>
      <div className="home-title home-title-v2">Tuklas <span>Talino</span></div>
      <div className="home-subtitle-v2">PH Filipino Learning + Gamified Collaboration • Baitang 1–6</div>
      <div className="role-cards role-cards-v2">
        <div className="role-card role-card-v2 role-student" onClick={() => go('screen-login-student')}><div className="role-tag">Para sa Mag-aaral</div><div className="role-illustration student-scene"><span className="role-object bag">🎒</span><span className="role-person">👦</span><span className="role-object book">📖</span><span className="role-object sparkle">⭐</span></div><div className="role-info"><h3>Mag-aaral</h3><p>Kumpletuhin ang mga aralin, sumali sa gawain, at kumita ng badges!</p><span className="role-arrow">→</span></div></div>
        <div className="role-card role-card-v2 role-teacher" onClick={() => go('screen-login-teacher')}><div className="role-tag">Para sa Guro</div><div className="role-illustration teacher-scene"><span className="role-person">👩‍🏫</span><span className="role-object board">🔤</span><span className="role-object check">✅</span></div><div className="role-info"><h3>Guro</h3><p>Gumawa ng aralin, grupo, at subaybayan ang progreso.</p><span className="role-arrow">→</span></div></div>
        <div className="role-card role-card-v2 role-admin" onClick={() => go('screen-login-admin')}><div className="role-tag">Para sa Admin</div><div className="role-illustration admin-scene"><span className="role-person">🛡️</span><span className="role-object gear">⚙️</span><span className="role-object chart">📊</span></div><div className="role-info"><h3>Admin</h3><p>Pamahalaan ang accounts, settings, at system activity logs.</p><span className="role-arrow">→</span></div></div>
      </div>
      <div className="demo-panel-v2">
        <div className="demo-accounts-v2">
          <div className="section-title">✨ Quick Demo Accounts</div>
          <div className="demo-line"><span className="demo-icon purple">🛡️</span><b>Admin:</b> username <strong>admin</strong> / password <strong>admin123</strong></div>
          <div className="demo-line"><span className="demo-icon blue">👩‍🏫</span><b>Teacher:</b> username <strong>teacher1</strong> / password <strong>teach123</strong></div>
          <div className="demo-line"><span className="demo-icon green">🎒</span><b>Student IDs:</b> <strong>STU-2025-001</strong> ... <strong>STU-2025-006</strong></div>
          <div className="demo-tip">💡 Tip: Students use password <strong>student123</strong> by default.</div>
        </div>
        <div className="feature-grid-v2">
          <div className="feature-mini"><span>👥</span><div><b>Kolaborasyon</b><p>Gumawa ng grupo at makilahok sa mga gawain.</p></div></div>
          <div className="feature-mini"><span>🏅</span><div><b>Gamified Learning</b><p>Kumita ng XP, level up, at badges.</p></div></div>
          <div className="feature-mini"><span>📈</span><div><b>Progreso Tracking</b><p>Subaybayan ang pag-unlad.</p></div></div>
          <div className="feature-mini"><span>🔒</span><div><b>Ligtas at Maayos</b><p>May roles para sa student, teacher, at admin.</p></div></div>
        </div>
      </div>
      <div className="reset-area-v2"><button className="btn btn-green reset-btn-v2" onClick={() => notify('Database reset is done from backend: npm.cmd run reset', 'warn')}>♻️ Reset Demo Data</button><div className="muted">For full reset, run backend reset command.</div></div>
    </div>
  </div>;
}

function ChangePasswordScreen({ user, onSubmit, onLogout }) {
  return (
    <>
      <div className="top-nav login-top-nav login-student-nav">
        <button className="btn btn-outline btn-sm" onClick={onLogout}>
          ← Logout
        </button>

        <div className="logo">🔐 Account Security</div>

        <div className="login-nav-pill">
          ⭐ Secure muna bago magpatuloy!
        </div>
      </div>

      <div className="login-stage student-stage">
        <div className="login-shell student-shell">
          <aside className="login-visual-card student-visual-card">
            <div className="login-sparkles">✦</div>

            <h2>
              Palitan ang<br />
              Password! 🔐
            </h2>

            <p>
              Para sa seguridad ng iyong account, kailangan mong gumawa ng sarili
              mong password bago ka makapagpatuloy.
            </p>

            <div className="student-hero-illustration" aria-hidden="true">
              <div className="hero-child">{user?.student?.avatar || '🧒'}</div>
              <div className="hero-school">🏫</div>
              <div className="hero-book">🔐</div>
            </div>

            <div className="login-info-card">
              <span className="info-icon">🛡️</span>
              <div>
                <b>Ligtas ang Iyong Account</b>
                <br />
                <span>
                  Protektado ang iyong progress, XP, badges, at learning records.
                </span>
              </div>
            </div>
          </aside>

          <section className="login-form-panel student-form-panel">
            <div className="login-form-heading">
              <span className="heading-badge">👤</span>
              <div>
                <h3>Kumusta, {user?.displayName || 'Mag-aaral'}!</h3>
                <p>Palitan muna ang temporary password bago magpatuloy.</p>
              </div>
            </div>

            <div className="login-divider" />

            <label className="login-label" htmlFor="cp-current-password">
              🔒 Current Password
            </label>
            <div className="input-with-icon">
              <span>🔐</span>
              <input
                className="input-field"
                id="cp-current-password"
                type="password"
                placeholder="Ilagay ang temporary/current password"
              />
            </div>

            <label className="login-label" htmlFor="cp-new-password">
              ✨ New Password
            </label>
            <div className="input-with-icon">
              <span>🆕</span>
              <input
                className="input-field"
                id="cp-new-password"
                type="password"
                placeholder="Gumawa ng bagong password"
              />
            </div>

            <label className="login-label" htmlFor="cp-confirm-password">
              ✅ Confirm New Password
            </label>
            <div className="input-with-icon">
              <span>✅</span>
              <input
                className="input-field"
                id="cp-confirm-password"
                type="password"
                placeholder="Ulitin ang bagong password"
              />
            </div>

            <button className="btn btn-green login-main-btn" onClick={onSubmit}>
              🔐 Change Password
            </button>

            <button
              className="btn btn-outline login-main-btn"
              type="button"
              onClick={onLogout}
              style={{ marginTop: 10 }}
            >
              Logout
            </button>

            <p className="secure-note">
              🔒 Gumamit ng password na may hindi bababa sa 8 characters.
            </p>
          </section>
        </div>

        <div className="login-tip-card">
          💡 <b>Tip:</b> Huwag ibahagi ang iyong password sa iba.
          <span> 💚</span>
        </div>
      </div>
    </>
  );
}

function StudentLogin({ go, selectedAvatar, setSelectedAvatar, onLogin }) {
  return <>
    <div className="top-nav login-top-nav login-student-nav"><button className="btn btn-outline btn-sm" onClick={() => go('screen-home')}>← Home</button><div className="logo">🎒 Student Login</div><div className="login-nav-pill">⭐ Tuklas. Matuto. Magsaya!</div></div>
    <div className="login-stage student-stage"><div className="login-shell student-shell">
      <aside className="login-visual-card student-visual-card"><div className="login-sparkles">✦</div><h2>Mag-login,<br />Estudyante! 👋</h2><p>Piliin ang avatar mo at ilagay ang Student ID para magpatuloy.</p><div className="student-hero-illustration" aria-hidden="true"><div className="hero-child">🧒</div><div className="hero-school">🏫</div><div className="hero-book">📘</div></div><div className="login-info-card"><span className="info-icon">🛡️</span><div><b>Ligtas • Masaya • Makabuluhan</b><br /><span>Tuklas Talino, kasama mo sa bawat hakbang.</span></div></div></aside>
      <section className="login-form-panel student-form-panel"><div className="login-form-heading"><span className="heading-badge">👤</span><div><h3>Pumili ng Avatar</h3><p>Piliin ang avatar na gusto mong gamitin.</p></div></div><div className="avatar-grid avatar-grid-v2" id="stu-avatar-grid">{AVATARS.map(a => <button type="button" className={`avatar-circle ${selectedAvatar === a ? 'selected' : ''}`} onClick={() => setSelectedAvatar(a)} key={a}>{a}</button>)}</div><div className="login-divider" /><label className="login-label" htmlFor="stu-id">🪪 Student ID</label><div className="input-with-icon"><span>👤</span><input className="input-field" id="stu-id" placeholder="Halimbawa: STU-2025-001" /><span className="input-check">✓</span></div><label className="login-label" htmlFor="stu-password">🔒 Password</label><div className="input-with-icon"><span>🔐</span><input className="input-field" id="stu-password" placeholder="Default: student123" type="password" /></div><button className="btn btn-green login-main-btn" onClick={onLogin}>✨ Login</button><p className="secure-note">🔒 Ang iyong impormasyon ay ligtas at protektado.</p></section>
    </div><div className="login-tip-card">💡 <b>Tip:</b> Demo password ng students: <strong>student123</strong>. <span>💚</span></div></div>
  </>;
}

function TeacherLogin({ go, onLogin }) {
  return <><div className="top-nav login-top-nav login-teacher-nav"><button className="btn btn-outline btn-sm" onClick={() => go('screen-home')}>← Home</button><div className="logo">👩‍🏫 Teacher Login</div><div className="login-nav-pill teacher-pill">⭐ Salamat sa dedikasyon, Guro!</div></div><div className="login-stage teacher-stage"><div className="login-shell teacher-shell"><aside className="login-visual-card teacher-visual-card"><h2>Inspire<br />Educate<br />Empower</h2><div className="teacher-hero-illustration" aria-hidden="true"><div className="teacher-avatar-big">👩‍🏫</div><div className="teacher-board">Aa Bb<br />Aralin</div></div><div className="login-info-card"><span className="info-icon">👥</span><div><b>Tuklas Talino para sa mga Guro</b><br /><span>Pamahalaan ang klase, gumawa ng aralin, at subaybayan ang progreso.</span></div></div></aside><section className="login-form-panel teacher-form-panel"><h2>Mag-login, Guro!</h2><p className="login-subtitle">Gamitin ang iyong teacher username at password.</p><div className="login-divider" /><label className="login-label" htmlFor="t-username">👤 Username</label><div className="input-with-icon"><span>👤</span><input className="input-field" id="t-username" placeholder="Enter your username" /></div><label className="login-label" htmlFor="t-password">🔒 Password</label><div className="input-with-icon"><span>🔐</span><input className="input-field" id="t-password" placeholder="Enter your password" type="password" /></div><button className="btn btn-green login-main-btn teacher-login-btn" onClick={onLogin}>🔐 Login</button><div className="secure-login-strip">🛡️ Secure & Protected Login</div></section></div><div className="login-feature-row teacher-feature-row"><div><span>👥</span><b>Manage Classes</b><p>Pamahalaan ang klase at grupo.</p></div><div><span>📖</span><b>Create Lessons</b><p>Gumawa at magbahagi ng aralin.</p></div><div><span>📊</span><b>Track Progress</b><p>Subaybayan ang pag-unlad.</p></div><div><span>🏅</span><b>Inspire & Guide</b><p>Gabay sa pagkatuto.</p></div></div></div></>;
}

function AdminLogin({ go, onLogin }) {
  return <><div className="top-nav login-top-nav login-admin-nav"><button className="btn btn-outline btn-sm" onClick={() => go('screen-home')}>← Home</button><div className="logo admin-logo">🛡️ Admin Login</div><div className="login-nav-pill admin-pill">🛡️ Secure Access • Protected System 🔒</div></div><div className="login-stage admin-stage"><div className="login-shell admin-shell"><aside className="login-visual-card admin-visual-card"><h2>Mag-login,<br />Admin!</h2><p>Gamitin ang admin username at password para magpatuloy.</p><div className="admin-hero-illustration" aria-hidden="true"><div className="admin-person">👨‍💼</div><div className="admin-laptop">💻</div><div className="admin-shield">🛡️</div></div><div className="login-info-card admin-info-card"><span className="info-icon">🔐</span><div><b>Secure & Trusted</b><br /><span>Ang impormasyon at settings ay protektado.</span></div></div></aside><section className="login-form-panel admin-form-panel"><div className="admin-icon-top">🛡️</div><h2>Welcome Back, Admin</h2><div className="admin-underline" /><label className="login-label" htmlFor="a-username">Username</label><div className="input-with-icon admin-input"><span>👤</span><input className="input-field" id="a-username" placeholder="Enter your username" /></div><label className="login-label" htmlFor="a-password">Password</label><div className="input-with-icon admin-input"><span>🔒</span><input className="input-field" id="a-password" placeholder="Enter your password" type="password" /></div><button className="btn btn-purple login-main-btn admin-login-btn" onClick={onLogin}>🔐 Login</button><div className="secure-login-strip admin-secure-strip">🛡️ Secure Login</div><p className="secure-note">🔒 Only authorized administrators can access this system.</p></section></div></div></>;
}


function subjectTheme(subject) {
  const map = {
    'Pagbasa': { icon: '📖', bg: '#DFF7E8', accent: '#2ECC71', tag: 'Kwento' },
    'Bokabularyo': { icon: '🔤', bg: '#DFF2FF', accent: '#3498DB', tag: 'Salita' },
    'Panitikan': { icon: '📜', bg: '#FFF0DD', accent: '#F39C12', tag: 'Tula' },
    'Oral Comm': { icon: '🎙️', bg: '#FFE2EA', accent: '#E67EA2', tag: 'Bigkas' },
    'Pagsulat': { icon: '✍️', bg: '#FFF8CF', accent: '#F1C40F', tag: 'Sulatin' },
    'Grupo': { icon: '👥', bg: '#EFE5FF', accent: '#9B59B6', tag: 'Sama-sama' }
  };
  return map[subject] || { icon: '📚', bg: '#F6F6F6', accent: '#95A5A6', tag: 'Aralin' };
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function lessonXp(lesson) {
  return lesson?.xpReward ?? lesson?.xp ?? 0;
}

function subjectStatsFor(data) {
  const lessons = asArray(data?.lessons);
  return SUBJECTS.map(({ name }) => {
    const theme = subjectTheme(name);
    const rows = lessons.filter(l => l.subject === name);
    const done = rows.filter(l => l.completed).length;
    const pct = rows.length ? Math.round((done / rows.length) * 100) : 0;
    return { subj: name, theme, lessons: rows, total: rows.length, done, pct };
  });
}

function pickDailyLesson(data) {
  const lessons = asArray(data?.lessons);
  const pending = lessons.filter(l => !l.completed);
  return pending[0] || lessons[0] || null;
}

function nextLessonForSubject(data, subject) {
  const lessons = asArray(data?.lessons).filter(l => l.subject === subject);
  return lessons.find(l => !l.completed) || lessons[0] || null;
}

function displayDue(dateValue) {
  if (!dateValue) return 'Walang due date';
  try {
    return new Date(dateValue).toLocaleDateString('fil-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return String(dateValue); }
}

function getGroupTasks(data) {
  const groups = asArray(data?.groups);
  return groups.flatMap(g => asArray(g.tasks).map(t => ({ ...t, groupName: g.name })));
}

const EARLY_GROUP_ROLES = [
  { id: 'reader', icon: '📖', label: 'Reader', helper: 'Basahin ang salita o kuwento.' },
  { id: 'speaker', icon: '🎤', label: 'Speaker', helper: 'Bigkasin ang sagot nang malinaw.' },
  { id: 'helper', icon: '⭐', label: 'Helper', helper: 'Tumulong sa kaklase.' },
  { id: 'checker', icon: '✅', label: 'Checker', helper: 'Tingnan kung tapos na ang gawain.' }
];

const UPPER_GROUP_ROLES = [
  { id: 'leader', icon: '👑', label: 'Leader', helper: 'Guide the group and keep everyone on task.' },
  { id: 'reader', icon: '📖', label: 'Reader', helper: 'Read the passage or instructions.' },
  { id: 'writer', icon: '✍️', label: 'Writer', helper: 'Prepare the group answer or summary.' },
  { id: 'reporter', icon: '🎙️', label: 'Reporter', helper: 'Present the group output.' },
  { id: 'checker', icon: '✅', label: 'Checker', helper: 'Review the answer before submission.' }
];

function rolesForGradeLevel(gradeLevel) {
  return Number(gradeLevel || 4) <= 2 ? EARLY_GROUP_ROLES : UPPER_GROUP_ROLES;
}

function taskCompletionPercent(task = {}, localDone = false) {
  if (localDone || task.completed || task.isCompleted || task.status === 'completed') return 100;
  if (task.status === 'submitted') return 75;
  if (task.status === 'in_progress') return 45;
  return 15;
}

function effectivenessBand(percent = 0) {
  const value = Number(percent || 0);
  if (value >= 85) return { label: 'Mastery', icon: '🏆', note: 'Students are showing strong understanding.' };
  if (value >= 70) return { label: 'Developing', icon: '🌱', note: 'Most students are progressing, but some need practice.' };
  if (value >= 40) return { label: 'Needs Support', icon: '🧭', note: 'Review missed skills and give guided practice.' };
  return { label: 'Starting', icon: '✨', note: 'Students are beginning the activity or need more attempts.' };
}

function lessonAssessmentProfile(activities = []) {
  const rows = asArray(activities);
  const has = (type) => rows.some(activity => activity?.type === type);
  return {
    hasContent: has('infographic') || has('vocabulary'),
    hasObjectiveQuiz: has('mcq') || has('matching'),
    hasWriting: has('writing'),
    hasSpeech: has('speech'),
    activityCount: rows.length
  };
}

function quizStorageKey(studentId) {
  return `tuklas_quiz_attempts_${studentId || 'demo'}`;
}

function loadQuizAttempts(studentId) {
  if (typeof window === 'undefined' || !studentId) return {};
  try {
    return JSON.parse(window.localStorage.getItem(quizStorageKey(studentId)) || '{}') || {};
  } catch {
    return {};
  }
}

function saveQuizAttempts(studentId, attempts) {
  if (typeof window === 'undefined' || !studentId) return;
  try {
    window.localStorage.setItem(quizStorageKey(studentId), JSON.stringify(attempts || {}));
  } catch {
    // localStorage can fail in private browsing; the UI still works for the current session.
  }
}

function appendQuizAttempt(studentId, attempts, quizId, result) {
  const next = {
    ...(attempts || {}),
    [quizId]: [result, ...asArray(attempts?.[quizId])].slice(0, 5)
  };
  saveQuizAttempts(studentId, next);
  return next;
}

function getBestQuizAttempt(attempts = {}, quizId) {
  const rows = asArray(attempts?.[quizId]);
  if (!rows.length) return null;
  return rows.reduce((best, row) => Number(row.percent || 0) > Number(best.percent || 0) ? row : best, rows[0]);
}

function masteryFromPercent(percent = 0) {
  const value = Number(percent || 0);
  if (value >= 90) return { label: 'Advanced', icon: '🏆', tone: 'green', note: 'Excellent mastery. Keep challenging yourself.' };
  if (value >= 75) return { label: 'Proficient', icon: '🌟', tone: 'blue', note: 'Good understanding. A short review can make it stronger.' };
  if (value >= 50) return { label: 'Developing', icon: '🌱', tone: 'yellow', note: 'You are getting there. Review the missed questions.' };
  return { label: 'Needs Practice', icon: '🧭', tone: 'pink', note: 'Try again after reviewing the lesson.' };
}

function normalizeQuizOption(option, index) {
  const text = typeof option === 'string' ? option : (option?.text || option?.label || option?.value || `Choice ${index + 1}`);
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
  const fillers = ['Pagbasa', 'Bokabularyo', 'Panitikan', 'Oral Communication', 'Pagsulat', 'Hindi nabanggit'];
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
          prompt: question.question || question.prompt || 'Piliin ang tamang sagot.',
          options: hasCorrect ? options : options.map((option, idx) => ({ ...option, isCorrect: idx === 0 })),
          points: Number(question.points || 1)
        });
      });
    }

    if (activity?.type === 'matching') {
      asArray(activity.pairs || activity.items).slice(0, 3).forEach((pair, pairIndex) => {
        const left = pair.left || pair.word || pair.term || `Item ${pairIndex + 1}`;
        const right = pair.right || pair.meaning || pair.answer || 'Tamang pares';
        questions.push({
          id: String(pair.id || `${lesson.id || 'lesson'}-match-${pairIndex}`),
          type: 'mcq',
          source: activity.title || 'Matching Check',
          prompt: `Ano ang tamang pares o kahulugan ng "${left}"?`,
          options: buildFallbackOptions(right, asArray(activity.pairs || activity.items).map(item => item.right || item.meaning || item.answer)),
          points: 1
        });
      });
    }
  });

  if (!questions.length) {
    const subject = lesson.subject || 'Filipino';
    const title = lesson.title || 'Aralin';
    questions.push(
      {
        id: `${lesson.id || title}-fallback-subject`,
        type: 'mcq',
        source: 'Lesson Check',
        prompt: `Anong subject area ang pinakaakma sa araling "${title}"?`,
        options: buildFallbackOptions(subject, SUBJECTS.map(item => item.name)),
        points: 1
      },
      {
        id: `${lesson.id || title}-fallback-purpose`,
        type: 'mcq',
        source: 'Lesson Check',
        prompt: 'Ano ang dapat gawin pagkatapos basahin ang aralin?',
        options: [
          { id: 'purpose-0', text: 'Sagutin ang gawain at tingnan ang feedback', isCorrect: true },
          { id: 'purpose-1', text: 'Isara agad ang lesson', isCorrect: false },
          { id: 'purpose-2', text: 'Laktawan ang lahat ng activity', isCorrect: false },
          { id: 'purpose-3', text: 'Hindi na kailangan mag-practice', isCorrect: false }
        ],
        points: 1
      }
    );
  }

  return questions.slice(0, 8);
}

function buildStudentQuizzes(data = {}) {
  return asArray(data?.lessons).map((lesson) => {
    const questions = buildQuizQuestionsFromLesson(lesson);
    return {
      id: `lesson-${lesson.id || lesson.title}-quiz`,
      lessonId: lesson.id,
      lessonTitle: lesson.title || 'Lesson',
      title: `${lesson.title || 'Lesson'} Quiz`,
      subject: lesson.subject || 'Filipino',
      gradeLevel: lesson.gradeLevel || data?.student?.gradeLevel || '—',
      xpReward: Math.max(5, Math.round(Number(lesson.xpReward || 20) / 2)),
      type: lesson.completed ? 'Post-Lesson Quiz' : 'Practice Quiz',
      unlocked: true,
      questions
    };
  }).filter(quiz => quiz.questions.length);
}

function getQuizStats(quizzes = [], attempts = {}) {
  const taken = quizzes.filter(quiz => asArray(attempts?.[quiz.id]).length).length;
  const bestScores = quizzes.map(quiz => getBestQuizAttempt(attempts, quiz.id)).filter(Boolean);
  const average = bestScores.length
    ? Math.round(bestScores.reduce((sum, item) => sum + Number(item.percent || 0), 0) / bestScores.length)
    : 0;
  const passed = bestScores.filter(item => Number(item.percent || 0) >= 75).length;
  return { total: quizzes.length, taken, average, passed };
}

function gradeQuizAttempt(quiz = {}, answers = {}, attemptNo = 1) {
  const questions = asArray(quiz.questions);
  let score = 0;
  let total = 0;

  const review = questions.map((question, index) => {
    const points = Number(question.points || 1);
    const selectedId = answers[question.id];
    const selectedOption = asArray(question.options).find(option => String(option.id) === String(selectedId)) || null;
    const correctOption = asArray(question.options).find(option => option.isCorrect) || asArray(question.options)[0] || null;
    const correct = Boolean(selectedOption && correctOption && String(selectedOption.id) === String(correctOption.id));

    total += points;
    if (correct) score += points;

    return {
      index: index + 1,
      questionId: question.id,
      prompt: question.prompt,
      selectedText: selectedOption?.text || 'No answer',
      correctText: correctOption?.text || '—',
      correct,
      pointsEarned: correct ? points : 0,
      points
    };
  });

  const percent = total ? Math.round((score / total) * 100) : 0;
  const mastery = masteryFromPercent(percent);

  return {
    id: `${quiz.id}-${Date.now()}`,
    quizId: quiz.id,
    quizTitle: quiz.title,
    lessonId: quiz.lessonId,
    lessonTitle: quiz.lessonTitle,
    subject: quiz.subject,
    gradeLevel: quiz.gradeLevel,
    xpReward: Number(quiz.xpReward || 0),
    score,
    total,
    percent,
    mastery,
    attemptNo,
    review,
    submittedAt: new Date().toISOString()
  };
}

function StarRow({ count = 0, max = 6 }) {
  return <>{Array.from({ length: max }).map((_, idx) => <span key={idx} className={`kid-star ${idx < count ? 'on' : ''}`}>⭐</span>)}</>;
}

function StudentDashboard({ data, lessonsBySubject, go, logout, refresh, openLesson, selectedAvatar }) {
  const s = data?.student;
  const early = Number(s?.gradeLevel || 4) <= 2;

  const openFirstSubjectLesson = (subject) => {
    const lesson = nextLessonForSubject(data, subject);
    if (lesson) openLesson(lesson);
    else go('screen-lessons');
  };

  const goStudentTab = (tab) => {
    if (tab === 'home') return go('screen-student');
    if (tab === 'lessons') return go('screen-lessons');
    if (tab === 'quizzes') return go('screen-stu-quizzes');
    if (tab === 'missions') return go('screen-stu-missions');
    if (tab === 'groups') return go('screen-stu-groups');
    if (tab === 'badges') return go('screen-stu-badges');
    if (tab === 'profile') return go('screen-stu-profile');
  };

  if (early) {
    return (
      <EarlyStudentDashboard
        data={data}
        openLesson={openLesson}
        openFirstSubjectLesson={openFirstSubjectLesson}
        goStudentTab={goStudentTab}
        logout={logout}
        refresh={refresh}
        selectedAvatar={selectedAvatar}
      />
    );
  }

  return (
    <Grade46StudentDashboard
      data={data}
      openLesson={openLesson}
      openFirstSubjectLesson={openFirstSubjectLesson}
      goStudentTab={goStudentTab}
      logout={logout}
      selectedAvatar={selectedAvatar}
    />
  );
}


function EarlyStudentDashboard({ data, openFirstSubjectLesson, goStudentTab, logout }) {
  const s = data?.student || {};
  const stats = subjectStatsFor(data);
  const level = levelForXp(s.xp);
  const xpPct = xpPercent(s.xp);

  const mainSubjects = ['Pagbasa', 'Bokabularyo', 'Panitikan', 'Oral Comm', 'Pagsulat'];
  const mainStats = mainSubjects.map((subjectName) => {
    const found = stats.find((item) => item.subj === subjectName);
    const subjectInfo = SUBJECTS.find((item) => item.name === subjectName) || {};

    return found || {
      subj: subjectName,
      icon: subjectInfo.icon || '📚',
      tone: subjectInfo.tone || 'green',
      done: 0,
      total: 0,
      pct: 0
    };
  });



  const safeLogout = () => {
    if (typeof logout === 'function') {
      logout();
      return;
    }

    localStorage.removeItem('tuklas_user');
    localStorage.removeItem('tuklas_token');
    window.location.reload();
  };

  return <>
    <style>{`
      .g12-page {
        min-height: 100vh;
        padding-bottom: 116px;
        background:
          radial-gradient(circle at 3% 22%, rgba(147, 197, 253, 0.10), transparent 24%),
          radial-gradient(circle at 95% 74%, rgba(253, 230, 138, 0.15), transparent 22%),
          linear-gradient(180deg, #fffdf7 0%, #f7fbff 48%, #fff8ef 100%);
        color: #24324a;
      }

      .g12-topbar {
        position: sticky;
        top: 0;
        z-index: 60;
        min-height: 88px;
        padding: 16px 28px;
        background: rgba(255, 255, 255, 0.96);
        backdrop-filter: blur(16px);
        border-bottom: 1px solid rgba(30, 160, 92, 0.08);
        box-shadow: 0 8px 20px rgba(32, 90, 54, 0.04);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
      }

      .g12-brand {
        display: flex;
        align-items: center;
        gap: 12px;
        color: #15965a;
        font-size: 29px;
        font-weight: 950;
        letter-spacing: -0.045em;
        white-space: nowrap;
      }

      .g12-brand-icon {
        width: 48px;
        height: 48px;
        border-radius: 18px;
        display: grid;
        place-items: center;
        background: #fff6dc;
        box-shadow: inset 0 0 0 2px rgba(238, 202, 95, 0.22);
        font-size: 28px;
      }

      .g12-top-actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 12px;
        flex-wrap: wrap;
      }

      .g12-pill,
      .g12-action-btn {
        min-height: 52px;
        border-radius: 20px;
        padding: 0 20px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 9px;
        font-size: 17px;
        font-weight: 950;
      }

      .g12-pill {
        background: #fff5cf;
        border: 1px solid #f7dfa0;
        color: #22324a;
      }

      .g12-action-btn {
        border: 2px solid #2fbf73;
        background: #ffffff;
        color: #14975a;
        cursor: pointer;
        box-shadow: 0 8px 16px rgba(47, 191, 115, 0.08);
      }

      .g12-shell {
        padding: 22px 24px 132px;
      }

      .g12-hero {
        min-height: 430px;
        display: grid;
        grid-template-columns: minmax(360px, 0.9fr) minmax(420px, 1.1fr);
        gap: 30px;
        align-items: center;
        padding: 32px 44px;
        border-radius: 34px;
        background:
          radial-gradient(circle at 16% 24%, rgba(255, 239, 187, 0.65), transparent 34%),
          radial-gradient(circle at 84% 24%, rgba(224, 242, 254, 0.62), transparent 35%),
          linear-gradient(115deg, #fff4d7 0%, #fff7f0 48%, #eef8ff 100%);
        border: 1px solid rgba(46, 184, 127, 0.12);
        box-shadow: 0 18px 36px rgba(31, 73, 61, 0.08);
        overflow: hidden;
      }

      .g12-hero-art {
        position: relative;
        min-height: 320px;
        border-radius: 32px;
        display: grid;
        place-items: end center;
        background:
          radial-gradient(circle at 17% 18%, rgba(255, 255, 255, 0.85), transparent 16%),
          radial-gradient(circle at 55% 62%, rgba(186, 230, 253, 0.28), transparent 36%),
          linear-gradient(180deg, rgba(255,255,255,0.42), rgba(255,255,255,0.10));
      }

      .g12-hero-art::before,
      .g12-hero-art::after {
        content: '';
        position: absolute;
        border-radius: 999px;
        background: rgba(133, 210, 156, 0.18);
      }

      .g12-hero-art::before {
        width: 78%;
        height: 84px;
        left: 11%;
        bottom: 20px;
      }

      .g12-hero-art::after {
        width: 60px;
        height: 60px;
        right: 15%;
        top: 18%;
        background: rgba(255, 235, 156, 0.42);
      }

      .g12-star {
        position: absolute;
        font-size: 34px;
        filter: drop-shadow(0 10px 12px rgba(245, 158, 11, 0.16));
      }

      .g12-star.one { left: 8%; top: 22%; }
      .g12-star.two { right: 16%; top: 36%; font-size: 25px; }
      .g12-star.three { left: 18%; bottom: 20%; font-size: 20px; }

      .g12-kids-group {
        position: relative;
        z-index: 2;
        display: flex;
        align-items: end;
        justify-content: center;
        gap: 0;
        transform: translateY(-4px);
      }

      .g12-kid {
        width: 106px;
        height: 132px;
        border-radius: 48px 48px 28px 28px;
        display: grid;
        place-items: center;
        font-size: 58px;
        box-shadow: 0 16px 22px rgba(50, 80, 70, 0.10);
        border: 5px solid rgba(255, 255, 255, 0.80);
      }

      .g12-kid.left {
        background: #fde9a8;
        transform: rotate(-5deg) translateX(12px);
      }

      .g12-kid.center {
        width: 128px;
        height: 152px;
        background: #ffd6e5;
        z-index: 3;
      }

      .g12-kid.right {
        background: #d7f1df;
        transform: rotate(5deg) translateX(-12px);
      }

        .g12-hero-img {
  position: relative;
  z-index: 2;
  width: min(92%, 520px);
  max-height: 330px;
  object-fit: contain;
  object-position: center bottom;
  transform: translateY(18px);
  filter: drop-shadow(0 18px 24px rgba(50, 80, 70, 0.12));
}

      .g12-hero-content {
        position: relative;
        z-index: 2;
        max-width: 620px;
      }

      .g12-welcome-copy h1 {
        margin: 0 0 10px;
        color: #16a362;
        font-size: clamp(48px, 6vw, 76px);
        line-height: 0.95;
        font-weight: 1000;
        letter-spacing: -0.06em;
      }

      .g12-greeting-avatar {
        width: clamp(58px, 7vw, 86px);
        height: clamp(58px, 7vw, 86px);
        margin: 0 10px;
        border-radius: 28px;
        display: inline-grid;
        place-items: center;
        vertical-align: middle;
        background: #ffffff;
        border: 3px solid rgba(255, 217, 102, 0.52);
        box-shadow: inset 0 0 0 2px rgba(71, 206, 135, 0.10), 0 14px 24px rgba(39, 87, 63, 0.10);
        font-size: clamp(34px, 4.6vw, 56px);
        line-height: 1;
      }

      .g12-welcome-copy p {
        margin: 8px 0 22px;
        color: #334155;
        max-width: 620px;
        font-size: clamp(18px, 1.7vw, 22px);
        line-height: 1.45;
        font-weight: 850;
      }

      .g12-progress-card {
  position: relative;
  width: min(560px, 100%);
  margin-top: 18px;
  padding: 28px 30px;
  border-radius: 34px;
  background:
    radial-gradient(circle at 92% 18%, rgba(255, 226, 120, 0.34), transparent 20%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(255, 252, 238, 0.9));
  border: 2px solid rgba(255, 217, 102, 0.35);
  box-shadow: 0 18px 34px rgba(58, 82, 84, 0.08);
  overflow: hidden;
}

.g12-progress-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  margin-bottom: 18px;
  color: #14223b;
  font-size: clamp(34px, 3.5vw, 46px);
  font-weight: 1000;
  letter-spacing: -0.045em;
  text-align: center;
}

.g12-progress-coin {
  width: 58px;
  height: 58px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: #fff2bd;
  box-shadow: inset 0 0 0 2px rgba(245, 158, 11, 0.18);
  font-size: 32px;
  flex: 0 0 auto;
}

.g12-progress-divider {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #f6c453;
  box-shadow: 0 0 0 6px rgba(246, 196, 83, 0.16);
  flex: 0 0 auto;
}

.g12-progress-deco {
  position: absolute;
  font-size: 22px;
  opacity: 0.9;
  pointer-events: none;
}

.g12-progress-deco.one {
  top: 14px;
  right: 24px;
}

.g12-progress-deco.two {
  bottom: 16px;
  left: 24px;
}

      .g12-progress-track {
        height: 14px;
        width: 100%;
        border-radius: 999px;
        background: #eef7f1;
        overflow: hidden;
        border: 1px solid #d8efe0;
      }

      .g12-progress-fill {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #45c985, #9be8ba);
      }

      .g12-progress-card small {
        display: block;
        margin-top: 12px;
        color: #486083;
        font-size: 15px;
        font-weight: 850;
      }

      .g12-primary-actions {
        display: flex;
        align-items: center;
        gap: 14px;
        flex-wrap: wrap;
      }

      .g12-primary-btn,
      .g12-soft-link {
        border: 0;
        min-height: 66px;
        padding: 0 32px;
        border-radius: 26px;
        font-size: 22px;
        font-weight: 1000;
        cursor: pointer;
        transition: transform 0.16s ease, box-shadow 0.16s ease;
      }

      .g12-primary-btn {
        background: linear-gradient(135deg, #47ce87, #1f9c60);
        color: white;
        box-shadow: 0 14px 22px rgba(32, 156, 96, 0.18);
      }

      .g12-soft-link {
        background: #f5f1ff;
        color: #7a42c3;
      }

      .g12-primary-btn:hover,
      .g12-soft-link:hover,
      .g12-action-btn:hover,
      .g12-subject-card:hover {
        transform: translateY(-2px);
      }

      .g12-section-card {
        margin-top: 28px;
        padding: 30px;
        border-radius: 32px;
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid rgba(31, 154, 92, 0.06);
        box-shadow: 0 16px 32px rgba(39, 87, 63, 0.06);
      }

      .g12-section-title {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 0;
        color: #15965a;
        font-size: 31px;
        font-weight: 1000;
        letter-spacing: -0.04em;
      }

      .g12-section-subtitle {
        margin: 6px 0 22px;
        color: #425a7c;
        font-size: 16px;
        font-weight: 850;
      }

      .g12-subject-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 18px;
      }

      .g12-subject-card {
        min-height: 182px;
        padding: 20px 22px;
        border-radius: 28px;
        border: 1px solid rgba(48, 120, 100, 0.08);
        display: grid;
        grid-template-columns: 128px minmax(0, 1fr) 56px;
        gap: 20px;
        align-items: center;
        text-align: left;
        cursor: pointer;
        box-shadow: 0 12px 22px rgba(47, 78, 84, 0.05);
        transition: 0.16s ease;
      }

      .g12-subject-card.green { background: #edf9f0; }
      .g12-subject-card.blue { background: #eef7ff; }
      .g12-subject-card.purple { background: #f6f0ff; }
      .g12-subject-card.yellow { background: #fff7dd; }
      .g12-subject-card.pink { background: #fff0f5; }

      .g12-subject-illustration {
        width: 112px;
        height: 112px;
        border-radius: 26px;
        display: grid;
        place-items: center;
        font-size: 56px;
        background: rgba(255, 255, 255, 0.68);
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.5);
      }

      .g12-subject-card h3 {
        margin: 0 0 6px;
        color: #22324a;
        font-size: 29px;
        line-height: 1;
        font-weight: 1000;
        letter-spacing: -0.04em;
      }

      .g12-subject-card p {
        margin: 0 0 12px;
        color: #526988;
        font-size: 15px;
        font-weight: 850;
      }

      .g12-module-progress {
        width: 100%;
        height: 12px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.75);
        overflow: hidden;
      }

      .g12-module-progress span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #45c985, #9be8ba);
      }

      .g12-card-arrow {
        width: 52px;
        height: 52px;
        border-radius: 999px;
        display: grid;
        place-items: center;
        background: rgba(255, 255, 255, 0.82);
        color: #15965a;
        font-size: 28px;
        font-weight: 1000;
      }

      .g12-nav {
        position: fixed;
        left: 50%;
        bottom: 22px;
        transform: translateX(-50%);
        width: min(1120px, calc(100vw - 40px));
        z-index: 80;
        min-height: 82px;
        padding: 10px 20px;
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 10px;
        border-radius: 34px;
        background: rgba(255, 255, 255, 0.96);
        border: 1px solid rgba(39, 174, 96, 0.08);
        box-shadow: 0 14px 30px rgba(25, 78, 54, 0.09);
        backdrop-filter: blur(16px);
      }

      .g12-nav button {
        border: 0;
        background: transparent;
        border-radius: 24px;
        color: #203451;
        font-size: 16px;
        font-weight: 950;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
      }

      .g12-nav button.active {
        background: #edf8f1;
        color: #15965a;
      }

      .g12-nav-icon {
        font-size: 34px;
        line-height: 1;
      }

      /* Grade 1-2 Kid Curious style: bigger, playful, and game-like while keeping Tuklas colors. */
      .g12-page {
        background:
          radial-gradient(circle at 12% 14%, rgba(255, 245, 207, 0.95), transparent 22%),
          radial-gradient(circle at 84% 16%, rgba(237, 248, 241, 0.95), transparent 24%),
          linear-gradient(135deg, #e8fff1 0%, #fffdf7 45%, #fff5cf 100%);
      }

      .g12-page::before {
        content: '';
        position: fixed;
        inset: 0;
        pointer-events: none;
        background:
          radial-gradient(circle at 18% 72%, rgba(21, 150, 90, 0.14), transparent 18%),
          radial-gradient(circle at 86% 68%, rgba(246, 196, 83, 0.16), transparent 20%);
      }

      .g12-topbar {
        width: min(1280px, calc(100vw - 32px));
        margin: 14px auto 0;
        border-radius: 34px;
        border: 3px solid rgba(21, 150, 90, 0.12);
        box-shadow: 0 14px 0 rgba(21, 150, 90, 0.08), 0 22px 42px rgba(21, 150, 90, 0.10);
      }

      .g12-brand {
        font-size: 34px;
      }

      .g12-brand-icon {
        width: 64px;
        height: 64px;
        border-radius: 24px;
        font-size: 38px;
        background: #fff5cf;
      }

      .g12-pill,
      .g12-action-btn {
        min-height: 60px;
        border-radius: 24px;
        font-size: 19px;
      }

      .g12-shell {
        width: min(1280px, calc(100vw - 32px));
        margin: 0 auto;
      }

      .g12-hero {
        min-height: 520px;
        border-radius: 46px;
        border: 4px solid rgba(21, 150, 90, 0.16);
        box-shadow: 0 18px 0 rgba(21, 150, 90, 0.08), 0 30px 58px rgba(21, 150, 90, 0.13);
        background:
          radial-gradient(circle at 15% 18%, rgba(255, 245, 207, 0.95), transparent 28%),
          radial-gradient(circle at 78% 16%, rgba(255, 255, 255, 0.72), transparent 18%),
          linear-gradient(135deg, #28c98a 0%, #15965a 42%, #edf8f1 43%, #fffdf7 100%);
      }

      .g12-hero-art {
        min-height: 410px;
        border-radius: 42px;
        background:
          radial-gradient(circle at 42% 40%, #dff3ff 0 24%, transparent 25%),
          radial-gradient(circle at 24% 72%, rgba(255, 245, 207, 0.86), transparent 24%),
          linear-gradient(160deg, rgba(255,255,255,0.24), rgba(255,255,255,0.06));
      }

      .g12-hero-art::before {
        width: 30px;
        height: 74%;
        left: 42px;
        bottom: 44px;
        border-radius: 999px;
        background: linear-gradient(180deg, #fff9dc 0 24%, #f59e0b 24% 100%);
        box-shadow: inset 0 0 0 2px rgba(255,255,255,0.45);
      }

      .g12-hero-art::after {
        content: '🐵';
        width: 84px;
        height: 84px;
        right: 64px;
        top: 54px;
        display: grid;
        place-items: center;
        background: #fff5cf;
        font-size: 46px;
        box-shadow: 0 12px 24px rgba(20, 34, 59, 0.12);
      }

      .g12-hero-img {
        width: min(88%, 560px);
        max-height: 390px;
        transform: translateY(22px);
      }

      .g12-welcome-copy h1 {
        color: #14223b;
        text-shadow: none;
        font-size: clamp(58px, 6.8vw, 92px);
        line-height: 0.92;
      }

      .g12-hero-content {
        padding: 26px 28px;
        border-radius: 38px;
        background: rgba(255, 255, 255, 0.72);
        border: 3px solid rgba(255, 245, 207, 0.72);
        box-shadow: 0 16px 36px rgba(20, 34, 59, 0.10);
        backdrop-filter: blur(8px);
      }

      .g12-greeting-avatar {
        display: inline-grid;
        place-items: center;
        width: 74px;
        height: 74px;
        margin: 0 14px 0 4px;
        border-radius: 26px;
        background: #fff5cf;
        color: #14223b;
        font-size: 46px;
        vertical-align: middle;
        box-shadow: 0 8px 0 #f6c453, 0 16px 24px rgba(20, 34, 59, 0.12);
        text-shadow: none;
      }

      .g12-progress-card {
        padding: 32px;
        border-radius: 38px;
        border: 4px solid rgba(255, 245, 207, 0.76);
        box-shadow: 0 10px 0 rgba(246, 196, 83, 0.60), 0 22px 38px rgba(20, 34, 59, 0.12);
      }

      .g12-progress-title {
        font-size: clamp(38px, 4vw, 56px);
      }

      .g12-progress-track {
        height: 22px;
        border: 3px solid #d8efe0;
      }

      .g12-game-actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 16px;
        margin-top: 28px;
      }

      .g12-game-start-btn,
      .g12-game-soft-btn {
        border: 0;
        min-height: 76px;
        padding: 0 38px;
        border-radius: 28px;
        font-size: 26px;
        font-weight: 1000;
        cursor: pointer;
        transition: transform 0.14s ease, box-shadow 0.14s ease;
      }

      .g12-game-start-btn {
        background: linear-gradient(180deg, #ffe46c, #ffc928);
        color: #14223b;
        text-shadow: none;
        box-shadow: 0 9px 0 #e7a90f, 0 18px 28px rgba(245, 158, 11, 0.20);
      }

      .g12-game-soft-btn {
        background: #ffffff;
        color: #15965a;
        border: 3px solid rgba(21, 150, 90, 0.18);
        box-shadow: 0 8px 0 rgba(21, 150, 90, 0.14), 0 16px 26px rgba(21, 150, 90, 0.10);
      }

      .g12-game-start-btn:active,
      .g12-game-soft-btn:active {
        transform: translateY(5px);
        box-shadow: 0 4px 0 #e7a90f, 0 10px 18px rgba(245, 158, 11, 0.16);
      }

      .g12-section-card {
        border-radius: 42px;
        padding: 36px;
        border: 4px solid rgba(21, 150, 90, 0.11);
        box-shadow: 0 14px 0 rgba(21, 150, 90, 0.07), 0 26px 46px rgba(21, 150, 90, 0.10);
      }

      .g12-section-title {
        font-size: clamp(38px, 4vw, 58px);
      }

      .g12-section-subtitle {
        font-size: 22px;
      }

      .g12-subject-grid {
        gap: 24px;
      }

      .g12-subject-card {
        min-height: 230px;
        grid-template-columns: 148px minmax(0, 1fr) 66px;
        padding: 28px;
        border-radius: 38px;
        border: 4px solid rgba(255, 255, 255, 0.72);
        box-shadow: 0 10px 0 rgba(21, 150, 90, 0.10), 0 22px 34px rgba(21, 150, 90, 0.10);
      }

      .g12-subject-illustration {
        width: 128px;
        height: 128px;
        border-radius: 38px;
        font-size: 72px;
      }

      .g12-subject-card h3 {
        font-size: 38px;
      }

      .g12-subject-card p {
        font-size: 20px;
      }

      .g12-module-progress {
        height: 18px;
        border: 2px solid rgba(255,255,255,0.60);
      }

      .g12-card-arrow {
        width: 64px;
        height: 64px;
        font-size: 38px;
      }

      .g12-nav {
        min-height: 96px;
        border-radius: 42px;
        border: 4px solid rgba(21, 150, 90, 0.10);
        box-shadow: 0 12px 0 rgba(21, 150, 90, 0.10), 0 22px 34px rgba(20, 34, 59, 0.12);
      }

      .g12-nav button {
        border-radius: 32px;
        font-size: 19px;
      }

      .g12-nav button.active {
        background: #fff5cf;
        color: #0f7d49;
        box-shadow: inset 0 0 0 2px rgba(246, 196, 83, 0.28);
      }

      .g12-nav-icon {
        font-size: 40px;
      }

      /* Grade 1-2 readability safeguard: avoid white text on light/green gradients. */

      .g12-game-start-btn,
      .g12-main-btn {
        color: #14223b !important;
        text-shadow: none !important;
      }

      .g12-welcome-copy h1,
      .g12-subpage-title h1 {
        color: #14223b !important;
        text-shadow: none !important;
      }

      .g12-subpage-title p {
        color: #334155 !important;
        text-shadow: none !important;
      }


      /* Grade 1-2 balanced font sizing: playful, readable, and not oversized. */
      .g12-brand {
        font-size: 28px;
      }

      .g12-brand-icon {
        width: 54px;
        height: 54px;
        border-radius: 20px;
        font-size: 32px;
      }

      .g12-pill,
      .g12-action-btn {
        min-height: 50px;
        border-radius: 20px;
        font-size: 16px;
        padding: 0 16px;
      }

      .g12-hero {
        min-height: 460px;
      }

      .g12-hero-art {
        min-height: 340px;
      }

      .g12-hero-art::after {
        width: 68px;
        height: 68px;
        font-size: 38px;
      }

      .g12-hero-img {
        max-height: 335px;
      }

      .g12-hero-content {
        padding: 22px 24px;
      }

      .g12-welcome-copy h1 {
        font-size: clamp(38px, 4.8vw, 58px);
        line-height: 1;
      }

      .g12-greeting-avatar {
        width: 58px;
        height: 58px;
        margin: 0 10px 0 4px;
        border-radius: 20px;
        font-size: 36px;
      }

      .g12-progress-card {
        padding: 24px;
        border-radius: 32px;
      }

      .g12-progress-title {
        gap: 12px;
        font-size: clamp(26px, 2.8vw, 36px);
      }

      .g12-progress-coin {
        width: 46px;
        height: 46px;
        font-size: 26px;
      }

      .g12-progress-track {
        height: 14px;
        border-width: 2px;
      }

      .g12-game-start-btn,
      .g12-game-soft-btn {
        min-height: 58px;
        padding: 0 28px;
        border-radius: 22px;
        font-size: 18px;
      }

      .g12-section-card {
        padding: 28px;
        border-radius: 34px;
      }

      .g12-section-title {
        font-size: clamp(28px, 3vw, 38px);
      }

      .g12-section-subtitle {
        font-size: 17px;
      }

      .g12-subject-grid {
        gap: 20px;
      }

      .g12-subject-card {
        min-height: 180px;
        grid-template-columns: 112px minmax(0, 1fr) 52px;
        gap: 18px;
        padding: 22px;
        border-radius: 30px;
      }

      .g12-subject-illustration {
        width: 96px;
        height: 96px;
        border-radius: 28px;
        font-size: 52px;
      }

      .g12-subject-card h3 {
        font-size: 28px;
        line-height: 1.05;
      }

      .g12-subject-card p {
        font-size: 16px;
      }

      .g12-module-progress {
        height: 12px;
      }

      .g12-card-arrow {
        width: 52px;
        height: 52px;
        font-size: 30px;
      }

      .g12-nav {
        min-height: 78px;
        border-radius: 34px;
      }

      .g12-nav button {
        border-radius: 26px;
        font-size: 15px;
      }

      .g12-nav-icon {
        font-size: 30px;
      }

      @media (max-width: 1180px) {
        .g12-hero { grid-template-columns: 1fr; }
        .g12-hero-content { max-width: none; }
        .g12-subject-grid { grid-template-columns: 1fr; }
        .g12-subject-card { grid-template-columns: 120px minmax(0, 1fr) 52px; }
      }

      @media (max-width: 760px) {
        .g12-topbar {
          align-items: flex-start;
          flex-direction: column;
          padding: 16px;
        }

        .g12-top-actions {
          width: 100%;
          justify-content: flex-start;
        }

        .g12-pill,
        .g12-action-btn {
          min-height: 48px;
          font-size: 14px;
          padding: 0 14px;
        }

        .g12-shell { padding: 14px 14px 120px; }
        .g12-hero { padding: 20px; }
        .g12-hero-art { min-height: 250px; }
        .g12-kid { width: 84px; height: 108px; font-size: 46px; }
        .g12-kid.center { width: 100px; height: 126px; }
        .g12-welcome-copy h1 { font-size: 44px; }
        .g12-welcome-copy p { font-size: 18px; }
        .g12-primary-actions { align-items: stretch; flex-direction: column; }
        .g12-primary-btn, .g12-soft-link { width: 100%; }
        .g12-subject-card {
          grid-template-columns: 86px minmax(0, 1fr) 42px;
          min-height: 174px;
          padding: 18px;
        }
        .g12-subject-illustration { width: 82px; height: 82px; font-size: 44px; }
        .g12-subject-card h3 { font-size: 24px; }
        .g12-nav {
          width: calc(100vw - 18px);
          bottom: 10px;
          border-radius: 24px;
          padding: 8px;
          gap: 4px;
        }
        .g12-nav button { flex-direction: column; gap: 2px; font-size: 11px; }
        .g12-nav-icon { font-size: 26px; }
      }
    `}</style>

    <div className="g12-page">
      <header className="g12-topbar">
        <div className="g12-brand">
          <span className="g12-brand-icon">☀️</span>
          <span>Tuklas Talino</span>
        </div>

        <div className="g12-top-actions">
          <div className="g12-pill">🌸 Grade {s.gradeLevel || '—'} • {s.section || '—'}</div>
          <button type="button" className="g12-action-btn" onClick={safeLogout}>🚪 Logout</button>
        </div>
      </header>

      <main className="g12-shell">
        <section className="g12-hero">
          <div className="g12-hero-art" aria-hidden="true">
  <span className="g12-star one">⭐</span>
  <span className="g12-star two">✨</span>
  <span className="g12-star three">🌼</span>

  <img
    src="/grade12-hero.png"
    alt=""
    className="g12-hero-img"
  />
</div>

          <div className="g12-hero-content">
            <div className="g12-welcome-copy">
              <h1>Kamusta, {s.name || 'Learner'}! 👋</h1>
              <p>Ready ka na ba sa learning adventure today?</p>
            </div>

            <div className="g12-progress-card">

<div className="g12-progress-title">
  <span className="g12-progress-coin">🪙</span>
  <span>{s.xp || 0} XP</span>
  <span className="g12-progress-divider" />
  <span>Level {level}</span>
</div>
              <div className="g12-progress-track">
                <span className="g12-progress-fill" style={{ width: `${xpPct}%` }} />
              </div>
            </div>

          </div>
        </section>

        <section className="g12-section-card">
          <h2 className="g12-section-title">🌎 Learning Worlds ⭐</h2>
          <p className="g12-section-subtitle">Piliin ang iyong paboritong aralin.</p>

          <div className="g12-subject-grid">
            {mainStats.map((item) => {
              const subjectInfo = SUBJECTS.find((subj) => subj.name === item.subj) || {};
              const tone = item.tone || subjectInfo.tone || 'green';
              const icon = item.icon || subjectInfo.icon || '📚';
              const desc = subjectInfo.desc || 'Buksan ang module na ito.';
              const pct = Math.max(0, Math.min(100, item.pct || 0));

              return (
                <button
                  type="button"
                  key={item.subj}
                  className={`g12-subject-card ${tone}`}
                  onClick={() => openFirstSubjectLesson(item.subj)}
                >
                  <div className="g12-subject-illustration">{icon}</div>
                  <div>
                    <h3>{item.subj}</h3>
                    <p>{item.done || 0}/{item.total || 0} tapos • {desc}</p>
                    <div className="g12-module-progress"><span style={{ width: `${pct}%` }} /></div>
                  </div>
                  <div className="g12-card-arrow">›</div>
                </button>
              );
            })}
          </div>
        </section>
      </main>

      <nav className="g12-nav" aria-label="Student navigation">
        <button type="button" className="active" onClick={() => goStudentTab('home')}><span className="g12-nav-icon">🏠</span>Home</button>
        <button type="button" onClick={() => goStudentTab('lessons')}><span className="g12-nav-icon">📖</span>Lessons</button>
        <button type="button" onClick={() => goStudentTab('quizzes')}><span className="g12-nav-icon">🧠</span>Quizzes</button>
        <button type="button" onClick={() => goStudentTab('missions')}><span className="g12-nav-icon">🎮</span>Missions</button>
        <button type="button" onClick={() => goStudentTab('groups')}><span className="g12-nav-icon">👥</span>Groups</button>
        <button type="button" onClick={() => goStudentTab('profile')}><span className="g12-nav-icon">🐰</span>Profile</button>
      </nav>
    </div>
  </>;
}

function Grade46ReferenceStyles() {
  return (
    <style>{`
      .g46-ref-page {
        --tt-green: #15965a;
        --tt-green-dark: #0f7d49;
        --tt-green-soft: #edf8f1;
        --tt-yellow: #fff5cf;
        --tt-yellow-deep: #f6c453;
        --tt-purple: #7b4fd6;
        --tt-sky: #eef8ff;
        --tt-cream: #fffdf7;
        --tt-ink: #203451;
        --tt-muted: #526988;
        min-height: 100vh;
        padding: 28px;
        background:
          radial-gradient(circle at 12% 12%, rgba(255, 245, 207, 0.90), transparent 28%),
          radial-gradient(circle at 92% 82%, rgba(237, 248, 241, 0.88), transparent 30%),
          linear-gradient(135deg, #fffdf7 0%, #eef8ff 52%, #edf8f1 100%);
        color: var(--tt-ink);
      }

      .g46-ref-frame {
        width: min(1240px, calc(100vw - 44px));
        min-height: min(760px, calc(100vh - 56px));
        margin: 0 auto;
        display: grid;
        grid-template-columns: 214px minmax(0, 1fr);
        overflow: hidden;
        border-radius: 34px;
        background: #ffffff;
        border: 7px solid var(--tt-green);
        box-shadow: 0 28px 70px rgba(21, 150, 90, 0.20);
      }

      .g46-ref-sidebar {
        position: relative;
        padding: 24px 18px;
        background: linear-gradient(180deg, var(--tt-green) 0%, var(--tt-green-dark) 100%);
        color: #ffffff;
        display: flex;
        flex-direction: column;
        gap: 18px;
      }

      .g46-ref-brand {
        display: grid;
        justify-items: center;
        gap: 9px;
        margin-bottom: 6px;
        color: #ffffff;
        font-weight: 1000;
        letter-spacing: -0.035em;
      }

      .g46-ref-brand span:first-child {
        width: 50px;
        height: 50px;
        border-radius: 18px;
        display: grid;
        place-items: center;
        background: var(--tt-yellow);
        color: var(--tt-green-dark);
        font-size: 28px;
        box-shadow: 0 12px 26px rgba(5, 77, 42, 0.26);
      }

      .g46-ref-menu {
        display: grid;
        gap: 10px;
      }

      .g46-ref-menu button,
      .g46-ref-logout {
        border: 0;
        width: 100%;
        min-height: 46px;
        padding: 0 15px;
        border-radius: 999px;
        color: rgba(255, 255, 255, 0.90);
        background: transparent;
        text-align: left;
        font-size: 14px;
        font-weight: 1000;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 10px;
        transition: transform 0.16s ease, background 0.16s ease, color 0.16s ease;
      }

      .g46-ref-menu button:hover,
      .g46-ref-logout:hover {
        transform: translateX(3px);
        background: rgba(255, 255, 255, 0.13);
      }

      .g46-ref-menu button.active {
        color: var(--tt-green-dark);
        background: var(--tt-yellow);
        box-shadow: 0 10px 22px rgba(5, 77, 42, 0.18);
      }

      .g46-ref-progress-mini {
        margin-top: auto;
        border-radius: 24px;
        padding: 16px 12px;
        background: rgba(255, 255, 255, 0.14);
        text-align: center;
      }

      .g46-ref-ring {
        width: 78px;
        height: 78px;
        margin: 0 auto 10px;
        border-radius: 999px;
        display: grid;
        place-items: center;
      }

      .g46-ref-ring span {
        width: 56px;
        height: 56px;
        border-radius: 999px;
        display: grid;
        place-items: center;
        background: var(--tt-green-dark);
        color: #ffffff;
        font-size: 15px;
        font-weight: 1000;
      }

      .g46-ref-progress-mini b,
      .g46-ref-progress-mini small {
        display: block;
      }

      .g46-ref-progress-mini small {
        opacity: 0.82;
        margin-top: 4px;
        font-weight: 800;
      }

      .g46-ref-logout {
        margin-top: 0;
        background: rgba(255, 255, 255, 0.12);
        justify-content: center;
      }

      .g46-ref-main {
        min-width: 0;
        padding: 24px 26px 30px;
        background:
          radial-gradient(circle at 90% 16%, rgba(255, 245, 207, 0.54), transparent 24%),
          linear-gradient(180deg, #ffffff 0%, #fbfefc 100%);
        overflow: auto;
      }

      .g46-ref-topbar {
        min-height: 64px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        margin-bottom: 18px;
      }

      .g46-ref-student-pill {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
      }

      .g46-ref-avatar-small {
        width: 52px;
        height: 52px;
        border-radius: 18px;
        display: grid;
        place-items: center;
        background: var(--tt-yellow);
        font-size: 30px;
        box-shadow: inset 0 0 0 2px rgba(246, 196, 83, 0.28);
      }

      .g46-ref-student-pill b {
        display: block;
        color: var(--tt-ink);
        font-size: 20px;
        font-weight: 1000;
        letter-spacing: -0.035em;
      }

      .g46-ref-student-pill small {
        display: block;
        color: var(--tt-muted);
        font-weight: 850;
      }

      .g46-ref-top-actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 10px;
        flex-wrap: wrap;
      }

      .g46-ref-pill,
      .g46-ref-soft-btn {
        border: 0;
        min-height: 44px;
        padding: 0 16px;
        border-radius: 999px;
        background: var(--tt-green-soft);
        color: var(--tt-green-dark);
        font-size: 14px;
        font-weight: 1000;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .g46-ref-soft-btn {
        cursor: pointer;
        background: #ffffff;
        border: 2px solid rgba(21, 150, 90, 0.18);
      }

      .g46-ref-title-card {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 18px;
        margin-bottom: 18px;
        padding: 24px 26px;
        border-radius: 30px;
        background:
          radial-gradient(circle at 14% 14%, rgba(255, 245, 207, 0.82), transparent 34%),
          linear-gradient(135deg, #edf8f1, #ffffff 55%, #eef8ff);
        border: 1px solid rgba(21, 150, 90, 0.10);
        box-shadow: 0 14px 28px rgba(31, 73, 61, 0.07);
      }

      .g46-ref-title-left {
        display: flex;
        gap: 16px;
        align-items: center;
        min-width: 0;
      }

      .g46-ref-title-icon {
        width: 72px;
        height: 72px;
        border-radius: 24px;
        display: grid;
        place-items: center;
        background: #ffffff;
        font-size: 40px;
        box-shadow: inset 0 0 0 2px rgba(21, 150, 90, 0.10);
      }

      .g46-ref-title-card h1 {
        margin: 0;
        color: var(--tt-green);
        font-size: clamp(34px, 4vw, 54px);
        line-height: 0.98;
        letter-spacing: -0.055em;
        font-weight: 1000;
      }

      .g46-ref-title-card p {
        margin: 8px 0 0;
        color: var(--tt-muted);
        font-size: 17px;
        font-weight: 850;
        line-height: 1.45;
      }

      .g46-ref-title-side {
        min-width: 190px;
        border-radius: 24px;
        padding: 18px;
        background: #ffffff;
        border: 1px solid rgba(246, 196, 83, 0.30);
      }

      .g46-ref-level-line {
        display: grid;
        grid-template-columns: auto auto minmax(110px, 1fr);
        align-items: center;
        gap: 10px;
        color: var(--tt-ink);
        font-weight: 1000;
      }

      .g46-ref-level-line strong {
        color: var(--tt-green-dark);
        font-size: 18px;
        font-weight: 1000;
        white-space: nowrap;
      }

      .g46-ref-level-line i,
      .g46-ref-mini-track,
      .g46-ref-module-progress,
      .g46-ref-stat-track {
        display: block;
        height: 12px;
        width: 100%;
        border-radius: 999px;
        background: #e5efe9;
        overflow: hidden;
      }

      .g46-ref-level-line i span,
      .g46-ref-mini-track span,
      .g46-ref-module-progress span,
      .g46-ref-stat-track span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, var(--tt-green), var(--tt-yellow-deep));
      }

      .g46-ref-content {
        display: grid;
        gap: 18px;
      }

      .g46-ref-dashboard-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.75fr);
        gap: 18px;
        align-items: start;
      }

      .g46-ref-column {
        display: grid;
        gap: 18px;
      }

      .g46-ref-panel {
        border-radius: 28px;
        padding: 22px;
        background: rgba(255, 255, 255, 0.96);
        border: 1px solid rgba(21, 150, 90, 0.08);
        box-shadow: 0 14px 28px rgba(31, 73, 61, 0.06);
      }

      .g46-ref-panel-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 14px;
        margin-bottom: 16px;
      }

      .g46-ref-panel h2,
      .g46-ref-panel h3 {
        margin: 0;
        color: var(--tt-ink);
        font-size: 25px;
        letter-spacing: -0.04em;
        font-weight: 1000;
      }

      .g46-ref-panel p,
      .g46-ref-muted {
        color: var(--tt-muted);
        font-size: 15px;
        line-height: 1.5;
        font-weight: 850;
      }

      .g46-ref-panel-link {
        border: 0;
        background: transparent;
        color: var(--tt-green);
        font-weight: 1000;
        cursor: pointer;
      }

      .g46-ref-plan-grid,
      .g46-ref-card-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }

      .g46-ref-plan-card,
      .g46-ref-card {
        border: 0;
        min-height: 148px;
        padding: 18px;
        border-radius: 24px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        text-align: left;
        cursor: pointer;
        color: var(--tt-ink);
        background: var(--tt-sky);
        transition: transform 0.16s ease, box-shadow 0.16s ease;
        box-shadow: 0 10px 20px rgba(31, 73, 61, 0.05);
      }

      .g46-ref-plan-card:hover,
      .g46-ref-card:hover,
      .g46-ref-soft-btn:hover,
      .g46-ref-primary-btn:hover {
        transform: translateY(-2px);
      }

      .g46-ref-plan-card.green,
      .g46-ref-card.green { background: #edf8f1; }
      .g46-ref-plan-card.yellow,
      .g46-ref-card.yellow { background: #fff5cf; }
      .g46-ref-plan-card.blue,
      .g46-ref-card.blue { background: #eef8ff; }
      .g46-ref-plan-card.purple,
      .g46-ref-card.purple { background: #f5f1ff; }
      .g46-ref-plan-card.pink,
      .g46-ref-card.pink { background: #fff0f5; }

      .g46-ref-card-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
      }

      .g46-ref-card-icon {
        width: 58px;
        height: 58px;
        border-radius: 20px;
        display: grid;
        place-items: center;
        background: rgba(255, 255, 255, 0.75);
        font-size: 34px;
      }

      .g46-ref-card h4 {
        margin: 12px 0 6px;
        color: var(--tt-ink);
        font-size: 22px;
        line-height: 1.05;
        font-weight: 1000;
        letter-spacing: -0.035em;
      }

      .g46-ref-tag {
        display: inline-flex;
        align-items: center;
        min-height: 30px;
        padding: 0 10px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.78);
        color: var(--tt-green-dark);
        font-size: 12px;
        font-weight: 1000;
      }

      .g46-ref-primary-btn {
        border: 0;
        min-height: 42px;
        padding: 0 18px;
        border-radius: 16px;
        background: linear-gradient(135deg, var(--tt-green), var(--tt-green-dark));
        color: #ffffff;
        font-weight: 1000;
        cursor: pointer;
        box-shadow: 0 10px 18px rgba(21, 150, 90, 0.16);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
        text-align: center;
      }

      .g46-ref-start-pill {
        width: max-content;
        min-width: 92px;
        margin-top: 8px;
      }

      .g46-ref-primary-btn.secondary {
        background: #ffffff;
        color: var(--tt-green-dark);
        border: 2px solid rgba(21, 150, 90, 0.18);
        box-shadow: none;
      }

      .g46-ref-stat-row {
        display: grid;
        gap: 12px;
      }

      .g46-ref-stat-item {
        display: grid;
        grid-template-columns: 110px minmax(0, 1fr) 46px;
        gap: 10px;
        align-items: center;
      }

      .g46-ref-stat-item span {
        color: var(--tt-muted);
        font-size: 13px;
        font-weight: 900;
      }

      .g46-ref-stat-item b {
        color: var(--tt-ink);
        font-size: 14px;
        font-weight: 1000;
        text-align: right;
      }

      .g46-ref-badge-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
      }

      .g46-ref-badge {
        min-height: 94px;
        border-radius: 22px;
        display: grid;
        place-items: center;
        text-align: center;
        background: var(--tt-green-soft);
        color: var(--tt-ink);
        font-weight: 1000;
      }

      .g46-ref-badge span {
        display: block;
        font-size: 34px;
        line-height: 1;
        margin-bottom: 4px;
      }

      .g46-ref-badge strong {
        display: block;
        color: var(--tt-ink);
        font-size: 15px;
        line-height: 1.1;
        font-weight: 1000;
      }

      .g46-ref-badge-status {
        display: block;
        margin-top: 6px;
        color: var(--tt-green-dark);
        font-size: 11px;
        line-height: 1.25;
        font-weight: 900;
      }

      .g46-ref-badge.locked {
        background: #f8fafc;
        color: #64748b;
        border: 1px dashed rgba(100, 116, 139, 0.32);
      }

      .g46-ref-badge.locked span {
        opacity: 0.82;
        filter: grayscale(0.35);
      }

      .g46-ref-badge.locked strong {
        color: #475569;
      }

      .g46-ref-badge.locked .g46-ref-badge-status {
        color: #64748b;
      }

      .g46-ref-task-row,
      .g46-ref-list-row {
        display: grid;
        grid-template-columns: 58px minmax(0, 1fr) auto;
        gap: 14px;
        align-items: center;
        padding: 16px;
        border-radius: 22px;
        background: #fbfefc;
        border: 1px solid rgba(21, 150, 90, 0.08);
        margin-bottom: 12px;
      }

      .g46-ref-empty {
        padding: 24px;
        border-radius: 22px;
        background: #fbfefc;
        border: 1px dashed rgba(21, 150, 90, 0.20);
        color: var(--tt-muted);
        font-weight: 900;
        text-align: center;
      }

      .g46-ref-filter-row,
      .g46-ref-action-row {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 16px;
      }

      .g46-ref-filter-row button,
      .g46-ref-choice {
        border: 0;
        min-height: 44px;
        padding: 0 16px;
        border-radius: 999px;
        background: #ffffff;
        color: var(--tt-ink);
        box-shadow: inset 0 0 0 1px rgba(21, 150, 90, 0.12);
        font-weight: 1000;
        cursor: pointer;
      }

      .g46-ref-filter-row button.active,
      .g46-ref-choice.selected {
        background: var(--tt-green-soft);
        color: var(--tt-green-dark);
        box-shadow: inset 0 0 0 2px rgba(21, 150, 90, 0.20);
      }

      .g46-ref-avatar-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
      }

      .g46-ref-avatar-choice {
        border: 0;
        min-height: 92px;
        border-radius: 24px;
        background: #ffffff;
        font-size: 42px;
        cursor: pointer;
        box-shadow: inset 0 0 0 1px rgba(21, 150, 90, 0.12), 0 10px 20px rgba(31, 73, 61, 0.04);
      }

      .g46-ref-avatar-choice.selected {
        background: var(--tt-yellow);
        box-shadow: inset 0 0 0 3px rgba(21, 150, 90, 0.25), 0 12px 24px rgba(31, 73, 61, 0.07);
      }

      .missions-wrap.standard {
        padding: 0 !important;
      }

      .g46-ref-page .missions-bottom-nav {
        display: none !important;
      }

      @media (max-width: 980px) {
        .g46-ref-page { padding: 12px; }
        .g46-ref-frame {
          width: calc(100vw - 24px);
          min-height: calc(100vh - 24px);
          grid-template-columns: 1fr;
        }
        .g46-ref-sidebar {
          flex-direction: row;
          align-items: center;
          overflow-x: auto;
          padding: 14px;
        }
        .g46-ref-brand { display: none; }
        .g46-ref-menu {
          grid-auto-flow: column;
          grid-auto-columns: max-content;
          display: grid;
        }
        .g46-ref-menu button { width: auto; white-space: nowrap; }
        .g46-ref-progress-mini,
        .g46-ref-logout { display: none; }
        .g46-ref-dashboard-grid,
        .g46-ref-title-card,
        .g46-ref-plan-grid,
        .g46-ref-card-grid {
          grid-template-columns: 1fr;
        }
        .g46-ref-main { padding: 18px; }
        .g46-ref-topbar { align-items: flex-start; flex-direction: column; }
        .g46-ref-title-side { min-width: 0; }
      }
    `}</style>
  );
}

function Grade46StudentChrome({ data, activeTab = 'home', go, goStudentTab, logout, title, subtitle, icon = '☀️', children, titleAction, beforeNavigate }) {
  const s = data?.student || {};
  const xp = Number(s.xp || 0);
  const level = levelForXp(xp);
  const pct = xpPercent(xp);
  const avatar = s.avatar || '👤';

  const openTab = (tab) => {
    if (typeof beforeNavigate === 'function' && !beforeNavigate(tab)) return;
    if (typeof goStudentTab === 'function') return goStudentTab(tab);
    if (!go) return;
    if (tab === 'home') return go('screen-student');
    if (tab === 'lessons') return go('screen-lessons');
    if (tab === 'quizzes') return go('screen-stu-quizzes');
    if (tab === 'missions') return go('screen-stu-missions');
    if (tab === 'groups') return go('screen-stu-groups');
    if (tab === 'badges') return go('screen-stu-badges');
    if (tab === 'profile') return go('screen-stu-profile');
  };

  const navItems = [
    { id: 'home', icon: '🏠', label: 'Home' },
    { id: 'lessons', icon: '📚', label: 'Lessons' },
    { id: 'quizzes', icon: '🧠', label: 'Quizzes' },
    { id: 'missions', icon: '🎮', label: 'Missions' },
    { id: 'groups', icon: '👥', label: 'Groups' },
    { id: 'profile', icon: '👤', label: 'Profile' }
  ];

  return (
    <>
      <Grade46ReferenceStyles />
      <div className="g46-ref-page">
        <div className="g46-ref-frame">
          <aside className="g46-ref-sidebar" aria-label="Grade 3 to 6 student navigation">
            <div className="g46-ref-brand">
              <span>☀️</span>
              <strong>Tuklas Talino</strong>
            </div>

            <nav className="g46-ref-menu">
              {navItems.map(item => (
                <button
                  type="button"
                  key={item.id}
                  className={activeTab === item.id ? 'active' : ''}
                  onClick={() => openTab(item.id)}
                >
                  <span>{item.icon}</span>{item.label}
                </button>
              ))}
            </nav>

            <div className="g46-ref-progress-mini">
              <div className="g46-ref-ring" style={{ background: `conic-gradient(var(--tt-yellow-deep) ${pct * 3.6}deg, rgba(255,255,255,0.20) 0deg)` }}>
                <span>{pct}%</span>
              </div>
              <b>Level {level}</b>
              <small>{xp} XP earned</small>
            </div>

            {typeof logout === 'function' && (
              <button type="button" className="g46-ref-logout" onClick={logout}>↩ Logout</button>
            )}
          </aside>

          <main className="g46-ref-main">
            <header className="g46-ref-topbar">
              <div className="g46-ref-student-pill">
                <span className="g46-ref-avatar-small">{avatar}</span>
                <div>
                  <b>{s.name || 'Mag-aaral'}</b>
                  <small>Grade {s.gradeLevel || '—'} • {s.section || '—'}</small>
                </div>
              </div>

              <div className="g46-ref-top-actions">
                <span className="g46-ref-pill">⚡ {xp} XP</span>
                <span className="g46-ref-pill">🏅 Level {level}</span>
                {titleAction}
              </div>
            </header>

            <section className="g46-ref-title-card">
              <div className="g46-ref-title-left">
                <span className="g46-ref-title-icon">{icon}</span>
                <div>
                  <h1>{title || `Hi ${s.name || 'Learner'}!`}</h1>
                  <p>{subtitle || 'Ready ka na ba sa learning adventure today?'}</p>
                </div>
              </div>

              <div className="g46-ref-title-side">
                <div className="g46-ref-level-line">
                  <span>XP Points</span>
                  <strong>{xp} XP</strong>
                  <i><span style={{ width: `${Math.max(6, pct)}%` }} /></i>
                </div>
                <p className="g46-ref-muted" style={{ margin: '10px 0 0' }}>Mayroon kang <b>{xp} XP</b>. {100 - pct} XP pa bago ang next level.</p>
              </div>
            </section>

            <div className="g46-ref-content">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

function Grade46StudentDashboard({ data, openLesson, openFirstSubjectLesson, goStudentTab, logout, selectedAvatar }) {
  const s = data?.student || {};
  const studentAvatar = s.avatar || selectedAvatar || '👤';
  const stats = subjectStatsFor(data);
  const nextLesson = pickDailyLesson(data);
  const badges = asArray(data?.badges);
  const groups = asArray(data?.groups);
  const tasks = getGroupTasks(data);
  const completedLessons = asArray(data?.lessons).filter(lesson => lesson?.completed).length;
  const totalLessons = asArray(data?.lessons).length;
  const completionPct = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const groupTask = tasks[0];
  const badgeCatalog = [
    { icon: '🌟', name: 'Reader', requirement: 'Complete a reading lesson' },
    { icon: '🔤', name: 'Words', requirement: 'Practice vocabulary lessons' },
    { icon: '🎙️', name: 'Speaker', requirement: 'Finish oral communication practice' },
    { icon: '🏆', name: 'Champion', requirement: 'Complete more learning missions' },
    { icon: '📖', name: 'Story', requirement: 'Finish a Panitikan lesson' },
    { icon: '✨', name: 'Talino', requirement: 'Keep earning XP and badges' }
  ];
  const normalizeBadgeName = (value = '') => String(value || '').trim().toLowerCase();
  const unlockedBadgeNames = new Set(badges.map(badge => normalizeBadgeName(badge.name)));
  const unlockedBadges = badges.map(badge => ({
    ...badge,
    locked: false,
    statusText: 'Unlocked'
  }));
  const lockedBadges = badgeCatalog
    .filter(badge => !unlockedBadgeNames.has(normalizeBadgeName(badge.name)))
    .map(badge => ({ ...badge, locked: true, statusText: badge.requirement }));
  const badgePreview = [...unlockedBadges, ...lockedBadges].slice(0, 6);

  const planCards = [
    {
      icon: '🎧',
      title: nextLesson?.title || 'Listening Practice',
      meta: nextLesson?.subject || 'Pagbasa',
      tone: 'blue',
      action: () => nextLesson ? openLesson(nextLesson) : openFirstSubjectLesson('Pagbasa')
    },
    { icon: '📖', title: 'Reading', meta: 'Pagbasa', tone: 'pink', action: () => openFirstSubjectLesson('Pagbasa') },
    { icon: '🔤', title: 'Learn Words', meta: 'Bokabularyo', tone: 'purple', action: () => openFirstSubjectLesson('Bokabularyo') },
    { icon: '📜', title: 'Story Quest', meta: 'Panitikan', tone: 'yellow', action: () => openFirstSubjectLesson('Panitikan') }
  ];

  return (
    <Grade46StudentChrome
      data={{ ...data, student: { ...s, avatar: studentAvatar } }}
      activeTab="home"
      goStudentTab={goStudentTab}
      logout={logout}
      icon={studentAvatar}
      title={`Hi ${s.name || 'Learner'}!`}
      subtitle="Ready ka na ba sa learning adventure today?"
    >
      <div className="g46-ref-dashboard-grid">
        <div className="g46-ref-column">
          <section className="g46-ref-panel">
            <div className="g46-ref-panel-head">
              <div>
                <h2>Your lessons</h2>
                <p className="g46-ref-muted">Pumili ng lesson para magpatuloy sa iyong Filipino learning journey.</p>
              </div>
              <button type="button" className="g46-ref-panel-link" onClick={() => goStudentTab('lessons')}>All lessons →</button>
            </div>

            <div className="g46-ref-plan-grid">
              {planCards.map(card => (
                <button type="button" className={`g46-ref-plan-card g46-ref-card ${card.tone}`} key={card.title} onClick={card.action}>
                  <div>
                    <div className="g46-ref-card-top">
                      <span className="g46-ref-card-icon">{card.icon}</span>
                      <span className="g46-ref-tag">{card.meta}</span>
                    </div>
                    <h4>{card.title}</h4>
                    </div>
                  <span className="g46-ref-primary-btn g46-ref-start-pill">Start</span>
                </button>
              ))}
            </div>
          </section>

          <section className="g46-ref-panel">
            <div className="g46-ref-panel-head">
              <div>
                <h2>Your group tasks</h2>
                <p className="g46-ref-muted">Tingnan ang assigned group work at collaborative Filipino activities.</p>
              </div>
              <button type="button" className="g46-ref-panel-link" onClick={() => goStudentTab('groups')}>Open groups →</button>
            </div>

            {groupTask ? (
              <div className="g46-ref-task-row">
                <span className="g46-ref-card-icon">👥</span>
                <div>
                  <h3 style={{ fontSize: 28 }}>{groupTask.title}</h3>
                  <p className="g46-ref-muted" style={{ margin: 0 }}>Due {displayDue(groupTask.dueAt)} • +{groupTask.xpReward || 0} XP</p>
                </div>
                <button type="button" className="g46-ref-primary-btn" onClick={() => goStudentTab('groups')}>Continue</button>
              </div>
            ) : (
              <div className="g46-ref-empty">Wala pang group task. Nice! 🎉</div>
            )}
          </section>
        </div>

        <div className="g46-ref-column">
          <section className="g46-ref-panel">
            <div className="g46-ref-panel-head">
              <div>
                <h2>Badges</h2>
                <p className="g46-ref-muted">{unlockedBadges.length}/{badgeCatalog.length} badges unlocked. Tingnan ang locked badges para alam mo ang next goal.</p>
              </div>
            </div>

            <div className="g46-ref-badge-grid">
              {badgePreview.map((badge, index) => (
                <div className={`g46-ref-badge ${badge.locked ? 'locked' : 'unlocked'}`} key={badge.id || badge.name || index}>
                  <div>
                    <span>{badge.locked ? '🔒' : (badge.icon || '🏅')}</span>
                    <strong>{badge.name || 'Badge'}</strong>
                    <small className="g46-ref-badge-status">{badge.statusText || (badge.locked ? 'Locked' : 'Unlocked')}</small>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="g46-ref-panel">
            <div className="g46-ref-panel-head">
              <div>
                <h2>Statistics</h2>
                <p className="g46-ref-muted">XP, badges, and subject progress.</p>
              </div>
            </div>

            <div className="g46-ref-stat-row">
              <div className="g46-ref-stat-item"><span>Total XP</span><div className="g46-ref-stat-track"><span style={{ width: `${Math.max(8, xpPercent(s.xp))}%` }} /></div><b>{s.xp || 0}</b></div>
              <div className="g46-ref-stat-item"><span>Badges</span><div className="g46-ref-stat-track"><span style={{ width: `${Math.min(100, (unlockedBadges.length / Math.max(1, badgeCatalog.length)) * 100)}%` }} /></div><b>{unlockedBadges.length}</b></div>
              <div className="g46-ref-stat-item"><span>Lessons</span><div className="g46-ref-stat-track"><span style={{ width: `${completionPct}%` }} /></div><b>{completionPct}%</b></div>
            </div>
          </section>

          <section className="g46-ref-panel">
            <div className="g46-ref-panel-head">
              <div>
                <h2>Subjects</h2>
                <p className="g46-ref-muted">Quick view of module completion.</p>
              </div>
            </div>
            <div className="g46-ref-stat-row">
              {stats.map(item => (
                <button type="button" className="g46-ref-list-row" key={item.subj} onClick={() => openFirstSubjectLesson(item.subj)} style={{ width: '100%', border: 0, cursor: 'pointer' }}>
                  <span className="g46-ref-card-icon">{item.theme.icon}</span>
                  <div>
                    <h3 style={{ fontSize: 26, margin: 0 }}>{item.subj}</h3>
                    <p className="g46-ref-muted" style={{ margin: 0 }}>{item.done}/{item.total || 0} lessons</p>
                  </div>
                  <b>{item.pct}%</b>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </Grade46StudentChrome>
  );
}


function SubjectCards({ lessonsBySubject, openLesson }) {
  return <div className="grid grid-3">{lessonsBySubject.map(item => <button className="module-card" key={item.name} onClick={() => item.lessons[0] && openLesson(item.lessons[0])}><div style={{ fontSize: 36 }}>{item.icon}</div><h3>{item.name}</h3><p>{item.lessons.length} lessons</p><ProgressBar value={item.lessons.length ? Math.round((item.lessons.filter(l => l.completed).length / item.lessons.length) * 100) : 0} /></button>)}</div>;
}


function EarlyStudentSubpageStyles() {
  return (
    <style>{`
      .g12-page {
        min-height: 100vh;
        padding-bottom: 116px;
        background:
          radial-gradient(circle at 3% 22%, rgba(147, 197, 253, 0.10), transparent 24%),
          radial-gradient(circle at 95% 74%, rgba(253, 230, 138, 0.15), transparent 22%),
          linear-gradient(180deg, #fffdf7 0%, #f7fbff 48%, #fff8ef 100%);
        color: #24324a;
      }

      .g12-topbar {
        position: sticky;
        top: 0;
        z-index: 60;
        min-height: 88px;
        padding: 16px 28px;
        background: rgba(255, 255, 255, 0.96);
        backdrop-filter: blur(16px);
        border-bottom: 1px solid rgba(30, 160, 92, 0.08);
        box-shadow: 0 8px 20px rgba(32, 90, 54, 0.04);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
      }

      .g12-brand {
        border: 0;
        background: transparent;
        display: flex;
        align-items: center;
        gap: 12px;
        color: #15965a;
        font-size: 29px;
        font-weight: 950;
        letter-spacing: -0.045em;
        white-space: nowrap;
        cursor: pointer;
      }

      .g12-brand-icon {
        width: 48px;
        height: 48px;
        border-radius: 18px;
        display: grid;
        place-items: center;
        background: #fff6dc;
        box-shadow: inset 0 0 0 2px rgba(238, 202, 95, 0.22);
        font-size: 28px;
      }

      .g12-top-actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 12px;
        flex-wrap: wrap;
      }

      .g12-pill,
      .g12-action-btn {
        min-height: 52px;
        border-radius: 20px;
        padding: 0 20px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 9px;
        font-size: 17px;
        font-weight: 950;
      }

      .g12-pill {
        background: #fff5cf;
        border: 1px solid #f7dfa0;
        color: #22324a;
      }

      .g12-action-btn {
        border: 2px solid #2fbf73;
        background: #ffffff;
        color: #14975a;
        cursor: pointer;
        box-shadow: 0 8px 16px rgba(47, 191, 115, 0.08);
      }

      .g12-shell {
        padding: 22px 24px 132px;
      }

      .g12-subpage-shell {
        max-width: 1380px;
        margin: 0 auto;
      }

      .g12-subpage-hero {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 20px;
        align-items: center;
        margin-bottom: 22px;
        padding: 28px 32px;
        border-radius: 34px;
        background:
          radial-gradient(circle at 8% 18%, rgba(255, 239, 187, 0.65), transparent 28%),
          radial-gradient(circle at 90% 20%, rgba(224, 242, 254, 0.70), transparent 34%),
          linear-gradient(115deg, #fff4d7 0%, #fff8f2 48%, #eef8ff 100%);
        border: 1px solid rgba(46, 184, 127, 0.12);
        box-shadow: 0 18px 36px rgba(31, 73, 61, 0.08);
      }

      .g12-subpage-title {
        display: flex;
        align-items: center;
        gap: 18px;
      }

      .g12-subpage-icon {
        width: 76px;
        height: 76px;
        border-radius: 26px;
        display: grid;
        place-items: center;
        background: rgba(255, 255, 255, 0.72);
        font-size: 42px;
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.6);
      }

      .g12-subpage-title h1 {
        margin: 0;
        color: #16a362;
        font-size: clamp(38px, 4vw, 58px);
        line-height: 0.95;
        font-weight: 1000;
        letter-spacing: -0.055em;
      }

      .g12-subpage-title p {
        margin: 10px 0 0;
        color: #425a7c;
        font-size: 18px;
        font-weight: 850;
      }

      .g12-mini-progress {
        min-width: 300px;
        padding: 20px 22px;
        border-radius: 28px;
        background: rgba(255, 255, 255, 0.86);
        border: 2px solid rgba(255, 217, 102, 0.28);
        box-shadow: 0 14px 28px rgba(58, 82, 84, 0.06);
      }

      .g12-mini-progress strong {
        display: block;
        color: #14223b;
        font-size: 28px;
        font-weight: 1000;
        letter-spacing: -0.04em;
        margin-bottom: 12px;
      }

      .g12-progress-track,
      .g12-module-progress {
        width: 100%;
        border-radius: 999px;
        background: #eef7f1;
        overflow: hidden;
        border: 1px solid #d8efe0;
      }

      .g12-progress-track {
        height: 14px;
      }

      .g12-module-progress {
        height: 12px;
        background: rgba(255, 255, 255, 0.75);
      }

      .g12-progress-fill,
      .g12-module-progress span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #45c985, #9be8ba);
      }

      .g12-section-card {
        margin-top: 22px;
        padding: 30px;
        border-radius: 32px;
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid rgba(31, 154, 92, 0.06);
        box-shadow: 0 16px 32px rgba(39, 87, 63, 0.06);
      }

      .g12-section-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 20px;
      }

      .g12-section-title {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 0;
        color: #15965a;
        font-size: 31px;
        font-weight: 1000;
        letter-spacing: -0.04em;
      }

      .g12-section-subtitle {
        margin: 6px 0 0;
        color: #425a7c;
        font-size: 16px;
        font-weight: 850;
      }

      .g12-filter-row {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 20px;
      }

      .g12-chip {
        border: 0;
        min-height: 48px;
        padding: 0 18px;
        border-radius: 18px;
        background: #ffffff;
        color: #203451;
        font-size: 15px;
        font-weight: 950;
        cursor: pointer;
        box-shadow: inset 0 0 0 1px rgba(31, 154, 92, 0.10);
      }

      .g12-chip.active {
        background: #edf8f1;
        color: #15965a;
        box-shadow: inset 0 0 0 2px rgba(39, 174, 96, 0.18);
      }

      .g12-card-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 18px;
      }

      .g12-tile {
        border: 0;
        min-height: 168px;
        padding: 20px 22px;
        border-radius: 28px;
        background: #ffffff;
        color: #22324a;
        text-align: left;
        display: grid;
        grid-template-columns: 96px minmax(0, 1fr) 50px;
        gap: 18px;
        align-items: center;
        cursor: pointer;
        box-shadow: 0 12px 22px rgba(47, 78, 84, 0.05);
        border: 1px solid rgba(48, 120, 100, 0.08);
        transition: 0.16s ease;
      }

      .g12-tile:hover,
      .g12-action-btn:hover,
      .g12-chip:hover {
        transform: translateY(-2px);
      }

      .g12-tile.green { background: #edf9f0; }
      .g12-tile.blue { background: #eef7ff; }
      .g12-tile.purple { background: #f6f0ff; }
      .g12-tile.yellow { background: #fff7dd; }
      .g12-tile.pink { background: #fff0f5; }

      .g12-tile-icon {
        width: 86px;
        height: 86px;
        border-radius: 24px;
        display: grid;
        place-items: center;
        font-size: 42px;
        background: rgba(255, 255, 255, 0.70);
      }

      .g12-tile h3 {
        margin: 0 0 8px;
        color: #22324a;
        font-size: 27px;
        line-height: 1.05;
        font-weight: 1000;
        letter-spacing: -0.04em;
      }

      .g12-tile p,
      .g12-muted {
        margin: 0;
        color: #526988;
        font-size: 15px;
        line-height: 1.45;
        font-weight: 850;
      }

      .g12-status-pill {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        width: max-content;
        min-height: 34px;
        padding: 0 12px;
        margin-top: 12px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.75);
        color: #15965a;
        font-size: 13px;
        font-weight: 950;
      }

      .g12-arrow {
        width: 50px;
        height: 50px;
        border-radius: 999px;
        display: grid;
        place-items: center;
        background: rgba(255, 255, 255, 0.82);
        color: #15965a;
        font-size: 28px;
        font-weight: 1000;
      }

      .g12-empty {
        padding: 28px;
        border-radius: 26px;
        background: #ffffff;
        border: 1px dashed rgba(31, 154, 92, 0.18);
        color: #526988;
        font-weight: 900;
        text-align: center;
      }

      .g12-group-card,
      .g12-profile-card,
      .g12-badge-card,
      .g12-lesson-panel {
        border-radius: 28px;
        background: rgba(255, 255, 255, 0.94);
        border: 1px solid rgba(31, 154, 92, 0.07);
        box-shadow: 0 14px 26px rgba(47, 78, 84, 0.05);
        padding: 22px;
      }

      .g12-group-card h3,
      .g12-profile-card h3,
      .g12-badge-card h3,
      .g12-lesson-panel h3 {
        margin: 0 0 8px;
        color: #22324a;
        font-size: 25px;
        font-weight: 1000;
        letter-spacing: -0.04em;
      }

      .g12-task-card {
        margin-top: 14px;
        display: grid;
        grid-template-columns: 58px minmax(0, 1fr) auto;
        gap: 14px;
        align-items: center;
        padding: 16px;
        border-radius: 22px;
        background: #f8fcff;
        border: 1px solid #e2f0ff;
      }

      .g12-task-icon {
        width: 54px;
        height: 54px;
        border-radius: 18px;
        display: grid;
        place-items: center;
        font-size: 28px;
        background: #fff5cf;
      }

      .g12-main-btn {
        min-height: 50px;
        border: 0;
        padding: 0 20px;
        border-radius: 18px;
        background: linear-gradient(135deg, #47ce87, #1f9c60);
        color: white;
        font-size: 15px;
        font-weight: 1000;
        cursor: pointer;
        box-shadow: 0 12px 18px rgba(32, 156, 96, 0.16);
      }

      .g12-outline-btn {
        min-height: 50px;
        border: 2px solid #2fbf73;
        padding: 0 20px;
        border-radius: 18px;
        background: #ffffff;
        color: #14975a;
        font-size: 15px;
        font-weight: 1000;
        cursor: pointer;
      }

      .g12-badge-grid,
      .g12-avatar-grid,
      .g12-summary-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 16px;
      }

      .g12-badge-card {
        min-height: 150px;
        display: grid;
        place-items: center;
        text-align: center;
      }

      .g12-badge-big {
        font-size: 54px;
        line-height: 1;
        filter: drop-shadow(0 10px 12px rgba(122, 66, 195, 0.14));
      }

      .g12-badge-card strong {
        display: block;
        margin-top: 10px;
        color: #6f42c1;
        font-size: 17px;
        font-weight: 1000;
      }

      .g12-avatar-choice {
        min-height: 112px;
        border: 0;
        border-radius: 28px;
        background: #ffffff;
        font-size: 46px;
        cursor: pointer;
        box-shadow: inset 0 0 0 1px rgba(31, 154, 92, 0.10), 0 12px 22px rgba(47, 78, 84, 0.04);
      }

      .g12-avatar-choice.selected {
        background: #edf8f1;
        box-shadow: inset 0 0 0 3px rgba(39, 174, 96, 0.26), 0 14px 26px rgba(47, 78, 84, 0.06);
      }

      .g12-summary-box {
        padding: 20px;
        border-radius: 24px;
        background: #ffffff;
        border: 1px solid rgba(31, 154, 92, 0.08);
        display: flex;
        align-items: center;
        gap: 14px;
      }

      .g12-summary-box span {
        width: 54px;
        height: 54px;
        border-radius: 18px;
        background: #fff5cf;
        display: grid;
        place-items: center;
        font-size: 28px;
      }

      .g12-summary-box b {
        display: block;
        color: #14223b;
        font-size: 24px;
        font-weight: 1000;
      }

      .g12-summary-box small {
        display: block;
        color: #526988;
        font-weight: 850;
      }

      .g12-lesson-layout {
        display: grid;
        gap: 18px;
      }

      .g12-reading-box {
        padding: 22px;
        border-radius: 24px;
        background: #f8fcff;
        border: 1px solid #e1eefe;
        color: #26354d;
        font-size: 22px;
        line-height: 1.85;
        font-weight: 750;
      }

      .g12-nav {
        position: fixed;
        left: 50%;
        bottom: 22px;
        transform: translateX(-50%);
        width: min(1120px, calc(100vw - 40px));
        z-index: 80;
        min-height: 82px;
        padding: 10px 20px;
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 10px;
        border-radius: 34px;
        background: rgba(255, 255, 255, 0.96);
        border: 1px solid rgba(39, 174, 96, 0.08);
        box-shadow: 0 14px 30px rgba(25, 78, 54, 0.09);
        backdrop-filter: blur(16px);
      }

      .g12-nav button {
        border: 0;
        background: transparent;
        border-radius: 24px;
        color: #203451;
        font-size: 16px;
        font-weight: 950;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
      }

      .g12-nav button.active {
        background: #edf8f1;
        color: #15965a;
      }

      .g12-nav-icon {
        font-size: 34px;
        line-height: 1;
      }

      /* Grade 1-2 shared Kid Curious UI for Lessons, Missions, Groups, Badges, and Profile. */
      .g12-page {
        background:
          radial-gradient(circle at 14% 18%, rgba(255, 245, 207, 0.95), transparent 24%),
          radial-gradient(circle at 86% 72%, rgba(237, 248, 241, 0.95), transparent 26%),
          linear-gradient(135deg, #e8fff1 0%, #fffdf7 46%, #fff5cf 100%);
      }

      .g12-topbar {
        width: min(1280px, calc(100vw - 32px));
        margin: 14px auto 0;
        border-radius: 34px;
        border: 3px solid rgba(21, 150, 90, 0.12);
        box-shadow: 0 14px 0 rgba(21, 150, 90, 0.08), 0 22px 42px rgba(21, 150, 90, 0.10);
      }

      .g12-shell,
      .g12-subpage-shell {
        width: min(1280px, calc(100vw - 32px));
        max-width: none;
        margin: 0 auto;
      }

      .g12-brand {
        font-size: 34px;
      }

      .g12-brand-icon {
        width: 64px;
        height: 64px;
        border-radius: 24px;
        font-size: 38px;
      }

      .g12-pill,
      .g12-action-btn {
        min-height: 60px;
        border-radius: 24px;
        font-size: 19px;
      }

      .g12-subpage-hero {
        border-radius: 44px;
        padding: 38px 42px;
        border: 4px solid rgba(21, 150, 90, 0.13);
        box-shadow: 0 14px 0 rgba(21, 150, 90, 0.08), 0 26px 48px rgba(21, 150, 90, 0.12);
        background:
          radial-gradient(circle at 12% 20%, rgba(255, 245, 207, 0.92), transparent 28%),
          radial-gradient(circle at 86% 26%, rgba(255, 255, 255, 0.80), transparent 18%),
          linear-gradient(135deg, #28c98a 0%, #15965a 42%, #edf8f1 43%, #fffdf7 100%);
      }

      .g12-subpage-icon {
        width: 100px;
        height: 100px;
        border-radius: 34px;
        background: #fff5cf;
        font-size: 58px;
        box-shadow: 0 8px 0 #f6c453, inset 0 0 0 3px rgba(255,255,255,0.72);
      }

      .g12-subpage-title h1 {
        color: #14223b;
        font-size: clamp(54px, 5.6vw, 82px);
        line-height: 0.94;
        text-shadow: none;
      }

      .g12-subpage-title p {
        color: #334155;
        font-size: 24px;
        line-height: 1.35;
        text-shadow: none;
      }

      .g12-subpage-title > div {
        padding: 18px 22px;
        border-radius: 30px;
        background: rgba(255, 255, 255, 0.74);
        border: 3px solid rgba(255, 245, 207, 0.72);
        box-shadow: 0 12px 26px rgba(20, 34, 59, 0.09);
        backdrop-filter: blur(8px);
      }

      .g12-mini-progress {
        min-width: 360px;
        padding: 26px;
        border-radius: 34px;
        border: 4px solid rgba(255, 245, 207, 0.78);
        box-shadow: 0 9px 0 rgba(246, 196, 83, 0.55), 0 20px 34px rgba(20, 34, 59, 0.12);
      }

      .g12-mini-progress strong {
        font-size: 36px;
      }

      .g12-progress-track,
      .g12-module-progress {
        height: 20px;
        border: 3px solid #d8efe0;
      }

      .g12-section-card,
      .g12-group-card,
      .g12-profile-card,
      .g12-badge-card,
      .g12-lesson-panel {
        border-radius: 42px;
        padding: 36px;
        border: 4px solid rgba(21, 150, 90, 0.11);
        box-shadow: 0 14px 0 rgba(21, 150, 90, 0.07), 0 26px 46px rgba(21, 150, 90, 0.10);
      }

      .g12-section-title {
        font-size: clamp(38px, 4vw, 58px);
      }

      .g12-section-subtitle,
      .g12-muted,
      .g12-tile p {
        font-size: 21px;
      }

      .g12-card-grid {
        gap: 24px;
      }

      .g12-tile {
        min-height: 232px;
        grid-template-columns: 124px minmax(0, 1fr) 68px;
        gap: 24px;
        padding: 28px;
        border-radius: 38px;
        border: 4px solid rgba(255, 255, 255, 0.76);
        box-shadow: 0 10px 0 rgba(21, 150, 90, 0.10), 0 22px 34px rgba(21, 150, 90, 0.10);
      }

      .g12-tile-icon {
        width: 108px;
        height: 108px;
        border-radius: 34px;
        font-size: 62px;
      }

      .g12-tile h3 {
        font-size: 38px;
      }

      .g12-status-pill {
        min-height: 46px;
        padding: 0 18px;
        font-size: 17px;
      }

      .g12-arrow {
        width: 66px;
        height: 66px;
        font-size: 38px;
      }

      .g12-main-btn,
      .g12-outline-btn {
        min-height: 68px;
        border-radius: 26px;
        padding: 0 28px;
        font-size: 22px;
      }

      .g12-main-btn {
        background: linear-gradient(180deg, #ffe46c, #ffc928);
        color: #14223b;
        text-shadow: none;
        box-shadow: 0 8px 0 #e7a90f, 0 18px 28px rgba(245, 158, 11, 0.20);
      }

      .g12-outline-btn {
        border: 3px solid rgba(21, 150, 90, 0.24);
        box-shadow: 0 8px 0 rgba(21, 150, 90, 0.12), 0 16px 26px rgba(21, 150, 90, 0.08);
      }

      .g12-task-card {
        grid-template-columns: 84px minmax(0, 1fr) auto;
        padding: 24px;
        border-radius: 32px;
      }

      .g12-task-icon {
        width: 74px;
        height: 74px;
        border-radius: 26px;
        font-size: 42px;
      }

      .g12-badge-grid,
      .g12-avatar-grid,
      .g12-summary-grid {
        gap: 24px;
      }

      .g12-badge-card {
        min-height: 210px;
      }

      .g12-badge-big {
        font-size: 82px;
      }

      .g12-badge-card strong {
        font-size: 24px;
      }

      .g12-avatar-choice {
        min-height: 150px;
        border-radius: 38px;
        font-size: 74px;
        box-shadow: 0 8px 0 rgba(21, 150, 90, 0.10), inset 0 0 0 2px rgba(21, 150, 90, 0.12);
      }

      .g12-summary-box {
        min-height: 132px;
        border-radius: 34px;
        padding: 26px;
      }

      .g12-summary-box span {
        width: 76px;
        height: 76px;
        border-radius: 26px;
        font-size: 42px;
      }

      .g12-summary-box b {
        font-size: 32px;
      }

      .g12-summary-box small {
        font-size: 18px;
      }

      .g12-reading-box {
        border-radius: 34px;
        padding: 30px;
        font-size: 30px;
      }

      .g12-nav {
        min-height: 96px;
        border-radius: 42px;
        border: 4px solid rgba(21, 150, 90, 0.10);
        box-shadow: 0 12px 0 rgba(21, 150, 90, 0.10), 0 22px 34px rgba(20, 34, 59, 0.12);
      }

      .g12-nav button {
        border-radius: 32px;
        font-size: 19px;
      }

      .g12-nav button.active {
        background: #fff5cf;
        color: #0f7d49;
        box-shadow: inset 0 0 0 2px rgba(246, 196, 83, 0.28);
      }

      .g12-nav-icon {
        font-size: 40px;
      }

      .g12-page .missions-wrap.early > .missions-hero {
        display: none;
      }

      .g12-page .missions-wrap.early .missions-game-card {
        min-height: 300px;
        border-radius: 38px;
        padding: 26px;
        border: 4px solid rgba(255,255,255,0.76);
        box-shadow: 0 10px 0 rgba(21, 150, 90, 0.10), 0 22px 34px rgba(21, 150, 90, 0.10);
      }

      .g12-page .missions-wrap.early .missions-game-icon {
        width: 92px;
        height: 92px;
        border-radius: 30px;
        font-size: 54px;
      }

      .g12-page .missions-wrap.early .missions-game-card h4 {
        font-size: 36px;
      }

      .g12-page .missions-wrap.early .missions-game-card p,
      .g12-page .missions-wrap.early .missions-section-head p,
      .g12-page .missions-wrap.early .missions-stat-card span {
        font-size: 20px;
      }

      .g12-page .missions-wrap.early .missions-play-btn {
        min-height: 66px;
        border-radius: 26px;
        background: linear-gradient(180deg, #ffe46c, #ffc928);
        box-shadow: 0 8px 0 #e7a90f, 0 18px 28px rgba(245, 158, 11, 0.20);
        font-size: 22px;
      }


      /* Grade 1-2 balanced subpage font sizing. */
      .g12-brand {
        font-size: 28px;
      }

      .g12-brand-icon {
        width: 54px;
        height: 54px;
        border-radius: 20px;
        font-size: 32px;
      }

      .g12-pill,
      .g12-action-btn {
        min-height: 50px;
        border-radius: 20px;
        font-size: 16px;
        padding: 0 16px;
      }

      .g12-subpage-hero {
        padding: 28px 32px;
        border-radius: 36px;
      }

      .g12-subpage-icon {
        width: 78px;
        height: 78px;
        border-radius: 26px;
        font-size: 42px;
      }

      .g12-subpage-title h1 {
        font-size: clamp(34px, 4vw, 50px);
        line-height: 1;
      }

      .g12-subpage-title p {
        font-size: 17px;
        line-height: 1.45;
      }

      .g12-subpage-title > div {
        padding: 14px 18px;
        border-radius: 24px;
      }

      .g12-mini-progress {
        min-width: 300px;
        padding: 22px;
        border-radius: 28px;
      }

      .g12-mini-progress strong {
        font-size: 24px;
      }

      .g12-progress-track,
      .g12-module-progress {
        height: 14px;
        border-width: 2px;
      }

      .g12-section-card,
      .g12-group-card,
      .g12-profile-card,
      .g12-badge-card,
      .g12-lesson-panel {
        padding: 28px;
        border-radius: 34px;
      }

      .g12-section-title {
        font-size: clamp(28px, 3vw, 38px);
      }

      .g12-section-subtitle,
      .g12-muted,
      .g12-tile p {
        font-size: 16px;
      }

      .g12-card-grid {
        gap: 20px;
      }

      .g12-tile {
        min-height: 180px;
        grid-template-columns: 96px minmax(0, 1fr) 52px;
        gap: 18px;
        padding: 22px;
        border-radius: 30px;
      }

      .g12-tile-icon {
        width: 84px;
        height: 84px;
        border-radius: 26px;
        font-size: 46px;
      }

      .g12-tile h3 {
        font-size: 28px;
        line-height: 1.08;
      }

      .g12-status-pill {
        min-height: 38px;
        padding: 0 14px;
        font-size: 14px;
      }

      .g12-arrow {
        width: 52px;
        height: 52px;
        font-size: 30px;
      }

      .g12-main-btn,
      .g12-outline-btn {
        min-height: 54px;
        border-radius: 20px;
        padding: 0 22px;
        font-size: 17px;
      }

      .g12-task-card {
        grid-template-columns: 66px minmax(0, 1fr) auto;
        padding: 18px;
        border-radius: 26px;
      }

      .g12-task-icon {
        width: 58px;
        height: 58px;
        border-radius: 20px;
        font-size: 32px;
      }

      .g12-badge-grid,
      .g12-avatar-grid,
      .g12-summary-grid {
        gap: 18px;
      }

      .g12-badge-card {
        min-height: 160px;
      }

      .g12-badge-big {
        font-size: 58px;
      }

      .g12-badge-card strong {
        font-size: 18px;
      }

      .g12-avatar-choice {
        min-height: 112px;
        border-radius: 30px;
        font-size: 52px;
      }

      .g12-summary-box {
        min-height: 104px;
        border-radius: 28px;
        padding: 22px;
      }

      .g12-summary-box span {
        width: 58px;
        height: 58px;
        border-radius: 20px;
        font-size: 32px;
      }

      .g12-summary-box b {
        font-size: 24px;
      }

      .g12-summary-box small {
        font-size: 15px;
      }

      .g12-reading-box {
        padding: 24px;
        border-radius: 28px;
        font-size: 22px;
        line-height: 1.65;
      }

      .g12-nav {
        min-height: 78px;
        border-radius: 34px;
      }

      .g12-nav button {
        border-radius: 26px;
        font-size: 15px;
      }

      .g12-nav-icon {
        font-size: 30px;
      }

      .g12-page .missions-wrap.early .missions-game-card {
        min-height: 230px;
        padding: 22px;
        border-radius: 30px;
      }

      .g12-page .missions-wrap.early .missions-game-icon {
        width: 74px;
        height: 74px;
        border-radius: 24px;
        font-size: 40px;
      }

      .g12-page .missions-wrap.early .missions-game-card h4 {
        font-size: 28px;
      }

      .g12-page .missions-wrap.early .missions-game-card p,
      .g12-page .missions-wrap.early .missions-section-head p,
      .g12-page .missions-wrap.early .missions-stat-card span {
        font-size: 16px;
      }

      .g12-page .missions-wrap.early .missions-play-btn {
        min-height: 54px;
        border-radius: 20px;
        font-size: 17px;
      }

      @media (max-width: 1000px) {
        .g12-subpage-hero,
        .g12-card-grid,
        .g12-badge-grid,
        .g12-avatar-grid,
        .g12-summary-grid {
          grid-template-columns: 1fr;
        }

        .g12-mini-progress {
          min-width: 0;
        }

        .g12-tile {
          grid-template-columns: 86px minmax(0, 1fr) 42px;
        }
      }

      @media (max-width: 760px) {
        .g12-topbar {
          align-items: flex-start;
          flex-direction: column;
          padding: 16px;
        }

        .g12-top-actions {
          width: 100%;
          justify-content: flex-start;
        }

        .g12-pill,
        .g12-action-btn {
          min-height: 48px;
          font-size: 14px;
          padding: 0 14px;
        }

        .g12-shell {
          padding: 14px 14px 120px;
        }

        .g12-subpage-hero {
          padding: 22px;
          border-radius: 28px;
        }

        .g12-subpage-title {
          align-items: flex-start;
          flex-direction: column;
        }

        .g12-subpage-title h1 {
          font-size: 40px;
        }

        .g12-section-card {
          padding: 20px;
        }

        .g12-tile {
          grid-template-columns: 76px minmax(0, 1fr);
        }

        .g12-arrow {
          display: none;
        }

        .g12-task-card {
          grid-template-columns: 1fr;
        }

        .g12-nav {
          width: calc(100vw - 18px);
          bottom: 10px;
          border-radius: 24px;
          padding: 8px;
          gap: 4px;
        }

        .g12-nav button {
          flex-direction: column;
          gap: 2px;
          font-size: 11px;
        }

        .g12-nav-icon {
          font-size: 26px;
        }
      }
    `}</style>
  );
}

function EarlyStudentChrome({ data, activeTab, go, title, subtitle, icon, children, showProgress = true, beforeNavigate }) {
  const s = data?.student || {};
  const level = levelForXp(s.xp);
  const xpPct = xpPercent(s.xp);

  const goStudentTab = (tab) => {
    if (typeof beforeNavigate === 'function' && !beforeNavigate(tab)) return;
    if (tab === 'home') return go('screen-student');
    if (tab === 'lessons') return go('screen-lessons');
    if (tab === 'quizzes') return go('screen-stu-quizzes');
    if (tab === 'missions') return go('screen-stu-missions');
    if (tab === 'groups') return go('screen-stu-groups');
    if (tab === 'badges') return go('screen-stu-badges');
    if (tab === 'profile') return go('screen-stu-profile');
  };

  return (
    <>
      <EarlyStudentSubpageStyles />
      <div className="g12-page">
        <header className="g12-topbar">
          <button type="button" className="g12-brand" onClick={() => goStudentTab('home')}>
            <span className="g12-brand-icon">☀️</span>
            <span>Tuklas Talino</span>
          </button>

          <div className="g12-top-actions">
            <div className="g12-pill">🌸 Grade {s.gradeLevel || '—'} • {s.section || '—'}</div>
            <div className="g12-pill">⚡ {s.xp || 0} XP</div>
            <button type="button" className="g12-action-btn" onClick={() => goStudentTab('home')}>🏠 Home</button>
          </div>
        </header>

        <main className="g12-shell g12-subpage-shell">
          <section className="g12-subpage-hero">
            <div className="g12-subpage-title">
              <span className="g12-subpage-icon">{icon}</span>
              <div>
                <h1>{title}</h1>
                <p>{subtitle}</p>
              </div>
            </div>

            {showProgress && (
              <div className="g12-mini-progress">
                <strong>🪙 {s.xp || 0} XP • Level {level}</strong>
                <div className="g12-progress-track">
                  <span className="g12-progress-fill" style={{ width: `${xpPct}%` }} />
                </div>
              </div>
            )}
          </section>

          {children}
        </main>

        <nav className="g12-nav" aria-label="Student navigation">
          <button type="button" className={activeTab === 'home' ? 'active' : ''} onClick={() => goStudentTab('home')}><span className="g12-nav-icon">🏠</span>Home</button>
          <button type="button" className={activeTab === 'lessons' ? 'active' : ''} onClick={() => goStudentTab('lessons')}><span className="g12-nav-icon">📖</span>Lessons</button>
          <button type="button" className={activeTab === 'quizzes' ? 'active' : ''} onClick={() => goStudentTab('quizzes')}><span className="g12-nav-icon">🧠</span>Quizzes</button>
          <button type="button" className={activeTab === 'missions' ? 'active' : ''} onClick={() => goStudentTab('missions')}><span className="g12-nav-icon">🎮</span>Missions</button>
          <button type="button" className={activeTab === 'groups' ? 'active' : ''} onClick={() => goStudentTab('groups')}><span className="g12-nav-icon">👥</span>Groups</button>
          <button type="button" className={activeTab === 'profile' ? 'active' : ''} onClick={() => goStudentTab('profile')}><span className="g12-nav-icon">🐰</span>Profile</button>
        </nav>
      </div>
    </>
  );
}

function EarlyLessonsScreen({ lessons, subjectFilter, setSubjectFilter, go, openLesson, data }) {
  return (
    <EarlyStudentChrome
      data={data}
      activeTab="lessons"
      go={go}
      icon="📖"
      title="Mga Aralin"
      subtitle="Pumili ng module o lesson na gusto mong simulan."
    >
      <section className="g12-section-card">
        <div className="g12-section-head">
          <div>
            <h2 className="g12-section-title">📚 Lesson Library</h2>
            <p className="g12-section-subtitle">{lessons.length} lesson{lessons.length === 1 ? '' : 's'} available for your grade.</p>
          </div>
        </div>

        <div className="g12-filter-row">
          <button className={`g12-chip ${subjectFilter === 'ALL' ? 'active' : ''}`} onClick={() => setSubjectFilter('ALL')}>🌎 All</button>
          {SUBJECTS.map(subject => (
            <button
              key={subject.name}
              className={`g12-chip ${subjectFilter === subject.name ? 'active' : ''}`}
              onClick={() => setSubjectFilter(subject.name)}
            >
              {subject.icon} {subject.name}
            </button>
          ))}
        </div>

        <div className="g12-card-grid">
          {lessons.map(lesson => {
            const meta = subjectTheme(lesson.subject);
            const subjectInfo = SUBJECTS.find(subject => subject.name === lesson.subject) || {};
            const tone = subjectInfo.tone || 'green';

            return (
              <button type="button" className={`g12-tile ${tone}`} key={lesson.id} onClick={() => openLesson(lesson)}>
                <div className="g12-tile-icon">{meta.icon}</div>
                <div>
                  <h3>{lesson.title}</h3>
                  <p>{lesson.subject} • Grade {lesson.gradeLevel} • +{lesson.xpReward || 0} XP</p>
                  <span className="g12-status-pill">{lesson.completed ? '✅ Summary' : '▶ Start'}</span>
                </div>
                <div className="g12-arrow">›</div>
              </button>
            );
          })}
        </div>

        {!lessons.length && (
          <div className="g12-empty">No lessons found for this filter yet.</div>
        )}
      </section>
    </EarlyStudentChrome>
  );
}

function LessonsScreen({ lessons, subjectFilter, setSubjectFilter, go, openLesson, data }) {
  const early = Number(data?.student?.gradeLevel || lessons?.[0]?.gradeLevel || 4) <= 2;

  if (early) {
    return (
      <EarlyLessonsScreen
        lessons={lessons}
        subjectFilter={subjectFilter}
        setSubjectFilter={setSubjectFilter}
        go={go}
        openLesson={openLesson}
        data={data}
      />
    );
  }

  return (
    <Grade46StudentChrome
      data={data}
      activeTab="lessons"
      go={go}
      icon="📚"
      title="Mga Aralin"
      subtitle="Pumili ng Filipino lesson o module para magpatuloy."
    >
      <section className="g46-ref-panel">
        <div className="g46-ref-panel-head">
          <div>
            <h2>Lesson Library</h2>
            <p className="g46-ref-muted">{lessons.length} lesson{lessons.length === 1 ? '' : 's'} available for your grade.</p>
          </div>
        </div>

        <div className="g46-ref-filter-row">
          <button className={subjectFilter === 'ALL' ? 'active' : ''} onClick={() => setSubjectFilter('ALL')}>🌎 All</button>
          {SUBJECTS.map(subject => (
            <button
              key={subject.name}
              className={subjectFilter === subject.name ? 'active' : ''}
              onClick={() => setSubjectFilter(subject.name)}
            >
              {subject.icon} {subject.name}
            </button>
          ))}
        </div>

        <div className="g46-ref-card-grid">
          {lessons.map(lesson => {
            const meta = subjectTheme(lesson.subject);
            const subjectInfo = SUBJECTS.find(subject => subject.name === lesson.subject) || {};
            const tone = subjectInfo.tone || 'green';

            return (
              <button type="button" className={`g46-ref-card ${tone}`} key={lesson.id} onClick={() => openLesson(lesson)}>
                <div>
                  <div className="g46-ref-card-top">
                    <span className="g46-ref-card-icon">{meta.icon}</span>
                    <span className="g46-ref-tag">{lesson.completed ? '✅ Done' : '▶ Start'}</span>
                  </div>
                  <h4>{lesson.title}</h4>
                  <p>{lesson.subject} • Grade {lesson.gradeLevel} • +{lesson.xpReward || 0} XP</p>
                </div>
                <span className="g46-ref-primary-btn" style={{ width: 'max-content' }}>{lesson.completed ? 'Summary' : 'Start'}</span>
              </button>
            );
          })}
        </div>

        {!lessons.length && <div className="g46-ref-empty">No lessons found for this filter yet.</div>}
      </section>
    </Grade46StudentChrome>
  );
}


function normalizeSpeechText(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/[.,!?;:'"()\-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function editDistance(a = '', b = '') {
  const first = normalizeSpeechText(a);
  const second = normalizeSpeechText(b);

  const rows = first.length + 1;
  const cols = second.length + 1;
  const dp = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = 0; i < rows; i++) dp[i][0] = i;
  for (let j = 0; j < cols; j++) dp[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = first[i - 1] === second[j - 1] ? 0 : 1;

      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[first.length][second.length];
}

function speechSimilarityScore(target = '', transcript = '') {
  const cleanTarget = normalizeSpeechText(target);
  const cleanTranscript = normalizeSpeechText(transcript);

  if (!cleanTarget || !cleanTranscript) return 0;

  const distance = editDistance(cleanTarget, cleanTranscript);
  const maxLength = Math.max(cleanTarget.length, cleanTranscript.length);

  return Math.max(0, Math.round((1 - distance / maxLength) * 100));
}

function getSpeechRecognition() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function LessonScreen({ lesson, feedback, go, completeLesson, submitMcq, submitWriting, submitSpeech, data, openLesson }) {
  const activities = lesson?.activities || [];
  const theme = subjectTheme(lesson?.subject);
  const isEarlyGrade = Number(lesson?.gradeLevel || 4) <= 2;

  if (isEarlyGrade) {
    return (
      <EarlyLessonScreen
        lesson={lesson}
        feedback={feedback}
        go={go}
        completeLesson={completeLesson}
        submitMcq={submitMcq}
        submitWriting={submitWriting}
        submitSpeech={submitSpeech}
        data={data}
        openLesson={openLesson}
      />
    );
  }

  function speakLesson() {
    const text = `${lesson?.title || ''}. ${lesson?.instructions || ''}. ${lesson?.passage || ''}`;
    speechSynthesis.cancel();
    speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }

  return (
    <>
      <div className="top-nav">
        <button className="btn btn-outline btn-sm" onClick={() => go('screen-lessons')}>
          ← Back
        </button>

        <div className="logo">
          {isEarlyGrade ? '🌈 Learning Mission' : '📘 Lesson Workspace'}
        </div>

        <div className="pill">
          ⚡ +{lesson?.xpReward || 0} XP
        </div>
      </div>

      <div className="scroll">
        <div
          className="card"
          style={{
            background: isEarlyGrade
              ? `linear-gradient(135deg, ${theme.bg}, #ffffff)`
              : '#ffffff',
            border: `2px solid ${theme.accent}`,
          }}
        >
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
            <div>
              <div
                className="pill"
                style={{
                  background: theme.accent,
                  color: 'white',
                  marginBottom: 10,
                }}
              >
                Grade {lesson?.gradeLevel || '—'} • {lesson?.subject || 'Filipino'}
              </div>

              <h2 style={{ margin: '4px 0 8px', fontSize: isEarlyGrade ? 30 : 24 }}>
                {isEarlyGrade ? '🌟 ' : ''}{lesson?.title || 'Lesson'}
              </h2>

              <div className="muted" style={{ fontSize: isEarlyGrade ? 17 : 14 }}>
                {isEarlyGrade
                  ? 'Makinig, magbasa, at sagutin ang gawain. Kaya mo ito!'
                  : 'Read the lesson carefully, complete the activities, and track your progress.'}
              </div>
            </div>

            <div style={{ fontSize: isEarlyGrade ? 64 : 44 }}>
              {theme.icon || '📘'}
            </div>
          </div>

          <div className="divider" />

          <div className="grid grid-3">
            <Stat icon="📖" label="Type" value={theme.tag || 'Aralin'} />
            <Stat icon="🎯" label="Activities" value={activities.length} />
            <Stat icon="⚡" label="Reward" value={`+${lesson?.xpReward || 0}`} />
          </div>
        </div>

        <div className="card">
          <div className="section-title">
            {isEarlyGrade ? '1️⃣ Makinig at Basahin' : '1. Read the Lesson'}
          </div>

          {lesson?.instructions && (
            <div
              style={{
                padding: 14,
                borderRadius: 16,
                background: isEarlyGrade ? '#FFF8CF' : '#F8FAFF',
                marginBottom: 12,
                lineHeight: 1.6,
                fontSize: isEarlyGrade ? 18 : 15,
              }}
            >
              <b>{isEarlyGrade ? 'Panuto:' : 'Instructions:'}</b> {lesson.instructions}
            </div>
          )}

          {lesson?.passage ? (
            <div
              style={{
                padding: isEarlyGrade ? 20 : 18,
                borderRadius: 18,
                background: isEarlyGrade ? '#F8FAFF' : '#FFFFFF',
                border: '1px solid #E1E7FF',
                lineHeight: isEarlyGrade ? 1.9 : 1.75,
                fontSize: isEarlyGrade ? 21 : 16,
              }}
            >
              {lesson.passage}
            </div>
          ) : (
            <div className="muted">No passage added for this lesson yet.</div>
          )}

          <div className="divider" />

          <div className="row">
            <button className="btn btn-blue" onClick={speakLesson}>
              🔊 {isEarlyGrade ? 'Pakinggan' : 'Listen'}
            </button>

            <button className="btn btn-outline" onClick={() => speechSynthesis.cancel()}>
              ⏹ Stop
            </button>
          </div>
        </div>

        {feedback && (
          <div
            className="card"
            style={{
              border: feedback.includes('Tama') || feedback.includes('Na-save') || feedback.includes('Naisumite')
                ? '2px solid #2ECC71'
                : '2px solid #E67E22',
              background: feedback.includes('Tama') ? '#E9FBEF' : '#FFFFFF',
            }}
          >
            <div className="section-title">
              {isEarlyGrade ? '⭐ Feedback' : 'Feedback'}
            </div>

            <div style={{ fontSize: isEarlyGrade ? 20 : 16, fontWeight: 700 }}>
              {feedback}
            </div>
          </div>
        )}

        <div className="card">
          <div className="section-title">
            {isEarlyGrade ? '2️⃣ Sagutan ang Activities' : '2. Complete the Activities'}
          </div>

          <div className="muted">
            {activities.length
              ? isEarlyGrade
                ? 'Piliin, isulat, o bigkasin ang iyong sagot.'
                : 'Answer the quiz, writing, and oral practice activities below.'
              : 'Wala pang activities para sa lesson na ito.'}
          </div>

          <div className="divider" />

          {activities.map((activity, index) => (
            <ActivityCard
              key={activity.id || index}
              activity={activity}
              index={index}
              total={activities.length}
              isEarlyGrade={isEarlyGrade}
              submitMcq={submitMcq}
              submitWriting={submitWriting}
              submitSpeech={submitSpeech}
            />
          ))}
        </div>

        <div className="card">
          <StudentSelfEvaluation isEarlyGrade={false} />
        </div>

        <div
          className="card"
          style={{
            border: '2px solid #2ECC71',
            background: isEarlyGrade ? '#F0FFF5' : '#FFFFFF',
          }}
        >
          <div className="section-title">
            {isEarlyGrade ? '3️⃣ Tapusin ang Lesson' : '3. Finish Lesson'}
          </div>

          <div className="muted">
            Kapag tapos ka na, pindutin ito para maitala ang iyong progress at XP.
          </div>

          <div className="divider" />

          <button className="btn btn-green" onClick={completeLesson}>
            ✅ Mark as Completed
          </button>
        </div>
      </div>
    </>
  );
}


function StudentSelfEvaluation({ isEarlyGrade = false }) {
  const [answers, setAnswers] = useState({});

  const questions = isEarlyGrade
    ? [
        { id: 'understand', label: 'Naintindihan ko ang lesson.', options: ['😊 Oo', '😐 Konti lang', '😟 Hindi pa'] },
        { id: 'practice', label: 'Kaya kong subukan ulit ang activity.', options: ['⭐ Kaya ko', '🌱 Kailangan pa', '🧑‍🏫 Help po'] }
      ]
    : [
        { id: 'understand', label: 'I understood the lesson.', options: ['Strongly agree', 'Agree', 'Need review'] },
        { id: 'useful', label: 'The activity helped me practice Filipino.', options: ['Strongly agree', 'Agree', 'Need review'] },
        { id: 'confidence', label: 'I feel ready for a short quiz or task.', options: ['Ready', 'Almost ready', 'Need support'] }
      ];

  const answered = Object.keys(answers).length;
  const complete = answered === questions.length;

  return (
    <div
      style={{
        borderRadius: isEarlyGrade ? 30 : 22,
        padding: isEarlyGrade ? 24 : 20,
        background: 'linear-gradient(135deg, #fff8cf, #f0fff5)',
        border: '2px solid rgba(246, 196, 83, 0.34)',
        boxShadow: '0 14px 28px rgba(39, 87, 63, 0.06)'
      }}
    >
      <div className="section-title" style={{ fontSize: isEarlyGrade ? 28 : 22, marginBottom: 8 }}>
        {isEarlyGrade ? '🌟 Quick Check' : '🧾 Lesson Evaluation'}
      </div>
      <p className={isEarlyGrade ? 'g12-muted' : 'muted'} style={{ marginBottom: 16 }}>
        {isEarlyGrade
          ? 'Sagutin ito para malaman ni teacher kung madali o mahirap ang lesson.'
          : 'This self-check helps teachers see if the lesson is clear, useful, and ready for assessment.'}
      </p>

      <div style={{ display: 'grid', gap: 14 }}>
        {questions.map(question => (
          <div key={question.id}>
            <strong style={{ display: 'block', marginBottom: 8, color: '#14223b', fontSize: isEarlyGrade ? 18 : 15 }}>
              {question.label}
            </strong>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {question.options.map(option => (
                <button
                  key={option}
                  type="button"
                  className={answers[question.id] === option ? 'btn btn-green' : 'btn btn-outline'}
                  onClick={() => setAnswers(prev => ({ ...prev, [question.id]: option }))}
                  style={{
                    minHeight: isEarlyGrade ? 54 : 42,
                    borderRadius: isEarlyGrade ? 20 : 14,
                    fontSize: isEarlyGrade ? 17 : 14,
                    fontWeight: 900
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {complete && (
        <div
          style={{
            marginTop: 16,
            padding: 14,
            borderRadius: 18,
            background: '#E9FBEF',
            color: '#0d7f48',
            fontWeight: 900
          }}
        >
          ✅ {isEarlyGrade ? 'Salamat! Nakita ni teacher ang self-check mo.' : 'Evaluation saved in this session. Backend storage can be connected for reports.'}
        </div>
      )}
    </div>
  );
}



function cleanLessonTextForKids(text = '') {
  return String(text || '')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractSectionFromLessonPlan(raw = '', startLabels = [], endLabels = []) {
  const text = cleanLessonTextForKids(raw);
  if (!text) return '';

  const lower = text.toLowerCase();
  let startIndex = -1;
  let matchedLabel = '';

  for (const label of startLabels) {
    const idx = lower.indexOf(label.toLowerCase());
    if (idx !== -1 && (startIndex === -1 || idx < startIndex)) {
      startIndex = idx;
      matchedLabel = label;
    }
  }

  if (startIndex === -1) return '';

  let contentStart = startIndex + matchedLabel.length;
  if (text[contentStart] === ':') contentStart += 1;

  let endIndex = text.length;
  const afterStart = lower.slice(contentStart);

  for (const label of endLabels) {
    const idx = afterStart.indexOf(label.toLowerCase());
    if (idx !== -1) {
      endIndex = Math.min(endIndex, contentStart + idx);
    }
  }

  return cleanLessonTextForKids(text.slice(contentStart, endIndex));
}

function makeStudentFriendlyPassage(lesson) {
  const raw = cleanLessonTextForKids(lesson?.passage || lesson?.instructions || lesson?.title || '');
  if (!raw) return 'Makinig, magbasa, at sagutin ang gawain. Kaya mo ito!';

  const extracted = extractSectionFromLessonPlan(
    raw,
    ['Main Lesson / Passage', 'Main Lesson', 'Passage', 'Lesson Content'],
    ['Vocabulary Words', 'Mini Quiz', 'Matching Activity', 'Writing Activity', 'Speech Practice', 'Teacher Notes']
  );

  const source = extracted || raw
    .replace(/TUKLAS TALINO SAMPLE LESSON PLAN/gi, '')
    .replace(/Subject:\s*[^.\n]+/gi, '')
    .replace(/Grade Level:\s*[^.\n]+/gi, '')
    .replace(/Module:\s*[^.\n]+/gi, '')
    .replace(/Lesson Title:\s*/gi, '')
    .replace(/Estimated Duration:\s*[^.\n]+/gi, '')
    .replace(/XP Reward:\s*[^.\n]+/gi, '')
    .replace(/Learning Objectives:\s*/gi, '');

  const sentences = cleanLessonTextForKids(source)
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(item => item.trim())
    .filter(Boolean)
    .filter(item => !/^(pagkatapos|teacher notes|correct answer|question\s*\d+)/i.test(item));

  const shortText = sentences.slice(0, 4).join(' ');
  const fallback = cleanLessonTextForKids(source).split('\n').slice(0, 4).join(' ');

  return cleanLessonTextForKids(shortText || fallback || source).slice(0, 520);
}

function activityMissionMeta(activity, index = 0) {
  const map = {
    infographic: { icon: '🖼️', label: 'Tingnan' },
    vocabulary: { icon: '🔤', label: 'Salita' },
    matching: { icon: '🧩', label: 'Pares' },
    mcq: { icon: '🎮', label: 'Quiz' },
    speech: { icon: '🎤', label: 'Bigkas' },
    writing: { icon: '✍️', label: 'Sulatin' }
  };

  return map[activity?.type] || { icon: ['⭐', '🌟', '✨'][index % 3], label: 'Gawain' };
}

function EarlyLessonScreen({ lesson, feedback, go, completeLesson, submitMcq, submitWriting, submitSpeech, data, openLesson }) {
  const activities = lesson?.activities || [];
  const theme = subjectTheme(lesson?.subject);
  const [missionStep, setMissionStep] = useState(0);
  const [rewardModal, setRewardModal] = useState(null);
  const [rewardClaimed, setRewardClaimed] = useState(Boolean(lesson?.completed));

  useEffect(() => {
    setMissionStep(0);
    setRewardModal(null);
    setRewardClaimed(Boolean(lesson?.completed));
  }, [lesson?.id, lesson?.completed]);

  const kidPassage = makeStudentFriendlyPassage(lesson);
  const isReviewMode = Boolean(lesson?.completed || rewardClaimed);
  const missionSteps = [
    { type: 'listen', icon: '👂', label: 'Makinig' },
    { type: 'read', icon: '📖', label: 'Basahin' },
    ...activities.map((activity, index) => ({
      type: 'activity',
      activity,
      activityIndex: index,
      ...activityMissionMeta(activity, index)
    })),
    { type: 'finish', icon: isReviewMode ? '✅' : '⭐', label: isReviewMode ? 'Review' : 'Tapos' }
  ];

  const safeStep = Math.min(missionStep, missionSteps.length - 1);
  const currentStep = missionSteps[safeStep];
  const progress = Math.round(((safeStep + 1) / Math.max(1, missionSteps.length)) * 100);

  function goNext() {
    if (rewardModal) return;
    setMissionStep(step => Math.min(step + 1, missionSteps.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goBackStep() {
    if (rewardModal || rewardClaimed) return;
    setMissionStep(step => Math.max(step - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function findNextLesson() {
    const lessons = asArray(data?.lessons);
    const currentId = Number(lesson?.id || 0);
    const pending = lessons.filter(item => !item.completed && Number(item.id || 0) !== currentId);
    return pending.find(item => item.subject === lesson?.subject) || pending[0] || null;
  }

  async function claimReward() {
    if (rewardClaimed) return;

    const result = await completeLesson({ stay: true, silent: true });
    if (!result) return;

    const xpEarned = Number(result.xpAwarded ?? lesson?.xpReward ?? 0);
    setRewardClaimed(true);
    setMissionStep(missionSteps.length - 1);
    speechSynthesis.cancel();
    setRewardModal({ xp: xpEarned });
  }

  function goHomeAfterReward() {
    setRewardModal(null);
    go('screen-student');
  }

  function goNextAfterReward() {
    const nextLesson = findNextLesson();
    setRewardModal(null);

    if (nextLesson && typeof openLesson === 'function') {
      openLesson(nextLesson);
      return;
    }

    go('screen-student');
  }

  function speakLesson() {
    const text = `${lesson?.title || ''}. ${lesson?.instructions || ''}. ${kidPassage}`;
    speechSynthesis.cancel();
    speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }

  if (lesson?.completed && !rewardModal) {
    const nextLesson = findNextLesson();
    const summaryItems = [
      { icon: theme.icon || '📘', label: lesson?.subject || 'Filipino' },
      { icon: '⚡', label: `${lesson?.xpReward || 0} XP earned` },
      { icon: '🎯', label: `${activities.length} activit${activities.length === 1 ? 'y' : 'ies'}` }
    ];

    return (
      <EarlyStudentChrome
        data={data}
        activeTab="lessons"
        go={go}
        icon="✅"
        title="Lesson Summary"
        subtitle="Completed lesson only. Step-by-step mission is closed."
      >
        <style>{`
          .g12-complete-summary {
            max-width: 980px;
            margin: 0 auto;
            display: grid;
            gap: 18px;
          }

          .g12-complete-hero {
            position: relative;
            overflow: hidden;
            border-radius: 38px;
            padding: 38px 34px;
            background:
              radial-gradient(circle at 14% 18%, rgba(255, 236, 163, 0.78), transparent 28%),
              radial-gradient(circle at 88% 18%, rgba(219, 234, 254, 0.74), transparent 30%),
              linear-gradient(135deg, #ffffff, #f0fff5);
            border: 3px solid rgba(71, 206, 135, 0.28);
            box-shadow: 0 20px 46px rgba(39, 87, 63, 0.09);
            text-align: center;
          }

          .g12-complete-badge {
            width: 128px;
            height: 128px;
            margin: 0 auto 18px;
            border-radius: 42px;
            display: grid;
            place-items: center;
            background: #fff3bd;
            font-size: 76px;
            box-shadow: inset 0 0 0 3px rgba(246, 196, 83, 0.22), 0 18px 34px rgba(245, 158, 11, 0.13);
          }

          .g12-complete-hero h2 {
            margin: 0;
            color: #15965a;
            font-size: clamp(42px, 5vw, 66px);
            line-height: 0.95;
            letter-spacing: -0.06em;
            font-weight: 1000;
          }

          .g12-complete-hero p {
            margin: 12px auto 0;
            max-width: 720px;
            color: #425a7c;
            font-size: 20px;
            font-weight: 900;
            line-height: 1.5;
          }

          .g12-summary-chip-row {
            margin-top: 24px;
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 12px;
          }

          .g12-summary-chip {
            min-height: 56px;
            padding: 0 20px;
            border-radius: 20px;
            display: inline-flex;
            align-items: center;
            gap: 10px;
            background: rgba(255, 255, 255, 0.86);
            border: 1px solid rgba(246, 196, 83, 0.34);
            color: #14223b;
            font-size: 17px;
            font-weight: 1000;
          }

          .g12-summary-card {
            padding: 30px;
            border-radius: 34px;
            background: rgba(255, 255, 255, 0.96);
            border: 1px solid rgba(31, 154, 92, 0.08);
            box-shadow: 0 16px 34px rgba(39, 87, 63, 0.07);
          }

          .g12-summary-card h3 {
            margin: 0 0 14px;
            color: #15965a;
            font-size: clamp(28px, 3.2vw, 42px);
            letter-spacing: -0.045em;
            font-weight: 1000;
          }

          .g12-summary-text {
            border-radius: 28px;
            padding: 24px;
            background: #f8fcff;
            border: 1px solid #e1eefe;
            color: #1f2d45;
            font-size: clamp(22px, 2.5vw, 32px);
            line-height: 1.55;
            font-weight: 950;
          }

          .g12-summary-actions {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 12px;
          }

          .g12-summary-btn {
            border: 0;
            min-height: 64px;
            padding: 0 28px;
            border-radius: 24px;
            background: linear-gradient(135deg, #47ce87, #1f9c60);
            color: white;
            font-size: 20px;
            font-weight: 1000;
            cursor: pointer;
            box-shadow: 0 14px 22px rgba(32, 156, 96, 0.16);
          }

          .g12-summary-btn.secondary {
            background: #ffffff;
            color: #14975a;
            border: 2px solid #2fbf73;
            box-shadow: none;
          }

          .g12-summary-btn.purple {
            background: linear-gradient(135deg, #a770ef, #7b4fd6);
          }

          /* Grade 1-2 completed-summary balanced font sizing. */
          .g12-complete-hero {
            padding: 30px 28px;
            border-radius: 34px;
          }

          .g12-complete-badge {
            width: 96px;
            height: 96px;
            border-radius: 32px;
            font-size: 56px;
          }

          .g12-complete-hero h2 {
            font-size: clamp(32px, 4vw, 48px);
            line-height: 1;
          }

          .g12-complete-hero p {
            font-size: 17px;
          }

          .g12-summary-chip {
            min-height: 46px;
            padding: 0 16px;
            border-radius: 18px;
            font-size: 15px;
          }

          .g12-summary-card {
            padding: 24px;
            border-radius: 30px;
          }

          .g12-summary-card h3 {
            font-size: clamp(24px, 3vw, 34px);
          }

          .g12-summary-text {
            padding: 22px;
            border-radius: 24px;
            font-size: clamp(18px, 2.1vw, 24px);
            line-height: 1.6;
          }

          .g12-summary-btn {
            min-height: 54px;
            padding: 0 22px;
            border-radius: 20px;
            font-size: 17px;
          }

        `}</style>

        <div className="g12-complete-summary">
          <section className="g12-complete-hero">
            <div className="g12-complete-badge">✅</div>
            <h2>Lesson Completed!</h2>
            <p>{lesson?.title || 'Natapos mo na ang lesson na ito.'}</p>
            <div className="g12-summary-chip-row">
              {summaryItems.map(item => (
                <span className="g12-summary-chip" key={item.label}>
                  <span>{item.icon}</span>
                  {item.label}
                </span>
              ))}
            </div>
          </section>

          <section className="g12-summary-card">
            <h3>Maikling Summary</h3>
            <div className="g12-summary-text">
              {kidPassage}
            </div>
          </section>

          <div className="g12-summary-actions">
            {nextLesson && (
              <button type="button" className="g12-summary-btn purple" onClick={() => openLesson(nextLesson)}>
                Susunod na Lesson →
              </button>
            )}
            <button type="button" className="g12-summary-btn" onClick={() => go('screen-student')}>
              🏠 Home
            </button>
            <button type="button" className="g12-summary-btn secondary" onClick={() => go('screen-lessons')}>
              📖 More Lessons
            </button>
          </div>
        </div>
      </EarlyStudentChrome>
    );
  }

  return (
    <EarlyStudentChrome
      data={data}
      activeTab="lessons"
      go={go}
      icon={theme.icon || '📘'}
      title="Learning Mission"
      subtitle={`${lesson?.subject || 'Filipino'} • Grade ${lesson?.gradeLevel || '—'} • ${isReviewMode ? 'Review Mode' : `+${lesson?.xpReward || 0} XP`}`}
    >
      <style>{`
        .g12-mission-wrap {
          display: grid;
          gap: 18px;
        }

        .g12-mission-banner {
          position: relative;
          overflow: hidden;
          border-radius: 34px;
          padding: 26px 30px;
          background:
            radial-gradient(circle at 8% 22%, rgba(255, 236, 163, 0.72), transparent 30%),
            radial-gradient(circle at 88% 18%, rgba(219, 234, 254, 0.75), transparent 32%),
            linear-gradient(135deg, ${theme.bg || '#eaf8ef'}, #ffffff);
          border: 1px solid rgba(31, 154, 92, 0.10);
          box-shadow: 0 16px 32px rgba(39, 87, 63, 0.06);
        }

        .g12-mission-banner::after {
          content: '✨';
          position: absolute;
          right: 28px;
          top: 20px;
          font-size: 34px;
          opacity: 0.85;
        }

        .g12-mission-topline {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }

        .g12-mission-topline h2 {
          margin: 0;
          color: #15965a;
          font-size: clamp(34px, 4vw, 54px);
          line-height: 0.95;
          letter-spacing: -0.06em;
          font-weight: 1000;
        }

        .g12-mission-topline p {
          margin: 8px 0 0;
          color: #425a7c;
          font-size: 17px;
          font-weight: 900;
        }

        .g12-mission-xp {
          min-width: 150px;
          min-height: 62px;
          padding: 0 20px;
          border-radius: 24px;
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.82);
          color: #14223b;
          font-size: 23px;
          font-weight: 1000;
          border: 2px solid rgba(255, 217, 102, 0.35);
        }

        .g12-mission-path {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(86px, 1fr));
          gap: 10px;
          margin-top: 16px;
        }

        .g12-mission-dot {
          border: 0;
          min-height: 74px;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.74);
          color: #24324a;
          display: grid;
          place-items: center;
          gap: 3px;
          cursor: pointer;
          box-shadow: inset 0 0 0 1px rgba(31, 154, 92, 0.08);
        }

        .g12-mission-dot span {
          font-size: 28px;
          line-height: 1;
        }

        .g12-mission-dot small {
          font-size: 12px;
          font-weight: 1000;
        }

        .g12-mission-dot.done {
          background: #e9fbef;
          color: #0d8b4e;
        }

        .g12-mission-dot.active {
          background: #fff4c7;
          color: #14223b;
          box-shadow: inset 0 0 0 3px rgba(246, 196, 83, 0.28), 0 10px 18px rgba(245, 158, 11, 0.10);
        }

        .g12-mission-card {
          min-height: 420px;
          border-radius: 36px;
          padding: 34px;
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid rgba(31, 154, 92, 0.08);
          box-shadow: 0 16px 34px rgba(39, 87, 63, 0.07);
          display: grid;
          gap: 22px;
        }

        .g12-mission-step-head {
          display: grid;
          grid-template-columns: 92px minmax(0, 1fr);
          gap: 20px;
          align-items: center;
        }

        .g12-mission-big-icon {
          width: 92px;
          height: 92px;
          border-radius: 30px;
          display: grid;
          place-items: center;
          font-size: 50px;
          background: #fff5cf;
          box-shadow: inset 0 0 0 2px rgba(246, 196, 83, 0.20);
        }

        .g12-mission-step-head h3 {
          margin: 0;
          color: #15965a;
          font-size: clamp(34px, 4vw, 52px);
          line-height: 0.95;
          letter-spacing: -0.055em;
          font-weight: 1000;
        }

        .g12-mission-step-head p {
          margin: 8px 0 0;
          color: #425a7c;
          font-size: 18px;
          font-weight: 900;
        }

        .g12-mission-text-card {
          border-radius: 30px;
          padding: 26px;
          background:
            radial-gradient(circle at 94% 12%, rgba(255, 231, 128, 0.34), transparent 20%),
            #f8fcff;
          border: 1px solid #e1eefe;
          color: #1f2d45;
          font-size: clamp(26px, 3vw, 38px);
          line-height: 1.55;
          font-weight: 950;
        }

        .g12-mission-note {
          border-radius: 24px;
          padding: 18px 20px;
          background: #fff8cf;
          color: #27344c;
          font-size: 18px;
          line-height: 1.5;
          font-weight: 850;
        }

        .g12-mission-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          justify-content: space-between;
        }

        .g12-mission-actions-left,
        .g12-mission-actions-right {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .g12-mission-btn {
          border: 0;
          min-height: 64px;
          padding: 0 28px;
          border-radius: 24px;
          background: linear-gradient(135deg, #47ce87, #1f9c60);
          color: white;
          font-size: 20px;
          font-weight: 1000;
          cursor: pointer;
          box-shadow: 0 14px 22px rgba(32, 156, 96, 0.16);
        }

        .g12-mission-btn.secondary {
          background: #ffffff;
          color: #14975a;
          border: 2px solid #2fbf73;
          box-shadow: none;
        }

        .g12-mission-btn.purple {
          background: linear-gradient(135deg, #a770ef, #7b4fd6);
        }

        .g12-mission-activity {
          border-radius: 30px;
          overflow: hidden;
        }

        .g12-mission-activity .card {
          margin: 0 !important;
          border-radius: 30px !important;
          box-shadow: none !important;
        }

        .g12-mission-feedback {
          padding: 16px 18px;
          border-radius: 22px;
          background: #e9fbef;
          color: #0d7f48;
          font-size: 20px;
          font-weight: 1000;
          border: 1px solid #bfeacb;
        }

        .g12-finish-card {
          min-height: 260px;
          border-radius: 32px;
          display: grid;
          place-items: center;
          text-align: center;
          padding: 28px;
          background:
            radial-gradient(circle at 50% 18%, rgba(255, 235, 156, 0.58), transparent 30%),
            linear-gradient(135deg, #f0fff5, #ffffff);
          border: 2px solid #8ce0ae;
        }

        .g12-finish-card .big {
          font-size: 78px;
          line-height: 1;
          margin-bottom: 12px;
        }

        .g12-finish-card h3 {
          margin: 0;
          color: #15965a;
          font-size: clamp(34px, 4vw, 54px);
          letter-spacing: -0.055em;
        }

        .g12-finish-card p {
          margin: 10px 0 0;
          color: #425a7c;
          font-size: 20px;
          font-weight: 900;
        }

        .g12-reward-overlay {
          position: fixed;
          inset: 0;
          z-index: 250;
          display: grid;
          place-items: center;
          padding: 24px;
          background: rgba(18, 28, 48, 0.40);
          backdrop-filter: blur(10px);
        }

        .g12-reward-modal {
          position: relative;
          width: min(620px, 100%);
          overflow: hidden;
          border-radius: 40px;
          padding: 42px 36px 34px;
          text-align: center;
          background:
            radial-gradient(circle at 20% 18%, rgba(255, 241, 179, 0.92), transparent 26%),
            radial-gradient(circle at 82% 22%, rgba(219, 234, 254, 0.90), transparent 26%),
            linear-gradient(135deg, #ffffff, #fff8dd 58%, #f0fff5);
          border: 3px solid rgba(255, 217, 102, 0.72);
          box-shadow: 0 28px 70px rgba(20, 34, 59, 0.24);
          animation: g12RewardPop 0.35s ease-out both;
        }

        .g12-reward-modal::before,
        .g12-reward-modal::after {
          content: '';
          position: absolute;
          width: 170px;
          height: 170px;
          border-radius: 999px;
          background: rgba(255, 224, 102, 0.25);
          pointer-events: none;
        }

        .g12-reward-modal::before {
          left: -72px;
          top: -62px;
        }

        .g12-reward-modal::after {
          right: -78px;
          bottom: -82px;
          background: rgba(71, 206, 135, 0.18);
        }

        .g12-reward-big {
          position: relative;
          z-index: 2;
          width: 132px;
          height: 132px;
          margin: 0 auto 16px;
          border-radius: 42px;
          display: grid;
          place-items: center;
          background: #fff3bd;
          font-size: 78px;
          box-shadow: inset 0 0 0 3px rgba(246, 196, 83, 0.25), 0 18px 34px rgba(245, 158, 11, 0.14);
          animation: g12RewardBounce 0.95s ease-in-out infinite;
        }

        .g12-reward-modal h3 {
          position: relative;
          z-index: 2;
          margin: 0;
          color: #15965a;
          font-size: clamp(42px, 5vw, 64px);
          line-height: 0.95;
          letter-spacing: -0.06em;
          font-weight: 1000;
        }

        .g12-reward-modal p {
          position: relative;
          z-index: 2;
          margin: 12px 0 0;
          color: #31486b;
          font-size: 20px;
          font-weight: 900;
        }

        .g12-reward-xp {
          position: relative;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          min-height: 76px;
          margin: 22px auto 20px;
          padding: 0 34px;
          border-radius: 28px;
          background: #ffffff;
          color: #14223b;
          font-size: 35px;
          font-weight: 1000;
          box-shadow: 0 14px 30px rgba(20, 34, 59, 0.10);
          border: 2px solid rgba(255, 217, 102, 0.50);
        }

        .g12-reward-actions {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .g12-confetti-piece {
          position: absolute;
          z-index: 1;
          top: -20px;
          font-size: 28px;
          animation: g12ConfettiFall 2.8s linear infinite;
          pointer-events: none;
        }

        .g12-confetti-piece:nth-child(1) { left: 8%; animation-delay: 0s; }
        .g12-confetti-piece:nth-child(2) { left: 20%; animation-delay: 0.35s; }
        .g12-confetti-piece:nth-child(3) { left: 34%; animation-delay: 0.7s; }
        .g12-confetti-piece:nth-child(4) { left: 48%; animation-delay: 0.15s; }
        .g12-confetti-piece:nth-child(5) { left: 64%; animation-delay: 0.55s; }
        .g12-confetti-piece:nth-child(6) { left: 78%; animation-delay: 0.95s; }
        .g12-confetti-piece:nth-child(7) { left: 90%; animation-delay: 0.25s; }


        /* Grade 1-2 lesson mission balanced font sizing. */
        .g12-mission-banner {
          padding: 24px 26px;
          border-radius: 32px;
        }

        .g12-mission-topline h2 {
          font-size: clamp(28px, 3.4vw, 42px);
          line-height: 1;
        }

        .g12-mission-topline p {
          font-size: 16px;
          line-height: 1.45;
        }

        .g12-mission-xp {
          min-width: 132px;
          min-height: 54px;
          border-radius: 20px;
          font-size: 19px;
        }

        .g12-mission-dot {
          min-height: 62px;
          border-radius: 20px;
        }

        .g12-mission-dot span {
          font-size: 24px;
        }

        .g12-mission-card {
          min-height: 360px;
          padding: 28px;
          border-radius: 32px;
        }

        .g12-mission-step-head {
          grid-template-columns: 78px minmax(0, 1fr);
          gap: 18px;
        }

        .g12-mission-big-icon {
          width: 78px;
          height: 78px;
          border-radius: 26px;
          font-size: 42px;
        }

        .g12-mission-step-head h3 {
          font-size: clamp(28px, 3.4vw, 40px);
          line-height: 1;
        }

        .g12-mission-step-head p {
          font-size: 16px;
          line-height: 1.45;
        }

        .g12-mission-text-card {
          padding: 24px;
          border-radius: 26px;
          font-size: clamp(20px, 2.4vw, 28px);
          line-height: 1.6;
        }

        .g12-mission-note {
          padding: 16px 18px;
          border-radius: 22px;
          font-size: 16px;
        }

        .g12-mission-btn {
          min-height: 54px;
          padding: 0 22px;
          border-radius: 20px;
          font-size: 17px;
        }

        .g12-mission-feedback {
          font-size: 17px;
        }

        .g12-finish-card .big {
          font-size: 58px;
        }

        .g12-finish-card h3 {
          font-size: clamp(28px, 3.4vw, 42px);
        }

        .g12-finish-card p {
          font-size: 17px;
        }

        .g12-reward-modal {
          width: min(560px, 100%);
          padding: 34px 30px 30px;
          border-radius: 34px;
        }

        .g12-reward-big {
          width: 102px;
          height: 102px;
          border-radius: 34px;
          font-size: 58px;
        }

        .g12-reward-modal h3 {
          font-size: clamp(32px, 4vw, 48px);
          line-height: 1;
        }

        .g12-reward-modal p {
          font-size: 17px;
        }

        .g12-reward-xp {
          min-height: 60px;
          padding: 0 26px;
          border-radius: 24px;
          font-size: 26px;
        }

        @keyframes g12RewardPop {
          from { opacity: 0; transform: scale(0.88) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        @keyframes g12RewardBounce {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-8px) rotate(2deg); }
        }

        @keyframes g12ConfettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
          12% { opacity: 1; }
          100% { transform: translateY(620px) rotate(360deg); opacity: 0; }
        }

        @media (max-width: 760px) {
          .g12-mission-banner,
          .g12-mission-card {
            padding: 22px;
            border-radius: 28px;
          }

          .g12-mission-topline,
          .g12-mission-step-head {
            grid-template-columns: 1fr;
          }

          .g12-mission-step-head {
            gap: 12px;
          }

          .g12-mission-big-icon {
            width: 76px;
            height: 76px;
            font-size: 40px;
            border-radius: 24px;
          }

          .g12-mission-actions,
          .g12-mission-actions-left,
          .g12-mission-actions-right {
            align-items: stretch;
            flex-direction: column;
          }

          .g12-mission-btn {
            width: 100%;
          }
        }
      `}</style>

      <div className="g12-mission-wrap">
        {rewardModal && (
          <div className="g12-reward-overlay" role="dialog" aria-modal="true" aria-label="Mission reward">
            <div className="g12-reward-modal">
              {['🎊', '⭐', '✨', '🌟', '🎉', '💛', '🌈'].map((piece, index) => (
                <span className="g12-confetti-piece" key={index}>{piece}</span>
              ))}

              <div className="g12-reward-big">🏆</div>
              <h3>Mission Complete!</h3>
              <p>Ang galing mo! Natapos mo ang aralin.</p>
              <div className="g12-reward-xp">⚡ +{rewardModal.xp || 0} XP</div>

              <div className="g12-reward-actions">
                <button type="button" className="g12-mission-btn purple" onClick={goNextAfterReward}>
                  Susunod na Lesson →
                </button>
                <button type="button" className="g12-mission-btn secondary" onClick={goHomeAfterReward}>
                  🏠 Home
                </button>
              </div>
            </div>
          </div>
        )}

        <section className="g12-mission-banner">
          <div className="g12-mission-topline">
            <div>
              <h2>{lesson?.title || 'Aralin'} 🌟</h2>
              <p>{lesson?.subject || 'Filipino'} mission • Step {safeStep + 1} of {missionSteps.length}</p>
            </div>
            <div className="g12-mission-xp">⚡ +{lesson?.xpReward || 0} XP</div>
          </div>

          <div className="g12-progress-track">
            <span className="g12-progress-fill" style={{ width: `${progress}%` }} />
          </div>

          <div className="g12-mission-path" aria-label="Mission steps">
            {missionSteps.map((step, index) => (
              <button
                type="button"
                key={`${step.type}-${index}`}
                className={`g12-mission-dot ${index < safeStep ? 'done' : ''} ${index === safeStep ? 'active' : ''}`}
                onClick={() => !rewardClaimed && !rewardModal && setMissionStep(index)}
              >
                <span>{step.icon}</span>
                <small>{step.label}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="g12-mission-card">
          {currentStep.type === 'listen' && (
            <>
              <div className="g12-mission-step-head">
                <div className="g12-mission-big-icon">👂</div>
                <div>
                  <h3>Makinig muna</h3>
                  <p>Pindutin ang speaker. Pakinggan ang aralin bago sumagot.</p>
                </div>
              </div>

              {lesson?.instructions && (
                <div className="g12-mission-note">
                  <b>Panuto:</b> {lesson.instructions}
                </div>
              )}

              <div className="g12-mission-text-card">
                {lesson?.title || 'Handa ka na bang matuto?'}
              </div>

              <div className="g12-mission-actions">
                <div className="g12-mission-actions-left">
                  <button className="g12-mission-btn" onClick={speakLesson}>🔊 Pakinggan</button>
                  <button className="g12-mission-btn secondary" onClick={() => speechSynthesis.cancel()}>⏹ Stop</button>
                </div>
                <div className="g12-mission-actions-right">
                  <button className="g12-mission-btn purple" onClick={goNext}>Susunod →</button>
                </div>
              </div>
            </>
          )}

          {currentStep.type === 'read' && (
            <>
              <div className="g12-mission-step-head">
                <div className="g12-mission-big-icon">📖</div>
                <div>
                  <h3>Basahin natin</h3>
                  <p>Maikli lang ito. Basahin nang dahan-dahan.</p>
                </div>
              </div>

              <div className="g12-mission-text-card">
                {kidPassage}
              </div>

              <div className="g12-mission-actions">
                <div className="g12-mission-actions-left">
                  <button className="g12-mission-btn secondary" onClick={goBackStep}>← Balik</button>
                  <button className="g12-mission-btn" onClick={speakLesson}>🔊 Pakinggan</button>
                </div>
                <div className="g12-mission-actions-right">
                  <button className="g12-mission-btn purple" onClick={goNext}>
                    Gawin ang Activity →
                  </button>
                </div>
              </div>
            </>
          )}

          {currentStep.type === 'activity' && (
            <>
              <div className="g12-mission-step-head">
                <div className="g12-mission-big-icon">{currentStep.icon}</div>
                <div>
                  <h3>{currentStep.label}</h3>
                  <p>Tapikin ang sagot o gawin ang gawain. Kaya mo ito!</p>
                </div>
              </div>

              {feedback && (
                <div className="g12-mission-feedback">
                  {feedback.includes('+') ? feedback : `${feedback} ⭐`}
                </div>
              )}

              <div className="g12-mission-activity">
                <ActivityCard
                  activity={currentStep.activity}
                  index={currentStep.activityIndex}
                  total={activities.length}
                  isEarlyGrade={true}
                  submitMcq={submitMcq}
                  submitWriting={submitWriting}
                  submitSpeech={submitSpeech}
                />
              </div>

              <div className="g12-mission-actions">
                <div className="g12-mission-actions-left">
                  <button className="g12-mission-btn secondary" onClick={goBackStep}>← Balik</button>
                </div>
                <div className="g12-mission-actions-right">
                  <button className="g12-mission-btn purple" onClick={goNext}>
                    {safeStep >= missionSteps.length - 2 ? 'Tapusin →' : 'Susunod →'}
                  </button>
                </div>
              </div>
            </>
          )}

          {currentStep.type === 'finish' && (
            <>
              <div className="g12-finish-card">
                <div>
                  <div className="big">{isReviewMode ? '✅' : '🎉'}</div>
                  <h3>{isReviewMode ? 'Review Complete!' : 'Mission Complete!'}</h3>
                  <p>
                    {isReviewMode
                      ? 'Natapos mo na ang lesson na ito. Maaari kang bumalik sa Home o pumili ng ibang lesson.'
                      : `Kunin ang reward mo: +${lesson?.xpReward || 0} XP`}
                  </p>
                </div>
              </div>

              <StudentSelfEvaluation isEarlyGrade={true} />

              {feedback && (
                <div className="g12-mission-feedback">
                  {feedback}
                </div>
              )}

              <div className="g12-mission-actions">
                {!isReviewMode && (
                  <div className="g12-mission-actions-left">
                    <button className="g12-mission-btn secondary" onClick={goBackStep}>← Balik</button>
                  </div>
                )}

                <div className="g12-mission-actions-right">
                  {!isReviewMode ? (
                    <button className="g12-mission-btn" onClick={claimReward}>⭐ Claim XP</button>
                  ) : (
                    <button className="g12-mission-btn purple" onClick={() => go('screen-student')}>🏠 Go Home</button>
                  )}
                  <button className="g12-mission-btn secondary" onClick={() => go('screen-lessons')}>📖 More Lessons</button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </EarlyStudentChrome>
  );
}

function getActivityData(activity) {
  if (!activity?.dataJson) return {};

  if (typeof activity.dataJson === 'string') {
    try {
      return JSON.parse(activity.dataJson);
    } catch {
      return {};
    }
  }

  return activity.dataJson || {};
}

function ActivityCard({ activity, index = 0, total = 1, isEarlyGrade, submitMcq, submitWriting, submitSpeech }) {
  const activityBoxStyle = {
    boxShadow: 'none',
    background: '#FFFFFF',
    border: isEarlyGrade ? '2px solid #E8E8E8' : '1px solid #E8E8E8',
    marginBottom: 14,
  };

  if (activity.type === 'mcq') {
    return (
      <McqActivity
        activity={activity}
        index={index}
        total={total}
        isEarlyGrade={isEarlyGrade}
        activityBoxStyle={activityBoxStyle}
        submitMcq={submitMcq}
      />
    );
  }

  if (activity.type === 'writing') {
    return (
      <WritingActivity
        activity={activity}
        index={index}
        total={total}
        isEarlyGrade={isEarlyGrade}
        activityBoxStyle={activityBoxStyle}
        submitWriting={submitWriting}
      />
    );
  }

  if (activity.type === 'speech') {
    return (
      <SpeechActivity
        activity={activity}
        index={index}
        total={total}
        isEarlyGrade={isEarlyGrade}
        activityBoxStyle={activityBoxStyle}
        submitSpeech={submitSpeech}
      />
    );
  }

  if (activity.type === 'matching') {
    return (
      <MatchingActivity
        activity={activity}
        index={index}
        total={total}
        isEarlyGrade={isEarlyGrade}
        activityBoxStyle={activityBoxStyle}
      />
    );
  }

  if (activity.type === 'vocabulary') {
    return (
      <VocabularyActivity
        activity={activity}
        index={index}
        total={total}
        isEarlyGrade={isEarlyGrade}
        activityBoxStyle={activityBoxStyle}
      />
    );
  }

  if (activity.type === 'infographic') {
    return (
      <InfographicActivity
        activity={activity}
        index={index}
        total={total}
        isEarlyGrade={isEarlyGrade}
        activityBoxStyle={activityBoxStyle}
      />
    );
  }

  return (
    <div className="card" style={activityBoxStyle}>
      <div className="section-title">Activity</div>
      <div className="muted">
        This activity type is not supported yet: {activity.type}
      </div>
    </div>
  );
}

function McqActivity({ activity, index, total, isEarlyGrade, activityBoxStyle, submitMcq }) {
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [mcqFeedback, setMcqFeedback] = useState({});
  const [mcqStats, setMcqStats] = useState({});

  async function handleMcq(question, option) {
    setSelectedAnswers(prev => ({
      ...prev,
      [question.id]: option.id,
    }));

    const result = await submitMcq(question, option);

    if (result) {
      setMcqStats(prev => ({
        ...prev,
        [question.id]: Boolean(result.correct)
      }));

      setMcqFeedback(prev => ({
        ...prev,
        [question.id]: result.correct
          ? isEarlyGrade
            ? '✅ Tama! Ang galing mo!'
            : '✅ Correct answer.'
          : isEarlyGrade
            ? '❌ Hindi pa tama. Subukan muli!'
            : '❌ Not quite. Try again.'
      }));
    }
  }

  const questions = activity.questions || [];
  const answeredCount = Object.keys(mcqStats).length;
  const correctCount = Object.values(mcqStats).filter(Boolean).length;
  const scorePercent = questions.length ? Math.round((correctCount / questions.length) * 100) : 0;
  const band = effectivenessBand(scorePercent);

  return (
    <div className="card" style={activityBoxStyle}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="section-title">
          {isEarlyGrade ? '🎮 Mini Quiz' : 'Multiple Choice Quiz'}
        </div>

        <div className="pill">
          {index + 1}/{total}
        </div>
      </div>

      {activity.instructions && (
        <div className="muted" style={{ marginBottom: 8 }}>
          {activity.instructions}
        </div>
      )}

      <div className="muted">
        {isEarlyGrade
          ? 'Piliin ang tamang sagot. Makikita mo agad kung tama para makapag-practice muli.'
          : 'Choose the best answer. This quiz gives the teacher learning evidence beyond lesson completion.'}
      </div>

      <div className="divider" />

      {questions.map((q, qIndex) => (
        <div
          key={q.id || qIndex}
          style={{
            padding: isEarlyGrade ? 16 : 14,
            borderRadius: 16,
            background: isEarlyGrade ? '#F8FAFF' : '#FAFAFA',
            marginBottom: 12,
          }}
        >
          <div className="pill" style={{ marginBottom: 10 }}>
            Question {qIndex + 1} of {questions.length}
          </div>

          <h3 style={{ marginTop: 0, fontSize: isEarlyGrade ? 21 : 17 }}>
            {q.question}
          </h3>

          <div className="grid grid-2">
            {(q.options || []).map((option, optionIndex) => {
              const selected = selectedAnswers[q.id] === option.id;
              const label = option.optionText || option.text || `Option ${optionIndex + 1}`;

              return (
                <button
                  key={option.id || optionIndex}
                  className={`btn ${selected ? 'btn-green' : 'btn-outline'}`}
                  onClick={() => handleMcq(q, option)}
                  style={{
                    minHeight: isEarlyGrade ? 62 : 46,
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    fontSize: isEarlyGrade ? 18 : 14,
                    whiteSpace: 'normal',
                  }}
                >
                  <span style={{ marginRight: 8, fontWeight: 800 }}>
                    {['A', 'B', 'C', 'D'][optionIndex] || '•'}.
                  </span>
                  {label}
                </button>
              );
            })}
          </div>

          {mcqFeedback[q.id] && (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 14,
                background: mcqFeedback[q.id].includes('Tama') || mcqFeedback[q.id].includes('Correct')
                  ? '#E9FBEF'
                  : '#FFF4E5',
                fontWeight: 800,
                fontSize: isEarlyGrade ? 18 : 14,
              }}
            >
              {mcqFeedback[q.id]}
            </div>
          )}
        </div>
      ))}

      {answeredCount > 0 && (
        <div
          style={{
            marginTop: 12,
            padding: isEarlyGrade ? 18 : 16,
            borderRadius: isEarlyGrade ? 24 : 18,
            background: scorePercent >= 70 ? '#E9FBEF' : '#FFF8CF',
            border: scorePercent >= 70 ? '1px solid #bfeacb' : '1px solid #f7dfa0',
            color: '#14223b',
            fontWeight: 900,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <strong style={{ fontSize: isEarlyGrade ? 22 : 18 }}>
              {band.icon} Quiz Score: {correctCount}/{questions.length} ({scorePercent}%)
            </strong>
            <span className="pill">{band.label}</span>
          </div>
          <div style={{ marginTop: 8, color: '#526988', fontSize: isEarlyGrade ? 16 : 14 }}>
            {isEarlyGrade
              ? 'Kapag may mali, puwede mong subukan muli para mas maintindihan ang lesson.'
              : `${band.note} Teachers can use this score with writing, speech, and group outputs to judge lesson effectiveness.`}
          </div>
        </div>
      )}
    </div>
  );
}

function WritingActivity({ activity, index, total, isEarlyGrade, activityBoxStyle, submitWriting }) {
  const [writingText, setWritingText] = useState('');

  const prompt = activity.writingTask?.prompt || activity.prompt || 'Isulat ang iyong sagot.';

  return (
    <div className="card" style={activityBoxStyle}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="section-title">
          ✍️ {isEarlyGrade ? 'Isulat ang Sagot' : 'Writing Activity'}
        </div>

        <div className="pill">
          {index + 1}/{total}
        </div>
      </div>

      {activity.instructions && (
        <div className="muted" style={{ marginBottom: 8 }}>
          {activity.instructions}
        </div>
      )}

      <div
        style={{
          padding: 14,
          borderRadius: 16,
          background: '#FFF8CF',
          lineHeight: 1.6,
          marginBottom: 12,
          fontSize: isEarlyGrade ? 17 : 14,
        }}
      >
        <b>{isEarlyGrade ? 'Tanong:' : 'Prompt:'}</b> {prompt}
      </div>

      <textarea
        className="input-field"
        rows="5"
        value={writingText}
        onChange={(e) => setWritingText(e.target.value)}
        placeholder={isEarlyGrade ? 'Isulat dito ang sagot mo...' : 'Type your answer here...'}
        style={{
          minHeight: isEarlyGrade ? 150 : 130,
          resize: 'vertical',
          fontSize: isEarlyGrade ? 18 : 15,
          lineHeight: 1.6,
        }}
      />

      <div className="divider" />

      <button
        className="btn btn-green"
        onClick={() => submitWriting(activity.writingTask?.id, writingText)}
        disabled={!writingText.trim()}
      >
        ✅ Submit Writing
      </button>
    </div>
  );
}

function SpeechActivity({ activity, index, total, isEarlyGrade, activityBoxStyle, submitSpeech }) {
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [speechScore, setSpeechScore] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState('');

  const target = activity.speechTask?.targetText || activity.targetText || 'Basahin nang malinaw ang pangungusap.';

  function speakTarget() {
    speechSynthesis.cancel();
    speechSynthesis.speak(new SpeechSynthesisUtterance(target));
  }

  function startSpeechRecognition() {
    const Recognition = getSpeechRecognition();

    if (!Recognition) {
      setSpeechError('Hindi supported ng browser ang speech recognition. Subukan sa Chrome o Edge.');
      return;
    }

    const recognition = new Recognition();
    recognition.lang = 'fil-PH';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setSpeechError('');
    setSpeechTranscript('');
    setSpeechScore(null);
    setIsListening(true);

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      const score = speechSimilarityScore(target, transcript);

      setSpeechTranscript(transcript);
      setSpeechScore(score);
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      setSpeechError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }

  return (
    <div className="card" style={activityBoxStyle}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="section-title">
          🎤 {isEarlyGrade ? 'Bigkasin Mo' : 'Oral Practice'}
        </div>

        <div className="pill">
          {index + 1}/{total}
        </div>
      </div>

      {activity.instructions && (
        <div className="muted" style={{ marginBottom: 8 }}>
          {activity.instructions}
        </div>
      )}

      <div className="muted">
        {isEarlyGrade
          ? 'Pakinggan muna, pagkatapos pindutin ang Start Speaking at bigkasin ang pangungusap.'
          : 'Listen to the target text, then speak it aloud. Your answer will be scored using edit distance.'}
      </div>

      <div
        style={{
          padding: 16,
          borderRadius: 16,
          background: '#FFE2EA',
          marginTop: 12,
          fontSize: isEarlyGrade ? 20 : 16,
          lineHeight: 1.7,
        }}
      >
        <b>{isEarlyGrade ? 'Bibigkasin:' : 'Target:'}</b> {target}
      </div>

      <div className="divider" />

      <div className="row">
        <button className="btn btn-purple" onClick={speakTarget}>
          🔊 Listen
        </button>

        <button className="btn btn-blue" onClick={startSpeechRecognition} disabled={isListening}>
          {isListening ? '🎙️ Listening...' : '🎙️ Start Speaking'}
        </button>

        <button className="btn btn-outline" onClick={() => speechSynthesis.cancel()}>
          ⏹ Stop Audio
        </button>
      </div>

      {speechError && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 14,
            background: '#FFF4E5',
            fontWeight: 700,
          }}
        >
          {speechError}
        </div>
      )}

      {speechTranscript && (
        <div
          style={{
            marginTop: 14,
            padding: 14,
            borderRadius: 16,
            background: '#F8FAFF',
            border: '1px solid #E1E7FF',
            lineHeight: 1.6,
          }}
        >
          <b>{isEarlyGrade ? 'Narinig ng system:' : 'Recognized speech:'}</b>
          <div style={{ marginTop: 6 }}>{speechTranscript}</div>
        </div>
      )}

      {speechScore !== null && (
        <div
          style={{
            marginTop: 12,
            padding: 14,
            borderRadius: 16,
            background: speechScore >= 75 ? '#E9FBEF' : '#FFF4E5',
            fontWeight: 800,
            fontSize: isEarlyGrade ? 18 : 15,
          }}
        >
          {speechScore >= 75
            ? `✅ Mahusay! Speech score: ${speechScore}%`
            : `⭐ Subukan muli para mas malinaw. Speech score: ${speechScore}%`}
        </div>
      )}

      <div className="divider" />

      <button
        className="btn btn-purple"
        onClick={() => submitSpeech(activity.speechTask?.id, speechTranscript, speechScore || 0)}
        disabled={!speechTranscript}
      >
        🎤 Submit Speech Attempt
      </button>
    </div>
  );
}

function MatchingActivity({ activity, index, total, isEarlyGrade, activityBoxStyle }) {
  const data = getActivityData(activity);
  const pairs = data.pairs || activity.pairs || [];

  const [selectedLeft, setSelectedLeft] = useState(null);
  const [matched, setMatched] = useState([]);
  const [feedback, setFeedback] = useState('');

  function chooseRight(rightValue) {
    if (!selectedLeft) {
      setFeedback(isEarlyGrade ? 'Pumili muna sa kaliwa.' : 'Choose an item from the left first.');
      return;
    }

    const correctPair = pairs.find(pair => pair.left === selectedLeft);

    if (correctPair?.right === rightValue) {
      setMatched(prev => [...prev, selectedLeft]);
      setFeedback(isEarlyGrade ? '✅ Tama! Magaling!' : '✅ Correct match.');
    } else {
      setFeedback(isEarlyGrade ? '❌ Subukan muli!' : '❌ Not a match. Try again.');
    }

    setSelectedLeft(null);
  }

  const completed = pairs.length > 0 && matched.length === pairs.length;

  return (
    <div className="card" style={activityBoxStyle}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="section-title">
          🧩 {activity.title || (isEarlyGrade ? 'Pagtapatin' : 'Matching Game')}
        </div>

        <div className="pill">
          {index + 1}/{total}
        </div>
      </div>

      <div className="muted">
        {activity.instructions || (isEarlyGrade
          ? 'Pagtapatin ang tamang pares.'
          : 'Match each item on the left with the correct item on the right.')}
      </div>

      <div className="divider" />

      {pairs.length === 0 ? (
        <div className="muted">No matching pairs added yet.</div>
      ) : (
        <div className="grid grid-2">
          <div>
            <div className="pill" style={{ marginBottom: 10 }}>Left</div>
            {pairs.map((pair, pairIndex) => {
              const isMatched = matched.includes(pair.left);
              const isSelected = selectedLeft === pair.left;

              return (
                <button
                  key={pair.left || pairIndex}
                  className={`btn ${isMatched ? 'btn-green' : isSelected ? 'btn-blue' : 'btn-outline'}`}
                  onClick={() => !isMatched && setSelectedLeft(pair.left)}
                  disabled={isMatched}
                  style={{
                    width: '100%',
                    marginBottom: 8,
                    justifyContent: 'flex-start',
                    whiteSpace: 'normal',
                    fontSize: isEarlyGrade ? 17 : 14,
                  }}
                >
                  {isMatched ? '✅ ' : ''}{pair.left}
                </button>
              );
            })}
          </div>

          <div>
            <div className="pill" style={{ marginBottom: 10 }}>Right</div>
            {pairs.map((pair, pairIndex) => (
              <button
                key={pair.right || pairIndex}
                className="btn btn-outline"
                onClick={() => chooseRight(pair.right)}
                style={{
                  width: '100%',
                  marginBottom: 8,
                  justifyContent: 'flex-start',
                  whiteSpace: 'normal',
                  fontSize: isEarlyGrade ? 17 : 14,
                }}
              >
                {pair.right}
              </button>
            ))}
          </div>
        </div>
      )}

      {feedback && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 14,
            background: feedback.includes('Tama') || feedback.includes('Correct') ? '#E9FBEF' : '#FFF4E5',
            fontWeight: 800,
          }}
        >
          {feedback}
        </div>
      )}

      {completed && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 14,
            background: '#E9FBEF',
            fontWeight: 800,
          }}
        >
          🎉 {isEarlyGrade ? 'Natapos mo ang matching game!' : 'Matching activity completed.'}
        </div>
      )}
    </div>
  );
}

function VocabularyActivity({ activity, index, total, isEarlyGrade, activityBoxStyle }) {
  const data = getActivityData(activity);
  const words = data.words || activity.words || [];

  return (
    <div className="card" style={activityBoxStyle}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="section-title">
          📚 {activity.title || (isEarlyGrade ? 'Mga Bagong Salita' : 'Vocabulary Cards')}
        </div>

        <div className="pill">
          {index + 1}/{total}
        </div>
      </div>

      <div className="muted">
        {activity.instructions || (isEarlyGrade
          ? 'Basahin ang salita at alamin ang kahulugan.'
          : 'Study each word, its meaning, and example usage.')}
      </div>

      <div className="divider" />

      {words.length === 0 ? (
        <div className="muted">No vocabulary words added yet.</div>
      ) : (
        <div className="grid grid-2">
          {words.map((item, wordIndex) => (
            <div
              key={`${item.word}-${wordIndex}`}
              style={{
                padding: 16,
                borderRadius: 18,
                background: isEarlyGrade ? '#E9FBEF' : '#F8FAFF',
                border: '1px solid #E1E7FF',
                lineHeight: 1.6,
              }}
            >
              <div style={{ fontSize: isEarlyGrade ? 24 : 20, fontWeight: 900, marginBottom: 6 }}>
                {item.word}
              </div>

              <div>
                <b>Kahulugan:</b> {item.meaning}
              </div>

              {item.example && (
                <div style={{ marginTop: 8 }}>
                  <b>Halimbawa:</b> {item.example}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InfographicActivity({ activity, index, total, isEarlyGrade, activityBoxStyle }) {
  const data = getActivityData(activity);
  const content = data.content || activity.content || '';

  return (
    <div className="card" style={activityBoxStyle}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="section-title">
          🖼️ {activity.title || (isEarlyGrade ? 'Tingnan at Matuto' : 'Info Card')}
        </div>

        <div className="pill">
          {index + 1}/{total}
        </div>
      </div>

      <div className="muted">
        {activity.instructions || (isEarlyGrade
          ? 'Basahin ang maikling gabay sa ibaba.'
          : 'Review the information below before answering the activities.')}
      </div>

      <div className="divider" />

      <div
        style={{
          padding: isEarlyGrade ? 20 : 18,
          borderRadius: 18,
          background: isEarlyGrade
            ? 'linear-gradient(135deg, #FFF8CF, #E9FBEF)'
            : '#F8FAFF',
          border: '1px solid #E1E7FF',
          lineHeight: isEarlyGrade ? 1.9 : 1.75,
          fontSize: isEarlyGrade ? 19 : 15,
          whiteSpace: 'pre-line',
        }}
      >
        {content || 'No infographic content added yet.'}
      </div>
    </div>
  );
}




function getMissionDemo(gameId) {
  const demos = {
    'word-match': {
      instruction: 'Piliin ang tamang kahulugan ng salitang Filipino.',
      prompt: 'Ano ang ibig sabihin ng salitang “bahay”?',
      sample: 'bahay → house / tahanan',
      options: ['House / tahanan', 'Dog / aso', 'Book / aklat'],
      correct: 'House / tahanan',
      success: 'Tama! Ang “bahay” ay house o tahanan.'
    },
    'letter-pop': {
      instruction: 'Piliin ang nawawalang pantig para mabuo ang salita.',
      prompt: 'ba + ___ = bata',
      sample: 'Tapikin ang tamang pantig.',
      options: ['ta', 'sa', 'la'],
      correct: 'ta',
      success: 'Tama! ba + ta = bata.'
    },
    'picture-guess': {
      instruction: 'Tingnan ang picture clue at piliin ang tamang salitang Filipino.',
      prompt: 'Picture clue: 🐱',
      sample: 'Anong Filipino word ang bagay sa larawan?',
      options: ['pusa', 'aso', 'ibon'],
      correct: 'pusa',
      success: 'Tama! Ang larawan ay pusa.'
    },
    'sentence-builder': {
      instruction: 'Piliin ang wastong ayos ng pangungusap.',
      prompt: 'Ayusin ang mga salita: bata / Ako / ay',
      sample: 'Dapat malinaw at tama ang pangungusap.',
      options: ['Ako ay bata.', 'Ay bata ako.', 'Bata ako ay.'],
      correct: 'Ako ay bata.',
      success: 'Tama! “Ako ay bata.” ang wastong pangungusap.'
    },
    'story-quest': {
      instruction: 'Basahin ang maikling kuwento at sagutin ang tanong.',
      prompt: 'Si Ana ay may pulang payong. Ginamit niya ito nang umulan. Ano ang ginamit ni Ana?',
      sample: 'Hanapin ang sagot sa kuwento.',
      options: ['payong', 'aklat', 'lapis'],
      correct: 'payong',
      success: 'Tama! Ginamit ni Ana ang payong.'
    },
    'sound-and-say': {
      instruction: 'Practice card muna habang wala pang backend speech scoring.',
      prompt: 'Bigkasin: “Magandang umaga po.”',
      sample: 'Basahin nang malinaw at malakas.',
      options: ['Nasabi ko na!', 'Ulitin ko muna'],
      correct: 'Nasabi ko na!',
      success: 'Mahusay! Practice complete. Backend speech scoring can be added later.'
    },
    'badge-challenge': {
      instruction: 'Tapusin ang mini challenge para makita kung paano mag-u-unlock ng badge.',
      prompt: 'Ilang vocabulary games ang kailangan para sa “Bokabularyo Star”?',
      sample: 'Complete 3 vocabulary games → unlock badge.',
      options: ['3 games', '1 game', '10 games'],
      correct: '3 games',
      success: 'Tama! 3 vocabulary games para sa Bokabularyo Star.'
    }
  };

  return demos[gameId] || demos['word-match'];
}

function missionGamesForStudent(data) {
  const lessons = asArray(data?.lessons);
  const completedLessons = lessons.filter(lesson => lesson?.completed).length;

  return MISSION_GAMES.map((game, index) => {
    let status = game.baseStatus || 'Available';

    if (game.minCompleted && completedLessons < game.minCompleted) {
      status = 'Locked';
    } else if (!game.future && completedLessons > index + 1) {
      status = 'Completed';
    }

    return { ...game, status };
  });
}

function MissionStyles() {
  return (
    <style>{`
      .missions-wrap {
        display: grid;
        gap: 18px;
      }

      .missions-wrap.early {
        --mission-text: #26354d;
        --mission-muted: #526988;
        --mission-primary: #15965a;
      }

      .missions-wrap.standard {
        --mission-text: #17243b;
        --mission-muted: #64748b;
        --mission-primary: #2563eb;
        padding: 18px 0 96px;
      }

      .missions-hero {
        position: relative;
        overflow: hidden;
        display: grid;
        grid-template-columns: minmax(0, 1.3fr) minmax(280px, 0.7fr);
        gap: 18px;
        align-items: stretch;
        border-radius: 34px;
        padding: 26px;
        background:
          radial-gradient(circle at 10% 20%, rgba(255, 236, 163, 0.78), transparent 28%),
          radial-gradient(circle at 90% 16%, rgba(219, 234, 254, 0.80), transparent 28%),
          linear-gradient(135deg, #ffffff, #f0fff5 48%, #eef8ff);
        border: 1px solid rgba(31, 154, 92, 0.10);
        box-shadow: 0 16px 34px rgba(39, 87, 63, 0.07);
      }

      .missions-wrap.standard .missions-hero {
        background: linear-gradient(135deg, #eef2ff, #ffffff 54%, #f8fafc);
        border-color: rgba(37, 99, 235, 0.10);
        box-shadow: 0 16px 34px rgba(15, 23, 42, 0.08);
      }

      .missions-hero-copy h2 {
        margin: 0;
        color: var(--mission-primary);
        font-size: clamp(38px, 4.6vw, 62px);
        line-height: 0.96;
        letter-spacing: -0.055em;
        font-weight: 1000;
      }

      .missions-wrap.standard .missions-hero-copy h2 {
        font-size: clamp(34px, 4vw, 52px);
        letter-spacing: -0.045em;
      }

      .missions-hero-copy p {
        margin: 12px 0 0;
        color: var(--mission-muted);
        max-width: 720px;
        font-size: 18px;
        line-height: 1.55;
        font-weight: 850;
      }

      .missions-hero-icon {
        width: 96px;
        height: 96px;
        display: grid;
        place-items: center;
        margin-bottom: 12px;
        border-radius: 30px;
        background: #fff5cf;
        font-size: 54px;
        box-shadow: inset 0 0 0 2px rgba(246, 196, 83, 0.22);
      }

      .missions-progress-card {
        border-radius: 30px;
        padding: 22px;
        background: rgba(255, 255, 255, 0.92);
        border: 2px solid rgba(255, 217, 102, 0.32);
        box-shadow: 0 14px 30px rgba(20, 34, 59, 0.08);
        align-self: stretch;
        display: grid;
        align-content: center;
      }

      .missions-progress-card strong {
        color: #14223b;
        font-size: clamp(26px, 3vw, 38px);
        font-weight: 1000;
        letter-spacing: -0.045em;
      }

      .missions-progress-track {
        height: 15px;
        margin-top: 14px;
        border-radius: 999px;
        background: #e2e8f0;
        overflow: hidden;
        border: 1px solid rgba(148, 163, 184, 0.25);
      }

      .missions-progress-fill {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #45c985, #facc15);
      }

      .missions-wrap.standard .missions-progress-fill {
        background: linear-gradient(90deg, #2563eb, #7c3aed);
      }

      .missions-stat-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
      }

      .missions-stat-card {
        min-height: 104px;
        padding: 18px;
        border-radius: 24px;
        background: #ffffff;
        border: 1px solid rgba(148, 163, 184, 0.20);
        box-shadow: 0 12px 26px rgba(15, 23, 42, 0.06);
      }

      .missions-stat-card b {
        display: block;
        color: var(--mission-text);
        font-size: 30px;
        font-weight: 1000;
        line-height: 1;
      }

      .missions-stat-card span {
        display: block;
        margin-top: 8px;
        color: var(--mission-muted);
        font-weight: 850;
      }

      .missions-section {
        border-radius: 32px;
        padding: 26px;
        background: rgba(255, 255, 255, 0.94);
        border: 1px solid rgba(31, 154, 92, 0.07);
        box-shadow: 0 16px 32px rgba(39, 87, 63, 0.06);
      }

      .missions-wrap.standard .missions-section {
        border-color: rgba(37, 99, 235, 0.09);
        box-shadow: 0 16px 32px rgba(15, 23, 42, 0.06);
      }

      .missions-section-head {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: flex-start;
        margin-bottom: 18px;
      }

      .missions-section-head h3 {
        margin: 0;
        color: var(--mission-primary);
        font-size: clamp(28px, 3.3vw, 42px);
        line-height: 1;
        letter-spacing: -0.045em;
        font-weight: 1000;
      }

      .missions-section-head p {
        margin: 8px 0 0;
        color: var(--mission-muted);
        font-weight: 850;
        line-height: 1.5;
      }

      .missions-game-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(245px, 1fr));
        gap: 16px;
      }

      .missions-wrap.early .missions-game-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .missions-game-card {
        border: 0;
        min-height: 238px;
        border-radius: 28px;
        padding: 18px;
        text-align: left;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 14px;
        cursor: pointer;
        color: #24324a;
        box-shadow: 0 12px 24px rgba(47, 78, 84, 0.06);
        border: 2px solid transparent;
        transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
      }

      .missions-game-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 16px 30px rgba(47, 78, 84, 0.10);
      }

      .missions-game-card.locked {
        opacity: 0.68;
        cursor: not-allowed;
      }

      .missions-game-card.sky { background: #e0f2fe; }
      .missions-game-card.sun { background: #fef3c7; }
      .missions-game-card.mint { background: #dcfce7; }
      .missions-game-card.pink { background: #fce7f3; }
      .missions-game-card.violet { background: #ede9fe; }
      .missions-game-card.rose { background: #ffe4e6; }
      .missions-game-card.orange { background: #ffedd5; }

      .missions-game-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
      }

      .missions-game-icon {
        width: 66px;
        height: 66px;
        display: grid;
        place-items: center;
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.72);
        font-size: 38px;
      }

      .missions-status {
        min-height: 32px;
        padding: 0 11px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.78);
        color: #334155;
        font-size: 12px;
        font-weight: 1000;
      }

      .missions-game-card h4 {
        margin: 12px 0 8px;
        color: #14223b;
        font-size: 24px;
        line-height: 1.05;
        font-weight: 1000;
        letter-spacing: -0.04em;
      }

      .missions-game-card p {
        margin: 0;
        color: #385075;
        font-size: 15px;
        line-height: 1.45;
        font-weight: 800;
      }

      .missions-tag-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin: 12px 0;
      }

      .missions-tag {
        min-height: 30px;
        padding: 0 10px;
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.75);
        color: #334155;
        font-size: 12px;
        font-weight: 1000;
      }

      .missions-play-btn {
        width: 100%;
        min-height: 48px;
        border: 0;
        border-radius: 18px;
        background: linear-gradient(135deg, #47ce87, #1f9c60);
        color: white;
        font-size: 15px;
        font-weight: 1000;
        cursor: pointer;
        box-shadow: 0 12px 18px rgba(32, 156, 96, 0.16);
        display: grid;
        place-items: center;
      }

      .missions-wrap.standard .missions-play-btn {
        background: linear-gradient(135deg, #2563eb, #7c3aed);
        box-shadow: 0 12px 18px rgba(37, 99, 235, 0.16);
      }

      .missions-play-btn.locked {
        background: #94a3b8;
        box-shadow: none;
        cursor: not-allowed;
      }

      .missions-badge-card {
        border-radius: 28px;
        padding: 24px;
        background: #ffffff;
        border: 1px solid rgba(148, 163, 184, 0.22);
        box-shadow: 0 14px 26px rgba(15, 23, 42, 0.05);
      }

      .missions-badge-card h3 {
        margin: 0 0 10px;
        color: var(--mission-primary);
        font-size: 30px;
        font-weight: 1000;
        letter-spacing: -0.04em;
      }

      .missions-badge-card p {
        color: var(--mission-muted);
        font-weight: 850;
        line-height: 1.6;
      }

      .missions-badge-preview-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        margin-top: 14px;
      }

      .missions-badge-preview {
        min-height: 108px;
        border-radius: 22px;
        display: grid;
        place-items: center;
        text-align: center;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        color: #334155;
        font-weight: 950;
      }

      .missions-badge-preview span {
        display: block;
        font-size: 34px;
        margin-bottom: 6px;
      }

      .missions-bottom-nav {
        position: fixed;
        left: 50%;
        bottom: 14px;
        transform: translateX(-50%);
        width: min(760px, calc(100vw - 24px));
        z-index: 90;
        min-height: 76px;
        padding: 8px;
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 6px;
        border-radius: 26px;
        background: rgba(255, 255, 255, 0.96);
        border: 1px solid rgba(148, 163, 184, 0.22);
        box-shadow: 0 18px 40px rgba(15, 23, 42, 0.16);
        backdrop-filter: blur(14px);
      }

      .missions-bottom-nav button {
        border: 0;
        border-radius: 20px;
        background: transparent;
        color: #475569;
        font-size: 12px;
        font-weight: 950;
        cursor: pointer;
        display: grid;
        place-items: center;
        gap: 2px;
      }

      .missions-bottom-nav button.active {
        background: #edf8f1;
        color: #15965a;
      }

      .missions-wrap.standard + .missions-bottom-nav button.active {
        background: #dbeafe;
        color: #1d4ed8;
      }

      .missions-bottom-nav span {
        font-size: 24px;
        line-height: 1;
      }

      .mission-play-shell {
        display: grid;
        gap: 18px;
      }

      .mission-play-card {
        border-radius: 36px;
        padding: 32px;
        background:
          radial-gradient(circle at 10% 18%, rgba(255, 236, 163, 0.78), transparent 28%),
          radial-gradient(circle at 90% 16%, rgba(219, 234, 254, 0.80), transparent 30%),
          linear-gradient(135deg, #ffffff, #f8fcff);
        border: 1px solid rgba(31, 154, 92, 0.10);
        box-shadow: 0 18px 38px rgba(39, 87, 63, 0.08);
      }

      .mission-play-head {
        display: grid;
        grid-template-columns: 110px minmax(0, 1fr);
        gap: 20px;
        align-items: center;
        margin-bottom: 22px;
      }

      .mission-play-icon {
        width: 110px;
        height: 110px;
        border-radius: 34px;
        display: grid;
        place-items: center;
        background: #fff5cf;
        font-size: 62px;
        box-shadow: inset 0 0 0 2px rgba(246, 196, 83, 0.22);
      }

      .mission-play-head h2 {
        margin: 0;
        color: #15965a;
        font-size: clamp(40px, 5vw, 68px);
        line-height: 0.95;
        letter-spacing: -0.06em;
        font-weight: 1000;
      }

      .mission-play-head p {
        margin: 10px 0 0;
        color: #526988;
        font-size: 18px;
        line-height: 1.55;
        font-weight: 850;
      }

      .mission-prompt-box {
        padding: 24px;
        border-radius: 28px;
        background: #ffffff;
        border: 1px dashed #cbd5e1;
        color: #24324a;
        font-size: clamp(22px, 3vw, 34px);
        line-height: 1.55;
        font-weight: 1000;
      }

      .mission-play-options {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;
        margin-top: 18px;
      }

      .mission-play-choice {
        min-height: 72px;
        border: 2px solid rgba(47, 191, 115, 0.20);
        border-radius: 22px;
        background: #ffffff;
        color: #24324a;
        font-size: 18px;
        font-weight: 1000;
        cursor: pointer;
        padding: 12px 16px;
        text-align: center;
      }

      .mission-play-choice.selected,
      .mission-play-choice:hover {
        background: #edf8f1;
        color: #15965a;
        border-color: rgba(47, 191, 115, 0.46);
      }

      .mission-result {
        margin-top: 16px;
        padding: 18px;
        border-radius: 22px;
        background: #fff8cf;
        color: #24324a;
        font-size: 18px;
        font-weight: 1000;
        line-height: 1.45;
      }

      .mission-result.good {
        background: #e9fbef;
        color: #0d7f48;
        border: 1px solid #bfeacb;
      }

      .mission-play-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 22px;
      }

      .mission-play-action {
        min-height: 58px;
        border: 0;
        border-radius: 20px;
        padding: 0 22px;
        background: linear-gradient(135deg, #47ce87, #1f9c60);
        color: white;
        font-size: 17px;
        font-weight: 1000;
        cursor: pointer;
        box-shadow: 0 12px 20px rgba(32, 156, 96, 0.14);
      }

      .mission-play-action.secondary {
        background: #ffffff;
        color: #14975a;
        border: 2px solid #2fbf73;
        box-shadow: none;
      }

      .mission-play-action.purple {
        background: linear-gradient(135deg, #a770ef, #7b4fd6);
      }

      /* Duolingo-inspired mission polish */
      .missions-wrap.early {
        gap: 24px;
      }

      .missions-wrap.early .missions-game-card,
      .missions-wrap.early .mission-play-card,
      .missions-wrap.early .missions-section,
      .missions-wrap.early .missions-badge-card,
      .missions-wrap.early .missions-stat-card {
        border: 3px solid rgba(209, 250, 229, 0.95);
        box-shadow: 0 9px 0 rgba(188, 221, 198, 0.72), 0 18px 34px rgba(25, 78, 54, 0.08);
      }

      .missions-wrap.early .missions-game-card {
        min-height: 258px;
        position: relative;
        overflow: hidden;
        transform: translateY(0);
      }

      .missions-wrap.early .missions-game-card::after {
        content: '';
        position: absolute;
        inset: 12px;
        border-radius: 24px;
        border: 2px solid rgba(255, 255, 255, 0.42);
        pointer-events: none;
      }

      .missions-wrap.early .missions-game-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 12px 0 rgba(188, 221, 198, 0.84), 0 24px 42px rgba(25, 78, 54, 0.12);
      }

      .missions-wrap.early .missions-game-card:active {
        transform: translateY(3px);
        box-shadow: 0 5px 0 rgba(188, 221, 198, 0.84), 0 14px 26px rgba(25, 78, 54, 0.10);
      }

      .missions-wrap.early .missions-game-icon,
      .missions-wrap.early .mission-play-icon {
        background: #ffffff;
        border: 3px solid rgba(255, 238, 174, 0.85);
        box-shadow: 0 6px 0 rgba(246, 196, 83, 0.18);
      }

      .missions-wrap.early .missions-play-btn,
      .missions-wrap.early .mission-play-action {
        min-height: 56px;
        border-radius: 18px;
        background: linear-gradient(180deg, #58cc02 0%, #40a900 100%);
        box-shadow: 0 6px 0 #2f8500, 0 12px 20px rgba(88, 204, 2, 0.18);
        letter-spacing: 0.01em;
      }

      .missions-wrap.early .missions-play-btn {
        text-transform: uppercase;
        font-size: 16px;
      }

      .missions-wrap.early .mission-play-action:hover,
      .missions-wrap.early .missions-play-btn:hover {
        filter: brightness(1.03);
      }

      .missions-wrap.early .mission-play-action:active,
      .missions-wrap.early .missions-play-btn:active {
        transform: translateY(4px);
        box-shadow: 0 2px 0 #2f8500, 0 8px 14px rgba(88, 204, 2, 0.16);
      }

      .missions-wrap.early .mission-play-action.secondary {
        background: #ffffff;
        color: #15965a;
        border: 3px solid #b7efc5;
        box-shadow: 0 6px 0 #d4ead9;
      }

      .missions-wrap.early .mission-play-action.purple {
        background: linear-gradient(180deg, #8b5cf6 0%, #6d45d8 100%);
        box-shadow: 0 6px 0 #4f2faf, 0 12px 20px rgba(139, 92, 246, 0.18);
      }

      .missions-wrap.early .mission-prompt-box {
        background: #ffffff;
        border: 3px solid #e5eef9;
        box-shadow: inset 0 -5px 0 rgba(226, 232, 240, 0.62);
      }

      .missions-wrap.early .mission-play-choice {
        min-height: 86px;
        border: 3px solid #dbeafe;
        border-bottom-width: 7px;
        border-radius: 24px;
        background: #ffffff;
        color: #24324a;
        box-shadow: none;
        transition: 0.14s ease;
      }

      .missions-wrap.early .mission-play-choice:hover,
      .missions-wrap.early .mission-play-choice.selected {
        background: #ecfdf5;
        color: #15965a;
        border-color: #8ce0ae;
        transform: translateY(-2px);
      }

      .missions-wrap.early .mission-result {
        border: 3px solid #fde68a;
        box-shadow: 0 6px 0 #f7d86b;
      }

      .missions-wrap.early .mission-result.good {
        border-color: #86efac;
        box-shadow: 0 6px 0 #60c983;
      }

      .missions-wrap.early .mission-play-card {
        position: relative;
        overflow: hidden;
      }

      .missions-wrap.early .mission-play-card::before {
        content: '⭐';
        position: absolute;
        right: 28px;
        top: 26px;
        font-size: 34px;
        opacity: 0.38;
        pointer-events: none;
      }

      .g12-mission-play-nohero {
        padding-top: 22px;
      }

      .g12-mission-play-nav {
        grid-template-columns: repeat(6, 1fr);
      }


      /* Grade 1-2 Missions and game screen balanced font sizing. */
      .missions-wrap.early .missions-section,
      .missions-wrap.early .missions-badge-card,
      .missions-wrap.early .missions-stat-card,
      .missions-wrap.early .mission-play-card {
        border-radius: 30px;
      }

      .missions-wrap.early .missions-section {
        padding: 24px;
      }

      .missions-wrap.early .missions-stat-card {
        min-height: 92px;
        padding: 16px;
      }

      .missions-wrap.early .missions-stat-card b {
        font-size: 24px;
      }

      .missions-wrap.early .missions-stat-card span,
      .missions-wrap.early .missions-section-head p,
      .missions-wrap.early .missions-badge-card p {
        font-size: 15px;
        line-height: 1.45;
      }

      .missions-wrap.early .missions-section-head h3,
      .missions-wrap.early .missions-badge-card h3 {
        font-size: clamp(24px, 3vw, 34px);
        line-height: 1.05;
      }

      .g12-page .missions-wrap.early .missions-game-card,
      .missions-wrap.early .missions-game-card {
        min-height: 230px;
        padding: 22px;
        border-radius: 30px;
      }

      .g12-page .missions-wrap.early .missions-game-icon,
      .missions-wrap.early .missions-game-icon {
        width: 74px;
        height: 74px;
        border-radius: 24px;
        font-size: 40px;
      }

      .g12-page .missions-wrap.early .missions-game-card h4,
      .missions-wrap.early .missions-game-card h4 {
        font-size: 28px;
        line-height: 1.08;
      }

      .g12-page .missions-wrap.early .missions-game-card p,
      .missions-wrap.early .missions-game-card p {
        font-size: 16px;
      }

      .g12-page .missions-wrap.early .missions-play-btn,
      .missions-wrap.early .missions-play-btn {
        min-height: 54px;
        border-radius: 20px;
        font-size: 16px;
      }

      .missions-wrap.early .missions-badge-preview {
        min-height: 92px;
        border-radius: 20px;
        font-size: 14px;
      }

      .missions-wrap.early .missions-badge-preview span {
        font-size: 28px;
      }

      .missions-wrap.early .mission-play-card {
        padding: 28px;
      }

      .missions-wrap.early .mission-play-head {
        grid-template-columns: 84px minmax(0, 1fr);
        gap: 18px;
        margin-bottom: 20px;
      }

      .missions-wrap.early .mission-play-icon {
        width: 84px;
        height: 84px;
        border-radius: 28px;
        font-size: 46px;
      }

      .missions-wrap.early .mission-play-head h2 {
        font-size: clamp(30px, 3.8vw, 46px);
        line-height: 1;
      }

      .missions-wrap.early .mission-play-head p {
        font-size: 16px;
        line-height: 1.45;
      }

      .missions-wrap.early .mission-prompt-box {
        padding: 22px;
        border-radius: 24px;
        font-size: clamp(18px, 2.2vw, 26px);
        line-height: 1.6;
      }

      .missions-wrap.early .mission-play-options {
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      }

      .missions-wrap.early .mission-play-choice {
        min-height: 68px;
        border-radius: 22px;
        font-size: 16px;
      }

      .missions-wrap.early .mission-result {
        padding: 16px;
        border-radius: 20px;
        font-size: 16px;
      }

      .missions-wrap.early .mission-play-action {
        min-height: 54px;
        border-radius: 20px;
        padding: 0 22px;
        font-size: 16px;
      }

      @media (max-width: 960px) {
        .missions-hero,
        .missions-wrap.early .missions-game-grid {
          grid-template-columns: 1fr;
        }

        .missions-stat-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .mission-play-head {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 640px) {
        .missions-hero,
        .missions-section,
        .missions-badge-card,
        .mission-play-card {
          border-radius: 26px;
          padding: 20px;
        }

        .missions-stat-grid,
        .missions-badge-preview-row {
          grid-template-columns: 1fr;
        }

        .missions-bottom-nav {
          width: calc(100vw - 18px);
          bottom: 10px;
          border-radius: 22px;
        }

        .missions-bottom-nav button {
          font-size: 10px;
        }

        .mission-play-icon {
          width: 84px;
          height: 84px;
          border-radius: 28px;
          font-size: 48px;
        }
      }
    `}</style>
  );
}

function QuizSharedStyles() {
  return (
    <style>{`
      .quiz-shell {
        --quiz-green: var(--tt-green, #15965a);
        --quiz-green-dark: var(--tt-green-dark, #0f7d49);
        --quiz-green-soft: var(--tt-green-soft, #edf8f1);
        --quiz-yellow: var(--tt-yellow, #fff5cf);
        --quiz-yellow-deep: var(--tt-yellow-deep, #f6c453);
        --quiz-sky: var(--tt-sky, #eef8ff);
        --quiz-cream: var(--tt-cream, #fffdf7);
        --quiz-purple: var(--tt-purple, #7b4fd6);
        --quiz-ink: var(--tt-ink, #203451);
        --quiz-muted: var(--tt-muted, #526988);
        display: grid;
        gap: 18px;
        color: var(--quiz-ink);
      }

      .quiz-game-panel,
      .quiz-game-stage,
      .quiz-game-results,
      .quiz-game-landing-card {
        position: relative;
        overflow: hidden;
        border-radius: 34px;
        background:
          radial-gradient(circle at 10% 12%, color-mix(in srgb, var(--quiz-yellow) 88%, transparent), transparent 28%),
          radial-gradient(circle at 92% 18%, color-mix(in srgb, var(--quiz-sky) 82%, transparent), transparent 26%),
          linear-gradient(135deg, var(--quiz-cream), #ffffff 54%, var(--quiz-green-soft));
        border: 1px solid color-mix(in srgb, var(--quiz-green) 13%, transparent);
        box-shadow: 0 18px 38px rgba(31, 73, 61, 0.08);
      }

      .quiz-game-panel::before,
      .quiz-game-stage::before,
      .quiz-game-results::before,
      .quiz-game-landing-card::before {
        content: '';
        position: absolute;
        width: 180px;
        height: 180px;
        right: -72px;
        top: -72px;
        border-radius: 999px;
        background: color-mix(in srgb, var(--quiz-yellow) 68%, transparent);
        pointer-events: none;
      }

      .quiz-game-panel::after,
      .quiz-game-stage::after,
      .quiz-game-results::after,
      .quiz-game-landing-card::after {
        content: '';
        position: absolute;
        width: 120px;
        height: 120px;
        left: -42px;
        bottom: -42px;
        border-radius: 999px;
        background: color-mix(in srgb, var(--quiz-green-soft) 86%, transparent);
        pointer-events: none;
      }

      .quiz-game-landing-card {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(260px, 0.52fr);
        gap: 24px;
        align-items: center;
        padding: 30px;
      }

      .quiz-game-copy,
      .quiz-game-mascot-scene,
      .quiz-game-results-inner,
      .quiz-game-stage-inner {
        position: relative;
        z-index: 1;
      }

      .quiz-game-copy h2,
      .quiz-game-panel h2,
      .quiz-game-results h2 {
        margin: 0;
        color: var(--quiz-ink);
        font-size: clamp(32px, 4vw, 54px);
        line-height: 0.98;
        font-weight: 1000;
        letter-spacing: -0.055em;
      }

      .quiz-game-copy p,
      .quiz-game-panel p,
      .quiz-game-results p,
      .quiz-game-help-text {
        margin: 12px 0 0;
        color: var(--quiz-muted);
        font-size: 16px;
        line-height: 1.55;
        font-weight: 850;
      }

      .quiz-game-mascot-scene {
        min-height: 220px;
        border-radius: 30px;
        display: grid;
        place-items: center;
        background:
          radial-gradient(circle at 34% 26%, rgba(255, 255, 255, 0.92), transparent 18%),
          linear-gradient(145deg, color-mix(in srgb, var(--quiz-yellow) 76%, white), color-mix(in srgb, var(--quiz-sky) 76%, white));
        border: 1px solid color-mix(in srgb, var(--quiz-green) 10%, transparent);
      }

      .quiz-game-mascot {
        width: 142px;
        height: 142px;
        border-radius: 45px;
        display: grid;
        place-items: center;
        background: #ffffff;
        font-size: 78px;
        box-shadow: 0 16px 34px rgba(31, 73, 61, 0.11), inset 0 0 0 3px color-mix(in srgb, var(--quiz-yellow) 50%, transparent);
      }

      .quiz-game-float {
        position: absolute;
        border-radius: 999px;
        display: grid;
        place-items: center;
        background: #ffffff;
        box-shadow: 0 12px 22px rgba(31, 73, 61, 0.08);
        font-weight: 1000;
      }

      .quiz-game-float.one { width: 52px; height: 52px; left: 12%; top: 18%; color: var(--quiz-green-dark); }
      .quiz-game-float.two { width: 64px; height: 64px; right: 13%; top: 28%; color: var(--quiz-purple); }
      .quiz-game-float.three { width: 48px; height: 48px; left: 22%; bottom: 18%; color: var(--quiz-yellow-deep); }

      .quiz-stat-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
      }

      .quiz-stat {
        border-radius: 26px;
        padding: 18px;
        background: #ffffff;
        border: 1px solid color-mix(in srgb, var(--quiz-green) 10%, transparent);
        box-shadow: 0 12px 26px rgba(31, 73, 61, 0.06);
      }

      .quiz-stat b {
        display: block;
        color: var(--quiz-ink);
        font-size: 30px;
        font-weight: 1000;
        letter-spacing: -0.04em;
      }

      .quiz-stat span {
        display: block;
        margin-top: 4px;
        color: var(--quiz-muted);
        font-size: 12px;
        font-weight: 950;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .quiz-game-toolbar,
      .quiz-game-header,
      .quiz-result-actions,
      .quiz-nav-actions,
      .quiz-pill-row,
      .quiz-game-subject-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
      }

      .quiz-game-toolbar {
        justify-content: space-between;
        margin-bottom: 18px;
      }

      .quiz-game-subject-row {
        margin: 4px 0 18px;
      }

      .quiz-game-subject-chip,
      .quiz-pill,
      .quiz-game-help {
        min-height: 34px;
        border: 0;
        padding: 0 12px;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        background: rgba(255, 255, 255, 0.82);
        color: var(--quiz-green-dark);
        font-size: 12px;
        font-weight: 1000;
        box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--quiz-green) 9%, transparent);
      }

      .quiz-game-help {
        width: 42px;
        min-height: 42px;
        padding: 0;
        font-size: 18px;
        background: var(--quiz-yellow);
        color: var(--quiz-ink);
      }

      .quiz-card-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
      }

      .quiz-card {
        border: 0;
        min-height: 232px;
        padding: 22px;
        border-radius: 30px;
        background: #ffffff;
        color: var(--quiz-ink);
        text-align: left;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        box-shadow: 0 14px 28px rgba(31, 73, 61, 0.06);
        border: 1px solid color-mix(in srgb, var(--quiz-green) 8%, transparent);
        transition: transform 0.16s ease, box-shadow 0.16s ease;
      }

      .quiz-card:hover,
      .quiz-card:focus-visible,
      .quiz-primary:hover,
      .quiz-secondary:hover,
      .quiz-choice:hover:not(:disabled) {
        transform: translateY(-2px);
      }

      .quiz-card:focus-visible,
      .quiz-primary:focus-visible,
      .quiz-secondary:focus-visible,
      .quiz-choice:focus-visible,
      .quiz-game-start-btn:focus-visible {
        outline: 4px solid color-mix(in srgb, var(--quiz-yellow-deep) 45%, transparent);
        outline-offset: 3px;
      }

      .quiz-card.green { background: var(--quiz-green-soft); }
      .quiz-card.blue { background: var(--quiz-sky); }
      .quiz-card.yellow { background: var(--quiz-yellow); }
      .quiz-card.purple { background: color-mix(in srgb, var(--quiz-purple) 10%, white); }
      .quiz-card.pink { background: #fff0f5; }

      .quiz-card-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
      }

      .quiz-card-icon {
        width: 66px;
        height: 66px;
        border-radius: 24px;
        display: grid;
        place-items: center;
        background: rgba(255, 255, 255, 0.82);
        font-size: 36px;
        flex: 0 0 auto;
        box-shadow: inset 0 0 0 1px rgba(255,255,255,0.65);
      }

      .quiz-card h3 {
        margin: 14px 0 8px;
        color: var(--quiz-ink);
        font-size: 25px;
        line-height: 1.05;
        font-weight: 1000;
        letter-spacing: -0.035em;
      }

      .quiz-card p {
        margin: 0;
        color: var(--quiz-muted);
        font-size: 15px;
        line-height: 1.5;
        font-weight: 850;
      }

      .quiz-action,
      .quiz-primary,
      .quiz-secondary,
      .quiz-game-start-btn {
        min-height: 50px;
        border-radius: 18px;
        font-size: 15px;
        font-weight: 1000;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        line-height: 1;
      }

      .quiz-action,
      .quiz-primary,
      .quiz-game-start-btn {
        border: 0;
        padding: 0 22px;
        background: linear-gradient(135deg, var(--quiz-green), var(--quiz-green-dark));
        color: #ffffff;
        box-shadow: 0 12px 20px rgba(21, 150, 90, 0.16);
      }

      .quiz-game-start-btn {
        min-height: 60px;
        border-radius: 22px;
        padding: 0 28px;
        font-size: 18px;
      }

      .quiz-secondary {
        border: 2px solid color-mix(in srgb, var(--quiz-green) 22%, transparent);
        padding: 0 20px;
        background: #ffffff;
        color: var(--quiz-green-dark);
      }

      .quiz-primary:disabled,
      .quiz-secondary:disabled,
      .quiz-choice:disabled {
        cursor: not-allowed;
        opacity: 0.72;
      }

      .quiz-game-stage {
        padding: 24px;
      }

      .quiz-game-stage-inner {
        display: grid;
        gap: 18px;
      }

      .quiz-game-header {
        justify-content: space-between;
        padding: 16px 18px;
        border-radius: 26px;
        background: rgba(255, 255, 255, 0.82);
        border: 1px solid color-mix(in srgb, var(--quiz-green) 10%, transparent);
      }

      .quiz-game-title-line {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
      }

      .quiz-game-title-icon {
        width: 54px;
        height: 54px;
        border-radius: 18px;
        display: grid;
        place-items: center;
        background: var(--quiz-yellow);
        font-size: 30px;
        flex: 0 0 auto;
      }

      .quiz-game-title-line h2 {
        margin: 0;
        color: var(--quiz-ink);
        font-size: clamp(23px, 3vw, 36px);
        line-height: 1.04;
        font-weight: 1000;
        letter-spacing: -0.045em;
      }

      .quiz-game-title-line small {
        display: block;
        margin-top: 3px;
        color: var(--quiz-muted);
        font-size: 13px;
        font-weight: 900;
      }

      .quiz-progress-line {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 12px;
        color: var(--quiz-muted);
        font-weight: 950;
      }

      .quiz-progress-track {
        height: 14px;
        border-radius: 999px;
        background: #eaf4ee;
        overflow: hidden;
        border: 1px solid color-mix(in srgb, var(--quiz-green) 12%, transparent);
      }

      .quiz-progress-track span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, var(--quiz-green), var(--quiz-yellow-deep));
      }

      .quiz-question-box {
        position: relative;
        display: grid;
        grid-template-columns: minmax(0, 1fr) 190px;
        gap: 22px;
        align-items: center;
        border-radius: 30px;
        padding: 26px;
        background:
          radial-gradient(circle at 10% 20%, rgba(255, 255, 255, 0.72), transparent 18%),
          linear-gradient(135deg, #ffffff, var(--quiz-yellow) 55%, var(--quiz-sky));
        border: 1px solid color-mix(in srgb, var(--quiz-yellow-deep) 28%, transparent);
      }

      .quiz-question-box small {
        display: inline-flex;
        width: max-content;
        min-height: 32px;
        align-items: center;
        padding: 0 12px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.78);
        color: var(--quiz-green-dark);
        font-weight: 1000;
      }

      .quiz-question-box h2 {
        margin: 12px 0 0;
        color: var(--quiz-ink);
        font-size: clamp(28px, 3.6vw, 48px);
        line-height: 1.08;
        letter-spacing: -0.05em;
        font-weight: 1000;
      }

      .quiz-question-mascot {
        min-height: 172px;
        border-radius: 28px;
        display: grid;
        place-items: center;
        background: rgba(255, 255, 255, 0.72);
        font-size: 88px;
        box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.68);
      }

      .quiz-choice-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }

      .quiz-choice {
        border: 0;
        min-height: 88px;
        padding: 16px 18px;
        border-radius: 24px;
        background: #ffffff;
        color: var(--quiz-ink);
        text-align: left;
        font-size: 17px;
        line-height: 1.35;
        font-weight: 950;
        cursor: pointer;
        box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--quiz-green) 10%, transparent), 0 10px 18px rgba(31, 73, 61, 0.04);
        transition: transform 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
      }

      .quiz-choice-letter {
        width: 38px;
        height: 38px;
        margin-right: 10px;
        border-radius: 14px;
        display: inline-grid;
        place-items: center;
        background: var(--quiz-green-soft);
        color: var(--quiz-green-dark);
        font-size: 15px;
        font-weight: 1000;
      }

      .quiz-choice.selected {
        background: var(--quiz-yellow);
        box-shadow: inset 0 0 0 4px color-mix(in srgb, var(--quiz-yellow-deep) 30%, transparent), 0 8px 0 color-mix(in srgb, var(--quiz-yellow-deep) 32%, transparent);
      }

      .quiz-choice.correct {
        background: var(--quiz-green-soft);
        box-shadow: inset 0 0 0 4px color-mix(in srgb, var(--quiz-green) 24%, transparent), 0 8px 0 color-mix(in srgb, var(--quiz-green) 18%, transparent);
      }

      .quiz-choice.incorrect {
        background: #fff8f8;
        box-shadow: inset 0 0 0 4px rgba(239, 68, 68, 0.18), 0 8px 0 rgba(239, 68, 68, 0.08);
      }

      .quiz-feedback {
        display: grid;
        grid-template-columns: 64px minmax(0, 1fr);
        gap: 14px;
        align-items: center;
        padding: 18px;
        border-radius: 24px;
        background: #ffffff;
        border: 1px solid color-mix(in srgb, var(--quiz-green) 10%, transparent);
        box-shadow: 0 12px 24px rgba(31, 73, 61, 0.05);
      }

      .quiz-feedback.correct {
        background: var(--quiz-green-soft);
        border-color: color-mix(in srgb, var(--quiz-green) 26%, transparent);
      }

      .quiz-feedback.incorrect {
        background: #fff8f8;
        border-color: rgba(239, 68, 68, 0.18);
      }

      .quiz-feedback-icon {
        width: 64px;
        height: 64px;
        border-radius: 22px;
        display: grid;
        place-items: center;
        background: rgba(255, 255, 255, 0.78);
        font-size: 34px;
      }

      .quiz-feedback h3 {
        margin: 0;
        color: var(--quiz-ink);
        font-size: 22px;
        font-weight: 1000;
        letter-spacing: -0.035em;
      }

      .quiz-feedback p {
        margin: 6px 0 0;
        color: var(--quiz-muted);
        font-size: 15px;
        line-height: 1.45;
        font-weight: 850;
      }

      .quiz-nav-actions,
      .quiz-result-actions {
        justify-content: space-between;
      }

      .quiz-game-results {
        padding: 32px;
        text-align: center;
      }

      .quiz-game-results-inner {
        display: grid;
        justify-items: center;
        gap: 16px;
      }

      .quiz-result-mascot {
        width: 138px;
        height: 138px;
        border-radius: 44px;
        display: grid;
        place-items: center;
        background: #ffffff;
        font-size: 76px;
        box-shadow: 0 16px 34px rgba(31, 73, 61, 0.10), inset 0 0 0 3px color-mix(in srgb, var(--quiz-yellow) 50%, transparent);
      }

      .quiz-score-badge {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        min-height: 78px;
        padding: 0 30px;
        border-radius: 28px;
        background: #ffffff;
        color: var(--quiz-ink);
        font-size: clamp(30px, 4vw, 46px);
        font-weight: 1000;
        box-shadow: 0 12px 24px rgba(31, 73, 61, 0.08);
      }

      .quiz-game-stars {
        display: flex;
        justify-content: center;
        gap: 6px;
        font-size: 28px;
        line-height: 1;
      }

      .quiz-game-stars .kid-star {
        filter: grayscale(1);
        opacity: 0.38;
      }

      .quiz-game-stars .kid-star.on {
        filter: none;
        opacity: 1;
      }

      .quiz-result-rewards {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
        width: min(720px, 100%);
      }

      .quiz-reward-box {
        padding: 16px;
        border-radius: 22px;
        background: #ffffff;
        border: 1px solid color-mix(in srgb, var(--quiz-green) 10%, transparent);
      }

      .quiz-reward-box b {
        display: block;
        color: var(--quiz-ink);
        font-size: 22px;
        font-weight: 1000;
      }

      .quiz-reward-box span {
        display: block;
        margin-top: 3px;
        color: var(--quiz-muted);
        font-size: 13px;
        font-weight: 900;
      }

      .quiz-review-list {
        display: grid;
        gap: 12px;
      }

      .quiz-review-item {
        border-radius: 22px;
        padding: 16px;
        background: #ffffff;
        border: 1px solid #e7f0ea;
      }

      .quiz-review-item.correct {
        background: var(--quiz-green-soft);
        border-color: color-mix(in srgb, var(--quiz-green) 26%, transparent);
      }

      .quiz-review-item.wrong {
        background: #fff8f8;
        border-color: rgba(239, 68, 68, 0.18);
      }

      .quiz-review-item b {
        color: var(--quiz-ink);
      }

      .quiz-review-item p {
        margin: 7px 0 0;
        color: var(--quiz-muted);
        font-weight: 850;
        line-height: 1.45;
      }

      .g12-page .quiz-stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .g12-page .quiz-card {
        min-height: 210px;
        border-radius: 34px;
        border: 3px solid rgba(255, 255, 255, 0.70);
        box-shadow: 0 8px 0 rgba(21, 150, 90, 0.09), 0 18px 28px rgba(21, 150, 90, 0.09);
      }
      .g12-page .quiz-card h3 { font-size: 24px; }
      .g12-page .quiz-choice { min-height: 90px; border-radius: 26px; font-size: 18px; }
      .g12-page .quiz-game-stage,
      .g12-page .quiz-game-results,
      .g12-page .quiz-game-landing-card { border-radius: 36px; }

      @media (max-width: 980px) {
        .quiz-game-landing-card,
        .quiz-question-box,
        .quiz-result-rewards {
          grid-template-columns: 1fr;
        }
        .quiz-question-mascot { min-height: 124px; font-size: 64px; }
      }

      @media (max-width: 900px) {
        .quiz-stat-grid,
        .quiz-card-grid,
        .quiz-choice-grid {
          grid-template-columns: 1fr;
        }
        .quiz-progress-line { grid-template-columns: 1fr; }
        .quiz-game-header,
        .quiz-nav-actions,
        .quiz-result-actions { align-items: stretch; flex-direction: column; }
        .quiz-secondary,
        .quiz-primary,
        .quiz-game-start-btn { width: 100%; }
      }
    `}</style>
  );
}

function QuizMascotScene({ mascot = '🧠', compact = false }) {
  return (
    <div className="quiz-game-mascot-scene" aria-hidden="true">
      <span className="quiz-game-float one">Aa</span>
      <span className="quiz-game-float two">⭐</span>
      <span className="quiz-game-float three">✓</span>
      <div className="quiz-game-mascot" style={compact ? { width: 112, height: 112, fontSize: 62 } : undefined}>{mascot}</div>
    </div>
  );
}

function QuizMetricCard({ value, label }) {
  return (
    <div className="quiz-stat">
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}

function QuizGameProgress({ currentIndex = 0, total = 0, answeredCount = 0 }) {
  const progress = total ? Math.round(((currentIndex + 1) / total) * 100) : 0;
  return (
    <div className="quiz-progress-line" aria-label="Quiz progress">
      <span>Question {Math.min(currentIndex + 1, Math.max(total, 1))} of {total || 1}</span>
      <div className="quiz-progress-track" role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100">
        <span style={{ width: `${progress}%` }} />
      </div>
      <span>{answeredCount}/{total} answered</span>
    </div>
  );
}

function QuizGameHeader({ quiz, best, go, onBack }) {
  return (
    <header className="quiz-game-header">
      <div className="quiz-game-title-line">
        <span className="quiz-game-title-icon">{subjectTheme(quiz?.subject).icon || '🧠'}</span>
        <div>
          <h2>{quiz?.title || 'Quiz'}</h2>
          <small>{quiz?.subject || 'Filipino'} • {quiz?.type || 'Practice Quiz'} {best ? `• Best ${best.percent}%` : ''}</small>
        </div>
      </div>

      <div className="quiz-game-toolbar" style={{ marginBottom: 0 }}>
        <button type="button" className="quiz-secondary" onClick={onBack || (() => go('screen-stu-quizzes'))}>← Back</button>
        <button type="button" className="quiz-game-help" title="Basahin ang tanong at piliin ang sagot. Makikita ang feedback pagkatapos mong i-submit ang quiz.">?</button>
      </div>
    </header>
  );
}

function QuizStartCard({ quiz, best, onStart, onBack }) {
  return (
    <section className="quiz-game-landing-card" aria-label="Quiz start">
      <div className="quiz-game-copy">
        <div className="quiz-pill-row">
          <span className="quiz-pill">{subjectTheme(quiz?.subject).icon || '📚'} {quiz?.subject || 'Filipino'}</span>
          <span className="quiz-pill">{asArray(quiz?.questions).length} question{asArray(quiz?.questions).length === 1 ? '' : 's'}</span>
          <span className="quiz-pill">+{quiz?.xpReward || 0} XP preview</span>
        </div>
        <h2>Ready ka na sa Quiz Quest?</h2>
        <p>
          Basahin ang bawat tanong at piliin ang pinakamagandang sagot. Makikita ang score at review feedback pagkatapos mong i-submit ang quiz.
        </p>
        {best && <p><strong>Best score:</strong> {best.score}/{best.total} ({best.percent}%) • {best.mastery?.label || 'Progress saved'}</p>}
        <div className="quiz-result-actions" style={{ justifyContent: 'flex-start', marginTop: 18 }}>
          <button type="button" className="quiz-game-start-btn" onClick={onStart}>🚀 Start Quiz</button>
          <button type="button" className="quiz-secondary" onClick={onBack}>← Back to Quizzes</button>
        </div>
      </div>

      <QuizMascotScene mascot="🦉" />
    </section>
  );
}

function QuizAnswerButton({ option, index, selected, reveal, correct, onClick }) {
  const stateClass = reveal
    ? correct
      ? 'correct'
      : selected
        ? 'incorrect'
        : ''
    : selected
      ? 'selected'
      : '';

  return (
    <button
      type="button"
      className={`quiz-choice ${stateClass}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      <span className="quiz-choice-letter">{String.fromCharCode(65 + index)}</span>
      {option.text}
    </button>
  );
}

function QuizFeedbackMessage({ selectedOption, correctOption }) {
  if (!selectedOption) {
    return (
      <div className="quiz-feedback">
        <div className="quiz-feedback-icon">💡</div>
        <div>
          <h3>Piliin ang sagot mo.</h3>
          <p>Take your time. Basahin muna ang tanong bago pumili.</p>
        </div>
      </div>
    );
  }

  const correct = String(selectedOption.id) === String(correctOption?.id);
  return (
    <div className={`quiz-feedback ${correct ? 'correct' : 'incorrect'}`} role="status" aria-live="polite">
      <div className="quiz-feedback-icon">{correct ? '🎉' : '🌱'}</div>
      <div>
        <h3>{correct ? 'Tama! Great job!' : 'Good try! Balikan natin.'}</h3>
        <p>
          {correct
            ? 'Nakuha mo ang tamang sagot. Magpatuloy sa susunod na tanong.'
            : `Ang tamang sagot ay: ${correctOption?.text || '—'}. Maaari mong gamitin ito sa review pagkatapos ng quiz.`}
        </p>
      </div>
    </div>
  );
}

function QuizQuestionCard({ quiz, question, currentIndex, total }) {
  return (
    <section className="quiz-question-box" aria-label={`Question ${currentIndex + 1}`}>
      <div>
        <small>{quiz?.subject || 'Filipino'} • {question?.source || 'Quiz Check'}</small>
        <h2>{question?.prompt || 'Piliin ang tamang sagot.'}</h2>
      </div>
      <div className="quiz-question-mascot" aria-hidden="true">
        {currentIndex + 1 >= total ? '🏁' : '🧠'}
      </div>
    </section>
  );
}

function QuizResultCard({ result }) {
  const mastery = result?.mastery || masteryFromPercent(result?.percent || 0);
  const starCount = Math.max(1, Math.min(5, Math.ceil(Number(result?.percent || 0) / 20)));
  return (
    <section className="quiz-game-results" aria-label="Quiz result">
      <div className="quiz-game-results-inner">
        <div className="quiz-result-mascot" aria-hidden="true">{mastery.icon || '🏆'}</div>
        <h2>{mastery.label}</h2>
        <div className="quiz-game-stars"><StarRow count={starCount} max={5} /></div>
        <p>{mastery.note}</p>
        <div className="quiz-score-badge">{result.percent}/100</div>
        <div className="quiz-result-rewards">
          <div className="quiz-reward-box"><b>{result.score}/{result.total}</b><span>Raw score</span></div>
          <div className="quiz-reward-box"><b>+{result.xpReward || 0}</b><span>XP reward preview</span></div>
          <div className="quiz-reward-box"><b>{result.attemptNo || 1}</b><span>Attempt number</span></div>
        </div>
      </div>
    </section>
  );
}

function StudentQuizzes({ data, go, openQuiz, quizAttempts = {} }) {
  const student = data?.student || {};
  const early = Number(student?.gradeLevel || 4) <= 2;
  const quizzes = buildStudentQuizzes(data);
  const recommendedQuiz = quizzes.find(quiz => !asArray(quizAttempts?.[quiz.id]).length) || quizzes[0];
  const subjectCounts = SUBJECTS.map(subject => ({
    ...subject,
    count: quizzes.filter(quiz => quiz.subject === subject.name).length
  })).filter(item => item.count > 0);

  const cards = quizzes.map((quiz, index) => {
    const best = getBestQuizAttempt(quizAttempts, quiz.id);
    const mastery = best?.mastery || masteryFromPercent(0);
    const subjectMeta = SUBJECTS.find(subject => subject.name === quiz.subject) || SUBJECTS[index % SUBJECTS.length] || SUBJECTS[0];
    return { quiz, best, mastery, tone: mastery.tone || subjectMeta.tone || 'green', icon: subjectTheme(quiz.subject).icon || '🧠' };
  });

  const quizContent = (
    <>
      <QuizSharedStyles />
      <div className="quiz-shell">
        <section className={early ? 'g12-section-card' : 'g46-ref-panel'}>
          <div className={early ? 'g12-section-head' : 'g46-ref-panel-head'}>
            <div>
              <h2 className={early ? 'g12-section-title' : ''}>{early ? '🧠 Mga Quiz' : 'Quiz List'}</h2>
              <p className={early ? 'g12-section-subtitle' : 'g46-ref-muted'}>
                {early
                  ? 'Pumili ng quiz. Makikita ang feedback pagkatapos i-submit.'
                  : 'Choose a quiz to check lesson mastery and review results after submission.'}
              </p>
            </div>
            {recommendedQuiz && (
              <button type="button" className="quiz-secondary" onClick={() => openQuiz(recommendedQuiz)}>
                🚀 Start Recommended
              </button>
            )}
          </div>

          {subjectCounts.length > 0 && (
            <div className="quiz-game-subject-row" aria-label="Quiz subject counts">
              {subjectCounts.map(subject => <span className="quiz-game-subject-chip" key={subject.name}>{subject.icon} {subject.name}: {subject.count}</span>)}
            </div>
          )}

          <div className="quiz-card-grid">
            {cards.map(({ quiz, best, mastery, tone, icon }) => (
              <button type="button" className={`quiz-card ${tone}`} key={quiz.id} onClick={() => openQuiz(quiz)}>
                <div>
                  <div className="quiz-card-head">
                    <span className="quiz-card-icon">{icon}</span>
                    <span className="quiz-pill">{best ? `${best.percent}% ${mastery.label}` : 'Not taken yet'}</span>
                  </div>
                  <h3>{quiz.title}</h3>
                  <p>{quiz.subject} • Grade {quiz.gradeLevel} • {quiz.questions.length} question{quiz.questions.length === 1 ? '' : 's'} • +{quiz.xpReward} XP</p>
                  <div className="quiz-pill-row">
                    <span className="quiz-pill">{quiz.type}</span>
                    {best && <span className="quiz-pill">Best: {best.score}/{best.total}</span>}
                  </div>
                </div>
                <span className="quiz-action" role="button" tabIndex={-1}>{best ? 'Retake Quiz' : 'Start Quiz'}</span>
              </button>
            ))}
          </div>

          {!quizzes.length && (
            <div className={early ? 'g12-empty' : 'g46-ref-empty'}>No quizzes yet. Create lessons with MCQ or matching activities first.</div>
          )}
        </section>
      </div>
    </>
  );

  if (early) {
    return (
      <EarlyStudentChrome
        data={data}
        activeTab="quizzes"
        go={go}
        icon="🧠"
        title="Quiz Quest"
        subtitle="Sagutin ang quiz para malaman kung naintindihan ang lesson."
      >
        {quizContent}
      </EarlyStudentChrome>
    );
  }

  return (
    <Grade46StudentChrome
      data={data}
      activeTab="quizzes"
      go={go}
      icon="🧠"
      title="Quizzes"
      subtitle="Separate assessment space for scores, mastery, attempts, and review feedback."
    >
      {quizContent}
    </Grade46StudentChrome>
  );
}

function StudentQuizPlay({ data, quiz, go, submitQuiz, quizAttempts = {} }) {
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const student = data?.student || {};
  const early = Number(student?.gradeLevel || 4) <= 2;
  const questions = asArray(quiz?.questions);
  const current = questions[currentIndex] || questions[0];
  const answeredCount = Object.keys(answers).length;
  const best = getBestQuizAttempt(quizAttempts, quiz?.id);
  const selectedId = current ? answers[current.id] : null;
  const hasSelectedAnswer = Boolean(selectedId);

  useEffect(() => {
    setStarted(false);
    setCurrentIndex(0);
    setAnswers({});
  }, [quiz?.id]);

  function selectAnswer(questionId, optionId) {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  }

  function confirmQuizExit() {
    if (!started) return true;
    return window.confirm(
      'Paalala: May sinasagutan ka pang Filipino quiz. Tapusin muna ang quiz para ma-save ang iyong score at review feedback. Pindutin ang Cancel para manatili at tapusin, o OK kung aalis ka muna.'
    );
  }

  function goWithQuizGuard(targetScreen) {
    if (!confirmQuizExit()) return;
    go(targetScreen);
  }

  function beforeQuizNavigate() {
    return confirmQuizExit();
  }

  function nextQuestion() {
    setCurrentIndex(index => Math.min(questions.length - 1, index + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function previousQuestion() {
    setCurrentIndex(index => Math.max(0, index - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function finishQuiz() {
    if (answeredCount < questions.length) {
      const proceed = window.confirm(`May ${answeredCount}/${questions.length} ka pang nasagutan. I-submit na ba ang quiz kahit may hindi pa nasasagutan?`);
      if (!proceed) return;
    }
    submitQuiz(quiz, answers);
  }

  let quizInnerContent = null;

  if (!questions.length) {
    quizInnerContent = (
      <section className="quiz-game-panel" style={{ padding: 28 }}>
        <div className="quiz-game-copy" style={{ position: 'relative', zIndex: 1 }}>
          <h2>No questions yet</h2>
          <p>This quiz does not have questions. Please return to the quiz list.</p>
          <button type="button" className="quiz-secondary" onClick={() => go('screen-stu-quizzes')} style={{ marginTop: 18 }}>← Back to Quizzes</button>
        </div>
      </section>
    );
  } else if (!started) {
    quizInnerContent = (
      <QuizStartCard
        quiz={quiz}
        best={best}
        onStart={() => setStarted(true)}
        onBack={() => go('screen-stu-quizzes')}
      />
    );
  } else {
    quizInnerContent = (
      <section className="quiz-game-stage" aria-label="Active quiz">
        <div className="quiz-game-stage-inner">
          <QuizGameHeader quiz={quiz} best={best} go={go} onBack={() => goWithQuizGuard('screen-stu-quizzes')} />
          <QuizGameProgress currentIndex={currentIndex} total={questions.length} answeredCount={answeredCount} />
          <QuizQuestionCard quiz={quiz} question={current} currentIndex={currentIndex} total={questions.length} />

          <div className="quiz-choice-grid">
            {asArray(current?.options).map((option, index) => (
              <QuizAnswerButton
                key={option.id}
                option={option}
                index={index}
                selected={String(selectedId) === String(option.id)}
                reveal={false}
                correct={false}
                onClick={() => selectAnswer(current.id, option.id)}
              />
            ))}
          </div>

          <div className="quiz-nav-actions">
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" className="quiz-secondary" onClick={() => goWithQuizGuard('screen-stu-quizzes')}>← Back to Quizzes</button>
              <button type="button" className="quiz-secondary" onClick={previousQuestion} disabled={currentIndex === 0}>Previous</button>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {currentIndex < questions.length - 1 ? (
                <button type="button" className="quiz-primary" onClick={nextQuestion}>{hasSelectedAnswer ? 'Next Question →' : 'Skip for now →'}</button>
              ) : (
                <button type="button" className="quiz-primary" onClick={finishQuiz}>Submit Quiz</button>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  const quizContent = (
    <>
      <QuizSharedStyles />
      <div className="quiz-shell">
        {quizInnerContent}
      </div>
    </>
  );

  if (early) {
    return (
      <EarlyStudentChrome
        data={data}
        activeTab="quizzes"
        go={go}
        icon="🧠"
        title={started ? 'Quiz Time' : 'Quiz Quest'}
        subtitle={started ? 'Tapusin muna ang quiz bago lumipat sa ibang tab.' : (quiz?.title || 'Sagutin ang tanong.')}
        beforeNavigate={beforeQuizNavigate}
      >
        {quizContent}
      </EarlyStudentChrome>
    );
  }

  return (
    <Grade46StudentChrome
      data={data}
      activeTab="quizzes"
      go={go}
      icon="🧠"
      title={quiz?.title || 'Quiz'}
      subtitle={started ? 'Finish the quiz first before moving to another learning tab.' : 'Answer each item, then review your score and feedback after submission.'}
      titleAction={<button type="button" className="g46-ref-soft-btn" onClick={() => goWithQuizGuard('screen-stu-quizzes')}>← Quizzes</button>}
      beforeNavigate={beforeQuizNavigate}
    >
      {quizContent}
    </Grade46StudentChrome>
  );
}

function StudentQuizResult({ data, result, go, openQuiz }) {
  const early = Number(data?.student?.gradeLevel || 4) <= 2;
  const mastery = result?.mastery || masteryFromPercent(result?.percent || 0);
  const sourceQuiz = buildStudentQuizzes(data).find(quiz => quiz.id === result.quizId);
  const quizForRetake = {
    id: result.quizId,
    lessonId: result.lessonId,
    lessonTitle: result.lessonTitle,
    title: result.quizTitle,
    subject: result.subject,
    gradeLevel: result.gradeLevel,
    type: 'Retake Quiz',
    xpReward: sourceQuiz?.xpReward || result.xpReward || 0,
    questions: sourceQuiz?.questions || []
  };

  const resultContent = (
    <>
      <QuizSharedStyles />
      <div className="quiz-shell">
        <QuizResultCard result={{ ...result, mastery }} />

        <section className={early ? 'g12-section-card' : 'g46-ref-panel'}>
          <div className={early ? 'g12-section-head' : 'g46-ref-panel-head'}>
            <div>
              <h2 className={early ? 'g12-section-title' : ''}>Review Feedback</h2>
              <p className={early ? 'g12-section-subtitle' : 'g46-ref-muted'}>Tingnan kung aling items ang tama at alin ang kailangan pang balikan.</p>
            </div>
          </div>

          <div className="quiz-review-list">
            {asArray(result.review).map(item => (
              <div className={`quiz-review-item ${item.correct ? 'correct' : 'wrong'}`} key={item.questionId}>
                <b>{item.correct ? '✅' : '❌'} {item.index}. {item.prompt}</b>
                <p>Your answer: {item.selectedText}</p>
                {!item.correct && <p>Correct answer: {item.correctText}</p>}
              </div>
            ))}
          </div>
        </section>

        <div className="quiz-result-actions">
          <button type="button" className="quiz-secondary" onClick={() => go('screen-stu-quizzes')}>🧠 Back to Quizzes</button>
          {quizForRetake.questions.length > 0 && <button type="button" className="quiz-primary" onClick={() => openQuiz(quizForRetake)}>Retake Quiz</button>}
          <button type="button" className="quiz-secondary" onClick={() => go('screen-lessons')}>📖 Review Lessons</button>
        </div>
      </div>
    </>
  );

  if (early) {
    return (
      <EarlyStudentChrome
        data={data}
        activeTab="quizzes"
        go={go}
        icon="🏆"
        title="Quiz Result"
        subtitle="Narito ang iyong score, stars, at feedback."
      >
        {resultContent}
      </EarlyStudentChrome>
    );
  }

  return (
    <Grade46StudentChrome
      data={data}
      activeTab="quizzes"
      go={go}
      icon="🏆"
      title="Quiz Result"
      subtitle="Use this review to decide what to study next."
    >
      {resultContent}
    </Grade46StudentChrome>
  );
}

function StudentMissions({ data, go, onPlayMission }) {
  const student = data?.student || {};
  const gradeLevel = Number(student?.gradeLevel || 4);
  const early = gradeLevel <= 2;
  const xp = Number(student?.xp || 0);
  const level = data?.level || levelForXp(xp);
  const xpPct = xpPercent(xp);
  const completedLessons = asArray(data?.lessons).filter(lesson => lesson?.completed).length;
  const badgeCount = asArray(data?.badges).length;
  const games = missionGamesForStudent(data);
  const availableCount = games.filter(game => game.status !== 'Locked').length;
  const completedCount = games.filter(game => game.status === 'Completed').length;
  const nextBadgeProgress = Math.min(3, completedLessons);

  const openTab = (tab) => {
    if (tab === 'home') return go('screen-student');
    if (tab === 'lessons') return go('screen-lessons');
    if (tab === 'quizzes') return go('screen-stu-quizzes');
    if (tab === 'missions') return go('screen-stu-missions');
    if (tab === 'groups') return go('screen-stu-groups');
    if (tab === 'profile') return go('screen-stu-profile');
  };

  const playMission = (game) => {
    if (!game || game.status === 'Locked') return;
    if (typeof onPlayMission === 'function') {
      onPlayMission(game.id);
      return;
    }
    go('screen-stu-mission-play');
  };

  const content = (
    <>
      <MissionStyles />

      <div className={`missions-wrap ${early ? 'early' : 'standard'}`}>
        <section className="missions-hero">
          <div className="missions-hero-copy">
            <div className="missions-hero-icon">🚀</div>
            <h2>{early ? 'Tuklas Missions' : 'Learning Games'}</h2>
            <p>
              {early
                ? 'Pumili ng game at pindutin ang Play. Sagutin ang challenge para sa XP preview!'
                : 'A separate game-based Filipino learning area where each card opens its own mission screen for vocabulary, reading, writing, comprehension, and oral communication practice.'}
            </p>
          </div>

          <div className="missions-progress-card">
            <strong>🪙 {xp} XP • Level {level}</strong>
            <div className="missions-progress-track">
              <span className="missions-progress-fill" style={{ width: `${Math.max(6, xpPct)}%` }} />
            </div>
            <p style={{ margin: '12px 0 0', color: '#526988', fontWeight: 850 }}>
              {100 - xpPct} XP pa bago ang susunod na level.
            </p>
          </div>
        </section>

        <section className="missions-stat-grid" aria-label="Mission progress summary">
          <div className="missions-stat-card"><b>{availableCount}</b><span>Available games</span></div>
          <div className="missions-stat-card"><b>{completedCount}</b><span>Completed missions</span></div>
          <div className="missions-stat-card"><b>{badgeCount}</b><span>Unlocked badges</span></div>
          <div className="missions-stat-card"><b>{nextBadgeProgress}/3</b><span>Badge challenge</span></div>
        </section>

        <section className="missions-section">
          <div className="missions-section-head">
            <div>
              <h3>🎮 Available Learning Games</h3>
              <p>Tap Play to open a Filipino learning game. Earn XP preview and keep your streak going!</p>
            </div>
          </div>

          <div className="missions-game-grid">
            {games.map(game => {
              const locked = game.status === 'Locked';

              return (
                <button
                  type="button"
                  className={`missions-game-card ${game.tone} ${locked ? 'locked' : ''}`}
                  key={game.id}
                  onClick={() => playMission(game)}
                  disabled={locked}
                >
                  <div>
                    <div className="missions-game-top">
                      <span className="missions-game-icon">{game.icon}</span>
                      <span className="missions-status">{game.status}</span>
                    </div>
                    <h4>{game.title}</h4>
                    <p>{game.short}</p>
                    <div className="missions-tag-row">
                      <span className="missions-tag">{game.module}</span>
                      <span className="missions-tag">+{game.xp} XP</span>
                    </div>
                  </div>

                  <span
                    className={`missions-play-btn ${locked ? 'locked' : ''}`}
                    role="button"
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    {locked ? '🔒 Locked' : '▶ Play'}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="missions-badge-card">
          <h3>🏅 Badge Preview</h3>
          <p>Keep playing learning games to unlock more rewards and stay motivated.</p>
          <div className="missions-badge-preview-row">
            <div className="missions-badge-preview"><div><span>🔤</span>Bokabularyo Star</div></div>
            <div className="missions-badge-preview"><div><span>📖</span>Pagbasa Hero</div></div>
            <div className="missions-badge-preview"><div><span>🎙️</span>Oral Champ</div></div>
          </div>
        </section>
      </div>
    </>
  );

  if (early) {
    return (
      <EarlyStudentChrome
        data={data}
        activeTab="missions"
        go={go}
        icon="🎮"
        title="Tuklas Missions"
        subtitle="Pumili ng game, pindutin ang Play, at sagutin ang challenge."
      >
        {content}
      </EarlyStudentChrome>
    );
  }

  return (
    <Grade46StudentChrome
      data={data}
      activeTab="missions"
      go={go}
      icon="🎮"
      title="Tuklas Missions"
      subtitle="Play Filipino learning games connected to vocabulary, reading, writing, comprehension, and oral communication."
    >
      {content}
    </Grade46StudentChrome>
  );
}

function StudentMissionPlay({ data, go, selectedGameId = 'word-match', onBack }) {
  const [missionChoice, setMissionChoice] = useState('');
  const [missionResult, setMissionResult] = useState('');
  const student = data?.student || {};
  const gradeLevel = Number(student?.gradeLevel || 4);
  const early = gradeLevel <= 2;
  const xp = Number(student?.xp || 0);
  const games = missionGamesForStudent(data);
  const selectedGame = games.find(game => game.id === selectedGameId) || games[0];
  const demo = getMissionDemo(selectedGame?.id);
  const locked = selectedGame?.status === 'Locked';

  useEffect(() => {
    setMissionChoice('');
    setMissionResult('');
  }, [selectedGame?.id]);

  const openTab = (tab) => {
    if (tab === 'home') return go('screen-student');
    if (tab === 'lessons') return go('screen-lessons');
    if (tab === 'quizzes') return go('screen-stu-quizzes');
    if (tab === 'missions') return go('screen-stu-missions');
    if (tab === 'groups') return go('screen-stu-groups');
    if (tab === 'profile') return go('screen-stu-profile');
  };

  const backToMissions = () => {
    if (typeof onBack === 'function') {
      onBack();
      return;
    }
    go('screen-stu-missions');
  };

  const checkMissionAnswer = (choice) => {
    if (!demo || locked) return;

    setMissionChoice(choice);
    if (choice === demo.correct) {
      setMissionResult(`✅ ${demo.success} Demo reward: +${selectedGame?.xp || 0} XP preview.`);
    } else {
      setMissionResult('⭐ Hindi pa tama. Subukan muli!');
    }
  };

  const restartDemo = () => {
    setMissionChoice('');
    setMissionResult('');
  };

  const content = (
    <>
      <MissionStyles />

      <div className={`missions-wrap ${early ? 'early' : 'standard'}`}>
        <section className="mission-play-shell">
          <div className="mission-play-card">
            <div className="mission-play-head">
              <div className="mission-play-icon">{selectedGame?.icon || '🎮'}</div>
              <div>
                <h2>{selectedGame?.title || 'Mission'}</h2>
                <p>
                  {locked
                    ? 'This mission is still locked. Complete more lessons or games to unlock it.'
                    : `${selectedGame?.module || 'Filipino'} mission • +${selectedGame?.xp || 0} XP preview • ${selectedGame?.status || 'Available'}`}
                </p>
              </div>
            </div>

            {locked ? (
              <>
                <div className="mission-prompt-box">
                  🔒 Locked mission. Complete {selectedGame?.minCompleted || 3} lessons or missions to unlock this challenge.
                </div>

                <div className="mission-play-actions">
                  <button type="button" className="mission-play-action secondary" onClick={backToMissions}>
                    ← Back to Missions
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mission-prompt-box">
                  <strong>Mission:</strong> {demo?.prompt}
                  <br />
                  <strong>Clue:</strong> {demo?.sample}
                </div>

                <div className="mission-play-options" aria-label="Mission choices">
                  {(demo?.options || []).map(choice => (
                    <button
                      type="button"
                      className={`mission-play-choice ${missionChoice === choice ? 'selected' : ''}`}
                      key={choice}
                      onClick={() => checkMissionAnswer(choice)}
                    >
                      {choice}
                    </button>
                  ))}
                </div>

                {missionResult && (
                  <div className={`mission-result ${missionResult.includes('✅') ? 'good' : ''}`}>
                    {missionResult}
                  </div>
                )}

                <div className="mission-play-actions">
                  <button type="button" className="mission-play-action secondary" onClick={backToMissions}>
                    ← Back to Missions
                  </button>
                  <button type="button" className="mission-play-action" onClick={restartDemo}>
                    🔄 Restart
                  </button>
                  <button type="button" className="mission-play-action purple" onClick={() => openTab('lessons')}>
                    📖 Go to Lessons
                  </button>
                </div>

                <p style={{ margin: '18px 0 0', color: '#526988', fontWeight: 850 }}>
                  Frontend demo only: XP is previewed here. Real mission completion, saved XP, streaks, and badge unlocks can be connected to backend routes later.
                </p>
              </>
            )}
          </div>
        </section>
      </div>
    </>
  );

  if (early) {
    return (
      <>
        <EarlyStudentSubpageStyles />
        <div className="g12-page">
          <header className="g12-topbar">
            <button type="button" className="g12-brand" onClick={backToMissions}>
              <span className="g12-brand-icon">{selectedGame?.icon || '🎮'}</span>
              <span>{selectedGame?.title || 'Mission'}</span>
            </button>

            <div className="g12-top-actions">
              <div className="g12-pill">🌸 Grade {student.gradeLevel || '—'} • {student.section || '—'}</div>
              <div className="g12-pill">⚡ {xp} XP</div>
              <button type="button" className="g12-action-btn" onClick={backToMissions}>🎮 Missions</button>
              <button type="button" className="g12-action-btn" onClick={() => go('screen-student')}>🏠 Home</button>
            </div>
          </header>

          <main className="g12-shell g12-subpage-shell g12-mission-play-nohero">
            {content}
          </main>

          <nav className="g12-nav g12-mission-play-nav" aria-label="Student navigation">
            <button type="button" onClick={() => openTab('home')}><span className="g12-nav-icon">🏠</span>Home</button>
            <button type="button" onClick={() => openTab('lessons')}><span className="g12-nav-icon">📖</span>Lessons</button>
            <button type="button" className="active" onClick={() => openTab('missions')}><span className="g12-nav-icon">🎮</span>Missions</button>
            <button type="button" onClick={() => openTab('groups')}><span className="g12-nav-icon">👥</span>Groups</button>
            <button type="button" onClick={() => openTab('profile')}><span className="g12-nav-icon">🐰</span>Profile</button>
          </nav>
        </div>
      </>
    );
  }

  return (
    <Grade46StudentChrome
      data={data}
      activeTab="missions"
      go={go}
      icon={selectedGame?.icon || '🎮'}
      title={selectedGame?.title || 'Mission'}
      subtitle={`${selectedGame?.module || 'Filipino'} mission • +${selectedGame?.xp || 0} XP preview`}
      titleAction={<button type="button" className="g46-ref-soft-btn" onClick={backToMissions}>← Missions</button>}
    >
      {content}
    </Grade46StudentChrome>
  );
}

function EarlyGroupsScreen({ data, go, completeGroupTask }) {
  const groups = data?.groups || [];
  const roles = rolesForGradeLevel(data?.student?.gradeLevel);
  const [selectedRoles, setSelectedRoles] = useState({});
  const [doneTasks, setDoneTasks] = useState({});
  const [taskFeelings, setTaskFeelings] = useState({});

  async function markTaskDone(taskId) {
    setDoneTasks(prev => ({ ...prev, [taskId]: true }));
    await completeGroupTask(taskId);
  }

  return (
    <EarlyStudentChrome
      data={data}
      activeTab="groups"
      go={go}
      icon="👥"
      title="Team Missions"
      subtitle="Pumili ng role, gawin ang task, at tulungan ang iyong grupo."
    >
      <style>{`
        .g12-team-path { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 18px 0; }
        .g12-team-step { min-height: 76px; border-radius: 24px; padding: 12px; background: #ffffff; border: 2px solid rgba(21,150,90,0.12); display: grid; place-items: center; text-align: center; color: #14223b; font-weight: 1000; }
        .g12-role-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 14px; }
        .g12-role-choice { border: 0; min-height: 104px; border-radius: 28px; padding: 14px; background: #ffffff; box-shadow: inset 0 0 0 2px rgba(21,150,90,0.10); cursor: pointer; text-align: center; color: #14223b; font-weight: 1000; }
        .g12-role-choice.selected { background: #fff5cf; box-shadow: inset 0 0 0 4px rgba(246,196,83,0.34), 0 8px 0 rgba(246,196,83,0.44); }
        .g12-role-choice span { display: block; font-size: 36px; margin-bottom: 6px; }
        .g12-feeling-row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
        .g12-feeling-row button { border: 0; min-height: 48px; padding: 0 16px; border-radius: 18px; background: #ffffff; color: #14223b; font-size: 16px; font-weight: 1000; cursor: pointer; box-shadow: inset 0 0 0 1px rgba(21,150,90,0.14); }
        .g12-feeling-row button.selected { background: #edf8f1; color: #0f7d49; box-shadow: inset 0 0 0 3px rgba(21,150,90,0.18); }
      `}</style>

      <section className="g12-section-card">
        <div className="g12-section-head">
          <div>
            <h2 className="g12-section-title">👥 Team Missions</h2>
            <p className="g12-section-subtitle">Mas malinaw na ngayon ang gagawin: role → activity → self-check.</p>
          </div>
        </div>

        <div className="g12-team-path" aria-label="Group mission steps">
          <div className="g12-team-step">1️⃣ Pumili ng Role</div>
          <div className="g12-team-step">2️⃣ Gawin ang Task</div>
          <div className="g12-team-step">3️⃣ Sabihin kung kaya</div>
        </div>

        <div className="g12-card-grid">
          {groups.map(group => (
            <div className="g12-group-card" key={group.id}>
              <h3>👥 {group.name}</h3>
              <p className="g12-muted">{group.description || 'Team mission para sa Filipino practice.'}</p>

              <div className="g12-role-grid">
                {roles.map(role => (
                  <button
                    type="button"
                    key={`${group.id}-${role.id}`}
                    className={`g12-role-choice ${selectedRoles[group.id] === role.id ? 'selected' : ''}`}
                    onClick={() => setSelectedRoles(prev => ({ ...prev, [group.id]: role.id }))}
                  >
                    <span>{role.icon}</span>
                    {role.label}
                    <small style={{ display: 'block', marginTop: 6, color: '#526988', lineHeight: 1.3 }}>{role.helper}</small>
                  </button>
                ))}
              </div>

              {(group.tasks || []).map(task => {
                const pct = taskCompletionPercent(task, doneTasks[task.id]);
                return (
                  <div className="g12-task-card" key={task.id}>
                    <div className="g12-task-icon">{doneTasks[task.id] ? '🎉' : '🧩'}</div>
                    <div>
                      <h3 style={{ fontSize: 24, marginBottom: 6 }}>{task.title}</h3>
                      <p className="g12-muted">Due: {fmtDate(task.dueAt)} • +{task.xpReward || 0} XP</p>
                      <div className="g12-module-progress" style={{ marginTop: 10 }}><span style={{ width: `${pct}%` }} /></div>
                      <div className="g12-feeling-row">
                        {['😊 Madali', '😐 Sakto', '🙋 Help po'].map(choice => (
                          <button
                            type="button"
                            key={choice}
                            className={taskFeelings[task.id] === choice ? 'selected' : ''}
                            onClick={() => setTaskFeelings(prev => ({ ...prev, [task.id]: choice }))}
                          >
                            {choice}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button type="button" className="g12-main-btn" onClick={() => markTaskDone(task.id)}>
                      {doneTasks[task.id] ? 'Done' : 'Tapos na'}
                    </button>
                  </div>
                );
              })}

              {!(group.tasks || []).length && (
                <div className="g12-empty" style={{ marginTop: 14 }}>Wala pang team mission para sa grupong ito.</div>
              )}
            </div>
          ))}
        </div>

        {!groups.length && (
          <div className="g12-empty">No group tasks yet.</div>
        )}
      </section>
    </EarlyStudentChrome>
  );
}

function StudentGroups({ data, go, completeGroupTask }) {
  const early = Number(data?.student?.gradeLevel || 4) <= 2;
  const groups = data?.groups || [];
  const roles = rolesForGradeLevel(data?.student?.gradeLevel);
  const [selectedRoles, setSelectedRoles] = useState({});
  const [taskNotes, setTaskNotes] = useState({});
  const [taskRatings, setTaskRatings] = useState({});
  const [submittedTasks, setSubmittedTasks] = useState({});

  if (early) {
    return <EarlyGroupsScreen data={data} go={go} completeGroupTask={completeGroupTask} />;
  }

  async function submitGroupTask(taskId) {
    setSubmittedTasks(prev => ({ ...prev, [taskId]: true }));
    await completeGroupTask(taskId);
  }

  return (
    <Grade46StudentChrome
      data={data}
      activeTab="groups"
      go={go}
      icon="👥"
      title="Group Collaboration"
      subtitle="Choose a role, submit group output, and record your contribution."
    >
      <section className="g46-ref-panel">
        <div className="g46-ref-panel-head">
          <div>
            <h2>Group Tasks</h2>
            <p className="g46-ref-muted">Teachers can judge collaboration better when students show role, output, and contribution evidence.</p>
          </div>
        </div>

        {groups.map(group => (
          <div className="g46-ref-panel" key={group.id} style={{ marginBottom: 14, boxShadow: 'none', background: '#fbfefc' }}>
            <div className="g46-ref-panel-head">
              <div>
                <h3>👥 {group.name}</h3>
                <p className="g46-ref-muted">{group.description || 'Collaborative Filipino task.'}</p>
              </div>
              <span className="g46-ref-tag">{group.tasks?.length || 0} task{(group.tasks?.length || 0) === 1 ? '' : 's'}</span>
            </div>

            <div className="g46-ref-filter-row" style={{ marginBottom: 14 }}>
              {roles.map(role => (
                <button
                  type="button"
                  key={`${group.id}-${role.id}`}
                  className={selectedRoles[group.id] === role.id ? 'active' : ''}
                  onClick={() => setSelectedRoles(prev => ({ ...prev, [group.id]: role.id }))}
                  title={role.helper}
                >
                  {role.icon} {role.label}
                </button>
              ))}
            </div>

            {(group.tasks || []).map(task => {
              const pct = taskCompletionPercent(task, submittedTasks[task.id]);
              const band = effectivenessBand(pct);
              return (
                <div className="g46-ref-task-row" key={task.id} style={{ gridTemplateColumns: '58px minmax(0, 1fr)', alignItems: 'start' }}>
                  <span className="g46-ref-card-icon">{submittedTasks[task.id] ? '✅' : '📝'}</span>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div>
                        <h3 style={{ fontSize: 26, marginBottom: 6 }}>{task.title}</h3>
                        <p className="g46-ref-muted" style={{ margin: 0 }}>Due: {fmtDate(task.dueAt)} • +{task.xpReward || 0} XP • {band.icon} {band.label}</p>
                      </div>
                      <button type="button" className="g46-ref-primary-btn" onClick={() => submitGroupTask(task.id)}>
                        {submittedTasks[task.id] ? 'Submitted' : 'Submit Task'}
                      </button>
                    </div>

                    <div className="g46-ref-mini-track" style={{ marginTop: 12 }}><span style={{ width: `${pct}%` }} /></div>

                    <textarea
                      className="input-field"
                      rows="3"
                      value={taskNotes[task.id] || ''}
                      onChange={(e) => setTaskNotes(prev => ({ ...prev, [task.id]: e.target.value }))}
                      placeholder="Write your group answer, summary, or contribution note here..."
                      style={{ marginTop: 12, minHeight: 92 }}
                    />

                    <div className="g46-ref-filter-row" style={{ marginTop: 12, marginBottom: 0 }}>
                      {['I helped a lot', 'I helped some', 'I need to participate more'].map(choice => (
                        <button
                          type="button"
                          key={choice}
                          className={taskRatings[task.id] === choice ? 'active' : ''}
                          onClick={() => setTaskRatings(prev => ({ ...prev, [task.id]: choice }))}
                        >
                          {choice}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            {!(group.tasks || []).length && <div className="g46-ref-empty">No tasks yet for this group.</div>}
          </div>
        ))}

        {!groups.length && <div className="g46-ref-empty">No group tasks yet.</div>}
      </section>
    </Grade46StudentChrome>
  );
}

function EarlyBadgesScreen({ data, go }) {
  const badges = data?.badges || [];
  const s = data?.student || {};

  return (
    <EarlyStudentChrome
      data={data}
      activeTab="badges"
      go={go}
      icon="🏅"
      title="Badges"
      subtitle="Makikita dito ang rewards na nakuha mo sa lessons at activities."
    >
      <section className="g12-section-card">
        <div className="g12-section-head">
          <div>
            <h2 className="g12-section-title">🌟 Achievements</h2>
            <p className="g12-section-subtitle">{badges.length} badge{badges.length === 1 ? '' : 's'} unlocked • {s.xp || 0} XP</p>
          </div>
        </div>

        {badges.length ? (
          <div className="g12-badge-grid">
            {badges.map(badge => (
              <div className="g12-badge-card" key={badge.id || badge.name}>
                <div>
                  <div className="g12-badge-big">{badge.icon || '🏅'}</div>
                  <strong>{badge.name || 'Badge'}</strong>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="g12-empty">Wala pang badge. Tapusin ang lessons para makakuha!</div>
        )}
      </section>
    </EarlyStudentChrome>
  );
}

function StudentBadges({ data, go }) {
  const early = Number(data?.student?.gradeLevel || 4) <= 2;

  if (early) {
    return <EarlyBadgesScreen data={data} go={go} />;
  }

  const badges = data?.badges || [];

  return (
    <Grade46StudentChrome
      data={data}
      activeTab="profile"
      go={go}
      icon="🏅"
      title="Badges"
      subtitle="Rewards and achievements from lessons, missions, and activities."
    >
      <section className="g46-ref-panel">
        <div className="g46-ref-panel-head">
          <div>
            <h2>Achievements</h2>
            <p className="g46-ref-muted">{badges.length} badge{badges.length === 1 ? '' : 's'} unlocked • {data?.student?.xp || 0} XP</p>
          </div>
        </div>

        {badges.length ? (
          <div className="g46-ref-badge-grid">
            {badges.map(badge => (
              <div className="g46-ref-badge" key={badge.id || badge.name}>
                <div><span>{badge.icon || '🏅'}</span>{badge.name || 'Badge'}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="g46-ref-empty">Wala pang badge. Tapusin ang lessons para makakuha!</div>
        )}
      </section>
    </Grade46StudentChrome>
  );
}


function EarlyProfileScreen({ data, selectedAvatar, updateAvatar, go }) {
  const s = data?.student || {};

  return (
    <EarlyStudentChrome
      data={data}
      activeTab="profile"
      go={go}
      icon="🐰"
      title="Profile"
      subtitle="Piliin ang avatar mo at tingnan ang learning summary."
    >
      <section className="g12-section-card">
        <div className="g12-section-head">
          <div>
            <h2 className="g12-section-title">🐰 Avatar</h2>
            <p className="g12-section-subtitle">Piliin ang avatar na gusto mong gamitin sa account mo.</p>
          </div>
        </div>

        <div className="g12-avatar-grid">
          {AVATARS.map(avatar => (
            <button
              key={avatar}
              type="button"
              className={`g12-avatar-choice ${selectedAvatar === avatar ? 'selected' : ''}`}
              onClick={() => updateAvatar(avatar)}
              aria-label={`Choose avatar ${avatar}`}
            >
              {avatar}
            </button>
          ))}
        </div>
      </section>

      <section className="g12-section-card">
        <div className="g12-section-head">
          <div>
            <h2 className="g12-section-title">📊 Summary</h2>
            <p className="g12-section-subtitle">Basic profile and progress information.</p>
          </div>
        </div>

        <div className="g12-summary-grid">
          <div className="g12-summary-box"><span>👤</span><div><b>{s.name || '—'}</b><small>Name</small></div></div>
          <div className="g12-summary-box"><span>🎒</span><div><b>Grade {s.gradeLevel || '—'}</b><small>Grade</small></div></div>
          <div className="g12-summary-box"><span>🌸</span><div><b>{s.section || '—'}</b><small>Section</small></div></div>
          <div className="g12-summary-box"><span>⚡</span><div><b>{s.xp || 0} XP</b><small>XP</small></div></div>
        </div>
      </section>
    </EarlyStudentChrome>
  );
}

function StudentProfile({ data, selectedAvatar, updateAvatar, go }) {
  const early = Number(data?.student?.gradeLevel || 4) <= 2;

  if (early) {
    return <EarlyProfileScreen data={data} selectedAvatar={selectedAvatar} updateAvatar={updateAvatar} go={go} />;
  }

  const s = data?.student || {};

  return (
    <Grade46StudentChrome
      data={data}
      activeTab="profile"
      go={go}
      icon="👤"
      title="Profile"
      subtitle="Piliin ang avatar mo at tingnan ang learning summary."
    >
      <section className="g46-ref-panel">
        <div className="g46-ref-panel-head">
          <div>
            <h2>Avatar</h2>
            <p className="g46-ref-muted">Piliin ang avatar na gusto mong gamitin sa account mo.</p>
          </div>
        </div>

        <div className="g46-ref-avatar-grid">
          {AVATARS.map(avatar => (
            <button
              key={avatar}
              type="button"
              className={`g46-ref-avatar-choice ${selectedAvatar === avatar ? 'selected' : ''}`}
              onClick={() => updateAvatar(avatar)}
              aria-label={`Choose avatar ${avatar}`}
            >
              {avatar}
            </button>
          ))}
        </div>
      </section>

      <section className="g46-ref-panel">
        <div className="g46-ref-panel-head">
          <div>
            <h2>Summary</h2>
            <p className="g46-ref-muted">Basic profile and progress information.</p>
          </div>
        </div>

        <div className="g46-ref-card-grid">
          <div className="g46-ref-card green"><span className="g46-ref-card-icon">👤</span><h4>{s.name || '—'}</h4><p>Name</p></div>
          <div className="g46-ref-card yellow"><span className="g46-ref-card-icon">🎒</span><h4>Grade {s.gradeLevel || '—'}</h4><p>Grade</p></div>
          <div className="g46-ref-card blue"><span className="g46-ref-card-icon">🌸</span><h4>{s.section || '—'}</h4><p>Section</p></div>
          <div className="g46-ref-card purple"><span className="g46-ref-card-icon">⚡</span><h4>{s.xp || 0} XP</h4><p>XP</p></div>
        </div>
      </section>
    </Grade46StudentChrome>
  );
}


function TeacherRedesignStyles() {
  return (
    <style>{`
      .teacher-redesign-page {
        min-height: 100vh;
        background:
          radial-gradient(circle at 4% 100%, rgba(46, 204, 113, 0.08), transparent 24%),
          radial-gradient(circle at 96% 100%, rgba(46, 204, 113, 0.08), transparent 24%),
          linear-gradient(180deg, #fbfefc 0%, #f5faf7 100%);
        color: #17243b;
        font-family: inherit;
      }

      .teacher-main-header {
        height: 88px;
        background: rgba(255, 255, 255, 0.96);
        backdrop-filter: blur(18px);
        border-bottom: 1px solid #e8efe9;
        box-shadow: 0 10px 28px rgba(26, 75, 43, 0.055);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 36px;
        position: sticky;
        top: 0;
        z-index: 40;
      }

      .teacher-brand-area {
        display: flex;
        align-items: center;
        gap: 30px;
        min-width: 0;
      }

      .teacher-brand-mark {
        display: flex;
        align-items: center;
        gap: 12px;
        padding-right: 28px;
        border-right: 1px solid #dfe8e2;
      }

      .teacher-brand-icon {
        width: 50px;
        height: 50px;
        border-radius: 17px;
        display: grid;
        place-items: center;
        background: linear-gradient(135deg, #f4ffe3, #dff9e8);
        box-shadow: inset 0 0 0 1px rgba(39, 174, 96, 0.16);
        font-size: 26px;
      }

      .teacher-brand-text strong {
        display: block;
        color: #12a05a;
        font-size: 24px;
        line-height: 1;
        letter-spacing: -0.04em;
        font-weight: 950;
      }

      .teacher-brand-text small {
        display: block;
        color: #738277;
        font-size: 11px;
        margin-top: 5px;
        font-weight: 800;
      }

      .teacher-nav-links {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .teacher-nav-links button {
        border: 0;
        background: transparent;
        color: #26354d;
        padding: 12px 16px;
        border-radius: 14px;
        font-weight: 850;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: 0.18s ease;
      }

      .teacher-nav-links button:hover,
      .teacher-nav-links button.active {
        background: #eaf8ef;
        color: #07884b;
      }

      .teacher-header-actions {
        display: flex;
        align-items: center;
        gap: 14px;
      }

      .teacher-profile-pill {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 176px;
        padding: 10px 14px;
        background: #ffffff;
        border: 1px solid #dbeae1;
        border-radius: 18px;
        box-shadow: 0 8px 20px rgba(32, 93, 52, 0.06);
      }

      .teacher-profile-avatar {
        width: 44px;
        height: 44px;
        border-radius: 15px;
        display: grid;
        place-items: center;
        background: #fff7c9;
        font-size: 24px;
      }

      .teacher-profile-text {
        flex: 1;
        min-width: 0;
      }

      .teacher-profile-text strong {
        display: block;
        color: #193421;
        font-size: 15px;
        line-height: 1;
      }

      .teacher-profile-text small {
        display: block;
        color: #6d7d73;
        font-size: 12px;
        margin-top: 5px;
      }

      .teacher-logout-btn {
        height: 52px;
        border-radius: 16px;
        padding: 0 24px;
        border: 2px solid #0a9b53;
        background: #ffffff;
        color: #07884b;
        font-weight: 950;
        cursor: pointer;
        transition: 0.18s ease;
      }

      .teacher-logout-btn:hover {
        background: #eaf8ef;
        transform: translateY(-1px);
      }

      .teacher-main-content {
        max-width: 1370px;
        margin: 0 auto;
        padding: 34px 28px 28px;
      }

      .lms-page-title {
        display: flex;
        justify-content: space-between;
        gap: 20px;
        align-items: flex-end;
        margin-bottom: 22px;
        position: relative;
      }

      .lms-title-copy h1 {
        margin: 0;
        color: #182237;
        font-size: 40px;
        letter-spacing: -0.045em;
        font-weight: 950;
      }

      .lms-title-copy p {
        margin: 8px 0 0;
        color: #667668;
        font-size: 16px;
        line-height: 1.6;
        max-width: 660px;
      }

      .lms-teacher-illustration {
        min-width: 270px;
        height: 130px;
        border-radius: 28px;
        background:
          radial-gradient(circle at 72% 10%, #fff2ba 0 28%, transparent 29%),
          linear-gradient(135deg, #fffdfa, #edf9f0);
        border: 1px solid #e5eee8;
        position: relative;
        overflow: hidden;
      }

      .lms-teacher-illustration::before {
        content: '👩‍🏫';
        position: absolute;
        right: 92px;
        top: 22px;
        font-size: 66px;
      }

      .lms-teacher-illustration::after {
        content: '🌿 📚';
        position: absolute;
        right: 20px;
        bottom: 18px;
        font-size: 34px;
      }

      .lms-overview-panel {
        background: #ffffff;
        border: 1px solid #e4eee8;
        border-radius: 28px;
        padding: 24px;
        box-shadow: 0 14px 34px rgba(30, 71, 44, 0.06);
        margin-bottom: 24px;
      }

      .lms-greeting-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 18px;
        margin-bottom: 18px;
      }

      .lms-greeting-row h2 {
        margin: 0;
        color: #17243b;
        font-size: 24px;
        font-weight: 950;
        letter-spacing: -0.03em;
      }

      .lms-greeting-row p {
        margin: 6px 0 0;
        color: #65766b;
      }

      .lms-view-button,
      .lms-view-lessons-btn {
        border: 1.8px solid #0a9b53;
        color: #07884b;
        background: #ffffff;
        border-radius: 14px;
        padding: 12px 18px;
        font-weight: 950;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        transition: 0.18s ease;
      }

      .lms-view-button:hover,
      .lms-view-lessons-btn:hover {
        background: #eaf8ef;
        transform: translateY(-1px);
      }

      .lms-metric-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 16px;
      }

      .lms-metric-card {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 20px;
        border-radius: 22px;
        border: 1px solid #e5eee8;
        background: #fff;
        min-height: 110px;
      }

      .lms-metric-card.green { background: linear-gradient(135deg, #f1fbf4, #ffffff); }
      .lms-metric-card.yellow { background: linear-gradient(135deg, #fff8df, #ffffff); }
      .lms-metric-card.blue { background: linear-gradient(135deg, #edf6ff, #ffffff); }
      .lms-metric-card.purple { background: linear-gradient(135deg, #f6efff, #ffffff); }

      .lms-metric-icon {
        width: 58px;
        height: 58px;
        border-radius: 20px;
        display: grid;
        place-items: center;
        font-size: 28px;
      }

      .lms-metric-card.green .lms-metric-icon { background: #dff7e8; }
      .lms-metric-card.yellow .lms-metric-icon { background: #fff0bd; }
      .lms-metric-card.blue .lms-metric-icon { background: #dff0ff; }
      .lms-metric-card.purple .lms-metric-icon { background: #efe3ff; }

      .lms-metric-card span {
        display: block;
        font-weight: 850;
        color: #253044;
        margin-bottom: 4px;
      }

      .lms-metric-card strong {
        display: block;
        color: #17243b;
        font-size: 30px;
        font-weight: 950;
        line-height: 1;
      }

      .lms-metric-card small {
        display: block;
        color: #728177;
        font-weight: 700;
        margin-top: 7px;
      }

      .lms-tip-strip {
        margin-top: 18px;
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 16px 18px;
        border-radius: 20px;
        background: linear-gradient(135deg, #eefaf2, #f9fffb);
        border: 1px solid #dcefe2;
      }

      .lms-tip-icon {
        width: 50px;
        height: 50px;
        border-radius: 18px;
        display: grid;
        place-items: center;
        background: #2fb86f;
        color: white;
        font-size: 24px;
      }

      .lms-tip-strip strong {
        display: block;
        color: #1f5632;
        margin-bottom: 3px;
      }

      .lms-tip-strip p {
        margin: 0;
        color: #627569;
      }

      .teacher-builder-layout {
        display: grid;
        grid-template-columns: minmax(0, 1.35fr) minmax(330px, 0.7fr);
        gap: 24px;
        align-items: start;
      }

      .teacher-builder-main,
      .teacher-builder-side {
        display: flex;
        flex-direction: column;
        gap: 18px;
      }

      .teacher-design-card,
      .teacher-side-card {
        background: #ffffff;
        border: 1px solid #e4eee8;
        border-radius: 26px;
        padding: 24px;
        box-shadow: 0 14px 34px rgba(30, 71, 44, 0.055);
      }

      .teacher-design-card.soft {
        background: linear-gradient(180deg, #ffffff 0%, #fcfffd 100%);
      }

      .teacher-design-heading {
        display: flex;
        align-items: flex-start;
        gap: 14px;
        margin-bottom: 18px;
      }

      .teacher-design-step {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: #149a57;
        color: white;
        font-weight: 950;
        box-shadow: 0 8px 18px rgba(20, 154, 87, 0.2);
        flex: 0 0 auto;
      }

      .teacher-design-heading h2 {
        margin: 0;
        color: #0c6a3b;
        font-size: 21px;
        font-weight: 950;
        letter-spacing: -0.02em;
      }

      .teacher-design-heading p {
        margin: 4px 0 0;
        color: #6c7b72;
        font-size: 13px;
      }

      .teacher-form-row {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
      }

      .teacher-field {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .teacher-field label {
        color: #17243b;
        font-weight: 900;
        font-size: 13px;
      }

      .teacher-field .input-field,
      .teacher-design-card .input-field {
        border: 1.5px solid #d8e6dc;
        border-radius: 13px;
        background: #ffffff;
        min-height: 48px;
        padding: 13px 15px;
        font-weight: 700;
        color: #213047;
      }

      .teacher-field textarea.input-field {
        font-weight: 600;
        line-height: 1.6;
        min-height: 110px;
      }

      .lms-editor-toolbar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        border: 1.5px solid #d8e6dc;
        border-bottom: 0;
        border-radius: 14px 14px 0 0;
        background: #fbfefd;
      }

      .lms-editor-toolbar button {
        width: 30px;
        height: 30px;
        border: 0;
        background: transparent;
        border-radius: 9px;
        cursor: default;
        font-weight: 900;
        color: #213047;
      }

      .lms-editor-area {
        border-top-left-radius: 0 !important;
        border-top-right-radius: 0 !important;
      }

      .lms-activity-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .teacher-activity-block {
        border-radius: 16px;
        border: 1px solid #e4eee8;
        background: #ffffff;
        overflow: hidden;
      }

      .teacher-activity-top {
        display: grid;
        grid-template-columns: 46px minmax(160px, 1fr) minmax(220px, 1.6fr) auto;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: linear-gradient(90deg, rgba(20,154,87,0.08), #ffffff);
      }

      .teacher-activity-icon {
        width: 38px;
        height: 38px;
        border-radius: 12px;
        display: grid;
        place-items: center;
        color: white;
        font-weight: 950;
      }

      .teacher-activity-copy strong {
        display: block;
        color: #1d2d44;
        font-weight: 950;
      }

      .teacher-activity-copy small {
        color: #6d7b73;
        font-weight: 700;
      }

      .teacher-activity-mini-preview {
        font-size: 12px;
        color: #6d7b73;
        background: rgba(255,255,255,0.68);
        border: 1px solid rgba(216,230,220,0.8);
        border-radius: 12px;
        padding: 10px 12px;
      }

      .teacher-activity-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .teacher-activity-action {
        border: 1px solid #d8e6dc;
        background: #ffffff;
        color: #1d2d44;
        padding: 8px 10px;
        border-radius: 10px;
        font-weight: 850;
        cursor: pointer;
      }

      .teacher-activity-action:hover {
        background: #f2faf5;
      }

      .teacher-activity-action.danger {
        color: #e74c3c;
      }

      .teacher-activity-body {
        padding: 12px;
        background: #ffffff;
        border-top: 1px solid #edf3ef;
      }


      .teacher-activity-row {
        display: grid;
        grid-template-columns: 44px minmax(0, 1fr) auto;
        gap: 14px;
        align-items: start;
        padding: 12px;
        border: 1px solid #e4eee8;
        border-radius: 16px;
        background: linear-gradient(90deg, rgba(20,154,87,0.06), #ffffff);
      }

      .teacher-activity-row-icon {
        width: 40px;
        height: 40px;
        border-radius: 13px;
        display: grid;
        place-items: center;
        color: #ffffff;
        font-weight: 950;
        box-shadow: 0 8px 18px rgba(0,0,0,0.08);
      }

      .teacher-activity-row-main {
        min-width: 0;
      }

      .teacher-activity-row-head {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        align-items: center;
        margin-bottom: 10px;
      }

      .teacher-activity-row-head strong {
        color: #17243b;
        font-weight: 950;
      }

      .teacher-activity-row-head small {
        color: #6d7b73;
        font-weight: 750;
      }

      .teacher-activity-row-fields {
        display: grid;
        gap: 10px;
      }

      .teacher-activity-row-fields.grid2 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .teacher-inline-mcq,
      .teacher-inline-pairs,
      .teacher-inline-words {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .lms-side-activity .choice-infographic { background: #27ae60; }
      .lms-side-activity .choice-vocabulary { background: #f4b942; }
      .lms-side-activity .choice-matching { background: #3498db; }
      .lms-side-activity .choice-mcq { background: #8e44ad; }
      .lms-side-activity .choice-speech { background: #ec407a; }
      .lms-side-activity .choice-writing { background: #16a9b7; }

      .teacher-add-mini,
      .lms-add-block-btn {
        border: 1.5px dashed #b9dfc8;
        background: #f7fdf9;
        color: #0b8e4e;
        border-radius: 14px;
        padding: 14px 16px;
        font-weight: 950;
        cursor: pointer;
        width: 100%;
        transition: 0.18s ease;
      }

      .teacher-add-mini:hover,
      .lms-add-block-btn:hover {
        background: #eaf8ef;
      }

      .lms-empty-activity {
        padding: 22px;
        border: 1.5px dashed #b9dfc8;
        border-radius: 18px;
        text-align: center;
        background: linear-gradient(135deg, #fbfffd, #f1fbf4);
        color: #587064;
      }

      .lms-empty-activity strong {
        display: block;
        color: #215a36;
        margin-bottom: 6px;
      }

      .lms-add-choice-grid {
        display: grid;
        grid-template-columns: repeat(6, minmax(0, 1fr));
        gap: 12px;
        margin-bottom: 16px;
      }

      .lms-add-choice {
        min-height: 86px;
        border-radius: 16px;
        border: 1px solid #dfece4;
        background: #ffffff;
        color: #27344c;
        font-weight: 900;
        display: grid;
        place-items: center;
        gap: 6px;
        cursor: pointer;
        transition: 0.18s ease;
      }

      .lms-add-choice span {
        width: 34px;
        height: 34px;
        border-radius: 11px;
        display: grid;
        place-items: center;
        color: white;
      }

      .lms-add-choice:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 20px rgba(30, 71, 44, 0.08);
      }

      .choice-infographic span { background: #27ae60; }
      .choice-vocabulary span { background: #f4b942; }
      .choice-matching span { background: #3498db; }
      .choice-mcq span { background: #8e44ad; }
      .choice-speech span { background: #ec407a; }
      .choice-writing span { background: #16a9b7; }

      .lms-preview-card-inner {
        border-radius: 22px;
        border: 1px solid #dfece4;
        background: linear-gradient(180deg, #ffffff, #fbfffc);
        padding: 18px;
      }

      .lms-preview-badges,
      .lms-preview-stats {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 14px;
      }

      .lms-preview-badge,
      .lms-preview-stat {
        padding: 9px 12px;
        border-radius: 999px;
        background: #ffffff;
        border: 1px solid #dfece4;
        color: #0b8e4e;
        font-weight: 950;
      }

      .lms-preview-title {
        color: #17243b;
        font-size: 27px;
        letter-spacing: -0.04em;
        margin: 10px 0 14px;
        font-weight: 950;
      }

      .lms-preview-illustration {
        height: 160px;
        border-radius: 18px;
        background: linear-gradient(135deg, #eaf9ef, #f7fffa);
        display: grid;
        place-items: center;
        font-size: 80px;
        margin: 12px 0 16px;
        border: 1px solid #e0eee5;
      }

      .lms-preview-textbox {
        padding: 14px;
        border: 1px solid #e0eee5;
        border-radius: 14px;
        color: #586b60;
        line-height: 1.55;
        background: #ffffff;
        min-height: 74px;
        white-space: pre-wrap;
        margin-bottom: 12px;
      }

      .lms-student-preview-btn {
        width: 100%;
        border: 1.8px solid #0a9b53;
        background: #ffffff;
        color: #07884b;
        border-radius: 14px;
        padding: 14px;
        font-weight: 950;
        cursor: pointer;
      }

      .lms-side-activity-list {
        display: flex;
        flex-direction: column;
        gap: 9px;
      }

      .lms-side-activity {
        display: grid;
        grid-template-columns: 34px 28px 1fr 20px;
        align-items: center;
        gap: 10px;
        padding: 10px;
        border: 1px solid #e5eee8;
        border-radius: 12px;
        background: #ffffff;
        color: #24324a;
        font-weight: 850;
      }

      .lms-side-activity .icon {
        width: 32px;
        height: 32px;
        border-radius: 10px;
        display: grid;
        place-items: center;
        color: white;
        font-weight: 950;
      }

      .lms-side-activity .order {
        color: #6d7b73;
        font-weight: 950;
        text-align: center;
      }

      .lms-recent-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        overflow: hidden;
        border: 1px solid #e5eee8;
        border-radius: 14px;
      }

      .lms-recent-table th {
        text-align: left;
        color: #52665a;
        background: #fbfefd;
        font-size: 12px;
        padding: 12px;
      }

      .lms-recent-table td {
        padding: 12px;
        border-top: 1px solid #eef4f0;
        color: #22324a;
        font-size: 13px;
        font-weight: 700;
      }

      .lms-status {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 5px 9px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 900;
      }

      .lms-status.published {
        background: #e8f8ef;
        color: #0b8e4e;
      }

      .lms-status.draft {
        background: #e9f3ff;
        color: #2f80ed;
      }

      .lms-show-more {
        border: 0;
        background: transparent;
        color: #0b8e4e;
        font-weight: 950;
        margin: 14px auto 0;
        display: block;
        cursor: pointer;
      }

      .lms-bottom-action-bar {
        margin-top: 22px;
        display: grid;
        grid-template-columns: 1fr 1fr 1.35fr;
        gap: 16px;
      }

      .lms-action-secondary,
      .lms-action-primary {
        height: 58px;
        border-radius: 16px;
        font-weight: 950;
        cursor: pointer;
      }

      .lms-action-secondary {
        border: 1.8px solid #0a9b53;
        background: #ffffff;
        color: #07884b;
      }

      .lms-action-primary {
        border: 0;
        background: linear-gradient(135deg, #12a05a, #07884b);
        color: #ffffff;
        box-shadow: 0 12px 24px rgba(8, 136, 75, 0.18);
      }

      .lms-tips-list {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .lms-tip-item {
        display: flex;
        gap: 12px;
        align-items: flex-start;
        color: #455b4e;
        font-weight: 700;
      }

      .lms-tip-item span {
        width: 38px;
        height: 38px;
        border-radius: 14px;
        display: grid;
        place-items: center;
        background: #eef8f2;
        flex: 0 0 auto;
      }

      .teacher-footer {
        color: #7c8b82;
        font-size: 12px;
        display: flex;
        justify-content: space-between;
        gap: 12px;
        margin-top: 28px;
        padding: 18px 4px 0;
        border-top: 1px solid #e5eee8;
      }


      .lms-feature-section {
        margin-top: 26px;
        background: #ffffff;
        border: 1px solid #e5eee8;
        border-radius: 26px;
        padding: 24px;
        box-shadow: 0 16px 40px rgba(31, 73, 43, 0.06);
      }

      .lms-feature-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 18px;
        margin-bottom: 18px;
      }

      .lms-feature-head h2 {
        margin: 4px 0 6px;
        color: #17243b;
        font-size: 24px;
        letter-spacing: -0.03em;
      }

      .lms-feature-head p {
        margin: 0;
        color: #748378;
        line-height: 1.6;
        max-width: 760px;
      }

      .lms-section-label {
        color: #079b55;
        font-size: 12px;
        font-weight: 950;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .lms-tools-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 18px;
      }

      .lms-tool-card {
        background: linear-gradient(180deg, #fbfffc, #f7fbf8);
        border: 1px solid #e2ede6;
        border-radius: 22px;
        padding: 18px;
      }

      .lms-tool-card h3 {
        margin: 0 0 6px;
        color: #1a3b29;
        font-size: 18px;
      }

      .lms-tool-card p {
        margin: 0 0 14px;
        color: #748378;
        font-size: 13px;
        line-height: 1.5;
      }

      .lms-tool-card .input-field {
        background: #ffffff;
      }

      .lms-form-gap {
        height: 10px;
      }

      .lms-groups-list {
        margin-top: 18px;
        display: grid;
        gap: 14px;
      }

      .lms-group-card {
        border: 1px solid #e5eee8;
        border-radius: 20px;
        background: #ffffff;
        padding: 16px;
      }

      .lms-group-top {
        display: flex;
        justify-content: space-between;
        gap: 14px;
        align-items: flex-start;
      }

      .lms-group-top strong {
        color: #17243b;
      }

      .lms-group-desc {
        color: #748378;
        font-size: 13px;
        margin-top: 4px;
      }

      .lms-mini-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border-radius: 999px;
        background: #eefaf3;
        color: #087c45;
        padding: 7px 10px;
        font-size: 12px;
        font-weight: 900;
        white-space: nowrap;
      }

      .lms-group-member-row {
        display: flex;
        gap: 10px;
        align-items: center;
        margin-top: 14px;
        padding-top: 14px;
        border-top: 1px solid #edf3ef;
      }

      .lms-monitor-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .lms-monitor-actions button,
      .lms-tool-card button,
      .lms-group-member-row button {
        cursor: pointer;
      }

      .lms-report-button {
        border: 1px solid #dbe9e1;
        background: #ffffff;
        color: #157a45;
        border-radius: 14px;
        padding: 10px 12px;
        font-weight: 900;
      }

      .lms-table-card {
        overflow: hidden;
      }

      .lms-table-scroll {
        width: 100%;
        overflow-x: auto;
      }

      .lms-recent-table.monitoring td,
      .lms-recent-table.monitoring th {
        white-space: nowrap;
      }

      .lms-status.neutral {
        background: #eef6ff;
        color: #2f80ed;
      }

      .lms-empty-line {
        padding: 18px;
        color: #748378;
        background: #f8fcf9;
        border: 1px dashed #d8e9df;
        border-radius: 18px;
      }

      .lms-main-action {
        height: 44px;
        border: 0;
        border-radius: 14px;
        background: linear-gradient(135deg, #11a85f, #06934e);
        color: white;
        padding: 0 16px;
        font-weight: 950;
        box-shadow: 0 10px 20px rgba(17, 168, 95, 0.18);
      }

      .lms-outline-action {
        height: 44px;
        border: 1px solid #dbe9e1;
        border-radius: 14px;
        background: white;
        color: #117a45;
        padding: 0 16px;
        font-weight: 950;
      }

      @media (max-width: 920px) {
        .lms-tools-grid {
          grid-template-columns: 1fr;
        }

        .lms-feature-head,
        .lms-group-top,
        .lms-group-member-row {
          flex-direction: column;
          align-items: stretch;
        }
      }


      @media (max-width: 1120px) {
        .teacher-builder-layout,
        .teacher-form-row,
        .lms-metric-grid {
          grid-template-columns: 1fr;
        }

        .lms-add-choice-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .lms-page-title {
          flex-direction: column;
          align-items: flex-start;
        }

        .lms-teacher-illustration {
          width: 100%;
        }
      }

      @media (max-width: 760px) {
        .teacher-main-header {
          height: auto;
          align-items: flex-start;
          flex-direction: column;
          padding: 18px;
          gap: 14px;
        }

        .teacher-brand-area,
        .teacher-header-actions,
        .teacher-nav-links {
          flex-wrap: wrap;
          width: 100%;
        }

        .teacher-main-content {
          padding: 22px 14px;
        }

        .lms-title-copy h1 {
          font-size: 30px;
        }

        .lms-add-choice-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .teacher-activity-top {
          grid-template-columns: 42px 1fr;
        }

        .teacher-activity-mini-preview,
        .teacher-activity-actions {
          grid-column: 1 / -1;
        }

        .teacher-activity-row {
          grid-template-columns: 42px 1fr;
        }

        .teacher-activity-actions {
          grid-column: 1 / -1;
          justify-content: flex-start;
        }

        .teacher-activity-row-fields.grid2 {
          grid-template-columns: 1fr;
        }

        .lms-bottom-action-bar {
          grid-template-columns: 1fr;
        }

        .lms-recent-table {
          display: block;
          overflow-x: auto;
          white-space: nowrap;
        }
      }
      /* Cleaner teacher workspace layout: keeps every feature, but groups them into tabs. */
      .teacher-main-header-clean {
        height: 74px;
        padding: 0 28px;
      }

      .teacher-main-header-clean .teacher-brand-icon {
        width: 44px;
        height: 44px;
        border-radius: 15px;
        font-size: 23px;
      }

      .teacher-main-header-clean .teacher-brand-text strong {
        font-size: 21px;
      }

      .teacher-main-header-clean .teacher-brand-text small {
        font-size: 10px;
      }

      .teacher-main-header-clean .teacher-nav-links button {
        padding: 10px 13px;
        border-radius: 13px;
        font-size: 13px;
      }

      .teacher-main-content-clean {
        max-width: 1360px;
        padding: 24px 28px 36px;
      }

      .teacher-clean-hero {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        padding: 22px 24px;
        border-radius: 26px;
        background:
          radial-gradient(circle at 92% 20%, rgba(255, 218, 121, 0.24), transparent 22%),
          linear-gradient(135deg, #ffffff 0%, #f3fbf6 100%);
        border: 1px solid #e3efe8;
        box-shadow: 0 14px 34px rgba(30, 71, 44, 0.055);
      }

      .teacher-clean-hero-copy h1 {
        margin: 4px 0 8px;
        color: #17243b;
        font-size: clamp(30px, 3vw, 42px);
        letter-spacing: -0.05em;
        line-height: 1.05;
      }

      .teacher-clean-hero-copy p {
        margin: 0;
        max-width: 760px;
        color: #64746b;
        font-weight: 700;
        line-height: 1.55;
      }

      .teacher-clean-actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 10px;
        flex: 0 0 auto;
      }

      .teacher-logout-btn.light {
        background: #ffffff;
        color: #0c8d4f;
        border: 1px solid #cfe9da;
        box-shadow: none;
      }

      .teacher-clean-metrics {
        margin-top: 16px;
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
      }

      .teacher-clean-metric {
        min-height: 96px;
        border: 1px solid #e5eee8;
        background: #ffffff;
        border-radius: 22px;
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 14px;
        text-align: left;
        cursor: pointer;
        box-shadow: 0 10px 24px rgba(30, 71, 44, 0.045);
        transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
      }

      .teacher-clean-metric:hover {
        transform: translateY(-2px);
        border-color: #cfe9da;
        box-shadow: 0 16px 30px rgba(30, 71, 44, 0.075);
      }

      .teacher-clean-metric .metric-icon {
        width: 48px;
        height: 48px;
        display: grid;
        place-items: center;
        border-radius: 16px;
        font-size: 22px;
        flex: 0 0 auto;
      }

      .teacher-clean-metric .metric-icon.green { background: #e8f8ef; }
      .teacher-clean-metric .metric-icon.yellow { background: #fff6df; }
      .teacher-clean-metric .metric-icon.blue { background: #eaf4ff; }
      .teacher-clean-metric .metric-icon.purple { background: #f3edff; }

      .teacher-clean-metric small {
        display: block;
        color: #75867b;
        font-size: 12px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .teacher-clean-metric strong {
        display: block;
        margin-top: 4px;
        color: #17243b;
        font-size: 30px;
        line-height: 1;
        letter-spacing: -0.04em;
      }

      .teacher-clean-tabs {
        position: sticky;
        top: 74px;
        z-index: 25;
        margin-top: 18px;
        padding: 10px;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
        background: rgba(255, 255, 255, 0.92);
        backdrop-filter: blur(14px);
        border: 1px solid #e1eee7;
        border-radius: 22px;
        box-shadow: 0 10px 26px rgba(30, 71, 44, 0.05);
      }

      .teacher-clean-tabs button {
        border: 0;
        background: transparent;
        border-radius: 16px;
        padding: 13px 14px;
        color: #3d5145;
        font-weight: 950;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 9px;
        transition: 0.18s ease;
      }

      .teacher-clean-tabs button:hover,
      .teacher-clean-tabs button.active {
        background: linear-gradient(135deg, #149a57, #0a8a4b);
        color: #ffffff;
        box-shadow: 0 10px 20px rgba(20, 154, 87, 0.2);
      }

      .teacher-clean-panel {
        margin-top: 18px;
        animation: teacherPanelIn 0.18s ease;
      }

      @keyframes teacherPanelIn {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .teacher-clean-tools {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
      }

      .lms-tool-card.compact {
        padding: 18px;
        border-radius: 22px;
        box-shadow: 0 10px 24px rgba(30, 71, 44, 0.045);
      }

      .teacher-clean-subhead {
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 14px;
        margin: 22px 0 12px;
        padding-top: 4px;
      }

      .teacher-clean-subhead h3 {
        margin: 0;
        color: #17243b;
        font-size: 20px;
        letter-spacing: -0.03em;
      }

      .teacher-clean-subhead p {
        margin: 0;
        color: #75867b;
        font-weight: 700;
      }

      .teacher-clean-group-list {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }

      .lms-group-card.clean {
        margin: 0;
        padding: 16px;
        border-radius: 20px;
        box-shadow: none;
      }

      .lms-feature-head.clean {
        align-items: center;
        margin-bottom: 16px;
      }

      .teacher-builder-layout {
        gap: 18px;
        grid-template-columns: minmax(0, 1fr) minmax(300px, 0.55fr);
      }

      .teacher-design-card,
      .teacher-side-card {
        border-radius: 22px;
        padding: 20px;
        box-shadow: 0 10px 26px rgba(30, 71, 44, 0.045);
      }

      .teacher-design-heading {
        margin-bottom: 14px;
      }

      .teacher-design-heading h2 {
        font-size: 20px;
      }

      .teacher-design-heading p {
        font-size: 13px;
        line-height: 1.45;
      }

      .lms-add-choice-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }

      .lms-add-choice {
        min-height: 58px;
        padding: 10px;
      }

      .teacher-activity-row {
        padding: 15px;
        border-radius: 20px;
      }

      .teacher-activity-row-icon {
        width: 42px;
        height: 42px;
        border-radius: 14px;
      }

      .teacher-activity-row-head {
        margin-bottom: 10px;
      }

      .lms-recent-table th,
      .lms-recent-table td {
        padding: 12px 10px;
      }

      .lms-bottom-action-bar {
        background: #ffffff;
        border: 1px solid #e4eee8;
        border-radius: 22px;
        padding: 14px;
        box-shadow: 0 10px 24px rgba(30, 71, 44, 0.045);
      }

      .lms-action-secondary,
      .lms-action-primary {
        height: 50px;
      }

      @media (max-width: 1120px) {
        .teacher-clean-metrics,
        .teacher-clean-tools,
        .teacher-clean-group-list {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .teacher-builder-layout {
          grid-template-columns: 1fr;
        }

        .teacher-clean-tabs {
          position: static;
        }
      }

      @media (max-width: 760px) {
        .teacher-main-header-clean {
          height: auto;
          padding: 14px;
          flex-direction: column;
          align-items: stretch;
          gap: 12px;
        }

        .teacher-main-content-clean {
          padding: 16px;
        }

        .teacher-clean-hero,
        .teacher-clean-subhead,
        .lms-feature-head.clean {
          flex-direction: column;
          align-items: flex-start;
        }

        .teacher-clean-actions {
          width: 100%;
          justify-content: stretch;
        }

        .teacher-clean-actions button {
          flex: 1;
        }

        .teacher-clean-metrics,
        .teacher-clean-tools,
        .teacher-clean-group-list,
        .teacher-clean-tabs,
        .lms-add-choice-grid {
          grid-template-columns: 1fr;
        }
      }

          /* Final cleanup for Group Manager and Student Monitoring panels */
      .teacher-workspace-card {
        margin-top: 18px;
        background: #ffffff;
        border: 1px solid #e3eee7;
        border-radius: 26px;
        padding: 24px;
        box-shadow: 0 14px 34px rgba(30, 71, 44, 0.055);
      }

      .teacher-workspace-heading {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 18px;
        margin-bottom: 18px;
      }

      .teacher-workspace-heading h2 {
        margin: 4px 0 6px;
        color: #17243b;
        font-size: 26px;
        letter-spacing: -0.04em;
      }

      .teacher-workspace-heading p {
        margin: 0;
        color: #6f8176;
        font-weight: 700;
        line-height: 1.55;
      }

      .teacher-group-layout {
        display: grid;
        grid-template-columns: minmax(320px, 0.78fr) minmax(0, 1.22fr);
        gap: 18px;
        align-items: start;
      }

      .teacher-group-tools {
        display: grid;
        gap: 14px;
      }

      .teacher-tool-box {
        background: linear-gradient(180deg, #fbfffc 0%, #f7fbf8 100%);
        border: 1px solid #e2ede6;
        border-radius: 22px;
        padding: 18px;
        box-shadow: 0 10px 24px rgba(30, 71, 44, 0.04);
      }

      .teacher-tool-icon {
        width: 42px;
        height: 42px;
        border-radius: 14px;
        display: grid;
        place-items: center;
        margin-bottom: 10px;
        font-size: 20px;
      }

      .teacher-tool-icon.purple {
        background: #f3edff;
      }

      .teacher-tool-icon.orange {
        background: #fff4df;
      }

      .teacher-tool-box h3 {
        margin: 0 0 6px;
        color: #183523;
        font-size: 20px;
        letter-spacing: -0.03em;
      }

      .teacher-tool-box p {
        margin: 0 0 14px;
        color: #748378;
        line-height: 1.5;
        font-weight: 700;
      }

      .teacher-tool-box .input-field {
        width: 100%;
        margin-bottom: 10px;
        min-height: 48px;
      }

      .teacher-two-fields {
        display: grid;
        grid-template-columns: 1fr 100px;
        gap: 10px;
      }

      .lms-main-action.full,
      .lms-outline-action.full {
        width: 100%;
      }

      .teacher-groups-area {
        min-width: 0;
        background: #fbfefd;
        border: 1px solid #e7f0ea;
        border-radius: 22px;
        padding: 18px;
      }

      .teacher-mini-heading {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 14px;
      }

      .teacher-mini-heading h3 {
        margin: 0 0 4px;
        color: #17243b;
        font-size: 21px;
        letter-spacing: -0.03em;
      }

      .teacher-mini-heading p {
        margin: 0;
        color: #75867b;
        font-weight: 700;
        line-height: 1.45;
      }

      .teacher-groups-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .teacher-group-item {
        border: 1px solid #e1eee7;
        border-radius: 20px;
        background: #ffffff;
        padding: 15px;
      }

      .teacher-group-item-top {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: flex-start;
      }

      .teacher-group-item strong {
        color: #17243b;
        font-size: 16px;
      }

      .teacher-group-item p {
        margin: 4px 0 0;
        color: #738177;
        line-height: 1.45;
      }

      .teacher-add-member-row {
        margin-top: 14px;
        padding-top: 14px;
        border-top: 1px solid #edf3ef;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 10px;
      }

      .teacher-add-member-row .input-field {
        min-width: 0;
      }

      .teacher-empty-panel {
        min-height: 160px;
        border: 1px dashed #cfe7d8;
        border-radius: 20px;
        background: #f8fcf9;
        color: #728277;
        display: grid;
        place-items: center;
        text-align: center;
        padding: 22px;
        grid-column: 1 / -1;
      }

      .teacher-empty-panel div {
        font-size: 30px;
      }

      .teacher-empty-panel strong {
        margin-top: 6px;
        color: #1d3c29;
      }

      .teacher-empty-panel p {
        margin: 4px 0 0;
      }

      .teacher-workspace-heading.monitor {
        align-items: center;
      }

      .teacher-monitor-actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 10px;
      }

      .teacher-monitor-summary {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
        margin-bottom: 16px;
      }

      .teacher-monitor-summary div {
        border: 1px solid #e5eee8;
        background: #f9fcfa;
        border-radius: 18px;
        padding: 14px;
      }

      .teacher-monitor-summary span {
        display: block;
        color: #728277;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        font-weight: 950;
      }

      .teacher-monitor-summary strong {
        display: block;
        margin-top: 4px;
        color: #17243b;
        font-size: 25px;
      }

      .teacher-table-wrapper {
        width: 100%;
        overflow-x: auto;
        border: 1px solid #e5eee8;
        border-radius: 20px;
        background: #ffffff;
      }

      .teacher-monitor-table {
        width: 100%;
        border-collapse: collapse;
        min-width: 760px;
      }

      .teacher-monitor-table th,
      .teacher-monitor-table td {
        padding: 15px 16px;
        border-bottom: 1px solid #edf3ef;
        text-align: left;
        color: #17243b;
      }

      .teacher-monitor-table th {
        background: #fbfefd;
        color: #40554a;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .teacher-monitor-table td strong {
        display: block;
        font-size: 15px;
      }

      .teacher-monitor-table td small {
        display: block;
        margin-top: 4px;
        color: #738177;
      }

      .teacher-progress-cell {
        display: grid;
        gap: 7px;
        min-width: 150px;
      }

      .teacher-progress-cell span {
        color: #173c27;
        font-weight: 900;
      }

      .teacher-progress-track {
        height: 8px;
        border-radius: 999px;
        background: #eaf4ee;
        overflow: hidden;
      }

      .teacher-progress-track div {
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #13a85f, #7fda95);
      }

      .teacher-empty-panel.table {
        min-height: 180px;
      }

      @media (max-width: 1100px) {
        .teacher-group-layout {
          grid-template-columns: 1fr;
        }

        .teacher-groups-grid {
          grid-template-columns: 1fr;
        }

        .teacher-workspace-heading.monitor {
          align-items: flex-start;
          flex-direction: column;
        }

        .teacher-monitor-actions {
          justify-content: flex-start;
        }
      }

      @media (max-width: 700px) {
        .teacher-workspace-card {
          padding: 16px;
          border-radius: 22px;
        }

        .teacher-monitor-summary,
        .teacher-two-fields,
        .teacher-add-member-row {
          grid-template-columns: 1fr;
        }

        .teacher-monitor-actions button {
          width: 100%;
        }
      }


      /* Fix monitoring action buttons so they are clearly clickable and never covered by nearby layout layers. */
      .teacher-workspace-heading.monitor {
        position: relative;
        z-index: 5;
      }

      .teacher-monitor-actions {
        position: relative;
        z-index: 10;
        pointer-events: auto;
      }

      .teacher-monitor-actions .lms-report-button {
        position: relative;
        z-index: 11;
        pointer-events: auto;
        cursor: pointer;
        user-select: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }

      .teacher-monitor-actions .lms-report-button:hover {
        background: #eefaf3;
        border-color: #9fd8b8;
        transform: translateY(-1px);
        box-shadow: 0 8px 18px rgba(20, 154, 87, 0.1);
      }

      .teacher-monitor-actions .lms-report-button:active {
        transform: translateY(0);
      }
    `}</style>
  );
}


function TeacherAssessmentCenter({ lessons = [], rows = [] }) {
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

function TeacherEffectivenessPanel({ rows = [], lessons = [], groups = [] }) {
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




function TeacherDashboard({
  user,
  data,
  logout,
  reload,
  createGroup,
  addTask,
  addMember,
  createLesson,
  exportStudentsCSV,
  exportLogsCSV,
  downloadSummaryReport
}) {
  const [teacherTab, setTeacherTab] = useState('lessons');

  const lessons = data.lessons || [];
  const groups = data.groups || [];
  const students = data.students || [];
  const rows = data.rows || [];
  const stats = data.stats || {};
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

  return (
    <div className="teacher-redesign-page">
      <TeacherRedesignStyles />

      <header className="teacher-main-header teacher-main-header-clean">
        <div className="teacher-brand-area">
          <div className="teacher-brand-mark">
            <div className="teacher-brand-icon">🌱</div>
            <div className="teacher-brand-text">
              <strong>Tuklas Talino</strong>
              <small>Tuklasin. Matuto. Magningning.</small>
            </div>
          </div>

          <nav className="teacher-nav-links" aria-label="Teacher navigation">
            <button
              className={teacherTab === 'lessons' ? 'active' : ''}
              type="button"
              onClick={() => openTab('lessons')}
            >
              📚 Lessons
            </button>
            <button
              className={teacherTab === 'groups' ? 'active' : ''}
              type="button"
              onClick={() => openTab('groups')}
            >
              👥 Groups
            </button>
            <button
              className={teacherTab === 'assessments' ? 'active' : ''}
              type="button"
              onClick={() => openTab('assessments')}
            >
              🧠 Assessments
            </button>
            <button
              className={teacherTab === 'students' ? 'active' : ''}
              type="button"
              onClick={() => openTab('students')}
            >
              🎓 Students
            </button>
            <button type="button" onClick={downloadSummaryReport}>
              📊 Report
            </button>
          </nav>
        </div>

        <div className="teacher-header-actions">
          <div className="teacher-profile-pill">
            <div className="teacher-profile-avatar">👩‍🏫</div>
            <div className="teacher-profile-text">
              <strong>{teacherName}</strong>
              <small>Guro</small>
            </div>
            <span>⌄</span>
          </div>

          <button className="teacher-logout-btn" onClick={logout}>
            ⇥ Logout
          </button>
        </div>
      </header>

      <main className="teacher-main-content teacher-main-content-clean" id="teacher-dashboard-top">
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

        <section className="teacher-clean-tabs" id="teacher-dashboard-workspace">
          <button
            className={teacherTab === 'lessons' ? 'active' : ''}
            type="button"
            onClick={() => openTab('lessons')}
          >
            <span>📚</span>
            Lesson Builder
          </button>
          <button
            className={teacherTab === 'groups' ? 'active' : ''}
            type="button"
            onClick={() => openTab('groups')}
          >
            <span>👥</span>
            Group Manager
          </button>
          <button
            className={teacherTab === 'assessments' ? 'active' : ''}
            type="button"
            onClick={() => openTab('assessments')}
          >
            <span>🧠</span>
            Assessments
          </button>
          <button
            className={teacherTab === 'students' ? 'active' : ''}
            type="button"
            onClick={() => openTab('students')}
          >
            <span>🎓</span>
            Student Monitoring
          </button>
        </section>

        {teacherTab === 'lessons' && (
          <section className="teacher-clean-panel">
            <TeacherLessonManager lessons={lessons} createLesson={createLesson} />
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
                  {groups.length ? groups.map(group => (
                    <div className="teacher-group-item" key={group.id}>
                      <div className="teacher-group-item-top">
                        <div>
                          <strong>{group.name}</strong>
                          <p>{group.description || 'No description added.'}</p>
                        </div>
                        <span className="lms-mini-pill">✅ {group.tasks?.length || 0} tasks</span>
                      </div>

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
                    </div>
                  )) : (
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
          <TeacherAssessmentCenter lessons={lessons} rows={rows} />
        )}

        {teacherTab === 'students' && (
          <section className="teacher-workspace-card clean-students-panel" id="teacher-monitoring-table">
            <div className="teacher-workspace-heading monitor">
              <div>
                <div className="lms-section-label">Learner Monitoring</div>
                <h2>Students Monitoring Table</h2>
                <p>Track XP, lesson completion, progress, and learner status.</p>
              </div>

              <div className="teacher-monitor-actions">
                <button type="button" className="lms-report-button" onClick={reload}>Refresh</button>
                <button type="button" className="lms-report-button" onClick={exportStudentsCSV}>⬇️ Export CSV</button>
                <button type="button" className="lms-report-button" onClick={exportLogsCSV}>⬇️ Export Activity Logs</button>
                <button type="button" className="lms-report-button" onClick={downloadSummaryReport}>🧾 Summary Report</button>
              </div>
            </div>

            <div className="teacher-monitor-summary">
              <div>
                <span>Total Students</span>
                <strong>{studentCount}</strong>
              </div>
              <div>
                <span>Average Progress</span>
                <strong>{averageProgress}%</strong>
              </div>
              <div>
                <span>Lessons Available</span>
                <strong>{lessons.length}</strong>
              </div>
            </div>

            <TeacherEffectivenessPanel rows={rows} lessons={lessons} groups={groups} />

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
      </main>
    </div>
  );
}





function TeacherLessonManager({ lessons, createLesson }) {
  const [lessonDraft, setLessonDraft] = useState({
    gradeLevel: 1,
    subject: 'Pagbasa',
    title: '',
    xpReward: 25,
    duration: '10 minuto',
    instructions: '',
    passage: ''
  });

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
        title: 'MCQ Quiz',
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
        title: 'Writing Prompt',
        prompt: ''
      },
      speech: {
        ...base,
        title: 'Speech Practice',
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
      .slice(0, 5000);
  }

  async function handleLessonPlanFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(file.name);
    const isText = file.type.startsWith('text/') || /\.(txt|md|csv)$/i.test(file.name);
    const isPdf = file.type === 'application/pdf' || lowerName.endsWith('.pdf');

    setLessonPlanFile({
      name: file.name,
      type: file.type || 'Unknown file type',
      size: formatLessonPlanFileSize(file.size)
    });
    setLessonPlanFilePreview('');
    setLessonPlanFileStatus('Reading uploaded lesson plan...');
    setAiDraftNotice('');

    try {
      if (isImage) {
        const previewUrl = URL.createObjectURL(file);
        setLessonPlanFilePreview(previewUrl);
        setLessonPlanFileStatus(
          'Image uploaded. This is ready for the OCR/AI extraction step. For now, paste the readable lesson text below, then generate the draft.'
        );
        setAiDraftNotice('Photo selected. Next step is connecting OCR/backend extraction for scanned lesson plans.');
        return;
      }

      if (isText) {
        const text = await file.text();
        const cleaned = text.trim();

        if (!cleaned) {
          setLessonPlanFileStatus('The uploaded text file is empty. Please choose another file or paste the lesson plan.');
          return;
        }

        setLessonPlanText(cleaned);
        setLessonPlanFileStatus('Text extracted successfully. You can review it, edit it, then generate a lesson draft.');
        setAiDraftNotice('Lesson plan text was extracted from the uploaded file. Please review before generating.');
        return;
      }

      if (isPdf) {
        const rawText = await file.text();
        const readableText = extractReadablePdfText(rawText);

        if (readableText && readableText.length >= 120) {
          setLessonPlanText(readableText);
          setLessonPlanFileStatus(
            'Basic PDF text extraction completed. Please review the text because PDF extraction may include extra spacing or missing words.'
          );
          setAiDraftNotice('A basic draft source was extracted from the PDF. Please review before generating.');
        } else {
          setLessonPlanFileStatus(
            'PDF selected, but the browser could not read enough text. If this is scanned or picture-based, it needs OCR/backend extraction. Paste the lesson text below for now.'
          );
          setAiDraftNotice('PDF selected. Scanned lesson plans need OCR/backend extraction before AI generation.');
        }
        return;
      }

      setLessonPlanFileStatus(
        'File selected, but this type needs backend extraction. Please upload TXT/PDF/image or paste the lesson plan text below.'
      );
    } catch (err) {
      setLessonPlanFileStatus('Could not read the uploaded file. Please try another file or paste the lesson plan text.');
      setAiDraftNotice(err?.message || 'File reading failed.');
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
            title: activity.title || 'MCQ Quiz',
            instructions: activity.instructions || null,
            questions
          };
        }

        if (activity.type === 'writing') {
          if (!activity.prompt?.trim()) return null;

          return {
            type: 'writing',
            title: activity.title || 'Writing Prompt',
            instructions: activity.instructions || null,
            prompt: activity.prompt.trim()
          };
        }

        if (activity.type === 'speech') {
          if (!activity.targetText?.trim()) return null;

          return {
            type: 'speech',
            title: activity.title || 'Speech Practice',
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

    if (/oral|bigkas|pagbigkas|talumpati|speech|pronunciation|salita nang malinaw/.test(lower)) return 'Oral Comm';
    if (/sulat|pagsulat|pangungusap|sanaysay|liham|tulaing isusulat/.test(lower)) return 'Pagsulat';
    if (/panitikan|tula|alamat|pabula|maikling kwento|kuwento/.test(lower)) return 'Panitikan';
    if (/bokabularyo|talasalitaan|kahulugan|salitang|vocabulary/.test(lower)) return 'Bokabularyo';
    if (/pagbasa|basa|reading|komprehensyon|unawa|story/.test(lower)) return 'Pagbasa';

    return 'Pagbasa';
  }

  function guessGradeFromPlan(text) {
    const match = String(text || '').match(/grade\s*([1-6])|baitang\s*([1-6])/i);
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
      'ang', 'mga', 'para', 'with', 'that', 'this', 'from', 'lesson', 'grade', 'baitang',
      'student', 'students', 'teacher', 'learning', 'objective', 'objectives', 'activity',
      'filipino', 'aralin', 'gawain', 'panuto', 'pagkatapos', 'maaaring', 'dapat', 'will',
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
      setAiDraftNotice('Please upload a lesson plan file or paste the teacher lesson plan first.');
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
    const vocabularyWords = (keywords.length ? keywords : ['salita', 'kahulugan', 'aralin']).slice(0, 4);
    const firstSentence = sentences[0] || generatedTitle;

    const generatedActivities = [
      {
        id: makeId(),
        type: 'infographic',
        title: 'Info Card',
        instructions: 'Basahin ang maikling gabay bago sagutan ang gawain.',
        content: `Paksa: ${generatedTitle}\n\nMahahalagang ideya:\n- Basahin at unawain ang aralin.\n- Sagutan ang mga gawain pagkatapos magbasa.\n- Humingi ng gabay sa guro kung may hindi malinaw.`
      },
      {
        id: makeId(),
        type: 'vocabulary',
        title: 'Mga Bagong Salita',
        instructions: 'Pag-aralan ang salita, kahulugan, at halimbawa.',
        words: vocabularyWords.map(word => ({
          id: makeId(),
          word: word.charAt(0).toUpperCase() + word.slice(1),
          meaning: 'Ilagay o iwasto ang kahulugan ng salitang ito.',
          example: `Halimbawa ng gamit ng ${word} sa pangungusap.`
        }))
      },
      {
        id: makeId(),
        type: 'mcq',
        title: 'Mini Quiz',
        instructions: 'Piliin ang pinakaangkop na sagot.',
        questions: [
          {
            id: makeId(),
            question: `Ano ang pangunahing paksa ng aralin na "${generatedTitle}"?`,
            options: [
              { id: makeId(), text: generatedSubject, isCorrect: true },
              { id: makeId(), text: 'Matematika', isCorrect: false },
              { id: makeId(), text: 'Agham', isCorrect: false },
              { id: makeId(), text: 'Araling Panlipunan', isCorrect: false }
            ]
          }
        ]
      },
      {
        id: makeId(),
        type: 'writing',
        title: 'Writing Prompt',
        instructions: 'Sumulat ng maikling sagot batay sa aralin.',
        prompt: `Ano ang natutuhan mo tungkol sa ${generatedTitle}? Sumulat ng 2 hanggang 3 pangungusap.`
      },
      {
        id: makeId(),
        type: 'speech',
        title: 'Speech Practice',
        instructions: 'Basahin nang malinaw ang pangungusap.',
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
      instructions: 'Basahin ang aralin, pakinggan kung kailangan, at sagutan ang mga gawain.',
      passage: mainPassage
    }));

    setActivities(generatedActivities);
    setAiDraftNotice('Generated a lesson draft. Please review and edit everything before publishing.');
  }

  async function submitLessonBuilder() {
    if (!lessonDraft.title.trim()) {
      alert('Please enter a lesson title.');
      return;
    }

    const payload = {
      gradeLevel: Number(lessonDraft.gradeLevel),
      subject: lessonDraft.subject,
      title: lessonDraft.title.trim(),
      xpReward: Number(lessonDraft.xpReward || 25),
      duration: lessonDraft.duration || '10 minuto',
      instructions: lessonDraft.instructions || null,
      passage: lessonDraft.passage || null,
      activities: cleanActivities()
    };

    await createLesson(payload);

    setLessonDraft({
      gradeLevel: 1,
      subject: 'Pagbasa',
      title: '',
      xpReward: 25,
      duration: '10 minuto',
      instructions: '',
      passage: ''
    });

    setActivities([]);
  }

  const validActivities = cleanActivities();
  const subjectMeta = SUBJECTS.find(s => s.name === lessonDraft.subject) || SUBJECTS[0];
  const [showAllLessons, setShowAllLessons] = useState(false);

  const allRecentLessons = [...(lessons || [])]
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
    { type: 'infographic', label: 'Info Card', icon: 'i', className: 'choice-infographic' },
    { type: 'vocabulary', label: 'Vocabulary', icon: 'Aa', className: 'choice-vocabulary' },
    { type: 'matching', label: 'Matching', icon: '⌘', className: 'choice-matching' },
    { type: 'mcq', label: 'MCQ Quiz', icon: '?', className: 'choice-mcq' },
    { type: 'speech', label: 'Speech Practice', icon: '🎙️', className: 'choice-speech' },
    { type: 'writing', label: 'Writing Prompt', icon: '✎', className: 'choice-writing' }
  ];

  const assessmentProfile = lessonAssessmentProfile(validActivities);
  const assessmentChecks = [
    { label: 'Content / Info', ok: assessmentProfile.hasContent, note: 'Adds lesson context before assessment.' },
    { label: 'Quiz or Matching', ok: assessmentProfile.hasObjectiveQuiz, note: 'Measures basic understanding with a score.' },
    { label: 'Writing Evidence', ok: assessmentProfile.hasWriting, note: 'Shows if students can express ideas in Filipino.' },
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

  return (
    <>
      <div className="teacher-builder-layout">
        <div className="teacher-builder-main">
          <section className="teacher-design-card soft" style={{ border: '2px solid #dcefe2', background: 'linear-gradient(135deg, #fbfffd, #f3fbf6)' }}>
            <div className="teacher-design-heading">
              <div className="teacher-design-step">AI</div>
              <div>
                <h2>AI-Assisted Lesson Builder</h2>
                <p>Upload a lesson plan file or paste the content, then generate a Tuklas Talino draft. Teacher review is still required before publishing.</p>
              </div>
            </div>

            <div className="teacher-field">
              <label>Upload Lesson Plan File</label>
              <input
                id="teacher-lesson-plan-file"
                className="input-field"
                type="file"
                accept=".txt,.md,.csv,.pdf,.png,.jpg,.jpeg,.webp,text/plain,application/pdf,image/*"
                onChange={handleLessonPlanFileUpload}
              />
              <small style={{ color: '#6d7b73', fontWeight: 750, marginTop: 6 }}>
                Accepted starter files: TXT, PDF, PNG, JPG, JPEG, WEBP. Text files can be extracted now. Scanned PDFs/images are prepared for OCR/backend extraction.
              </small>
            </div>

            {lessonPlanFile && (
              <div className="lms-empty-line" style={{ marginTop: 12, background: '#ffffff', color: '#264136' }}>
                <strong>Selected file:</strong> {lessonPlanFile.name} • {lessonPlanFile.size}
                <br />
                <span>{lessonPlanFileStatus}</span>
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

            <div className="teacher-field" style={{ marginTop: 16 }}>
              <label>Lesson Plan Text / Extracted Content</label>
              <textarea
                className="input-field"
                value={lessonPlanText}
                onChange={(e) => setLessonPlanText(e.target.value)}
                placeholder={"Upload a lesson plan file above, or paste here.\n\nExample:\nGrade 1 Filipino\nPaksa: Mga Pangngalan\nLayunin: Natutukoy ang pangngalan sa pangungusap.\nGawain: Basahin ang maikling kwento at sagutan ang tanong."}
                rows="7"
                style={{ minHeight: 190, lineHeight: 1.55 }}
              />
            </div>

            <div className="row" style={{ marginTop: 14, gap: 10 }}>
              <button className="lms-main-action" type="button" onClick={generateFromLessonPlan}>
                ✨ Generate Draft from Lesson Plan
              </button>
              <button
                className="lms-outline-action"
                type="button"
                onClick={clearLessonPlanSource}
              >
                Clear
              </button>
            </div>

            {aiDraftNotice && (
              <div className="lms-empty-line" style={{ marginTop: 12, background: '#fff8df', color: '#6b4b00' }}>
                {aiDraftNotice}
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
                  value={lessonDraft.gradeLevel}
                  onChange={(e) => updateLesson('gradeLevel', Number(e.target.value))}
                >
                  <option value="1">Grade 1</option>
                  <option value="2">Grade 2</option>
                  <option value="3">Grade 3</option>
                  <option value="4">Grade 4</option>
                  <option value="5">Grade 5</option>
                  <option value="6">Grade 6</option>
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
                placeholder="e.g. Pangngalan at mga Halimbawa"
              />
            </div>

            <div className="teacher-field" style={{ marginTop: 16 }}>
              <label>Estimated Duration</label>
              <input
                className="input-field"
                value={lessonDraft.duration}
                onChange={(e) => updateLesson('duration', e.target.value)}
                placeholder="10 minuto"
              />
            </div>
          </section>

          <section className="teacher-design-card soft">
            <div className="teacher-design-heading">
              <div className="teacher-design-step">2</div>
              <div>
                <h2>Learning Content</h2>
                <p>Add instructions and the main content for your lesson.</p>
              </div>
            </div>

            <div className="teacher-field">
              <label>Instructions for Students</label>
              <textarea
                className="input-field"
                value={lessonDraft.instructions}
                onChange={(e) => updateLesson('instructions', e.target.value)}
                placeholder="Write clear instructions for your students..."
                rows="4"
              />
            </div>

            <div className="teacher-field" style={{ marginTop: 16 }}>
              <label>Main Passage / Story / Lesson Content</label>
              <div className="lms-editor-toolbar" aria-hidden="true">
                <button type="button">B</button>
                <button type="button"><em>I</em></button>
                <button type="button"><u>U</u></button>
                <button type="button">☰</button>
                <button type="button">🔗</button>
                <button type="button">🖼️</button>
                <button type="button">↶</button>
                <button type="button">↷</button>
              </div>
              <textarea
                className="input-field lms-editor-area"
                value={lessonDraft.passage}
                onChange={(e) => updateLesson('passage', e.target.value)}
                placeholder="Write or paste your lesson content here..."
                rows="7"
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

              <button className="lms-add-block-btn" type="button" onClick={() => addActivity('infographic')}>
                ＋ Add Activity Block
              </button>
            </div>
          </section>

          <section className="teacher-design-card soft">
            <div className="teacher-design-heading">
              <div className="teacher-design-step">4</div>
              <div>
                <h2>Assessment Coverage</h2>
                <p>Use more than MCQ so teachers can check understanding, writing, speaking, and engagement.</p>
              </div>
              <span className="lms-mini-pill">{readinessScore}% ready</span>
            </div>

            <div className="teacher-monitor-summary">
              {assessmentChecks.map(item => (
                <div key={item.label} style={{ background: item.ok ? '#edf8f1' : '#fff8df' }}>
                  <span>{item.ok ? '✅' : '⚠️'} {item.label}</span>
                  <strong>{item.ok ? 'Added' : 'Missing'}</strong>
                  <small style={{ display: 'block', marginTop: 6, color: '#526988', fontWeight: 800 }}>{item.note}</small>
                </div>
              ))}
            </div>

            <div className="lms-empty-line" style={{ marginTop: 14, background: '#ffffff', color: '#264136' }}>
              Recommended flow: pre-check → lesson content → practice → quiz/test → writing or speech → student self-evaluation.
            </div>
          </section>

          <section className="teacher-design-card soft" id="teacher-recent-lessons">
            <div className="teacher-design-heading">
              <div className="teacher-design-step">5</div>
              <div>
                <h2>Recently Created Lessons</h2>
                <p>Your most recent lessons.</p>
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
                  <th>Duration</th>
                  <th>XP</th>
                  <th>Status</th>
                  <th>Updated</th>
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
                      <td>{lesson.duration || '10 minuto'}</td>
                      <td>{lesson.xpReward || 0}</td>
                      <td>
                        <span className={`lms-status ${isPublished ? 'published' : 'draft'}`}>
                          ● {isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td>{fmtDate(lesson.updatedAt || lesson.createdAt)}</td>
                    </tr>
                  );
                })}

                {!visibleRecentLessons.length && (
                  <tr>
                    <td colSpan="7">No teacher-created lessons yet.</td>
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
        </div>

        <aside className="teacher-builder-side">
          <section className="teacher-side-card lms-live-preview">
            <div className="teacher-design-heading">
              <div className="teacher-design-step">👁</div>
              <div>
                <h2>Live Preview</h2>
                <p>See how your lesson will appear to students.</p>
              </div>
            </div>

            <div className="lms-preview-card-inner">
              <div className="lms-preview-badges">
                <span className="lms-preview-badge">{subjectMeta?.icon || '📘'} {lessonDraft.subject}</span>
                <span className="lms-preview-badge">Grade {lessonDraft.gradeLevel}</span>
              </div>

              <div className="lms-preview-title">
                {lessonDraft.title || 'Untitled Lesson'}
              </div>

              <div className="lms-preview-stats">
                <span className="lms-preview-stat">⏱ {lessonDraft.duration || '10 minuto'}</span>
                <span className="lms-preview-stat">⭐ {lessonDraft.xpReward || 0} XP</span>
                <span className="lms-preview-stat">🧩 {validActivities.length} activities</span>
              </div>

              <div className="lms-preview-illustration">📖</div>

              <strong>Instructions</strong>
              <div className="lms-preview-textbox">
                {lessonDraft.instructions || 'Instructions will appear here for students.'}
              </div>

              <button className="lms-student-preview-btn" type="button" onClick={() => document.querySelector('.lms-live-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                👥 Student Preview
              </button>
            </div>
          </section>

          <section className="teacher-side-card">
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

          <section className="teacher-side-card">
            <div className="teacher-design-heading">
              <div>
                <h2>💡 Tips for Great Lessons</h2>
                <p>Quick reminders before publishing.</p>
              </div>
            </div>

            <div className="lms-tips-list">
              <div className="lms-tip-item">
                <span>💬</span>
                <p>Keep instructions short and student-friendly.</p>
              </div>
              <div className="lms-tip-item">
                <span>📘</span>
                <p>Use stories and examples from real life.</p>
              </div>
              <div className="lms-tip-item">
                <span>🧩</span>
                <p>Include a variety of activities to keep learners engaged.</p>
              </div>
              <div className="lms-tip-item">
                <span>👁</span>
                <p>Preview your lesson before publishing.</p>
              </div>
            </div>
          </section>
        </aside>
      </div>

      <div className="lms-bottom-action-bar">
        <button className="lms-action-secondary" type="button">
          📋 Save Draft
        </button>
        <button className="lms-action-secondary" type="button" onClick={() => document.querySelector('.lms-live-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
          👁 Preview Lesson
        </button>
        <button className="lms-action-primary" type="button" onClick={submitLessonBuilder}>
          🚀 Create Lesson
        </button>
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
      label: 'MCQ Quiz',
      desc: 'Multiple choice questions.',
      icon: '?',
      color: '#ec407a'
    },
    writing: {
      label: 'Writing Prompt',
      desc: 'Encourage creative writing.',
      icon: '✎',
      color: '#16a9b7'
    },
    speech: {
      label: 'Speech Practice',
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

        <div className="teacher-activity-row-fields grid2">
          <input
            className="input-field"
            value={activity.title}
            onChange={(e) => updateActivity(activity.id, { title: e.target.value })}
            placeholder="Activity title"
          />

          <input
            className="input-field"
            value={activity.instructions}
            onChange={(e) => updateActivity(activity.id, { instructions: e.target.value })}
            placeholder="Activity instructions"
          />
        </div>

        <div style={{ height: 10 }} />

        {activity.type === 'mcq' && (
          <div className="teacher-inline-mcq">
            {activity.questions.map((question, qIndex) => (
              <div key={question.id} className="teacher-activity-row-fields">
                <input
                  className="input-field"
                  value={question.question}
                  onChange={(e) => updateMcqQuestion(activity.id, question.id, { question: e.target.value })}
                  placeholder={`Question ${qIndex + 1}`}
                />

                <div className="teacher-activity-row-fields grid2">
                  {question.options.map((option, oIndex) => (
                    <div key={option.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="radio"
                        name={`correct-${activity.id}-${question.id}`}
                        checked={option.isCorrect}
                        onChange={() => updateMcqOption(activity.id, question.id, option.id, { isCorrect: true })}
                      />
                      <input
                        className="input-field"
                        value={option.text}
                        onChange={(e) => updateMcqOption(activity.id, question.id, option.id, { text: e.target.value })}
                        placeholder={`Choice ${String.fromCharCode(65 + oIndex)}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button className="teacher-add-mini" onClick={() => addMcqQuestion(activity.id)} type="button">
              + Add MCQ Question
            </button>
          </div>
        )}

        {activity.type === 'writing' && (
          <textarea
            className="input-field"
            value={activity.prompt}
            onChange={(e) => updateActivity(activity.id, { prompt: e.target.value })}
            placeholder="Writing prompt, e.g. Sumulat ng dalawang pangungusap tungkol sa iyong pamilya."
            rows="3"
          />
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
            placeholder="Short info card content. Example: Ang pangngalan ay salita na tumutukoy sa tao, bagay, hayop, lugar, o pangyayari."
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


function AdminDashboard({
  data,
  logout,
  addStudent,
  addTeacher,
  archiveStudent,
  reactivateStudent,
  resetStudentPassword,
  resetStudent,
  resetTeacherPassword,
  archiveTeacher,
  reactivateTeacher,
  reload
}) {
  return <><div className="top-nav"><div className="logo">🛡️ Admin Dashboard</div><div className="row"><div className="pill">⚙️ Manage Accounts</div><button className="btn btn-outline btn-sm" onClick={logout}>Logout</button></div></div><div className="scroll"><div className="card" style={{ background: 'linear-gradient(135deg,var(--purple),#8E44AD)', color: 'white' }}><div className="section-title" style={{ color: 'white' }}>👥 Account Management</div><div className="muted" style={{ color: 'white', opacity: .9 }}>Magdagdag at mag-manage ng Students at Teachers.</div></div><div className="grid grid-3"><Stat icon="👥" label="Users" value={data.stats?.users || 0} /><Stat icon="👨‍🎓" label="Students" value={data.stats?.students || 0} /><Stat icon="👩‍🏫" label="Teachers" value={data.stats?.teachers || 0} /></div><div className="grid grid-2"><div className="card"><div className="section-title">👨‍🎓 Add Student</div><input className="input-field" id="a-stu-id" placeholder="Student ID (unique)" /><div style={{ height: 10 }} /><input className="input-field" id="a-stu-name" placeholder="Name" /><div style={{ height: 10 }} /><input className="input-field" id="a-stu-grade" type="number" min="1" max="6" placeholder="Grade (1-6)" /><div style={{ height: 10 }} /><input className="input-field" id="a-stu-section" placeholder="Section" /><div style={{ height: 10 }} /><input className="input-field" id="a-stu-password" placeholder="Password (default student123)" /><div className="divider" /><button className="btn btn-green" onClick={addStudent}>Add Student</button></div><div className="card"><div className="section-title">👩‍🏫 Add Teacher</div><input className="input-field" id="a-t-username" placeholder="Username (unique)" /><div style={{ height: 10 }} /><input className="input-field" id="a-t-name" placeholder="Teacher Name" /><div style={{ height: 10 }} /><input className="input-field" id="a-t-code" placeholder="Employee Code" /><div style={{ height: 10 }} /><input className="input-field" id="a-t-password" placeholder="Password" /><div className="divider" /><button className="btn btn-blue" onClick={addTeacher}>Add Teacher</button></div></div><div className="card"><div className="section-title">📋 Students</div><div className="row"><button className="btn btn-outline btn-sm" onClick={reload}>Refresh</button></div><div className="divider" /><div id="admin-students-wrap">{data.students.map(s => <div className="lesson-card" key={s.id}><div className="lesson-icon">{s.avatar || '👨‍🎓'}</div><div style={{ flex: 1 }}><b>{s.name}</b><div className="muted">{s.studentCode} • Grade {s.gradeLevel} • {s.section}</div></div>
 <button
  className="btn btn-outline btn-sm"
  onClick={() => resetStudentPassword(s.id, s.name)}
>
  Reset Password
</button>

<button
  className="btn btn-outline btn-sm"
  onClick={() => resetStudent(s.id)}
>
  Reset Progress
</button>

<button
  className="btn btn-danger btn-sm"
  onClick={() => archiveStudent(s.id)}
>
  Archive
</button>
  </div>)}</div></div>
  <div className="card">
  <div className="section-title">🗃️ Archived Students</div>

  <div className="muted">
    Archived students cannot log in, but their records are still saved.
    Use Reactivate if an account was archived by mistake.
  </div>

  <div className="divider" />

  <div id="admin-archived-students-wrap">
    {(data.archivedStudents || []).map(s => (
      <div className="lesson-card" key={s.id}>
        <div className="lesson-icon">{s.avatar || '👨‍🎓'}</div>

        <div style={{ flex: 1 }}>
          <b>{s.name}</b>
          <div className="muted">
            {s.studentCode} • Grade {s.gradeLevel} • {s.section} • Archived
          </div>
        </div>

        <button
          className="btn btn-green btn-sm"
          onClick={() => reactivateStudent(s.id)}
        >
          Reactivate
        </button>
      </div>
    ))}

    {!(data.archivedStudents || []).length && (
      <div className="muted">
        No archived students.
      </div>
    )}
  </div>
</div>
  <div className="card"><div className="section-title">📋 Teachers</div><div className="divider" /><div id="admin-teachers-wrap">{data.teachers.map(t => <div className="lesson-card" key={t.id}><div className="lesson-icon">👩‍🏫</div><div style={{ flex: 1 }}><b>{t.name}</b><div className="muted">{t.employeeCode} • {t.status}</div></div>
  <button
  className="btn btn-outline btn-sm"
  onClick={() => resetTeacherPassword(t.id, t.name)}
>
  Reset Password
</button>

<button
  className="btn btn-danger btn-sm"
  onClick={() => archiveTeacher(t.id)}
>
  Archive
</button>

  </div>)}</div></div>

  <div className="card">
  <div className="section-title">🗃️ Archived Teachers</div>

  <div className="muted">
    Archived teachers cannot log in, but their records are still saved.
    Use Reactivate if an account was archived by mistake.
  </div>

  <div className="divider" />

  <div id="admin-archived-teachers-wrap">
    {(data.archivedTeachers || []).map(t => (
      <div className="lesson-card" key={t.id}>
        <div className="lesson-icon">👩‍🏫</div>

        <div style={{ flex: 1 }}>
          <b>{t.name}</b>
          <div className="muted">
            {t.employeeCode} • Archived
          </div>
        </div>

        <button
          className="btn btn-green btn-sm"
          onClick={() => reactivateTeacher(t.id)}
        >
          Reactivate
        </button>
      </div>
    ))}

    {!(data.archivedTeachers || []).length && (
      <div className="muted">
        No archived teachers.
      </div>
    )}
  </div>
</div>
  
  <div className="card"><div className="section-title">🗂️ Account History (Audit Trail)</div><div className="muted">Read-only record of maintenance actions.</div><div className="divider" /><div id="admin-history-wrap">{data.logs.map(log => <div className="trow" key={log.id}><div>{log.action}</div><div>{log.entityType}</div><div>{log.entityId}</div><div className="hide-sm">{fmtDate(log.createdAt)}</div><div className="hide-sm">#{log.actorUserId}</div></div>)}</div></div></div></>;
}
