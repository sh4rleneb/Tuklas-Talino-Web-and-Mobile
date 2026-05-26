import React, { useEffect, useMemo, useState } from 'react';
import { api, downloadFile, uploadForm } from './api/client';
import { useAuth } from './contexts/AuthContext';
import QuizzesPage from './pages/Student/QuizzesPage';
import QuizPlayer from './components/student/quizzes/QuizPlayer';
import QuizResults from './components/student/quizzes/QuizResults';
import { AVATARS, SUBJECTS, MISSION_GAMES } from './constants/studentConstants';
import { asArray, displayDue, effectivenessBand, fmtDate, getBestQuizAttempt, lessonAssessmentProfile, lessonXp, levelForXp, levelTitleForXp, shortLevelTitleForXp, masteryFromPercent, rolesForGradeLevel, subjectTheme, taskCompletionPercent, xpPercent } from './utils/studentHelpers';
import { EarlyStudentSubpageStyles, Grade46ReferenceStyles, MissionStyles, TeacherRedesignStyles } from './components/styles/StyleBlocks';
import { ProgressBar, Screen, Stat } from './components/common/CommonUI';
import { AdminLogin, StudentLogin, TeacherLogin } from './pages/Login/LoginScreens';
import { ChangePasswordScreen, HomeScreen, LandingScreen } from './pages/Home/HomeScreens';

function read(id) {
  return document.getElementById(id)?.value?.trim() || '';
}





function StartupLoader() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        background: 'radial-gradient(circle at top left, rgba(220, 252, 231, 0.92), #fffdf3 48%, #eefdf4)'
      }}
    >
      <div
        style={{
          width: 'min(560px, calc(100vw - 40px))',
          minHeight: 320,
          display: 'grid',
          placeItems: 'center',
          textAlign: 'center',
          padding: '42px 34px',
          borderRadius: 34,
          background: 'rgba(255, 255, 255, 0.94)',
          border: '2px solid rgba(21, 150, 90, 0.16)',
          boxShadow: '0 28px 80px rgba(15, 23, 42, 0.10)'
        }}
      >
        <div>
          <div
            style={{
              width: 132,
              height: 132,
              margin: '0 auto 24px',
              borderRadius: 38,
              display: 'grid',
              placeItems: 'center',
              background: 'linear-gradient(135deg, #f7ffe7, #ffffff)',
              boxShadow: '0 18px 42px rgba(21, 150, 90, 0.16), inset 0 0 0 2px rgba(255, 255, 255, 0.9)'
            }}
          >
            <img
              src="/tuklas-talino-icon.png"
              alt="Tuklas Talino"
              style={{
                width: 116,
                height: 116,
                objectFit: 'contain',
                transform: 'scale(1.14)',
                filter: 'drop-shadow(0 10px 18px rgba(7, 146, 74, 0.18))'
              }}
            />
          </div>

          <h1
            style={{
              margin: 0,
              color: '#07924A',
              fontSize: 'clamp(34px, 5vw, 46px)',
              lineHeight: 1.05,
              letterSpacing: '-0.045em',
              fontWeight: 1000
            }}
          >
            Loading Tuklas Talino
          </h1>

          <p
            style={{
              margin: '14px 0 0',
              color: '#31486b',
              fontSize: 17,
              fontWeight: 900
            }}
          >
            Please wait<span style={{ letterSpacing: 3 }}>...</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function Notification({ notice }) {
  if (!notice) return <div className="notif-wrap" id="notif-wrap" />;
  return <div className="notif-wrap" id="notif-wrap"><div className={`notif ${notice.type || ''}`}>{notice.text}</div></div>;
}


function escapeBadgeText(value = '') {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function ensureBadgeUnlockPopupStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('badge-unlock-popup-styles')) return;

  const style = document.createElement('style');
  style.id = 'badge-unlock-popup-styles';
  style.textContent = `
    .badge-unlock-stack {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 99999;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 28px;
    }

    .badge-unlock-card {
      pointer-events: auto;
      width: min(420px, calc(100vw - 32px));
      border-radius: 28px;
      padding: 20px;
      background: linear-gradient(135deg, #fffdf2, #ffffff 48%, #effdf4);
      border: 2px solid rgba(250, 204, 21, 0.55);
      box-shadow: 0 24px 70px rgba(15, 23, 42, 0.24);
      display: grid;
      grid-template-columns: 76px 1fr auto;
      gap: 14px;
      align-items: center;
      animation: badgePopIn 0.55s cubic-bezier(.2, 1.2, .2, 1), badgeFloat 2.8s ease-in-out infinite;
      position: relative;
      overflow: hidden;
    }

    .badge-unlock-card::before {
      content: "✨";
      position: absolute;
      top: 10px;
      left: 14px;
      font-size: 1.1rem;
      animation: badgeSparkle 1.4s ease-in-out infinite;
    }

    .badge-unlock-card::after {
      content: "🌟";
      position: absolute;
      right: 54px;
      bottom: 12px;
      font-size: 1.2rem;
      animation: badgeSparkle 1.6s ease-in-out infinite reverse;
    }

    .badge-unlock-icon {
      width: 72px;
      height: 72px;
      border-radius: 24px;
      display: grid;
      place-items: center;
      font-size: 2.4rem;
      background: linear-gradient(135deg, #fef3c7, #dcfce7);
      box-shadow: inset 0 0 0 2px rgba(255,255,255,.8), 0 10px 22px rgba(34, 197, 94, .18);
      animation: badgeBounce 1s ease-in-out infinite;
    }

    .badge-unlock-eyebrow {
      margin: 0 0 4px;
      color: #ca8a04;
      font-size: .78rem;
      font-weight: 950;
      letter-spacing: .08em;
      text-transform: uppercase;
    }

    .badge-unlock-title {
      margin: 0;
      color: #123524;
      font-size: 1.25rem;
      font-weight: 950;
      line-height: 1.1;
    }

    .badge-unlock-desc {
      margin: 6px 0 0;
      color: #3f5f4b;
      font-size: .94rem;
      font-weight: 750;
      line-height: 1.35;
    }

    .badge-unlock-close {
      border: 0;
      background: rgba(22, 101, 52, 0.08);
      color: #166534;
      width: 34px;
      height: 34px;
      border-radius: 999px;
      font-weight: 950;
      cursor: pointer;
      align-self: start;
    }

    @keyframes badgePopIn {
      from {
        opacity: 0;
        transform: translateY(-28px) scale(.82) rotate(-2deg);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1) rotate(0);
      }
    }

    @keyframes badgeFloat {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(4px); }
    }

    @keyframes badgeBounce {
      0%, 100% { transform: translateY(0) scale(1); }
      45% { transform: translateY(-5px) scale(1.06); }
    }

    @keyframes badgeSparkle {
      0%, 100% { opacity: .45; transform: scale(.9) rotate(0); }
      50% { opacity: 1; transform: scale(1.2) rotate(10deg); }
    }

    @media (max-width: 520px) {
      .badge-unlock-stack {
        padding-top: 18px;
      }

      .badge-unlock-card {
        grid-template-columns: 58px 1fr auto;
        padding: 16px;
        border-radius: 22px;
      }

      .badge-unlock-icon {
        width: 56px;
        height: 56px;
        border-radius: 18px;
        font-size: 2rem;
      }

      .badge-unlock-title {
        font-size: 1.08rem;
      }

      .badge-unlock-desc {
        font-size: .86rem;
      }
    }
  `;
  document.head.appendChild(style);
}

function showBadgeUnlockPopup(badges = []) {
  if (typeof document === 'undefined') return;

  const earnedBadges = Array.isArray(badges)
    ? badges.filter(Boolean)
    : badges
      ? [badges]
      : [];

  if (!earnedBadges.length) return;

  ensureBadgeUnlockPopupStyles();

  let stack = document.getElementById('badge-unlock-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.id = 'badge-unlock-stack';
    stack.className = 'badge-unlock-stack';
    document.body.appendChild(stack);
  }

  earnedBadges.slice(0, 3).forEach((badge, index) => {
    window.setTimeout(() => {
      const card = document.createElement('div');
      card.className = 'badge-unlock-card';

      const icon = escapeBadgeText(badge.icon || '🏅');
      const name = escapeBadgeText(badge.name || 'Bagong Badge');
      const description = escapeBadgeText(badge.description || 'May bago kang achievement!');

      card.innerHTML = `
        <div class="badge-unlock-icon">${icon}</div>
        <div>
          <p class="badge-unlock-eyebrow">Badge Unlocked!</p>
          <h3 class="badge-unlock-title">${name}</h3>
          <p class="badge-unlock-desc">${description}</p>
        </div>
        <button class="badge-unlock-close" type="button" aria-label="Close badge popup">×</button>
      `;

      const closeButton = card.querySelector('.badge-unlock-close');
      const removeCard = () => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(-18px) scale(.96)';
        card.style.transition = 'opacity .2s ease, transform .2s ease';

        window.setTimeout(() => {
          card.remove();

          if (stack && !stack.children.length) {
            stack.remove();
          }
        }, 220);
      };

      closeButton?.addEventListener('click', removeCard);
      stack.appendChild(card);

      window.setTimeout(removeCard, 5600);
    }, index * 650);
  });
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
  const [teacherData, setTeacherData] = useState({ stats: null, rows: [], groups: [], students: [], lessons: [], assignedClasses: [] });
const [adminData, setAdminData] = useState({
  stats: null,
  students: [],
  archivedStudents: [],
  teachers: [],
  archivedTeachers: [],
  teacherAssignments: [],
  classOptions: [],
  logs: []
});
  const [loading, setLoading] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [hadSavedSessionOnBoot] = useState(() =>
    typeof window !== 'undefined' && Boolean(window.localStorage.getItem('tuklas_token'))
  );
  const [startupDelayDone, setStartupDelayDone] = useState(() =>
    !(typeof window !== 'undefined' && Boolean(window.localStorage.getItem('tuklas_token')))
  );

  const activeRole = screen.includes('teacher') ? 'teacher' : screen.includes('admin') ? 'admin' : screen.includes('student') || screen.includes('stu') || screen.includes('lesson') ? 'student' : '';
  const gradeLevel = studentDash?.student?.gradeLevel ?? user?.student?.gradeLevel ?? null;
  const gradeBand = gradeLevel == null ? '' : Number(gradeLevel) <= 2 ? 'early' : 'grade46';

  useEffect(() => {
    if (activeRole) document.body.dataset.role = activeRole;
    else delete document.body.dataset.role;
    if (activeRole === 'student' && gradeBand) document.body.dataset.gradeBand = gradeBand;
    else delete document.body.dataset.gradeBand;
  }, [activeRole, gradeBand]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 3600);
    return () => clearTimeout(t);
  }, [notice]);

  useEffect(() => {
    if (!hadSavedSessionOnBoot) {
      setStartupDelayDone(true);
      return undefined;
    }

    const timer = setTimeout(() => {
      setStartupDelayDone(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [hadSavedSessionOnBoot]);

useEffect(() => {
  if (!booting && user) {
    if (user.mustChangePassword) {
      setScreen('screen-change-password');
      return;
    }

    if (user.role === 'student') {
      setStudentDash(null);

      loadStudentDashboard()
        .then(() => {
          setScreen('screen-student');
        })
        .catch((err) => {
          notify(err.message || 'Hindi ma-load ang student dashboard.', 'bad');
          setScreen('screen-login-student');
        });

      return;
    }

    if (user.role === 'teacher') {
      loadTeacherDashboard()
        .then(() => {
          setScreen('screen-teacher');
        })
        .catch((err) => {
          notify(err.message || 'Hindi ma-load ang teacher dashboard.', 'bad');
          setScreen('screen-login-teacher');
        });

      return;
    }

    if (user.role === 'admin') {
      loadAdminDashboard()
        .then(() => {
          setScreen('screen-admin');
        })
        .catch((err) => {
          notify(err.message || 'Hindi ma-load ang admin dashboard.', 'bad');
          setScreen('screen-login-admin');
        });
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
    setTeacherData({ stats: null, rows: [], groups: [], students: [], lessons: [], assignedClasses: [] });
setAdminData({
  stats: null,
  students: [],
  archivedStudents: [],
  teachers: [],
  archivedTeachers: [],
  teacherAssignments: [],
  classOptions: [],
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
  setStudentDash(null);
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

  async function showUnreadStudentNotifications() {
    try {
      const data = await api('/students/notifications');
      const notifications = asArray(data?.notifications);

      if (!notifications.length) return;

      const first = notifications[0];
      const extraCount = Math.max(0, notifications.length - 1);

      notify(extraCount
        ? `${first.message} +${extraCount} more update${extraCount === 1 ? '' : 's'}`
        : first.message
      );

      await Promise.all(
        notifications.map(item =>
          api(`/students/notifications/${item.id}/read`, { method: 'POST' })
        )
      );
    } catch (err) {
      console.warn('Could not load student notifications:', err);
    }
  }

  async function loadStudentDashboard() {
    const data = await api('/students/dashboard');
    setStudentDash(data);
    await showUnreadStudentNotifications();
    setQuizAttempts(data.quizAttempts || {});
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

  function openQuizResult(quiz) {
    if (!quiz) return;

    const attempts = quizAttempts?.[quiz.id] || [];
    const latestAttempt = attempts[attempts.length - 1];

    if (!latestAttempt) {
      openQuiz(quiz);
      return;
    }

    setSelectedQuiz(quiz);
    setQuizResult({
      ...latestAttempt,
      attemptHistory: attempts,
      maxAttempts: 2,
      maxAttemptsReached: attempts.length >= 2,
    });
    go('screen-stu-quiz-result');
  }

  async function submitQuiz(quiz, answers) {
    if (!quiz) return null;

    const maxQuizAttempts = 2;
    const studentId = studentDash?.student?.id || user?.student?.id || 'demo-student';
    const existingAttempts = quizAttempts?.[quiz.id] || [];

    if (existingAttempts.length >= maxQuizAttempts) {
      const latestAttempt = existingAttempts[existingAttempts.length - 1] || getBestQuizAttempt(quizAttempts, quiz.id);

      if (latestAttempt) {
        setQuizResult({
          ...latestAttempt,
          maxAttempts: maxQuizAttempts,
          maxAttemptsReached: true,
        });
      }

      notify('You already used your 2 quiz attempts. Review your answers instead.');
      go('screen-stu-quiz-result');
      return latestAttempt || null;
    }

    const result = gradeQuizAttempt(quiz, answers, existingAttempts.length + 1);

    let finalResult = {
      ...result,
      maxAttempts: maxQuizAttempts,
      maxAttemptsReached: result.attemptNo >= maxQuizAttempts,
    };

    let backendAttemptsForQuiz = null;
    let backendWarning = '';

    const lessonId = quiz.lessonId || selectedLesson?.id;

    if (lessonId) {
      try {
        const data = await api(`/lessons/${lessonId}/quiz-result`, {
          method: 'POST',
          body: {
            quizId: quiz.id,
            quizTitle: quiz.title,
            score: result.score,
            total: result.total,
            percent: result.percent,
            attemptNo: result.attemptNo,
            review: result.review,
          },
        });

        const saved = data?.quizResult || {};
        backendAttemptsForQuiz = Array.isArray(data?.quizAttempts) ? data.quizAttempts : null;

        finalResult = {
          ...finalResult,
          attemptNo: Number(saved.attemptNo || finalResult.attemptNo),
          xpAwarded: Number(saved.xpAwarded || 0),
          xpPossible: Number(saved.xpPossible || 0),
          xpAlreadyAwarded: Boolean(saved.xpAlreadyAwarded),
          backendSaved: true,
        };

        await loadStudentDashboard();
      } catch (err) {
        backendWarning = err.message || 'Quiz saved locally, but backend saving failed.';
        finalResult = {
          ...finalResult,
          xpAwarded: 0,
          backendSaved: false,
        };
      }
    }

    const updatedAttempts = backendAttemptsForQuiz
      ? { ...quizAttempts, [quiz.id]: backendAttemptsForQuiz }
      : appendQuizAttempt(studentId, quizAttempts, quiz.id, finalResult);
    const attemptHistory = updatedAttempts?.[quiz.id] || [];

    finalResult = {
      ...finalResult,
      attemptHistory,
      maxAttemptsReached: attemptHistory.length >= maxQuizAttempts,
    };

    setQuizAttempts(updatedAttempts);
    setQuizResult(finalResult);

    if (backendWarning) {
      notify(`${backendWarning} Local score: ${finalResult.score}/${finalResult.total} (${finalResult.percent}%)`, 'bad');
    } else if (finalResult.xpAwarded) {
      notify(`Quiz submitted: ${finalResult.score}/${finalResult.total} (${finalResult.percent}%). +${finalResult.xpAwarded} XP`);
    } else if (finalResult.xpAlreadyAwarded) {
      notify(`Quiz submitted: ${finalResult.score}/${finalResult.total} (${finalResult.percent}%). Retake saved, no extra XP.`);
    } else {
      notify(`Quiz submitted: ${finalResult.score}/${finalResult.total} (${finalResult.percent}%).`);
    }

    go('screen-stu-quiz-result');
    return finalResult;
  }

  async function completeLesson(options = {}) {
    if (!selectedLesson) return null;

    const { stay = false, silent = false } = options || {};

    return await safeRun(async () => {
      const data = await api(`/lessons/${selectedLesson.id}/complete`, { method: 'POST', body: {} });

      setSelectedLesson(prev => prev ? { ...prev, completed: true } : prev);

      if (!silent) {
        notify(data.xpAwarded ? `🎉 Natapos! +${data.xpAwarded} XP` : 'Nagawa mo na ang lesson na ito.');
      showBadgeUnlockPopup(data?.newBadges);
      }

      if (data?.xpAwarded) {
        playMissionSuccessSound();
      }

      await loadStudentDashboard();

      if (!stay) {
        go('screen-student');
      }

      return data;
    });
  }

  async function submitMcq(question, option, options = {}) {
    if (!selectedLesson) return null;

    const { silent = false } = options || {};

    return await safeRun(async () => {
      const data = await api(`/lessons/${selectedLesson.id}/mcq`, {
        method: 'POST',
        body: { questionId: question.id, selectedOptionId: option.id }
      });

      setSelectedLesson(prev => {
        if (!prev) return prev;

        return {
          ...prev,
          activities: (prev.activities || []).map(activity => ({
            ...activity,
            questions: (activity.questions || []).map(item => {
              if (String(item.id) !== String(question.id)) return item;

              return {
                ...item,
                mcqAttempt: {
                  selectedOptionId: option.id,
                  isCorrect: Boolean(data.correct),
                  answeredAt: data.history?.answeredAt || new Date().toISOString(),
                },
              };
            }),
          })),
        };
      });

      if (data.xpAwarded) {
        await loadStudentDashboard();
      }

      if (!silent) {
        notify(
          data.xpAwarded
            ? `Correct! +${data.xpAwarded} XP`
            : data.correct
              ? 'Correct! XP already awarded for this question.'
              : 'Not quite. Review the answer.',
          data.correct ? 'good' : 'bad'
        );
      }

      return data;
    }, 'Hindi ma-save ang sagot. Pakisubukan muli.');
  }

  async function submitWriting(taskId, answer, options = {}) {
  if (!selectedLesson) return null;

  if (!answer || answer.trim().length < 2) {
    setLessonFeedback('✍️ Pakisulat muna ang iyong sagot bago i-submit.');
    return null;
  }

  if (options?.autoChecked) {
    setLessonFeedback('');
  }

  return safeRun(async () => {
    const data = await api(`/lessons/${selectedLesson.id}/writing`, {
      method: 'POST',
      body: {
        taskId,
        content: answer,
        ...options
      }
    });

    if (!options?.autoChecked) {
      setLessonFeedback(data?.message || '✍️ Naipasa na ang writing activity.');
    } else {
      setLessonFeedback('');
    }

    await loadStudentDashboard();

    return data;
  }, 'Hindi ma-save ang sagot. Pakisubukan muli.');
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
    const [dash, monitoring, groups, students, lessons, quizPerformance, pendingGroupChecks] = await Promise.all([
      api('/teachers/dashboard'),
      api('/teachers/monitoring/stats'),
      api('/groups'),
      api('/students?status=active'),
      api('/lessons'),
      api('/teachers/quiz-performance'),
      api('/groups/task-completions/pending')
    ]);

    const sortedLessons = [...(lessons.lessons || [])].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();

      if (dateA !== dateB) return dateB - dateA;

      return Number(b.id || 0) - Number(a.id || 0);
    });

    setTeacherData({
      stats: dash.stats,
      assignedClasses: dash.assignedClasses || monitoring.assignedClasses || quizPerformance.assignedClasses || [],
      rows: monitoring.rows || [],
      groups: (groups.groups || []).filter(group => String(group?.status || 'active').toLowerCase() !== 'archived'),
      students: students.students || [],
      lessons: sortedLessons,
      quizPerformance: quizPerformance || { summary: {}, rows: [] },
      pendingGroupChecks: pendingGroupChecks || { summary: {}, rows: [] }
    });
  }

  async function teacherApproveGroupTaskCompletion(row) {
    if (!row?.groupTaskId || !row?.studentId) {
      notify('Missing group task approval details.');
      return;
    }

    await safeRun(async () => {
      const data = await api(`/groups/tasks/${row.groupTaskId}/completions/${row.studentId}/approve`, {
        method: 'POST',
        body: {}
      });

      notify(data.xpAwarded
        ? `${row.studentName || 'Student'} earned +${data.xpAwarded} XP after teacher approval.`
        : `${row.studentName || 'Student'} was already approved.`
      );
      showBadgeUnlockPopup(data?.newBadges);
      await loadTeacherDashboard();
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

  async function teacherSetGroupLeader(groupId, studentId) {
    if (!groupId || !studentId) return notify('Missing group leader details.', 'warn');
    await safeRun(async () => {
      await api(`/groups/${groupId}/members/${studentId}/leader`, { method: 'POST', body: {} });
      notify('Group leader updated.');
      await loadTeacherDashboard();
    });
  }

  async function teacherDeleteGroup(groupId, groupName = 'this group') {
    if (!groupId) return notify('Missing group details.', 'warn');

    const confirmed = window.confirm(
      `Remove "${groupName}"? Students assigned to this group will no longer see it.`
    );

    if (!confirmed) return;

    await safeRun(async () => {
      await api(`/groups/${groupId}`, { method: 'DELETE' });
      setTeacherData(prev => prev ? {
        ...prev,
        groups: (prev.groups || []).filter(group => String(group.id) !== String(groupId))
      } : prev);
      notify('Group removed.');
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

  async function teacherDeleteLesson(lessonId, lessonTitle = 'this lesson') {
    if (!lessonId) return notify('Missing lesson details.', 'warn');

    const confirmed = window.confirm(
      `Remove "${lessonTitle}"? Students will no longer see this lesson or its Quiz Time quiz.`
    );

    if (!confirmed) return;

    await safeRun(async () => {
      await api(`/lessons/${lessonId}`, { method: 'DELETE' });
      setTeacherData(prev => prev ? {
        ...prev,
        lessons: (prev.lessons || []).filter(lesson => String(lesson.id) !== String(lessonId))
      } : prev);
      notify('Lesson removed.');
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
          title: 'Quiz',
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
  const [stats, students, archivedStudents, teachers, archivedTeachers, enrollments, logs] = await Promise.all([
    api('/admin/stats'),
    api('/students?status=active'),
    api('/students?status=archived'),
    api('/teachers?status=active'),
    api('/teachers?status=archived'),
    api('/admin/enrollments'),
    api('/admin/audit-logs?limit=50')
  ]);

  setAdminData({
    stats: stats.stats,
    students: students.students || [],
    archivedStudents: archivedStudents.students || [],
    teachers: teachers.teachers || [],
    archivedTeachers: archivedTeachers.teachers || [],
    teacherAssignments: enrollments.teacherAssignments || [],
    classOptions: enrollments.classOptions || [],
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

  async function assignTeacherClass() {
    await safeRun(async () => {
      const teacherId = read('a-assign-teacher');
      const gradeLevel = Number(read('a-assign-grade'));
      const section = read('a-assign-section');

      if (!teacherId || !gradeLevel || !section) {
        window.alert('Please select a teacher, grade level, and section.');
        return;
      }

      await api(`/admin/teachers/${teacherId}/assignments`, {
        method: 'POST',
        body: { gradeLevel, section }
      });

      notify('Teacher class assignment saved.');
      await loadAdminDashboard();
      await loadTeacherDashboard().catch(() => null);
    }, 'Hindi na-save ang teacher assignment.');
  }

  async function removeTeacherAssignment(id) {
    const confirmed = window.confirm('Remove this teacher class assignment?');
    if (!confirmed) return;

    await safeRun(async () => {
      await api(`/admin/teacher-assignments/${id}`, { method: 'DELETE' });
      notify('Teacher class assignment removed.');
      await loadAdminDashboard();
      await loadTeacherDashboard().catch(() => null);
    }, 'Hindi na-remove ang teacher assignment.');
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

  async function completeGroupTask(taskId, submission = {}) {
    await safeRun(async () => {
      let data;

      if (submission.studentRole || submission.file) {
        const formData = new FormData();
        if (submission.studentRole) formData.append('studentRole', submission.studentRole);
        if (submission.file) formData.append('submissionFile', submission.file);
        data = await uploadForm(`/groups/tasks/${taskId}/complete`, formData);
      } else {
        data = await api(`/groups/tasks/${taskId}/complete`, { method: 'POST' });
      }

      notify(data.pendingTeacherCheck ? 'Task submitted. Waiting for teacher check.' : (data.xpAwarded ? `Task completed! +${data.xpAwarded} XP` : 'Task already completed.'));
      await loadStudentDashboard();
    });
  }

  async function exportStudentsCSV() {
    await safeRun(async () => {
      await downloadFile('/reports/students.csv', 'tuklas-talino-students.csv');
    }, 'Hindi ma-download ang students CSV.');
  }

  async function exportLogsCSV() {
    await safeRun(async () => {
      await downloadFile('/reports/activity-logs.csv', 'tuklas-talino-activity-logs.csv');
    }, 'Hindi ma-download ang activity logs CSV.');
  }

  async function downloadSummaryReport() {
    await safeRun(async () => {
      await downloadFile('/reports/summary.txt', 'tuklas-talino-summary-report.txt');
    }, 'Hindi ma-download ang summary report.');
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

  const hasSavedSession = typeof window !== 'undefined' && Boolean(window.localStorage.getItem('tuklas_token'));
  const restoringSession =
    booting ||
    (hadSavedSessionOnBoot && !startupDelayDone) ||
    (hasSavedSession && screen === 'screen-landing');

  if (restoringSession) {
    return <StartupLoader />;
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
  
      .word-match-toast {
        padding: 14px 16px;
        border-radius: 18px;
        font-weight: 1000;
        box-shadow: 0 10px 24px rgba(60, 103, 135, .10);
      }

      .word-match-toast.info {
        background: #EFF6FF;
        border: 1px solid #BFDBFE;
        color: #1D4ED8;
      }

      .word-match-toast.good {
        background: #EFFFF5;
        border: 1px solid #18B865;
        color: #0B743D;
      }

      .word-match-toast.warn {
        background: #FFF8E5;
        border: 1px solid #F7D77A;
        color: #7A5200;
      }

      .word-match-picture {
        grid-template-columns: 1fr;
        justify-items: center;
        min-height: 104px;
        text-align: center;
      }

      .word-match-picture-icon {
        width: 78px;
        height: 78px;
        border-radius: 24px;
        font-size: 42px;
      }

      .word-match-picture-label {
        display: none;
      }

      .word-match-word.matched.tone-0,
      .word-match-picture.matched.tone-0 {
        border-color: #22C55E;
        background: #ECFFF5;
        color: #0B743D;
      }

      .word-match-word.matched.tone-1,
      .word-match-picture.matched.tone-1 {
        border-color: #3B82F6;
        background: #EFF6FF;
        color: #1D4ED8;
      }

      .word-match-word.matched.tone-2,
      .word-match-picture.matched.tone-2 {
        border-color: #A855F7;
        background: #FAF5FF;
        color: #7E22CE;
      }

      .word-match-word.matched.tone-3,
      .word-match-picture.matched.tone-3 {
        border-color: #F59E0B;
        background: #FFF7ED;
        color: #B45309;
      }

      .word-match-word.matched.tone-4,
      .word-match-picture.matched.tone-4 {
        border-color: #EC4899;
        background: #FFF1F2;
        color: #BE185D;
      }

      .word-match-word.matched.tone-5,
      .word-match-picture.matched.tone-5 {
        border-color: #14B8A6;
        background: #ECFEFF;
        color: #0F766E;
      }

      .mission-play-action:disabled {
        opacity: .55;
        cursor: not-allowed;
        transform: none;
      }

      /* === Word Match shuffled picture polish START === */
    

      .word-match-game {
        position: relative;
      }

      .word-match-toast {
        position: fixed;
        left: 50%;
        top: 46%;
        transform: translate(-50%, -50%);
        z-index: 999;
        min-width: min(420px, 82vw);
        max-width: min(520px, 86vw);
        padding: 22px 30px;
        border-radius: 24px;
        text-align: center;
        font-size: 28px;
        line-height: 1.2;
        font-weight: 1000;
        box-shadow: 0 22px 60px rgba(20, 40, 70, .18);
        animation: wordMatchPop .18s ease-out;
      }

      .word-match-toast.info {
        background: rgba(239, 246, 255, .96);
        border: 2px solid #BFDBFE;
        color: #1D4ED8;
      }

      .word-match-toast.good {
        background: rgba(255, 255, 255, .96);
        border: 3px solid #F8DE7E;
        color: #13243D;
      }

      .word-match-toast.warn {
        background: rgba(255, 248, 229, .97);
        border: 2px solid #F7D77A;
        color: #7A5200;
      }

      @keyframes wordMatchPop {
        from {
          opacity: 0;
          transform: translate(-50%, -46%) scale(.94);
        }
        to {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }
      }

      @media (max-width: 720px) {
        .word-match-toast {
          top: 50%;
          font-size: 22px;
          padding: 18px 22px;
        }
      }

      /* === Word Match toast overlay polish START === */
    
    `}
</style>

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
  <QuizzesPage
    data={studentDash}
    go={go}
    openQuiz={openQuiz}
    openQuizResult={openQuizResult}
    quizAttempts={quizAttempts}
    subjects={SUBJECTS}
    buildStudentQuizzes={buildStudentQuizzes}
    getBestQuizAttempt={getBestQuizAttempt}
    EarlyStudentChrome={EarlyStudentChrome}
    Grade46StudentChrome={Grade46StudentChrome}
  />
</Screen>

<Screen id="screen-stu-quiz-play" active={screen === 'screen-stu-quiz-play'}>
  {selectedQuiz && (
    <QuizPlayer
      data={studentDash}
      quiz={selectedQuiz}
      go={go}
      submitQuiz={submitQuiz}
      quizAttempts={quizAttempts}
      getBestQuizAttempt={getBestQuizAttempt}
      EarlyStudentChrome={EarlyStudentChrome}
      Grade46StudentChrome={Grade46StudentChrome}
    />
  )}
</Screen>

<Screen id="screen-stu-quiz-result" active={screen === 'screen-stu-quiz-result'}>
  {quizResult && (
    <QuizResults
      data={studentDash}
      result={quizResult}
      go={go}
      openQuiz={openQuiz}
      buildStudentQuizzes={buildStudentQuizzes}
      EarlyStudentChrome={EarlyStudentChrome}
      Grade46StudentChrome={Grade46StudentChrome}
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
          refresh={loadStudentDashboard}
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
          setGroupLeader={teacherSetGroupLeader}
          deleteGroup={teacherDeleteGroup}
          approveGroupTaskCompletion={teacherApproveGroupTaskCompletion}
          createLesson={teacherCreateLesson}
          deleteLesson={teacherDeleteLesson}
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
  assignTeacherClass={assignTeacherClass}
  removeTeacherAssignment={removeTeacherAssignment}
  reload={() => safeRun(loadAdminDashboard)}
/>
      </Screen>
    </>
  );
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

function getGroupTasks(data) {
  const groups = asArray(data?.groups);
  return groups.flatMap(g => asArray(g.tasks).map(t => ({ ...t, groupName: g.name })));
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
  });

  return questions.slice(0, 25);
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
      selectedOptionId: selectedOption?.id || null,
      correctOptionId: correctOption?.id || null,
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


      
        .g12-filter-row .g12-chip {
          min-height: 66px !important;
          padding: 16px 26px !important;
          border-radius: 24px !important;
          font-size: 20px !important;
          font-weight: 900 !important;
        }
        /* Grade 1-2 balanced lesson card arrow override */
        .g12-tile .g12-arrow {
          width: 66px !important;
          min-width: 66px !important;
          height: 66px !important;
          border-radius: 50% !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          margin-left: auto !important;
          margin-right: 34px !important;
          align-self: center !important;
          transform: translateX(-24px) !important;
          background: #FFFDF6 !important;
          border: 2px solid #E7EFE8 !important;
          color: #149b55 !important;
          font-size: 38px !important;
          font-weight: 900 !important;
          line-height: 1 !important;
          box-shadow: 0 6px 14px rgba(27, 46, 70, 0.06) !important;
          flex-shrink: 0 !important;
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
        <div className="g12-brand" aria-label="Tuklas Talino">
          <img
            src="/tuklas-talino-icon.png"
            alt=""
            style={{ width: '74px', height: '74px', objectFit: 'contain', display: 'block' }}
          />
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
  <span>Level {level} • {shortLevelTitleForXp(s.xp)}</span>
</div>
              <div className="g12-progress-track">
                <span className="g12-progress-fill" style={{ width: `${xpPct}%` }} />
              </div>
            </div>

          </div>
        </section>

        <section className="g12-section-card">
          <h2 className="g12-section-title">🌎 Learning Worlds ⭐</h2>
          <p className="g12-section-subtitle"></p>

          <div className="g12-subject-grid">
            {mainStats.map((item) => {
              const subjectInfo = SUBJECTS.find((subj) => subj.name === item.subj) || {};
              const tone = item.tone || subjectInfo.tone || 'green';
              const icon = item.icon || subjectInfo.icon || '📚';
              const desc = subjectInfo.desc || '';
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
            <div className="g46-ref-brand" aria-label="Tuklas Talino">
              <img
                src="/tuklas-talino-icon.png"
                alt=""
                style={{ width: '42px', height: '42px', objectFit: 'contain', display: 'block' }}
              />
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
              <b>Level {level} • {levelTitleForXp(xp)}</b>
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
                <span className="g46-ref-pill">🏅 Level {level} • {levelTitleForXp(xp)}</span>
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
                {activeTab !== 'quizzes' && (
<p className="g46-ref-muted" style={{ margin: '10px 0 0' }}>Mayroon kang <b>{xp} XP</b>. {100 - pct} XP pa bago ang next level.</p>
)}
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
          <button type="button" className="g12-brand" onClick={() => goStudentTab('home')} aria-label="Go to Tuklas Talino home">
            <img
              src="/tuklas-talino-icon.png"
              alt=""
              style={{ width: '74px', height: '74px', objectFit: 'contain', display: 'block' }}
            />
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
                <strong>🪙 {s.xp || 0} XP • Level {level} • {shortLevelTitleForXp(s.xp)}</strong>
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
      subtitle=""
    >
      <section className="g12-section-card">
        <div className="g12-section-head">
          <div>
            <h2 className="g12-section-title">📚 Lesson Library</h2>

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
                  <h3>{shortEarlyLessonTitle(lesson)}</h3>
                  <p>⭐ {lesson.xpReward || 0} XP</p>
                  {lesson.completed && (
                    <span className="g12-status-pill">✅ Summary</span>
                  )}
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

  const [lessonStep, setLessonStep] = useState(0);
  const [maxUnlockedStep, setMaxUnlockedStep] = useState(0);
  const [practiceStep, setPracticeStep] = useState(0);
  const [completedPracticeKeys, setCompletedPracticeKeys] = useState([]);
  const [activityFeedbackKey, setActivityFeedbackKey] = useState('');
  const [reflectionChoice, setReflectionChoice] = useState('');

  useEffect(() => {
    setLessonStep(0);
    setMaxUnlockedStep(0);
    setPracticeStep(0);
    setCompletedPracticeKeys([]);
    setActivityFeedbackKey('');
    setReflectionChoice('');

    if (window?.speechSynthesis) {
      speechSynthesis.cancel();
    }
  }, [lesson?.id]);

  function speakLesson() {
    const text = `${lesson?.title || ''}. ${lesson?.instructions || ''}. ${lesson?.passage || ''}`;
    speechSynthesis.cancel();
    speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }

  const materialActivities = activities.filter(activity => activity?.type === 'material');
  const practiceActivities = activities.filter(activity => activity?.type !== 'material');
  const activityTotal = practiceActivities.length;

  function getPracticeKey(activity, index) {
    return `${activity?.type || 'activity'}-${activity?.id || activity?.writingTask?.id || activity?.speechTask?.id || index}`;
  }

  function activityRequiresSubmit(activity) {
    return ['mcq', 'writing', 'speech'].includes(activity?.type);
  }

  function isPracticeActivityComplete(activity, index) {
    if (!activityRequiresSubmit(activity)) return true;

    const key = getPracticeKey(activity, index);
    if (completedPracticeKeys.includes(key)) return true;

    if (activity?.type === 'mcq') {
      const questions = activity.questions || [];
      return Boolean(questions.length) && questions.every(question => Boolean(question.mcqAttempt));
    }

    if (activity?.type === 'writing') {
      return Boolean(
        activity?.writingSubmission ||
        activity?.submission ||
        activity?.latestSubmission ||
        activity?.writingTask?.submission ||
        activity?.writingTask?.latestSubmission
      );
    }

    if (activity?.type === 'speech') {
      return Boolean(
        activity?.speechAttempt ||
        activity?.attempt ||
        activity?.latestAttempt ||
        activity?.speechTask?.attempt ||
        activity?.speechTask?.latestAttempt
      );
    }

    return true;
  }

  function markPracticeComplete(activity, index) {
    const key = getPracticeKey(activity, index);
    setCompletedPracticeKeys(prev => prev.includes(key) ? prev : [...prev, key]);
  }

  const currentPracticeIndex = activityTotal ? Math.min(practiceStep, activityTotal - 1) : 0;
  const currentPracticeActivity = activityTotal ? practiceActivities[currentPracticeIndex] : null;
  const currentPracticeComplete = currentPracticeActivity
    ? isPracticeActivityComplete(currentPracticeActivity, currentPracticeIndex)
    : true;
  const allRequiredPracticeComplete = practiceActivities.every((activity, index) => isPracticeActivityComplete(activity, index));

  const lessonSteps = [
    {
      key: 'overview',
      eyebrow: 'Step 1',
      title: 'Lesson Overview',
      subtitle: 'Check the lesson goal, reward, and what you need to finish.'
    },
    ...(materialActivities.length ? [{
      key: 'material',
      eyebrow: 'Step 2',
      title: 'Lesson Material',
      subtitle: 'Open the attached slides or PDF before reading and answering.'
    }] : []),
    {
      key: 'read',
      eyebrow: `Step ${materialActivities.length ? 3 : 2}`,
      title: 'Read the Lesson',
      subtitle: 'Review the instructions and lesson text carefully.'
    },
    {
      key: 'activities',
      eyebrow: `Step ${materialActivities.length ? 4 : 3}`,
      title: 'Practice Activities',
      subtitle: activityTotal
        ? `Activity ${currentPracticeIndex + 1} of ${activityTotal}`
        : 'No practice activities yet for this lesson.'
    },
    {
      key: 'reflection',
      eyebrow: `Step ${materialActivities.length ? 5 : 4}`,
      title: 'Reflection',
      subtitle: 'Rate your confidence before finishing.'
    },
    {
      key: 'complete',
      eyebrow: `Step ${materialActivities.length ? 6 : 5}`,
      title: 'Complete Lesson',
      subtitle: 'Submit your lesson progress when you are ready.'
    }
  ];

  const safeStep = Math.min(lessonStep, lessonSteps.length - 1);
  const currentStep = lessonSteps[safeStep];
  const canGoBack = safeStep > 0 || (currentStep?.key === 'activities' && currentPracticeIndex > 0);
  const canGoNext = safeStep < lessonSteps.length - 1;

  function goStep(delta) {
    const targetStep = Math.max(0, Math.min(lessonSteps.length - 1, safeStep + delta));

    if (delta > 0 && currentStep?.key === 'activities' && !allRequiredPracticeComplete) {
      window.alert('Please submit the required activity before continuing.');
      return;
    }

    if (targetStep > safeStep) {
      setMaxUnlockedStep(prev => Math.max(prev, targetStep));
    }

    setLessonStep(targetStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleBack() {
    if (currentStep?.key === 'activities' && currentPracticeIndex > 0) {
      setActivityFeedbackKey('');
      setPracticeStep(prev => Math.max(0, prev - 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    goStep(-1);
  }

  function handleNext() {
    if (currentStep?.key === 'activities' && activityTotal) {
      if (!currentPracticeComplete) {
        window.alert('Please submit this activity before moving to the next one.');
        return;
      }

      if (currentPracticeIndex < activityTotal - 1) {
        setActivityFeedbackKey('');
        setPracticeStep(prev => Math.min(activityTotal - 1, prev + 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      if (!allRequiredPracticeComplete) {
        window.alert('Please submit all required activities before continuing.');
        return;
      }
    }

    if (currentStep?.key === 'activities') {
      setActivityFeedbackKey('');
    }

    goStep(1);
  }

  function renderFeedbackCard(activity = currentPracticeActivity, index = currentPracticeIndex) {
    if (!feedback || !activity) return null;

    const currentKey = getPracticeKey(activity, index);
    if (activityFeedbackKey !== currentKey) return null;

    return (
      <div
        className="card"
        style={{
          border: feedback.includes('Tama') || feedback.includes('Na-save') || feedback.includes('Naisumite')
            ? '2px solid #2ECC71'
            : '2px solid #E67E22',
          background: feedback.includes('Tama') ? '#E9FBEF' : '#FFFFFF',
          marginTop: 14
        }}
      >
        <div className="section-title">Activity Feedback</div>
        <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.45 }}>
          {feedback}
        </div>
      </div>
    );
  }

  function renderCompletedSummary() {
    return (
      <Grade46StudentChrome
        data={data}
        activeTab="lessons"
        go={go}
        icon="✅"
        title={lesson?.title || "Lesson Summary"}
        subtitle={`Completed • Grade ${lesson?.gradeLevel || '—'} • ${lesson?.subject || 'Filipino'}`}
        titleAction={
          <button
            type="button"
            className="g46-ref-soft-btn"
            onClick={() => go('screen-lessons')}
          >
            ← Lessons
          </button>
        }
      >
        <div className="g46-ref-stack" style={{ display: 'grid', gap: 16 }}>
          <section
            className="g46-ref-panel"
            style={{
              border: '2px solid #22C55E',
              background: 'linear-gradient(135deg, #F0FDF4, #FFFFFF)'
            }}
          >
            <div className="g46-ref-panel-head">
              <div>
                <span className="g46-ref-tag">✅ Completed</span>
                <h2 style={{ marginTop: 8 }}>Lesson Summary</h2>
                <p className="g46-ref-muted">
                  You already completed this lesson. Review the material if needed, or go back to the lesson library.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginTop: 16 }}>
              {[
                { icon: '📘', label: 'Subject', value: lesson?.subject || 'Filipino' },
                { icon: '🎯', label: 'Activities', value: `${activityTotal} ${activityTotal === 1 ? 'Activity' : 'Activities'}` },
                { icon: '⚡', label: 'Reward', value: `+${lesson?.xpReward || 0} XP` }
              ].map(item => (
                <div
                  key={item.label}
                  style={{
                    borderRadius: 22,
                    padding: '16px 18px',
                    background: '#FFFFFF',
                    border: '1px solid #DCFCE7',
                    display: 'grid',
                    gap: 6
                  }}
                >
                  <span style={{ fontSize: 22 }}>{item.icon}</span>
                  <strong style={{ color: '#17324D', fontSize: 16 }}>{item.value}</strong>
                  <small style={{ color: '#64748B', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {item.label}
                  </small>
                </div>
              ))}
            </div>
          </section>

          {materialActivities.length > 0 && (
            <section className="g46-ref-panel">
              <div className="g46-ref-panel-head">
                <div>
                  <h2>Review Lesson Material</h2>
                  <p className="g46-ref-muted">You can still open the attached slides or PDF for review.</p>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 12 }}>
                {materialActivities.map((activity, index) => (
                  <ActivityCard
                    key={activity.id || index}
                    activity={activity}
                    index={index}
                    total={materialActivities.length}
                    isEarlyGrade={false}
                    submitMcq={submitMcq}
                    submitWriting={submitWriting}
                    submitSpeech={submitSpeech}
                  />
                ))}
              </div>
            </section>
          )}

          <section
            className="g46-ref-panel"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap'
            }}
          >
            <span className="g46-ref-muted" style={{ fontWeight: 900 }}>
              Completed lesson summary
            </span>

            <button
              type="button"
              className="g46-ref-primary-btn"
              onClick={() => go('screen-lessons')}
            >
              Back to Lessons
            </button>
          </section>
        </div>
      </Grade46StudentChrome>
    );
  }

  if (lesson?.completed) {
    return renderCompletedSummary();
  }

  function renderStepContent() {
    if (currentStep.key === 'overview') {
      return (
        <div
          className="card"
          style={{
            background: '#ffffff',
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

              <h2 style={{ margin: '4px 0 8px', fontSize: 28, lineHeight: 1.1 }}>
                {lesson?.title || 'Lesson'}
              </h2>

              <div className="muted" style={{ fontSize: 15, lineHeight: 1.55 }}>
                Read the lesson carefully, open the attached material if available, complete the activities, and track your progress.
              </div>
            </div>

            <div style={{ fontSize: 48 }}>
              {theme.icon || '📘'}
            </div>
          </div>

          <div className="divider" />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
            {[
              { icon: '📎', label: 'Material', value: materialActivities.length ? 'Attached' : 'None' },
              { icon: '🎯', label: 'Activities', value: `${activityTotal} ${activityTotal === 1 ? 'Activity' : 'Activities'}` },
              { icon: '⚡', label: 'Reward', value: `+${lesson?.xpReward || 0} XP` }
            ].map(item => (
              <div
                key={item.label}
                style={{
                  borderRadius: 22,
                  padding: '16px 18px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  display: 'grid',
                  gap: 6
                }}
              >
                <span style={{ fontSize: 22 }}>{item.icon}</span>
                <strong style={{ color: '#17324D', fontSize: 16 }}>{item.value}</strong>
                <small style={{ color: '#64748B', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {item.label}
                </small>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (currentStep.key === 'material') {
      return (
        <div style={{ display: 'grid', gap: 12 }}>
          {materialActivities.map((activity, index) => (
            <ActivityCard
              key={activity.id || index}
              activity={activity}
              index={index}
              total={materialActivities.length}
              isEarlyGrade={false}
              submitMcq={submitMcq}
              submitWriting={submitWriting}
              submitSpeech={submitSpeech}
            />
          ))}
        </div>
      );
    }

    if (currentStep.key === 'read') {
      return (
        <div className="g46-ref-panel">
          {lesson?.instructions && (
            <div
              style={{
                padding: 14,
                borderRadius: 16,
                background: '#F8FAFF',
                marginBottom: 12,
                lineHeight: 1.6,
                fontSize: 15,
              }}
            >
              <b>Instructions:</b> {lesson.instructions}
            </div>
          )}

          {lesson?.passage ? (
            <div
              style={{
                padding: 18,
                borderRadius: 18,
                background: '#FFFFFF',
                border: '1px solid #E1E7FF',
                lineHeight: 1.75,
                fontSize: 16,
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
              🔊 Listen
            </button>

            <button className="btn btn-outline" onClick={() => speechSynthesis.cancel()}>
              ⏹ Stop
            </button>
          </div>
        </div>
      );
    }

    if (currentStep.key === 'activities') {
      const currentActivity = currentPracticeActivity;
      return (
        <div style={{ display: 'grid', gap: 14 }}>
          {currentActivity ? (
            <>
              <ActivityCard
                key={currentActivity.id || currentPracticeIndex}
                activity={currentActivity}
                index={currentPracticeIndex}
                total={activityTotal}
                isEarlyGrade={false}
                submitMcq={async (...args) => {
                  const result = await submitMcq(...args);
                  markPracticeComplete(currentActivity, currentPracticeIndex);
                  setActivityFeedbackKey(getPracticeKey(currentActivity, currentPracticeIndex));
                  return result;
                }}
                submitWriting={async (...args) => {
                  const result = await submitWriting(...args);
                  markPracticeComplete(currentActivity, currentPracticeIndex);
                  setActivityFeedbackKey(getPracticeKey(currentActivity, currentPracticeIndex));
                  return result;
                }}
                submitSpeech={async (...args) => {
                  const result = await submitSpeech(...args);
                  markPracticeComplete(currentActivity, currentPracticeIndex);
                  setActivityFeedbackKey(getPracticeKey(currentActivity, currentPracticeIndex));
                  return result;
                }}
              />

              {renderFeedbackCard()}
            </>
          ) : (
            <div className="g46-ref-panel">
              <p className="g46-ref-muted" style={{ margin: 0 }}>
                No practice activities yet for this lesson.
              </p>
            </div>
          )}
        </div>
      );
    }

    if (currentStep.key === 'reflection') {
      const reflectionOptions = [
        'Kayang-kaya ko na',
        'Kailangan ko pang mag-review',
        'Magtatanong ako sa teacher'
      ];

      return (
        <div className="g46-ref-panel">
          <div style={{ display: 'grid', gap: 14 }}>
            <div>
              <h3 style={{ margin: '0 0 6px', color: '#17324D' }}>Kumusta ang aralin?</h3>
              <p className="g46-ref-muted" style={{ margin: 0 }}>
                Piliin ang pinakaakmang reflection bago tapusin ang lesson.
              </p>
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              {reflectionOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  className={reflectionChoice === option ? 'g46-ref-primary-btn' : 'g46-ref-soft-btn'}
                  onClick={() => setReflectionChoice(option)}
                  style={{
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    width: '100%',
                    borderRadius: 18,
                    padding: '14px 16px'
                  }}
                >
                  {reflectionChoice === option ? '✅ ' : '○ '} {option}
                </button>
              ))}
            </div>

            {reflectionChoice && (
              <div
                style={{
                  borderRadius: 18,
                  padding: 14,
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  color: '#166534',
                  fontWeight: 900
                }}
              >
                Reflection saved for this session: {reflectionChoice}
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div
        className="card"
        style={{
          border: '2px solid #2ECC71',
          background: '#FFFFFF',
        }}
      >
        <div className="section-title">
          Finish this lesson
        </div>

        <div className="muted" style={{ marginBottom: 14, lineHeight: 1.55 }}>
          When you are done reading and answering the activities, submit your lesson progress.
        </div>

        <button
          className="btn btn-green"
          style={{
            width: '100%',
            minHeight: 56,
            borderRadius: 18,
            fontSize: 16,
            fontWeight: 900
          }}
          onClick={() => completeLesson(lesson?.id)}
        >
          ✅ Complete Lesson
        </button>
      </div>
    );
  }

  return (
    <Grade46StudentChrome
      data={data}
      activeTab="lessons"
      go={go}
      icon={theme.icon || "📘"}
      title={lesson?.title || "Lesson"}
      subtitle={`Grade ${lesson?.gradeLevel || '—'} • ${lesson?.subject || 'Filipino'} • +${lesson?.xpReward || 0} XP`}
      titleAction={
        <button
          type="button"
          className="g46-ref-soft-btn"
          onClick={() => go('screen-lessons')}
        >
          ← Lessons
        </button>
      }
    >
      <div className="g46-ref-stack" style={{ display: 'grid', gap: 16 }}>
        <section className="g46-ref-panel" style={{ padding: 14 }}>
          <div className="g46-ref-panel-head" style={{ marginBottom: 8 }}>
            <div>
              <span className="g46-ref-tag">{currentStep.eyebrow} of {lessonSteps.length}</span>
              <h2 style={{ margin: '6px 0 4px', fontSize: 24 }}>{currentStep.title}</h2>
              <p className="g46-ref-muted">{currentStep.subtitle}</p>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${lessonSteps.length}, minmax(0, 1fr))`,
              gap: 6,
              marginTop: 10
            }}
          >
            {lessonSteps.map((step, index) => (
              <button
                key={step.key}
                type="button"
                disabled={index > maxUnlockedStep}
                onClick={() => {
                  if (index > maxUnlockedStep) return;
                  setLessonStep(index);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                style={{
                  border: 0,
                  borderRadius: 999,
                  minHeight: 10,
                  cursor: index <= maxUnlockedStep ? 'pointer' : 'not-allowed',
                  opacity: index <= maxUnlockedStep ? 1 : 0.55,
                  background: index <= safeStep ? theme.accent : '#E2E8F0'
                }}
                aria-label={`Go to ${step.title}`}
                title={index <= maxUnlockedStep ? step.title : 'Use Next to unlock this step'}
              />
            ))}
          </div>
        </section>

        {renderStepContent()}

        <div
          className="g46-ref-panel"
          style={{
            padding: 14,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap'
          }}
        >
          <button
            type="button"
            className="g46-ref-soft-btn"
            disabled={!canGoBack}
            onClick={handleBack}
            style={{ opacity: canGoBack ? 1 : 0.5 }}
          >
            ← Back
          </button>

          <span className="g46-ref-muted" style={{ fontWeight: 900 }}>
            {currentStep.key === 'activities' && activityTotal
              ? `Activity ${currentPracticeIndex + 1} / ${activityTotal}`
              : `${safeStep + 1} / ${lessonSteps.length}`}
          </span>

          {canGoNext ? (
            <button
              type="button"
              className="g46-ref-primary-btn"
              onClick={handleNext}
            >
              {currentStep.key === 'activities' && currentPracticeIndex < activityTotal - 1
                ? 'Next Activity →'
                : 'Next →'}
            </button>
          ) : (
            <button
              type="button"
              className="g46-ref-soft-btn"
              onClick={() => go('screen-lessons')}
            >
              Back to Lessons
            </button>
          )}
        </div>
      </div>
    </Grade46StudentChrome>
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

function shortEarlyLessonTitle(lesson = {}) {
  const subject = String(lesson.subject || "").trim();
  const title = String(lesson.title || "").trim();

  const withoutExtra = title
    .replace(/\s*lesson\s*$/i, "")
    .replace(/\s*quiz\s*$/i, "")
    .trim();

  if (/^gawa$/i.test(withoutExtra)) return "Gawa";
  if (/^gawa\b/i.test(withoutExtra)) return "Gawa";

  const prefix = withoutExtra
    .replace(/^([^:]+)\s*:\s*.+$/, "$1")
    .replace(/\s+/g, " ")
    .trim();

  if (prefix && prefix.length <= 24) {
    if (/oral|bigkas|speech|komunikasyon/i.test(prefix)) {
      const number = prefix.match(/\d+/)?.[0];
      return number ? `Bigkas ${number}` : "Bigkas";
    }

    if (/pagsulat|sulatin|patlang|writing/i.test(prefix)) {
      const number = prefix.match(/\d+/)?.[0];
      return number ? `Patlang ${number}` : "Patlang";
    }

    return prefix;
  }

  const number = title.match(/\b\d+\b/)?.[0];

  if (/bokabularyo/i.test(subject) || /bokabularyo/i.test(title)) {
    return number ? `Bokabularyo ${number}` : "Bokabularyo";
  }

  if (/pagbasa/i.test(subject) || /pagbasa/i.test(title)) {
    return number ? `Pagbasa ${number}` : "Pagbasa";
  }

  if (/panitikan/i.test(subject) || /panitikan/i.test(title)) {
    return number ? `Panitikan ${number}` : "Panitikan";
  }

  if (/oral|bigkas|speech|komunikasyon/i.test(subject) || /oral|bigkas|speech|komunikasyon/i.test(title)) {
    return number ? `Bigkas ${number}` : "Bigkas";
  }

  if (/pagsulat|sulatin|patlang|writing/i.test(subject) || /pagsulat|sulatin|patlang|writing/i.test(title)) {
    return number ? `Patlang ${number}` : "Patlang";
  }

  return prefix || subject || "Aralin";
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
    writing: { icon: '🧩', label: 'Patlang' }
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

  function activityGuideText(step) {
    const activity = step?.activity || {};

    if (activity.speechTask || activity.targetText) {
      return 'Pakinggan muna, tapos bigkasin. Tutulungan ka ng AI speech check sa pagbigkas.';
    }

    if (activity.writingTask || activity.prompt) {
      return '';
    }

    return 'Piliin ang tamang sagot. Makikita mo agad ang feedback pagkatapos.';
  }

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
    setRewardModal({ xp: xpEarned, badges: result?.newBadges || [] });
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

  function speakFilipinoText(text) {
    const cleanText = String(text || '').trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = speechSynthesis.getVoices();
    const filipinoVoice = voices.find(voice =>
      /fil|tagalog|philippines|filipino/i.test(`${voice.lang} ${voice.name}`)
    );

    utterance.lang = 'fil-PH';
    utterance.rate = 0.86;
    utterance.pitch = 1.05;

    if (filipinoVoice) {
      utterance.voice = filipinoVoice;
    }

    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
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

        .g12-mission-dot:disabled {
            cursor: not-allowed;
            opacity: 0.72;
          }

          .g12-mission-dot:disabled small {
            color: #50627A;
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

        
        /* === Grade 1-2 Reward Badge Unlock === */
        .g12-reward-badges {
          position: relative;
          z-index: 2;
          width: min(460px, 100%);
          margin: 0 auto 18px;
          padding: 14px;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.82);
          border: 2px solid rgba(250, 204, 21, 0.42);
          box-shadow: 0 12px 28px rgba(20, 34, 59, 0.08);
          animation: g12RewardBadgePop 0.45s ease both;
        }

        .g12-reward-badge-eyebrow {
          margin: 0 0 10px !important;
          color: #ca8a04 !important;
          font-size: 16px !important;
          font-weight: 1000 !important;
          letter-spacing: 0.02em;
        }

        .g12-reward-badge-list {
          display: grid;
          gap: 10px;
        }

        .g12-reward-badge-chip {
          display: grid;
          grid-template-columns: 56px 1fr;
          align-items: center;
          gap: 12px;
          text-align: left;
          padding: 10px;
          border-radius: 20px;
          background: linear-gradient(135deg, #fff7cc, #ecfdf5);
          border: 1px solid rgba(34, 197, 94, 0.18);
        }

        .g12-reward-badge-chip > span {
          width: 54px;
          height: 54px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          background: #ffffff;
          font-size: 30px;
          box-shadow: 0 10px 20px rgba(20, 34, 59, 0.08);
          animation: g12RewardBadgeBounce 0.95s ease-in-out infinite;
        }

        .g12-reward-badge-chip strong {
          display: block;
          color: #123524;
          font-size: 18px;
          line-height: 1.1;
          font-weight: 1000;
        }

        .g12-reward-badge-chip small {
          display: block;
          margin-top: 4px;
          color: #466351;
          font-size: 13px;
          line-height: 1.25;
          font-weight: 800;
        }

        .g12-reward-badge-link {
          margin-top: 12px;
          border: 0;
          border-radius: 999px;
          padding: 10px 16px;
          background: #15965a;
          color: #ffffff;
          font-weight: 950;
          cursor: pointer;
          box-shadow: 0 10px 22px rgba(21, 150, 90, 0.18);
        }

        @keyframes g12RewardBadgePop {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes g12RewardBadgeBounce {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          45% {
            transform: translateY(-4px) scale(1.05);
          }
        }
        /* === End Grade 1-2 Reward Badge Unlock === */

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

              {Array.isArray(rewardModal.badges) && rewardModal.badges.length > 0 && (
                <div className="g12-reward-badges">
                  <p className="g12-reward-badge-eyebrow">🏅 New Badge Unlocked!</p>

                  <div className="g12-reward-badge-list">
                    {rewardModal.badges.slice(0, 2).map((badge, badgeIndex) => (
                      <div className="g12-reward-badge-chip" key={badge.id || badge.code || badge.name || badgeIndex}>
                        <span>{badge.icon || '🏅'}</span>
                        <div>
                          <strong>{badge.name || 'Bagong Badge'}</strong>
                          <small>{badge.description || 'May bago kang achievement!'}</small>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="g12-reward-badge-link"
                    onClick={() => {
                      setRewardModal(null);
                      go('screen-stu-badges');
                    }}
                  >
                    Tingnan ang Aking Badges →
                  </button>
                </div>
              )}

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
              <h2>{shortEarlyLessonTitle(lesson)} 🌟</h2>
              <p>Hakbang {safeStep + 1} of {missionSteps.length}</p>
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
                disabled={rewardClaimed || rewardModal || index > safeStep}
                aria-disabled={rewardClaimed || rewardModal || index > safeStep}
                onClick={() => {
                  if (!rewardClaimed && !rewardModal && index <= safeStep) {
                    setMissionStep(index);
                  }
                }}
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
                  <h3>Makinig</h3>
                </div>
              </div>

              <div className="g12-mission-text-card">
                {lesson?.title || 'Handa ka na bang matuto?'}
              </div>

              <div className="g12-mission-actions">
                <div className="g12-mission-actions-left">
                  <button className="g12-mission-btn" onClick={() => speakFilipinoText(lesson?.title || 'Handa ka na bang matuto?')}>🔊 Pakinggan</button>
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
                  <h3>Basahin at sabayan</h3>
                  <p>Basahin nang dahan-dahan. Pwede mong pindutin ang speaker kung kailangan ng gabay.</p>
                </div>
              </div>

              <div className="g12-mission-text-card">
                {kidPassage}
              </div>

              <div className="g12-mission-actions">
                <div className="g12-mission-actions-left">
                  <button className="g12-mission-btn secondary" onClick={goBackStep}>← Balik</button>
                  <button className="g12-mission-btn" onClick={() => speakFilipinoText(kidPassage)}>🔊 Pakinggan</button>
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
                  <h3>{
                    currentStep.activity?.writingTask ||
                    currentStep.activity?.prompt ||
                    currentStep.activity?.template ||
                    currentStep.activity?.fillBlank ||
                    currentStep.activity?.sentence
                      ? 'Punan ang Patlang'
                      : currentStep.label
                  }</h3>
                  {activityGuideText(currentStep) ? <p>{activityGuideText(currentStep)}</p> : null}
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


              {feedback && (
                <div className="g12-mission-feedback">
                  {feedback}
                </div>
              )}

              <div className="g12-mission-actions" style={{ justifyContent: 'center' }}>
                <div className="g12-mission-actions-right" style={{ justifyContent: 'center', width: '100%' }}>
                  {!isReviewMode ? (
                    <button
                      className="g12-mission-btn"
                      onClick={claimReward}
                      style={{
                        minWidth: 260,
                        minHeight: 78,
                        fontSize: 24,
                        borderRadius: 26,
                        justifyContent: 'center'
                      }}
                    >
                      ⭐ Claim XP
                    </button>
                  ) : (
                    <button className="g12-mission-btn purple" onClick={() => go('screen-student')}>🏠 Go Home</button>
                  )}
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

  if (activity.type === 'material') {
    return (
      <MaterialActivity
        activity={activity}
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

function MaterialActivity({ activity, isEarlyGrade, activityBoxStyle }) {
  const material = activity.dataJson || activity;
  const fileName = material.fileName || activity.title || 'Lesson material';
  const fileUrl = material.fileUrl || '';
  const fileType = String(material.fileType || 'FILE').toUpperCase();
  const mimeType = String(material.mimeType || '').toLowerCase();
  const isPdf = fileType === 'PDF' || mimeType.includes('pdf') || fileName.toLowerCase().endsWith('.pdf');

  const [pdfPreviewUrl, setPdfPreviewUrl] = useState('');
  const [pdfPreviewError, setPdfPreviewError] = useState('');

  useEffect(() => {
    if (!isPdf || !fileUrl) {
      setPdfPreviewUrl('');
      setPdfPreviewError('');
      return undefined;
    }

    let cancelled = false;
    let objectUrl = '';

    setPdfPreviewUrl('');
    setPdfPreviewError('');

    fetch(fileUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error('PDF preview could not be loaded.');
        }

        return response.blob();
      })
      .then(blob => {
        if (cancelled) return;

        objectUrl = URL.createObjectURL(blob);
        setPdfPreviewUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) {
          setPdfPreviewError('Preview is not available here. Open the PDF in a new tab instead.');
        }
      });

    return () => {
      cancelled = true;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [isPdf, fileUrl]);

  return (
    <div className="card" style={activityBoxStyle}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="section-title">
          {isEarlyGrade ? '📎 Lesson Slides' : 'Lesson Material'}
        </div>

        <div className="pill">
          {fileType}
        </div>
      </div>

      {activity.instructions && (
        <div className="muted" style={{ marginBottom: 10 }}>
          {activity.instructions}
        </div>
      )}

      <div
        style={{
          border: '1px solid #E2E8F0',
          borderRadius: isEarlyGrade ? 24 : 18,
          padding: isEarlyGrade ? 20 : 16,
          background: '#F8FAFC',
          display: 'grid',
          gap: 12
        }}
      >
        <strong style={{ fontSize: isEarlyGrade ? 22 : 17, lineHeight: 1.35 }}>
          📄 {fileName}
        </strong>

        <span className="muted">
          {isPdf
            ? 'Preview the PDF below, or open it in a new tab.'
            : 'Open the lesson slides before answering the activities.'}
        </span>

        {fileUrl && isPdf && (
          <div
            style={{
              border: '1px solid #DCE7F3',
              borderRadius: 16,
              overflow: 'hidden',
              background: '#FFFFFF',
              minHeight: isEarlyGrade ? 420 : 520,
              display: 'grid',
              placeItems: pdfPreviewUrl ? 'stretch' : 'center'
            }}
          >
            {pdfPreviewUrl ? (
              <iframe
                title={`Preview ${fileName}`}
                src={pdfPreviewUrl}
                style={{
                  width: '100%',
                  height: isEarlyGrade ? 420 : 520,
                  border: 0,
                  display: 'block'
                }}
              />
            ) : (
              <div
                className="muted"
                style={{
                  padding: 24,
                  textAlign: 'center',
                  fontWeight: 800
                }}
              >
                {pdfPreviewError || 'Loading PDF preview...'}
              </div>
            )}
          </div>
        )}

        {fileUrl ? (
          <a
            className="btn btn-green"
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            style={{ width: 'fit-content', marginTop: 4 }}
          >
            {isPdf ? 'Open Full PDF' : 'Open Lesson Slides'}
          </a>
        ) : (
          <span className="muted">No lesson file attached.</span>
        )}
      </div>
    </div>
  );
}

function McqActivity({ activity, index, total, isEarlyGrade, activityBoxStyle, submitMcq }) {
  const allQuestions = activity.questions || [];
  const questions = allQuestions.slice(0, 1);

  function getBackendMcqState() {
    const selectedAnswers = {};
    const mcqFeedback = {};
    const mcqStats = {};
    let hasSubmittedAnswer = false;

    for (const question of questions) {
      const attempt = question.mcqAttempt;
      if (!attempt) continue;

      hasSubmittedAnswer = true;
      selectedAnswers[question.id] = attempt.selectedOptionId;
      mcqStats[question.id] = Boolean(attempt.isCorrect);
      mcqFeedback[question.id] = attempt.isCorrect
        ? isEarlyGrade
          ? 'Correct!'
          : 'Correct. XP already counted.'
        : isEarlyGrade
          ? 'Review this'
          : 'Not quite. Review this answer.';
    }

    return { selectedAnswers, mcqFeedback, mcqStats, submitted: hasSubmittedAnswer };
  }

  const backendState = getBackendMcqState();

  const [selectedAnswers, setSelectedAnswers] = useState(backendState.selectedAnswers);
  const [mcqFeedback, setMcqFeedback] = useState(backendState.mcqFeedback);
  const [mcqStats, setMcqStats] = useState(backendState.mcqStats);
  const [submitted, setSubmitted] = useState(Boolean(backendState.submitted));
  const [checking, setChecking] = useState(false);

  const selectedCount = questions.filter(q => selectedAnswers[q.id]).length;
  const allSelected = Boolean(questions.length) && selectedCount === questions.length;
  const correctCount = Object.values(mcqStats).filter(Boolean).length;
  const scorePercent = submitted && questions.length ? Math.round((correctCount / questions.length) * 100) : 0;
  const band = effectivenessBand(scorePercent);

  function chooseAnswer(question, option) {
    if (submitted) return;

    setSelectedAnswers(prev => ({
      ...prev,
      [question.id]: option.id,
    }));
  }

  async function seeScore() {
    if (submitted || checking || !allSelected) return;

    setChecking(true);

    const nextStats = {};
    const nextFeedback = {};

    for (const question of questions) {
      const selectedId = selectedAnswers[question.id];
      const option = (question.options || []).find(item => String(item.id) === String(selectedId));

      if (!option) {
        nextStats[question.id] = false;
        nextFeedback[question.id] = isEarlyGrade
          ? 'Choose an answer first.'
          : 'No answer selected.';
        continue;
      }

      const result = await submitMcq(question, option, { silent: false });

      if (result) {
        nextStats[question.id] = Boolean(result.correct);
        nextFeedback[question.id] = result.correct
          ? result.xpAwarded
            ? isEarlyGrade
              ? `Correct! +${result.xpAwarded} XP`
              : `Correct! +${result.xpAwarded} XP`
            : isEarlyGrade
              ? 'Correct!'
              : 'Correct. XP already counted.'
          : isEarlyGrade
            ? 'Review this'
            : 'Not quite. Review this answer.';
      }
    }

    setMcqStats(nextStats);
    setMcqFeedback(nextFeedback);
    setSubmitted(true);
    setChecking(false);
  }

  return (
    <div className="card" style={activityBoxStyle}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="section-title">
          {isEarlyGrade ? '🎮 Mini Quiz' : 'Quiz'}
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
        {submitted
          ? isEarlyGrade
            ? 'Done! Your answer is saved.'
            : 'This quiz is already submitted.'
          : isEarlyGrade
            ? 'Choose your answer first. Tap See Score when done.'
            : 'Choose your answers first. Feedback appears after you click See Score.'}
      </div>

      <div className="divider" />

      {questions.map((q, qIndex) => (
        <div
          key={q.id || qIndex}
          style={{
            padding: isEarlyGrade ? 18 : 14,
            borderRadius: isEarlyGrade ? 22 : 16,
            background: isEarlyGrade ? '#F8FAFF' : '#FAFAFA',
            marginBottom: 12,
          }}
        >
          <div className="pill" style={{ marginBottom: 10 }}>
            Question {qIndex + 1} of {questions.length}
          </div>

          <h3 style={{ marginTop: 0, fontSize: isEarlyGrade ? 23 : 17, lineHeight: 1.35 }}>
            {q.question}
          </h3>

          <div className="grid grid-2">
            {(q.options || []).map((option, optionIndex) => {
              const selected = String(selectedAnswers[q.id]) === String(option.id);
              const label = option.optionText || option.text || `Option ${optionIndex + 1}`;

              return (
                <button
                  key={option.id || optionIndex}
                  type="button"
                  className={`btn ${selected ? 'btn-green' : 'btn-outline'}`}
                  onClick={() => chooseAnswer(q, option)}
                  disabled={submitted}
                  style={{
                    minHeight: isEarlyGrade ? 72 : 48,
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    fontSize: isEarlyGrade ? 20 : 15,
                    whiteSpace: 'normal',
                    opacity: submitted && !selected ? 0.65 : 1,
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

          {submitted && mcqFeedback[q.id] && (
            <div
              style={{
                marginTop: 12,
                padding: isEarlyGrade ? 16 : 12,
                borderRadius: isEarlyGrade ? 20 : 14,
                background: mcqStats[q.id] ? '#E9FBEF' : '#FFF4E5',
                fontWeight: 900,
                fontSize: isEarlyGrade ? 21 : 15,
                lineHeight: 1.45,
              }}
            >
              Question {qIndex + 1}: {mcqFeedback[q.id]}
            </div>
          )}
        </div>
      ))}

      {!submitted && (
        <button
          type="button"
          className="btn btn-green"
          onClick={seeScore}
          disabled={!allSelected || checking}
          style={{
            width: '100%',
            minHeight: isEarlyGrade ? 64 : 50,
            fontSize: isEarlyGrade ? 22 : 16,
            borderRadius: isEarlyGrade ? 24 : 16,
            opacity: !allSelected || checking ? 0.65 : 1,
          }}
        >
          {checking
            ? (isEarlyGrade ? 'Tinitingnan...' : 'Checking...')
            : allSelected
              ? (isEarlyGrade ? 'Tingnan ang Score' : 'See Score')
              : (isEarlyGrade ? `Sagutan ${selectedCount}/${questions.length}` : `Answer ${selectedCount}/${questions.length}`)}
        </button>
      )}

      {submitted && (
        <div
          style={{
            marginTop: 12,
            padding: isEarlyGrade ? 18 : 16,
            borderRadius: isEarlyGrade ? 24 : 18,
            background: isEarlyGrade ? '#FFF7D6' : '#F7F9FC',
            border: '1px solid #E8E8E8',
          }}
        >
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <b style={{ fontSize: isEarlyGrade ? 22 : 16 }}>
                Score: {correctCount}/{questions.length}
              </b>
              <div className="muted" style={{ fontSize: isEarlyGrade ? 17 : 13 }}>
                {isEarlyGrade ? 'Good try! Keep learning.' : `${band.icon} ${band.label} • ${scorePercent}%`}
              </div>
            </div>

            <div className="pill">
              {scorePercent}%
            </div>
          </div>

          <ProgressBar value={scorePercent} />
        </div>
      )}
    </div>
  );
}

function WritingActivity({ activity, index, total, isEarlyGrade, activityBoxStyle, submitWriting }) {
  const [writingText, setWritingText] = useState('');
  const [selectedWords, setSelectedWords] = useState([]);
  const [earlyLocked, setEarlyLocked] = useState(false);
  const [earlyStatus, setEarlyStatus] = useState('');

  const earlyActivityKey = [
    activity?.id,
    activity?.writingTask?.id,
    activity?.title,
    activity?.writingTask?.prompt,
    index
  ].filter(Boolean).join('|') || `writing-${index}`;

  const earlyFallbackSets = [
    {
      template: 'Ang bata ay ____.',
      words: ['masaya', 'mabait', 'nagbabasa', 'tumutulong']
    },
    {
      template: 'Ang guro ay ____.',
      words: ['masaya', 'mabait', 'nagbabasa', 'tumutulong']
    },
    {
      template: 'Ang bahay ay ____.',
      words: ['maganda', 'malinis']
    },
    {
      template: 'Ang paaralan ay ____.',
      words: ['maganda', 'malinis']
    },
    {
      template: 'Ang ____ ay mabait.',
      words: ['bata', 'guro']
    },
    {
      template: 'Ang ____ ay maganda.',
      words: ['bahay', 'paaralan']
    }
  ];

  const earlyFallbackIndex = String(earlyActivityKey)
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0) % earlyFallbackSets.length;

  const earlyFallback = earlyFallbackSets[earlyFallbackIndex];

  const prompt = activity.writingTask?.prompt || activity.prompt || 'Isulat ang iyong sagot.';
  const rawTemplate =
    activity.writingTask?.template ||
    activity.template ||
    activity.fillBlank ||
    activity.sentence ||
    (isEarlyGrade && /_{2,}|\\[blank\\]/i.test(prompt) ? prompt : '') ||
    (isEarlyGrade ? earlyFallback.template : '');

  const defaultEarlyWordBank = earlyFallback.words;

  const activityWordBank = asArray(
    activity.wordBank ||
    activity.words ||
    activity.choices ||
    activity.options ||
    activity.writingTask?.wordBank ||
    activity.writingTask?.words ||
    activity.writingTask?.choices ||
    activity.writingTask?.options
  )
    .map(item => {
      if (typeof item === 'string') return item;
      return item?.text || item?.label || item?.value || item?.answer || '';
    })
    .filter(Boolean);

  const earlyWordBank = activityWordBank.length ? activityWordBank : defaultEarlyWordBank;
  const sentenceTemplate = isEarlyGrade
    ? (String(rawTemplate || '').trim() || 'Ang ____ ay ____.')
    : '';

  const blankMatches = sentenceTemplate.match(/_{2,}|\\[blank\\]/gi) || [];
  const blankCount = Math.max(blankMatches.length, 1);

  function formatFilledSentence(template, words) {
    let blankIndex = 0;
    return String(template || '').replace(/_{2,}|\\[blank\\]/gi, () => {
      const word = words[blankIndex];
      blankIndex += 1;
      return word || '____';
    });
  }

  const templateParts = sentenceTemplate.split(/(__+|\\[blank\\])/gi).filter(Boolean);
  const renderedTemplateParts = [];
  let slot = 0;

  templateParts.forEach((part, partIndex) => {
    if (/^(__+|\\[blank\\])$/i.test(part)) {
      renderedTemplateParts.push({
        type: 'blank',
        value: selectedWords[slot] || '____',
        slot,
        key: `blank-${slot}`
      });
      slot += 1;
      return;
    }

    renderedTemplateParts.push({
      type: 'text',
      value: part,
      key: `text-${partIndex}`
    });
  });

  const filledSentence = isEarlyGrade ? formatFilledSentence(sentenceTemplate, selectedWords) : writingText;
  const filledCount = selectedWords.filter(Boolean).length;
  const earlyAnswerReady = filledCount >= blankCount && !filledSentence.includes('____');

  useEffect(() => {
    setWritingText('');
    setSelectedWords([]);
    setEarlyLocked(false);
    setEarlyStatus('');
  }, [earlyActivityKey]);

  function addWord(word) {
    if (earlyLocked) return;

    setEarlyStatus('');
    setSelectedWords(prev => {
      if (prev.length >= blankCount) return prev;
      return [...prev, word];
    });
  }

  function removeLastWord() {
    if (earlyLocked) return;

    setEarlyStatus('');
    setSelectedWords(prev => prev.slice(0, -1));
  }

  function clearAnswer() {
    if (earlyLocked) return;

    setEarlyStatus('');
    setSelectedWords([]);
    setWritingText('');
  }

  async function submitEarlyWriting() {
    setEarlyStatus('Tinitingnan ang sagot...');

    const data = await submitWriting(activity.writingTask?.id, filledSentence, { autoChecked: true });

    if (!data) {
      setEarlyStatus('Subukan muli 😊');
      return;
    }

    const message = data.message ||
      (data.correct
        ? `Tama! +${data.xpAwarded || 10} XP 🌟`
        : data.alreadySubmitted || data.locked
          ? 'Nasagutan mo na ito 🌟'
          : 'Subukan muli 😊');

    setEarlyStatus(message);

    if (data.correct || data.alreadySubmitted || data.locked) {
      setEarlyLocked(true);
    }
  }

  return (
    <div className="card" style={activityBoxStyle}>
      {!isEarlyGrade ? (
        <div
          className="row"
          style={{
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div className="section-title">
            ✍️ Writing Activity
          </div>

          <div className="pill">
            {index + 1}/{total}
          </div>
        </div>
      ) : null}

      {activity.instructions && (
        <div className="muted" style={{ marginBottom: 8 }}>
          {activity.instructions}
        </div>
      )}

      {!isEarlyGrade && (
        <div
          style={{
            padding: 14,
            borderRadius: 16,
            background: '#FFF8CF',
            lineHeight: 1.6,
            marginBottom: 12,
            fontSize: 14,
          }}
        >
          <b>Prompt:</b> {prompt}
        </div>
      )}

      {isEarlyGrade ? (
        <>
          <div
            style={{
              padding: 24,
              borderRadius: 28,
              background: '#FFFFFF',
              border: '2px solid #E7D8FF',
              boxShadow: '0 10px 24px rgba(106, 44, 145, 0.10)',
              marginBottom: 18,
              fontSize: 30,
              fontWeight: 900,
              lineHeight: 1.85,
            }}
          >
            {renderedTemplateParts.map(part => {
              if (part.type === 'blank') {
                return (
                  <span
                    key={part.key}
                    style={{
                      display: 'inline-block',
                      minWidth: 132,
                      padding: '6px 14px',
                      margin: '0 8px',
                      borderRadius: 18,
                      background: part.value === '____' ? '#FFF7D6' : '#E9FBEF',
                      border: part.value === '____' ? '2px dashed #F4B942' : '2px solid #5DBB63',
                      color: part.value === '____' ? '#80621A' : '#1F6B36',
                      textAlign: 'center',
                    }}
                  >
                    {part.value}
                  </span>
                );
              }

              return <span key={part.key}>{part.value}</span>;
            })}
          </div>

          <div
            style={{
              padding: 18,
              borderRadius: 24,
              background: '#F7F2FF',
              border: '1px solid #E7D8FF',
              marginBottom: 14,
            }}
          >
            <div className="row" style={{ alignItems: 'center', gap: 10 }}>
              <b style={{ fontSize: 24 }}>Tapikin ang sagot:</b>
            </div>

            <div className="row" style={{ gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
              {earlyWordBank.map((word, wordIndex) => (
                <button
                  key={`${word}-${wordIndex}`}
                  type="button"
                  className="btn btn-outline"
                  onClick={() => addWord(word)}
                  disabled={earlyLocked || filledCount >= blankCount}
                  style={{
                    borderRadius: 999,
                    minHeight: 72,
                    padding: '14px 24px',
                    fontWeight: 900,
                    fontSize: 24,
                    background: '#FFFFFF',
                    opacity: earlyLocked || filledCount >= blankCount ? 0.65 : 1,
                  }}
                >
                  {word}
                </button>
              ))}
            </div>
          </div>

          {earlyStatus && (
            <div
              style={{
                marginTop: 12,
                padding: 16,
                borderRadius: 22,
                background: earlyLocked ? '#E9FBEF' : '#FFF7D6',
                border: earlyLocked ? '2px solid #5DBB63' : '2px solid #F4B942',
                color: earlyLocked ? '#1F6B36' : '#80621A',
                fontWeight: 900,
                fontSize: 22,
                textAlign: 'center',
              }}
            >
              {earlyStatus}
            </div>
          )}

          <div className="divider" />

          <div className="row" style={{ gap: 14, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn"
              onClick={removeLastWord}
              disabled={earlyLocked || !filledCount}
              style={{
                minHeight: 74,
                minWidth: 220,
                padding: '16px 24px',
                fontSize: 22,
                fontWeight: 900,
                borderRadius: 24,
                border: '2px solid #F1CF63',
                background: '#FFF4C2',
                color: '#7A5A00',
                boxShadow: '0 10px 20px rgba(241, 207, 99, 0.25)',
                opacity: earlyLocked || !filledCount ? 0.65 : 1,
              }}
            >
              ↩️ Tanggalin Huli
            </button>

            <button
              type="button"
              className="btn"
              onClick={clearAnswer}
              disabled={earlyLocked || !filledCount}
              style={{
                minHeight: 74,
                minWidth: 180,
                padding: '16px 24px',
                fontSize: 22,
                fontWeight: 900,
                borderRadius: 24,
                border: '2px solid #F2B6C2',
                background: '#FFE7EC',
                color: '#A63D57',
                boxShadow: '0 10px 20px rgba(242, 182, 194, 0.25)',
                opacity: earlyLocked || !filledCount ? 0.65 : 1,
              }}
            >
              🧹 Burahin
            </button>

            <button
              type="button"
              className="btn"
              onClick={submitEarlyWriting}
              disabled={earlyLocked || !earlyAnswerReady}
              style={{
                minHeight: 74,
                minWidth: 260,
                padding: '16px 28px',
                fontSize: 24,
                fontWeight: 900,
                borderRadius: 24,
                border: '2px solid #24A851',
                background: '#34C759',
                color: '#FFFFFF',
                boxShadow: '0 12px 24px rgba(52, 199, 89, 0.28)',
                opacity: earlyLocked || !earlyAnswerReady ? 0.7 : 1,
              }}
            >
              ✅ Ipasa ang Sagot
            </button>
          </div>
        </>
      ) : (
        <>
          <div
            style={{
              padding: isEarlyGrade ? 16 : 12,
              borderRadius: isEarlyGrade ? 20 : 14,
              background: isEarlyGrade ? '#FFF8CF' : '#F8FAFF',
              border: '1px solid #E1E7FF',
              marginBottom: 12,
              fontWeight: 800,
              lineHeight: 1.45,
            }}
          >
            <strong>Gabay:</strong> Sumagot nang malinaw gamit ang buong pangungusap.
          </div>

          <textarea
            className="input-field"
            rows="5"
            value={writingText}
            onChange={(e) => setWritingText(e.target.value)}
            placeholder="Type your answer here..."
            style={{
              minHeight: 130,
              resize: 'vertical',
              fontSize: 15,
              lineHeight: 1.6,
            }}
          />

          <div className="divider" />

          <button
            type="button"
            className="btn btn-green"
            onClick={() => submitWriting(activity.writingTask?.id, writingText)}
            disabled={!writingText.trim()}
          >
            ✅ Submit Writing
          </button>
        </>
      )}
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
          ? 'Pakinggan muna, pagkatapos pindutin ang Magsalita. Iche-check ng AI speech support ang bigkas mo.'
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
          {isEarlyGrade ? '🔊 Pakinggan' : '🔊 Listen'}
        </button>

        <button className="btn btn-blue" onClick={startSpeechRecognition} disabled={isListening}>
          {isListening
            ? (isEarlyGrade ? '🎙️ Nakikinig...' : '🎙️ Listening...')
            : (isEarlyGrade ? '🎙️ Magsalita' : '🎙️ Start Speaking')}
        </button>

        <button className="btn btn-outline" onClick={() => speechSynthesis.cancel()}>
          {isEarlyGrade ? '⏹ Stop' : '⏹ Stop Audio'}
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

function getWordMatchItemsForGrade(gradeLevel = 4) {
  const earlyItems = [
    { id: 'bahay', word: 'bahay', picture: '🏠', label: 'Bahay' },
    { id: 'aso', word: 'aso', picture: '🐶', label: 'Aso' },
    { id: 'aklat', word: 'aklat', picture: '📚', label: 'Aklat' },
    { id: 'lapis', word: 'lapis', picture: '✏️', label: 'Lapis' },
    { id: 'guro', word: 'guro', picture: '👩‍🏫', label: 'Guro' },
    { id: 'pusa', word: 'pusa', picture: '🐱', label: 'Pusa' },
    { id: 'isda', word: 'isda', picture: '🐟', label: 'Isda' },
    { id: 'puno', word: 'puno', picture: '🌳', label: 'Puno' },
    { id: 'araw', word: 'araw', picture: '☀️', label: 'Araw' },
    { id: 'payong', word: 'payong', picture: '☂️', label: 'Payong' },
  ];

  const upperItems = [
    { id: 'pamayanan', word: 'pamayanan', picture: '🏘️', label: 'Pamayanan' },
    { id: 'kalikasan', word: 'kalikasan', picture: '🌳', label: 'Kalikasan' },
    { id: 'paaralan', word: 'paaralan', picture: '🏫', label: 'Paaralan' },
    { id: 'manggagamot', word: 'manggagamot', picture: '🩺', label: 'Manggagamot' },
    { id: 'aklatan', word: 'aklatan', picture: '📖', label: 'Aklatan' },
    { id: 'malikhain', word: 'malikhain', picture: '🎨', label: 'Malikhain' },
    { id: 'masipag', word: 'masipag', picture: '💪', label: 'Masipag' },
    { id: 'mapagkakatiwalaan', word: 'mapagkakatiwalaan', picture: '🤝', label: 'Mapagkakatiwalaan' },
    { id: 'kaalaman', word: 'kaalaman', picture: '💡', label: 'Kaalaman' },
    { id: 'panitikan', word: 'panitikan', picture: '📜', label: 'Panitikan' },
    { id: 'talasalitaan', word: 'talasalitaan', picture: '🔤', label: 'Talasalitaan' },
    { id: 'pakikipagkapwa', word: 'pakikipagkapwa', picture: '👥', label: 'Pakikipagkapwa' },
  ];

  return Number(gradeLevel || 4) <= 2 ? earlyItems : upperItems;
}

function getWordMatchAttemptItems(gradeLevel = 4) {
  const pool = getWordMatchItemsForGrade(gradeLevel);
  const itemCount = Number(gradeLevel || 4) <= 2 ? 5 : 6;
  return shuffleWordMatchItems(pool).slice(0, Math.min(itemCount, pool.length));
}

function shuffleWordMatchItems(items = []) {
  return [...items].sort(() => Math.random() - 0.5);
}

function playMissionSuccessSound() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99];

    notes.forEach((frequency, index) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, now + index * 0.12);

      gain.gain.setValueAtTime(0.001, now + index * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.18, now + index * 0.12 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.12 + 0.18);

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.start(now + index * 0.12);
      oscillator.stop(now + index * 0.12 + 0.2);
    });
  } catch {
    // Optional sound only.
  }
}

function WordMatchStyles() {
  return (
    <style>{`
      .word-match-game {
        display: grid;
        gap: 18px;
        margin-top: 18px;
      }

      .word-match-guide {
        padding: 16px 18px;
        border-radius: 20px;
        background: #F8FBFF;
        border: 1px solid #DDEBFF;
        color: #38526B;
        font-weight: 900;
        line-height: 1.55;
      }

      .word-match-board {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
        gap: 18px;
      }

      .word-match-column {
        display: grid;
        gap: 12px;
      }

      .word-match-column h3 {
        margin: 0 0 4px;
        color: #17334A;
        font-size: 18px;
      }

      .word-match-word,
      .word-match-picture {
        min-height: 72px;
        border: 2px solid #DDEBFF;
        border-radius: 20px;
        background: #FFFFFF;
        color: #17334A;
        font-weight: 1000;
        cursor: pointer;
        box-shadow: 0 10px 22px rgba(60, 103, 135, .08);
        transition: transform .18s ease, border-color .18s ease, background .18s ease, box-shadow .18s ease;
      }

      .word-match-word {
        padding: 16px 18px;
        text-align: left;
        font-size: 22px;
      }

      .word-match-picture {
        padding: 12px 14px;
        display: grid;
        grid-template-columns: 58px 1fr;
        align-items: center;
        gap: 12px;
        text-align: left;
      }

      .word-match-picture-icon {
        width: 58px;
        height: 58px;
        display: grid;
        place-items: center;
        border-radius: 18px;
        background: #F0FFF4;
        font-size: 32px;
      }

      .word-match-picture-label {
        font-size: 18px;
        font-weight: 1000;
      }

      .word-match-word:hover,
      .word-match-picture:hover {
        transform: translateY(-2px);
        border-color: #9BDDB6;
      }

      .word-match-word.selected {
        border-color: #15A85A;
        background: #ECFFF3;
        box-shadow: 0 12px 26px rgba(21, 168, 90, .15);
      }

      .word-match-word.matched,
      .word-match-picture.matched {
        border-color: #18B865;
        background: #EFFFF5;
        color: #0B743D;
      }

      .word-match-word.matched::after,
      .word-match-picture.matched::after {
        content: " ✓";
      }

      .word-match-feedback {
        padding: 14px 16px;
        border-radius: 18px;
        background: #FFF8E5;
        border: 1px solid #F7D77A;
        color: #7A5200;
        font-weight: 950;
      }

      .word-match-feedback.good {
        background: #EFFFF5;
        border-color: #18B865;
        color: #0B743D;
      }

      .word-match-complete {
        padding: 18px;
        border-radius: 22px;
        background: linear-gradient(135deg, #EFFFF5, #F8FFFB);
        border: 1px solid #BDEFCF;
        color: #0B743D;
        font-weight: 1000;
        text-align: center;
      }

      @media (max-width: 820px) {
        .word-match-board {
          grid-template-columns: 1fr;
        }

        .word-match-word {
          font-size: 20px;
        }
      }

      .mission-complete-overlay {
        position: fixed;
        inset: 0;
        z-index: 1200;
        display: grid;
        place-items: center;
        padding: 24px;
        background: rgba(20, 30, 40, .38);
        backdrop-filter: blur(7px);
        animation: missionFadeIn .18s ease-out;
      }

      .mission-complete-modal {
        width: min(560px, 92vw);
        border-radius: 34px;
        padding: 34px 34px 30px;
        text-align: center;
        background:
          radial-gradient(circle at 6% 10%, rgba(255, 230, 135, .42), transparent 23%),
          radial-gradient(circle at 92% 94%, rgba(42, 201, 119, .18), transparent 28%),
          #FFFEF7;
        border: 3px solid #F6D979;
        box-shadow: 0 26px 80px rgba(25, 47, 72, .28);
        animation: missionPopIn .2s ease-out;
      }

      .mission-complete-icon {
        width: 92px;
        height: 92px;
        margin: 0 auto 16px;
        display: grid;
        place-items: center;
        border-radius: 26px;
        background: #FFF2BD;
        border: 3px solid #FFE08A;
        font-size: 48px;
      }

      .mission-complete-modal h3 {
        margin: 0;
        color: #0B934C;
        font-size: clamp(34px, 4vw, 52px);
        line-height: 1;
      }

      .mission-complete-modal p {
        margin: 14px 0 20px;
        color: #263E59;
        font-size: 18px;
        font-weight: 950;
      }

      .mission-complete-xp {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        margin-bottom: 22px;
        padding: 14px 26px;
        border-radius: 22px;
        background: #FFFFFF;
        border: 2px solid #F6D979;
        color: #12213A;
        font-size: 26px;
        font-weight: 1000;
      }

      .mission-complete-actions {
        display: flex;
        justify-content: center;
        gap: 12px;
        flex-wrap: wrap;
      }

      .mission-complete-btn {
        border: 2px solid #13A85B;
        border-radius: 18px;
        padding: 14px 20px;
        background: #FFFFFF;
        color: #0B934C;
        font-weight: 1000;
        cursor: pointer;
        box-shadow: 0 10px 20px rgba(60, 103, 135, .10);
      }

      .mission-complete-btn.purple {
        border-color: #7C3AED;
        background: linear-gradient(135deg, #8B5CF6, #6D28D9);
        color: #FFFFFF;
      }

      .mission-complete-btn.light {
        border-color: #BDEFCF;
        background: #F6FFF9;
      }

      @keyframes missionFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes missionPopIn {
        from {
          opacity: 0;
          transform: translateY(14px) scale(.96);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @media (max-width: 720px) {
        .mission-complete-modal {
          padding: 28px 20px 24px;
        }

        .mission-complete-actions {
          flex-direction: column;
        }

        .mission-complete-btn {
          width: 100%;
        }
      }

      /* === Word Match complete modal polish START === */

    `}</style>
  );
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
            <strong>🪙 {xp} XP • Level {level} • {shortLevelTitleForXp(xp)}</strong>
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
              <p>Tap Play and Earn XP points!</p>
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
        subtitle=""
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

function StudentMissionPlay({ data, go, selectedGameId = 'word-match', onBack, refresh }) {
  const [missionChoice, setMissionChoice] = useState('');
  const [missionResult, setMissionResult] = useState('');
  const [selectedWordId, setSelectedWordId] = useState('');
  const [matchedPairs, setMatchedPairs] = useState({});
  const [wordMatchMessage, setWordMatchMessage] = useState('');
  const [wordMatchItems, setWordMatchItems] = useState([]);
  const [wordMatchPictures, setWordMatchPictures] = useState([]);
  const [wordMatchToast, setWordMatchToast] = useState(null);
  const [wordMatchCompleteModal, setWordMatchCompleteModal] = useState(false);
  const [missionSaving, setMissionSaving] = useState(false);
  const [missionCompleteData, setMissionCompleteData] = useState(null);
  const student = data?.student || {};
  const gradeLevel = Number(student?.gradeLevel || 4);
  const early = gradeLevel <= 2;
  const xp = Number(student?.xp || 0);
  const games = missionGamesForStudent(data);
  const selectedGame = games.find(game => game.id === selectedGameId) || games[0];
  const demo = getMissionDemo(selectedGame?.id);
  const locked = selectedGame?.status === 'Locked';
  const isWordMatch = selectedGame?.id === 'word-match';
  const fallbackWordMatchItems = getWordMatchAttemptItems(gradeLevel);
  const activeWordMatchItems = wordMatchItems.length ? wordMatchItems : fallbackWordMatchItems;
  const visibleWordMatchPictures = wordMatchPictures.length ? wordMatchPictures : activeWordMatchItems;
  const wordMatchDoneCount = Object.keys(matchedPairs).length;
  const wordMatchComplete = isWordMatch && wordMatchDoneCount === activeWordMatchItems.length;

  useEffect(() => {
    const nextItems = getWordMatchAttemptItems(gradeLevel);

    setMissionChoice('');
    setMissionResult('');
    setSelectedWordId('');
    setMatchedPairs({});
    setWordMatchMessage('');
    setWordMatchItems(nextItems);
    setWordMatchToast(null);
    setWordMatchCompleteModal(false);
    setMissionSaving(false);
    setMissionCompleteData(null);
    setWordMatchPictures(shuffleWordMatchItems(nextItems));
  }, [selectedGame?.id, gradeLevel]);

  useEffect(() => {
    if (!wordMatchToast) return undefined;

    const timer = setTimeout(() => {
      setWordMatchToast(null);
    }, wordMatchToast.type === 'good' ? 1200 : 1500);

    return () => clearTimeout(timer);
  }, [wordMatchToast]);

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
    const nextItems = getWordMatchAttemptItems(gradeLevel);

    setMissionChoice('');
    setMissionResult('');
    setSelectedWordId('');
    setMatchedPairs({});
    setWordMatchMessage('');
    setWordMatchItems(nextItems);
    setWordMatchToast(null);
    setWordMatchCompleteModal(false);
    setMissionSaving(false);
    setMissionCompleteData(null);
    setWordMatchPictures(shuffleWordMatchItems(nextItems));
  };

  const selectWordMatchWord = (itemId) => {
    if (locked || matchedPairs[itemId]) return;
    setSelectedWordId(itemId);
    setWordMatchMessage('');
    setWordMatchToast({ type: 'info', message: 'Piliin ang larawan.' });
  };

  const selectWordMatchPicture = (itemId) => {
    if (locked || matchedPairs[itemId]) return;

    if (!selectedWordId) {
      setWordMatchMessage('');
      setWordMatchToast({ type: 'warn', message: 'Pumili muna ng salita.' });
      return;
    }

    if (selectedWordId === itemId) {
      const matchedItem = activeWordMatchItems.find(item => item.id === itemId);
      const nextPairs = { ...matchedPairs, [itemId]: true };
      setMatchedPairs(nextPairs);
      setSelectedWordId('');
      setWordMatchMessage('');
      setWordMatchToast({ type: 'good', message: 'Tama!' });

      if (Object.keys(nextPairs).length === activeWordMatchItems.length) {
        setMissionResult('');
        setWordMatchToast({ type: 'good', message: 'Mahusay! Lahat ng pares ay tama.' });
      }

      return;
    }

    setWordMatchMessage('');
    setWordMatchToast({ type: 'warn', message: 'Hindi pa tugma. Subukan muli!' });
  };

  const completeWordMatchMission = async () => {
    if (!wordMatchComplete) {
      setWordMatchToast({ type: 'warn', message: 'Tapusin muna ang lahat ng pares.' });
      return;
    }

    setMissionSaving(true);
    setMissionResult('');
    setWordMatchToast(null);

    try {
      const result = await api(`/missions/${selectedGame?.id || 'word-match'}/complete`, {
        method: 'POST',
        body: {
          matchedPairs: Object.keys(matchedPairs),
          gradeLevel
        }
      });

      setMissionCompleteData(result);

      if (typeof refresh === 'function') {
        await refresh();
      }

      setWordMatchCompleteModal(true);
      playMissionSuccessSound();
    } catch (err) {
      setWordMatchToast({
        type: 'warn',
        message: err?.message || 'Hindi na-save ang mission. Subukan muli.'
      });
    } finally {
      setMissionSaving(false);
    }
  };

  const content = (
    <>
      <MissionStyles />
      <WordMatchStyles />

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
                {isWordMatch ? (
                  <div className="word-match-game" aria-label="Word Match game">
                    <div className="word-match-guide">
                      Piliin ang salitang Filipino sa kaliwa, pagkatapos piliin ang tamang larawan sa kanan.
                    </div>

                    {wordMatchToast && (
                      <div className={`word-match-toast ${wordMatchToast.type || 'info'}`}>
                        {wordMatchToast.message}
                      </div>
                    )}

                    <div className="word-match-board">
                      <div className="word-match-column">
                        <h3>Mga Salita</h3>
                        {activeWordMatchItems.map((item, index) => {
                          const matched = Boolean(matchedPairs[item.id]);
                          const toneClass = matched ? `tone-${index % 6}` : '';
                          return (
                            <button
                              type="button"
                              key={item.id}
                              className={`word-match-word ${selectedWordId === item.id ? 'selected' : ''} ${matched ? 'matched' : ''} ${toneClass}`}
                              onClick={() => selectWordMatchWord(item.id)}
                              disabled={matched}
                            >
                              {item.word}
                            </button>
                          );
                        })}
                      </div>

                      <div className="word-match-column">
                        <h3>Mga Larawan</h3>
                        {visibleWordMatchPictures.map(item => {
                          const matched = Boolean(matchedPairs[item.id]);
                          const originalIndex = Math.max(0, activeWordMatchItems.findIndex(row => row.id === item.id));
                          const toneClass = matched ? `tone-${originalIndex % 6}` : '';
                          return (
                            <button
                              type="button"
                              key={item.id}
                              className={`word-match-picture ${matched ? 'matched' : ''} ${toneClass}`}
                              onClick={() => selectWordMatchPicture(item.id)}
                              disabled={matched}
                              aria-label={item.label}
                              title={item.label}
                            >
                              <span className="word-match-picture-icon">{item.picture}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {wordMatchMessage && (
                      <div className={`word-match-feedback ${wordMatchMessage.includes('Tama') ? 'good' : ''}`}>
                        {wordMatchMessage}
                      </div>
                    )}

                    {wordMatchComplete && (
                      <div className="word-match-complete">
                        Lahat ng pares ay tama! Pwede mo nang tapusin ang mission.
                      </div>
                    )}

                    {wordMatchCompleteModal && (
                      <div className="mission-complete-overlay" role="dialog" aria-modal="true" aria-label="Mission complete">
                        <div className="mission-complete-modal">
                          <div className="mission-complete-icon">🏆</div>
                          <h3>Mission Complete!</h3>
                          <p>
                            {missionCompleteData?.message || 'Ang galing mo! Natapos mo ang Word Match.'}
                          </p>
                          <div className="mission-complete-xp">
                            ⚡ {missionCompleteData?.xpAwarded > 0 ? `+${missionCompleteData.xpAwarded} XP Added` : 'XP already awarded'}
                          </div>

                          <div className="mission-complete-actions">
                            <button type="button" className="mission-complete-btn purple" onClick={restartDemo}>
                              🔄 Play Again
                            </button>
                            <button type="button" className="mission-complete-btn" onClick={backToMissions}>
                              🎮 Missions
                            </button>
                            <button type="button" className="mission-complete-btn light" onClick={() => go('screen-student')}>
                              🏠 Home
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
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
                  </>
                )}

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
                  {isWordMatch ? (
                    <button type="button" className="mission-play-action purple" onClick={completeWordMatchMission} disabled={!wordMatchComplete || missionSaving}>
                      {missionSaving ? 'Saving...' : '✅ Complete Mission'}
                    </button>
                  ) : (
                    <button type="button" className="mission-play-action purple" onClick={() => openTab('lessons')}>
                      📖 Go to Lessons
                    </button>
                  )}
                </div>
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
  const groups = asArray(data?.groups).filter(group => String(group?.status || 'active').toLowerCase() !== 'archived');
  const roles = rolesForGradeLevel(data?.student?.gradeLevel);
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id || null);
  const [selectedRoles, setSelectedRoles] = useState({});
  const [doneTasks, setDoneTasks] = useState({});
  const [flowStep, setFlowStep] = useState('start');
  const [showMoreTeams, setShowMoreTeams] = useState(false);
  
  function isTaskDone(task) {
    if (!task) return false;
    return Boolean(
      task.completed ||
      task.completedByStudent ||
      task.verificationStatus === 'approved' ||
      task.status === 'completed'
    );
  }

  function isTaskPending(task) {
    if (!task) return false;
    return Boolean(
      doneTasks[task.id] ||
      task.pendingTeacherCheck ||
      task.verificationStatus === 'pending'
    );
  }

  function isTaskReturned(task) {
    if (!task) return false;
    return Boolean(
      task.returnedByTeacher ||
      task.verificationStatus === 'returned'
    );
  }

  function groupTasks(group) {
    return asArray(group?.tasks);
  }

  function groupDoneCount(group) {
    return groupTasks(group).filter(task => isTaskDone(task)).length;
  }

  function isGroupDone(group) {
    const tasks = groupTasks(group);
    return tasks.length > 0 && tasks.every(task => isTaskDone(task));
  }

  function groupStatusText(group) {
    const tasks = groupTasks(group);
    const doneCount = groupDoneCount(group);
    const leftCount = Math.max(0, tasks.length - doneCount);

    if (!tasks.length) return 'Tap to start';
    if (tasks.some(task => isTaskPending(task))) return 'Waiting for teacher';
    if (tasks.some(task => isTaskReturned(task))) return 'Ask teacher';
    if (!leftCount) return 'Done today';
    if (leftCount === 1) return '1 mission left';
    return `${leftCount} missions left`;
  }

  const activeGroups = groups.filter(group => !isGroupDone(group));
  const finishedGroups = groups.filter(group => isGroupDone(group));
  const visibleActiveGroups = showMoreTeams ? activeGroups : activeGroups.slice(0, 3);
  const hiddenActiveCount = Math.max(0, activeGroups.length - visibleActiveGroups.length);

  useEffect(() => {
    const selectableGroups = activeGroups.length ? activeGroups : groups;

    if (selectableGroups.length && !selectableGroups.some(group => String(group.id) === String(selectedGroupId))) {
      setSelectedGroupId(selectableGroups[0].id);
    }
  }, [groups, activeGroups, selectedGroupId]);

  const selectedGroup = groups.find(group => String(group.id) === String(selectedGroupId)) || activeGroups[0] || groups[0] || null;
  const selectedTasks = groupTasks(selectedGroup);
  const primaryTask = selectedTasks.find(task => !isTaskDone(task)) || selectedTasks[0] || null;
  const extraTaskCount = Math.max(0, selectedTasks.filter(task => !isTaskDone(task)).length - 1);
  const selectedRoleId = selectedGroup ? selectedRoles[selectedGroup.id] : null;
  const selectedRole = roles.find(role => role.id === selectedRoleId);
  const taskRecorded = primaryTask ? isTaskDone(primaryTask) : false;
  const selectedGroupDone = selectedGroup ? isGroupDone(selectedGroup) : false;

  function chooseGroup(groupId) {
    const group = groups.find(item => String(item.id) === String(groupId));
    setSelectedGroupId(groupId);
    setFlowStep(group && isGroupDone(group) ? 'done' : 'role');
  }

  function chooseRole(roleId) {
    if (!selectedGroup) return;
    setSelectedRoles(prev => ({ ...prev, [selectedGroup.id]: roleId }));
    setFlowStep('task');
  }

  async function markTaskDone(taskId) {
    const nextDoneTasks = { ...doneTasks, [taskId]: true };

    setDoneTasks(nextDoneTasks);
    setFlowStep('done');

    await completeGroupTask(taskId);
  }

  return (
    <EarlyStudentChrome
      data={data}
      activeTab="groups"
      go={go}
      icon="👥"
      title="Team Mission"
      subtitle="Choose. Help. Done."
    >
      <style>{`
        .g12-team-flow-shell { display: grid; gap: 16px; padding-bottom: 24px; }
        .g12-team-flow-card { border-radius: 34px; padding: 22px; background: linear-gradient(135deg, #ffffff 0%, #f6fbff 100%); border: 2px solid rgba(21,150,90,0.12); box-shadow: 0 16px 38px rgba(26, 49, 89, 0.10); color: #14223b; }
        .g12-team-flow-hero { display: grid; grid-template-columns: auto 1fr; gap: 16px; align-items: center; }
        .g12-team-mascot { width: 78px; height: 78px; border-radius: 26px; display: grid; place-items: center; font-size: 38px; background: #fff5cf; box-shadow: inset 0 0 0 3px rgba(246,196,83,0.28); }
        .g12-team-flow-card h3 { margin: 0 0 8px; font-size: 36px; line-height: 1.08; color: #14223b; }
        .g12-team-flow-card p { margin: 0; color: #526988; font-size: 22px; line-height: 1.45; font-weight: 800; }
        .g12-team-top-controls { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 12px; align-items: stretch; margin: 16px 0; }
        .g12-team-progress { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 0; }
        .g12-team-progress button { border: 0; min-height: 66px; font-size: 22px; border-radius: 18px; display: grid; place-items: center; text-align: center; background: #ffffff; color: #526988; font-weight: 1000; cursor: pointer; box-shadow: inset 0 0 0 2px rgba(21,150,90,0.10); }
        .g12-team-progress button.active { background: #edf8f1; color: #0f7d49; box-shadow: inset 0 0 0 3px rgba(21,150,90,0.18); }
        .g12-team-progress button:disabled { opacity: 0.55; cursor: not-allowed; }
        .g12-finished-pill-btn { border: 0; min-height: 66px; border-radius: 999px; padding: 0 24px; background: #fff5cf; color: #0f7d49; font-size: 20px; font-weight: 1000; cursor: pointer; white-space: nowrap; box-shadow: inset 0 0 0 2px rgba(246,196,83,0.34), 0 8px 0 rgba(246,196,83,0.18); }
        .g12-finished-pill-btn.active { background: #edf8f1; color: #0f7d49; box-shadow: inset 0 0 0 3px rgba(21,150,90,0.18), 0 8px 0 rgba(21,150,90,0.10); }
        .g12-team-select-grid { display: grid; gap: 12px; margin-top: 16px; }
        .g12-team-select-btn { border: 0; width: 100%; border-radius: 28px; padding: 24px; min-height: 118px; background: #ffffff; color: #14223b; text-align: left; cursor: pointer; display: flex; justify-content: space-between; gap: 14px; align-items: center; box-shadow: inset 0 0 0 2px rgba(21,150,90,0.12), 0 8px 0 rgba(21,150,90,0.08); }
        .g12-team-select-btn.finished { opacity: 0.92; background: linear-gradient(135deg, #f7fffb 0%, #ffffff 100%); }
        .g12-team-select-btn strong { display: block; font-size: 30px; margin-bottom: 4px; }
        .g12-team-select-btn small { display: block; color: #526988; font-size: 20px; font-weight: 900; line-height: 1.35; }
        .g12-team-select-btn .arrow { width: 60px; height: 60px; border-radius: 18px; display: grid; place-items: center; background: #fff5cf; font-size: 24px; flex: 0 0 auto; }
        .g12-team-finished-toggle { border: 0; width: 100%; min-height: 70px; border-radius: 24px; padding: 0 22px; background: #edf8f1; color: #0f7d49; font-size: 22px; font-weight: 1000; cursor: pointer; display: flex; justify-content: space-between; align-items: center; box-shadow: inset 0 0 0 2px rgba(21,150,90,0.14); }
        .g12-role-grid.simple { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 16px; }
        .g12-role-choice.simple { border: 0; min-height: 138px; font-size: 23px; border-radius: 28px; padding: 14px; background: #ffffff; box-shadow: inset 0 0 0 2px rgba(21,150,90,0.10), 0 8px 0 rgba(21,150,90,0.08); cursor: pointer; text-align: center; color: #14223b; font-weight: 1000; }
        .g12-role-choice.simple.selected { background: #fff5cf; box-shadow: inset 0 0 0 4px rgba(246,196,83,0.34), 0 8px 0 rgba(246,196,83,0.44); }
        .g12-role-choice.simple span { display: block; font-size: 48px; margin-bottom: 6px; }
        .g12-role-choice.simple small { display: block; margin-top: 8px; color: #526988; line-height: 1.3; font-size: 17px; }
        .g12-mission-box { margin-top: 16px; border-radius: 30px; padding: 18px; background: #ffffff; box-shadow: inset 0 0 0 2px rgba(21,150,90,0.10); }
        .g12-mission-chip-row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
        .g12-mission-chip { border-radius: 999px; padding: 12px 16px; background: #edf8f1; color: #0f7d49; font-size: 18px; font-weight: 1000; }
        .g12-team-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }
        .g12-soft-btn { border: 0; min-height: 68px; border-radius: 22px; padding: 0 28px; background: #ffffff; color: #526988; font-weight: 1000; font-size: 22px; cursor: pointer; box-shadow: inset 0 0 0 2px rgba(21,150,90,0.10); }
        .g12-team-done { text-align: center; }
        .g12-team-done .done-icon { width: 90px; height: 90px; margin: 0 auto 12px; border-radius: 30px; display: grid; place-items: center; background: #fff5cf; font-size: 46px; box-shadow: inset 0 0 0 3px rgba(246,196,83,0.28); }
        @media (max-width: 680px) {
          .g12-team-flow-hero { grid-template-columns: 1fr; text-align: center; }
          .g12-team-mascot { margin: 0 auto; }
          .g12-team-top-controls { grid-template-columns: 1fr; }
          .g12-team-progress { grid-template-columns: repeat(3, 1fr); }
          .g12-finished-pill-btn { width: 100%; }
          .g12-role-grid.simple { grid-template-columns: 1fr; }
        }
      `}</style>

      <section className="g12-section-card">
        <div className="g12-section-head">
          <div>
            <h2 className="g12-section-title">👥 Team Mission</h2>
            <p className="g12-section-subtitle">Choose. Help. Done.</p>
          </div>
        </div>

        {!groups.length ? (
          <div className="g12-empty">No team mission yet.</div>
        ) : (
          <div className="g12-team-flow-shell">
            <div className="g12-team-top-controls">
              <div className="g12-team-progress" aria-label="Team mission steps">
                <button type="button" className={flowStep === 'start' ? 'active' : ''} onClick={() => setFlowStep('start')}>Choose</button>
                <button type="button" className={flowStep === 'role' ? 'active' : ''} disabled={!selectedGroup || selectedGroupDone} onClick={() => selectedGroup && !selectedGroupDone && setFlowStep('role')}>Job</button>
                <button type="button" className={flowStep === 'task' || flowStep === 'done' ? 'active' : ''} disabled={!selectedGroup} onClick={() => selectedGroup && setFlowStep(selectedGroupDone ? 'done' : 'task')}>Task</button>
              </div>

              <button
                type="button"
                className={`g12-finished-pill-btn ${flowStep === 'finished' ? 'active' : ''}`}
                onClick={() => setFlowStep('finished')}
              >
                ✅ Done {finishedGroups.length ? `(${finishedGroups.length})` : ''}
              </button>
            </div>

            {flowStep === 'finished' && (
              <div className="g12-team-flow-card">
                <div className="g12-team-flow-hero">
                  <div className="g12-team-mascot">🎉</div>
                  <div>
                    <h3>Done Today</h3>
                    <p>{finishedGroups.length ? 'You finished these teams.' : 'No done teams yet.'}</p>
                  </div>
                </div>

                {finishedGroups.length ? (
                  <div className="g12-team-select-grid">
                    {finishedGroups.map(group => (
                      <div
                        className="g12-team-select-btn finished"
                        key={group.id}
                        role="status"
                        aria-label={`${group.name} done today`}
                      >
                        <span>
                          <strong>✅ {group.name}</strong>
                          <small>Done today</small>
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="g12-mission-box" style={{ textAlign: 'center' }}>
                    <h3>Keep going!</h3>
                    <p>Finish a team mission first.</p>
                  </div>
                )}

                <div className="g12-team-actions">
                  <button type="button" className="g12-soft-btn" onClick={() => setFlowStep('start')}>Back</button>
                </div>
              </div>
            )}



            {flowStep === 'start' && (
              <div className="g12-team-flow-card">
                <div className="g12-team-flow-hero">
                  <div className="g12-team-mascot">👥</div>
                  <div>
                    <h3>{activeGroups.length ? 'Pick a team' : 'All done today!'}</h3>
                    <p>{activeGroups.length ? 'Tap one team.' : 'Tap Done to see it.'}</p>
                  </div>
                </div>

                {!activeGroups.length && !!finishedGroups.length && (
                  <div className="g12-mission-box" style={{ textAlign: 'center' }}>
                    <h3>🎉 You did it!</h3>
                    <p>Your team mission is done.</p>
                    <div className="g12-team-actions" style={{ justifyContent: 'center' }}>
                      <button type="button" className="g12-main-btn" onClick={() => setFlowStep('finished')}>
                        See done teams
                      </button>
                    </div>
                  </div>
                )}

                {!!activeGroups.length && (
                  <div className="g12-team-select-grid">
                    {visibleActiveGroups.map(group => (
                      <button
                        type="button"
                        className="g12-team-select-btn"
                        key={group.id}
                        onClick={() => chooseGroup(group.id)}
                      >
                        <span>
                          <strong>👥 {group.name}</strong>
                          <small>{groupStatusText(group)}</small>
                        </span>
                        <span className="arrow">→</span>
                      </button>
                    ))}

                    {hiddenActiveCount > 0 && (
                      <button
                        type="button"
                        className="g12-team-finished-toggle"
                        onClick={() => setShowMoreTeams(prev => !prev)}
                      >
                        <span>{showMoreTeams ? 'Show less' : `Show ${hiddenActiveCount} more`}</span>
                        <span>{showMoreTeams ? '↑' : '↓'}</span>
                      </button>
                    )}
                  </div>
                )}


              </div>
            )}

            {flowStep === 'role' && selectedGroup && (
              <div className="g12-team-flow-card">
                <div className="g12-team-flow-hero">
                  <div className="g12-team-mascot">⭐</div>
                  <div>
                    <h3>Pick a job</h3>
                    <p>Choose your job.</p>
                  </div>
                </div>

                <div className="g12-role-grid simple">
                  {roles.map(role => (
                    <button
                      type="button"
                      key={`${selectedGroup.id}-${role.id}`}
                      className={`g12-role-choice simple ${selectedRoleId === role.id ? 'selected' : ''}`}
                      onClick={() => chooseRole(role.id)}
                    >
                      <span>{role.icon}</span>
                      {role.label}
                      <small>{role.helper}</small>
                    </button>
                  ))}
                </div>

                <div className="g12-team-actions">
                  <button type="button" className="g12-soft-btn" onClick={() => setFlowStep('start')}>Back</button>
                </div>
              </div>
            )}

            {flowStep === 'task' && selectedGroup && (
              <div className="g12-team-flow-card">
                <div className="g12-team-flow-hero">
                  <div className="g12-team-mascot">🧩</div>
                  <div>
                    <h3>Help time!</h3>
                    <p>Do the mission together.</p>
                  </div>
                </div>

                <div className="g12-mission-box">
                  {primaryTask ? (
                    <>
                      <h3>{primaryTask.title}</h3>
                      <p>{primaryTask.description || selectedGroup.description || 'Complete the activity together with your group.'}</p>
                      <div className="g12-mission-chip-row">
                        {selectedRole && <span className="g12-mission-chip">Job: {selectedRole.icon} {selectedRole.label}</span>}
                        {!!primaryTask.xpReward && <span className="g12-mission-chip">+{primaryTask.xpReward} XP</span>}
                        {extraTaskCount > 0 && <span className="g12-mission-chip">{extraTaskCount} more</span>}
                      </div>
                    </>
                  ) : (
                    <>
                      <h3>No mission yet</h3>
                      <p>Teacher can add one.</p>
                    </>
                  )}
                </div>

                <div className="g12-team-actions">
                  <button type="button" className="g12-soft-btn" onClick={() => setFlowStep('role')}>Back</button>
                  <button
                    type="button"
                    className="g12-main-btn"
                    disabled={!primaryTask || taskRecorded}
                    onClick={() => primaryTask && markTaskDone(primaryTask.id)}
                  >
                    {isTaskPending(primaryTask)
                      ? 'Waiting for teacher'
                      : taskRecorded
                        ? 'Mission Done'
                        : isTaskReturned(primaryTask)
                          ? 'Ask teacher'
                          : 'I helped my team!'}
                  </button>
                </div>
              </div>
            )}

            {flowStep === 'done' && (
              <div className="g12-team-flow-card g12-team-done">
                <div className="done-icon">🎉</div>
                <h3>{selectedGroupDone ? 'Mission Done!' : 'Waiting for teacher'}</h3>
                <p>{selectedGroupDone ? 'Teacher checked your team mission.' : 'Your teacher will check your work.'}</p>
                <div className="g12-team-actions" style={{ justifyContent: 'center' }}>
                  <button type="button" className="g12-main-btn" onClick={() => setFlowStep('start')}>Back to teams</button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </EarlyStudentChrome>
  );
}

function StudentGroups({ data, go, completeGroupTask }) {
  const early = Number(data?.student?.gradeLevel || 4) <= 2;
  const groups = (data?.groups || []).filter(group => String(group?.status || 'active').toLowerCase() !== 'archived');
  const [taskRoles, setTaskRoles] = useState({});
  const [taskFiles, setTaskFiles] = useState({});
  const [submittedTasks, setSubmittedTasks] = useState({});

  if (early) {
    return <EarlyGroupsScreen data={data} go={go} completeGroupTask={completeGroupTask} />;
  }

  async function submitGroupTask(taskId) {
    const studentRole = String(taskRoles[taskId] || 'Leader').trim();
    const file = taskFiles[taskId] || null;

    if (!studentRole) {
      window.alert('Please type your role in the group before submitting.');
      return;
    }

    if (!file) {
      window.alert('Please upload your group output file before submitting.');
      return;
    }

    setSubmittedTasks(prev => ({ ...prev, [taskId]: true }));
    await completeGroupTask(taskId, { studentRole, file });
  }

  return (
    <Grade46StudentChrome
      data={data}
      activeTab="groups"
      go={go}
      icon="👥"
      title="Group Collaboration"
      subtitle="Submit your group output and role for teacher review."
    >
      <section className="g46-ref-panel">
        <div className="g46-ref-panel-head">
          <div>
            <h2>Group Tasks</h2>
            <p className="g46-ref-muted">Upload your group output, add your role, and wait for your teacher to review it.</p>
          </div>
        </div>

        {groups.map(group => (
          <div className="g46-ref-panel g46-group-card" key={group.id}>
            <div className="g46-ref-panel-head">
              <div>
                <h3>👥 {group.name}</h3>
                <p className="g46-ref-muted">{group.description || 'Collaborative Filipino task.'}</p>
              </div>
              <span className="g46-ref-tag">{group.tasks?.length || 0} task{(group.tasks?.length || 0) === 1 ? '' : 's'}</span>
            </div>

            {(group.tasks || []).map(task => {
              const completion = task.completion || task.completions?.[0] || null;
              const isApproved = completion?.verificationStatus === 'approved';
              const isPending = completion?.verificationStatus === 'pending' || submittedTasks[task.id];
              const isReturned = completion?.verificationStatus === 'returned';
              const isLocked = isApproved || isPending;
              const statusLabel = isApproved ? 'Approved' : isPending ? 'Waiting for teacher check' : isReturned ? 'Returned for revision' : 'Not submitted';
              const isGroupLeader = group.currentStudentIsLeader || group.currentStudentGroupRole === 'leader';
              const submittedRole = taskRoles[task.id] || completion?.studentRole || (isGroupLeader ? 'Leader' : '');
              const submittedFileName = taskFiles[task.id]?.name || completion?.fileName || '';
              const pct = taskCompletionPercent(task, submittedTasks[task.id] || isApproved);
              return (
                <div className="g46-ref-task-row" key={task.id} style={{ gridTemplateColumns: '58px minmax(0, 1fr)', alignItems: 'start' }}>
                  <span className="g46-ref-card-icon">{isApproved ? '🏆' : isPending ? '⏳' : '📝'}</span>
                  <div>
                    <div className="g46-group-task-head">
                      <div>
                        <h3>{task.title}</h3>
                        <p className="g46-ref-muted">Due: {fmtDate(task.dueAt)} • +{task.xpReward || 0} XP</p>
                      </div>
                      <span className={`g46-group-status ${isApproved ? 'approved' : isPending ? 'pending' : isReturned ? 'returned' : 'open'}`}>
                        {statusLabel}
                      </span>
                    </div>

                    <div className="g46-ref-mini-track" style={{ marginTop: 12 }}><span style={{ width: `${pct}%` }} /></div>
                    <div className={`g46-submit-box ${isLocked ? 'submitted' : ''}`}>
                      {!isLocked ? (
                        isGroupLeader ? (
                        <>
                          <div className="g46-submit-box-head">
                            <span className="g46-submit-icon">📤</span>
                            <div>
                              <strong>Submit your task here</strong>
                              <p className="g46-ref-muted">Type your role, upload your group output, then submit it for teacher checking.</p>
                            </div>
                          </div>

                          <div className="g46-submit-grid">
                            <label className="g46-submit-field" htmlFor={`group-role-${task.id}`}>
                              <span>My Role in the Group</span>
                              <input
                                className="input-field"
                                id={`group-role-${task.id}`}
                                placeholder="Example: Leader, Writer, Presenter, Researcher"
                                value={submittedRole}
                                onChange={(event) => setTaskRoles(prev => ({ ...prev, [task.id]: event.target.value }))}
                              />
                            </label>

                            <div className="g46-submit-field">
                              <span>Upload Group Output</span>
                              <input
                                className="g46-file-hidden"
                                id={`group-file-${task.id}`}
                                type="file"
                                onChange={(event) => setTaskFiles(prev => ({ ...prev, [task.id]: event.target.files?.[0] || null }))}
                              />
                              <label className="g46-upload-drop" htmlFor={`group-file-${task.id}`}>
                                <span className="g46-upload-icon">📎</span>
                                <strong>{submittedFileName || 'Click to upload group output'}</strong>
                                <small>{submittedFileName ? 'File selected and ready to submit' : 'PDF, image, document, or screenshot'}</small>
                              </label>
                            </div>
                          </div>

                          <button type="button" className="g46-ref-primary-btn g46-submit-action" onClick={() => submitGroupTask(task.id)}>
                            Submit Group Output
                          </button>
                        </>
                        ) : (
                          <div className="g46-member-waiting">
                            <div className="g46-submit-box-head">
                              <span className="g46-submit-icon">👥</span>
                              <div>
                                <strong>Your group leader will submit the output.</strong>
                                <p className="g46-ref-muted">You can view this task here. Once your leader submits, your teacher will review it for the whole group.</p>
                              </div>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="g46-submitted-summary">
                          <div className="g46-submit-box-head">
                            <span className="g46-submit-icon">{isApproved ? '🏆' : '⏳'}</span>
                            <div>
                              <strong>{isApproved ? 'Group output approved' : 'Group output submitted'}</strong>
                              <p className="g46-ref-muted">
                                {isApproved ? 'Your teacher approved this task and XP has been awarded.' : 'Waiting for your teacher to review your group output.'}
                              </p>
                            </div>
                          </div>

                          <div className="g46-submitted-list">
                            <div>
                              <span>Role</span>
                              <strong>{submittedRole || '—'}</strong>
                            </div>
                            <div>
                              <span>File</span>
                              <strong>{submittedFileName || 'Uploaded group output'}</strong>
                            </div>
                          </div>
                        </div>
                      )}
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



function TeacherQuizPerformanceMonitor({ quizPerformance = {} }) {
  const summary = quizPerformance.summary || {};
  const rows = asArray(quizPerformance.rows);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAll, setShowAll] = useState(false);

  const statusOptions = ['All', 'Needs Support', 'Developing', 'Proficient', 'Advanced'];
  const normalizedQuery = query.trim().toLowerCase();

  const filteredRows = rows.filter(row => {
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
      <div className="teacher-workspace-heading">
        <div>
          <div className="lms-section-label">Quiz Performance Monitor</div>
          <h2>Student Quiz Attempts</h2>
          <p>Search, filter, and review quiz scores without making the table too long.</p>
        </div>
      </div>

      <div className="teacher-monitor-summary">
        <div><span>Quiz Records</span><strong>{summary.total || rows.length || 0}</strong></div>
        <div><span>Average Best</span><strong>{summary.averageBest || 0}%</strong></div>
        <div><span>Needs Support</span><strong>{summary.needsSupport || 0}</strong></div>
        <div><span>Proficient+</span><strong>{Number(summary.proficient || 0) + Number(summary.advanced || 0)}</strong></div>
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
          placeholder="Search student or quiz..."
          style={{
            minHeight: 46,
            borderRadius: 16,
            border: '1px solid #dce7df',
            padding: '0 16px',
            fontWeight: 800,
            color: '#14223b'
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
        Showing {visibleRows.length} of {filteredRows.length} quiz record{filteredRows.length === 1 ? '' : 's'}
      </div>

      <div className="teacher-table-wrapper" style={{ marginTop: 16 }}>
        <table className="teacher-monitor-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Quiz</th>
              <th>Try 1</th>
              <th>Try 2</th>
              <th>Best</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.length ? visibleRows.map(row => (
              <tr key={row.key || `${row.studentId}-${row.quizId}`}>
                <td>
                  <strong>{row.studentName}</strong>
                  <small>Grade {row.gradeLevel || '—'} • {row.section || 'No section'}</small>
                </td>
                <td>
                  <strong>{row.quizTitle}</strong>
                  <small>{row.quizId}</small>
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
                    <strong>No matching quiz records.</strong>
                    <p>Try another search or filter.</p>
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

function TeacherAssessmentCenter({ lessons = [], rows = [], quizPerformance = {} }) {
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
          <p>Create the lesson first, then use each lesson's Quiz activities as a separate student Quiz tab. Backend saving comes next.</p>
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

      <TeacherQuizPerformanceMonitor quizPerformance={quizPerformance} />

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




function TeacherDashboard({
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
  createLesson,
  deleteLesson,
  exportStudentsCSV,
  exportLogsCSV,
  downloadSummaryReport
}) {
  const [teacherTab, setTeacherTab] = useState('lessons');
  const [openGroupTools, setOpenGroupTools] = useState({});
  const [openGroupProgress, setOpenGroupProgress] = useState({});

  const lessons = data.lessons || [];
  const groups = data.groups || [];
  const students = data.students || [];
  const assignedClasses = data.assignedClasses || [];
  const rows = data.rows || [];
  const stats = data.stats || {};
  const quizPerformance = data.quizPerformance || { summary: {}, rows: [] };
  const pendingGroupChecks = data.pendingGroupChecks || { summary: {}, rows: [] };
  const pendingGroupRows = asArray(pendingGroupChecks.rows);
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

      for (const task of tasks) {
        const completions = task.completions || task.Completions || [];
        const submittedStudentIds = new Set(completions.map(item => Number(item.studentId)));

        const approved = completions.filter(item => item.verificationStatus === 'approved').length;
        const pending = completions.filter(item => item.verificationStatus === 'pending').length;
        const returned = completions.filter(item => item.verificationStatus === 'returned').length;
        const notSubmitted = Math.max(0, members.length - submittedStudentIds.size);

        const details = members.map(member => {
          const student = member.Student || member.student || member;
          const completion = completions.find(item => Number(item.studentId) === Number(student.id));
          const status = completion?.verificationStatus || 'not_submitted';

          return {
            studentId: student.id,
            studentName: student.name || 'Student',
            status
          };
        });

        rows.push({
          key: `${group.id}-${task.id}`,
          groupId: group.id,
          groupName: group.name,
          taskId: task.id,
          taskTitle: task.title || 'Group task',
          xpReward: task.xpReward || 0,
          approved,
          pending,
          returned,
          notSubmitted,
          memberCount: members.length,
          details
        });
      }
    }

    return rows;
  }

  function groupProgressStatusLabel(status) {
    if (status === 'approved') return 'Approved';
    if (status === 'pending') return 'Pending Check';
    if (status === 'returned') return 'Returned';
    return 'Not Submitted';
  }

  return (
    <div className="teacher-redesign-page">
      <TeacherRedesignStyles />

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
              <small>Guro</small>
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
              className={`teacher-sidebar-button ${teacherTab === 'assessments' ? 'active' : ''}`}
              type="button"
              onClick={() => openTab('assessments')}
            >
              <span>🧠</span>
              <strong>Assessments</strong>
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
                      <div className="teacher-group-item-top">
                        <div>
                          <strong>{row.studentName}</strong>
                          <p>{row.groupName} • {row.taskTitle}</p>
                          <p className="g46-ref-muted">
                            Grade {row.gradeLevel || '-'} {row.section ? `• ${row.section}` : ''} • +{row.taskXp || 0} XP
                          </p>
                        </div>
                        <span className="lms-mini-pill">Waiting</span>
                      </div>

                      <div className="teacher-group-submission-evidence">
                        <div>
                          <span>Submitted By / Role</span>
                          <strong>{row.studentName || 'Leader'} • {row.studentRole || 'Leader'}</strong>
                        </div>
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
                            Open File
                          </a>
                        )}
                      </div>

                      <button
                        type="button"
                        className="lms-main-action full"
                        onClick={() => approveGroupTaskCompletion(row)}
                      >
                        Approve
                      </button>
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
                  <div className="lms-section-label">Group Task Progress</div>
                  <h3>Submitted, Approved, and Pending Work</h3>
                </div>
                <span className="lms-mini-pill">📌 {groupProgressRows.length} task{groupProgressRows.length === 1 ? '' : 's'}</span>
              </div>

              {groupProgressRows.length ? (
                <div className="teacher-group-progress-list">
                  {groupProgressRows.map(row => {
                    const isOpen = Boolean(openGroupProgress[row.key]);

                    return (
                      <div className="teacher-group-progress-card" key={row.key}>
                        <div className="teacher-group-progress-card-top">
                          <div>
                            <strong>{row.groupName}</strong>
                            <p>{row.taskTitle} • +{row.xpReward} XP</p>
                          </div>

                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => toggleGroupProgress(row.key)}
                          >
                            {isOpen ? 'Hide Details' : 'View Details'}
                          </button>
                        </div>

                        <div className="teacher-group-progress-stats">
                          <div className="teacher-group-progress-stat">
                            <span>Approved</span>
                            <strong>{row.approved}</strong>
                          </div>

                          <div className="teacher-group-progress-stat">
                            <span>Pending</span>
                            <strong>{row.pending}</strong>
                          </div>

                          <div className="teacher-group-progress-stat">
                            <span>Not Submitted</span>
                            <strong>{row.notSubmitted}</strong>
                          </div>
                        </div>

                        {isOpen && (
                          <div className="teacher-group-progress-details">
                            {row.details.length ? row.details.map(detail => (
                              <div className="teacher-group-progress-student" key={`${row.key}-${detail.studentId}`}>
                                <span>{detail.studentName}</span>
                                <span className="lms-mini-pill">{groupProgressStatusLabel(detail.status)}</span>
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
                  <strong>No group task progress yet.</strong>
                  <p>Add tasks to your groups first. Student submissions will appear here after they complete a group task.</p>
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
    subject: 'Pagbasa',
    title: '',
    xpReward: 25,
    duration: '10 minuto',
    instructions: '',
    passage: ''
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
      setLessonPlanFileStatus('Lesson material uploaded. Students will see this file inside the lesson after you publish.');
      setAiDraftNotice('Slides attached. Add lesson details and activities, then publish the lesson.');
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

    const payload = {
      gradeLevel: Number(lessonDraft.gradeLevel),
      subject: lessonDraft.subject,
      title: lessonDraft.title.trim(),
      xpReward: Number(lessonDraft.xpReward || 25),
      duration: '10 minuto',
      instructions: lessonDraft.instructions || null,
      passage: lessonDraft.passage || null,
      activities: preparedActivities
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
    clearLessonPlanSource();
    setBuilderTab('lessons');
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
    { type: 'mcq', label: 'Quiz', icon: '?', className: 'choice-mcq' },
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
                <h2>Lesson Material</h2>

              </div>
            </div>

            <div className="teacher-field">
              <label>Upload Lesson Slides or PDF</label>
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
              <label>Optional Teacher Notes</label>
              <textarea
                className="input-field"
                value={lessonPlanText}
                onChange={(e) => setLessonPlanText(e.target.value)}
                placeholder={"Upload lesson slides above, or paste short teacher notes here.\n\nExample:\nGrade 1 Filipino\nPaksa: Mga Pangngalan\nLayunin: Natutukoy ang pangngalan sa pangungusap.\nGawain: Basahin ang maikling kwento at sagutan ang tanong."}
                rows="7"
                style={{ minHeight: 190, lineHeight: 1.55 }}
              />
            </div>

            <div className="row" style={{ marginTop: 14, gap: 10 }}>
              <button className="lms-main-action" type="button" onClick={generateFromLessonPlan}>
                Use Notes to Fill Lesson Details
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
                placeholder="e.g. Pangngalan at mga Halimbawa"
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
          <section className="teacher-side-card lms-live-preview builder-side-preview">
            <div className="teacher-design-heading">
              <div className="teacher-design-step">👁</div>
              <div>
                <h2>Student Preview</h2>
                <p>Check the flow students will follow before publishing.</p>
              </div>
            </div>

            <div className="lms-preview-card-inner" style={{ display: 'grid', gap: 14 }}>
              <div className="lms-preview-badges">
                <span className="lms-preview-badge">{subjectMeta?.icon || '📘'} {lessonDraft.subject}</span>
                <span className="lms-preview-badge">Grade {lessonDraft.gradeLevel}</span>
                <span className="lms-preview-badge">⭐ {lessonDraft.xpReward || 0} XP</span>
              </div>

              <div>
                <div className="lms-preview-title">
                  {lessonDraft.title || 'Untitled Lesson'}
                </div>
                <div className="g46-ref-muted" style={{ marginTop: 6 }}>
                  Students will move through this lesson step by step.
                </div>
              </div>

              <div style={{ display: 'grid', gap: 12 }}>
                {[
                  {
                    step: '1',
                    icon: '📎',
                    title: 'Lesson Material',
                    value: draftMaterialInfo
                      ? `${draftMaterialInfo.fileType} • ${draftMaterialInfo.fileName}`
                      : 'No material attached yet',
                    note: draftMaterialInfo
                      ? 'Students see this first in the Lesson Material step.'
                      : 'Upload a PPT, PPTX, or PDF in the Lesson Material tab.'
                  },
                  {
                    step: '2',
                    icon: '📖',
                    title: 'Read Lesson',
                    value: lessonDraft.instructions ? 'Instructions ready' : 'No instructions yet',
                    note: lessonDraft.passage
                      ? `${String(lessonDraft.passage).slice(0, 120)}${String(lessonDraft.passage).length > 120 ? '...' : ''}`
                      : 'Add a passage or short reading text in Lesson Details.'
                  },
                  {
                    step: '3',
                    icon: '🧩',
                    title: 'Practice Activities',
                    value: `${validActivities.length} activity block${validActivities.length === 1 ? '' : 's'}`,
                    note: `Mini Quiz: ${draftMiniQuizCount ? '1 question inside lesson' : 'not added'} • Quiz Time: ${formatQuizItemCount(draftQuizItemCount)}`
                  },
                  {
                    step: '4',
                    icon: '✍️',
                    title: 'Evidence Tasks',
                    value: `${draftWritingCount} writing • ${draftSpeechCount} speech`,
                    note: draftOtherActivityCount
                      ? `${draftOtherActivityCount} other activity block${draftOtherActivityCount === 1 ? '' : 's'} included.`
                      : 'Add writing, speech, vocabulary, matching, or info cards as needed.'
                  },
                  {
                    step: '5',
                    icon: '✅',
                    title: 'Complete Lesson',
                    value: 'Student submits progress',
                    note: 'After completing required activities, the student can finish the lesson.'
                  }
                ].map(item => (
                  <div
                    key={item.title}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '44px 1fr',
                      gap: 12,
                      padding: 14,
                      borderRadius: 18,
                      background: '#FFFFFF',
                      border: '1px solid #DCEFE2'
                    }}
                  >
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 14,
                        display: 'grid',
                        placeItems: 'center',
                        background: '#F0FDF4',
                        color: '#166534',
                        fontWeight: 950
                      }}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span className="g46-ref-tag">Step {item.step}</span>
                        <strong style={{ color: '#17324D' }}>{item.title}</strong>
                      </div>
                      <div style={{ marginTop: 6, fontWeight: 900, color: '#315241' }}>{item.value}</div>
                      <div className="g46-ref-muted" style={{ marginTop: 4, lineHeight: 1.45 }}>{item.note}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  padding: 14,
                  borderRadius: 18,
                  background: '#FFF8DF',
                  border: '1px solid #F4E7AA',
                  color: '#6B4B00',
                  fontWeight: 850,
                  lineHeight: 1.45
                }}
              >
                Preview note: Grade 3-6 students see this as a guided flow. Grade 1-2 keeps its original child-friendly lesson UI.
              </div>
            </div>
          </section>

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
  assignTeacherClass,
  removeTeacherAssignment,
  reload
}) {
  const [adminTab, setAdminTab] = useState('overview');

  const stats = data.stats || {};
  const students = data.students || [];
  const archivedStudents = data.archivedStudents || [];
  const teachers = data.teachers || [];
  const archivedTeachers = data.archivedTeachers || [];
  const teacherAssignments = data.teacherAssignments || [];
  const classOptions = data.classOptions || [];
  const logs = data.logs || [];

  const [assignGradeFilter, setAssignGradeFilter] = useState('');
  const sectionOptions = [...new Set(
    classOptions
      .filter(option => !assignGradeFilter || Number(option.gradeLevel) === Number(assignGradeFilter))
      .map(option => option.section)
      .filter(Boolean)
  )];

  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  function openTab(tab, targetId = 'admin-dashboard-workspace') {
    setAdminTab(tab);
    setTimeout(() => scrollTo(targetId), 0);
  }

  function assignmentLabel(assignment) {
    return `Grade ${assignment.gradeLevel} • ${assignment.section}`;
  }

  function teacherNameForAssignment(assignment) {
    return assignment.Teacher?.name || teachers.find(t => Number(t.id) === Number(assignment.teacherId))?.name || 'Teacher';
  }

  return (
    <div className="teacher-redesign-page">
      <TeacherRedesignStyles />

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
            <div className="teacher-profile-avatar">🛡️</div>
            <div className="teacher-profile-text">
              <strong>Admin</strong>
              <small>System Manager</small>
            </div>
            <span>⌄</span>
          </div>
        </div>
      </header>

      <main className="teacher-main-content teacher-main-content-clean" id="admin-dashboard-top">
        <div className="teacher-sidebar-layout">
          <aside className="teacher-side-nav" aria-label="Admin workspace navigation">
            <div className="teacher-side-nav-title">
              <span>🛡️</span>
              <strong>Admin Panel</strong>
            </div>

            <button className={`teacher-sidebar-button ${adminTab === 'overview' ? 'active' : ''}`} type="button" onClick={() => openTab('overview')}>
              <span>📊</span>
              <strong>Overview</strong>
            </button>

            <button className={`teacher-sidebar-button ${adminTab === 'add' ? 'active' : ''}`} type="button" onClick={() => openTab('add')}>
              <span>➕</span>
              <strong>Add Accounts</strong>
            </button>

            <button className={`teacher-sidebar-button ${adminTab === 'assignments' ? 'active' : ''}`} type="button" onClick={() => openTab('assignments')}>
              <span>🏫</span>
              <strong>Teacher Assignments</strong>
            </button>

            <button className={`teacher-sidebar-button ${adminTab === 'students' ? 'active' : ''}`} type="button" onClick={() => openTab('students')}>
              <span>👨‍🎓</span>
              <strong>Students</strong>
            </button>

            <button className={`teacher-sidebar-button ${adminTab === 'teachers' ? 'active' : ''}`} type="button" onClick={() => openTab('teachers')}>
              <span>👩‍🏫</span>
              <strong>Teachers</strong>
            </button>

            <button className={`teacher-sidebar-button ${adminTab === 'archives' ? 'active' : ''}`} type="button" onClick={() => openTab('archives')}>
              <span>🗃️</span>
              <strong>Archives</strong>
            </button>

            <button className={`teacher-sidebar-button ${adminTab === 'logs' ? 'active' : ''}`} type="button" onClick={() => openTab('logs')}>
              <span>🧾</span>
              <strong>Audit Logs</strong>
            </button>

            <button className="teacher-sidebar-button danger" type="button" onClick={logout}>
              <span>⇥</span>
              <strong>Logout</strong>
            </button>
          </aside>

          <div className="teacher-main-workarea" id="admin-dashboard-workspace">
            <section className="teacher-clean-hero">
              <div className="teacher-clean-hero-copy">
                <div className="lms-section-label">Admin Workspace</div>
                <h1>Admin Dashboard</h1>
                <p>Manage accounts, class assignments, archives, and system activity in one place.</p>
              </div>

              <div className="teacher-clean-actions">
                <button className="lms-view-button" type="button" onClick={() => openTab('assignments')}>
                  🏫 Assign Teachers
                </button>
                <button className="teacher-logout-btn light" type="button" onClick={reload}>
                  🔄 Refresh
                </button>
              </div>
            </section>

            {adminTab === 'overview' && (
              <>
                <section className="teacher-clean-metrics" aria-label="Admin quick stats">
                  <button className="teacher-clean-metric" type="button" onClick={() => openTab('students')}>
                    <span className="metric-icon blue">👥</span>
                    <span><small>Total Users</small><strong>{stats.users || 0}</strong></span>
                  </button>

                  <button className="teacher-clean-metric" type="button" onClick={() => openTab('students')}>
                    <span className="metric-icon green">👨‍🎓</span>
                    <span><small>Students</small><strong>{stats.students || students.length || 0}</strong></span>
                  </button>

                  <button className="teacher-clean-metric" type="button" onClick={() => openTab('teachers')}>
                    <span className="metric-icon yellow">👩‍🏫</span>
                    <span><small>Teachers</small><strong>{stats.teachers || teachers.length || 0}</strong></span>
                  </button>

                  <button className="teacher-clean-metric" type="button" onClick={() => openTab('assignments')}>
                    <span className="metric-icon purple">🏫</span>
                    <span><small>Assignments</small><strong>{teacherAssignments.length}</strong></span>
                  </button>
                </section>

                <section className="teacher-workspace-card">
                  <div className="teacher-workspace-heading">
                    <div>
                      <div className="lms-section-label">System Overview</div>
                      <h2>Account Management Summary</h2>
                      <p>Use this area to check active accounts, teacher assignments, and recent maintenance actions.</p>
                    </div>
                  </div>

                  <div className="teacher-monitor-summary">
                    <div><span>Active Students</span><strong>{students.length}</strong></div>
                    <div><span>Active Teachers</span><strong>{teachers.length}</strong></div>
                    <div><span>Archived Accounts</span><strong>{archivedStudents.length + archivedTeachers.length}</strong></div>
                  </div>

                  <div className="lms-empty-line" style={{ marginTop: 14 }}>
                    Tip: Assign teachers to grade and section first so their dashboard, reports, quizzes, and student monitoring stay properly filtered.
                  </div>
                </section>
              </>
            )}

            {adminTab === 'add' && (
              <section className="teacher-clean-panel">
                <div className="teacher-form-grid">
                  <div className="teacher-workspace-card">
                    <div className="teacher-workspace-heading">
                      <div>
                        <div className="lms-section-label">Student Account</div>
                        <h2>Add Student</h2>
                        <p>Create a learner account with grade and section details.</p>
                      </div>
                    </div>

                    <input className="input-field" id="a-stu-id" placeholder="Student ID (unique)" />
                    <div style={{ height: 10 }} />
                    <input className="input-field" id="a-stu-name" placeholder="Name" />
                    <div style={{ height: 10 }} />
                    <input className="input-field" id="a-stu-grade" type="number" min="1" max="6" placeholder="Grade (1-6)" />
                    <div style={{ height: 10 }} />
                    <input className="input-field" id="a-stu-section" placeholder="Section" />
                    <div style={{ height: 10 }} />
                    <input className="input-field" id="a-stu-password" placeholder="Password (default student123)" />
                    <div className="divider" />

                    <button className="lms-main-action full" type="button" onClick={addStudent}>
                      Add Student
                    </button>
                  </div>

                  <div className="teacher-workspace-card">
                    <div className="teacher-workspace-heading">
                      <div>
                        <div className="lms-section-label">Teacher Account</div>
                        <h2>Add Teacher</h2>
                        <p>Create a teacher login, then assign handled classes in the next section.</p>
                      </div>
                    </div>

                    <input className="input-field" id="a-t-username" placeholder="Username (unique)" />
                    <div style={{ height: 10 }} />
                    <input className="input-field" id="a-t-name" placeholder="Teacher Name" />
                    <div style={{ height: 10 }} />
                    <input className="input-field" id="a-t-code" placeholder="Employee Code" />
                    <div style={{ height: 10 }} />
                    <input className="input-field" id="a-t-password" placeholder="Password" />
                    <div className="divider" />

                    <button className="lms-main-action full" type="button" onClick={addTeacher}>
                      Add Teacher
                    </button>
                  </div>
                </div>
              </section>
            )}

            {adminTab === 'assignments' && (
              <section className="teacher-workspace-card">
                <div className="teacher-workspace-heading">
                  <div>
                    <div className="lms-section-label">Teacher Assignment</div>
                    <h2>Assign Teacher to Class</h2>
                    <p>Choose which grade and section each teacher handles. This controls their monitoring, reports, quiz attempts, and student lists.</p>
                  </div>
                </div>

                <div className="teacher-tool-box">
                  <div className="teacher-form-grid">
                    <select className="input-field" id="a-assign-teacher" defaultValue="">
                      <option value="">Select teacher</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>

                    <select className="input-field" id="a-assign-grade" value={assignGradeFilter} onChange={(event) => setAssignGradeFilter(event.target.value)}>
                      <option value="">Grade</option>
                      {[1, 2, 3, 4, 5, 6].map(grade => (
                        <option key={grade} value={grade}>Grade {grade}</option>
                      ))}
                    </select>

                    <select className="input-field" id="a-assign-section" defaultValue="">
                      <option value="">Section</option>
                      {sectionOptions.map(section => (
                        <option key={section} value={section}>{section}</option>
                      ))}
                      {!sectionOptions.length && (
                        <option value="" disabled>No sections found for this grade</option>
                      )}
                    </select>

                    <button className="lms-main-action" type="button" onClick={assignTeacherClass}>
                      Save Assignment
                    </button>
                  </div>
                </div>

                <div className="divider" />

                <div className="teacher-groups-grid">
                  {teacherAssignments.map(assignment => (
                    <div className="teacher-group-item" key={assignment.id}>
                      <div className="teacher-group-item-top">
                        <div>
                          <strong>{teacherNameForAssignment(assignment)}</strong>
                          <p>{assignmentLabel(assignment)}</p>
                        </div>
                        <span className="lms-mini-pill">Assigned</span>
                      </div>

                      <button className="btn btn-danger btn-sm" type="button" onClick={() => removeTeacherAssignment(assignment.id)}>
                        Remove
                      </button>
                    </div>
                  ))}

                  {!teacherAssignments.length && (
                    <div className="lms-empty-line">No teacher class assignments yet.</div>
                  )}
                </div>
              </section>
            )}

            {adminTab === 'students' && (
              <section className="teacher-workspace-card">
                <div className="teacher-workspace-heading">
                  <div>
                    <div className="lms-section-label">Learner Accounts</div>
                    <h2>Students</h2>
                    <p>Manage active student accounts, reset passwords, and reset progress when needed.</p>
                  </div>

                  <button className="lms-view-button" type="button" onClick={reload}>
                    Refresh
                  </button>
                </div>

                <div className="admin-clean-table">
                  <div className="admin-clean-table-head">
                    <span>Student</span>
                    <span>Grade & Section</span>
                    <span>Status</span>
                    <span>Actions</span>
                  </div>

                  {students.map(s => (
                    <div className="admin-clean-table-row" key={s.id}>
                      <span>
                        <strong>{s.name}</strong>
                        <small>{s.studentCode}</small>
                      </span>

                      <span>
                        <strong>Grade {s.gradeLevel}</strong>
                        <small>{s.section}</small>
                      </span>

                      <span>
                        <span className="lms-mini-pill">{s.status}</span>
                      </span>

                      <span className="admin-clean-actions">
                        <button className="btn btn-outline btn-sm" onClick={() => resetStudentPassword(s.id, s.name)}>Reset Password</button>
                        <button className="btn btn-outline btn-sm" onClick={() => resetStudent(s.id)}>Reset Progress</button>
                        <button className="btn btn-danger btn-sm" onClick={() => archiveStudent(s.id)}>Archive</button>
                      </span>
                    </div>
                  ))}

                  {!students.length && (
                    <div className="lms-empty-line">No active students.</div>
                  )}
                </div>
              </section>
            )}

            {adminTab === 'teachers' && (
              <section className="teacher-workspace-card">
                <div className="teacher-workspace-heading">
                  <div>
                    <div className="lms-section-label">Teacher Accounts</div>
                    <h2>Teachers</h2>
                    <p>Manage teacher accounts and check their assigned classes.</p>
                  </div>
                </div>

                <div className="teacher-groups-grid">
                  {teachers.map(t => {
                    const assignments = teacherAssignments.filter(a => Number(a.teacherId) === Number(t.id));

                    return (
                      <div className="teacher-group-item" key={t.id}>
                        <div className="teacher-group-item-top">
                          <div>
                            <strong>{t.name}</strong>
                            <p>{t.employeeCode} • {t.status}</p>
                            <p className="g46-ref-muted">
                              Handles: {assignments.length ? assignments.map(assignmentLabel).join(', ') : 'No class assigned yet'}
                            </p>
                          </div>
                          <span className="lms-mini-pill">Teacher</span>
                        </div>

                        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                          <button className="btn btn-outline btn-sm" onClick={() => resetTeacherPassword(t.id, t.name)}>Reset Password</button>
                          <button className="btn btn-danger btn-sm" onClick={() => archiveTeacher(t.id)}>Archive</button>
                        </div>
                      </div>
                    );
                  })}

                  {!teachers.length && (
                    <div className="lms-empty-line">No active teachers.</div>
                  )}
                </div>
              </section>
            )}

            {adminTab === 'archives' && (
              <section className="teacher-clean-panel">
                <div className="teacher-workspace-card">
                  <div className="teacher-workspace-heading">
                    <div>
                      <div className="lms-section-label">Archived Accounts</div>
                      <h2>Archived Students</h2>
                      <p>Archived students cannot log in, but their records remain saved.</p>
                    </div>
                  </div>

                  {archivedStudents.map(s => (
                    <div className="teacher-group-item" key={s.id}>
                      <div className="teacher-group-item-top">
                        <div>
                          <strong>{s.name}</strong>
                          <p>{s.studentCode} • Grade {s.gradeLevel} • {s.section}</p>
                        </div>
                        <button className="btn btn-green btn-sm" onClick={() => reactivateStudent(s.id)}>Reactivate</button>
                      </div>
                    </div>
                  ))}

                  {!archivedStudents.length && (
                    <div className="lms-empty-line">No archived students.</div>
                  )}
                </div>

                <div className="teacher-workspace-card" style={{ marginTop: 16 }}>
                  <div className="teacher-workspace-heading">
                    <div>
                      <div className="lms-section-label">Archived Accounts</div>
                      <h2>Archived Teachers</h2>
                      <p>Archived teachers cannot log in, but their records remain saved.</p>
                    </div>
                  </div>

                  {archivedTeachers.map(t => (
                    <div className="teacher-group-item" key={t.id}>
                      <div className="teacher-group-item-top">
                        <div>
                          <strong>{t.name}</strong>
                          <p>{t.employeeCode} • Archived</p>
                        </div>
                        <button className="btn btn-green btn-sm" onClick={() => reactivateTeacher(t.id)}>Reactivate</button>
                      </div>
                    </div>
                  ))}

                  {!archivedTeachers.length && (
                    <div className="lms-empty-line">No archived teachers.</div>
                  )}
                </div>
              </section>
            )}

            {adminTab === 'logs' && (
              <section className="teacher-workspace-card">
                <div className="teacher-workspace-heading">
                  <div>
                    <div className="lms-section-label">Audit Trail</div>
                    <h2>Account History</h2>
                    <p>Read-only record of recent admin and system maintenance actions.</p>
                  </div>
                </div>

                <div className="admin-clean-table admin-audit-table">
                  <div className="admin-clean-table-head">
                    <span>Action</span>
                    <span>Entity</span>
                    <span>Record</span>
                    <span>Date</span>
                  </div>

                  {logs.map(log => (
                    <div className="admin-clean-table-row" key={log.id}>
                      <span>
                        <strong>{log.action}</strong>
                      </span>

                      <span>
                        <strong>{log.entityType || 'Record'}</strong>
                      </span>

                      <span>
                        <span className="lms-mini-pill">#{log.entityId || '-'}</span>
                      </span>

                      <span>
                        <small>{fmtDate(log.createdAt)}</small>
                      </span>
                    </div>
                  ))}

                  {!logs.length && (
                    <div className="lms-empty-line">No audit logs yet.</div>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

