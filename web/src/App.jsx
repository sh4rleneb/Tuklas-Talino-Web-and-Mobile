import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  clearStudentNavigationState,
  isRestorableStudentScreen,
  readStudentNavigationState,
  saveStudentNavigationState
} from './utils/studentNavigationState.js';
import {
  api,
  downloadFile,
  getAdminReauthHeaders,
  uploadForm,
} from './api/client';
import { speakText, stopSpeech } from './services/tts.service';
import { useAuth } from './contexts/AuthContext';
import QuizzesPage from './pages/Student/QuizzesPage';
import QuizPlayer from './components/student/quizzes/QuizPlayer';
import QuizResults from './components/student/quizzes/QuizResults';
import StructuredLessonFlow, { StructuredLessonKnowCard, getStructuredLessonLessonsAudioText, getStructuredLessonKnowAudioText, getStructuredLessonSectionText } from './components/student/StructuredLessonFlow';
import { AVATARS, SUBJECTS, MISSION_GAMES } from './constants/studentConstants';
import { asArray, displayDue, effectivenessBand, fmtDate, getBestQuizAttempt, lessonAssessmentProfile, lessonXp, levelForXp, levelTitleForXp, shortLevelTitleForXp, masteryFromPercent, rolesForGradeLevel, subjectTheme, taskCompletionPercent, xpPercent } from './utils/studentHelpers';
import { EarlyStudentSubpageStyles, Grade46ReferenceStyles, MissionStyles } from './components/styles/StyleBlocks';
import { ProgressBar, Screen, Stat } from './components/common/CommonUI';
import { AdminLogin, StudentLogin, TeacherLogin } from './pages/Login/LoginScreens';
import { ChangePasswordScreen, HomeScreen, LandingScreen } from './pages/Home/HomeScreens';
import TeacherDashboard from './pages/Teacher/TeacherDashboard';
import AdminDashboard from './pages/Admin/AdminDashboard';
import StartupLoader from './components/common/StartupLoader';
import StudentGroupSubmissionReview from './components/student/StudentGroupSubmissionReview';
import Grade46MobileNav from './components/student/Grade46MobileNav';

const TUKLAS_KAAGAPAY_BADGE_IMAGE = '/badges/kaagapay-sa-gawain.png';
const TUKLAS_BITUIN_BADGE_IMAGE = '/badges/bituin-sa-pagsagot.png';
const TUKLAS_HENYO_BADGE_IMAGE = '/badges/henyo-sa-pagsusulit.png';

function isTuklasKaagapayBadge(badge) {
  const name = String(badge?.name || '').trim().toLowerCase();
  const code = String(badge?.code || '').trim().toLowerCase();
  return name === 'kaagapay sa gawain' || code === 'group_1' || code.includes('kaagapay');
}

const TUKLAS_BADGE_IMAGE_BY_CODE = {
  first_lesson: '/badges/unang-hakbang.png',
  firstlesson: '/badges/unang-hakbang.png',
  reader: '/badges/batang-mambabasa.png',
  reader_3: '/badges/batang-mambabasa.png',
  quiz_perfect: '/badges/henyo-sa-pagsusulit.png',
  writing_3: '/badges/bituin-sa-pagsagot.png',
  speech_3: '/badges/boses-bituin.png',
  group_1: '/badges/kaagapay-sa-gawain.png',
  xp_100: '/badges/bituin-ng-kasipagan.png',
  level_10: '/badges/tuklas-kampeon.png',
};

const TUKLAS_BADGE_IMAGE_BY_NAME = {
  'unang hakbang': '/badges/unang-hakbang.png',
  'batang mambabasa': '/badges/batang-mambabasa.png',
  'henyo sa pagsusulit': '/badges/henyo-sa-pagsusulit.png',
  'bituin sa pagsagot': '/badges/bituin-sa-pagsagot.png',
  'boses bituin': '/badges/boses-bituin.png',
  'kaagapay sa gawain': '/badges/kaagapay-sa-gawain.png',
  'bituin ng kasipagan': '/badges/bituin-ng-kasipagan.png',
  'tuklas kampeon': '/badges/tuklas-kampeon.png',
};

function getTuklasBadgeImage(badge) {
  const name = String(badge?.name || '').trim().toLowerCase();
  const code = String(badge?.code || '').trim().toLowerCase();
  return TUKLAS_BADGE_IMAGE_BY_CODE[code] || TUKLAS_BADGE_IMAGE_BY_NAME[name] || '';
}

function isTuklasHenyoBadge(badge) {
  const name = String(badge?.name || '').trim().toLowerCase();
  const code = String(badge?.code || '').trim().toLowerCase();
  return name === 'henyo sa pagsusulit' || code === 'quiz_perfect';
}

function isTuklasBituinBadge(badge) {
  const name = String(badge?.name || '').trim().toLowerCase();
  const code = String(badge?.code || '').trim().toLowerCase();
  return name === 'bituin sa pagsagot' || code === 'writing_3' || code.includes('writing') || code.includes('sagot');
}

function TuklasBadgeVisual({ badge, fallback = '🏅', size = 72 }) {
  const mappedTuklasBadgeImage = getTuklasBadgeImage(badge);
  if (mappedTuklasBadgeImage) {
    return (
      <img
        src={mappedTuklasBadgeImage}
        alt={badge?.name || 'Gantimpala'}
        style={{ width: size, height: size, objectFit: 'contain', display: 'inline-block' }}
      />
    );
  }

  if (isTuklasHenyoBadge(badge)) {
    return (
      <img
        src={TUKLAS_HENYO_BADGE_IMAGE}
        alt={badge?.name || 'Henyo sa Quizzes'}
        style={{ width: size, height: size, objectFit: 'contain', display: 'inline-block' }}
      />
    );
  }

  if (isTuklasBituinBadge(badge)) {
    return (
      <img
        src={TUKLAS_BITUIN_BADGE_IMAGE}
        alt={badge?.name || 'Bituin sa Pagsagot'}
        style={{ width: size, height: size, objectFit: 'contain', display: 'inline-block' }}
      />
    );
  }

  if (isTuklasKaagapayBadge(badge)) {
    return (
      <img
        src={TUKLAS_KAAGAPAY_BADGE_IMAGE}
        alt={badge?.name || 'Kaagapay sa Gawain'}
        style={{ width: size, height: size, objectFit: 'contain', display: 'inline-block' }}
      />
    );
  }

  return <>{badge?.icon || fallback}</>;
}


const STUDENT_SUBJECT_DISPLAY_LABELS = {
  'Oral Comm': 'Komunikasyong Pagsasalita',
  'Oral Communication': 'Komunikasyong Pagsasalita',
  'Pasalitang Komunikasyon': 'Komunikasyong Pagsasalita',
};

function formatStudentSubjectDisplay(subject) {
  const value = String(subject || '').trim();
  return STUDENT_SUBJECT_DISPLAY_LABELS[value] || subject || 'Filipino';
}

function studentSubjectMatches(subject, filter) {
  const rawSubject = String(subject || '').trim();
  const rawFilter = String(filter || '').trim();

  if (!rawFilter || rawFilter === 'ALL' || rawFilter === 'Lahat') return true;
  if (rawSubject === rawFilter) return true;

  return formatStudentSubjectDisplay(rawSubject) === formatStudentSubjectDisplay(rawFilter);
}




function subjectIconSrc(subject = "") {
  const key = String(subject || "").toLowerCase();
  if (key.includes("pagbasa")) return "/category-pagbasa.png";
  if (key.includes("bokabularyo")) return "/category-bokabularyo.png";
  if (key.includes("panitikan")) return "/category-panitikan.png";
  if (key.includes("oral")) return "/category-oralcomm.png";
  if (key.includes("pagsulat")) return "/category-pagsulat.png";
  return "";
}

function SubjectImageIcon({ subject = "", src = "", className = "subject-img-icon", fallback = "📚" }) {
  const resolvedSrc = src || subjectIconSrc(subject);
  if (!resolvedSrc) return <>{fallback}</>;
  return <img src={resolvedSrc} alt="" className={className} aria-hidden="true" />;
}


function read(id) {
  return document.getElementById(id)?.value?.trim() || '';
}






function Notification({ notice }) {
  if (!notice) return <div className="notif-wrap" id="notif-wrap" />;

  const isRewardsNotice = notice.type === 'rewards';

  return (
    <div className="notif-wrap" id="notif-wrap">
      <div className={`notif ${notice.type || ''}`}>
        <span>{notice.text}</span>
        {isRewardsNotice && (
          <span className="notif-reward-dots" aria-hidden="true">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        )}
      </div>
    </div>
  );
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


function playBadgeUnlockSound() {
  if (typeof window === 'undefined') return;

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    const master = ctx.createGain();

    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.12, now + 0.025);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
    master.connect(ctx.destination);

    [
      { freq: 659.25, start: 0.00, end: 0.13 },
      { freq: 783.99, start: 0.12, end: 0.27 },
      { freq: 987.77, start: 0.25, end: 0.46 }
    ].forEach(note => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, now + note.start);

      gain.gain.setValueAtTime(0.0001, now + note.start);
      gain.gain.exponentialRampToValueAtTime(0.55, now + note.start + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.end);

      osc.connect(gain);
      gain.connect(master);

      osc.start(now + note.start);
      osc.stop(now + note.end + 0.04);
    });

    window.setTimeout(() => {
      try {
        ctx.close();
      } catch (_) {
        // Ignore close errors.
      }
    }, 900);
  } catch (_) {
    // Badge sound is optional.
  }
}

function showBadgeUnlockPopup(badges = []) {
  if (typeof document === 'undefined') return;

  const earnedBadges = uniqueBadgesForDisplay(
    Array.isArray(badges)
      ? badges.filter(Boolean)
      : badges
        ? [badges]
        : []
  );

  if (!earnedBadges.length) return;

  ensureBadgeUnlockPopupStyles();
  playBadgeUnlockSound();

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
      const name = escapeBadgeText(badgeDisplayName(badge) || 'Bagong Gantimpala');
      const description = escapeBadgeText(badgeDisplayDescription(badge));

      card.innerHTML = `
        <div class="badge-unlock-icon">${icon}</div>
        <div>
          <p class="badge-unlock-eyebrow">Nabuksang Gantimpala!</p>
          <h3 class="badge-unlock-title">${name}</h3>
          <p class="badge-unlock-desc">${description}</p>
        </div>
        <button class="badge-unlock-close" type="button" aria-label="Isara ang popup ng gantimpala">×</button>
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
  const restoredStudentNavigationRef = useRef(false);
  const [notice, setNotice] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState('🦊');
  const [studentDash, setStudentDash] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedQuizzes, setSelectedQuizzes] = useState(null);
  const [quizResult, setQuizResult] = useState(null);
  const [quizAttempts, setQuizAttempts] = useState({});
  const [quizPlaySession, setQuizPlaySession] = useState(0);
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
    const t = setTimeout(() => setNotice(null), notice.durationMs || 3600);
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
          const savedStudentNavigation = readStudentNavigationState();

          if (!savedStudentNavigation || !isRestorableStudentScreen(savedStudentNavigation.screen)) {
            setScreen('screen-student');
          }
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

  function notify(text, type = '', durationMs) { setNotice({ text, type, durationMs }); }
  function rememberStudentScreen(id, extra = {}) {
    if (user?.role !== 'student') return;
    if (!isRestorableStudentScreen(id)) return;

    const payload = {
      screen: id,
      subjectFilter,
      ...extra
    };

    if (id !== 'screen-lesson' && extra.selectedLessonId === undefined) {
      payload.selectedLessonId = null;
    }

    if (id === 'screen-lesson' && extra.selectedLessonId === undefined && selectedLesson?.id) {
      payload.selectedLessonId = selectedLesson.id;
    }

    if (!['screen-stu-quiz-play', 'screen-stu-quiz-result'].includes(id) && extra.selectedQuizzesId === undefined) {
      payload.selectedQuizzesId = null;
    }

    if (['screen-stu-quiz-play', 'screen-stu-quiz-result'].includes(id) && extra.selectedQuizzesId === undefined && selectedQuizzes?.id) {
      payload.selectedQuizzesId = selectedQuizzes.id;
    }

    if (id !== 'screen-stu-mission-play' && extra.selectedMissionGameId === undefined) {
      payload.selectedMissionGameId = null;
    }

    if (id === 'screen-stu-mission-play' && extra.selectedMissionGameId === undefined && selectedMissionGameId) {
      payload.selectedMissionGameId = selectedMissionGameId;
    }

    saveStudentNavigationState(payload);
  }

  function go(id) {
    setScreen(id);
    rememberStudentScreen(id);
  }

  useEffect(() => {
    if (user?.role !== 'student') return;
    if (!isRestorableStudentScreen(screen)) return;

    rememberStudentScreen(screen);
  }, [subjectFilter]);

  function getStudentQuizzesForRestore() {
    const quizzes = [];

    try {
      quizzes.push(...asArray(buildStudentQuizzes(studentDash)));
    } catch {
      // If quiz building fails for any reason, fallback sources below still keep the app safe.
    }

    quizzes.push(...asArray(studentDash?.quizzes));

    const unique = new Map();

    for (const quiz of quizzes) {
      const key = String(quiz?.id || quiz?.quizId || '');
      if (key && !unique.has(key)) {
        unique.set(key, quiz);
      }
    }

    return Array.from(unique.values());
  }

  function findStudentQuizzesForRestore(quizId) {
    const targetId = String(quizId || '');
    if (!targetId) return null;

    return getStudentQuizzesForRestore().find(quiz =>
      String(quiz?.id || quiz?.quizId || '') === targetId
    ) || null;
  }
    function getQuizMaxAttempts(quiz, fallback = 2) {
      const raw =
        quiz?.maxAttempts ??
        quiz?.max_attempts ??
        quiz?.activity?.maxAttempts ??
        quiz?.dataJson?.maxAttempts ??
        quiz?.data_json?.maxAttempts ??
        fallback;

      const parsed = Number(raw);

      if (!Number.isInteger(parsed)) {
        return fallback;
      }

      return Math.min(10, Math.max(1, parsed));
    }



  function getLatestQuizAttemptForRestore(quiz) {
    if (!quiz?.id) return null;

    const attemptsByQuizzes = studentDash?.quizAttempts || quizAttempts || {};
    const attempts = asArray(attemptsByQuizzes?.[quiz.id]);

    const highestAttemptNo = Math.max(
      0,
      ...attempts.map((attempt) => Number(attempt?.attemptNo || 0))
    );

    const latestAttempt =
      attempts.find((attempt) => Number(attempt?.attemptNo || 0) === highestAttemptNo) ||
      attempts[attempts.length - 1] ||
      attempts[0] ||
      null;

    return latestAttempt
      ? {
          ...latestAttempt,
          attemptHistory: attempts,
          maxAttempts: getUnlimitedAwareQuizMaxAttempts(quiz),
          maxAttemptsReached:
          getUnlimitedAwareQuizMaxAttempts(quiz) > 0 &&
          attempts.length >=
            getUnlimitedAwareQuizMaxAttempts(quiz),
        }
      : null;
  }

  useEffect(() => {
    if (restoredStudentNavigationRef.current) return;
    if (booting || user?.role !== 'student' || !studentDash) return;

    const saved = readStudentNavigationState();
    restoredStudentNavigationRef.current = true;

    if (!saved) return;

    if (saved.subjectFilter) {
      setSubjectFilter(saved.subjectFilter);
    }

    if (saved.screen === 'screen-lesson') {
      const savedLessonId = Number(saved.selectedLessonId || 0);
      const lesson = (studentDash.lessons || []).find(item => Number(item.id) === savedLessonId);

      if (lesson) {
        openLesson(lesson);
        return;
      }

      setScreen('screen-lessons');
      saveStudentNavigationState({
        screen: 'screen-lessons',
        selectedLessonId: null,
        selectedQuizzesId: null,
        selectedMissionGameId: null,
        subjectFilter: saved.subjectFilter || subjectFilter
      });
      return;
    }

    if (saved.screen === 'screen-stu-quiz-play') {
      const quiz = findStudentQuizzesForRestore(saved.selectedQuizzesId);

      if (quiz) {
        setSelectedQuizzes(quiz);
        setQuizResult(null);
        setScreen('screen-stu-quiz-play');
        saveStudentNavigationState({
          screen: 'screen-stu-quiz-play',
          selectedQuizzesId: quiz.id,
          selectedLessonId: null,
          selectedMissionGameId: null,
          subjectFilter: saved.subjectFilter || subjectFilter
        });
        return;
      }

      setScreen('screen-stu-quizzes');
      saveStudentNavigationState({
        screen: 'screen-stu-quizzes',
        selectedQuizzesId: null,
        selectedLessonId: null,
        selectedMissionGameId: null,
        subjectFilter: saved.subjectFilter || subjectFilter
      });
      return;
    }

    if (saved.screen === 'screen-stu-quiz-result') {
      const quiz = findStudentQuizzesForRestore(saved.selectedQuizzesId);
      const restoredResult = quiz ? getLatestQuizAttemptForRestore(quiz) : null;

      if (quiz && restoredResult) {
        setSelectedQuizzes(quiz);
        setQuizResult(restoredResult);
        setScreen('screen-stu-quiz-result');
        saveStudentNavigationState({
          screen: 'screen-stu-quiz-result',
          selectedQuizzesId: quiz.id,
          selectedLessonId: null,
          selectedMissionGameId: null,
          subjectFilter: saved.subjectFilter || subjectFilter
        });
        return;
      }

      setScreen('screen-stu-quizzes');
      saveStudentNavigationState({
        screen: 'screen-stu-quizzes',
        selectedQuizzesId: null,
        selectedLessonId: null,
        selectedMissionGameId: null,
        subjectFilter: saved.subjectFilter || subjectFilter
      });
      return;
    }

    if (saved.screen === 'screen-stu-mission-play') {
      if (saved.selectedMissionGameId) {
        setSelectedMissionGameId(saved.selectedMissionGameId);
        setScreen('screen-stu-mission-play');
        saveStudentNavigationState({
          screen: 'screen-stu-mission-play',
          selectedMissionGameId: saved.selectedMissionGameId,
          selectedLessonId: null,
          selectedQuizzesId: null,
          subjectFilter: saved.subjectFilter || subjectFilter
        });
        return;
      }

      setScreen('screen-stu-missions');
      saveStudentNavigationState({
        screen: 'screen-stu-missions',
        selectedMissionGameId: null,
        selectedLessonId: null,
        selectedQuizzesId: null,
        subjectFilter: saved.subjectFilter || subjectFilter
      });
      return;
    }

    if (isRestorableStudentScreen(saved.screen)) {
      setScreen(saved.screen);
    }
  }, [booting, user?.role, studentDash]);

  async function safeRun(fn, fallback = 'May nangyaring error. Pakisubukan muli.', noticeDurationMs) {
  try {
    setLoading(true);
    return await fn();
  } catch (err) {
    const rawMessage = String(err?.message || '').trim();
    const message =
      !rawMessage || rawMessage === 'Request failed'
        ? fallback
        : rawMessage;

    notify(message, 'bad', noticeDurationMs);
    return null;
  } finally {
    setLoading(false);
  }
}

  async function doLogout() {
    authLogout();
    clearStudentNavigationState();
    restoredStudentNavigationRef.current = false;
    setStudentDash(null);
    setSelectedLesson(null);
    setSelectedQuizzes(null);
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
        password = read('stu-password');
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
  notify('Kailangan munang palitan ang temporary PIN/password bago magpatuloy.', 'warn');
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
    }, 'Hindi makapag-login.', 11000);
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
    setQuizAttempts(data.quizAttempts || {});
    if (data.student?.avatar) setSelectedAvatar(data.student.avatar);
  }

  async function refreshStudent() {
    await safeRun(async () => { await loadStudentDashboard(); });
  }

  async function openLesson(lesson) {
    await safeRun(async () => {
      const data = await api(`/lessons/${lesson.id}`);
      const hydratedLesson = {
        ...data.lesson,
        progress: data.lesson?.progress || lesson?.progress || null,
        completed: Boolean(lesson?.completed || data.lesson?.completed)
      };

      setSelectedLesson(hydratedLesson);
      setLessonFeedback('');
      go('screen-lesson');
      saveStudentNavigationState({
        screen: 'screen-lesson',
        selectedLessonId: hydratedLesson.id,
        subjectFilter
      });
    });
  }

  function openQuiz(quiz) {
    if (!quiz) return;
    setSelectedQuizzes(quiz);
    setQuizResult(null);
    setQuizPlaySession(prev => prev + 1);
    go('screen-stu-quiz-play');
    saveStudentNavigationState({
      screen: 'screen-stu-quiz-play',
      selectedQuizzesId: quiz.id,
      selectedLessonId: null,
      selectedMissionGameId: null,
      subjectFilter
    });
  }

  function openQuizResult(quiz) {
    if (!quiz) return;

    const attempts = asArray(quizAttempts?.[quiz.id]);
    const highestAttemptNo = Math.max(
      0,
      ...attempts.map((attempt) => Number(attempt?.attemptNo || 0))
    );
    const latestAttempt =
      attempts.find((attempt) => Number(attempt?.attemptNo || 0) === highestAttemptNo) ||
      attempts[attempts.length - 1] ||
      attempts[0];

    if (!latestAttempt) {
      openQuiz(quiz);
      return;
    }

    setSelectedQuizzes(quiz);
    setQuizResult({
      ...latestAttempt,
      attemptHistory: attempts,
      maxAttempts: getUnlimitedAwareQuizMaxAttempts(quiz),
      maxAttemptsReached:
          getUnlimitedAwareQuizMaxAttempts(quiz) > 0 &&
          attempts.length >=
            getUnlimitedAwareQuizMaxAttempts(quiz),
    });
    go('screen-stu-quiz-result');
    saveStudentNavigationState({
      screen: 'screen-stu-quiz-result',
      selectedQuizzesId: quiz?.id || selectedQuizzes?.id || null,
      selectedLessonId: null,
      selectedMissionGameId: null,
      subjectFilter
    });
  }

  async function submitQuizzes(quiz, answers) {
    if (!quiz) return null;

    const maxQuizAttempts = getUnlimitedAwareQuizMaxAttempts(quiz);
    const studentId = studentDash?.student?.id || user?.student?.id || 'demo-student';
    const existingAttempts = quizAttempts?.[quiz.id] || [];

    if (maxQuizAttempts > 0 && existingAttempts.length >= maxQuizAttempts) {
      const latestAttempt = existingAttempts[existingAttempts.length - 1] || getBestQuizAttempt(quizAttempts, quiz.id);

      if (latestAttempt) {
        setQuizResult({
          ...latestAttempt,
          maxAttempts: maxQuizAttempts,
          maxAttemptsReached: true,
        });
      }

      notify(`Nagamit mo na ang ${maxQuizAttempts} pagsubok sa pagsusulit. Balikan na lang ang iyong mga sagot.`);
      go('screen-stu-quiz-result');
    saveStudentNavigationState({
      screen: 'screen-stu-quiz-result',
      selectedQuizzesId: quiz?.id || selectedQuizzes?.id || null,
      selectedLessonId: null,
      selectedMissionGameId: null,
      subjectFilter
    });
      return latestAttempt || null;
    }

    const result = gradeQuizAttempt(quiz, answers, existingAttempts.length + 1);
    const lessonId = quiz.lessonId || selectedLesson?.id;

    let finalResult = {
      ...result,
      maxAttempts: maxQuizAttempts,
      maxAttemptsReached: maxQuizAttempts > 0 && result.attemptNo >= maxQuizAttempts,
      backendSaved: false,
      newBadges: [],
    };

    const localUpdatedAttempts = appendQuizAttempt(studentId, quizAttempts, quiz.id, finalResult);
    const localAttemptHistory = localUpdatedAttempts?.[quiz.id] || [];

    finalResult = {
      ...finalResult,
      attemptHistory: localAttemptHistory,
      maxAttemptsReached: maxQuizAttempts > 0 && localAttemptHistory.length >= maxQuizAttempts,
    };

    setQuizAttempts(localUpdatedAttempts);
    setQuizResult(finalResult);
    go('screen-stu-quiz-result');
    saveStudentNavigationState({
      screen: 'screen-stu-quiz-result',
      selectedQuizzesId: quiz?.id || selectedQuizzes?.id || null,
      selectedLessonId: null,
      selectedMissionGameId: null,
      subjectFilter
    });

    if (lessonId) {
      window.setTimeout(() => {
        notify('Paparating na ang mga gantimpala!', 'rewards');
      }, 250);
    }

    if (!lessonId) {
      notify(`Naipasa ang pagsusulit: ${finalResult.score}/${finalResult.total} (${finalResult.percent}%).`);
      return finalResult;
    }

    api(`/lessons/${lessonId}/quiz-result`, {
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
    })
      .then((data) => {
        const saved = data?.quizResult || {};
        const backendAttemptsForQuizzes = Array.isArray(data?.quizAttempts) ? data.quizAttempts : null;

        const syncedAttempts = backendAttemptsForQuizzes
          ? { ...localUpdatedAttempts, [quiz.id]: backendAttemptsForQuizzes }
          : localUpdatedAttempts;

        const syncedHistory = syncedAttempts?.[quiz.id] || [];

        const syncedResult = {
          ...finalResult,
          attemptNo: Number(saved.attemptNo || finalResult.attemptNo),
          xpAwarded: Number(saved.xpAwarded || 0),
          xpPossible: Number(saved.xpPossible || 0),
          xpAlreadyAwarded: Boolean(saved.xpAlreadyAwarded),
          backendSaved: true,
          newBadges: data?.newBadges || [],
          attemptHistory: syncedHistory,
          maxAttemptsReached: maxQuizAttempts > 0 && syncedHistory.length >= maxQuizAttempts,
        };

        setQuizAttempts(syncedAttempts);
        setQuizResult(syncedResult);

        if (syncedResult.xpAwarded) {
          notify(`Naipasa ang pagsusulit: ${syncedResult.score}/${syncedResult.total} (${syncedResult.percent}%). +${syncedResult.xpAwarded} XP`);
        } else if (syncedResult.xpAlreadyAwarded) {
          notify(`Naipasa ang pagsusulit: ${syncedResult.score}/${syncedResult.total} (${syncedResult.percent}%). Naitala ang ulit na pagsubok, walang dagdag na XP.`);
        } else {
          notify(`Naipasa ang pagsusulit: ${syncedResult.score}/${syncedResult.total} (${syncedResult.percent}%).`);
        }

        showBadgeUnlockPopup(syncedResult?.newBadges);

        loadStudentDashboard().catch((error) => {
          console.warn('[TuklasTalino] Dashboard refresh after quiz failed:', error);
        });
      })
      .catch((err) => {
        const message = err?.message || 'Naitala sa device ang pagsusulit, pero hindi naitala sa server.';
        console.warn('[TuklasTalino] Quizzes backend save failed:', err);
        notify(`${message} Iskor: ${finalResult.score}/${finalResult.total} (${finalResult.percent}%).`, 'bad');
      });

    return finalResult;
  }

  async function completeLesson(options = {}) {
    if (!selectedLesson) return null;

    const { stay = false, silent = false } = options || {};

    return await safeRun(async () => {
      const data = await api(`/lessons/${selectedLesson.id}/complete`, {
        method: 'POST',
        body: {}
      });

      setSelectedLesson(prev =>
        prev
          ? {
              ...prev,
              completed: true
            }
          : prev
      );

      if (!silent) {
        notify(
          data.xpAwarded
            ? `🎉 Natapos! +${data.xpAwarded} XP`
            : 'Nagawa mo na ang araling ito.'
        );
        showBadgeUnlockPopup(data?.newBadges);
      }

      if (data?.xpAwarded) {
        playMissionSuccessSound();
      }

      try {
        await loadStudentDashboard();
      } catch (error) {
        console.warn(
          '[TuklasTalino] Lesson completed, but dashboard refresh failed:',
          error
        );
      }

      if (!stay) {
        go('screen-student');
      }

      return data;
    }, 'Hindi makumpleto ang aralin. Pakisubukan muli.');
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
            ? `Tamang Sagot! +${data.xpAwarded} XP`
            : data.correct
              ? 'Tamang Sagot! Naibigay na ang XP para sa tanong na ito.'
              : 'Hindi pa tama. Balikan ang sagot.',
          data.correct ? 'good' : 'bad'
        );
      }

      showBadgeUnlockPopup(data?.newBadges);

      return data;
    }, 'Hindi ma-save ang sagot. Pakisubukan muli.');
  }

  async function submitWriting(taskId, answer, options = {}) {
  if (!selectedLesson) return null;

  if (!answer || answer.trim().length < 2) {
    setLessonFeedback('✍️ Pakisulat muna ang iyong sagot bago ipasa.');
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
      setLessonFeedback(data?.message || '✍️ Naipasa na ang gawaing pagsulat.');
    } else {
      setLessonFeedback('');
    }

    showBadgeUnlockPopup(data?.newBadges);

    await loadStudentDashboard();

    return data;
  }, 'Hindi ma-save ang sagot. Pakisubukan muli.');
}

  async function submitSpeech(taskId, transcript, score, options = {}) {
  if (!selectedLesson) return null;

  if (!transcript || transcript.trim().length < 2) {
    const message = 'Subukan munang magsalita bago ipasa.';
    setLessonFeedback(`🎤 ${message}`);
    notify(message, 'warn');
    return null;
  }

  if (options?.validateOnly) {
    try {
      return await api(
        `/lessons/${selectedLesson.id}/speech/validate`,
        {
          method: 'POST',
          body: {
            taskId,
            transcript
          }
        }
      );
    } catch (err) {
      const rawMessage = String(
        err?.message || ''
      ).trim();

      notify(
        rawMessage ||
          'Hindi masuri ang nakilalang pagbigkas. Pakisubukan muli.',
        'bad'
      );

      return null;
    }
  }

  return await safeRun(async () => {
    const data = await api(`/lessons/${selectedLesson.id}/speech`, {
      method: 'POST',
      body: {
        taskId,
        transcript,
        score
      }
    });

    const successMessage = 'Naipasa na ang iyong pagbigkas.';
    setLessonFeedback('');
    showBadgeUnlockPopup(data?.newBadges);
    await loadStudentDashboard();

    return data;
  }, 'Hindi maisave ang pagbigkas. Pakisubukan muli.');
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
    const [dash, monitoring, groups, students, lessons, quizPerformance, pendingGroupChecks, teacherReviews] = await Promise.all([
      api('/teachers/dashboard'),
      api('/teachers/monitoring/stats'),
      api('/groups'),
      api('/students?status=active'),
      api('/lessons'),
      api('/teachers/quiz-performance'),
      api('/groups/task-completions/pending'),
      api('/teachers/reviews/writing-speech')
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
      pendingGroupChecks: pendingGroupChecks || { summary: {}, rows: [] },
      teacherReviews: teacherReviews || { summary: {}, writing: [], speech: [] }
    });
  }


  async function teacherSearchExistingStudents(query = '') {
    const search = String(query || '').trim();

    if (search.length < 2) {
      notify(
        'Enter at least two letters of the student name.',
        'warn'
      );
      return [];
    }

    try {
      const data = await api(
        `/students?status=active&q=${encodeURIComponent(search)}`
      );

      return Array.isArray(data?.students)
        ? data.students
        : Array.isArray(data)
          ? data
          : [];
    } catch (error) {
      notify(
        error?.message || 'Unable to search for students.',
        'bad'
      );
      return [];
    }
  }

  async function teacherCreateSection(gradeLevel, section) {
    const normalizedGrade = Number(gradeLevel);
    const normalizedSection = String(section || '')
      .normalize('NFKC')
      .replace(/\s+/g, ' ')
      .trim();

    if (
      !Number.isInteger(normalizedGrade) ||
      normalizedGrade < 1 ||
      normalizedGrade > 6
    ) {
      notify('The selected student has an invalid grade level.', 'warn');
      return null;
    }

    if (normalizedSection.length < 2) {
      notify(
        'Enter a section name with at least two characters.',
        'warn'
      );
      return null;
    }

    if (normalizedSection.length > 80) {
      notify(
        'The section name must not exceed 80 characters.',
        'warn'
      );
      return null;
    }

    return await safeRun(async () => {
      const data = await api('/students/teacher-sections', {
        method: 'POST',
        body: {
          gradeLevel: normalizedGrade,
          section: normalizedSection,
        },
      });

      await loadTeacherDashboard();

      notify(
        data?.message ||
        `${normalizedSection} is ready to use for Grade ${normalizedGrade}.`
      );

      return data;
    }, 'Unable to add the new section.');
  }

  async function teacherUpdateStudentSection(
    studentId,
    section
  ) {
    const normalizedStudentId = Number(studentId);
    const normalizedSection = String(section || '')
      .replace(/\s+/g, ' ')
      .trim();

    if (
      !Number.isInteger(normalizedStudentId) ||
      normalizedStudentId <= 0
    ) {
      notify('Select an existing student first.', 'warn');
      return null;
    }

    if (!normalizedSection) {
      notify('Select a section first.', 'warn');
      return null;
    }

    return await safeRun(async () => {
      const data = await api(
        `/students/${normalizedStudentId}/section`,
        {
          method: 'PATCH',
          body: {
            section: normalizedSection,
          },
        }
      );

      await loadTeacherDashboard();

      notify(
        `${data?.student?.name || 'Student'} is now assigned to ${normalizedSection}.`
      );

      return data;
    }, 'Unable to update the student section.');
  }


async function teacherApproveGroupTaskCompletion(row, teacherFeedback = '') {
    if (!row?.groupTaskId || !row?.studentId) {
      notify('Missing group task approval details.');
      return;
    }

    await safeRun(async () => {
      const data = await api(`/groups/tasks/${row.groupTaskId}/completions/${row.studentId}/approve`, {
        method: 'POST',
        body: { teacherFeedback: String(teacherFeedback || '').trim() }
      });

      await loadTeacherDashboard();

      notify(data.xpAwarded
        ? `${row.studentName || 'Student'} earned +${data.xpAwarded} XP after teacher approval.`
        : `${row.studentName || 'Mag-aaral'} ay naaprubahan na.`
      );
    });
  }

  async function teacherReturnGroupTaskCompletion(row, teacherFeedback = '') {
    if (!row?.groupTaskId || !row?.studentId) {
      notify('Missing group task review details.');
      return;
    }

    const cleanFeedback = String(teacherFeedback || '').trim();

    if (!cleanFeedback) {
      notify('Please add teacher remarks before rejecting the group task.');
      return;
    }

    await safeRun(async () => {
      await api(`/groups/tasks/${row.groupTaskId}/completions/${row.studentId}/return`, {
        method: 'POST',
        body: { teacherFeedback: cleanFeedback }
      });

      await loadTeacherDashboard();

      notify(`${row.groupName || 'Group'} task was rejected and returned for revision.`);
    });
  }

  async function teacherGradeWritingSubmission(submissionId, payload = {}) {
    if (!submissionId) {
      notify('Missing writing submission details.', 'warn');
      return null;
    }

    const score = Number(payload.score);

    if (!Number.isInteger(score) || score < 1 || score > 10) {
      notify('Please select a score from 1 to 10.', 'warn');
      return null;
    }

    const feedback = String(payload.feedback || '').trim();

    try {
      const data = await api(`/teachers/reviews/writing/${submissionId}`, {
        method: 'PATCH',
        body: { score, feedback }
      });

      notify(data.message || `Naitala ang marka sa pagsulat. Nakakuha ang mag-aaral ng +${data.xpAwarded || 0} XP.`);
      await loadTeacherDashboard();
      return data;
    } catch (error) {
      notify(error.message || 'Hindi ma-save ang writing grade.', 'bad');
      return null;
    }
  }

  async function teacherReviewSpeechAttempt(attemptId, payload = {}) {
    if (!attemptId) {
      notify('Missing speech attempt details.', 'warn');
      return null;
    }

    const score = Number(payload.score);

    if (!Number.isInteger(score) || score < 1 || score > 10) {
      notify('Please select a speech score from 1 to 10.', 'warn');
      return null;
    }

    const feedback = String(payload.feedback || payload.teacherFeedback || '').trim();

    try {
      const data = await api(`/teachers/reviews/speech/${attemptId}`, {
        method: 'PATCH',
        body: { score, feedback }
      });

      notify(data.message || `Naitala ang marka sa pagbigkas. Nakakuha ang mag-aaral ng +${data.xpAwarded || score} XP.`);
      await loadTeacherDashboard();
      return data;
    } catch (error) {
      notify(error.message || 'Hindi ma-save ang speech review.', 'bad');
      return null;
    }
  }


  function normalizeWebGroupSection(value = '') {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function parseWebGroupClassSelection(value = '') {
    const rawValue = String(value || '').trim();
    const parts = rawValue.split('||');
    const gradeLevel = Number(parts.shift() || 0);
    const section = normalizeWebGroupSection(parts.join('||'));

    return { gradeLevel, section };
  }

  function getTeacherAssignedClassRules() {
    return (teacherData?.assignedClasses || [])
      .map((item) => ({
        gradeLevel: Number(item?.gradeLevel || item?.grade || 0),
        section: normalizeWebGroupSection(item?.section || item?.sectionName || item?.classSection || item?.name || ''),
      }))
      .filter((item) => [1, 2, 3, 4, 5, 6].includes(item.gradeLevel) || item.section);
  }

  function teacherCanUseWebGroupClass(gradeLevel, section) {
    const normalizedSection = normalizeWebGroupSection(section).toLowerCase();
    const rules = getTeacherAssignedClassRules();

    if (!rules.length) return true;

    return rules.some((rule) => {
      const ruleSection = normalizeWebGroupSection(rule.section).toLowerCase();
      const gradeMatches = !rule.gradeLevel || Number(rule.gradeLevel) === Number(gradeLevel);
      const sectionMatches = !ruleSection || ruleSection === normalizedSection;

      return gradeMatches && sectionMatches;
    });
  }

  function getWebGroupCreatePayload(values = null) {
    const formValues = values || {};
    const name = String(formValues.name ?? read('t-group-name') ?? '').trim();
    const selectedClass = String(formValues.selectedClass ?? read('t-group-class') ?? '').trim();

    let gradeLevel = Number(formValues.gradeLevel ?? read('t-group-grade') ?? 0);
    let section = normalizeWebGroupSection(formValues.section ?? read('t-group-section'));

    if (selectedClass) {
      const parsed = parseWebGroupClassSelection(selectedClass);
      gradeLevel = parsed.gradeLevel;
      section = parsed.section;
    }

    if (!name) {
      throw new Error('Ilagay muna ang group name.');
    }

    if (![1, 2, 3, 4, 5, 6].includes(gradeLevel)) {
      throw new Error('Pumili ng valid grade level mula Grade 1 hanggang Grade 6.');
    }

    if (!section) {
      throw new Error('Pumili o maglagay muna ng section para sa group.');
    }

    if (!teacherCanUseWebGroupClass(gradeLevel, section)) {
      throw new Error('You can only create groups for your assigned grade level or section.');
    }

    return {
      name,
      gradeLevel,
      section,
      description: section,
    };
  }

  async function teacherCreateGroup(body = null) {
    await safeRun(async () => {
      await api('/groups', { method: 'POST', body: getWebGroupCreatePayload(body) });
      notify('Group created.');
      await loadTeacherDashboard();
    });
  }

  async function teacherAddMember(groupId) {
    const select = document.getElementById(`member-${groupId}`);

    const studentIds = [
      ...new Set(
        Array.from(select?.selectedOptions || [])
          .map(option => Number(option.value))
          .filter(
            studentId =>
              Number.isInteger(studentId) &&
              studentId > 0
          )
      )
    ];

    if (!studentIds.length) {
      return notify(
        'Pumili ng kahit isang student.',
        'warn'
      );
    }

    await safeRun(async () => {
      let addedCount = 0;
      const failures = [];

      // Add students one at a time through the existing
      // validated endpoint. This also ensures only the
      // first member can be assigned as the initial leader.
      for (const studentId of studentIds) {
        try {
          await api(`/groups/${groupId}/members`, {
            method: 'POST',
            body: { studentId }
          });

          addedCount += 1;
        } catch (error) {
          failures.push(
            error?.message ||
            `Hindi maidagdag ang student ${studentId}.`
          );
        }
      }

      await loadTeacherDashboard();

      if (addedCount === 0 && failures.length > 0) {
        throw new Error(failures[0]);
      }

      if (failures.length > 0) {
        notify(
          `${addedCount} student(s) added; ` +
          `${failures.length} failed. ${failures[0]}`,
          'warn',
          7000
        );

        return;
      }

      notify(
        addedCount === 1
          ? '1 student added.'
          : `${addedCount} students added.`
      );
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


  async function teacherUpdateGroup(groupId, body = null) {
    if (!groupId) return notify('Missing group details.', 'warn');

    await safeRun(async () => {
      await api(`/groups/${groupId}`, {
        method: 'PATCH',
        body: getWebGroupCreatePayload(body),
      });

      notify('Group updated.');
      await loadTeacherDashboard();
    });
  }

  const GROUP_TASK_MINIMUM_DEADLINE_MS = 60 * 60 * 1000;

  function validateWebGroupTaskDeadline(value) {
    const rawValue = String(value || '').trim();

    if (!rawValue) {
      throw new Error('Pumili muna ng deadline at oras bago gumawa ng group task.');
    }

    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(rawValue)) {
      throw new Error('Hindi valid ang deadline ng group task. Pumili muli ng tamang petsa at oras.');
    }

    const deadlineMs = Date.parse(`${rawValue}:00+08:00`);

    if (!Number.isFinite(deadlineMs)) {
      throw new Error('Hindi valid ang deadline ng group task. Pumili muli ng tamang petsa at oras.');
    }

    if (deadlineMs < Date.now() + GROUP_TASK_MINIMUM_DEADLINE_MS) {
      throw new Error('Ang deadline ay kailangang hindi bababa sa isang oras mula ngayon.');
    }

    return new Date(deadlineMs).toISOString();
  }

  function getWebGroupTaskPayload() {
    const title = String(read('t-task-title') || '').trim();

    if (!title) {
      throw new Error('Ilagay muna ang task title.');
    }

    const deadline = validateWebGroupTaskDeadline(read('t-task-deadline'));
    const rawXpReward = Number(read('t-task-xp') || 10);
    const xpReward = Number.isFinite(rawXpReward) && rawXpReward >= 0 ? rawXpReward : 10;

    return {
      title,
      description: '',
      dueAt: deadline,
      deadline,
      xpReward,
    };
  }

  async function teacherAddTask() {
    await safeRun(async () => {
      const groupId = read('t-task-group');
      if (!groupId) throw new Error('Pumili muna ng group.');
      await api(`/groups/${groupId}/tasks`, {
        method: 'POST',
        body: getWebGroupTaskPayload()
      });
      notify('Task added.');
      await loadTeacherDashboard();
    });
  }

  async function teacherDeleteLesson(lessonId, lessonTitle = 'this lesson') {
    if (!lessonId) return notify('Missing lesson details.', 'warn');

    const confirmed = window.confirm(
      `Tanggalin ang "${lessonTitle}"? Hindi na makikita ng mga mag-aaral ang araling ito at ang pagsusulit nito.`
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
          title: 'Mga Pagsusulit',
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
          title: 'Gawain sa Pagsulat',
          prompt
        });
      }

      const speechTarget = read('t-lesson-speechTarget');
      if (speechTarget) {
        activities.push({
          type: 'speech',
          title: 'Pagsasanay sa Pagbigkas',
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
  const [stats, students, archivedStudents, teachers, archivedTeachers, enrollments, accounts, logs] = await Promise.all([
    api('/admin/stats'),
    api('/students?status=active'),
    api('/students?status=archived'),
    api('/teachers?status=active'),
    api('/teachers?status=archived'),
    api('/admin/enrollments'),
    api('/admin/accounts'),
    api('/admin/audit-logs?page=1&limit=100')
  ]);

  setAdminData({
    stats: stats.stats,
    students: students.students || [],
    archivedStudents: archivedStudents.students || [],
    teachers: teachers.teachers || [],
    archivedTeachers: archivedTeachers.teachers || [],
    teacherAssignments: enrollments.teacherAssignments || [],
    classOptions: enrollments.classOptions || [],
    accounts: accounts.users || [],
    logs: logs.logs || []
  });
}

  async function adminAddStudent(payload) {
    return await safeRun(async () => {
      const created = await api('/students', {
        method: 'POST',
          headers: getAdminReauthHeaders(),
        body: payload,
      });

      notify('Student added.');
      await loadAdminDashboard();
      return created;
    });
  }

  async function adminAddTeacher(payload) {
    return await safeRun(async () => {
      const created = await api('/teachers', {
        method: 'POST',
          headers: getAdminReauthHeaders(),
        body: payload,
      });

      notify('Teacher added.');
      await loadAdminDashboard();
      return created;
    });
  }

  async function assignTeacherClass() {
    await safeRun(async () => {
      const teacherId = read('a-assign-teacher');
      const gradeLevel = Number(read('a-assign-grade'));
      const section = String(
        read('a-assign-section') || ''
      )
        .replace(/\s+/g, ' ')
        .trim();

      if (!teacherId || !gradeLevel || !section) {
        window.alert('Pumili ng guro, baitang, at seksyon.');
        return;
      }

      // STRICT_SECTION_ASSIGNMENT_CLIENT
      if (
        !/^[A-Za-z]{2,}(?: [A-Za-z]{2,})*$/.test(
          section
        )
      ) {
        window.alert(
          'Section must use A-Z letters and spaces only. Each word must have at least 2 letters.'
        );
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

  async function adminUpdateAccountStatus(userId, status, label = 'account') {
    if (!userId || !status) {
      notify('Missing account status details.', 'warn');
      return null;
    }

    const confirmed = window.confirm(
      `Update ${label} status to ${status}?`
    );

    if (!confirmed) return null;

    return await safeRun(async () => {
      const data = await api(`/admin/accounts/${userId}/status`, {
        method: 'PATCH',
        body: { status },
      });

      notify('Account status updated.');
      await loadAdminDashboard();
      await loadTeacherDashboard().catch(() => null);
      return data;
    }, 'Hindi na-update ang account status.');
  }

  async function adminUpdateStudentEnrollment(studentId, payload = {}) {
    const gradeLevel = Number(payload.gradeLevel);
    const section = String(payload.section || '').trim();

    if (!studentId || !Number.isInteger(gradeLevel) || gradeLevel < 1 || gradeLevel > 6 || !section) {
      notify('Choose a valid grade level and section.', 'warn');
      return null;
    }

    const confirmed = window.confirm(
      `Update student enrollment to Grade ${gradeLevel} • ${section}?`
    );

    if (!confirmed) return null;

    return await safeRun(async () => {
      const data = await api(`/admin/students/${studentId}/enrollment`, {
        method: 'PATCH',
        body: { gradeLevel, section },
      });

      notify('Student enrollment updated.');
      await loadAdminDashboard();
      await loadTeacherDashboard().catch(() => null);
      return data;
    }, 'Hindi na-update ang student enrollment.');
  }

  async function archiveStudent(id) {
  const confirmed = window.confirm(
    'Deactivate this student account? The student will not be able to log in until reactivated.'
  );

  if (!confirmed) return;

  await safeRun(async () => {
    await api(`/students/${id}/archive`, { method: 'POST', body: { reason: 'Deactivated by administrator' } });
    notify('Student deactivated. You can restore this account from Deactivated Students.');
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
    await api(`/students/${id}/reactivate`, {
      method: 'POST',
      body: JSON.stringify({ reason: 'Reactivated by administrator' }),
    });
    notify('Student reactivated.');
    await loadAdminDashboard();
    await loadTeacherDashboard().catch(() => null);
  });
}

async function resetStudentPassword(id, options = {}, silentLegacy = false) {
  const legacyCall = typeof options === 'string';

  const name = legacyCall ? options : (options.name || 'student');
  const silent = legacyCall ? silentLegacy : Boolean(options.silent);
  const reason = legacyCall
    ? 'Admin password reset'
    : (options.reason || 'Admin password reset');

  if (!silent) {
    const confirmed = window.confirm(
      `Reset password for ${name}? The system will generate a temporary 4-digit PIN. The student must change it after logging in.`
    );

    if (!confirmed) return;
  }

  let temporaryPin = '';

  await safeRun(async () => {
    const data = await api(`/students/${id}/reset-password`, {
      method: 'POST',
      body: { reason }
    });

    temporaryPin = data.temporaryPin || '';

    if (!silent) {
      window.alert(
        `Temporary PIN for ${name}:\n\n${data.temporaryPin}\n\nGive this PIN to the student. They will be required to change their password after logging in.`
      );
    }

    notify('Student password reset. Temporary PIN was shown to admin.');
    await loadAdminDashboard();
  }, 'Hindi na-reset ang password.');

  return temporaryPin;
}

  async function resetStudent(id) {
    await safeRun(async () => {
      await api(`/students/${id}/reset-progress`, { method: 'POST' });
      notify('Na-reset ang pag-unlad.');
      await loadAdminDashboard();
      await loadTeacherDashboard().catch(() => null);
    });
  }

  async function resetTeacherPassword(id, options = {}, silentLegacy = false) {
  const legacyCall = typeof options === 'string';

  const name = legacyCall ? options : (options.name || 'teacher');
  const silent = legacyCall ? silentLegacy : Boolean(options.silent);
  const reason = legacyCall
    ? 'Admin password reset'
    : (options.reason || 'Admin password reset');

  if (!silent) {
    const confirmed = window.confirm(
      `Reset password for ${name}? The system will generate a temporary 4-digit PIN. The teacher must change it after logging in.`
    );

    if (!confirmed) return;
  }

  let temporaryPin = '';

  await safeRun(async () => {
    const data = await api(`/teachers/${id}/reset-password`, {
      method: 'POST',
      body: { reason }
    });

    temporaryPin = data.temporaryPin || '';

    if (!silent) {
      window.alert(
        `Temporary PIN for ${name}:\n\n${data.temporaryPin}\n\nGive this PIN to the teacher. They will be required to change their password after logging in.`
      );
    }

    notify('Teacher password reset. Temporary PIN was shown to admin.');
    await loadAdminDashboard();
  }, 'Hindi na-reset ang teacher password.');

  return temporaryPin;
}

async function reactivateTeacher(id) {
  const confirmed = window.confirm(
    'Reactivate this teacher account? The teacher will be able to log in again.'
  );

  if (!confirmed) return;

  await safeRun(async () => {
    await api(`/teachers/${id}/reactivate`, {
      method: 'POST',
      body: JSON.stringify({ reason: 'Reactivated by administrator' }),
    });
    notify('Teacher reactivated.');
    await loadAdminDashboard();
  });
}

async function archiveTeacher(id) {
  const confirmed = window.confirm(
    'Deactivate this teacher account? The teacher will not be able to log in until reactivated.'
  );

  if (!confirmed) return;

  await safeRun(async () => {
    await api(`/teachers/${id}/archive`, { method: 'POST', body: { reason: 'Deactivated by administrator' } });
    notify('Teacher deactivated. You can restore this account from Deactivated Teachers.');
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

      notify(data.pendingTeacherCheck ? 'Naipasa na ang gawain. Naghihintay ng pagsusuri ng guro.' : (data.xpAwarded ? `Tapos na ang gawain! +${data.xpAwarded} XP` : 'Tapos na ang gawain.'));
      await loadStudentDashboard();
    });
  }

  async function exportStudentsCSV() {
    await safeRun(async () => {
      await downloadFile('/reports/students.csv', 'tuklas-talino-teacher-monitoring-report.csv');
    }, 'Hindi ma-download ang students CSV.');
  }

  async function exportLogsCSV() {
    await safeRun(async () => {
      await downloadFile('/reports/activity-logs.csv', 'tuklas-talino-admin-audit-trail-report.csv');
    }, 'Hindi ma-download ang activity logs CSV.');
  }

  async function exportSummaryCSV() {
    await safeRun(async () => {
      await downloadFile('/reports/summary.csv', 'tuklas-talino-admin-audit-trail-report.csv');
    }, 'Hindi ma-download ang admin audit trail CSV.');
  }

  async function downloadBuodReport() {
    await safeRun(async () => {
      await downloadFile('/reports/summary.pdf', 'tuklas-talino-teacher-monitoring-summary-report.pdf');
    }, 'Hindi ma-download ang PDF monitoring summary.');
  }

  async function downloadAuditTrailReport() {
    await safeRun(async () => {
      await downloadFile('/reports/audit-trail.pdf', 'tuklas-talino-admin-audit-trail-report.pdf');
    }, 'Hindi ma-download ang admin audit trail PDF.');
  }

  const lessonsBySubject = useMemo(() => {
    const lessons = studentDash?.lessons || [];
    return SUBJECTS.map(subject => ({
      ...subject,
      lessons: lessons.filter(lesson => studentSubjectMatches(lesson.subject, subject.name))
    }));
  }, [studentDash]);

  const visibleLessons = useMemo(() => {
    const lessons = [...(studentDash?.lessons || [])].sort(
      (first, second) =>
        Number(Boolean(first?.completed)) - Number(Boolean(second?.completed))
    );

    if (subjectFilter === 'FINISHED') {
      return lessons.filter(lesson => lesson?.completed);
    }

    return subjectFilter === 'ALL'
      ? lessons
      : lessons.filter(lesson =>
          studentSubjectMatches(lesson.subject, subjectFilter)
        );
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

        .g12-gate-notif-wrap {
          position: fixed !important;
          inset: 0 !important;
          z-index: 5000 !important;
          display: grid !important;
          place-items: center !important;
          padding: 24px !important;
          pointer-events: none !important;
          background: transparent !important;
        }

        .g12-gate-notif {
          pointer-events: auto !important;
          max-width: min(560px, calc(100vw - 40px)) !important;
          min-width: min(420px, calc(100vw - 40px)) !important;
          text-align: center !important;
          padding: 22px 28px !important;
          border-left-width: 0 !important;
          border: 3px solid rgba(245, 158, 11, 0.62) !important;
          border-radius: 28px !important;
          font-size: clamp(20px, 2.4vw, 28px) !important;
          line-height: 1.35 !important;
          box-shadow: 0 24px 70px rgba(20, 34, 59, 0.22) !important;
        }

        .notif.rewards {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 2px !important;
          width: fit-content !important;
          min-width: unset !important;
          max-width: calc(100vw - 48px) !important;
          padding: 18px 28px !important;
          margin: 0 auto !important;
          white-space: nowrap !important;
        }

      .notif-reward-dots {
        display: inline-flex;
        align-items: flex-end;
        margin-left: 2px;
        height: 1em;
      }

      .notif-reward-dots span {
        display: inline-block;
        animation: notifRewardDotBounce 0.9s ease-in-out infinite;
      }

      .notif-reward-dots span:nth-child(2) {
        animation-delay: 0.14s;
      }

      .notif-reward-dots span:nth-child(3) {
        animation-delay: 0.28s;
      }

      @keyframes notifRewardDotBounce {
        0%, 80%, 100% {
          transform: translateY(0);
          opacity: 0.45;
        }
        40% {
          transform: translateY(-4px);
          opacity: 1;
        }
      }

      @keyframes centerNotifPop {
          from { opacity: 0; transform: scale(0.92) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }


      .mission-complete-modal {
        animation: missionCompleteModalBounce .58s cubic-bezier(.18, .9, .26, 1.28) both;
      }

      .mission-complete-icon {
        animation: missionCompleteIconWiggle 1.45s ease-in-out infinite;
      }

      .mission-complete-modal h3 {
        animation: missionCompleteTitlePop .72s ease-out both;
      }

      .mission-complete-xp {
        animation: missionCompleteXpPulse 1.35s ease-in-out infinite;
      }

      .mission-complete-btn {
        transition: transform .18s ease, box-shadow .18s ease;
      }

      .mission-complete-btn:hover {
        transform: translateY(-3px) scale(1.03);
      }

      @keyframes missionCompleteModalBounce {
        0% {
          opacity: 0;
          transform: translateY(28px) scale(.86);
        }
        62% {
          opacity: 1;
          transform: translateY(-8px) scale(1.04);
        }
        100% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes missionCompleteIconWiggle {
        0%, 100% {
          transform: rotate(0deg) scale(1);
        }
        20% {
          transform: rotate(-7deg) scale(1.06);
        }
        40% {
          transform: rotate(7deg) scale(1.08);
        }
        60% {
          transform: rotate(-4deg) scale(1.04);
        }
        80% {
          transform: rotate(4deg) scale(1.05);
        }
      }

      @keyframes missionCompleteTitlePop {
        0% {
          opacity: 0;
          transform: translateY(10px) scale(.95);
        }
        100% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes missionCompleteXpPulse {
        0%, 100% {
          transform: scale(1);
          box-shadow: 0 0 0 rgba(248, 222, 126, 0);
        }
        50% {
          transform: scale(1.035);
          box-shadow: 0 0 0 8px rgba(248, 222, 126, .18);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .mission-complete-modal,
        .mission-complete-icon,
        .mission-complete-modal h3,
        .mission-complete-xp {
          animation: none;
        }
      }

      .sound-say-game {
        display: grid;
        gap: 18px;
        margin-top: 10px;
      }

      .sound-say-hero,
      .sound-say-target-card,
      .sound-say-result-card,
      .sound-say-success,
      .sound-say-error {
        border-radius: 30px;
        border: 3px solid rgba(198, 224, 255, .95);
        background:
          radial-gradient(circle at 10% 12%, rgba(255, 231, 150, .52), transparent 28%),
          linear-gradient(135deg, rgba(255, 255, 255, .98), rgba(239, 247, 255, .96));
        box-shadow: 0 10px 0 rgba(210, 226, 247, .72), 0 22px 50px rgba(67, 91, 130, .10);
      }

      .sound-say-hero {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 22px;
        align-items: center;
        padding: 24px;
        overflow: hidden;
      }

      .sound-say-mic-wrap {
        position: relative;
        width: clamp(120px, 14vw, 180px);
        height: clamp(120px, 14vw, 180px);
        display: grid;
        place-items: center;
      }

      .sound-say-mic {
        position: relative;
        z-index: 2;
        width: 96px;
        height: 96px;
        display: grid;
        place-items: center;
        border-radius: 32px;
        background: #FFF7D6;
        border: 3px solid #FFE28A;
        font-size: 52px;
        box-shadow: 0 16px 35px rgba(60, 103, 135, .14);
        animation: soundSayMicFloat 2.4s ease-in-out infinite;
      }

      .sound-say-wave {
        position: absolute;
        inset: 22px;
        border-radius: 999px;
        border: 3px solid rgba(34, 197, 94, .34);
        opacity: 0;
      }

      .sound-say-game.speaking .sound-say-wave,
      .sound-say-game.listening .sound-say-wave {
        animation: soundSayWave 1.4s ease-out infinite;
      }

      .sound-say-game .wave-2 {
        animation-delay: .28s;
      }

      .sound-say-game .wave-3 {
        animation-delay: .56s;
      }

      .sound-say-copy {
        display: grid;
        gap: 8px;
      }

      .sound-say-label {
        width: fit-content;
        padding: 8px 13px;
        border-radius: 999px;
        background: #fff7d6;
        border: 2px solid #ffe28a;
        color: #7c5300;
        font-size: 15px;
        font-weight: 1000;
      }

      .sound-say-copy h3 {
        margin: 0;
        color: #11894F;
        font-size: clamp(34px, 5vw, 64px);
        line-height: 1;
        font-weight: 1000;
      }

      .sound-say-copy p {
        margin: 0;
        color: #405674;
        font-size: clamp(17px, 2vw, 23px);
        font-weight: 900;
      }

      .sound-say-target-card {
        display: grid;
        gap: 8px;
        padding: 22px;
        text-align: center;
      }

      .sound-say-target-card span,
      .sound-say-result-card span {
        color: #405674;
        font-weight: 1000;
      }

      .sound-say-target-card strong {
        color: #16233d;
        font-size: clamp(32px, 5vw, 64px);
        line-height: 1.1;
        font-weight: 1000;
      }

      .sound-say-target-card p {
        margin: 0;
        color: #526988;
        font-size: 18px;
        font-weight: 850;
      }

      .sound-say-actions {
        display: grid;
        grid-template-columns: repeat(3, minmax(150px, 1fr));
        gap: 14px;
      }

      .sound-say-btn {
        min-height: 72px;
        border: 0;
        border-radius: 22px;
        color: #FFFFFF;
        font-size: clamp(17px, 2vw, 24px);
        font-weight: 1000;
        cursor: pointer;
        box-shadow: 0 11px 0 rgba(40, 70, 110, .18), 0 22px 38px rgba(40, 70, 110, .13);
        transition: transform .18s ease, opacity .18s ease;
      }

      .sound-say-btn:hover {
        transform: translateY(-4px);
      }

      .sound-say-btn:disabled {
        opacity: .6;
        cursor: not-allowed;
        transform: none;
      }

      .sound-say-btn.listen {
        background: linear-gradient(135deg, #7C3AED, #5B21B6);
      }

      .sound-say-btn.speak {
        background: linear-gradient(135deg, #22C55E, #16A34A);
      }

      .sound-say-btn.reset {
        background: linear-gradient(135deg, #64748B, #475569);
      }

      .sound-say-result-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
      }

      .sound-say-result-card {
        display: grid;
        gap: 8px;
        padding: 18px;
      }

      .sound-say-result-card strong {
        color: #16233d;
        font-size: clamp(21px, 3vw, 36px);
        font-weight: 1000;
      }

      .sound-say-meter {
        height: 15px;
        overflow: hidden;
        border-radius: 999px;
        background: #E8F1FF;
      }

      .sound-say-meter i {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #22C55E, #F8DE7E);
        transition: width .25s ease;
      }

      .sound-say-result-card small {
        color: #64748B;
        font-weight: 850;
      }

      .sound-say-success {
        padding: 18px;
        text-align: center;
        color: #0B743D;
        background: #EFFFF5;
        border-color: #18B865;
        font-size: clamp(20px, 2.5vw, 30px);
        font-weight: 1000;
        animation: soundSaySuccessPop .45s ease-out both;
      }

      .sound-say-error {
        padding: 15px 18px;
        color: #8A3B00;
        background: #FFF4E5;
        border-color: #FDBA74;
        font-weight: 900;
      }

      .sound-say-toast {
        position: fixed;
        left: 50%;
        top: 46%;
        z-index: 1200;
        width: fit-content;
        max-width: calc(100vw - 48px);
        padding: 18px 24px;
        border-radius: 24px;
        background: rgba(255, 255, 255, .98);
        border: 3px solid #F8DE7E;
        color: #16233d;
        font-size: clamp(22px, 3vw, 34px);
        font-weight: 1000;
        text-align: center;
        box-shadow: 0 22px 60px rgba(20, 40, 70, .22);
        transform: translate(-50%, -50%);
        animation: letterPopToastCelebrate 1.2s ease-in-out both;
        pointer-events: none;
      }

      .sound-say-toast.warn {
        background: linear-gradient(135deg, #fff8f8, #fff1c9);
        border-color: #ffb2b2;
        animation: letterPopToastPop .2s ease-out;
      }

      @keyframes soundSayMicFloat {
        0%, 100% { transform: translateY(0) rotate(-1deg); }
        50% { transform: translateY(-8px) rotate(1deg); }
      }

      @keyframes soundSayWave {
        0% {
          opacity: .65;
          transform: scale(.82);
        }
        100% {
          opacity: 0;
          transform: scale(1.55);
        }
      }

      @keyframes soundSaySuccessPop {
        0% { opacity: 0; transform: scale(.96); }
        100% { opacity: 1; transform: scale(1); }
      }

      @media (max-width: 760px) {
        .sound-say-hero,
        .sound-say-result-grid,
        .sound-say-actions {
          grid-template-columns: 1fr;
        }

        .sound-say-mic-wrap {
          justify-self: center;
        }
      }


      .sound-say-game .sound-say-target-card {
        animation: soundSayTargetFloat 3.2s ease-in-out infinite;
      }

      .sound-say-game .sound-say-target-card strong {
        display: inline-block;
        animation: soundSayTargetTextGlow 2.8s ease-in-out infinite;
      }

      .sound-say-game .sound-say-result-card {
        animation: soundSayCardReveal .45s ease-out both;
      }

      .sound-say-game .sound-say-result-card:nth-child(2) {
        animation-delay: .08s;
      }

      .sound-say-game.speaking .sound-say-btn.listen,
      .sound-say-game.listening .sound-say-btn.speak {
        animation: soundSayButtonPulse 1s ease-in-out infinite;
      }

      .sound-say-game.listening .sound-say-mic {
        animation: soundSayMicListen 1s ease-in-out infinite;
      }

      .sound-say-game.correct .sound-say-target-card {
        border-color: #18B865;
        background: linear-gradient(135deg, #ffffff, #effff5);
        animation: soundSayCorrectGlow 1.2s ease-in-out infinite;
      }

      .sound-say-game.correct .sound-say-meter i {
        animation: soundSayMeterShine 1.15s ease-in-out infinite;
      }

      @keyframes soundSayTargetFloat {
        0%, 100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-5px);
        }
      }

      @keyframes soundSayTargetTextGlow {
        0%, 100% {
          transform: scale(1);
          text-shadow: 0 0 0 rgba(34, 197, 94, 0);
        }
        50% {
          transform: scale(1.015);
          text-shadow: 0 8px 24px rgba(34, 197, 94, .14);
        }
      }

      @keyframes soundSayCardReveal {
        from {
          opacity: 0;
          transform: translateY(14px) scale(.98);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes soundSayButtonPulse {
        0%, 100% {
          transform: translateY(0) scale(1);
          filter: brightness(1);
        }
        50% {
          transform: translateY(-4px) scale(1.025);
          filter: brightness(1.08);
        }
      }

      @keyframes soundSayMicListen {
        0%, 100% {
          transform: translateY(0) scale(1) rotate(-1deg);
        }
        50% {
          transform: translateY(-9px) scale(1.08) rotate(1deg);
        }
      }

      @keyframes soundSayCorrectGlow {
        0%, 100% {
          box-shadow: 0 10px 0 rgba(210, 226, 247, .72), 0 22px 50px rgba(67, 91, 130, .10);
        }
        50% {
          box-shadow: 0 10px 0 rgba(24, 184, 101, .22), 0 0 0 8px rgba(24, 184, 101, .12), 0 22px 50px rgba(67, 91, 130, .10);
        }
      }

      @keyframes soundSayMeterShine {
        0%, 100% {
          filter: brightness(1);
        }
        50% {
          filter: brightness(1.18);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .sound-say-game .sound-say-target-card,
        .sound-say-game .sound-say-target-card strong,
        .sound-say-game .sound-say-result-card,
        .sound-say-game.speaking .sound-say-btn.listen,
        .sound-say-game.listening .sound-say-btn.speak,
        .sound-say-game.listening .sound-say-mic,
        .sound-say-game.correct .sound-say-meter i {
          animation: none;
        }
      }


      /* soundSayPastelPolish */
      .sound-say-game .sound-say-hero {
        background:
          radial-gradient(circle at 12% 18%, rgba(255, 229, 153, .55), transparent 28%),
          radial-gradient(circle at 88% 20%, rgba(186, 230, 253, .72), transparent 34%),
          linear-gradient(135deg, #FFFDF2, #EFF8FF 52%, #F5F0FF);
        border-color: rgba(186, 230, 253, .95);
      }

      .sound-say-game .sound-say-mic {
        background: linear-gradient(135deg, #FFF4C7, #EDE9FE);
        border-color: #F8DE7E;
        box-shadow: 0 16px 35px rgba(124, 58, 237, .13);
      }

      .sound-say-game .sound-say-label {
        background: linear-gradient(135deg, #FFF7D6, #E0F2FE);
        border-color: #F8DE7E;
        color: #765100;
      }

      .sound-say-game .sound-say-target-card {
        background:
          radial-gradient(circle at 9% 18%, rgba(254, 240, 138, .42), transparent 28%),
          radial-gradient(circle at 90% 18%, rgba(167, 243, 208, .44), transparent 30%),
          linear-gradient(135deg, #FFFFFF, #F0F9FF);
        border-color: rgba(191, 219, 254, .98);
      }

      .sound-say-game .sound-say-target-card strong {
        color: #172554;
      }

      .sound-say-game .sound-say-btn.listen {
        background: linear-gradient(135deg, #A78BFA, #7C3AED);
        box-shadow: 0 11px 0 rgba(91, 33, 182, .22), 0 22px 38px rgba(124, 58, 237, .13);
      }

      .sound-say-game .sound-say-btn.speak {
        background: linear-gradient(135deg, #6EE7B7, #10B981);
        box-shadow: 0 11px 0 rgba(5, 150, 105, .22), 0 22px 38px rgba(16, 185, 129, .13);
      }

      .sound-say-game .sound-say-btn.reset {
        background: linear-gradient(135deg, #CBD5E1, #64748B);
        box-shadow: 0 11px 0 rgba(71, 85, 105, .20), 0 22px 38px rgba(100, 116, 139, .12);
      }

      .sound-say-game .sound-say-result-card:first-child {
        background:
          radial-gradient(circle at 10% 12%, rgba(254, 202, 202, .38), transparent 30%),
          linear-gradient(135deg, #FFFFFF, #FFF7ED);
        border-color: rgba(253, 186, 116, .72);
      }

      .sound-say-game .sound-say-result-card:nth-child(2) {
        background:
          radial-gradient(circle at 10% 12%, rgba(167, 243, 208, .42), transparent 30%),
          linear-gradient(135deg, #FFFFFF, #ECFDF5);
        border-color: rgba(110, 231, 183, .78);
      }

      .sound-say-game .sound-say-meter {
        background: #E0F2FE;
      }

      .sound-say-game .sound-say-meter i {
        background: linear-gradient(90deg, #38BDF8, #34D399, #F8DE7E);
      }

      .sound-say-game .sound-say-success {
        background:
          radial-gradient(circle at 12% 18%, rgba(187, 247, 208, .55), transparent 34%),
          linear-gradient(135deg, #FFFFFF, #ECFDF5);
        border-color: #34D399;
      }

      .story-quest-game {
        display: grid;
        gap: 18px;
        margin-top: 10px;
      }

      .story-quest-book-card,
      .story-quest-question-card,
      .story-quest-complete-card {
        border-radius: 30px;
        border: 3px solid rgba(198, 224, 255, .95);
        background:
          radial-gradient(circle at 10% 12%, rgba(255, 231, 150, .52), transparent 28%),
          linear-gradient(135deg, rgba(255, 255, 255, .98), rgba(239, 247, 255, .96));
        box-shadow: 0 10px 0 rgba(210, 226, 247, .72), 0 22px 50px rgba(67, 91, 130, .10);
      }

      .story-quest-book-card {
        padding: 24px;
        animation: storyQuestBookFloat 3.4s ease-in-out infinite;
      }

      .story-quest-book-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }

      .story-quest-badge,
      .story-quest-pages,
      .story-quest-question-label {
        width: fit-content;
        padding: 8px 13px;
        border-radius: 999px;
        background: #fff7d6;
        border: 2px solid #ffe28a;
        color: #7c5300;
        font-size: 15px;
        font-weight: 1000;
      }

      .story-quest-book-card h3 {
        margin: 0 0 12px;
        color: #11894F;
        font-size: clamp(30px, 4vw, 52px);
        line-height: 1;
        font-weight: 1000;
      }

      .story-quest-story {
        display: grid;
        gap: 8px;
        padding: 18px;
        border-radius: 24px;
        background: rgba(255, 255, 255, .68);
        border: 2px dashed rgba(152, 196, 255, .95);
      }

      .story-quest-story p {
        margin: 0;
        color: #16233d;
        font-size: clamp(20px, 2.5vw, 32px);
        line-height: 1.35;
        font-weight: 900;
      }


      .story-quest-book-layout {
        overflow: hidden;
        padding: 18px;
      }

      .story-quest-open-book {
        position: relative;
        display: grid;
        grid-template-columns: minmax(280px, .95fr) minmax(320px, 1.05fr);
        gap: 0;
        overflow: hidden;
        border-radius: 30px;
        border: 3px solid rgba(238, 226, 200, .95);
        background: linear-gradient(90deg, #f3e4c7 0%, #fffaf0 49%, #d6c7ac 50%, #fffaf0 51%, #ffffff 100%);
        box-shadow: inset 0 0 0 2px rgba(255, 255, 255, .5), 0 18px 44px rgba(70, 50, 20, .12);
      }

      .story-quest-illustration-page,
      .story-quest-reading-page {
        min-height: 390px;
      }

      .story-quest-illustration-page {
        position: relative;
        display: grid;
        place-items: center;
        padding: 24px;
        background:
          radial-gradient(circle at 18% 12%, rgba(255, 255, 255, .32), transparent 18%),
          linear-gradient(135deg, #d8ecff, #f5e3c7);
        border-right: 2px solid rgba(80, 60, 35, .16);
      }

      .story-quest-room {
        position: relative;
        width: min(360px, 100%);
        aspect-ratio: 1 / .92;
        border-radius: 28px;
        overflow: hidden;
        background:
          linear-gradient(90deg, rgba(255, 255, 255, .42), transparent 28%),
          linear-gradient(135deg, #91b8cf, #e9c69f);
        border: 3px solid rgba(255, 255, 255, .72);
        box-shadow: 0 20px 48px rgba(30, 50, 75, .18);
      }

      .story-quest-window {
        position: absolute;
        left: 20px;
        top: 20px;
        width: 78px;
        height: 94px;
        border-radius: 18px;
        background:
          linear-gradient(90deg, transparent 47%, rgba(255, 255, 255, .8) 48% 52%, transparent 53%),
          linear-gradient(180deg, #bde8ff, #f9fbff);
        border: 5px solid rgba(255, 255, 255, .88);
        box-shadow: 0 10px 20px rgba(40, 70, 100, .12);
      }

      .story-quest-shelf {
        position: absolute;
        right: 22px;
        top: 26px;
        width: 136px;
        height: 102px;
        border-radius: 18px;
        background:
          linear-gradient(90deg, #806044 0 14%, #eab308 14% 25%, #ef4444 25% 36%, #2563eb 36% 48%, #22c55e 48% 60%, #8b5cf6 60% 72%, #a16207 72% 100%);
        border: 8px solid #7b5538;
        box-shadow: inset 0 -10px 0 rgba(70, 40, 20, .18);
      }

      .story-quest-scene-art {
        position: absolute;
        left: 50%;
        bottom: 28px;
        transform: translateX(-50%);
        width: 78%;
        min-height: 130px;
        display: grid;
        place-items: center;
        border-radius: 34px;
        background: rgba(255, 255, 255, .48);
        border: 3px solid rgba(255, 255, 255, .7);
        font-size: clamp(52px, 7vw, 92px);
        letter-spacing: 8px;
        text-align: center;
        filter: drop-shadow(0 14px 18px rgba(45, 60, 80, .16));
        animation: storyQuestSceneFloat 3.6s ease-in-out infinite;
      }

      .story-quest-reading-page {
        display: grid;
        align-content: center;
        gap: 16px;
        padding: clamp(28px, 4vw, 56px);
        background:
          repeating-linear-gradient(0deg, rgba(40, 56, 82, .035) 0 2px, transparent 2px 42px),
          radial-gradient(circle at 80% 10%, rgba(255, 246, 214, .9), transparent 34%),
          #fffdf7;
      }

      .story-quest-reading-page h3 {
        margin: 0;
        color: #14223b;
        font-size: clamp(30px, 4vw, 56px);
        line-height: 1.05;
        font-weight: 1000;
      }

      .story-quest-reading-page .story-quest-story {
        display: grid;
        gap: 14px;
        padding: 0;
        border: 0;
        background: transparent;
      }

      .story-quest-reading-page .story-quest-story p {
        margin: 0;
        color: #16233d;
        font-family: Georgia, 'Times New Roman', serif;
        font-size: clamp(22px, 2.5vw, 34px);
        line-height: 1.55;
        font-weight: 700;
      }

      .story-quest-page-label {
        width: fit-content;
        padding: 8px 13px;
        border-radius: 999px;
        background: #fff7d6;
        border: 2px solid #ffe28a;
        color: #7c5300;
        font-size: 14px;
        font-weight: 1000;
      }

      .story-quest-start-btn {
        justify-self: start;
        margin-top: 6px;
        border: 0;
        border-radius: 22px;
        padding: 17px 28px;
        background: linear-gradient(135deg, #7C3AED, #5B21B6);
        color: #FFFFFF;
        font-size: 19px;
        font-weight: 1000;
        cursor: pointer;
        box-shadow: 0 10px 0 rgba(58, 29, 122, .32), 0 20px 38px rgba(91, 33, 182, .18);
        animation: storyQuestStartPulse 1.8s ease-in-out infinite;
      }

      .story-quest-start-btn:hover {
        transform: translateY(-3px);
      }

      @keyframes storyQuestSceneFloat {
        0%, 100% { transform: translateX(-50%) translateY(0); }
        50% { transform: translateX(-50%) translateY(-8px); }
      }

      @keyframes storyQuestStartPulse {
        0%, 100% {
          box-shadow: 0 10px 0 rgba(58, 29, 122, .32), 0 20px 38px rgba(91, 33, 182, .18);
        }
        50% {
          box-shadow: 0 10px 0 rgba(58, 29, 122, .32), 0 0 0 8px rgba(124, 58, 237, .12), 0 20px 38px rgba(91, 33, 182, .18);
        }
      }

      @media (max-width: 860px) {
        .story-quest-open-book {
          grid-template-columns: 1fr;
        }

        .story-quest-illustration-page,
        .story-quest-reading-page {
          min-height: auto;
        }

        .story-quest-room {
          max-width: 320px;
        }
      }


      .story-quest-game.standard .story-quest-reading-page .story-quest-story p {
        font-size: clamp(18px, 1.75vw, 25px);
        line-height: 1.58;
        font-weight: 700;
      }

      .story-quest-flip-page {
        animation: storyQuestPageFlip .36s ease-out both;
        transform-origin: left center;
      }

      .story-quest-page-controls {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 4px;
      }

      .story-quest-page-btn {
        border: 0;
        border-radius: 18px;
        padding: 13px 18px;
        background: linear-gradient(135deg, #64748B, #475569);
        color: #FFFFFF;
        font-size: 15px;
        font-weight: 1000;
        cursor: pointer;
        box-shadow: 0 8px 0 rgba(51, 65, 85, .22);
      }

      .story-quest-page-btn.purple {
        background: linear-gradient(135deg, #7C3AED, #5B21B6);
        box-shadow: 0 8px 0 rgba(58, 29, 122, .26);
      }

      .story-quest-page-btn:disabled {
        opacity: .48;
        cursor: not-allowed;
        transform: none;
      }

      .story-quest-page-count {
        min-width: 58px;
        text-align: center;
        padding: 10px 14px;
        border-radius: 999px;
        background: #fff7d6;
        border: 2px solid #ffe28a;
        color: #7c5300;
        font-weight: 1000;
      }

      .story-quest-read-hint {
        margin: 2px 0 0;
        color: #64748B;
        font-size: 15px;
        font-weight: 900;
      }

      @keyframes storyQuestPageFlip {
        0% {
          opacity: 0;
          transform: perspective(900px) rotateY(-12deg) translateX(12px);
        }
        100% {
          opacity: 1;
          transform: perspective(900px) rotateY(0deg) translateX(0);
        }
      }

      .story-quest-progress-card {
        display: grid;
        gap: 10px;
        padding: 14px 16px;
        border-radius: 22px;
        background: rgba(255, 255, 255, .76);
        border: 2px solid #DDEBFF;
      }

      .story-quest-progress-card > div:first-child {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        color: #38526B;
        font-weight: 1000;
      }

      .story-quest-progress-card strong {
        color: #0B934C;
      }

      .story-quest-progress-track {
        height: 14px;
        border-radius: 999px;
        overflow: hidden;
        background: #E8F1FF;
      }

      .story-quest-progress-track i {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #22C55E, #F8DE7E);
        transition: width .25s ease;
      }

      .story-quest-question-card {
        padding: 22px;
      }

      .story-quest-question-card h4 {
        margin: 12px 0 16px;
        color: #16233d;
        font-size: clamp(24px, 3vw, 40px);
        line-height: 1.16;
        font-weight: 1000;
      }

      .story-quest-options {
        display: grid;
        grid-template-columns: repeat(3, minmax(130px, 1fr));
        gap: 14px;
      }

      .story-quest-choice {
        min-height: 92px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 14px 18px;
        border: 3px solid #DDEBFF;
        border-radius: 24px;
        background: #FFFFFF;
        color: #16233d;
        font-size: clamp(19px, 2.5vw, 30px);
        font-weight: 1000;
        cursor: pointer;
        box-shadow: 0 12px 0 rgba(50, 74, 112, .12), 0 22px 40px rgba(51, 76, 115, .12);
        transition: transform .18s ease, border-color .18s ease, background .18s ease;
      }

      .story-quest-choice:hover {
        transform: translateY(-4px);
        border-color: #9BDDB6;
      }

      .story-quest-choice.wrong {
        border-color: #FF8A8A;
        background: #FFF4F4;
        animation: storyQuestWrongShake .42s ease-in-out;
      }

      .story-quest-choice-icon {
        font-size: 1.35em;
      }

      .story-quest-complete-card {
        display: grid;
        justify-items: center;
        gap: 8px;
        padding: 26px;
        text-align: center;
        background: linear-gradient(135deg, #fffdf2, #eafff2);
        border-color: #9BE7B7;
      }

      .story-quest-complete-icon {
        width: 76px;
        height: 76px;
        display: grid;
        place-items: center;
        border-radius: 24px;
        background: #fff7d6;
        border: 2px solid #ffe28a;
        font-size: 38px;
      }

      .story-quest-complete-card h4 {
        margin: 0;
        color: #11894F;
        font-size: clamp(26px, 3vw, 42px);
        font-weight: 1000;
      }

      .story-quest-complete-card p {
        margin: 0;
        color: #405674;
        font-size: 18px;
        font-weight: 900;
      }

      .story-quest-toast {
        position: fixed;
        left: 50%;
        top: 46%;
        z-index: 1200;
        width: fit-content;
        max-width: calc(100vw - 48px);
        padding: 18px 24px;
        border-radius: 24px;
        background: rgba(255, 255, 255, .98);
        border: 3px solid #F8DE7E;
        color: #16233d;
        font-size: clamp(22px, 3vw, 34px);
        font-weight: 1000;
        text-align: center;
        box-shadow: 0 22px 60px rgba(20, 40, 70, .22);
        transform: translate(-50%, -50%);
        animation: letterPopToastCelebrate 1.1s ease-in-out both;
        pointer-events: none;
      }

      .story-quest-toast.warn {
        background: linear-gradient(135deg, #fff8f8, #fff1c9);
        border-color: #ffb2b2;
        animation: letterPopToastPop .2s ease-out;
      }

      @keyframes storyQuestBookFloat {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
      }

      @keyframes storyQuestWrongShake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-8px) rotate(-1deg); }
        40% { transform: translateX(8px) rotate(1deg); }
        60% { transform: translateX(-5px) rotate(-.5deg); }
        80% { transform: translateX(5px) rotate(.5deg); }
      }

      @media (max-width: 760px) {
        .story-quest-options {
          grid-template-columns: 1fr;
        }
      }

      .sentence-builder-game {
        display: grid;
        gap: 18px;
        margin-top: 10px;
      }

      .sentence-builder-prompt {
        padding: 22px;
        border-radius: 28px;
        background:
          radial-gradient(circle at 10% 12%, rgba(255, 231, 150, .52), transparent 28%),
          linear-gradient(135deg, rgba(255, 255, 255, .98), rgba(239, 247, 255, .96));
        border: 3px solid rgba(198, 224, 255, .95);
        box-shadow: 0 10px 0 rgba(210, 226, 247, .72), 0 22px 50px rgba(67, 91, 130, .10);
      }

      .sentence-builder-mini-label {
        width: fit-content;
        padding: 8px 13px;
        border-radius: 999px;
        background: #fff7d6;
        border: 2px solid #ffe28a;
        color: #7c5300;
        font-size: 15px;
        font-weight: 1000;
      }

      .sentence-builder-prompt h3 {
        margin: 12px 0 6px;
        color: #16233d;
        font-size: clamp(28px, 4vw, 48px);
        line-height: 1;
        font-weight: 1000;
      }

      .sentence-builder-prompt p {
        margin: 0;
        color: #405674;
        font-size: clamp(17px, 2vw, 22px);
        font-weight: 900;
      }

      .sentence-builder-tray {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: center;
        min-height: 104px;
        padding: 18px;
        border-radius: 26px;
        background: rgba(255, 255, 255, .74);
        border: 3px dashed rgba(152, 196, 255, .95);
        box-shadow: inset 0 0 0 4px rgba(255, 255, 255, .35);
      }

      .sentence-builder-game.wrong .sentence-builder-tray {
        border-color: #ff9b9b;
        background: #fff7f7;
        animation: sentenceBuilderShake .42s ease-in-out;
      }

      .sentence-builder-game.correct .sentence-builder-tray {
        border-color: #18B865;
        background: #EFFFF5;
        animation: sentenceBuilderCorrectGlow .4s ease-out;
      }

      .sentence-builder-empty-slot,
      .sentence-builder-selected-word,
      .sentence-builder-word-tile {
        min-height: 64px;
        border-radius: 20px;
        padding: 14px 20px;
        font-size: clamp(20px, 2.8vw, 32px);
        font-weight: 1000;
      }

      .sentence-builder-empty-slot {
        display: inline-grid;
        place-items: center;
        min-width: 110px;
        background: #F8FBFF;
        border: 2px solid #DDEBFF;
        color: #8A9BB3;
      }

      .sentence-builder-selected-word {
        border: 3px solid #18B865;
        background: #EFFFF5;
        color: #0B743D;
        cursor: pointer;
        box-shadow: 0 10px 18px rgba(24, 184, 101, .14);
      }

      .sentence-builder-word-bank {
        display: flex;
        flex-wrap: wrap;
        gap: 14px;
      }

      .sentence-builder-word-tile {
        border: 3px solid #DDEBFF;
        background: #FFFFFF;
        color: #16233d;
        cursor: pointer;
        box-shadow: 0 10px 0 rgba(50, 74, 112, .12), 0 20px 36px rgba(51, 76, 115, .10);
        transition: transform .18s ease, opacity .18s ease;
      }

      .sentence-builder-word-tile:hover {
        transform: translateY(-4px);
      }

      .sentence-builder-word-tile.used {
        opacity: .38;
        transform: scale(.96);
        cursor: not-allowed;
      }

      .sentence-builder-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }

      .sentence-builder-clear,
      .sentence-builder-check {
        border: 0;
        border-radius: 18px;
        padding: 15px 22px;
        color: #FFFFFF;
        font-size: 17px;
        font-weight: 1000;
        cursor: pointer;
        box-shadow: 0 10px 0 rgba(34, 70, 120, .18);
      }

      .sentence-builder-clear {
        background: linear-gradient(135deg, #9CA3AF, #64748B);
      }

      .sentence-builder-check {
        background: linear-gradient(135deg, #22C55E, #16A34A);
      }

      .sentence-builder-clear:disabled,
      .sentence-builder-check:disabled {
        opacity: .55;
        cursor: not-allowed;
      }

      .sentence-builder-toast {
        position: fixed;
        left: 50%;
        top: 46%;
        z-index: 1200;
        width: fit-content;
        max-width: calc(100vw - 48px);
        padding: 18px 24px;
        border-radius: 24px;
        background: rgba(255, 255, 255, .98);
        border: 3px solid #F8DE7E;
        color: #16233d;
        font-size: clamp(22px, 3vw, 34px);
        font-weight: 1000;
        text-align: center;
        box-shadow: 0 22px 60px rgba(20, 40, 70, .22);
        transform: translate(-50%, -50%);
        animation: letterPopToastCelebrate 1.2s ease-in-out both;
        pointer-events: none;
      }

      .sentence-builder-toast.warn {
        background: linear-gradient(135deg, #fff8f8, #fff1c9);
        border-color: #ffb2b2;
        animation: letterPopToastPop .2s ease-out;
      }

      @keyframes sentenceBuilderShake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-8px) rotate(-1deg); }
        40% { transform: translateX(8px) rotate(1deg); }
        60% { transform: translateX(-5px) rotate(-.5deg); }
        80% { transform: translateX(5px) rotate(.5deg); }
      }

      @keyframes sentenceBuilderCorrectGlow {
        0% { transform: scale(.98); box-shadow: 0 0 0 rgba(24, 184, 101, 0); }
        55% { transform: scale(1.01); box-shadow: 0 0 0 8px rgba(24, 184, 101, .12); }
        100% { transform: scale(1); }
      }

      .picture-guess-game {
        display: grid;
        gap: 18px;
        margin-top: 10px;
      }

      .picture-guess-card {
        position: relative;
        overflow: hidden;
        display: grid;
        justify-items: center;
        gap: 12px;
        padding: 24px;
        border-radius: 30px;
        background:
          radial-gradient(circle at 14% 18%, rgba(255, 235, 161, .55), transparent 28%),
          linear-gradient(135deg, rgba(255, 255, 255, .98), rgba(239, 247, 255, .96));
        border: 3px solid rgba(198, 224, 255, .95);
        box-shadow: 0 10px 0 rgba(210, 226, 247, .75), 0 22px 50px rgba(67, 91, 130, .10);
        text-align: center;
      }

      .picture-guess-label {
        width: fit-content;
        padding: 8px 13px;
        border-radius: 999px;
        background: #fff7d6;
        border: 2px solid #ffe28a;
        color: #7c5300;
        font-size: 15px;
        font-weight: 1000;
      }

      .picture-guess-image {
        width: clamp(120px, 16vw, 190px);
        height: clamp(120px, 16vw, 190px);
        display: grid;
        place-items: center;
        border-radius: 34px;
        background: #FFFFFF;
        border: 3px solid rgba(255, 226, 138, .9);
        box-shadow: 0 16px 34px rgba(60, 103, 135, .13);
        font-size: clamp(68px, 9vw, 120px);
        animation: pictureGuessFloat 2.8s ease-in-out infinite;
      }

      .picture-guess-card h3 {
        margin: 4px 0 0;
        color: #16233d;
        font-size: clamp(24px, 3vw, 38px);
        line-height: 1.1;
        font-weight: 1000;
      }

      .picture-guess-card p {
        margin: 0;
        color: #405674;
        font-size: clamp(17px, 2vw, 22px);
        font-weight: 900;
      }

      .picture-guess-options {
        display: grid;
        grid-template-columns: repeat(3, minmax(130px, 1fr));
        gap: 16px;
      }

      .picture-guess-choice {
        min-height: 86px;
        border: 3px solid #DDEBFF;
        border-radius: 24px;
        background: #FFFFFF;
        color: #16233d;
        font-size: clamp(22px, 3vw, 34px);
        font-weight: 1000;
        cursor: pointer;
        box-shadow: 0 12px 0 rgba(50, 74, 112, .12), 0 22px 40px rgba(51, 76, 115, .12);
        transition: transform .18s ease, border-color .18s ease, background .18s ease, box-shadow .18s ease;
      }

      .picture-guess-choice:hover {
        transform: translateY(-4px);
        border-color: #9BDDB6;
      }

      .picture-guess-choice.correct {
        border-color: #18B865;
        background: #EFFFF5;
        color: #0B743D;
        animation: pictureGuessCorrect .35s ease-out;
      }

      .picture-guess-choice.wrong {
        border-color: #FF8A8A;
        background: #FFF4F4;
        animation: pictureGuessWrong .42s ease-in-out;
      }

      .picture-guess-toast {
        position: fixed;
        left: 50%;
        top: 46%;
        z-index: 1200;
        width: fit-content;
        max-width: calc(100vw - 48px);
        padding: 18px 24px;
        border-radius: 24px;
        background: rgba(255, 255, 255, .98);
        border: 3px solid #F8DE7E;
        color: #16233d;
        font-size: clamp(22px, 3vw, 34px);
        font-weight: 1000;
        text-align: center;
        box-shadow: 0 22px 60px rgba(20, 40, 70, .22);
        transform: translate(-50%, -50%);
        animation: letterPopToastCelebrate 1.2s ease-in-out both;
        pointer-events: none;
      }

      .picture-guess-toast.warn {
        background: linear-gradient(135deg, #fff8f8, #fff1c9);
        border-color: #ffb2b2;
        animation: letterPopToastPop .2s ease-out;
      }

      @keyframes pictureGuessFloat {
        0%, 100% { transform: translateY(0) rotate(-1deg); }
        50% { transform: translateY(-8px) rotate(1deg); }
      }

      @keyframes pictureGuessWrong {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-8px) rotate(-1deg); }
        40% { transform: translateX(8px) rotate(1deg); }
        60% { transform: translateX(-5px) rotate(-.5deg); }
        80% { transform: translateX(5px) rotate(.5deg); }
      }

      @keyframes pictureGuessCorrect {
        0% { transform: scale(.98); }
        55% { transform: scale(1.04); box-shadow: 0 0 0 8px rgba(24, 184, 101, .12); }
        100% { transform: scale(1); }
      }

      @media (max-width: 760px) {
        .picture-guess-options {
          grid-template-columns: 1fr;
        }
      }

      .letter-pop-game {
        position: relative;
        display: grid;
        gap: 22px;
        margin-top: 8px;
      }

      .letter-pop-prompt-card {
        position: relative;
        overflow: hidden;
        border-radius: 28px;
        padding: 26px 28px;
        background:
          radial-gradient(circle at 12% 18%, rgba(255, 235, 161, .65), transparent 30%),
          linear-gradient(135deg, rgba(255, 255, 255, .98), rgba(239, 247, 255, .96));
        border: 3px solid rgba(198, 224, 255, .95);
        box-shadow: 0 10px 0 rgba(210, 226, 247, .75), 0 22px 50px rgba(67, 91, 130, .10);
      }

      .letter-pop-mini-label {
        display: inline-flex;
        align-items: center;
        width: fit-content;
        margin-bottom: 12px;
        padding: 8px 13px;
        border-radius: 999px;
        background: #fff7d6;
        border: 2px solid #ffe28a;
        color: #7c5300;
        font-size: 15px;
        font-weight: 1000;
      }

      .letter-pop-equation {
        color: #16233d;
        font-size: clamp(30px, 4vw, 54px);
        line-height: 1.12;
        font-weight: 1000;
        letter-spacing: .01em;
      }

      .letter-pop-clue {
        margin-top: 12px;
        color: #405674;
        font-size: clamp(18px, 2vw, 24px);
        font-weight: 900;
      }

      .letter-pop-toast {
        position: fixed;
        left: 50%;
        top: 45%;
        z-index: 1200;
        width: fit-content;
        max-width: calc(100vw - 48px);
        padding: 18px 24px;
        border-radius: 24px;
        background: rgba(255, 255, 255, .98);
        border: 3px solid #F8DE7E;
        color: #16233d;
        font-size: clamp(22px, 3vw, 34px);
        font-weight: 1000;
        text-align: center;
        box-shadow: 0 22px 60px rgba(20, 40, 70, .22);
        transform: translate(-50%, -50%);
        animation: letterPopToastPop .2s ease-out;
        pointer-events: none;
      }

      .letter-pop-toast.good {
        background: linear-gradient(135deg, #fffdf2, #fff7c7);
        border-color: #F8DE7E;
        animation: letterPopToastCelebrate 1.5s ease-in-out both;
      }

      .letter-pop-toast.good::before,
      .letter-pop-toast.good::after {
        content: '✨';
        display: inline-block;
        margin: 0 8px;
        animation: letterPopToastSparkle .75s ease-in-out infinite alternate;
      }

      .letter-pop-toast.good::after {
        animation-delay: .18s;
      }

      .letter-pop-toast.warn {
        background: linear-gradient(135deg, #fff8f8, #fff1c9);
        border-color: #ffb2b2;
      }

      @keyframes letterPopToastPop {
        from {
          opacity: 0;
          transform: translate(-50%, -45%) scale(.88);
        }
        to {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }
      }

      @keyframes letterPopToastCelebrate {
        0% {
          opacity: 0;
          transform: translate(-50%, -45%) scale(.88) rotate(-1deg);
        }
        15% {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1.06) rotate(1deg);
        }
        35%, 75% {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1) rotate(0deg);
          box-shadow: 0 22px 60px rgba(20, 40, 70, .22), 0 0 0 8px rgba(248, 222, 126, .16);
        }
        100% {
          opacity: 0;
          transform: translate(-50%, -54%) scale(.96) rotate(0deg);
        }
      }

      @keyframes letterPopToastSparkle {
        from {
          transform: translateY(0) scale(.9) rotate(-8deg);
          opacity: .65;
        }
        to {
          transform: translateY(-4px) scale(1.15) rotate(8deg);
          opacity: 1;
        }
      }

      .letter-pop-balloon-field {
        position: relative;
        display: grid;
        grid-template-columns: repeat(3, minmax(130px, 1fr));
        gap: 22px;
        align-items: end;
        padding: 16px 4px 28px;
      }

      .letter-pop-balloon {
        position: relative;
        min-height: 148px;
        border: 0;
        border-radius: 52% 52% 48% 48% / 58% 58% 42% 42%;
        color: #16233d;
        font-size: clamp(28px, 4vw, 44px);
        font-weight: 1000;
        cursor: pointer;
        box-shadow: inset -12px -18px 30px rgba(0, 0, 0, .08), 0 14px 0 rgba(50, 74, 112, .16), 0 24px 42px rgba(51, 76, 115, .18);
        transform-origin: center bottom;
        animation: letterPopFloat 2.8s ease-in-out infinite;
        transition: transform .18s ease, filter .18s ease, box-shadow .18s ease;
      }

      .letter-pop-balloon:hover {
        transform: translateY(-7px) scale(1.03);
        filter: saturate(1.08);
      }

      .letter-pop-balloon.tone-0 {
        background: linear-gradient(145deg, #fff7b9, #ffc857);
      }

      .letter-pop-balloon.tone-1 {
        background: linear-gradient(145deg, #c9f7ff, #62c8ff);
        animation-delay: .16s;
      }

      .letter-pop-balloon.tone-2 {
        background: linear-gradient(145deg, #ffd6f1, #ff79c8);
        animation-delay: .32s;
      }

      .letter-pop-balloon.tone-3 {
        background: linear-gradient(145deg, #d8ffdc, #60d96e);
        animation-delay: .48s;
      }

      .letter-pop-shine {
        position: absolute;
        top: 20%;
        left: 24%;
        width: 30px;
        height: 42px;
        border-radius: 999px;
        background: rgba(255, 255, 255, .62);
        transform: rotate(28deg);
        pointer-events: none;
      }

      .letter-pop-string {
        position: absolute;
        left: 50%;
        bottom: -34px;
        width: 3px;
        height: 42px;
        background: rgba(54, 69, 99, .28);
        transform: translateX(-50%);
        pointer-events: none;
      }

      .letter-pop-text {
        position: relative;
        z-index: 1;
      }

      .letter-pop-balloon.wrong {
        animation: letterPopShake .42s ease-in-out;
        box-shadow: inset -12px -18px 30px rgba(0, 0, 0, .08), 0 0 0 5px rgba(255, 98, 98, .25), 0 14px 0 rgba(50, 74, 112, .16);
      }

      .letter-pop-balloon.popped {
        animation: letterPopPop .5s ease-out forwards;
      }

      .letter-pop-burst {
        position: absolute;
        inset: -12px;
        display: grid;
        place-items: center;
        color: #fff;
        font-size: 86px;
        text-shadow: 0 5px 18px rgba(255, 168, 0, .55);
        animation: letterPopBurst .55s ease-out forwards;
        pointer-events: none;
      }

      .letter-pop-helper {
        justify-self: center;
        width: fit-content;
        max-width: 100%;
        padding: 12px 18px;
        border-radius: 999px;
        background: rgba(255, 255, 255, .86);
        border: 2px solid rgba(186, 230, 253, .85);
        color: #2d4c70;
        font-weight: 900;
        text-align: center;
      }

      .letter-pop-game.standard .letter-pop-balloon.popped {
        animation: letterPopPop .5s ease-out forwards;
      }

      .letter-pop-game.standard .letter-pop-balloon {
        border-radius: 32px;
        min-height: 116px;
        animation-name: letterPopCardFloat;
      }

      @keyframes letterPopFloat {
        0%, 100% { transform: translateY(0) rotate(-1deg); }
        50% { transform: translateY(-10px) rotate(1deg); }
      }

      @keyframes letterPopCardFloat {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-6px); }
      }

      @keyframes letterPopShake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-8px) rotate(-2deg); }
        40% { transform: translateX(8px) rotate(2deg); }
        60% { transform: translateX(-5px) rotate(-1deg); }
        80% { transform: translateX(5px) rotate(1deg); }
      }

      @keyframes letterPopPop {
        0% { transform: scale(1); opacity: 1; }
        55% { transform: scale(1.18); opacity: .95; }
        100% { transform: scale(.25); opacity: 0; }
      }

      @keyframes letterPopBurst {
        0% { transform: scale(.35) rotate(0deg); opacity: 0; }
        45% { transform: scale(1.2) rotate(12deg); opacity: 1; }
        100% { transform: scale(1.65) rotate(24deg); opacity: 0; }
      }

      @media (max-width: 760px) {
        .letter-pop-balloon-field {
          grid-template-columns: 1fr;
        }

        .letter-pop-balloon {
          min-height: 112px;
        }
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

      /* === Pagtutugma ng Salita shuffled picture polish START === */


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

      /* === Pagtutugma ng Salita toast overlay polish START === */

    `}
</style>

      <Notification notice={notice} />

      {loading && (
  <div className="tt-loading-overlay">
    <div className="notif">
      ⏳ Inihahanda...
    </div>
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
          loading={loading}
          selectedAvatar={selectedAvatar}
          setSelectedAvatar={setSelectedAvatar}
          onLogin={() => handleLogin('student')}
        />
      </Screen>

      <Screen id="screen-login-teacher" active={screen === 'screen-login-teacher'}>
        <TeacherLogin
          go={go}
          loading={loading}
          onLogin={() => handleLogin('teacher')}
        />
      </Screen>

      <Screen id="screen-login-admin" active={screen === 'screen-login-admin'}>
        <AdminLogin
          go={go}
          loading={loading}
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
          logout={doLogout}
          openLesson={openLesson}
          data={studentDash}
        />
      </Screen>

<Screen id="screen-stu-quizzes" active={screen === 'screen-stu-quizzes'}>
  <QuizzesPage
    data={studentDash}
    go={go}
    logout={doLogout}
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
  {selectedQuizzes && (
    <QuizPlayer
      data={studentDash}
      quiz={selectedQuizzes}
      resetKey={quizPlaySession}
      go={go}
      logout={doLogout}
      submitQuiz={submitQuizzes}
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
      logout={doLogout}
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
            logout={doLogout}
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
          logout={doLogout}
          onPlayMission={(gameId) => {
            setSelectedMissionGameId(gameId);
            go('screen-stu-mission-play');
            saveStudentNavigationState({
              screen: 'screen-stu-mission-play',
              selectedMissionGameId: gameId,
              selectedLessonId: null,
              selectedQuizzesId: null,
              subjectFilter
            });
          }}
        />
      </Screen>

      <Screen id="screen-stu-mission-play" active={screen === 'screen-stu-mission-play'}>
        <StudentMissionPlay
          data={studentDash}
          go={go}
          logout={doLogout}
          selectedGameId={selectedMissionGameId}
          onBack={() => go('screen-stu-missions')}
          refresh={loadStudentDashboard}
        />
      </Screen>

      <Screen id="screen-stu-groups" active={screen === 'screen-stu-groups'}>
        <StudentGroups
          data={studentDash}
          go={go}
          logout={doLogout}
          completeGroupTask={completeGroupTask}
        />
      </Screen>

      <Screen id="screen-stu-badges" active={screen === 'screen-stu-badges'}>
        <StudentBadges
          data={studentDash}
          go={go}
          logout={doLogout}
        />
      </Screen>

      <Screen id="screen-stu-leaderboard" active={screen === 'screen-stu-leaderboard'}>
        <StudentLeaderboard
          data={studentDash}
          go={go}
          logout={doLogout}
        />
      </Screen>

      <Screen id="screen-stu-profile" active={screen === 'screen-stu-profile'}>
        <StudentProfile
          data={studentDash}
          selectedAvatar={selectedAvatar}
          updateAvatar={updateAvatar}
          go={go}
          logout={doLogout}
        />
      </Screen>

      <Screen id="screen-teacher" active={screen === 'screen-teacher'}>
        <TeacherDashboard
          user={user}
          data={teacherData}
          logout={doLogout}
          reload={() => safeRun(loadTeacherDashboard)}
          createGroup={teacherCreateGroup}
          updateGroup={teacherUpdateGroup}
          addTask={teacherAddTask}
          addMember={teacherAddMember}
          setGroupLeader={teacherSetGroupLeader}
          deleteGroup={teacherDeleteGroup}
          approveGroupTaskCompletion={teacherApproveGroupTaskCompletion}
          rejectGroupTaskCompletion={teacherReturnGroupTaskCompletion}
          createLesson={teacherCreateLesson}
          deleteLesson={teacherDeleteLesson}
          exportStudentsCSV={exportStudentsCSV}
          exportLogsCSV={exportLogsCSV}
          downloadBuodReport={downloadBuodReport}
          gradeWritingSubmission={teacherGradeWritingSubmission}
          reviewSpeechAttempt={teacherReviewSpeechAttempt}
          searchExistingStudents={teacherSearchExistingStudents}
          createTeacherSection={teacherCreateSection}
          updateStudentSection={teacherUpdateStudentSection}
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
  updateAccountStatus={adminUpdateAccountStatus}
  updateStudentEnrollment={adminUpdateStudentEnrollment}
  assignTeacherClass={assignTeacherClass}
  removeTeacherAssignment={removeTeacherAssignment}
  reload={() => safeRun(loadAdminDashboard)}
          exportSummaryCSV={exportSummaryCSV}
          downloadAuditTrailReport={downloadAuditTrailReport}
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



function getUnlimitedAwareQuizMaxAttempts(
  quiz = {},
  fallback = 2
) {
  const normalized = String(
    quiz?.maxAttempts ??
    quiz?.max_attempts ??
    quiz?.dataJson?.maxAttempts ??
    quiz?.dataJson?.max_attempts ??
    quiz?.data_json?.maxAttempts ??
    quiz?.data_json?.max_attempts ??
    fallback
  ).trim().toLowerCase();

  if (
    normalized === 'unlimited' ||
    normalized === '0'
  ) {
    return 0;
  }

  const parsed = Number(normalized);

  return Number.isInteger(parsed)
    ? Math.min(10, Math.max(1, parsed))
    : fallback;
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
    [quizId]: [result, ...asArray(attempts?.[quizId])]
  };
  saveQuizAttempts(studentId, next);
  return next;
}


function normalizeQuizzesOption(option = {}, index = 0) {
  const rawText =
    option?.text ??
    option?.optionText ??
    option?.label ??
    option?.value ??
    `Pagpipilian ${index + 1}`;

  const text = String(rawText || `Pagpipilian ${index + 1}`).trim() || `Pagpipilian ${index + 1}`;

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
  const fillers = ['Pagbasa', 'Bokabularyo', 'Panitikan', 'Komunikasyong Pagsasalita', 'Pagsulat', 'Hindi nabanggit'];
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

function buildQuizzesQuestionsFromLesson(lesson = {}) {
  const activities = asArray(lesson?.activities);
  const questions = [];

  activities.forEach((activity, activityIndex) => {
    if (activity?.type === 'mcq') {
      asArray(activity.questions).forEach((question, questionIndex) => {
        const options = asArray(question.options || question.choices).map(normalizeQuizzesOption);
        if (!options.length) return;
        const hasCorrect = options.some(option => option.isCorrect);
        questions.push({
          id: String(question.id || `${lesson.id || 'lesson'}-${activityIndex}-${questionIndex}`),
          type: 'mcq',
          source: cleanStudentLessonQuizTitle(lesson),
          prompt: question.question || question.prompt || 'Piliin ang tamang sagot.',
          options: hasCorrect ? options : options.map((option, idx) => ({ ...option, isCorrect: idx === 0 })),
          points: Number(question.points || 1)
        });
      });
    }
  });

  return questions.slice(0, 25);
}

function cleanStudentVisibleLessonTitle(lesson = {}) {
  const title = String(
    lesson?.title ||
    lesson?.name ||
    lesson?.lessonTitle ||
    lesson?.moduleTitle ||
    'Aralin'
  )
    .replace(/^\s*(?:lessons?|mga aralin|missions?|mga misyon)\s*(?:ng|g)?\s*pang-aral\s*$/i, 'Aralin')
    .replace(/^\s*(?:quizzes?|pagsusulit)\s+sa\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  return title || 'Aralin';
}

function cleanStudentLessonQuizTitle(lesson = {}) {
  const value = String(lesson?.title || lesson?.name || lesson?.lessonTitle || 'Aralin')
    .replace(/^\s*(?:quizzes?|pagsusulit)\s+sa\s+/i, '')
    .replace(/\s*quiz\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  return value || 'Aralin';
}

function formatStudentLessonQuizTitle(lesson = {}) {
  return cleanStudentLessonQuizTitle(lesson);
}

function buildStudentQuizzes(data = {}) {
  return asArray(data?.lessons).map((lesson) => {
    const questions = buildQuizzesQuestionsFromLesson(lesson);
    return {
      id: `lesson-${lesson.id || lesson.title}-quiz`,
      lessonId: lesson.id,
      lessonTitle: lesson.title || 'Aralin',
      title: cleanStudentLessonQuizTitle(lesson),
      subject: lesson.subject || 'Filipino',
      gradeLevel: lesson.gradeLevel || data?.student?.gradeLevel || '—',
      xpReward: Math.max(5, Math.round(Number(lesson.xpReward || 20) / 2)),
      type: lesson.completed ? 'Pagsusulit Pagkatapos ng Aralin' : 'Pagsasanay na Pagsusulit',
      unlocked: true,
      questions
    };
  }).filter(quiz => quiz.questions.length);
}

function getQuizzesStats(quizzes = [], attempts = {}) {
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
      selectedText: selectedOption?.text || 'Walang sagot',
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
    if (tab === 'leaderboard') return go('screen-stu-leaderboard');
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


function EarlyStudentDashboard({ data, openFirstSubjectLesson, goStudentTab, logout, selectedAvatar }) {
  const s = data?.student || {};
  const stats = subjectStatsFor(data);
  const level = levelForXp(s.xp);
  const xpPct = xpPercent(s.xp);

  const mainSubjects = ['Pagbasa', 'Bokabularyo', 'Panitikan', 'Komunikasyong Pagsasalita', 'Pagsulat'];
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
        width: min(1280px, calc(100vw - 32px));
        z-index: 80;
        min-height: 74px;
        padding: 8px 14px;
        display: grid;
        grid-template-columns: repeat(8, minmax(0, 1fr));
        gap: 4px;
        border-radius: 30px;
        background: rgba(255, 255, 255, 0.96);
        border: 1px solid rgba(39, 174, 96, 0.08);
        box-shadow: 0 14px 30px rgba(25, 78, 54, 0.09);
        backdrop-filter: blur(16px);
      }

      .g12-nav button {
        border: 0;
        background: transparent;
        border-radius: 22px;
        color: #203451;
        font-size: 14px;
        font-weight: 950;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        min-width: 0;
        white-space: nowrap;
      }

      .g12-nav button.active {
        background: #edf8f1;
        color: #15965a;
      }

      .g12-nav-icon {
        font-size: 28px;
        line-height: 1;
      }

      /* Baitang 1-2 Kid Curious style: bigger, playful, and game-like while keeping Tuklas colors. */
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

      /* Baitang 1-2 readability safeguard: avoid white text on light/green gradients. */

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
        /* Baitang 1-2 balanced lesson card arrow override */
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

/* Baitang 1-2 balanced font sizing: playful, readable, and not oversized. */
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

        /* === Baitang 1-2 Logout Button Polish === */
        .g12-logout-btn {
          color: #b42318 !important;
          border-color: rgba(244, 63, 94, 0.42) !important;
          background: linear-gradient(135deg, #fff5f5, #fffafa) !important;
          box-shadow: 0 10px 24px rgba(180, 35, 24, 0.10) !important;
          transition:
            color 0.22s ease,
            background 0.22s ease,
            border-color 0.22s ease,
            box-shadow 0.22s ease,
            transform 0.22s ease;
        }

        .g12-logout-btn:hover {
          color: #ffffff !important;
          border-color: #dc2626 !important;
          background: linear-gradient(135deg, #ef4444, #b42318) !important;
          transform: translateY(-1px);
          box-shadow: 0 14px 30px rgba(180, 35, 24, 0.20) !important;
        }
        /* === End Baitang 1-2 Logout Button Polish === */


        /* === Baitang 1-2 Bottom Nav Smooth Hover === */
        .g12-bottom-nav button,
        .g12-bottom-nav a,
        .g12-nav button,
        .g12-nav a,
        .g12-tab-btn,
        .g12-nav-btn,
        .g12-bottom-tab,
        .g12-floating-nav button {
          transition:
            color 0.22s ease,
            background 0.22s ease,
            border-color 0.22s ease,
            box-shadow 0.22s ease,
            transform 0.22s ease,
            opacity 0.22s ease;
        }

        .g12-bottom-nav button span,
        .g12-bottom-nav a span,
        .g12-nav button span,
        .g12-nav a span,
        .g12-tab-btn span,
        .g12-nav-btn span,
        .g12-bottom-tab span,
        .g12-floating-nav button span {
          transition: transform 0.22s ease, filter 0.22s ease;
        }

        @media (hover: hover) {
          .g12-bottom-nav button:hover,
          .g12-bottom-nav a:hover,
          .g12-nav button:hover,
          .g12-nav a:hover,
          .g12-tab-btn:hover,
          .g12-nav-btn:hover,
          .g12-bottom-tab:hover,
          .g12-floating-nav button:hover {
            transform: translateY(-2px);
            box-shadow: 0 14px 28px rgba(20, 34, 59, 0.10);
          }

          .g12-bottom-nav button:hover span,
          .g12-bottom-nav a:hover span,
          .g12-nav button:hover span,
          .g12-nav a:hover span,
          .g12-tab-btn:hover span,
          .g12-nav-btn:hover span,
          .g12-bottom-tab:hover span,
          .g12-floating-nav button:hover span {
            transform: scale(1.06);
            filter: drop-shadow(0 4px 8px rgba(20, 34, 59, 0.12));
          }
        }

        .g12-bottom-nav button:active,
        .g12-bottom-nav a:active,
        .g12-nav button:active,
        .g12-nav a:active,
        .g12-tab-btn:active,
        .g12-nav-btn:active,
        .g12-bottom-tab:active,
        .g12-floating-nav button:active {
          transform: translateY(0) scale(0.98);
        }
        /* === End Baitang 1-2 Bottom Nav Smooth Hover === */







        /* g12LessonsCardPolish */
        .g12-card-grid {
          gap: 24px;
        }

        .g12-card-grid .g12-tile {
          position: relative;
          display: grid;
          grid-template-columns: 116px minmax(0, 1fr) 66px;
          align-items: center;
          gap: 22px;
          min-height: 188px;
          padding: 28px;
          overflow: hidden;
          isolation: isolate;
          transform-origin: center;
          animation: g12LessonCardFloat 5s ease-in-out infinite;
        }

        .g12-card-grid .g12-tile:nth-child(2n) {
          animation-delay: .42s;
        }

        .g12-card-grid .g12-tile:nth-child(3n) {
          animation-delay: .84s;
        }

        .g12-card-grid .g12-tile::before {
          content: '';
          position: absolute;
          width: 180px;
          height: 180px;
          right: -64px;
          top: -72px;
          border-radius: 999px;
          background: rgba(255, 255, 255, .35);
          z-index: -1;
        }

        .g12-card-grid .g12-tile::after {
          content: '';
          position: absolute;
          inset: 0;
          transform: translateX(-120%) skewX(-18deg);
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, .34), transparent);
          pointer-events: none;
        }

        .g12-card-grid .g12-tile:hover {
          transform: translateY(-7px) scale(1.01);
          box-shadow: 0 20px 46px rgba(52, 76, 112, .16);
        }

        .g12-card-grid .g12-tile:hover::after {
          animation: g12LessonCardShine .85s ease-out;
        }

        .g12-card-grid .g12-tile:hover .g12-tile-icon {
          animation: g12LessonIconWiggle .72s ease-in-out;
        }

        .g12-card-grid .g12-tile-icon {
          width: 96px;
          height: 96px;
          display: grid;
          place-items: center;
          border-radius: 30px;
          background: rgba(255, 255, 255, .72);
          border: 3px solid rgba(255, 255, 255, .86);
          font-size: 48px;
          box-shadow: 0 16px 34px rgba(55, 75, 105, .12);
        }

        .g12-lesson-tile-body {
          display: grid;
          gap: 9px;
          min-width: 0;
          text-align: left;
        }

        .g12-lesson-tile-body h3 {
          margin: 0;
          font-size: clamp(28px, 2.6vw, 38px);
          line-height: 1.02;
          letter-spacing: -0.025em;
        }

        .g12-lesson-tile-body p {
          width: fit-content;
          margin: 0;
          padding: 7px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, .72);
          border: 2px solid rgba(255, 255, 255, .9);
          color: #38526B;
          font-size: 15px;
          font-weight: 1000;
        }

        .g12-card-grid .g12-tile .g12-arrow {
          animation: g12LessonArrowBounce 1.8s ease-in-out infinite;
        }

        @keyframes g12LessonCardFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        @keyframes g12LessonCardShine {
          from { transform: translateX(-120%) skewX(-18deg); }
          to { transform: translateX(135%) skewX(-18deg); }
        }

        @keyframes g12LessonIconWiggle {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(-5deg) scale(1.05); }
          50% { transform: rotate(5deg) scale(1.07); }
          75% { transform: rotate(-3deg) scale(1.04); }
        }

        @keyframes g12LessonArrowBounce {
          0%, 100% { transform: translateX(-24px); }
          50% { transform: translateX(-18px); }
        }

        @media (prefers-reduced-motion: reduce) {
          .g12-card-grid .g12-tile,
          .g12-card-grid .g12-tile .g12-arrow {
            animation: none;
          }
        }



        /* learningWorldSubjectImageSizing */
        .g12-subject-illustration .subject-img-icon.world {
          width: 58% !important;
          height: 58% !important;
          max-width: 58px !important;
          max-height: 58px !important;
          object-fit: contain !important;
          margin: 0 !important;
        }

        .g12-card-grid .g12-tile-icon .subject-img-icon.lesson,
        .quiz-card-icon .subject-img-icon {
          width: 58% !important;
          height: 58% !important;
          object-fit: contain !important;
        }

        /* subjectImageMinimalSizing */
        .subject-img-icon {
          width: 1.2em;
          height: 1.2em;
          object-fit: contain;
          display: inline-block;
          vertical-align: -0.2em;
        }

        .subject-img-icon.chip {
          width: 22px !important;
          height: 22px !important;
          margin-right: 5px;
          object-fit: contain;
        }

        .g12-card-grid .g12-tile-icon .subject-img-icon,
        .g46-ref-card-icon .subject-img-icon,
        .g12-world-icon .subject-img-icon,
        .g12-filter-icon .subject-img-icon {
          width: 62% !important;
          height: 62% !important;
          max-width: 62px !important;
          max-height: 62px !important;
          object-fit: contain !important;
          margin: 0 !important;
        }

        .g12-card-grid .g12-tile-icon .subject-img-icon.lesson {
          width: 60% !important;
          height: 60% !important;
        }

        .g46-ref-card-icon .subject-img-icon.lesson {
          width: 64% !important;
          height: 64% !important;
        }

        /* g12LessonTitleForceSize */
        .g12-card-grid .g12-tile .g12-lesson-tile-body > h3 {
          font-size: clamp(28px, 2.6vw, 38px) !important;
          line-height: 1.02 !important;
          letter-spacing: -0.025em !important;
          font-weight: 1000 !important;
        }

        .g12-card-grid .g12-tile .g12-lesson-tile-body {
          gap: 9px !important;
        }

        /* === End Baitang 1-2 Lessons Card Polish === */




        /* g12TopXpAnimationPolish */
        .g12-top-xp-pill {
          position: relative;
          overflow: hidden;
          isolation: isolate;
          animation: g12TopXpPulse 2.3s ease-in-out infinite;
          box-shadow:
            0 8px 0 rgba(246, 196, 83, .28),
            0 16px 28px rgba(245, 158, 11, .10);
        }

        .g12-top-xp-pill::after {
          content: '';
          position: absolute;
          inset: 0;
          transform: translateX(-120%) skewX(-18deg);
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, .72), transparent);
          animation: g12TopXpShine 2.8s ease-in-out infinite;
          z-index: -1;
        }

        .g12-top-xp-bolt {
          display: inline-block;
          transform-origin: center;
          animation: g12TopXpBoltBounce 1.15s ease-in-out infinite;
          filter: drop-shadow(0 4px 8px rgba(245, 158, 11, .22));
        }

        .g12-top-xp-pill:hover {
          transform: translateY(-3px) scale(1.03);
          filter: saturate(1.08);
        }

        @keyframes g12TopXpPulse {
          0%, 100% {
            box-shadow:
              0 6px 0 rgba(246, 196, 83, .26),
              0 12px 22px rgba(245, 158, 11, .10);
          }
          50% {
            box-shadow:
              0 6px 0 rgba(246, 196, 83, .34),
              0 0 0 8px rgba(248, 222, 126, .22),
              0 14px 26px rgba(245, 158, 11, .16);
          }
        }

        @keyframes g12TopXpShine {
          0%, 55% {
            transform: translateX(-120%) skewX(-18deg);
          }
          100% {
            transform: translateX(130%) skewX(-18deg);
          }
        }

        @keyframes g12TopXpBoltBounce {
          0%, 100% {
            transform: translateY(0) rotate(0deg) scale(1);
          }
          45% {
            transform: translateY(-3px) rotate(-8deg) scale(1.14);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .g12-top-xp-pill,
          .g12-top-xp-pill::after,
          .g12-top-xp-bolt {
            animation: none;
          }
        }

        /* g12TopXpSizeBalance */
        .g12-top-xp-pill {
          min-height: 50px !important;
          padding: 0 16px !important;
          border-radius: 20px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 6px !important;
          font-size: 16px !important;
          font-weight: 1000 !important;
          letter-spacing: 0 !important;
        }

        .g12-top-xp-bolt {
          font-size: 18px !important;
          line-height: 1 !important;
        }

        @media (max-width: 760px) {
          .g12-top-xp-pill {
            min-height: 48px !important;
            padding: 0 14px !important;
            font-size: 16px !important;
          }

          .g12-top-xp-bolt {
            font-size: 18px !important;
          }
        }
        /* === End Baitang 1-2 Top XP Size Balance === */

        /* === End Baitang 1-2 Top XP Animation Polish === */


        /* g12HomeHeroAnimationPolish */
        .g12-hero {
          background-size: 130% 130%, 120% 120%, 100% 100%;
          animation: g12HeroSoftGlow 8s ease-in-out infinite;
        }

        .g12-hero-img {
          animation: g12HeroKidsFloat 4.8s ease-in-out infinite;
          transform-origin: center bottom;
        }

        .g12-star {
          animation: g12HeroStarTwinkle 2.6s ease-in-out infinite;
        }

        .g12-star.two {
          animation-delay: .45s;
        }

        .g12-star.three {
          animation-delay: .9s;
        }

        .g12-home-avatar-badge {
          animation: g12HeroAvatarBounce 3.8s ease-in-out infinite;
        }

        .g12-home-greeting-row h1 {
          animation: g12HeroGreetingLift 4.5s ease-in-out infinite;
          transform-origin: left center;
        }

        .g12-progress-coin {
          animation: g12HeroCoinBounce 1.9s ease-in-out infinite;
        }

        .g12-progress-fill {
          position: relative;
          overflow: hidden;
        }

        .g12-progress-fill::after {
          content: '';
          position: absolute;
          inset: 0;
          transform: translateX(-120%);
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, .7), transparent);
          animation: g12HeroProgressShine 2.8s ease-in-out infinite;
        }

        .g12-progress-card {
          animation: g12HeroProgressFloat 5.2s ease-in-out infinite;
        }

        @keyframes g12HeroSoftGlow {
          0%, 100% {
            background-position: 0% 50%, 100% 50%, center;
          }
          50% {
            background-position: 18% 42%, 82% 58%, center;
          }
        }

        @keyframes g12HeroKidsFloat {
          0%, 100% {
            transform: translateY(22px) scale(1);
            filter: drop-shadow(0 18px 24px rgba(50, 80, 70, 0.12));
          }
          50% {
            transform: translateY(12px) scale(1.015);
            filter: drop-shadow(0 24px 30px rgba(50, 80, 70, 0.16));
          }
        }

        @keyframes g12HeroStarTwinkle {
          0%, 100% {
            transform: translateY(0) rotate(0deg) scale(1);
            opacity: .82;
          }
          50% {
            transform: translateY(-6px) rotate(8deg) scale(1.12);
            opacity: 1;
          }
        }

        @keyframes g12HeroAvatarBounce {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-4px) rotate(-2deg);
          }
        }

        @keyframes g12HeroGreetingLift {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }

        @keyframes g12HeroCoinBounce {
          0%, 100% {
            transform: translateY(0) rotate(0deg) scale(1);
          }
          50% {
            transform: translateY(-5px) rotate(-8deg) scale(1.08);
          }
        }

        @keyframes g12HeroProgressShine {
          0%, 55% {
            transform: translateX(-120%);
          }
          100% {
            transform: translateX(120%);
          }
        }

        @keyframes g12HeroProgressFloat {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .g12-hero,
          .g12-hero-img,
          .g12-star,
          .g12-home-avatar-badge,
          .g12-home-greeting-row h1,
          .g12-progress-coin,
          .g12-progress-fill::after,
          .g12-progress-card {
            animation: none;
          }
        }
        /* === End Baitang 1-2 Home Hero Animation Polish === */


        /* g12LearningWorldCardsPolish */
        .g12-subject-grid {
          gap: 22px;
        }

        .g12-subject-card {
          position: relative;
          display: grid;
          grid-template-columns: 122px minmax(0, 1fr) 64px;
          align-items: center;
          gap: 22px;
          min-height: 188px;
          padding: 28px;
          overflow: hidden;
          isolation: isolate;
          transform-origin: center;
          animation: g12WorldCardFloat 5.2s ease-in-out infinite;
        }

        .g12-subject-card:nth-child(2n) {
          animation-delay: .45s;
        }

        .g12-subject-card:nth-child(3n) {
          animation-delay: .9s;
        }

        .g12-subject-card::before {
          content: '';
          position: absolute;
          width: 190px;
          height: 190px;
          right: -70px;
          top: -78px;
          border-radius: 999px;
          background: rgba(255, 255, 255, .38);
          z-index: -1;
        }

        .g12-subject-card::after {
          content: '';
          position: absolute;
          inset: 0;
          transform: translateX(-120%) skewX(-18deg);
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, .34), transparent);
          pointer-events: none;
        }

        .g12-subject-card:hover {
          transform: translateY(-7px) scale(1.01);
          box-shadow: 0 20px 46px rgba(52, 76, 112, .16);
        }

        .g12-subject-card:hover::after {
          animation: g12WorldCardShine .85s ease-out;
        }

        .g12-subject-card:hover .g12-subject-illustration {
          animation: g12WorldIconWiggle .72s ease-in-out;
        }

        .g12-subject-illustration {
          width: 98px;
          height: 98px;
          display: grid;
          place-items: center;
          border-radius: 30px;
          background: rgba(255, 255, 255, .72);
          border: 3px solid rgba(255, 255, 255, .85);
          font-size: 48px;
          box-shadow: 0 16px 34px rgba(55, 75, 105, .12);
        }

        .g12-subject-body {
          display: grid;
          gap: 8px;
          min-width: 0;
          text-align: left;
        }

        .g12-subject-chip {
          width: fit-content;
          padding: 7px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, .72);
          border: 2px solid rgba(255, 255, 255, .9);
          color: #38526B;
          font-size: 13px;
          font-weight: 1000;
        }

        .g12-subject-body h3 {
          margin: 0;
          font-size: clamp(28px, 3vw, 42px);
          line-height: 1;
        }

        .g12-subject-body p {
          margin: 0;
          color: #526988;
          font-size: 16px;
          font-weight: 900;
        }

        .g12-module-progress {
          height: 15px;
          border-radius: 999px;
          background: rgba(255, 255, 255, .68);
          border: 2px solid rgba(255, 255, 255, .9);
          overflow: hidden;
          box-shadow: inset 0 1px 4px rgba(60, 80, 110, .08);
        }

        .g12-module-progress span {
          position: relative;
          display: block;
          height: 100%;
          min-width: 6px;
          border-radius: inherit;
          overflow: hidden;
          background: linear-gradient(90deg, #34D399, #A7F3D0, #F8DE7E);
        }

        .g12-module-progress span::after {
          content: '';
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, .65), transparent);
          animation: g12ProgressShine 2.8s ease-in-out infinite;
        }

        .g12-card-arrow {
          width: 56px;
          height: 56px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: rgba(255, 255, 255, .76);
          color: #0B934C;
          font-size: 42px;
          font-weight: 1000;
          box-shadow: 0 12px 26px rgba(55, 75, 105, .12);
          animation: g12ArrowBounce 1.8s ease-in-out infinite;
        }

        @keyframes g12WorldCardFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        @keyframes g12WorldCardShine {
          from { transform: translateX(-120%) skewX(-18deg); }
          to { transform: translateX(135%) skewX(-18deg); }
        }

        @keyframes g12WorldIconWiggle {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(-5deg) scale(1.05); }
          50% { transform: rotate(5deg) scale(1.07); }
          75% { transform: rotate(-3deg) scale(1.04); }
        }

        @keyframes g12ArrowBounce {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(5px); }
        }

        @keyframes g12ProgressShine {
          0%, 55% { transform: translateX(-100%); }
          100% { transform: translateX(120%); }
        }

        @media (prefers-reduced-motion: reduce) {
          .g12-subject-card,
          .g12-card-arrow,
          .g12-module-progress span::after {
            animation: none;
          }
        }
        /* === End Baitang 1-2 Mga Mundo ng Pag-aaral Card Polish === */


        /* === Baitang 1-2 Home Avatar Badge === */
        .g12-home-greeting-row {
          display: flex;
          align-items: center;
          gap: 18px;
          flex-wrap: wrap;
        }

        .g12-home-avatar-badge {
          width: 78px;
          height: 78px;
          border-radius: 28px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          font-size: 42px;
          background: linear-gradient(135deg, #fff7cf, #ffffff 46%, #eafff2);
          border: 2px solid rgba(250, 204, 21, 0.42);
          box-shadow:
            0 16px 34px rgba(20, 34, 59, 0.10),
            inset 0 0 0 2px rgba(255, 255, 255, 0.78);
          transition:
            transform 0.22s ease,
            box-shadow 0.22s ease,
            filter 0.22s ease;
        }

        .g12-home-avatar-badge:hover {
          transform: translateY(-3px) rotate(-2deg) scale(1.04);
          box-shadow:
            0 20px 42px rgba(20, 34, 59, 0.14),
            inset 0 0 0 2px rgba(255, 255, 255, 0.88);
          filter: saturate(1.08);
        }

        @media (max-width: 720px) {
          .g12-home-greeting-row {
            gap: 12px;
          }

          .g12-home-avatar-badge {
            width: 62px;
            height: 62px;
            border-radius: 22px;
            font-size: 34px;
          }
        }
        /* === End Baitang 1-2 Home Avatar Badge === */
/* === Baitang 1-2 Progress Card No Antas Title === */
        .g12-progress-card {
          width: min(560px, 100%) !important;
          padding: 30px 36px 26px !important;
          border-radius: 34px !important;
        }

        .g12-progress-title-no-name {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 16px !important;
          width: 100% !important;
          margin: 0 0 20px !important;
          padding: 0 !important;
          text-align: center !important;
          color: #14223b !important;
          line-height: 1 !important;
          white-space: nowrap !important;
        }

        .g12-progress-title-no-name .g12-progress-coin {
          width: 54px !important;
          height: 54px !important;
          font-size: 30px !important;
          flex: 0 0 auto !important;
        }

        .g12-progress-xp-no-name,
        .g12-progress-level-no-name {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          color: #14223b !important;
          font-size: 34px !important;
          font-weight: 1000 !important;
          line-height: 1 !important;
          letter-spacing: -0.04em !important;
          white-space: nowrap !important;
          margin: 0 !important;
        }

        .g12-progress-level-no-name {
          min-height: 38px !important;
          padding: 6px 18px !important;
          border-radius: 999px !important;
          background: rgba(255, 246, 220, 0.94) !important;
          color: #7c5b12 !important;
          font-size: 24px !important;
          letter-spacing: -0.025em !important;
        }

        .g12-progress-title-no-name .g12-progress-divider {
          width: 10px !important;
          height: 10px !important;
          margin: 0 2px !important;
          flex: 0 0 auto !important;
        }

        .g12-progress-track {
          width: 100% !important;
          height: 12px !important;
          margin-top: 0 !important;
        }

        @media (max-width: 980px) {
          .g12-progress-title-no-name {
            gap: 10px !important;
            flex-wrap: wrap !important;
          }

          .g12-progress-xp-no-name {
            font-size: 30px !important;
          }

          .g12-progress-level-no-name {
            font-size: 22px !important;
          }
        }
        /* === End Baitang 1-2 Progress Card No Antas Title === */
        /* === Baitang 1-2 Seven Tab Nav Final Polish === */
        .g12-nav {
          width: min(1280px, calc(100vw - 32px)) !important;
          min-height: 82px !important;
          padding: 8px 14px !important;
          display: grid !important;
          grid-template-columns: repeat(8, minmax(0, 1fr)) !important;
          gap: 4px !important;
          align-items: center !important;
          overflow: hidden !important;
        }

        .g12-nav button {
          min-width: 0 !important;
          width: 100% !important;
          min-height: 62px !important;
          padding: 6px 4px !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 3px !important;
          border-radius: 20px !important;
          font-size: 13px !important;
          line-height: 1.05 !important;
          white-space: nowrap !important;
          text-align: center !important;
        }

        .g12-nav-icon {
          font-size: 27px !important;
          line-height: 1 !important;
          display: block !important;
        }

        .g12-nav button.active {
          background: #fff5cf !important;
          color: #07924a !important;
          border: 2px solid rgba(246, 196, 83, 0.45) !important;
          box-shadow: inset 0 -2px 0 rgba(246, 196, 83, 0.18);
        }

        @media (max-width: 980px) {
          .g12-nav {
            width: min(100%, calc(100vw - 20px)) !important;
            gap: 4px !important;
            padding: 7px 8px !important;
          }

          .g12-nav button {
            font-size: 11.5px !important;
            min-height: 58px !important;
            padding: 5px 2px !important;
          }

          .g12-nav-icon {
            font-size: 24px !important;
          }
        }
        /* === End Baitang 1-2 Seven Tab Nav Final Polish === */



        /* === Badges Page Reason and Animation Polish === */
        .g12-badge-card-animated {
          position: relative;
          overflow: hidden;
          animation: g12BadgePopIn 520ms ease both;
          transition: transform 180ms ease, box-shadow 180ms ease;
        }

        .g12-badge-card-animated::before {
          content: '';
          position: absolute;
          inset: -42px auto auto -34px;
          width: 126px;
          height: 126px;
          border-radius: 999px;
          background: rgba(255, 245, 207, 0.74);
          animation: g12BadgeShine 2.8s ease-in-out infinite;
        }

        .g12-badge-card-animated:hover {
          transform: translateY(-6px) scale(1.02);
          box-shadow: 0 22px 48px rgba(21, 150, 90, 0.16);
        }

        .g12-badge-card-animated .g12-badge-big {
          position: relative;
          z-index: 2;
          animation: g12BadgeBounce 2.4s ease-in-out infinite;
        }

        .g12-badge-card-animated strong,
        .g12-badge-reason {
          position: relative;
          z-index: 2;
        }

        .g12-badge-reason {
          margin: 8px auto 0;
          max-width: 210px;
          color: #315070;
          font-size: 14px;
          line-height: 1.25;
          font-weight: 900;
        }

        .g46-ref-badge-animated {
          animation: g46BadgeFadeUp 440ms ease both;
          transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
        }

        .g46-ref-badge-animated:hover {
          transform: translateY(-5px);
          border-color: rgba(21, 150, 90, 0.26);
          box-shadow: 0 18px 42px rgba(15, 23, 42, 0.10);
        }

        .g46-ref-badge-animated span {
          animation: g46BadgePulse 2.6s ease-in-out infinite;
        }

        .g46-ref-badge-animated strong {
          display: block;
          margin-top: 8px;
        }

        .g46-badge-reason {
          margin: 8px 0 0;
          color: #526177;
          font-size: 14px;
          line-height: 1.35;
          font-weight: 800;
        }

        @keyframes g12BadgePopIn {
          from { opacity: 0; transform: translateY(18px) scale(0.92); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes g12BadgeBounce {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-7px) rotate(2deg); }
        }

        @keyframes g12BadgeShine {
          0%, 100% { transform: translate(-12px, -8px) scale(0.9); opacity: 0.46; }
          50% { transform: translate(22px, 18px) scale(1.12); opacity: 0.75; }
        }

        @keyframes g46BadgeFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes g46BadgePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }

        /* === Baitang 1-2 Locked Badges Polish === */
        .g12-badge-subsection {
          display: grid;
          gap: 16px;
        }

        .g12-badge-subsection + .g12-badge-subsection {
          margin-top: 26px;
        }

        .g12-badge-subsection-head {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 18px;
          border-radius: 26px;
          background: linear-gradient(135deg, rgba(237, 248, 241, 0.92), rgba(255, 245, 207, 0.78));
          border: 2px solid rgba(21, 150, 90, 0.10);
        }

        .g12-badge-subsection-head > span {
          width: 54px;
          height: 54px;
          display: grid;
          place-items: center;
          border-radius: 20px;
          background: #ffffff;
          font-size: 30px;
          box-shadow: 0 12px 26px rgba(20, 34, 59, 0.08);
        }

        .g12-badge-subsection-head strong {
          display: block;
          color: #14223b;
          font-size: 22px;
          font-weight: 1000;
          line-height: 1.05;
        }

        .g12-badge-subsection-head p {
          margin: 4px 0 0;
          color: #4b647d;
          font-size: 14px;
          font-weight: 850;
          line-height: 1.25;
        }

        .g12-badge-card-locked {
          position: relative;
          overflow: hidden;
          opacity: 0.92;
          filter: grayscale(0.12);
          background: linear-gradient(135deg, rgba(244, 247, 251, 0.96), rgba(255, 255, 255, 0.9)) !important;
          border: 2px dashed rgba(100, 116, 139, 0.24) !important;
          animation: g12LockedBadgeIn 520ms ease both;
          transition: transform 180ms ease, filter 180ms ease, box-shadow 180ms ease;
        }

        .g12-badge-card-locked::after {
          content: '🔒';
          position: absolute;
          top: 14px;
          right: 16px;
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: #ffffff;
          box-shadow: 0 10px 22px rgba(20, 34, 59, 0.10);
          animation: g12LockFloat 2.4s ease-in-out infinite;
        }

        .g12-badge-card-locked:hover {
          transform: translateY(-5px);
          filter: grayscale(0);
          box-shadow: 0 18px 42px rgba(20, 34, 59, 0.12);
        }

        .g12-badge-big-locked {
          opacity: 0.72;
          animation: g12LockedIconGlow 2.8s ease-in-out infinite;
        }

        @keyframes g12LockedBadgeIn {
          from { opacity: 0; transform: translateY(18px) scale(0.94); }
          to { opacity: 0.92; transform: translateY(0) scale(1); }
        }

        @keyframes g12LockFloat {
          0%, 100% { transform: translateY(0) rotate(-3deg); }
          50% { transform: translateY(-5px) rotate(3deg); }
        }

        @keyframes g12LockedIconGlow {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(246, 196, 83, 0)); }
          50% { transform: scale(1.05); filter: drop-shadow(0 8px 16px rgba(246, 196, 83, 0.22)); }
        }
        /* === End Baitang 1-2 Locked Badges Polish === */


        /* === Baitang 3-6 Locked Badges Polish === */
        .g46-badge-subsection {
          display: grid;
          gap: 16px;
        }

        .g46-badge-subsection + .g46-badge-subsection {
          margin-top: 24px;
        }

        .g46-badge-subsection-head {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 18px;
          border-radius: 24px;
          background: linear-gradient(135deg, rgba(248, 250, 252, 0.96), rgba(237, 248, 241, 0.88));
          border: 1px solid rgba(21, 150, 90, 0.12);
        }

        .g46-badge-subsection-head > span {
          width: 50px;
          height: 50px;
          display: grid;
          place-items: center;
          border-radius: 18px;
          background: #ffffff;
          font-size: 28px;
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
        }

        .g46-badge-subsection-head strong {
          display: block;
          color: #14223b;
          font-size: 21px;
          font-weight: 1000;
          line-height: 1.08;
        }

        .g46-badge-subsection-head p {
          margin-top: 4px;
        }

        .g46-ref-badge-locked {
          position: relative;
          overflow: hidden;
          opacity: 0.9;
          background: linear-gradient(135deg, rgba(248, 250, 252, 0.98), rgba(255, 255, 255, 0.94)) !important;
          border: 1px dashed rgba(100, 116, 139, 0.30) !important;
          animation: g46LockedBadgeIn 440ms ease both;
          transition: transform 180ms ease, opacity 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
        }

        .g46-ref-badge-locked::after {
          content: 'Hindi pa bukas';
          position: absolute;
          top: 12px;
          right: 12px;
          padding: 5px 10px;
          border-radius: 999px;
          background: rgba(100, 116, 139, 0.10);
          color: #64748b;
          font-size: 11px;
          font-weight: 1000;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }

        .g46-ref-badge-locked:hover {
          transform: translateY(-5px);
          opacity: 1;
          border-color: rgba(21, 150, 90, 0.24) !important;
          box-shadow: 0 18px 42px rgba(15, 23, 42, 0.10);
        }

        .g46-ref-badge-locked span {
          opacity: 0.72;
          filter: grayscale(0.18);
          animation: g46LockedIconPulse 2.7s ease-in-out infinite;
        }

        @keyframes g46LockedBadgeIn {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 0.9; transform: translateY(0); }
        }

        @keyframes g46LockedIconPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
        /* === End Baitang 3-6 Locked Badges Polish === */
        /* === Baitang 3-6 Badges UI Final Polish === */
        .g46-badge-subsection {
          padding: 18px;
          border-radius: 28px;
          background: rgba(248, 250, 252, 0.72);
          border: 1px solid rgba(21, 150, 90, 0.08);
        }

        .g46-badge-subsection + .g46-badge-subsection {
          margin-top: 26px;
        }

        .g46-badge-subsection-head {
          margin-bottom: 18px;
          background: linear-gradient(135deg, #ffffff, #f0fbf5) !important;
          border: 1px solid rgba(21, 150, 90, 0.12) !important;
          box-shadow: 0 14px 34px rgba(15, 23, 42, 0.06);
        }

        .g46-badge-subsection-head > span {
          background: linear-gradient(135deg, #fff5cf, #ffffff) !important;
          box-shadow: 0 12px 26px rgba(246, 196, 83, 0.18) !important;
        }

        .g46-ref-badge-grid {
          display: grid !important;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)) !important;
          gap: 16px !important;
          align-items: stretch !important;
        }

        .g46-ref-badge {
          min-height: 158px !important;
          padding: 22px 18px !important;
          border-radius: 24px !important;
          display: grid !important;
          place-items: center !important;
          text-align: center !important;
        }

        .g46-ref-badge > div {
          width: 100%;
          display: grid;
          justify-items: center;
          gap: 8px;
        }

        .g46-ref-badge-animated {
          background:
            radial-gradient(circle at 20% 12%, rgba(246, 196, 83, 0.20), transparent 28%),
            linear-gradient(135deg, #ffffff, #edf8f1) !important;
          border: 1px solid rgba(21, 150, 90, 0.16) !important;
          box-shadow: 0 16px 34px rgba(15, 23, 42, 0.08);
        }

        .g46-ref-badge-animated::after {
          content: 'Nakuha na';
          position: absolute;
          top: 12px;
          right: 12px;
          padding: 5px 10px;
          border-radius: 999px;
          background: rgba(21, 150, 90, 0.10);
          color: #07924a;
          font-size: 11px;
          font-weight: 1000;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }

        .g46-ref-badge-animated span,
        .g46-ref-badge-locked span {
          width: 54px;
          height: 54px;
          display: grid !important;
          place-items: center;
          border-radius: 18px;
          background: #ffffff;
          font-size: 34px !important;
          box-shadow: 0 12px 26px rgba(15, 23, 42, 0.08);
        }

        .g46-ref-badge-animated strong,
        .g46-ref-badge-locked strong {
          color: #14223b;
          font-size: 17px;
          font-weight: 1000;
          line-height: 1.18;
        }

        .g46-badge-reason {
          max-width: 250px;
          margin: 0 auto !important;
          color: #506176 !important;
          font-size: 13.5px !important;
          line-height: 1.32 !important;
          font-weight: 850 !important;
        }

        .g46-locked-badge-section {
          background:
            radial-gradient(circle at 10% 10%, rgba(148, 163, 184, 0.12), transparent 24%),
            rgba(248, 250, 252, 0.90);
          border-color: rgba(100, 116, 139, 0.12);
        }

        .g46-ref-badge-locked {
          min-height: 170px !important;
          background:
            linear-gradient(135deg, rgba(241, 245, 249, 0.98), rgba(255, 255, 255, 0.92)) !important;
          border: 2px dashed rgba(100, 116, 139, 0.34) !important;
          box-shadow: none !important;
          opacity: 0.78 !important;
          filter: grayscale(0.38);
        }

        .g46-ref-badge-locked::before {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            -45deg,
            rgba(100, 116, 139, 0.025) 0,
            rgba(100, 116, 139, 0.025) 8px,
            transparent 8px,
            transparent 16px
          );
          pointer-events: none;
        }

        .g46-ref-badge-locked::after {
          content: '🔒 Hindi pa bukas' !important;
          top: 12px !important;
          right: 12px !important;
          padding: 6px 11px !important;
          background: rgba(15, 23, 42, 0.08) !important;
          color: #475569 !important;
          border: 1px solid rgba(100, 116, 139, 0.18);
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
        }

        .g46-ref-badge-locked:hover {
          opacity: 1 !important;
          filter: grayscale(0.08);
          transform: translateY(-5px);
          border-color: rgba(21, 150, 90, 0.32) !important;
          box-shadow: 0 18px 42px rgba(15, 23, 42, 0.10) !important;
        }

        .g46-ref-badge-locked span {
          opacity: 0.7;
          background: #f8fafc;
          box-shadow: inset 0 0 0 1px rgba(100, 116, 139, 0.12);
        }

        .g46-ref-badge-locked .g46-badge-reason {
          padding: 8px 10px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.72);
          color: #64748b !important;
        }
        /* === End Baitang 3-6 Badges UI Final Polish === */



        /* === End Badges Page Reason and Animation Polish === */

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
          <div className="g12-pill">🌸 Baitang {s.gradeLevel || '—'} • {s.section || '—'}</div>
          <button type="button" className="g12-action-btn g12-logout-btn" onClick={safeLogout}>🚪 Lumabas</button>
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
              <div className="g12-home-greeting-row">
                  <div className="g12-home-avatar-badge" title="Napiling avatar mo">
                    {s.avatar || selectedAvatar || '👤'}
                  </div>
                  <h1>Kamusta, {s.name || 'Mag-aaral'}! 👋</h1>
                </div>
              <p>Handa ka na ba sa pag-aaral ngayon?</p>
            </div>

            <div className="g12-progress-card">

<div className="g12-progress-title g12-progress-title-no-name">
                <span className="g12-progress-coin">🪙</span>
                <strong className="g12-progress-xp-no-name">{s.xp || 0} XP</strong>
                <span className="g12-progress-divider" />
                <strong className="g12-progress-level-no-name">Antas {level}</strong>
              </div>
              <div className="g12-progress-track">
                <span className="g12-progress-fill" style={{ width: `${xpPct}%` }} />
              </div>
            </div>

          </div>
        </section>

        <section className="g12-section-card">
          <h2 className="g12-section-title">🌎 Mga Mundo ng Pag-aaral ⭐</h2>
          <p className="g12-section-subtitle"></p>

          <div className="g12-subject-grid">
            {mainStats.map((item) => {
              const subjectInfo = SUBJECTS.find((subj) => subj.name === item.subj) || {};
              const tone = item.tone || subjectInfo.tone || 'green';
              const icon = item.icon || subjectInfo.icon || '📚';
              const iconSrc = item.iconSrc || subjectInfo.iconSrc || subjectIconSrc(item.subj || item.meta || item.title);
              const desc = subjectInfo.desc || '';
              const pct = Math.max(0, Math.min(100, item.pct || 0));
              const subjectLessons = asArray(item.lessons);
              const previewLesson = subjectLessons.find(lesson => !lesson.completed) || subjectLessons[0] || null;
              const previewTitle = previewLesson ? getEarlyLessonTopicTitle(previewLesson) : item.subj;

              return (
                <button
                  type="button"
                  key={item.subj}
                  className={`g12-subject-card ${tone}`}
                  onClick={() => openFirstSubjectLesson(item.subj)}
                >
                  <div className="g12-subject-illustration">
                    <SubjectImageIcon
                      subject={item.subj}
                      src={iconSrc}
                      fallback={icon}
                      className="subject-img-icon world"
                    />
                  </div>
                  <div className="g12-subject-body">
                    {pct > 0 && (
                      <span className="g12-subject-chip">{`${pct}% tapos`}</span>
                    )}
                    <h3>{previewTitle}</h3>
                    <p>
                      <b>{item.subj}</b>
                      {` • ${item.done || 0}/${item.total || 0} tapos`}
                    </p>
                    <div className="g12-module-progress" aria-label={`${previewTitle} progress`}>
                      <span style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="g12-card-arrow" aria-hidden="true">›</div>
                </button>
              );
            })}
          </div>
        </section>
      </main>

      <nav className="g12-nav" aria-label="Student navigation">
        <button type="button" className="active" onClick={() => goStudentTab('home')}><span className="g12-nav-icon">🏠</span>Tahanan</button>
        <button type="button" onClick={() => goStudentTab('lessons')}><span className="g12-nav-icon">📖</span>Aralin</button>
        <button type="button" onClick={() => goStudentTab('quizzes')}><span className="g12-nav-icon">🧠</span>Pagsusulit</button>
        <button type="button" onClick={() => goStudentTab('missions')}><span className="g12-nav-icon">🎮</span>Misyon</button>
        <button type="button" onClick={() => goStudentTab('groups')}><span className="g12-nav-icon">👥</span>Pangkat</button>
        <button type="button" onClick={() => goStudentTab('badges')}><span className="g12-nav-icon">🏅</span>Gantimpala</button>
        <button type="button" onClick={() => goStudentTab('leaderboard')}><span className="g12-nav-icon">🏆</span>Ranggo</button>
        <button type="button" onClick={() => goStudentTab('profile')}><span className="g12-nav-icon">🐰</span>Ako</button>
      </nav>
    </div>
  </>;
}

function Grade46StudentChrome({ data, activeTab = 'home', go, goStudentTab, logout, title, subtitle, icon = '☀️', children, titleAction, beforeNavigate, hideTitleCard = false }) {
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
    if (tab === 'leaderboard') return go('screen-stu-leaderboard');
    if (tab === 'profile') return go('screen-stu-profile');
  };

  const navItems = [
    { id: 'home', icon: '🏠', label: 'Tahanan' },
    { id: 'lessons', icon: '📚', label: 'Aralin' },
    { id: 'quizzes', icon: '🧠', label: 'Pagsusulit' },
    { id: 'missions', icon: '🎮', label: 'Misyon' },
    { id: 'groups', icon: '👥', label: 'Pangkat' },
    { id: 'badges', icon: '🏅', label: 'Gantimpala' },
    { id: 'leaderboard', icon: '🏆', label: 'Ranggo' },
    { id: 'profile', icon: '👤', label: 'Ako' }
  ];

  return (
    <>
      <Grade46ReferenceStyles />
      <style>{`
        /* maximizeG46RefLayout */
        @media (min-width: 900px) {
          body:has(.g46-ref-page) {
            background: #ffffff !important;
            overflow-x: hidden !important;
          }

          .g46-ref-page {
            width: 100vw !important;
            max-width: none !important;
            min-height: 100vh !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            overflow-x: hidden !important;
            box-sizing: border-box !important;
          }

          .g46-ref-frame {
            width: 100vw !important;
            max-width: none !important;
            min-height: 100vh !important;
            margin: 0 !important;
            border: 0 !important;
            outline: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: #ffffff !important;
            grid-template-columns: 252px minmax(0, 1fr) !important;
          }

          .g46-ref-sidebar {
            width: 252px !important;
            margin: 0 !important;
            padding-left: 26px !important;
            padding-right: 22px !important;
            border: 0 !important;
            outline: 0 !important;
            border-radius: 0 30px 30px 0 !important;
            box-shadow: none !important;
          }

          .g46-ref-brand {
            margin-top: 10px !important;
          }

          .g46-ref-menu {
            gap: 11px !important;
          }

          .g46-ref-menu button {
            min-height: 52px !important;
            padding: 0 18px !important;
          }

          .g46-ref-main {
            width: 100% !important;
            max-width: none !important;
            min-width: 0 !important;
            padding: 34px clamp(28px, 2.6vw, 48px) 34px 34px !important;
            background: #ffffff !important;
            box-sizing: border-box !important;
          }

          .g46-ref-topbar,
          .g46-ref-title-card,
          .g46-ref-content,
          .g46-ref-panel {
            max-width: none !important;
          }
        }

          /* slimG46SidebarPatch */
          .g46-ref-frame {
            grid-template-columns: 218px minmax(0, 1fr) !important;
          }

          .g46-ref-sidebar {
            width: 218px !important;
            padding-left: 18px !important;
            padding-right: 16px !important;
            border-radius: 0 26px 26px 0 !important;
          }

          .g46-ref-brand {
            gap: 8px !important;
            margin-top: 6px !important;
            margin-bottom: 30px !important;
          }

          .g46-ref-brand img {
            width: 34px !important;
            height: 34px !important;
          }

          .g46-ref-brand strong {
            font-size: 16px !important;
          }

          .g46-ref-menu {
            gap: 8px !important;
          }

          .g46-ref-menu button {
            min-height: 48px !important;
            padding: 0 15px !important;
            border-radius: 22px !important;
            font-size: 15px !important;
          }

          .g46-ref-menu button span {
            width: 22px !important;
            min-width: 22px !important;
            text-align: center !important;
          }

          .g46-ref-progress-mini {
            padding: 16px 14px !important;
            border-radius: 22px !important;
          }

          /* g46XpAnimationPolish */
          .g46-ref-xp-animate {
            position: relative !important;
            overflow: hidden !important;
            isolation: isolate !important;
          }

          .g46-ref-xp-animate strong {
            display: inline-block !important;
            animation: g46XpSoftPop 1.65s ease-in-out infinite !important;
            transform-origin: center !important;
          }

          .g46-ref-xp-animate i span {
            position: relative !important;
            overflow: hidden !important;
            animation: g46XpBarPulse 2.2s ease-in-out infinite !important;
          }

          .g46-ref-xp-animate i span::after {
            content: '' !important;
            position: absolute !important;
            inset: 0 !important;
            transform: translateX(-110%) skewX(-18deg) !important;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, .72), transparent) !important;
            animation: g46XpBarShine 2.4s ease-in-out infinite !important;
          }

          @keyframes g46XpSoftPop {
            0%, 100% {
              transform: translateY(0) scale(1);
              filter: saturate(1);
            }
            50% {
              transform: translateY(-1px) scale(1.045);
              filter: saturate(1.12);
            }
          }

          @keyframes g46XpBarPulse {
            0%, 100% {
              filter: saturate(1);
            }
            50% {
              filter: saturate(1.22);
            }
          }

          @keyframes g46XpBarShine {
            0%, 55% {
              transform: translateX(-110%) skewX(-18deg);
            }
            100% {
              transform: translateX(125%) skewX(-18deg);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .g46-ref-xp-animate strong,
            .g46-ref-xp-animate i span,
            .g46-ref-xp-animate i span::after {
              animation: none !important;
            }
          }


          /* g46HomeSoftAnimations */
          .g46-ref-student-pill {
            position: relative !important;
            overflow: hidden !important;
            animation: g46StudentPillFloat 3.4s ease-in-out infinite !important;
          }

          .g46-ref-student-pill::after {
            content: '' !important;
            position: absolute !important;
            inset: 0 !important;
            transform: translateX(-115%) skewX(-18deg) !important;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, .55), transparent) !important;
            animation: g46SoftShine 4.8s ease-in-out infinite !important;
            pointer-events: none !important;
          }

          .g46-ref-avatar-small {
            display: inline-grid !important;
            place-items: center !important;
            animation: g46AvatarSoftBounce 2.8s ease-in-out infinite !important;
            transform-origin: center bottom !important;
          }

          .g46-ref-top-actions .g46-ref-pill {
            position: relative !important;
            overflow: hidden !important;
            isolation: isolate !important;
            animation: g46TopPillBreath 2.9s ease-in-out infinite !important;
          }

          .g46-ref-top-actions .g46-ref-pill:nth-child(2) {
            animation-delay: .35s !important;
          }

          .g46-ref-top-actions .g46-ref-pill::after {
            content: '' !important;
            position: absolute !important;
            inset: 0 !important;
            z-index: -1 !important;
            transform: translateX(-120%) skewX(-18deg) !important;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, .68), transparent) !important;
            animation: g46SoftShine 4.2s ease-in-out infinite !important;
          }

          .g46-ref-title-card {
            position: relative !important;
            overflow: hidden !important;
            animation: g46WelcomeCardBreath 4.2s ease-in-out infinite !important;
          }

          .g46-ref-title-card::after {
            content: '' !important;
            position: absolute !important;
            inset: 0 !important;
            transform: translateX(-130%) skewX(-18deg) !important;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, .32), transparent) !important;
            animation: g46WelcomeCardShine 5.5s ease-in-out infinite !important;
            pointer-events: none !important;
          }

          .g46-ref-title-icon {
            animation: g46GreetingIconWave 2.6s ease-in-out infinite !important;
            transform-origin: center bottom !important;
          }

          .g46-ref-title-left h1 {
            animation: g46GreetingTextLift 3.6s ease-in-out infinite !important;
          }

          @keyframes g46StudentPillFloat {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-2px);
            }
          }

          @keyframes g46AvatarSoftBounce {
            0%, 100% {
              transform: translateY(0) scale(1);
            }
            45% {
              transform: translateY(-2px) scale(1.035);
            }
          }

          @keyframes g46TopPillBreath {
            0%, 100% {
              transform: translateY(0);
              filter: saturate(1);
            }
            50% {
              transform: translateY(-2px);
              filter: saturate(1.12);
            }
          }

          @keyframes g46WelcomeCardBreath {
            0%, 100% {
              transform: translateY(0);
              box-shadow: 0 16px 38px rgba(31, 73, 61, .07);
            }
            50% {
              transform: translateY(-2px);
              box-shadow: 0 20px 44px rgba(31, 73, 61, .095);
            }
          }

          @keyframes g46GreetingIconWave {
            0%, 100% {
              transform: rotate(0deg) scale(1);
            }
            25% {
              transform: rotate(-3deg) scale(1.03);
            }
            50% {
              transform: rotate(3deg) scale(1.045);
            }
            75% {
              transform: rotate(-1.5deg) scale(1.02);
            }
          }

          @keyframes g46GreetingTextLift {
            0%, 100% {
              transform: translateY(0);
              filter: saturate(1);
            }
            50% {
              transform: translateY(-1px);
              filter: saturate(1.08);
            }
          }

          @keyframes g46SoftShine {
            0%, 62% {
              transform: translateX(-125%) skewX(-18deg);
            }
            100% {
              transform: translateX(125%) skewX(-18deg);
            }
          }

          @keyframes g46WelcomeCardShine {
            0%, 68% {
              transform: translateX(-130%) skewX(-18deg);
            }
            100% {
              transform: translateX(130%) skewX(-18deg);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .g46-ref-student-pill,
            .g46-ref-student-pill::after,
            .g46-ref-avatar-small,
            .g46-ref-top-actions .g46-ref-pill,
            .g46-ref-top-actions .g46-ref-pill::after,
            .g46-ref-title-card,
            .g46-ref-title-card::after,
            .g46-ref-title-icon,
            .g46-ref-title-left h1 {
              animation: none !important;
            }
          }


          /* g46HomeBadgeAchievementPolish */
          .g46-ref-badge {
            position: relative !important;
            overflow: hidden !important;
            isolation: isolate !important;
          }

          .g46-ref-badge.unlocked {
            background:
              linear-gradient(135deg, rgba(236, 255, 246, .96), rgba(230, 247, 238, .96)) !important;
            box-shadow:
              0 14px 28px rgba(15, 125, 73, .08),
              inset 0 0 0 1px rgba(21, 150, 90, .06) !important;
            animation: g46BadgeCardLift 4.2s ease-in-out infinite !important;
          }

          .g46-ref-badge.unlocked::before {
            content: '' !important;
            position: absolute !important;
            inset: 12px !important;
            z-index: -1 !important;
            opacity: .42 !important;
            background:
              radial-gradient(circle at 16% 24%, rgba(249, 202, 36, .9) 0 3px, transparent 4px),
              radial-gradient(circle at 78% 20%, rgba(46, 204, 113, .65) 0 3px, transparent 4px),
              radial-gradient(circle at 72% 78%, rgba(52, 152, 219, .52) 0 2px, transparent 3px),
              radial-gradient(circle at 28% 76%, rgba(255, 137, 160, .58) 0 2px, transparent 3px);
            animation: g46BadgeConfettiDrift 5s ease-in-out infinite !important;
          }

          .g46-ref-badge.unlocked::after {
            content: '✨' !important;
            position: absolute !important;
            top: 14px !important;
            right: 18px !important;
            font-size: 18px !important;
            opacity: .72 !important;
            animation: g46BadgeSparkle 2.8s ease-in-out infinite !important;
          }

          .g46-ref-badge.unlocked span {
            display: inline-block !important;
            animation: g46BadgeIconCelebrate 2.6s ease-in-out infinite !important;
            transform-origin: center bottom !important;
          }

          .g46-ref-badge.unlocked strong {
            color: #14223b !important;
          }

          .g46-ref-badge.unlocked .g46-ref-badge-status {
            color: #0f7d49 !important;
            font-weight: 1000 !important;
            line-height: 1.25 !important;
            max-width: 240px !important;
            margin-inline: auto !important;
          }

          .g46-ref-badge.locked {
            background: #fbfbfb !important;
          }

          @keyframes g46BadgeCardLift {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-2px);
            }
          }

          @keyframes g46BadgeConfettiDrift {
            0%, 100% {
              transform: translateY(0) rotate(0deg);
              opacity: .36;
            }
            50% {
              transform: translateY(-5px) rotate(2deg);
              opacity: .54;
            }
          }

          @keyframes g46BadgeSparkle {
            0%, 100% {
              transform: scale(.88) rotate(0deg);
              opacity: .45;
            }
            50% {
              transform: scale(1.12) rotate(8deg);
              opacity: .9;
            }
          }

          @keyframes g46BadgeIconCelebrate {
            0%, 100% {
              transform: translateY(0) scale(1);
            }
            35% {
              transform: translateY(-3px) scale(1.08) rotate(-2deg);
            }
            65% {
              transform: translateY(-1px) scale(1.04) rotate(2deg);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .g46-ref-badge.unlocked,
            .g46-ref-badge.unlocked::before,
            .g46-ref-badge.unlocked::after,
            .g46-ref-badge.unlocked span {
              animation: none !important;
            }
          }


          /* g46LatestBadgesHomePreview */
          .g46-ref-panel:has(.g46-ref-badge-empty) {
            min-height: 250px !important;
          }

          .g46-ref-badge-empty {
            min-height: 220px !important;
            border-radius: 24px !important;
            display: grid !important;
            place-items: center !important;
            gap: 8px !important;
            text-align: center !important;
            padding: 26px 20px !important;
            background:
              radial-gradient(circle at 18% 18%, rgba(249, 202, 36, .16), transparent 30%),
              linear-gradient(135deg, #f4fff8, #ffffff) !important;
            box-shadow: inset 0 0 0 1px rgba(21, 150, 90, .10);
            color: #14223b !important;
          }

          .g46-ref-badge-empty span {
            width: 58px !important;
            height: 58px !important;
            border-radius: 20px !important;
            display: grid !important;
            place-items: center !important;
            background: #ffffff !important;
            font-size: 34px !important;
            box-shadow: 0 12px 26px rgba(15, 23, 42, .08);
            animation: g46BadgeIconCelebrate 2.8s ease-in-out infinite !important;
          }

          .g46-ref-badge-empty strong {
            font-size: 20px !important;
            font-weight: 1000 !important;
          }

          .g46-ref-badge-empty small {
            max-width: 260px !important;
            color: #526988 !important;
            font-weight: 900 !important;
            line-height: 1.35 !important;
          }

          .g46-ref-column .g46-ref-panel .g46-ref-badge-grid {
            grid-template-columns: 1fr !important;
          }


          /* g46LatestLessonsHomePreview */
          .g46-ref-lessons-empty {
            min-height: 250px !important;
            border-radius: 28px !important;
            display: grid !important;
            place-items: center !important;
            gap: 8px !important;
            text-align: center !important;
            padding: 30px 20px !important;
            background:
              radial-gradient(circle at 18% 18%, rgba(52, 152, 219, .14), transparent 32%),
              linear-gradient(135deg, #eef8ff, #ffffff) !important;
            box-shadow: inset 0 0 0 1px rgba(21, 150, 90, .10);
            color: #14223b !important;
          }

          .g46-ref-lessons-empty span {
            width: 62px !important;
            height: 62px !important;
            border-radius: 22px !important;
            display: grid !important;
            place-items: center !important;
            background: #ffffff !important;
            font-size: 36px !important;
            box-shadow: 0 12px 26px rgba(15, 23, 42, .08);
          }

          .g46-ref-lessons-empty strong {
            font-size: 21px !important;
            font-weight: 1000 !important;
          }

          .g46-ref-lessons-empty small {
            max-width: 280px !important;
            color: #526988 !important;
            font-weight: 900 !important;
            line-height: 1.35 !important;
          }

          .g46-ref-card-icon .subject-img-icon.lesson {
            width: 62% !important;
            height: 62% !important;
            object-fit: contain !important;
          }

      `}</style>
      <div className="g46-ref-page">
        <div className="g46-ref-frame">
          <aside className="g46-ref-sidebar" aria-label="Baitang 3 to 6 student navigation">
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
                  <span><TuklasBadgeVisual badge={item} size={56} /></span>{item.label}
                </button>
              ))}
            </nav>

            <div className="g46-ref-progress-mini">
              <div className="g46-ref-ring" style={{ background: `conic-gradient(var(--tt-yellow-deep) ${pct * 3.6}deg, rgba(255,255,255,0.20) 0deg)` }}>
                <span>{pct}%</span>
              </div>
              <b>Antas {level} • {levelTitleForXp(xp)}</b>
              <small>{xp} XP na nakuha</small>
            </div>

            {typeof logout === 'function' && (
              <button type="button" className="g46-ref-logout" onClick={logout}>↩ Lumabas</button>
            )}
          </aside>

          <main className="g46-ref-main">
            <header className="g46-ref-topbar">
              <div className="g46-ref-student-pill">
                <span className="g46-ref-avatar-small">{avatar}</span>
                <div>
                  <b>{s.name || 'Mag-aaral'}</b>
                  <small>Baitang {s.gradeLevel || '—'} • {s.section || '—'}</small>
                </div>
              </div>

              <div className="g46-ref-top-actions">
                <span className="g46-ref-pill">⚡ {xp} XP</span>
                <span className="g46-ref-pill">🏅 Antas {level} • {levelTitleForXp(xp)}</span>
                {titleAction}
              </div>
            </header>

            {!hideTitleCard && (
              <section className="g46-ref-title-card">
                <div className="g46-ref-title-left">
                  <span className="g46-ref-title-icon">{icon}</span>
                  <div>
                    <h1>{title || `Hi ${s.name || 'Mag-aaral'}!`}</h1>
                    <p>{subtitle || 'Handa ka na ba sa pag-aaral ngayon?'}</p>
                  </div>
                </div>

                <div className="g46-ref-title-side">
                  <div className="g46-ref-level-line g46-ref-xp-animate">
                    <span>Puntos sa XP</span>
                    <strong>{xp} XP</strong>
                    <i><span style={{ width: `${Math.max(6, pct)}%` }} /></i>
                  </div>
                </div>
              </section>
            )}

            <div className="g46-ref-content">
              {children}
            </div>
          </main>
          <Grade46MobileNav
            navItems={navItems}
            activeTab={activeTab}
            openTab={openTab}
            logout={logout}
          />
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
  const badges = uniqueBadgesForDisplay(asArray(data?.badges));
  const groups = asArray(data?.groups);
  const tasks = getGroupTasks(data);
  const completedLessons = asArray(data?.lessons).filter(lesson => lesson?.completed).length;
  const totalLessons = asArray(data?.lessons).length;
  const completionPct = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const groupTask = tasks[0];
  const badgeCatalog = [
    { icon: '🌟', name: 'Mambabasa', requirement: 'Tapusin ang isang aralin sa pagbasa' },
    { icon: '🔤', name: 'Mga Salita', requirement: 'Tapusin ang mga aralin sa bokabularyo' },
    { icon: '🎙️', name: 'Tagapagsalita', requirement: 'Tapusin ang pagsasanay sa pagbigkas' },
    { icon: '🏆', name: 'Kampeon', requirement: 'Tapusin pa ang maraming misyong pampagkatuto' },
    { icon: '📖', name: 'Kuwento', requirement: 'Tapusin ang isang aralin sa Panitikan' },
    { icon: '✨', name: 'Talino', requirement: 'Patuloy na kumuha ng XP at gantimpala' }
  ];
  const normalizeBadgeName = (value = '') => String(value || '').trim().toLowerCase();
  const unlockedBadgeNames = new Set(badges.map(badge => normalizeBadgeName(badge.name)));
  function g46BadgeAchievementText(badge = {}) {
    const reason = String(badgeAchievementReason(badge) || "").trim();
    const cleanReason = reason.replace(/[.!]+$/g, "");

    if (!cleanReason) return "Natapos mo ang isang layunin sa pag-aaral!";

    if (/^completed/i.test(cleanReason)) {
      return studentFilipinoBadgeReason(cleanReason);
    }

    if (/^reached/i.test(cleanReason)) {
      return studentFilipinoBadgeReason(cleanReason);
    }

    return cleanReason;
  }

  const unlockedBadges = badges.map(badge => ({
    ...badge,
    locked: false,
    statusText: g46BadgeAchievementText(badge)
  }));
  const lockedBadges = badgeCatalog
    .filter(badge => !unlockedBadgeNames.has(normalizeBadgeName(badge.name)))
    .map(badge => ({ ...badge, locked: true, statusText: badge.requirement }));
  const badgePreview = unlockedBadges.slice(-2).reverse();

  function g46LessonDateValue(lesson = {}) {
    const value =
      lesson.updatedAt ||
      lesson.updated_at ||
      lesson.createdAt ||
      lesson.created_at ||
      lesson.publishedAt ||
      lesson.published_at ||
      lesson.id ||
      0;

    const time = new Date(value).getTime();
    if (Number.isFinite(time)) return time;

    const numericId = Number(lesson.id || 0);
    return Number.isFinite(numericId) ? numericId : 0;
  }

  function g46LessonTone(subject = '', index = 0) {
    const key = String(subject || '').toLowerCase();
    if (key.includes('pagbasa')) return 'blue';
    if (key.includes('bokabularyo')) return 'purple';
    if (key.includes('panitikan')) return 'yellow';
    if (key.includes('oral')) return 'pink';
    if (key.includes('pagsulat')) return 'yellow';
    return ['blue', 'pink', 'purple', 'yellow'][index % 4];
  }

  const planCards = asArray(data?.lessons)
    .filter(Boolean)
    .slice()
    .sort((a, b) => g46LessonDateValue(b) - g46LessonDateValue(a))
    .slice(0, 4)
    .map((lesson, index) => {
      const subject = formatStudentSubjectDisplay(lesson.subject || 'Mga Aralin');
      return {
        lesson,
        icon: SUBJECTS.find(item => item.subj === subject)?.icon || '📚',
        iconSrc: subjectIconSrc(subject),
        title: cleanStudentLessonQuizTitle(lesson),
        meta: subject,
        tone: g46LessonTone(subject, index),
        action: () => openLesson(lesson)
      };
    });

  const groupTaskFilterOptions = [
    { value: 'all', label: 'Lahat' },
    { value: 'pending', label: 'Naghihintay ng Pagsusuri' },
    { value: 'approved', label: 'Naaprubahan' },
    { value: 'returned', label: 'Ibinalik' },
    { value: 'not_submitted', label: 'Hindi Pa Naipapasa' }
  ];

  return (
    <Grade46StudentChrome
      data={{ ...data, student: { ...s, avatar: studentAvatar } }}
      activeTab="home"
      goStudentTab={goStudentTab}
      logout={logout}
      icon={studentAvatar}
      title={`Hi ${s.name || 'Mag-aaral'}!`}
      subtitle="Handa ka na ba sa pag-aaral ngayon?"
    >
      <div className="g46-ref-dashboard-grid">
        <div className="g46-ref-column">
          <section className="g46-ref-panel">
            <div className="g46-ref-panel-head">
              <div>
                <h2>Mga Aralin</h2>
              </div>
              <button type="button" className="g46-ref-panel-link" onClick={() => goStudentTab('lessons')}>Lahat ng aralin →</button>
            </div>

            {planCards.length ? (
              <div className="g46-ref-plan-grid">
                {planCards.map(card => (
                  <button type="button" className={`g46-ref-plan-card g46-ref-card ${card.tone}`} key={card.lesson?.id || card.title} onClick={card.action}>
                    <div>
                      <div className="g46-ref-card-top">
                        <span className="g46-ref-card-icon">
                          <SubjectImageIcon
                            subject={card.meta}
                            src={card.iconSrc}
                            fallback={card.icon}
                            className="subject-img-icon lesson"
                          />
                        </span>
                        <span className="g46-ref-tag">{card.meta}</span>
                      </div>
                      <h4>{card.title}</h4>
                    </div>
                    <span className="g46-ref-primary-btn g46-ref-start-pill">Simulan</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="g46-ref-lessons-empty">
                <span>📚</span>
                <strong>Wala pang aralin</strong>
                <small>Bumalik muli mamaya para sa bagong gawain!</small>
              </div>
            )}
          </section>

          <section className="g46-ref-panel">
            <div className="g46-ref-panel-head">
              <div>
                <h2>Mga Gawain ng Pangkat</h2>
              </div>
              <button type="button" className="g46-ref-panel-link" onClick={() => goStudentTab('groups')}>Buksan ang pangkat →</button>
            </div>

            {groupTask ? (
              <div className="g46-ref-task-row">
                <span className="g46-ref-card-icon">👥</span>
                <div>
                  <h3 style={{ fontSize: 28 }}>{groupTask.title}</h3>
                  <p className="g46-ref-muted" style={{ margin: 0 }}>Takdang petsa {displayDue(groupTask.dueAt)} • +{groupTask.xpReward || 0} XP</p>
                </div>
                <button type="button" className="g46-ref-primary-btn" onClick={() => goStudentTab('groups')}>Magpatuloy</button>
              </div>
            ) : (
              <div className="g46-ref-empty">Wala pang gawaing pangkat. Magaling! 🎉</div>
            )}
          </section>
        </div>

        <div className="g46-ref-column">
          <section className="g46-ref-panel">
            <div className="g46-ref-panel-head">
              <div>
                <h2>Mga Gantimpala</h2>
              </div>
              <button type="button" className="g46-ref-panel-link" onClick={() => goStudentTab('badges')}>Tingnan lahat ng gantimpala →</button>
            </div>

            {badgePreview.length ? (
              <div className="g46-ref-badge-grid">
                {badgePreview.map((badge, index) => (
                  <div className="g46-ref-badge unlocked" key={badge.id || badge.name || index}>
                    <div>
                      <span><TuklasBadgeVisual badge={badge} size={56} /></span>
                      <strong>{badgeDisplayName(badge) || 'Gantimpala'}</strong>
                      <small className="g46-ref-badge-status">{badge.statusText || 'Natapos mo ang isang layunin sa pag-aaral!'}</small>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="g46-ref-badge-empty">
                <span>🌱</span>
                <strong>Wala pang gantimpala</strong>
                <small>Tapusin ang aralin o pagsusulit para makuha ang unang gantimpala!</small>
              </div>
            )}
          </section>

       </div>
      </div>
    </Grade46StudentChrome>
  );
}


function SubjectCards({ lessonsBySubject, openLesson }) {
  return <div className="grid grid-3">{lessonsBySubject.map(item => <button className="module-card" key={item.name} onClick={() => item.lessons[0] && openLesson(item.lessons[0])}><div style={{ fontSize: 36 }}>{item.icon}</div><h3>{item.name}</h3><p>{item.lessons.length} aralin</p><ProgressBar value={item.lessons.length ? Math.round((item.lessons.filter(l => l.completed).length / item.lessons.length) * 100) : 0} /></button>)}</div>;
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
    if (tab === 'leaderboard') return go('screen-stu-leaderboard');
    if (tab === 'profile') return go('screen-stu-profile');
  };

  return (
    <>
      <EarlyStudentSubpageStyles />
      <div className="g12-page">
        <header className="g12-topbar">

          <div className="g12-top-actions">
            <div className="g12-pill">🌸 Baitang {s.gradeLevel || '—'} • {s.section || '—'}</div>
            <div className="g12-pill g12-top-xp-pill"><span className="g12-top-xp-bolt">⚡</span> {s.xp || 0} XP</div>
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
                <strong>🪙 {s.xp || 0} XP • Antas {level} • {shortLevelTitleForXp(s.xp)}</strong>
                <div className="g12-progress-track">
                  <span className="g12-progress-fill" style={{ width: `${xpPct}%` }} />
                </div>
              </div>
            )}
          </section>

          {children}
        </main>

        <nav className="g12-nav" aria-label="Student navigation">
          <button type="button" className={activeTab === 'home' ? 'active' : ''} onClick={() => goStudentTab('home')}><span className="g12-nav-icon">🏠</span>Tahanan</button>
          <button type="button" className={activeTab === 'lessons' ? 'active' : ''} onClick={() => goStudentTab('lessons')}><span className="g12-nav-icon">📖</span>Aralin</button>
          <button type="button" className={activeTab === 'quizzes' ? 'active' : ''} onClick={() => goStudentTab('quizzes')}><span className="g12-nav-icon">🧠</span>Pagsusulit</button>
          <button type="button" className={activeTab === 'missions' ? 'active' : ''} onClick={() => goStudentTab('missions')}><span className="g12-nav-icon">🎮</span>Misyon</button>
          <button type="button" className={activeTab === 'groups' ? 'active' : ''} onClick={() => goStudentTab('groups')}><span className="g12-nav-icon">👥</span>Pangkat</button>
          <button type="button" className={activeTab === 'badges' ? 'active' : ''} onClick={() => goStudentTab('badges')}><span className="g12-nav-icon">🏅</span>Gantimpala</button>
          <button type="button" className={activeTab === 'leaderboard' ? 'active' : ''} onClick={() => goStudentTab('leaderboard')}><span className="g12-nav-icon">🏆</span>Ranggo</button>
          <button type="button" className={activeTab === 'profile' ? 'active' : ''} onClick={() => goStudentTab('profile')}><span className="g12-nav-icon">🐰</span>Ako</button>
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
            <h2 className="g12-section-title">📚 Aklatan ng Mga Aralin</h2>

          </div>
        </div>

        <div className="g12-filter-row">
          <button className={`g12-chip ${subjectFilter === 'ALL' ? 'active' : ''}`} onClick={() => setSubjectFilter('ALL')}>🌎 Lahat</button>
          {SUBJECTS.map(subject => (
            <button
              key={subject.name}
              className={`g12-chip ${subjectFilter === subject.name ? 'active' : ''}`}
              onClick={() => setSubjectFilter(subject.name)}
            >
              <SubjectImageIcon subject={subject.name} src={subject.iconSrc} fallback={subject.icon} className="subject-img-icon chip" /> {subject.name}
            </button>
          ))}
          <button
            className={`g12-chip ${subjectFilter === 'FINISHED' ? 'active' : ''}`}
            onClick={() => setSubjectFilter('FINISHED')}
          >
            ✅ Tapos na
          </button>
        </div>

        <div className="g12-card-grid">
          {lessons.map(lesson => {
            const meta = subjectTheme(lesson.subject);
            const subjectInfo = SUBJECTS.find(subject => studentSubjectMatches(lesson.subject, subject.name)) || {};
            const tone = subjectInfo.tone || 'green';

            return (
              <button type="button" className={`g12-tile ${tone}`} key={lesson.id} onClick={() => openLesson(lesson)}>
                <div className="g12-tile-icon">
                  <SubjectImageIcon
                    subject={formatStudentSubjectDisplay(lesson.subject)}
                    src={subjectInfo.iconSrc || meta.iconSrc}
                    fallback={meta.icon}
                    className="subject-img-icon lesson"
                  />
                </div>
                <div className="g12-lesson-tile-body">
                  <h3>{shortEarlyLessonTitle(lesson)}</h3>
                  <p>{formatStudentSubjectDisplay(lesson.subject || 'Filipino')} • ⭐ {lesson.xpReward || 0} XP</p>
                  {lesson.completed && (
                    <span className="g12-status-pill">✅ Buod</span>
                  )}
                </div>
                <div className="g12-arrow" aria-hidden="true">›</div>
              </button>
            );
          })}
        </div>

        {!lessons.length && (
          <div className="g12-empty">Wala pang aralin para sa piniling salaan.</div>
        )}
      </section>
    </EarlyStudentChrome>
  );
}

function LessonsScreen({ lessons, subjectFilter, setSubjectFilter, go, openLesson, data, logout}) {
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
      logout={logout}
      icon="📚"
      title="Mga Aralin"
    >
      <section className="g46-ref-panel">
        <div className="g46-ref-panel-head">
          <div>
            <h2>Aklatan ng Mga Aralin</h2>
            <p className="g46-ref-muted">{lessons.length} {lessons.length === 1 ? 'aralin' : 'mga aralin'} ang available para sa iyong baitang.</p>
          </div>
        </div>

        <div className="g46-ref-filter-row">
          <button className={subjectFilter === 'ALL' ? 'active' : ''} onClick={() => setSubjectFilter('ALL')}>🌎 Lahat</button>
          {SUBJECTS.map(subject => (
            <button
              key={subject.name}
              className={subjectFilter === subject.name ? 'active' : ''}
              onClick={() => setSubjectFilter(subject.name)}
            >
              <SubjectImageIcon subject={subject.name} src={subject.iconSrc} fallback={subject.icon} className="subject-img-icon chip" /> {subject.name}
            </button>
          ))}
          <button
            className={subjectFilter === 'FINISHED' ? 'active' : ''}
            onClick={() => setSubjectFilter('FINISHED')}
          >
            ✅ Tapos na
          </button>
        </div>

        <div className="g46-ref-card-grid">
          {lessons.map(lesson => {
            const meta = subjectTheme(lesson.subject);
            const subjectInfo = SUBJECTS.find(subject => studentSubjectMatches(lesson.subject, subject.name)) || {};
            const tone = subjectInfo.tone || 'green';

            return (
              <button type="button" className={`g46-ref-card ${tone}`} key={lesson.id} onClick={() => openLesson(lesson)}>
                <div>
                  <div className="g46-ref-card-top">
                    <span className="g46-ref-card-icon">
                      <SubjectImageIcon
                        subject={formatStudentSubjectDisplay(lesson.subject)}
                        src={subjectInfo.iconSrc || meta.iconSrc}
                        fallback={meta.icon}
                        className="subject-img-icon lesson"
                      />
                    </span>
                    <span className="g46-ref-tag">{lesson.completed ? '✅ Tapos Na' : '▶ Simulan'}</span>
                  </div>
                  <h4>{lesson.title}</h4>
                  <p>{formatStudentSubjectDisplay(lesson.subject)} • Baitang {lesson.gradeLevel} • +{lesson.xpReward || 0} XP</p>
                </div>
                <span className="g46-ref-primary-btn" style={{ width: 'max-content' }}>{lesson.completed ? 'Buod' : 'Simulan'}</span>
              </button>
            );
          })}
        </div>

        {!lessons.length && <div className="g46-ref-empty">Wala pang aralin para sa piniling salaan.</div>}
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

// TUKLAS_SPEECH_CATEGORY_SAFETY_V1
function speechCategoryFromScore(score = 0) {
  const value = Math.max(
    0,
    Math.min(100, Number(score || 0))
  );

  if (value >= 75) {
    return {
      label: 'Very Good',
      message: 'Napakahusay ng iyong pagbigkas!',
      icon: '✅',
      background: '#E9FBEF',
      border: '#B7E4C7',
      color: '#166534'
    };
  }

  if (value >= 50) {
    return {
      label: 'Good',
      message: 'Maganda! Kaunting pagsasanay pa.',
      icon: '👍',
      background: '#FFF8DF',
      border: '#F4E7AA',
      color: '#6B4B00'
    };
  }

  return {
    label: 'Bad',
    message:
      'Subukan muli at bigkasin nang mas malinaw.',
    icon: '🔴',
    background: '#FFF4E5',
    border: '#FED7AA',
    color: '#9A3412'
  };
}

function getSpeechRecognition() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function LessonScreen({ lesson, feedback, go, completeLesson, submitMcq, submitWriting, submitSpeech, data, openLesson, logout}) {
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
  const [lessonGateToast, setLessonGateToast] = useState('');
  const [readStepListened, setReadStepListened] = useState(false);

  useEffect(() => {
    const savedStep = Math.max(
      0,
      Math.min(
        Number(lesson?.progress?.currentStep || 1) - 1,
        Math.max(0, lessonSteps.length - 1)
      )
    );
    const readStepIndex = lessonSteps.findIndex(step => step.key === 'read');
    const activitiesStepIndex = lessonSteps.findIndex(step => step.key === 'activities');
    const firstIncompletePracticeIndex = practiceActivities.findIndex((activity, index) =>
      !isPracticeActivityComplete(activity, index)
    );
    const hasSubmittedPractice = practiceActivities.some((activity, index) =>
      isPracticeActivityComplete(activity, index)
    );

    setLessonStep(savedStep);
    setMaxUnlockedStep(savedStep);
    setPracticeStep(
      savedStep >= activitiesStepIndex && firstIncompletePracticeIndex >= 0
        ? firstIncompletePracticeIndex
        : 0
    );
    setCompletedPracticeKeys([]);
    setActivityFeedbackKey('');
    setReflectionChoice('');
    setLessonGateToast('');
    setReadStepListened(
      (readStepIndex >= 0 && Number(lesson?.progress?.currentStep || 1) > readStepIndex + 1) ||
      hasSubmittedPractice
    );

    stopSpeech();
  }, [lesson?.id, lesson?.progress?.currentStep, lesson?.progress?.totalSteps]);

  async function speakLesson() {
    setReadStepListened(true);

    const readStepIndex = lessonSteps.findIndex(step => step.key === 'read');
    if (readStepIndex >= 0) {
      saveGrade46LessonProgress(
        Math.min(readStepIndex + 1, lessonSteps.length - 1),
        'read'
      );
    }

    const lessonPassage = lesson?.passage || '';
    const listenSections = ['layunin', 'panimula', 'aralin']
      .map(section => getStructuredLessonSectionText(lessonPassage, section))
      .filter(Boolean);
    const aralinAudio = getStructuredLessonLessonsAudioText(lessonPassage);
    const text = listenSections.length
      ? listenSections.join(' ')
      : aralinAudio || lessonPassage || 'Basahin nang malinaw.';

    await speakText(text);
  }

  const materialActivities = activities.filter(isLessonMaterialActivity);
  const practiceActivities = activities.filter(activity => !isLessonMaterialActivity(activity));
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
      const questions = asArray(activity.questions).slice(0, 1);
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

    const activitiesStepIndex = lessonSteps.findIndex(step => step.key === 'activities');
    if (activitiesStepIndex >= 0) {
      saveGrade46LessonProgress(activitiesStepIndex, activity?.type || 'activity');
    }
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
      eyebrow: 'Hakbang 1',
      title: 'Buod ng Aralin',
      subtitle: 'Tingnan ang layunin ng aralin, gantimpala, at mga kailangang tapusin.'
    },
    ...(materialActivities.length ? [{
      key: 'material',
      eyebrow: 'Hakbang 2',
      title: 'Materyal ng Aralin',
      subtitle: 'Buksan muna ang kalakip na slides o PDF bago magbasa at sumagot.'
    }] : []),
    {
      key: 'read',
      eyebrow: `Hakbang ${materialActivities.length ? 3 : 2}`,
      title: 'Basahin ang Aralin',
      subtitle: 'Basahing mabuti ang panuto at teksto ng aralin.'
    },
    {
      key: 'activities',
      eyebrow: `Hakbang ${materialActivities.length ? 4 : 3}`,
      title: 'Mga Gawain sa Pagsasanay',
      subtitle: activityTotal
        ? `Gawain ${currentPracticeIndex + 1} sa ${activityTotal}`
        : 'Wala pang gawaing pagsasanay para sa araling ito.'
    },
    {
      key: 'complete',
      eyebrow: `Hakbang ${materialActivities.length ? 5 : 4}`,
      title: 'Tapusin ang Aralin',
      subtitle: 'Ipasa ang pag-unlad sa aralin kapag handa ka na.'
    }
  ];

  const safeStep = Math.min(lessonStep, lessonSteps.length - 1);
  const currentStep = lessonSteps[safeStep];
  const canGoBack = safeStep > 0 || (currentStep?.key === 'activities' && currentPracticeIndex > 0);
  const canGoNext = safeStep < lessonSteps.length - 1;

  function showLessonGateToast(message) {
    if (!message) return;

    setLessonGateToast(message);
    window.setTimeout(() => {
      setLessonGateToast(current => current === message ? '' : current);
    }, 2600);
  }


  async function saveGrade46LessonProgress(targetStepIndex, lastActivityType = '') {
    if (!lesson?.id || lesson?.completed) return;

    const safeTargetIndex = Math.max(0, Math.min(targetStepIndex, lessonSteps.length - 1));

    try {
      await api(`/lessons/${lesson.id}/progress`, {
        method: 'PATCH',
        body: {
          currentStep: safeTargetIndex + 1,
          totalSteps: lessonSteps.length,
          lastActivityType
        }
      });
    } catch (err) {
      console.warn('Hindi maisave ang pag-unlad sa lesson', err);
    }
  }

  function practiceActivityGateMessage(activity = currentPracticeActivity) {
    const type = String(activity?.type || '').toLowerCase();

    if (type === 'mcq') return 'Sagutan muna ang pagsusulit.';
    if (type === 'writing') return 'Ipasa muna ang gawain.';
    if (type === 'speech') return 'Ipasa muna ang bigkas.';

    return 'Ipasa muna ang gawaing ito bago magpatuloy.';
  }

  function goStep(delta) {
    const targetStep = Math.max(0, Math.min(lessonSteps.length - 1, safeStep + delta));

    if (delta > 0 && currentStep?.key === 'read' && !readStepListened) {
      showLessonGateToast('Pakinggan muna ang aralin.');
      return;
    }

    if (delta > 0 && currentStep?.key === 'activities' && !allRequiredPracticeComplete) {
      showLessonGateToast('Ipasa muna ang kinakailangang gawain bago magpatuloy.');
      return;
    }

    if (targetStep > safeStep) {
      setMaxUnlockedStep(prev => Math.max(prev, targetStep));
      saveGrade46LessonProgress(targetStep, currentStep?.key || '');
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
        showLessonGateToast(practiceActivityGateMessage(currentPracticeActivity));
        return;
      }

      if (currentPracticeIndex < activityTotal - 1) {
        setActivityFeedbackKey('');
        setPracticeStep(prev => Math.min(activityTotal - 1, prev + 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      if (!allRequiredPracticeComplete) {
        showLessonGateToast('Ipasa muna ang lahat ng kinakailangang gawain bago magpatuloy.');
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
        <div className="section-title">Puna sa Gawain</div>
        <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.45 }}>
          {feedback}
        </div>
      </div>
    );
  }

  function renderCompletedBuod() {
    return (
      <Grade46StudentChrome
        data={data}
        activeTab="lessons"
        go={go}
        logout={logout}
        icon="✅"
        title={lesson?.title || "Buod ng Aralin"}
        subtitle={`Tapos Na • Baitang ${lesson?.gradeLevel || '—'} • ${formatStudentSubjectDisplay(lesson?.subject || 'Filipino')}`}
        titleAction={
          <button
            type="button"
            className="g46-ref-soft-btn"
            onClick={() => go('screen-lessons')}
          >
            ← Mga Aralin
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
                <span className="g46-ref-tag">✅ Tapos Na</span>
                <h2 style={{ marginTop: 8 }}>Buod ng Aralin</h2>
                <p className="g46-ref-muted">
                  Natapos mo na ang araling ito. Balikan ang materyal kung kinakailangan o bumalik sa listahan ng mga aralin.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginTop: 16 }}>
              {[
                { icon: '📘', label: 'Asignatura', value: formatStudentSubjectDisplay(lesson?.subject || 'Filipino') },
                { icon: '🎯', label: 'Mga Gawain', value: `${activityTotal} ${activityTotal === 1 ? 'Gawain' : 'Mga Gawain'}` },
                { icon: '⚡', label: 'Gantimpala', value: `+${lesson?.xpReward || 0} XP` }
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
                  <h2>Balikan ang Materyal ng Aralin</h2>
                  <p className="g46-ref-muted">Maaari mo pa ring buksan ang kalakip na mga pahina o PDF para sa pagbabalik-aral.</p>
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
              Buod ng natapos na aralin
            </span>

            <button
              type="button"
              className="g46-ref-primary-btn"
              onClick={() => go('screen-lessons')}
            >
              Balik sa mga Aralin
            </button>
          </section>
        </div>
      </Grade46StudentChrome>
    );
  }

  if (lesson?.completed) {
    return renderCompletedBuod();
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
                Baitang {lesson?.gradeLevel || '—'} • {formatStudentSubjectDisplay(lesson?.subject || 'Filipino')}
              </div>

              <h2 style={{ margin: '4px 0 8px', fontSize: 28, lineHeight: 1.1 }}>
                {lesson?.title || 'Aralin'}
              </h2>

              <div className="muted" style={{ fontSize: 15, lineHeight: 1.55 }}>
                Basahing mabuti ang aralin, buksan ang kalakip na materyal kung mayroon, tapusin ang mga gawain, at subaybayan ang iyong pag-unlad.
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
              { icon: '🎯', label: 'Mga Gawain', value: `${activityTotal} ${activityTotal === 1 ? 'Gawain' : 'Mga Gawain'}` },
              { icon: '⚡', label: 'Gantimpala', value: `+${lesson?.xpReward || 0} XP` }
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
      const lessonPassage = lesson?.passage || '';
      const structuredSections = [
        { key: 'layunin', label: 'Layunin', icon: '🎯' },
        { key: 'panimula', label: 'Panimula', icon: '💡' },
        { key: 'aralin', label: 'Aralin', icon: '📖' },
      ];
      const hasStructuredText = structuredSections.some(section =>
        Boolean(getStructuredLessonSectionText(lessonPassage, section.key))
      );

      return (
        <div className="g46-ref-panel" style={{ display: 'grid', gap: 14 }}>
          {lessonPassage ? (
            hasStructuredText ? (
              <div style={{ display: 'grid', gap: 12 }}>
                {structuredSections.map(section => {
                  const sectionText = getStructuredLessonSectionText(lessonPassage, section.key);
                  if (!sectionText) return null;

                  return (
                    <div
                      key={section.key}
                      style={{
                        padding: 18,
                        borderRadius: 20,
                        background: '#FFFFFF',
                        border: '1px solid #DDE8FF',
                        boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          marginBottom: 10,
                          color: '#0F8F57',
                          fontWeight: 1000,
                          fontSize: 22
                        }}
                      >
                        <span><TuklasBadgeVisual badge={section} size={56} /></span>
                        <span>{section.label}</span>
                      </div>

                      <div
                        style={{
                          lineHeight: 1.8,
                          fontSize: 20,
                          color: '#17324D',
                          fontWeight: 800
                        }}
                      >
                        {sectionText}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                style={{
                  padding: 18,
                  borderRadius: 18,
                  background: '#FFFFFF',
                  border: '1px solid #E1E7FF',
                  lineHeight: 1.75,
                  fontSize: 16,
                  whiteSpace: 'pre-wrap'
                }}
              >
                {lessonPassage}
              </div>
            )
          ) : (
            <div className="muted">Wala pang idinagdag na babasahin para sa araling ito.</div>
          )}

          <div className="divider" />

          <div className="row" style={{ alignItems: 'center', gap: 12 }}>
            <button className="btn btn-blue" onClick={speakLesson}>
              🔊 Pakinggan
            </button>

            <button className="btn btn-outline" onClick={() => stopSpeech()}>
              ⏹ Ihinto
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

                  if (result) {
                    markPracticeComplete(currentActivity, currentPracticeIndex);
                    setActivityFeedbackKey(getPracticeKey(currentActivity, currentPracticeIndex));
                  }

                  return result;
                }}
                submitWriting={async (...args) => {
                  const result = await submitWriting(...args);

                  if (result) {
                    markPracticeComplete(currentActivity, currentPracticeIndex);
                    setActivityFeedbackKey(getPracticeKey(currentActivity, currentPracticeIndex));
                  }

                  return result;
                }}
                submitSpeech={async (...args) => {
                  const result = await submitSpeech(...args);

                  if (result) {
                    markPracticeComplete(currentActivity, currentPracticeIndex);
                    setActivityFeedbackKey(getPracticeKey(currentActivity, currentPracticeIndex));
                  }

                  return result;
                }}
              />

              {renderFeedbackCard()}
            </>
          ) : (
            <div className="g46-ref-panel">
              <p className="g46-ref-muted" style={{ margin: 0 }}>
                Wala pang pagsasanay para sa araling ito.
              </p>
            </div>
          )}
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
          Tapusin ang Araling Ito
        </div>

        <div className="muted" style={{ marginBottom: 14, lineHeight: 1.55 }}>
          Kapag tapos ka nang magbasa at sumagot sa mga gawain, ipasa ang iyong progreso sa aralin.
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
          ✅ Tapusin ang Aralin
        </button>
      </div>
    );
  }

  return (
    <Grade46StudentChrome
      data={data}
      activeTab="lessons"
      go={go}
      logout={logout}
      icon={theme.icon || "📘"}
      title={lesson?.title || "Aralin"}
      subtitle={`Baitang ${lesson?.gradeLevel || '—'} • ${formatStudentSubjectDisplay(lesson?.subject || 'Filipino')} • +${lesson?.xpReward || 0} XP`}
      titleAction={
        <button
          type="button"
          className="g46-ref-soft-btn"
          onClick={() => go('screen-lessons')}
        >
          ← Mga Aralin
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
                title={index <= maxUnlockedStep ? step.title : 'Pindutin ang Susunod para mabuksan ang hakbang na ito'}
              />
            ))}
          </div>
        </section>

        {lessonGateToast && (
          <div className="g12-gate-notif-wrap" role="status">
            <div className="notif warn g12-gate-notif">
              <span>{lessonGateToast}</span>
            </div>
          </div>
        )}

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
              ? `Gawain ${currentPracticeIndex + 1} / ${activityTotal}`
              : `${safeStep + 1} / ${lessonSteps.length}`}
          </span>

          {canGoNext ? (
            <button
              type="button"
              className="g46-ref-primary-btn"
              onClick={handleNext}
            >
              {currentStep.key === 'activities' && currentPracticeIndex < activityTotal - 1
                ? 'Susunod na Gawain →'
                : 'Susunod →'}
            </button>
          ) : (
            <button
              type="button"
              className="g46-ref-soft-btn"
              onClick={() => go('screen-lessons')}
            >
              Balik sa mga Aralin
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

function compactKidTitle(text = "", maxLength = 44) {
  const clean = String(text || "")
    .replace(/\s+/g, " ")
    .replace(/\s+([:;,.!?])/g, "$1")
    .trim();

  if (clean.length <= maxLength) return clean;

  const words = clean.split(" ");
  let out = "";

  for (const word of words) {
    const next = out ? `${out} ${word}` : word;
    if (next.length > maxLength) break;
    out = next;
  }

  return out || clean.slice(0, maxLength).trim();
}

function getEarlyLessonTopicTitle(lesson = {}) {
  const subject = String(lesson.subject || "").trim();
  const rawTitle = String(lesson.title || "").trim();

  if (!rawTitle) return compactKidTitle(subject || "Mga Aralin");

  const withoutExtra = rawTitle
    .replace(/\s*lesson\s*$/i, "")
    .replace(/\s*quiz\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();

  const afterColon = withoutExtra.includes(":")
    ? withoutExtra.split(":").slice(1).join(":").trim()
    : "";

  let topic = afterColon || withoutExtra;

  topic = topic
    .replace(/^(pagbasa|pagbabasa|bokabularyo|panitikan|oral\s*comm(?:unication)?|bigkas|pagsulat|patlang|sulatin|writing|speech)\s*\d*\s*[-–—:]?\s*/i, "")
    .replace(/^grade\s*\d+\s*[-–—:]?\s*/i, "")
    .replace(/^\d+\s*[-–—:]?\s*/, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!topic || /^[\d\s-–—:]+$/.test(topic)) {
    topic = subject || withoutExtra || "Mga Aralin";
  }

  return compactKidTitle(topic, 44);
}

function shortEarlyLessonTitle(lesson = {}) {
  return getEarlyLessonTopicTitle(lesson);
}

function makeStudentFriendlyPassage(lesson) {
  const rawInput = String(lesson?.passage || lesson?.instructions || lesson?.title || '');
  const raw = cleanLessonTextForKids(rawInput);

  if (!raw) return 'Makinig, magbasa, at sagutin ang gawain. Kaya mo ito!';

  const extracted = extractSectionFromLessonPlan(
    raw,
    ['Main Lesson / Passage', 'Main Lesson', 'Passage', 'Lesson Content'],
    ['Vocabulary Words', 'Maikling Pagsusulit', 'Gawain sa Pagtutugma', 'Gawain sa Pagsulat', 'Pagsasanay sa Pagbigkas', 'Teacher Notes']
  );

  const source = String(extracted || rawInput)
    .replace(/TUKLAS TALINO SAMPLE LESSON PLAN/gi, '')
    .replace(/Subject:\s*[^.\n]+/gi, '')
    .replace(/(?:Grade|Baitang) Level:\s*[^.\n]+/gi, '')
    .replace(/Module:\s*[^.\n]+/gi, '')
    .replace(/Lesson Title:\s*/gi, '')
    .replace(/Estimated Duration:\s*[^.\n]+/gi, '')
    .replace(/XP Reward:\s*[^.\n]+/gi, '')
    .replace(/Learning Objectives:\s*/gi, '');

  const withReadableSections = source
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*(Layunin|Alamin|Panimula|Aralin|Lesson|Lessons|Mga Aralin|Gawain|Mga salita|Mga Salita)\s*:\s*/g, '\n$1: ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const lines = withReadableSections
    .split(/\n+/)
    .map(line => cleanLessonTextForKids(line))
    .filter(Boolean)
    .filter(line => !/^(pagkatapos|teacher notes|correct answer|question\s*\d+|mini quiz)/i.test(line));

  const fullText = lines.join('\n\n').trim();
  const fallback = cleanLessonTextForKids(source);

  return (fullText || fallback || raw).slice(0, 1800);
}

function isLessonMaterialActivity(activity = {}) {
  const type = String(activity?.type || '').toLowerCase();
  return type === 'material' || type === 'infographic';
}

function activityMissionMeta(activity, index = 0) {
  const map = {
    infographic: { icon: '🖼️', label: 'Tingnan' },
    vocabulary: { icon: '🔤', label: 'Salita' },
    matching: { icon: '🧩', label: 'Pares' },
    mcq: { icon: '🎮', label: 'Pagsusulit' },
    speech: { icon: '🎤', label: 'Bigkas' },
    writing: { icon: '🧩', label: 'Gawain' }
  };

  return map[activity?.type] || { icon: ['⭐', '🌟', '✨'][index % 3], label: 'Gawain' };
}

function EarlyLessonScreen({ lesson, feedback, go, completeLesson, submitMcq, submitWriting, submitSpeech, data, openLesson }) {
  const activities = lesson?.activities || [];
  const materialActivities = activities.filter(isLessonMaterialActivity);
  const practiceActivities = activities.filter(activity => !isLessonMaterialActivity(activity));
  const corePracticeActivities = practiceActivities.filter(activity =>
    ['mcq', 'writing', 'speech'].includes(activity?.type)
  );
  const theme = subjectTheme(lesson?.subject);
  const [missionStep, setMissionStep] = useState(0);
  const [maxUnlockedStep, setMaxUnlockedStep] = useState(0);
  const [rewardModal, setRewardModal] = useState(null);
  const [rewardClaimed, setRewardClaimed] = useState(Boolean(lesson?.completed));
  const [lessonGateToast, setLessonGateToast] = useState('');
  const [listenedSteps, setListenedSteps] = useState({});
  const [earlyActivityDone, setEarlyActivityDone] = useState({});

  useEffect(() => {
    const savedStep = Math.max(
      0,
      Math.min(
        Number(lesson?.progress?.currentStep || 1) - 1,
        Math.max(0, missionSteps.length - 1)
      )
    );
    const hasSubmittedPractice = corePracticeActivities.some((activity, index) =>
      isEarlyLessonActivitySubmitted(activity, index)
    );
    const reachedPast = (type) => {
      const stepIndex = missionSteps.findIndex(step => step.type === type);
      return stepIndex >= 0 && Number(lesson?.progress?.currentStep || 1) > stepIndex + 1;
    };

    setMissionStep(savedStep);
    setMaxUnlockedStep(savedStep);
    setRewardModal(null);
    setRewardClaimed(Boolean(lesson?.completed));
    setLessonGateToast('');
    setListenedSteps({
      listen: reachedPast('listen') || hasSubmittedPractice,
      know: reachedPast('know') || hasSubmittedPractice,
      read: reachedPast('read') || hasSubmittedPractice,
    });
    setEarlyActivityDone({});
  }, [lesson?.id, lesson?.completed, lesson?.progress?.currentStep, lesson?.progress?.totalSteps]);

  const kidPassage = makeStudentFriendlyPassage(lesson);
  const isReviewMode = Boolean(lesson?.completed || rewardClaimed);
  const missionSteps = [
    { type: 'listen', icon: '👂', label: 'Layunin' },
    { type: 'know', icon: '💡', label: 'Alamin' },
    ...(materialActivities.length ? [{ type: 'material', icon: '📎', label: 'Materyal' }] : []),
    { type: 'read', icon: '📖', label: 'Aralin' },
    ...corePracticeActivities.map((activity, index) => ({
      type: 'activity',
      activity,
      activityIndex: index,
      ...activityMissionMeta(activity, index)
    })),
    { type: 'finish', icon: isReviewMode ? '✅' : '⭐', label: isReviewMode ? 'Pagbabalik-aral' : 'Tapos' }
  ];

  const safeStep = Math.min(missionStep, missionSteps.length - 1);
  const currentStep = missionSteps[safeStep];
  const progress = Math.round(((safeStep + 1) / Math.max(1, missionSteps.length)) * 100);

  function showLessonGateToast(message) {
    if (!message) return;

    setLessonGateToast(message);
    window.setTimeout(() => {
      setLessonGateToast(current => current === message ? '' : current);
    }, 2600);
  }


  async function saveEarlyLessonProgress(targetStepIndex, lastActivityType = '') {
    if (!lesson?.id || isReviewMode) return;

    const safeTargetIndex = Math.max(0, Math.min(targetStepIndex, missionSteps.length - 1));

    setMaxUnlockedStep(previous => Math.max(previous, safeTargetIndex));

    try {
      await api(`/lessons/${lesson.id}/progress`, {
        method: 'PATCH',
        body: {
          currentStep: safeTargetIndex + 1,
          totalSteps: missionSteps.length,
          lastActivityType
        }
      });
    } catch (err) {
      console.warn('Hindi maisave ang pag-unlad sa lesson', err);
    }
  }

  function earlyActivityKey(activity = {}, fallbackIndex = 0) {
    const firstQuestion = asArray(activity.questions)[0];

    return [
      activity?.type || 'activity',
      activity?.id ||
        activity?.writingTask?.id ||
        activity?.speechTask?.id ||
        firstQuestion?.id ||
        fallbackIndex ||
        'current'
    ].join(':');
  }

  function markEarlyActivityDone(activity = currentStep?.activity) {
    if (!activity) return;

    const key = earlyActivityKey(activity, currentStep?.activityIndex || 0);
    setEarlyActivityDone(previous => ({
      ...previous,
      [key]: true
    }));

    const stepIndex = missionSteps.findIndex(step =>
      step.type === 'activity' &&
      earlyActivityKey(step.activity, step.activityIndex || 0) === key
    );

    if (stepIndex >= 0) {
      saveEarlyLessonProgress(
        Math.min(stepIndex + 1, missionSteps.length - 1),
        activity?.type || 'activity'
      );
    }
  }

  function isEarlyLessonActivitySubmitted(activity = {}, fallbackIndex = 0) {
    const type = String(activity?.type || '').toLowerCase();
    const key = earlyActivityKey(activity, fallbackIndex);

    if (earlyActivityDone[key]) return true;

    if (type === 'mcq') {
      const questions = asArray(activity.questions).slice(0, 1);
      return Boolean(questions.length) && questions.every(question => Boolean(question.mcqAttempt));
    }

    if (type === 'writing') {
      return Boolean(
        activity.writingSubmission ||
        activity.submission ||
        activity.completed ||
        activity.writingTask?.writingSubmission ||
        activity.writingTask?.submission ||
        activity.writingTask?.latestSubmission ||
        activity.writingTask?.answer ||
        activity.writingTask?.completed
      );
    }

    if (type === 'speech') {
      return Boolean(
        activity.speechAttempt ||
        activity.completed ||
        activity.speechTask?.speechAttempt ||
        activity.speechTask?.latestAttempt ||
        activity.speechTask?.transcript ||
        activity.speechTask?.completed
      );
    }

    return true;
  }

  function earlyActivityGateMessage(activity = {}) {
    const type = String(activity?.type || '').toLowerCase();

    if (type === 'mcq') return 'Sagutan muna ang pagsusulit.';
    if (type === 'writing') return 'Ipasa muna ang gawain.';
    if (type === 'speech') return 'Ipasa muna ang bigkas.';

    return 'Tapusin muna ang gawain.';
  }

  function currentStepGateMessage() {
    if (isReviewMode) return '';

    if (currentStep?.type === 'listen' && !listenedSteps.listen) {
      return 'Pakinggan muna ang layunin.';
    }

    if (currentStep?.type === 'know' && !listenedSteps.know) {
      return 'Pakinggan muna ang alamin.';
    }

    if (currentStep?.type === 'read' && !listenedSteps.read) {
      return 'Pakinggan muna ang aralin.';
    }

    if (
      currentStep?.type === 'activity' &&
      !isEarlyLessonActivitySubmitted(currentStep.activity, currentStep.activityIndex)
    ) {
      return earlyActivityGateMessage(currentStep.activity);
    }

    return '';
  }

  function markStepListened(key, text) {
    setListenedSteps(previous => ({
      ...previous,
      [key]: true
    }));

    saveEarlyLessonProgress(
      Math.min(safeStep + 1, missionSteps.length - 1),
      key
    );

    speakFilipinoText(text);
  }

  async function handleEarlySubmitMcq(...args) {
    const result = await submitMcq(...args);
    markEarlyActivityDone(currentStep?.activity);
    return result;
  }

  async function handleEarlySubmitWriting(...args) {
    const result = await submitWriting(...args);
    markEarlyActivityDone(currentStep?.activity);
    return result;
  }

  async function handleEarlySubmitSpeech(...args) {
    const result = await submitSpeech(...args);

    if (result) {
      markEarlyActivityDone(currentStep?.activity);
    }

    return result;
  }


  function activityGuideText(step) {
    const activity = step?.activity || {};

    if (activity.speechTask || activity.targetText) {
      return 'Pakinggan muna, tapos bigkasin. Tutulungan ka ng AI speech check sa pagbigkas.';
    }

    if (activity.writingTask || activity.prompt) {
      return '';
    }

    return '';
  }

  function goNext() {
    if (rewardModal) return;

    const gateMessage = currentStepGateMessage();

    if (gateMessage) {
      showLessonGateToast(gateMessage);
      return;
    }

    const targetStep = Math.min(safeStep + 1, missionSteps.length - 1);
    saveEarlyLessonProgress(targetStep, currentStep?.type || '');
    setMissionStep(targetStep);
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
    stopSpeech();
    setRewardModal({ xp: xpEarned, badges: uniqueBadgesForDisplay(result?.newBadges || []) });
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
    speakText(text);
  }

  if (lesson?.completed && !rewardModal) {
    const nextLesson = findNextLesson();
    const summaryItems = [
      { icon: theme.icon || '📘', label: lesson?.subject || 'Filipino' },
      { icon: '⚡', label: `${lesson?.xpReward || 0} nakuhang XP` },
      { icon: '🎯', label: `${activities.length} ${activities.length === 1 ? 'gawain' : 'mga gawain'}` }
    ];

    return (
      <EarlyStudentChrome
        data={data}
        activeTab="lessons"
        go={go}
        icon="✅"
        title="Buod ng Aralin"
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

          /* Baitang 1-2 completed-summary balanced font sizing. */
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
            <h2>Tapos na ang mga Aralin!</h2>
            <p>{lesson?.title || 'Natapos mo na ang araling ito.'}</p>
            <div className="g12-summary-chip-row">
              {summaryItems.map(item => (
                <span className="g12-summary-chip" key={item.label}>
                  <span><TuklasBadgeVisual badge={item} size={56} /></span>
                  {item.label}
                </span>
              ))}
            </div>
          </section>

          <section className="g12-summary-card">
            <h3>Maikling Buod</h3>
            <div className="g12-summary-text">
              {kidPassage}
            </div>
          </section>

          <div className="g12-summary-actions">
            {nextLesson && (
              <button type="button" className="g12-summary-btn purple" onClick={() => openLesson(nextLesson)}>
                Susunod na Aralin →
              </button>
            )}
            <button type="button" className="g12-summary-btn" onClick={() => go('screen-student')}>
              🏠 Tahanan
            </button>
            <button type="button" className="g12-summary-btn secondary" onClick={() => go('screen-lessons')}>
              📖 Mas Maraming Aralin
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
      title={lesson?.title || lesson?.name || lesson?.lessonTitle || 'Aralin'}
      subtitle={`${formatStudentSubjectDisplay(lesson?.subject || 'Filipino')} • Baitang ${lesson?.gradeLevel || '—'} • ${isReviewMode ? 'Pagbabalik-aral' : `+${lesson?.xpReward || 0} XP`}`}
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


        /* === Baitang 1-2 Reward Badge Unlock === */
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
        /* === End Baitang 1-2 Reward Badge Unlock === */

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


        /* Baitang 1-2 lesson mission balanced font sizing. */
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
          <div className="g12-reward-overlay" role="dialog" aria-modal="true" aria-label="Gantimpala sa Misyon">
            <div className="g12-reward-modal">
              {['🎊', '⭐', '✨', '🌟', '🎉', '💛', '🌈'].map((piece, index) => (
                <span className="g12-confetti-piece" key={index}>{piece}</span>
              ))}

              <div className="g12-reward-big">🏆</div>
              <h3>Tapos na ang Misyon!</h3>
              <p>Ang galing mo! Natapos mo ang aralin.</p>
              <div className="g12-reward-xp">⚡ +{rewardModal.xp || 0} XP</div>

              {Array.isArray(rewardModal.badges) && rewardModal.badges.length > 0 && (
                <div className="g12-reward-badges">
                  <p className="g12-reward-badge-eyebrow">🏅 Bagong Nabuksang Gantimpala!</p>

                  <div className="g12-reward-badge-list">
                    {rewardModal.badges.slice(0, 2).map((badge, badgeIndex) => (
                      <div className="g12-reward-badge-chip" key={badge.id || badge.code || badge.name || badgeIndex}>
                        <span><TuklasBadgeVisual badge={badge} size={56} /></span>
                        <div>
                          <strong>{badgeDisplayName(badge) || 'Bagong Gantimpala'}</strong>
                          <small>{badgeDisplayDescription(badge)}</small>
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
                    Tingnan ang Aking mga Gantimpala →
                  </button>
                </div>
              )}

              <div className="g12-reward-actions">
                <button type="button" className="g12-mission-btn purple" onClick={goNextAfterReward}>
                  Susunod na Aralin →
                </button>
                <button type="button" className="g12-mission-btn secondary" onClick={goHomeAfterReward}>
                  🏠 Tahanan
                </button>
              </div>
            </div>
          </div>
        )}

        <section className="g12-mission-banner">
          <div className="g12-mission-topline">
            <div>
              <h2>{shortEarlyLessonTitle(lesson)} 🌟</h2>
              <p>Hakbang {safeStep + 1} sa {missionSteps.length}</p>
            </div>
            <div className="g12-mission-xp">⚡ +{lesson?.xpReward || 0} XP</div>
          </div>

          <div className="g12-progress-track">
            <span className="g12-progress-fill" style={{ width: `${progress}%` }} />
          </div>

          <div className="g12-mission-path" aria-label="Mga Hakbang sa Misyon">
            {missionSteps.map((step, index) => (
              <button
                type="button"
                key={`${step.type}-${index}`}
                className={`g12-mission-dot ${index < maxUnlockedStep && index !== safeStep ? 'done' : ''} ${index === safeStep ? 'active' : ''}`}
                disabled={rewardClaimed || rewardModal || index > maxUnlockedStep}
                aria-disabled={rewardClaimed || rewardModal || index > maxUnlockedStep}
                onClick={() => {
                  if (!rewardClaimed && !rewardModal && index <= maxUnlockedStep) {
                    setMissionStep(index);
                  }
                }}
              >
                <span><TuklasBadgeVisual badge={step} size={56} /></span>
                <small>{step.label}</small>
              </button>
            ))}
          </div>
        </section>

        {lessonGateToast && (
          <div className="g12-gate-notif-wrap" role="status">
            <div className="notif warn g12-gate-notif">
              <span>{lessonGateToast}</span>
            </div>
          </div>
        )}

        <section className="g12-mission-card">
          {currentStep.type === 'listen' && (
            <>
              <div className="g12-mission-step-head">
                <div className="g12-mission-big-icon">👂</div>
                <div>
                  <h3>Layunin</h3>
                </div>
              </div>

              <div className="g12-mission-text-card">
                {getStructuredLessonSectionText(kidPassage, 'layunin') || lesson?.title || 'Handa ka na bang matuto?'}
              </div>

              <div className="g12-mission-actions">
                <div className="g12-mission-actions-left">
                  <button className="g12-mission-btn" onClick={() => markStepListened('listen', getStructuredLessonSectionText(kidPassage, 'layunin') || lesson?.title || 'Handa ka na bang matuto?')}>🔊 Pakinggan</button>
                  <button className="g12-mission-btn secondary" type="button" onClick={() => stopSpeech()}>⏹️ Ihinto</button>
                </div>
                <div className="g12-mission-actions-right">
                  <button className="g12-mission-btn purple" onClick={goNext}>Alamin →</button>
                </div>
              </div>
            </>
          )}

          {currentStep.type === 'know' && (
            <>
              <div className="g12-mission-step-head">
                <div className="g12-mission-big-icon">💡</div>
                <div>
                  <h3>Alamin</h3>
                </div>
              </div>

              <StructuredLessonKnowCard lesson={lesson} text={kidPassage} />

              <div className="g12-mission-actions">
                <div className="g12-mission-actions-left">
                  <button className="g12-mission-btn secondary" onClick={goBackStep}>← Balik</button>
                  <button className="g12-mission-btn" onClick={() => markStepListened('know', getStructuredLessonKnowAudioText(kidPassage, lesson))}>🔊 Pakinggan</button>
                    <button className="g12-mission-btn secondary" type="button" onClick={() => stopSpeech()}>⏹️ Ihinto</button>
                </div>
                <div className="g12-mission-actions-right">
                  <button className="g12-mission-btn purple" onClick={goNext}>{materialActivities.length ? 'Materyal →' : 'Aralin →'}</button>
                </div>
              </div>
            </>
          )}

          {currentStep.type === 'material' && (
            <>
              <div className="g12-mission-step-head">
                <div className="g12-mission-big-icon">📎</div>
                <div>
                  <h3>Materyal</h3>
                  <p>Buksan ang PPT o PDF na in-upload ng teacher bago basahin ang aralin.</p>
                </div>
              </div>

              <div className="g12-mission-activity">
                {materialActivities.map((activity, materialIndex) => (
                  <ActivityCard
                    key={activity.id || activity.fileUrl || materialIndex}
                    activity={activity}
                    index={materialIndex}
                    total={materialActivities.length}
                    isEarlyGrade={true}
                    submitMcq={submitMcq}
                    submitWriting={submitWriting}
                    submitSpeech={submitSpeech}
                  />
                ))}
              </div>

              <div className="g12-mission-actions">
                <div className="g12-mission-actions-left">
                  <button className="g12-mission-btn secondary" onClick={goBackStep}>← Balik</button>
                </div>
                <div className="g12-mission-actions-right">
                  <button className="g12-mission-btn purple" onClick={goNext}>Aralin →</button>
                </div>
              </div>
            </>
          )}

          {currentStep.type === 'read' && (
            <>
              <div className="g12-mission-step-head">
                <div className="g12-mission-big-icon">📖</div>
                <div>
                  <h3>Mga Aralin</h3>
                </div>
              </div>

              <StructuredLessonFlow lesson={lesson} text={kidPassage} />

              <div className="g12-mission-actions">
                <div className="g12-mission-actions-left">
                  <button className="g12-mission-btn secondary" onClick={goBackStep}>← Balik</button>
                  <button className="g12-mission-btn" onClick={() => markStepListened('read', getStructuredLessonLessonsAudioText(kidPassage, lesson))}>🔊 Pakinggan</button>
                    <button className="g12-mission-btn secondary" type="button" onClick={() => stopSpeech()}>⏹️ Ihinto</button>
                </div>
                <div className="g12-mission-actions-right">
                  <button className="g12-mission-btn purple" onClick={goNext}>
                    Gawin ang Pagsusulit →
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
                      ? 'Gawain'
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
                  total={corePracticeActivities.length}
                  isEarlyGrade={true}
                  submitMcq={handleEarlySubmitMcq}
                  submitWriting={handleEarlySubmitWriting}
                  submitSpeech={handleEarlySubmitSpeech}
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
                  <h3>{isReviewMode ? 'Tapos na ang Pagbabalik-aral!' : 'Tapos na ang Misyon!'}</h3>
                  <p>
                    {isReviewMode
                      ? 'Natapos mo na ang araling ito. Maaari kang bumalik sa Bahay o pumili ng ibang aralin.'
                      : `Kunin ang gantimpala mo: +${lesson?.xpReward || 0} XP`}
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
                    <button className="g12-mission-btn purple" onClick={() => go('screen-student')}>🏠 Bumalik sa Bahay</button>
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
      <div className="section-title">Gawain</div>
      <div className="muted">
        This activity type is not supported yet: {activity.type}
      </div>
    </div>
  );
}

function MaterialActivity({ activity, isEarlyGrade, activityBoxStyle }) {
  const material = activity.dataJson || activity;
  const fileName = material.fileName || activity.title || 'Kagamitan sa aralin';
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
          setPdfPreviewError('Hindi maipakita ang preview dito. Buksan ang PDF sa bagong tab.');
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
          {isEarlyGrade ? '📎 Mga Pahina ng Presentasyon' : 'Materyal ng Aralin'}
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
            : 'Buksan muna ang kalakip na mga pahina ng aralin bago sagutin ang mga gawain.'}
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
                src={fileUrl}
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
                {pdfPreviewError || 'Inihahanda ang paunang tingin ng PDF...'}
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
            {isPdf ? 'Buksan ang Buong PDF' : 'Buksan ang mga Pahina ng Presentasyon'}
          </a>
        ) : (
          <span className="muted">Walang kalakip na dokumento sa aralin.</span>
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
          ? 'Tamang Sagot!'
          : 'Tama. Nabilang na ang XP.'
        : isEarlyGrade
          ? 'Balikan ito'
          : 'Hindi pa tama. Balikan ang sagot na ito.';
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
          ? 'Pumili muna ng sagot.'
          : 'Walang napiling sagot.';
        continue;
      }

      const result = await submitMcq(question, option, { silent: false });

      if (result) {
        nextStats[question.id] = Boolean(result.correct);
        nextFeedback[question.id] = result.correct
          ? result.xpAwarded
            ? isEarlyGrade
              ? `Tamang Sagot! +${result.xpAwarded} XP`
              : `Tamang Sagot! +${result.xpAwarded} XP`
            : isEarlyGrade
              ? 'Tamang Sagot!'
              : 'Tama. Nabilang na ang XP.'
          : isEarlyGrade
            ? 'Balikan ito'
            : 'Hindi pa tama. Balikan ang sagot na ito.';
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
          {isEarlyGrade ? '🎮 Maikling Pagsusulit' : 'Pagsusulit'}
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
            ? 'Tapos na! Naitala na ang iyong sagot.'
            : 'Naipasa na ang pagsusulit na ito.'
          : isEarlyGrade
            ? ''
            : ''}
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
            Tanong {qIndex + 1} sa {questions.length}
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
              Tanong {qIndex + 1}: {mcqFeedback[q.id]}
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
            ? (isEarlyGrade ? 'Tinitingnan...' : 'Tinitingnan...')
            : allSelected
              ? (isEarlyGrade ? 'Tingnan ang Iskor' : 'Tingnan ang Iskor')
              : (isEarlyGrade ? `Sagutan ${selectedCount}/${questions.length}` : `Sagutan ${selectedCount}/${questions.length}`)}
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
                Iskor: {correctCount}/{questions.length}
              </b>
              <div className="muted" style={{ fontSize: isEarlyGrade ? 17 : 13 }}>
                {isEarlyGrade ? 'Magaling na pagsubok! Magpatuloy sa pag-aaral.' : `${band.icon} ${band.label} • ${scorePercent}%`}
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
  const [earlyWrongPopup, setEarlyWrongPopup] = useState('');

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

  const writingRubric =
    activity.writingTask?.rubricJson ||
    activity.rubricJson ||
    activity.rubric ||
    {};

  const prompt = activity.writingTask?.prompt || activity.prompt || 'Isulat ang iyong sagot.';
  const rawTemplate =
    writingRubric.template ||
    writingRubric.sentence ||
    activity.writingTask?.template ||
    activity.template ||
    activity.fillBlank ||
    activity.sentence ||
    (isEarlyGrade && /_{2,}|\\[blank\\]/i.test(prompt) ? prompt : '') ||
    (isEarlyGrade ? earlyFallback.template : '');

  const defaultEarlyWordBank = earlyFallback.words;

  const activityWordBank = asArray(
    writingRubric.wordBank ||
    writingRubric.words ||
    writingRubric.choices ||
    writingRubric.options ||
    writingRubric.correctWords ||
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
    setEarlyWrongPopup('');
    setSelectedWords(prev => prev.slice(0, -1));
  }

  function clearAnswer() {
    if (earlyLocked) return;

    setEarlyStatus('');
    setEarlyWrongPopup('');
    setSelectedWords([]);
    setWritingText('');
  }

  function normalizeEarlyFillAnswer(value = '') {
    return String(value ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9ñ\s]/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function getExpectedEarlyFillWords() {
    const sources = [
      writingRubric.correctWords,
      writingRubric.correctWord,
      writingRubric.answerWords,
      writingRubric.answers,
      writingRubric.answer,
      activity.correctWords,
      activity.correctWord,
      activity.answerWords,
      activity.answers,
      activity.answer,
      activity.writingTask?.correctWords,
      activity.writingTask?.correctWord,
      activity.writingTask?.answerWords,
      activity.writingTask?.answers,
      activity.writingTask?.answer,
    ];

    for (const source of sources) {
      if (Array.isArray(source) && source.filter(Boolean).length) {
        return source.filter(Boolean).map(item => String(item));
      }

      if (typeof source === 'string' && source.trim()) {
        return source
          .split(/[|,]/)
          .map(item => item.trim())
          .filter(Boolean);
      }
    }

    const normalizedTemplate = normalizeEarlyFillAnswer(sentenceTemplate || prompt || '');

    if (
      normalizedTemplate.includes('nagbabasa') &&
      earlyWordBank.some(word => normalizeEarlyFillAnswer(word) === 'aklat')
    ) {
      return ['aklat'];
    }

    return [];
  }

  function validateEarlyFillAnswer() {
    const expectedWords = getExpectedEarlyFillWords();

    if (!expectedWords.length) {
      return true;
    }

    const selected = selectedWords
      .slice(0, Math.max(blankCount, expectedWords.length))
      .map(normalizeEarlyFillAnswer)
      .filter(Boolean);

    const expected = expectedWords
      .slice(0, Math.max(blankCount, expectedWords.length))
      .map(normalizeEarlyFillAnswer)
      .filter(Boolean);

    if (selected.length !== expected.length) {
      return false;
    }

    return expected.every((word, index) => selected[index] === word);
  }

  function showEarlyWrongAnswerToast() {
    const message = 'Hindi pa tama. Balikan ang sagot.';

    setEarlyStatus('');

    if (typeof notify === 'function') {
      notify(message, 'bad');
      return;
    }

    if (typeof showLessonGateToast === 'function') {
      showLessonGateToast(message);
      return;
    }

    setEarlyWrongPopup(message);
    window.clearTimeout(showEarlyWrongAnswerToast.timer);
    showEarlyWrongAnswerToast.timer = window.setTimeout(() => {
      setEarlyWrongPopup('');
    }, 1800);
  }

  async function submitEarlyWriting() {
    if (!validateEarlyFillAnswer()) {
      showEarlyWrongAnswerToast();
      return;
    }

    setEarlyStatus('Tinitingnan ang sagot...');

    const data = await submitWriting(activity.writingTask?.id, filledSentence, { autoChecked: true });

    if (!data) {
      showEarlyWrongAnswerToast();
      return;
    }

    if (!data.correct && !data.alreadySubmitted && !data.locked) {
      showEarlyWrongAnswerToast();
      return;
    }

    const message = data.message ||
      (data.correct
        ? `Tama! +${data.xpAwarded || 10} XP 🌟`
        : 'Nasagutan mo na ito 🌟');

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
            ✍️ Gawain sa Pagsulat
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
            padding: 18,
            borderRadius: 16,
            background: '#FFF8CF',
            lineHeight: 1.6,
            marginBottom: 12,
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          <b style={{ fontWeight: 900 }}>Panuto:</b> {prompt}
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

          {earlyWrongPopup && (

            <div

              role="alert"

              aria-live="assertive"

              style={{

                position: 'fixed',

                left: '50%',

                top: '44%',

                transform: 'translate(-50%, -50%)',

                zIndex: 9999,

                padding: '22px 34px',

                borderRadius: 22,

                background: '#FFF5F5',

                border: '3px solid #F28B8B',

                boxShadow: '0 18px 44px rgba(20, 30, 54, 0.22)',

                color: '#111827',

                fontWeight: 900,

                fontSize: 28,

                textAlign: 'center',

                maxWidth: 'min(720px, 86vw)',

              }}

            >

              {earlyWrongPopup}

            </div>

          )}


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
              padding: 16,
              borderRadius: 16,
              background: '#F8FAFF',
              border: '1px solid #E1E7FF',
              marginBottom: 14,
              fontWeight: 900,
              lineHeight: 1.55,
              fontSize: 18,
              color: '#1E3A5F',
            }}
          >
            <strong>Gabay:</strong> Sumagot nang malinaw gamit ang buong pangungusap.
          </div>

          <textarea
            className="input-field"
            rows="5"
            value={writingText}
            onChange={(e) => setWritingText(e.target.value)}
            placeholder="Isulat ang iyong sagot dito..."
            style={{
              minHeight: 160,
              resize: 'vertical',
              fontSize: 18,
              lineHeight: 1.7,
              padding: '14px 16px',
            }}
          />

          <div className="divider" />

          <button
            type="button"
            className="btn btn-green"
            onClick={() => submitWriting(activity.writingTask?.id, writingText)}
            disabled={!writingText.trim()}
          >
            ✅ Ipasa ang Sulatin
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
  const [isCheckingSpeech, setIsCheckingSpeech] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const activityAlreadySubmitted = Boolean(
    activity?.speechAttempt ||
    activity?.attempt ||
    activity?.latestAttempt ||
    activity?.completed ||
    activity?.speechTask?.speechAttempt ||
    activity?.speechTask?.attempt ||
    activity?.speechTask?.latestAttempt ||
    activity?.speechTask?.completed
  );
  const [speechSubmitted, setSpeechSubmitted] = useState(activityAlreadySubmitted);
  const [isSubmittingSpeech, setIsSubmittingSpeech] = useState(false);

  useEffect(() => {
    setSpeechSubmitted(activityAlreadySubmitted);
    setIsSubmittingSpeech(false);
    setIsCheckingSpeech(false);
  }, [activity?.id, activity?.speechTask?.id, activityAlreadySubmitted]);

  const target = activity.speechTask?.targetText || activity.targetText || 'Basahin nang malinaw ang pangungusap.';

  const speechResult =
    speechScore !== null
      ? speechCategoryFromScore(speechScore)
      : null;

  function speakTarget() {
    speakText(target);
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
    setIsCheckingSpeech(false);
    setIsListening(true);

    recognition.onresult = async (event) => {
      const transcript =
        event.results?.[0]?.[0]?.transcript || '';

      const score = speechSimilarityScore(
        target,
        transcript
      );

      setIsListening(false);
      setIsCheckingSpeech(true);

      const validation = await submitSpeech(
        activity.speechTask?.id,
        transcript,
        score,
        {
          validateOnly: true
        }
      );

      if (!validation?.safe) {
        setSpeechTranscript('');
        setSpeechScore(null);
        setIsCheckingSpeech(false);
        return;
      }

      setSpeechTranscript(transcript);
      setSpeechScore(score);
      setIsCheckingSpeech(false);
    };

    recognition.onerror = (event) => {
      setSpeechError(`Error sa pagkilala ng pagbigkas: ${event.error}`);
      setIsListening(false);
      setIsCheckingSpeech(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }

  async function handleSubmitSpeechAttempt() {
    if (
      !speechTranscript ||
      speechSubmitted ||
      isSubmittingSpeech ||
      isCheckingSpeech
    ) return;

    setIsSubmittingSpeech(true);

    try {
      const result = await submitSpeech(activity.speechTask?.id, speechTranscript, speechScore || 0);

      if (result) {
        const finalScore = Number(
          result?.score ??
          result?.attempt?.score
        );

        if (Number.isFinite(finalScore)) {
          setSpeechScore(
            Math.max(
              0,
              Math.min(100, finalScore)
            )
          );
        }

        setSpeechSubmitted(true);
      }
    } finally {
      setIsSubmittingSpeech(false);
    }
  }

  return (
    <div className="card" style={activityBoxStyle}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="section-title">
          🎤 {isEarlyGrade ? 'Bigkasin Mo' : 'Oral Handa na'}
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
          padding: isEarlyGrade ? 20 : 16,
          borderRadius: 18,
          background: '#FFE2EA',
          marginTop: 12,
          fontSize: isEarlyGrade ? 26 : 20,
          lineHeight: 1.7,
          fontWeight: 800,
        }}
      >
        <span style={{ fontWeight: 900, fontSize: isEarlyGrade ? 18 : 15, color: '#9F1239', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {isEarlyGrade ? 'Bibigkasin:' : 'Bibigkasin:'}
        </span>
        <span style={{ color: '#1E1B4B', fontSize: isEarlyGrade ? 28 : 22 }}>{target}</span>
      </div>

      <div className="divider" />

      <div className="row" style={{ gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
        <button className="btn btn-purple" onClick={speakTarget} style={{ minHeight: isEarlyGrade ? 56 : 48, fontSize: isEarlyGrade ? 18 : 16, padding: '12px 24px', borderRadius: 999 }}>
          {isEarlyGrade ? '🔊 Pakinggan' : '🔊 Pakinggan'}
        </button>

        <button
          className="btn btn-blue"
          onClick={startSpeechRecognition}
          disabled={isListening || isCheckingSpeech}
          style={{
            minHeight: isEarlyGrade ? 56 : 48,
            fontSize: isEarlyGrade ? 18 : 16,
            padding: '12px 24px',
            borderRadius: 999
          }}
        >
          {isCheckingSpeech
            ? '🔎 Sinusuri ang pagbigkas...'
            : isListening
              ? '🎙️ Nakikinig...'
              : isEarlyGrade
                ? '🎙️ Magsalita'
                : '🎙️ Simulan ang Pagbigkas'}
        </button>

        <button className="btn btn-outline" onClick={() => stopSpeech()} style={{ minHeight: isEarlyGrade ? 56 : 48, fontSize: isEarlyGrade ? 18 : 16, padding: '12px 24px', borderRadius: 999 }}>
          {isEarlyGrade ? '⏹ Ihinto' : '⏹ Ihinto ang Tunog'}
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
          <b>{isEarlyGrade ? 'Narinig ng system:' : 'Nakilalang pagbigkas:'}</b>
          <div style={{ marginTop: 6 }}>{speechTranscript}</div>
        </div>
      )}

      {speechResult && (
        <div
          style={{
            marginTop: 12,
            padding: 14,
            borderRadius: 16,
            background: speechResult.background,
            border: `1px solid ${speechResult.border}`,
            color: speechResult.color,
            fontWeight: 800,
            fontSize: isEarlyGrade ? 18 : 15
          }}
        >
          <div
            style={{
              fontSize: isEarlyGrade ? 22 : 17,
              fontWeight: 950
            }}
          >
            {speechResult.icon} {speechResult.label}
          </div>

          <div
            style={{
              marginTop: 4,
              lineHeight: 1.45
            }}
          >
            {speechResult.message}
          </div>
        </div>
      )}

      <div className="divider" />

      <button
        className="btn btn-purple"
        onClick={handleSubmitSpeechAttempt}
        disabled={
          !speechTranscript ||
          isSubmittingSpeech ||
          isCheckingSpeech ||
          speechSubmitted
        }
      >
        {speechSubmitted
          ? (isEarlyGrade ? '✅ Naipasa na' : '✅ Naipasa')
          : isSubmittingSpeech
            ? (isEarlyGrade ? '⏳ Ipinapasa...' : '⏳ Ipinapasa...')
            : '🎤 Ipasa ang Pagbigkas'}
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
      setFeedback(isEarlyGrade ? 'Pumili muna sa kaliwa.' : 'Pumili muna ng item sa kaliwa.');
      return;
    }

    const correctPair = pairs.find(pair => pair.left === selectedLeft);

    if (correctPair?.right === rightValue) {
      setMatched(prev => [...prev, selectedLeft]);
      setFeedback(isEarlyGrade ? '✅ Tama! Magaling!' : '✅ Tamang pares.');
    } else {
      setFeedback(isEarlyGrade ? '❌ Subukan muli!' : '❌ Hindi ito ang tamang pares. Subukan muli.');
    }

    setSelectedLeft(null);
  }

  const completed = pairs.length > 0 && matched.length === pairs.length;

  return (
    <div className="card" style={activityBoxStyle}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="section-title">
          🧩 {activity.title || (isEarlyGrade ? 'Pagtapatin' : 'Laro sa Pagtutugma')}
        </div>

        <div className="pill">
          {index + 1}/{total}
        </div>
      </div>

      <div className="muted">
        {activity.instructions || (isEarlyGrade
          ? 'Pagtapatin ang tamang pares.'
          : 'Itugma ang bawat item sa kaliwa sa tamang item sa kanan.')}
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
            background: feedback.includes('Tama') || feedback.includes('Tama') ? '#E9FBEF' : '#FFF4E5',
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
          🎉 {isEarlyGrade ? 'Natapos mo ang laro sa pagtutugma!' : 'Tapos na ang gawaing pagtutugma.'}
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
          📚 {activity.title || (isEarlyGrade ? 'Mga Bagong Salita' : 'Mga Kard ng Bokabularyo')}
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
          🖼️ {activity.title || (isEarlyGrade ? 'Tingnan at Matuto' : 'Kard ng Impormasyon')}
        </div>

        <div className="pill">
          {index + 1}/{total}
        </div>
      </div>

      <div className="muted">
        {activity.instructions || (isEarlyGrade
          ? 'Basahin ang maikling gabay sa ibaba.'
          : 'Balikan ang impormasyon sa ibaba bago sagutin ang mga gawain.')}
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
        {content || 'Wala pang idinagdag na infographic.'}
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
      prompt: 'ba + ___ = 🧒',
      sample: 'Tingnan ang clue at piliin ang pantig na bubuo sa salita.',
      options: ['ta', 'sa', 'la'],
      correct: 'ta',
      success: 'Tama! ba + ta = bata.'
    },
    'picture-guess': {
      instruction: 'Tingnan ang picture clue at piliin ang tamang salitang Filipino.',
      prompt: 'Palatandaan sa larawan: 🐱',
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
      instruction: 'Handa na card muna habang wala pang backend speech scoring.',
      prompt: 'Bigkasin: “Magandang umaga po.”',
      sample: 'Basahin nang malinaw at malakas.',
      options: ['Nasabi ko na!', 'Ulitin ko muna'],
      correct: 'Nasabi ko na!',
      success: 'Mahusay! Handa na complete. Backend speech scoring can be added later.'
    },
    'badge-challenge': {
      instruction: 'Tapusin ang munting hamon para makita kung paano mabubuksan ang gantimpala.',
      prompt: 'Ilang vocabulary games ang kailangan para sa “Bokabularyo Star”?',
      sample: 'Tapusin ang 3 laro sa bokabularyo → buksan ang gantimpala.',
      options: ['3 games', '1 game', '10 games'],
      correct: '3 games',
      success: 'Tama! 3 vocabulary games para sa Bokabularyo Star.'
    }
  };

  return demos[gameId] || demos['word-match'];
}

function getWordMatchItemsForGrade(gradeLevel = 4) {
  const earlyItems = [
    { id: 'bahay', word: 'bahay', picture: '🏠', label: 'Tahanan' },
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

function getSoundAndSayItemsForGrade(gradeLevel = 4) {
  const earlyItems = [
    {
      id: 'g1-bahay',
      target: 'bahay',
      hint: 'Pakinggan at ulitin.',
      level: 'Salita'
    },
    {
      id: 'g1-pusa',
      target: 'pusa',
      hint: 'Bigkasin nang malinaw.',
      level: 'Salita'
    },
    {
      id: 'g1-magandang-umaga',
      target: 'magandang umaga',
      hint: 'Sabihin nang magalang.',
      level: 'Dalawang Salita'
    },
    {
      id: 'g2-salamat-po',
      target: 'salamat po',
      hint: 'Ulitin nang malinaw.',
      level: 'Magalang na Salita'
    },
    {
      id: 'g2-maliit-na-aso',
      target: 'maliit na aso',
      hint: 'Pakinggan muna.',
      level: 'Maikling Parirala'
    }
  ];

  const upperItems = [
    {
      id: 'g3-paaralan',
      target: 'paaralan',
      hint: 'Bigkasin ang buong salita.',
      level: 'Bokabularyo'
    },
    {
      id: 'g3-masayang-mag-aaral',
      target: 'masayang mag-aaral',
      hint: 'Ulitin ang parirala.',
      level: 'Parirala'
    },
    {
      id: 'g4-nagbabasa-sa-aklatan',
      target: 'nagbabasa sa aklatan',
      hint: 'Bigkasin nang tuloy-tuloy.',
      level: 'Oral Handa na'
    },
    {
      id: 'g5-kalikasan-pangalagaan',
      target: 'ang kalikasan ay pangalagaan',
      hint: 'Linawin ang bawat salita.',
      level: 'Pangungusap'
    },
    {
      id: 'g6-bayanihan',
      target: 'bayanihan ang diwa ng pagtutulungan',
      hint: 'Bigkasin nang may diin.',
      level: 'Komunikasyong Pagsasalita'
    },
    {
      id: 'g6-responsableng-mamamayan',
      target: 'responsableng mamamayan',
      hint: 'Dahan-dahan at malinaw.',
      level: 'Mahirap na Salita'
    }
  ];

  return Number(gradeLevel || 4) <= 2 ? earlyItems : upperItems;
}

function getSoundAndSayAttemptItems(gradeLevel = 4) {
  return shuffleWordMatchItems(getSoundAndSayItemsForGrade(gradeLevel));
}

function getStoryQuestItemsForGrade(gradeLevel = 4) {
  const earlyItems = [
    {
      id: 'g1-ana-payong',
      title: 'Ang Pulang Payong',
      story: [
        'Si Ana ay may pulang payong.',
        'Ginamit niya ito nang umulan.'
      ],
      questions: [
        {
          question: 'Ano ang ginamit ni Ana?',
          options: [
            { icon: '☂️', label: 'payong' },
            { icon: '📘', label: 'aklat' },
            { icon: '✏️', label: 'lapis' }
          ],
          correct: 'payong'
        },
        {
          question: 'Kailan ginamit ni Ana ang payong?',
          options: [
            { icon: '🌧️', label: 'umulan' },
            { icon: '🌙', label: 'natulog' },
            { icon: '🍽️', label: 'kumain' }
          ],
          correct: 'umulan'
        }
      ]
    },
    {
      id: 'g1-milo-pusa',
      title: 'Ang Pusa ni Milo',
      story: [
        'May pusa si Milo.',
        'Mahilig itong matulog sa banig.'
      ],
      questions: [
        {
          question: 'Ano ang alaga ni Milo?',
          options: [
            { icon: '🐱', label: 'pusa' },
            { icon: '🐶', label: 'aso' },
            { icon: '🐟', label: 'isda' }
          ],
          correct: 'pusa'
        },
        {
          question: 'Saan natutulog ang pusa?',
          options: [
            { icon: '🧺', label: 'banig' },
            { icon: '📦', label: 'kahon' },
            { icon: '🌳', label: 'puno' }
          ],
          correct: 'banig'
        }
      ]
    },
    {
      id: 'g2-lapis-ni-lena',
      title: 'Ang Lapis ni Lena',
      story: [
        'May bagong lapis si Lena.',
        'Ginamit niya ito sa pagguhit ng bahay.'
      ],
      questions: [
        {
          question: 'Ano ang gamit ni Lena sa pagguhit?',
          options: [
            { icon: '✏️', label: 'lapis' },
            { icon: '📚', label: 'aklat' },
            { icon: '☂️', label: 'payong' }
          ],
          correct: 'lapis'
        },
        {
          question: 'Ano ang iginuhit ni Lena?',
          options: [
            { icon: '🏠', label: 'bahay' },
            { icon: '🐱', label: 'pusa' },
            { icon: '🌞', label: 'araw' }
          ],
          correct: 'bahay'
        }
      ]
    }
  ];

  const upperItems = [
    {
      id: 'g3-malinis-na-bakuran',
      title: 'Malinis na Bakuran',
      story: [
        'Maagang dumating sa paaralan sina Lito, Bea, at Omar. Napansin nilang maraming kalat sa bakuran.',
        'Pinulot nila ang mga kalat at itinapon sa tamang basurahan.',
        'Natuwa ang guro sa kanilang pagtutulungan. Natutuhan nila na mahalaga ang malinis na paligid.'
      ],
      questions: [
        {
          question: 'Ano ang ginawa ng mga bata?',
          options: [
            { icon: '🧹', label: 'naglinis' },
            { icon: '🎮', label: 'naglalaro' },
            { icon: '😴', label: 'natulog' }
          ],
          correct: 'naglinis'
        },
        {
          question: 'Saan nila itinapon ang kalat?',
          options: [
            { icon: '🗑️', label: 'basurahan' },
            { icon: '🏫', label: 'paaralan' },
            { icon: '🌳', label: 'puno' }
          ],
          correct: 'basurahan'
        },
        {
          question: 'Ano ang aral ng kuwento?',
          options: [
            { icon: '🌿', label: 'alagaan ang kalikasan' },
            { icon: '🍬', label: 'kumain ng kendi' },
            { icon: '📺', label: 'manood buong araw' }
          ],
          correct: 'alagaan ang kalikasan'
        }
      ]
    },
    {
      id: 'g4-aklatan-ni-mara',
      title: 'Sa Aklatan',
      story: [
        'Pumunta si Mara sa aklatan upang magbasa ng bagong kuwento.',
        'Pinili niya ang aklat tungkol sa mga alamat at isinulat ang mahahalagang detalye.',
        'Umuwi siyang masaya dahil may bagong aral siyang natutuhan.'
      ],
      questions: [
        {
          question: 'Saan pumunta si Mara?',
          options: [
            { icon: '📚', label: 'aklatan' },
            { icon: '🏀', label: 'palakasan' },
            { icon: '🏪', label: 'tindahan' }
          ],
          correct: 'aklatan'
        },
        {
          question: 'Tungkol saan ang aklat na pinili niya?',
          options: [
            { icon: '📜', label: 'alamat' },
            { icon: '🌧️', label: 'ulan' },
            { icon: '🐶', label: 'aso' }
          ],
          correct: 'alamat'
        },
        {
          question: 'Ano ang naramdaman ni Mara?',
          options: [
            { icon: '😊', label: 'masaya' },
            { icon: '😡', label: 'galit' },
            { icon: '😴', label: 'inaantok' }
          ],
          correct: 'masaya'
        }
      ]
    },
    {
      id: 'g5-puno-sa-paaralan',
      title: 'Ang Puno sa Paaralan',
      story: [
        'Nagtanim ng puno ang mga mag-aaral sa gilid ng palaruan.',
        'Araw-araw nila itong diniligan upang lumago.',
        'Pagkalipas ng ilang buwan, naging malilim ang paligid at natuwa ang lahat.'
      ],
      questions: [
        {
          question: 'Ano ang itinanim ng mga mag-aaral?',
          options: [
            { icon: '🌳', label: 'puno' },
            { icon: '📘', label: 'aklat' },
            { icon: '🧸', label: 'laruan' }
          ],
          correct: 'puno'
        },
        {
          question: 'Bakit nila diniligan ang puno?',
          options: [
            { icon: '🌱', label: 'upang lumago' },
            { icon: '🔥', label: 'upang matuyo' },
            { icon: '🧊', label: 'upang lumamig' }
          ],
          correct: 'upang lumago'
        },
        {
          question: 'Ano ang naging epekto ng puno?',
          options: [
            { icon: '🌤️', label: 'naging malilim' },
            { icon: '🌪️', label: 'naging maalikabok' },
            { icon: '🔇', label: 'naging tahimik' }
          ],
          correct: 'naging malilim'
        }
      ]
    },
    {
      id: 'g6-bayanihan-sa-barangay',
      title: 'Bayanihan sa Barangay',
      story: [
        'Matapos ang malakas na ulan, nagtulungan ang mga tao sa barangay.',
        'Nagbahagi sila ng pagkain at tumulong sa pag-aayos ng paligid.',
        'Ipinakita nila ang tunay na diwa ng bayanihan.'
      ],
      questions: [
        {
          question: 'Ano ang ginawa ng mga tao sa barangay?',
          options: [
            { icon: '🤝', label: 'nagtulungan' },
            { icon: '🏃', label: 'tumakbo' },
            { icon: '🎤', label: 'kumanta' }
          ],
          correct: 'nagtulungan'
        },
        {
          question: 'Ano ang ibinahagi nila?',
          options: [
            { icon: '🍚', label: 'pagkain' },
            { icon: '🎈', label: 'laruan' },
            { icon: '📺', label: 'telebisyon' }
          ],
          correct: 'pagkain'
        },
        {
          question: 'Anong diwa ang ipinakita sa kuwento?',
          options: [
            { icon: '💚', label: 'bayanihan' },
            { icon: '💤', label: 'katamaran' },
            { icon: '📣', label: 'ingay' }
          ],
          correct: 'bayanihan'
        }
      ]
    }
  ];

  return Number(gradeLevel || 4) <= 2 ? earlyItems : upperItems;
}

function getStoryQuestAttemptItems(gradeLevel = 4) {
  return shuffleWordMatchItems(getStoryQuestItemsForGrade(gradeLevel));
}

function storyQuestChoiceLabel(choice) {
  if (typeof choice === 'string') return choice;
  return String(choice?.label || '').trim();
}

function storyQuestChoiceIcon(choice) {
  if (typeof choice === 'string') return '';
  return String(choice?.icon || '').trim();
}

function getSentenceBuilderItemsForGrade(gradeLevel = 4) {
  const earlyItems = [
    {
      id: 'g1-ako-ay-bata',
      clue: 'Buuin ang simpleng pangungusap.',
      words: ['bata', 'Ako', 'ay'],
      answer: ['Ako', 'ay', 'bata'],
      success: 'Tama! Ako ay bata.'
    },
    {
      id: 'g1-ang-pusa-ay-maliit',
      clue: 'Ayusin ang salita tungkol sa pusa.',
      words: ['maliit', 'Ang', 'pusa', 'ay'],
      answer: ['Ang', 'pusa', 'ay', 'maliit'],
      success: 'Tama! Ang pusa ay maliit.'
    },
    {
      id: 'g2-si-ana-ay-masaya',
      clue: 'Buuin ang pangungusap tungkol kay Ana.',
      words: ['masaya', 'Si', 'ay', 'Ana'],
      answer: ['Si', 'Ana', 'ay', 'masaya'],
      success: 'Tama! Si Ana ay masaya.'
    },
    {
      id: 'g2-ako-ay-nagbabasa',
      clue: 'Ayusin ang salita tungkol sa ginagawa mo.',
      words: ['nagbabasa', 'Ako', 'ay'],
      answer: ['Ako', 'ay', 'nagbabasa'],
      success: 'Tama! Ako ay nagbabasa.'
    }
  ];

  const upperItems = [
    {
      id: 'g3-mga-bata-ay-nagbabasa',
      clue: 'Buuin ang malinaw na pangungusap.',
      words: ['nagbabasa', 'Ang', 'bata', 'mga', 'ay'],
      answer: ['Ang', 'mga', 'bata', 'ay', 'nagbabasa'],
      success: 'Tama! Ang mga bata ay nagbabasa.'
    },
    {
      id: 'g4-kami-ay-nag-aaral-sa-paaralan',
      clue: 'Ayusin ang pangungusap tungkol sa paaralan.',
      words: ['paaralan', 'Kami', 'nag-aaral', 'sa', 'ay'],
      answer: ['Kami', 'ay', 'nag-aaral', 'sa', 'paaralan'],
      success: 'Tama! Kami ay nag-aaral sa paaralan.'
    },
    {
      id: 'g5-kalikasan-ay-dapat-pangalagaan',
      clue: 'Buuin ang pangungusap tungkol sa kalikasan.',
      words: ['pangalagaan', 'Ang', 'dapat', 'kalikasan', 'ay'],
      answer: ['Ang', 'kalikasan', 'ay', 'dapat', 'pangalagaan'],
      success: 'Tama! Ang kalikasan ay dapat pangalagaan.'
    },
    {
      id: 'g6-mag-aaral-ay-mahusay-sumulat',
      clue: 'Ayusin ang mas mahabang pangungusap.',
      words: ['mahusay', 'mag-aaral', 'sumulat', 'Ang', 'ay'],
      answer: ['Ang', 'mag-aaral', 'ay', 'mahusay', 'sumulat'],
      success: 'Tama! Ang mag-aaral ay mahusay sumulat.'
    }
  ];

  return Number(gradeLevel || 4) <= 2 ? earlyItems : upperItems;
}

function getSentenceBuilderAttemptItems(gradeLevel = 4) {
  return shuffleWordMatchItems(getSentenceBuilderItemsForGrade(gradeLevel));
}

function normalizeSentenceBuilderWords(words = []) {
  return asArray(words)
    .map(word => String(word || '').trim().toLowerCase())
    .filter(Boolean)
    .join(' ');
}

function getPictureGuessItemsForGrade(gradeLevel = 4) {
  const earlyItems = [
    {
      id: 'g1-pusa',
      picture: '🐱',
      prompt: 'Palatandaan sa larawan: 🐱',
      sample: 'Tingnan ang larawan at piliin ang tamang salita.',
      options: ['pusa', 'aso', 'ibon'],
      correct: 'pusa',
      success: 'Tama! Ang larawan ay pusa.'
    },
    {
      id: 'g1-aso',
      picture: '🐶',
      prompt: 'Palatandaan sa larawan: 🐶',
      sample: 'Tingnan ang larawan at piliin ang tamang salita.',
      options: ['aso', 'pusa', 'isda'],
      correct: 'aso',
      success: 'Tama! Ang larawan ay aso.'
    },
    {
      id: 'g1-lapis',
      picture: '✏️',
      prompt: 'Palatandaan sa larawan: ✏️',
      sample: 'Ginagamit ito sa pagsulat o pagguhit.',
      options: ['lapis', 'aklat', 'payong'],
      correct: 'lapis',
      success: 'Tama! Ang larawan ay lapis.'
    },
    {
      id: 'g2-payong',
      picture: '☂️',
      prompt: 'Palatandaan sa larawan: ☂️',
      sample: 'Ginagamit ito kapag umuulan o mainit.',
      options: ['payong', 'puno', 'araw'],
      correct: 'payong',
      success: 'Tama! Ang larawan ay payong.'
    }
  ];

  const upperItems = [
    {
      id: 'g3-paaralan',
      picture: '🏫',
      prompt: 'Palatandaan sa larawan: 🏫',
      sample: 'Lugar kung saan natututo ang mga mag-aaral.',
      options: ['paaralan', 'pamayanan', 'aklatan'],
      correct: 'paaralan',
      success: 'Tama! Ang larawan ay paaralan.'
    },
    {
      id: 'g4-pamayanan',
      picture: '🏘️',
      prompt: 'Palatandaan sa larawan: 🏘️',
      sample: 'Lugar kung saan magkakasamang naninirahan ang mga tao.',
      options: ['pamayanan', 'kalikasan', 'paaralan'],
      correct: 'pamayanan',
      success: 'Tama! Ang larawan ay pamayanan.'
    },
    {
      id: 'g5-kalikasan',
      picture: '🌳',
      prompt: 'Palatandaan sa larawan: 🌳',
      sample: 'Ito ay tumutukoy sa halaman, hayop, lupa, hangin, at tubig.',
      options: ['kalikasan', 'panitikan', 'kaalaman'],
      correct: 'kalikasan',
      success: 'Tama! Ang larawan ay kalikasan.'
    },
    {
      id: 'g6-panitikan',
      picture: '📜',
      prompt: 'Palatandaan sa larawan: 📜',
      sample: 'Mga akdang binabasa tulad ng tula, kuwento, at alamat.',
      options: ['panitikan', 'talasalitaan', 'pamayanan'],
      correct: 'panitikan',
      success: 'Tama! Ang larawan ay panitikan.'
    }
  ];

  return Number(gradeLevel || 4) <= 2 ? earlyItems : upperItems;
}

function getPictureGuessAttemptItems(gradeLevel = 4) {
  return shuffleWordMatchItems(getPictureGuessItemsForGrade(gradeLevel));
}

function getLetterPopItemsForGrade(gradeLevel = 4) {
  const earlyItems = [
    {
      id: 'g1-bata',
      prompt: 'ba + ___ = 🧒',
      sample: 'Clue: Isang batang tao.',
      options: ['ta', 'sa', 'la'],
      correct: 'ta',
      success: 'Tama! ba + ta = bata.'
    },
    {
      id: 'g1-pusa',
      prompt: 'pu + ___ = 🐱',
      sample: 'Clue: Hayop na mahilig umakyat at umingiyaw.',
      options: ['sa', 'la', 'pa'],
      correct: 'sa',
      success: 'Tama! pu + sa = pusa.'
    },
    {
      id: 'g1-isda',
      prompt: 'is + ___ = 🐟',
      sample: 'Clue: Hayop na lumalangoy sa tubig.',
      options: ['da', 'ba', 'ma'],
      correct: 'da',
      success: 'Tama! is + da = isda.'
    },
    {
      id: 'g2-puno',
      prompt: 'pu + ___ = 🌳',
      sample: 'Clue: Halamang may katawan, sanga, at dahon.',
      options: ['no', 'la', 'sa'],
      correct: 'no',
      success: 'Tama! pu + no = puno.'
    },
    {
      id: 'g2-araw',
      prompt: 'a + ___ = ☀️',
      sample: 'Clue: Nagbibigay ng liwanag sa umaga.',
      options: ['raw', 'so', 'la'],
      correct: 'raw',
      success: 'Tama! a + raw = araw.'
    },
    {
      id: 'g2-lapis',
      prompt: 'la + ___ = ✏️',
      sample: 'Clue: Gamit sa pagsulat o pagguhit.',
      options: ['pis', 'tas', 'pan'],
      correct: 'pis',
      success: 'Tama! la + pis = lapis.'
    }
  ];

  const upperItems = [
    {
      id: 'g3-paaralan',
      prompt: 'pa + ___ + lan = 🏫',
      sample: 'Clue: Lugar kung saan natututo ang mga mag-aaral.',
      options: ['ara', 'ala', 'usa'],
      correct: 'ara',
      success: 'Tama! pa + ara + lan = paaralan.'
    },
    {
      id: 'g3-kaalaman',
      prompt: 'ka + ___ + man = 💡',
      sample: 'Clue: Impormasyong natutuhan mula sa aralin o karanasan.',
      options: ['ala', 'aba', 'isa'],
      correct: 'ala',
      success: 'Tama! ka + ala + man = kaalaman.'
    },
    {
      id: 'g4-kalikasan',
      prompt: 'ka + li + ___ + san = 🌳',
      sample: 'Clue: Mundo ng halaman, hayop, hangin, lupa, at tubig.',
      options: ['ka', 'pa', 'la'],
      correct: 'ka',
      success: 'Tama! ka + li + ka + san = kalikasan.'
    },
    {
      id: 'g4-pamayanan',
      prompt: 'pa + ma + ya + ___ = 🏘️',
      sample: 'Clue: Lugar kung saan magkakasamang naninirahan ang mga tao.',
      options: ['nan', 'lan', 'ran'],
      correct: 'nan',
      success: 'Tama! pa + ma + ya + nan = pamayanan.'
    },
    {
      id: 'g5-panitikan',
      prompt: 'pa + ni + ti + ___ = 📜',
      sample: 'Clue: Mga akdang binabasa tulad ng tula, kuwento, at alamat.',
      options: ['kan', 'tan', 'san'],
      correct: 'kan',
      success: 'Tama! pa + ni + ti + kan = panitikan.'
    },
    {
      id: 'g6-talasalitaan',
      prompt: 'ta + la + sa + li + ___ = 🔤',
      sample: 'Clue: Kalipunan ng mga salitang ginagamit at pinag-aaralan.',
      options: ['taan', 'tuan', 'tikan'],
      correct: 'taan',
      success: 'Tama! ta + la + sa + li + taan = talasalitaan.'
    }
  ];

  return Number(gradeLevel || 4) <= 2 ? earlyItems : upperItems;
}

function getLetterPopAttemptItems(gradeLevel = 4) {
  const pool = getLetterPopItemsForGrade(gradeLevel);
  return shuffleWordMatchItems(pool);
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
        gap: 14px;
        margin-top: 10px;
      }

      .word-match-top-panel {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 14px;
        padding: 14px;
        border-radius: 24px;
        background: rgba(255, 255, 255, .58);
        border: 1px solid rgba(221, 235, 255, .9);
      }

      .word-match-guide {
        padding: 14px 16px;
        border-radius: 18px;
        background: #F8FBFF;
        border: 1px solid #DDEBFF;
        color: #38526B;
        font-weight: 900;
        line-height: 1.45;
      }

      .word-match-progress-card {
        display: grid;
        grid-template-columns: auto auto minmax(120px, 1fr);
        align-items: center;
        gap: 12px;
        width: fit-content;
        max-width: 100%;
        padding: 12px 16px;
        border-radius: 999px;
        background: #FFFFFF;
        border: 2px solid #DDEBFF;
        box-shadow: 0 10px 22px rgba(60, 103, 135, .08);
        color: #38526B;
        font-weight: 1000;
      }

      .word-match-progress-card strong {
        color: #0B934C;
      }

      .word-match-progress-track {
        width: min(220px, 32vw);
        height: 12px;
        border-radius: 999px;
        overflow: hidden;
        background: #E8F1FF;
      }

      .word-match-progress-track i {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #22C55E, #F8DE7E);
        transition: width .24s ease;
      }

      .word-match-board {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
        gap: 18px;
        align-items: start;
      }

      .word-match-column {
        display: grid;
        gap: 12px;
        align-content: start;
      }

      .word-match-column > button {
        min-height: 112px;
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
        position: relative;
        border-color: #18B865;
        background: #EFFFF5;
        color: #0B743D;
        animation: wordMatchMatchedGlow .35s ease-out;
      }

      .word-match-word.matched::after,
      .word-match-picture.matched::after {
        content: "✓";
        position: absolute;
        top: 10px;
        right: 14px;
        width: 28px;
        height: 28px;
        display: grid;
        place-items: center;
        border-radius: 999px;
        background: #18B865;
        color: #FFFFFF;
        font-size: 16px;
        box-shadow: 0 8px 16px rgba(24, 184, 101, .25);
      }

      .word-match-word.wrong,
      .word-match-picture.wrong {
        border-color: #FF8A8A;
        background: #FFF4F4;
        animation: wordMatchWrongShake .42s ease-in-out;
      }

      .missions-wrap.early .word-match-word,
      .missions-wrap.early .word-match-picture {
        min-height: 118px;
      }

      .missions-wrap.early .word-match-picture-icon {
        width: 82px;
        height: 82px;
        border-radius: 26px;
        font-size: 46px;
      }

      @keyframes wordMatchWrongShake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-8px) rotate(-1deg); }
        40% { transform: translateX(8px) rotate(1deg); }
        60% { transform: translateX(-5px) rotate(-.5deg); }
        80% { transform: translateX(5px) rotate(.5deg); }
      }

      @keyframes wordMatchMatchedGlow {
        0% {
          transform: scale(.98);
          box-shadow: 0 0 0 rgba(24, 184, 101, 0);
        }
        55% {
          transform: scale(1.02);
          box-shadow: 0 0 0 8px rgba(24, 184, 101, .12);
        }
        100% {
          transform: scale(1);
          box-shadow: 0 10px 22px rgba(60, 103, 135, .08);
        }
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
        .word-match-top-panel {
          grid-template-columns: 1fr;
        }

        .word-match-progress-card {
          width: 100%;
          justify-content: stretch;
        }

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

      /* === Pagtutugma ng Salita complete modal polish START === */

    `}</style>
  );
}

function missionGamesForStudent(data) {
  const lessons = asArray(data?.lessons);
  const completedLessons = lessons.filter(lesson => lesson?.completed).length;

  return MISSION_GAMES.map((game, index) => {
    let status = game.baseStatus || 'Handa na';

    if (game.minCompleted && completedLessons < game.minCompleted) {
      status = 'Hindi pa bukas';
    } else if (!game.future && completedLessons > index + 1) {
      status = 'Tapos Na';
    }

    return { ...game, status };
  });
}

function StudentMissions({ data, go, onPlayMission, logout}) {
  const student = data?.student || {};
  const gradeLevel = Number(student?.gradeLevel || 4);
  const early = gradeLevel <= 2;
  const xp = Number(student?.xp || 0);
  const level = data?.level || levelForXp(xp);
  const xpPct = xpPercent(xp);
  const completedLessons = asArray(data?.lessons).filter(lesson => lesson?.completed).length;
  const badgeCount = asArray(data?.badges).length;
  const games = missionGamesForStudent(data);
  const availableCount = games.filter(game => game.status !== 'Hindi pa bukas').length;
  const completedCount = games.filter(game => game.status === 'Tapos Na').length;
  const nextBadgeProgress = Math.min(3, completedLessons);

  const openTab = (tab) => {
    if (tab === 'home') return go('screen-student');
    if (tab === 'lessons') return go('screen-lessons');
    if (tab === 'quizzes') return go('screen-stu-quizzes');
    if (tab === 'missions') return go('screen-stu-missions');
    if (tab === 'groups') return go('screen-stu-groups');
    if (tab === 'badges') return go('screen-stu-badges');
    if (tab === 'leaderboard') return go('screen-stu-leaderboard');
    if (tab === 'profile') return go('screen-stu-profile');
  };

  const playMission = (game) => {
    if (!game || game.status === 'Hindi pa bukas') return;
    if (typeof onPlayMission === 'function') {
      onPlayMission(game.id);
      return;
    }
    go('screen-stu-mission-play');
  };

  const content = (
    <>
      <MissionStyles />

      <style>{`
        .missions-wrap .missions-game-card {
          position: relative;
          overflow: hidden;
          transform-origin: center;
          animation: missionCardSoftFloat 4.8s ease-in-out infinite;
        }

        .missions-wrap .missions-game-card:nth-child(2n) {
          animation-delay: .55s;
        }

        .missions-wrap .missions-game-card:nth-child(3n) {
          animation-delay: 1.05s;
        }

        .missions-wrap .missions-game-card::after {
          content: '';
          position: absolute;
          inset: 0;
          transform: translateX(-120%) skewX(-18deg);
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, .38), transparent);
          pointer-events: none;
        }

        .missions-wrap .missions-game-card:hover {
          transform: translateY(-6px) scale(1.01);
          box-shadow: 0 18px 44px rgba(51, 76, 115, .18);
        }

        .missions-wrap .missions-game-card:hover::after {
          animation: missionCardShine .85s ease-out;
        }

        .missions-wrap .missions-play-btn {
          position: relative;
          overflow: hidden;
        }

        .missions-wrap .missions-play-btn::after {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          width: 46px;
          left: -70px;
          transform: skewX(-20deg);
          background: rgba(255, 255, 255, .45);
          animation: missionPlayShine 2.8s ease-in-out infinite;
        }

        @keyframes missionCardSoftFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        @keyframes missionCardShine {
          from { transform: translateX(-120%) skewX(-18deg); }
          to { transform: translateX(135%) skewX(-18deg); }
        }

        @keyframes missionPlayShine {
          0%, 62% { left: -70px; }
          100% { left: calc(100% + 70px); }
        }

        @media (prefers-reduced-motion: reduce) {
          .missions-wrap .missions-game-card,
          .missions-wrap .missions-play-btn::after {
            animation: none;
          }
        }
      `}</style>

      <div className={`missions-wrap ${early ? 'early' : 'standard'}`}>
        <section className="missions-hero">
          <div className="missions-hero-copy">
            <div className="missions-hero-icon">🚀</div>
            <h2>{early ? 'Mga Misyon ng Tuklas' : 'Mga Larong Pang-aral'}</h2>
            <p>
              {early
                ? 'Maglaro, kumita ng XP, at mag-unlock ng badges!'
                : 'Maglaro, kumita ng XP, at magbukas ng mga gantimpala!'}
            </p>
          </div>

          <div className="missions-progress-card">
            <strong>🪙 {xp} XP • Antas {level} • {shortLevelTitleForXp(xp)}</strong>
            <div className="missions-progress-track">
              <span className="missions-progress-fill" style={{ width: `${Math.max(6, xpPct)}%` }} />
            </div>
            <p style={{ margin: '12px 0 0', color: '#526988', fontWeight: 850 }}>
              {100 - xpPct} XP pa bago ang susunod na level.
            </p>
          </div>
        </section>

        <section className="missions-section">
          <div className="missions-section-head">
            <div>
              <h3>🎮 Mga Larong Pang-aral na Bukas</h3>
              <p>Pindutin ang Maglaro upang kumita ng XP!</p>
            </div>
          </div>

          <div className="missions-game-grid">
            {games.map(game => {
              const locked = game.status === 'Hindi pa bukas';

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
                    {locked ? '🔒 Hindi pa bukas' : '▶ Maglaro'}
                  </span>
                </button>
              );
            })}
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
        title="Mga Misyon ng Tuklas"
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
      logout={logout}
      icon="🎮"
      title="Mga Misyon ng Tuklas"
      subtitle="Maglaro ng mga larong Filipino na konektado sa bokabularyo, pagbasa, pagsulat, pag-unawa, at pasalitang komunikasyon."
    >
      {content}
    </Grade46StudentChrome>
  );
}

function StudentMissionPlay({ data, go, selectedGameId = 'word-match', onBack, refresh, logout}) {
  const [missionChoice, setMissionChoice] = useState('');
  const [missionResult, setMissionResult] = useState('');
  const [letterPopStage, setLetterPopStage] = useState('');
  const [letterPopToast, setLetterPopToast] = useState(null);
  const [letterPopCompleteModal, setLetterPopCompleteModal] = useState(false);
  const [letterPopItems, setLetterPopItems] = useState([]);
  const [letterPopItem, setLetterPopItem] = useState(null);
  const [pictureGuessItems, setPictureGuessItems] = useState([]);
  const [pictureGuessItem, setPictureGuessItem] = useState(null);
  const [pictureGuessWrongChoice, setPictureGuessWrongChoice] = useState('');
  const [pictureGuessToast, setPictureGuessToast] = useState(null);
  const [pictureGuessCompleteModal, setPictureGuessCompleteModal] = useState(false);
  const [sentenceBuilderItems, setSentenceBuilderItems] = useState([]);
  const [sentenceBuilderItem, setSentenceBuilderItem] = useState(null);
  const [sentenceBuilderSelected, setSentenceBuilderSelected] = useState([]);
  const [sentenceBuilderWrong, setSentenceBuilderWrong] = useState(false);
  const [sentenceBuilderCorrect, setSentenceBuilderCorrect] = useState(false);
  const [sentenceBuilderToast, setSentenceBuilderToast] = useState(null);
  const [sentenceBuilderCompleteModal, setSentenceBuilderCompleteModal] = useState(false);
  const [storyQuestItems, setStoryQuestItems] = useState([]);
  const [storyQuestItem, setStoryQuestItem] = useState(null);
  const [storyQuestMode, setStoryQuestMode] = useState('story');
  const [storyQuestPageIndex, setStoryQuestPageIndex] = useState(0);
  const [storyQuestQuestionIndex, setStoryQuestQuestionIndex] = useState(0);
  const [storyQuestAnswered, setStoryQuestAnswered] = useState({});
  const [storyQuestWrongChoice, setStoryQuestWrongChoice] = useState('');
  const [storyQuestToast, setStoryQuestToast] = useState(null);
  const [storyQuestComplete, setStoryQuestComplete] = useState(false);
  const [storyQuestCompleteModal, setStoryQuestCompleteModal] = useState(false);
  const [soundAndSayItems, setSoundAndSayItems] = useState([]);
  const [soundAndSayItem, setSoundAndSayItem] = useState(null);
  const [soundAndSayTranscript, setSoundAndSayTranscript] = useState('');
  const [soundAndSayScore, setSoundAndSayScore] = useState(null);
  const [soundAndSayListening, setSoundAndSayListening] = useState(false);
  const [soundAndSaySpeaking, setSoundAndSaySpeaking] = useState(false);
  const [soundAndSayCorrect, setSoundAndSayCorrect] = useState(false);
  const [soundAndSayError, setSoundAndSayError] = useState('');
  const [soundAndSayToast, setSoundAndSayToast] = useState(null);
  const [selectedWordId, setSelectedWordId] = useState('');
  const [matchedPairs, setMatchedPairs] = useState({});
  const [wordMatchWrongWordId, setWordMatchWrongWordId] = useState('');
  const [wordMatchWrongPictureId, setWordMatchWrongPictureId] = useState('');
  const [wordMatchMessage, setWordMatchMessage] = useState('');
  const [wordMatchItems, setWordMatchItems] = useState([]);
  const [wordMatchPictures, setWordMatchPictures] = useState([]);
  const [wordMatchToast, setWordMatchToast] = useState(null);
  const [wordMatchCompleteModal, setWordMatchCompleteModal] = useState(false);
  const [missionSaving, setMissionSaving] = useState(false);
  const [missionCompleteData, setMissionCompleteData] = useState(null);
  const letterPopAutoCompleteRef = useRef(false);
  const letterPopToastStartedAtRef = useRef(0);
  const pictureGuessAutoCompleteRef = useRef(false);
  const pictureGuessToastStartedAtRef = useRef(0);
  const sentenceBuilderAutoCompleteRef = useRef(false);
  const sentenceBuilderToastStartedAtRef = useRef(0);
  const storyQuestAutoCompleteRef = useRef(false);
  const storyQuestToastStartedAtRef = useRef(0);
  const LETTER_POP_SUCCESS_TOAST_MS = 1500;
  const PICTURE_GUESS_SUCCESS_TOAST_MS = 1200;
  const SENTENCE_BUILDER_SUCCESS_TOAST_MS = 1200;
  const STORY_QUEST_SUCCESS_TOAST_MS = 1200;
  const student = data?.student || {};
  const gradeLevel = Number(student?.gradeLevel || 4);
  const early = gradeLevel <= 2;
  const xp = Number(student?.xp || 0);
  const games = missionGamesForStudent(data);
  const selectedGame = games.find(game => game.id === selectedGameId) || games[0];
  const baseDemo = getMissionDemo(selectedGame?.id);
  const locked = selectedGame?.status === 'Hindi pa bukas';
  const isWordMatch = selectedGame?.id === 'word-match';
  const isLetterPop = selectedGame?.id === 'letter-pop';
  const isPictureGuess = selectedGame?.id === 'picture-guess';
  const isSentenceBuilder = selectedGame?.id === 'sentence-builder';
  const isStoryQuest = selectedGame?.id === 'story-quest';
  const isSoundAndSay = selectedGame?.id === 'sound-and-say';
  const fallbackLetterPopItems = getLetterPopAttemptItems(gradeLevel);
  const activeLetterPopItems = letterPopItems.length ? letterPopItems : fallbackLetterPopItems;
  const fallbackPictureGuessItems = getPictureGuessAttemptItems(gradeLevel);
  const activePictureGuessItems = pictureGuessItems.length ? pictureGuessItems : fallbackPictureGuessItems;
  const fallbackSentenceBuilderItems = getSentenceBuilderAttemptItems(gradeLevel);
  const activeSentenceBuilderItems = sentenceBuilderItems.length ? sentenceBuilderItems : fallbackSentenceBuilderItems;
  const fallbackStoryQuestItems = getStoryQuestAttemptItems(gradeLevel);
  const activeStoryQuestItems = storyQuestItems.length ? storyQuestItems : fallbackStoryQuestItems;
  const fallbackSoundAndSayItems = getSoundAndSayAttemptItems(gradeLevel);
  const activeSoundAndSayItems = soundAndSayItems.length ? soundAndSayItems : fallbackSoundAndSayItems;
  const demo = isLetterPop
    ? (letterPopItem || activeLetterPopItems[0] || baseDemo)
    : isPictureGuess
      ? (pictureGuessItem || activePictureGuessItems[0] || baseDemo)
      : isSentenceBuilder
        ? (sentenceBuilderItem || activeSentenceBuilderItems[0] || baseDemo)
        : isStoryQuest
          ? (storyQuestItem || activeStoryQuestItems[0] || baseDemo)
          : isSoundAndSay
            ? (soundAndSayItem || activeSoundAndSayItems[0] || baseDemo)
            : baseDemo;
  const fallbackWordMatchItems = getWordMatchAttemptItems(gradeLevel);
  const activeWordMatchItems = wordMatchItems.length ? wordMatchItems : fallbackWordMatchItems;
  const visibleWordMatchPictures = wordMatchPictures.length ? wordMatchPictures : activeWordMatchItems;
  const wordMatchDoneCount = Object.keys(matchedPairs).length;
  const wordMatchComplete = isWordMatch && wordMatchDoneCount === activeWordMatchItems.length;
  const sentenceBuilderWords = asArray(demo?.words);
  const sentenceBuilderSelectedWords = sentenceBuilderSelected
    .map(index => sentenceBuilderWords[index])
    .filter(Boolean);
  const sentenceBuilderIsFull = sentenceBuilderWords.length > 0 && sentenceBuilderSelected.length === sentenceBuilderWords.length;
  const storyQuestQuestions = asArray(demo?.questions);
  const storyQuestTotal = Math.max(1, storyQuestQuestions.length);
  const storyQuestSafeIndex = Math.min(storyQuestQuestionIndex, storyQuestTotal - 1);
  const storyQuestQuestion = storyQuestQuestions[storyQuestSafeIndex] || null;
  const storyQuestDoneCount = Object.keys(storyQuestAnswered || {}).length;
  const storyQuestProgressPct = Math.round((Math.min(storyQuestDoneCount, storyQuestTotal) / storyQuestTotal) * 100);
  const storyQuestStoryLines = asArray(demo?.story);
  const storyQuestPageTotal = Math.max(1, storyQuestStoryLines.length);
  const storyQuestSafePageIndex = Math.min(storyQuestPageIndex, storyQuestPageTotal - 1);
  const storyQuestPageText = storyQuestStoryLines[storyQuestSafePageIndex] || '';
  const storyQuestCanStartQuestions = early || storyQuestSafePageIndex >= storyQuestPageTotal - 1;
  const soundAndSayTarget = String(demo?.target || demo?.prompt || 'Magandang umaga po').replace(/^Bigkasin:\s*/i, '').replace(/[“”"]/g, '').trim();
  const soundAndSayThreshold = early ? 70 : 78;
  const soundAndSayScoreValue = Number(soundAndSayScore || 0);
  const soundAndSayPassed = soundAndSayScore !== null && soundAndSayScoreValue >= soundAndSayThreshold;
  const letterPopReady = isLetterPop && missionChoice === demo?.correct && letterPopStage === 'correct';

  useEffect(() => {
    const nextItems = getWordMatchAttemptItems(gradeLevel);
    const nextLetterPopItems = getLetterPopAttemptItems(gradeLevel);
    const nextPictureGuessItems = getPictureGuessAttemptItems(gradeLevel);
    const nextSentenceBuilderItems = getSentenceBuilderAttemptItems(gradeLevel);
    const nextStoryQuestItems = getStoryQuestAttemptItems(gradeLevel);
    const nextSoundAndSayItems = getSoundAndSayAttemptItems(gradeLevel);

    setMissionChoice('');
    setMissionResult('');
    setLetterPopStage('');
    setLetterPopToast(null);
    setLetterPopCompleteModal(false);
    letterPopAutoCompleteRef.current = false;
    letterPopToastStartedAtRef.current = 0;
    setLetterPopItems(nextLetterPopItems);
    setLetterPopItem(nextLetterPopItems[0] || null);
    setPictureGuessItems(nextPictureGuessItems);
    setPictureGuessItem(nextPictureGuessItems[0] || null);
    setPictureGuessWrongChoice('');
    setPictureGuessToast(null);
    setPictureGuessCompleteModal(false);
    pictureGuessAutoCompleteRef.current = false;
    pictureGuessToastStartedAtRef.current = 0;
    setSentenceBuilderItems(nextSentenceBuilderItems);
    setSentenceBuilderItem(nextSentenceBuilderItems[0] || null);
    setSentenceBuilderSelected([]);
    setSentenceBuilderWrong(false);
    setSentenceBuilderCorrect(false);
    setSentenceBuilderToast(null);
    setSentenceBuilderCompleteModal(false);
    sentenceBuilderAutoCompleteRef.current = false;
    sentenceBuilderToastStartedAtRef.current = 0;
    setStoryQuestItems(nextStoryQuestItems);
    setStoryQuestItem(nextStoryQuestItems[0] || null);
    setStoryQuestMode('story');
    setStoryQuestPageIndex(0);
    setStoryQuestQuestionIndex(0);
    setStoryQuestAnswered({});
    setStoryQuestWrongChoice('');
    setStoryQuestToast(null);
    setStoryQuestComplete(false);
    setStoryQuestCompleteModal(false);
    storyQuestAutoCompleteRef.current = false;
    storyQuestToastStartedAtRef.current = 0;
    setSoundAndSayItems(nextSoundAndSayItems);
    setSoundAndSayItem(nextSoundAndSayItems[0] || null);
    setSoundAndSayTranscript('');
    setSoundAndSayScore(null);
    setSoundAndSayListening(false);
    setSoundAndSaySpeaking(false);
    setSoundAndSayCorrect(false);
    setSoundAndSayError('');
    setSoundAndSayToast(null);
    setSelectedWordId('');
    setMatchedPairs({});
    setWordMatchWrongWordId('');
    setWordMatchWrongPictureId('');
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

  useEffect(() => {
    if (!letterPopToast) return undefined;

    const timer = setTimeout(() => {
      setLetterPopToast(null);
    }, letterPopToast.type === 'good' ? LETTER_POP_SUCCESS_TOAST_MS : 1300);

    return () => clearTimeout(timer);
  }, [letterPopToast]);

  useEffect(() => {
    if (!pictureGuessToast) return undefined;

    const timer = setTimeout(() => {
      setPictureGuessToast(null);
    }, pictureGuessToast.type === 'good' ? PICTURE_GUESS_SUCCESS_TOAST_MS : 1400);

    return () => clearTimeout(timer);
  }, [pictureGuessToast]);

  useEffect(() => {
    if (!sentenceBuilderToast) return undefined;

    const timer = setTimeout(() => {
      setSentenceBuilderToast(null);
    }, sentenceBuilderToast.type === 'good' ? SENTENCE_BUILDER_SUCCESS_TOAST_MS : 1500);

    return () => clearTimeout(timer);
  }, [sentenceBuilderToast]);

  useEffect(() => {
    if (!storyQuestToast) return undefined;

    const timer = setTimeout(() => {
      setStoryQuestToast(null);
    }, storyQuestToast.type === 'good' ? STORY_QUEST_SUCCESS_TOAST_MS : 1500);

    return () => clearTimeout(timer);
  }, [storyQuestToast]);

  useEffect(() => {
    if (!soundAndSayToast) return undefined;

    const timer = setTimeout(() => {
      setSoundAndSayToast(null);
    }, soundAndSayToast.type === 'good' ? 1300 : 1600);

    return () => clearTimeout(timer);
  }, [soundAndSayToast]);

  const openTab = (tab) => {
    if (tab === 'home') return go('screen-student');
    if (tab === 'lessons') return go('screen-lessons');
    if (tab === 'quizzes') return go('screen-stu-quizzes');
    if (tab === 'missions') return go('screen-stu-missions');
    if (tab === 'groups') return go('screen-stu-groups');
    if (tab === 'badges') return go('screen-stu-badges');
    if (tab === 'leaderboard') return go('screen-stu-leaderboard');
    if (tab === 'profile') return go('screen-stu-profile');
  };

  const backToMissions = () => {
    if (typeof onBack === 'function') {
      onBack();
      return;
    }
    go('screen-stu-missions');
  };

  function playLetterPopSound(type = 'good') {
    try {
      if (typeof window === 'undefined') return;

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = type === 'good' ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(type === 'good' ? 620 : 180, now);
      if (type === 'good') {
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(1040, now + 0.16);
      } else {
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);
      }

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(type === 'good' ? 0.28 : 0.16, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + (type === 'good' ? 0.24 : 0.16));

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + (type === 'good' ? 0.28 : 0.2));

      window.setTimeout(() => {
        try {
          ctx.close();
        } catch (_) {
          // Sound cleanup is optional.
        }
      }, 420);
    } catch (_) {
      // Opsyonal ang tunog sa Pagpili ng Titik.
    }
  }

  const checkMissionAnswer = (choice) => {
    if (!demo || locked) return;
    if (isLetterPop && (missionSaving || letterPopCompleteModal || letterPopAutoCompleteRef.current)) return;
    if (isPictureGuess && (missionSaving || pictureGuessCompleteModal || pictureGuessAutoCompleteRef.current)) return;
    if (isSentenceBuilder && (missionSaving || sentenceBuilderCompleteModal || sentenceBuilderAutoCompleteRef.current)) return;

    setMissionChoice(choice);

    if (isPictureGuess) {
      if (choice === demo.correct) {
        setPictureGuessWrongChoice('');
        setPictureGuessToast({ type: 'good', message: 'Tama ang iyong sagot!' });
        pictureGuessToastStartedAtRef.current = Date.now();
        setMissionResult('');
        playLetterPopSound('good');

        pictureGuessAutoCompleteRef.current = true;
        window.setTimeout(() => {
          completePictureGuessMission({
            force: true,
            challenge: demo,
            answer: choice,
          });
        }, 350);
        return;
      }

      setPictureGuessWrongChoice(choice);
      setPictureGuessToast({ type: 'warn', message: 'Hindi pa tama. Tingnan ulit ang larawan!' });
      setMissionResult('');
      playLetterPopSound('wrong');

      window.setTimeout(() => {
        setPictureGuessWrongChoice('');
      }, 650);
      return;
    }

    if (choice === demo.correct) {
      if (isLetterPop) {
        setLetterPopStage('correct');
        setLetterPopToast({ type: 'good', message: 'Tama ang iyong sagot!' });
        letterPopToastStartedAtRef.current = Date.now();
        setMissionResult('');
        playLetterPopSound('good');

        letterPopAutoCompleteRef.current = true;
        window.setTimeout(() => {
          completeLetterPopMission({
            force: true,
            challenge: demo,
            answer: choice,
          });
        }, 350);
        return;
      }

      setMissionResult(`✅ ${demo.success} Demo na gantimpala: +${selectedGame?.xp || 0} preview ng XP.`);
      return;
    }

    if (isLetterPop) {
      setLetterPopStage('wrong');
      setLetterPopToast({ type: 'warn', message: 'Hindi pa tama. Pop ulit ng tamang pantig!' });
      setMissionResult('');
      playLetterPopSound('wrong');

      window.setTimeout(() => {
        setLetterPopStage(current => current === 'wrong' ? '' : current);
      }, 650);
      return;
    }

    setMissionResult('⭐ Hindi pa tama. Subukan muli!');
  };

  const restartDemo = () => {
    const nextItems = getWordMatchAttemptItems(gradeLevel);
    const nextLetterPopItems = getLetterPopAttemptItems(gradeLevel);
    const currentLetterPopId = letterPopItem?.id || '';
    const nextLetterPopItem =
      nextLetterPopItems.find(item => item.id !== currentLetterPopId) ||
      nextLetterPopItems[0] ||
      null;
    const nextPictureGuessItems = getPictureGuessAttemptItems(gradeLevel);
    const currentPictureGuessId = pictureGuessItem?.id || '';
    const nextPictureGuessItem =
      nextPictureGuessItems.find(item => item.id !== currentPictureGuessId) ||
      nextPictureGuessItems[0] ||
      null;
    const nextSentenceBuilderItems = getSentenceBuilderAttemptItems(gradeLevel);
    const currentSentenceBuilderId = sentenceBuilderItem?.id || '';
    const nextSentenceBuilderItem =
      nextSentenceBuilderItems.find(item => item.id !== currentSentenceBuilderId) ||
      nextSentenceBuilderItems[0] ||
      null;
    const nextStoryQuestItems = getStoryQuestAttemptItems(gradeLevel);
    const currentStoryQuestId = storyQuestItem?.id || '';
    const nextStoryQuestItem =
      nextStoryQuestItems.find(item => item.id !== currentStoryQuestId) ||
      nextStoryQuestItems[0] ||
      null;
    const nextSoundAndSayItems = getSoundAndSayAttemptItems(gradeLevel);
    const currentSoundAndSayId = soundAndSayItem?.id || '';
    const nextSoundAndSayItem =
      nextSoundAndSayItems.find(item => item.id !== currentSoundAndSayId) ||
      nextSoundAndSayItems[0] ||
      null;

    setMissionChoice('');
    setMissionResult('');
    setLetterPopStage('');
    setLetterPopToast(null);
    setLetterPopCompleteModal(false);
    setLetterPopItems(nextLetterPopItems);
    setLetterPopItem(nextLetterPopItem);
    setPictureGuessItems(nextPictureGuessItems);
    setPictureGuessItem(nextPictureGuessItem);
    setPictureGuessWrongChoice('');
    setPictureGuessToast(null);
    setSentenceBuilderItems(nextSentenceBuilderItems);
    setSentenceBuilderItem(nextSentenceBuilderItem);
    setSentenceBuilderSelected([]);
    setSentenceBuilderWrong(false);
    setSentenceBuilderCorrect(false);
    setSentenceBuilderToast(null);
    setSentenceBuilderCompleteModal(false);
    sentenceBuilderAutoCompleteRef.current = false;
    sentenceBuilderToastStartedAtRef.current = 0;
    setStoryQuestItems(nextStoryQuestItems);
    setStoryQuestItem(nextStoryQuestItem);
    setStoryQuestMode('story');
    setStoryQuestPageIndex(0);
    setStoryQuestQuestionIndex(0);
    setStoryQuestAnswered({});
    setStoryQuestWrongChoice('');
    setStoryQuestToast(null);
    setStoryQuestComplete(false);
    setStoryQuestCompleteModal(false);
    storyQuestAutoCompleteRef.current = false;
    storyQuestToastStartedAtRef.current = 0;
    setSoundAndSayItems(nextSoundAndSayItems);
    setSoundAndSayItem(nextSoundAndSayItem);
    setSoundAndSayTranscript('');
    setSoundAndSayScore(null);
    setSoundAndSayListening(false);
    setSoundAndSaySpeaking(false);
    setSoundAndSayCorrect(false);
    setSoundAndSayError('');
    setSoundAndSayToast(null);
    setSelectedWordId('');
    setMatchedPairs({});
    setWordMatchWrongWordId('');
    setWordMatchWrongPictureId('');
    setWordMatchMessage('');
    setWordMatchItems(nextItems);
    setWordMatchToast(null);
    setWordMatchCompleteModal(false);
    setMissionSaving(false);
    setMissionCompleteData(null);
    setWordMatchPictures(shuffleWordMatchItems(nextItems));
  };

  async function speakSoundAndSayTarget() {
    try {
      setSoundAndSaySpeaking(true);
      setSoundAndSayError('');
      setSoundAndSayToast({ type: 'info', message: 'Pakinggan muna ang salita.' });

      await speakText(soundAndSayTarget);

      setSoundAndSaySpeaking(false);
    } catch (_) {
      setSoundAndSaySpeaking(false);
      setSoundAndSayError('Hindi ma-play ang boses. Subukan muli.');
    }
  }

  function startSoundAndSayRecognition() {
    const Recognition = getSpeechRecognition();

    if (!Recognition) {
      setSoundAndSayError('Hindi supported ng browser ang speech recognition. Subukan sa Chrome o Edge.');
      return;
    }

    const recognition = new Recognition();
    recognition.lang = 'fil-PH';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setSoundAndSayError('');
    setSoundAndSayTranscript('');
    setSoundAndSayScore(null);
    setSoundAndSayCorrect(false);
    setSoundAndSayListening(true);
    setSoundAndSayToast({ type: 'info', message: 'Nakikinig ako. Bigkasin mo ngayon!' });

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      const score = speechSimilarityScore(soundAndSayTarget, transcript);
      const passed = score >= soundAndSayThreshold;

      setSoundAndSayTranscript(transcript);
      setSoundAndSayScore(score);
      setSoundAndSayCorrect(passed);
      setSoundAndSayListening(false);

      if (passed) {
        setSoundAndSayToast({ type: 'good', message: 'Tama ang bigkas!' });
        playLetterPopSound('good');
      } else {
        setSoundAndSayToast({ type: 'warn', message: 'Subukan muli. Pakinggan ulit ang salita.' });
        playLetterPopSound('wrong');
      }
    };

    recognition.onerror = (event) => {
      setSoundAndSayError(`Error sa pagkilala ng pagbigkas: ${event.error}`);
      setSoundAndSayListening(false);
      setSoundAndSayToast({ type: 'warn', message: 'Hindi malinaw ang narinig. Subukan muli.' });
    };

    recognition.onend = () => {
      setSoundAndSayListening(false);
    };

    recognition.start();
  }

  function resetSoundAndSayPractice() {
    setSoundAndSayTranscript('');
    setSoundAndSayScore(null);
    setSoundAndSayListening(false);
    setSoundAndSaySpeaking(false);
    setSoundAndSayCorrect(false);
    setSoundAndSayError('');
    setSoundAndSayToast(null);

    stopSpeech();
  }

  const completeStoryQuestMission = async ({ force = false, challenge = demo } = {}) => {
    const activeChallenge = challenge || demo;
    const totalQuestions = asArray(activeChallenge?.questions).length || storyQuestTotal;
    const answeredCount = Object.keys(storyQuestAnswered || {}).length;
    const readyToComplete =
      force ||
      (isStoryQuest && storyQuestComplete && answeredCount >= totalQuestions);

    if (!readyToComplete) {
      setStoryQuestToast({ type: 'warn', message: 'Sagutin muna ang lahat ng tanong.' });
      return;
    }

    setMissionSaving(true);

    try {
      const result = await api('/missions/story-quest/complete', {
        method: 'POST',
        body: {
          challengeId: activeChallenge?.id || 'story-quest-default',
          challengeTitle: activeChallenge?.id || activeChallenge?.title || 'Pag-unawa sa Kwento',
          gradeLevel,
          answer: {
            storyId: activeChallenge?.id || 'story-quest-default',
            answered: totalQuestions,
          },
        },
      });

      setMissionCompleteData({ ...result, newBadges: uniqueBadgesForDisplay(result?.newBadges || []) });
      showBadgeUnlockPopup(result?.newBadges);

      const elapsedToastTime = Date.now() - Number(storyQuestToastStartedAtRef.current || 0);
      const remainingToastTime = Math.max(0, STORY_QUEST_SUCCESS_TOAST_MS - elapsedToastTime);

      if (remainingToastTime > 0) {
        await new Promise(resolve => window.setTimeout(resolve, remainingToastTime));
      }

      setStoryQuestToast(null);
      setStoryQuestCompleteModal(true);
      playMissionSuccessSound();

      if (typeof refresh === 'function') {
        refresh().catch((error) => {
          console.warn('[TuklasTalino] Pag-unawa sa Kwento dashboard refresh failed:', error);
        });
      }
    } catch (err) {
      setStoryQuestToast({
        type: 'warn',
        message: err?.message || 'Hindi naitala ang misyong Pag-unawa sa Kuwento. Subukan muli.',
      });
    } finally {
      setMissionSaving(false);
      storyQuestAutoCompleteRef.current = false;
    }
  };

  const answerStoryQuest = (choice) => {
    if (locked || missionSaving || storyQuestComplete || storyQuestCompleteModal || storyQuestAutoCompleteRef.current || storyQuestMode !== 'quiz') return;

    const choiceLabel = storyQuestChoiceLabel(choice);
    const correctLabel = String(storyQuestQuestion?.correct || '').trim();

    if (!storyQuestQuestion || !choiceLabel) return;

    if (choiceLabel.toLowerCase() === correctLabel.toLowerCase()) {
      const currentIndex = storyQuestSafeIndex;
      const nextAnswered = { ...storyQuestAnswered, [currentIndex]: true };
      const nextDoneCount = Object.keys(nextAnswered).length;
      const isLastQuestion = currentIndex >= storyQuestTotal - 1;

      setStoryQuestWrongChoice('');
      setStoryQuestAnswered(nextAnswered);
      setStoryQuestToast({
        type: 'good',
        message: isLastQuestion ? 'Tapos na ang misyon!' : 'Tama! Susunod na tanong.'
      });
      playLetterPopSound('good');

      if (isLastQuestion || nextDoneCount >= storyQuestTotal) {
        storyQuestToastStartedAtRef.current = Date.now();
        storyQuestAutoCompleteRef.current = true;

        window.setTimeout(() => {
          setStoryQuestComplete(true);
          completeStoryQuestMission({
            force: true,
            challenge: demo,
          });
        }, 650);
      } else {
        window.setTimeout(() => {
          setStoryQuestQuestionIndex(index => Math.min(index + 1, storyQuestTotal - 1));
        }, 650);
      }

      return;
    }

    setStoryQuestWrongChoice(choiceLabel);
    setStoryQuestToast({ type: 'warn', message: 'Balikan ang kuwento. Try ulit!' });
    playLetterPopSound('wrong');

    window.setTimeout(() => {
      setStoryQuestWrongChoice('');
    }, 650);
  };

  const completeSentenceBuilderMission = async ({ force = false, challenge = demo, selectedWords = sentenceBuilderSelectedWords } = {}) => {
    const activeChallenge = challenge || demo;
    const submittedWords = asArray(selectedWords);
    const selectedSentence = normalizeSentenceBuilderWords(submittedWords);
    const correctSentence = normalizeSentenceBuilderWords(activeChallenge?.answer || []);
    const readyToComplete = force || (isSentenceBuilder && selectedSentence === correctSentence && correctSentence);

    if (!readyToComplete) {
      setSentenceBuilderToast({ type: 'warn', message: 'Ayusin muna nang tama ang pangungusap.' });
      return;
    }

    setMissionSaving(true);

    try {
      const result = await api('/missions/sentence-builder/complete', {
        method: 'POST',
        body: {
          challengeId: activeChallenge?.id || 'sentence-builder-default',
          challengeTitle: activeChallenge?.id || correctSentence || 'Pagbuo ng Pangungusap',
          gradeLevel,
          answer: submittedWords,
        },
      });

      setMissionCompleteData({ ...result, newBadges: uniqueBadgesForDisplay(result?.newBadges || []) });
      showBadgeUnlockPopup(result?.newBadges);

      const elapsedToastTime = Date.now() - Number(sentenceBuilderToastStartedAtRef.current || 0);
      const remainingToastTime = Math.max(0, SENTENCE_BUILDER_SUCCESS_TOAST_MS - elapsedToastTime);

      if (remainingToastTime > 0) {
        await new Promise(resolve => window.setTimeout(resolve, remainingToastTime));
      }

      setSentenceBuilderToast(null);
      setSentenceBuilderCompleteModal(true);
      playMissionSuccessSound();

      if (typeof refresh === 'function') {
        refresh().catch((error) => {
          console.warn('[TuklasTalino] Pagbuo ng Pangungusap dashboard refresh failed:', error);
        });
      }
    } catch (err) {
      setSentenceBuilderToast({
        type: 'warn',
        message: err?.message || 'Hindi naitala ang misyong Pagbuo ng Pangungusap. Subukan muli.',
      });
    } finally {
      setMissionSaving(false);
      sentenceBuilderAutoCompleteRef.current = false;
    }
  };

  const selectSentenceBuilderWord = (wordIndex) => {
    if (locked || missionSaving || sentenceBuilderCorrect || sentenceBuilderCompleteModal || sentenceBuilderAutoCompleteRef.current) return;
    if (sentenceBuilderSelected.includes(wordIndex)) return;

    setSentenceBuilderWrong(false);
    setSentenceBuilderToast(null);
    setSentenceBuilderSelected(current => [...current, wordIndex]);
  };

  const removeSentenceBuilderWord = (slotIndex) => {
    if (locked || missionSaving || sentenceBuilderCorrect || sentenceBuilderCompleteModal || sentenceBuilderAutoCompleteRef.current) return;

    setSentenceBuilderWrong(false);
    setSentenceBuilderToast(null);
    setSentenceBuilderSelected(current => current.filter((_, index) => index !== slotIndex));
  };

  const clearSentenceBuilder = () => {
    if (locked || missionSaving || sentenceBuilderCorrect || sentenceBuilderCompleteModal || sentenceBuilderAutoCompleteRef.current) return;

    setSentenceBuilderSelected([]);
    setSentenceBuilderWrong(false);
    setSentenceBuilderToast(null);
    setMissionResult('');
  };

  const checkSentenceBuilderAnswer = () => {
    if (locked || missionSaving || sentenceBuilderCorrect || sentenceBuilderCompleteModal || sentenceBuilderAutoCompleteRef.current) return;

    if (!sentenceBuilderIsFull) {
      setSentenceBuilderToast({ type: 'warn', message: 'Buuin muna ang buong pangungusap.' });
      playLetterPopSound('wrong');
      return;
    }

    const selectedSentence = normalizeSentenceBuilderWords(sentenceBuilderSelectedWords);
    const correctSentence = normalizeSentenceBuilderWords(demo?.answer || []);

    if (selectedSentence === correctSentence) {
      const submittedWords = [...sentenceBuilderSelectedWords];

      setSentenceBuilderWrong(false);
      setSentenceBuilderCorrect(true);
      setSentenceBuilderToast({ type: 'good', message: 'Tama ang pangungusap!' });
      sentenceBuilderToastStartedAtRef.current = Date.now();
      setMissionResult('');
      playLetterPopSound('good');

      sentenceBuilderAutoCompleteRef.current = true;
      window.setTimeout(() => {
        completeSentenceBuilderMission({
          force: true,
          challenge: demo,
          selectedWords: submittedWords,
        });
      }, 350);
      return;
    }

    setSentenceBuilderWrong(true);
    setSentenceBuilderToast({ type: 'warn', message: 'Hindi pa tama. Ayusin ulit ang mga salita!' });
    playLetterPopSound('wrong');

    window.setTimeout(() => {
      setSentenceBuilderWrong(false);
    }, 650);
  };

  const selectWordMatchWord = (itemId) => {
    if (locked || matchedPairs[itemId] || missionSaving || wordMatchCompleteModal) return;
    setSelectedWordId(itemId);
    setWordMatchWrongWordId('');
    setWordMatchWrongPictureId('');
    setWordMatchMessage('');
    setWordMatchToast(null);
  };

  const selectWordMatchPicture = (itemId) => {
    if (locked || matchedPairs[itemId] || missionSaving || wordMatchCompleteModal) return;

    if (!selectedWordId) {
      setWordMatchMessage('');
      setWordMatchToast({ type: 'warn', message: 'Pumili muna ng salita.' });
      playLetterPopSound('wrong');
      return;
    }

    if (selectedWordId === itemId) {
      const nextPairs = { ...matchedPairs, [itemId]: true };
      const nextDoneCount = Object.keys(nextPairs).length;

      setMatchedPairs(nextPairs);
      setSelectedWordId('');
      setWordMatchWrongWordId('');
      setWordMatchWrongPictureId('');
      setWordMatchMessage('');
      playLetterPopSound('good');

      if (nextDoneCount === activeWordMatchItems.length) {
        setMissionResult('');
        setWordMatchToast(null);
      } else {
        setWordMatchToast(null);
      }

      return;
    }

    setWordMatchWrongWordId(selectedWordId);
    setWordMatchWrongPictureId(itemId);
    setWordMatchMessage('');
    setWordMatchToast({ type: 'warn', message: 'Hindi pa tugma. Try ulit!' });
    playLetterPopSound('wrong');

    window.setTimeout(() => {
      setWordMatchWrongWordId('');
      setWordMatchWrongPictureId('');
    }, 650);
  };

  const completePictureGuessMission = async ({ force = false, challenge = demo, answer = missionChoice } = {}) => {
    const activeChallenge = challenge || demo;
    const selectedAnswer = answer || missionChoice;
    const readyToComplete =
      force ||
      (isPictureGuess && selectedAnswer === activeChallenge?.correct);

    if (!readyToComplete) {
      setPictureGuessToast({ type: 'warn', message: 'Piliin muna ang tamang sagot bago matapos ang misyon.' });
      return;
    }

    setMissionSaving(true);

    try {
      const result = await api('/missions/picture-guess/complete', {
        method: 'POST',
        body: {
          challengeId: activeChallenge?.id || 'picture-guess-default',
          challengeTitle: activeChallenge?.id || activeChallenge?.prompt || 'Hulaan ang Larawan',
          gradeLevel,
          answer: selectedAnswer,
        },
      });

      setMissionCompleteData({ ...result, newBadges: uniqueBadgesForDisplay(result?.newBadges || []) });
      showBadgeUnlockPopup(result?.newBadges);

      const elapsedToastTime = Date.now() - Number(pictureGuessToastStartedAtRef.current || 0);
      const remainingToastTime = Math.max(0, PICTURE_GUESS_SUCCESS_TOAST_MS - elapsedToastTime);

      if (remainingToastTime > 0) {
        await new Promise(resolve => window.setTimeout(resolve, remainingToastTime));
      }

      setPictureGuessToast(null);
      setPictureGuessCompleteModal(true);
      playMissionSuccessSound();

      if (typeof refresh === 'function') {
        refresh().catch((error) => {
          console.warn('[TuklasTalino] Hulaan ang Larawan dashboard refresh failed:', error);
        });
      }
    } catch (err) {
      setPictureGuessToast({
        type: 'warn',
        message: err?.message || 'Hindi naitala ang misyong Hulaan ang Larawan. Subukan muli.',
      });
    } finally {
      setMissionSaving(false);
      pictureGuessAutoCompleteRef.current = false;
    }
  };

  const completeLetterPopMission = async ({ force = false, challenge = demo, answer = missionChoice } = {}) => {
    const activeChallenge = challenge || demo;
    const selectedAnswer = answer || missionChoice;
    const readyToComplete =
      force ||
      (isLetterPop && selectedAnswer === activeChallenge?.correct && letterPopStage === 'correct');

    if (!readyToComplete) {
      setLetterPopToast({ type: 'warn', message: 'I-pop muna ang tamang sagot bago tapusin ang misyon.' });
      return;
    }

    setMissionSaving(true);

    try {
      const result = await api('/missions/letter-pop/complete', {
        method: 'POST',
        body: {
          challengeId: activeChallenge?.id || 'letter-pop-default',
          challengeTitle: activeChallenge?.id || activeChallenge?.prompt || 'Pagpili ng Titik',
          gradeLevel,
          answer: selectedAnswer,
        },
      });

      setMissionCompleteData({ ...result, newBadges: uniqueBadgesForDisplay(result?.newBadges || []) });
      showBadgeUnlockPopup(result?.newBadges);

      const elapsedToastTime = Date.now() - Number(letterPopToastStartedAtRef.current || 0);
      const remainingToastTime = Math.max(0, LETTER_POP_SUCCESS_TOAST_MS - elapsedToastTime);

      if (remainingToastTime > 0) {
        await new Promise(resolve => window.setTimeout(resolve, remainingToastTime));
      }

      setLetterPopToast(null);
      setLetterPopCompleteModal(true);
      playMissionSuccessSound();

      if (typeof refresh === 'function') {
        refresh().catch((error) => {
          console.warn('[TuklasTalino] Pagpili ng Titik dashboard refresh failed:', error);
        });
      }
    } catch (err) {
      setLetterPopToast({
        type: 'warn',
        message: err?.message || 'Hindi naitala ang misyong Pagpili ng Titik. Subukan muli.',
      });
    } finally {
      setMissionSaving(false);
      letterPopAutoCompleteRef.current = false;
    }
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

      setMissionCompleteData({ ...result, newBadges: uniqueBadgesForDisplay(result?.newBadges || []) });
      showBadgeUnlockPopup(result?.newBadges);

      if (typeof refresh === 'function') {
        await refresh();
      }

      setWordMatchCompleteModal(true);
      playMissionSuccessSound();
    } catch (err) {
      setWordMatchToast({
        type: 'warn',
        message: err?.message || 'Hindi naitala ang misyon. Subukan muli.'
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
            {!(isSentenceBuilder || isSoundAndSay) && (
            <div className="mission-play-head">
              <div className="mission-play-icon">{selectedGame?.icon || '🎮'}</div>
              <div>
                <h2>{selectedGame?.title || 'Mga Misyon'}</h2>
                <p>
                  {locked
                    ? 'Hindi pa bukas ang misyong ito. Tapusin ang mas maraming aralin o laro upang mabuksan ito.'
                    : `${selectedGame?.module || 'Filipino'} misyon • +${selectedGame?.xp || 0} preview ng XP • ${selectedGame?.status || 'Handa na'}`}
                </p>
              </div>
            </div>
            )}

            {locked ? (
              <>
                <div className="mission-prompt-box">
                  🔒 Hindi pa bukas ang misyong ito. Tapusin ang {selectedGame?.minCompleted || 3} aralin o misyon para mabuksan ang hamong ito.
                </div>

                <div className="mission-play-actions">
                  <button type="button" className="mission-play-action secondary" onClick={backToMissions}>
                    ← Bumalik sa mga Misyon
                  </button>
                </div>
              </>
            ) : (
              <>
                {isWordMatch ? (
                  <div className="word-match-game" aria-label="Laro sa Pagtutugma ng Salita">
                    <div className="word-match-top-panel">
                      <div className="word-match-guide">
                        Piliin ang salitang Filipino sa kaliwa, pagkatapos piliin ang tamang larawan sa kanan.
                      </div>

                      <div className="word-match-progress-card" aria-label="Pag-unlad sa Pagtutugma ng Salita">
                        <span>Matched pairs</span>
                        <strong>{wordMatchDoneCount}/{activeWordMatchItems.length}</strong>
                        <div className="word-match-progress-track">
                          <i style={{ width: `${Math.round((wordMatchDoneCount / Math.max(1, activeWordMatchItems.length)) * 100)}%` }} />
                        </div>
                      </div>
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
                          const wrong = wordMatchWrongWordId === item.id;
                          const toneClass = matched ? `tone-${index % 6}` : '';
                          return (
                            <button
                              type="button"
                              key={item.id}
                              className={`word-match-word ${selectedWordId === item.id ? 'selected' : ''} ${matched ? 'matched' : ''} ${wrong ? 'wrong' : ''} ${toneClass}`}
                              onClick={() => selectWordMatchWord(item.id)}
                              disabled={matched}
                            >
                              <span>{item.word}</span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="word-match-column">
                        <h3>Mga Larawan</h3>
                        {visibleWordMatchPictures.map(item => {
                          const matched = Boolean(matchedPairs[item.id]);
                          const wrong = wordMatchWrongPictureId === item.id;
                          const originalIndex = Math.max(0, activeWordMatchItems.findIndex(row => row.id === item.id));
                          const toneClass = matched ? `tone-${originalIndex % 6}` : '';
                          return (
                            <button
                              type="button"
                              key={item.id}
                              className={`word-match-picture ${matched ? 'matched' : ''} ${wrong ? 'wrong' : ''} ${toneClass}`}
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
                      <div className="mission-complete-overlay" role="dialog" aria-modal="true" aria-label="Tapos na ang misyon">
                        <div className="mission-complete-modal">
                          <div className="mission-complete-icon">🏆</div>
                          <h3>Tapos na ang Misyon!</h3>
                          <p>
                            {missionCompleteData?.message || 'Ang galing mo! Natapos mo ang Pagtutugma ng Salita.'}
                          </p>
                          <div className="mission-complete-xp">
                            ⚡ {missionCompleteData?.xpAwarded > 0 ? `+${missionCompleteData.xpAwarded} XP Naidagdag` : 'Naibigay na ang XP'}
                          </div>

                          <div className="mission-complete-actions">
                            <button type="button" className="mission-complete-btn purple" onClick={restartDemo}>
                              🔄 Maglaro Muli
                            </button>
                            <button type="button" className="mission-complete-btn" onClick={backToMissions}>
                              🎮 Misyon
                            </button>
                            <button type="button" className="mission-complete-btn light" onClick={() => go('screen-student')}>
                              🏠 Tahanan
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : isLetterPop ? (
                  <div className={`letter-pop-game ${early ? 'early' : 'standard'} ${letterPopStage || ''}`}>
                    <div className="letter-pop-prompt-card">
                      <div className="letter-pop-mini-label">Misyong Pantig</div>
                      <div className="letter-pop-equation">{demo?.prompt}</div>
                      <div className="letter-pop-clue">💡 {demo?.sample}</div>
                    </div>

                    {letterPopToast && (
                      <div className={`letter-pop-toast ${letterPopToast.type || 'info'}`} role="status">
                        {letterPopToast.message}
                      </div>
                    )}

                    <div className="letter-pop-balloon-field" aria-label="Mga pagpipilian sa Pagpili ng Titik">
                      {(demo?.options || []).map((choice, index) => {
                        const selected = missionChoice === choice;
                        const correct = choice === demo?.correct;
                        const popped = selected && correct && letterPopStage === 'correct';
                        const wrong = selected && !correct && letterPopStage === 'wrong';

                        return (
                          <button
                            type="button"
                            className={`letter-pop-balloon tone-${index % 4} ${popped ? 'popped' : ''} ${wrong ? 'wrong' : ''}`}
                            key={`${demo?.id || 'letter-pop'}-${choice}`}
                            onClick={() => checkMissionAnswer(choice)}
                            aria-label={`Piliin ang pantig ${choice}`}
                          >
                            <span className="letter-pop-string" aria-hidden="true" />
                            <span className="letter-pop-shine" aria-hidden="true" />
                            <span className="letter-pop-text">{choice}</span>
                            {popped && <span className="letter-pop-burst" aria-hidden="true">✦</span>}
                          </button>
                        );
                      })}
                    </div>

                    <div className="letter-pop-helper">
                      Tap the balloon na bubuo sa salita. Kapag tama, pop!
                    </div>

                    {letterPopCompleteModal && (
                      <div className="mission-complete-overlay" role="dialog" aria-modal="true" aria-label="Tapos na ang misyong Pagpili ng Titik">
                        <div className="mission-complete-modal">
                          <div className="mission-complete-icon">🎈</div>
                          <h3>Tapos na ang Pagpili ng Titik!</h3>
                          <p>
                            {missionCompleteData?.message || 'Ang galing mo! Natapos mo ang Pagpili ng Titik.'}
                          </p>
                          <div className="mission-complete-xp">
                            ⚡ {missionCompleteData?.xpAwarded > 0 ? `+${missionCompleteData.xpAwarded} XP Naidagdag` : 'Naibigay na ang XP'}
                          </div>

                          <div className="mission-complete-actions">
                            <button type="button" className="mission-complete-btn purple" onClick={restartDemo}>
                              🔄 Maglaro Muli
                            </button>
                            <button type="button" className="mission-complete-btn" onClick={backToMissions}>
                              🎮 Misyon
                            </button>
                            <button type="button" className="mission-complete-btn light" onClick={() => go('screen-student')}>
                              🏠 Tahanan
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : isSoundAndSay ? (
                  <div className={`sound-say-game ${early ? 'early' : 'standard'} ${soundAndSayListening ? 'listening' : ''} ${soundAndSaySpeaking ? 'speaking' : ''} ${soundAndSayCorrect ? 'correct' : ''}`}>
                    <div className="sound-say-hero">
                      <div className="sound-say-mic-wrap">
                        <div className="sound-say-mic">🎙️</div>
                        <div className="sound-say-wave wave-1" />
                        <div className="sound-say-wave wave-2" />
                        <div className="sound-say-wave wave-3" />
                      </div>

                      <div className="sound-say-copy">
                        <span className="sound-say-label">{demo?.level || 'Oral Handa na'}</span>
                        <h3>Pakinggan at Bigkasin</h3>
                        <p>🔊 Pakinggan, tapos bigkasin.</p>
                      </div>
                    </div>

                    {soundAndSayToast && (
                      <div className={`sound-say-toast ${soundAndSayToast.type || 'info'}`} role="status">
                        {soundAndSayToast.message}
                      </div>
                    )}

                    <div className="sound-say-target-card">
                      <span>{early ? 'Bibigkasin:' : 'Bibigkasin:'}</span>
                      <strong>{soundAndSayTarget}</strong>
                      <p>{demo?.hint || 'Basahin nang malinaw at malakas.'}</p>
                    </div>

                    <div className="sound-say-actions">
                      <button type="button" className="sound-say-btn listen" onClick={speakSoundAndSayTarget} disabled={soundAndSaySpeaking || soundAndSayListening}>
                        {soundAndSaySpeaking ? '🔊 Pinapatugtog...' : '🔊 Pakinggan'}
                      </button>

                      <button type="button" className="sound-say-btn speak" onClick={startSoundAndSayRecognition} disabled={soundAndSayListening || soundAndSaySpeaking}>
                        {soundAndSayListening ? '🎙️ Nakikinig...' : '🎙️ Magsalita'}
                      </button>

                      <button type="button" className="sound-say-btn reset" onClick={resetSoundAndSayPractice}>
                        ↺ Ulitin
                      </button>
                    </div>

                    <div className="sound-say-result-grid">
                      <div className="sound-say-result-card">
                        <span>Narinig ko:</span>
                        <strong>{soundAndSayTranscript || '____'}</strong>
                      </div>

                      <div className="sound-say-result-card">
                        <span>Bigkas Score</span>
                        <strong>{soundAndSayScore === null ? '--' : `${soundAndSayScore}%`}</strong>
                        <div className="sound-say-meter">
                          <i style={{ width: `${Math.max(0, Math.min(100, soundAndSayScoreValue))}%` }} />
                        </div>
                        <small>Layunin: {soundAndSayThreshold}% pataas</small>
                      </div>
                    </div>

                    {soundAndSayError && (
                      <div className="sound-say-error">
                        {soundAndSayError}
                      </div>
                    )}

                    {soundAndSayCorrect && (
                      <div className="sound-say-success">
                        🌟 Mahusay! Malinaw ang iyong bigkas.
                      </div>
                    )}
                  </div>
                ) : isStoryQuest ? (
                  <div className={`story-quest-game ${early ? 'early' : 'standard'} ${storyQuestMode === 'story' ? 'reading' : 'quiz'} ${storyQuestWrongChoice ? 'wrong' : ''} ${storyQuestComplete ? 'complete' : ''}`}>
                    <div className="story-quest-book-card story-quest-book-layout">
                      <div className="story-quest-book-top">
                        <span className="story-quest-badge">Pag-unawa sa Kwento</span>
                        <span className="story-quest-pages">
                          {storyQuestMode === 'story' ? '📖 Basahin muna' : `📖 ${storyQuestSafeIndex + 1}/${storyQuestTotal}`}
                        </span>
                      </div>

                      <div className="story-quest-open-book">
                        <div className="story-quest-illustration-page" aria-label="Larawan ng kuwento">
                          <div className="story-quest-room">
                            <div className="story-quest-window" />
                            <div className="story-quest-shelf" />
                            <div className="story-quest-scene-art" aria-hidden="true">
                              {(() => {
                                const id = String(demo?.id || '');
                                if (id.includes('payong')) return '🌧️ ☂️ 👧';
                                if (id.includes('pusa')) return '🐱 🧺 👦';
                                if (id.includes('lapis')) return '✏️ 🏠 👧';
                                if (id.includes('bakuran')) return '🧹 🗑️ 🌿';
                                if (id.includes('aklatan')) return '📚 📖 👧';
                                if (id.includes('puno')) return '🌳 💧 🏫';
                                if (id.includes('bayanihan')) return '🤝 🍚 🏘️';
                                return '📖 ✨';
                              })()}
                            </div>
                          </div>
                        </div>

                        <div className="story-quest-reading-page">
                          <span className="story-quest-page-label">
                            {!early && storyQuestMode === 'story' ? `Pahina ${storyQuestSafePageIndex + 1} ng ${storyQuestPageTotal}` : 'Pahina ng Kuwento'}
                          </span>
                          <h3>{demo?.title || 'Maikling Kuwento'}</h3>

                          {storyQuestMode === 'story' && !early ? (
                            <div className="story-quest-story story-quest-flip-page" key={`story-page-${storyQuestSafePageIndex}`}>
                              <p>{storyQuestPageText}</p>
                            </div>
                          ) : (
                            <div className="story-quest-story">
                              {storyQuestStoryLines.map((line, index) => (
                                <p key={`story-line-${index}`}>{line}</p>
                              ))}
                            </div>
                          )}

                          {storyQuestMode === 'story' && !early && storyQuestPageTotal > 1 && (
                            <div className="story-quest-page-controls">
                              <button
                                type="button"
                                className="story-quest-page-btn"
                                onClick={() => setStoryQuestPageIndex(index => Math.max(0, index - 1))}
                                disabled={storyQuestSafePageIndex <= 0}
                              >
                                ← Previous
                              </button>

                              <span className="story-quest-page-count">
                                {storyQuestSafePageIndex + 1}/{storyQuestPageTotal}
                              </span>

                              <button
                                type="button"
                                className="story-quest-page-btn purple"
                                onClick={() => setStoryQuestPageIndex(index => Math.min(storyQuestPageTotal - 1, index + 1))}
                                disabled={storyQuestSafePageIndex >= storyQuestPageTotal - 1}
                              >
                                Next Page →
                              </button>
                            </div>
                          )}

                          {storyQuestMode === 'story' && storyQuestCanStartQuestions && (
                            <button
                              type="button"
                              className="story-quest-start-btn"
                              onClick={() => {
                                setStoryQuestMode('quiz');
                                setStoryQuestQuestionIndex(0);
                                setStoryQuestToast(null);
                              }}
                            >
                              📖 Simulan ang mga Tanong
                            </button>
                          )}

                          {storyQuestMode === 'story' && !storyQuestCanStartQuestions && (
                            <p className="story-quest-read-hint">Basahin muna lahat ng pahina bago sagutin ang tanong.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {storyQuestMode === 'quiz' && (
                      <>
                        <div className="story-quest-progress-card">
                          <div>
                            <span>Progreso ng Hamon</span>
                            <strong>{Math.min(storyQuestDoneCount, storyQuestTotal)}/{storyQuestTotal}</strong>
                          </div>
                          <div className="story-quest-progress-track">
                            <i style={{ width: `${storyQuestProgressPct}%` }} />
                          </div>
                        </div>

                        {storyQuestToast && (
                          <div className={`story-quest-toast ${storyQuestToast.type || 'info'}`} role="status">
                            {storyQuestToast.message}
                          </div>
                        )}

                        {!storyQuestComplete ? (
                          <div className="story-quest-question-card">
                            <div className="story-quest-question-label">Tanong {storyQuestSafeIndex + 1}</div>
                            <h4>{storyQuestQuestion?.question || 'Ano ang sagot sa kuwento?'}</h4>

                            <div className="story-quest-options" aria-label="Pag-unawa sa Kwento choices">
                              {asArray(storyQuestQuestion?.options).map((choice, index) => {
                                const label = storyQuestChoiceLabel(choice);
                                const icon = storyQuestChoiceIcon(choice);
                                const wrong = storyQuestWrongChoice.toLowerCase() === label.toLowerCase();

                                return (
                                  <button
                                    type="button"
                                    className={`story-quest-choice tone-${index % 4} ${wrong ? 'wrong' : ''}`}
                                    key={`${demo?.id || 'story-quest'}-${storyQuestSafeIndex}-${label}`}
                                    onClick={() => answerStoryQuest(choice)}
                                  >
                                    {icon && <span className="story-quest-choice-icon">{icon}</span>}
                                    <span>{label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="story-quest-complete-card">
                              <div className="story-quest-complete-icon">🌟</div>
                              <h4>Natapos mo ang kuwento!</h4>
                              <p>Mahusay! Nasagutan mo ang lahat ng tanong.</p>
                            </div>

                            {storyQuestCompleteModal && (
                              <div className="mission-complete-overlay" role="dialog" aria-modal="true" aria-label="Pag-unawa sa Kwento mission complete">
                                <div className="mission-complete-modal">
                                  <div className="mission-complete-icon">📖</div>
                                  <h3>Tapos na ang Pag-unawa sa Kwento!</h3>
                                  <p>
                                    {missionCompleteData?.message || 'Ang galing mo! Natapos mo ang Pag-unawa sa Kwento.'}
                                  </p>
                                  <div className="mission-complete-xp">
                                    ⚡ {missionCompleteData?.xpAwarded > 0 ? `+${missionCompleteData.xpAwarded} XP Naidagdag` : 'Naibigay na ang XP'}
                                  </div>

                                  <div className="mission-complete-actions">
                                    <button type="button" className="mission-complete-btn purple" onClick={restartDemo}>
                                      🔄 Maglaro Muli
                                    </button>
                                    <button type="button" className="mission-complete-btn" onClick={backToMissions}>
                                      🎮 Misyon
                                    </button>
                                    <button type="button" className="mission-complete-btn light" onClick={() => go('screen-student')}>
                                      🏠 Tahanan
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>
                ) : isSentenceBuilder ? (
                  <div className={`sentence-builder-game ${early ? 'early' : 'standard'} ${sentenceBuilderWrong ? 'wrong' : ''} ${sentenceBuilderCorrect ? 'correct' : ''}`}>
                    <div className="sentence-builder-prompt">
                      <div className="sentence-builder-mini-label">Mga Misyong Pangungusap</div>
                      <h3>Buuin ang pangungusap</h3>
                      <p>💡 {demo?.clue || 'Tapikin ang mga salita sa tamang ayos.'}</p>
                    </div>

                    {sentenceBuilderToast && (
                      <div className={`sentence-builder-toast ${sentenceBuilderToast.type || 'info'}`} role="status">
                        {sentenceBuilderToast.message}
                      </div>
                    )}

                    <div className="sentence-builder-tray" aria-label="Nabuong pangungusap">
                      {sentenceBuilderWords.map((_, index) => {
                        const selectedIndex = sentenceBuilderSelected[index];
                        const selectedWord = selectedIndex !== undefined ? sentenceBuilderWords[selectedIndex] : '';

                        return selectedWord ? (
                          <button
                            type="button"
                            className="sentence-builder-selected-word"
                            key={`selected-${index}-${selectedIndex}`}
                            onClick={() => removeSentenceBuilderWord(index)}
                          >
                            {selectedWord}
                          </button>
                        ) : (
                          <span className="sentence-builder-empty-slot" key={`slot-${index}`}>____</span>
                        );
                      })}
                    </div>

                    <div className="sentence-builder-word-bank" aria-label="Mga salita para sa Pagbuo ng Pangungusap">
                      {sentenceBuilderWords.map((word, index) => {
                        const used = sentenceBuilderSelected.includes(index);

                        return (
                          <button
                            type="button"
                            className={`sentence-builder-word-tile tone-${index % 5} ${used ? 'used' : ''}`}
                            key={`${demo?.id || 'sentence-builder'}-${word}-${index}`}
                            onClick={() => selectSentenceBuilderWord(index)}
                            disabled={used || sentenceBuilderCorrect}
                          >
                            {word}
                          </button>
                        );
                      })}
                    </div>

                    <div className="sentence-builder-actions">
                      <button type="button" className="sentence-builder-clear" onClick={clearSentenceBuilder} disabled={!sentenceBuilderSelected.length || sentenceBuilderCorrect}>
                        ↺ Burahin
                      </button>
                      <button type="button" className="sentence-builder-check" onClick={checkSentenceBuilderAnswer} disabled={!sentenceBuilderSelected.length || sentenceBuilderCorrect}>
                        ✅ Suriin ang Pangungusap
                      </button>
                    </div>

                    {sentenceBuilderCompleteModal && (
                      <div className="mission-complete-overlay" role="dialog" aria-modal="true" aria-label="Tapos na ang misyong Pagbuo ng Pangungusap">
                        <div className="mission-complete-modal">
                          <div className="mission-complete-icon">🧩</div>
                          <h3>Tapos na ang Pagbuo ng Pangungusap!</h3>
                          <p>
                            {missionCompleteData?.message || 'Ang galing mo! Nabuo mo ang tamang pangungusap.'}
                          </p>
                          <div className="mission-complete-xp">
                            ⚡ {missionCompleteData?.xpAwarded > 0 ? `+${missionCompleteData.xpAwarded} XP Naidagdag` : 'Naibigay na ang XP'}
                          </div>

                          <div className="mission-complete-actions">
                            <button type="button" className="mission-complete-btn purple" onClick={restartDemo}>
                              🔄 Maglaro Muli
                            </button>
                            <button type="button" className="mission-complete-btn" onClick={backToMissions}>
                              🎮 Misyon
                            </button>
                            <button type="button" className="mission-complete-btn light" onClick={() => go('screen-student')}>
                              🏠 Tahanan
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : isPictureGuess ? (
                  <div className={`picture-guess-game ${early ? 'early' : 'standard'}`}>
                    <div className="picture-guess-card">
                      <div className="picture-guess-label">Hamon sa Larawan</div>
                      <div className="picture-guess-image" aria-label="Palatandaan sa larawan">
                        {demo?.picture || '🖼️'}
                      </div>
                      <p>💡 {demo?.sample || 'Tingnan ang larawan at piliin ang tamang sagot.'}</p>
                    </div>

                    {pictureGuessToast && (
                      <div className={`picture-guess-toast ${pictureGuessToast.type || 'info'}`} role="status">
                        {pictureGuessToast.message}
                      </div>
                    )}

                    <div className="picture-guess-options" aria-label="Mga pagpipilian sa Hulaan ang Larawan">
                      {(demo?.options || []).map((choice, index) => {
                        const selected = missionChoice === choice;
                        const correct = choice === demo?.correct;
                        const wrong = pictureGuessWrongChoice === choice;

                        return (
                          <button
                            type="button"
                            className={`picture-guess-choice tone-${index % 4} ${selected && correct ? 'correct' : ''} ${wrong ? 'wrong' : ''}`}
                            key={`${demo?.id || 'picture-guess'}-${choice}`}
                            onClick={() => checkMissionAnswer(choice)}
                          >
                            {choice}
                          </button>
                        );
                      })}
                    </div>

                    {pictureGuessCompleteModal && (
                      <div className="mission-complete-overlay" role="dialog" aria-modal="true" aria-label="Tapos na ang misyong Hulaan ang Larawan">
                        <div className="mission-complete-modal">
                          <div className="mission-complete-icon">🖼️</div>
                          <h3>Tapos na ang Hulaan ang Larawan!</h3>
                          <p>
                            {missionCompleteData?.message || 'Ang galing mo! Natapos mo ang Hulaan ang Larawan.'}
                          </p>
                          <div className="mission-complete-xp">
                            ⚡ {missionCompleteData?.xpAwarded > 0 ? `+${missionCompleteData.xpAwarded} XP Naidagdag` : 'Naibigay na ang XP'}
                          </div>

                          <div className="mission-complete-actions">
                            <button type="button" className="mission-complete-btn purple" onClick={restartDemo}>
                              🔄 Maglaro Muli
                            </button>
                            <button type="button" className="mission-complete-btn" onClick={backToMissions}>
                              🎮 Misyon
                            </button>
                            <button type="button" className="mission-complete-btn light" onClick={() => go('screen-student')}>
                              🏠 Tahanan
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="mission-prompt-box">
                      <strong>Misyon:</strong> {demo?.prompt}
                      <br />
                      <strong>Clue:</strong> {demo?.sample}
                    </div>

                    <div className="mission-play-options" aria-label="Mga pagpipilian sa misyon">
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

                {missionResult && !isLetterPop && !isPictureGuess && (
                  <div className={`mission-result ${missionResult.includes('✅') ? 'good' : ''}`}>
                    {missionResult}
                  </div>
                )}

                <div className="mission-play-actions">
                  <button type="button" className="mission-play-action secondary" onClick={backToMissions}>
                    ← Bumalik sa mga Misyon
                  </button>
                  {!isSentenceBuilder && (
<button type="button" className="mission-play-action" onClick={restartDemo}>
                    🔄 Ulitin
                  </button>
                  )}
                  {isWordMatch ? (
                    <button type="button" className="mission-play-action purple" onClick={completeWordMatchMission} disabled={!wordMatchComplete || missionSaving}>
                      {missionSaving ? 'Itinatala...' : '✅ Tapusin ang mga Misyon'}
                    </button>
                  ) : (isLetterPop || isPictureGuess || isSentenceBuilder || isStoryQuest || isSoundAndSay) ? null : (
                    <button type="button" className="mission-play-action purple" onClick={() => openTab('lessons')}>
                      📖 Pumunta sa mga Aralin
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
              <span>{selectedGame?.title || 'Mga Misyon'}</span>
            </button>

            <div className="g12-top-actions">
              <div className="g12-pill">🌸 Baitang {student.gradeLevel || '—'} • {student.section || '—'}</div>
              <div className="g12-pill">⚡ {xp} XP</div>
              <button type="button" className="g12-action-btn" onClick={backToMissions}>🎮 Misyon</button>
            </div>
          </header>

          <main className="g12-shell g12-subpage-shell g12-mission-play-nohero">
            {content}
          </main>

          <nav className="g12-nav g12-mission-play-nav" aria-label="Student navigation">
            <button type="button" onClick={() => openTab('home')}><span className="g12-nav-icon">🏠</span>Tahanan</button>
            <button type="button" onClick={() => openTab('lessons')}><span className="g12-nav-icon">📖</span>Aralin</button>
            <button type="button" onClick={() => openTab('quizzes')}><span className="g12-nav-icon">🧠</span>Pagsusulit</button>
            <button type="button" className="active" onClick={() => openTab('missions')}><span className="g12-nav-icon">🎮</span>Misyon</button>
            <button type="button" onClick={() => openTab('groups')}><span className="g12-nav-icon">👥</span>Pangkat</button>
            <button type="button" onClick={() => openTab('badges')}><span className="g12-nav-icon">🏅</span>Gantimpala</button>
            <button type="button" onClick={() => openTab('leaderboard')}><span className="g12-nav-icon">🏆</span>Ranggo</button>
            <button type="button" onClick={() => openTab('profile')}><span className="g12-nav-icon">🐰</span>Ako</button>
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
      logout={logout}
      icon={selectedGame?.icon || '🎮'}
      title={selectedGame?.title || 'Mga Misyon'}
      subtitle={`${selectedGame?.module || 'Filipino'} misyon • +${selectedGame?.xp || 0} preview ng XP`}
      titleAction={<button type="button" className="g46-ref-soft-btn" onClick={backToMissions}>← Mga Misyon</button>}
      hideTitleCard={isLetterPop}
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

    if (!tasks.length) return 'Pindutin para magsimula';
    if (tasks.some(task => isTaskPending(task))) return 'Hinihintay ang Pagsusuri ng Guro';
    if (tasks.some(task => isTaskReturned(task))) return 'Magtanong sa guro';
    if (!leftCount) return 'Tapos na ngayong araw';
    if (leftCount === 1) return '1 misyon ang natitira';
    return `${leftCount} misyon ang natitira`;
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
      title="Mga Gawain ng Pangkat"
      subtitle="Pumili. Makipagtulungan. Tapusin."
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
            <h2 className="g12-section-title">👥 Mga Gawain ng Pangkat</h2>
            <p className="g12-section-subtitle">Pumili. Makipagtulungan. Tapusin.</p>
          </div>
        </div>

        {!groups.length ? (
          <div className="g12-empty">Wala pang gawain ng pangkat.</div>
        ) : (
          <div className="g12-team-flow-shell">
            <div className="g12-team-top-controls">
              <div className="g12-team-progress" aria-label="Mga hakbang ng gawain ng pangkat">
                <button type="button" className={flowStep === 'start' ? 'active' : ''} onClick={() => setFlowStep('start')}>Pumili</button>
                <button type="button" className={flowStep === 'role' ? 'active' : ''} disabled={!selectedGroup || selectedGroupDone} onClick={() => selectedGroup && !selectedGroupDone && setFlowStep('role')}>Tungkulin</button>
                <button type="button" className={flowStep === 'task' || flowStep === 'done' ? 'active' : ''} disabled={!selectedGroup} onClick={() => selectedGroup && setFlowStep(selectedGroupDone ? 'done' : 'task')}>Gawain</button>
              </div>

              <button
                type="button"
                className={`g12-finished-pill-btn ${flowStep === 'finished' ? 'active' : ''}`}
                onClick={() => setFlowStep('finished')}
              >
                ✅ Tapos Na {finishedGroups.length ? `(${finishedGroups.length})` : ''}
              </button>
            </div>

            {flowStep === 'finished' && (
              <div className="g12-team-flow-card">
                <div className="g12-team-flow-hero">
                  <div className="g12-team-mascot">🎉</div>
                  <div>
                    <h3>Tapos na Ngayong Araw</h3>
                    <p>{finishedGroups.length ? 'Natapos na ng inyong pangkat ang mga misyong ito.' : 'Wala pang natapos na grupo.'}</p>
                  </div>
                </div>

                {finishedGroups.length ? (
                  <div className="g12-team-select-grid">
                    {finishedGroups.map(group => (
                      <div
                        className="g12-team-select-btn finished"
                        key={group.id}
                        role="status"
                        aria-label={`${group.name} tapos na ngayong araw`}
                      >
                        <span>
                          <strong>✅ {group.name}</strong>
                          <small>Tapos na ngayong araw</small>
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="g12-mission-box" style={{ textAlign: 'center' }}>
                    <h3>Ipagpatuloy mo!</h3>
                    <p>Tapusin muna ang gawain ng pangkat.</p>
                  </div>
                )}

                <div className="g12-team-actions">
                  <button type="button" className="g12-soft-btn" onClick={() => setFlowStep('start')}>Bumalik</button>
                </div>
              </div>
            )}



            {flowStep === 'start' && (
              <div className="g12-team-flow-card">
                <div className="g12-team-flow-hero">
                  <div className="g12-team-mascot">👥</div>
                  <div>
                    <h3>{activeGroups.length ? 'Pumili ng Pangkat' : 'Tapos na ang mga gawain ngayon!'}</h3>
                    <p>{activeGroups.length ? 'Pumili ng isang pangkat upang magsimula.' : 'Pindutin ang "Tapos Na" upang makita ito.'}</p>
                  </div>
                </div>

                {!activeGroups.length && !!finishedGroups.length && (
                  <div className="g12-mission-box" style={{ textAlign: 'center' }}>
                    <h3>🎉 Ang galing mo!</h3>
                    <p>Tapos na ang gawain ng inyong pangkat.</p>
                    <div className="g12-team-actions" style={{ justifyContent: 'center' }}>
                      <button type="button" className="g12-main-btn" onClick={() => setFlowStep('finished')}>
                        Tingnan ang tapos na mga pangkat
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
                        <span>{showMoreTeams ? 'Ipakita nang mas kaunti' : `Ipakita pa ang ${hiddenActiveCount}`}</span>
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
                    <h3>Pumili ng tungkulin</h3>
                    <p>Piliin ang iyong tungkulin.</p>
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
                      <span><TuklasBadgeVisual badge={role} size={56} /></span>
                      {role.label}
                      <small>{role.helper}</small>
                    </button>
                  ))}
                </div>

                <div className="g12-team-actions">
                  <button type="button" className="g12-soft-btn" onClick={() => setFlowStep('start')}>Bumalik</button>
                </div>
              </div>
            )}

            {flowStep === 'task' && selectedGroup && (
              <div className="g12-team-flow-card">
                <div className="g12-team-flow-hero">
                  <div className="g12-team-mascot">🧩</div>
                  <div>
                    <h3>Oras ng pagtutulungan!</h3>
                    <p>Gawin ang misyon nang magkakasama.</p>
                  </div>
                </div>

                <div className="g12-mission-box">
                  {primaryTask ? (
                    <>
                      <h3>{primaryTask.title}</h3>
                      <p>{primaryTask.description || selectedGroup.description || 'Tapusin ang gawain kasama ang iyong grupo.'}</p>
                      <div className="g12-mission-chip-row">
                        {selectedRole && <span className="g12-mission-chip">Tungkulin: {selectedRole.icon} {selectedRole.label}</span>}
                        {!!primaryTask.xpReward && <span className="g12-mission-chip">+{primaryTask.xpReward} XP</span>}
                        {extraTaskCount > 0 && <span className="g12-mission-chip">{extraTaskCount} pa</span>}
                      </div>
                    </>
                  ) : (
                    <>
                      <h3>Wala pang misyon</h3>
                      <p>Maaaring magdagdag ang guro.</p>
                    </>
                  )}
                </div>

                <div className="g12-team-actions">
                  <button type="button" className="g12-soft-btn" onClick={() => setFlowStep('role')}>Bumalik</button>
                  <button
                    type="button"
                    className="g12-main-btn"
                    disabled={!primaryTask || taskRecorded}
                    onClick={() => primaryTask && markTaskDone(primaryTask.id)}
                  >
                    {isTaskPending(primaryTask)
                      ? 'Hinihintay ang Pagsusuri ng Guro'
                      : taskRecorded
                        ? 'Tapos na ang Misyon'
                        : isTaskReturned(primaryTask)
                          ? 'Magtanong sa guro'
                          : 'Tumulong ako sa aking grupo!'}
                  </button>
                </div>
              </div>
            )}

            {flowStep === 'done' && (
              <div className="g12-team-flow-card g12-team-done">
                <div className="done-icon">🎉</div>
                <h3>{selectedGroupDone ? 'Tapos na ang Misyon!' : 'Hinihintay ang Pagsusuri ng Guro'}</h3>
                <p>{selectedGroupDone ? 'Nasuri na ng guro ang misyon ng inyong pangkat.' : 'Susuriin ng guro ang inyong gawa.'}</p>
                <div className="g12-team-actions" style={{ justifyContent: 'center' }}>
                  <button type="button" className="g12-main-btn" onClick={() => setFlowStep('start')}>Balik sa mga pangkat</button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </EarlyStudentChrome>
  );
}

function StudentGroups({ data, go, completeGroupTask, logout}) {
  const early = Number(data?.student?.gradeLevel || 4) <= 2;
  const groups = (data?.groups || []).filter(group => String(group?.status || 'active').toLowerCase() !== 'archived');
  const [taskRoles, setTaskRoles] = useState({});
  const [taskFiles, setTaskFiles] = useState({});
  const [submittedTasks, setSubmittedTasks] = useState({});
  const [groupTaskFilter, setGroupTaskFilter] = useState('all');

  if (early) {
    return <EarlyGroupsScreen data={data} go={go} completeGroupTask={completeGroupTask} />;
  }

  const groupTaskFilterOptions = [
    { value: 'all', label: 'Lahat' },
    { value: 'pending', label: 'Naghihintay ng Pagsusuri' },
    { value: 'approved', label: 'Naaprubahan' },
    { value: 'returned', label: 'Ibinalik' },
    { value: 'not_submitted', label: 'Hindi Pa Naipapasa' }
  ];

  function getGroupTaskFilterStatus(task) {
    const completion = task.completion || task.completions?.[0] || null;
    const isAccepted = completion?.verificationStatus === 'approved';
    const isReturned = completion?.verificationStatus === 'returned';
    const isPending = !isReturned && (completion?.verificationStatus === 'pending' || submittedTasks[task.id]);

    if (isAccepted) return 'approved';
    if (isReturned) return 'returned';
    if (isPending) return 'pending';
    return 'not_submitted';
  }

  const visibleGroups = groups
    .map(group => ({
      ...group,
      tasks: (group.tasks || []).filter(task =>
        groupTaskFilter === 'all' || getGroupTaskFilterStatus(task) === groupTaskFilter
      )
    }))
    .filter(group => (group.tasks || []).length);

  const selectedGroupTaskFilterLabel = groupTaskFilterOptions.find(option => option.value === groupTaskFilter)?.label || 'gawain';

  async function submitGroupTask(taskId) {
    const studentRole = String(taskRoles[taskId] || 'Leader').trim();
    const file = taskFiles[taskId] || null;

    if (!studentRole) {
      window.alert('Isulat muna ang iyong tungkulin sa grupo bago ipasa.');
      return;
    }

    if (!file) {
      window.alert('I-upload muna ang file ng output ng grupo bago ipasa.');
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
      logout={logout}
      icon="👥"
      title="Pakikipagtulungan ng Grupo"
      subtitle="Ipasa ang output ng grupo at ang iyong tungkulin para masuri ng guro."
    >
      <section className="g46-ref-panel">
        <div className="g46-ref-panel-head">
          <div>
            <h2>Mga Gawain ng Pangkat</h2>
            <p className="g46-ref-muted">I-upload ang output ng grupo, idagdag ang iyong tungkulin, at hintayin ang pagsusuri ng guro.</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          {groupTaskFilterOptions.map(option => (
            <button
              key={option.value}
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setGroupTaskFilter(option.value)}
              style={{
                borderColor: groupTaskFilter === option.value ? '#009a57' : '#d9eadf',
                background: groupTaskFilter === option.value ? '#ecfdf5' : '#ffffff',
                color: groupTaskFilter === option.value ? '#00864c' : '#17324d',
                fontWeight: 950
              }}
            >
              {option.label}
            </button>
          ))}
        </div>

        {visibleGroups.map(group => (
          <div className="g46-ref-panel g46-group-card" key={group.id}>
            <div className="g46-ref-panel-head">
              <div>
                <h3>👥 {group.name}</h3>
                <p className="g46-ref-muted">{group.description || 'Pangkatang gawain sa Filipino.'}</p>
              </div>
              <span className="g46-ref-tag">{group.tasks?.length || 0} gawain</span>
            </div>

            {(group.tasks || []).map(task => {
              const completion = task.completion || task.completions?.[0] || null;
              const isAccepted = completion?.verificationStatus === 'approved';
              const isReturned = completion?.verificationStatus === 'returned';
              const isPending = !isReturned && (completion?.verificationStatus === 'pending' || submittedTasks[task.id]);
              const isLocked = isAccepted || isPending;
              const statusLabel = isAccepted ? 'Naaprubahan' : isReturned ? 'Ibinalik' : isPending ? 'Naghihintay ng Pagsusuri' : 'Hindi pa naipapasa';
              const isGroupLeader = group.currentStudentIsLeader || group.currentStudentGroupRole === 'leader';
              const submittedRole = taskRoles[task.id] || completion?.studentRole || (isGroupLeader ? 'Lider' : '');
              const submittedFileName = taskFiles[task.id]?.name || completion?.fileName || '';
              const pct = taskCompletionPercent(task, isAccepted || isPending);
              return (
                <div className="g46-ref-task-row" key={task.id} style={{ gridTemplateColumns: '58px minmax(0, 1fr)', alignItems: 'start' }}>
                  <span className="g46-ref-card-icon">{isAccepted ? '🏆' : isReturned ? '↩️' : isPending ? '⏳' : '📝'}</span>
                  <div>
                    <div className="g46-group-task-head">
                      <div>
                        <h3>{task.title}</h3>
                        <p className="g46-ref-muted">Takdang petsa: {fmtDate(task.dueAt)} • +{task.xpReward || 0} XP</p>
                      </div>
                      <span className={`g46-group-status ${isAccepted ? 'approved' : isReturned ? 'returned' : isPending ? 'pending' : 'open'}`}>
                        {statusLabel}
                      </span>
                    </div>

                    <div className="g46-ref-mini-track" style={{ marginTop: 12 }}><span style={{ width: `${pct}%` }} /></div>
                    <div className={`g46-submit-box ${isLocked ? 'submitted' : isReturned ? 'returned' : ''}`}>
                      {isReturned && (
                        <StudentGroupSubmissionReview
                          completion={completion}
                          task={task}
                          submittedRole={submittedRole}
                          submittedFileName={submittedFileName}
                          isReturned={isReturned}
                        />
                      )}

                      {!isLocked ? (
                        isGroupLeader ? (
                        <>
                          <div className="g46-submit-box-head">
                            <span className="g46-submit-icon">📤</span>
                            <div>
                              <strong>{isReturned ? 'Ipasa ang inayos na output' : 'Ipasa ang gawain dito'}</strong>
                              <p className="g46-ref-muted">
                                {isReturned
                                  ? 'Mag-upload ng inayos na output ng grupo pagkatapos basahin ang puna ng guro.'
                                  : 'Isulat ang iyong tungkulin, i-upload ang output ng grupo, at ipasa ito para masuri ng guro.'}
                              </p>
                            </div>
                          </div>

                          <div className="g46-submit-grid">
                            <label className="g46-submit-field" htmlFor={`group-role-${task.id}`}>
                              <span>Aking Tungkulin sa Grupo</span>
                              <input
                                className="input-field"
                                id={`group-role-${task.id}`}
                                placeholder="Halimbawa: Lider, Manunulat, Tagapag-ulat, Mananaliksik"
                                value={submittedRole}
                                onChange={(event) => setTaskRoles(prev => ({ ...prev, [task.id]: event.target.value }))}
                              />
                            </label>

                            <div className="g46-submit-field">
                              <span>I-upload ang Output ng Grupo</span>
                              <input
                                className="g46-file-hidden"
                                id={`group-file-${task.id}`}
                                type="file"
                                onChange={(event) => setTaskFiles(prev => ({ ...prev, [task.id]: event.target.files?.[0] || null }))}
                              />
                              <label className="g46-upload-drop" htmlFor={`group-file-${task.id}`}>
                                <span className="g46-upload-icon">📎</span>
                                <strong>{submittedFileName || 'Pindutin para mag-upload ng output ng grupo'}</strong>
                                <small>{submittedFileName ? 'Napili na ang file at handa nang ipasa' : 'PDF, larawan, dokumento, o screenshot'}</small>
                              </label>
                            </div>
                          </div>

                          <button type="button" className="g46-ref-primary-btn g46-submit-action" onClick={() => submitGroupTask(task.id)}>
                            {isReturned ? 'Ipasa Muli' : 'Ipasa ang Output ng Grupo'}
                          </button>
                        </>
                        ) : (
                          <div className="g46-member-waiting">
                            <div className="g46-submit-box-head">
                              <span className="g46-submit-icon">👥</span>
                              <div>
                                <strong>{isReturned ? 'Ang lider ng grupo ang magpapasa ng inayos na output.' : 'Ang lider ng grupo ang magpapasa ng output.'}</strong>
                                <p className="g46-ref-muted">
                                  {isReturned
                                    ? 'Basahin ang puna ng guro kasama ang grupo at hintayin ang lider na magpasa muli.'
                                    : 'Makikita mo ang gawaing ito dito. Kapag naipasa na ng lider, susuriin ito ng guro para sa buong grupo.'}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      ) : (
                        <StudentGroupSubmissionReview
                          completion={completion}
                          task={task}
                          submittedRole={submittedRole}
                          submittedFileName={submittedFileName}
                          isAccepted={isAccepted}
                          isPending={isPending}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {!(group.tasks || []).length && <div className="g46-ref-empty">Wala pang gawain para sa pangkat na ito.</div>}
          </div>
        ))}

        {groups.length > 0 && !visibleGroups.length && (
          <div className="g46-ref-empty">
            Wala pang {selectedGroupTaskFilterLabel.toLowerCase()} na gawain.
          </div>
        )}

        {!groups.length && <div className="g46-ref-empty">Wala pang gawaing pangkat.</div>}
      </section>
    </Grade46StudentChrome>
  );
}



function badgeDisplayName(badge = {}) {
  const code = normalizedBadgeGoalCode(badge.code);
  const name = String(badge.name || '').trim();

  if (code === 'writing_3' || /manunulat|writer/i.test(name)) {
    return 'Bituin sa Pagsagot';
  }

  return name;
}


function badgeDisplayDescription(badge = {}) {
  const code = normalizedBadgeGoalCode(badge.code);
  const name = String(badge.name || '').trim();

  if (code === 'writing_3' || /manunulat|writer|sagot/i.test(name)) {
    return 'Natapos ang 3 gawain.';
  }

  if (code === 'reader_3' || /mambabasa|reader/i.test(name)) {
    return 'Natapos ang 3 aralin.';
  }

  if (code === 'first_lesson') return 'Natapos ang unang aralin.';
  if (code === 'quiz_perfect') return 'Nakakuha ng perpektong iskor sa isang pagsusulit.';
  if (code === 'speech_3') return 'Natapos ang 3 pagbigkas.';
  if (code === 'group_1') return 'Natapos ang 1 aprubadong gawaing pangkat.';
  if (code === 'xp_100') return 'Umabot sa 100 XP.';
  if (code === 'level_10') return 'Umabot sa Antas 10.';

  return badge.description || 'May bago kang tagumpay!';
}

function badgeAchievementReason(badge = {}) {
  const name = String(badge.name || '').trim();
  const code = String(badge.code || '').trim();
  const normalizedCode = normalizedBadgeGoalCode(code);
  const description = String(badge.description || '').trim();
  const value = `${code} ${name}`.toLowerCase();

  if (normalizedCode === 'writing_3' || value.includes('manunulat') || value.includes('writer') || value.includes('sagot')) {
    return 'Natapos ang 3 gawain.';
  }

  if (normalizedCode === 'reader_3' || value.includes('reader') || value.includes('mambabasa')) {
    return 'Natapos ang 3 aralin.';
  }

  if (normalizedCode === 'first_lesson' || value.includes('unang hakbang')) {
    return 'Natapos ang unang aralin.';
  }

  if (normalizedCode === 'quiz_perfect' || value.includes('quiz') || value.includes('perfect') || value.includes('bayani')) {
    return 'Nakakuha ng perpektong iskor sa isang pagsusulit.';
  }

  if (normalizedCode === 'speech_3' || value.includes('speaker') || value.includes('speech') || value.includes('magsalita') || value.includes('boses')) {
    return 'Natapos ang 3 pagbigkas.';
  }

  if (normalizedCode === 'group_1' || value.includes('teamwork') || value.includes('group') || value.includes('pangkat') || value.includes('kasama') || value.includes('kaagapay')) {
    return 'Natapos ang 1 aprubadong gawaing pangkat.';
  }

  if (normalizedCode === 'xp_100' || value.includes('sipag')) {
    return 'Umabot sa 100 XP.';
  }

  if (normalizedCode === 'level_10' || value.includes('kampeon')) {
    return 'Umabot sa Antas 10.';
  }

  if (description && !/achievement|badge|reward/i.test(description)) {
    return description;
  }

  return 'Natapos mo ang isang layunin para mabuksan ang gantimpalang ito.';
}



const GRADE12_BADGE_GOALS = [
  {
    code: 'FIRST_LESSON',
    icon: '🌱',
    name: 'Unang Hakbang',
    howToUnlock: 'Tapusin ang unang aralin.'
  },
  {
    code: 'reader_3',
    icon: '📖',
    name: 'Batang Mambabasa',
    howToUnlock: 'Tapusin ang 3 aralin.'
  },
  {
    code: 'quiz_perfect',
    icon: '🧠',
    name: 'Henyo sa Pagsusulit',
    howToUnlock: 'Makakuha ng perpektong iskor sa isang pagsusulit.'
  },
  {
    code: 'writing_3',
    icon: '✍️',
    name: 'Bituin sa Pagsagot',
    howToUnlock: 'Makatapos ng 3 gawain.'
  },
  {
    code: 'speech_3',
    icon: '🎤',
    name: 'Boses Bituin',
    howToUnlock: 'Magsumite ng 3 pagbigkas.'
  },
  {
    code: 'group_1',
    icon: '🤝',
    name: 'Kaagapay sa Gawain',
    howToUnlock: 'Tapusin ang 1 aprubadong gawaing pangkat.'
  },
  {
    code: 'xp_100',
    icon: '⭐',
    name: 'Bituin ng Kasipagan',
    howToUnlock: 'Umabot sa 100 XP.'
  },
  {
    code: 'level_10',
    icon: '🏆',
    name: 'Tuklas Kampeon',
    howToUnlock: 'Umabot sa Antas 10.'
  }
];

const BADGE_CODE_ALIASES = {
  first_lesson: 'first_lesson',
  firstlesson: 'first_lesson',
  reader: 'reader_3',
  reader_3: 'reader_3',
  writer: 'writing_3',
  writing_3: 'writing_3',
  speaker: 'speech_3',
  speech_3: 'speech_3',
  teamwork: 'group_1',
  group_1: 'group_1',
  quiz_perfect: 'quiz_perfect',
  xp_100: 'xp_100',
  level_10: 'level_10'
};

function normalizedBadgeGoalCode(code = '') {
  const raw = String(code || '').trim().toLowerCase();
  return BADGE_CODE_ALIASES[raw] || raw;
}


function uniqueBadgesForDisplay(badges = []) {
  const list = Array.isArray(badges) ? badges.filter(Boolean) : [];
  const grouped = new Map();

  list.forEach((badge, index) => {
    const rawCode = String(badge.code || '').trim().toLowerCase();
    const code = normalizedBadgeGoalCode(rawCode);
    const name = String(badge.name || '').trim().toLowerCase();
    const key = code || name || `badge-${index}`;
    const current = grouped.get(key);

    if (!current) {
      grouped.set(key, badge);
      return;
    }

    const currentRawCode = String(current.code || '').trim().toLowerCase();
    const currentCode = normalizedBadgeGoalCode(currentRawCode);
    const currentIsCanonical = currentRawCode && currentRawCode === currentCode;
    const badgeIsCanonical = rawCode && rawCode === code;

    if (!currentIsCanonical && badgeIsCanonical) {
      grouped.set(key, badge);
    }
  });

  return Array.from(grouped.values());
}

function badgeGoalIsUnlocked(goal, badges = []) {
  const goalCode = normalizedBadgeGoalCode(goal.code);
  const goalName = String(goal.name || '').trim().toLowerCase();

  return badges.some(badge => {
    const badgeCode = normalizedBadgeGoalCode(badge.code);
    const badgeName = String(badge.name || '').trim().toLowerCase();

    if (badgeCode && goalCode && badgeCode === goalCode) return true;
    if (badgeName && goalName && badgeName === goalName) return true;

    return false;
  });
}

function grade12BadgeGoalsWithStatus(badges = []) {
  return GRADE12_BADGE_GOALS.map(goal => ({
    ...goal,
    unlocked: badgeGoalIsUnlocked(goal, badges)
  }));
}

function EarlyBadgesScreen({ data, go }) {
  const rawBadges = data?.badges || [];
  const badges = uniqueBadgesForDisplay(rawBadges);
  const s = data?.student || {};
  const badgeGoals = grade12BadgeGoalsWithStatus(badges);
  const lockedBadgeGoals = badgeGoals.filter(goal => !goal.unlocked);

  return (
    <EarlyStudentChrome
      data={data}
      activeTab="badges"
      go={go}
      icon="🏅"
      title="Mga Gantimpala"
      subtitle="Makikita dito ang mga gantimpala na nakuha mo sa mga aralin at gawain."
    >
      <section className="g12-section-card">
        <div className="g12-section-head">
          <div>
            <h2 className="g12-section-title">🌟 Mga Tagumpay</h2>
            <p className="g12-section-subtitle">
              {badges.length} {badges.length === 1 ? 'gantimpala ang nabuksan' : 'mga gantimpala ang nabuksan'} • {lockedBadgeGoals.length} bubuksan • {s.xp || 0} XP
            </p>
          </div>
        </div>

        <div className="g12-badge-subsection">
          <div className="g12-badge-subsection-head">
            <span>🏆</span>
            <div>
              <strong>Nabuksang Gantimpala</strong>
              <p>Ito ang mga gantimpalang nakuha mo na.</p>
            </div>
          </div>

          {badges.length ? (
            <div className="g12-badge-grid">
              {badges.map((badge, badgeIndex) => (
                <div
                  className="g12-badge-card g12-badge-card-animated"
                  key={badge.id || badge.code || badge.name || badgeIndex}
                  style={{ animationDelay: `${badgeIndex * 80}ms` }}
                >
                  <div>
                    <div className="g12-badge-big"><TuklasBadgeVisual badge={badge} size={72} /></div>
                    <strong>{badgeDisplayName(badge) || 'Gantimpala'}</strong>
                    <p className="g12-badge-reason">✨ {badgeAchievementReason(badge)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="g12-empty">Wala pang gantimpala. Tapusin ang mga aralin para makakuha!</div>
          )}
        </div>

        <div className="g12-badge-subsection g12-locked-badge-section">
          <div className="g12-badge-subsection-head">
            <span>🔒</span>
            <div>
              <strong>Susunod na mga Gantimpalang Bubuksan</strong>
              <p>Tapusin ang mga layuning ito para makakuha pa ng gantimpala.</p>
            </div>
          </div>

          {lockedBadgeGoals.length ? (
            <div className="g12-badge-grid g12-locked-badge-grid">
              {lockedBadgeGoals.map((goal, goalIndex) => (
                <div
                  className="g12-badge-card g12-badge-card-locked"
                  key={goal.code || goal.name}
                  style={{ animationDelay: `${goalIndex * 70}ms` }}
                >
                  <div>
                    <div className="g12-badge-big g12-badge-big-locked"><TuklasBadgeVisual badge={goal} size={72} /></div>
                    <strong>{goal.name || 'Gantimpalang Hindi Pa Bukas'}</strong>
                    <p className="g12-badge-reason"><span>Layunin</span>{' '}{goal.howToUnlock}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="g12-empty">Ang galing! Nakuha mo na ang lahat ng available na gantimpala.</div>
          )}
        </div>

      </section>
    </EarlyStudentChrome>
  );
}

function StudentBadges({ data, go, logout}) {
  const early = Number(data?.student?.gradeLevel || 4) <= 2;

  if (early) {
    return <EarlyBadgesScreen data={data} go={go} />;
  }

  const badges = data?.badges || [];
  const g46BadgeGoals = grade12BadgeGoalsWithStatus(badges);
  const g46LockedBadgeGoals = g46BadgeGoals.filter(goal => !goal.unlocked);

  return (
    <Grade46StudentChrome
      data={data}
      activeTab="badges"
      go={go}
      logout={logout}
      icon="🏅"
      title="Mga Gantimpala"
      subtitle="Mga gantimpala at tagumpay mula sa mga aralin, misyon, at gawain."
    >
      <section className="g46-ref-panel">
        <div className="g46-ref-panel-head">
          <div>
            <h2>Mga Tagumpay</h2>
            <p className="g46-ref-muted">
              {badges.length} {badges.length === 1 ? 'gantimpala ang nabuksan' : 'mga gantimpala ang nabuksan'} • {g46LockedBadgeGoals.length} bubuksan • {data?.student?.xp || 0} XP
            </p>
          </div>
        </div>

        <div className="g46-badge-subsection">
          <div className="g46-badge-subsection-head">
            <span>🏆</span>
            <div>
              <strong>Nabuksang Gantimpala</strong>
              <p className="g46-ref-muted">Mga tagumpay na nakuha mo mula sa mga aralin, pagsusulit, misyon, at gawain.</p>
            </div>
          </div>

          {badges.length ? (
            <div className="g46-ref-badge-grid">
              {badges.map((badge, badgeIndex) => (
                <div
                  className="g46-ref-badge g46-ref-badge-animated"
                  key={badge.id || badge.code || badge.name || badgeIndex}
                  style={{ animationDelay: `${badgeIndex * 70}ms` }}
                >
                  <div>
                    <span><TuklasBadgeVisual badge={badge} size={56} /></span>
                    <strong>{badgeDisplayName(badge) || 'Gantimpala'}</strong>
                    <p className="g46-badge-reason">{badgeAchievementReason(badge)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="g46-ref-empty">Wala pang gantimpala. Tapusin ang mga aralin para makakuha!</div>
          )}
        </div>

        <div className="g46-badge-subsection g46-locked-badge-section">
          <div className="g46-badge-subsection-head">
            <span>🔒</span>
            <div>
              <strong>Susunod na mga Gantimpalang Bubuksan</strong>
              <p className="g46-ref-muted">Gamitin ang mga layuning ito bilang susunod mong target sa pag-aaral.</p>
            </div>
          </div>

          {g46LockedBadgeGoals.length ? (
            <div className="g46-ref-badge-grid g46-locked-badge-grid">
              {g46LockedBadgeGoals.map((goal, goalIndex) => (
                <div
                  className="g46-ref-badge g46-ref-badge-locked"
                  key={goal.code || goal.name}
                  style={{ animationDelay: `${goalIndex * 70}ms` }}
                >
                  <div>
                    <span><TuklasBadgeVisual badge={goal} size={56} /></span>
                    <strong>{goal.name || 'Gantimpalang Hindi Pa Bukas'}</strong>
                    <p className="g46-badge-reason g46-locked-goal-text"><span>Layunin</span>{' '}{goal.howToUnlock}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="g46-ref-empty">Ang galing! Nakuha mo na ang lahat ng available na gantimpala.</div>
          )}
        </div>

      </section>
    </Grade46StudentChrome>
  );
}



function getXpIcon(log) {
  if (log.sourceType === 'lesson') return '📚';
  if (log.sourceType === 'quiz') return '📝';
  if (log.sourceType === 'mcq') return '🧠';
  if (log.sourceType === 'writing') return '✍️';
  if (log.sourceType === 'speech') return '🎤';
  if (log.sourceType === 'mission') return '🚀';
  return '⭐';
}

function formatXpLogDate(log) {
  const raw = log.createdAt || log.created_at || log.awardedAt || log.awarded_at;
  if (!raw) return '';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-PH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function EarlyProfileScreen({ data, selectedAvatar, updateAvatar, go }) {
  const s = data?.student || {};

  return (
    <EarlyStudentChrome
      data={data}
      activeTab="profile"
      go={go}
      icon="🐰"
      title="Aking Tala"
      subtitle="Piliin ang avatar mo at tingnan ang buod ng pag-aaral."
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
            <h2 className="g12-section-title">📊 Buod</h2>
            <p className="g12-section-subtitle">Pangunahing impormasyon sa iyong talaan at pag-unlad.</p>
          </div>
        </div>

        <div className="g12-summary-grid">
          <div className="g12-summary-box"><span>👤</span><div><b>{s.name || '—'}</b><small>Pangalan</small></div></div>
          <div className="g12-summary-box"><span>🎒</span><div><b>Baitang {s.gradeLevel || '—'}</b><small>Baitang</small></div></div>
          <div className="g12-summary-box"><span>🌸</span><div><b>{s.section || '—'}</b><small>Seksyon</small></div></div>
          <div className="g12-summary-box"><span>⚡</span><div><b>{s.xp || 0} XP</b><small>XP</small></div></div>
        </div>
      </section>

      <section className="g12-section-card">
        <div className="g12-section-head">
          <div>
            <h2 className="g12-section-title">⭐ XP History</h2>
            <p className="g12-section-subtitle">Lahat ng XP na iyong natanggap.</p>
          </div>
        </div>

        {(data?.xpLogs || []).length ? (
          <div style={{ display: 'grid', gap: 10 }}>
            {(data.xpLogs || []).map((log, index) => (
              <div
                key={log.id || index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  background: '#FFFFFF',
                  borderRadius: 18,
                  padding: '18px 20px',
                  borderLeft: '5px solid #22C55E',
                  boxShadow: '0 2px 8px rgba(34,197,94,0.08)',
                  marginBottom: 2,
                }}
              >
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: '50%',
                    background: '#DCFCE7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 26,
                    flexShrink: 0,
                  }}
                >
                  {getXpIcon(log)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 900, color: '#16A34A', fontSize: 20 }}>
                    +{log.points} XP
                  </div>
                  <div style={{ color: '#334155', fontSize: 15, marginTop: 4, fontWeight: 600 }}>
                    {log.note || 'Nakuhang XP'}
                  </div>
                  {formatXpLogDate(log) && (
                    <div style={{ color: '#94A3B8', fontSize: 13, marginTop: 4 }}>
                      🕒 {formatXpLogDate(log)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="g12-section-subtitle">
            Kumpletuhin ang mga aralin, pagsusulit, at misyon para makakuha ng XP.
          </p>
        )}
      </section>
    </EarlyStudentChrome>
  );
}


function StudentLeaderboard({ data, go, logout }) {
  const [leaderboard, setLeaderboard] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const currentStudentId = data?.student?.id;

    const currentStudentGradeLevel = Number(data?.student?.gradeLevel || data?.student?.grade_level || 4);
    const currentStudentSection = String(data?.student?.section || '').trim();
    const normalizedStudentSection = currentStudentSection.toLowerCase();
    const early = currentStudentGradeLevel <= 2;

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    api('/leaderboard')
      .then(res => { if (!active) return; setLeaderboard(res.leaderboard || []); })
      .catch(err => { if (!active) return; setError(err.message || 'Hindi ma-load ang talaan ng ranggo.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const visibleLeaderboard = React.useMemo(() => {
      const rows = Array.isArray(leaderboard) ? leaderboard : [];

      return rows
        .filter((player) => {
          const playerGradeLevel = Number(player?.gradeLevel || player?.grade_level || 0);
          const playerSection = String(player?.section || '').trim().toLowerCase();

          if (currentStudentGradeLevel && playerGradeLevel && playerGradeLevel !== currentStudentGradeLevel) {
            return false;
          }

          if (normalizedStudentSection && playerSection && playerSection !== normalizedStudentSection) {
            return false;
          }

          return true;
        })
        .map((player, index) => ({
          ...player,
          originalRank: player.originalRank || player.rank,
          rank: index + 1,
        }));
    }, [leaderboard, currentStudentGradeLevel, normalizedStudentSection]);

    const top3 = visibleLeaderboard.slice(0, 3);
    const rest = visibleLeaderboard.slice(3);
    const ChromeComponent = early ? EarlyStudentChrome : Grade46StudentChrome;

  return (
    <ChromeComponent data={data} activeTab="leaderboard" go={go} logout={logout} icon="🏆" title="Talaan ng Ranggo" subtitle="Tingnan ang ranggo ng mga mag-aaral batay sa XP.">
      <style>{`
        @keyframes lb-in { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:translateY(0); } }
        .lb-a { opacity:0; animation:lb-in 0.42s cubic-bezier(.22,1,.36,1) forwards; }
        .lb-pod { display:flex; flex-direction:column; align-items:center; transition:transform .18s; cursor:default; }
        .lb-pod:hover { transform:translateY(-5px); }
        .lb-row { transition:all .15s cubic-bezier(.22,1,.36,1); cursor:default; }
        .lb-row:hover { background:#F0FDF4!important; transform:translateX(4px); box-shadow:0 4px 18px rgba(34,197,94,.13)!important; }
      `}</style>

      {loading && <div style={{textAlign:'center',padding:'60px 0',color:'#64748B',fontSize:18,fontWeight:800}}>🏆 Ina-load ang talaan ng ranggo...</div>}
      {error && <div style={{textAlign:'center',padding:'40px 0',color:'#EF4444',fontWeight:700}}>{error}</div>}

      {!loading && !error && (
        <>
          {top3.length > 0 && (
            <div style={{display:'flex',justifyContent:'center',alignItems:'flex-end',gap:16,padding:'32px 16px 0',background:'linear-gradient(160deg,#ECFDF5,#F0FFF4)',borderRadius:24,marginBottom:24,boxShadow:'0 2px 16px rgba(34,197,94,.08)'}}>
              {[top3[1], top3[0], top3[2]].map((player, col) => {
                if (!player) return <div key={col} style={{width:110}} />;
                const isMe = String(player.id) === String(currentStudentId);
                const cfgs = {
                  1: {medal:'🥇', bg:'linear-gradient(135deg,#FEF3C7,#FDE68A)', border:'#F59E0B', h:100, av:46, crown:true},
                  2: {medal:'🥈', bg:'linear-gradient(135deg,#F1F5F9,#E2E8F0)', border:'#94A3B8', h:70, av:38, crown:false},
                  3: {medal:'🥉', bg:'linear-gradient(135deg,#FEF0E7,#FDE3C8)', border:'#F97316', h:55, av:36, crown:false},
                };
                const c = cfgs[player.rank];
                const delay = col===1?'0.04s':col===0?'0.12s':'0.20s';
                return (
                  <div key={player.id} className="lb-pod lb-a" style={{animationDelay:delay,width:player.rank===1?160:140}}>
                    {c.crown && <div style={{background:'#FBBF24',borderRadius:'50%',width:36,height:36,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,marginBottom:6,boxShadow:'0 2px 8px rgba(251,191,36,.4)'}}>👑</div>}
                    <div style={{fontSize:c.av+12,marginBottom:8}}>{player.avatar||'🦊'}</div>
                    <div style={{fontWeight:900,fontSize:player.rank===1?18:16,color:isMe?'#16A34A':'#0F172A',textAlign:'center',marginBottom:4}}>{player.name.split(' ')[0]}</div>
                    <div style={{fontSize:15,color:'#16A34A',fontWeight:800,marginBottom:10}}>⚡ {player.xp} XP</div>
                    <div style={{background:c.bg,borderRadius:'14px 14px 0 0',height:c.h+20,width:'100%',display:'flex',alignItems:'center',justifyContent:'center',border:`2px solid ${c.border}`,borderBottom:'none',fontSize:player.rank===1?44:34}}>{c.medal}</div>
                  </div>
                );
              })}
            </div>
          )}

          {rest.length > 0 && (
            <div style={{display:'grid',gap:10}}>
              {rest.map((player, i) => {
                const isMe = String(player.id) === String(currentStudentId);
                return (
                  <div key={player.id} className="lb-row lb-a" style={{animationDelay:`${0.28+i*0.05}s`,display:'flex',alignItems:'center',gap:16,background:isMe?'#F0FDF4':'#FFFFFF',borderRadius:20,padding:'18px 22px',border:isMe?'2px solid #22C55E':'1.5px solid #E2E8F0',boxShadow:isMe?'0 2px 12px rgba(34,197,94,.12)':'0 1px 4px rgba(0,0,0,.04)'}}>
                    <div style={{width:48,height:48,borderRadius:'50%',background:'#F1F5F9',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:17,color:'#64748B',flexShrink:0}}>#{player.rank}</div>
                    <div style={{fontSize:30,flexShrink:0}}>{player.avatar||'🦊'}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:900,fontSize:16,color:isMe?'#16A34A':'#0F172A'}}>
                        {player.name}
                        {isMe && <span style={{marginLeft:8,fontSize:11,background:'#DCFCE7',color:'#16A34A',borderRadius:999,padding:'2px 8px',fontWeight:800}}>Ikaw</span>}
                      </div>
                      <div style={{color:'#94A3B8',fontSize:13,marginTop:2,fontWeight:700}}>Baitang {player.gradeLevel}{player.section ? ` - ${player.section}` : ''}</div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      <div style={{fontWeight:900,color:'#16A34A',fontSize:16}}>⚡ {player.xp}</div>
                      {player.currentStreak > 0 && <div style={{color:'#EA580C',fontWeight:800,fontSize:13,marginTop:2}}>🔥 {player.currentStreak}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {visibleLeaderboard.length === 0 && (
            <div style={{textAlign:'center',padding:'60px 0',color:'#64748B'}}>
              <div style={{fontSize:48,marginBottom:12}}>🏆</div>
              <div style={{fontWeight:900,fontSize:18}}>Walang data pa.</div>
              <div style={{marginTop:6,fontSize:14}}>Kumpletuhin ang mga aralin para makita ang talaan ng ranggo.</div>
            </div>
          )}
        </>
      )}
    </ChromeComponent>
  );
}

function StudentProfile({ data, selectedAvatar, updateAvatar, go, logout}) {
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
      logout={logout}
      icon="👤"
      title="Aking Tala"
      subtitle="Piliin ang avatar mo at tingnan ang buod ng pag-aaral."
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
            <h2>Buod</h2>
            <p className="g46-ref-muted">Pangunahing impormasyon sa iyong talaan at pag-unlad.</p>
          </div>
        </div>

        <div className="g46-ref-card-grid">
          <div className="g46-ref-card green"><span className="g46-ref-card-icon">👤</span><h4>{s.name || '—'}</h4><p>Pangalan</p></div>
          <div className="g46-ref-card yellow"><span className="g46-ref-card-icon">🎒</span><h4>Baitang {s.gradeLevel || '—'}</h4><p>Baitang</p></div>
          <div className="g46-ref-card blue"><span className="g46-ref-card-icon">🌸</span><h4>{s.section || '—'}</h4><p>Seksyon</p></div>
          <div className="g46-ref-card purple"><span className="g46-ref-card-icon">⚡</span><h4>{s.xp || 0} XP</h4><p>XP</p></div>
        </div>
      </section>

      <section className="g46-ref-panel">
        <div className="g46-ref-panel-head">
          <div>
            <h2>⭐ XP History</h2>
            <p className="g46-ref-muted">Lahat ng XP na iyong natanggap.</p>
          </div>
        </div>

        {(data?.xpLogs || []).length ? (
          <div style={{ display: 'grid', gap: 10 }}>
            {(data.xpLogs || []).map((log, index) => (
              <div
                key={log.id || index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  background: '#FFFFFF',
                  borderRadius: 18,
                  padding: '18px 20px',
                  borderLeft: '5px solid #22C55E',
                  boxShadow: '0 2px 8px rgba(34,197,94,0.08)',
                  marginBottom: 2,
                }}
              >
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: '50%',
                    background: '#DCFCE7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 26,
                    flexShrink: 0,
                  }}
                >
                  {getXpIcon(log)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 900, color: '#16A34A', fontSize: 20 }}>
                    +{log.points} XP
                  </div>
                  <div style={{ color: '#334155', fontSize: 15, marginTop: 4, fontWeight: 600 }}>
                    {log.note || 'Nakuhang XP'}
                  </div>
                  {formatXpLogDate(log) && (
                    <div style={{ color: '#94A3B8', fontSize: 13, marginTop: 4 }}>
                      🕒 {formatXpLogDate(log)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="g46-ref-muted">
            Kumpletuhin ang mga aralin, pagsusulit, at misyon para makakuha ng XP.
          </p>
        )}
      </section>
    </Grade46StudentChrome>
  );
}