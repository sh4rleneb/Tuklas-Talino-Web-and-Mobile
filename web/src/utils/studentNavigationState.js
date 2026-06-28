const STUDENT_NAVIGATION_STORAGE_KEY = 'tuklas_student_navigation_state_v1';

const RESTORABLE_STUDENT_SCREENS = new Set([
  'screen-student',
  'screen-lessons',
  'screen-lesson',
  'screen-stu-quizzes',
  'screen-stu-quiz-play',
  'screen-stu-quiz-result',
  'screen-stu-missions',
  'screen-stu-mission-play',
  'screen-stu-groups',
  'screen-stu-badges',
  'screen-stu-profile'
]);

function hasBrowserSessionStorage() {
  return typeof window !== 'undefined' && Boolean(window.sessionStorage);
}

export function isRestorableStudentScreen(screen) {
  return RESTORABLE_STUDENT_SCREENS.has(String(screen || ''));
}

export function readStudentNavigationState() {
  if (!hasBrowserSessionStorage()) return null;

  try {
    const raw = window.sessionStorage.getItem(STUDENT_NAVIGATION_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== 'object') return null;
    if (!isRestorableStudentScreen(parsed.screen)) return null;

    return {
      screen: parsed.screen,
      selectedLessonId: parsed.selectedLessonId || null,
      selectedQuizId: parsed.selectedQuizId || null,
      selectedMissionGameId: parsed.selectedMissionGameId || null,
      selectedGroupId: parsed.selectedGroupId || null,
      groupFlowStep: parsed.groupFlowStep || null,
      subjectFilter: parsed.subjectFilter || 'ALL',
      updatedAt: parsed.updatedAt || null
    };
  } catch {
    clearStudentNavigationState();
    return null;
  }
}

export function saveStudentNavigationState(update = {}) {
  if (!hasBrowserSessionStorage()) return;

  const previous = readStudentNavigationState() || {};
  const next = {
    ...previous,
    ...update,
    updatedAt: Date.now()
  };

  if (!isRestorableStudentScreen(next.screen)) return;

  try {
    window.sessionStorage.setItem(STUDENT_NAVIGATION_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage failures; navigation still works for the current session.
  }
}

export function clearStudentNavigationState() {
  if (!hasBrowserSessionStorage()) return;

  try {
    window.sessionStorage.removeItem(STUDENT_NAVIGATION_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}
