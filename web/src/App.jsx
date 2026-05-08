import React, { useEffect, useMemo, useState } from 'react';
import { api, downloadUrl } from './api/client';
import { useAuth } from './contexts/AuthContext';

const AVATARS = ['🦊', '🐼', '🐯', '🐸', '🐵', '🦄', '🐰', '🧒'];
const SUBJECTS = [
  { name: 'Pagbasa', icon: '📖', tone: 'green', desc: 'Pag-unawa sa mga kuwento at teksto.' },
  { name: 'Bokabularyo', icon: '🔤', tone: 'blue', desc: 'Pagpapalawak ng talasalitaan.' },
  { name: 'Panitikan', icon: '📜', tone: 'purple', desc: 'Tula, kuwento, at aral ng akda.' },
  { name: 'Oral Comm', icon: '🎙️', tone: 'yellow', desc: 'Pakikinig at pagsasalita.' },
  { name: 'Pagsulat', icon: '✍️', tone: 'pink', desc: 'Pangungusap, talata, sanaysay.' }
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
  const [lessonFeedback, setLessonFeedback] = useState('');
  const [teacherData, setTeacherData] = useState({ stats: null, rows: [], groups: [], students: [], lessons: [] });
  const [adminData, setAdminData] = useState({ stats: null, students: [], teachers: [], logs: [] });
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
    setTeacherData({ stats: null, rows: [], groups: [], students: [], lessons: [] });
    setAdminData({ stats: null, students: [], teachers: [], logs: [] });
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
      setSelectedLesson(data.lesson);
      setLessonFeedback('');
      go('screen-lesson');
    });
  }

  async function completeLesson() {
    if (!selectedLesson) return;
    await safeRun(async () => {
      const data = await api(`/lessons/${selectedLesson.id}/complete`, { method: 'POST', body: {} });
      notify(data.xpAwarded ? `🎉 Natapos! +${data.xpAwarded} XP` : 'Nagawa mo na ang lesson na ito.');
      await loadStudentDashboard();
      go('screen-student');
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
    const [stats, students, teachers, logs] = await Promise.all([
      api('/admin/stats'),
      api('/students?status=active'),
      api('/teachers'),
      api('/admin/audit-logs?limit=50')
    ]);

    setAdminData({
      stats: stats.stats,
      students: students.students || [],
      teachers: teachers.teachers || [],
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
    await safeRun(async () => {
      await api(`/students/${id}/archive`, { method: 'POST' });
      notify('Student archived.');
      await loadAdminDashboard();
      await loadTeacherDashboard().catch(() => null);
    });
  }

  async function resetStudent(id) {
    await safeRun(async () => {
      await api(`/students/${id}/reset-progress`, { method: 'POST' });
      notify('Progress reset.');
      await loadAdminDashboard();
      await loadTeacherDashboard().catch(() => null);
    });
  }

  async function archiveTeacher(id) {
    await safeRun(async () => {
      await api(`/teachers/${id}/archive`, { method: 'POST' });
      notify('Teacher archived.');
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
        />
      </Screen>

      <Screen id="screen-lessons" active={screen === 'screen-lessons'}>
        <LessonsScreen
          lessons={visibleLessons}
          subjectFilter={subjectFilter}
          setSubjectFilter={setSubjectFilter}
          go={go}
          openLesson={openLesson}
        />
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
          />
        )}
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
          resetStudent={resetStudent}
          archiveTeacher={archiveTeacher}
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

function StarRow({ count = 0, max = 6 }) {
  return <>{Array.from({ length: max }).map((_, idx) => <span key={idx} className={`kid-star ${idx < count ? 'on' : ''}`}>⭐</span>)}</>;
}

function StudentDashboard({ data, lessonsBySubject, go, logout, refresh, openLesson }) {
  const s = data?.student;
  const level = data?.level || levelForXp(s?.xp);
  const pct = xpPercent(s?.xp);
  const early = Number(s?.gradeLevel || 4) <= 2;

  const openFirstSubjectLesson = (subject) => {
    const lesson = nextLessonForSubject(data, subject);
    if (lesson) openLesson(lesson);
    else go('screen-lessons');
  };

  const goStudentTab = (tab) => {
    if (tab === 'home') return go('screen-student');
    if (tab === 'lessons') return go('screen-lessons');
    if (tab === 'groups') return go('screen-stu-groups');
    if (tab === 'badges') return go('screen-stu-badges');
    if (tab === 'profile') return go('screen-stu-profile');
  };

  return <>
    <div className="top-nav student-topbar">
      <div className="logo">🌟 Tuklas Talino</div>
      <div className="row">
        <div className="pill">⚡ <span id="stu-xp">{s?.xp || 0}</span> XP</div>
        <div className="pill grade46-level-pill">🏅 Level <span id="stu-level-top">{level}</span></div>
        <button className="btn btn-outline btn-sm" onClick={logout}>Logout</button>
      </div>
    </div>

    <div className="scroll student-scroll">
      <div className="hero" id="student-hero">
        <div className="ava" id="stu-ava">{s?.avatar || '🦊'}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Fredoka One, cursive', fontSize: 20 }} id="stu-greet">Mabuhay, {s?.name || 'Mag-aaral'}! 👋</div>
          <div className="muted" id="stu-meta">Baitang {s?.gradeLevel || '—'} • {s?.section || '—'}</div>
          <div style={{ marginTop: 10 }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div className="muted" style={{ color: 'white', opacity: .9 }}>Level <span id="stu-level">{level}</span></div>
              <div className="muted" style={{ color: 'white', opacity: .9 }}><span id="stu-xp-pct">{pct}%</span></div>
            </div>
            <ProgressBar value={pct} />
          </div>
        </div>
      </div>

      <div id="grade12-dashboard" className="grade12-zone" hidden={!early}>
        <EarlyStudentDashboard data={data} openLesson={openLesson} openFirstSubjectLesson={openFirstSubjectLesson} goStudentTab={goStudentTab} />
      </div>
      <div id="student-standard-sections" className="grade46-dashboard" hidden={early}>
        <Grade46StudentDashboard data={data} openLesson={openLesson} openFirstSubjectLesson={openFirstSubjectLesson} goStudentTab={goStudentTab} logout={logout} />
      </div>
    </div>

    <div className="bottom-nav">
      <button id="bnav-stu-home" className="bnav-item active" onClick={() => goStudentTab('home')}><span className="ni">🏠</span>Home</button>
      <button id="bnav-stu-lessons" className="bnav-item" onClick={() => goStudentTab('lessons')}><span className="ni">📚</span>Lessons</button>
      <button id="bnav-stu-groups" className="bnav-item" onClick={() => goStudentTab('groups')}><span className="ni">👥</span>Groups</button>
      <button id="bnav-stu-badges" className="bnav-item" onClick={() => goStudentTab('badges')}><span className="ni">🏅</span>Badges</button>
      <button id="bnav-stu-profile" className="bnav-item" onClick={() => goStudentTab('profile')}><span className="ni">👤</span>Profile</button>
    </div>
  </>;
}

function EarlyStudentDashboard({ data, openLesson, openFirstSubjectLesson, goStudentTab }) {
  const s = data?.student || {};
  const stats = subjectStatsFor(data);
  const dailyLesson = pickDailyLesson(data);
  const badges = asArray(data?.badges);
  const stars = Math.min(6, Math.max(1, (data?.progress?.completedLessons || 0) + badges.length + Math.floor((s.xp || 0) / 60)));
  const groups = asArray(data?.groups);
  const upcoming = getGroupTasks(data).slice(0, 3);
  const badgeShelf = badges.length ? badges.slice(0, 5) : [
    { icon: '🏅', name: 'First Steps' }, { icon: '📚', name: 'Reader' }, { icon: '⭐', name: 'Star Learner' }, { icon: '🎙️', name: 'Speaker' }, { icon: '✍️', name: 'Writer' }
  ];

  return <>
    <section className="kid-stage">
      <div className="kid-stage-head">
        <div>
          <div className="kid-stage-title">🎉 Tara, {s.name || 'Mag-aaral'}!</div>
          <div className="kid-stage-sub">Maliliit na hakbang, maraming bituin, masayang pagkatuto.</div>
        </div>
        <div className="kid-star-meter">
          <div className="kid-star-label">Learning Stars</div>
          <div className="kid-stars-row"><StarRow count={stars} /></div>
        </div>
      </div>

      <div className="kid-hero-grid">
        <div className="kid-hero-card kid-reward-card">
          <div className="kid-card-kicker">Reward Chest</div>
          <div className="kid-card-title">🪙 {s.xp || 0} XP • Level {levelForXp(s.xp)}</div>
          <div className="kid-card-copy">Kumuha ng XP sa lessons, quiz, at group quests.</div>
          <div className="kid-mini-progress"><span style={{ width: `${xpPercent(s.xp)}%` }} /></div>
          <button className="btn btn-green kid-cta" onClick={() => openFirstSubjectLesson('Pagbasa')}>🎮 Maglaro ng Quiz</button>
        </div>

        <div className="kid-hero-card kid-mission-card-main">
          <div className="kid-card-kicker">Mission of the Day</div>
          <div className="kid-card-title">{dailyLesson ? `${subjectTheme(dailyLesson.subject).icon} ${dailyLesson.title}` : '📚 Pili ng lesson'}</div>
          <div className="kid-card-copy">{dailyLesson ? `Tapusin ang ${dailyLesson.subject} mission at kunin ang +${lessonXp(dailyLesson)} XP.` : 'Magdagdag ng lesson para sa daily mission.'}</div>
          <button className="btn btn-blue kid-cta" disabled={!dailyLesson} onClick={() => dailyLesson && openLesson(dailyLesson)}>🚀 Simulan</button>
        </div>

        <div className="kid-hero-card kid-sticker-card">
          <div className="kid-card-kicker">Sticker Board</div>
          <div className="kid-card-title">🏅 {badges.length} badge{badges.length === 1 ? '' : 's'} unlocked</div>
          <div className="kid-card-copy">Mangolekta ng rewards habang natututo.</div>
          <button className="btn btn-purple kid-cta" onClick={() => goStudentTab('badges')}>🌟 Tingnan ang Badges</button>
        </div>
      </div>
    </section>

    <section className="kid-panel">
      <div className="section-title">🧭 Learning Worlds</div>
      <div className="kid-subject-grid">
        {stats.map(item => <button key={item.subj} className="kid-subject-card" style={{ '--kid-bg': item.theme.bg, '--kid-accent': item.theme.accent }} onClick={() => openFirstSubjectLesson(item.subj)}>
          <div className="kid-subject-top"><span className="kid-subject-icon">{item.theme.icon}</span><span className="kid-subject-tag">{item.theme.tag}</span></div>
          <div className="kid-subject-name">{item.subj}</div>
          <div className="kid-subject-meta">{item.done}/{item.total} tapos</div>
          <div className="kid-mini-progress"><span style={{ width: `${item.pct}%` }} /></div>
        </button>)}
        <button className="kid-subject-card" style={{ '--kid-bg': '#EFE5FF', '--kid-accent': '#9B59B6' }} onClick={() => goStudentTab('groups')}>
          <div className="kid-subject-top"><span className="kid-subject-icon">👥</span><span className="kid-subject-tag">Quest</span></div>
          <div className="kid-subject-name">Grupo</div>
          <div className="kid-subject-meta">{groups.length} group{groups.length === 1 ? '' : 's'}</div>
          <div className="kid-mini-progress"><span style={{ width: groups.length ? '100%' : '20%' }} /></div>
        </button>
      </div>
    </section>

    <section className="kid-panel">
      <div className="section-title">🎯 Fun Missions</div>
      <div className="kid-mission-grid">
        <div className="kid-mission-box sunshine"><div className="kid-mission-emoji">🧩</div><div className="kid-mission-name">Mini Quiz</div><div className="kid-mission-copy">Mabilis na tanong para sa stars at XP.</div><button className="btn btn-yellow kid-cta" onClick={() => openFirstSubjectLesson('Bokabularyo')}>Play Quiz</button></div>
        <div className="kid-mission-box mint"><div className="kid-mission-emoji">📚</div><div className="kid-mission-name">Lesson Trail</div><div className="kid-mission-copy">{data?.progress?.completedLessons || 0} lesson completed na!</div><button className="btn btn-green kid-cta" onClick={() => goStudentTab('lessons')}>Open Lessons</button></div>
        <div className="kid-mission-box berry"><div className="kid-mission-emoji">🏆</div><div className="kid-mission-name">Star Race</div><div className="kid-mission-copy">Tingnan ang badges at rewards.</div><button className="btn btn-purple kid-cta" onClick={() => goStudentTab('badges')}>See Rewards</button></div>
      </div>
    </section>

    <section className="kid-panel kid-dual-grid">
      <div className="kid-mini-board"><div className="section-title">⭐ My Progress Path</div><div className="kid-progress-stack">
        {stats.map(item => <div className="kid-progress-row" key={item.subj} onClick={() => openFirstSubjectLesson(item.subj)}><div className="kid-progress-subject">{item.theme.icon} {item.subj}</div><div className="kid-progress-stars"><StarRow count={item.pct > 0 ? Math.max(1, Math.round(item.pct / 34)) : 0} max={3} /></div><div className="kid-chip">{item.pct}%</div></div>)}
      </div></div>
      <div className="kid-mini-board"><div className="section-title">🎁 Sticker Shelf</div><div className="kid-badge-shelf">
        {badgeShelf.map((b, idx) => <div className={`kid-badge-pill ${badges.length ? 'owned' : idx === 0 ? 'owned' : 'locked'}`} key={b.name || idx} onClick={() => goStudentTab('badges')}><span className="kid-badge-icon">{b.icon || '🏅'}</span><span>{badges.length || idx === 0 ? b.name : 'Locked Badge'}</span></div>)}
      </div><div className="kid-mini-stats"><div className="kid-chip">📝 Lessons: {data?.progress?.completedLessons || 0}</div><div className="kid-chip">🏅 Badges: {badges.length}</div><div className="kid-chip">⭐ Stars: {stars}</div></div></div>
    </section>

    <section className="kid-panel kid-dual-grid">
      <div className="kid-mini-board"><div className="section-title">🏁 Top Star Racers</div><div className="kid-rank-row"><div className="kid-rank-left"><span className="kid-rank-badge">🥇</span><span>{s.avatar || '👤'} {s.name || 'Ikaw'} • Ikaw</span></div><div className="kid-chip">{s.xp || 0} XP</div></div></div>
      <div className="kid-mini-board"><div className="section-title">⏰ Upcoming Quests</div>{upcoming.length ? upcoming.map(t => <div className="kid-task-row" key={t.id} onClick={() => goStudentTab('groups')}><div><div className="kid-task-title">{t.title}</div><div className="kid-task-copy">{t.groupName} • {displayDue(t.dueAt)}</div></div><div className="kid-chip">+{t.xpReward || 0} XP</div></div>) : <div className="kid-empty">Wala pang paparating na group quests. Nice! 🎉</div>}</div>
    </section>
  </>;
}

function Grade46StudentDashboard({ data, openLesson, openFirstSubjectLesson, goStudentTab, logout }) {
  const s = data?.student || {};
  const stats = subjectStatsFor(data);
  const nextLesson = pickDailyLesson(data);
  const currentSubject = nextLesson?.subject || 'Bokabularyo';
  const badges = asArray(data?.badges);
  const groups = asArray(data?.groups);
  const tasks = getGroupTasks(data);
  const group = groups[0];
  const groupTask = tasks[0];
  const totalPct = data?.progress?.percent || 0;
  const streak = Math.max(1, Math.min(7, Math.floor((s.xp || 0) / 40) + 1));
  const nextGoal = Math.max(0, (data?.nextLevelXp || 100) - (s.xp || 0));
  const stars = Math.min(12, (data?.progress?.completedLessons || 0) + badges.length + Math.floor((s.xp || 0) / 50));
  const locked = [{ icon: '🏅', name: 'Reader' }, { icon: '🎙️', name: 'Speaker' }];
  const rewardBadges = badges.length ? badges.slice(0, 3) : locked;

  return <div className="g46-lite-shell">
    <aside className="g46-lite-sidebar" aria-label="Grade 4 to 6 student navigation">
      <div className="g46-lite-brand"><span>☀️</span><strong>Tuklas<br />Talino</strong></div>
      <nav className="g46-lite-menu">
        <button className="active" onClick={() => goStudentTab('home')}><span>🏠</span>Dashboard</button>
        <button onClick={() => goStudentTab('lessons')}><span>📚</span>Mga Aralin</button>
        <button onClick={() => openFirstSubjectLesson('Oral Comm')}><span>🤖</span>AI Practice</button>
        <button onClick={() => goStudentTab('groups')}><span>👥</span>Pangkatang Gawain</button>
        <button onClick={() => goStudentTab('badges')}><span>🏅</span>Badges</button>
        <button onClick={() => goStudentTab('badges')}><span>🏆</span>Leaderboard</button>
        <button onClick={() => goStudentTab('profile')}><span>👤</span>Profile</button>
      </nav>
      <button className="g46-lite-logout" onClick={logout}>↩ Logout</button>
    </aside>

    <main className="g46-lite-main">
      <header className="g46-lite-topbar">
        <label className="g46-lite-search"><span>🔍</span><input placeholder="Search" aria-label="Search" /></label>
        <div className="g46-lite-student"><span>{s.avatar || '👤'}</span><div><b>{s.name || 'Mag-aaral'}</b><small>Baitang {s.gradeLevel || '—'} • {s.section || '—'}</small></div></div>
        <button className="g46-lite-pill">⚡ {s.xp || 0} XP</button>
        <button className="g46-lite-pill">📊 Level {levelForXp(s.xp)}</button>
        <button className="btn btn-outline btn-sm" onClick={logout}>Logout</button>
      </header>

      <section className="g46-lite-hero">
        <div className="g46-lite-avatar"><span>{s.avatar || '👤'}</span></div>
        <div className="g46-lite-hero-copy">
          <h1>Mabuhay, {s.name || 'Mag-aaral'}! 👋</h1>
          <div className="g46-lite-level"><b>Level {levelForXp(s.xp)}</b><i><span style={{ width: `${xpPercent(s.xp)}%` }} /></i><em>{xpPercent(s.xp)}%</em></div>
        </div>
        <div className="g46-lite-hero-stats"><span>⚡ {s.xp || 0} XP</span><span>⭐ {stars} Stars</span><span>🏅 {badges.length} Badges</span></div>
      </section>

      <section className="g46-lite-section compact">
        <div className="g46-lite-section-head"><div><h3>📚 Mga Aralin sa Filipino</h3></div><button onClick={() => goStudentTab('lessons')}>Tingnan lahat →</button></div>
        <div className="g46-lite-module-grid">
          {stats.map(item => <button className={`g46-lite-module-card ${item.subj === currentSubject ? 'current' : ''}`} key={item.subj} style={{ '--module-bg': item.theme.bg, '--module-accent': item.theme.accent }} onClick={() => openFirstSubjectLesson(item.subj)}>
            <div className="g46-lite-module-top"><span className="g46-lite-module-icon">{item.theme.icon}</span><small>{item.theme.tag}</small></div>
            <h4>{item.subj}</h4>
            <p>{item.done >= item.total && item.total > 0 ? 'Tapos na ang module' : `Susunod: ${item.theme.tag}`}</p>
            <div className="g46-lite-module-footer"><span>{item.done}/{item.total || 0} lessons</span><i><b style={{ width: `${item.pct}%` }} /></i><strong>{item.pct}%</strong></div>
          </button>)}
        </div>
      </section>

      <section className="g46-lite-section">
        <div className="g46-lite-section-head"><div><h3>👥 Pangkatang Gawain</h3></div><button onClick={() => goStudentTab('groups')}>Buksan sa Groups →</button></div>
        <div className="g46-lite-group-preview">
          <div className="g46-lite-team">👧🏻👦🏽👧🏽</div>
          <div><b>{group?.name || 'Grupo Sampaguita'} ⭐</b><span>{groupTask?.title || 'Pangkatang Gawain'}</span><small>👧🏻 👦🏽 👧🏽 +2 • {group ? 'kasamahan' : 'demo preview'}</small></div>
          <div className="g46-lite-group-side"><small>Due {displayDue(groupTask?.dueAt)}</small><i><b style={{ width: groupTask ? '45%' : '20%' }} /></i><em>{groupTask ? '45%' : '20%'}</em></div>
          <button className="btn btn-green btn-sm" onClick={() => goStudentTab('groups')}>Buksan</button>
        </div>
      </section>

      <section className="g46-lite-section">
        <div className="g46-lite-section-head"><div><h3>📅 Mga Paparating na Gawain</h3></div><button onClick={() => goStudentTab('groups')}>Tingnan sa Groups →</button></div>
        <div className="g46-lite-table">
          {tasks.slice(0, 2).length ? tasks.slice(0, 2).map(t => <button className="g46-lite-table-row" key={t.id} onClick={() => goStudentTab('groups')}><span>📝 {t.title}</span><small>{t.groupName}</small><b>{displayDue(t.dueAt)}</b><em>Hindi pa tapos</em></button>) : <div className="g46-lite-empty">Wala pang paparating na gawain. Nice! 🎉</div>}
        </div>
      </section>
    </main>

    <aside className="g46-lite-right">
      <section className="g46-lite-side-block snapshot">
        <h3>Aking Snapshot</h3>
        <div><span>⚡ Kabuoang XP</span><b>{s.xp || 0} XP</b></div>
        <div><span>🔥 Streak</span><b>{streak} araw</b></div>
        <div><span>🎯 Next Goal</span><b>{nextGoal} XP</b></div>
        <div><span>📚 Progreso</span><b>{totalPct}%</b></div>
      </section>

      <section className="g46-lite-side-block">
        <h3>Progress Preview <button onClick={() => goStudentTab('lessons')}>Full view →</button></h3>
        {stats.map(item => <div className="g46-lite-progress-item" key={item.subj} onClick={() => openFirstSubjectLesson(item.subj)}><span>{item.theme.icon} {item.subj}</span><i><b style={{ width: `${item.pct}%`, '--bar': item.theme.accent }} /></i><strong>{item.pct}%</strong></div>)}
      </section>

      <section className="g46-lite-side-block rewards">
        <h3>Rewards & Standing <button onClick={() => goStudentTab('badges')}>Tingnan lahat →</button></h3>
        <div className="g46-lite-badges">{rewardBadges.map((b, idx) => <button className={`g46-lite-badge ${badges.length ? 'owned' : idx === 0 ? 'owned' : 'locked'}`} key={b.name || idx} onClick={() => goStudentTab('badges')}><span>{b.icon || '🏅'}</span><small>{b.name || 'Badge'}</small></button>)}</div>
        <div className="g46-lite-leaderboard"><button className="g46-lite-rank me" onClick={() => goStudentTab('badges')}><span>🥇</span><b>{s.avatar || '👤'} {s.name || 'Ikaw'} • Ikaw</b><strong>{s.xp || 0} XP</strong></button></div>
      </section>

      <section className="g46-lite-side-block challenges">
        <h3>Quick Challenge</h3>
        <button onClick={() => nextLesson ? openLesson(nextLesson) : goStudentTab('lessons')}><span>🧩</span><div><b>Mini Quiz</b><small>Tanong para sa stars at XP.</small></div><i>›</i></button>
      </section>
    </aside>
  </div>;
}

function SubjectCards({ lessonsBySubject, openLesson }) {
  return <div className="grid grid-3">{lessonsBySubject.map(item => <button className="module-card" key={item.name} onClick={() => item.lessons[0] && openLesson(item.lessons[0])}><div style={{ fontSize: 36 }}>{item.icon}</div><h3>{item.name}</h3><p>{item.lessons.length} lessons</p><ProgressBar value={item.lessons.length ? Math.round((item.lessons.filter(l => l.completed).length / item.lessons.length) * 100) : 0} /></button>)}</div>;
}

function LessonsScreen({ lessons, subjectFilter, setSubjectFilter, go, openLesson }) {
  return <><div className="top-nav"><button className="btn btn-outline btn-sm" onClick={() => go('screen-student')}>← Dashboard</button><div className="logo" id="lessons-title">📚 Lessons</div><div className="pill">📌 <span id="lessons-count">{lessons.length}</span></div></div><div className="scroll"><div className="card"><div className="muted" id="lessons-sub">Mga aralin para sa iyong baitang.</div><div className="divider" /><div className="row"><button className={`btn btn-sm ${subjectFilter === 'ALL' ? 'btn-green' : 'btn-outline'}`} onClick={() => setSubjectFilter('ALL')}>All</button>{SUBJECTS.map(s => <button key={s.name} className={`btn btn-sm ${subjectFilter === s.name ? 'btn-green' : 'btn-outline'}`} onClick={() => setSubjectFilter(s.name)}>{s.icon} {s.name}</button>)}</div></div><div id="lessons-wrap">{lessons.map(l => <div className="lesson-card" key={l.id} onClick={() => openLesson(l)}><div className="lesson-icon">{SUBJECTS.find(s => s.name === l.subject)?.icon || '📘'}</div><div style={{ flex: 1 }}><b>{l.title}</b><div className="muted">{l.subject} • Grade {l.gradeLevel} • {l.xpReward} XP</div></div><div className="pill">{l.completed ? '✅ Done' : '▶ Start'}</div></div>)}{!lessons.length && <div className="card"><div className="muted">No lessons found.</div></div>}</div></div></>;
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

function LessonScreen({ lesson, feedback, go, completeLesson, submitMcq, submitWriting, submitSpeech }) {
  const activities = lesson?.activities || [];
  const theme = subjectTheme(lesson?.subject);
  const isEarlyGrade = Number(lesson?.gradeLevel || 4) <= 2;

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

  async function handleMcq(question, option) {
    setSelectedAnswers(prev => ({
      ...prev,
      [question.id]: option.id,
    }));

    const result = await submitMcq(question, option);

    if (result) {
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
          ? 'Piliin ang tamang sagot.'
          : 'Choose the best answer for each question.'}
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

function StudentGroups({ data, go, completeGroupTask }) {
  const groups = data?.groups || [];
  return <><div className="top-nav"><button className="btn btn-outline btn-sm" onClick={() => go('screen-student')}>← Dashboard</button><div className="logo">👥 Mga Grupo</div><div /></div><div className="scroll"><div className="card" style={{ background: 'linear-gradient(135deg,var(--orange),#E67E22)', color: 'white' }}><div className="section-title" style={{ color: 'white' }}>👥 Group Tasks</div><div className="muted" style={{ color: 'white', opacity: .9 }}>Gawin ang tasks bago ang deadline.</div></div><div id="stu-groups-wrap">{groups.map(g => <div className="card" key={g.id}><div className="section-title">👥 {g.name}</div><div className="muted">{g.description}</div><div className="divider" />{(g.tasks || []).map(t => <div className="lesson-card" key={t.id}><div className="lesson-icon">✅</div><div style={{ flex: 1 }}><b>{t.title}</b><div className="muted">Due: {fmtDate(t.dueAt)} • {t.xpReward} XP</div></div><button className="btn btn-green btn-sm" onClick={() => completeGroupTask(t.id)}>Complete</button></div>)}</div>)}{!groups.length && <div className="card"><div className="muted">No group tasks yet.</div></div>}</div></div></>;
}

function StudentBadges({ data, go }) {
  return <><div className="top-nav"><button className="btn btn-outline btn-sm" onClick={() => go('screen-student')}>← Dashboard</button><div className="logo">🏅 Badges</div><div className="pill">⚡ <span id="badge-xp">{data?.student?.xp || 0}</span></div></div><div className="scroll"><div className="card"><div className="section-title">🌟 Achievements</div><div id="badges-wrap" className="kid-badge-shelf">{(data?.badges || []).map(b => <div className="kid-badge-pill owned" key={b.id}><span className="kid-badge-icon">{b.icon || '🏅'}</span>{b.name}</div>)}{!(data?.badges || []).length && <div className="muted">Wala pang badge. Tapusin ang lessons para makakuha!</div>}</div></div></div></>;
}

function StudentProfile({ data, selectedAvatar, updateAvatar, go }) {
  const s = data?.student;
  return <><div className="top-nav"><button className="btn btn-outline btn-sm" onClick={() => go('screen-student')}>← Dashboard</button><div className="logo">👤 Profile</div><div /></div><div className="scroll"><div className="card"><div className="section-title">Avatar</div><div className="muted">Palitan ang avatar mo (saved sa account).</div><div className="divider" /><div className="avatar-grid" id="profile-avatar-grid">{AVATARS.map(a => <button key={a} className={`avatar-circle ${selectedAvatar === a ? 'selected' : ''}`} onClick={() => updateAvatar(a)}>{a}</button>)}</div></div><div className="card"><div className="section-title">📊 Summary</div><div id="profile-summary"><div className="grid grid-3"><Stat icon="👤" label="Name" value={s?.name || '—'} /><Stat icon="🎒" label="Grade" value={s?.gradeLevel || '—'} /><Stat icon="⚡" label="XP" value={s?.xp || 0} /></div></div></div></div></>;
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

          <section className="teacher-design-card soft" id="teacher-recent-lessons">
            <div className="teacher-design-heading">
              <div className="teacher-design-step">4</div>
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


function AdminDashboard({ data, logout, addStudent, addTeacher, archiveStudent, resetStudent, archiveTeacher, reload }) {
  return <><div className="top-nav"><div className="logo">🛡️ Admin Dashboard</div><div className="row"><div className="pill">⚙️ Manage Accounts</div><button className="btn btn-outline btn-sm" onClick={logout}>Logout</button></div></div><div className="scroll"><div className="card" style={{ background: 'linear-gradient(135deg,var(--purple),#8E44AD)', color: 'white' }}><div className="section-title" style={{ color: 'white' }}>👥 Account Management</div><div className="muted" style={{ color: 'white', opacity: .9 }}>Magdagdag at mag-manage ng Students at Teachers.</div></div><div className="grid grid-3"><Stat icon="👥" label="Users" value={data.stats?.users || 0} /><Stat icon="👨‍🎓" label="Students" value={data.stats?.students || 0} /><Stat icon="👩‍🏫" label="Teachers" value={data.stats?.teachers || 0} /></div><div className="grid grid-2"><div className="card"><div className="section-title">👨‍🎓 Add Student</div><input className="input-field" id="a-stu-id" placeholder="Student ID (unique)" /><div style={{ height: 10 }} /><input className="input-field" id="a-stu-name" placeholder="Name" /><div style={{ height: 10 }} /><input className="input-field" id="a-stu-grade" type="number" min="1" max="6" placeholder="Grade (1-6)" /><div style={{ height: 10 }} /><input className="input-field" id="a-stu-section" placeholder="Section" /><div style={{ height: 10 }} /><input className="input-field" id="a-stu-password" placeholder="Password (default student123)" /><div className="divider" /><button className="btn btn-green" onClick={addStudent}>Add Student</button></div><div className="card"><div className="section-title">👩‍🏫 Add Teacher</div><input className="input-field" id="a-t-username" placeholder="Username (unique)" /><div style={{ height: 10 }} /><input className="input-field" id="a-t-name" placeholder="Teacher Name" /><div style={{ height: 10 }} /><input className="input-field" id="a-t-code" placeholder="Employee Code" /><div style={{ height: 10 }} /><input className="input-field" id="a-t-password" placeholder="Password" /><div className="divider" /><button className="btn btn-blue" onClick={addTeacher}>Add Teacher</button></div></div><div className="card"><div className="section-title">📋 Students</div><div className="row"><button className="btn btn-outline btn-sm" onClick={reload}>Refresh</button></div><div className="divider" /><div id="admin-students-wrap">{data.students.map(s => <div className="lesson-card" key={s.id}><div className="lesson-icon">{s.avatar || '👨‍🎓'}</div><div style={{ flex: 1 }}><b>{s.name}</b><div className="muted">{s.studentCode} • Grade {s.gradeLevel} • {s.section}</div></div><button className="btn btn-outline btn-sm" onClick={() => resetStudent(s.id)}>Reset</button><button className="btn btn-danger btn-sm" onClick={() => archiveStudent(s.id)}>Archive</button></div>)}</div></div><div className="card"><div className="section-title">📋 Teachers</div><div className="divider" /><div id="admin-teachers-wrap">{data.teachers.map(t => <div className="lesson-card" key={t.id}><div className="lesson-icon">👩‍🏫</div><div style={{ flex: 1 }}><b>{t.name}</b><div className="muted">{t.employeeCode} • {t.status}</div></div><button className="btn btn-danger btn-sm" onClick={() => archiveTeacher(t.id)}>Archive</button></div>)}</div></div><div className="card"><div className="section-title">🗂️ Account History (Audit Trail)</div><div className="muted">Read-only record of maintenance actions.</div><div className="divider" /><div id="admin-history-wrap">{data.logs.map(log => <div className="trow" key={log.id}><div>{log.action}</div><div>{log.entityType}</div><div>{log.entityId}</div><div className="hide-sm">{fmtDate(log.createdAt)}</div><div className="hide-sm">#{log.actorUserId}</div></div>)}</div></div></div></>;
}
