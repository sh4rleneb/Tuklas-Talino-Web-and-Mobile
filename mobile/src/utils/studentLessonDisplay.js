export function studentLessonDateValue(lesson = {}) {
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

  if (Number.isFinite(time)) {
    return time;
  }

  const numericId = Number(lesson.id || 0);

  return Number.isFinite(numericId) ? numericId : 0;
}

export function sortStudentLessonsForDashboard(
  rawLessons = []
) {
  return (Array.isArray(rawLessons) ? rawLessons : [])
    .filter(Boolean)
    .slice()
    .sort((first, second) => {
      const dateDifference =
        studentLessonDateValue(second) -
        studentLessonDateValue(first);

      if (dateDifference) {
        return dateDifference;
      }

      return (
        Number(second.id || 0) -
        Number(first.id || 0)
      );
    });
}

export function cleanStudentLessonTitle(
  value,
  fallback = 'Aralin'
) {
  return String(value ?? fallback)
    .trim()
    .replace(
      /^\s*(?:quizzes?|pagsusulit)\s+sa\s+/i,
      ''
    )
    .replace(
      /^\s*(?:lessons?|aralin)\s*(?:\d+)?\s*[:\-–—]\s*/i,
      ''
    )
    .replace(
      /^\s*bokabularyo\s*[1-6]\s*:\s*/i,
      ''
    )
    .replace(/\s*(?:quiz|lesson)\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim() || fallback;
}

export function formatStudentSubjectDisplay(
  value,
  fallback = 'Filipino'
) {
  const source = String(value || '').trim();
  const key = source.toLowerCase();

  if (
    key === 'oral comm' ||
    key === 'oral communication' ||
    key === 'pagsasalita' ||
    key === 'komunikasyong pagsasalita'
  ) {
    return 'Komunikasyong Pagsasalita';
  }

  const translations = {
    reading: 'Pagbasa',
    pagbasa: 'Pagbasa',
    vocabulary: 'Bokabularyo',
    bokabularyo: 'Bokabularyo',
    literature: 'Panitikan',
    panitikan: 'Panitikan',
    writing: 'Pagsulat',
    pagsulat: 'Pagsulat',
    general: 'Pangkalahatan',
    pangkalahatan: 'Pangkalahatan',
    filipino: 'Filipino',
  };

  return translations[key] || source || fallback;
}
