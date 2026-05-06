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
  }, [booting]);

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
      if (role === 'student') {
        setSelectedAvatar(logged.student?.avatar || selectedAvatar);
        await loadStudentDashboard();
        go('screen-student');
      }
      if (role === 'teacher') { await loadTeacherDashboard(); go('screen-teacher'); }
      if (role === 'admin') { await loadAdminDashboard(); go('screen-admin'); }
    }, 'Hindi makapag-login.');
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

  async function submitWriting(taskId) {
    const content = read('writing-answer');
    await safeRun(async () => {
      const data = await api(`/lessons/${selectedLesson.id}/writing`, { method: 'POST', body: { taskId, content } });
      setLessonFeedback(data.submission?.feedback || 'Naisumite na ang sagot.');
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
    setTeacherData({ stats: dash.stats, rows: monitoring.rows || [], groups: groups.groups || [], students: students.students || [], lessons: lessons.lessons || [] });
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

  async function teacherCreateLesson() {
    await safeRun(async () => {
      const activities = [];
      const question = read('t-mcq-q');
      if (question) {
        const correct = Number(read('t-mcq-correct') || 0);
        const choices = [read('t-mcq-a'), read('t-mcq-b'), read('t-mcq-c'), read('t-mcq-d')].filter(Boolean);
        activities.push({
          type: 'mcq', title: 'MCQ', questions: [{ question, options: choices.map((text, idx) => ({ text, isCorrect: idx === correct })) }]
        });
      }
      const prompt = read('t-writing-prompt');
      if (prompt) activities.push({ type: 'writing', title: 'Writing', prompt });
      const speechTarget = read('t-lesson-speechTarget');
      if (speechTarget) activities.push({ type: 'speech', title: 'Speech', targetText: speechTarget });
      await api('/lessons', {
        method: 'POST',
        body: {
          gradeLevel: Number(read('t-lesson-grade')),
          subject: read('t-lesson-subject'),
          title: read('t-lesson-title'),
          xpReward: Number(read('t-lesson-xp') || 25),
          instructions: read('t-lesson-instructions'),
          passage: read('t-lesson-passage'),
          speechTarget,
          activities
        }
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
    setAdminData({ stats: stats.stats, students: students.students || [], teachers: teachers.teachers || [], logs: logs.logs || [] });
  }

  async function adminAddStudent() {
    await safeRun(async () => {
      await api('/students', { method: 'POST', body: { studentCode: read('a-stu-id'), name: read('a-stu-name'), gradeLevel: Number(read('a-stu-grade')), section: read('a-stu-section'), avatar: '🦊', password: read('a-stu-password') || 'student123' } });
      notify('Student added.');
      await loadAdminDashboard();
    });
  }

  async function adminAddTeacher() {
    await safeRun(async () => {
      await api('/teachers', { method: 'POST', body: { username: read('a-t-username'), name: read('a-t-name'), employeeCode: read('a-t-code') || read('a-t-username'), password: read('a-t-password') || 'teach123' } });
      notify('Teacher added.');
      await loadAdminDashboard();
    });
  }

  async function archiveStudent(id) {
    await safeRun(async () => { await api(`/students/${id}/archive`, { method: 'POST' }); notify('Student archived.'); await loadAdminDashboard(); await loadTeacherDashboard().catch(() => null); });
  }

  async function resetStudent(id) {
    await safeRun(async () => { await api(`/students/${id}/reset-progress`, { method: 'POST' }); notify('Progress reset.'); await loadAdminDashboard(); await loadTeacherDashboard().catch(() => null); });
  }

  async function archiveTeacher(id) {
    await safeRun(async () => { await api(`/teachers/${id}/archive`, { method: 'POST' }); notify('Teacher archived.'); await loadAdminDashboard(); });
  }

  async function completeGroupTask(taskId) {
    await safeRun(async () => {
      const data = await api(`/groups/tasks/${taskId}/complete`, { method: 'POST' });
      notify(data.xpAwarded ? `Task completed! +${data.xpAwarded} XP` : 'Task already completed.');
      await loadStudentDashboard();
    });
  }

  function exportStudentsCSV() { window.location.href = downloadUrl('/reports/students.csv'); }
  function exportLogsCSV() { window.location.href = downloadUrl('/reports/activity-logs.csv'); }
  function downloadSummaryReport() { window.location.href = downloadUrl('/reports/summary.txt'); }

  const lessonsBySubject = useMemo(() => {
    const lessons = studentDash?.lessons || [];
    return SUBJECTS.map(s => ({ ...s, lessons: lessons.filter(l => l.subject === s.name) }));
  }, [studentDash]);

  const visibleLessons = useMemo(() => {
    const lessons = studentDash?.lessons || [];
    return subjectFilter === 'ALL' ? lessons : lessons.filter(l => l.subject === subjectFilter);
  }, [studentDash, subjectFilter]);

  if (booting) return <div className="loading-card">Starting Tuklas Talino...</div>;

  return (
    <>
      <Notification notice={notice} />
      {loading && <div className="tt-loading-overlay"><div className="card">⏳ Loading...</div></div>}

      <Screen id="screen-landing" active={screen === 'screen-landing'}>
        <LandingScreen go={go} />
      </Screen>

      <Screen id="screen-home" active={screen === 'screen-home'}>
        <HomeScreen go={go} notify={notify} />
      </Screen>

      <Screen id="screen-login-student" active={screen === 'screen-login-student'}>
        <StudentLogin go={go} selectedAvatar={selectedAvatar} setSelectedAvatar={setSelectedAvatar} onLogin={() => handleLogin('student')} />
      </Screen>

      <Screen id="screen-login-teacher" active={screen === 'screen-login-teacher'}>
        <TeacherLogin go={go} onLogin={() => handleLogin('teacher')} />
      </Screen>

      <Screen id="screen-login-admin" active={screen === 'screen-login-admin'}>
        <AdminLogin go={go} onLogin={() => handleLogin('admin')} />
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
        <LessonScreen
          lesson={selectedLesson}
          feedback={lessonFeedback}
          go={go}
          completeLesson={completeLesson}
          submitMcq={submitMcq}
          submitWriting={submitWriting}
          submitSpeech={submitSpeech}
        />
      </Screen>

      <Screen id="screen-stu-groups" active={screen === 'screen-stu-groups'}>
        <StudentGroups data={studentDash} go={go} completeGroupTask={completeGroupTask} />
      </Screen>

      <Screen id="screen-stu-badges" active={screen === 'screen-stu-badges'}>
        <StudentBadges data={studentDash} go={go} />
      </Screen>

      <Screen id="screen-stu-profile" active={screen === 'screen-stu-profile'}>
        <StudentProfile data={studentDash} selectedAvatar={selectedAvatar} updateAvatar={updateAvatar} go={go} />
      </Screen>

      <Screen id="screen-teacher" active={screen === 'screen-teacher'}>
        <TeacherDashboard
          user={user}
          data={teacherData}
          go={go}
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

function ActivityCard({ activity, index = 0, total = 1, isEarlyGrade, submitMcq, submitWriting, submitSpeech }) {
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [mcqFeedback, setMcqFeedback] = useState({});
  const [writingText, setWritingText] = useState('');
  const [speechText, setSpeechText] = useState('');

  const activityBoxStyle = {
    boxShadow: 'none',
    background: '#FFFFFF',
    border: isEarlyGrade ? '2px solid #E8E8E8' : '1px solid #E8E8E8',
    marginBottom: 14,
  };

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

  if (activity.type === 'mcq') {
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

  if (activity.type === 'writing') {
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
          id="writing-answer"
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
          onClick={() => submitWriting(activity.writingTask?.id)}
          disabled={!writingText.trim()}
        >
          ✅ Submit Writing
        </button>
      </div>
    );
  }

  if (activity.type === 'speech') {
  const target = activity.speechTask?.targetText || activity.targetText || 'Basahin nang malinaw ang pangungusap.';
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [speechScore, setSpeechScore] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState('');

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

  return null;
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

function TeacherDashboard({ user, data, logout, reload, createGroup, addTask, addMember, createLesson, exportStudentsCSV, exportLogsCSV, downloadSummaryReport }) {
  return <><div className="top-nav"><div className="logo">👩‍🏫 Teacher Dashboard</div><div className="row"><div className="pill">🏫 <span id="t-name">{user?.displayName || 'Teacher'}</span></div><button className="btn btn-outline btn-sm" onClick={logout}>Logout</button></div></div><div className="scroll"><div className="card" style={{ background: 'linear-gradient(135deg,#2980B9,#3498DB)', color: 'white' }}><div className="section-title" style={{ color: 'white' }}>📌 Monitoring</div><div className="muted" style={{ color: 'white', opacity: .9 }}>Tingnan ang progreso, engagement, group participation, at reports.</div></div><div className="card"><div className="section-title">📈 Quick Stats</div><div className="grid grid-3" id="t-stats"><Stat icon="👨‍🎓" label="Students" value={data.stats?.students || 0} /><Stat icon="📚" label="Lessons" value={data.stats?.lessons || 0} /><Stat icon="👥" label="Groups" value={data.stats?.groups || 0} /></div></div><div className="card"><div className="section-title">👥 Group Manager</div><div className="muted">Gumawa ng grupo, mag-assign ng members, at maglagay ng tasks + deadline.</div><div className="divider" /><div className="grid grid-2"><div className="card" style={{ boxShadow: 'none', background: 'var(--bg)' }}><div className="section-title">➕ Create Group</div><input className="input-field" id="t-group-name" placeholder="Group name" /><div style={{ height: 10 }} /><input className="input-field" id="t-group-section" placeholder="Description / Section" /><div style={{ height: 10 }} /><button className="btn btn-green" onClick={createGroup}>Create</button></div><div className="card" style={{ boxShadow: 'none', background: 'var(--bg)' }}><div className="section-title">➕ Add Task</div><select className="input-field" id="t-task-group">{data.groups.map(g => <option value={g.id} key={g.id}>{g.name}</option>)}</select><div style={{ height: 10 }} /><input className="input-field" id="t-task-title" placeholder="Task title" /><div style={{ height: 10 }} /><input className="input-field" id="t-task-deadline" type="date" /><div style={{ height: 10 }} /><input className="input-field" id="t-task-xp" type="number" min="0" defaultValue="10" placeholder="XP" /><div style={{ height: 10 }} /><button className="btn btn-blue" onClick={addTask}>Add Task</button></div></div><div className="divider" /><div className="section-title">📋 Groups</div><div id="t-groups-wrap">{data.groups.map(g => <div className="card" key={g.id} style={{ marginBottom: 12 }}><div className="row" style={{ justifyContent: 'space-between' }}><div><b>{g.name}</b><div className="muted">{g.description}</div></div><div className="pill">{g.tasks?.length || 0} tasks</div></div><div className="divider" /><div className="row"><select className="input-field" id={`member-${g.id}`} style={{ maxWidth: 320 }}>{data.students.map(s => <option key={s.id} value={s.id}>{s.name} • Grade {s.gradeLevel}</option>)}</select><button className="btn btn-green btn-sm" onClick={() => addMember(g.id)}>Add Member</button></div></div>)}</div></div><TeacherLessonManager lessons={data.lessons} createLesson={createLesson} /><div className="card"><div className="section-title">👨‍🎓 Students (Monitoring Table)</div><div className="row"><button className="btn btn-outline btn-sm" onClick={reload}>Refresh</button><button className="btn btn-outline btn-sm" onClick={exportStudentsCSV}>⬇️ Export CSV</button><button className="btn btn-outline btn-sm" onClick={exportLogsCSV}>⬇️ Export Activity Logs</button><button className="btn btn-outline btn-sm" onClick={downloadSummaryReport}>🧾 Download Summary Report</button></div><div className="divider" /><div className="table"><div className="thead"><div>Student</div><div>XP</div><div>Lessons</div><div className="hide-sm">Progress</div><div className="hide-sm">Status</div></div><div id="t-students-table">{data.rows.map(r => <div className="trow" key={r.id}><div>{r.name}<div className="muted">{r.studentCode} • Grade {r.gradeLevel}</div></div><div>{r.xp}</div><div>{r.completed}/{r.totalLessons}</div><div className="hide-sm">{r.percent}%</div><div className="hide-sm">{r.status}</div></div>)}</div></div></div></div></>;
}

function TeacherLessonManager({ lessons, createLesson }) {
  return <div className="card"><div className="section-title">📚 Lesson Manager (Teacher-Created)</div><div className="muted">Create Filipino lessons and activities for Grade 1–6. Lessons are saved in MySQL through the backend API.</div><div className="divider" /><div className="grid grid-2"><div className="card" style={{ boxShadow: 'none', background: 'var(--bg)' }}><div className="section-title">➕ Create Lesson</div><select className="input-field" id="t-lesson-grade"><option value="1">Grade 1</option><option value="2">Grade 2</option><option value="3">Grade 3</option><option value="4">Grade 4</option><option value="5">Grade 5</option><option value="6">Grade 6</option></select><div style={{ height: 10 }} /><select className="input-field" id="t-lesson-subject">{SUBJECTS.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}</select><div style={{ height: 10 }} /><input className="input-field" id="t-lesson-title" placeholder="Lesson title" /><div style={{ height: 10 }} /><input className="input-field" id="t-lesson-xp" type="number" min="0" max="500" defaultValue="25" placeholder="XP reward" /><div style={{ height: 10 }} /><textarea className="input-field" id="t-lesson-instructions" placeholder="Instructions" /><div style={{ height: 10 }} /><textarea className="input-field" id="t-lesson-passage" placeholder="Passage / content text" /><div style={{ height: 10 }} /><input className="input-field" id="t-lesson-speechTarget" placeholder="Speech target" /></div><div className="card" style={{ boxShadow: 'none', background: 'var(--bg)' }}><div className="section-title">🧩 Optional Activities</div><input className="input-field" id="t-mcq-q" placeholder="Question" /><div style={{ height: 10 }} /><input className="input-field" id="t-mcq-a" placeholder="Choice A" /><div style={{ height: 10 }} /><input className="input-field" id="t-mcq-b" placeholder="Choice B" /><div style={{ height: 10 }} /><input className="input-field" id="t-mcq-c" placeholder="Choice C" /><div style={{ height: 10 }} /><input className="input-field" id="t-mcq-d" placeholder="Choice D" /><div style={{ height: 10 }} /><select className="input-field" id="t-mcq-correct"><option value="0">Correct: A</option><option value="1">Correct: B</option><option value="2">Correct: C</option><option value="3">Correct: D</option></select><div className="divider" /><textarea className="input-field" id="t-writing-prompt" placeholder="Writing prompt" /><div className="divider" /><button className="btn btn-green" onClick={createLesson}>Create Lesson</button></div></div><div className="divider" /><div className="section-title">📋 Recently Created Lessons</div><div id="t-lessons-wrap">{lessons.slice(0, 8).map(l => <div className="lesson-card" key={l.id}><div className="lesson-icon">📘</div><div><b>{l.title}</b><div className="muted">Grade {l.gradeLevel} • {l.subject} • {l.xpReward} XP</div></div></div>)}</div></div>;
}

function AdminDashboard({ data, logout, addStudent, addTeacher, archiveStudent, resetStudent, archiveTeacher, reload }) {
  return <><div className="top-nav"><div className="logo">🛡️ Admin Dashboard</div><div className="row"><div className="pill">⚙️ Manage Accounts</div><button className="btn btn-outline btn-sm" onClick={logout}>Logout</button></div></div><div className="scroll"><div className="card" style={{ background: 'linear-gradient(135deg,var(--purple),#8E44AD)', color: 'white' }}><div className="section-title" style={{ color: 'white' }}>👥 Account Management</div><div className="muted" style={{ color: 'white', opacity: .9 }}>Magdagdag at mag-manage ng Students at Teachers.</div></div><div className="grid grid-3"><Stat icon="👥" label="Users" value={data.stats?.users || 0} /><Stat icon="👨‍🎓" label="Students" value={data.stats?.students || 0} /><Stat icon="👩‍🏫" label="Teachers" value={data.stats?.teachers || 0} /></div><div className="grid grid-2"><div className="card"><div className="section-title">👨‍🎓 Add Student</div><input className="input-field" id="a-stu-id" placeholder="Student ID (unique)" /><div style={{ height: 10 }} /><input className="input-field" id="a-stu-name" placeholder="Name" /><div style={{ height: 10 }} /><input className="input-field" id="a-stu-grade" type="number" min="1" max="6" placeholder="Grade (1-6)" /><div style={{ height: 10 }} /><input className="input-field" id="a-stu-section" placeholder="Section" /><div style={{ height: 10 }} /><input className="input-field" id="a-stu-password" placeholder="Password (default student123)" /><div className="divider" /><button className="btn btn-green" onClick={addStudent}>Add Student</button></div><div className="card"><div className="section-title">👩‍🏫 Add Teacher</div><input className="input-field" id="a-t-username" placeholder="Username (unique)" /><div style={{ height: 10 }} /><input className="input-field" id="a-t-name" placeholder="Teacher Name" /><div style={{ height: 10 }} /><input className="input-field" id="a-t-code" placeholder="Employee Code" /><div style={{ height: 10 }} /><input className="input-field" id="a-t-password" placeholder="Password" /><div className="divider" /><button className="btn btn-blue" onClick={addTeacher}>Add Teacher</button></div></div><div className="card"><div className="section-title">📋 Students</div><div className="row"><button className="btn btn-outline btn-sm" onClick={reload}>Refresh</button></div><div className="divider" /><div id="admin-students-wrap">{data.students.map(s => <div className="lesson-card" key={s.id}><div className="lesson-icon">{s.avatar || '👨‍🎓'}</div><div style={{ flex: 1 }}><b>{s.name}</b><div className="muted">{s.studentCode} • Grade {s.gradeLevel} • {s.section}</div></div><button className="btn btn-outline btn-sm" onClick={() => resetStudent(s.id)}>Reset</button><button className="btn btn-danger btn-sm" onClick={() => archiveStudent(s.id)}>Archive</button></div>)}</div></div><div className="card"><div className="section-title">📋 Teachers</div><div className="divider" /><div id="admin-teachers-wrap">{data.teachers.map(t => <div className="lesson-card" key={t.id}><div className="lesson-icon">👩‍🏫</div><div style={{ flex: 1 }}><b>{t.name}</b><div className="muted">{t.employeeCode} • {t.status}</div></div><button className="btn btn-danger btn-sm" onClick={() => archiveTeacher(t.id)}>Archive</button></div>)}</div></div><div className="card"><div className="section-title">🗂️ Account History (Audit Trail)</div><div className="muted">Read-only record of maintenance actions.</div><div className="divider" /><div id="admin-history-wrap">{data.logs.map(log => <div className="trow" key={log.id}><div>{log.action}</div><div>{log.entityType}</div><div>{log.entityId}</div><div className="hide-sm">{fmtDate(log.createdAt)}</div><div className="hide-sm">#{log.actorUserId}</div></div>)}</div></div></div></>;
}
